import assert from "node:assert/strict";
import test from "node:test";
import {
  contractingModeLabels,
  createFounderPlanSnapshot,
  founderContractingModes,
  founderOfferCatalog,
  founderPlanCodes,
  founderPlanDefinitions,
  getFounderOffer,
  getFounderPlan,
  INCOMPLETE_OFFER_ADMIN_MESSAGE,
  isCombinationValidatedForPublication,
  isFounderContractingMode,
  isFounderPlanCode,
  normalizeLegacyFounderSnapshot,
  FOUNDER_CATALOG_VERSION,
} from "./founder-offer-catalog.ts";

test("catálogo Founder expõe os três planos oficiais sem duração no nome", () => {
  assert.deepEqual(founderPlanDefinitions.map((plan) => plan.planCode), ["essential", "smart", "priority"]);
  const names = founderPlanDefinitions.map((plan) => plan.planName);
  assert.deepEqual(names, ["DGN Essential", "DGN Smart", "DGN Priority"]);
  for (const name of names) {
    assert.doesNotMatch(name, /semestral|anual|trimestral|fidelidade|mensal/i);
  }
});

test("DGN Essential é mensal, com 1 lavagem e benefícios oficiais", () => {
  const essential = getFounderPlan("essential");
  assert.ok(essential);
  assert.equal(essential.serviceFrequency, "mensal");
  assert.equal(essential.serviceQuantity, 1);
  assert.deepEqual(essential.benefits, [
    "1 Lavagem Padrão DGN por mês",
    "Vaga programada",
    "Prioridade sobre atendimentos avulsos",
    "Histórico de cuidados",
    "Leva & Traz programado conforme região, rota e disponibilidade",
  ]);
});

test("catálogo cobre plano × modalidade e todas as combinações começam inativas sem preço", () => {
  assert.equal(founderOfferCatalog.length, founderPlanCodes.length * founderContractingModes.length);
  for (const offer of founderOfferCatalog) {
    assert.equal(offer.monthlyPrice, null);
    assert.equal(offer.active, false);
    assert.equal(offer.catalogVersion, FOUNDER_CATALOG_VERSION);
    assert.equal(isCombinationValidatedForPublication(offer), false);
  }
});

test("labels públicos de modalidade não contêm nomenclatura proibida", () => {
  assert.equal(contractingModeLabels.monthly, "Mensal");
  assert.equal(contractingModeLabels.loyalty_6, "Fidelidade de 6 meses");
  assert.equal(contractingModeLabels.loyalty_12, "Fidelidade de 12 meses");
  for (const label of Object.values(contractingModeLabels)) {
    assert.doesNotMatch(label, /semestral|anual|trimestral/i);
  }
});

test("guards rejeitam códigos antigos e nomenclaturas proibidas", () => {
  assert.equal(isFounderPlanCode("smart-founder-semestral"), false);
  assert.equal(isFounderPlanCode("essential_semestral"), false);
  assert.equal(isFounderPlanCode("Essential"), false);
  assert.equal(isFounderContractingMode("semestral"), false);
  assert.equal(isFounderContractingMode("anual"), false);
  assert.equal(isFounderContractingMode("Mensal"), false);
  assert.equal(getFounderOffer("essential", "semestral"), null);
  assert.equal(getFounderOffer("smart-founder-semestral", "loyalty_6"), null);
});

test("snapshot combina plano com modalidade e é cópia isolada", () => {
  const snapshot = createFounderPlanSnapshot("essential", "monthly");
  assert.ok(snapshot);
  assert.equal(snapshot.planCode, "essential");
  assert.equal(snapshot.contractingMode, "monthly");
  assert.equal(snapshot.contractingModeLabel, "Mensal");
  assert.equal(snapshot.commitmentMonths, 0);
  assert.equal(snapshot.monthlyPrice, null);
  assert.equal(snapshot.serviceQuantity, 1);
  snapshot.benefits.push("mutação isolada");
  const fresh = createFounderPlanSnapshot("essential", "monthly");
  assert.ok(fresh);
  assert.ok(!fresh.benefits.includes("mutação isolada"));
});

test("snapshots das três modalidades trazem commitmentMonths coerentes", () => {
  assert.equal(createFounderPlanSnapshot("smart", "monthly")?.commitmentMonths, 0);
  assert.equal(createFounderPlanSnapshot("smart", "loyalty_6")?.commitmentMonths, 6);
  assert.equal(createFounderPlanSnapshot("smart", "loyalty_12")?.commitmentMonths, 12);
});

test("normalizeLegacyFounderSnapshot lê snapshots antigos sem publicar preço", () => {
  const legacy = normalizeLegacyFounderSnapshot({
    code: "smart-founder-semestral",
    name: "DGN Smart Semestral",
    version: "founders-2026-v1",
    frequency: "Semestral",
    benefits: ["Cuidado essencial"],
    displayedValue: "6x de R$ 110",
    billingCondition: "6 parcelas de R$ 110",
    publicRules: ["Regra"],
  });
  assert.ok(legacy);
  assert.equal(legacy.planCode, "smart");
  assert.equal(legacy.contractingMode, "loyalty_6");
  assert.equal(legacy.monthlyPrice, null);
  const invalid = normalizeLegacyFounderSnapshot({ code: "essential-anual" });
  assert.equal(invalid, null);
});

test("mensagem administrativa para oferta incompleta segue redação oficial", () => {
  assert.equal(INCOMPLETE_OFFER_ADMIN_MESSAGE, "Esta modalidade ainda não possui condição comercial validada.");
});
