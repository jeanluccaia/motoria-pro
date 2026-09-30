import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { DgnCustomer } from "../dgn-growth-data.ts";
import { getSupabaseAdminClient } from "../db/admin-client.ts";
import { loadGrowthData } from "../db/growth-reader.ts";
import type { DiagnosticCustomerCandidate, DiagnosticVehicleCandidate } from "./customer-search.ts";

// ---------------------------------------------------------------------------
// Server-side loader dos candidatos do fluxo "Novo diagnóstico".
//
// Regras invioláveis:
//
// 1. PAGINAÇÃO — crm_vehicles em prod já supera o limite default do PostgREST
//    numa única query (1000 rows). O load precisa varrer todas as páginas.
//    Sem isso, um cliente aparece "sem veículo" só porque a linha dele caiu
//    fora da primeira janela de resultado.
//
// 2. IDENTIDADE CANÔNICA — DgnCustomer.id pode ser slug (legacy_id) ou UUID,
//    dependendo de como o growth-reader mapeou (linha 181). Já
//    crm_vehicles.customer_id é SEMPRE UUID. O relacionamento
//    customer↔vehicles TEM que ser feito por UUID; jamais por slug, nome,
//    telefone ou placa. Aqui carregamos {id, legacy_id} do crm_customers
//    para montar o mapa slug/UUID → UUID canônico e usar essa chave contra
//    crm_vehicles.customer_id.
// ---------------------------------------------------------------------------

const DB_PAGE_SIZE = 500;

interface CustomerIdRow {
  id: string;
  legacy_id: string | null;
}

interface VehicleRow {
  id: string;
  customer_id: string;
  brand: string | null;
  model: string | null;
  plate: string | null;
  is_primary: boolean | null;
}

async function fetchPage<T>(
  db: SupabaseClient,
  table: string,
  columns: string,
  from: number,
): Promise<T[]> {
  const result = await db.from(table).select(columns).range(from, from + DB_PAGE_SIZE - 1);
  if (result.error) throw new Error(`${table}: ${result.error.message}`);
  return (result.data ?? []) as T[];
}

async function selectAllRows<T>(
  db: SupabaseClient,
  table: string,
  columns: string,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += DB_PAGE_SIZE) {
    const page = await fetchPage<T>(db, table, columns, from);
    rows.push(...page);
    if (page.length < DB_PAGE_SIZE) return rows;
  }
}

/**
 * Combina o snapshot growth (com nome/telefone/plano derivados) com
 * o mapa slug/UUID → UUID (crm_customers) e a lista completa de vehicles
 * (crm_vehicles) para devolver os candidatos com veículos corretos.
 *
 * Função pura — testável sem Supabase. Toda a resolução de identidade
 * acontece aqui; a única fonte de verdade para o join é o UUID.
 */
export function buildDiagnosticCandidates(
  growthCustomers: readonly DgnCustomer[],
  dbCustomerRows: readonly CustomerIdRow[],
  dbVehicleRows: readonly VehicleRow[],
): DiagnosticCustomerCandidate[] {
  // slug OU UUID → UUID canônico. Inclui a identidade UUID→UUID pra cobrir
  // clientes sem legacy_id (DgnCustomer.id === crm_customers.id).
  const idToCanonical = new Map<string, string>();
  for (const c of dbCustomerRows) {
    if (!c.id) continue;
    idToCanonical.set(c.id, c.id);
    if (c.legacy_id && c.legacy_id !== c.id) {
      idToCanonical.set(c.legacy_id, c.id);
    }
  }

  const byCustomer = new Map<string, DiagnosticVehicleCandidate[]>();
  for (const v of dbVehicleRows) {
    if (!v.customer_id) continue;
    const arr = byCustomer.get(v.customer_id) ?? [];
    arr.push({
      id: v.id,
      brand: v.brand ?? "",
      model: v.model ?? "",
      plate: v.plate ?? "",
      isPrimary: v.is_primary === true,
    });
    byCustomer.set(v.customer_id, arr);
  }

  return growthCustomers.map((c) => {
    const canonical = idToCanonical.get(c.id) ?? null;
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      vehicles: canonical ? byCustomer.get(canonical) ?? [] : [],
      hasActiveSubscription: c.subscription?.isActive === true,
      activePlan: c.activePlan ?? null,
    };
  });
}

export async function loadDiagnosticCustomerCandidates(): Promise<DiagnosticCustomerCandidate[]> {
  const growth = await loadGrowthData({ logger: console });
  const supabase = getSupabaseAdminClient("crm.diagnostics-candidates");

  const [customerRows, vehicleRows] = await Promise.all([
    selectAllRows<CustomerIdRow>(supabase, "crm_customers", "id, legacy_id"),
    selectAllRows<VehicleRow>(
      supabase,
      "crm_vehicles",
      "id, customer_id, brand, model, plate, is_primary",
    ),
  ]);

  return buildDiagnosticCandidates(growth.customers, customerRows, vehicleRows);
}
