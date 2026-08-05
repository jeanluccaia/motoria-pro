import assert from "node:assert/strict";
import test from "node:test";
import { FounderCurationWriteError, validateFounderCurationPayload } from "./founder-curation-write.ts";

const base = {
  campaignId: "founders-2026",
  action: "save",
  recommendedPlanCode: "essential",
  recommendedContractingMode: "monthly",
  recommendationReasonInternal: "Escolha humana após análise.",
  expectedUpdatedAt: "2026-08-04T12:00:00.000Z",
};

test("save aceita Essential + Mensal e cria snapshot server-side sem preço inventado", () => {
  const parsed = validateFounderCurationPayload(base);
  assert.equal(parsed.snapshot?.planCode, "essential");
  assert.equal(parsed.snapshot?.contractingMode, "monthly");
  assert.equal(parsed.snapshot?.contractingModeLabel, "Mensal");
  assert.equal(parsed.snapshot?.monthlyPrice, null);
  assert.equal(parsed.snapshot?.serviceQuantity, 1);
});

test("payload fechado rejeita preço, name ou campos adicionais", () => {
  for (const extra of [{ monthlyPrice: 149 }, { displayedValue: "R$ 1" }, { planName: "DGN Essential" }, { billingRule: "custom" }]) {
    assert.throws(() => validateFounderCurationPayload({ ...base, ...extra }),
      (error) => error instanceof FounderCurationWriteError && error.status === 400);
  }
});

test("plano fora do catálogo e códigos com duração no nome são rejeitados", () => {
  for (const invalidCode of ["inventado", "essential_semestral", "smart-founder-semestral", "priority-anual", "Essential"]) {
    assert.throws(() => validateFounderCurationPayload({ ...base, recommendedPlanCode: invalidCode }),
      (error) => error instanceof FounderCurationWriteError && error.status === 400);
  }
});

test("modalidades proibidas (semestral/anual/trimestral) são rejeitadas", () => {
  for (const invalidMode of ["semestral", "anual", "trimestral", "Mensal", "Fidelidade"]) {
    assert.throws(() => validateFounderCurationPayload({ ...base, recommendedContractingMode: invalidMode }),
      (error) => error instanceof FounderCurationWriteError && error.status === 400);
  }
});

test("aprovação exige motivo e combinação com preço validado", () => {
  assert.throws(() => validateFounderCurationPayload({ ...base, action: "approve", recommendationReasonInternal: "" }),
    (error) => error instanceof FounderCurationWriteError && error.status === 400);
  assert.throws(() => validateFounderCurationPayload({ ...base, action: "approve" }),
    (error) => error instanceof FounderCurationWriteError && /condição comercial validada/i.test(error.message));
  assert.throws(() => validateFounderCurationPayload({ ...base, action: "create_page" }),
    (error) => error instanceof FounderCurationWriteError && /condição comercial validada/i.test(error.message));
});

test("save preserva os três planos oficiais no snapshot", () => {
  for (const planCode of ["essential", "smart", "priority"] as const) {
    const parsed = validateFounderCurationPayload({ ...base, recommendedPlanCode: planCode });
    assert.equal(parsed.snapshot?.planCode, planCode);
    assert.match(parsed.snapshot?.planName ?? "", /^DGN /);
    assert.doesNotMatch(parsed.snapshot?.planName ?? "", /semestral|anual|trimestral/i);
  }
});
