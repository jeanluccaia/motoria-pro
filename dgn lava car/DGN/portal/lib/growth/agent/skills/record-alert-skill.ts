import type { AgentContext } from "../agent-context.ts";
import type { SkillResult } from "../types.ts";
import { recordAgentAction, type RecordActionInput, type RecordActionPayload } from "./record-action.ts";

// Skill RECORD-ONLY — grava alerta operacional detectado pelo agente em
// agent_actions.kind = 'alert', status = 'pending_review'. Nenhum envio,
// nenhuma mutação em crm_*. Mesmo contrato de aprovação humana da opportunity.

export const RECORD_ALERT_SOURCE_TOOL = "record_alert" as const;

export async function recordAlert(
  ctx: AgentContext,
  input: RecordActionInput,
): Promise<SkillResult<RecordActionPayload>> {
  return recordAgentAction(ctx, {
    ...input,
    kind: "alert",
    sourceTool: RECORD_ALERT_SOURCE_TOOL,
  });
}
