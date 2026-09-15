import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";
import { CustomerResolutionError, resolveCustomerId } from "./customer-resolver.ts";

// -----------------------------------------------------------------------------
// CRUD de crm_appointments (list + create + cancel + update).
//
// Portal só lê próximos via RPC portal_get_current_subscriber (upcoming_appointments).
// Admin escreve via service_role neste módulo. Fatia 2b introduziu updateAppointment
// (edição in-place, sem delete+create) para reagendamento operacional.
//
// Fuso: scheduled_at é timestamptz (UTC no banco); UI Admin recebe/entrega
// ISO string em qualquer fuso — Postgres normaliza.
//
// updated_at: BEFORE UPDATE trigger trg_crm_appointments_touch cuida do carimbo
// automaticamente. Nunca setar manualmente aqui.
// -----------------------------------------------------------------------------

export class AppointmentError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function resolve(db: SupabaseClient, input: string): Promise<string> {
  try {
    return await resolveCustomerId(db, input);
  } catch (err) {
    if (err instanceof CustomerResolutionError) throw new AppointmentError(err.message, err.status);
    throw err;
  }
}

export type AppointmentStatus = "scheduled" | "confirmed" | "done" | "cancelled" | "no_show";

export interface AppointmentRow {
  id: string;
  customer_id: string;
  subscription_id: string | null;
  vehicle_id: string | null;
  scheduled_at: string;
  service_type: string | null;
  status: AppointmentStatus;
  source: string;
  notes: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

async function auditInline(
  db: SupabaseClient,
  entry: {
    entityType: "appointment";
    entityId: string;
    action: string;
    previousValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
    actor: string;
    reason?: string | null;
  },
) {
  const { error } = await db.from("crm_audit_logs").insert({
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    previous_value: entry.previousValue ?? null,
    new_value: entry.newValue ?? null,
    actor: entry.actor,
    reason: entry.reason ?? null,
  });
  if (error) throw new AppointmentError(`Falha ao gravar audit_log: ${error.message}`, 502);
}

export async function listAppointments(
  customerId: string,
  db: SupabaseClient = getSupabaseAdminClient("appointments.list"),
): Promise<AppointmentRow[]> {
  const resolvedId = await resolve(db, customerId);
  const { data, error } = await db
    .from("crm_appointments")
    .select(
      "id, customer_id, subscription_id, vehicle_id, scheduled_at, service_type, status, source, notes, cancelled_at, cancelled_reason, created_by, created_at, updated_at",
    )
    .eq("customer_id", resolvedId)
    .order("scheduled_at", { ascending: true });
  if (error) throw new AppointmentError(`Falha ao listar agendamentos: ${error.message}`, 502);
  return (data ?? []) as AppointmentRow[];
}

export interface CreateAppointmentInput {
  customerId: string;
  subscriptionId?: string | null;
  vehicleId?: string | null;
  scheduledAt: string; // ISO
  serviceType?: string | null;
  notes?: string | null;
  actor: string;
  db?: SupabaseClient;
}

export async function createAppointment(input: CreateAppointmentInput): Promise<AppointmentRow> {
  const db = input.db ?? getSupabaseAdminClient("appointments.create");
  const resolvedCustomerId = await resolve(db, input.customerId);
  const when = new Date(input.scheduledAt);
  if (Number.isNaN(when.getTime())) throw new AppointmentError("Data/hora inválida.", 400);

  const insert = await db
    .from("crm_appointments")
    .insert({
      customer_id: resolvedCustomerId,
      subscription_id: input.subscriptionId ?? null,
      vehicle_id: input.vehicleId ?? null,
      scheduled_at: when.toISOString(),
      service_type: input.serviceType?.trim() || null,
      status: "scheduled",
      source: "MANUAL_ADMIN",
      notes: input.notes?.trim() || null,
      created_by: input.actor || "dgn-admin",
    })
    .select("id, customer_id, subscription_id, vehicle_id, scheduled_at, service_type, status, source, notes, cancelled_at, cancelled_reason, created_by, created_at, updated_at")
    .single();
  if (insert.error) throw new AppointmentError(`Falha ao criar agendamento: ${insert.error.message}`, 502);

  await auditInline(db, {
    entityType: "appointment",
    entityId: insert.data.id,
    action: "appointment.created",
    newValue: {
      scheduled_at: insert.data.scheduled_at,
      service_type: insert.data.service_type,
      vehicle_id: insert.data.vehicle_id,
      subscription_id: insert.data.subscription_id,
    },
    actor: input.actor || "dgn-admin",
  });

  return insert.data as AppointmentRow;
}

export interface CancelAppointmentInput {
  customerId: string;
  appointmentId: string;
  reason?: string | null;
  actor: string;
  db?: SupabaseClient;
}

export async function cancelAppointment(input: CancelAppointmentInput): Promise<AppointmentRow> {
  const db = input.db ?? getSupabaseAdminClient("appointments.cancel");
  const resolvedCustomerId = await resolve(db, input.customerId);
  const { data: current, error: readError } = await db
    .from("crm_appointments")
    .select("id, customer_id, status, scheduled_at")
    .eq("id", input.appointmentId)
    .maybeSingle();
  if (readError && readError.code !== "PGRST116") throw new AppointmentError(`Falha ao ler agendamento: ${readError.message}`, 502);
  if (!current) throw new AppointmentError("Agendamento não encontrado.", 404);
  if (current.customer_id !== resolvedCustomerId) throw new AppointmentError("Agendamento pertence a outro cliente.", 403);
  if (current.status === "cancelled") throw new AppointmentError("Agendamento já está cancelado.", 409);
  if (current.status === "done") throw new AppointmentError("Agendamento já foi executado.", 409);

  const update = await db
    .from("crm_appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: input.actor || "dgn-admin",
      cancelled_reason: input.reason?.trim() || null,
    })
    .eq("id", current.id)
    .select("id, customer_id, subscription_id, vehicle_id, scheduled_at, service_type, status, source, notes, cancelled_at, cancelled_reason, created_by, created_at, updated_at")
    .single();
  if (update.error) throw new AppointmentError(`Falha ao cancelar: ${update.error.message}`, 502);

  await auditInline(db, {
    entityType: "appointment",
    entityId: current.id,
    action: "appointment.cancelled",
    previousValue: { status: current.status, scheduled_at: current.scheduled_at },
    newValue: { status: "cancelled", reason: input.reason ?? null },
    actor: input.actor || "dgn-admin",
  });

  return update.data as AppointmentRow;
}

// -----------------------------------------------------------------------------
// updateAppointment (Fatia 2b): edição in-place de um agendamento existente.
//
// Regras:
//   * Só edita campos operacionais: scheduled_at, service_type, notes,
//     vehicle_id, subscription_id. Nunca toca id/customer_id/created_at/
//     created_by/source/status ou os campos de rastreabilidade de import
//     (external_ref, import_source, imported_at) — a UI Admin não pode
//     "desfazer" a proveniência 4UCAR de uma linha via edição.
//   * Undefined em qualquer campo = "não mexer". Explicit null em
//     vehicleId/subscriptionId = "desvincular".
//   * Só permitido quando o appointment está em scheduled ou confirmed.
//     done/cancelled/no_show ficam imutáveis pela UI de edição (reabertura
//     silenciosa foi o cenário que o brief pediu para bloquear).
//   * Vehicle e subscription passados são validados: precisam pertencer ao
//     mesmo customer, senão 403.
//   * Se nada mudou (patch vazio), retorna o próprio registro sem UPDATE
//     nem audit — evita audit log ruidoso e evita bump de updated_at.
//   * Audit action: 'appointment.updated', com changed_fields para facilitar
//     inspeção posterior.
// -----------------------------------------------------------------------------

export interface UpdateAppointmentInput {
  customerId: string;
  appointmentId: string;
  scheduledAt?: string;
  serviceType?: string | null;
  notes?: string | null;
  vehicleId?: string | null;
  subscriptionId?: string | null;
  actor: string;
  db?: SupabaseClient;
}

export async function updateAppointment(input: UpdateAppointmentInput): Promise<AppointmentRow> {
  const db = input.db ?? getSupabaseAdminClient("appointments.update");
  const resolvedCustomerId = await resolve(db, input.customerId);

  if (!input.appointmentId || typeof input.appointmentId !== "string") {
    throw new AppointmentError("appointmentId obrigatório.", 400);
  }

  const { data: current, error: readError } = await db
    .from("crm_appointments")
    .select(
      "id, customer_id, subscription_id, vehicle_id, scheduled_at, service_type, status, source, notes, cancelled_at, cancelled_reason, created_by, created_at, updated_at, external_ref, import_source, imported_at",
    )
    .eq("id", input.appointmentId)
    .maybeSingle();
  if (readError && readError.code !== "PGRST116") {
    throw new AppointmentError(`Falha ao ler agendamento: ${readError.message}`, 502);
  }
  if (!current) throw new AppointmentError("Agendamento não encontrado.", 404);
  if (current.customer_id !== resolvedCustomerId) {
    throw new AppointmentError("Agendamento pertence a outro cliente.", 403);
  }
  if (current.status !== "scheduled" && current.status !== "confirmed") {
    const msg =
      current.status === "cancelled" ? "Agendamento cancelado não pode ser editado." :
      current.status === "done"      ? "Agendamento já executado não pode ser editado." :
      current.status === "no_show"   ? "Agendamento marcado como no-show não pode ser editado." :
                                       "Agendamento no estado atual não pode ser editado.";
    throw new AppointmentError(msg, 409);
  }

  const patch: Record<string, unknown> = {};
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};
  const changed: string[] = [];

  if (input.scheduledAt !== undefined) {
    const when = new Date(input.scheduledAt);
    if (Number.isNaN(when.getTime())) throw new AppointmentError("Data/hora inválida.", 400);
    const nextIso = when.toISOString();
    const currentIso = new Date(current.scheduled_at as string).toISOString();
    if (nextIso !== currentIso) {
      patch.scheduled_at = nextIso;
      before.scheduled_at = current.scheduled_at;
      after.scheduled_at = nextIso;
      changed.push("scheduled_at");
    }
  }

  if (input.serviceType !== undefined) {
    const nextService = input.serviceType?.trim() || null;
    if (nextService !== (current.service_type ?? null)) {
      patch.service_type = nextService;
      before.service_type = current.service_type;
      after.service_type = nextService;
      changed.push("service_type");
    }
  }

  if (input.notes !== undefined) {
    const nextNotes = input.notes?.trim() || null;
    if (nextNotes !== (current.notes ?? null)) {
      patch.notes = nextNotes;
      before.notes = current.notes;
      after.notes = nextNotes;
      changed.push("notes");
    }
  }

  if (input.vehicleId !== undefined) {
    const nextVehicleId = input.vehicleId || null;
    if (nextVehicleId !== (current.vehicle_id ?? null)) {
      if (nextVehicleId) {
        const v = await db
          .from("crm_vehicles")
          .select("id, customer_id")
          .eq("id", nextVehicleId)
          .maybeSingle();
        if (v.error && v.error.code !== "PGRST116") {
          throw new AppointmentError(`Falha ao validar veículo: ${v.error.message}`, 502);
        }
        if (!v.data) throw new AppointmentError("Veículo não encontrado.", 404);
        if ((v.data as { customer_id: string }).customer_id !== resolvedCustomerId) {
          throw new AppointmentError("Veículo pertence a outro cliente.", 403);
        }
      }
      patch.vehicle_id = nextVehicleId;
      before.vehicle_id = current.vehicle_id;
      after.vehicle_id = nextVehicleId;
      changed.push("vehicle_id");
    }
  }

  if (input.subscriptionId !== undefined) {
    const nextSubscriptionId = input.subscriptionId || null;
    if (nextSubscriptionId !== (current.subscription_id ?? null)) {
      if (nextSubscriptionId) {
        const s = await db
          .from("crm_subscriptions")
          .select("id, customer_id")
          .eq("id", nextSubscriptionId)
          .maybeSingle();
        if (s.error && s.error.code !== "PGRST116") {
          throw new AppointmentError(`Falha ao validar assinatura: ${s.error.message}`, 502);
        }
        if (!s.data) throw new AppointmentError("Assinatura não encontrada.", 404);
        if ((s.data as { customer_id: string }).customer_id !== resolvedCustomerId) {
          throw new AppointmentError("Assinatura pertence a outro cliente.", 403);
        }
      }
      patch.subscription_id = nextSubscriptionId;
      before.subscription_id = current.subscription_id;
      after.subscription_id = nextSubscriptionId;
      changed.push("subscription_id");
    }
  }

  if (changed.length === 0) {
    return current as unknown as AppointmentRow;
  }

  const update = await db
    .from("crm_appointments")
    .update(patch)
    .eq("id", current.id)
    .select(
      "id, customer_id, subscription_id, vehicle_id, scheduled_at, service_type, status, source, notes, cancelled_at, cancelled_reason, created_by, created_at, updated_at",
    )
    .single();
  if (update.error) throw new AppointmentError(`Falha ao atualizar agendamento: ${update.error.message}`, 502);

  await auditInline(db, {
    entityType: "appointment",
    entityId: current.id,
    action: "appointment.updated",
    previousValue: { ...before, changed_fields: changed },
    newValue: after,
    actor: input.actor || "dgn-admin",
  });

  return update.data as AppointmentRow;
}
