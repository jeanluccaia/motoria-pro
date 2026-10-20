"use client";

import { useOfferState, STATUS_LABEL } from "@/lib/offerStore";
import { PLAN_CATALOG, formatDemoDateTime } from "@/lib/data";

export function OfferStatusChip({ customerId }: { customerId: string }) {
  const state = useOfferState(customerId);
  if (!state || state.status === "none") return null;

  const planName = state.planKey ? PLAN_CATALOG[state.planKey].name : null;
  const tone =
    state.status === "confirmed"
      ? "bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30"
      : state.status === "interested"
      ? "bg-gold-400/15 text-gold-300 border border-gold-400/30"
      : "bg-ink-950/60 text-ink-100 border border-white/15";

  return (
    <span
      className={`pill ${tone} backdrop-blur-sm`}
      title={`Atualizado em ${formatDemoDateTime(state.updatedAt)}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {planName
        ? state.status === "prepared"
          ? `Oferta ${planName} preparada`
          : state.status === "sent"
          ? `Oferta ${planName} enviada`
          : state.status === "interested"
          ? `Interessado em ${planName}`
          : state.status === "confirmed"
          ? `${planName} confirmado · demo`
          : STATUS_LABEL[state.status]
        : state.kind === "corporate"
        ? "Corporate Care preparado"
        : STATUS_LABEL[state.status]}
    </span>
  );
}
