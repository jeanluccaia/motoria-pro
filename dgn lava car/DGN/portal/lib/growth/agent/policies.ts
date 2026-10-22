// Approval policy do Agent Core — Etapa 1 Fundação (2026-10-22).
//
// Decisão homologada pelo Jean em 22/10:
//   "Sem auto-approve. Status inicial sempre 'pending_review'."
//
// Essa policy fica aqui (TS) e não no banco porque é regra de produto —
// pode mudar sem migration quando (se) Jean liberar auto-approve para kinds
// de baixo risco (ex.: alert). As RPCs em `20261022010000_agent_core_rpcs.sql`
// são neutras: aceitam criar com status 'pending_review' sempre.

import type { AgentActionKind } from "../db/agent-actions-write.ts";

export interface ActionPolicy {
  /** Toda ação do agente passa por revisão humana nesta etapa. */
  requiresApproval: true;
  /** Nenhum kind autoriza auto-approve nesta etapa. */
  allowAutoApprove: false;
  /** Documento curto de por que essa policy existe (não exibido). */
  rationale: string;
}

export const AGENT_ACTION_POLICIES: Record<AgentActionKind, ActionPolicy> = {
  opportunity: {
    requiresApproval: true,
    allowAutoApprove: false,
    rationale: "Oportunidade comercial impacta cliente real; humano decide se vira ação.",
  },
  alert: {
    requiresApproval: true,
    allowAutoApprove: false,
    rationale: "Alertas podem evoluir para auto-approve no futuro; nesta etapa, humano confirma.",
  },
  followup_task: {
    requiresApproval: true,
    allowAutoApprove: false,
    rationale: "Follow-up envolve contato; humano aprova antes de a ação virar execução.",
  },
  campaign_draft: {
    requiresApproval: true,
    allowAutoApprove: false,
    rationale: "Vínculo com rascunho de campanha — a aprovação segue o fluxo da campanha.",
  },
};

export function policyFor(kind: AgentActionKind): ActionPolicy {
  return AGENT_ACTION_POLICIES[kind];
}

/**
 * Hoje sempre retorna false (nenhum kind pode auto-approve nesta etapa).
 * Função existe para pontos de chamada já se ancorarem na policy quando
 * eventualmente permitirmos auto-approve de kinds específicos.
 */
export function canAutoApprove(_kind: AgentActionKind): boolean {
  return false;
}

/**
 * Guard: lança se o kind não tem policy declarada (defesa contra enum
 * novo introduzido no banco sem atualizar o TS).
 */
export function assertKindHasPolicy(kind: AgentActionKind): void {
  if (!AGENT_ACTION_POLICIES[kind]) {
    throw new Error(`Agent action kind "${kind}" sem policy declarada. Atualize AGENT_ACTION_POLICIES.`);
  }
}

/**
 * Documenta a aprovação de uma campanha. Mesma lógica: humano sempre
 * aprova nesta etapa.
 */
export const AGENT_CAMPAIGN_REQUIRES_HUMAN_APPROVAL = true as const;
