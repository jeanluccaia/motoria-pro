import Link from "next/link";
import {
  commandMetrics,
  customers,
  nextRecommendedAction,
  prospectCustomers,
  todayPulse,
  upsellCustomers,
  type Customer,
} from "@/lib/data";
import { MetricCard } from "@/components/MetricCard";
import { IconArrow, IconCalendar, IconSpark, IconTrend, IconUsers } from "@/components/Icons";
import { StartPresentationButton } from "@/components/presentation/StartPresentationButton";

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
          <p className="mt-0.5 text-xs text-ink-400 truncate">
            {customer.opportunity.title}
          </p>
          <p
            className={`mt-1 text-[11px] uppercase tracking-wider ${
              variant === "upsell" ? "text-accent-emerald" : "text-gold-300"
            }`}
          >
            {customer.opportunity.value}
          </p>
        </div>
        <IconArrow
          size={12}
          className="shrink-0 mt-1 text-ink-500 group-hover:text-gold-300 transition-colors"
        />
      </Link>
    </li>
  );
}

export default function VisaoGeralPage() {
  const featured = customers.find((c) => c.id === nextRecommendedAction.customerId)!;

  return (
    <div className="px-6 lg:px-10 py-10 lg:py-12 space-y-10">
      {/* Hero */}
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-gold-300">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            Terça-feira · 17 de outubro
          </div>
          <h1 className="mt-3 text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.05]">
            Bom dia, Digo. Um dia{" "}
            <span className="text-gold-300">organizado</span> pela frente.
          </h1>
          <p className="mt-4 text-ink-200 text-[17px] leading-relaxed">
            Nove atendimentos agendados, dois já em andamento e uma oportunidade
            comercial de alta prioridade esperando sua decisão.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StartPresentationButton variant="primary" />
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Assinantes ativos"
          value={commandMetrics.activeSubscribers.value}
          delta={commandMetrics.activeSubscribers.delta}
          tone="positive"
          icon={<IconUsers />}
        />
        <MetricCard
          label="Oportunidades comerciais"
          value={commandMetrics.openOpportunities.value}
          delta={commandMetrics.openOpportunities.delta}
          tone="gold"
          icon={<IconSpark />}
        />
        <MetricCard
          label="Atendimentos hoje"
          value={commandMetrics.todayAppointments.value}
          delta={commandMetrics.todayAppointments.delta}
          tone="neutral"
          icon={<IconCalendar />}
        />
        <MetricCard
          label="Receita recorrente"
          value={commandMetrics.mrr.value}
          delta={commandMetrics.mrr.delta}
          tone="positive"
          icon={<IconTrend />}
        />
      </section>

      {/* Próxima ação recomendada + Pulso */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Oportunidade destaque */}
        <div className="xl:col-span-2 surface-raised p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-400/[0.07] via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold-400/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="inline-flex items-center gap-2 pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
                <IconSpark size={12} />
                Próxima ação recomendada
              </div>
              <span className="text-[11px] uppercase tracking-wider text-ink-400">
                Prioridade alta · atualizado há 4 min
              </span>
            </div>

            <h2 className="mt-5 text-2xl lg:text-[28px] text-white font-semibold leading-tight tracking-tight max-w-2xl">
              {nextRecommendedAction.headline}
            </h2>

            <p className="mt-3 text-ink-200 max-w-2xl leading-relaxed">
              {nextRecommendedAction.rationale}
            </p>

            <div className="mt-6 flex items-center gap-5 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-ink-700 to-ink-850 border border-white/10 flex items-center justify-center text-sm font-semibold text-ink-100">
                  {featured.avatarInitials}
                </div>
                <div className="leading-tight">
                  <p className="text-sm text-white font-medium">{featured.name}</p>
                  <p className="text-xs text-ink-400">
                    {featured.vehicle.make} {featured.vehicle.model} · Cliente desde{" "}
                    {featured.since}
                  </p>
                </div>
              </div>

              <div className="h-10 w-px bg-white/5 hidden sm:block" />

              <div className="leading-tight">
                <p className="text-[11px] uppercase tracking-wider text-ink-400">
                  Potencial
                </p>
                <p className="text-sm text-gold-300 font-semibold">
                  {featured.opportunity.value}
                </p>
              </div>

              <div className="flex-1" />

              <Link
                href={`/clientes/${featured.id}`}
                className="btn-primary"
              >
                Abrir cliente 360° <IconArrow size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Pulso lateral — contagem rápida */}
        <div className="surface-raised p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Operação agora</h3>
            <span className="pill bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
              Ao vivo
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Em atendimento", value: "2", tone: "emerald" },
              { label: "Aguardando", value: "3", tone: "gold" },
              { label: "Agendados", value: "4", tone: "neutral" },
              { label: "Concluídos", value: "1", tone: "neutral" },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <p className="text-[32px] leading-none font-semibold text-white tabular-nums">
                  {kpi.value}
                </p>
                <p className="mt-1.5 text-[11px] uppercase tracking-wider text-ink-400">
                  {kpi.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-5 border-t border-white/5">
            <p className="text-[11px] uppercase tracking-wider text-ink-400">
              Capacidade do dia
            </p>
            <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-300"
                style={{ width: "68%" }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-ink-300">9 de 13 slots ocupados</span>
              <span className="text-gold-300 font-medium">68%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pulso do dia (timeline) + oportunidades priorizadas */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 surface p-6 lg:p-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">Pulso do dia</h3>
              <p className="text-sm text-ink-400 mt-1">
                Linha do tempo operacional da Unidade Jardins
              </p>
            </div>
            <button className="btn-subtle">Ver agenda completa</button>
          </div>

          <ol className="relative space-y-1">
            <div className="absolute left-[52px] top-2 bottom-2 w-px bg-gradient-to-b from-white/5 via-white/10 to-white/5" />
            {todayPulse.map((item) => (
              <li key={item.time} className="relative flex items-start gap-5 py-3">
                <div className="w-11 shrink-0 text-right text-sm tabular-nums text-ink-300 font-mono pt-0.5">
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
                  <p className="mt-0.5 text-sm text-ink-400">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="surface p-6 lg:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-semibold text-white">
              Oportunidades priorizadas
            </h3>
            <span className="pill bg-white/5 text-ink-300 border border-white/10">
              {customers.length} ativas
            </span>
          </div>

          {prospectCustomers.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] uppercase tracking-wider text-gold-300 font-medium">
                  Abrir assinatura
                </span>
                <span className="h-px flex-1 bg-white/5" />
                <span className="text-[11px] text-ink-500">
                  {prospectCustomers.length}
                </span>
              </div>
              <ul className="space-y-2 mb-5">
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
                <span className="text-[11px] text-ink-500">
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

          <div className="mt-auto pt-6 border-t border-white/5">
            <p className="text-xs text-ink-400">
              Projeções são ilustrativas, baseadas em histórico vs. valor da assinatura.
              Não representam receita confirmada.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
