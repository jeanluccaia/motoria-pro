"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import { CheckCircle2, Camera, ArrowLeft, Droplets } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";

const washes = [
  {
    id: 1,
    date: "20/06/2026",
    weekday: "Sábado",
    service: "Lavagem Premium Completa",
    observation: "Veículo com muito barro nas rodas. Finalização com aromatizante.",
    status: "Concluído",
    duration: "45 min",
  },
  {
    id: 2,
    date: "15/06/2026",
    weekday: "Segunda",
    service: "Lavagem Simples",
    observation: "Lavagem expressa, entregue no prazo.",
    status: "Concluído",
    duration: "20 min",
  },
  {
    id: 3,
    date: "08/06/2026",
    weekday: "Domingo",
    service: "Lavagem Premium + Cera",
    observation: "Aplicação de cera de carnaúba. Resultado excelente.",
    status: "Concluído",
    duration: "60 min",
  },
  {
    id: 4,
    date: "01/06/2026",
    weekday: "Segunda",
    service: "Lavagem Simples",
    observation: "Serviço padrão realizado.",
    status: "Concluído",
    duration: "20 min",
  },
];

const easeOut: Easing = "easeOut";

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: easeOut } },
};

export default function HistoricoPage() {
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
            <h1 className="text-lg font-bold text-white">Histórico</h1>
            <p className="text-xs text-[#9CA3AF]">Suas últimas lavagens</p>
          </div>
        </div>
      </motion.header>

      <div className="px-5 max-w-lg mx-auto pt-5">
        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-4 mb-6 glass-card rounded-2xl p-4"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201,168,76,0.1)" }}
          >
            <Droplets className="text-[#C9A84C]" size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{washes.length}</p>
            <p className="text-sm text-[#9CA3AF]">Lavagens realizadas em Junho</p>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="relative"
        >
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-[#C9A84C]/40 via-[#2A2A2A] to-transparent" />

          <div className="space-y-4">
            {washes.map((wash) => (
              <motion.div
                key={wash.id}
                variants={itemVariants}
                className="relative pl-14"
              >
                {/* Timeline dot */}
                <div className="absolute left-[14px] top-4 w-3 h-3 rounded-full border-2 border-[#C9A84C] bg-[#0A0A0A]" />

                <div
                  className="rounded-2xl p-4 transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, #111111 0%, #1A1A1A 100%)",
                    border: "1px solid #2A2A2A",
                  }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-medium">
                        {wash.weekday} · {wash.date}
                      </p>
                      <h3 className="text-sm font-semibold text-white mt-0.5">
                        {wash.service}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 bg-[#34D399]/10 px-2 py-1 rounded-full flex-shrink-0">
                      <CheckCircle2 size={12} className="text-[#34D399]" />
                      <span className="text-[11px] text-[#34D399] font-medium">
                        {wash.status}
                      </span>
                    </div>
                  </div>

                  {/* Observation */}
                  <p className="text-xs text-[#9CA3AF] leading-relaxed mb-3 border-t border-[#2A2A2A] pt-2">
                    {wash.observation}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#4B5563]">
                      Duração: {wash.duration}
                    </span>
                    <button className="flex items-center gap-1.5 text-xs text-[#C9A84C] font-medium hover:text-[#F0D060] transition-colors">
                      <Camera size={12} />
                      Ver fotos
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <BottomNav active="historico" />
    </div>
  );
}
