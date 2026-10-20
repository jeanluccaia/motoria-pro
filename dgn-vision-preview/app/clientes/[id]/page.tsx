import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CUSTOMERS,
  appointmentStatus,
  customerById,
  nextAppointmentByCustomer,
  vehicleById,
} from "@/lib/data";
import { CustomerActions, OpportunityLink } from "@/components/CustomerActions";
import { OfferStatusChip } from "@/components/OfferStatusChip";
import { OpportunityCard } from "@/components/OpportunityCard";
import { PresentationHighlight } from "@/components/presentation/PresentationProvider";
import {
  IconArrow,
  IconCalendar,
  IconCheck,
  IconCrown,
  IconStar,
  IconTrend,
} from "@/components/Icons";

export function generateStaticParams() {
  return CUSTOMERS.map((c) => ({ id: c.id }));
}

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = customerById(id);
  if (!customer) notFound();

  const vehicle = vehicleById(customer.vehicleId)!;
  const next = nextAppointmentByCustomer(customer.id);

  return (
    <div className="w-full">
      {/* HERO VEÍCULO — compacto */}
      <PresentationHighlight id="customer-hero">
        <section className="relative">
          <div className="relative h-[300px] lg:h-[340px] w-full overflow-hidden bg-ink-900">
            <Image
              src={vehicle.photo}
              alt={`${vehicle.make} ${vehicle.model}`}
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

          {/* Faixa flutuante */}
          <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10">
            <div className="absolute -top-32 lg:-top-40 left-6 right-6 lg:left-10 lg:right-10 flex items-end justify-between gap-6 flex-wrap">
              <div className="max-w-2xl">
                <Link
                  href="/clientes"
                  className="btn-subtle mb-4 -ml-2 bg-ink-950/60 backdrop-blur-sm"
                >
                  <IconArrow size={14} className="rotate-180" /> Voltar à lista
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
                  <OfferStatusChip customerId={customer.id} />
                </div>

                <h1 className="mt-3 text-3xl lg:text-[42px] font-semibold tracking-tight text-white leading-[1.05]">
                  {customer.name}
                </h1>
                <p className="mt-2 text-[15px] text-ink-100">
                  {vehicle.year} · {vehicle.make} {vehicle.model}
                  <span className="text-ink-400"> · </span>
                  <span className="text-ink-200">{vehicle.color}</span>
                  <span className="text-ink-400"> · </span>
                  <span className="font-mono text-ink-200">{vehicle.plate}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 pb-1">
                <CustomerActions customer={customer} />
              </div>
            </div>
          </div>
        </section>
      </PresentationHighlight>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-24 lg:pt-32 pb-32 md:pb-10 space-y-8">
        {/* STATS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBlock
            label="Atendimentos no ano"
            value={String(customer.stats.attendancesYear)}
            icon={<IconCalendar />}
          />
          <StatBlock
            label="Retenção"
            value={customer.stats.retentionDisplay}
            tone="emerald"
            icon={<IconCheck />}
          />
          <StatBlock
            label="Valor total gerado"
            value={customer.stats.lifetimeDisplay}
            tone="gold"
            icon={<IconTrend />}
          />
          <StatBlock
            label="Próxima visita"
            value={next ? `${next.dateDisplay} · ${next.time}` : "—"}
            icon={<IconCalendar />}
          />
        </section>

        {/* GRID PRINCIPAL */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
                    <p className="mt-2 text-ink-200">{customer.plan.cycle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wider text-ink-300">
                      Mensalidade
                    </p>
                    <p className="mt-1 text-3xl font-semibold text-white tabular-nums">
                      {customer.plan.priceDisplay}
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-3 flex-wrap">
                  <span className="w-8 h-8 rounded-full bg-gold-400/15 text-gold-300 flex items-center justify-center">
                    <IconCalendar size={14} />
                  </span>
                  <p className="text-sm text-ink-100 flex-1">
                    {customer.plan.nextVisitText}
                  </p>
                </div>
              </div>
            ) : (
              <div className="surface-raised p-7 lg:p-8 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-ink-300">
                      Condição atual
                    </p>
                    <h3 className="mt-1 text-3xl font-semibold text-white tracking-tight">
                      {customer.casual?.label}
                    </h3>
                    <p className="mt-2 text-ink-200">{customer.casual?.lastService}</p>
                  </div>
                  <OpportunityLink customer={customer} />
                </div>
              </div>
            )}

            {/* Próximo atendimento */}
            {next && (() => {
              const nextStatus = appointmentStatus(next);
              return (
              <div className="surface p-6 lg:p-7">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-white">
                    Próximo atendimento
                  </h3>
                  <span
                    className={`pill ${
                      nextStatus === "Confirmado"
                        ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20"
                        : nextStatus === "Em andamento"
                        ? "bg-gold-400/10 text-gold-300 border border-gold-400/20"
                        : nextStatus === "Concluído"
                        ? "bg-white/5 text-ink-300 border border-white/10"
                        : "bg-accent-amber/10 text-accent-amber border border-accent-amber/20"
                    }`}
                  >
                    {nextStatus}
                  </span>
                </div>

                <div className="flex items-start gap-6 flex-wrap">
                  <div className="rounded-2xl border border-white/5 bg-ink-950 p-5 text-center min-w-[112px]">
                    <p className="text-[11px] uppercase tracking-wider text-ink-300">
                      {next.weekday}
                    </p>
                    <p className="text-3xl font-semibold text-white mt-1 tabular-nums">
                      {next.dateDisplay}
                    </p>
                    <p className="text-sm text-gold-300 mt-1 tabular-nums">
                      {next.time}
                    </p>
                  </div>
                  <div className="flex-1 min-w-[220px]">
                    <p className="text-xl text-white font-medium leading-snug">
                      {next.service}
                    </p>
                    <p className="mt-1 text-sm text-ink-300">{next.bay}</p>
                    <div className="mt-5">
                      <Link href="/agenda" className="btn-subtle">
                        Ver agenda completa <IconArrow size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}

            {/* Histórico */}
            <div className="surface p-6 lg:p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-white">
                  Histórico recente
                </h3>
                <span className="text-xs text-ink-300">
                  {customer.history.length} registros
                </span>
              </div>
              <ul className="divide-y divide-white/5">
                {customer.history.map((h) => (
                  <li
                    key={h.dateDisplay + h.service}
                    className="py-4 flex items-center gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="w-20 shrink-0 text-sm text-ink-200 font-mono tabular-nums">
                      {h.dateDisplay}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] text-white break-words">
                        {h.service}
                      </p>
                      <p className="text-xs text-ink-300 mt-0.5">
                        Unidade {h.unit}
                      </p>
                    </div>
                    {h.nps !== undefined && (
                      <span className="pill bg-white/5 text-ink-100 border border-white/10">
                        NPS {h.nps}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* COLUNA DIREITA */}
          <aside className="space-y-6">
            <OpportunityCard customer={customer} />

            <div className="surface p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ficha</h3>
              <dl className="space-y-3 text-sm">
                <Row k="E-mail" v={customer.email} />
                <Row k="Telefone" v={customer.phoneMasked} muted />
                <Row
                  k="Preferência de contato"
                  v={customer.preferredChannel}
                />
                <Row k="Unidade" v="Jardins" />
                <Row
                  k="Primeira visita"
                  v={`Março de ${customer.since}`}
                />
              </dl>

              <div className="mt-5 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <p className="text-[11px] uppercase tracking-wider text-ink-300">
                  Observação da curadoria
                </p>
                <p className="mt-2 text-sm text-ink-100 leading-snug">
                  {customer.observation}
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
        <span className="text-[11px] uppercase tracking-wider text-ink-300">
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
            : "border-white/5 bg-white/[0.02] text-ink-200"
        }`}
      >
        {icon}
      </span>
    </div>
  );
}

function Row({
  k,
  v,
  muted = false,
}: {
  k: string;
  v: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-ink-300">{k}</dt>
      <dd className={muted ? "text-ink-200 font-mono text-xs" : "text-white"}>
        {v}
      </dd>
    </div>
  );
}
