"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import {
  ArrowLeft,
  Star,
  CalendarCheck,
  Sparkles,
  Shield,
  MessageCircle,
  Tag,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { GoldBadge } from "@/components/GoldBadge";

const easeOut: Easing = "easeOut";
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: easeOut },
  }),
};

const benefits = [
  {
    icon: CalendarCheck,
    title: "Agendamento Prioritário",
    desc: "Seus horários têm prioridade sobre clientes avulsos em toda a rede DGN.",
    color: "#C9A84C",
    bg: "rgba(201,168,76,0.08)",
  },
  {
    icon: Sparkles,
    title: "Produtos Premium Certificados",
    desc: "Utilizamos apenas produtos premium certificados nos veículos do clube.",
    color: "#818CF8",
    bg: "rgba(129,140,248,0.08)",
  },
  {
    icon: Shield,
    title: "Garantia de Satisfação",
    desc: "Se o resultado não atender, refazemos o serviço sem custo adicional.",
    color: "#34D399",
    bg: "rgba(52,211,153,0.08)",
  },
  {
    icon: MessageCircle,
    title: "Canal VIP WhatsApp",
    desc: "Atendimento direto com respostas em até 30 minutos no horário comercial.",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.08)",
  },
  {
    icon: Tag,
    title: "Descontos em Parceiros",
    desc: "Descontos exclusivos em autopeças, seguros e serviços parceiros da DGN.",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    icon: Bell,
    title: "Alertas de Manutenção",
    desc: "Notificações personalizadas sobre quando seu veículo precisa de cuidados.",
    color: "#60A5FA",
    bg: "rgba(96,165,250,0.08)",
  },
];

export default function BeneficiosPage() {
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
            <h1 className="text-lg font-bold text-white">Benefícios</h1>
            <p className="text-xs text-[#9CA3AF]">Clube DGN Elite</p>
          </div>
        </div>
      </motion.header>

      <div className="px-5 max-w-lg mx-auto pt-5 space-y-4">
        {/* Summary header */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center justify-between glass-card rounded-2xl p-4"
        >
          <div>
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-medium">
              Seus benefícios exclusivos
            </p>
            <p className="text-lg font-bold text-white mt-0.5">
              {benefits.length} benefícios ativos
            </p>
          </div>
          <GoldBadge size="md">
            <Star size={11} />
            Elite
          </GoldBadge>
        </motion.div>

        {/* Benefits list */}
        {benefits.map((benefit, i) => {
          const Icon = benefit.icon;
          return (
            <motion.div
              key={benefit.title}
              custom={i + 1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex items-start gap-4 rounded-2xl p-4 transition-all duration-200 hover:scale-[1.005] active:scale-[0.995]"
              style={{
                background: "linear-gradient(135deg, #111111 0%, #1A1A1A 100%)",
                border: `1px solid ${benefit.color}15`,
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: benefit.bg }}
              >
                <Icon size={20} style={{ color: benefit.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{benefit.title}</p>
                <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">{benefit.desc}</p>
              </div>
            </motion.div>
          );
        })}

        {/* Coming soon teaser */}
        <motion.div
          custom={benefits.length + 1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="rounded-2xl p-5 text-center mb-2"
          style={{
            background:
              "linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(201,168,76,0.02) 100%)",
            border: "1px solid rgba(201,168,76,0.12)",
          }}
        >
          <p className="text-sm font-semibold text-white mb-1">Parceiros em breve</p>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            Novos descontos e benefícios em parceiros selecionados chegando em breve.
          </p>
        </motion.div>
      </div>

      <BottomNav active="beneficios" />
    </div>
  );
}
