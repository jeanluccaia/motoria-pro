"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00",
  "14:00", "15:00", "16:00", "17:00",
];

export default function AgendarPage() {
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
            <h1 className="text-lg font-bold text-white">Agendar Lavagem</h1>
            <p className="text-xs text-[#9CA3AF]">Escolha data e horário</p>
          </div>
        </div>
      </motion.header>

      <div className="px-5 max-w-lg mx-auto pt-5 space-y-5">
        {/* Service selection */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 className="text-xs font-semibold text-[#9CA3AF] tracking-widest uppercase mb-3">
            Serviço
          </h3>
          <div className="space-y-2">
            {[
              { name: "Lavagem Simples", time: "20 min", included: true },
              { name: "Lavagem Premium", time: "45 min", included: true },
              { name: "Lavagem Premium + Cera", time: "60 min", extra: "+" },
            ].map((svc, i) => (
              <button
                key={svc.name}
                className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                  i === 1
                    ? "border-[#C9A84C] bg-[#C9A84C]/5"
                    : "border-[#2A2A2A]"
                }`}
                style={{
                  background: i === 1 ? "rgba(201,168,76,0.06)" : "#111111",
                  border: i === 1 ? "1px solid rgba(201,168,76,0.3)" : "1px solid #2A2A2A",
                }}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: i === 1 ? "#C9A84C" : "#2A2A2A",
                    background: i === 1 ? "#C9A84C" : "transparent",
                  }}
                >
                  {i === 1 && <CheckCircle2 size={12} className="text-[#0A0A0A]" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{svc.name}</p>
                  <p className="text-xs text-[#9CA3AF]">{svc.time}</p>
                </div>
                {svc.included && (
                  <span className="text-[10px] text-[#34D399] font-medium bg-[#34D399]/10 px-2 py-0.5 rounded-full">
                    Incluso
                  </span>
                )}
                {svc.extra && (
                  <span className="text-[10px] text-[#C9A84C] font-medium bg-[#C9A84C]/10 px-2 py-0.5 rounded-full">
                    Adicional
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Date selection */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h3 className="text-xs font-semibold text-[#9CA3AF] tracking-widest uppercase mb-3">
            Data
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["Hoje\n24/06", "Amanhã\n25/06", "Sáb\n27/06", "Dom\n28/06", "Seg\n29/06"].map(
              (d, i) => {
                const [day, date] = d.split("\n");
                return (
                  <button
                    key={i}
                    className="flex flex-col items-center flex-shrink-0 w-14 py-3 rounded-xl transition-all"
                    style={{
                      background: i === 0 ? "rgba(201,168,76,0.1)" : "#111111",
                      border: i === 0 ? "1px solid rgba(201,168,76,0.3)" : "1px solid #2A2A2A",
                    }}
                  >
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: i === 0 ? "#C9A84C" : "#9CA3AF" }}
                    >
                      {day}
                    </span>
                    <span
                      className="text-sm font-bold mt-0.5"
                      style={{ color: i === 0 ? "#F0D060" : "#FFFFFF" }}
                    >
                      {date}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </motion.div>

        {/* Time slots */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h3 className="text-xs font-semibold text-[#9CA3AF] tracking-widest uppercase mb-3">
            Horário
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map((slot, i) => (
              <button
                key={slot}
                className="py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: i === 2 ? "rgba(201,168,76,0.1)" : "#111111",
                  border: i === 2 ? "1px solid rgba(201,168,76,0.3)" : "1px solid #2A2A2A",
                  color: i === 2 ? "#C9A84C" : "#FFFFFF",
                }}
              >
                {slot}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Confirm button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="pt-2"
        >
          <button
            className="w-full py-4 rounded-2xl font-semibold text-[#0A0A0A] text-sm transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 50%, #C9A84C 100%)",
              boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar size={16} />
              Confirmar Agendamento
            </div>
          </button>
          <p className="text-center text-xs text-[#4B5563] mt-2">
            Você receberá uma confirmação por WhatsApp
          </p>
        </motion.div>
      </div>

      <BottomNav active="agendar" />
    </div>
  );
}
