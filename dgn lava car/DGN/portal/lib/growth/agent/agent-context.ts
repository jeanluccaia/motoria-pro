import "server-only";

import { loadGrowthData, type GrowthDataResult } from "../db/growth-reader.ts";
import { enrichKnownSubscribers } from "../db/enrich-known-subscriber.ts";
import type { DgnCustomer } from "../dgn-growth-data.ts";

// AgentContext é o único ponto de entrada dos dados para as skills. Ele carrega
// via `loadGrowthData()` — mesma função já usada por Dashboard/Curadoria — e
// devolve os customers + origem. Rodar uma skill sem contexto injetado é
// bloqueado no registry, o que impede que qualquer código pegue Supabase direto.

export interface AgentContext {
  customers: DgnCustomer[];
  origin: GrowthDataResult["origin"];
  /** Timestamp da leitura (ms epoch) — usado para "há X dias". */
  loadedAt: number;
}

export async function buildAgentContext(): Promise<AgentContext> {
  const data = await loadGrowthData({ logger: console });
  // Enriquecemos aqui também para que skills/tools do agent leiam
  // knownSubscriberPlan/Status sem precisar chamar matchKnownSubscriber
  // (que agora vive só server e é para o pipeline de payload público).
  return {
    customers: enrichKnownSubscribers(data.customers),
    origin: data.origin,
    loadedAt: Date.now(),
  };
}
