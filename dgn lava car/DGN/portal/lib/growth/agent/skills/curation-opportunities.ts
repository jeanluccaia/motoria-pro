import { partitionByEligibility } from "../../founder-eligibility.ts";
import type { DgnCustomer } from "../../dgn-growth-data.ts";
import type { AgentContext } from "../agent-context.ts";
import type { AttentionCard, SkillResult } from "../types.ts";
import { sortByPriority } from "./founder-attention.ts";

// Curadoria de aquisição: elegíveis (via helper canônico) ordenados por score.
// Usar `partitionByEligibility` garante que assinantes conhecidos, Founders
// confirmados e descartados nunca aparecem — mesma regra da tela Curadoria.

const HIGH_SCORE_THRESHOLD = 70;
const MEDIUM_SCORE_THRESHOLD = 50;
/** Default do briefing/UI. Chamada pelo LLM pode subir até LIMIT_HARD_CAP. */
const DEFAULT_LIMIT = 8;
export const LIMIT_HARD_CAP = 20;

function scoreRank(customer: DgnCustomer): number {
  return Number.isFinite(customer.scoreDgn) ? customer.scoreDgn : 0;
}

function classify(customer: DgnCustomer): { priority: "alta" | "media" | "oportunidade"; reason: string } | null {
  const score = scoreRank(customer);
  const hasRecurrence = customer.washCount >= 6;

  if (score >= HIGH_SCORE_THRESHOLD) {
    return {
      priority: "alta",
      reason: `Score DGN ${score} + plano sugerido ${customer.recommendedPlan}.`,
    };
  }
  if (score >= MEDIUM_SCORE_THRESHOLD && hasRecurrence) {
    return {
      priority: "media",
      reason: `Score ${score} e ${customer.washCount} atendimentos históricos.`,
    };
  }
  if (customer.commercialStatus === "Aguardando Curadoria DGN" && hasRecurrence) {
    return {
      priority: "oportunidade",
      reason: `Aguardando curadoria com ${customer.washCount} atendimentos.`,
    };
  }
  return null;
}

export interface CurationOpportunitiesOptions {
  /** Máximo de cards a retornar. Default 8 (paginação da tela). LLM pode subir até LIMIT_HARD_CAP=20. */
  limit?: number;
}

export function getCurationOpportunities(
  ctx: AgentContext,
  options: CurationOpportunitiesOptions = {},
): SkillResult<AttentionCard[]> {
  const requested = typeof options.limit === "number" && Number.isFinite(options.limit)
    ? Math.max(1, Math.min(LIMIT_HARD_CAP, Math.floor(options.limit)))
    : DEFAULT_LIMIT;

  const { eligible } = partitionByEligibility(ctx.customers);

  const cards: AttentionCard[] = [];
  const ordered = [...eligible].sort((a, b) => scoreRank(b) - scoreRank(a));

  for (const customer of ordered) {
    const classified = classify(customer);
    if (!classified) continue;
    cards.push({
      id: `curation:${customer.id}`,
      priority: classified.priority,
      kind: "curation",
      title: customer.name,
      reason: classified.reason,
      nextAction: "Iniciar curadoria e resolver plano recomendado.",
      href: `/admin/growth/curadoria?customer=${encodeURIComponent(customer.id)}`,
      ctaLabel: "Ver cliente",
      customerId: customer.id,
    });
    if (cards.length >= requested) break;
  }

  cards.sort(sortByPriority);

  if (eligible.length === 0) {
    return {
      status: "insufficient_data",
      message: "Nenhum cliente elegível para curadoria de aquisição no momento.",
      facts: [`${ctx.customers.length} cliente(s) na base — nenhum elegível segundo isFounderAcquisitionEligible.`],
      inferences: [],
    };
  }

  return {
    status: "ok",
    data: cards,
    facts: [
      `${eligible.length} cliente(s) elegível(is) para aquisição Founder.`,
      `${cards.length} priorizado(s) por score/recorrência.`,
    ],
    inferences: cards.length > 0
      ? [`Ordenação por score DGN — plano recomendado varia por cliente.`]
      : [],
  };
}
