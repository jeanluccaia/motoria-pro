"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Easing, type Variants } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Crown,
  Flag,
  Handshake,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Founder, FounderTimelineItem } from "@/lib/founders-data";

const easeOut: Easing = "easeOut";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.52, ease: easeOut },
  }),
};

const timelineIcons: Record<FounderTimelineItem["icon"], LucideIcon> = {
  flag: Flag,
  car: Car,
  star: Star,
  handshake: Handshake,
  crown: Crown,
};

function yearsLabel(memberSinceYear: number): string {
  const years = new Date().getFullYear() - memberSinceYear;
  if (years >= 5) return "cinco";
  if (years >= 4) return "quatro";
  if (years >= 3) return "três";
  return "alguns";
}

interface FounderPageClientProps {
  founder: Founder;
}

export function FounderPageClient({ founder }: FounderPageClientProps) {
  const {
    firstName,
    fullName,
    number,
    totalFounders,
    vehicle,
    vehicleImage,
    historyCards,
    timeline,
    carePlan,
    recommendedPlan,
    alternativePlan,
    founderConditionSmart,
    founderConditionPriority,
    links,
    founderMessage,
    memberSinceYear,
  } = founder;

  const [reservationOpen, setReservationOpen] = useState(false);
  const [reservationReady, setReservationReady] = useState(false);

  const checkoutUrl = links.checkoutSmartFounder || links.whatsappVip;
  const founderLabel = `Convite reservado • Founder ${number} de ${totalFounders}`;

  const scrollToInvite = () => {
    document.getElementById("convite-founder")?.scrollIntoView({ behavior: "smooth" });
  };

  const openReservation = () => {
    setReservationOpen(true);
    setReservationReady(false);
    window.setTimeout(() => setReservationReady(true), 2300);
  };

  const continueToCheckout = () => {
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  };

  const openVip = () => {
    window.open(links.whatsappVip, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070707] text-white">
      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden px-5 py-12">
        <PremiumBackground />

        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: easeOut }}
            className="mb-8 inline-flex max-w-[19rem] items-center justify-center gap-2 rounded-lg border border-[#C9A84C]/25 bg-[#C9A84C]/10 px-3 py-2 sm:max-w-full sm:rounded-full sm:px-4"
          >
            <LockKeyhole size={14} className="text-[#C9A84C]" />
            <span className="text-center text-[9px] font-semibold uppercase leading-relaxed tracking-normal text-[#E7C96A] sm:text-[11px] sm:tracking-[0.18em]">
              {founderLabel}
            </span>
          </motion.div>

          <motion.div
            custom={1}
            initial={false}
            animate="visible"
            variants={fadeUp}
            className="w-full max-w-2xl space-y-5"
          >
            <h1 className="text-3xl font-semibold leading-tight tracking-normal text-white sm:text-6xl">
              <span className="block">Bem-vindo de volta,</span>
              <span className="block">{firstName}.</span>
            </h1>
            <p className="mx-auto max-w-[20rem] text-base leading-relaxed text-[#B8B8B8] sm:max-w-xl sm:text-lg">
              Há mais de {yearsLabel(memberSinceYear)} anos você faz parte da história da DGN.
            </p>
            <p className="mx-auto max-w-[20rem] text-base leading-relaxed text-white/85 sm:max-w-xl sm:text-lg">
              Hoje gostaríamos de convidá-lo para escrever o próximo capítulo conosco.
            </p>
          </motion.div>

          <motion.button
            custom={2}
            initial={false}
            animate="visible"
            variants={fadeUp}
            onClick={scrollToInvite}
            whileTap={{ scale: 0.98 }}
            className="mt-10 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6 font-semibold text-[#080808]"
            style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #F5DA78 48%, #B99132 100%)",
              boxShadow: "0 18px 50px rgba(201,168,76,0.22)",
            }}
          >
            Conhecer meu convite
            <ArrowDown size={18} />
          </motion.button>
        </div>
      </section>

      <main id="convite-founder" className="relative mx-auto w-full max-w-6xl px-5 pb-20">
        {/* Invite card + Vehicle */}
        <section className="grid gap-5 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <motion.div
            custom={0}
            initial={false}
            whileInView="visible"
            viewport={{ once: true, amount: 0.35 }}
            variants={fadeUp}
            className="relative overflow-hidden rounded-lg border border-[#C9A84C]/25 bg-[#111111] p-6 sm:p-8"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(201,168,76,0.18),transparent_34%)]" />
            <div className="relative flex h-full flex-col justify-between gap-10">
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
                  DGN Club
                </p>
                <h2 className="max-w-md text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  Um convite preparado para quem já pertence à história.
                </h2>
              </div>

              <div>
                <p className="mb-2 text-sm text-[#9CA3AF]">Titular do convite</p>
                <p className="text-2xl font-semibold text-white">{fullName}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/10 px-3 py-1.5 text-sm font-semibold text-[#E7C96A]">
                  <Crown size={15} />
                  {founderLabel}
                </div>
              </div>
            </div>
          </motion.div>

          <VehicleFeature vehicleName={vehicle.model} vehicleImage={vehicleImage || vehicle.image} />
        </section>

        <HistorySection historyCards={historyCards} />
        <JourneySection timeline={timeline} number={number} totalFounders={totalFounders} />
        <CarePlanSection carePlan={carePlan} vehicleModel={vehicle.model} />
        <ConditionSection
          recommendedPlan={recommendedPlan}
          alternativePlan={alternativePlan}
          founderConditionSmart={founderConditionSmart}
          founderConditionPriority={founderConditionPriority}
        />
        <FounderMessageSection founderMessage={founderMessage} />
        <FinalInvite
          firstName={firstName}
          vehicleModel={vehicle.model}
          onAccept={openReservation}
          onVip={openVip}
        />
      </main>

      <footer className="px-5 pb-10 text-center">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#3A3A3A]">
          DGN Club • Cuidados automotivos premium
        </p>
      </footer>

      <ReservationModal
        open={reservationOpen}
        ready={reservationReady}
        number={number}
        totalFounders={totalFounders}
        onClose={() => setReservationOpen(false)}
        onContinue={continueToCheckout}
      />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PremiumBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(201,168,76,0.18),transparent_34%),linear-gradient(180deg,#0A0A0A_0%,#050505_100%)]" />
      <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(201,168,76,1)_1px,transparent_1px),linear-gradient(90deg,rgba(201,168,76,1)_1px,transparent_1px)] [background-size:56px_56px]" />
      <motion.div
        aria-hidden
        initial={{ opacity: 0.35 }}
        animate={{ opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C9A84C]/10"
      />
    </>
  );
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <motion.div
      custom={0}
      initial={false}
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={fadeUp}
      className="mx-auto mb-7 max-w-2xl text-center"
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">{title}</h2>
      {text ? <p className="mt-3 text-sm leading-relaxed text-[#9CA3AF]">{text}</p> : null}
    </motion.div>
  );
}

function VehicleFeature({ vehicleName, vehicleImage }: { vehicleName: string; vehicleImage: string | null }) {
  return (
    <motion.div
      custom={1}
      initial={false}
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
      variants={fadeUp}
      className="relative min-h-[24rem] overflow-hidden rounded-lg border border-[#C9A84C]/20 bg-[#0E0E0E]"
    >
      {vehicleImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={vehicleImage} alt={vehicleName} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.13),transparent_24%),linear-gradient(145deg,#1A1A1A_0%,#070707_62%)]">
          <div className="absolute left-1/2 top-[38%] h-20 w-[78%] max-w-md -translate-x-1/2 rounded-t-full border-t border-[#C9A84C]/35 bg-gradient-to-b from-[#2A2A2A] to-[#111111] shadow-[0_35px_70px_rgba(0,0,0,0.55)]" />
          <div className="absolute left-1/2 top-[48%] h-20 w-[88%] max-w-lg -translate-x-1/2 rounded-[999px] border border-[#C9A84C]/22 bg-gradient-to-b from-[#242424] to-[#0A0A0A]" />
          <div className="absolute left-[18%] top-[61%] h-12 w-12 rounded-full border border-[#C9A84C]/35 bg-[#080808] shadow-[inset_0_0_0_8px_#151515]" />
          <div className="absolute right-[18%] top-[61%] h-12 w-12 rounded-full border border-[#C9A84C]/35 bg-[#080808] shadow-[inset_0_0_0_8px_#151515]" />
          <div className="absolute left-1/2 top-[75%] h-px w-[72%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#C9A84C]/45 to-transparent" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/35 to-transparent" />
      <div className="relative flex h-full min-h-[24rem] flex-col justify-end p-6 sm:p-7">
        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#C9A84C]/20 bg-black/40 px-3 py-1.5 backdrop-blur">
          <Car size={15} className="text-[#C9A84C]" />
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84C]">
            Veículo cuidado
          </span>
        </div>
        <h2 className="text-3xl font-semibold text-white">{vehicleName}</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#D6D6D6]">
          Este convite foi preparado para o seu {vehicleName}.
        </p>
      </div>
    </motion.div>
  );
}

function HistorySection({ historyCards }: { historyCards: Founder["historyCards"] }) {
  return (
    <section className="py-10">
      <SectionHeader
        eyebrow="Sua história com a DGN"
        title="Uma relação construída atendimento após atendimento."
      />
      <motion.div
        custom={0}
        initial={false}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp}
        className="mx-auto max-w-4xl rounded-lg border border-[#C9A84C]/18 bg-[#101010] p-5 sm:p-7"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {historyCards.map((card) => (
            <div key={card.label} className="rounded-lg border border-white/[0.06] bg-white/[0.035] p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] text-[#9CA3AF]">
                {card.label}
              </p>
              <p className="text-base font-semibold leading-tight text-white">{card.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-white/[0.07] pt-5 text-center">
          <p className="text-sm leading-relaxed text-[#B8B8B8]">
            Obrigado por confiar esse cuidado à DGN ao longo dos últimos anos.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

function JourneySection({
  timeline,
  number,
  totalFounders,
}: {
  timeline: Founder["timeline"];
  number: string;
  totalFounders: number;
}) {
  return (
    <section className="py-10">
      <SectionHeader
        eyebrow="Jornada"
        title={`De cliente recorrente a Founder ${number} de ${totalFounders}.`}
      />
      <div className="mx-auto max-w-3xl">
        <div className="relative">
          <div className="absolute left-5 top-5 bottom-5 w-px bg-gradient-to-b from-transparent via-[#C9A84C]/40 to-transparent sm:left-6" />
          <div className="space-y-4">
            {timeline.map((item, i) => {
              const Icon = timelineIcons[item.icon];
              const isLast = i === timeline.length - 1;

              return (
                <motion.div
                  key={item.title}
                  custom={i}
                  initial={false}
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.35 }}
                  variants={fadeUp}
                  className="relative flex gap-4"
                >
                  <div
                    className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border sm:h-12 sm:w-12"
                    style={{
                      background: isLast ? "linear-gradient(135deg,#C9A84C,#F0D060)" : "#111111",
                      borderColor: isLast ? "rgba(240,208,96,0.7)" : "rgba(201,168,76,0.28)",
                      color: isLast ? "#080808" : "#C9A84C",
                    }}
                  >
                    <Icon size={19} />
                  </div>
                  <div className="min-w-0 flex-1 rounded-lg border border-white/[0.06] bg-[#101010] p-4 sm:p-5">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#C9A84C]">
                      {item.label}
                    </p>
                    <h3 className="text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function CarePlanSection({ carePlan, vehicleModel }: { carePlan: Founder["carePlan"]; vehicleModel: string }) {
  return (
    <section className="py-10">
      <SectionHeader
        eyebrow="Próximos 6 meses"
        title="Seu cuidado já está planejado."
        text={`Preparamos uma rotina para manter seu ${vehicleModel} cuidado com previsibilidade ao longo dos próximos meses.`}
      />
      <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {carePlan.map((item, i) => (
          <motion.div
            key={item.month}
            custom={i}
            initial={false}
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeUp}
            className="relative overflow-hidden rounded-lg border border-[#C9A84C]/16 bg-[#101010] p-5"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/50 to-transparent" />
            <div className="mb-5 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
                {item.month}
              </p>
              <Calendar size={16} className="text-[#C9A84C]/70" />
            </div>
            <h3 className="text-lg font-semibold text-white">{item.service}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function PlanCard({
  label,
  name,
  subtitle,
  condition,
  highlighted = false,
}: {
  label: string;
  name: string;
  subtitle: string;
  condition: { installments: number; monthlyValue: number; note: string };
  highlighted?: boolean;
}) {
  return (
    <motion.div
      custom={highlighted ? 0 : 1}
      initial={false}
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeUp}
      className="rounded-lg border p-5 sm:p-6"
      style={{
        background: highlighted
          ? "linear-gradient(145deg,#1A1408 0%,#101010 65%,#111108 100%)"
          : "#101010",
        borderColor: highlighted ? "rgba(201,168,76,0.32)" : "rgba(255,255,255,0.07)",
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            {label}
          </p>
          <h3 className="text-xl font-semibold text-white">{name}</h3>
        </div>
        {highlighted ? <Star size={20} className="shrink-0 text-[#C9A84C]" /> : null}
      </div>
      <p className="min-h-20 text-sm leading-relaxed text-[#9CA3AF]">{subtitle}</p>
      <div className="mt-5 border-t border-white/[0.07] pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9CA3AF]">
          Condição Founders
        </p>
        <p className="mt-1 text-2xl font-semibold text-white">
          {condition.installments}x de{" "}
          <span className="text-[#E7C96A]">R$ {condition.monthlyValue}</span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#6F6F6F]">{condition.note}</p>
      </div>
    </motion.div>
  );
}

function ConditionSection({
  recommendedPlan,
  alternativePlan,
  founderConditionSmart,
  founderConditionPriority,
}: {
  recommendedPlan: Founder["recommendedPlan"];
  alternativePlan: Founder["alternativePlan"];
  founderConditionSmart: Founder["founderConditionSmart"];
  founderConditionPriority: Founder["founderConditionPriority"];
}) {
  return (
    <section className="py-10">
      <SectionHeader
        eyebrow="Condição Founders"
        title="A condição reservada para a primeira geração."
        text="A experiência vem primeiro. A condição abaixo existe apenas para os primeiros clientes convidados."
      />
      <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <PlanCard
          label="Recomendado para você"
          name={recommendedPlan.name}
          subtitle={recommendedPlan.subtitle}
          condition={founderConditionSmart}
          highlighted
        />
        <PlanCard
          label="Alternativa"
          name={alternativePlan.name}
          subtitle={alternativePlan.subtitle}
          condition={founderConditionPriority}
        />
      </div>
    </section>
  );
}

function FounderMessageSection({ founderMessage }: { founderMessage: Founder["founderMessage"] }) {
  return (
    <section className="py-10">
      <motion.div
        custom={0}
        initial={false}
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        className="mx-auto grid max-w-4xl gap-6 rounded-lg border border-[#C9A84C]/20 bg-[#101010] p-6 sm:grid-cols-[auto_1fr] sm:p-8"
      >
        <div className="h-20 w-20 overflow-hidden rounded-lg border border-[#C9A84C]/25 bg-[#C9A84C]/10">
          {founderMessage.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={founderMessage.photo}
              alt={founderMessage.signature}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-[#C9A84C]">
              {founderMessage.initials}
            </div>
          )}
        </div>
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
            {founderMessage.title}
          </p>
          <div className="space-y-3 whitespace-pre-line text-base leading-relaxed text-[#D6D6D6]">
            {founderMessage.body}
          </div>
          <div className="mt-6 border-t border-white/[0.07] pt-4">
            <p className="font-semibold text-white">{founderMessage.signature}</p>
            <p className="text-sm text-[#9CA3AF]">{founderMessage.role}</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function FinalInvite({
  firstName,
  vehicleModel,
  onAccept,
  onVip,
}: {
  firstName: string;
  vehicleModel: string;
  onAccept: () => void;
  onVip: () => void;
}) {
  return (
    <section className="pt-10">
      <motion.div
        custom={0}
        initial={false}
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        variants={fadeUp}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-lg border border-[#C9A84C]/25 bg-[linear-gradient(145deg,#1A1408_0%,#0A0A0A_58%,#111108_100%)] p-7 text-center sm:p-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(201,168,76,0.16),transparent_36%)]" />
        <div className="relative">
          <Crown size={28} className="mx-auto mb-5 text-[#C9A84C]" />
          <h2 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
            Algumas histórias merecem continuar.
          </h2>
          <div className="mx-auto mt-4 max-w-xl space-y-2 text-base leading-relaxed text-[#B8B8B8]">
            <p>{firstName},</p>
            <p>Seu {vehicleModel} já faz parte da história da DGN.</p>
            <p>Agora queremos que você faça parte da história do DGN Club.</p>
          </div>

          <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-2">
            <button
              onClick={onAccept}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 font-semibold text-[#080808]"
              style={{
                background: "linear-gradient(135deg, #C9A84C 0%, #F5DA78 48%, #B99132 100%)",
                boxShadow: "0 16px 42px rgba(201,168,76,0.2)",
              }}
            >
              Aceitar meu convite
              <ArrowRight size={17} />
            </button>
            <button
              onClick={onVip}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-5 font-semibold text-white"
            >
              <MessageCircle size={17} />
              Falar com Atendimento VIP
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function ReservationModal({
  open,
  ready,
  number,
  totalFounders,
  onClose,
  onContinue,
}: {
  open: boolean;
  ready: boolean;
  number: string;
  totalFounders: number;
  onClose: () => void;
  onContinue: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.28, ease: easeOut }}
            className="relative w-full max-w-md overflow-hidden rounded-lg border border-[#C9A84C]/25 bg-[#0D0D0D] p-6 text-center shadow-2xl"
          >
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-[#9CA3AF]"
            >
              <X size={16} />
            </button>

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(201,168,76,0.16),transparent_42%)]" />
            <div className="relative pt-5">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg border border-[#C9A84C]/25 bg-[#C9A84C]/10 text-[#C9A84C]">
                {ready ? <CheckCircle2 size={25} /> : <Loader2 size={25} className="animate-spin" />}
              </div>

              <AnimatePresence mode="wait">
                {ready ? (
                  <motion.div
                    key="reserved"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.24 }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
                      Vaga reservada
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight text-white">
                      Sua vaga está reservada pelos próximos 30 minutos.
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-[#9CA3AF]">
                      Mantivemos a confirmação em um passo separado para que você siga com calma.
                    </p>
                    <button
                      onClick={onContinue}
                      className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 font-semibold text-[#080808]"
                      style={{
                        background: "linear-gradient(135deg, #C9A84C 0%, #F5DA78 48%, #B99132 100%)",
                      }}
                    >
                      Continuar para confirmação
                      <ArrowRight size={17} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="preparing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.24 }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
                      Founder {number} de {totalFounders}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight text-white">
                      Preparando sua vaga de Membro Fundador...
                    </h2>
                    <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-[#9CA3AF]">
                      <Clock size={14} className="text-[#C9A84C]" />
                      Confirmação privada
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
