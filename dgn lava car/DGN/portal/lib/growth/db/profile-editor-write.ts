import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";
import { CustomerResolutionError, resolveCustomerId } from "./customer-resolver.ts";

// -----------------------------------------------------------------------------
// Edições de contato (telefone) e de dados do veículo (placa/marca/modelo).
//
// E-mail intencionalmente NÃO editado aqui — vive em portal-access-write.ts
// (mudança de e-mail implica magic link + audit específico e não é mera edição
// de contato).
// -----------------------------------------------------------------------------

export class ProfileEditorError extends Error {
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
    if (err instanceof CustomerResolutionError) throw new ProfileEditorError(err.message, err.status);
    throw err;
  }
}

async function auditInline(
  db: SupabaseClient,
  entry: {
    entityType: "customer" | "vehicle";
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
  if (error) throw new ProfileEditorError(`Falha ao gravar audit_log: ${error.message}`, 502);
}

// -----------------------------------------------------------------------------
// Listagem — usada pela UI Admin pra iterar veículos e mostrar foto atual
// -----------------------------------------------------------------------------

export interface VehicleWithPhoto {
  id: string;
  brand: string | null;
  model: string | null;
  plate: string | null;
  masked_plate: string | null;
  is_primary: boolean | null;
  photo_url: string | null;
  photo_updated_at: string | null;
}

export async function listCustomerVehicles(
  customerId: string,
  db: SupabaseClient = getSupabaseAdminClient("profile-editor.list-vehicles"),
): Promise<VehicleWithPhoto[]> {
  const resolvedId = await resolve(db, customerId);
  const { data, error } = await db
    .from("crm_vehicles")
    .select("id, brand, model, plate, masked_plate, is_primary, photo_url, photo_updated_at")
    .eq("customer_id", resolvedId)
    .order("is_primary", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw new ProfileEditorError(`Falha ao listar veículos: ${error.message}`, 502);
  return (data ?? []) as VehicleWithPhoto[];
}

// -----------------------------------------------------------------------------
// Telefone
// -----------------------------------------------------------------------------

/** Normaliza pra formato canônico do CRM: só dígitos, com DDI 55 no começo. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) throw new ProfileEditorError("Telefone obrigatório.", 400);
  if (digits.length < 10 || digits.length > 13) {
    throw new ProfileEditorError("Telefone inválido (esperado 10 a 13 dígitos).", 400);
  }
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export interface UpdatePhoneInput {
  customerId: string;
  phone: string;
  actor: string;
  db?: SupabaseClient;
}

export async function updateCustomerPhone(input: UpdatePhoneInput): Promise<{ customerId: string; normalizedPhone: string }> {
  const db = input.db ?? getSupabaseAdminClient("profile-editor.update-phone");
  const normalized = normalizePhone(input.phone);
  const resolvedId = await resolve(db, input.customerId);

  const current = await db
    .from("crm_customers")
    .select("id, primary_phone, normalized_phone")
    .eq("id", resolvedId)
    .maybeSingle();
  if (current.error && current.error.code !== "PGRST116") {
    throw new ProfileEditorError(`Falha ao consultar cliente: ${current.error.message}`, 502);
  }
  if (!current.data) throw new ProfileEditorError("Cliente não encontrado.", 404);

  const update = await db
    .from("crm_customers")
    .update({
      primary_phone: input.phone.trim(),
      normalized_phone: normalized,
    })
    .eq("id", resolvedId);
  if (update.error) throw new ProfileEditorError(`Falha ao gravar telefone: ${update.error.message}`, 502);

  await auditInline(db, {
    entityType: "customer",
    entityId: resolvedId,
    action: "customer_phone.updated",
    previousValue: { normalized_phone: current.data.normalized_phone },
    newValue: { normalized_phone: normalized },
    actor: input.actor || "dgn-admin",
  });

  return { customerId: resolvedId, normalizedPhone: normalized };
}

// -----------------------------------------------------------------------------
// Dados do veículo
// -----------------------------------------------------------------------------

export interface UpdateVehicleFieldsInput {
  customerId: string;
  vehicleId: string;
  brand?: string | null;
  model?: string | null;
  plate?: string | null;
  actor: string;
  db?: SupabaseClient;
}

function normalizePlate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!cleaned) return null;
  if (cleaned.length < 7 || cleaned.length > 8) {
    throw new ProfileEditorError("Placa inválida (7-8 caracteres alfanuméricos).", 400);
  }
  return cleaned;
}

function maskPlate(plate: string | null): string | null {
  if (!plate) return null;
  if (plate.length <= 4) return plate;
  return `${plate.slice(0, 3)}·${plate.slice(-2)}`;
}

export async function updateVehicleFields(input: UpdateVehicleFieldsInput): Promise<{ vehicleId: string }> {
  const db = input.db ?? getSupabaseAdminClient("profile-editor.update-vehicle");
  const resolvedCustomerId = await resolve(db, input.customerId);

  const current = await db
    .from("crm_vehicles")
    .select("id, customer_id, plate, brand, model")
    .eq("id", input.vehicleId)
    .maybeSingle();
  if (current.error && current.error.code !== "PGRST116") {
    throw new ProfileEditorError(`Falha ao consultar veículo: ${current.error.message}`, 502);
  }
  if (!current.data) throw new ProfileEditorError("Veículo não encontrado.", 404);
  if (current.data.customer_id !== resolvedCustomerId) {
    throw new ProfileEditorError("Veículo pertence a outro cliente.", 403);
  }

  const updates: Record<string, unknown> = {};
  if (input.brand !== undefined) updates.brand = input.brand?.trim() || null;
  if (input.model !== undefined) {
    const model = input.model?.trim() || null;
    updates.model = model;
    updates.normalized_model = model?.toLowerCase() ?? null;
  }
  if (input.plate !== undefined) {
    const plate = normalizePlate(input.plate);
    updates.plate = plate;
    updates.normalized_plate = plate;
    updates.masked_plate = maskPlate(plate);
  }

  if (Object.keys(updates).length === 0) {
    return { vehicleId: input.vehicleId };
  }

  const update = await db.from("crm_vehicles").update(updates).eq("id", input.vehicleId);
  if (update.error) throw new ProfileEditorError(`Falha ao gravar veículo: ${update.error.message}`, 502);

  await auditInline(db, {
    entityType: "vehicle",
    entityId: input.vehicleId,
    action: "vehicle_fields.updated",
    previousValue: {
      plate: current.data.plate,
      brand: current.data.brand,
      model: current.data.model,
    },
    newValue: updates,
    actor: input.actor || "dgn-admin",
  });

  return { vehicleId: input.vehicleId };
}
