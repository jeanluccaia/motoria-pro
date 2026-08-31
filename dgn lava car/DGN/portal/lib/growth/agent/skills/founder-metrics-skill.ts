import type { AgentContext } from "../agent-context.ts";
import type { SkillResult } from "../types.ts";
import {
  computeFounderMetrics,
  getLegacyFounderCandidates,
  type FounderMetricsSnapshot,
} from "../../founder-metrics.ts";

// Skill READ-ONLY que devolve o snapshot canônico de métricas Founder para
// o Agent. Fonte única: `lib/growth/founder-metrics.ts`. Nunca recalcula no
// LLM — o LLM só sintetiza texto em cima dos `facts`/`inferences` daqui.
//
// Regra canônica Nº004 (2026-08-31):
//   Founder Nº001 = Benedito · Nº002 = José · Nº003 = Rikardo (confirmados).
//   Founder Nº004 = DISPONÍVEL — nenhum cliente confirmou essa vaga.
//   Iara Menezes = assinante Priority; tem histórico de seleção Founder no
//   passado, mas HOJE não é Founder confirmada e NÃO ocupa Nº004.
//
// A confusão pré-QA vinha de reportar "Nº004 reaberta como Iara". Isso está
// banido: Nº004 é livre, Iara é histórico legado.

export interface FounderMetricsPayload {
  goal: number;
  confirmedFounders: number;
  /** Ex.: 4 hoje (Nº001/002/003 confirmados). */
  nextAvailableFounderNumber: number;
  /** Ex.: "004" — pronto para exibição. */
  nextAvailableFounderLabel: string;
  openInvites: number;
  legacyFounderCandidatesCount: number;
  pipeline: FounderMetricsSnapshot["pipeline"];
  historical: FounderMetricsSnapshot["historical"];
  available: number;
  /** Descrição textual dos candidatos com histórico legado (não ocupam vaga). */
  legacyFounderNotes: string[];
}

export function getFounderMetrics(ctx: AgentContext): SkillResult<FounderMetricsPayload> {
  const snapshot = computeFounderMetrics(ctx.customers);
  const legacyRecords = getLegacyFounderCandidates();
  const legacyFounderNotes = legacyRecords.map(
    (r) =>
      `${r.name}: assinante ${r.plan} — histórico de seleção Founder é legado, NÃO ocupa vaga.`,
  );

  const payload: FounderMetricsPayload = {
    goal: snapshot.goal,
    confirmedFounders: snapshot.confirmedFounders,
    nextAvailableFounderNumber: snapshot.nextAvailableFounderNumber,
    nextAvailableFounderLabel: snapshot.nextAvailableFounderLabel,
    openInvites: snapshot.openInvites,
    legacyFounderCandidatesCount: snapshot.legacyFounderCandidatesCount,
    pipeline: snapshot.pipeline,
    historical: snapshot.historical,
    available: snapshot.available,
    legacyFounderNotes,
  };

  const facts = [
    `Founders confirmados: ${snapshot.confirmedFounders} (Nº001, Nº002, Nº003).`,
    `Próxima vaga Founder disponível: Nº${snapshot.nextAvailableFounderLabel}.`,
    `Meta da campanha: ${snapshot.goal} Founders.`,
    `Vagas disponíveis (meta - confirmados): ${snapshot.available}.`,
    `Convites em aberto: ${snapshot.openInvites}.`,
    `Selecionados aguardando convite: ${snapshot.pipeline.selected}.`,
    `Visualizados (em aberto): ${snapshot.pipeline.viewedOpen}.`,
    `Conversando: ${snapshot.pipeline.conversing}.`,
    `Pagamento em curso: ${snapshot.pipeline.paymentPending}.`,
    `Convertidos: ${snapshot.pipeline.converted}.`,
    `Histórico total de convites emitidos: ${snapshot.historical.invitesEverIssued}.`,
    `Histórico total de visualizações: ${snapshot.historical.invitesEverViewed}.`,
  ];
  if (legacyRecords.length > 0) {
    facts.push(
      `Candidatos com histórico Founder legado (assinantes que hoje NÃO ocupam vaga): ${legacyRecords.length}.`,
    );
    for (const detail of legacyFounderNotes) facts.push(detail);
  }

  const inferences: string[] = [];
  if (snapshot.pipeline.viewedOpen > 0) {
    inferences.push(
      `${snapshot.pipeline.viewedOpen} convite(s) visualizado(s) sem avanço — foco de follow-up.`,
    );
  }
  inferences.push(
    `Nº${snapshot.nextAvailableFounderLabel} está livre — pronto para receber a próxima confirmação. Nenhum cliente ocupa essa vaga hoje.`,
  );

  return { status: "ok", data: payload, facts, inferences };
}
