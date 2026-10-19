"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  PLAN_CATALOG,
  SIM_CLOCK,
  type Customer,
} from "@/lib/data";
import {
  setOffer,
  useOfferState,
  type OfferStatus,
} from "@/lib/offerStore";
import { IconCheck } from "@/components/Icons";

/**
 * Modal "Ver oferta preparada" — acompanhamento do estágio demonstrativo.
 *
 * Estágios: prepared → sent → interested → confirmed. Todas as transições são
 * simuladas localmente, nenhum envio real de WhatsApp, nenhuma cobrança, nenhum
 * contrato criado. "Copiar mensagem" copia o texto pra área de transferência —
 * o usuário real escolhe o canal de envio depois.
 */
export function OfferReview({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const state = useOfferState(customer.id);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const planKey = state?.planKey ?? customer.opportunity.recommendedPlan ?? "priority";
  const plan = PLAN_CATALOG[planKey];
  const isCorporate = state?.kind === "corporate";

  // Esc fecha com stopPropagation para não encerrar apresentação
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open || !state) return null;

  const whatsappMessage = isCorporate
    ? `Olá, ${customer.firstName}. Preparei uma proposta Corporate Care para a frota do Grupo Pellegrino. São 3 veículos corporativos integrados ao mesmo contrato, com NF-e consolidada e gerente dedicado. Quando puder, agendamos uma apresentação sem compromisso.`
    : `Olá, ${customer.firstName}. Preparei uma proposta DGN ${plan.name} para o seu ${customer.name.split(" ")[0]} — ${plan.priceDisplay}/mês com ${plan.included[0].toLowerCase()}. Posso te enviar o detalhamento aqui?`;

  function updateStatus(nextStatus: OfferStatus) {
    setOffer({
      customerId: customer.id,
      kind: state!.kind,
      planKey: state!.planKey,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const stages: { key: OfferStatus; label: string; description: string }[] = [
    { key: "prepared", label: "Preparada", description: "Oferta montada, pronta pra envio" },
    { key: "sent", label: "Enviada", description: "Mensagem registrada como enviada (simulação)" },
    { key: "interested", label: "Interessado", description: "Cliente demonstrou interesse (simulação)" },
    { key: "confirmed", label: "Aceita", description: "Cliente aceitou — demo, nenhum contrato criado" },
  ];
  const currentIndex = stages.findIndex((s) => s.key === state.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-review-title"
    >
      <div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto surface-raised p-6 lg:p-8 outline-none"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
              Acompanhamento da oferta · demonstrativo
            </p>
            <h2
              id="offer-review-title"
              className="mt-3 text-2xl lg:text-[26px] font-semibold text-white tracking-tight"
            >
              {isCorporate ? (
                <>Oferta <span className="text-gold-300">Corporate Care</span> para {customer.firstName}</>
              ) : (
                <>Oferta <span className="text-gold-300">{plan.name}</span> para {customer.firstName}</>
              )}
            </h2>
            <p className="mt-2 text-ink-200 text-sm max-w-xl">
              Nenhum envio real, nenhum contrato ou cobrança criada aqui. As ações
              abaixo simulam o avanço do estágio comercial para a demonstração
            </p>
          </div>
          <button onClick={() => onOpenChange(false)} className="btn-subtle shrink-0">
            Fechar · <span className="kbd">Esc</span>
          </button>
        </div>

        {/* Timeline de estágios */}
        <ol className="mt-6 grid grid-cols-4 gap-2">
          {stages.map((s, i) => {
            const reached = i <= currentIndex;
            const active = i === currentIndex;
            return (
              <li
                key={s.key}
                className={clsx(
                  "rounded-xl border p-3",
                  active
                    ? "border-gold-400/50 bg-gold-400/[0.08]"
                    : reached
                    ? "border-accent-emerald/30 bg-accent-emerald/[0.05]"
                    : "border-white/5 bg-white/[0.02]"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold",
                      reached
                        ? "bg-accent-emerald text-ink-950"
                        : "bg-white/10 text-ink-300"
                    )}
                  >
                    {reached ? <IconCheck size={10} /> : i + 1}
                  </span>
                  <span
                    className={clsx(
                      "text-xs font-medium",
                      active ? "text-gold-200" : reached ? "text-accent-emerald" : "text-ink-300"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Estado atual */}
        <div className="mt-5 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <p className="text-[11px] uppercase tracking-wider text-ink-300">
            Estado atual · {SIM_CLOCK.display} (data demonstrativa)
          </p>
          <p className="mt-1 text-white font-medium">
            {stages[currentIndex]?.description}
          </p>
          <p className="mt-1 text-[11px] text-ink-400">
            Atualizado em {new Date(state.updatedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Resumo do plano/condição */}
        {!isCorporate && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-wider text-ink-300">Mensalidade</p>
              <p className="text-xl font-semibold text-white mt-1">{plan.priceDisplay}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-wider text-ink-300">Formato</p>
              <p className="text-xl font-semibold text-white mt-1">Recorrente</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-wider text-ink-300">Canal preferido</p>
              <p className="text-xl font-semibold text-white mt-1">{customer.preferredChannel}</p>
            </div>
          </div>
        )}

        {/* Mensagem sugerida */}
        <div className="mt-5 rounded-xl border border-white/5 bg-ink-950/40 p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[11px] uppercase tracking-wider text-ink-300">
              Mensagem sugerida para {customer.preferredChannel}
            </p>
            <button
              onClick={copyMessage}
              className="btn-subtle text-xs"
              aria-label="Copiar mensagem"
            >
              {copied ? "Copiado ✓" : "Copiar mensagem"}
            </button>
          </div>
          <p className="mt-3 text-sm text-ink-100 leading-relaxed whitespace-pre-wrap">
            {whatsappMessage}
          </p>
          <p className="mt-2 text-[11px] text-ink-400">
            Em produção, o envio seria integrado ao WhatsApp Business API — nesta
            demonstração a mensagem fica no seu clipboard para você revisar antes
          </p>
        </div>

        {/* Ações de simulação de estágio */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <p className="text-[11px] uppercase tracking-wider text-ink-300 mb-3">
            Avançar estágio (simulação local)
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {stages.slice(1).map((s) => {
              const already = stages.findIndex((x) => x.key === state.status) >= stages.findIndex((x) => x.key === s.key);
              return (
                <button
                  key={s.key}
                  onClick={() => updateStatus(s.key)}
                  disabled={already}
                  className={clsx(
                    "btn-ghost text-xs",
                    already && "opacity-40 cursor-not-allowed"
                  )}
                >
                  Marcar como {s.label.toLowerCase()}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-ink-400 leading-relaxed">
            Nenhum envio, cobrança ou contrato real é criado por estas ações. O
            estado fica salvo apenas neste navegador e é restaurado automaticamente
            quando você sair do Modo Apresentação
          </p>
        </div>
      </div>
    </div>
  );
}
