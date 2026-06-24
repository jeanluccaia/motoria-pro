"use client";

import { motion } from "framer-motion";
import { Car, Plus, Calendar, ArrowLeft, Gauge, Droplets } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { GoldBadge } from "@/components/GoldBadge";

export default function VeiculosPage() {
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
          <div>
            <h1 className="text-lg font-bold text-white">Meus Veículos</h1>
            <p className="text-xs text-[#9CA3AF]">Gerencie sua frota</p>
          </div>
        </div>
      </motion.header>

      <div className="px-5 max-w-lg mx-auto pt-5 space-y-4">
        {/* Main Vehicle Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #111111 0%, #1A1A1A 100%)",
            border: "1px solid rgba(201,168,76,0.25)",
          }}
        >
          {/* Decorative gradient */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: "radial-gradient(ellipse at 80% 20%, #C9A84C 0%, transparent 55%)",
            }}
          />

          {/* Car silhouette placeholder */}
          <div className="relative px-6 pt-8 pb-4 flex items-center justify-center">
            <div
              className="w-36 h-36 rounded-2xl flex flex-col items-center justify-center"
              style={{
                background: "rgba(201,168,76,0.06)",
                border: "1px solid rgba(201,168,76,0.15)",
              }}
            >
              <Car size={56} className="text-[#C9A84C] opacity-70" />
              <p className="text-[10px] text-[#9CA3AF] mt-2 tracking-wider uppercase">
                BMW X5
              </p>
            </div>
          </div>

          {/* Vehicle info */}
          <div className="relative px-6 pb-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold text-white">BMW X5</h2>
                <p className="text-[#9CA3AF] text-sm mt-0.5">2022 • Prata</p>
              </div>
              <GoldBadge size="sm">Principal</GoldBadge>
            </div>

            {/* Plate */}
            <div className="inline-flex items-center gap-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-4 py-2 mb-5">
              <div className="w-1.5 h-5 rounded-full bg-[#C9A84C]" />
              <span className="text-white font-mono font-bold text-base tracking-widest">
                ABC-1234
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: Droplets,
                  label: "Última lavagem",
                  value: "20/06/2026",
                  color: "#34D399",
                },
                {
                  icon: Calendar,
                  label: "Próxima",
                  value: "27/06/2026",
                  color: "#C9A84C",
                },
                {
                  icon: Gauge,
                  label: "Total lavagens",
                  value: "8 este mês",
                  color: "#818CF8",
                },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <Icon size={16} className="mx-auto mb-1.5" style={{ color: stat.color }} />
                    <p className="text-[10px] text-[#9CA3AF] leading-tight">{stat.label}</p>
                    <p className="text-[11px] font-semibold text-white mt-0.5 leading-tight">
                      {stat.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Add Vehicle Button */}
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[#C9A84C] font-semibold text-sm transition-all duration-200 hover:bg-[#C9A84C]/5 active:scale-[0.98]"
          style={{ border: "1.5px dashed rgba(201,168,76,0.4)" }}
        >
          <Plus size={18} />
          Adicionar Veículo
        </motion.button>

        {/* Info note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-[#4B5563] pb-2"
        >
          Plano Elite permite até 2 veículos cadastrados
        </motion.p>
      </div>

      <BottomNav active="veiculos" />
    </div>
  );
}
