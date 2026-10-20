"use client";

import { useOfferState, STATUS_LABEL } from "@/lib/offerStore";
import { IconSpark } from "@/components/Icons";
import { formatDemoDateTime, type Customer } from "@/lib/data";

export function OpportunityCard({ customer }: { customer: Customer }) {
  const state = useOfferState(customer.id);
  const o = customer.opportunity;
  const p = o.projection;
  const kindLabel =
    o.kind === "new_subscription"
      ? "Nova assinatura"
      : o.kind === "upgrade"
      ? "Upgrade"
      : "Corporate Care";

  return (
    <div className="surface-raised p-7 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gold-400/[0.08] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-56 h-56 bg-gold-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
            <IconSpark size={12} /> {kindLabel}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-ink-300">
            Prioridade {o.priority}
          </span>
        </div>

        <h3 className="mt-4 text-xl text-white font-semibold leading-snug">
          {o.title}
        </h3>
        <p className="mt-3 text-sm text-ink-200 leading-relaxed">{o.reason}</p>

        <div
          className={`mt-5 rounded-xl p-4 border ${
            p.argument === "revenue_gain"
              ? "border-accent-emerald/20 bg-accent-emerald/[0.05]"
              : p.argument === "retention"
              ? "border-gold-400/20 bg-gold-400/[0.05]"
              : "border-gold-400/20 bg-gold-400/[0.05]"
          }`}
        >
          <p
            className={`text-[11px] uppercase tracking-wider ${
              p.argument === "revenue_gain" ? "text-accent-emerald" : "text-gold-300"
            }`}
          >
            {p.argument === "revenue_gain"
              ? "Projeção ilustrativa de receita incremental"
              : p.argument === "retention"
              ? "Projeção ilustrativa — argumento é retenção, não aumento de receita"
              : "Projeção ilustrativa de previsibilidade"}
          </p>
          <p className="mt-1 text-xl lg:text-[22px] font-semibold text-white leading-tight">
            {p.deltaDisplay}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5">
              <p className="text-ink-300">{p.baselineLabel}</p>
              <p className="text-white font-medium mt-0.5 tabular-nums">
                R$ {p.baselineValue.toLocaleString("pt-BR")} / {p.period}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5">
              <p className="text-ink-300">{p.withOfferLabel}</p>
              <p className="text-white font-medium mt-0.5 tabular-nums">
                R$ {p.withOfferValue.toLocaleString("pt-BR")} / {p.period}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-ink-200 leading-relaxed">
            {p.explain}
          </p>
        </div>

        {state && state.status !== "none" && (
          <div className="mt-5 flex items-start gap-2 p-3 rounded-xl border border-accent-emerald/20 bg-accent-emerald/[0.05]">
            <span className="w-2 h-2 rounded-full bg-accent-emerald mt-1.5 shrink-0" />
            <div className="text-xs text-ink-100 leading-snug">
              <strong className="text-white">
                {state.status === "prepared"
                  ? "Oferta preparada · aguardando envio"
                  : STATUS_LABEL[state.status]}
              </strong>
              {" — "}
              atualizada em {formatDemoDateTime(state.updatedAt)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

