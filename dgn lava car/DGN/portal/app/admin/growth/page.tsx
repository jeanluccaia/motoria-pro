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
import { loadPulseSummary, type PulseSummary } from "@/lib/growth/db/pulse-summary";
import { listServiceRequests } from "@/lib/growth/db/corporate-fleet-write";
import type { AgentActionRow } from "@/lib/growth/db/agent-actions-write";
import { AlertTriangle, ArrowRight, Sparkles, Activity, AlertCircle, Megaphone, ClipboardList, Building2 } from "lucide-react";

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
    computeMetrics(),
    loadBriefingSummary(),
    loadPulseSummary({ topN: 3 }),
    loadFleetPending(),
  ]);

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-white/[0.06] pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Visão geral
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Painel comercial DGN
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
            Receita recorrente, oportunidades e solicitações corporativas em uma única visão. Todos os números vêm da operação atual — nada é estimado ou projetado.
          </p>
        </header>

        {m.loadError ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.03] p-4 text-sm text-amber-200/90">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                Fonte de dados indisponível
              </p>
              <p className="mt-1 leading-relaxed">
                Curadoria e convites não carregaram — mostrando apenas números da base
                consolidada.
                <span className="ml-1 text-amber-200/60">({m.loadError})</span>
              </p>
            </div>
          </div>
        ) : null}

        <SubscriptionsBlock metrics={m} />

        <IntelligenceCard briefing={briefingSummary.briefing} error={briefingSummary.error} />

        <CampaignsBlock pulse={pulse} />

        <FleetBlock fleet={fleetPending} />

        <OperationsBlock pulse={pulse} />

        <p className="mt-6 text-[11px] text-white/40">
          Fonte:{" "}
          {m.dataOrigin === "db"
            ? "Supabase (operação em tempo real)"
            : m.dataOrigin === "json-fallback"
              ? "JSON local (fallback temporário)"
              : "JSON local"}
        </p>
      </div>
    </div>
  );
}

function SubscriptionsBlock({ metrics: m }: { metrics: DashboardMetrics }) {
  return (
    <section
      aria-labelledby="dashboard-subscriptions"
      className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5"
      data-testid="dashboard-subscriptions"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p id="dashboard-subscriptions" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
            Receita recorrente
          </p>
          <p className="mt-1 text-sm text-white/60">Assinantes e assinaturas ativas, base viva.</p>
        </div>
        <Link
          href="/admin/growth/assinantes-detectados"
          className="hidden sm:inline-flex items-center gap-1.5 self-start rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/[0.08]"
        >
          Ver assinantes
          <ArrowRight size={12} />
        </Link>
      </div>
      <div
        className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        data-testid="dashboard-metrics"
      >
        <MetricCard
          label="Assinantes ativos"
          value={m.activeCustomers}
          hint={
            m.activeSubscriptions !== null && m.activeCustomers !== null && m.activeSubscriptions > m.activeCustomers
              ? `${m.activeSubscriptions} assinaturas ativas`
              : "Fonte: crm_subscriptions"
          }
          testid="metric-active-subscribers"
        />
        <MetricCard label="Founders confirmados" value={m.confirmedFounders} tone="gold" testid="metric-confirmed-founders" />
        <MetricCard label="Convites em aberto" value={m.activeInvites} tone="gold" hidden={m.loadError !== null} testid="metric-active-invites" />
        <MetricCard label="Aguardando curadoria" value={m.awaitingCuration} hidden={m.loadError !== null} testid="metric-awaiting-curation" />
        <MetricCard label="Renovação pendente" value={m.pendingRenewal} tone="warn" testid="metric-pending-renewal" />
      </div>
    </section>
  );
}

function CampaignsBlock({ pulse }: { pulse: PulseSummary }) {
  const draftCount = pulse.counts.campaignDraft;
  const opportunityCount = pulse.counts.opportunity;
  if (pulse.loadError) return null;
  if (draftCount === 0 && opportunityCount === 0) return null;

  const summary = [
    draftCount > 0 ? `${draftCount} ${draftCount === 1 ? "campanha" : "campanhas"} aguardando aprovação` : null,
    opportunityCount > 0 ? `${opportunityCount} ${opportunityCount === 1 ? "oportunidade" : "oportunidades"} para revisar` : null,
  ].filter(Boolean).join(" · ");

  return (
    <section
      aria-labelledby="dashboard-campaigns"
      className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#C9A84C]/15 bg-[#C9A84C]/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
      data-testid="dashboard-campaigns"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-[#C9A84C]">
          <Megaphone size={18} />
        </span>
        <div>
          <p id="dashboard-campaigns" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Campanhas e recomendações
          </p>
          <p className="mt-1 text-sm text-white/90">{summary}.</p>
          <p className="mt-1 text-xs text-white/50">Rascunhos preparados pelos agentes seguem para a sua aprovação antes de qualquer envio.</p>
        </div>
      </div>
      <Link
        href="/admin/growth/intelligence/inbox"
        className="inline-flex min-h-11 items-center justify-center gap-1.5 self-start rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-4 text-sm font-medium text-[#E7C96A] transition hover:bg-[#C9A84C]/[0.14]"
      >
        Revisar na Inbox
        <ArrowRight size={14} />
      </Link>
    </section>
  );
}

function FleetBlock({ fleet }: { fleet: FleetPending }) {
  if (fleet.error) return null;
  if (fleet.total === 0) return null;

  const parts: string[] = [];
  if (fleet.waitingUnit > 0) {
    parts.push(`${fleet.waitingUnit} ${fleet.waitingUnit === 1 ? "solicitação aguarda" : "solicitações aguardam"} a unidade`);
  }
  if (fleet.waitingManager > 0) {
    parts.push(`${fleet.waitingManager} ${fleet.waitingManager === 1 ? "contraproposta aguarda" : "contrapropostas aguardam"} o gestor`);
  }
  const summary = parts.join(" · ");

  return (
    <section
      aria-labelledby="dashboard-fleet"
      className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
      data-testid="dashboard-fleet"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-white/80">
          <Building2 size={18} />
        </span>
        <div>
          <p id="dashboard-fleet" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
            Gestão de frotas
          </p>
          <p className="mt-1 text-sm text-white/90" data-testid="dashboard-fleet-headline">{summary}.</p>
          <p className="mt-1 text-xs text-white/50">Solicitações corporativas pendentes de decisão humana.</p>
        </div>
      </div>
      <Link
        href="/admin/growth/empresas"
        className="inline-flex min-h-11 items-center justify-center gap-1.5 self-start rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/90 transition hover:bg-white/[0.08]"
      >
        Abrir empresas
        <ArrowRight size={14} />
      </Link>
    </section>
  );
}

function OperationsBlock({ pulse }: { pulse: PulseSummary }) {
  const operationalCount = pulse.counts.alert + pulse.counts.followupTask;
  if (pulse.loadError) {
    return <PulseOfTheDayCard pulse={pulse} />;
  }
  if (operationalCount === 0) return null;
  return <PulseOfTheDayCard pulse={pulse} />;
}

function IntelligenceCard({ briefing, error }: { briefing: DailyBriefing | null; error: string | null }) {
  const totalOpportunities = briefing?.totalOpportunities ?? 0;
  const displayed = briefing?.displayedPriorities ?? 0;

  const label = error
    ? "Inteligência indisponível agora"
    : totalOpportunities === 0
      ? "Nenhuma ação prioritária identificada"
      : totalOpportunities === displayed
        ? totalOpportunities === 1
          ? "1 ação merece atenção hoje"
          : `${totalOpportunities} ações merecem atenção hoje`
        : `${totalOpportunities} sinais encontrados · mostrando as ${displayed} maiores prioridades`;

  return (
    <section
      aria-labelledby="dashboard-intelligence"
      className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/12 text-[#C9A84C]">
          <Sparkles size={18} />
        </span>
        <div>
          <p id="dashboard-intelligence" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Inteligência DGN
          </p>
          <p className="mt-1 text-sm text-white/90">{label}</p>
          {briefing && !error ? (
            <p className="mt-1 text-xs text-white/50">
              {briefing.totals.founder} Founder · {briefing.totals.curation} Curadoria · {briefing.totals.subscriber} Assinantes
              {totalOpportunities === 0 ? " · sem sinais no momento" : ""}
            </p>
          ) : null}
        </div>
      </div>
      <Link
        href="/admin/growth/assistente"
        className="inline-flex min-h-11 items-center justify-center gap-1.5 self-start rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-4 text-sm font-medium text-[#E7C96A] transition hover:bg-[#C9A84C]/[0.14]"
      >
        Ver briefing
        <ArrowRight size={14} />
      </Link>
    </section>
  );
}

function PulseOfTheDayCard({ pulse }: { pulse: PulseSummary }) {
  const { totalPending, counts, topActions, loadError } = pulse;

  if (loadError) {
    return (
      <section
        aria-labelledby="dashboard-pulse"
        className="mt-4 flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5"
        data-testid="dashboard-pulse"
      >
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-white/40" />
          <p id="dashboard-pulse" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
            Operações do dia
          </p>
        </div>
        <p className="text-sm text-white/60">Agent Core indisponível agora.</p>
        <p className="text-[11px] text-white/40">{loadError}</p>
      </section>
    );
  }

  const operationalCount = counts.alert + counts.followupTask;
  const headline =
    operationalCount === 0
      ? "Nenhum alerta ou follow-up operacional pendente."
      : operationalCount === 1
        ? "1 pendência operacional aguarda sua revisão."
        : `${operationalCount} pendências operacionais aguardam sua revisão.`;

  return (
    <section
      aria-labelledby="dashboard-pulse"
      className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5"
      data-testid="dashboard-pulse"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-white/80">
            <Activity size={18} />
          </span>
          <div>
            <p id="dashboard-pulse" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
              Operações do dia
            </p>
            <p className="mt-1 text-sm text-white/90" data-testid="dashboard-pulse-headline">
              {headline}
            </p>
          </div>
        </div>
        {operationalCount > 0 ? (
          <Link
            href="/admin/growth/intelligence/inbox"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 self-start rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/90 transition hover:bg-white/[0.08]"
          >
            Revisar na Inbox
            <ArrowRight size={14} />
          </Link>
        ) : null}
      </div>

      {operationalCount > 0 ? (
        <div className="flex flex-wrap gap-2" data-testid="dashboard-pulse-counts">
          <KindChip icon={<AlertCircle size={12} />} label="Alertas" count={counts.alert} tone="warn" />
          <KindChip icon={<ClipboardList size={12} />} label="Follow-ups" count={counts.followupTask} tone="neutral" />
        </div>
      ) : null}

      {(() => {
        const operationalActions = topActions.filter(
          (a) => a.kind === "alert" || a.kind === "followup_task",
        );
        if (operationalActions.length === 0) return null;
        return (
          <ul className="mt-1 flex flex-col divide-y divide-white/[0.04] rounded-lg border border-white/[0.04] bg-white/[0.01]" data-testid="dashboard-pulse-top">
            {operationalActions.map((a) => (
              <PulseActionRow key={a.id} action={a} />
            ))}
          </ul>
        );
      })()}
    </section>
  );
}

function KindChip({
  icon,
  label,
  count,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  tone: "neutral" | "gold" | "warn";
}) {
  if (count === 0) return null;
  const toneClasses = {
    neutral: "border-white/10 bg-white/[0.04] text-white/80",
    gold: "border-[#C9A84C]/25 bg-[#C9A84C]/[0.06] text-[#E7C96A]",
    warn: "border-amber-300/25 bg-amber-300/[0.04] text-amber-200",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${toneClasses}`}>
      {icon}
      <span className="tabular-nums font-semibold">{count}</span>
      <span>{label}</span>
    </span>
  );
}

function PulseActionRow({ action }: { action: AgentActionRow }) {
  const kindLabel: Record<AgentActionRow["kind"], string> = {
    alert: "Alerta",
    opportunity: "Oportunidade",
    followup_task: "Follow-up",
    campaign_draft: "Campanha",
  };
  const kindTone: Record<AgentActionRow["kind"], string> = {
    alert: "text-amber-200",
    opportunity: "text-[#E7C96A]",
    followup_task: "text-white/70",
    campaign_draft: "text-white/70",
  };
  return (
    <li className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${kindTone[action.kind]}`}>
          {kindLabel[action.kind]}
        </p>
        <p className="mt-0.5 truncate text-sm text-white/90">{action.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-white/55">{action.recommendation}</p>
      </div>
    </li>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
  hidden = false,
  testid,
}: {
  label: string;
  value: number | null;
  hint?: string;
  tone?: "neutral" | "gold" | "warn";
  hidden?: boolean;
  testid?: string;
}) {
  if (hidden) return null;
  const toneClasses = {
    neutral: "border-white/[0.08] bg-white/[0.02] text-white",
    gold: "border-[#C9A84C]/25 bg-[#C9A84C]/[0.04] text-[#E7C96A]",
    warn: "border-amber-300/25 bg-amber-300/[0.03] text-amber-200",
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`} data-testid={testid}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums" data-testid={testid ? `${testid}-value` : undefined}>
        {value === null ? "—" : value}
      </p>
      {hint ? <p className="mt-1 text-[10px] uppercase tracking-[0.14em] opacity-50">{hint}</p> : null}
    </div>
  );
}
