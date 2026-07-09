"use client";

import { motion } from "framer-motion";
import type { Easing } from "framer-motion";
import { Crown } from "lucide-react";

const easeOut: Easing = "easeOut";

interface FounderCardProps {
  name: string;
  founderNumber: string;
  plan: string;
  vehicle: string;
}

export function FounderCard({ name, founderNumber, plan, vehicle }: FounderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className="relative rounded-3xl overflow-hidden w-full"
      style={{
        background: "linear-gradient(160deg, #060606 0%, #0A0A0A 45%, #040404 100%)",
        border: "1px solid rgba(201,168,76,0.4)",
        boxShadow:
          "0 0 0 1px rgba(201,168,76,0.06), 0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(201,168,76,0.06)",
        aspectRatio: "1.75 / 1",
      }}
    >
      {/* Topo brilhante */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.7) 35%, rgba(240,208,96,0.9) 50%, rgba(201,168,76,0.7) 65%, transparent 100%)",
        }}
      />

      {/* Brilho radial lateral esquerdo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 15% 10%, rgba(201,168,76,0.08) 0%, transparent 55%)",
        }}
      />

      {/* Textura sutil de grade */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Conteúdo */}
      <div className="relative h-full flex flex-col p-5 pb-4">
        {/* Linha superior: label + número */}
        <div className="flex items-center justify-between mb-auto">
          <div className="flex items-center gap-1.5">
            <Crown size={10} className="text-[#C9A84C]" />
            <p className="text-[9px] tracking-[0.28em] uppercase font-semibold text-[#C9A84C]/80">
              Founder DGN Club
            </p>
          </div>
          <div
            className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-[0.15em] uppercase"
            style={{
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.35)",
              color: "#C9A84C",
            }}
          >
            {founderNumber}
          </div>
        </div>

        {/* Nome */}
        <div className="mt-3">
          <p className="text-lg font-bold text-white tracking-wide leading-none">{name}</p>
          <div
            className="mt-2 h-px w-10"
            style={{
              background:
                "linear-gradient(90deg, rgba(201,168,76,0.7) 0%, rgba(201,168,76,0.1) 100%)",
            }}
          />
        </div>

        {/* Linha inferior: plano e veículo */}
        <div className="flex items-end justify-between mt-auto pt-3">
          <div>
            <p className="text-[8px] text-[#6B7280] uppercase tracking-[0.18em] font-medium mb-0.5">
              Plano
            </p>
            <p className="text-[11px] font-semibold text-[#C9A84C] leading-none">{plan}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-[#6B7280] uppercase tracking-[0.18em] font-medium mb-0.5">
              Veículo
            </p>
            <p className="text-[11px] font-semibold text-white leading-none">{vehicle}</p>
          </div>
        </div>
      </div>

      {/* Rodapé com frase e marca */}
      <div
        className="relative px-5 py-2.5 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}
      >
        <p className="text-[8px] text-[#4B5563] italic tracking-wide">
          Você faz parte do início de uma nova história.
        </p>
        <p className="text-[7px] text-[#374151] tracking-[0.15em] uppercase font-medium flex-shrink-0 ml-3">
          DGN Club
        </p>
      </div>

      {/* Brilho inferior */}
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.15) 50%, transparent 100%)",
        }}
      />
    </motion.div>
  );
}
