import type { AgentContext } from "../agent-context.ts";
import type { AttentionCard, DailyBriefing, SkillResult } from "../types.ts";
import { getCurationOpportunities } from "./curation-opportunities.ts";
import { getFounderAttention, sortByPriority } from "./founder-attention.ts";
import { getSubscriberAttention } from "./subscriber-attention.ts";

// Daily Briefing = orquestração pura das outras 3 skills. Sem lógica nova
// própria; garante que Dashboard e /assistente exibam exatamente o mesmo
// resultado (nenhuma duplicação).

const MAX_CARDS = 5;

function greetingFor(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function headlineFor(count: number): string {
  if (count === 0) return "Nenhuma ação prioritária identificada agora.";
  if (count === 1) return "1 ação prioritária hoje";
  return `${count} ações prioritárias hoje`;
}

export function getDailyBriefing(ctx: AgentContext): SkillResult<DailyBriefing> {
  const founder = getFounderAttention(ctx);
  const curation = getCurationOpportunities(ctx);
  const subscriber = getSubscriberAttention(ctx);

  const founderCards: AttentionCard[] = founder.data ?? [];
  const curationCards: AttentionCard[] = curation.data ?? [];
  const subscriberCards: AttentionCard[] = subscriber.data ?? [];

  // Consolida por prioridade e limita para caber em uma tela sem rolar demais.
  const merged = [...founderCards, ...curationCards, ...subscriberCards]
    .slice()
    .sort(sortByPriority);
  const cards = merged.slice(0, MAX_CARDS);

  const totals = {
    founder: founderCards.length,
    curation: curationCards.length,
    subscriber: subscriberCards.length,
  };
  const totalHits = totals.founder + totals.curation + totals.subscriber;

  const briefing: DailyBriefing = {
    greeting: greetingFor(new Date(ctx.loadedAt)),
    headline: headlineFor(totalHits),
    cards,
    totals,
    dataOrigin: ctx.origin,
  };

  const facts: string[] = [];
  const inferences: string[] = [];
  if (founder.status === "ok") facts.push(...founder.facts);
  if (curation.status === "ok") facts.push(...curation.facts);
  if (subscriber.status === "ok") facts.push(...subscriber.facts);
  if (founder.status === "ok") inferences.push(...founder.inferences);
  if (curation.status === "ok") inferences.push(...curation.inferences);
  if (subscriber.status === "ok") inferences.push(...subscriber.inferences);

  return {
    status: "ok",
    data: briefing,
    facts,
    inferences,
  };
}
