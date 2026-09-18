"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Info, X } from "lucide-react";
import type {
  ReconcileClassification,
  ReconcilePreview,
  ReconcilePreviewItem,
} from "@/lib/growth/reconcile/types";
import type { ApplyResultCode } from "@/lib/growth/reconcile/apply";

interface ApplyResultRow {
  rowIndex: number;
  input: Record<string, string | undefined>;
  customerId: string | null;
  classificationBeforeApply: string;
  action: "PROMOTE_EXISTING" | "CREATE_NEW" | "NONE";
  resultCode: ApplyResultCode;
  subscriptionId: string | null;
  existingSubscriptionId?: string | null;
  reason?: string;
  error?: string;
}

interface ApplyResponse {
  processed: number;
  counts: { proceed: number; stale: number; alreadyCorrect: number; reviewExisting: number; failed: number };
  results: ApplyResultRow[];
  note: string;
  error?: string;
}

const RESULT_STYLE: Record<ApplyResultCode, { label: string; tone: string }> = {
  PROMOTED:                     { label: "Promovida",            tone: "border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-200" },
  CREATED:                      { label: "Criada",               tone: "border-sky-300/30 bg-sky-300/[0.08] text-sky-200" },
  ALREADY_CORRECT:              { label: "Já estava correta",    tone: "border-emerald-300/20 bg-emerald-300/[0.04] text-emerald-200/80" },
  REVIEW_EXISTING_SUBSCRIPTION: { label: "Já existe equivalente", tone: "border-amber-300/30 bg-amber-300/[0.08] text-amber-200" },
  REVIEW_REQUIRED:              { label: "Revisar",              tone: "border-white/20 bg-white/[0.04] text-white/80" },
  STALE_PREVIEW_REVIEW_REQUIRED:{ label: "Preview desatualizado",tone: "border-amber-400/30 bg-amber-400/[0.08] text-amber-200" },
  NOT_APPLICABLE:               { label: "Não aplicável",        tone: "border-white/10 bg-white/[0.02] text-white/50" },
  FAILED:                       { label: "Falhou",               tone: "border-red-400/30 bg-red-400/[0.08] text-red-200" },
};

const SAMPLE = `name,phone,plan,status,paid_until
Benedito Constantino,19981723362,Priority,ativo,31/12/2026
Ana Silveira,11992357937,Smart,renovacao_pendente,`;

const BADGE_STYLE: Record<ReconcileClassification, { label: string; tone: string }> = {
  ALREADY_CORRECT:         { label: "Correto",             tone: "border-emerald-300/30 bg-emerald-300/[0.06] text-emerald-200" },
  PROMOTE_EXISTING:        { label: "Promover",            tone: "border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#E7C96A]" },
  CREATE_NEW:              { label: "Criar",               tone: "border-sky-300/30 bg-sky-300/[0.08] text-sky-200" },
  UPDATE_EXISTING_REVIEW:  { label: "Revisar",             tone: "border-white/20 bg-white/[0.04] text-white/80" },
  RENEWAL_PENDING:         { label: "Renovação pendente",  tone: "border-amber-300/30 bg-amber-300/[0.06] text-amber-200" },
  CUSTOMER_NOT_FOUND:      { label: "Não encontrado",      tone: "border-white/10 bg-white/[0.02] text-white/50" },
  POSSIBLE_MATCH:          { label: "Match ambíguo",       tone: "border-amber-400/30 bg-amber-400/[0.06] text-amber-200" },
  CONFLICT:                { label: "Conflito",            tone: "border-red-400/30 bg-red-400/[0.08] text-red-200" },
};

type PreviewResponse = ReconcilePreview & {
  unknownHeaders?: string[];
  emptyRowsIgnored?: number;
  error?: string;
};

export function ReconcilerClient() {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [applying, setApplying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applyResults, setApplyResults] = useState<ApplyResponse | null>(null);

  const analyze = useCallback(async (opts: { preserveResults?: boolean } = {}) => {
    setLoading(true);
    setError(null);
    setPreview(null);
    setSelected({});
    setExpanded({});
    if (!opts.preserveResults) setApplyResults(null);
    try {
      const response = await fetch("/api/admin/growth/subscribers/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const body = (await response.json()) as PreviewResponse;
      if (!response.ok) throw new Error(body.error ?? "Falha ao analisar.");
      setPreview(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }, [text]);

  const toggle = useCallback((idx: number) => {
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const toggleSelect = useCallback((idx: number, applyEnabled: boolean) => {
    if (!applyEnabled) return;
    setSelected((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const counts = preview?.counts;
  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected],
  );

  const selectedItems = useMemo(
    () => (preview?.items ?? []).filter((it) => selected[it.rowIndex] && it.applyEnabled),
    [preview, selected],
  );

  const applyPlan = useMemo(() => {
    const promotes = selectedItems.filter((it) => it.classification === "PROMOTE_EXISTING").length;
    const creates = selectedItems.filter((it) => it.classification === "CREATE_NEW").length;
    return { promotes, creates, total: selectedItems.length };
  }, [selectedItems]);

  const apply = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setApplying(true);
    setError(null);
    try {
      const payload = {
        text,
        selections: selectedItems.map((it) => ({
          rowIndex: it.rowIndex,
          expectedClassification: it.classification,
          expectedSubscriptionId: it.proposed?.kind === "PROMOTE_EXISTING" ? it.proposed.subscriptionId : undefined,
          expectedCustomerId: it.customer.customerId ?? undefined,
        })),
      };
      const response = await fetch("/api/admin/growth/subscribers/reconcile/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as ApplyResponse;
      if (!response.ok) throw new Error(body.error ?? "Falha ao aplicar.");
      setApplyResults(body);
      setConfirmOpen(false);
      setSelected({});
      // Re-preview automático com o mesmo relatório
      await analyze({ preserveResults: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado no apply.");
    } finally {
      setApplying(false);
    }
  }, [selectedItems, text, analyze]);

  return (
    <div className="mt-8 flex flex-col gap-6">
      <section className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5">
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
            Relatório operacional (colar CSV / TSV)
          </span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={10}
            placeholder={SAMPLE}
            className="min-h-[220px] w-full rounded-xl border border-white/[0.06] bg-[#0A0A0A] p-3 font-mono text-xs text-white/85 outline-none placeholder:text-white/25 focus:border-[#C9A84C]/35"
          />
        </label>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-white/45">
            Aceita cabeçalhos como <code className="font-mono">name, phone, plan, status, paid_until</code>{" "}
            ou equivalentes em PT-BR (<code className="font-mono">nome, telefone, plano, situação, vigência</code>).
            O preview roda em memória — nenhum write é feito.
          </p>
          <button
            type="button"
            onClick={() => analyze()}
            disabled={loading || text.trim().length === 0}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 text-sm font-semibold text-[#E7C96A] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Analisando…" : "Analisar relatório"}
          </button>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-400/[0.05] p-4 text-sm text-red-200">
          <AlertTriangle size={16} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {preview && counts && (
        <>
          <section className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Resumo</p>
            <p className="mt-1 text-sm text-white/85">{preview.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(counts) as ReconcileClassification[]).map((k) => (
                <span
                  key={k}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${BADGE_STYLE[k].tone}`}
                >
                  {BADGE_STYLE[k].label}: {counts[k]}
                </span>
              ))}
            </div>
            {preview.unknownHeaders && preview.unknownHeaders.length > 0 && (
              <p className="mt-3 flex items-start gap-2 text-[11px] text-amber-200">
                <Info size={12} className="mt-0.5" />
                Cabeçalhos ignorados (desconhecidos): {preview.unknownHeaders.join(", ")}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-white/45">
                Fonte: {preview.dataOrigin === "db" ? "Supabase (canônico)" : preview.dataOrigin === "json-fallback" ? "JSON (fallback)" : "JSON local"}
              </p>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={selectedCount === 0 || applying}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 text-sm font-semibold text-[#E7C96A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Aplicar selecionados ({selectedCount})
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#101010]">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                <tr>
                  <th className="w-8 px-3 py-3"></th>
                  <th className="w-8 px-3 py-3"></th>
                  <th className="px-3 py-3">Nome (relatório)</th>
                  <th className="px-3 py-3">Customer CRM</th>
                  <th className="px-3 py-3">Plano rel.</th>
                  <th className="px-3 py-3">Plano CRM</th>
                  <th className="px-3 py-3">Status rel.</th>
                  <th className="px-3 py-3">Classificação</th>
                </tr>
              </thead>
              <tbody>
                {preview.items.map((item) => (
                  <ItemRow
                    key={item.rowIndex}
                    item={item}
                    isOpen={!!expanded[item.rowIndex]}
                    isSelected={!!selected[item.rowIndex]}
                    onToggle={() => toggle(item.rowIndex)}
                    onSelect={() => toggleSelect(item.rowIndex, item.applyEnabled)}
                  />
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {applyResults && <ApplyResultsPanel results={applyResults} />}

      {confirmOpen && (
        <ConfirmModal
          plan={applyPlan}
          applying={applying}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={apply}
        />
      )}
    </div>
  );
}

function ApplyResultsPanel({ results }: { results: ApplyResponse }) {
  const { counts } = results;
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5" data-testid="reconciler-apply-results">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={16} className="text-emerald-300" />
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Resultado do apply</p>
      </div>
      <p className="mt-1 text-sm text-white/85">
        {counts.proceed} aplicado(s) · {counts.stale} preview desatualizado · {counts.reviewExisting} revisar equivalente · {counts.alreadyCorrect} já correto(s) · {counts.failed} falha(s)
      </p>
      <p className="mt-1 text-[11px] text-white/50">{results.note}</p>
      <ul className="mt-3 space-y-2">
        {results.results.map((r) => {
          const badge = RESULT_STYLE[r.resultCode];
          return (
            <li key={r.rowIndex} className="flex flex-col gap-1 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 text-[12px] text-white/80">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge.tone}`}>
                  {badge.label}
                </span>
                <span className="text-white/85">{r.input.name ?? `linha ${r.rowIndex + 1}`}</span>
                <span className="text-white/40">→ {r.action}</span>
              </div>
              {r.reason && <p className="text-[11px] text-white/60">{r.reason}</p>}
              {r.error && <p className="text-[11px] text-red-300">{r.error}</p>}
              {(r.subscriptionId || r.existingSubscriptionId) && (
                <p className="font-mono text-[10px] text-white/40">
                  {r.subscriptionId ? `subscription_id: ${r.subscriptionId}` : `existing_subscription_id: ${r.existingSubscriptionId}`}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ConfirmModal({
  plan, applying, onCancel, onConfirm,
}: {
  plan: { promotes: number; creates: number; total: number };
  applying: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog" aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0F0F0F] p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">Confirmar apply</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Você está prestes a atualizar {plan.total} assinatura(s).</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Fechar" className="text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <ul className="mt-4 space-y-1 text-sm text-white/80">
          <li>· {plan.promotes} subscription(s) existente(s) serão promovida(s)</li>
          <li>· {plan.creates} nova(s) subscription(s) manual(is) serão criada(s)</li>
          <li>· nenhuma cobrança PagBank será modificada</li>
        </ul>
        <p className="mt-3 text-[11px] text-white/50">
          O servidor irá revalidar cada linha imediatamente antes de aplicar. Linhas cujo estado mudou
          entre o preview e o apply serão marcadas como <span className="font-semibold">preview desatualizado</span>{" "}
          e não serão escritas.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-sm font-semibold text-white/80">
            Cancelar
          </button>
          <button
            type="button" onClick={onConfirm} disabled={applying}
            className="rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-2 text-sm font-semibold text-[#E7C96A] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {applying ? "Aplicando…" : "Confirmar e aplicar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  isOpen,
  isSelected,
  onToggle,
  onSelect,
}: {
  item: ReconcilePreviewItem;
  isOpen: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  const badge = BADGE_STYLE[item.classification];
  return (
    <>
      <tr className="border-t border-white/[0.04]">
        <td className="px-3 py-3 align-top">
          <button
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? "Fechar detalhe" : "Abrir detalhe"}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/[0.06] text-white/60 hover:text-white"
          >
            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        </td>
        <td className="px-3 py-3 align-top">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            disabled={!item.applyEnabled}
            aria-label="Selecionar para apply"
            className="h-4 w-4 disabled:cursor-not-allowed disabled:opacity-30"
          />
        </td>
        <td className="px-3 py-3 align-top text-white/85">{item.input.name ?? <span className="text-white/40">—</span>}</td>
        <td className="px-3 py-3 align-top text-white/70">{item.customer.customerName ?? <span className="text-white/40">—</span>}</td>
        <td className="px-3 py-3 align-top text-white/70">{item.input.plan ?? "—"}</td>
        <td className="px-3 py-3 align-top text-white/70">{item.facts.planCanonical ?? "—"}</td>
        <td className="px-3 py-3 align-top text-white/70">{item.input.status ?? "—"}</td>
        <td className="px-3 py-3 align-top">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${badge.tone}`}>
            {badge.label}
          </span>
        </td>
      </tr>
      {isOpen && (
        <tr className="border-t border-white/[0.04] bg-white/[0.015]">
          <td colSpan={8} className="px-6 py-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Por que o sistema classificou assim?</p>
            <p className="mt-1 text-sm text-white/85">{item.reason}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <FactList facts={{
                "Match por telefone": item.facts.matchedByPhone,
                "Match por placa": item.facts.matchedByPlate,
                "Match por legacy_id": item.facts.matchedByLegacyId,
                "Match por nome exato": item.facts.matchedByName,
                "Match fuzzy (nome)": item.facts.fuzzyName,
              }} />
              <FactList facts={{
                "Customer_id (CRM)": item.customer.customerId ?? "—",
                "Candidatos ambíguos": item.facts.ambiguousCandidates,
                "Subscription_id (CRM)": item.facts.subscriptionMatch?.subscriptionId ?? "—",
                "Vinculada a provider (PagBank)": item.facts.subscriptionMatch?.providerLinked ?? false,
                "Candidatas de subscription": item.facts.subscriptionMatch?.candidatesCount ?? 0,
              }} />
            </div>
            {(item.facts.divergingFields.length > 0 || item.facts.missingFields.length > 0) && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {item.facts.divergingFields.length > 0 && (
                  <p className="text-[11px] text-amber-200">Divergências: {item.facts.divergingFields.join(", ")}</p>
                )}
                {item.facts.missingFields.length > 0 && (
                  <p className="text-[11px] text-amber-200">Campos ausentes: {item.facts.missingFields.join(", ")}</p>
                )}
              </div>
            )}
            {item.proposed && (
              <div className="mt-3 rounded-lg border border-[#C9A84C]/20 bg-[#C9A84C]/[0.04] p-3 text-[11px] text-[#E7C96A]">
                <p className="uppercase tracking-[0.14em] text-[#E7C96A]/80">Ação proposta ({item.proposed.kind})</p>
                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-[10px] text-[#E7C96A]/85">
                  {JSON.stringify(item.proposed, null, 2)}
                </pre>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function FactList({ facts }: { facts: Record<string, string | number | boolean> }) {
  return (
    <ul className="space-y-1 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 text-[11px] text-white/70">
      {Object.entries(facts).map(([k, v]) => (
        <li key={k} className="flex justify-between gap-3">
          <span className="text-white/45">{k}</span>
          <span className="font-mono text-white/80">{String(v)}</span>
        </li>
      ))}
    </ul>
  );
}
