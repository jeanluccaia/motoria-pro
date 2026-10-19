import Link from "next/link";
import {
  CUSTOMERS,
  DEMO_DATE,
  DEMO_OPERATOR,
  DEMO_UNIT,
  NEXT_RECOMMENDED_ACTION,
  aggregateStats,
  customerById,
  dailyCapacity,
  heroSummary,
  operationBreakdown,
  prospectCustomers,
  todayPulse,
  upsellCustomers,
  type Customer,
} from "@/lib/data";
import { MetricCard } from "@/components/MetricCard";
import {
  IconArrow,
  IconCalendar,
  IconSpark,
  IconTrend,
  IconUsers,
} from "@/components/Icons";
import { StartPresentationButton } from "@/components/presentation/StartPresentationButton";
import { PresentationHighlight } from "@/components/presentation/PresentationProvider";
import { OpportunityStatusLine } from "@/components/OpportunityStatusLine";
import { APPOINTMENTS, appointmentStatus } from "@/lib/data";

export default function VisaoGeralPage() {
  const featured = customerById(NEXT_RECOMMENDED_ACTION.customerId)!;
  const op = operationBreakdown();
  const cap = dailyCapacity();
  const agg = aggregateStats();
  const summary = heroSummary();
  const pulse = todayPulse();

  return (
    <div className="px-6 lg:px-10 py-6 lg:py-8 space-y-8">
      {/* Hero compacto */}
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-gold-300">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            {DEMO_DATE.display}
            <span className="pill ml-2 bg-white/5 text-ink-300 border border-white/10 normal-case tracking-normal text-[10px]">
              demonstração
            </span>
          </div>
          <h1 className="mt-2 text-[32px] lg:text-[40px] font-semibold tracking-tight text-white leading-[1.1]">
            Bom dia, {DEMO_OPERATOR.firstName}
          </h1>
          <p className="mt-3 text-ink-100 text-[16px] leading-relaxed">
            {summary}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StartPresentationButton variant="primary" />
        </div>
      </section>

      {/* Próxima ação recomendada — sobe no fold */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <PresentationHighlight id="overview-next-action" className="xl:col-span-8">
          <div className="surface-raised p-6 lg:p-7 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-400/[0.07] via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-gold-400/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="inline-flex items-center gap-2 pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
                  <IconSpark size={12} />
                  Próxima ação recomendada
                </div>
                <span className="text-[11px] uppercase tracking-wider text-ink-300">
                  Prioridade alta
                </span>
              </div>

              <h2 className="mt-4 text-2xl lg:text-[26px] text-white font-semibold leading-tight tracking-tight max-w-2xl">
                {NEXT_RECOMMENDED_ACTION.headline}
              </h2>

              {/* Estrutura Cliente → Oportunidade → Motivo → Próxima ação */}
              <div className="mt-4 flex items-center gap-5 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-ink-700 to-ink-850 border border-white/10 flex items-center justify-center text-sm font-semibold text-ink-100">
                    {featured.avatarInitials}
                  </div>
                  <div className="leading-tight">
                    <p className="text-[15px] text-white font-medium">{featured.name}</p>
                    <p className="text-xs text-ink-300">
                      Cliente desde {featured.since} · {featured.tier}
                    </p>
                  </div>
                </div>

                <div className="h-10 w-px bg-white/5 hidden sm:block" />

                <div className="leading-tight">
                  <p className="text-[11px] uppercase tracking-wider text-ink-300">
                    Argumento
                  </p>
                  <p className="text-sm text-gold-300 font-semibold">
                    {featured.opportunity.projection.deltaDisplay}
                  </p>
                </div>

                <div className="flex-1" />

                <OpportunityStatusLine customerId={featured.id} />

                <Link
                  href={`/clientes/${featured.id}`}
                  className="btn-primary"
                >
                  Abrir cliente 360° <IconArrow size={14} />
                </Link>
              </div>

              {/* Justificativa curta — detalhada no modal de oferta */}
              <details className="mt-4 group">
                <summary className="cursor-pointer list-none text-xs text-ink-300 hover:text-ink-100 transition-colors inline-flex items-center gap-1.5">
                  <span className="transition-transform group-open:rotate-90">›</span>
                  Ver justificativa comercial
                </summary>
                <p className="mt-2 text-[13px] text-ink-200 leading-relaxed max-w-2xl">
                  {NEXT_RECOMMENDED_ACTION.rationale}
                </p>
              </details>
            </div>
          </div>
        </PresentationHighlight>

        {/* Operação agora — derivada */}
        <div className="xl:col-span-4 surface-raised p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Operação agora</h3>
            <span className="pill bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
              Ao vivo
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Em atendimento", value: op.emAtendimento },
              { label: "Aguardando", value: op.aguardando },
              { label: "Agendados", value: op.agendados },
              { label: "Concluídos", value: op.concluidos },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="p-3 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <p className="text-[26px] leading-none font-semibold text-white tabular-nums">
                  {kpi.value}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-ink-300 leading-tight">
                  {kpi.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-white/5">
            <p className="text-[11px] uppercase tracking-wider text-ink-300">
              Agenda do dia
            </p>
            <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-300"
                style={{ width: `${cap.percent}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-ink-200">
                {cap.used} de {cap.total} slots ocupados
              </span>
              <span className="text-gold-300 font-medium tabular-nums">
                {cap.percentDisplay}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Indicadores compactos */}
      <PresentationHighlight id="overview-kpis">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Assinantes ativos"
            value={agg.totalSubs}
            delta={agg.totalSubsDelta}
            tone="positive"
            icon={<IconUsers />}
            compact
            badge="contexto demo"
          />
          <MetricCard
            label="Oportunidades"
            value={CUSTOMERS.length}
            delta={`${prospectCustomers.length} nova${prospectCustomers.length === 1 ? "" : "s"} · ${upsellCustomers.length} upsell${upsellCustomers.length === 1 ? "" : "s"}`}
            tone="gold"
            icon={<IconSpark />}
            compact
          />
          <MetricCard
            label="Atendimentos hoje"
            value={APPOINTMENTS.length}
            delta={`${op.emAtendimento} em andamento`}
            tone="neutral"
            icon={<IconCalendar />}
            compact
          />
          <MetricCard
            label="Receita recorrente"
            value={agg.mrrDisplay}
            delta={agg.mrrDelta}
            tone="positive"
            icon={<IconTrend />}
            compact
            badge="contexto demo"
          />
        </section>
      </PresentationHighlight>

      {/* Pulso do dia + oportunidades */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 surface p-6 lg:p-7">
          <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Pulso do dia</h3>
              <p className="text-sm text-ink-300 mt-0.5">
                Linha do tempo operacional da {DEMO_UNIT.name}
              </p>
            </div>
            <Link href="/agenda" className="btn-subtle">
              Ver agenda completa <IconArrow size={12} />
            </Link>
          </div>

          <ol className="relative space-y-1">
            <div className="absolute left-[52px] top-2 bottom-2 w-px bg-gradient-to-b from-white/5 via-white/10 to-white/5" />
            {pulse.map((item) => (
              <li key={item.time + item.title} className="relative flex items-start gap-5 py-2.5">
                <div className="w-11 shrink-0 text-right text-sm tabular-nums text-ink-200 font-mono pt-0.5">
                  {item.time}
                </div>
                <div
                  className={`relative z-10 shrink-0 mt-1.5 w-2.5 h-2.5 rounded-full ring-4 ${
                    item.highlight
                      ? "bg-gold-400 ring-gold-400/15"
                      : item.kind === "pendente"
                      ? "bg-accent-amber ring-accent-amber/15"
                      : item.kind === "operacional"
                      ? "bg-ink-500 ring-ink-500/15"
                      : item.kind === "comercial"
                      ? "bg-accent-emerald ring-accent-emerald/15"
                      : "bg-white/40 ring-white/5"
                  }`}
                />
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[15px] text-white font-medium">{item.title}</p>
                    {item.highlight && (
                      <span className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
                        Agora
                      </span>
                    )}
                    {item.kind === "pendente" && (
                      <span className="pill bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
                        Pendente
                      </span>
                    )}
                    {item.kind === "comercial" && (
                      <span className="pill bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
                        Comercial
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-200">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="xl:col-span-4 surface p-5 lg:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Oportunidades priorizadas
            </h3>
            <span className="pill bg-white/5 text-ink-200 border border-white/10">
              {CUSTOMERS.length} ativas
            </span>
          </div>

          {prospectCustomers.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] uppercase tracking-wider text-gold-300 font-medium">
                  Abrir assinatura
                </span>
                <span className="h-px flex-1 bg-white/5" />
                <span className="text-[11px] text-ink-400">
                  {prospectCustomers.length}
                </span>
              </div>
              <ul className="space-y-2 mb-4">
                {prospectCustomers.map((c) => (
                  <OpportunityRow key={c.id} customer={c} />
                ))}
              </ul>
            </>
          )}

          {upsellCustomers.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] uppercase tracking-wider text-accent-emerald font-medium">
                  Upsell · assinante ativo
                </span>
                <span className="h-px flex-1 bg-white/5" />
                <span className="text-[11px] text-ink-400">
                  {upsellCustomers.length}
                </span>
              </div>
              <ul className="space-y-2">
                {upsellCustomers.map((c) => (
                  <OpportunityRow key={c.id} customer={c} variant="upsell" />
                ))}
              </ul>
            </>
          )}

          <div className="mt-auto pt-5 border-t border-white/5">
            <p className="text-[11px] text-ink-300 leading-relaxed">
              Projeções são ilustrativas, calculadas a partir do histórico de cada
              cliente — não representam receita confirmada
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function OpportunityRow({
  customer,
  variant = "prospect",
}: {
  customer: Customer;
  variant?: "prospect" | "upsell";
}) {
  return (
    <li>
      <Link
        href={`/clientes/${customer.id}`}
        className="group flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/10 transition-colors"
      >
        <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-ink-700 to-ink-850 border border-white/10 flex items-center justify-center text-xs font-semibold text-ink-100">
          {customer.avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm text-white font-medium truncate">
              {customer.name}
            </p>
            {customer.tier === "Fundador" && (
              <span className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
                Fundador
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-200 truncate">
            {customer.opportunity.title}
          </p>
          <p
            className={`mt-1 text-[11px] uppercase tracking-wider ${
              customer.opportunity.projection.argument === "revenue_gain"
                ? "text-accent-emerald"
                : customer.opportunity.projection.argument === "client_saving"
                ? "text-accent-emerald"
                : "text-gold-300"
            }`}
          >
            {customer.opportunity.projection.deltaDisplay}
          </p>
        </div>
        <IconArrow
          size={12}
          className="shrink-0 mt-1 text-ink-300 group-hover:text-gold-300 transition-colors"
        />
      </Link>
    </li>
  );
}
