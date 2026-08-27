import type { DgnCustomer } from "../../dgn-growth-data.ts";
import type { AgentContext } from "../agent-context.ts";
import type { AttentionCard, Priority, SkillResult } from "../types.ts";

// Regras determinísticas para identificar convites Founder que precisam de
// atenção. Nenhuma inferência inventada: cada bucket é apoiado por campos
// concretos em `customer.campaign`. Convites parados/velhos comparam contra
// `context.loadedAt`, não `Date.now()`, para o resultado ser reprodutível.

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_INVITE_DAYS = 3;

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

  // 2. Visualizou e não avançou — prioridade alta se >24h, média se recente.
  if (viewedAt && !respondedAt && !conversationStartedAt && !paymentSentAt) {
    const hoursSince = (now - viewedAt) / (60 * 60 * 1000);
    if (hoursSince >= 24) {
      return {
        priority: "alta",
        reason: "Visualizou o convite e não avançou há mais de 24h.",
        nextAction: "Follow-up pessoal explicando o benefício Founder.",
      };
    }
    return {
      priority: "media",
      reason: "Visualizou o convite recentemente e ainda não respondeu.",
      nextAction: "Aguardar retorno até completar 24h; preparar follow-up.",
    };
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

export function getFounderAttention(ctx: AgentContext): SkillResult<AttentionCard[]> {
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
      href: `/admin/growth/founders-2026?customer=${encodeURIComponent(customer.id)}`,
      ctaLabel: "Ver Founder",
      customerId: customer.id,
    });
  }

  cards.sort(sortByPriority);

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
