"use client";

// Fluxo real "Novo diagnóstico" — Entrega 1.
// Substitui o botão hardcoded de fixture. Sem TEST Customer no bundle.
//
// Regras enforçadas:
//   * Busca client-side sobre a base já carregada (loadGrowthData no server).
//     Sem endpoint novo, sem PII adicional.
//   * Veículo é EXPLÍCITO. 1 veículo → aceito. >1 → escolha obrigatória.
//     0 → CTA de cadastro (fluxo canônico existente na ficha do cliente).
//   * Verifica ownership antes do POST (guard extra além da RPC).
//   * POST usa Idempotency-Key único (crypto.randomUUID). Redireciona
//     pra /admin/growth/diagnosticos/[id].

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Car, Loader2, PlayCircle, Search, ShieldCheck, X } from "lucide-react";
import { DIAGNOSTIC_CATALOG_VERSION } from "@/lib/growth/diagnostics/catalog";
import {
  filterCustomersForDiagnosticSearch,
  checkVehicleOwnership,
  selectVehicleForNewDiagnostic,
  type DiagnosticCustomerCandidate,
} from "@/lib/growth/diagnostics/customer-search";

type Step = "search" | "vehicle" | "confirming";

export function NewDiagnosticFlow({
  candidates,
  performedByHint,
  initialCustomerId,
}: {
  candidates: DiagnosticCustomerCandidate[];
  performedByHint: string;
  initialCustomerId?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const initialCustomer = initialCustomerId
    ? candidates.find((c) => c.id === initialCustomerId) ?? null
    : null;

  const [query, setQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<DiagnosticCustomerCandidate | null>(initialCustomer);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    initialCustomer && initialCustomer.vehicles.length === 1 ? initialCustomer.vehicles[0].id : null,
  );
  const [performedBy, setPerformedBy] = useState(performedByHint);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step: Step = !selectedCustomer ? "search" : creating ? "confirming" : "vehicle";

  const results = useMemo(
    () => filterCustomersForDiagnosticSearch(candidates, query),
    [candidates, query],
  );

  const vehicleSelection = useMemo(() => {
    if (!selectedCustomer) return null;
    return selectVehicleForNewDiagnostic(selectedCustomer.vehicles, selectedVehicleId);
  }, [selectedCustomer, selectedVehicleId]);

  async function handleCreate() {
    if (!selectedCustomer || creating) return;
    if (!vehicleSelection || vehicleSelection.kind !== "ok") return;
    const guard = checkVehicleOwnership(candidates, selectedCustomer.id, vehicleSelection.vehicleId);
    if (!guard.ok) {
      setError(`Veículo inválido para este cliente (${guard.reason ?? "desconhecido"}). Recarregue e tente de novo.`);
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const res = await fetch(
        `/api/admin/growth/customers/${encodeURIComponent(selectedCustomer.id)}/diagnostics`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
          body: JSON.stringify({
            vehicle_id: vehicleSelection.vehicleId,
            catalog_version: DIAGNOSTIC_CATALOG_VERSION,
            performed_by: performedBy.trim() || "Curador DGN",
          }),
        },
      );
      const body = (await res.json().catch(() => ({}))) as {
        diagnostic_id?: string;
        error?: { code?: string; message?: string };
      };
      if (!res.ok || !body.diagnostic_id) {
        throw new Error(body.error?.message ?? `HTTP ${res.status}`);
      }
      router.push(`/admin/growth/diagnosticos/${encodeURIComponent(body.diagnostic_id)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar rascunho.");
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
      <StepIndicator step={step} />

      {step === "search" ? (
        <SearchSection
          inputRef={inputRef}
          query={query}
          onQuery={setQuery}
          results={results}
          onSelect={(c) => {
            setSelectedCustomer(c);
            setSelectedVehicleId(c.vehicles.length === 1 ? c.vehicles[0].id : null);
          }}
        />
      ) : selectedCustomer ? (
        <VehicleSection
          customer={selectedCustomer}
          selection={vehicleSelection}
          selectedVehicleId={selectedVehicleId}
          onPickVehicle={setSelectedVehicleId}
          performedBy={performedBy}
          onPerformedBy={setPerformedBy}
          creating={creating}
          onCreate={handleCreate}
          onChangeCustomer={() => {
            setSelectedCustomer(null);
            setSelectedVehicleId(null);
            setError(null);
          }}
        />
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-300/30 bg-red-400/[0.05] px-3 py-2 text-[12px] text-red-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const items = [
    { key: "search", label: "1. Cliente" },
    { key: "vehicle", label: "2. Veículo" },
    { key: "confirming", label: "3. Criar" },
  ] as const;
  return (
    <ol className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
      {items.map((item) => {
        const active = item.key === step;
        return (
          <li
            key={item.key}
            className={`inline-flex h-8 items-center rounded-full border px-3 ${
              active
                ? "border-[#C9A84C]/45 bg-[#C9A84C]/10 text-[#E7C96A]"
                : "border-white/10 bg-white/[0.03] text-white/55"
            }`}
          >
            {item.label}
          </li>
        );
      })}
    </ol>
  );
}

function SearchSection({
  inputRef,
  query,
  onQuery,
  results,
  onSelect,
}: {
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  query: string;
  onQuery: (v: string) => void;
  results: DiagnosticCustomerCandidate[];
  onSelect: (c: DiagnosticCustomerCandidate) => void;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
        Novo diagnóstico · fluxo real
      </p>
      <h2 className="mt-1 text-lg font-semibold text-white">Buscar cliente existente</h2>
      <p className="mt-1 text-[12px] text-white/55">
        Digite nome (sem acento tolerado), telefone (dígitos ≥4) ou placa (≥3).
        Sem duplicar cadastro. Cliente sem assinatura ativa também aparece.
      </p>

      <label className="mt-4 block">
        <span className="sr-only">Buscar cliente</span>
        <span className="relative block">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Nome, telefone (só dígitos) ou placa"
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 text-sm text-white outline-none focus:border-[#C9A84C]/45"
            autoComplete="off" spellCheck={false} autoFocus
          />
        </span>
      </label>

      <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
        {query.trim().length < 2 ? (
          <p className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-4 text-[12px] text-white/45">
            Digite ao menos 2 caracteres para começar a busca.
          </p>
        ) : results.length === 0 ? (
          <p className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-4 text-[12px] text-white/50">
            Nenhum cliente encontrado. Este atalho só serve pra cliente que já
            existe — cadastro novo continua pelo fluxo normal.
          </p>
        ) : (
          results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className="flex w-full items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-left transition hover:border-[#C9A84C]/35 hover:bg-[#C9A84C]/[0.04]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{c.name || "Sem nome"}</p>
                <p className="mt-0.5 truncate text-[11px] text-white/55">
                  {c.phone || "Sem telefone"}
                  {" · "}
                  {c.vehicles.length === 0
                    ? <span className="text-amber-300">sem veículo cadastrado</span>
                    : c.vehicles.length === 1
                      ? `${c.vehicles[0].brand} ${c.vehicles[0].model} · ${c.vehicles[0].plate}`
                      : `${c.vehicles.length} veículos`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {c.hasActiveSubscription ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
                    <ShieldCheck size={10} />
                    Assinante{c.activePlan ? ` · ${c.activePlan}` : ""}
                  </span>
                ) : null}
                <ArrowRight size={14} className="text-white/40" />
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function VehicleSection({
  customer,
  selection,
  selectedVehicleId,
  onPickVehicle,
  performedBy,
  onPerformedBy,
  creating,
  onCreate,
  onChangeCustomer,
}: {
  customer: DiagnosticCustomerCandidate;
  selection: ReturnType<typeof selectVehicleForNewDiagnostic> | null;
  selectedVehicleId: string | null;
  onPickVehicle: (id: string) => void;
  performedBy: string;
  onPerformedBy: (v: string) => void;
  creating: boolean;
  onCreate: () => void;
  onChangeCustomer: () => void;
}) {
  const noVehicles = selection?.kind === "no_vehicles";
  const mustChoose = selection?.kind === "must_choose";
  const canCreate = selection?.kind === "ok";

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
            Cliente selecionado
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">{customer.name}</h2>
          <p className="mt-1 text-[11px] text-white/55">{customer.phone || "Sem telefone"}</p>
        </div>
        <button
          type="button"
          onClick={onChangeCustomer}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-white/70 hover:border-white/25"
        >
          <X size={11} /> Trocar cliente
        </button>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
          Veículo avaliado
        </p>

        {noVehicles ? (
          <div className="mt-2 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] px-3 py-3 text-[12px] leading-relaxed text-amber-100">
            <p className="font-semibold text-amber-200">
              Este cliente não tem veículo cadastrado.
            </p>
            <p className="mt-1">
              Diagnóstico exige veículo. Cadastre pelo fluxo canônico — depois volte aqui.
            </p>
            <Link
              href={`/admin/growth/customers/${encodeURIComponent(customer.id)}`}
              className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-3 text-[11px] font-semibold text-[#E7C96A]"
            >
              <Car size={12} /> Abrir ficha para cadastrar veículo
            </Link>
          </div>
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {customer.vehicles.map((v) => {
              const picked = v.id === selectedVehicleId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onPickVehicle(v.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    picked
                      ? "border-[#C9A84C]/40 bg-[#C9A84C]/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">
                    {v.brand} {v.model}
                    {v.isPrimary ? (
                      <span className="ml-2 rounded-full border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/60">
                        Principal
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-[11px] text-white/50">{v.plate}</p>
                </button>
              );
            })}
          </div>
        )}

        {mustChoose ? (
          <p className="mt-3 rounded-lg border border-amber-300/25 bg-amber-300/[0.05] px-3 py-2 text-[11px] text-amber-200">
            Selecione explicitamente o veículo. Nada aqui assume o primeiro.
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
            Avaliador
          </span>
          <input
            type="text"
            value={performedBy}
            onChange={(e) => onPerformedBy(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-[#C9A84C]/40"
            placeholder="Nome de quem vai avaliar"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCreate}
          disabled={!canCreate || creating}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/12 px-4 text-sm font-semibold text-[#E7C96A] transition hover:border-[#C9A84C]/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
          Criar rascunho
        </button>
      </div>
    </section>
  );
}
