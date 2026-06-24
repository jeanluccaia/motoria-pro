"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  Clock,
  MessageCircle,
  ChevronRight,
  Droplets,
  Bell,
  Star,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { GoldBadge } from "@/components/GoldBadge";
import { WashProgressBar } from "@/components/WashProgressBar";

const easeOut: Easing = "easeOut";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: easeOut },
  }),
};

const actionCards = [
  {
    icon: Calendar,
    label: "Agendar Lavagem",
    desc: "Escolha horário",
    href: "/agendar",
    color: "#C9A84C",
    bg: "rgba(201,168,76,0.1)",
  },
  {
    icon: Sparkles,
    label: "Serviços Extras",
    desc: "Polimento e mais",
    href: "/servicos",
    color: "#818CF8",
    bg: "rgba(129,140,248,0.1)",
  },
  {
    icon: Clock,
    label: "Histórico",
    desc: "Seus registros",
    href: "/historico",
    color: "#34D399",
    bg: "rgba(52,211,153,0.1)",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp VIP",
    desc: "Atendimento premium",
    href: "https://wa.me/5500000000000",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.1)",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#1A1A1A] px-5 py-4"
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-xs text-[#9CA3AF] tracking-wider uppercase">Bem-vindo de volta</p>
            <h1 className="text-xl font-bold text-white mt-0.5">Olá, Carlos</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-[#9CA3AF] hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#C9A84C]" />
            </button>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-[#0A0A0A]"
              style={{
                background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 100%)",
              }}
            >
              CL
            </div>
          </div>
        </div>
      </motion.header>

      <div className="px-5 max-w-lg mx-auto space-y-5 pt-5">
        {/* Vehicle Card */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #111111 0%, #1A1A1A 100%)",
            border: "1px solid rgba(201,168,76,0.2)",
          }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background: "radial-gradient(ellipse at top right, #C9A84C 0%, transparent 60%)",
            }}
          />
          <div className="relative p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[11px] text-[#9CA3AF] tracking-widest uppercase font-medium mb-1">
                  Veículo principal
                </p>
                <h2 className="text-xl font-bold text-white">BMW X5 2022</h2>
                <p className="text-sm text-[#9CA3AF] mt-0.5">Prata • ABC-1234</p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(201,168,76,0.1)" }}
              >
                <Droplets className="text-[#C9A84C]" size={22} />
              </div>
            </div>

            {/* Plan Badge */}
            <div className="flex items-center gap-2 mb-4">
              <GoldBadge size="sm">
                <Star size={10} />
                Plano Elite
              </GoldBadge>
              <span className="text-[11px] text-[#34D399] bg-[#34D399]/10 px-2 py-0.5 rounded-full font-medium">
                Ativo
              </span>
            </div>

            {/* Info row */}
            <div className="flex items-center gap-4 pt-3 border-t border-[#2A2A2A]">
              <div>
                <p className="text-[11px] text-[#9CA3AF]">Última lavagem</p>
                <p className="text-sm font-semibold text-white">18/06/2026</p>
              </div>
              <div className="w-px h-8 bg-[#2A2A2A]" />
              <div>
                <p className="text-[11px] text-[#9CA3AF]">Próximo cuidado</p>
                <p className="text-sm font-semibold text-[#C9A84C]">27/06/2026</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Card */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="glass-card rounded-2xl p-5"
        >
          <WashProgressBar used={8} total={12} />
        </motion.div>

        {/* Action Cards */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <h3 className="text-sm font-semibold text-[#9CA3AF] tracking-widest uppercase mb-3">
            Serviços
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {actionCards.map((card, i) => {
              const Icon = card.icon;
              const isExternal = card.href.startsWith("http");

              const cardContent = (
                <>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: card.bg }}
                  >
                    <Icon size={20} style={{ color: card.color }} />
                  </div>
                  <p className="text-sm font-semibold text-white leading-tight">
                    {card.label}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{card.desc}</p>
                </>
              );

              const cardStyle = {
                background: "linear-gradient(135deg, #111111 0%, #1A1A1A 100%)",
                border: `1px solid ${card.color}20`,
              };

              return (
                <motion.div
                  key={card.label}
                  custom={2 + i * 0.5}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                >
                  {isExternal ? (
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl p-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={cardStyle}
                    >
                      {cardContent}
                    </a>
                  ) : (
                    <Link
                      href={card.href}
                      className="block rounded-2xl p-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={cardStyle}
                    >
                      {cardContent}
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Next Care Card */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)",
            border: "1px solid rgba(201,168,76,0.2)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(201,168,76,0.15)" }}
            >
              <Sparkles size={18} className="text-[#C9A84C]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wider font-medium">
                Próximo cuidado recomendado
              </p>
              <p className="text-white font-semibold mt-1">Lavagem Premium + Cera</p>
              <p className="text-sm text-[#9CA3AF] mt-0.5">
                Recomendado para 27/06/2026 · Proteção completa
              </p>
            </div>
            <ChevronRight size={16} className="text-[#C9A84C] mt-1 flex-shrink-0" />
          </div>
        </motion.div>
      </div>

      <BottomNav active="dashboard" />
    </div>
  );
}
