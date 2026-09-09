import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

// -----------------------------------------------------------------------------
// Resolve o identificador do cliente vindo da URL do Profile 360 (ex.:
// "gustavo-plensack") para o crm_customers.id UUID canônico. Aceita:
//   - legacy_id / slug (base PagBank + JSON legado)
//   - UUID puro (crm_customers.id)
//
// Mesma lógica que portal-access-write.ts já usa no provisionamento (aquele
// caminho estava correto desde o dia 1). Extraída pra cá pra que os endpoints
// admin do Batch 2 (appointments, vehicle-photo, profile-editor, vehicles)
// deixem de mandar slug direto pro Postgres — que respondia
// "invalid input syntax for type uuid: \"gustavo-plensack\"".
// -----------------------------------------------------------------------------

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CustomerResolutionError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function resolveCustomerId(db: SupabaseClient, input: string): Promise<string> {
  if (!input || typeof input !== "string" || input.length > 200) {
    throw new CustomerResolutionError("Cliente inválido.", 400);
  }

  const table = db.from("crm_customers");

  const byLegacy = await table.select("id").eq("legacy_id", input).maybeSingle();
  if (byLegacy.error && byLegacy.error.code !== "PGRST116") {
    throw new CustomerResolutionError(`Falha ao consultar cliente: ${byLegacy.error.message}`, 502);
  }
  if (byLegacy.data) return (byLegacy.data as { id: string }).id;

  if (!UUID_REGEX.test(input)) {
    throw new CustomerResolutionError("Cliente não encontrado.", 404);
  }

  const byId = await table.select("id").eq("id", input).maybeSingle();
  if (byId.error && byId.error.code !== "PGRST116") {
    throw new CustomerResolutionError(`Falha ao consultar cliente: ${byId.error.message}`, 502);
  }
  if (!byId.data) throw new CustomerResolutionError("Cliente não encontrado.", 404);
  return (byId.data as { id: string }).id;
}
