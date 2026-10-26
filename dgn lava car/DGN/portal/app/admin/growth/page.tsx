import Link from "next/link";
import { loadGrowthData, readGrowthSnapshot } from "@/lib/growth/db/growth-reader";
import { getSupabaseAdminClient } from "@/lib/growth/db/admin-client";
import { KNOWN_SUBSCRIBERS_2026_08_16 } from "@/lib/growth/known-subscribers";
import { getCanonicalActiveSubscriberMetrics } from "@/lib/growth/canonical-subscribers";
import type { DgnCustomer } from "@/lib/growth/dgn-growth-data";
import { buildAgentContext } from "@/lib/growth/agent/agent-context";
import { getDailyBriefing } from "@/lib/growth/agent/skills/daily-briefing";
import type { DailyBriefing } from "@/lib/growth/agent/types";
import { getActiveInvitesCount } from "@/lib/growth/founder-metrics";
import { getConfirmedFoundersCount } from "@/lib/growth/founder-metrics-server";
import { loadPulseSummary } from "@/lib/growth/db/pulse-summary";
import { listServiceRequests } from "@/lib/growth/db/corporate-fleet-write";
import type { AgentActionRow } from "@/lib/growth/db/agent-actions-write";
import { AlertTriangle, ArrowRight, Sparkles, Activity, Megaphone, Building2, UserCheck, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

type DashboardMetrics = {
  activeCustomers: number | null;
  activeSubscriptions: number | null;
  pendingRenewal: number;
  confirmedFounders: number;
  activeInvites: number;
  awaitingCuration: number;
  dataOrigin: "json" | "db" | "json-fallback";
  loadError: string | null;
};

// "Renovação pendente" continua vindo da base viva 4uCar — é sinal de
// vencimento em curto prazo, não contrato canônico. Fica ao lado de
// "Assinantes ativos" mas mede população diferente com label distinto.
async function computeMetrics(): Promise<DashboardMetrics> {
  const pendingRenewal = KNOWN_SUBSCRIBERS_2026_08_16.filter(
    (s) => s.status === "renovacao_pendente",
  ).length;
  const confirmedFounders = getConfirmedFoundersCount();

  try {
    const data = await loadGrowthData({ logger: console });
    // Contagem de LINHAS ativas (para separar "assinantes" de "assinaturas"):
    // vem do snapshot bruto quando estamos em modo DB — só assim distinguimos
    // customers com N subscriptions (padrão José Sergio).
    let activeSubscriptionRowCount: number | undefined;
    if (data.origin === "db") {
      const snapshot = await readGrowthSnapshot(getSupabaseAdminClient("dashboard.active-subs-count"));
      activeSubscriptionRowCount = (snapshot.subscriptions ?? []).filter((s) => (s as { is_active_subscriber?: unknown }).is_active_subscriber === true).length;
    }
    const metrics = getCanonicalActiveSubscriberMetrics(data.customers, { activeSubscriptionRowCount });
    const activeInvites = getActiveInvitesCount(data.customers);
    const awaitingCuration = data.customers.filter(
      (c: DgnCustomer) => c.commercialStatus === "Aguardando Curadoria DGN",
    ).length;
    return {
      activeCustomers: metrics.activeCustomers,
      activeSubscriptions: metrics.activeSubscriptions,
      pendingRenewal,
      confirmedFounders,
      activeInvites,
      awaitingCuration,
      dataOrigin: data.origin,
      loadError: null,
    };
  } catch (error) {
    // Sem leitura Supabase não temos como afirmar o número canônico —
    // preferimos exibir "—" a mostrar um valor derivado de outra fonte.
    return {
      activeCustomers: null,
      activeSubscriptions: null,
      pendingRenewal,
      confirmedFounders,
      activeInvites: 0,
      awaitingCuration: 0,
      dataOrigin: "json",
      loadError: error instanceof Error ? error.message : "Erro inesperado.",
    };
  }
}

async function loadBriefingSummary(): Promise<{ briefing: DailyBriefing | null; error: string | null }> {
  try {
    const ctx = await buildAgentContext();
    const result = getDailyBriefing(ctx);
    return { briefing: result.data ?? null, error: null };
  } catch (error) {
    return { briefing: null, error: error instanceof Error ? error.message : "Erro inesperado." };
  }
}

type FleetPending = {
  total: number;
  waitingUnit: number; // status = 'pending' — unidade precisa responder
  waitingManager: number; // status = 'counter_proposed' — gestor precisa decidir
  error: string | null;
};

// Contagem de solicitações corporativas que ainda aguardam decisão humana.
// Reutiliza o reader já existente (sem RPC nova) e trata ausência de tabela
// como "nenhuma pendência" para não quebrar o Dashboard antes das migrations
// de Frotas serem aplicadas em prod.
async function loadFleetPending(): Promise<FleetPending> {
  try {
    const rows = await listServiceRequests({ status: ["pending", "counter_proposed"], limit: 200 });
    const waitingUnit = rows.filter((r) => r.status === "pending").length;
    const waitingManager = rows.filter((r) => r.status === "counter_proposed").length;
    return { total: rows.length, waitingUnit, waitingManager, error: null };
  } catch (error) {
    return { total: 0, waitingUnit: 0, waitingManager: 0, error: error instanceof Error ? error.message : "indisponivel" };
  }
}

export default async function DgnAdminDashboardPage() {
  const [m, briefingSummary, pulse, fleetPending] = await Promise.all([
    computeMetrics(), loadBriefingSummary(), loadPulseSummary({ topN: 3 }), loadFleetPending(),
  ]);
  const commercialActions = pulse.topActions.filter(a => a.kind === "opportunity" || a.kind === "campaign_draft");
  const operations = pulse.topActions.filter(a => a.kind === "alert" || a.kind === "followup_task");
  const commercialCount = pulse.counts.opportunity + pulse.counts.campaignDraft;
  const operationalCount = pulse.counts.alert + pulse.counts.followupTask;

  return (
    <div className="dgn-page dgn-dashboard">
      <header className="dgn-page-header dgn-dashboard-header">
        <h1>Visão Geral</h1>
        <Link href="/admin/growth/assistente" className="dgn-link"><Sparkles size={15} /> Assistente</Link>
      </header>

      {m.loadError ? (
        <div role="status" className="dgn-notice">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          Indicadores de assinantes, convites e curadoria indisponíveis no momento.
        </div>
      ) : null}

      <section className="dgn-stats" aria-label="Indicadores comerciais" data-testid="dashboard-subscriptions">
        <Metric label="Assinantes ativos" value={m.activeCustomers} testid="metric-active-subscribers"
          hint={m.activeSubscriptions !== null ? `${m.activeSubscriptions} assinaturas ativas` : undefined} />
        <Metric label="Founders confirmados" value={m.confirmedFounders} testid="metric-confirmed-founders" />
        <Metric label="Convites em aberto" value={m.loadError ? null : m.activeInvites} testid="metric-active-invites" />
        <Metric label="Aguardando curadoria" value={m.loadError ? null : m.awaitingCuration} testid="metric-awaiting-curation" />
        <Metric label="Renovação pendente" value={m.pendingRenewal} testid="metric-pending-renewal" hint="Relatório de 16/08/2026" />
      </section>

      <div className="dgn-dashboard-work">
        <section className="dgn-panel" aria-labelledby="dashboard-attention">
          <div className="dgn-panel-heading">
            <h2 id="dashboard-attention" className="dgn-section-title">Precisa da sua atenção</h2>
            <Link href="/admin/growth/intelligence/inbox" className="dgn-text-link">Ver ações <ArrowRight size={14} /></Link>
          </div>

          <Task icon={<Sparkles size={18} />} title="Inteligência comercial"
            detail={briefingSummary.error ? "Recomendações indisponíveis no momento." : `${briefingSummary.briefing?.totalOpportunities ?? 0} sinais identificados para análise.`}
            href="/admin/growth/assistente" action="Ver prioridades" />

          {!pulse.loadError && commercialCount > 0 ? (
            <div data-testid="dashboard-campaigns">
              <Task icon={<Megaphone size={18} />} title="Campanhas e oportunidades"
                detail={`${pulse.counts.campaignDraft} campanhas aguardando aprovação · ${pulse.counts.opportunity} oportunidades para revisar`}
                href="/admin/growth/intelligence/inbox" action="Revisar ações" />
              {commercialActions.length ? <ul className="mx-6 mb-4 divide-y divide-white/[0.06]">{commercialActions.map(a => <ActionRow key={a.id} action={a} />)}</ul> : null}
            </div>
          ) : null}

          {!m.loadError && m.awaitingCuration > 0 ? (
            <Task icon={<UserCheck size={18} />} title="Clientes aguardando curadoria"
              detail={`${m.awaitingCuration} clientes para avaliar.`} href="/admin/growth/curadoria" action="Abrir curadoria" />
          ) : null}

          {!fleetPending.error && fleetPending.total > 0 ? (
            <div data-testid="dashboard-fleet">
              <Task icon={<Building2 size={18} />} title="Solicitações de frotas"
                detail={`${fleetPending.waitingUnit} aguardando a unidade · ${fleetPending.waitingManager} aguardando o gestor`}
                href="/admin/growth/empresas" action="Ver solicitações" />
            </div>
          ) : null}

          {!pulse.loadError && commercialCount === 0 && !m.loadError && m.awaitingCuration === 0 && !fleetPending.error && fleetPending.total === 0 ? (
            <p className="dgn-muted px-6 py-5">Nenhuma campanha, curadoria ou solicitação aguardando revisão.</p>
          ) : null}
          {pulse.loadError ? <p className="dgn-muted px-6 py-4">A fila de ações está indisponível no momento.</p> : null}
        </section>

        <aside className="dgn-panel" aria-labelledby="dashboard-modules">
          <div className="dgn-panel-heading"><h2 id="dashboard-modules" className="dgn-section-title">Acessos rápidos</h2></div>
          <nav className="dgn-module-links" aria-label="Módulos comerciais">
            <Link href="/admin/growth/assinantes-detectados"><span className="flex items-center gap-3"><ShieldCheck size={16} className="text-white/45" /> Assinantes</span><ArrowRight size={14} /></Link>
            <Link href="/admin/growth/intelligence"><span className="flex items-center gap-3"><UserCheck size={16} className="text-white/45" /> Clientes e oportunidades</span><ArrowRight size={14} /></Link>
            <Link href="/admin/growth/founders-2026"><span>Campanha Founders</span><ArrowRight size={14} /></Link>
            <Link href="/admin/growth/empresas"><span className="flex items-center gap-3"><Building2 size={16} className="text-white/45" /> Gestão de frotas</span><ArrowRight size={14} /></Link>
          </nav>
        </aside>
      </div>

      <section className="dgn-operations" aria-labelledby="dashboard-pulse" data-testid="dashboard-pulse">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="dashboard-pulse" className="dgn-section-title flex items-center gap-2"><Activity size={15} className="text-white/45" /> Operação</h2>
          <Link href="/admin/growth/intelligence/inbox" className="dgn-text-link">Abrir pendências <ArrowRight size={14} /></Link>
        </div>
        <p className="dgn-muted" data-testid="dashboard-pulse-headline">
          {pulse.loadError ? "Pendências operacionais indisponíveis no momento." : `${operationalCount} pendências · ${pulse.counts.alert} alertas · ${pulse.counts.followupTask} acompanhamentos`}
        </p>
        {operations.length ? <ul data-testid="dashboard-pulse-top">{operations.map(a => <ActionRow key={a.id} action={a} />)}</ul> : null}
        {fleetPending.error ? <p className="dgn-muted mt-3">Solicitações de frotas indisponíveis no momento.</p> : null}
      </section>
      {m.dataOrigin !== "db" && !m.loadError ? <p className="mt-6 text-xs text-white/50">Exibindo dados locais. Consulte a operação antes de decidir.</p> : null}
    </div>
  );
}

function Metric({ label, value, hint, testid }: { label: string; value: number | null; hint?: string; testid: string }) {
  return <div className="dgn-stat" data-testid={testid}>
    <p className="dgn-stat-label">{label}</p>
    <p className="dgn-stat-value" data-testid={`${testid}-value`}>{value === null ? "—" : value}</p>
    {hint ? <p className="dgn-stat-hint">{hint}</p> : null}
  </div>;
}

function Task({ icon, title, detail, href, action }: { icon: React.ReactNode; title: string; detail: string; href: string; action: string }) {
  return <div className="dgn-task">
    <span className="dgn-task-icon">{icon}</span>
    <div><h3>{title}</h3><p>{detail}</p></div>
    <Link href={href} className="dgn-text-link">{action}<ArrowRight size={13} /></Link>
  </div>;
}

function ActionRow({ action }: { action: AgentActionRow }) {
  return <li className="dgn-operation-row">
    <div className="min-w-0"><span className="font-medium text-white/85">{action.title}</span><p>{action.recommendation}</p></div>
    <Link href="/admin/growth/intelligence/inbox" aria-label={`Revisar: ${action.title}`} className="dgn-text-link"><ArrowRight size={15} /></Link>
  </li>;
}
