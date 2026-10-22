import { AGENT_ACTOR, type AgentContext } from "../agent-context.ts";
import type { SkillResult } from "../types.ts";
import type {
  AgentActionKind,
  CreateAgentActionResult,
} from "../../db/agent-actions-write.ts";

// -----------------------------------------------------------------------------
// Helper interno compartilhado por record_opportunity e record_alert.
//
// Fluxo:
//   1. Guard: writer injetado no AgentContext (contexts read_only não têm).
//   2. Sanity: cliente existe na base viva (ctx.customers via legacy_id).
//   3. Resolve: legacy_id → UUID canônico (writer.resolveCustomerId).
//   4. Writer.createAction({ actor: "dgn-agent" fixo, kind, source_tool, ... }).
//   5. Mapeia resultCode → SkillResult<RecordActionPayload>.
//
// Deduplicação: a RPC agent_action_create já aplica (kind, target_customer_id,
// dedupe_key) limitada a status in ('pending_review','approved'). Quando ela
// retorna NO_CHANGE, carregamos o existingActionId no payload para a UI/LLM
// explicarem que não houve criação.
//
// Zero mutação em crm_*. Zero envio. Status inicial sempre `pending_review`.
// -----------------------------------------------------------------------------

export interface RecordActionInput {
  /** legacy_id (slug) do cliente — vamos resolver para o UUID antes de gravar. */
  targetCustomerId: string;
  title: string;
  reason: string;
  recommendation: string;
  nextStep?: string | null;
  expectedBenefit?: string | null;
  /** Chave estável para dedupe por cliente — ex.: "renovacao_proxima_7d". */
  dedupeKey?: string | null;
  /** ISO date — ação expira sozinha se não revisada até lá. */
  expiresAt?: string | null;
  /** Metadata livre jsonb — validada antes de chegar aqui pelo zod da tool. */
  payload?: Record<string, unknown>;
  /** ID da execução do agente (para rastreabilidade). */
  sourceRunId?: string | null;
}

export interface RecordActionPayload {
  resultCode: CreateAgentActionResult["resultCode"];
  actionId: string | null;
  existingActionId: string | null;
  kind: AgentActionKind;
  /** UUID canônico (resolvido do legacy_id de entrada). */
  resolvedCustomerId: string;
  /** Snapshot — sempre `pending_review` para novas ações criadas. */
  status: "pending_review";
}

export async function recordAgentAction(
  ctx: AgentContext,
  input: RecordActionInput & { kind: AgentActionKind; sourceTool: string },
): Promise<SkillResult<RecordActionPayload>> {
  if (!ctx.writer) {
    return {
      status: "unavailable",
      message: "Writer não injetado no AgentContext — skill record_only indisponível neste contexto.",
      facts: [],
      inferences: [],
    };
  }

  const legacyId = (input.targetCustomerId ?? "").trim();
  if (!legacyId) {
    return {
      status: "insufficient_data",
      message: "targetCustomerId é obrigatório.",
      facts: [],
      inferences: [],
    };
  }

  const customer = ctx.customers.find((c) => c.id === legacyId);
  if (!customer) {
    return {
      status: "insufficient_data",
      message: `Cliente ${legacyId} não está na base viva — não é possível registrar ${input.kind}.`,
      facts: [],
      inferences: [],
    };
  }

  let resolvedCustomerId: string;
  try {
    resolvedCustomerId = await ctx.writer.resolveCustomerId(legacyId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha desconhecida";
    return {
      status: "unavailable",
      message: `Falha ao resolver UUID de ${legacyId}: ${message}`,
      facts: [],
      inferences: [],
    };
  }

  try {
    const result = await ctx.writer.createAction({
      kind: input.kind,
      title: input.title,
      reason: input.reason,
      recommendation: input.recommendation,
      sourceTool: input.sourceTool,
      actor: AGENT_ACTOR,
      targetCustomerId: resolvedCustomerId,
      nextStep: input.nextStep ?? null,
      expectedBenefit: input.expectedBenefit ?? null,
      payload: input.payload,
      dedupeKey: input.dedupeKey ?? null,
      expiresAt: input.expiresAt ?? null,
      sourceRunId: input.sourceRunId ?? null,
    });

    const payload: RecordActionPayload = {
      resultCode: result.resultCode,
      actionId: result.actionId,
      existingActionId: result.existingActionId,
      kind: input.kind,
      resolvedCustomerId,
      status: "pending_review",
    };

    const facts: string[] = [
      `Ação ${input.kind} registrada por ${AGENT_ACTOR} em ${input.sourceTool}.`,
      `Status inicial: pending_review (requer revisão humana antes de qualquer execução).`,
    ];
    if (input.dedupeKey) facts.push(`dedupe_key aplicada: ${input.dedupeKey}.`);

    const inferences: string[] = [];
    if (result.resultCode === "NO_CHANGE") {
      inferences.push(
        `Já existia ação ativa (${input.kind}) para este cliente com mesma dedupe_key — reaproveitada (existingActionId=${result.existingActionId}).`,
      );
    } else if (result.resultCode === "CREATED") {
      inferences.push(`Nova ação criada (actionId=${result.actionId}).`);
    }

    return { status: "ok", data: payload, facts, inferences };
  } catch (err) {
    const message = err instanceof Error ? err.message : "falha desconhecida";
    return {
      status: "unavailable",
      message: `Writer falhou ao registrar ${input.kind}: ${message}`,
      facts: [],
      inferences: [],
    };
  }
}
