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
  PROMOTED:                     { label: "Atualizada",            tone: "border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-200" },
  CREATED:                      { label: "Criada",               tone: "border-sky-300/30 bg-sky-300/[0.08] text-sky-200" },
  ALREADY_CORRECT:              { label: "Já estava correta",    tone: "border-emerald-300/20 bg-emerald-300/[0.04] text-emerald-200/80" },
  REVIEW_EXISTING_SUBSCRIPTION: { label: "Já existe equivalente", tone: "border-amber-300/30 bg-amber-300/[0.08] text-amber-200" },
  REVIEW_REQUIRED:              { label: "Revisar",              tone: "border-white/20 bg-white/[0.04] text-white/80" },
  STALE_PREVIEW_REVIEW_REQUIRED:{ label: "Análise desatualizada",tone: "border-amber-400/30 bg-amber-400/[0.08] text-amber-200" },
  NOT_APPLICABLE:               { label: "Não aplicável",        tone: "border-white/10 bg-white/[0.02] text-white/50" },
  FAILED:                       { label: "Falhou",               tone: "border-red-400/30 bg-red-400/[0.08] text-red-200" },
};

const SAMPLE = `nome,telefone,plano,situação,vigência
`;

const BADGE_STYLE: Record<ReconcileClassification, { label: string; tone: string }> = {
  ALREADY_CORRECT:         { label: "Correto",             tone: "border-emerald-300/30 bg-emerald-300/[0.06] text-emerald-200" },
  PROMOTE_EXISTING:        { label: "Atualizar",            tone: "border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#E7C96A]" },
  CREATE_NEW:              { label: "Criar",               tone: "border-sky-300/30 bg-sky-300/[0.08] text-sky-200" },
  UPDATE_EXISTING_REVIEW:  { label: "Revisar",             tone: "border-white/20 bg-white/[0.04] text-white/80" },
  RENEWAL_PENDING:         { label: "Renovação pendente",  tone: "border-amber-300/30 bg-amber-300/[0.06] text-amber-200" },
  CUSTOMER_NOT_FOUND:      { label: "Não encontrado",      tone: "border-white/10 bg-white/[0.02] text-white/50" },
  POSSIBLE_MATCH:          { label: "Mais de um cliente",       tone: "border-amber-400/30 bg-amber-400/[0.06] text-amber-200" },
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
      setError(err instanceof Error ? err.message : "Não foi possível atualizar as assinaturas.");
    } finally {
      setApplying(false);
    }
  }, [selectedItems, text, analyze]);

  return (
    <div className="mt-6 flex flex-col gap-5">
      <ol className="dgn-step-list" aria-label="Etapas da reconciliação">
        <li aria-current={!preview ? "step" : undefined}>Informar relatório</li>
        <li aria-current={loading ? "step" : undefined}>Analisar dados</li>
        <li aria-current={preview && !confirmOpen ? "step" : undefined}>Conferir divergências</li>
        <li aria-current={confirmOpen ? "step" : undefined}>Revisar alterações</li>
      </ol>
      <section className="dgn-panel dgn-reconcile-entry">
        <div className="min-w-0">
          <label htmlFor="reconcile-report" className="dgn-section-title">Dados do relatório</label>
          <p id="reconcile-help" className="dgn-muted mt-2 mb-4">Cole os dados em CSV ou copie as linhas de uma planilha, incluindo os cabeçalhos.</p>
          <textarea id="reconcile-report" aria-describedby="reconcile-help" value={text}
            onChange={(event) => setText(event.target.value)} rows={6} placeholder={SAMPLE}
            className="min-h-[152px] w-full resize-y rounded-lg border border-white/15 bg-[#090909] p-3 font-mono text-xs leading-relaxed text-white/85 outline-none placeholder:text-white/35 focus:border-[#C9A84C]/60" />
        </div>
        <aside className="flex flex-col items-start justify-between gap-5">
          <div><h2 className="text-sm font-medium text-white/85">Antes de analisar</h2>
            <p className="dgn-muted mt-2">Inclua nome, telefone, plano, situação e vigência, quando disponíveis.</p>
            <p className="mt-3 text-xs leading-relaxed text-white/50">A análise não altera assinaturas.</p>
          </div>
          <button type="button" onClick={() => analyze()} disabled={loading || text.trim().length === 0}
            className="dgn-button w-full">{loading ? "Analisando…" : "Analisar relatório"}</button>
        </aside>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-400/[0.05] p-4 text-sm text-red-200">
          <AlertTriangle size={16} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {preview && counts && (
        <>
          <section className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5">
            <p className="text-sm font-semibold text-white/85">Resultado da análise</p>
            <p className="mt-1 text-sm text-white/85">
              {preview.totalRows} {preview.totalRows === 1 ? "registro analisado" : "registros analisados"} · {counts.PROMOTE_EXISTING} {counts.PROMOTE_EXISTING === 1 ? "atualização possível" : "atualizações possíveis"} · {counts.CREATE_NEW} {counts.CREATE_NEW === 1 ? "nova assinatura possível" : "novas assinaturas possíveis"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(counts) as ReconcileClassification[]).filter(k => counts[k] > 0).map((k) => (
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
                Colunas não reconhecidas: {preview.unknownHeaders.join(", ")}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-white/45">
                {preview.dataOrigin === "db" ? "Comparado com os cadastros atuais." : "Comparado com dados locais. Confirme na operação antes de atualizar."}
              </p>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={selectedCount === 0 || applying}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 text-sm font-semibold text-[#E7C96A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Revisar alterações ({selectedCount})
              </button>
            </div>
          </section>

          <section className="dgn-panel dgn-table-wrap" aria-label="Divergências por assinatura">
            <table className="dgn-table dgn-reconcile-table">
              <thead className="bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                <tr>
                  <th className="w-8 px-3 py-3"><span className="sr-only">Detalhes</span></th>
                  <th className="w-8 px-3 py-3"><span className="sr-only">Selecionar</span></th>
                  <th className="px-3 py-3">Nome no relatório</th>
                  <th className="px-3 py-3">Cliente cadastrado</th>
                  <th className="px-3 py-3">Plano informado</th>
                  <th className="px-3 py-3">Plano atual</th>
                  <th className="px-3 py-3">Situação informada</th>
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
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Resultado das alterações</p>
      </div>
      <p className="mt-1 text-sm text-white/85">
        {counts.proceed} atualizadas · {counts.stale} análises desatualizadas · {counts.reviewExisting} para revisar · {counts.alreadyCorrect} já corretas · {counts.failed} falhas
      </p>
      <p className="mt-1 text-xs text-white/50">Cada assinatura foi conferida novamente antes da alteração.</p>
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
                <span className="text-white/40">→ {r.action === "PROMOTE_EXISTING" ? "Atualizar assinatura" : r.action === "CREATE_NEW" ? "Criar assinatura" : "Sem alteração"}</span>
              </div>
              {r.reason && <p className="text-xs text-white/60">{displayReason(r.reason)}</p>}
              {r.error && <p className="text-[11px] text-red-300">{r.error}</p>}
              {(r.subscriptionId || r.existingSubscriptionId) && (
                <p className="font-mono text-[10px] text-white/40">
                  {r.subscriptionId ? `Assinatura: ${r.subscriptionId}` : `Assinatura existente: ${r.existingSubscriptionId}`}
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
      role="dialog" aria-modal="true" aria-labelledby="reconcile-confirm-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0F0F0F] p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">Confirmar alterações</p>
            <h2 id="reconcile-confirm-title" className="mt-1 text-lg font-semibold text-white">Atualizar {plan.total} {plan.total === 1 ? "assinatura" : "assinaturas"}?</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Fechar" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/60 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <ul className="mt-4 space-y-1 text-sm text-white/80">
          <li>· {plan.promotes} {plan.promotes === 1 ? "assinatura existente será atualizada" : "assinaturas existentes serão atualizadas"}</li>
          <li>· {plan.creates} {plan.creates === 1 ? "assinatura manual será criada" : "assinaturas manuais serão criadas"}</li>
          <li>· nenhuma cobrança PagBank será modificada</li>
        </ul>
        <p className="mt-3 text-[11px] text-white/50">
          Cada assinatura será conferida novamente. Se os dados tiverem mudado desde a análise, a alteração será bloqueada para nova revisão.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-sm font-semibold text-white/80">
            Cancelar
          </button>
          <button
            type="button" onClick={onConfirm} disabled={applying}
            className="min-h-11 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-2 text-sm font-semibold text-[#E7C96A] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {applying ? "Atualizando…" : "Confirmar alterações"}
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
            aria-expanded={isOpen}
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
            aria-label={`Selecionar alteração para ${item.input.name ?? "esta assinatura"}`}
            className="h-4 w-4 disabled:cursor-not-allowed disabled:opacity-30"
          />
        </td>
        <td data-label="Nome no relatório" className="px-3 py-3 align-top text-white/85">{item.input.name ?? <span className="text-white/40">—</span>}</td>
        <td data-label="Cliente cadastrado" className="px-3 py-3 align-top text-white/70">{item.customer.customerName ?? <span className="text-white/40">—</span>}</td>
        <td data-label="Plano informado" className="px-3 py-3 align-top text-white/70">{item.input.plan ?? "—"}</td>
        <td data-label="Plano atual" className="px-3 py-3 align-top text-white/70">{item.facts.planCanonical ?? "—"}</td>
        <td data-label="Situação informada" className="px-3 py-3 align-top text-white/70">{item.input.status ?? "—"}</td>
        <td data-label="Resultado" className="px-3 py-3 align-top">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${badge.tone}`}>
            {badge.label}
          </span>
        </td>
      </tr>
      {isOpen && (
        <tr className="border-t border-white/[0.04] bg-white/[0.015]">
          <td colSpan={8} className="px-6 py-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Motivo da classificação</p>
            <p className="mt-1 text-sm text-white/85">{displayReason(item.reason)}</p>
            <details className="mt-4"><summary className="min-h-10 cursor-pointer text-xs text-white/65">Dados usados na conferência</summary><div className="mt-3 grid gap-2 sm:grid-cols-2">
              <FactList facts={{
                "Telefone correspondente": item.facts.matchedByPhone,
                "Placa correspondente": item.facts.matchedByPlate,
                "Código de origem correspondente": item.facts.matchedByLegacyId,
                "Nome correspondente": item.facts.matchedByName,
                "Nome semelhante": item.facts.fuzzyName,
              }} />
              <FactList facts={{
                "Código do cliente": item.customer.customerId ?? "—",
                "Possíveis clientes": item.facts.ambiguousCandidates,
                "Código da assinatura": item.facts.subscriptionMatch?.subscriptionId ?? "—",
                "Vinculada ao PagBank": item.facts.subscriptionMatch?.providerLinked ?? false,
                "Assinaturas encontradas": item.facts.subscriptionMatch?.candidatesCount ?? 0,
              }} />
            </div></details>
            {(item.facts.divergingFields.length > 0 || item.facts.missingFields.length > 0) && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {item.facts.divergingFields.length > 0 && (
                  <p className="text-xs text-amber-200">Divergências: {item.facts.divergingFields.map(displayField).join(", ")}</p>
                )}
                {item.facts.missingFields.length > 0 && (
                  <p className="text-xs text-amber-200">Campos ausentes: {item.facts.missingFields.map(displayField).join(", ")}</p>
                )}
              </div>
            )}
            {item.proposed && (
              <div className="mt-3 rounded-lg border border-[#C9A84C]/20 bg-[#C9A84C]/[0.04] p-3 text-[11px] text-[#E7C96A]">
                <p className="font-semibold text-[#E7C96A]">{item.proposed.kind === "CREATE_NEW" ? "Criar assinatura manual" : "Atualizar assinatura existente"}</p><details className="mt-2"><summary className="min-h-10 cursor-pointer text-white/60">Detalhes da alteração</summary>
                  <ProposedSummary proposed={item.proposed} />
                </details>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function displayField(field: string): string {
  const labels: Record<string, string> = { plan: "plano", status: "situação", phone: "telefone", name: "nome", plate: "placa", cycle: "ciclo", cycle_ends_at: "vigência", paid_until: "vigência", payment_status: "pagamento" };
  return labels[field] ?? field;
}

function displayReason(reason: string): string {
  return reason.replace(/\bcustomers\b/gi, "clientes").replace(/\bcustomer\b/gi, "cliente")
    .replace(/\bsubscriptions\b/gi, "assinaturas").replace(/\bsubscription\b/gi, "assinatura")
    .replace(/\bcanônica\b/gi, "cadastrada").replace(/\bcanônico\b/gi, "cadastrado")
    .replace(/\blegacy_id\b/g, "código de origem").replace(/\bMatch\b/gi, "Correspondência")
    .replace(/Sem apply\./gi, "Alteração indisponível.").replace(/Sem write\./gi, "Nenhuma alteração será feita.");
}

function ProposedSummary({ proposed }: { proposed: NonNullable<ReconcilePreviewItem["proposed"]> }) {
  return <dl className="grid gap-3 text-xs sm:grid-cols-2">
    {proposed.kind === "CREATE_NEW" ? <div><dt className="text-white/50">Plano e ciclo</dt><dd>{proposed.plan} · {proposed.cycle}</dd></div> : null}
    <div><dt className="text-white/50">Pagamento</dt><dd>{proposed.paymentStatus === "confirmed" ? "Confirmado" : "Não confirmado"}</dd></div>
    <div><dt className="text-white/50">Comprovação</dt><dd>{proposed.paymentEvidenceSource === "manual" ? "Registro manual" : proposed.paymentEvidenceSource === "legacy" ? "Histórico importado" : "Não identificada"}</dd></div>
    <div><dt className="text-white/50">Vigência</dt><dd>{proposed.cycleEndsAtIso ? new Date(proposed.cycleEndsAtIso).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "Não informada"}</dd></div>
    <div className="sm:col-span-2"><dt className="text-white/50">Referência do relatório</dt><dd className="break-all">{proposed.sourceReference}</dd></div>
  </dl>;
}

function FactList({ facts }: { facts: Record<string, string | number | boolean> }) {
  return (
    <ul className="space-y-1 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 text-[11px] text-white/70">
      {Object.entries(facts).map(([k, v]) => (
        <li key={k} className="flex justify-between gap-3">
          <span className="text-white/45">{k}</span>
          <span className="max-w-[55%] break-all text-right text-white/80">{typeof v === "boolean" ? (v ? "Sim" : "Não") : v}</span>
        </li>
      ))}
    </ul>
  );
}
