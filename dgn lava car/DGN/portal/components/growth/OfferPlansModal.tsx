"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Check, ArrowRight } from "lucide-react";
import { listPlanOffers, formatPlanPrice, type PlanOfferEntry } from "@/lib/growth/plans/catalog";
import type { DgnSubscriberPlan } from "@/lib/growth/dgn-plans";

// -----------------------------------------------------------------------------
// Modal "Oferecer assinatura" — abre a partir da ficha do cliente, apresenta
// os 3 planos canônicos (Essential/Smart/Priority) com condições oficiais, e
// ao escolher um plano navega para ?novaAssinatura=1&plano=<Plano> — o
// SubscriptionsManager já reage ao autoOpenCreate e, com a extensão
// preselectedPlan, abre o form com o plano certo.
//
// Zero write próprio: só UX. A persistência continua passando pelas RPCs
// crm_create_manual_subscription já homologadas.
// -----------------------------------------------------------------------------

export function OfferPlansModal({
  open,
  onClose,
  onSelectPlan,
  customerName,
  disabled = false,
  disabledReason,
}: {
  open: boolean;
  onClose: () => void;
  onSelectPlan: (plan: DgnSubscriberPlan) => void;
  customerName: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [focusedPlan, setFocusedPlan] = useState<DgnSubscriberPlan | null>(null);
  const offers = useMemo<PlanOfferEntry[]>(() => listPlanOffers(), []);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => closeRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-plans-title"
      data-testid="offer-plans-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/[0.08] bg-[#0F0F0F] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
              Oferecer assinatura DGN
            </p>
            <h2
              id="offer-plans-title"
              className="mt-1 text-lg font-semibold text-white sm:text-xl"
            >
              Planos oficiais para {customerName || "o cliente"}
            </h2>
            <p className="mt-1 text-[12px] text-white/50">
              Nenhum contrato é criado neste passo — só a apresentação. Ao escolher um plano,
              o formulário de criação abre com o plano pré-selecionado.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-white/60 transition hover:border-white/20 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {disabled && (
          <p className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/[0.06] px-3 py-2 text-xs text-amber-200">
            {disabledReason ?? "Persistência não habilitada — não é possível registrar uma nova assinatura neste ambiente."}
          </p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {offers.map((offer) => (
            <PlanCard
              key={offer.plan}
              offer={offer}
              focused={focusedPlan === offer.plan}
              disabled={disabled}
              onFocus={() => setFocusedPlan(offer.plan)}
              onBlur={() => setFocusedPlan((current) => (current === offer.plan ? null : current))}
              onSelect={() => onSelectPlan(offer.plan)}
            />
          ))}
        </div>

        <p className="mt-4 text-[11px] text-white/40">
          Preço é informado pela operação. "Sob consulta operacional" significa
          que ainda não há valor oficial injetado — nenhum número presumido.
        </p>
      </div>
    </div>
  );
}

function PlanCard({
  offer,
  focused,
  disabled,
  onFocus,
  onBlur,
  onSelect,
}: {
  offer: PlanOfferEntry;
  focused: boolean;
  disabled: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onSelect: () => void;
}) {
  const priceLabel = formatPlanPrice(offer);
  const borderCls = focused
    ? "border-[#C9A84C]/55 bg-[#C9A84C]/[0.04]"
    : "border-white/[0.08] bg-white/[0.015] hover:border-white/[0.18]";

  return (
    <div
      className={`flex flex-col rounded-2xl border p-4 transition ${borderCls}`}
      onMouseEnter={onFocus}
      onMouseLeave={onBlur}
      data-testid={`offer-plan-${offer.plan.toLowerCase()}`}
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]/80">
          DGN
        </p>
        <h3 className="mt-0.5 text-lg font-semibold text-white">{offer.plan}</h3>
        <p className="mt-1 text-[11px] text-white/55">
          {offer.washesPerMonth} {offer.washesPerMonth === 1 ? "lavagem" : "lavagens"}/mês
        </p>
      </div>

      <p className="mt-3 text-[12px] text-white/70">{offer.idealFor}</p>

      <ul className="mt-3 space-y-1.5">
        {offer.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-1.5 text-[12px] text-white/75">
            <Check size={12} className="mt-0.5 shrink-0 text-[#C9A84C]/90" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-white/[0.06] pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Modalidades aceitas
        </p>
        <p className="mt-1 text-[12px] text-white/75">
          {offer.modalities.join(" · ")}
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Preço
          </p>
          <p className="mt-1 text-[13px] font-medium text-white/85">{priceLabel}</p>
        </div>
        <button
          type="button"
          onClick={onSelect}
          disabled={disabled}
          data-testid={`offer-plan-${offer.plan.toLowerCase()}-select`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A84C]/40 bg-[#C9A84C]/15 px-3 py-1.5 text-[11px] font-semibold text-[#E7C96A] transition hover:border-[#C9A84C]/70 hover:bg-[#C9A84C]/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Selecionar {offer.plan}
          <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
}
