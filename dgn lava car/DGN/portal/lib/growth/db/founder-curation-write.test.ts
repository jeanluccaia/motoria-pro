import assert from "node:assert/strict";
import test from "node:test";
import { FounderCurationWriteError, validateFounderCurationPayload } from "./founder-curation-write.ts";
import { monthlyPriceMatrix, founderVehicleCategories } from "../../founder-offer-catalog.ts";

const base = {
  campaignId: "founders-2026",
  action: "save",
  recommendedPlanCode: "essential",
  recommendedContractingMode: "monthly",
  recommendedVehicleCategory: "sedan",
  recommendationReasonInternal: "Escolha humana após análise.",
  expectedUpdatedAt: "2026-08-05T12:00:00.000Z",
};

test("save aceita Essential + Mensal + Sedan e cria snapshot server-side com preço oficial", () => {
  const parsed = validateFounderCurationPayload(base);
  assert.equal(parsed.snapshot?.planCode, "essential");
  assert.equal(parsed.snapshot?.contractingMode, "monthly");
  assert.equal(parsed.snapshot?.vehicleCategory, "sedan");
  assert.equal(parsed.snapshot?.monthlyPrice, 80);
  assert.equal(parsed.snapshot?.serviceQuantity, 1);
});

test("todas as 12 combinações monthly resolvem o preço oficial no servidor", () => {
  for (const plan of ["essential", "smart", "priority"] as const) {
    for (const category of founderVehicleCategories) {
      const parsed = validateFounderCurationPayload({
        ...base,
        action: "approve",
        recommendedPlanCode: plan,
        recommendedVehicleCategory: category,
      });
      assert.equal(parsed.snapshot?.monthlyPrice, monthlyPriceMatrix[plan][category],
        `preço server-side para ${plan}/${category} deve bater com a matriz oficial`);
      assert.equal(parsed.snapshot?.vehicleCategory, category);
      assert.equal(parsed.snapshot?.planCode, plan);
    }
  }
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

test("categoria de veículo inválida é rejeitada", () => {
  for (const invalidCat of ["moto", "van", "sedanX"]) {
    assert.throws(() => validateFounderCurationPayload({ ...base, recommendedVehicleCategory: invalidCat }),
      (error) => error instanceof FounderCurationWriteError && /categoria/i.test(error.message));
  }
});

test("aprovação Mensal exige categoria e combinação válida", () => {
  assert.throws(() => validateFounderCurationPayload({ ...base, action: "approve", recommendedVehicleCategory: "" }),
    (error) => error instanceof FounderCurationWriteError && /categoria do veículo/i.test(error.message));
  assert.throws(() => validateFounderCurationPayload({ ...base, action: "approve", recommendationReasonInternal: "" }),
    (error) => error instanceof FounderCurationWriteError && /motivo/i.test(error.message));
});

test("aprovação Fidelidade permanece bloqueada por preço não validado", () => {
  for (const mode of ["loyalty_6", "loyalty_12"] as const) {
    assert.throws(() => validateFounderCurationPayload({ ...base, action: "approve", recommendedContractingMode: mode, recommendedVehicleCategory: "sedan" }),
      (error) => error instanceof FounderCurationWriteError && /condição comercial validada/i.test(error.message));
    assert.throws(() => validateFounderCurationPayload({ ...base, action: "create_page", recommendedContractingMode: mode }),
      (error) => error instanceof FounderCurationWriteError && /condição comercial validada|categoria do veículo/i.test(error.message));
  }
});

test("save preserva os três planos oficiais no snapshot", () => {
  for (const planCode of ["essential", "smart", "priority"] as const) {
    const parsed = validateFounderCurationPayload({ ...base, recommendedPlanCode: planCode });
    assert.equal(parsed.snapshot?.planCode, planCode);
    assert.match(parsed.snapshot?.planName ?? "", /^DGN /);
    assert.doesNotMatch(parsed.snapshot?.planName ?? "", /semestral|anual|trimestral/i);
  }
});

// -----------------------------------------------------------------------------
// Fast-path create_invite — aprova + cria página em uma ação
// -----------------------------------------------------------------------------

test("create_invite aceita Mensal + categoria + motivo válidos", () => {
  const parsed = validateFounderCurationPayload({ ...base, action: "create_invite" });
  assert.equal(parsed.action, "create_invite");
  assert.equal(parsed.snapshot?.contractingMode, "monthly");
  assert.equal(parsed.snapshot?.planCode, "essential");
  assert.equal(parsed.snapshot?.monthlyPrice, 80);
});

test("create_invite exige categoria quando modalidade é Mensal", () => {
  assert.throws(
    () => validateFounderCurationPayload({ ...base, action: "create_invite", recommendedVehicleCategory: "" }),
    (error) => error instanceof FounderCurationWriteError && /categoria do veículo/i.test(error.message),
  );
});

test("create_invite exige motivo interno com pelo menos 3 caracteres", () => {
  assert.throws(
    () => validateFounderCurationPayload({ ...base, action: "create_invite", recommendationReasonInternal: "" }),
    (error) => error instanceof FounderCurationWriteError && /motivo/i.test(error.message),
  );
});

test("create_invite bloqueia modalidade Fidelidade (não validada comercialmente)", () => {
  for (const mode of ["loyalty_6", "loyalty_12"] as const) {
    assert.throws(
      () => validateFounderCurationPayload({
        ...base,
        action: "create_invite",
        recommendedContractingMode: mode,
        recommendedVehicleCategory: "sedan",
      }),
      (error) => error instanceof FounderCurationWriteError && /condição comercial validada/i.test(error.message),
    );
  }
});

test("create_invite bloqueia plano fora do catálogo", () => {
  for (const invalidCode of ["elite", "premium", "daily", "Essential"]) {
    assert.throws(
      () => validateFounderCurationPayload({ ...base, action: "create_invite", recommendedPlanCode: invalidCode }),
      (error) => error instanceof FounderCurationWriteError,
    );
  }
});

test("create_invite resolve o preço server-side (12 combinações Mensal)", () => {
  for (const plan of ["essential", "smart", "priority"] as const) {
    for (const category of founderVehicleCategories) {
      const parsed = validateFounderCurationPayload({
        ...base,
        action: "create_invite",
        recommendedPlanCode: plan,
        recommendedVehicleCategory: category,
      });
      assert.equal(parsed.snapshot?.monthlyPrice, monthlyPriceMatrix[plan][category]);
    }
  }
});

test("create_invite aceita expectedUpdatedAt vazio/null (bootstrap silencioso da RPC)", () => {
  for (const empty of [null, undefined, ""] as const) {
    const parsed = validateFounderCurationPayload({
      ...base,
      action: "create_invite",
      expectedUpdatedAt: empty,
    });
    assert.equal(parsed.expectedUpdatedAt, null, `esperava null para ${JSON.stringify(empty)}`);
  }
});

test("ações que NÃO são create_invite continuam exigindo expectedUpdatedAt válido", () => {
  for (const action of ["save", "approve", "create_page", "replace", "mark_sent", "revoke"] as const) {
    for (const empty of [null, undefined, ""] as const) {
      assert.throws(
        () => validateFounderCurationPayload({ ...base, action, expectedUpdatedAt: empty }),
        (error) => error instanceof FounderCurationWriteError && /expectedUpdatedAt/i.test(error.message),
        `${action} com ${JSON.stringify(empty)} deveria falhar`,
      );
    }
  }
});
