"use client";

// DGN Diagnósticos — Form real (Entrega 1).
//
// Diferente do DiagnosticForm.tsx (mock/Fase 0.5), este componente:
//   * Recebe `detail` já hidratado pelo server (getDiagnosticDetail via GET /[id]).
//   * Autosave PATCH com header `X-Expected-Revision: <int>` (sem aspas).
//     NÃO usar If-Match/ETag — Vercel intercepta If-Match quoted como ETag
//     validation e devolve 412 antes do handler. Ver
//     [[vercel-ifmatch-intercepta-patch]].
//   * localStorage vira BUFFER de segurança (por diagnostic_id), sobrescrito
//     ao carregar do server se o server for mais novo. Se o revision do
//     server E do local baterem, o local prevalece (recuperar edição não
//     ainda persistida).
//   * Trata 409 CONFLICT_REVISION_STALE → para autosave, exibe banner,
//     oferece recarregar a versão do server.
//   * Estados de UX: SALVANDO / SALVO / ERRO / CONFLITO.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Camera, Check, Copy, Eye, Loader2, Lock, RefreshCw, Save, ShieldAlert, Trash2, X } from "lucide-react";
import {
  BUFFER_KEY_PREFIX,
  clearRecovery,
  createLocalRecoveryStore,
  ingestBufferOnLoad,
  type RecoveryEnvelope,
} from "@/lib/growth/diagnostics/recovery-storage";
import {
  DGN_SCORE_CRITERIA,
  INSPECTION_AREAS,
  INSPECTION_CONDITION_OPTIONS,
  DGN_SCORE_MIN,
  DGN_SCORE_MAX,
  DGN_SCORE_STEP,
  type InspectionCondition,
} from "@/lib/growth/diagnostics/catalog";
import {
  computeDgnAverage,
  countEvaluatedCriteria,
  describeAverageForCustomer,
  isPartialDiagnostic,
} from "@/lib/growth/diagnostics/computations";

// Shape que vem do endpoint GET (não é o DiagnosticDraft do mock)
export interface DiagnosticServerDetail {
  id: string;
  customer: { id: string; name: string; phone_masked?: string };
  vehicle: { id: string; brand: string; model: string; plate: string };
  status: string;
  revision: number;
  catalog_version: string;
  performed_by: string;
  performed_at: string | null;
  inspection_areas: Array<{
    area_key: string;
    condition: InspectionCondition;
    internal_notes: string;
    public_notes: string;
    public_visible: boolean;
  }>;
  scores: Array<{ criterion_key: string; score: number | null }>;
  recommendations: Array<{ service_key: string; catalog_version: string; priority: string; reason: string }>;
  investment_items: Array<{
    service_key: string;
    catalog_version: string;
    catalog_reference_price_cents: number;
    base_price_cents: number;
    discount_percent: number;
    installments: number | null;
    pix_eligible: boolean;
    note: string;
    override_reason: string | null;
  }>;
  summary: string;
  updated_at: string;
  photos: DiagnosticServerPhoto[];
}

export interface DiagnosticServerPhoto {
  id: string;
  kind: "inspection" | "hero" | "reference";
  areaKey: string | null;
  caption: string | null;
  ordering: number;
  internalOnly: boolean;
  storagePath: string;
  signedUrl?: string;
  signedUrlExpiresAt?: string;
}

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "error"; message: string }
  | { kind: "conflict"; currentRevision: number };

const AUTOSAVE_DEBOUNCE_MS = 3000;

export function DiagnosticFormServer({ initial }: { initial: DiagnosticServerDetail }) {
  const [detail, setDetail] = useState<DiagnosticServerDetail>(initial);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [recovery, setRecovery] = useState<RecoveryEnvelope<DiagnosticServerDetail> | null>(null);
  const [showingRecoveryModal, setShowingRecoveryModal] = useState(false);
  const storeRef = useRef(createLocalRecoveryStore());

  // Rehidrata buffer via helper puro:
  //   * mesma revision → aplica em memória
  //   * revision divergente → move pra recovery e mostra banner
  //   * sem buffer → nada
  useEffect(() => {
    const outcome = ingestBufferOnLoad<DiagnosticServerDetail>(
      storeRef.current, initial.id, initial.revision,
    );
    if (outcome.recovery) setRecovery(outcome.recovery);
    if (outcome.bufferApplied) {
      const bufferKey = BUFFER_KEY_PREFIX + initial.id;
      try {
        const raw = typeof window !== "undefined" && window.localStorage
          ? window.localStorage.getItem(bufferKey) : null;
        if (raw) {
          const parsed = JSON.parse(raw) as { rev: number; snapshot: DiagnosticServerDetail };
          if (parsed.rev === initial.revision) setDetail(parsed.snapshot);
        }
      } catch { /* ignore */ }
    }
  }, [initial.id, initial.revision]);

  const debounceRef = useRef<number | null>(null);
  const inflightRef = useRef<AbortController | null>(null);

  const clearDebounce = () => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  };

  const persistToBuffer = useCallback((next: DiagnosticServerDetail) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        BUFFER_KEY_PREFIX + next.id,
        JSON.stringify({ rev: next.revision, snapshot: next }),
      );
    } catch { /* quota */ }
  }, []);

  const doPatch = useCallback(
    async (snapshot: DiagnosticServerDetail) => {
      if (saveState.kind === "conflict") return; // trava enquanto não recarregar
      inflightRef.current?.abort();
      const controller = new AbortController();
      inflightRef.current = controller;
      setSaveState({ kind: "saving" });
      try {
        const patchBody = {
          summary: snapshot.summary,
          performed_by: snapshot.performed_by,
          performed_at: snapshot.performed_at,
          inspection_areas: snapshot.inspection_areas,
          scores: snapshot.scores,
          recommendations: snapshot.recommendations,
          investment_items: snapshot.investment_items,
        };
        const res = await fetch(`/api/admin/growth/diagnostics/${encodeURIComponent(snapshot.id)}`, {
          method: "PATCH",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "X-Expected-Revision": String(snapshot.revision),
          },
          body: JSON.stringify(patchBody),
          signal: controller.signal,
        });
        if (res.status === 409) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: { code?: string; details?: { current_revision?: number } };
          };
          if (body.error?.code === "CONFLICT_REVISION_STALE") {
            setSaveState({
              kind: "conflict",
              currentRevision: body.error.details?.current_revision ?? snapshot.revision,
            });
            return;
          }
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
        }
        const parsed = (await res.json()) as { revision: number; status: string };
        setDetail((prev) => (prev.id === snapshot.id
          ? { ...prev, revision: parsed.revision, status: parsed.status }
          : prev));
        persistToBuffer({ ...snapshot, revision: parsed.revision, status: parsed.status });
        setSaveState({ kind: "saved", at: new Date().toISOString() });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setSaveState({
          kind: "error",
          message: err instanceof Error ? err.message : "Erro desconhecido ao salvar.",
        });
      }
    },
    [persistToBuffer, saveState.kind],
  );

  const scheduleAutosave = useCallback(
    (next: DiagnosticServerDetail) => {
      persistToBuffer(next);
      clearDebounce();
      // Recovery pendente → autosave PAUSADO até o operador decidir. Isso
      // impede que uma edição stale sobrescreva o server. O buffer segue
      // sendo escrito (proteção contra fechar aba).
      if (recovery) return;
      if (saveState.kind === "conflict") return;
      debounceRef.current = window.setTimeout(() => {
        void doPatch(next);
      }, AUTOSAVE_DEBOUNCE_MS) as unknown as number;
    },
    [doPatch, persistToBuffer, recovery, saveState.kind],
  );

  const commit = useCallback(
    (updater: (prev: DiagnosticServerDetail) => DiagnosticServerDetail) => {
      setDetail((prev) => {
        const next = updater(prev);
        scheduleAutosave(next);
        return next;
      });
    },
    [scheduleAutosave],
  );

  const saveNow = useCallback(() => {
    clearDebounce();
    void doPatch(detail);
  }, [detail, doPatch]);

  useEffect(() => () => {
    clearDebounce();
    inflightRef.current?.abort();
  }, []);

  const reloadFromServer = useCallback(async () => {
    setSaveState({ kind: "saving" });
    try {
      const res = await fetch(`/api/admin/growth/diagnostics/${encodeURIComponent(detail.id)}`, {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const fresh = (await res.json()) as DiagnosticServerDetail;
      setDetail(fresh);
      persistToBuffer(fresh);
      setSaveState({ kind: "saved", at: new Date().toISOString() });
    } catch (err) {
      setSaveState({
        kind: "error",
        message: err instanceof Error ? err.message : "Erro ao recarregar.",
      });
    }
  }, [detail.id, persistToBuffer]);

  // Upload de foto (por área): multipart real, X-Expected-Revision. Bloqueia
  // se estiver em conflito ou recovery pendente. Ao succeed, atualiza a
  // revisão e injeta a nova foto na lista local.
  const uploadPhoto = useCallback(
    async (input: { areaKey: string; file: File; caption: string; internalOnly: boolean }) => {
      if (saveState.kind === "conflict" || recovery) {
        throw new Error("Salve/resolva o conflito antes de enviar fotos.");
      }
      // Serializa: se autosave estiver rodando, aguarda o inflight abortar.
      clearDebounce();
      inflightRef.current?.abort();
      const form = new FormData();
      form.set("file", input.file);
      form.set("kind", "inspection");
      form.set("area_key", input.areaKey);
      form.set("internal_only", input.internalOnly ? "true" : "false");
      if (input.caption.trim()) form.set("caption", input.caption.trim());
      const idem = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const res = await fetch(`/api/admin/growth/diagnostics/${encodeURIComponent(detail.id)}/photos`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "X-Expected-Revision": String(detail.revision),
          "Idempotency-Key": idem,
        },
        body: form,
      });
      if (res.status === 409) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { code?: string; details?: { current_revision?: number } };
        };
        if (body.error?.code === "CONFLICT_REVISION_STALE") {
          setSaveState({
            kind: "conflict",
            currentRevision: body.error.details?.current_revision ?? detail.revision,
          });
          throw new Error("Conflito ao enviar foto — recarregue.");
        }
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error?.message ?? `HTTP ${res.status}`);
      }
      const parsed = (await res.json()) as {
        photo_id: string;
        storage_path: string;
        signed_url: string;
        signed_url_expires_at: string;
        revision: number;
      };
      const nextPhoto: DiagnosticServerPhoto = {
        id: parsed.photo_id,
        kind: "inspection",
        areaKey: input.areaKey,
        caption: input.caption.trim() || null,
        ordering: 0,
        internalOnly: input.internalOnly,
        storagePath: parsed.storage_path,
        signedUrl: parsed.signed_url,
        signedUrlExpiresAt: parsed.signed_url_expires_at,
      };
      const next = {
        ...detail,
        revision: parsed.revision,
        photos: [...detail.photos, nextPhoto],
      };
      setDetail(next);
      persistToBuffer(next);
      setSaveState({ kind: "saved", at: new Date().toISOString() });
    },
    [detail, persistToBuffer, recovery, saveState.kind],
  );

  const removePhoto = useCallback(
    async (photoId: string) => {
      if (saveState.kind === "conflict" || recovery) return;
      clearDebounce();
      inflightRef.current?.abort();
      const res = await fetch(
        `/api/admin/growth/diagnostics/${encodeURIComponent(detail.id)}/photos/${encodeURIComponent(photoId)}`,
        {
          method: "DELETE",
          cache: "no-store",
          headers: { "X-Expected-Revision": String(detail.revision) },
        },
      );
      if (res.status === 409) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { code?: string; details?: { current_revision?: number } };
        };
        if (body.error?.code === "CONFLICT_REVISION_STALE") {
          setSaveState({
            kind: "conflict",
            currentRevision: body.error.details?.current_revision ?? detail.revision,
          });
          return;
        }
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setSaveState({
          kind: "error",
          message: errBody?.error?.message ?? `HTTP ${res.status}`,
        });
        return;
      }
      const parsed = (await res.json()) as { revision: number; photo_state?: string };
      const next = {
        ...detail,
        revision: parsed.revision,
        photos: detail.photos.filter((p) => p.id !== photoId),
      };
      setDetail(next);
      persistToBuffer(next);
      setSaveState({ kind: "saved", at: new Date().toISOString() });
    },
    [detail, persistToBuffer, recovery, saveState.kind],
  );

  // Recovery: escolha explícita "carregar versão do servidor"
  // → limpa recovery + reload.
  const discardRecoveryAndReload = useCallback(async () => {
    clearRecovery(storeRef.current, detail.id);
    setRecovery(null);
    setShowingRecoveryModal(false);
    await reloadFromServer();
  }, [detail.id, reloadFromServer]);

  const dismissRecoveryAfterReview = useCallback(() => {
    clearRecovery(storeRef.current, detail.id);
    setRecovery(null);
    setShowingRecoveryModal(false);
  }, [detail.id]);

  const dgnAverage = computeDgnAverage(detail.scores as never);
  const evaluated = countEvaluatedCriteria(detail.scores as never);
  const partial = isPartialDiagnostic(detail.scores as never);

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
      <header className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
              Diagnóstico · rascunho persistido no server
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              {detail.customer.name}
            </h1>
            <p className="mt-1 text-xs text-white/45">
              {detail.vehicle.brand} {detail.vehicle.model} · {detail.vehicle.plate}
              {" · "}
              catálogo <span className="font-mono text-white/70">{detail.catalog_version}</span>
              {" · "}
              revisão <span className="font-mono text-white/70">{detail.revision}</span>
              {" · "}
              id <span className="font-mono text-white/70">{detail.id}</span>
            </p>
          </div>
          <div className="text-right">
            <SaveIndicator state={saveState} onSaveNow={saveNow} onReload={reloadFromServer} />
          </div>
        </div>
        {recovery ? (
          <RecoveryBanner
            savedRev={recovery.savedRev}
            currentRev={detail.revision}
            quarantinedAt={recovery.quarantinedAt}
            onLoadServer={discardRecoveryAndReload}
            onShowLocal={() => setShowingRecoveryModal(true)}
          />
        ) : saveState.kind === "conflict" ? (
          <ConflictBanner
            currentRevision={saveState.currentRevision}
            onReload={reloadFromServer}
          />
        ) : null}
        <p className="mt-4 text-[11px] text-white/45">
          Autosave a cada 3s de ociosidade. Buffer local segura o conteúdo se
          você fechar a aba — e se outra sessão salvou primeiro, seu trabalho
          fica em recovery até você decidir explicitamente.
        </p>
      </header>
      {recovery && showingRecoveryModal ? (
        <RecoveryReviewModal
          envelope={recovery}
          onLoadServer={discardRecoveryAndReload}
          onKeepAndClose={dismissRecoveryAfterReview}
          onCloseWithoutClearing={() => setShowingRecoveryModal(false)}
        />
      ) : null}

      <Section title="Notas do avaliador">
        <label>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
            Resumo pro cliente
          </span>
          <textarea
            className="mt-1 w-full min-h-[100px] rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[#C9A84C]/40"
            value={detail.summary}
            onChange={(e) => commit((prev) => ({ ...prev, summary: e.target.value }))}
            disabled={saveState.kind === "conflict" || Boolean(recovery)}
          />
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Data da avaliação
            </span>
            <input
              type="date"
              className="mt-1 h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-[#C9A84C]/40"
              value={detail.performed_at ?? ""}
              onChange={(e) => commit((prev) => ({ ...prev, performed_at: e.target.value || null }))}
              disabled={saveState.kind === "conflict" || Boolean(recovery)}
            />
          </label>
          <label>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Avaliador
            </span>
            <input
              type="text"
              className="mt-1 h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-[#C9A84C]/40"
              value={detail.performed_by}
              onChange={(e) => commit((prev) => ({ ...prev, performed_by: e.target.value }))}
              disabled={saveState.kind === "conflict" || Boolean(recovery)}
            />
          </label>
        </div>
      </Section>

      <Section title="Inspeção visual — 9 áreas">
        <div className="space-y-3">
          {INSPECTION_AREAS.map((areaDef) => {
            const idx = detail.inspection_areas.findIndex((a) => a.area_key === areaDef.key);
            const area = idx >= 0
              ? detail.inspection_areas[idx]
              : {
                  area_key: areaDef.key,
                  condition: "not_evaluated" as InspectionCondition,
                  internal_notes: "",
                  public_notes: "",
                  public_visible: true,
                };
            const areaPhotos = detail.photos.filter(
              (p) => p.kind === "inspection" && p.areaKey === areaDef.key,
            );
            return (
              <AreaRow
                key={areaDef.key}
                label={areaDef.label}
                hint={areaDef.hint}
                area={area}
                photos={areaPhotos}
                disabled={saveState.kind === "conflict" || Boolean(recovery)}
                onChange={(next) => commit((prev) => {
                  const areas = [...prev.inspection_areas];
                  const at = areas.findIndex((a) => a.area_key === next.area_key);
                  if (at >= 0) areas[at] = next; else areas.push(next);
                  return { ...prev, inspection_areas: areas };
                })}
                onUploadPhoto={(payload) => uploadPhoto({ areaKey: areaDef.key, ...payload })}
                onRemovePhoto={(photoId) => removePhoto(photoId)}
              />
            );
          })}
        </div>
      </Section>

      <Section title="5 critérios DGN">
        <ul className="space-y-3">
          {DGN_SCORE_CRITERIA.map((c) => {
            const entry = detail.scores.find((s) => s.criterion_key === c.key);
            const score = entry?.score ?? null;
            return (
              <ScoreRow
                key={c.key}
                label={c.label}
                hint={c.hint}
                score={score}
                disabled={saveState.kind === "conflict" || Boolean(recovery)}
                onChange={(next) => commit((prev) => ({
                  ...prev,
                  scores: (() => {
                    const list = [...prev.scores];
                    const at = list.findIndex((s) => s.criterion_key === c.key);
                    if (at >= 0) list[at] = { ...list[at], score: next };
                    else list.push({ criterion_key: c.key, score: next });
                    return list;
                  })(),
                }))}
              />
            );
          })}
        </ul>
        <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">Média DGN</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {dgnAverage === null ? "Sem avaliação registrada" : dgnAverage.toFixed(1).replace(".", ",")}
          </p>
          <p className="text-[11px] text-white/50">
            {describeAverageForCustomer(dgnAverage)}
            {partial ? ` · parcial (${evaluated}/${detail.scores.length})` : ""}
          </p>
        </div>
      </Section>

      <Section title="Fotos">
        <p className="text-[12px] text-white/55">
          Adicione fotos direto na área de inspeção correspondente. JPEG/PNG/WEBP
          até 10&nbsp;MB. Marque &quot;Somente uso interno&quot; para que a foto
          nunca apareça na página do cliente (fica visível só aqui no admin).
        </p>
        <p className="mt-2 text-[11px] text-white/40">
          {detail.photos.length === 0
            ? "Nenhuma foto anexada."
            : `${detail.photos.length} foto${detail.photos.length === 1 ? "" : "s"} anexada${detail.photos.length === 1 ? "" : "s"} no total (${detail.photos.filter((p) => p.internalOnly).length} interna${detail.photos.filter((p) => p.internalOnly).length === 1 ? "" : "s"}).`}
        </p>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/85 border-b border-white/[0.05] pb-3">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SaveIndicator({
  state,
  onSaveNow,
  onReload,
}: {
  state: SaveState;
  onSaveNow: () => void;
  onReload: () => void;
}) {
  if (state.kind === "conflict") {
    return (
      <div className="text-[11px] text-red-200">
        <p className="font-semibold uppercase tracking-[0.14em]">Conflito</p>
        <button
          type="button"
          onClick={onReload}
          className="mt-1 inline-flex items-center gap-1 rounded-md border border-red-300/30 bg-red-400/[0.06] px-2 py-1 text-[10px] font-semibold text-red-200"
        >
          <RefreshCw size={11} /> Recarregar
        </button>
      </div>
    );
  }
  if (state.kind === "error") {
    return (
      <div className="text-[11px] text-red-200">
        <p className="font-semibold uppercase tracking-[0.14em]">Erro ao salvar</p>
        <p className="mt-0.5 max-w-[220px] truncate">{state.message}</p>
        <button
          type="button"
          onClick={onSaveNow}
          className="mt-1 inline-flex items-center gap-1 rounded-md border border-red-300/30 bg-red-400/[0.06] px-2 py-1 text-[10px] font-semibold text-red-200"
        >
          <RefreshCw size={11} /> Tentar novamente
        </button>
      </div>
    );
  }
  if (state.kind === "saving") {
    return (
      <p className="inline-flex items-center gap-1.5 text-[11px] text-white/60">
        <Loader2 size={12} className="animate-spin" /> Salvando…
      </p>
    );
  }
  if (state.kind === "saved") {
    return (
      <p className="inline-flex items-center gap-1.5 text-[11px] text-emerald-200/90">
        <Check size={12} /> Salvo às {new Date(state.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={onSaveNow}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[11px] font-semibold text-white/70 hover:border-[#C9A84C]/30"
    >
      <Save size={12} /> Salvar agora
    </button>
  );
}

function ConflictBanner({
  currentRevision,
  onReload,
}: {
  currentRevision: number;
  onReload: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-300/30 bg-red-400/[0.06] px-4 py-3 text-[12px] text-red-100 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold uppercase tracking-[0.14em] text-red-200">
            Este diagnóstico foi alterado em outra sessão
          </p>
          <p className="mt-1 leading-relaxed">
            A versão atual no servidor é <span className="font-mono">{currentRevision}</span>.
            O autosave está pausado. Recarregue a versão do servidor para continuar editando —
            merge automático NÃO é aplicado nesta entrega.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReload}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-lg border border-red-300/30 bg-red-500/10 px-3 text-[11px] font-semibold text-red-100 hover:bg-red-500/20"
      >
        <RefreshCw size={12} /> Recarregar versão atual
      </button>
    </div>
  );
}

function AreaRow({
  label,
  hint,
  area,
  photos,
  disabled,
  onChange,
  onUploadPhoto,
  onRemovePhoto,
}: {
  label: string;
  hint: string;
  area: {
    area_key: string;
    condition: InspectionCondition;
    internal_notes: string;
    public_notes: string;
    public_visible: boolean;
  };
  photos: DiagnosticServerPhoto[];
  disabled: boolean;
  onChange: (next: typeof area) => void;
  onUploadPhoto: (payload: { file: File; caption: string; internalOnly: boolean }) => Promise<void>;
  onRemovePhoto: (photoId: string) => Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-[11px] text-white/45">{hint}</p>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {INSPECTION_CONDITION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...area, condition: opt.value })}
            className={`inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-semibold transition ${
              area.condition === opt.value
                ? "border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#E7C96A]"
                : "border-white/[0.08] bg-white/[0.03] text-white/60"
            } disabled:opacity-50`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
            Nota pública (aparece pro cliente)
          </span>
          <textarea
            className="mt-1 w-full min-h-[70px] rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-[#C9A84C]/40 disabled:opacity-50"
            value={area.public_notes}
            onChange={(e) => onChange({ ...area, public_notes: e.target.value })}
            disabled={disabled}
          />
        </label>
        <label>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
            Nota interna (curador)
          </span>
          <textarea
            className="mt-1 w-full min-h-[70px] rounded-xl border border-amber-300/25 bg-amber-300/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-amber-300/50 disabled:opacity-50"
            value={area.internal_notes}
            onChange={(e) => onChange({ ...area, internal_notes: e.target.value })}
            disabled={disabled}
          />
        </label>
      </div>
      <label className="mt-3 inline-flex items-center gap-2 text-[12px] text-white/70">
        <input
          type="checkbox"
          checked={area.public_visible}
          onChange={(e) => onChange({ ...area, public_visible: e.target.checked })}
          className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#C9A84C]"
          disabled={disabled}
        />
        Mostrar essa área na página do cliente
      </label>
      <AreaPhotos
        photos={photos}
        disabled={disabled}
        onUpload={onUploadPhoto}
        onRemove={onRemovePhoto}
      />
    </div>
  );
}

const PHOTO_MIME_ALLOWED = ["image/jpeg", "image/png", "image/webp"] as const;
const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

function AreaPhotos({
  photos,
  disabled,
  onUpload,
  onRemove,
}: {
  photos: DiagnosticServerPhoto[];
  disabled: boolean;
  onUpload: (payload: { file: File; caption: string; internalOnly: boolean }) => Promise<void>;
  onRemove: (photoId: string) => Promise<void>;
}) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [internalOnly, setInternalOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const openPicker = () => {
    if (disabled || isSending) return;
    setError(null);
    inputRef.current?.click();
  };

  const handleFile = (file: File | null) => {
    setError(null);
    if (!file) return;
    if (!PHOTO_MIME_ALLOWED.includes(file.type as (typeof PHOTO_MIME_ALLOWED)[number])) {
      setError(`Tipo não permitido (${file.type || "desconhecido"}). Use JPEG/PNG/WEBP.`);
      return;
    }
    if (file.size <= 0 || file.size > PHOTO_MAX_BYTES) {
      setError(`Tamanho fora do limite (10 MB): ${(file.size / 1024 / 1024).toFixed(2)} MB.`);
      return;
    }
    setPendingFile(file);
  };

  const cancelPending = () => {
    setPendingFile(null);
    setCaption("");
    setInternalOnly(false);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submitPending = async () => {
    if (!pendingFile) return;
    setIsSending(true);
    setError(null);
    try {
      await onUpload({ file: pendingFile, caption, internalOnly });
      cancelPending();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar foto.");
    } finally {
      setIsSending(false);
    }
  };

  const remove = async (photoId: string) => {
    if (disabled) return;
    setRemovingId(photoId);
    setError(null);
    try {
      await onRemove(photoId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao remover foto.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
          Fotos da área
        </p>
        <p className="text-[10px] text-white/40">
          JPEG · PNG · WEBP · até 10 MB
        </p>
      </div>

      {photos.length > 0 ? (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {photos.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2"
            >
              <div className="relative">
                {p.signedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.signedUrl}
                    alt={p.caption ?? "Foto da inspeção"}
                    className="h-32 w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center rounded-md bg-black/40 text-[11px] text-white/40">
                    URL indisponível
                  </div>
                )}
                {p.internalOnly ? (
                  <span
                    className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-amber-300/[0.15] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100"
                    title="Somente uso interno — não aparece pro cliente"
                  >
                    <Lock size={10} /> Interna
                  </span>
                ) : null}
              </div>
              {p.caption ? (
                <p className="mt-2 text-[11px] text-white/70">{p.caption}</p>
              ) : null}
              <button
                type="button"
                onClick={() => remove(p.id)}
                disabled={disabled || removingId === p.id}
                className="mt-2 inline-flex items-center gap-1 rounded-md border border-red-300/25 bg-red-400/[0.06] px-2 py-1 text-[10px] font-semibold text-red-200 hover:bg-red-400/[0.12] disabled:opacity-50"
              >
                {removingId === p.id ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Trash2 size={10} />
                )}
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_MIME_ALLOWED.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {pendingFile ? (
        <div className="mt-3 rounded-lg border border-[#C9A84C]/25 bg-[#C9A84C]/[0.05] p-3">
          <div className="flex gap-3">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Pré-visualização"
                className="h-24 w-24 shrink-0 rounded-md object-cover"
              />
            ) : null}
            <div className="min-w-0 flex-1 space-y-2">
              <p className="truncate text-[11px] text-white/70">{pendingFile.name}</p>
              <input
                type="text"
                placeholder="Legenda (opcional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="h-9 w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-2 text-[12px] text-white outline-none focus:border-[#C9A84C]/40"
                maxLength={200}
                disabled={isSending}
              />
              <label className="inline-flex items-center gap-2 text-[11px] text-white/70">
                <input
                  type="checkbox"
                  checked={internalOnly}
                  onChange={(e) => setInternalOnly(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-amber-300"
                  disabled={isSending}
                />
                Somente uso interno (não aparece pro cliente)
              </label>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={submitPending}
              disabled={isSending}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-3 text-[11px] font-semibold text-[#E7C96A] hover:bg-[#C9A84C]/20 disabled:opacity-50"
            >
              {isSending ? <Loader2 size={11} className="animate-spin" /> : <Camera size={11} />}
              {isSending ? "Enviando…" : "Enviar foto"}
            </button>
            <button
              type="button"
              onClick={cancelPending}
              disabled={isSending}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 text-[11px] font-semibold text-white/70 hover:border-white/25 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 text-[11px] font-semibold text-white/75 hover:border-[#C9A84C]/30 disabled:opacity-50"
        >
          <Camera size={11} /> Adicionar foto
        </button>
      )}

      {error ? (
        <p className="mt-2 text-[11px] text-red-200">{error}</p>
      ) : null}
    </div>
  );
}

function ScoreRow({
  label,
  hint,
  score,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  score: number | null;
  disabled: boolean;
  onChange: (next: number | null) => void;
}) {
  return (
    <li className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-[11px] text-white/45">{hint}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className={`inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
              score === null
                ? "border-white/40 bg-white/[0.08] text-white"
                : "border-white/[0.08] bg-white/[0.03] text-white/50"
            } disabled:opacity-50`}
          >
            Não avaliado
          </button>
          {score !== null ? (
            <span className="tabular-nums text-lg font-semibold text-[#E7C96A]">
              {score.toFixed(1).replace(".", ",")}
            </span>
          ) : null}
        </div>
      </div>
      <input
        type="range"
        min={DGN_SCORE_MIN}
        max={DGN_SCORE_MAX}
        step={DGN_SCORE_STEP}
        value={score ?? 5}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled || score === null}
        className="mt-3 w-full accent-[#C9A84C] disabled:opacity-40"
      />
      {score === null ? (
        <button
          type="button"
          onClick={() => onChange(5)}
          disabled={disabled}
          className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E7C96A] underline underline-offset-2 disabled:opacity-50"
        >
          Começar em 5,0
        </button>
      ) : null}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Recovery UI — banner + modal.
// Regra do checkpoint: nada é limpo automaticamente. Operador escolhe.

function RecoveryBanner({
  savedRev,
  currentRev,
  quarantinedAt,
  onLoadServer,
  onShowLocal,
}: {
  savedRev: number;
  currentRev: number;
  quarantinedAt: string;
  onLoadServer: () => void;
  onShowLocal: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-300/35 bg-amber-300/[0.06] px-4 py-3 text-[12px] text-amber-100 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-2">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-300" />
        <div>
          <p className="font-semibold uppercase tracking-[0.14em] text-amber-200">
            Alterações locais não enviadas
          </p>
          <p className="mt-1 leading-relaxed">
            Existem alterações locais que não foram enviadas porque este
            diagnóstico foi atualizado em outra sessão. Seu buffer estava na
            revisão <span className="font-mono">{savedRev}</span>; o servidor
            já está na <span className="font-mono">{currentRev}</span>.
            Quarentena desde{" "}
            <span className="font-mono">
              {new Date(quarantinedAt).toLocaleString("pt-BR")}
            </span>.
            Autosave pausado até você decidir.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 self-start sm:flex-row">
        <button
          type="button"
          onClick={onShowLocal}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-3 text-[11px] font-semibold text-white/80 hover:border-white/30"
        >
          <Eye size={12} /> Ver alterações locais
        </button>
        <button
          type="button"
          onClick={onLoadServer}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-300/[0.12] px-3 text-[11px] font-semibold text-amber-100 hover:bg-amber-300/[0.18]"
        >
          <RefreshCw size={12} /> Carregar versão do servidor
        </button>
      </div>
    </div>
  );
}

function RecoveryReviewModal({
  envelope,
  onLoadServer,
  onKeepAndClose,
  onCloseWithoutClearing,
}: {
  envelope: RecoveryEnvelope<DiagnosticServerDetail>;
  onLoadServer: () => void;
  onKeepAndClose: () => void;
  onCloseWithoutClearing: () => void;
}) {
  const payloadText = useMemo(
    () => JSON.stringify(envelope.snapshot, null, 2),
    [envelope.snapshot],
  );
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payloadText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard bloqueado — usuário pode copiar manualmente */ }
  };
  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/70 px-4 pt-10 backdrop-blur-sm"
      onClick={onCloseWithoutClearing}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Alterações locais em recovery"
        className="w-full max-w-3xl rounded-2xl border border-white/[0.08] bg-[#101010] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
              Alterações locais em quarentena
            </p>
            <h2 className="mt-1 text-base font-semibold text-white">
              Payload salvo em recovery (revisão {envelope.savedRev})
            </h2>
            <p className="mt-1 text-[11px] text-white/50">
              Copie o que precisar, depois escolha se descarta local e carrega
              server, ou fecha sem tocar (recovery continua pendurada).
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar sem tocar em recovery"
            onClick={onCloseWithoutClearing}
            className="rounded-md p-1 text-white/50 hover:bg-white/[0.05] hover:text-white"
          >
            <X size={16} />
          </button>
        </header>
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-3 text-[11px] font-semibold text-white/80 hover:border-white/30"
            >
              <Copy size={12} /> {copied ? "Copiado!" : "Copiar JSON completo"}
            </button>
          </div>
          <pre className="max-h-[50vh] overflow-auto rounded-xl border border-white/[0.06] bg-black/40 p-3 text-[11px] leading-relaxed text-white/70">
            {payloadText}
          </pre>
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-white/[0.06] px-5 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onKeepAndClose}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-3 text-[11px] font-semibold text-white/80 hover:border-white/30"
          >
            <Check size={12} /> Já copiei — pode limpar recovery
          </button>
          <button
            type="button"
            onClick={onLoadServer}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-300/[0.12] px-3 text-[11px] font-semibold text-amber-100 hover:bg-amber-300/[0.18]"
          >
            <RefreshCw size={12} /> Descartar local e carregar servidor
          </button>
        </footer>
      </div>
    </div>
  );
}
