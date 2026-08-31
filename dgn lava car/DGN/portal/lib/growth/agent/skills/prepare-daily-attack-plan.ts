import { isFounderAcquisitionEligible } from "../../founder-eligibility.ts";
import { customerProfileHref } from "../../customer-links.ts";
import type { AgentContext } from "../agent-context.ts";
import type {
  AttackPlanExecutionItem,
  AttackPlanPriority,
  PreparationObjective,
  PreparationTone,
  PreparedAttackPlan,
  PreparedMessage,
  SkillResult,
} from "../types.ts";
import {
  BATCH_PREPARATION_CAP,
} from "../types.ts";
import { getFounderAttention } from "./founder-attention.ts";
import { getCurationOpportunities } from "./curation-opportunities.ts";
import { getSubscriberAttention } from "./subscriber-attention.ts";
import { buildPreparedMessage, firstName, resolveCustomer, subscriberFacts } from "../preparation/context.ts";
import { renderDraftMessage } from "../preparation/templates.ts";

// O plano combina:
//  Prioridade 1: Receita em risco (assinantes com renovação pendente).
//  Prioridade 2: Founder quente (Founder attention).
//  Prioridade 3: Nova aquisição (Curadoria).
// A ordem de execução mistura urgência × esforço. Se prepareDrafts > 0, o
// plano prepara até `BATCH_PREPARATION_CAP` rascunhos inline. Nunca mais que
// isso: custo + qualidade + revisão humana viável.

export interface PrepareDailyAttackPlanOptions {
  /** Se >0, gera rascunhos inline para os N primeiros da ordem de execução. */
  prepareDrafts?: number;
  tone?: PreparationTone;
}

function greetingFor(now: Date): string {
  // Mesma lógica do daily-briefing: timezone SP fixo. No Vercel runtime é
  // UTC e 17:20 SP daria "Boa noite" indevidamente.
  let hour: number;
  try {
    const parts = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false,
    }).formatToParts(now);
    const hourPart = parts.find((p) => p.type === "hour")?.value ?? "0";
    hour = Number.parseInt(hourPart, 10);
    if (!Number.isFinite(hour)) hour = now.getHours();
  } catch {
    hour = now.getHours();
  }
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function headlineFor(total: number): string {
  if (total === 0) return "Nenhum alvo prioritário identificado agora.";
  if (total === 1) return "1 alvo prioritário hoje";
  return `${total} alvos prioritários hoje`;
}

export function prepareDailyAttackPlan(
  ctx: AgentContext,
  options: PrepareDailyAttackPlanOptions = {},
): SkillResult<PreparedAttackPlan> {
  const founder = getFounderAttention(ctx);
  const curation = getCurationOpportunities(ctx, { limit: 8 });
  const subscriber = getSubscriberAttention(ctx);

  const founderCards = founder.data ?? [];
  const curationCards = curation.data ?? [];
  const subscriberCards = subscriber.data ?? [];

  const priorities: AttackPlanPriority[] = [];

  if (subscriberCards.length > 0) {
    priorities.push({
      label: "Prioridade 1 — Receita em risco",
      description: `${subscriberCards.length} assinante(s) precisam de atenção.`,
      cards: subscriberCards.slice(0, 5),
    });
  }
  if (founderCards.length > 0) {
    priorities.push({
      label: "Prioridade 2 — Founder quente",
      description: `${founderCards.length} convite(s) Founder aguardando avanço.`,
      cards: founderCards.slice(0, 5),
    });
  }
  if (curationCards.length > 0) {
    priorities.push({
      label: "Prioridade 3 — Nova aquisição",
      description: `${curationCards.length} candidato(s) da Curadoria.`,
      cards: curationCards.slice(0, 5),
    });
  }

  // Ordem de execução: urgência primeiro (renovação), depois Founder, depois curadoria.
  const executionOrder: AttackPlanExecutionItem[] = [];
  const pushItem = (item: AttackPlanExecutionItem) => {
    if (executionOrder.find((e) => e.name === item.name && e.customerId === item.customerId)) return;
    executionOrder.push(item);
  };

  for (const card of subscriberCards) {
    pushItem({
      name: card.title,
      customerId: card.customerId,
      reason: card.reason,
      suggestedPreparation: "renewal",
      href: card.href,
    });
  }
  for (const card of founderCards) {
    pushItem({
      name: card.title,
      customerId: card.customerId,
      reason: card.reason,
      suggestedPreparation: "followup",
      href: card.href,
    });
  }
  for (const card of curationCards) {
    pushItem({
      name: card.title,
      customerId: card.customerId,
      reason: card.reason,
      suggestedPreparation: "founder_acquisition",
      href: card.href,
    });
  }

  const totalHits = subscriberCards.length + founderCards.length + curationCards.length;
  const plan: PreparedAttackPlan = {
    greeting: greetingFor(new Date(ctx.loadedAt)),
    headline: headlineFor(totalHits),
    priorities,
    executionOrder: executionOrder.slice(0, 10),
    preparedDrafts: [],
    disclaimer: "Preparado pela IA · revisar antes de enviar",
  };

  const requestedDrafts = typeof options.prepareDrafts === "number" && Number.isFinite(options.prepareDrafts)
    ? Math.max(0, Math.floor(options.prepareDrafts))
    : 0;

  if (requestedDrafts > 0) {
    const capped = Math.min(requestedDrafts, BATCH_PREPARATION_CAP);
    if (capped < requestedDrafts) {
      plan.preparedNotice = `Limitado a ${BATCH_PREPARATION_CAP} rascunhos por preparação em lote (revisão humana).`;
    }
    const tone = options.tone ?? "padrao";
    const drafts: PreparedMessage[] = [];
    for (const item of plan.executionOrder) {
      if (drafts.length >= capped) break;
      if (!item.customerId || !item.suggestedPreparation) continue;
      const customer = resolveCustomer(ctx, item.customerId);
      if (!customer) continue;
      const draft = tryDraftFor(ctx, customer, item.suggestedPreparation, tone);
      if (draft) drafts.push(draft);
    }
    plan.preparedDrafts = drafts;
    if (drafts.length === 0 && !plan.preparedNotice) {
      plan.preparedNotice = "Nenhum cliente da ordem de execução tinha dados suficientes para preparar rascunho automático.";
    }
  }

  if (totalHits === 0) {
    return {
      status: "insufficient_data",
      message: "Sem alvos prioritários agora. Nada para preparar.",
      facts: [],
      inferences: [],
    };
  }

  return {
    status: "ok",
    data: plan,
    facts: [
      `${subscriberCards.length} assinante(s) em atenção.`,
      `${founderCards.length} Founder(s) em atenção.`,
      `${curationCards.length} candidato(s) na Curadoria.`,
    ],
    inferences: plan.preparedDrafts.length > 0
      ? [`${plan.preparedDrafts.length} rascunho(s) preparado(s) inline (cap ${BATCH_PREPARATION_CAP}).`]
      : [],
  };
}

function tryDraftFor(
  ctx: AgentContext,
  customer: NonNullable<ReturnType<typeof resolveCustomer>>,
  objective: PreparationObjective,
  tone: PreparationTone,
): PreparedMessage | null {
  // Reproduz as mesmas guardas das skills individuais.
  const subscriber = subscriberFacts(customer);

  if (objective === "founder_acquisition") {
    if (!isFounderAcquisitionEligible(customer).eligible) return null;
  }
  if (objective === "renewal") {
    if (!subscriber && customer.commercialStatus !== "Assinante Ativo") return null;
    if (subscriber && subscriber.status !== "renovacao_pendente") return null;
  }
  if (objective === "founder_followup" && customer.campaign?.founderStatus !== "confirmado") return null;

  const draftMessage = renderDraftMessage({
    objective,
    tone,
    firstName: firstName(customer.name),
    vehicle: customer.vehicle,
    plan: subscriber?.plan,
  });

  return buildPreparedMessage({
    customer,
    objective,
    tone,
    draftMessage,
    extraFacts: subscriber ? [`Assinatura: ${subscriber.plan} (${subscriber.status}).`] : [],
  });
}

/** Reexporta usando `ctx.loadedAt` — o timezone real vem do server (America/Sao_Paulo). */
export { customerProfileHref };
