import type { DgnCustomer } from "../../dgn-growth-data.ts";
import type { AgentContext } from "../agent-context.ts";
import type { AttentionCard, Priority, SkillResult } from "../types.ts";
import { customerProfileHref } from "../../customer-links.ts";

// Regras determinísticas para identificar convites Founder que precisam de
// atenção. Nenhuma inferência inventada: cada bucket é apoiado por campos
// concretos em `customer.campaign`. Convites parados/velhos comparam contra
// `context.loadedAt`, não `Date.now()`, para o resultado ser reprodutível.

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_INVITE_DAYS = 3;
export const LIMIT_HARD_CAP = 20;

function parseTimestamp(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const ts = Date.parse(raw);
  return Number.isFinite(ts) ? ts : null;
}

function hasActiveInvite(customer: DgnCustomer): boolean {
  return Boolean(customer.campaign?.personalizedPagePath);
}

function isConverted(customer: DgnCustomer): boolean {
  const stage = customer.campaign?.commercialStage;
  return stage === "convertido" || customer.commercialStatus === "Assinante Ativo";
}

function bucketFor(customer: DgnCustomer, now: number): {
  priority: Priority;
  reason: string;
  nextAction: string;
} | null {
  const eng = customer.campaign?.engagement;
  const dates = customer.campaign?.dates ?? {};
  const confirmClickedAt = parseTimestamp(eng?.confirmClickedAt);
  const viewedAt = parseTimestamp(eng?.viewedAt ?? dates.viewedAt);
  const respondedAt = parseTimestamp(dates.respondedAt);
  const conversationStartedAt = parseTimestamp(dates.conversationStartedAt);
  const paymentSentAt = parseTimestamp(dates.paymentSentAt);
  const inviteCreatedAt = parseTimestamp(dates.inviteCreatedAt);

  // 1. Click WhatsApp confirmado, sem resposta e sem pagamento — prioridade alta.
  if (confirmClickedAt && !respondedAt && !conversationStartedAt && !paymentSentAt) {
    return {
      priority: "alta",
      reason: "Clicou em confirmar via WhatsApp e ainda não iniciou conversa.",
      nextAction: "Chamar direto no WhatsApp — cliente demonstrou intenção clara.",
    };
  }

  // 2. Visualizou e não avançou — prioridade alta se >24h. Se a única ação
  //    ainda é "aguardar retorno até completar 24h" o card NÃO entra na fila
  //    ativa ("quem contatar hoje"): quem só pode aguardar não é contato ativo.
  if (viewedAt && !respondedAt && !conversationStartedAt && !paymentSentAt) {
    const hoursSince = (now - viewedAt) / (60 * 60 * 1000);
    if (hoursSince >= 24) {
      return {
        priority: "alta",
        reason: "Visualizou o convite e não avançou há mais de 24h.",
        nextAction: "Follow-up pessoal explicando o benefício Founder.",
      };
    }
    // <24h da visualização — só resta aguardar. Não gera card (M-13).
    return null;
  }

  // 3. Convite parado — criado há dias e nunca visualizado.
  if (inviteCreatedAt && !viewedAt) {
    const daysSince = (now - inviteCreatedAt) / DAY_MS;
    if (daysSince >= STALE_INVITE_DAYS) {
      return {
        priority: "media",
        reason: `Convite criado há ${Math.floor(daysSince)} dias e ainda não foi visualizado.`,
        nextAction: "Reforçar o envio pelo canal correto (WhatsApp com preview).",
      };
    }
  }

  return null;
}

export interface FounderAttentionOptions {
  /** Cap opcional do LLM. Default: sem cap dentro do hard cap 20. */
  limit?: number;
}

export function getFounderAttention(
  ctx: AgentContext,
  options: FounderAttentionOptions = {},
): SkillResult<AttentionCard[]> {
  const now = ctx.loadedAt;
  const cards: AttentionCard[] = [];
  let candidatesWithActiveInvite = 0;

  for (const customer of ctx.customers) {
    if (!hasActiveInvite(customer)) continue;
    if (isConverted(customer)) continue;
    candidatesWithActiveInvite += 1;
    const bucket = bucketFor(customer, now);
    if (!bucket) continue;
    cards.push({
      id: `founder:${customer.id}`,
      priority: bucket.priority,
      kind: "founder",
      title: customer.name,
      reason: bucket.reason,
      nextAction: bucket.nextAction,
      href: customerProfileHref(customer.id),
      ctaLabel: "Ver cliente",
      customerId: customer.id,
    });
  }

  cards.sort(sortByPriority);

  const requested = typeof options.limit === "number" && Number.isFinite(options.limit)
    ? Math.max(1, Math.min(LIMIT_HARD_CAP, Math.floor(options.limit)))
    : LIMIT_HARD_CAP;
  if (cards.length > requested) cards.length = requested;

  if (candidatesWithActiveInvite === 0) {
    return {
      status: "insufficient_data",
      message: "Nenhum convite Founder ativo na base atual.",
      facts: [],
      inferences: [],
    };
  }

  return {
    status: "ok",
    data: cards,
    facts: [
      `${candidatesWithActiveInvite} convite(s) Founder ativo(s) na base.`,
      `${cards.length} necessita(m) atenção segundo as regras (visualizado sem avanço, click WhatsApp, convite parado).`,
    ],
    inferences: cards.length > 0
      ? [`${cards.filter((c) => c.priority === "alta").length} com prioridade alta.`]
      : [],
  };
}

export function sortByPriority(a: AttentionCard, b: AttentionCard): number {
  const rank: Record<Priority, number> = { critica: 0, alta: 1, media: 2, oportunidade: 3 };
  return rank[a.priority] - rank[b.priority];
}
