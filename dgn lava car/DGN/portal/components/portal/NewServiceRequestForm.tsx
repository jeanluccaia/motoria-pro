"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import type { FleetVehicleRow } from "@/lib/growth/db/corporate-fleet-write";

export function NewServiceRequestForm({ vehicles }: { vehicles: FleetVehicleRow[] }) {
  const [fleetVehicleId, setFleetVehicleId] = useState(vehicles[0]?.id ?? "");
  const [serviceType, setServiceType] = useState("Lavagem completa");
  const [preferredDate1, setPreferredDate1] = useState("");
  const [preferredDate2, setPreferredDate2] = useState("");
  const [managerNotes, setManagerNotes] = useState("");
  const [busy, setBusy] = useState<"idle" | "pending" | { error: string }>("idle");

  async function submit() {
    if (!fleetVehicleId) {
      setBusy({ error: "Selecione um veículo." });
      return;
    }
    if (!serviceType.trim()) {
      setBusy({ error: "Tipo de serviço é obrigatório." });
      return;
    }
    if (!preferredDate1) {
      setBusy({ error: "Data preferida é obrigatória." });
      return;
    }
    setBusy("pending");
    try {
      const r = await fetch("/api/portal/empresa/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fleetVehicleId,
          serviceType,
          preferredDate1: new Date(preferredDate1).toISOString(),
          preferredDate2: preferredDate2 ? new Date(preferredDate2).toISOString() : null,
          managerNotes: managerNotes.trim() || null,
        }),
        credentials: "same-origin",
      });
      if (!r.ok) {
        const b = (await r.json().catch(() => ({}))) as { error?: string };
        setBusy({ error: b.error ?? `Erro ${r.status}` });
        return;
      }
      window.location.href = "/empresa";
    } catch (error) {
      setBusy({ error: error instanceof Error ? error.message : "Erro de rede" });
    }
  }

  return (
    <section className="mt-6 flex flex-col gap-5 rounded-xl border border-white/[0.08] bg-[#101010] p-4 sm:p-6">
      <label className="flex flex-col gap-1 text-xs text-white/60">
        <span>Veículo</span>
        <select
          value={fleetVehicleId}
          onChange={(e) => setFleetVehicleId(e.target.value)}
          className="min-h-10 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none"
          data-testid="select-fleet-vehicle"
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id} className="bg-[#141416] text-white">
              {v.plate} · {[v.make, v.model].filter(Boolean).join(" ") || "sem detalhes"}
              {v.driverName ? ` — ${v.driverName}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-white/60">
        <span>Tipo de serviço *</span>
        <input
          type="text"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          placeholder="Lavagem completa, Enceramento..."
          className="min-h-10 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-sm text-white placeholder:text-white/30 focus:border-[#C9A84C]/40 focus:outline-none"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>Data/hora preferida *</span>
          <input
            type="datetime-local"
            value={preferredDate1}
            onChange={(e) => setPreferredDate1(e.target.value)}
            className="min-h-10 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>Alternativa (opcional)</span>
          <input
            type="datetime-local"
            value={preferredDate2}
            onChange={(e) => setPreferredDate2(e.target.value)}
            className="min-h-10 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs text-white/60">
        <span>Observações para a unidade</span>
        <textarea
          value={managerNotes}
          onChange={(e) => setManagerNotes(e.target.value)}
          placeholder="Ex.: entregar com o motorista pela manhã."
          className="min-h-20 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-sm text-white placeholder:text-white/30 focus:border-[#C9A84C]/40 focus:outline-none"
        />
      </label>

      {typeof busy === "object" ? <p className="text-xs text-amber-200">{busy.error}</p> : null}

      <div className="dgn-manager-request-actions flex justify-end">
        <button
          type="button"
          disabled={busy === "pending"}
          onClick={submit}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-4 text-sm font-medium text-[#E7C96A] hover:bg-[#C9A84C]/[0.14] disabled:opacity-40"
          data-testid="btn-submit-request"
        >
          {busy === "pending" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Enviar solicitação
        </button>
      </div>
    </section>
  );
}
