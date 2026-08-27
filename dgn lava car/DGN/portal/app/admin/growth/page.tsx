import { loadGrowthData } from "@/lib/growth/db/growth-reader";
import { KNOWN_SUBSCRIBERS_2026_08_16 } from "@/lib/growth/known-subscribers";
import type { DgnCustomer } from "@/lib/growth/dgn-growth-data";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

type DashboardMetrics = {
  activeSubscribers: number;
  pendingRenewal: number;
  confirmedFounders: number;
  activeInvites: number;
  awaitingCuration: number;
  dataOrigin: "json" | "db" | "json-fallback";
  loadError: string | null;
};

async function computeMetrics(): Promise<DashboardMetrics> {
  const activeSubscribers = KNOWN_SUBSCRIBERS_2026_08_16.filter((s) => s.status === "ativo").length;
  const pendingRenewal = KNOWN_SUBSCRIBERS_2026_08_16.filter(
    (s) => s.status === "renovacao_pendente",
  ).length;
  const confirmedFounders = KNOWN_SUBSCRIBERS_2026_08_16.filter(
    (s) => s.preservedFounderNumber || s.isReopenedFounder,
  ).length;

  try {
    const data = await loadGrowthData({ logger: console });
    const activeInvites = data.customers.filter(
      (c: DgnCustomer) => Boolean(c.campaign.personalizedPagePath),
    ).length;
    const awaitingCuration = data.customers.filter(
      (c: DgnCustomer) => c.commercialStatus === "Aguardando Curadoria DGN",
    ).length;
    return {
      activeSubscribers,
      pendingRenewal,
      confirmedFounders,
      activeInvites,
      awaitingCuration,
      dataOrigin: data.origin,
      loadError: null,
    };
  } catch (error) {
    return {
      activeSubscribers,
      pendingRenewal,
      confirmedFounders,
      activeInvites: 0,
      awaitingCuration: 0,
      dataOrigin: "json",
      loadError: error instanceof Error ? error.message : "Erro inesperado.",
    };
  }
}

export default async function DgnAdminDashboardPage() {
  const m = await computeMetrics();

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
          <MetricCard label="Assinantes ativos" value={m.activeSubscribers} />
          <MetricCard label="Founders confirmados" value={m.confirmedFounders} tone="gold" />
          <MetricCard label="Convites ativos" value={m.activeInvites} tone="gold" hidden={m.loadError !== null} />
          <MetricCard label="Aguardando curadoria" value={m.awaitingCuration} hidden={m.loadError !== null} />
          <MetricCard label="Renovação pendente" value={m.pendingRenewal} tone="warn" />
        </section>

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

function MetricCard({
  label,
  value,
  tone = "neutral",
  hidden = false,
}: {
  label: string;
  value: number;
  tone?: "neutral" | "gold" | "warn";
  hidden?: boolean;
}) {
  if (hidden) return null;
  const toneClasses = {
    neutral: "border-white/[0.08] bg-white/[0.02] text-white",
    gold: "border-[#C9A84C]/25 bg-[#C9A84C]/[0.04] text-[#E7C96A]",
    warn: "border-amber-300/25 bg-amber-300/[0.03] text-amber-200",
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
