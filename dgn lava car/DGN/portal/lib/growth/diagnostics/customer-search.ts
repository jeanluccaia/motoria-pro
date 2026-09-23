// Busca client-side de cliente + veículos para o fluxo "Novo diagnóstico".
// Reusa a mesma trilha de search de assinantes (nome sem acento, telefone
// só dígitos ≥4, placa alfanum ≥3) e adiciona a lista COMPLETA de veículos
// por cliente (crm_vehicles). NENHUMA info nova além do que a lista de
// assinantes/vehicles admin já expõe atravessa o bundle.
//
// Também expõe `resolveVehicleForCustomer` — validação server-side de que
// o vehicle informado pertence ao customer (defesa em profundidade além
// do check que a RPC já faz).

import {
  filterCustomersForSubscriberSearch,
  type SubscriberSearchCandidate,
} from "../subscriber-search.ts";

export interface DiagnosticVehicleCandidate {
  id: string;
  brand: string;
  model: string;
  plate: string;
  isPrimary: boolean;
}

export interface DiagnosticCustomerCandidate {
  id: string;
  name: string;
  phone: string;
  vehicles: DiagnosticVehicleCandidate[];
  hasActiveSubscription: boolean;
  activePlan: string | null;
}

// Adapta pra usar o filtro base (opera só nos campos de busca).
function toSearchCandidate(c: DiagnosticCustomerCandidate): SubscriberSearchCandidate {
  const primary = c.vehicles.find((v) => v.isPrimary) ?? c.vehicles[0];
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    vehicle: primary ? `${primary.brand} ${primary.model}`.trim() : "",
    plate: primary?.plate ?? "",
    hasActiveSubscription: c.hasActiveSubscription,
    activePlan: c.activePlan,
  };
}

export function filterCustomersForDiagnosticSearch(
  customers: readonly DiagnosticCustomerCandidate[],
  rawQuery: string,
  limit = 30,
): DiagnosticCustomerCandidate[] {
  // Constrói versão "assinante" só pra o filtro; mapeia de volta pelo id
  // preservando a lista completa de veículos.
  const asSearch = customers.map(toSearchCandidate);
  const hits = filterCustomersForSubscriberSearch(asSearch, rawQuery, limit);
  const byId = new Map(customers.map((c) => [c.id, c]));
  return hits.map((h) => byId.get(h.id)).filter((x): x is DiagnosticCustomerCandidate => Boolean(x));
}

// -----------------------------------------------------------------------------

export interface VehicleOwnershipCheck {
  ok: boolean;
  reason?: "customer_missing" | "vehicle_missing" | "vehicle_wrong_owner";
}

/**
 * Confirma que o vehicle informado existe E pertence ao customer.
 * Usado ANTES do POST (a RPC também valida, mas queremos falhar rápido
 * com mensagem clara).
 */
export function checkVehicleOwnership(
  customers: readonly DiagnosticCustomerCandidate[],
  customerId: string,
  vehicleId: string,
): VehicleOwnershipCheck {
  const customer = customers.find((c) => c.id === customerId);
  if (!customer) return { ok: false, reason: "customer_missing" };
  const vehicle = customer.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) {
    // Pode ser vehicle de outro customer OU inexistente
    const belongsToAnother = customers.some((c) =>
      c.id !== customerId && c.vehicles.some((v) => v.id === vehicleId),
    );
    return { ok: false, reason: belongsToAnother ? "vehicle_wrong_owner" : "vehicle_missing" };
  }
  return { ok: true };
}

/**
 * Regra do checkpoint: nenhum "primeiro veículo assumido silenciosamente".
 * Se houver 1 → aceito. Se houver >1 → precisa `preferredVehicleId`.
 * Se 0 → devolve `null` (endpoint mostra CTA cadastro).
 */
export function selectVehicleForNewDiagnostic(
  vehicles: readonly DiagnosticVehicleCandidate[],
  preferredVehicleId: string | null,
): { kind: "ok"; vehicleId: string }
 | { kind: "must_choose" }
 | { kind: "no_vehicles" }
{
  if (vehicles.length === 0) return { kind: "no_vehicles" };
  if (vehicles.length === 1) return { kind: "ok", vehicleId: vehicles[0].id };
  if (!preferredVehicleId) return { kind: "must_choose" };
  const found = vehicles.find((v) => v.id === preferredVehicleId);
  if (!found) return { kind: "must_choose" };
  return { kind: "ok", vehicleId: found.id };
}
