"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AlertCircle,
  Target,
  ClipboardList,
  Megaphone,
  Check,
  X,
  Zap,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { AgentActionRow } from "@/lib/growth/db/agent-actions-write";

// -----------------------------------------------------------------------------
// AgentActionsInbox — Lista de ações pendentes do Agent Core com aprovação,
// rejeição (com motivo) e marca-como-executada. Fluxo F1 do sprint comercial.
//
// Server contract (handlers em agent-actions-route.ts):
//   POST /api/admin/growth/agent-actions/[id]/approve  → 200/404/409
//   POST /api/admin/growth/agent-actions/[id]/reject   → body { reason } obrigatório
//   POST /api/admin/growth/agent-actions/[id]/execute  → body { executionRef? }
// -----------------------------------------------------------------------------

type ActionBusy =
  | { phase: "idle" }
  | { phase: "confirming-reject"; reason: string }
  | { phase: "confirming-execute"; executionRef: string }
  | { phase: "pending" }
  | { phase: "error"; message: string };

export function AgentActionsInbox({ initialActions, emptyMessage = "Nenhuma recomendação aguardando revisão." }: { initialActions: AgentActionRow[]; emptyMessage?: string }) {
  const [actions, setActions] = useState<AgentActionRow[]>(initialActions);
  const [busy, setBusy] = useState<Record<string, ActionBusy>>({});
  const [toast, setToast] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const kindPriority: Record<AgentActionRow["kind"], number> = {
      alert: 0,
      opportunity: 1,
      followup_task: 2,
      campaign_draft: 3,
    };
    return [...actions].sort((a, b) => {
      const kindDiff = kindPriority[a.kind] - kindPriority[b.kind];
      if (kindDiff !== 0) return kindDiff;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [actions]);

  const removeAction = useCallback((id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
    setBusy((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const setPhase = useCallback((id: string, phase: ActionBusy) => {
    setBusy((prev) => ({ ...prev, [id]: phase }));
  }, []);

  const handleTransition = useCallback(
    async (
      id: string,
      verb: "approve" | "reject" | "execute",
      body: Record<string, unknown>,
      successToast: string,
    ) => {
      setPhase(id, { phase: "pending" });
      try {
        const response = await fetch(`/api/admin/growth/agent-actions/${id}/${verb}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "same-origin",
        });
        if (!response.ok) {
          const err = (await response.json().catch(() => ({}))) as { error?: string };
          setPhase(id, { phase: "error", message: err.error ?? `Erro ${response.status}` });
          return;
        }
        setToast(successToast);
        removeAction(id);
      } catch (error) {
        setPhase(id, {
          phase: "error",
          message: error instanceof Error ? error.message : "Erro de rede",
        });
      }
    },
    [setPhase, removeAction],
  );

  if (sorted.length === 0) {
    return (
      <section className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm text-white/60">
        {emptyMessage}
      </section>
    );
  }

  return (
    <>
      {toast ? (
        <div
          role="status"
          className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.04] px-4 py-2 text-sm text-emerald-200"
        >
          <Check size={14} />
          {toast}
        </div>
      ) : null}

      <ul className="dgn-inbox-list mt-6" data-testid="agent-actions-inbox">
        {sorted.map((a) => (
          <ActionCard
            key={a.id}
            action={a}
            state={busy[a.id] ?? { phase: "idle" }}
            onApprove={(reason) =>
              handleTransition(a.id, "approve", { reason: reason || null }, "Ação aprovada.")
            }
            onReject={(reason) =>
              handleTransition(a.id, "reject", { reason }, "Ação rejeitada.")
            }
            onExecute={(ref) =>
              handleTransition(
                a.id,
                "execute",
                { executionRef: ref || null },
                "Ação marcada como executada.",
              )
            }
            setPhase={(phase) => setPhase(a.id, phase)}
          />
        ))}
      </ul>
    </>
  );
}

const KIND_LABELS: Record<AgentActionRow["kind"], string> = {
  alert: "Alerta",
  opportunity: "Oportunidade",
  followup_task: "Acompanhamento",
  campaign_draft: "Campanha",
};

function KindIcon({ kind }: { kind: AgentActionRow["kind"] }) {
  if (kind === "alert") return <AlertCircle size={14} className="text-amber-200" />;
  if (kind === "opportunity") return <Target size={14} className="text-[#E7C96A]" />;
  if (kind === "followup_task") return <ClipboardList size={14} className="text-white/70" />;
  return <Megaphone size={14} className="text-white/70" />;
}

function ActionCard({
  action,
  state,
  onApprove,
  onReject,
  onExecute,
  setPhase,
}: {
  action: AgentActionRow;
  state: ActionBusy;
  onApprove: (reason: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onExecute: (ref: string) => Promise<void>;
  setPhase: (phase: ActionBusy) => void;
}) {
  const isPending = state.phase === "pending";

  return (
    <li
      className="dgn-inbox-action"
      id={`action-${action.id}`}
      data-testid={`agent-action-${action.id}`}
    >
      <div className="dgn-inbox-meta">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/80">
          <KindIcon kind={action.kind} />
          {KIND_LABELS[action.kind]}
        </span>
        <span className="text-xs text-white/45">{{ pending_review: "Revisão pendente", approved: "Aprovada · execução não registrada", executed: "Execução registrada", rejected: "Rejeitada", archived: "Arquivada" }[action.status]}</span>
      </div>

      <h3 className="mt-3 text-base font-semibold text-white">{action.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-white/70">{action.recommendation}</p>

      <dl className="mt-3 grid gap-2 text-xs text-white/55 sm:grid-cols-2">
        <div>
          <dt className="font-semibold uppercase tracking-[0.12em] text-white/40">Motivo</dt>
          <dd className="mt-0.5 text-white/70">{action.reason}</dd>
        </div>
        {action.expectedBenefit ? (
          <div>
            <dt className="font-semibold uppercase tracking-[0.12em] text-white/40">
              Benefício esperado
            </dt>
            <dd className="mt-0.5 text-white/70">{action.expectedBenefit}</dd>
          </div>
        ) : null}
        {action.nextStep ? (
          <div className="sm:col-span-2">
            <dt className="font-semibold uppercase tracking-[0.12em] text-white/40">
              Próximo passo
            </dt>
            <dd className="mt-0.5 text-white/70">{action.nextStep}</dd>
          </div>
        ) : null}
      </dl>

      {action.executionRef ? <p className="mt-3 text-xs text-white/60">Registro: {action.executionRef}</p> : null}
      {action.reviewReason ? <p className="mt-2 text-xs text-white/60">Decisão: {action.reviewReason}</p> : null}

      {state.phase === "error" ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-300/[0.03] p-2 text-xs text-amber-200">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{state.message}</span>
        </div>
      ) : null}

      {!["pending_review", "approved"].includes(action.status) ? null : state.phase === "confirming-reject" ? (
        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor={`reject-${action.id}`} className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
            Motivo da rejeição
          </label>
          <textarea
            id={`reject-${action.id}`}
            required
            className="min-h-20 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-sm text-white placeholder:text-white/30 focus:border-[#C9A84C]/40 focus:outline-none"
            value={state.reason}
            onChange={(e) => setPhase({ phase: "confirming-reject", reason: e.target.value })}
            placeholder="Ex: cliente já informou que não tem interesse."
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPhase({ phase: "idle" })}
              className="min-h-10 rounded-lg border border-white/10 px-3 text-sm text-white/70 hover:bg-white/[0.04]"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!state.reason.trim()}
              onClick={() => onReject(state.reason.trim())}
              className="min-h-10 rounded-lg border border-amber-300/30 bg-amber-300/[0.08] px-3 text-sm font-medium text-amber-200 transition hover:bg-amber-300/[0.14] disabled:opacity-40"
              data-testid="confirm-reject"
            >
              Confirmar rejeição
            </button>
          </div>
        </div>
      ) : state.phase === "confirming-execute" ? (
        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor={`execute-${action.id}`} className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
            Registro da execução (opcional)
          </label>
          <input
            id={`execute-${action.id}`}
            type="text"
            className="min-h-10 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-sm text-white placeholder:text-white/30 focus:border-[#C9A84C]/40 focus:outline-none"
            value={state.executionRef}
            onChange={(e) =>
              setPhase({ phase: "confirming-execute", executionRef: e.target.value })
            }
            placeholder="Link ou observação do contato realizado"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPhase({ phase: "idle" })}
              className="min-h-10 rounded-lg border border-white/10 px-3 text-sm text-white/70 hover:bg-white/[0.04]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onExecute(state.executionRef.trim())}
              className="min-h-10 rounded-lg border border-emerald-300/30 bg-emerald-300/[0.08] px-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-300/[0.14]"
              data-testid="confirm-execute"
            >
              Confirmar execução
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3"><p className="text-xs text-white/45">Aprovar registra sua decisão. Registre a execução após realizar a ação.</p><div className="flex flex-wrap gap-2" data-testid="action-buttons">
          {action.status === "pending_review" ? <><button
            type="button"
            disabled={isPending}
            onClick={() => onApprove("")}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A84C] bg-[#C9A84C] px-3 text-sm font-semibold text-[#111] transition hover:bg-[#dfbf63] disabled:opacity-40"
            data-testid="btn-approve"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Aprovar ação
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setPhase({ phase: "confirming-reject", reason: "" })}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.06] disabled:opacity-40"
            data-testid="btn-reject"
          >
            <X size={14} />
            Rejeitar
          </button>
          </> : null}
          <button
            type="button"
            disabled={isPending}
            onClick={() => setPhase({ phase: "confirming-execute", executionRef: "" })}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-emerald-300/30 bg-emerald-300/[0.04] px-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-300/[0.10] disabled:opacity-40"
            data-testid="btn-execute"
          >
            <Zap size={14} />
            Registrar execução
          </button>
        </div></div>
      )}
    </li>
  );
}
