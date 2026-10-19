"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { CUSTOMERS, vehicleByCustomer } from "@/lib/data";
import { IconArrow } from "@/components/Icons";

type Filter = "all" | "subscribers" | "casual" | "opportunity";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "subscribers", label: "Assinantes" },
  { key: "casual", label: "Avulsos" },
  { key: "opportunity", label: "Com oportunidade" },
];

export function ClientesList() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo(() => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const qRaw = query.trim().toLowerCase();
    const qNorm = normalize(query);
    return CUSTOMERS.filter((c) => {
      const v = vehicleByCustomer(c.id);
      const hay = [
        c.name,
        v?.make,
        v?.model,
        v?.plate,
        v?.color,
        c.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const hayNorm = normalize(hay);
      // Match normal (texto) OU match normalizado (placa com/sem hífen)
      if (qRaw && !hay.includes(qRaw) && !hayNorm.includes(qNorm)) return false;

      if (filter === "subscribers" && !c.plan) return false;
      if (filter === "casual" && c.plan) return false;
      if (filter === "opportunity" && c.opportunity.priority === "baixa")
        return false;

      return true;
    });
  }, [query, filter]);

  return (
    <>
      <div className="surface p-5 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[220px] relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, veículo ou placa"
            aria-label="Buscar cliente"
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-ink-950/60 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/15"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={clsx(
                "px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-gold-400 text-ink-950"
                  : "bg-white/5 text-ink-100 hover:bg-white/10"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="surface p-10 text-center space-y-4">
          <p className="text-ink-200">
            Nenhum cliente encontrado com os filtros atuais
          </p>
          <button
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            className="btn-subtle"
          >
            Limpar busca e filtros
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((c) => {
            const v = vehicleByCustomer(c.id);
            return (
              <li key={c.id}>
                <Link
                  href={`/clientes/${c.id}`}
                  className="group surface p-5 flex flex-col h-full hover:border-gold-400/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-ink-700 to-ink-850 border border-white/10 flex items-center justify-center text-sm font-semibold text-ink-100">
                      {c.avatarInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[15px] text-white font-medium truncate">
                          {c.name}
                        </p>
                        {c.tier === "Fundador" && (
                          <span className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
                            Fundador
                          </span>
                        )}
                        {c.tier === "VIP" && (
                          <span className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-200 mt-0.5">
                        {c.plan ? `DGN ${c.plan.label}` : "Cliente avulso"} ·
                        desde {c.since}
                      </p>
                    </div>
                    <IconArrow
                      size={14}
                      className="shrink-0 mt-1 text-ink-300 group-hover:text-gold-300 transition-colors"
                    />
                  </div>

                  {v && (
                    <div className="mt-4 flex items-center gap-3 text-xs">
                      <span className="text-ink-300">{v.year}</span>
                      <span className="text-ink-500">·</span>
                      <span className="text-ink-100 truncate flex-1">
                        {v.make} {v.model}
                      </span>
                      <span className="font-mono text-ink-200">{v.plate}</span>
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-white/5">
                    <p className="text-[11px] uppercase tracking-wider text-ink-300">
                      Oportunidade
                    </p>
                    <p className="mt-1 text-sm text-white truncate">
                      {c.opportunity.title}
                    </p>
                    <p
                      className={clsx(
                        "mt-1 text-[11px] uppercase tracking-wider",
                        c.opportunity.kind === "corporate" ||
                          c.opportunity.kind === "upgrade"
                          ? "text-accent-emerald"
                          : "text-gold-300"
                      )}
                    >
                      {c.opportunity.projection.deltaDisplay}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
