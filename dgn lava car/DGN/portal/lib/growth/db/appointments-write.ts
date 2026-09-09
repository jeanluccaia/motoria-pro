import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";
import { CustomerResolutionError, resolveCustomerId } from "./customer-resolver.ts";

// -----------------------------------------------------------------------------
// CRUD de crm_appointments (MVP: create + list + cancel).
//
// Portal só lê próximos via RPC portal_get_current_subscriber (upcoming_appointments).
// Admin escreve via service_role neste módulo. Reagendamento vira delete+create
// (evita máquina de estado antes do MVP validar UX).
//
// Fuso: scheduled_at é timestamptz (UTC no banco); UI Admin recebe/entrega
// ISO string em qualquer fuso — Postgres normaliza.
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
