"use client";

// DGN Diagnósticos — Formulário admin (Fase 0.5)
//
// Formulário client-side puro pra prototipar o fluxo:
//   1. Identificação (cliente + veículo — obrigatório se cliente tem >1)
//   2. Inspeção (9 áreas independentes, condição + observação + fotos + flag pública)
//   3. 5 critérios DGN (score 0..10 step 0.5, null = não avaliado)
//   4. Diagnóstico (parágrafo pra o cliente + recomendações do catálogo)
//   5. Investimento (opcional — pode publicar sem investimento)
//   6. Revisão (resumo e "salvar rascunho")
//
// Regras já embutidas na UI:
//   * Cliente com >1 veículo: nenhum é selecionado por padrão. Botão de
//     avançar (na seção 2 em diante) fica desabilitado até o operador
//     escolher explicitamente.
//   * Score aceita CLICAR em "Não avaliado" pra devolver ao estado null.
//     Nunca vira 0 por conveniência.
//   * `internalOnly` na foto e `publicVisible=false` na área ficam
//     preservados nos dumps de rascunho.
//   * Investimento tem `finalPriceCents` derivado (recalculado toda vez
//     que basePrice OU discount mudam).
//
// Persistência nesta fase: SÓ localStorage via `createDraftScheduler`
// (debounce 3s). Sem endpoint fake. A interface `DraftPersister` já está
// pronta pra receber o adapter server quando a Entrega 2 chegar.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Save, ShieldCheck, Info } from "lucide-react";
import {
  DGN_SCORE_CRITERIA,
  DGN_SCORE_MAX,
  DGN_SCORE_MIN,
  DGN_SCORE_STEP,
  INSPECTION_AREAS,
  INSPECTION_CONDITION_OPTIONS,
  SERVICES,
  getInspectionAreaDef,
  getServiceDef,
  type InspectionCondition,
  type ServiceKey,
} from "@/lib/growth/diagnostics/catalog";
import {
  computeDgnAverage,
  computeInvestmentTotalCents,
  countEvaluatedCriteria,
  describeAverageForCustomer,
  formatCents,
  isPartialDiagnostic,
} from "@/lib/growth/diagnostics/computations";
import {
  createDraftScheduler,
  createLocalStoragePersister,
  type DraftScheduler,
} from "@/lib/growth/diagnostics/draft-storage";
import type {
  DiagnosticDraft,
  DiagnosticInspectionArea,
  DiagnosticInvestmentItem,
  DiagnosticRecommendation,
  DiagnosticScoreEntry,
} from "@/lib/growth/diagnostics/types";

const cardCls =
  "rounded-2xl border border-white/[0.06] bg-[#101010] p-5 sm:p-6";
const labelCls =
  "text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50";
const inputCls =
  "mt-1 h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-[#C9A84C]/40";
const textareaCls =
  "mt-1 w-full min-h-[90px] rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[#C9A84C]/40";
const selectCls = inputCls;

const DRAFT_KEY_PREFIX = "dgn-diag-draft:";

// ---------------------------------------------------------------------------

export function DiagnosticForm({ initial }: { initial: DiagnosticDraft }) {
  const [draft, setDraft] = useState<DiagnosticDraft>(initial);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Scheduler de autosave. Persister é o localStorage (noop em SSR/testes).
  const schedulerRef = useRef<DraftScheduler<DiagnosticDraft> | null>(null);
  useEffect(() => {
    const persister = createLocalStoragePersister<DiagnosticDraft>();
    schedulerRef.current = createDraftScheduler(persister, {
      key: DRAFT_KEY_PREFIX + initial.id,
      debounceMs: 3000,
    });
    // Rehidrata rascunho salvo previamente, se houver.
    const stored = persister.read(DRAFT_KEY_PREFIX + initial.id);
    if (stored) {
      setDraft(stored);
    }
    return () => {
      schedulerRef.current?.flush();
    };
  }, [initial.id]);

  // Toda mutação passa por aqui — carimba updatedAt e agenda persistência.
  const commit = useCallback((updater: (prev: DiagnosticDraft) => DiagnosticDraft) => {
    setDraft((prev) => {
      const next = updater(prev);
      const withStamp = { ...next, draftUpdatedAt: new Date().toISOString() };
      schedulerRef.current?.scheduleSave(withStamp);
      return withStamp;
    });
  }, []);

  const saveNow = useCallback(() => {
    schedulerRef.current?.flush();
    setLastSavedAt(new Date().toISOString());
  }, []);

  const vehicle = useMemo(
    () => draft.customer.vehicles.find((v) => v.id === draft.selectedVehicleId) ?? null,
    [draft.customer.vehicles, draft.selectedVehicleId],
  );

  const dgnAverage = computeDgnAverage(draft.scores);
  const evaluated = countEvaluatedCriteria(draft.scores);
  const partial = isPartialDiagnostic(draft.scores);
  const investmentTotal = computeInvestmentTotalCents(draft.investment);

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
      <Header
        draft={draft}
        lastSavedAt={lastSavedAt}
        onSaveNow={saveNow}
      />

      {/* Seção 1 — Identificação */}
      <Section index={1} title="Identificação" hint="Cliente e veículo já cadastrados. Não editamos aqui — só selecionamos.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Fact label="Cliente" value={draft.customer.name} />
          <Fact label="Telefone" value={draft.customer.phoneMasked} />
        </div>
        <div className="mt-5">
          <p className={labelCls}>Veículo avaliado</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {draft.customer.vehicles.map((v) => {
              const selected = v.id === draft.selectedVehicleId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() =>
                    commit((prev) => ({ ...prev, selectedVehicleId: v.id }))
                  }
                  className={`rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-[#C9A84C]/40 bg-[#C9A84C]/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">
                    {v.brand} {v.model}
                    {v.isPrimary ? (
                      <span className="ml-2 rounded-full border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/60">
                        Principal
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-[11px] text-white/50">
                    {v.plate} · {v.color}
                  </p>
                </button>
              );
            })}
          </div>
          {draft.customer.vehicles.length > 1 && !vehicle ? (
            <p className="mt-2 rounded-lg border border-amber-300/25 bg-amber-300/[0.05] px-3 py-2 text-[11px] text-amber-200">
              Selecione explicitamente o veículo. Nada aqui assume o primeiro.
            </p>
          ) : null}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label>
            <span className={labelCls}>Data da avaliação</span>
            <input
              type="date"
              className={inputCls}
              value={draft.performedAt ?? ""}
              onChange={(event) =>
                commit((prev) => ({ ...prev, performedAt: event.target.value || null }))
              }
            />
          </label>
          <label>
            <span className={labelCls}>Avaliador</span>
            <input
              type="text"
              className={inputCls}
              value={draft.performedBy}
              onChange={(event) =>
                commit((prev) => ({ ...prev, performedBy: event.target.value }))
              }
              placeholder="Nome de quem avaliou"
            />
          </label>
        </div>
      </Section>

      {/* Seção 2 — Inspeção */}
      <Section
        index={2}
        title="Inspeção visual (9 áreas)"
        hint="Checklist técnica. Cada área tem condição, observação, flag pública e fotos. Nada obrigatório — parcial é válido."
      >
        <div className="space-y-4">
          {draft.areas.map((area, idx) => (
            <InspectionRow
              key={area.areaKey}
              area={area}
              onChange={(next) =>
                commit((prev) => {
                  const areas = [...prev.areas];
                  areas[idx] = next;
                  return { ...prev, areas };
                })
              }
            />
          ))}
        </div>
      </Section>

      {/* Seção 3 — 5 critérios DGN */}
      <Section
        index={3}
        title="Avaliação DGN — 5 critérios"
        hint="Notas 0 a 10, passo 0,5. 'Não avaliado' preserva o estado null — nunca vira zero."
      >
        <ul className="space-y-3">
          {DGN_SCORE_CRITERIA.map((criterion) => {
            const entry = draft.scores.find((s) => s.criterionKey === criterion.key);
            return (
              <ScoreRow
                key={criterion.key}
                label={criterion.label}
                hint={criterion.hint}
                score={entry?.score ?? null}
                onChange={(nextScore) =>
                  commit((prev) => ({
                    ...prev,
                    scores: prev.scores.map((s) =>
                      s.criterionKey === criterion.key ? { ...s, score: nextScore } : s,
                    ),
                  }))
                }
              />
            );
          })}
        </ul>
        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div>
            <p className={labelCls}>Média DGN</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-white">
              {dgnAverage === null
                ? "Sem avaliação"
                : dgnAverage.toFixed(1).replace(".", ",")}
            </p>
            <p className="text-[11px] text-white/50">{describeAverageForCustomer(dgnAverage)}</p>
          </div>
          {partial ? (
            <span className="rounded-full border border-amber-300/25 bg-amber-300/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-amber-200">
              Parcial ({evaluated}/{draft.scores.length})
            </span>
          ) : null}
        </div>
      </Section>

      {/* Seção 4 — Diagnóstico */}
      <Section
        index={4}
        title="Diagnóstico"
        hint="Um parágrafo pro cliente + lista de serviços recomendados. Serviço só sai do catálogo TS versionado."
      >
        <label>
          <span className={labelCls}>Resumo pro cliente</span>
          <textarea
            className={textareaCls}
            value={draft.summary}
            onChange={(event) => commit((prev) => ({ ...prev, summary: event.target.value }))}
            placeholder="O que o cliente precisa saber, em linguagem clara. Sem jargão."
          />
        </label>

        <div className="mt-5">
          <p className={labelCls}>Recomendações</p>
          <RecommendationList
            items={draft.recommendations}
            onChange={(next) => commit((prev) => ({ ...prev, recommendations: next }))}
          />
        </div>
      </Section>

      {/* Seção 5 — Investimento (opcional) */}
      <Section
        index={5}
        title="Investimento (opcional)"
        hint="Preço final é sempre derivado — base − desconto. Se ficar vazio, a página pública mostra apenas a recomendação, sem valor."
      >
        <InvestmentList
          items={draft.investment}
          onChange={(next) => commit((prev) => ({ ...prev, investment: next }))}
        />
        <div className="mt-5 flex items-center justify-between rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/[0.06] px-4 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E7C96A]">
            Investimento total
          </span>
          <span className="text-lg font-semibold tabular-nums text-[#E7C96A]">
            {formatCents(investmentTotal)}
          </span>
        </div>
      </Section>

      {/* Seção 6 — Revisão */}
      <Section
        index={6}
        title="Revisão"
        hint="Uma última varredura antes de publicar (publicação real chega na Entrega 2)."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Fact label="Áreas com observação" value={String(draft.areas.filter((a) => a.condition !== "not_evaluated").length)} />
          <Fact label="Critérios avaliados" value={`${evaluated}/${draft.scores.length}`} />
          <Fact label="Fotos anexadas" value={String(draft.areas.reduce((acc, a) => acc + a.photos.length, 0))} />
          <Fact label="Itens em investimento" value={String(draft.investment.length)} />
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] leading-relaxed text-white/60">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-300" />
          <span>
            Publicação real (versão imutável + link opaco + tracking) entra na Entrega 2. Aqui só
            geramos rascunho local. Nada viaja pra Supabase.
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveNow}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-4 text-sm font-semibold text-[#E7C96A] transition hover:border-[#C9A84C]/60"
          >
            <Save size={14} /> Salvar rascunho agora
          </button>
          <Link
            href="/admin/growth/diagnosticos/preview"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
          >
            <ExternalLink size={14} /> Ver preview mobile
          </Link>
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header pegajoso (sem grudar de fato — status visual)

function Header({
  draft,
  lastSavedAt,
  onSaveNow,
}: {
  draft: DiagnosticDraft;
  lastSavedAt: string | null;
  onSaveNow: () => void;
}) {
  return (
    <header className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
            Novo diagnóstico · rascunho local
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            {draft.customer.name}
          </h1>
          <p className="mt-1 text-xs text-white/45">
            Catálogo <span className="font-mono text-white/70">{draft.catalogVersion}</span> · rascunho id{" "}
            <span className="font-mono text-white/70">{draft.id}</span>
          </p>
        </div>
        <div className="text-right">
          <p className={labelCls}>Última alteração</p>
          <p className="mt-1 text-[12px] tabular-nums text-white/70">
            {formatIsoShort(draft.draftUpdatedAt)}
          </p>
          {lastSavedAt ? (
            <p className="mt-0.5 text-[10px] text-emerald-200/80">
              Salvo manualmente em {formatIsoShort(lastSavedAt)}
            </p>
          ) : (
            <p className="mt-0.5 text-[10px] text-white/40">Autosave em 3s de ociosidade</p>
          )}
          <button
            type="button"
            onClick={onSaveNow}
            className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[11px] font-semibold text-white/70 transition hover:border-[#C9A84C]/30"
          >
            <Save size={12} /> Salvar agora
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300/25 bg-amber-300/[0.04] px-3 py-2 text-[11px] text-amber-200">
        <Info size={13} className="mt-0.5 shrink-0" />
        <span>
          Fase 0.5 · dados fictícios · rascunho vive só no seu navegador (localStorage). Nada é gravado
          em Supabase, catálogo de preços não é definitivo, rota pública ainda não existe.
        </span>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Utilitários

function Section({
  index,
  title,
  hint,
  children,
}: {
  index: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cardCls}>
      <header className="border-b border-white/[0.05] pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/85">
          <span className="text-white/40">{String(index).padStart(2, "0")} · </span>
          {title}
        </h2>
        {hint ? <p className="mt-1 text-xs text-white/45">{hint}</p> : null}
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
      <p className={labelCls}>{label}</p>
      <p className="mt-1 text-sm text-white/85">{value}</p>
    </div>
  );
}

function formatIsoShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Linha de inspeção

function InspectionRow({
  area,
  onChange,
}: {
  area: DiagnosticInspectionArea;
  onChange: (next: DiagnosticInspectionArea) => void;
}) {
  const def = getInspectionAreaDef(area.areaKey);
  const setCondition = (condition: InspectionCondition) => onChange({ ...area, condition });

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-white">{def.label}</p>
        <p className="text-[11px] text-white/45">{def.hint}</p>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {INSPECTION_CONDITION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setCondition(opt.value)}
            className={`inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-semibold transition ${
              area.condition === opt.value
                ? conditionActive(opt.tone)
                : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-white/[0.15]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <label className="mt-3 block">
        <span className={labelCls}>Observação</span>
        <textarea
          className={textareaCls}
          value={area.observation}
          onChange={(event) => onChange({ ...area, observation: event.target.value })}
          placeholder="O que você viu nessa área."
        />
      </label>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-2 text-[12px] text-white/70">
          <input
            type="checkbox"
            checked={area.publicVisible}
            onChange={(event) => onChange({ ...area, publicVisible: event.target.checked })}
            className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#C9A84C]"
          />
          Mostrar essa área na página do cliente
        </label>
        <span className="text-[11px] text-white/45">
          Fotos anexadas: {area.photos.length}
          {area.photos.some((p) => p.internalOnly) ? " · inclui interna" : ""}
        </span>
      </div>
    </div>
  );
}

function conditionActive(tone: "neutral" | "good" | "attention" | "danger"): string {
  switch (tone) {
    case "good":
      return "border-emerald-300/40 bg-emerald-300/10 text-emerald-200";
    case "attention":
      return "border-amber-300/40 bg-amber-300/10 text-amber-200";
    case "danger":
      return "border-red-300/40 bg-red-300/10 text-red-200";
    case "neutral":
    default:
      return "border-white/25 bg-white/[0.06] text-white/85";
  }
}

// ---------------------------------------------------------------------------
// Score row

function ScoreRow({
  label,
  hint,
  score,
  onChange,
}: {
  label: string;
  hint: string;
  score: number | null;
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
            className={`inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
              score === null
                ? "border-white/40 bg-white/[0.08] text-white"
                : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/25"
            }`}
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
        value={score ?? 0}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={score === null}
        className="mt-3 w-full accent-[#C9A84C] disabled:opacity-40"
      />
      {score === null ? (
        <button
          type="button"
          onClick={() => onChange(5)}
          className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E7C96A] underline underline-offset-2"
        >
          Começar em 5,0
        </button>
      ) : null}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Recommendations

function RecommendationList({
  items,
  onChange,
}: {
  items: DiagnosticRecommendation[];
  onChange: (next: DiagnosticRecommendation[]) => void;
}) {
  const remainingServices = SERVICES.filter(
    (s) => !items.some((item) => item.serviceKey === s.key),
  );

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const svc = getServiceDef(item.serviceKey);
        return (
          <div
            key={item.serviceKey}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-white">{svc.label}</p>
              <div className="flex gap-1.5">
                {(["opcional", "recomendado", "prioritario"] as const).map((prio) => (
                  <button
                    key={prio}
                    type="button"
                    onClick={() => {
                      const next = [...items];
                      next[idx] = { ...item, priority: prio };
                      onChange(next);
                    }}
                    className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                      item.priority === prio
                        ? conditionActive(
                            prio === "prioritario" ? "danger" : prio === "recomendado" ? "good" : "neutral",
                          )
                        : "border-white/[0.08] bg-white/[0.03] text-white/55"
                    }`}
                  >
                    {prio === "prioritario"
                      ? "Prioritário"
                      : prio === "recomendado"
                        ? "Recomendado"
                        : "Opcional"}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              className={textareaCls}
              value={item.reason}
              onChange={(event) => {
                const next = [...items];
                next[idx] = { ...item, reason: event.target.value };
                onChange(next);
              }}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
              className="mt-2 text-[11px] text-red-200/80 underline underline-offset-2"
            >
              Remover
            </button>
          </div>
        );
      })}
      {remainingServices.length > 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-3">
          <p className={labelCls}>Adicionar serviço</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {remainingServices.map((svc) => (
              <button
                key={svc.key}
                type="button"
                onClick={() =>
                  onChange([
                    ...items,
                    { serviceKey: svc.key, reason: svc.shortDescription, priority: "recomendado" },
                  ])
                }
                className="inline-flex h-8 items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-3 text-[11px] font-semibold text-white/75 hover:border-[#C9A84C]/30"
              >
                + {svc.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Investment

function recalcInvestmentItem(item: DiagnosticInvestmentItem): DiagnosticInvestmentItem {
  const factor = 1 - Math.max(0, Math.min(100, item.discountPercent)) / 100;
  const finalPriceCents = Math.max(0, Math.round(item.basePriceCents * factor));
  return { ...item, finalPriceCents };
}

function InvestmentList({
  items,
  onChange,
}: {
  items: DiagnosticInvestmentItem[];
  onChange: (next: DiagnosticInvestmentItem[]) => void;
}) {
  const remaining = SERVICES.filter(
    (s) => !items.some((item) => item.serviceKey === s.key),
  );
  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const svc = getServiceDef(item.serviceKey);
        return (
          <div
            key={item.serviceKey}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-white">{svc.label}</p>
              <p className="tabular-nums text-sm font-semibold text-[#E7C96A]">
                {formatCents(item.finalPriceCents)}
              </p>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <label>
                <span className={labelCls}>Base (R$)</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={(item.basePriceCents / 100).toFixed(2)}
                  onChange={(event) => {
                    const next = [...items];
                    next[idx] = recalcInvestmentItem({
                      ...item,
                      basePriceCents: Math.round(Number(event.target.value) * 100),
                    });
                    onChange(next);
                  }}
                  className={inputCls}
                />
              </label>
              <label>
                <span className={labelCls}>Desconto %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={item.discountPercent}
                  onChange={(event) => {
                    const next = [...items];
                    next[idx] = recalcInvestmentItem({
                      ...item,
                      discountPercent: Number(event.target.value),
                    });
                    onChange(next);
                  }}
                  className={inputCls}
                />
              </label>
              <label>
                <span className={labelCls}>Parcelas</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  step={1}
                  value={item.installments ?? 1}
                  onChange={(event) => {
                    const next = [...items];
                    next[idx] = { ...item, installments: Number(event.target.value) || null };
                    onChange(next);
                  }}
                  className={inputCls}
                />
              </label>
              <label className="flex items-end gap-2 pt-4">
                <input
                  type="checkbox"
                  checked={item.pixEligible}
                  onChange={(event) => {
                    const next = [...items];
                    next[idx] = { ...item, pixEligible: event.target.checked };
                    onChange(next);
                  }}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#C9A84C]"
                />
                <span className="text-[12px] text-white/70">Pix elegível</span>
              </label>
            </div>
            <label className="mt-3 block">
              <span className={labelCls}>Nota interna</span>
              <input
                type="text"
                value={item.note}
                onChange={(event) => {
                  const next = [...items];
                  next[idx] = { ...item, note: event.target.value };
                  onChange(next);
                }}
                className={inputCls}
                placeholder="Ex.: cortesia recorrente, condição comercial etc."
              />
            </label>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
              className="mt-2 text-[11px] text-red-200/80 underline underline-offset-2"
            >
              Remover item
            </button>
          </div>
        );
      })}
      {remaining.length > 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-3">
          <p className={labelCls}>Adicionar item</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {remaining.map((svc) => (
              <button
                key={svc.key}
                type="button"
                onClick={() => {
                  const base = svc.referencePriceCents ?? 0;
                  onChange([
                    ...items,
                    recalcInvestmentItem({
                      serviceKey: svc.key as ServiceKey,
                      basePriceCents: base,
                      discountPercent: 0,
                      finalPriceCents: base,
                      installments: 1,
                      pixEligible: true,
                      note: svc.subscriberBenefitNote ?? "",
                    }),
                  ]);
                }}
                className="inline-flex h-8 items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-3 text-[11px] font-semibold text-white/75 hover:border-[#C9A84C]/30"
              >
                + {svc.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
