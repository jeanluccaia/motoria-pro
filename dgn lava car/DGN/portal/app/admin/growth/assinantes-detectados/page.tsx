import Link from "next/link";
import { ShieldCheck, AlertTriangle, Circle, ArrowUpRight } from "lucide-react";
import {
  buildSubscribersCentralView,
  type SubscribersCentralRow,
  type SubscribersCentralRowStatus,
} from "@/lib/growth/db/subscribers-view";
import { loadGrowthData } from "@/lib/growth/db/growth-reader";
import { readSupabaseEnv } from "@/lib/growth/db/client";
import { getCanonicalActiveSubscribersCount } from "@/lib/growth/canonical-subscribers";
import { AddSubscriberDialog } from "@/components/growth/AddSubscriberDialog";
import type { SubscriberSearchCandidate } from "@/lib/growth/subscriber-search";

export const dynamic = "force-dynamic";

type StatusFilter = SubscribersCentralRowStatus | "all";
type PlanFilter = "all" | "Essential" | "Smart" | "Priority" | "Corporate Care";

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all",                 label: "Todos" },
  { key: "ativo",               label: "Ativos" },
  { key: "detectado",           label: "Detectados" },
  { key: "pendente_validacao",  label: "Pendentes" },
  { key: "inadimplente",        label: "Inadimplentes" },
];

const PLAN_FILTERS: Array<{ key: PlanFilter; label: string }> = [
  { key: "all",             label: "Todos os planos" },
  { key: "Essential",       label: "Essential" },
  { key: "Smart",           label: "Smart" },
  { key: "Priority",        label: "Priority" },
  { key: "Corporate Care",  label: "Corporate Care" },
];

function parseStatus(value: string | string[] | undefined): StatusFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "ativo" || raw === "detectado" || raw === "pendente_validacao" || raw === "inadimplente") return raw;
  return "all";
}

function parsePlan(value: string | string[] | undefined): PlanFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "Essential" || raw === "Smart" || raw === "Priority" || raw === "Corporate Care") return raw;
  return "all";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const parsed = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function statusBadge(row: SubscribersCentralRow) {
  const palette: Record<SubscribersCentralRowStatus, string> = {
    ativo:              "text-emerald-300 border-emerald-300/30 bg-emerald-300/[0.06] fill-emerald-300",
    detectado:          "text-[#C9A84C] border-[#C9A84C]/40 bg-[#C9A84C]/10 fill-[#C9A84C]",
    pendente_validacao: "text-white/70 border-white/15 bg-white/[0.04] fill-white/50",
    inadimplente:       "text-red-300 border-red-300/30 bg-red-300/[0.06] fill-red-300",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${palette[row.status]}`}>
      <Circle size={8} />
      {row.statusLabel}
    </span>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "gold" | "neutral" | "warn" | "emerald" }) {
  const toneClasses = {
    gold:    "border-[#C9A84C]/30 bg-[#C9A84C]/[0.03] text-[#C9A84C]",
    neutral: "border-white/10 bg-white/[0.02] text-white/80",
    warn:    "border-amber-300/30 bg-amber-300/[0.03] text-amber-200",
    emerald: "border-emerald-300/30 bg-emerald-300/[0.03] text-emerald-200",
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function buildQuery(status: StatusFilter, plan: PlanFilter): string {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (plan !== "all")   params.set("plano", plan);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export default async function AssinantesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = parseStatus(params.status);
  const plan = parsePlan(params.plano);

  const env = readSupabaseEnv();
  const dbConfigured = Boolean(env.url && env.serviceRoleKey);

  const data = await loadGrowthData({ logger: console });
  const allRows = buildSubscribersCentralView(data.customers);

  // Candidatos para o modal "Adicionar assinante": só os campos que o filtro
  // precisa. PII já foi preservada 1:1 (nome/telefone/placa vêm da mesma
  // fonte que a tabela abaixo — nada novo entra no bundle client).
  const searchCandidates: SubscriberSearchCandidate[] = data.customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    vehicle: c.vehicle,
    plate: c.plate,
    hasActiveSubscription: c.subscription?.isActive === true,
    activePlan: c.activePlan ?? null,
  }));

  // Ativos = customers distintos com crm_subscriptions.is_active_subscriber=true.
  // MESMA regra do Dashboard, via `getCanonicalActiveSubscribersCount`.
  const active       = getCanonicalActiveSubscribersCount(data.customers);
  const detected     = allRows.filter((r) => r.status === "detectado").length;
  const pending      = allRows.filter((r) => r.status === "pendente_validacao").length;
  const overdue      = allRows.filter((r) => r.status === "inadimplente").length;

  const rows = allRows.filter((row) => {
    if (status !== "all" && row.status !== status) return false;
    if (plan !== "all" && row.planLabel !== plan) return false;
    return true;
  });

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-white/[0.06] pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
                Central operacional
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl">
                Assinantes
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#A7A7A7]">
                Todos os assinantes ativos, detectados e pendentes de validação num só lugar. Clique
                em um cliente para abrir o Profile 360 e editar telefone, e-mail, veículo, foto,
                agendamentos e acesso ao Portal — sem sair da aba Assinantes.
              </p>
            </div>
            <div className="shrink-0">
              <AddSubscriberDialog
                candidates={searchCandidates}
                disabled={!dbConfigured}
                disabledReason={
                  !dbConfigured
                    ? "Habilite a persistência (3 vars Supabase) para criar assinatura manual."
                    : undefined
                }
              />
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-4">
          <StatCard label="Assinantes ativos"          value={active}   tone="emerald" />
          <StatCard label="Detectados"                 value={detected} tone="gold" />
          <StatCard label="Pendentes de validação"     value={pending}  tone="neutral" />
          <StatCard label="Inadimplentes"              value={overdue}  tone="warn" />
        </section>

        {!dbConfigured && (
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.03] p-5 text-sm text-amber-200/90">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold uppercase tracking-wider text-[11px] text-amber-300">
                Persistência ainda não habilitada
              </p>
              <p className="mt-1 leading-relaxed">
                Esta visão está sendo servida a partir do JSON legado + seed de assinantes. Nenhuma
                alteração aqui persiste ainda. As 3 variáveis do Supabase (URL, ANON_KEY,
                SERVICE_ROLE_KEY) precisam estar configuradas na Vercel antes das ações de
                validação, kit e cartão ficarem disponíveis.
              </p>
            </div>
          </div>
        )}

        <section className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">Status</span>
          {STATUS_FILTERS.map((filter) => {
            const isSelected = status === filter.key;
            return (
              <Link
                key={`status-${filter.key}`}
                href={`/admin/growth/assinantes-detectados${buildQuery(filter.key, plan)}`}
                className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-medium transition ${
                  isSelected
                    ? "border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#E7C96A]"
                    : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
          <span className="ml-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">Plano</span>
          {PLAN_FILTERS.map((filter) => {
            const isSelected = plan === filter.key;
            return (
              <Link
                key={`plan-${filter.key}`}
                href={`/admin/growth/assinantes-detectados${buildQuery(status, filter.key)}`}
                className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-medium transition ${
                  isSelected
                    ? "border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#E7C96A]"
                    : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#101010]">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
              <tr>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Plano</th>
                <th className="px-5 py-3">Próxima cobrança</th>
                <th className="px-5 py-3">Forma de pagamento</th>
                <th className="px-5 py-3">Veículo</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Abrir</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-white/50">
                    Nenhum assinante encontrado para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-white/[0.04] transition hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/admin/growth/customers/${encodeURIComponent(row.id)}`}
                          className="font-medium text-white hover:text-[#E7C96A]"
                        >
                          {row.displayName}
                        </Link>
                        {row.preservedFounderNumber && (
                          <span className="inline-flex w-fit items-center gap-1 rounded-md border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#C9A84C]">
                            <ShieldCheck size={10} /> Founder Nº{row.preservedFounderNumber}
                          </span>
                        )}
                        {row.isReopenedFounder && (
                          <span className="inline-flex w-fit items-center gap-1 rounded-md border border-white/20 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                            Vaga Nº004 reaberta
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top text-white/80">{row.planLabel}</td>
                    <td className="px-5 py-4 align-top text-white/70">{formatDate(row.nextDueDate)}</td>
                    <td className="px-5 py-4 align-top text-white/70">{row.paymentMethodLabel}</td>
                    <td className="px-5 py-4 align-top text-white/70">
                      <div className="flex flex-col">
                        <span>{row.vehicleLabel}</span>
                        <span className="font-mono text-[11px] text-white/50">{row.maskedPlate}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">{statusBadge(row)}</td>
                    <td className="px-5 py-4 align-top text-right">
                      <Link
                        href={`/admin/growth/customers/${encodeURIComponent(row.id)}`}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/80 transition hover:border-[#C9A84C]/40 hover:text-[#E7C96A]"
                      >
                        Abrir
                        <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <footer className="mt-8 rounded-xl border border-white/[0.06] bg-[#101010] p-5 text-xs text-white/50">
          <p className="uppercase tracking-[0.16em] text-white/70">Nota operacional</p>
          <p className="mt-2 leading-relaxed">
            Ninguém desta fila é promovido para <em>ativo</em> sem confirmação humana. Os Founders
            Nº001, Nº002 e Nº003 seguem preservados. A vaga Nº004 está reaberta — Iara aparece aqui
            como assinante detectada, mas <strong>não</strong> como Founder confirmada.
            Reconhecimento posterior exige decisão manual registrada em audit log. Alterações
            financeiras que impactem contrato PagBank continuam exigindo confirmação explícita
            (evolução prevista para Fase 2).
          </p>
        </footer>
      </div>
    </div>
  );
}
