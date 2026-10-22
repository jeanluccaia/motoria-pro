import { AGENT_ACTOR, type AgentContext } from "../agent-context.ts";
import type { SkillResult } from "../types.ts";
import type { UpsertCampaignResultCode } from "../../db/agent-campaigns-write.ts";

// Skill RECORD-ONLY — grava rascunho de campanha em agent_campaigns,
// status='draft'. Zero envio, zero ativação. A promoção draft → approved é
// RPC separada (agent_campaign_approve) e requer operador autenticado.
//
// Upsert conservador: se p_campaign_id null → cria; se não null e status='draft'
// → atualiza; qualquer outro status terminal (approved/paused/archived) é
// imutável por esta skill e devolve INVALID_STATE_TRANSITION.

export const RECORD_CAMPAIGN_DRAFT_SOURCE_TOOL = "record_campaign_draft" as const;

export interface RecordCampaignDraftInput {
  /** Opcional — presente só quando o agente está refinando um draft já existente. */
  campaignId?: string | null;
  name: string;
  objective: string;
  draftMessage?: string | null;
  suggestedChannel?: string | null;
  estimatedAudience?: number | null;
  /** Regras de audiência em jsonb livre — validadas pela tool antes de chegar aqui. */
  audienceRules?: Record<string, unknown>;
}

export interface RecordCampaignDraftPayload {
  resultCode: UpsertCampaignResultCode;
  campaignId: string | null;
  /** Snapshot — campanha permanece em `draft` até aprovação humana. */
  status: "draft";
}

export async function recordCampaignDraft(
  ctx: AgentContext,
  input: RecordCampaignDraftInput,
): Promise<SkillResult<RecordCampaignDraftPayload>> {
  if (!ctx.writer) {
    return {
      status: "unavailable",
      message: "Writer não injetado no AgentContext — skill record_only indisponível neste contexto.",
      facts: [],
      inferences: [],
    };
  }

  const name = (input.name ?? "").trim();
  const objective = (input.objective ?? "").trim();
  if (!name) {
    return { status: "insufficient_data", message: "name é obrigatório.", facts: [], inferences: [] };
  }
  if (!objective) {
    return { status: "insufficient_data", message: "objective é obrigatório.", facts: [], inferences: [] };
  }

  try {
    const result = await ctx.writer.upsertCampaignDraft({
      campaignId: input.campaignId ?? null,
      name,
      objective,
      audienceRules: input.audienceRules ?? {},
      estimatedAudience: input.estimatedAudience ?? null,
      draftMessage: input.draftMessage ?? null,
      suggestedChannel: input.suggestedChannel ?? null,
      sourceTool: RECORD_CAMPAIGN_DRAFT_SOURCE_TOOL,
      actor: AGENT_ACTOR,
    });

    const payload: RecordCampaignDraftPayload = {
      resultCode: result.resultCode,
      campaignId: result.campaignId,
      status: "draft",
    };

    const facts: string[] = [
      `Rascunho de campanha registrado por ${AGENT_ACTOR} em ${RECORD_CAMPAIGN_DRAFT_SOURCE_TOOL}.`,
      `Status: draft (requer aprovação humana antes de qualquer execução).`,
    ];
    const inferences: string[] = [];

    switch (result.resultCode) {
      case "CREATED":
        inferences.push(`Nova campanha criada em draft (campaignId=${result.campaignId}).`);
        break;
      case "UPDATED":
        inferences.push(`Draft existente atualizado (campaignId=${result.campaignId}).`);
        break;
      case "NO_CHANGE":
        inferences.push(`Draft idêntico ao estado atual — nada atualizado (campaignId=${result.campaignId}).`);
        break;
      case "NOT_FOUND":
        return {
          status: "insufficient_data",
          data: payload,
          message: `campaignId informado não existe.`,
          facts,
          inferences,
        };
      case "INVALID_STATE_TRANSITION":
        return {
          status: "unavailable",
          data: payload,
          message:
            "Campanha não está em draft (provavelmente approved/paused/archived). " +
            "Rascunhos só podem ser editados enquanto status='draft'.",
          facts,
          inferences,
        };
    }

    return { status: "ok", data: payload, facts, inferences };
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha desconhecida";
    return {
      status: "unavailable",
      message: `Writer falhou ao registrar campaign_draft: ${message}`,
      facts: [],
      inferences: [],
    };
  }
}
