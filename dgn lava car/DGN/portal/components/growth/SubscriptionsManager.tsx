"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Lock, Trash2, Pencil, Plus, ShieldAlert, CheckCircle2 } from "lucide-react";
import {
  DGN_SUBSCRIBER_PLANS,
  DGN_BILLING_MODALITIES,
} from "@/lib/growth/dgn-plans";

// -----------------------------------------------------------------------------
// SubscriptionsManager — Editor de assinaturas na ficha do cliente (FASE 1).
//
// Renderiza a lista de contratos (crm_subscriptions) e permite:
//   * criar assinatura manual (plano, modalidade, veículo, fim da vigência, motivo)
//   * editar assinatura manual (plano/modalidade/veículo/fim da vigência/motivo)
//   * cancelar assinatura manual (motivo obrigatório)
//
// Contratos com vínculo PagBank (pagBankLocked=true) ficam read-only com aviso
// claro; nenhuma ação de edição/cancelamento é oferecida na UI, e o backend
// derruba tentativas de qualquer forma (defesa em profundidade).
// -----------------------------------------------------------------------------

export interface SubscriptionRow {
  id: string;
  plan: string;
  modality: "Mensal" | "Fidelidade de 6 meses" | "Fidelidade de 12 meses" | "Outra";
  status: string;
  isActive: boolean;
  source: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentEvidenceSource: string;
  paymentMethodLabel: string | null;
  cycleEndsAt: string | null;
  nextDueDate: string | null;
  vehicleId: string | null;
  sourceReference: string | null;
  notes: string | null;
  pagBankLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VehicleOption {
  id: string;
  label: string;
  isPrimary: boolean;
}

const cardCls =
  "rounded-2xl border border-white/[0.06] bg-[#101010] p-4";
const inputCls =
  "mt-1 h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-[#C9A84C]/40";
const labelCls =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50";
const btnPrimary =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 text-sm font-semibold text-[#E7C96A] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#C9A84C]/15";
const btnSecondary =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white/80 disabled:opacity-40 hover:bg-white/[0.05]";
const btnDanger =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-red-400/25 bg-red-400/10 px-4 text-sm font-semibold text-red-200 disabled:opacity-40 hover:bg-red-400/15";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function isoToInputDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function statusTone(status: string, isActive: boolean): { label: string; cls: string } {
  const raw = status.toLowerCase();
  if (raw === "ativo" && isActive) return { label: "Ativo", cls: "border-emerald-300/30 bg-emerald-300/[0.06] text-emerald-200" };
  if (raw === "detectado") return { label: "Detectado", cls: "border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#E7C96A]" };
  if (raw === "pendente_validacao") return { label: "Pendente validação", cls: "border-white/15 bg-white/[0.04] text-white/70" };
  if (raw === "inadimplente") return { label: "Inadimplente", cls: "border-red-300/30 bg-red-300/[0.06] text-red-200" };
  if (raw === "cancelado") return { label: "Cancelado", cls: "border-white/10 bg-white/[0.02] text-white/50" };
  if (raw === "encerrado") return { label: "Encerrado", cls: "border-white/10 bg-white/[0.02] text-white/50" };
  return { label: status || "—", cls: "border-white/10 bg-white/[0.02] text-white/60" };
}

function paymentToneLabel(status: string, evidence: string, method: string) {
  const parts: string[] = [];
  parts.push(`Pagamento: ${status || "—"}`);
  parts.push(`Método: ${method || "—"}`);
  parts.push(`Evidência: ${evidence || "—"}`);
  return parts.join(" · ");
}

// -----------------------------------------------------------------------------

export function SubscriptionsManager({
  customerId,
  enabled,
}: {
  customerId: string;
  enabled: boolean;
}) {
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const endpoint = `/api/admin/growth/customers/${encodeURIComponent(customerId)}`;

  const reload = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    setLoading(true);
    try {
      const [subs, veh] = await Promise.all([
        fetch(`${endpoint}/subscriptions`),
        fetch(`${endpoint}/vehicles`),
      ]);
      const subsBody = await subs.json();
      if (!subs.ok) throw new Error(subsBody.error || "Falha ao listar assinaturas.");
      const vehBody = await veh.json();
      if (!veh.ok) throw new Error(vehBody.error || "Falha ao listar veículos.");
      setRows((subsBody.subscriptions ?? []) as SubscriptionRow[]);
      const list = (vehBody.vehicles ?? []) as Array<{
        id: string; brand: string | null; model: string | null;
        plate: string | null; is_primary: boolean | null;
      }>;
      setVehicles(list.map((v) => ({
        id: v.id,
        label: [v.brand, v.model].filter(Boolean).join(" ") + (v.plate ? ` · ${v.plate}` : ""),
        isPrimary: !!v.is_primary,
      })));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar assinaturas.");
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled]);

  useEffect(() => { void reload(); }, [reload]);

  const editableRows = useMemo(() => rows.filter((r) => !r.pagBankLocked), [rows]);
  const pagBankRows = useMemo(() => rows.filter((r) => r.pagBankLocked), [rows]);

  return (
    <div className="space-y-4">
      {!enabled && (
        <p className="rounded-xl border border-amber-300/30 bg-amber-300/[0.06] px-3 py-2 text-xs text-amber-200">
          Persistência não habilitada — leitura apenas. Não é possível criar ou editar assinaturas neste ambiente.
        </p>
      )}
      {loading && <p className="text-xs text-white/50">Carregando assinaturas…</p>}
      {error && (
        <p className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}

      {!loading && rows.length === 0 && (
        <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/60">
          Este cliente ainda não tem nenhuma assinatura registrada.
        </p>
      )}

      {rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row) => (
            <SubscriptionCard
              key={row.id}
              row={row}
              vehicles={vehicles}
              customerId={customerId}
              enabled={enabled}
              editing={editingId === row.id}
              onEdit={() => setEditingId(row.id)}
              onCancelEdit={() => setEditingId(null)}
              onChanged={async () => {
                setEditingId(null);
                await reload();
              }}
            />
          ))}
        </div>
      )}

      {enabled && !loading && (
        <div className="pt-1">
          {!showCreate ? (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className={btnPrimary}
              disabled={editingId !== null}
            >
              <Plus size={14} className="mr-1.5" />
              Adicionar assinatura manual
            </button>
          ) : (
            <SubscriptionCreateForm
              customerId={customerId}
              vehicles={vehicles}
              onCancel={() => setShowCreate(false)}
              onCreated={async () => {
                setShowCreate(false);
                await reload();
              }}
            />
          )}
        </div>
      )}

      {pagBankRows.length > 0 && editableRows.length === 0 && (
        <p className="mt-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[11px] text-white/50">
          <ShieldAlert size={12} className="mr-1 inline align-[-2px]" />
          Todos os contratos deste cliente são PagBank recorrentes. Alterações financeiras vêm pelo importer oficial —
          o editor manual não modifica cobrança nem vigência PagBank.
        </p>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------

function SubscriptionCard({
  row,
  vehicles,
  customerId,
  enabled,
  editing,
  onEdit,
  onCancelEdit,
  onChanged,
}: {
  row: SubscriptionRow;
  vehicles: VehicleOption[];
  customerId: string;
  enabled: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const tone = statusTone(row.status, row.isActive);
  const vehicleLabel = vehicles.find((v) => v.id === row.vehicleId)?.label ?? "—";
  const isCancelled = row.status.toLowerCase() === "cancelado";

  if (editing && !row.pagBankLocked) {
    return (
      <SubscriptionEditForm
        row={row}
        vehicles={vehicles}
        customerId={customerId}
        onCancel={onCancelEdit}
        onSaved={onChanged}
      />
    );
  }

  return (
    <div className={cardCls}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone.cls}`}>
              {tone.label}
            </span>
            <span className="text-sm font-semibold text-white">{row.plan}</span>
            <span className="text-xs text-white/60">· {row.modality}</span>
            {row.pagBankLocked && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                <Lock size={10} /> PagBank
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-white/55">
            Veículo: <span className="text-white/80">{vehicleLabel}</span>
          </p>
          <p className="mt-1 text-xs text-white/55">
            Fim da vigência: <span className="text-white/80">{formatDate(row.cycleEndsAt)}</span>
            {" · "}
            Próxima cobrança: <span className="text-white/80">{formatDate(row.nextDueDate)}</span>
          </p>
          <p className="mt-1 text-[11px] text-white/45">
            Origem: {row.source} · {paymentToneLabel(row.paymentStatus, row.paymentEvidenceSource, row.paymentMethod)}
          </p>
          {row.sourceReference && (
            <p className="mt-1 text-[11px] text-white/45">
              Referência: {row.sourceReference}
            </p>
          )}
        </div>
        {enabled && !row.pagBankLocked && !isCancelled && (
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onEdit} className={btnSecondary}>
              <Pencil size={13} className="mr-1.5" /> Editar
            </button>
            <CancelSubscriptionButton
              row={row}
              customerId={customerId}
              onCancelled={onChanged}
            />
          </div>
        )}
      </div>

      {row.pagBankLocked && (
        <p className="mt-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[11px] text-white/60">
          <Lock size={11} className="mr-1 inline align-[-2px]" />
          Contrato recorrente do PagBank. Plano, cobrança, próxima cobrança e vigência
          financeira são controlados pelo provedor. Alterações passam pelo importer
          oficial — não é possível editar por aqui.
        </p>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------

function SubscriptionCreateForm({
  customerId,
  vehicles,
  onCancel,
  onCreated,
}: {
  customerId: string;
  vehicles: VehicleOption[];
  onCancel: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [plan, setPlan] = useState<string>("Smart");
  const [modality, setModality] = useState<string>("Mensal");
  const [vehicleId, setVehicleId] = useState<string>(vehicles[0]?.id ?? "");
  const [cycleEndsAt, setCycleEndsAt] = useState<string>("");
  const [sourceReference, setSourceReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const endpoint = `/api/admin/growth/customers/${encodeURIComponent(customerId)}/subscriptions`;

  const canSubmit =
    (DGN_SUBSCRIBER_PLANS as readonly string[]).includes(plan)
    && (DGN_BILLING_MODALITIES as readonly string[]).includes(modality)
    && sourceReference.trim().length > 0;

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true); setError(null);
    try {
      const payload: Record<string, unknown> = {
        plan,
        modality,
        vehicleId: vehicleId || null,
        sourceReference: sourceReference.trim(),
        paymentEvidenceSource: "manual",
        paymentStatus: "unknown",
      };
      if (cycleEndsAt) payload.cycleEndsAt = new Date(`${cycleEndsAt}T23:59:59`).toISOString();
      if (notes.trim()) payload.notes = notes.trim();

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Falha ao criar assinatura.");
      if (body.resultCode === "REVIEW_EXISTING_SUBSCRIPTION") {
        setError("Já existe uma assinatura equivalente para este cliente/veículo/plano. Nada foi criado — verifique a lista antes de duplicar.");
        return;
      }
      await onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar assinatura.");
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const veh = vehicles.find((v) => v.id === vehicleId)?.label ?? "sem veículo vinculado";
    const end = cycleEndsAt ? formatDate(new Date(`${cycleEndsAt}T00:00:00`).toISOString()) : "sem data de fim";
    return `${plan} · ${modality} · ${veh} · fim: ${end}`;
  }, [plan, modality, vehicleId, cycleEndsAt, vehicles]);

  return (
    <div className="rounded-2xl border border-[#C9A84C]/30 bg-white/[0.02] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]/80">
        Nova assinatura manual
      </p>
      <p className="mt-1 text-[11px] text-white/50">
        Não confirma pagamento nem cria cobrança PagBank. Registra um contrato manual auditado.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label>
          <span className={labelCls}>Plano *</span>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputCls}>
            {DGN_SUBSCRIBER_PLANS.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </label>
        <label>
          <span className={labelCls}>Modalidade *</span>
          <select value={modality} onChange={(e) => setModality(e.target.value)} className={inputCls}>
            {DGN_BILLING_MODALITIES.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>
        </label>
        <label>
          <span className={labelCls}>Veículo vinculado</span>
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={inputCls}>
            <option value="">— sem veículo específico —</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.label}{v.isPrimary ? " (principal)" : ""}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelCls}>Fim da vigência</span>
          <input
            type="date"
            value={cycleEndsAt}
            onChange={(e) => setCycleEndsAt(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="sm:col-span-2">
          <span className={labelCls}>Motivo / origem *</span>
          <input
            value={sourceReference}
            onChange={(e) => setSourceReference(e.target.value)}
            placeholder="Ex.: Contrato manual assinado 2026-09-21 (Digo)"
            className={inputCls}
            maxLength={200}
          />
        </label>
        <label className="sm:col-span-2">
          <span className={labelCls}>Observações internas</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalhes que ficam no CRM (opcional)"
            className={`${inputCls} h-24 py-2`}
            maxLength={2000}
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}

      {confirming ? (
        <div className="mt-4 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E7C96A]">
            Confirmar criação
          </p>
          <p className="mt-1 text-xs text-white/80">{summary}</p>
          <p className="mt-1 text-[11px] text-white/50">
            Motivo: <span className="text-white/70">{sourceReference}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={() => setConfirming(false)} className={btnSecondary} disabled={saving}>
              Voltar
            </button>
            <button type="button" onClick={submit} disabled={saving} className={btnPrimary}>
              <CheckCircle2 size={13} className="mr-1.5" />
              {saving ? "Salvando…" : "Confirmar e criar"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={saving} className={btnSecondary}>Cancelar</button>
          <button
            type="button"
            disabled={!canSubmit || saving}
            onClick={() => setConfirming(true)}
            className={btnPrimary}
          >
            Revisar
          </button>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------

function SubscriptionEditForm({
  row,
  vehicles,
  customerId,
  onCancel,
  onSaved,
}: {
  row: SubscriptionRow;
  vehicles: VehicleOption[];
  customerId: string;
  onCancel: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const initialModality = (DGN_BILLING_MODALITIES as readonly string[]).includes(row.modality)
    ? row.modality
    : "Mensal";
  const [plan, setPlan] = useState<string>(row.plan || "Smart");
  const [modality, setModality] = useState<string>(initialModality);
  const [vehicleId, setVehicleId] = useState<string>(row.vehicleId ?? "");
  const [clearVehicle, setClearVehicle] = useState<boolean>(row.vehicleId == null);
  const [cycleEndsAt, setCycleEndsAt] = useState<string>(isoToInputDate(row.cycleEndsAt));
  const [clearCycleEndsAt, setClearCycleEndsAt] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const endpoint = `/api/admin/growth/customers/${encodeURIComponent(customerId)}/subscriptions/${encodeURIComponent(row.id)}`;

  const canSubmit = reason.trim().length > 0;

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true); setError(null);
    try {
      const payload: Record<string, unknown> = { reason: reason.trim() };
      if (plan !== row.plan) payload.plan = plan;
      if (modality !== row.modality) payload.modality = modality;
      if (clearVehicle) {
        payload.clearVehicle = true;
      } else if (vehicleId && vehicleId !== row.vehicleId) {
        payload.vehicleId = vehicleId;
      }
      if (clearCycleEndsAt) {
        payload.clearCycleEndsAt = true;
      } else if (cycleEndsAt && cycleEndsAt !== isoToInputDate(row.cycleEndsAt)) {
        payload.cycleEndsAt = new Date(`${cycleEndsAt}T23:59:59`).toISOString();
      }

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Falha ao editar assinatura.");
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao editar assinatura.");
    } finally {
      setSaving(false);
    }
  };

  const diff = useMemo(() => {
    const items: string[] = [];
    if (plan !== row.plan) items.push(`Plano: ${row.plan} → ${plan}`);
    if (modality !== row.modality) items.push(`Modalidade: ${row.modality} → ${modality}`);
    if (clearVehicle && row.vehicleId) items.push("Veículo: remover vínculo");
    else if (vehicleId && vehicleId !== row.vehicleId) {
      const label = vehicles.find((v) => v.id === vehicleId)?.label ?? vehicleId;
      const prev = vehicles.find((v) => v.id === row.vehicleId)?.label ?? "—";
      items.push(`Veículo: ${prev} → ${label}`);
    }
    if (clearCycleEndsAt && row.cycleEndsAt) items.push("Fim da vigência: remover");
    else if (cycleEndsAt && cycleEndsAt !== isoToInputDate(row.cycleEndsAt)) {
      items.push(`Fim da vigência: ${formatDate(row.cycleEndsAt)} → ${formatDate(new Date(`${cycleEndsAt}T00:00:00`).toISOString())}`);
    }
    return items;
  }, [plan, modality, vehicleId, clearVehicle, cycleEndsAt, clearCycleEndsAt, row, vehicles]);

  return (
    <div className="rounded-2xl border border-[#C9A84C]/30 bg-white/[0.02] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]/80">
        Editar assinatura manual
      </p>
      <p className="mt-1 text-[11px] text-white/50">
        Não modifica cobrança PagBank, financeiro do provedor nem confirma pagamento.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label>
          <span className={labelCls}>Plano</span>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputCls}>
            {DGN_SUBSCRIBER_PLANS.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </label>
        <label>
          <span className={labelCls}>Modalidade</span>
          <select value={modality} onChange={(e) => setModality(e.target.value)} className={inputCls}>
            {DGN_BILLING_MODALITIES.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>
        </label>
        <label>
          <span className={labelCls}>Veículo vinculado</span>
          <select
            value={clearVehicle ? "" : vehicleId}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") { setClearVehicle(true); setVehicleId(""); }
              else { setClearVehicle(false); setVehicleId(v); }
            }}
            className={inputCls}
          >
            <option value="">— sem veículo específico —</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.label}{v.isPrimary ? " (principal)" : ""}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelCls}>Fim da vigência</span>
          <input
            type="date"
            value={clearCycleEndsAt ? "" : cycleEndsAt}
            onChange={(e) => { setClearCycleEndsAt(false); setCycleEndsAt(e.target.value); }}
            className={inputCls}
          />
          <label className="mt-2 flex items-center gap-2 text-[11px] text-white/60">
            <input
              type="checkbox"
              checked={clearCycleEndsAt}
              onChange={(e) => {
                setClearCycleEndsAt(e.target.checked);
                if (e.target.checked) setCycleEndsAt("");
              }}
              className="h-3.5 w-3.5 rounded border-white/15 bg-white/[0.03]"
            />
            Remover data de fim
          </label>
        </label>
        <label className="sm:col-span-2">
          <span className={labelCls}>Motivo *</span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex.: Ajuste de plano confirmado pelo cliente (Digo, 2026-09-21)"
            className={inputCls}
            maxLength={200}
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}

      {confirming ? (
        <div className="mt-4 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E7C96A]">
            Confirmar alterações
          </p>
          {diff.length === 0 ? (
            <p className="mt-1 text-xs text-white/70">Nenhuma alteração detectada — apenas motivo será registrado.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-xs text-white/80">
              {diff.map((d) => (<li key={d}>· {d}</li>))}
            </ul>
          )}
          <p className="mt-2 text-[11px] text-white/50">
            Motivo: <span className="text-white/70">{reason}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={() => setConfirming(false)} className={btnSecondary} disabled={saving}>
              Voltar
            </button>
            <button type="button" onClick={submit} disabled={saving} className={btnPrimary}>
              <CheckCircle2 size={13} className="mr-1.5" />
              {saving ? "Salvando…" : "Confirmar e salvar"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={saving} className={btnSecondary}>Cancelar</button>
          <button
            type="button"
            disabled={!canSubmit || saving}
            onClick={() => setConfirming(true)}
            className={btnPrimary}
          >
            Revisar
          </button>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------

function CancelSubscriptionButton({
  row,
  customerId,
  onCancelled,
}: {
  row: SubscriptionRow;
  customerId: string;
  onCancelled: () => Promise<void> | void;
}) {
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = `/api/admin/growth/customers/${encodeURIComponent(customerId)}/subscriptions/${encodeURIComponent(row.id)}`;

  const submit = async () => {
    if (!reason.trim() || saving) return;
    setSaving(true); setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Falha ao cancelar.");
      await onCancelled();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao cancelar.");
    } finally {
      setSaving(false);
    }
  };

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={btnDanger}>
        <Trash2 size={13} className="mr-1.5" /> Cancelar
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-red-400/25 bg-red-400/10 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-200">
        Cancelar {row.plan} · {row.modality}
      </p>
      <label className="mt-2 block">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-200/80">
          Motivo do cancelamento *
        </span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex.: Cliente pediu encerramento em 2026-09-21"
          className="mt-1 h-10 w-full rounded-xl border border-red-400/25 bg-red-400/[0.06] px-3 text-sm text-white outline-none focus:border-red-300/40"
          maxLength={200}
        />
      </label>
      {error && (
        <p className="mt-2 rounded-lg border border-red-400/40 bg-red-400/15 px-3 py-2 text-[11px] text-red-100">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={() => { setAsking(false); setReason(""); setError(null); }} className={btnSecondary} disabled={saving}>
          Voltar
        </button>
        <button type="button" onClick={submit} disabled={!reason.trim() || saving} className={btnDanger}>
          {saving ? "Cancelando…" : "Confirmar cancelamento"}
        </button>
      </div>
    </div>
  );
}
