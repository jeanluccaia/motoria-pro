"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Car,
  Check,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import type {
  CompanyRow,
  FleetVehicleRow,
  ManagerRow,
  ServiceRequestRow,
} from "@/lib/growth/db/corporate-fleet-write";

type Busy = "idle" | "pending" | { error: string };

export function ManagerPortal({
  manager,
  vehicles,
  requests,
}: {
  company: CompanyRow;
  manager: ManagerRow;
  vehicles: FleetVehicleRow[];
  requests: ServiceRequestRow[];
}) {
  const [busyByReq, setBusyByReq] = useState<Record<string, Busy>>({});
  const vehicleById = useMemo(() => {
    const m: Record<string, FleetVehicleRow> = {};
    for (const v of vehicles) m[v.id] = v;
    return m;
  }, [vehicles]);

  const open = requests.filter((r) => r.status === "pending" || r.status === "counter_proposed");
  const history = requests.filter((r) => r.status === "confirmed" || r.status === "cancelled");

  async function call(requestId: string, verb: "accept-counter" | "cancel", body: Record<string, unknown>) {
    setBusyByReq((prev) => ({ ...prev, [requestId]: "pending" }));
    try {
      const r = await fetch(`/api/portal/empresa/requests/${requestId}/${verb}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      if (!r.ok) {
        const b = (await r.json().catch(() => ({}))) as { error?: string };
        setBusyByReq((prev) => ({ ...prev, [requestId]: { error: b.error ?? `Erro ${r.status}` } }));
        return;
      }
      window.location.reload();
    } catch (error) {
      setBusyByReq((prev) => ({
        ...prev,
        [requestId]: { error: error instanceof Error ? error.message : "Erro de rede" },
      }));
    }
  }

  return (
    <div className="dgn-fleet-sections mt-6">
      <section className="dgn-fleet-requests">
        <SectionHeader icon={<AlertCircle size={16} className="text-amber-200" />} title="Solicitações em andamento" count={open.length} />
        {open.length === 0 ? (
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/55">
            Você não tem nenhuma solicitação aberta.
          </p>
        ) : (
          <ul className="flex flex-col gap-3" data-testid="manager-open-requests">
            {open.map((r) => (
              <OpenRequestCard
                key={r.id}
                request={r}
                vehicle={vehicleById[r.fleetVehicleId]}
                state={busyByReq[r.id] ?? "idle"}
                canAccept={r.status === "counter_proposed" && r.requestedByManagerId === manager.id}
                onAccept={() => call(r.id, "accept-counter", {})}
                onCancel={(reason) => call(r.id, "cancel", { reason })}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeader icon={<Car size={16} className="text-white/60" />} title="Sua frota" count={vehicles.length} />
        {vehicles.length === 0 ? (
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/55">
            Nenhum veículo cadastrado. Fale com a equipe DGN para incluir sua frota.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {vehicles.map((v) => (
              <li key={v.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-white">
                    {v.plate}
                  </span>
                  <div>
                    <p className="text-sm text-white">
                      {[v.make, v.model, v.year].filter(Boolean).join(" ") || "Veículo"}
                    </p>
                    <p className="text-xs text-white/55">
                      {v.driverName ? `Motorista: ${v.driverName}` : "Sem motorista"}
                      {v.nickname ? ` · ${v.nickname}` : ""}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {history.length > 0 ? (
        <section>
          <SectionHeader icon={<Calendar size={16} className="text-white/60" />} title="Histórico" count={history.length} />
          <ul className="flex flex-col gap-2">
            {history.slice(0, 20).map((r) => (
              <li key={r.id} className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 text-xs text-white/60">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white/80">{r.serviceType}</span>
                  <span className={r.status === "confirmed" ? "text-emerald-200" : "text-amber-200"}>
                    {r.status === "confirmed" ? "Confirmada" : "Cancelada"}
                  </span>
                </div>
                <p className="mt-1">
                  Veículo: {vehicleById[r.fleetVehicleId]?.plate ?? "—"}
                  {r.scheduledAt ? ` · ${formatDateTime(r.scheduledAt)}` : ""}
                  {r.cancelReason ? ` · ${r.cancelReason}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
      {icon}
      {title}
      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 text-[10px] font-semibold tabular-nums text-white/70">
        {count}
      </span>
    </h2>
  );
}

function OpenRequestCard({
  request,
  vehicle,
  state,
  canAccept,
  onAccept,
  onCancel,
}: {
  request: ServiceRequestRow;
  vehicle: FleetVehicleRow | undefined;
  state: Busy;
  canAccept: boolean;
  onAccept: () => void;
  onCancel: (reason: string) => void;
}) {
  const [cancelMode, setCancelMode] = useState(false);
  const [reason, setReason] = useState("");

  const isCounter = request.status === "counter_proposed";
  const tone = isCounter ? "amber" : "white";

  return (
    <li className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4" data-testid={`manager-request-${request.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${tone === "amber" ? "text-amber-200" : "text-white/70"}`}>
            {isCounter ? "Unidade propôs outra data" : "Aguardando resposta da unidade"}
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">{request.serviceType}</h3>
          <p className="mt-0.5 text-xs text-white/55">
            {vehicle?.plate ?? "—"}
            {vehicle?.model ? ` · ${vehicle.model}` : ""}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70">
          <Clock size={12} /> {formatDateTime(request.createdAt)}
        </span>
      </div>

      <dl className="mt-3 grid gap-2 text-xs text-white/60 sm:grid-cols-2">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.12em] text-white/40">Você pediu</dt>
          <dd className="text-white/80">{formatDateTime(request.preferredDate1)}</dd>
        </div>
        {request.preferredDate2 ? (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-white/40">Alternativa</dt>
            <dd className="text-white/80">{formatDateTime(request.preferredDate2)}</dd>
          </div>
        ) : null}
        {isCounter && request.scheduledAt ? (
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-amber-200">Unidade sugere</dt>
            <dd className="text-amber-100">{formatDateTime(request.scheduledAt)}</dd>
            {request.adminNotes ? <p className="mt-0.5 text-amber-100/80">{request.adminNotes}</p> : null}
          </div>
        ) : null}
      </dl>

      {typeof state === "object" ? <p className="mt-2 text-xs text-amber-200">{state.error}</p> : null}

      {cancelMode ? (
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">Motivo do cancelamento</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: veículo na mecânica"
            className="min-h-20 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-sm text-white placeholder:text-white/30 focus:border-[#C9A84C]/40 focus:outline-none"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setCancelMode(false)} className="min-h-10 rounded-lg border border-white/10 px-3 text-sm text-white/70 hover:bg-white/[0.04]">
              Voltar
            </button>
            <button
              type="button"
              disabled={!reason.trim() || state === "pending"}
              onClick={() => onCancel(reason.trim())}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-amber-300/30 bg-amber-300/[0.08] px-3 text-sm font-medium text-amber-200 hover:bg-amber-300/[0.14] disabled:opacity-40"
            >
              {state === "pending" ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
              Cancelar solicitação
            </button>
          </div>
        </div>
      ) : (
        <div className="dgn-manager-request-actions mt-4 flex flex-wrap gap-2">
          {canAccept ? (
            <button
              type="button"
              disabled={state === "pending"}
              onClick={onAccept}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-emerald-300/30 bg-emerald-300/[0.08] px-3 text-sm font-medium text-emerald-200 hover:bg-emerald-300/[0.14] disabled:opacity-40"
              data-testid="btn-accept-counter"
            >
              {state === "pending" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Aceitar nova data
            </button>
          ) : null}
          <button
            type="button"
            disabled={state === "pending"}
            onClick={() => setCancelMode(true)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 text-sm font-medium text-white/80 hover:bg-white/[0.06] disabled:opacity-40"
          >
            <X size={14} /> Cancelar
          </button>
        </div>
      )}
    </li>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
