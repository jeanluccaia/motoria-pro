import "server-only";

import { loadGrowthData, type GrowthDataResult } from "../db/growth-reader.ts";
import { enrichKnownSubscribers } from "../db/enrich-known-subscriber.ts";
import type { DgnCustomer } from "../dgn-growth-data.ts";
import {
  createAgentAction,
  type CreateAgentActionInput,
  type CreateAgentActionResult,
} from "../db/agent-actions-write.ts";
import {
  upsertAgentCampaignDraft,
  type UpsertAgentCampaignInput,
  type UpsertAgentCampaignResult,
} from "../db/agent-campaigns-write.ts";
import { getSupabaseAdminClient } from "../db/admin-client.ts";
import { resolveCustomerId } from "../db/customer-resolver.ts";

// AgentContext é o único ponto de entrada dos dados para as skills. Ele carrega
// via `loadGrowthData()` — mesma função já usada por Dashboard/Curadoria — e
// devolve os customers + origem. Rodar uma skill sem contexto injetado é
// bloqueado no registry, o que impede que qualquer código pegue Supabase direto.

/**
 * Identidade canônica das recomendações criadas pelo agente.
 *
 * As skills `record_only` SEMPRE fixam esse valor como `p_actor` nas RPCs do
 * Agent Core. O operador humano só aparece como `actor` em RPCs de aprovação/
 * rejeição/execução, chamadas por endpoints autenticados (fora do agente).
 */
export const AGENT_ACTOR = "dgn-agent" as const;

/**
 * Facade de escrita injetada no AgentContext — permite:
 *  - Produção: usar os writers reais (agent-actions-write / agent-campaigns-write),
 *    que chamam as RPCs SECURITY DEFINER com service_role.
 *  - Testes: injetar stub determinístico e validar inputs/erros sem Supabase.
 *
 * SECURITY CONTRACT: as implementações reais só funcionam em server contexts
 * (admin-client exige NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 * Nunca exponha diretamente num endpoint público — qualquer rota que acabe
 * aqui precisa validar operador autenticado antes de chamar.
 */
export interface AgentWriter {
  /**
   * Resolve legacy_id (slug) OU UUID para o UUID canônico de crm_customers.id.
   * Writer precisa disso porque a AgentContext viaja `legacy_id`, mas
   * `agent_actions.target_customer_id` tem FK para crm_customers.id (UUID).
   */
  resolveCustomerId(input: string): Promise<string>;
  createAction(input: CreateAgentActionInput): Promise<CreateAgentActionResult>;
  upsertCampaignDraft(input: UpsertAgentCampaignInput): Promise<UpsertAgentCampaignResult>;
}

/** Writer "de produção" — delega direto às funções do pacote db/. */
export function buildDefaultAgentWriter(): AgentWriter {
  return {
    resolveCustomerId: (input) =>
      resolveCustomerId(getSupabaseAdminClient("agent_writer.resolve_customer"), input),
    createAction: (input) => createAgentAction(input),
    upsertCampaignDraft: (input) => upsertAgentCampaignDraft(input),
  };
}

export interface AgentContext {
  customers: DgnCustomer[];
  origin: GrowthDataResult["origin"];
  /** Timestamp da leitura (ms epoch) — usado para "há X dias". */
  loadedAt: number;
  /**
   * Writer para skills `record_only`. Opcional — contexts puramente read_only
   * ou prepare_only (ex.: fixtures de teste read_only) omitem. Skills record_only
   * tratam a ausência retornando status="unavailable" com mensagem explicativa.
   */
  writer?: AgentWriter;
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
    writer: buildDefaultAgentWriter(),
  };
}
