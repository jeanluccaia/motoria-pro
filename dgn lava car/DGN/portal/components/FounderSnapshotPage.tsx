"use client";

import { Crown, MessageCircle } from "lucide-react";
import { FounderPublicTracking, trackFounderEvent } from "./FounderPublicTracking";
import { WHATSAPP_DGN } from "@/lib/config";
import type { FounderPlanSnapshot } from "@/lib/founder-offer-catalog";

export function FounderSnapshotPage({ slug, firstName, offer, message }: { slug: string; firstName: string; offer: FounderPlanSnapshot; message: string }) {
  const whatsapp = `https://wa.me/${WHATSAPP_DGN}?text=${encodeURIComponent("Olá, recebi meu convite Founder DGN Club e quero conversar sobre o plano recomendado.")}`;
  return <main className="min-h-screen bg-[#070707] px-5 py-12 text-white">
    <FounderPublicTracking slug={slug} />
    <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-[#C9A84C]/25 bg-[#101010] shadow-2xl">
      <div className="border-b border-white/[0.06] bg-gradient-to-br from-[#C9A84C]/15 to-transparent p-8 text-center sm:p-12">
        <Crown className="mx-auto text-[#E7C96A]" size={38} />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#C9A84C]">Convite Founder DGN Club</p>
        <h1 className="mt-3 text-3xl font-semibold">{firstName}, esta é a oferta escolhida para você.</h1>
        {message ? <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#C9C9C9]">{message}</p> : null}
      </div>
      <div className="space-y-6 p-8 sm:p-12">
        <div><p className="text-xs uppercase tracking-[0.18em] text-[#777]">Plano recomendado</p><h2 className="mt-2 text-2xl font-semibold text-[#E7C96A]">{offer.name}</h2><p className="mt-2 text-sm leading-6 text-[#A7A7A7]">{offer.description}</p></div>
        <div className="grid gap-3 sm:grid-cols-2"><PublicFact label="Frequência" value={offer.frequency} /><PublicFact label="Condição" value={offer.displayedValue} /></div>
        <div><p className="text-xs uppercase tracking-[0.18em] text-[#777]">Benefícios</p><ul className="mt-3 space-y-2 text-sm text-[#D0D0D0]">{offer.benefits.map((benefit) => <li key={benefit}>• {benefit}</li>)}</ul></div>
        <div>{offer.publicRules.map((rule) => <p key={rule} className="text-xs leading-5 text-[#777]">{rule}</p>)}</div>
        <a href={whatsapp} target="_blank" rel="noreferrer" onClick={() => trackFounderEvent(slug, "confirm_whatsapp_click")} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 font-semibold text-black"><MessageCircle size={18} />Conversar no WhatsApp</a>
      </div>
    </section>
  </main>;
}

function PublicFact({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-[#777]">{label}</p><p className="mt-2 font-semibold">{value}</p></div>; }
