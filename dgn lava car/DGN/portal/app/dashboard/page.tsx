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
  Clock,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { GoldBadge } from "@/components/GoldBadge";
import { WashProgressBar } from "@/components/WashProgressBar";
import { FounderCard } from "@/components/FounderCard";
import { urls, whatsappAtendimento } from "@/lib/config";

const easeOut: Easing = "easeOut";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: easeOut },
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
    desc: "Solicitar pelo WhatsApp",
    href: urls.agenda4U,
    color: "#C9A84C",
    bg: "rgba(201,168,76,0.1)",
    external: true,
  },
  {
    icon: Sparkles,
    label: "Serviços Extras",
    desc: "Consultar pelo WhatsApp",
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]/80">
      {children}
    </p>
  );
}

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
        className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0A0A]/90 px-5 py-4 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#9CA3AF]">Bem-vindo de volta</p>
            <div className="mt-0.5 flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Olá, {subscriber.firstName}</h1>
              {isFounder && (
                <div
                  className="flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.3)",
                  }}
                >
                  <Crown size={10} className="text-[#C9A84C]" />
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-[#C9A84C]">
                    Founder
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#9CA3AF] transition-colors hover:text-white">
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#C9A84C]" />
            </button>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-[#0A0A0A]"
              style={{ background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 100%)" }}
            >
              {subscriber.initials}
            </div>
          </div>
        </div>
      </motion.header>

      <div className="mx-auto max-w-lg space-y-8 px-5 pt-6">
        {/* ============ 1. IDENTIDADE ============ */}
        <section className="space-y-3">
          {/* Membership Card */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="relative overflow-hidden rounded-3xl"
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
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#C9A84C]/60">
                    DGN CLUB
                  </p>
                  <h2 className="gold-gradient-text mt-0.5 text-2xl font-bold tracking-tight">
                    {subscriber.planLabel}
                  </h2>
                </div>
                {isFounder ? (
                  <div className="flex flex-col items-end gap-1.5">
                    <GoldBadge size="sm">
                      <Crown size={9} />
                      Founder
                    </GoldBadge>
                    <span className="text-[9px] tracking-wider text-[#C9A84C]/60">
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

              <p className="mb-5 text-xl font-semibold tracking-wide text-white">
                {subscriber.name}
              </p>

              {isFounder && (
                <div
                  className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{
                    background: "rgba(201,168,76,0.06)",
                    border: "1px solid rgba(201,168,76,0.15)",
                  }}
                >
                  <Crown size={12} className="flex-shrink-0 text-[#C9A84C]" />
                  <p className="text-[11px] leading-snug text-[#C9A84C]/80">
                    Você faz parte do início da nova fase da DGN Club.
                  </p>
                </div>
              )}

              <div className="flex items-end justify-between border-t border-white/[0.06] pt-4">
                <div>
                  <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[#9CA3AF]">
                    Vigência
                  </p>
                  <p className="text-sm font-semibold text-white">{subscriber.validity}</p>
                </div>
                <div className="text-right">
                  <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[#9CA3AF]">
                    Status
                  </p>
                  <span className="rounded-full bg-[#34D399]/10 px-2.5 py-1 text-xs font-semibold text-[#34D399]">
                    {subscriber.planStatus}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Founder card + info — só para Founders */}
          {isFounder && founder && (
            <>
              <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
                <FounderCard
                  name={subscriber.name}
                  founderNumber={founder.number}
                  plan={founder.plan}
                  vehicle={founder.vehicle}
                />
              </motion.div>

              <motion.div
                custom={2}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="rounded-2xl p-4"
                style={{
                  background: "linear-gradient(135deg, #0F0D06 0%, #111111 100%)",
                  border: "1px solid rgba(201,168,76,0.2)",
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-[9px] uppercase tracking-widest text-[#6B7280]">
                      Número Founder
                    </p>
                    <p className="text-sm font-bold text-[#C9A84C]">{founder.number}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] uppercase tracking-widest text-[#6B7280]">
                      Status
                    </p>
                    <span className="rounded-full bg-[#34D399]/10 px-2 py-0.5 text-xs font-semibold text-[#34D399]">
                      {founderStatusLabel[founder.status] ?? founder.status}
                    </span>
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] uppercase tracking-widest text-[#6B7280]">
                      Plano validado
                    </p>
                    <p className="text-xs font-semibold text-white">{founder.plan}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] uppercase tracking-widest text-[#6B7280]">
                      Veículo principal
                    </p>
                    <p className="text-xs font-semibold text-white">{founder.vehicle}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
                <Link
                  href={`/founders/${founder.slug}`}
                  className="flex items-center justify-between rounded-2xl px-5 py-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.04) 100%)",
                    border: "1px solid rgba(201,168,76,0.25)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: "rgba(201,168,76,0.12)" }}
                    >
                      <Crown size={16} className="text-[#C9A84C]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Ver minha área Founder</p>
                      <p className="mt-0.5 text-xs text-[#9CA3AF]">Página personalizada exclusiva</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#C9A84C]" />
                </Link>
              </motion.div>
            </>
          )}

          {/* Vehicle compact */}
          <motion.div
            custom={isFounder ? 4 : 1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex items-center gap-4 rounded-2xl p-4"
            style={{
              background: "linear-gradient(135deg, #111111 0%, #1A1A1A 100%)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(201,168,76,0.08)" }}
            >
              <Car size={20} className="text-[#C9A84C]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-widest text-[#9CA3AF]">
                Veículo principal
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                {subscriber.vehicle.model} · {subscriber.vehicle.color}
              </p>
              <p className="mt-0.5 font-mono text-xs text-[#4B5563]">
                {subscriber.vehicle.plateMasked}
              </p>
            </div>
            <Link href="/veiculos" className="text-[#C9A84C]">
              <ChevronRight size={16} />
            </Link>
          </motion.div>
        </section>

        {/* ============ 2. OPERAÇÃO ============ */}
        <section className="space-y-3">
          <SectionLabel>Operação</SectionLabel>
          <motion.div
            custom={5}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="grid grid-cols-2 gap-3"
          >
            {actionButtons.map((btn) => {
              const Icon = btn.icon;
              const inner = (
                <>
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: btn.bg }}
                  >
                    <Icon size={20} style={{ color: btn.color }} />
                  </div>
                  <p className="text-sm font-semibold leading-tight text-white">{btn.label}</p>
                  <div className="mt-1 flex items-center gap-1">
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

              return btn.external ? (
                <a
                  key={btn.label}
                  href={btn.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardClass}
                  style={cardStyle}
                >
                  {inner}
                </a>
              ) : (
                <Link key={btn.label} href={btn.href} className={cardClass} style={cardStyle}>
                  {inner}
                </Link>
              );
            })}
          </motion.div>

          <motion.div custom={6} initial="hidden" animate="visible" variants={fadeUp}>
            <a
              href={waAtendimento}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.02) 100%)",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(34,197,94,0.1)" }}
              >
                <MessageCircle size={20} className="text-[#22C55E]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Falar com Atendimento DGN</p>
                <p className="mt-0.5 text-xs text-[#9CA3AF]">
                  {isFounder ? "Atendimento exclusivo Founder" : "Suporte via WhatsApp"}
                </p>
              </div>
              <ExternalLink size={14} className="flex-shrink-0 text-[#22C55E]" />
            </a>
          </motion.div>
        </section>

        {/* ============ 3. CUIDADO ============ */}
        <section className="space-y-3">
          <SectionLabel>Cuidado</SectionLabel>

          <motion.div
            custom={7}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="glass-card rounded-2xl p-5"
          >
            <WashProgressBar used={subscriber.washesUsed} total={subscriber.washesTotal} />
          </motion.div>

          <motion.div custom={8} initial="hidden" animate="visible" variants={fadeUp}>
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
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(201,168,76,0.12)" }}
              >
                <Sparkles size={18} className="text-[#C9A84C]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
                  Próximo cuidado recomendado
                </p>
                <p className="mt-1 font-semibold text-white">Lavagem Premium + Cera</p>
                <p className="mt-0.5 text-sm text-[#9CA3AF]">27/06/2026 · Proteção completa</p>
              </div>
              <ChevronRight size={16} className="mt-1 flex-shrink-0 text-[#C9A84C]" />
            </Link>
          </motion.div>

          {/* Links compactos de rodapé — histórico e cadastro */}
          <motion.div
            custom={9}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="grid grid-cols-2 gap-3"
          >
            <Link
              href="/historico"
              className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 transition hover:border-white/[0.12]"
            >
              <Clock size={16} className="text-[#9CA3AF]" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Histórico</p>
                <p className="text-[11px] text-[#9CA3AF]">Cuidados anteriores</p>
              </div>
              <ChevronRight size={14} className="text-[#4B5563]" />
            </Link>
            <Link
              href="/cadastro"
              className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 transition hover:border-white/[0.12]"
            >
              <ClipboardEdit size={16} className="text-[#9CA3AF]" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Cadastro</p>
                <p className="text-[11px] text-[#9CA3AF]">Dados e veículo</p>
              </div>
              <ChevronRight size={14} className="text-[#4B5563]" />
            </Link>
          </motion.div>
        </section>
      </div>

      <BottomNav active="dashboard" />
    </div>
  );
}
