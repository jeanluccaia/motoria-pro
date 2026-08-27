import { KNOWN_SUBSCRIBERS_2026_08_16 } from "../../known-subscribers.ts";
import { matchKnownSubscriber } from "../../founder-eligibility.ts";
import type { AgentContext } from "../agent-context.ts";
import type { AttentionCard, SkillResult } from "../types.ts";
import { sortByPriority } from "./founder-attention.ts";

// Assinantes com sinais de atenção — hoje sabemos com segurança de dois
// cenários: renovação pendente (status na base 4uCar 2026-08-16) e assinatura
// detectada aguardando validação. Data de renovação exata NÃO está no schema
// atual, então nunca inventamos vencimento — devolvemos apenas o motivo
// declarado e enviamos para a fila de Assinantes Detectados.

export const LIMIT_HARD_CAP = 20;

export interface SubscriberAttentionOptions {
  limit?: number;
}

export function getSubscriberAttention(
  ctx: AgentContext,
  options: SubscriberAttentionOptions = {},
): SkillResult<AttentionCard[]> {
  const cards: AttentionCard[] = [];

  // 1) Cruzamento com a base real: assinantes com renewal pendente que ainda
  //    têm um cliente equivalente no snapshot do Growth.
  for (const subscriber of KNOWN_SUBSCRIBERS_2026_08_16) {
    if (subscriber.status !== "renovacao_pendente") continue;
    // Tenta achar cliente correspondente no snapshot para gerar deep-link.
    const match = ctx.customers.find((c) => matchKnownSubscriber(c)?.record.name === subscriber.name);
    cards.push({
      id: `subscriber-renewal:${subscriber.name}`,
      priority: "alta",
      kind: "subscriber",
      title: subscriber.name,
      reason: `Assinante ${subscriber.plan} com renovação pendente na base 4uCar.`,
      nextAction: "Resolver renovação antes de tratar como aquisição.",
      href: match
        ? `/admin/growth/assinantes-detectados`
        : `/admin/growth/assinantes-detectados`,
      ctaLabel: "Ver assinante",
      customerId: match?.id,
    });
  }

  // 2) Sinais no próprio snapshot: `commercialStatus === "Assinante Ativo"`
  //    presente na base do Growth mas sem correspondência com a lista viva —
  //    situação que merece revisão humana.
  for (const customer of ctx.customers) {
    if (customer.commercialStatus !== "Assinante Ativo") continue;
    const match = matchKnownSubscriber(customer);
    if (match) continue; // já contemplado acima ou já consolidado
    cards.push({
      id: `subscriber-review:${customer.id}`,
      priority: "media",
      kind: "subscriber",
      title: customer.name,
      reason: "Marcado como Assinante Ativo mas sem correspondência na base viva 4uCar.",
      nextAction: "Validar e migrar para a fila de Assinantes Detectados.",
      href: `/admin/growth/assinantes-detectados`,
      ctaLabel: "Ver assinante",
      customerId: customer.id,
    });
  }

  cards.sort(sortByPriority);

  const requested = typeof options.limit === "number" && Number.isFinite(options.limit)
    ? Math.max(1, Math.min(LIMIT_HARD_CAP, Math.floor(options.limit)))
    : LIMIT_HARD_CAP;
  if (cards.length > requested) cards.length = requested;

  if (cards.length === 0) {
    return {
      status: "insufficient_data",
      message: "Sem sinais de atenção para a carteira de assinantes agora.",
      facts: [
        `${KNOWN_SUBSCRIBERS_2026_08_16.length} assinante(s) na base viva.`,
        "Data de renovação individual não está no schema atual — nenhuma inferência de vencimento aplicada.",
      ],
      inferences: [],
    };
  }

  return {
    status: "ok",
    data: cards,
    facts: [
      `${cards.filter((c) => c.id.startsWith("subscriber-renewal:")).length} com renovação pendente.`,
      `${cards.filter((c) => c.id.startsWith("subscriber-review:")).length} sem correspondência na base viva.`,
    ],
    inferences: [
      "Vencimento individual não é inferido — schema atual não expõe data de renovação por assinante.",
    ],
  };
}
