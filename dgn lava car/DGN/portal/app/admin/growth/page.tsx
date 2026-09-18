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
import { AlertTriangle, ArrowRight, Sparkles } from "lucide-react";

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

export default async function DgnAdminDashboardPage() {
  const [m, briefingSummary] = await Promise.all([computeMetrics(), loadBriefingSummary()]);

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-white/[0.06] pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Visão geral
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
            Base viva DGN. Números vêm da operação atual — nada é estimado ou projetado.
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

        <section
          className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
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
        </section>

        <IntelligenceCard briefing={briefingSummary.briefing} error={briefingSummary.error} />

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
