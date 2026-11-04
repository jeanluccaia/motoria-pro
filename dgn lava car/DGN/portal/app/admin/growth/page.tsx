import { CommercialDashboard } from "@/components/growth/CommercialDashboard";
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
    loadPulseSummary({ topN: 100 }),
    loadFleetPending(),
  ]);

  return <CommercialDashboard metrics={m} briefing={briefingSummary} pulse={pulse} fleet={fleetPending} />;
}
