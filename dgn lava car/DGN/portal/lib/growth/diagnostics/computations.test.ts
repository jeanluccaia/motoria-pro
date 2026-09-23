import test from "node:test";
import assert from "node:assert/strict";
import {
  computeDgnAverage,
  countEvaluatedCriteria,
  isPartialDiagnostic,
  describeAverageForCustomer,
  selectPublicAreas,
  sortPublicAreasBySeverity,
  computeInvestmentTotalCents,
  formatCents,
} from "./computations.ts";
import type {
  DiagnosticInspectionArea,
  DiagnosticScoreEntry,
} from "./types.ts";

const emptyScores: DiagnosticScoreEntry[] = [
  { criterionKey: "conservacao_pintura",     score: null },
  { criterionKey: "brilho_profundidade",     score: null },
  { criterionKey: "ausencia_riscos",         score: null },
  { criterionKey: "limpeza_descontaminacao", score: null },
  { criterionKey: "protecao_existente",      score: null },
];

const partialScores: DiagnosticScoreEntry[] = [
  { criterionKey: "conservacao_pintura",     score: 8 },
  { criterionKey: "brilho_profundidade",     score: 7 },
  { criterionKey: "ausencia_riscos",         score: null },   // parcial
  { criterionKey: "limpeza_descontaminacao", score: 6.5 },
  { criterionKey: "protecao_existente",      score: null },
];

const fullScores: DiagnosticScoreEntry[] = [
  { criterionKey: "conservacao_pintura",     score: 8 },
  { criterionKey: "brilho_profundidade",     score: 7 },
  { criterionKey: "ausencia_riscos",         score: 6 },
  { criterionKey: "limpeza_descontaminacao", score: 6.5 },
  { criterionKey: "protecao_existente",      score: 5 },
];

test("média: todos nulls → null (nunca 0)", () => {
  assert.strictEqual(computeDgnAverage(emptyScores), null);
});

test("média: parcial ignora nulls, não força 0", () => {
  const avg = computeDgnAverage(partialScores);
  // (8 + 7 + 6.5) / 3 = 7.166... → 7.2
  assert.strictEqual(avg, 7.2);
});

test("média: cheia é aritmética simples com 1 casa", () => {
  const avg = computeDgnAverage(fullScores);
  // (8+7+6+6.5+5)/5 = 6.5
  assert.strictEqual(avg, 6.5);
});

test("countEvaluatedCriteria conta só não-nulos", () => {
  assert.strictEqual(countEvaluatedCriteria(emptyScores), 0);
  assert.strictEqual(countEvaluatedCriteria(partialScores), 3);
  assert.strictEqual(countEvaluatedCriteria(fullScores), 5);
});

test("isPartialDiagnostic: nenhum avaliado → false", () => {
  assert.strictEqual(isPartialDiagnostic(emptyScores), false);
});

test("isPartialDiagnostic: parcial → true", () => {
  assert.strictEqual(isPartialDiagnostic(partialScores), true);
});

test("isPartialDiagnostic: completo → false", () => {
  assert.strictEqual(isPartialDiagnostic(fullScores), false);
});

test("describeAverageForCustomer: null → 'Sem avaliação registrada' (nunca 'Excelente' por erro de 0)", () => {
  assert.strictEqual(describeAverageForCustomer(null), "Sem avaliação registrada");
});

test("describeAverageForCustomer: faixas conhecidas", () => {
  assert.strictEqual(describeAverageForCustomer(9.5), "Excelente");
  assert.strictEqual(describeAverageForCustomer(8),   "Muito bom");
  assert.strictEqual(describeAverageForCustomer(6.5), "Bom, com pontos de atenção");
  assert.strictEqual(describeAverageForCustomer(5),   "Requer intervenção");
  assert.strictEqual(describeAverageForCustomer(2),   "Requer intervenção urgente");
});

// ---------------------------------------------------------------------------

const areas: DiagnosticInspectionArea[] = [
  { areaKey: "pintura",       condition: "attention",                observation: "", publicVisible: true,  photos: [] },
  { areaKey: "contaminacao",  condition: "intervention_recommended", observation: "", publicVisible: true,  photos: [] },
  { areaKey: "black_piano",   condition: "good",                     observation: "", publicVisible: true,  photos: [] },
  { areaKey: "interior",      condition: "attention",                observation: "", publicVisible: false, photos: [] }, // interna
  { areaKey: "rodas",         condition: "not_evaluated",            observation: "", publicVisible: true,  photos: [] }, // não avaliada
];

test("selectPublicAreas: exclui not_evaluated e publicVisible=false", () => {
  const publicOnes = selectPublicAreas(areas);
  const keys = publicOnes.map((a) => a.areaKey).sort();
  assert.deepEqual(keys, ["black_piano", "contaminacao", "pintura"]);
});

test("sortPublicAreasBySeverity: intervenção primeiro, boa por último", () => {
  const sorted = sortPublicAreasBySeverity(selectPublicAreas(areas));
  assert.deepEqual(sorted.map((a) => a.areaKey), [
    "contaminacao",  // intervention_recommended
    "pintura",       // attention
    "black_piano",   // good
  ]);
});

// ---------------------------------------------------------------------------

test("computeInvestmentTotalCents: soma final e zera negativos", () => {
  assert.strictEqual(
    computeInvestmentTotalCents([
      { finalPriceCents: 45000 },
      { finalPriceCents: 22000 },
      { finalPriceCents: -100 }, // guard: nunca subtrai
    ]),
    67000,
  );
});

test("computeInvestmentTotalCents: vazio → 0 (não null — é um total válido)", () => {
  assert.strictEqual(computeInvestmentTotalCents([]), 0);
});

test("formatCents produz BRL pt-BR", () => {
  const out = formatCents(45000);
  // Windows/Node podem usar NBSP entre símbolo e número. Normaliza pra assert.
  assert.match(out.replace(/\s/g, " "), /R\$ ?450,00/);
});
