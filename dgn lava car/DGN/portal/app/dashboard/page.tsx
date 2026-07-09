"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  MessageCircle,
  Bell,
  Star,
  Car,
  ChevronRight,
  ExternalLink,
  Crown,
  ClipboardEdit,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { GoldBadge } from "@/components/GoldBadge";
import { WashProgressBar } from "@/components/WashProgressBar";
import { FounderCard } from "@/components/FounderCard";
import { urls, whatsappAtendimento } from "@/lib/config";

const easeOut: Easing = "easeOut";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: easeOut },
  }),
};

// Assinante demo — substituir por dados reais via sessão autenticada em produção
const DEMO_SUBSCRIBER = {
  id: "jose-moreira",
  name: "José Moreira",
  firstName: "José",
  initials: "JM",
  plan: "DGN Smart Semestral",
  planLabel: "Smart",
  planStatus: "Ativo" as const,
  validity: "jan/2026 → jul/2026",
  vehicle: {
    model: "Honda Fit",
    color: "Prata",
    plateMasked: "GEM-****",
  },
  washesUsed: 8,
  washesTotal: 12,
  isFounder: true,
  founder: {
    number: "Nº002",
    slug: "jose-moreira",
    plan: "DGN Smart Semestral",
    vehicle: "Honda Fit",
    status: "ativo" as const,
  },
};

const actionButtons = [
  {
    icon: Calendar,
    label: "Agendar Lavagem",
    desc: "Agenda da 4U",
    href: urls.agenda4U,
    color: "#C9A84C",
    bg: "rgba(201,168,76,0.1)",
    external: true,
  },
  {
    icon: Sparkles,
    label: "Serviços Extras",
    desc: "Vitrine 4U",
    href: urls.vitrine4U,
    color: "#818CF8",
    bg: "rgba(129,140,248,0.1)",
    external: true,
  },
  {
    icon: MessageCircle,
    label: "Atendimento VIP",
    desc: "WhatsApp premium",
    href: urls.whatsappVIP,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.1)",
    external: true,
  },
  {
    icon: Star,
    label: "Benefícios do Clube",
    desc: "Ver todos",
    href: "/beneficios",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    external: false,
  },
];

const founderStatusLabel: Record<string, string> = {
  ativo: "Ativo",
  "convite enviado": "Convite enviado",
  "cadastro pendente": "Cadastro pendente",
  "cartão gerado": "Cartão gerado",
  "acompanhamento ativo": "Acompanhamento ativo",
};

export default function DashboardPage() {
  const subscriber = DEMO_SUBSCRIBER;
  const { isFounder, founder } = subscriber;
  const waAtendimento = whatsappAtendimento(isFounder);

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
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-xl font-bold text-white">Olá, {subscriber.firstName}</h1>
              {isFounder && (
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.3)",
                  }}
                >
                  <Crown size={10} className="text-[#C9A84C]" />
                  <span className="text-[9px] font-semibold text-[#C9A84C] tracking-wider uppercase">
                    Founder
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-[#9CA3AF] hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#C9A84C]" />
            </button>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-[#0A0A0A]"
              style={{ background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 100%)" }}
            >
              {subscriber.initials}
            </div>
          </div>
        </div>
      </motion.header>

      <div className="px-5 max-w-lg mx-auto space-y-4 pt-5">
        {/* Membership Card */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #1A1408 0%, #0F0F0F 40%, #111108 100%)",
            border: isFounder
              ? "1px solid rgba(201,168,76,0.45)"
              : "1px solid rgba(201,168,76,0.3)",
            boxShadow: isFounder
              ? "0 20px 60px rgba(201,168,76,0.1)"
              : "0 20px 60px rgba(201,168,76,0.07)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 80% 10%, rgba(201,168,76,0.14) 0%, transparent 55%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[10px] text-[#C9A84C]/60 tracking-[0.25em] uppercase font-medium">
                  DGN CLUB
                </p>
                <h2 className="text-2xl font-bold gold-gradient-text tracking-tight mt-0.5">
                  {subscriber.planLabel}
                </h2>
              </div>
              {isFounder ? (
                <div className="flex flex-col items-end gap-1.5">
                  <GoldBadge size="sm">
                    <Crown size={9} />
                    Founder
                  </GoldBadge>
                  <span className="text-[9px] text-[#C9A84C]/60 tracking-wider">
                    {founder!.number}
                  </span>
                </div>
              ) : (
                <GoldBadge size="sm">
                  <Star size={9} />
                  Elite
                </GoldBadge>
              )}
            </div>

            <p className="text-white text-xl font-semibold tracking-wide mb-5">
              {subscriber.name}
            </p>

            {isFounder && (
              <div
                className="mb-4 px-3 py-2 rounded-xl flex items-center gap-2"
                style={{
                  background: "rgba(201,168,76,0.06)",
                  border: "1px solid rgba(201,168,76,0.15)",
                }}
              >
                <Crown size={12} className="text-[#C9A84C] flex-shrink-0" />
                <p className="text-[11px] text-[#C9A84C]/80 leading-snug">
                  Você faz parte do início da nova fase da DGN Club.
                </p>
              </div>
            )}

            <div className="flex items-end justify-between pt-4 border-t border-white/[0.06]">
              <div>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest font-medium mb-0.5">
                  Vigência
                </p>
                <p className="text-sm font-semibold text-white">{subscriber.validity}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest font-medium mb-0.5">
                  Status
                </p>
                <span className="text-xs font-semibold text-[#34D399] bg-[#34D399]/10 px-2.5 py-1 rounded-full">
                  {subscriber.planStatus}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Vehicle compact */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center gap-4 rounded-2xl p-4"
          style={{
            background: "linear-gradient(135deg, #111111 0%, #1A1A1A 100%)",
            border: "1px solid #2A2A2A",
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201,168,76,0.08)" }}
          >
            <Car size={20} className="text-[#C9A84C]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest font-medium">
              Veículo principal
            </p>
            <p className="text-sm font-semibold text-white mt-0.5">
              {subscriber.vehicle.model} · {subscriber.vehicle.color}
            </p>
            <p className="text-xs text-[#4B5563] mt-0.5 font-mono">
              {subscriber.vehicle.plateMasked}
            </p>
          </div>
          <Link href="/veiculos" className="text-[#C9A84C]">
            <ChevronRight size={16} />
          </Link>
        </motion.div>

        {/* Wash Progress */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="glass-card rounded-2xl p-5"
        >
          <WashProgressBar used={subscriber.washesUsed} total={subscriber.washesTotal} />
        </motion.div>

        {/* Founders DGN Section — apenas para Founders */}
        {isFounder && founder && (
          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
            {/* Header da seção */}
            <div className="flex items-center gap-2 mb-3">
              <Crown size={14} className="text-[#C9A84C]" />
              <h3 className="text-[11px] font-semibold text-[#C9A84C] tracking-[0.15em] uppercase">
                Founders DGN
              </h3>
            </div>

            {/* Info row */}
            <div
              className="rounded-2xl p-4 mb-3"
              style={{
                background: "linear-gradient(135deg, #0F0D06 0%, #111111 100%)",
                border: "1px solid rgba(201,168,76,0.2)",
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] text-[#6B7280] uppercase tracking-widest mb-1">
                    Número Founder
                  </p>
                  <p className="text-sm font-bold text-[#C9A84C]">{founder.number}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#6B7280] uppercase tracking-widest mb-1">
                    Status
                  </p>
                  <span className="text-xs font-semibold text-[#34D399] bg-[#34D399]/10 px-2 py-0.5 rounded-full">
                    {founderStatusLabel[founder.status] ?? founder.status}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] text-[#6B7280] uppercase tracking-widest mb-1">
                    Plano validado
                  </p>
                  <p className="text-xs font-semibold text-white">{founder.plan}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#6B7280] uppercase tracking-widest mb-1">
                    Veículo principal
                  </p>
                  <p className="text-xs font-semibold text-white">{founder.vehicle}</p>
                </div>
              </div>
            </div>

            {/* Cartão visual Founder */}
            <FounderCard
              name={subscriber.name}
              founderNumber={founder.number}
              plan={founder.plan}
              vehicle={founder.vehicle}
            />

            {/* Botão Ver minha área Founder */}
            <Link
              href={`/founders/${founder.slug}`}
              className="mt-3 flex items-center justify-between rounded-2xl px-5 py-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.04) 100%)",
                border: "1px solid rgba(201,168,76,0.25)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(201,168,76,0.12)" }}
                >
                  <Crown size={16} className="text-[#C9A84C]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Ver minha área Founder</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Página personalizada exclusiva</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#C9A84C]" />
            </Link>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          custom={isFounder ? 4 : 3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <h3 className="text-[11px] font-semibold text-[#9CA3AF] tracking-[0.15em] uppercase mb-3">
            Acesso rápido
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {actionButtons.map((btn, i) => {
              const Icon = btn.icon;
              const inner = (
                <>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: btn.bg }}
                  >
                    <Icon size={20} style={{ color: btn.color }} />
                  </div>
                  <p className="text-sm font-semibold text-white leading-tight">{btn.label}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-xs text-[#9CA3AF]">{btn.desc}</p>
                    {btn.external && <ExternalLink size={9} className="text-[#4B5563]" />}
                  </div>
                </>
              );
              const cardStyle = {
                background: "linear-gradient(135deg, #111111 0%, #1A1A1A 100%)",
                border: `1px solid ${btn.color}1A`,
              };
              const cardClass =
                "block rounded-2xl p-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]";

              return (
                <motion.div
                  key={btn.label}
                  custom={(isFounder ? 4 : 3) + i * 0.4}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                >
                  {btn.external ? (
                    <a
                      href={btn.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cardClass}
                      style={cardStyle}
                    >
                      {inner}
                    </a>
                  ) : (
                    <Link href={btn.href} className={cardClass} style={cardStyle}>
                      {inner}
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Falar com Atendimento DGN */}
        <motion.div
          custom={isFounder ? 5 : 4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <a
            href={waAtendimento}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.02) 100%)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(34,197,94,0.1)" }}
            >
              <MessageCircle size={20} className="text-[#22C55E]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Falar com Atendimento DGN</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {isFounder ? "Atendimento exclusivo Founder" : "Suporte via WhatsApp"}
              </p>
            </div>
            <ExternalLink size={14} className="text-[#22C55E] flex-shrink-0" />
          </a>
        </motion.div>

        {/* Atualizar Cadastro */}
        <motion.div
          custom={isFounder ? 5.4 : 4.4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <Link
            href="/cadastro"
            className="flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: "linear-gradient(135deg, #111111 0%, #1A1A1A 100%)",
              border: "1px solid #2A2A2A",
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(201,168,76,0.08)" }}
            >
              <ClipboardEdit size={20} className="text-[#C9A84C]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Atualizar cadastro</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Dados pessoais e do veículo</p>
            </div>
            <ChevronRight size={16} className="text-[#4B5563]" />
          </Link>
        </motion.div>

        {/* Next Care */}
        <motion.div
          custom={isFounder ? 6 : 5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <Link
            href="/plano"
            className="flex items-start gap-3 rounded-2xl p-5 transition-all duration-200 active:scale-[0.99]"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,168,76,0.07) 0%, rgba(201,168,76,0.02) 100%)",
              border: "1px solid rgba(201,168,76,0.18)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(201,168,76,0.12)" }}
            >
              <Sparkles size={18} className="text-[#C9A84C]" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-medium">
                Próximo cuidado recomendado
              </p>
              <p className="text-white font-semibold mt-1">Lavagem Premium + Cera</p>
              <p className="text-sm text-[#9CA3AF] mt-0.5">27/06/2026 · Proteção completa</p>
            </div>
            <ChevronRight size={16} className="text-[#C9A84C] mt-1 flex-shrink-0" />
          </Link>
        </motion.div>
      </div>

      <BottomNav active="dashboard" />
    </div>
  );
}
