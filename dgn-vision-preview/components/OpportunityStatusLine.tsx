"use client";

import { useOfferState } from "@/lib/offerStore";
import { PLAN_CATALOG } from "@/lib/data";

/**
 * Mostra, dentro da "Próxima ação recomendada" da Visão Geral, o estado atual
 * da oferta preparada para o cliente featured. Permite ao investidor enxergar
 * que a plataforma acompanha a oportunidade preparada — não apenas abre um modal.
 */
export function OpportunityStatusLine({ customerId }: { customerId: string }) {
  const state = useOfferState(customerId);
  if (!state || state.status === "none") return null;

  const planName = state.planKey ? PLAN_CATALOG[state.planKey].name : null;
  const label =
    state.kind === "corporate"
      ? "Corporate Care · aguardando envio"
      : planName
      ? state.status === "prepared"
        ? `Oferta ${planName} preparada · aguardando envio`
        : state.status === "sent"
        ? `Oferta ${planName} enviada`
        : state.status === "interested"
        ? `${planName} · cliente interessado`
        : `${planName} · ${state.status}`
      : "Oferta preparada · aguardando envio";

  return (
    <div className="leading-tight">
      <p className="text-[11px] uppercase tracking-wider text-accent-emerald">
        Estado da oferta
      </p>
      <p className="text-sm text-accent-emerald font-semibold">{label}</p>
    </div>
  );
}
