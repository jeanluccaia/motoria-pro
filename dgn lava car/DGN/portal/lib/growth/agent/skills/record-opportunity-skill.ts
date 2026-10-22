import type { AgentContext } from "../agent-context.ts";
import type { SkillResult } from "../types.ts";
import { recordAgentAction, type RecordActionInput, type RecordActionPayload } from "./record-action.ts";

// Skill RECORD-ONLY — grava oportunidade comercial detectada pelo agente em
// agent_actions.kind = 'opportunity', status = 'pending_review'. Nenhum envio,
// nenhuma mutação em crm_*. A promoção para `approved`/`executed` passa por
// endpoint autenticado em etapa separada da fundação.

export const RECORD_OPPORTUNITY_SOURCE_TOOL = "record_opportunity" as const;

export async function recordOpportunity(
  ctx: AgentContext,
  input: RecordActionInput,
): Promise<SkillResult<RecordActionPayload>> {
  return recordAgentAction(ctx, {
    ...input,
    kind: "opportunity",
    sourceTool: RECORD_OPPORTUNITY_SOURCE_TOOL,
  });
}
