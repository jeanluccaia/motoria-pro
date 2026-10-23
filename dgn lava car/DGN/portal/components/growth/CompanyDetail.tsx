"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Loader2,
  Check,
  X,
  Clock,
  Copy,
  Car,
  Users,
  AlertCircle,
  Calendar,
} from "lucide-react";
import type {
  CompanyRow,
  FleetVehicleRow,
  ManagerRow,
  ServiceRequestRow,
} from "@/lib/growth/db/corporate-fleet-write";

type Busy = "idle" | "pending" | { error: string };

export function CompanyDetail({
  company,
  managers,
  managerLinks,
  vehicles,
  requests,
}: {
  company: CompanyRow;
  managers: ManagerRow[];
  managerLinks: Record<string, string>;
  vehicles: FleetVehicleRow[];
  requests: ServiceRequestRow[];
}) {
  const [requestBusy, setRequestBusy] = useState<Record<string, Busy>>({});
  const vehicleById = useMemo(() => {
    const m: Record<string, FleetVehicleRow> = {};
    for (const v of vehicles) m[v.id] = v;
    return m;
  }, [vehicles]);
  const managerById = useMemo(() => {
    const m: Record<string, ManagerRow> = {};
    for (const g of managers) m[g.id] = g;
    return m;
  }, [managers]);

  const pending = requests.filter((r) => r.status === "pending" || r.status === "counter_proposed");
  const history = requests.filter((r) => r.status === "confirmed" || r.status === "cancelled");

  async function callDecision(
    requestId: string,
    verb: "confirm" | "counter-propose" | "cancel",
    body: Record<string, unknown>,
  ) {
    setRequestBusy((prev) => ({ ...prev, [requestId]: "pending" }));
    try {
      const r = await fetch(`/api/admin/growth/empresas/requests/${requestId}/${verb}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      if (!r.ok) {
        const b = (await r.json().catch(() => ({}))) as { error?: string };
        setRequestBusy((prev) => ({
          ...prev,
          [requestId]: { error: b.error ?? `Erro ${r.status}` },
        }));
        return;
      }
      window.location.reload();
    } catch (error) {
      setRequestBusy((prev) => ({
        ...prev,
        [requestId]: { error: error instanceof Error ? error.message : "Erro de rede" },
      }));
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {company.contactEmail || company.contactPhone ? (
        <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-white/60">
          Contato:
          {company.contactEmail ? <span className="ml-2 text-white/80">{company.contactEmail}</span> : null}
          {company.contactPhone ? <span className="ml-2 text-white/80">· {company.contactPhone}</span> : null}
        </section>
      ) : null}

      <section>
        <SectionHeader icon={<AlertCircle size={16} className="text-amber-200" />} title="Solicitações pendentes" count={pending.length} />
        {pending.length === 0 ? (
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/55">
            Nenhuma solicitação pendente agora.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                vehicle={vehicleById[r.fleetVehicleId]}
                manager={managerById[r.requestedByManagerId]}
                state={requestBusy[r.id] ?? "idle"}
                onConfirm={(scheduledAt, notes) =>
                  callDecision(r.id, "confirm", { scheduledAt, adminNotes: notes })
                }
                onCounterPropose={(proposedAt, notes) =>
                  callDecision(r.id, "counter-propose", { proposedAt, adminNotes: notes })
                }
                onCancel={(reason) => callDecision(r.id, "cancel", { reason })}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeader icon={<Users size={16} className="text-white/60" />} title="Gestores" count={managers.length} />
        <ManagersBlock companyId={company.id} managers={managers} managerLinks={managerLinks} />
      </section>

      <section>
        <SectionHeader icon={<Car size={16} className="text-white/60" />} title="Frota" count={vehicles.length} />
        <VehiclesBlock companyId={company.id} vehicles={vehicles} />
      </section>

      {history.length > 0 ? (
        <section>
          <SectionHeader icon={<Calendar size={16} className="text-white/60" />} title="Histórico" count={history.length} />
          <ul className="flex flex-col gap-2">
            {history.slice(0, 10).map((r) => (
              <li key={r.id} className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 text-xs text-white/60">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white/80">{r.serviceType}</span>
                  <span className={r.status === "confirmed" ? "text-emerald-200" : "text-amber-200"}>
                    {r.status === "confirmed" ? "Confirmada" : "Cancelada"}
                  </span>
                </div>
                <p className="mt-1">
                  Veículo: {vehicleById[r.fleetVehicleId]?.plate ?? "—"} ·
                  Gestor: {managerById[r.requestedByManagerId]?.displayName ?? "—"} ·
                  {r.scheduledAt ? ` Em ${formatDateTime(r.scheduledAt)}` : ""}
                  {r.cancelReason ? ` · Motivo: ${r.cancelReason}` : ""}
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

function ManagersBlock({
  companyId,
  managers,
  managerLinks,
}: {
  companyId: string;
  managers: ManagerRow[];
  managerLinks: Record<string, string>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ displayName: "", email: "", phone: "" });
  const [busy, setBusy] = useState<Busy>("idle");

  async function submit() {
    if (!form.displayName.trim() || !form.email.trim()) {
      setBusy({ error: "Nome e e-mail são obrigatórios." });
      return;
    }
    setBusy("pending");
    try {
      const r = await fetch(`/api/admin/growth/empresas/${companyId}/managers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "same-origin",
      });
      if (!r.ok) {
        const b = (await r.json().catch(() => ({}))) as { error?: string };
        setBusy({ error: b.error ?? `Erro ${r.status}` });
        return;
      }
      window.location.reload();
    } catch (error) {
      setBusy({ error: error instanceof Error ? error.message : "Erro de rede" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {managers.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {managers.map((m) => (
            <li key={m.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{m.displayName}</p>
                  <p className="text-xs text-white/55">
                    {m.email}
                    {m.phone ? ` · ${m.phone}` : ""}
                  </p>
                </div>
                {managerLinks[m.id] ? <ManagerLinkCopy value={managerLinks[m.id]} managerId={m.id} /> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 text-sm text-white/80 transition hover:bg-white/[0.06]"
          data-testid="btn-add-manager"
        >
          <Plus size={14} />
          Adicionar gestor
        </button>
      ) : (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Nome *" value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} />
            <Field label="E-mail *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
            <Field label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          </div>
          {typeof busy === "object" ? <p className="mt-2 text-xs text-amber-200">{busy.error}</p> : null}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="min-h-10 rounded-lg border border-white/10 px-3 text-sm text-white/70 hover:bg-white/[0.04]">
              Cancelar
            </button>
            <button
              type="button"
              disabled={busy === "pending"}
              onClick={submit}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-3 text-sm font-medium text-[#E7C96A] hover:bg-[#C9A84C]/[0.14] disabled:opacity-40"
            >
              {busy === "pending" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ManagerLinkCopy({ value, managerId }: { value: string; managerId: string }) {
  const [copied, setCopied] = useState(false);
  const url = `/empresa/entrar?mgr=${encodeURIComponent(managerId)}&t=${encodeURIComponent(value)}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.origin + url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no-op */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[11px] text-white/70 hover:bg-white/[0.06]"
      title="Copiar link de acesso do gestor"
      data-testid="btn-copy-manager-link"
    >
      {copied ? <Check size={12} className="text-emerald-200" /> : <Copy size={12} />}
      {copied ? "Copiado" : "Copiar link"}
    </button>
  );
}

function VehiclesBlock({ companyId, vehicles }: { companyId: string; vehicles: FleetVehicleRow[] }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    plate: "",
    make: "",
    model: "",
    year: "",
    color: "",
    driverName: "",
    nickname: "",
  });
  const [busy, setBusy] = useState<Busy>("idle");

  async function submit() {
    if (!form.plate.trim()) {
      setBusy({ error: "Placa é obrigatória." });
      return;
    }
    setBusy("pending");
    try {
      const r = await fetch(`/api/admin/growth/empresas/${companyId}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          year: form.year ? Number(form.year) : null,
        }),
        credentials: "same-origin",
      });
      if (!r.ok) {
        const b = (await r.json().catch(() => ({}))) as { error?: string };
        setBusy({ error: b.error ?? `Erro ${r.status}` });
        return;
      }
      window.location.reload();
    } catch (error) {
      setBusy({ error: error instanceof Error ? error.message : "Erro de rede" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {vehicles.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {vehicles.map((v) => (
            <li key={v.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-white">
                  {v.plate}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-white">
                    {[v.make, v.model, v.year].filter(Boolean).join(" ") || "Veículo sem detalhes"}
                  </p>
                  <p className="text-xs text-white/55">
                    {v.driverName ? `Motorista: ${v.driverName}` : "Sem motorista"}
                    {v.color ? ` · ${v.color}` : ""}
                    {v.nickname ? ` · ${v.nickname}` : ""}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 text-sm text-white/80 transition hover:bg-white/[0.06]"
          data-testid="btn-add-vehicle"
        >
          <Plus size={14} />
          Adicionar veículo
        </button>
      ) : (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Placa *" value={form.plate} onChange={(v) => setForm({ ...form, plate: v })} />
            <Field label="Marca" value={form.make} onChange={(v) => setForm({ ...form, make: v })} />
            <Field label="Modelo" value={form.model} onChange={(v) => setForm({ ...form, model: v })} />
            <Field label="Ano" value={form.year} onChange={(v) => setForm({ ...form, year: v })} type="number" />
            <Field label="Cor" value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
            <Field label="Motorista" value={form.driverName} onChange={(v) => setForm({ ...form, driverName: v })} />
            <Field label="Apelido" value={form.nickname} onChange={(v) => setForm({ ...form, nickname: v })} />
          </div>
          {typeof busy === "object" ? <p className="mt-2 text-xs text-amber-200">{busy.error}</p> : null}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="min-h-10 rounded-lg border border-white/10 px-3 text-sm text-white/70 hover:bg-white/[0.04]">
              Cancelar
            </button>
            <button
              type="button"
              disabled={busy === "pending"}
              onClick={submit}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-3 text-sm font-medium text-[#E7C96A] hover:bg-[#C9A84C]/[0.14] disabled:opacity-40"
            >
              {busy === "pending" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestCard({
  request,
  vehicle,
  manager,
  state,
  onConfirm,
  onCounterPropose,
  onCancel,
}: {
  request: ServiceRequestRow;
  vehicle: FleetVehicleRow | undefined;
  manager: ManagerRow | undefined;
  state: Busy;
  onConfirm: (scheduledAt: string, notes: string) => void;
  onCounterPropose: (proposedAt: string, notes: string) => void;
  onCancel: (reason: string) => void;
}) {
  type Mode = "none" | "confirm" | "counter" | "cancel";
  const [mode, setMode] = useState<Mode>("none");
  const [scheduledAt, setScheduledAt] = useState(toLocalDatetime(request.preferredDate1));
  const [adminNotes, setAdminNotes] = useState("");
  const [reason, setReason] = useState("");

  const isCounter = request.status === "counter_proposed";

  return (
    <li className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4" data-testid={`request-${request.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200">
            {isCounter ? "Contraproposta enviada" : "Aguardando sua resposta"}
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">{request.serviceType}</h3>
          <p className="mt-0.5 text-xs text-white/55">
            {manager?.displayName ?? "—"} · {vehicle?.plate ?? "—"}
            {vehicle?.model ? ` · ${vehicle.model}` : ""}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70">
          <Clock size={12} /> {formatDateTime(request.createdAt)}
        </span>
      </div>

      <dl className="mt-3 grid gap-2 text-xs text-white/60 sm:grid-cols-2">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.12em] text-white/40">Data pedida</dt>
          <dd className="text-white/80">{formatDateTime(request.preferredDate1)}</dd>
        </div>
        {request.preferredDate2 ? (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-white/40">Alternativa</dt>
            <dd className="text-white/80">{formatDateTime(request.preferredDate2)}</dd>
          </div>
        ) : null}
        {request.managerNotes ? (
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-white/40">Observação</dt>
            <dd className="text-white/80">{request.managerNotes}</dd>
          </div>
        ) : null}
        {isCounter && request.scheduledAt ? (
          <div className="sm:col-span-2">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-amber-200">Você propôs</dt>
            <dd className="text-amber-100">{formatDateTime(request.scheduledAt)}</dd>
          </div>
        ) : null}
      </dl>

      {typeof state === "object" ? (
        <p className="mt-2 text-xs text-amber-200">{state.error}</p>
      ) : null}

      {mode === "none" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={state === "pending"}
            onClick={() => setMode("confirm")}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-emerald-300/30 bg-emerald-300/[0.08] px-3 text-sm font-medium text-emerald-200 hover:bg-emerald-300/[0.14] disabled:opacity-40"
            data-testid="btn-confirm"
          >
            <Check size={14} /> Confirmar
          </button>
          <button
            type="button"
            disabled={state === "pending" || isCounter}
            title={isCounter ? "Já foi feita uma contraproposta — aguardando o gestor." : undefined}
            onClick={() => setMode("counter")}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-3 text-sm font-medium text-[#E7C96A] hover:bg-[#C9A84C]/[0.14] disabled:opacity-40"
          >
            <Clock size={14} /> Propor outra data
          </button>
          <button
            type="button"
            disabled={state === "pending"}
            onClick={() => setMode("cancel")}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 text-sm font-medium text-white/80 hover:bg-white/[0.06] disabled:opacity-40"
          >
            <X size={14} /> Cancelar
          </button>
        </div>
      ) : mode === "confirm" || mode === "counter" ? (
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
            {mode === "confirm" ? "Data confirmada" : "Nova data proposta"}
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="min-h-10 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none"
          />
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Observação (opcional)"
            className="min-h-16 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-sm text-white placeholder:text-white/30 focus:border-[#C9A84C]/40 focus:outline-none"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("none")} className="min-h-10 rounded-lg border border-white/10 px-3 text-sm text-white/70 hover:bg-white/[0.04]">
              Cancelar
            </button>
            <button
              type="button"
              disabled={!scheduledAt}
              onClick={() =>
                mode === "confirm"
                  ? onConfirm(new Date(scheduledAt).toISOString(), adminNotes)
                  : onCounterPropose(new Date(scheduledAt).toISOString(), adminNotes)
              }
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-emerald-300/30 bg-emerald-300/[0.08] px-3 text-sm font-medium text-emerald-200 hover:bg-emerald-300/[0.14] disabled:opacity-40"
            >
              {mode === "confirm" ? "Confirmar agendamento" : "Enviar contraproposta"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">Motivo do cancelamento</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: unidade em manutenção, veículo quebrou..."
            className="min-h-20 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-sm text-white placeholder:text-white/30 focus:border-[#C9A84C]/40 focus:outline-none"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("none")} className="min-h-10 rounded-lg border border-white/10 px-3 text-sm text-white/70 hover:bg-white/[0.04]">
              Voltar
            </button>
            <button
              type="button"
              disabled={!reason.trim()}
              onClick={() => onCancel(reason.trim())}
              className="min-h-10 rounded-lg border border-amber-300/30 bg-amber-300/[0.08] px-3 text-sm font-medium text-amber-200 hover:bg-amber-300/[0.14] disabled:opacity-40"
            >
              Confirmar cancelamento
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-white/60">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-10 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-sm text-white placeholder:text-white/30 focus:border-[#C9A84C]/40 focus:outline-none"
      />
    </label>
  );
}
