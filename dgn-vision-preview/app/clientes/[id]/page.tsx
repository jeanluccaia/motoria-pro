import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { customerById, customers } from "@/lib/data";
import { CustomerActions, OpportunityLink } from "@/components/CustomerActions";
import {
  IconArrow,
  IconCalendar,
  IconCheck,
  IconCrown,
  IconSpark,
  IconStar,
  IconTrend,
} from "@/components/Icons";

export function generateStaticParams() {
  return customers.map((c) => ({ id: c.id }));
}

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = customerById(id);
  if (!customer) notFound();

  return (
    <div className="w-full">
      {/* HERO VEÍCULO — compacto 340px */}
      <section className="relative">
        <div className="relative h-[300px] lg:h-[340px] w-full overflow-hidden bg-ink-900">
          <Image
            src={customer.vehicle.photo}
            alt={`${customer.vehicle.make} ${customer.vehicle.model}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ filter: "brightness(1.05) saturate(1.05) contrast(1.03)" }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_75%_30%,rgba(201,163,62,0.14),transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-ink-950/15" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/15 to-transparent" />
        </div>

        {/* Faixa flutuante — nome + CTA primário sobreposto ao hero */}
        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="absolute -top-32 lg:-top-40 left-6 right-6 lg:left-10 lg:right-10 flex items-end justify-between gap-6 flex-wrap">
            <div className="max-w-2xl">
              <Link
                href="/"
                className="btn-subtle mb-4 -ml-2 bg-ink-950/60 backdrop-blur-sm"
              >
                <IconArrow size={14} className="rotate-180" /> Voltar à Visão Geral
              </Link>

              <div className="flex items-center gap-2 flex-wrap">
                {customer.tier === "Fundador" && (
                  <span className="pill bg-gold-400/15 text-gold-300 border border-gold-400/30 backdrop-blur-sm">
                    <IconCrown size={12} /> Fundador
                  </span>
                )}
                {customer.tier === "VIP" && (
                  <span className="pill bg-gold-400/15 text-gold-300 border border-gold-400/30 backdrop-blur-sm">
                    <IconStar size={12} /> VIP
                  </span>
                )}
                {customer.tier === "Ativo" && (
                  <span className="pill bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30 backdrop-blur-sm">
                    Assinante ativo
                  </span>
                )}
                <span className="pill bg-ink-950/60 text-ink-100 border border-white/10 backdrop-blur-sm">
                  Cliente desde {customer.since}
                </span>
              </div>

              <h1 className="mt-3 text-3xl lg:text-[42px] font-semibold tracking-tight text-white leading-[1.05]">
                {customer.name}
              </h1>
              <p className="mt-2 text-[15px] text-ink-200">
                {customer.vehicle.year} · {customer.vehicle.make}{" "}
                {customer.vehicle.model}
                <span className="text-ink-500"> · </span>
                <span className="text-ink-400">{customer.vehicle.color}</span>
                <span className="text-ink-500"> · </span>
                <span className="font-mono text-ink-300">
                  {customer.vehicle.plate}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3 pb-1">
              <CustomerActions
                customerFirstName={customer.firstName}
                recommended="priority"
                ctaLabel={customer.plan ? "Ajustar assinatura" : "Oferecer assinatura"}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-24 lg:pt-32 pb-10 space-y-8">
        {/* STATS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBlock
            label="Atendimentos no ano"
            value={String(customer.stats.attendances)}
            icon={<IconCalendar />}
          />
          <StatBlock
            label="Retenção"
            value={customer.stats.retention}
            tone="emerald"
            icon={<IconCheck />}
          />
          <StatBlock
            label="Valor total gerado"
            value={customer.stats.lifetime}
            tone="gold"
            icon={<IconTrend />}
          />
          <StatBlock
            label="Próxima visita"
            value={`${customer.nextAppointment.date} · ${customer.nextAppointment.time}`}
            icon={<IconCalendar />}
          />
        </section>

        {/* GRID PRINCIPAL */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* COLUNA ESQUERDA */}
          <div className="xl:col-span-2 space-y-6">
            {customer.plan ? (
              <div className="surface-raised p-7 lg:p-8 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gold-300">
                      Plano atual
                    </p>
                    <h3 className="mt-1 text-3xl font-semibold text-white tracking-tight">
                      DGN {customer.plan.label}
                    </h3>
                    <p className="mt-2 text-ink-300">{customer.plan.cycle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wider text-ink-400">
                      Mensalidade
                    </p>
                    <p className="mt-1 text-3xl font-semibold text-white tabular-nums">
                      {customer.plan.price}
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-3 flex-wrap">
                  <span className="w-8 h-8 rounded-full bg-gold-400/15 text-gold-300 flex items-center justify-center">
                    <IconCalendar size={14} />
                  </span>
                  <p className="text-sm text-ink-100 flex-1">
                    {customer.plan.nextVisit}
                  </p>
                  <DemoAction label="Ver cronograma" />
                </div>
              </div>
            ) : (
              <div className="surface-raised p-7 lg:p-8 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-ink-400">
                      Condição atual
                    </p>
                    <h3 className="mt-1 text-3xl font-semibold text-white tracking-tight">
                      {customer.casual?.label}
                    </h3>
                    <p className="mt-2 text-ink-300">{customer.casual?.lastService}</p>
                  </div>
                  <OpportunityLink
                    customerFirstName={customer.firstName}
                    recommended="priority"
                  />
                </div>
              </div>
            )}

            {/* Próximo atendimento */}
            <div className="surface p-6 lg:p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-white">Próximo atendimento</h3>
                <span
                  className={`pill ${
                    customer.nextAppointment.status === "Confirmado"
                      ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20"
                      : "bg-accent-amber/10 text-accent-amber border border-accent-amber/20"
                  }`}
                >
                  {customer.nextAppointment.status}
                </span>
              </div>

              <div className="flex items-start gap-6 flex-wrap">
                <div className="rounded-2xl border border-white/5 bg-ink-950 p-5 text-center min-w-[112px]">
                  <p className="text-[11px] uppercase tracking-wider text-ink-400">
                    {customer.nextAppointment.weekday}
                  </p>
                  <p className="text-3xl font-semibold text-white mt-1 tabular-nums">
                    {customer.nextAppointment.date}
                  </p>
                  <p className="text-sm text-gold-300 mt-1 tabular-nums">
                    {customer.nextAppointment.time}
                  </p>
                </div>
                <div className="flex-1 min-w-[220px]">
                  <p className="text-xl text-white font-medium leading-snug">
                    {customer.nextAppointment.service}
                  </p>
                  <p className="mt-1 text-sm text-ink-400">
                    {customer.nextAppointment.bay}
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <DemoAction label="Reagendar" variant="ghost" />
                    <DemoAction label="Enviar lembrete" variant="subtle" />
                  </div>
                </div>
              </div>
            </div>

            {/* Histórico */}
            <div className="surface p-6 lg:p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-white">Histórico recente</h3>
                <DemoAction label="Ver tudo" variant="subtle" />
              </div>
              <ul className="divide-y divide-white/5">
                {customer.history.map((h) => (
                  <li
                    key={h.date}
                    className="py-4 flex items-center gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="w-14 shrink-0 text-sm text-ink-300 font-mono tabular-nums">
                      {h.date}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] text-white truncate">{h.service}</p>
                      <p className="text-xs text-ink-400 mt-0.5">{h.unit}</p>
                    </div>
                    {h.nps !== undefined && (
                      <span className="pill bg-white/5 text-ink-200 border border-white/10">
                        NPS {h.nps}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* COLUNA DIREITA — Oportunidade (sem CTA repetido) + ficha */}
          <aside className="space-y-6">
            <div className="surface-raised p-7 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gold-400/[0.08] via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 w-56 h-56 bg-gold-400/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <span className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
                  <IconSpark size={12} /> Oportunidade comercial
                </span>
                <h3 className="mt-4 text-xl text-white font-semibold leading-snug">
                  {customer.opportunity.title}
                </h3>
                <p className="mt-3 text-sm text-ink-200 leading-relaxed">
                  {customer.opportunity.reason}
                </p>

                <div className="mt-5 p-4 rounded-xl border border-gold-400/20 bg-gold-400/[0.05]">
                  <p className="text-[11px] uppercase tracking-wider text-gold-300">
                    Potencial estimado — ilustrativo
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white tabular-nums">
                    {customer.opportunity.value}
                  </p>
                  <p className="mt-2 text-[11px] text-ink-400 leading-relaxed">
                    Projeção baseada no histórico de atendimentos avulsos vs.
                    valor da assinatura. Não representa receita confirmada.
                  </p>
                </div>

                <p className="mt-5 text-[13px] text-ink-300">
                  A ação principal <span className="text-white font-medium">{customer.opportunity.cta}</span> está no topo da ficha.
                </p>
              </div>
            </div>

            {/* Ficha rápida */}
            <div className="surface p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ficha</h3>
              <dl className="space-y-3 text-sm">
                <Row k="E-mail" v={`${customer.firstName.toLowerCase()}@dgndemo.app`} />
                <Row k="Telefone" v="(11) 9•••• ••12" muted />
                <Row k="Preferência de contato" v="WhatsApp" />
                <Row k="Unidade" v="Jardins" />
                <Row k="Primeira visita" v={`Março de ${customer.since}`} />
              </dl>

              <div className="mt-5 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <p className="text-[11px] uppercase tracking-wider text-ink-400">
                  Observação curadoria
                </p>
                <p className="mt-2 text-sm text-ink-100 leading-snug">
                  Cliente valoriza pontualidade e lounge silencioso. Prefere veículo
                  pronto antes das 16h.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "neutral" | "gold" | "emerald";
}) {
  return (
    <div className="surface p-5 flex items-center justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wider text-ink-400">
          {label}
        </span>
        <span className="mt-1 text-xl lg:text-[22px] font-semibold text-white tabular-nums leading-tight">
          {value}
        </span>
      </div>
      <span
        className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
          tone === "gold"
            ? "border-gold-400/20 bg-gold-400/10 text-gold-300"
            : tone === "emerald"
            ? "border-accent-emerald/20 bg-accent-emerald/10 text-accent-emerald"
            : "border-white/5 bg-white/[0.02] text-ink-300"
        }`}
      >
        {icon}
      </span>
    </div>
  );
}

function Row({ k, v, muted = false }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-ink-400">{k}</dt>
      <dd className={muted ? "text-ink-300 font-mono text-xs" : "text-white"}>
        {v}
      </dd>
    </div>
  );
}

/** Botão demonstrativo — explicita que a ação completa chega na próxima fase. */
function DemoAction({
  label,
  variant = "subtle",
}: {
  label: string;
  variant?: "subtle" | "ghost";
}) {
  return (
    <button
      className={`${variant === "ghost" ? "btn-ghost" : "btn-subtle"} opacity-80`}
      title="Comportamento demonstrativo — fluxo completo chega na próxima fase"
    >
      {label}
      <span className="ml-1.5 text-[9px] uppercase tracking-wider text-ink-400 border border-white/10 rounded px-1 py-0.5">
        demo
      </span>
    </button>
  );
}
