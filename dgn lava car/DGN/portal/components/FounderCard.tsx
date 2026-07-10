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
      className="relative w-full overflow-hidden rounded-3xl"
      style={{
        background: "linear-gradient(160deg, #060606 0%, #0A0A0A 45%, #040404 100%)",
        border: "1px solid rgba(201,168,76,0.4)",
        boxShadow:
          "0 0 0 1px rgba(201,168,76,0.06), 0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(201,168,76,0.06)",
        aspectRatio: "1.586 / 1",
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

      {/* Brilho radial lateral */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 15% 10%, rgba(201,168,76,0.08) 0%, transparent 55%)",
        }}
      />

      {/* Textura sutil de grade */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Conteúdo */}
      <div className="relative flex h-full flex-col p-6">
        {/* Linha superior: label + número */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Crown size={11} className="text-[#C9A84C]" />
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#C9A84C]/80">
              Founder DGN Club
            </p>
          </div>
          <div
            className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em]"
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
        <div className="mt-auto">
          <p className="text-xl font-semibold leading-none tracking-wide text-white sm:text-2xl">
            {name}
          </p>
          <div
            className="mt-2.5 h-px w-12"
            style={{
              background:
                "linear-gradient(90deg, rgba(201,168,76,0.7) 0%, rgba(201,168,76,0.1) 100%)",
            }}
          />
        </div>

        {/* Linha inferior: plano e veículo */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="mb-0.5 text-[8px] font-medium uppercase tracking-[0.18em] text-[#6B7280]">
              Plano
            </p>
            <p className="text-[11px] font-semibold leading-none text-[#C9A84C]">{plan}</p>
          </div>
          <div className="text-right">
            <p className="mb-0.5 text-[8px] font-medium uppercase tracking-[0.18em] text-[#6B7280]">
              Veículo
            </p>
            <p className="text-[11px] font-semibold leading-none text-white">{vehicle}</p>
          </div>
        </div>
      </div>

      {/* Rodapé com microdetalhe embossed */}
      <div
        className="relative flex items-center justify-between px-6 py-2.5"
        style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}
      >
        <p className="text-[7px] font-semibold uppercase tracking-[0.28em] text-[#4B5563]">
          Membro Fundador
        </p>
        <p className="ml-3 flex-shrink-0 text-[7px] font-medium uppercase tracking-[0.15em] text-[#374151]">
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
