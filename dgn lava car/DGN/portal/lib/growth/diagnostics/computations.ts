// DGN Diagnósticos — cálculos puros
//
// Regras invioláveis:
//   * Nota null NUNCA vira 0. A média ignora critérios não avaliados.
//   * Se TODOS os critérios estão null, a média é `null` (não é zero e não é
//     "0.0" — a UI mostra "sem avaliação"). Isso mata o bug clássico de
//     mostrar "nota 0,0" pra diagnóstico que ninguém preencheu ainda.
//   * Média é aritmética simples arredondada a 1 casa decimal.

import type { DiagnosticInspectionArea, DiagnosticScoreEntry } from "./types";
import type { InspectionCondition } from "./catalog";

export function computeDgnAverage(scores: readonly DiagnosticScoreEntry[]): number | null {
  const evaluated = scores.filter((s) => s.score !== null) as Array<{
    criterionKey: string;
    score: number;
  }>;
  if (evaluated.length === 0) return null;
  const sum = evaluated.reduce((acc, s) => acc + s.score, 0);
  return Math.round((sum / evaluated.length) * 10) / 10;
}

export function countEvaluatedCriteria(scores: readonly DiagnosticScoreEntry[]): number {
  return scores.filter((s) => s.score !== null).length;
}

export function isPartialDiagnostic(scores: readonly DiagnosticScoreEntry[]): boolean {
  const total = scores.length;
  const evaluated = countEvaluatedCriteria(scores);
  return evaluated > 0 && evaluated < total;
}

/**
 * Rótulo público da nota. Diferente da média numérica — usado nos cards para
 * o cliente ler sem confundir "0.0" com "não avaliado".
 */
export function describeAverageForCustomer(avg: number | null): string {
  if (avg === null) return "Sem avaliação registrada";
  if (avg >= 9) return "Excelente";
  if (avg >= 7.5) return "Muito bom";
  if (avg >= 6) return "Bom, com pontos de atenção";
  if (avg >= 4) return "Requer intervenção";
  return "Requer intervenção urgente";
}

/**
 * Áreas que devem entrar no bloco "Pontos encontrados" da página do cliente.
 * Só áreas com condição diferente de "not_evaluated" E marcadas como
 * publicVisible. Filtramos aqui pra o componente da página pública ser burro.
 */
export function selectPublicAreas(
  areas: readonly DiagnosticInspectionArea[],
): DiagnosticInspectionArea[] {
  return areas.filter(
    (a) => a.publicVisible && a.condition !== "not_evaluated",
  );
}

const conditionSeverity: Record<InspectionCondition, number> = {
  not_evaluated: 0,
  good: 1,
  attention: 2,
  intervention_recommended: 3,
};

/**
 * Ordena áreas públicas por severidade decrescente — o cliente vê primeiro o
 * que exige intervenção, depois "atenção", depois "boa".
 */
export function sortPublicAreasBySeverity(
  areas: readonly DiagnosticInspectionArea[],
): DiagnosticInspectionArea[] {
  return [...areas].sort(
    (a, b) => conditionSeverity[b.condition] - conditionSeverity[a.condition],
  );
}

/**
 * Total do investimento (final) em centavos. Investimento vazio devolve 0
 * — não confundir com null (média): investimento zero é fato válido.
 */
export function computeInvestmentTotalCents(
  items: readonly { finalPriceCents: number }[],
): number {
  return items.reduce((acc, item) => acc + Math.max(0, item.finalPriceCents), 0);
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
