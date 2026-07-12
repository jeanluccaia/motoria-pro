import { test } from "node:test";
import assert from "node:assert/strict";
import { computeDgnScore, DGN_SCORE_VERSION, type ScoreInput } from "./score-engine.ts"; // node:test needs the .ts extension

function baseInput(overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    averageIntervalDays: 30,
    daysSinceLastService: 45,
    serviceCount: 20,
    historicalValue: 1500,
    averageTicket: 75,
    planFit: "priority",
    dataQualityIssues: [],
    strategicLink: false,
    relationshipStrength: 1,
    hasDetectedSubscription: false,
    ...overrides,
  };
}

test("cliente exemplar recorrente cai em prioridade_maxima", () => {
  const b = computeDgnScore(baseInput({
    averageIntervalDays: 18,
    daysSinceLastService: 15,
    serviceCount: 60,
    historicalValue: 3000,
    averageTicket: 100,
    planFit: "priority",
    strategicLink: true,
    relationshipStrength: 3,
  }));
  assert.equal(b.scoreVersion, DGN_SCORE_VERSION);
  assert.ok(b.totalScore >= 85, `esperado >= 85, veio ${b.totalScore}`);
  assert.equal(b.tier, "prioridade_maxima");
  assert.equal(b.penalties.length, 0);
});

test("cliente médio cai em forte_candidato ou precisa_curadoria", () => {
  const b = computeDgnScore(baseInput({
    averageIntervalDays: 45,
    daysSinceLastService: 60,
    serviceCount: 15,
    historicalValue: 900,
    averageTicket: 60,
    planFit: "smart",
    relationshipStrength: 1,
  }));
  assert.ok(b.totalScore >= 40 && b.totalScore < 85);
});

test("cliente inativo sem dados cai em baixa_prioridade", () => {
  const b = computeDgnScore(baseInput({
    averageIntervalDays: null,
    daysSinceLastService: 400,
    serviceCount: 1,
    historicalValue: 50,
    averageTicket: 30,
    planFit: "não_identificado",
    dataQualityIssues: ["veiculo_indefinido", "telefone_ausente"],
    relationshipStrength: 0,
  }));
  assert.ok(b.totalScore < 55, `esperado <55, veio ${b.totalScore}`);
  assert.equal(b.tier, "baixa_prioridade");
});

test("penalidade por veículo indefinido aparece na explicação", () => {
  const b = computeDgnScore(baseInput({
    dataQualityIssues: ["veiculo_indefinido"],
  }));
  const p = b.penalties.find((x) => x.code === "veiculo_indefinido");
  assert.ok(p, "penalidade não encontrada");
  assert.ok(p!.points < 0);
  assert.ok(b.explanation.some((line) => line.includes("veículo")));
});

test("penalidade por telefone ausente é maior que por telefone inválido", () => {
  const ausente = computeDgnScore(baseInput({ dataQualityIssues: ["telefone_ausente"] })).totalScore;
  const invalido = computeDgnScore(baseInput({ dataQualityIssues: ["telefone_invalido"] })).totalScore;
  assert.ok(ausente < invalido, "telefone ausente deve penalizar mais");
});

test("nome com prefixo artificial aplica penalidade", () => {
  const b = computeDgnScore(baseInput({ dataQualityIssues: ["nome_com_prefixo"] }));
  assert.ok(b.penalties.some((p) => p.code === "nome_com_prefixo"));
});

test("assinatura detectada aplica penalidade forte (não competir na fila)", () => {
  const semSub = computeDgnScore(baseInput()).totalScore;
  const comSub = computeDgnScore(baseInput({ hasDetectedSubscription: true })).totalScore;
  assert.ok(semSub - comSub >= 15, "penalidade deve ser >= 15 pts");
  const p = computeDgnScore(baseInput({ hasDetectedSubscription: true }))
    .penalties.find((x) => x.code === "assinatura_detectada_na_fila");
  assert.ok(p, "penalidade assinatura_detectada_na_fila ausente");
});

test("score total nunca ultrapassa 100 nem fica negativo", () => {
  const maxOut = computeDgnScore(baseInput({
    averageIntervalDays: 10,
    daysSinceLastService: 5,
    serviceCount: 200,
    historicalValue: 100000,
    averageTicket: 500,
    planFit: "corporate",
    strategicLink: true,
    relationshipStrength: 3,
  }));
  assert.ok(maxOut.totalScore <= 100, `total ${maxOut.totalScore} > 100`);

  const worst = computeDgnScore(baseInput({
    averageIntervalDays: null,
    daysSinceLastService: null,
    serviceCount: 0,
    historicalValue: 0,
    averageTicket: 0,
    planFit: "não_identificado",
    dataQualityIssues: [
      "veiculo_indefinido", "telefone_ausente", "atendimento_antigo",
      "duplicidade_provavel", "pendencia_nao_resolvida",
    ],
    hasDetectedSubscription: true,
    relationshipStrength: 0,
  }));
  assert.ok(worst.totalScore >= 0, `total ${worst.totalScore} < 0`);
});

test("versão do score é retornada", () => {
  const b = computeDgnScore(baseInput());
  assert.equal(b.scoreVersion, "DGN_SCORE_V1");
});

test("recorrência escala continuamente entre 20 e 90 dias", () => {
  const s20 = computeDgnScore(baseInput({ averageIntervalDays: 20 })).components.recurrence;
  const s60 = computeDgnScore(baseInput({ averageIntervalDays: 60 })).components.recurrence;
  const s90 = computeDgnScore(baseInput({ averageIntervalDays: 90 })).components.recurrence;
  assert.equal(s20, 25);
  assert.equal(s90, 0);
  assert.ok(s60 > 0 && s60 < 25);
});
