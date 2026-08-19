"use client";

import { Crown, MessageCircle } from "lucide-react";
import { FounderPublicTracking, trackFounderEvent } from "./FounderPublicTracking";
import { WHATSAPP_DGN } from "@/lib/config";
import type { FounderPlanCode, FounderPlanSnapshot } from "@/lib/founder-offer-catalog";

function formatMonthlyPrice(price: number | null) {
  if (typeof price !== "number" || price <= 0) return null;
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Badge de hierarquia — Smart ganha "RECOMENDADO", Priority ganha "PRIORIDADE MÁXIMA".
// Essential fica sem badge (base). Nada aqui inventa benefício, só ordena a leitura.
function hierarchyBadge(planCode: FounderPlanCode) {
  if (planCode === "smart") return "RECOMENDADO";
  if (planCode === "priority") return "PRIORIDADE MÁXIMA";
  return null;
}

// Manchete de atendimentos por mês — comunica a progressão 1 → 2 → 4 sem
// depender da contagem de bullets. Fonte: snapshot canônico do plano.
function servicesHeadline(qty: number) {
  return `${qty} atendimento${qty === 1 ? "" : "s"} por mês`;
}

export function FounderSnapshotPage({ slug, firstName, offer, message }: { slug: string; firstName: string; offer: FounderPlanSnapshot; message: string }) {
  const whatsapp = `https://wa.me/${WHATSAPP_DGN}?text=${encodeURIComponent("Olá, recebi meu convite Founder DGN Club e quero conversar sobre o plano recomendado.")}`;
  const monthlyPrice = formatMonthlyPrice(offer.monthlyPrice);
  const badge = hierarchyBadge(offer.planCode);
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
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-[#777]">Plano recomendado</p>
            {badge ? (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                offer.planCode === "priority"
                  ? "border-[#C9A84C]/50 bg-[#C9A84C]/15 text-[#E7C96A]"
                  : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
              }`}>{badge}</span>
            ) : null}
          </div>
          <h2 className="mt-2 text-2xl font-semibold uppercase text-[#E7C96A]">{offer.planName}</h2>
          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#8A8A8A]">{offer.positioning}</p>
          <p className="mt-3 text-sm leading-6 text-[#A7A7A7]">{offer.description}</p>
        </div>

        {/* Headline com a progressão comercial — mesma altura visual em qualquer plano. */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#777]">Cuidado {offer.serviceFrequency}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{servicesHeadline(offer.serviceQuantity)}</p>
          <p className="mt-1 text-[11px] text-[#8A8A8A]">{offer.priorityLabel}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <PublicFact label="Modalidade escolhida" value={offer.contractingModeLabel} />
          {typeof offer.aestheticDiscountPercent === "number" && offer.aestheticDiscountPercent > 0 ? (
            <PublicFact
              label="Bônus Founder"
              value={`${offer.aestheticDiscountPercent}% OFF em Estética DGN`}
              accent
            />
          ) : null}
        </div>

        {monthlyPrice ? (
          <div className="rounded-xl border border-[#C9A84C]/25 bg-[#C9A84C]/[0.08] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#C9A84C]">Valor mensal</p>
            <p className="mt-2 text-xl font-semibold text-[#E7C96A]">{monthlyPrice}</p>
            <p className="mt-1 text-xs text-[#A7A7A7]">{offer.billingRule}</p>
          </div>
        ) : null}

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#777]">Benefícios incluídos</p>
          <ul className="mt-3 space-y-2 text-sm text-[#D0D0D0]">
            {offer.benefits.map((benefit) => <li key={benefit}>• {benefit}</li>)}
          </ul>
        </div>

        <div>{offer.publicRules.map((rule) => <p key={rule} className="text-xs leading-5 text-[#777]">{rule}</p>)}</div>

        <a href={whatsapp} target="_blank" rel="noreferrer" onClick={() => trackFounderEvent(slug, "confirm_whatsapp_click")} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 font-semibold text-black"><MessageCircle size={18} />Conversar no WhatsApp</a>
      </div>
    </section>
  </main>;
}

function PublicFact({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${
      accent
        ? "border-emerald-400/30 bg-emerald-500/[0.06]"
        : "border-white/[0.06] bg-white/[0.03]"
    }`}>
      <p className={`text-[10px] uppercase tracking-[0.16em] ${accent ? "text-emerald-200/70" : "text-[#777]"}`}>{label}</p>
      <p className={`mt-2 font-semibold ${accent ? "text-emerald-200" : "text-white"}`}>{value}</p>
    </div>
  );
}
