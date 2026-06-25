"use client";

import { motion } from "framer-motion";
import {
  User,
  Star,
  Lock,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Edit3,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { GoldBadge } from "@/components/GoldBadge";

const menuSections = [
  {
    items: [
      { icon: User, label: "Dados Pessoais", desc: "Nome, e-mail e telefone", href: null },
      { icon: Star, label: "Meu Plano", desc: "Plano Elite • Ativo", href: "/plano" },
      { icon: Lock, label: "Alterar Senha", desc: "Segurança da conta", href: null },
    ],
  },
  {
    items: [
      { icon: FileText, label: "Termos de Uso", desc: "Contrato de assinatura", href: null },
      {
        icon: Shield,
        label: "Política de Privacidade",
        desc: "Como usamos seus dados",
        href: null,
      },
    ],
  },
];

export default function PerfilPage() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      {/* Header */}
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
          <h1 className="text-lg font-bold text-white">Perfil</h1>
        </div>
      </motion.header>

      <div className="px-5 max-w-lg mx-auto pt-6 space-y-5">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center gap-4 py-6"
        >
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-[#0A0A0A]"
              style={{
                background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 100%)",
                boxShadow: "0 0 30px rgba(201,168,76,0.3)",
              }}
            >
              CL
            </div>
            <button
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-[#0A0A0A]"
              style={{
                background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 100%)",
              }}
            >
              <Edit3 size={12} />
            </button>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-white">Carlos Lima</h2>
            <p className="text-sm text-[#9CA3AF] mt-0.5">carlos@email.com</p>
            <div className="mt-3 flex items-center justify-center">
              <GoldBadge size="md">
                <Star size={11} />
                Plano Elite
              </GoldBadge>
            </div>
          </div>

          {/* Stats row */}
          <div
            className="w-full flex items-center justify-around rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid #2A2A2A",
            }}
          >
            {[
              { value: "8", label: "Lavagens\neste mês" },
              { value: "24", label: "Total de\nlavagens" },
              { value: "6", label: "Meses\ncomo membro" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <p className="text-xl font-bold gold-gradient-text">{stat.value}</p>
                <p className="text-[10px] text-[#9CA3AF] text-center leading-tight mt-0.5 whitespace-pre-line">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Menu Sections */}
        {menuSections.map((section, sIdx) => (
          <motion.div
            key={sIdx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + sIdx * 0.1 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid #2A2A2A" }}
          >
            {section.items.map((item, iIdx) => {
              const Icon = item.icon;
              const inner = (
                <>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(201,168,76,0.08)" }}
                  >
                    <Icon size={16} className="text-[#C9A84C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-[#4B5563] flex-shrink-0" />
                </>
              );
              const cls = `w-full flex items-center gap-4 px-4 py-4 text-left transition-all duration-200 hover:bg-white/[0.02] active:bg-white/[0.04] ${
                iIdx !== 0 ? "border-t border-[#2A2A2A]" : ""
              }`;
              return item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cls}
                  style={{ background: "#111111", display: "flex" }}
                >
                  {inner}
                </Link>
              ) : (
                <button
                  key={item.label}
                  className={cls}
                  style={{ background: "#111111" }}
                >
                  {inner}
                </button>
              );
            })}
          </motion.div>
        ))}

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all duration-200 hover:bg-red-500/5 active:scale-[0.98]"
            style={{
              background: "#111111",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.08)" }}
            >
              <LogOut size={16} className="text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">Sair</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Encerrar sessão</p>
            </div>
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-[#4B5563] pb-2"
        >
          DGN Club · Versão 1.0.0
        </motion.p>
      </div>

      <BottomNav active="perfil" />
    </div>
  );
}
