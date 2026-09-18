/**
 * Match determinístico de customer e subscription para o reconciliador.
 *
 * Fuzzy name NUNCA gera apply automático — só POSSIBLE_MATCH (classifier
 * decide). Aqui só reportamos o que foi encontrado e por qual estratégia.
 */

import type { DgnCustomer } from "../dgn-growth-utils.ts";
import { normalizeName, normalizePhone, normalizePlate } from "../db/normalizers.ts";
import type {
  CustomerMatch,
  ReconcileInputRow,
  ReconcileSubscriptionRow,
  ReconcileVehicleRow,
  SubscriptionMatch,
} from "./types.ts";

interface CustomerIndex {
  byPhone: Map<string, string[]>;      // normalized "55DDDNUM" -> customer_ids
  byPlate: Map<string, string[]>;      // compact upper -> customer_ids (via vehicles)
  byLegacyId: Map<string, string>;     // lowercase -> customer_id
  byNameExact: Map<string, string[]>;  // normalized name -> customer_ids
  byId: Map<string, DgnCustomer>;
  all: DgnCustomer[];
}

export function buildCustomerIndex(
  customers: DgnCustomer[],
  vehicles: ReconcileVehicleRow[],
): CustomerIndex {
  const byPhone = new Map<string, string[]>();
  const byPlate = new Map<string, string[]>();
  const byLegacyId = new Map<string, string>();
  const byNameExact = new Map<string, string[]>();
  const byId = new Map<string, DgnCustomer>();

  for (const c of customers) {
    byId.set(c.id, c);
    const phone = normalizePhone(c.phone);
    if (phone.classification === "valido") {
      const list = byPhone.get(phone.digits) ?? [];
      list.push(c.id);
      byPhone.set(phone.digits, list);
    }
    const name = normalizeName(c.name);
    if (name.normalized) {
      const list = byNameExact.get(name.normalized) ?? [];
      list.push(c.id);
      byNameExact.set(name.normalized, list);
    }
    // legacy_id: quando o customer.id NÃO é UUID, é o legacy string.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.id)) {
      byLegacyId.set(c.id.toLowerCase(), c.id);
    }
  }

  for (const v of vehicles) {
    const plate = normalizePlate(v.plate);
    if (plate.classification.startsWith("valida")) {
      const list = byPlate.get(plate.compact) ?? [];
      if (!list.includes(v.customer_id)) list.push(v.customer_id);
      byPlate.set(plate.compact, list);
    }
  }

  return { byPhone, byPlate, byLegacyId, byNameExact, byId, all: customers };
}

function empty(reason: string): CustomerMatch {
  return { strategy: null, customerId: null, legacyId: null, customerName: null, ambiguousIds: [], reason };
}

function pick(customerId: string, others: string[], strategy: NonNullable<CustomerMatch["strategy"]>, reason: string, index: CustomerIndex): CustomerMatch {
  const c = index.byId.get(customerId);
  const ambiguous = others.filter((id) => id !== customerId);
  return {
    strategy,
    customerId,
    legacyId: c?.id ?? null,
    customerName: c?.name ?? null,
    ambiguousIds: ambiguous,
    reason,
  };
}

export function matchCustomer(row: ReconcileInputRow, index: CustomerIndex): CustomerMatch {
  // 1) telefone normalizado exato
  if (row.phone) {
    const p = normalizePhone(row.phone);
    if (p.classification === "valido") {
      const hits = index.byPhone.get(p.digits) ?? [];
      if (hits.length === 1) return pick(hits[0]!, hits, "phone", `phone match ${p.digits}`, index);
      if (hits.length > 1) return { ...pick(hits[0]!, hits, "phone", `múltiplos customers com phone ${p.digits}`, index), strategy: "phone" };
    }
  }

  // 2) placa exata via veículos
  if (row.plate) {
    const pl = normalizePlate(row.plate);
    if (pl.classification.startsWith("valida")) {
      const hits = index.byPlate.get(pl.compact) ?? [];
      if (hits.length === 1) return pick(hits[0]!, hits, "plate", `plate match ${pl.compact}`, index);
      if (hits.length > 1) return { ...pick(hits[0]!, hits, "plate", `múltiplos customers com plate ${pl.compact}`, index), strategy: "plate" };
    }
  }

  // 3) legacy_id exato (se operador colar)
  if (row.name && !row.name.includes(" ")) {
    const cand = index.byLegacyId.get(row.name.toLowerCase());
    if (cand) return pick(cand, [cand], "legacy_id", `legacy_id match ${row.name.toLowerCase()}`, index);
  }

  // 4) nome exato normalizado
  if (row.name) {
    const n = normalizeName(row.name);
    if (n.normalized) {
      const hits = index.byNameExact.get(n.normalized) ?? [];
      if (hits.length === 1) return pick(hits[0]!, hits, "name", `name exato ${n.normalized}`, index);
      if (hits.length > 1) return { ...pick(hits[0]!, hits, "name", `múltiplos customers com nome ${n.normalized}`, index), strategy: "name" };
    }

    // 5) fuzzy name (contém) → POSSIBLE_MATCH (nunca apply automático)
    if (n.normalized) {
      const fuzzyHits: string[] = [];
      for (const [k, ids] of index.byNameExact.entries()) {
        if (k.includes(n.normalized) || n.normalized.includes(k)) fuzzyHits.push(...ids);
      }
      const unique = Array.from(new Set(fuzzyHits));
      if (unique.length > 0) {
        return pick(unique[0]!, unique, "fuzzy_name", `fuzzy name (${unique.length} candidato(s))`, index);
      }
    }
  }

  return empty("nenhum customer localizado por phone/plate/legacy_id/name");
}

/**
 * Match de subscription DENTRO do customer já resolvido. Não escolhe alvo
 * quando há múltiplas ativas sem discriminador — o classifier decide o que
 * fazer (CONFLICT ou UPDATE_EXISTING_REVIEW).
 */
export function matchSubscription(
  row: ReconcileInputRow,
  customerId: string,
  subscriptions: ReconcileSubscriptionRow[],
  vehicles: ReconcileVehicleRow[],
): SubscriptionMatch {
  const forCustomer = subscriptions.filter((s) => s.customer_id === customerId);
  if (forCustomer.length === 0) {
    return {
      strategy: "none",
      subscriptionId: null, currentPlan: null, currentCycle: null,
      currentStatus: null, currentIsActive: false,
      providerLinked: false, candidatesCount: 0,
    };
  }

  // Se input tem placa e há sub com esse vehicle_id → match exato
  if (row.plate) {
    const pl = normalizePlate(row.plate);
    if (pl.classification.startsWith("valida")) {
      const veh = vehicles.find((v) => v.customer_id === customerId && normalizePlate(v.plate).compact === pl.compact);
      if (veh) {
        const s = forCustomer.find((x) => x.vehicle_id === veh.id);
        if (s) return toMatch(s, "exact_vehicle", forCustomer.length);
      }
    }
  }

  if (forCustomer.length === 1) {
    return toMatch(forCustomer[0]!, "single_only", 1);
  }

  // Múltiplas — retorna a mais recente ativa (só como referência), classifier decide
  const active = forCustomer.filter((s) => s.is_active_subscriber);
  const pick = (active.length > 0 ? active : forCustomer)[0]!;
  return toMatch(pick, "multiple_review", forCustomer.length);
}

function toMatch(s: ReconcileSubscriptionRow, strategy: SubscriptionMatch["strategy"], count: number): SubscriptionMatch {
  return {
    strategy,
    subscriptionId: s.id,
    currentPlan: s.subscription_plan,
    currentCycle: s.subscription_cycle,
    currentStatus: s.subscription_status,
    currentIsActive: s.is_active_subscriber,
    providerLinked: s.provider_subscription_id != null || s.provider_customer_id != null,
    candidatesCount: count,
  };
}
