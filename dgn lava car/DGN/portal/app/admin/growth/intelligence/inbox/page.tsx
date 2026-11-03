import { listAgentActions, type AgentActionRow, type AgentActionStatus } from "@/lib/growth/db/agent-actions-write";
import { AgentActionsInbox } from "@/components/growth/AgentActionsInbox";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type InitialState =
  | { kind: "ok"; actions: AgentActionRow[] }
  | { kind: "error"; message: string };

const stages = [
  { status: "pending_review", label: "Para revisar", empty: "Nenhuma recomendação aguardando revisão." },
  { status: "approved", label: "Aprovadas", empty: "Nenhuma ação aprovada." },
  { status: "executed", label: "Execuções registradas", empty: "Nenhuma execução registrada." },
  { status: "rejected", label: "Rejeitadas", empty: "Nenhuma ação rejeitada." },
] as const;

async function loadInitialState(status: AgentActionStatus): Promise<InitialState> {
  try {
    const actions = await listAgentActions({ status, limit: 100 });
    return { kind: "ok", actions };
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Erro inesperado ao ler agent_actions.",
    };
  }
}

export default async function IntelligenceInboxPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const stage = stages.find(stage => stage.status === params.status) ?? stages[0];
  const initial = await loadInitialState(stage.status);

  return (
    <div className="dgn-page">
      <div>
        <header className="flex flex-col gap-3 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
              Inteligência DGN
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Oportunidades comerciais
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
              Revise as recomendações e decida o próximo passo.
            </p>
          </div>
          <Link
            href="/admin/growth"
            className="inline-flex min-h-11 items-center self-start rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
          >
            Visão geral
          </Link>
        </header>

        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Etapas das ações comerciais">
          {stages.map(item => <Link key={item.status} href={`/admin/growth/intelligence/inbox?status=${item.status}`} aria-current={stage.status === item.status ? "page" : undefined} className={`dgn-button ${stage.status === item.status ? "border-[#C9A84C]/40 text-[#e7c96a]" : ""}`}>{item.label}</Link>)}
        </nav>

        {initial.kind === "error" ? (
          <section className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.03] p-4 text-sm text-amber-200/90">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                Oportunidades indisponíveis
              </p>
              <p className="mt-1 leading-relaxed">
                Não foi possível carregar as recomendações. Tente novamente mais tarde.
              </p>
            </div>
          </section>
        ) : (
          <AgentActionsInbox key={stage.status} initialActions={initial.actions} emptyMessage={stage.empty} />
        )}
      </div>
    </div>
  );
}
