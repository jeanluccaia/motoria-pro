"use client";

import { useState } from "react";
import Link from "next/link";
import { DEMO_UNIT, type PulseItem, SIM_CLOCK } from "@/lib/data";
import { IconArrow } from "@/components/Icons";

/**
 * Linha do tempo operacional do dia.
 * Mobile: mostra apenas os 3 próximos eventos (relativos à hora demonstrativa),
 * com botão "Ver todos" pra expandir. Desktop: lista completa.
 */
export function PulseTimeline({ pulse }: { pulse: PulseItem[] }) {
  const [expanded, setExpanded] = useState(false);

  function hhmmToMin(hhmm: string) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }

  // No mobile sem expand, mostra os próximos 3 eventos a partir do SIM_CLOCK.now
  // (inclui o atual em andamento). Se há menos de 3 depois do agora, completa
  // com os eventos anteriores mais recentes.
  const now = SIM_CLOCK.nowMinutes;
  const upcomingOrLive = pulse.filter((p) => hhmmToMin(p.time) + 60 >= now);
  const mobileItems =
    upcomingOrLive.length >= 3
      ? upcomingOrLive.slice(0, 3)
      : [...pulse].slice(-3);

  return (
    <div className="xl:col-span-8 surface p-5 lg:p-7">
      <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Pulso do dia</h3>
          <p className="text-sm text-ink-300 mt-0.5">
            Linha do tempo operacional da {DEMO_UNIT.name}
          </p>
        </div>
        <Link href="/agenda" className="btn-subtle">
          Ver agenda completa <IconArrow size={12} />
        </Link>
      </div>

      {/* Mobile: 3 itens + ver todos */}
      <ol className="md:hidden relative space-y-1">
        <div className="absolute left-[52px] top-2 bottom-2 w-px bg-gradient-to-b from-white/5 via-white/10 to-white/5" />
        {(expanded ? pulse : mobileItems).map((item) => (
          <PulseRow key={item.time + item.title} item={item} />
        ))}
        {!expanded && pulse.length > mobileItems.length && (
          <li className="pt-3">
            <button
              onClick={() => setExpanded(true)}
              className="btn-subtle w-full justify-center"
            >
              Ver todos os {pulse.length} eventos
            </button>
          </li>
        )}
      </ol>

      {/* Desktop: lista completa */}
      <ol className="hidden md:block relative space-y-1">
        <div className="absolute left-[52px] top-2 bottom-2 w-px bg-gradient-to-b from-white/5 via-white/10 to-white/5" />
        {pulse.map((item) => (
          <PulseRow key={item.time + item.title} item={item} />
        ))}
      </ol>
    </div>
  );
}

function PulseRow({ item }: { item: PulseItem }) {
  // Separa o título em "serviço — nome" pra tornar o nome clicável quando houver customerId
  let serviceText = item.title;
  let customerText: string | null = null;
  const dashIdx = item.title.lastIndexOf(" — ");
  if (item.customerId && dashIdx > 0) {
    serviceText = item.title.slice(0, dashIdx);
    customerText = item.title.slice(dashIdx + 3);
  }

  return (
    <li className="relative flex items-start gap-5 py-2.5">
      <div className="w-11 shrink-0 text-right text-sm tabular-nums text-ink-200 font-mono pt-0.5">
        {item.time}
      </div>
      <div
        className={`relative z-10 shrink-0 mt-1.5 w-2.5 h-2.5 rounded-full ring-4 ${
          item.highlight
            ? "bg-gold-400 ring-gold-400/15"
            : item.kind === "pendente"
            ? "bg-accent-amber ring-accent-amber/15"
            : item.kind === "operacional"
            ? "bg-ink-500 ring-ink-500/15"
            : item.kind === "comercial"
            ? "bg-accent-emerald ring-accent-emerald/15"
            : "bg-white/40 ring-white/5"
        }`}
      />
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[15px] text-white font-medium">
            {customerText && item.customerId ? (
              <>
                {serviceText}
                <span className="text-ink-400"> — </span>
                <Link
                  href={`/clientes/${item.customerId}`}
                  className="text-white hover:text-gold-300 underline underline-offset-4 decoration-white/15 hover:decoration-gold-300 transition-colors"
                >
                  {customerText}
                </Link>
              </>
            ) : (
              item.title
            )}
          </p>
          {item.highlight && (
            <span className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
              Agora
            </span>
          )}
          {item.kind === "pendente" && (
            <span className="pill bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
              Pendente
            </span>
          )}
          {item.kind === "comercial" && (
            <span className="pill bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
              Comercial
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-ink-200">{item.detail}</p>
      </div>
    </li>
  );
}
