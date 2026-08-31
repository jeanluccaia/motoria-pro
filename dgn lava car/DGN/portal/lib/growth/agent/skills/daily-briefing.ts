import type { AgentContext } from "../agent-context.ts";
import type { AttentionCard, DailyBriefing, Priority, SkillResult } from "../types.ts";
import { getCurationOpportunities } from "./curation-opportunities.ts";
import { getFounderAttention, sortByPriority } from "./founder-attention.ts";
import { getSubscriberAttention } from "./subscriber-attention.ts";

// Daily Briefing = orquestração pura das outras 3 skills. Sem lógica nova
// própria; garante que Dashboard e /assistente exibam exatamente o mesmo
// resultado (nenhuma duplicação).

const MAX_CARDS = 5;

function greetingFor(now: Date): string {
  // Timezone fixo America/Sao_Paulo — no Vercel o runtime é UTC, então
  // now.getHours() daria "Boa noite" às 17h SP. Usar Intl garante que a hora
  // usada na regra é a hora local do operador.
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

function headlineFor(total: number, displayed: number): string {
  if (total === 0) return "Nenhuma ação prioritária identificada agora.";
  if (total === displayed) {
    return total === 1 ? "1 ação prioritária hoje" : `${total} ações prioritárias hoje`;
  }
  return `${total} sinais encontrados · mostrando as ${displayed} maiores prioridades`;
}

/**
 * Deriva facts/inferences a partir dos CARDS que a UI vai renderizar — nunca
 * de contadores paralelos. Assim o texto "1 prioridade alta" bate 1:1 com o que
 * o operador vê na tela.
 */
function derivedDisclosuresFromCards(cards: AttentionCard[]): {
  facts: string[];
  inferences: string[];
} {
  const priorityCount: Record<Priority, number> = {
    critica: 0,
    alta: 0,
    media: 0,
    oportunidade: 0,
  };
  const kindCount = { founder: 0, curation: 0, subscriber: 0, insight: 0 };
  for (const card of cards) {
    priorityCount[card.priority] += 1;
    kindCount[card.kind] += 1;
  }
  const facts: string[] = [];
  const inferences: string[] = [];
  if (kindCount.founder > 0) facts.push(`${kindCount.founder} card(s) Founder em atenção.`);
  if (kindCount.curation > 0) facts.push(`${kindCount.curation} card(s) Curadoria em atenção.`);
  if (kindCount.subscriber > 0) facts.push(`${kindCount.subscriber} assinante(s) em atenção.`);
  if (priorityCount.critica > 0) inferences.push(`${priorityCount.critica} com prioridade crítica.`);
  if (priorityCount.alta > 0) inferences.push(`${priorityCount.alta} com prioridade alta.`);
  return { facts, inferences };
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
  const totalOpportunities = totals.founder + totals.curation + totals.subscriber;
  const displayedPriorities = cards.length;

  const briefing: DailyBriefing = {
    greeting: greetingFor(new Date(ctx.loadedAt)),
    headline: headlineFor(totalOpportunities, displayedPriorities),
    cards,
    totals,
    totalOpportunities,
    displayedPriorities,
    dataOrigin: ctx.origin,
  };

  const { facts, inferences } = derivedDisclosuresFromCards(cards);

  return {
    status: "ok",
    data: briefing,
    facts,
    inferences,
  };
}
