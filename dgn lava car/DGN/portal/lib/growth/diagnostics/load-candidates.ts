import "server-only";

import { getSupabaseAdminClient } from "@/lib/growth/db/admin-client";
import { loadGrowthData } from "@/lib/growth/db/growth-reader";
import type { DiagnosticCustomerCandidate } from "./customer-search";

// ---------------------------------------------------------------------------
// Server-side loader dos candidatos do fluxo "Novo diagnóstico".
//
// Combina 2 fontes:
//   * loadGrowthData → nome, telefone, plano ativo, primeiro veículo. Já cobre
//     a mesma sanitização usada no Assistente / Assinantes.
//   * crm_vehicles direto → lista COMPLETA por customer (o snapshot só traz
//     o primário). Necessário porque o fluxo exige seleção explícita quando
//     há >1 veículo.
//
// Nada novo em PII cruza pro bundle client: os campos são os mesmos que já
// atravessam nos outros fluxos admin. Fixture de branch não entra aqui.
// ---------------------------------------------------------------------------

export async function loadDiagnosticCustomerCandidates(): Promise<DiagnosticCustomerCandidate[]> {
  const growth = await loadGrowthData({ logger: console });
  const supabase = getSupabaseAdminClient("crm.diagnostics-candidates");

  const { data: vehicles, error } = await supabase
    .from("crm_vehicles")
    .select("id, customer_id, brand, model, plate, is_primary");
  if (error) throw new Error(`Falha ao ler crm_vehicles: ${error.message}`);

  const byCustomer = new Map<string, DiagnosticCustomerCandidate["vehicles"]>();
  for (const raw of vehicles ?? []) {
    const v = raw as {
      id: string; customer_id: string; brand: string | null; model: string | null;
      plate: string | null; is_primary: boolean | null;
    };
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

  return growth.customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    vehicles: byCustomer.get(c.id) ?? [],
    hasActiveSubscription: c.subscription?.isActive === true,
    activePlan: c.activePlan ?? null,
  }));
}
