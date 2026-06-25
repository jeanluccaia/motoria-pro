"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Star,
  Car,
  RefreshCw,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { GoldBadge } from "@/components/GoldBadge";
import { WashProgressBar } from "@/components/WashProgressBar";

const easeOut: Easing = "easeOut";
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: easeOut },
  }),
};

const planIncludes = [
  "12 lavagens por mês",
  "Lavagem simples e premium",
  "Prioridade no agendamento",
  "Produtos certificados",
  "Relatório de conservação do veículo",
  "Canal VIP WhatsApp",
  "Alertas de manutenção",
];

export default function PlanoPage() {
  const daysTotal = 181;
  const daysUsed = 152;
  const daysLeft = daysTotal - daysUsed;
  const progressPct = Math.round((daysUsed / daysTotal) * 100);

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#1A1A1A] px-5 py-4"
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Link
            href="/dashboard"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-[#9CA3AF] hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Meu Plano</h1>
            <p className="text-xs text-[#9CA3AF]">Detalhes da assinatura</p>
          </div>
        </div>
      </motion.header>

      <div className="px-5 max-w-lg mx-auto pt-5 space-y-4">
        {/* Membership Card */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #1A1408 0%, #0F0F0F 40%, #111108 100%)",
            border: "1px solid rgba(201,168,76,0.3)",
            boxShadow: "0 20px 60px rgba(201,168,76,0.07)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 80% 10%, rgba(201,168,76,0.14) 0%, transparent 55%)",
            }}
          />
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] text-[#C9A84C]/60 tracking-[0.25em] uppercase font-medium">
                  DGN CLUB
                </p>
                <h2 className="text-2xl font-bold gold-gradient-text mt-0.5">Plano Elite</h2>
              </div>
              <GoldBadge size="sm">
                <Star size={9} />
                Elite
              </GoldBadge>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Lavagens/mês", value: "12" },
                { label: "Veículos", value: "2" },
                { label: "Validade", value: "6 meses" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl font-bold gold-gradient-text">{s.value}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Vigência progress */}
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <CalendarDays size={16} className="text-[#C9A84C] flex-shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#9CA3AF]">24/01/2026</span>
                  <span className="text-[#C9A84C] font-medium">{daysLeft} dias restantes</span>
                  <span className="text-[#9CA3AF]">24/07/2026</span>
                </div>
                <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progressPct}%`,
                      background: "linear-gradient(90deg, #C9A84C, #F0D060)",
                      transition: "width 0.7s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Wash Balance */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="glass-card rounded-2xl p-5"
        >
          <h3 className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.15em] uppercase mb-4">
            Saldo de Lavagens — Junho
          </h3>
          <WashProgressBar used={8} total={12} />
        </motion.div>

        {/* Vehicles */}
        <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.15em] uppercase">
              Veículos
            </h3>
            <Link
              href="/veiculos"
              className="flex items-center gap-1 text-xs text-[#C9A84C] font-medium"
            >
              Gerenciar <ChevronRight size={12} />
            </Link>
          </div>
          <div
            className="flex items-center gap-4 rounded-2xl p-4"
            style={{
              background: "linear-gradient(135deg, #111111 0%, #1A1A1A 100%)",
              border: "1px solid #2A2A2A",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(201,168,76,0.08)" }}
            >
              <Car size={18} className="text-[#C9A84C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">BMW X5 2022 · Prata</p>
              <p className="text-xs text-[#4B5563] font-mono mt-0.5">ABC-1234</p>
            </div>
            <GoldBadge size="sm">Principal</GoldBadge>
          </div>
        </motion.div>

        {/* Plan includes */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid #2A2A2A" }}
        >
          <div
            className="px-4 py-3 border-b border-[#2A2A2A]"
            style={{ background: "#111111" }}
          >
            <h3 className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.15em] uppercase">
              Incluído no plano Elite
            </h3>
          </div>
          {planIncludes.map((item, i) => (
            <div
              key={item}
              className={`flex items-center gap-3 px-4 py-3.5 ${i !== 0 ? "border-t border-[#1A1A1A]" : ""}`}
              style={{ background: "#111111" }}
            >
              <CheckCircle2 size={15} className="text-[#34D399] flex-shrink-0" />
              <p className="text-sm text-white">{item}</p>
            </div>
          ))}
        </motion.div>

        {/* Renewal CTA */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="pb-2"
        >
          <button
            className="w-full py-4 rounded-2xl font-semibold text-[#0A0A0A] text-sm transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 50%, #C9A84C 100%)",
              boxShadow: "0 4px 20px rgba(201,168,76,0.25)",
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <RefreshCw size={16} />
              Renovar Assinatura
            </div>
          </button>
          <p className="text-center text-xs text-[#4B5563] mt-2">
            Renove antes de 24/07/2026 para manter seus benefícios
          </p>
        </motion.div>
      </div>

      <BottomNav active="plano" />
    </div>
  );
}
