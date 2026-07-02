"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import { Crown, Car, Calendar, Star, MessageCircle } from "lucide-react";
import { getFounderBySlug } from "@/lib/founders-data";

const easeOut: Easing = "easeOut";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: easeOut },
  }),
};

const founder = getFounderBySlug("jose-moreira")!;

export default function JoseMoreiraFounderPage() {
  const { firstName, fullName, vehicle, memberSince, historyCards, timeline, monthPlan, recommendedPlan, alternativePlan, links, number, totalServices, lastServiceDate, totalSpent } = founder;

  const handleCTA = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-5 pt-16 pb-14 flex flex-col items-center text-center">
        {/* ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201,168,76,0.18) 0%, transparent 70%)",
          }}
        />
        {/* grid texture */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative max-w-lg w-full space-y-6">
          {/* badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border"
            style={{
              background: "rgba(201,168,76,0.08)",
              borderColor: "rgba(201,168,76,0.25)",
            }}
          >
            <Crown size={13} className="text-[#C9A84C]" />
            <span className="text-[11px] font-semibold text-[#C9A84C] tracking-[0.15em] uppercase">
              Convite Exclusivo · Founders
            </span>
          </motion.div>

          {/* greeting */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="space-y-3"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              Olá, {firstName}.
            </h1>
            <p
              className="text-xl sm:text-2xl font-light tracking-wide"
              style={{
                background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 50%, #D4AF37 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              É muito bom ter você de volta.
            </p>
          </motion.div>

          <motion.p
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-[#9CA3AF] text-base sm:text-lg leading-relaxed max-w-sm mx-auto"
          >
            Desde {memberSince}, tivemos o privilégio de cuidar do seu {vehicle.model} e acompanhar
            sua história com a DGN.
          </motion.p>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-white/80 text-base leading-relaxed max-w-sm mx-auto"
          >
            Agora queremos convidá-lo para fazer parte da{" "}
            <span className="text-white font-semibold">primeira geração de Membros Fundadores</span>{" "}
            da DGN Club.
          </motion.p>

          <motion.button
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            onClick={() => handleCTA(links.checkoutSmartFounder)}
            whileTap={{ scale: 0.97 }}
            className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-4 px-8 rounded-2xl font-bold text-base text-[#0A0A0A] transition-all"
            style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 50%, #C9A84C 100%)",
              boxShadow: "0 8px 32px rgba(201,168,76,0.35)",
            }}
          >
            <Crown size={18} />
            Quero ser Membro Fundador
          </motion.button>
        </div>
      </section>

      {/* ── FOUNDER CARD ── */}
      <section className="px-5 pb-10 max-w-lg mx-auto">
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #1A1408 0%, #0D0D0D 45%, #111108 100%)",
            border: "1px solid rgba(201,168,76,0.35)",
            boxShadow: "0 24px 80px rgba(201,168,76,0.12)",
          }}
        >
          {/* glow top-right */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 85% 5%, rgba(201,168,76,0.18) 0%, transparent 60%)",
            }}
          />
          {/* subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative p-7">
            {/* top row */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-[10px] text-[#C9A84C]/60 tracking-[0.3em] uppercase font-semibold mb-1">
                  DGN CLUB
                </p>
                <p
                  className="text-3xl font-black tracking-tight"
                  style={{
                    background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 50%, #D4AF37 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Founder {number}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))",
                  border: "1px solid rgba(201,168,76,0.3)",
                }}
              >
                <Crown size={22} className="text-[#C9A84C]" />
              </div>
            </div>

            {/* member name */}
            <p className="text-white text-2xl font-semibold tracking-wide mb-1">{fullName}</p>
            <div className="flex items-center gap-2 mb-8">
              <Car size={14} className="text-[#C9A84C]" />
              <p className="text-[#9CA3AF] text-sm">{vehicle.model}</p>
            </div>

            {/* divider */}
            <div className="border-t border-white/[0.06] pt-5">
              <p className="text-[11px] text-[#9CA3AF]/70 tracking-[0.15em] uppercase font-medium text-center">
                Primeira geração de Membros Fundadores
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── HISTÓRICO ── */}
      <section className="px-5 pb-12 max-w-lg mx-auto">
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="space-y-5"
        >
          <div className="text-center mb-6">
            <p className="text-[11px] text-[#C9A84C] tracking-[0.2em] uppercase font-semibold mb-2">
              Sua história com a DGN
            </p>
            <h2 className="text-2xl font-bold text-white">
              Uma relação que já existe.
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {historyCards.map((card, i) => (
              <motion.div
                key={card.label}
                custom={5 + i * 0.15}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="rounded-2xl p-4 space-y-1"
                style={{
                  background: "linear-gradient(135deg, #111111 0%, #1A1A1A 100%)",
                  border: "1px solid rgba(201,168,76,0.12)",
                }}
              >
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-medium leading-tight">
                  {card.label}
                </p>
                <p className="text-white font-bold text-base leading-tight">{card.value}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            custom={6}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="rounded-2xl p-5 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(201,168,76,0.02) 100%)",
              border: "1px solid rgba(201,168,76,0.12)",
            }}
          >
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Esse histórico mostra que você não está entrando em um clube novo.
              <br />
              <span className="text-white font-medium">
                Você está oficializando uma relação que já existe.
              </span>
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="px-5 pb-12 max-w-lg mx-auto">
        <motion.div
          custom={7}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="space-y-5"
        >
          <div className="text-center mb-6">
            <p className="text-[11px] text-[#C9A84C] tracking-[0.2em] uppercase font-semibold mb-2">
              Linha do tempo
            </p>
            <h2 className="text-2xl font-bold text-white">Sua jornada na DGN</h2>
          </div>

          <div className="relative pl-6">
            {/* vertical line */}
            <div
              className="absolute left-3 top-2 bottom-2 w-px"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, rgba(201,168,76,0.4) 15%, rgba(201,168,76,0.4) 85%, transparent)",
              }}
            />

            <div className="space-y-0">
              {timeline.map((item, i) => {
                const isLast = i === timeline.length - 1;
                return (
                  <motion.div
                    key={item.year}
                    custom={7 + i * 0.12}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="relative flex items-start gap-4 pb-6"
                  >
                    {/* dot */}
                    <div
                      className="absolute left-[-0.9375rem] top-1 w-3 h-3 rounded-full flex-shrink-0 border-2"
                      style={{
                        background: isLast ? "#C9A84C" : "#1A1A1A",
                        borderColor: isLast ? "#F0D060" : "rgba(201,168,76,0.4)",
                        boxShadow: isLast ? "0 0 12px rgba(201,168,76,0.5)" : "none",
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-bold tracking-wider uppercase mb-0.5"
                        style={{ color: isLast ? "#C9A84C" : "#6B7280" }}
                      >
                        {item.year}
                      </p>
                      <p
                        className="text-sm leading-snug"
                        style={{ color: isLast ? "#ffffff" : "#9CA3AF" }}
                      >
                        {item.event}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── PLANEJAMENTO 6 MESES ── */}
      <section className="px-5 pb-12 max-w-lg mx-auto">
        <motion.div
          custom={9}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="space-y-5"
        >
          <div className="text-center mb-6">
            <p className="text-[11px] text-[#C9A84C] tracking-[0.2em] uppercase font-semibold mb-2">
              Próximos 6 meses
            </p>
            <h2 className="text-2xl font-bold text-white">
              Seu cuidado já está planejado.
            </h2>
          </div>

          <div className="space-y-2">
            {monthPlan.map((item, i) => (
              <motion.div
                key={item.month}
                custom={9 + i * 0.1}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="flex items-center gap-4 rounded-xl px-4 py-3.5"
                style={{
                  background: "linear-gradient(135deg, #111111 0%, #1A1A1A 100%)",
                  border: "1px solid #2A2A2A",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#C9A84C]"
                  style={{ background: "rgba(201,168,76,0.08)" }}
                >
                  {item.month.slice(0, 3).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#C9A84C] font-semibold tracking-wide uppercase mb-0.5">
                    {item.month}
                  </p>
                  <p className="text-sm text-[#9CA3AF] leading-tight truncate">{item.service}</p>
                </div>
                <Calendar size={14} className="text-[#2A2A2A] flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── PLANO RECOMENDADO ── */}
      <section className="px-5 pb-12 max-w-lg mx-auto">
        <motion.div
          custom={11}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="space-y-5"
        >
          <div className="text-center mb-6">
            <p className="text-[11px] text-[#C9A84C] tracking-[0.2em] uppercase font-semibold mb-2">
              Recomendamos para você
            </p>
            <h2 className="text-2xl font-bold text-white">{recommendedPlan.name}</h2>
          </div>

          {/* recommended plan */}
          <div
            className="relative rounded-2xl p-6 space-y-4"
            style={{
              background: "linear-gradient(145deg, #1A1408 0%, #0F0F0F 60%, #111108 100%)",
              border: "1px solid rgba(201,168,76,0.3)",
              boxShadow: "0 12px 40px rgba(201,168,76,0.08)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#C9A84C] tracking-[0.2em] uppercase">
                  Recomendado
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{recommendedPlan.name}</h3>
              </div>
              <Star size={20} className="text-[#C9A84C] mt-1 flex-shrink-0" />
            </div>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">{recommendedPlan.subtitle}</p>
            <div className="border-t border-white/[0.06] pt-4">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1">
                Condição Founders
              </p>
              <p className="text-white font-bold text-2xl">
                6x de{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  R$ {recommendedPlan.monthlyValue}
                </span>
              </p>
            </div>
          </div>

          {/* alternative plan */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{
              background: "linear-gradient(135deg, #111111 0%, #1A1A1A 100%)",
              border: "1px solid #2A2A2A",
            }}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-white">{alternativePlan.name}</h3>
              <span
                className="text-xs font-semibold text-[#9CA3AF] px-2.5 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                Alternativa
              </span>
            </div>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">{alternativePlan.subtitle}</p>
            <p className="text-white font-bold text-lg">
              6x de R$ {alternativePlan.monthlyValue}
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── CONDIÇÃO FOUNDERS ── */}
      <section className="px-5 pb-12 max-w-lg mx-auto">
        <motion.div
          custom={13}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="space-y-5"
        >
          <div className="text-center mb-6">
            <p className="text-[11px] text-[#C9A84C] tracking-[0.2em] uppercase font-semibold mb-2">
              Condição exclusiva
            </p>
            <h2 className="text-2xl font-bold text-white">Founders</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "DGN Smart", value: "R$ 110", label: "6x de" },
              { name: "DGN Priority", value: "R$ 200", label: "6x de" },
            ].map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl p-5 text-center space-y-2"
                style={{
                  background: "linear-gradient(135deg, #111111 0%, #1A1A1A 100%)",
                  border: "1px solid rgba(201,168,76,0.15)",
                }}
              >
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-medium">
                  {plan.name}
                </p>
                <div>
                  <p className="text-[10px] text-[#9CA3AF]/60">{plan.label}</p>
                  <p
                    className="text-2xl font-black"
                    style={{
                      background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {plan.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-[#4B5563] leading-relaxed">
            A condição Founders foi criada apenas para a primeira geração de clientes convidados.
          </p>
        </motion.div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-5 pb-20 max-w-lg mx-auto">
        <motion.div
          custom={15}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative rounded-3xl overflow-hidden p-8 text-center space-y-6"
          style={{
            background: "linear-gradient(145deg, #1A1408 0%, #0D0D0D 50%, #111108 100%)",
            border: "1px solid rgba(201,168,76,0.25)",
            boxShadow: "0 24px 80px rgba(201,168,76,0.1)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.12) 0%, transparent 65%)",
            }}
          />

          <div className="relative space-y-4">
            <div className="flex justify-center">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))",
                  border: "1px solid rgba(201,168,76,0.25)",
                }}
              >
                <Crown size={28} className="text-[#C9A84C]" />
              </div>
            </div>

            <div>
              <p className="text-white text-lg font-bold leading-snug">
                {firstName}, sua história com a DGN
                <br />
                já começou há anos.
              </p>
              <p className="text-[#9CA3AF] text-sm mt-2 leading-relaxed">
                Agora queremos que você faça parte
                <br />
                da fundação do Clube.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <motion.button
                onClick={() => handleCTA(links.checkoutSmartFounder)}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center gap-2 py-4 px-8 rounded-2xl font-bold text-base text-[#0A0A0A] transition-all"
                style={{
                  background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 50%, #C9A84C 100%)",
                  boxShadow: "0 8px 32px rgba(201,168,76,0.3)",
                }}
              >
                <Crown size={18} />
                Quero ser Membro Fundador
              </motion.button>

              <motion.button
                onClick={() => handleCTA(links.whatsappVip)}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl font-semibold text-sm text-white transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <MessageCircle size={16} />
                Falar com Atendimento VIP
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* footer */}
      <footer className="px-5 pb-10 text-center">
        <p className="text-[11px] text-[#2A2A2A] tracking-widest uppercase font-medium">
          DGN Club · Cuidados automotivos premium
        </p>
      </footer>
    </div>
  );
}
