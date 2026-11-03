"use client";

import { ReportInput } from "./ReportInput";
import * as Dialog from "@radix-ui/react-dialog";
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

const BADGE_STYLE: Record<ReconcileClassification, { label: string; tone: string }> = {
  ALREADY_CORRECT:         { label: "Correto",             tone: "border-emerald-300/30 bg-emerald-300/[0.06] text-emerald-200" },
  PROMOTE_EXISTING:        { label: "Ativar existente",            tone: "border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#E7C96A]" },
  CREATE_NEW:              { label: "Criar",               tone: "border-sky-300/30 bg-sky-300/[0.08] text-sky-200" },
  UPDATE_EXISTING_REVIEW:  { label: "Revisar",             tone: "border-white/20 bg-white/[0.04] text-white/80" },
  RENEWAL_PENDING:         { label: "Renovação pendente",  tone: "border-amber-300/30 bg-amber-300/[0.06] text-amber-200" },
  CUSTOMER_NOT_FOUND:      { label: "Não encontrado",      tone: "border-white/10 bg-white/[0.02] text-white/50" },
  POSSIBLE_MATCH:          { label: "Correspondência incerta",       tone: "border-amber-400/30 bg-amber-400/[0.06] text-amber-200" },
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
    <div className="flex flex-col gap-5">
      <ol className="dgn-reconcile-steps" aria-label="Etapas da reconciliação">
        <li aria-current={!preview ? "step" : undefined}><span>1</span> Selecionar relatório</li>
        <li aria-current={preview && selectedCount === 0 ? "step" : undefined}><span>2</span> Analisar divergências</li>
        <li aria-current={selectedCount > 0 ? "step" : undefined}><span>3</span> Revisar alterações</li>
      </ol>
      <ReportInput text={text} onChange={(value) => {
        setText(value); setPreview(null); setSelected({}); setExpanded({});
        setApplyResults(null); setConfirmOpen(false); setError(null);
      }} onAnalyze={() => analyze()} loading={loading} disabled={applying} />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-400/[0.05] p-4 text-sm text-red-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span role="alert">{commercialText(error)}</span>
        </div>
      )}

      {preview && counts && (
        <>
          <section className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5">
            <h2 className="text-sm font-semibold">Resultado da análise</h2>
            <p className="mt-1 text-sm text-white/85">{preview.totalRows} {preview.totalRows === 1 ? "linha analisada" : "linhas analisadas"}. Revise as divergências antes de selecionar alterações.</p>
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
                Fonte: {preview.dataOrigin === "db" ? "Base operacional" : preview.dataOrigin === "json-fallback" ? "Base local · fonte principal indisponível" : "Base local"}
              </p>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={selectedCount === 0 || applying}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 text-sm font-semibold text-[#E7C96A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Revisar seleção ({selectedCount})
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#101010]">
            <table className="dgn-reconcile-table text-left text-sm">
              <thead className="bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                <tr>
                  <th className="w-18 px-3 py-3"><span className="sr-only">Detalhes</span></th>
                  <th className="w-18 px-3 py-3"><span className="sr-only">Selecionar</span></th>
                  <th className="px-3 py-3">Cliente no relatório</th>
                  <th className="px-3 py-3">Cliente cadastrado</th>
                  <th className="px-3 py-3">Plano informado</th>
                  <th className="px-3 py-3">Plano cadastrado</th>
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
        {counts.proceed} aplicado(s) · {counts.stale} análise desatualizada · {counts.reviewExisting} assinatura equivalente para revisão · {counts.alreadyCorrect} já correto(s) · {counts.failed} falha(s)
      </p>
      <p className="mt-1 text-[11px] text-white/50">As linhas foram revalidadas antes da atualização. Cobranças PagBank não foram alteradas.</p>
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
                <span className="text-white/40">→ {r.action === "PROMOTE_EXISTING" ? "Ativar assinatura existente" : r.action === "CREATE_NEW" ? "Criar assinatura manual" : "Sem alteração"}</span>
              </div>
              {r.reason && <p className="text-[11px] text-white/60">{commercialText(r.reason)}</p>}
              {r.error && <p className="text-[11px] text-red-300">{commercialText(r.error)}</p>}
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
    <Dialog.Root open onOpenChange={open => { if (!open && !applying) onCancel(); }}>
      <Dialog.Portal>
        <div className="dgn-workspace">
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <Dialog.Content aria-describedby="reconcile-confirm-description" className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0F0F0F] p-6" onEscapeKeyDown={event => { if (applying) event.preventDefault(); }} onInteractOutside={event => { if (applying) event.preventDefault(); }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">Revisão final</p>
            <Dialog.Title asChild><h2 className="mt-1 text-lg font-semibold text-white">Confirmar {plan.total} {plan.total === 1 ? "alteração" : "alterações"}?</h2></Dialog.Title>
          </div>
          <button type="button" onClick={onCancel} disabled={applying} aria-label="Fechar" className="text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <ul className="mt-4 space-y-1 text-sm text-white/80">
          {plan.promotes > 0 ? <li>· {plan.promotes} {plan.promotes === 1 ? "assinatura existente será ativada" : "assinaturas existentes serão ativadas"}</li> : null}
          {plan.creates > 0 ? <li>· {plan.creates} {plan.creates === 1 ? "assinatura manual será criada" : "assinaturas manuais serão criadas"}</li> : null}
          <li>· nenhuma cobrança PagBank será modificada</li>
        </ul>
        <p id="reconcile-confirm-description" className="mt-3 text-[11px] text-white/50">
          Cada linha será conferida novamente. Se os dados tiverem mudado desde a análise, a alteração será bloqueada para nova revisão.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={applying} className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-sm font-semibold text-white/80">
            Cancelar
          </button>
          <button
            type="button" onClick={onConfirm} disabled={applying}
            className="min-h-11 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-2 text-sm font-semibold text-[#E7C96A] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {applying ? "Atualizando…" : "Confirmar alterações"}
          </button>
        </div>
        </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
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
            aria-controls={`reconcile-detail-${item.rowIndex}`}
            aria-label={`${isOpen ? "Fechar" : "Abrir"} detalhes de ${item.input.name ?? `linha ${item.rowIndex + 1}`}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.06] text-white/60 hover:text-white"
          >
            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        </td>
        <td className="px-3 py-3 align-top">
          <label className="inline-flex h-11 w-11 items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            disabled={!item.applyEnabled}
            aria-label={`Selecionar alteração de ${item.input.name ?? `linha ${item.rowIndex + 1}`}`}
            className="h-4 w-4 disabled:cursor-not-allowed disabled:opacity-30"
          />
          </label>
        </td>
        <td data-label="Cliente no relatório" className="px-3 py-3 align-top text-white/85">{item.input.name ?? <span className="text-white/40">—</span>}</td>
        <td data-label="Cliente cadastrado" className="px-3 py-3 align-top text-white/70">{item.customer.customerName ?? <span className="text-white/40">—</span>}</td>
        <td data-label="Plano informado" className="px-3 py-3 align-top text-white/70">{item.input.plan ?? "—"}</td>
        <td data-label="Plano cadastrado" className="px-3 py-3 align-top text-white/70">{item.facts.planCanonical ?? "—"}</td>
        <td data-label="Situação informada" className="px-3 py-3 align-top text-white/70">{item.input.status ?? "—"}</td>
        <td className="px-3 py-3 align-top">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${badge.tone}`}>
            {badge.label}
          </span>
        </td>
      </tr>
      {isOpen && (
        <tr id={`reconcile-detail-${item.rowIndex}`} className="border-t border-white/[0.04] bg-white/[0.015]">
          <td colSpan={8} className="px-6 py-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Detalhes da divergência</p>
            <p className="mt-1 text-sm text-white/85">{commercialText(item.reason)}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <FactList facts={{
                "Telefone corresponde": item.facts.matchedByPhone,
                "Placa corresponde": item.facts.matchedByPlate,
                "Referência anterior corresponde": item.facts.matchedByLegacyId,
                "Nome corresponde": item.facts.matchedByName,
                "Nome semelhante": item.facts.fuzzyName,
              }} />
              <FactList facts={{
                "Referência do cliente": item.customer.customerId ?? "—",
                "Correspondências incertas": item.facts.ambiguousCandidates,
                "Referência da assinatura": item.facts.subscriptionMatch?.subscriptionId ?? "—",
                "Vinculada ao PagBank": item.facts.subscriptionMatch?.providerLinked ?? false,
                "Assinaturas encontradas": item.facts.subscriptionMatch?.candidatesCount ?? 0,
              }} />
            </div></details>
            {(item.facts.divergingFields.length > 0 || item.facts.missingFields.length > 0) && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {item.facts.divergingFields.length > 0 && (
                  <p className="text-[11px] text-amber-200">Divergências: {item.facts.divergingFields.map(commercialText).join(", ")}</p>
                )}
                {item.facts.missingFields.length > 0 && (
                  <p className="text-[11px] text-amber-200">Campos ausentes: {item.facts.missingFields.map(commercialText).join(", ")}</p>
                )}
              </div>
            )}
            {item.proposed && (
              <div className="mt-3 rounded-lg border border-[#C9A84C]/20 bg-[#C9A84C]/[0.04] p-3 text-[11px] text-[#E7C96A]">
                <p className="font-medium">{item.proposed.kind === "PROMOTE_EXISTING" ? "Ativar a assinatura existente" : "Criar uma assinatura manual"}</p>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  {item.proposed.kind === "CREATE_NEW" ? <div><dt className="text-white/50">Plano</dt><dd>{item.proposed.plan}</dd></div> : null}
                  <div><dt className="text-white/50">Vigência informada</dt><dd>{item.proposed.cycleEndsAtIso ? new Date(item.proposed.cycleEndsAtIso).toLocaleDateString("pt-BR") : "Não informada"}</dd></div>
                  <div><dt className="text-white/50">Pagamento informado</dt><dd>{item.proposed.paymentStatus === "confirmed" ? "Confirmado no relatório" : "Não identificado"}</dd></div>
                </dl>
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
          <span className="font-mono text-white/80">{typeof v === "boolean" ? (v ? "Sim" : "Não") : v}</span>
        </li>
      ))}
    </ul>
  );
}

function commercialText(text: string): string {
  const terms: Record<string, string> = {
    "PROMOTE_EXISTING": "ativar assinatura existente", "CREATE_NEW": "criar assinatura manual",
    "ALREADY_CORRECT": "sem divergência", "UPDATE_EXISTING_REVIEW": "revisar assinatura existente",
    "CUSTOMER_NOT_FOUND": "cliente não encontrado", "POSSIBLE_MATCH": "correspondência incerta",
    "RENEWAL_PENDING": "renovação pendente", "CONFLICT": "conflito",
    "plan": "plano", "cycle_ends_at": "vigência", "paid_until": "vigência",
    "payment_status": "situação do pagamento", "subscription_id": "assinatura",
    "base canônica": "cadastros atuais", "snapshot canônico": "cadastros atuais",
    "canônico": "cadastrado", "canônica": "cadastrada", "Customer": "Cliente",
    "subscription": "assinatura", "preview": "análise", "apply": "atualização",
    "write": "alteração", "phone": "telefone", "plate": "placa", "status": "situação",
  };
  let result = text;
  for (const [term, label] of Object.entries(terms)) result = result.replace(new RegExp(`\\b${term}\\b`, "g"), label);
  return result;
}
