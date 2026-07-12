/**
 * Services — orquestram transições transacionais entre repositories,
 * garantindo que toda alteração relevante gere audit_log + interação.
 *
 * Regra dura:
 *  - subscription só vai para 'ativo' via humano com motivo (>=8 chars)
 *  - founder_status='confirmado' exige action humana + registro em audit
 *  - transições de commercial_stage validadas pelo grafo em validators.ts
 */

/** SERVER-ONLY — importar deste módulo em qualquer bundle client vaza a service_role key. */
import { recordAudit } from "./audit";
import {
  campaignMembersRepo,
  interactionsRepo,
  scoreSnapshotsRepo,
  subscriptionsRepo,
} from "./repositories";
import type {
  UpdateStageInput,
  ValidateSubscriptionInput,
} from "./validators";
import { isValidStageTransition } from "./validators";
import { computeDgnScore, type ScoreInput } from "./score-engine";

// ---------------------------------------------------------------------------
// Pipeline comercial
// ---------------------------------------------------------------------------

export async function transitionCommercialStage(input: UpdateStageInput): Promise<void> {
  if (!isValidStageTransition(input.from, input.to)) {
    throw new Error(`transição inválida: ${input.from} → ${input.to}`);
  }

  const member = await campaignMembersRepo.findById(input.campaignMemberId);
  if (!member) throw new Error(`campaign_member ${input.campaignMemberId} não encontrado`);
  if (member.commercial_stage !== input.from) {
    throw new Error(
      `estado do banco (${member.commercial_stage}) difere do estado esperado (${input.from}) — recarregue o cliente`,
    );
  }

  await campaignMembersRepo.updateStage(input.campaignMemberId, input.to);

  await interactionsRepo.append({
    customerId: member.customer_id,
    campaignId: member.campaign_id,
    interactionType: "status_alterado",
    channel: "portal",
    description: `${input.from} → ${input.to}`,
    metadata: { from: input.from, to: input.to, reason: input.reason ?? null },
    actor: input.ownerActor,
  });

  await recordAudit({
    entityType: "campaign_member",
    entityId: input.campaignMemberId,
    action: "campaign_member.stage_changed",
    previousValue: { commercial_stage: input.from },
    newValue: { commercial_stage: input.to },
    actor: input.ownerActor,
    reason: input.reason,
  });
}

// ---------------------------------------------------------------------------
// Validação humana de assinatura
// ---------------------------------------------------------------------------

export async function validateSubscription(input: ValidateSubscriptionInput): Promise<void> {
  const current = await subscriptionsRepo.findById(input.subscriptionId);
  if (!current) throw new Error(`subscription ${input.subscriptionId} não encontrada`);

  await subscriptionsRepo.validate(input.subscriptionId, {
    newStatus: input.newStatus,
    validatedBy: input.ownerActor,
  });

  await interactionsRepo.append({
    customerId: current.customer_id,
    interactionType: input.newStatus === "ativo" ? "assinatura_validada" : "assinatura_detectada",
    channel: "portal",
    description: `assinatura ${current.subscription_status} → ${input.newStatus}`,
    metadata: {
      previous_status: current.subscription_status,
      new_status: input.newStatus,
      plan: current.subscription_plan,
      cycle: current.subscription_cycle,
      reason: input.reason,
    },
    actor: input.ownerActor,
  });

  await recordAudit({
    entityType: "subscription",
    entityId: input.subscriptionId,
    action: "subscription.status_changed",
    previousValue: {
      subscription_status: current.subscription_status,
      is_active_subscriber: current.is_active_subscriber,
    },
    newValue: {
      subscription_status: input.newStatus,
      is_active_subscriber: input.newStatus === "ativo",
    },
    actor: input.ownerActor,
    reason: input.reason,
  });
}

// ---------------------------------------------------------------------------
// Score recomputado + snapshot
// ---------------------------------------------------------------------------

export async function recomputeAndSnapshotScore(customerId: string, input: ScoreInput, actor: string): Promise<{ totalScore: number }> {
  const breakdown = computeDgnScore(input);
  await scoreSnapshotsRepo.saveSnapshot({
    customer_id: customerId,
    score_version: breakdown.scoreVersion,
    total_score: breakdown.totalScore,
    components: breakdown.components,
    penalties: breakdown.penalties,
    explanation: breakdown.explanation,
  });
  await interactionsRepo.append({
    customerId,
    interactionType: "curadoria",
    channel: "score-engine",
    description: `score recalculado: ${breakdown.totalScore} (${breakdown.tier})`,
    metadata: { breakdown, actor },
    actor,
  });
  return { totalScore: breakdown.totalScore };
}
