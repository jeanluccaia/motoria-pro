/**
 * Remap de `customer_id` no snapshot canônico para bater com o `DgnCustomer.id`
 * usado pelo matcher (que preserva `legacy_id` quando existe, caindo para UUID
 * quando não). `crm_subscriptions.customer_id` e `crm_vehicles.customer_id` são
 * SEMPRE UUID no Supabase — sem essa camada, o matcher perde subs/veículos de
 * qualquer customer com legacy_id (padrão dos 4 promovidos no Lote 1).
 *
 * Puro, sem I/O — o endpoint apenas passa `snapshot.customers` (raw), subs e
 * vehicles crus e recebe as listas com `customer_id` no formato do DgnCustomer.
 */
import type { ReconcileSubscriptionRow, ReconcileVehicleRow } from "./types.ts";

interface RawCustomerRow {
  id?: unknown;
  legacy_id?: unknown;
}

interface RawSubscriptionRow {
  id?: unknown;
  customer_id?: unknown;
  subscription_plan?: unknown;
  subscription_cycle?: unknown;
  subscription_status?: unknown;
  is_active_subscriber?: unknown;
  provider_customer_id?: unknown;
  provider_subscription_id?: unknown;
  vehicle_id?: unknown;
  cycle_ends_at?: unknown;
  billing_due_at?: unknown;
  source_reference?: unknown;
  payment_status?: unknown;
  payment_evidence_source?: unknown;
}

interface RawVehicleRow {
  id?: unknown;
  customer_id?: unknown;
  plate?: unknown;
  brand?: unknown;
  model?: unknown;
}

/**
 * Constrói o mapa UUID → id-canônico-do-DgnCustomer.
 * DgnCustomer.id = legacy_id quando existe; UUID caso contrário.
 */
export function buildUuidToDgnIdMap(rawCustomers: RawCustomerRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rawCustomers) {
    const uuid = typeof row.id === "string" ? row.id : "";
    if (!uuid) continue;
    const legacy = typeof row.legacy_id === "string" && row.legacy_id.trim().length > 0
      ? row.legacy_id
      : "";
    map.set(uuid, legacy || uuid);
  }
  return map;
}

function resolveCustomerId(rawCustomerId: unknown, uuidToDgnId: Map<string, string>): string {
  const raw = typeof rawCustomerId === "string" ? rawCustomerId : String(rawCustomerId ?? "");
  return uuidToDgnId.get(raw) ?? raw;
}

export function mapSubscriptionsForReconciler(
  rawSubs: RawSubscriptionRow[],
  uuidToDgnId: Map<string, string>,
): ReconcileSubscriptionRow[] {
  return rawSubs.map((s) => ({
    id: typeof s.id === "string" ? s.id : String(s.id ?? ""),
    customer_id: resolveCustomerId(s.customer_id, uuidToDgnId),
    subscription_plan: typeof s.subscription_plan === "string" ? s.subscription_plan : String(s.subscription_plan ?? ""),
    subscription_cycle: typeof s.subscription_cycle === "string" ? s.subscription_cycle : String(s.subscription_cycle ?? ""),
    subscription_status: typeof s.subscription_status === "string" ? s.subscription_status : String(s.subscription_status ?? ""),
    is_active_subscriber: s.is_active_subscriber === true,
    provider_customer_id: typeof s.provider_customer_id === "string" ? s.provider_customer_id : null,
    provider_subscription_id: typeof s.provider_subscription_id === "string" ? s.provider_subscription_id : null,
    vehicle_id: typeof s.vehicle_id === "string" ? s.vehicle_id : null,
    cycle_ends_at: typeof s.cycle_ends_at === "string" ? s.cycle_ends_at : null,
    billing_due_at: typeof s.billing_due_at === "string" ? s.billing_due_at : null,
    source_reference: typeof s.source_reference === "string" ? s.source_reference : null,
    payment_status: typeof s.payment_status === "string" ? s.payment_status : null,
    payment_evidence_source: typeof s.payment_evidence_source === "string" ? s.payment_evidence_source : null,
  }));
}

export function mapVehiclesForReconciler(
  rawVehicles: RawVehicleRow[],
  uuidToDgnId: Map<string, string>,
): ReconcileVehicleRow[] {
  return rawVehicles.map((v) => ({
    id: typeof v.id === "string" ? v.id : String(v.id ?? ""),
    customer_id: resolveCustomerId(v.customer_id, uuidToDgnId),
    plate: typeof v.plate === "string" ? v.plate : null,
    brand: typeof v.brand === "string" ? v.brand : null,
    model: typeof v.model === "string" ? v.model : null,
  }));
}
