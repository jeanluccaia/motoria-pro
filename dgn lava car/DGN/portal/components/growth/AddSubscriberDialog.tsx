"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, UserPlus, X, ShieldCheck } from "lucide-react";
import {
  filterCustomersForSubscriberSearch,
  type SubscriberSearchCandidate,
} from "@/lib/growth/subscriber-search";

// Entrada operacional "Adicionar assinante" na aba Assinantes.
// O usuário pega um cliente já cadastrado, seleciona, e é redirecionado
// para /admin/growth/customers/[id]?novaAssinatura=1 — que abre o form
// canônico de criação manual (SubscriptionsManager). Zero cadastro novo,
// zero segundo CRM. A busca roda 100% em memória sobre a base já carregada
// server-side (loadGrowthData) — sem novo endpoint, sem exposição adicional
// de PII no bundle público.

export function AddSubscriberDialog({
  candidates,
  disabled = false,
  disabledReason,
}: {
  candidates: SubscriberSearchCandidate[];
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(
    () => filterCustomersForSubscriberSearch(candidates, query),
    [candidates, query],
  );

  useEffect(() => {
    if (!open) return;
    // Foco imediato + reset da query ao abrir.
    setQuery("");
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        data-testid="assinantes-add-subscriber-open"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-3 text-xs font-semibold uppercase tracking-wider text-[#E7C96A] transition hover:border-[#C9A84C]/60 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <UserPlus size={14} />
        Adicionar assinante
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center bg-black/70 px-4 pt-16 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          data-testid="assinantes-add-subscriber-overlay"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Adicionar assinante — buscar cliente existente"
            className="w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#101010] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
                  Adicionar assinante
                </p>
                <h2 className="mt-1 text-base font-semibold text-white">
                  Buscar cliente existente
                </h2>
                <p className="mt-1 text-[11px] text-white/50">
                  Sem recadastro. Só clientes já na base. Selecione e siga direto para o
                  formulário canônico de criação de assinatura.
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-white/50 transition hover:bg-white/[0.05] hover:text-white"
              >
                <X size={16} />
              </button>
            </header>

            <div className="px-5 py-4">
              <label className="block">
                <span className="sr-only">Buscar cliente</span>
                <span className="relative block">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nome, telefone (só dígitos) ou placa"
                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 text-sm text-white outline-none focus:border-[#C9A84C]/45"
                    autoComplete="off"
                    spellCheck={false}
                    data-testid="assinantes-add-subscriber-input"
                  />
                </span>
              </label>

              <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                {query.trim().length < 2 ? (
                  <p className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-4 text-[12px] text-white/45">
                    Digite ao menos 2 caracteres para começar a busca.
                  </p>
                ) : results.length === 0 ? (
                  <p
                    data-testid="assinantes-add-subscriber-empty"
                    className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-4 text-[12px] text-white/50"
                  >
                    Nenhum cliente encontrado com esse termo. Cheque nome, telefone (só
                    dígitos) ou placa. Cadastro novo continua sendo feito pelo fluxo
                    normal — este atalho só serve para cliente que já existe.
                  </p>
                ) : (
                  results.map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/growth/customers/${encodeURIComponent(c.id)}?novaAssinatura=1`}
                      data-testid="assinantes-add-subscriber-result"
                      data-customer-id={c.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-left transition hover:border-[#C9A84C]/30 hover:bg-[#C9A84C]/[0.04]"
                      onClick={() => setOpen(false)}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {c.name || "Sem nome"}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-white/55">
                          {c.vehicle || "Sem veículo"}
                          {c.plate ? ` · ${c.plate}` : ""}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-white/45">
                          {c.phone || "Sem telefone"}
                        </p>
                      </div>
                      {c.hasActiveSubscription ? (
                        <span
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200"
                          title="Este cliente já é assinante. Uma nova assinatura será considerada segundo contrato — útil para outro veículo."
                        >
                          <ShieldCheck size={10} />
                          Já assinante{c.activePlan ? ` · ${c.activePlan}` : ""}
                        </span>
                      ) : null}
                    </Link>
                  ))
                )}
              </div>
            </div>

            <footer className="border-t border-white/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.14em] text-white/40">
              Zero cadastro novo. O próximo passo abre o formulário canônico com dedupe,
              guarda PagBank e audit log.
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}
