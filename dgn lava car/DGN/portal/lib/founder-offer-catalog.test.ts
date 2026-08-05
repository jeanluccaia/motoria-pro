import assert from "node:assert/strict";
import test from "node:test";
import {
  contractingModeLabels,
  createFounderPlanSnapshot,
  founderOfferCatalog,
  founderPlanCodes,
  founderPlanDefinitions,
  founderVehicleCategories,
  getFounderOffer,
  getFounderPlan,
  INCOMPLETE_OFFER_ADMIN_MESSAGE,
  isCombinationValidatedForPublication,
  isFounderContractingMode,
  isFounderPlanCode,
  isFounderVehicleCategory,
  monthlyPriceMatrix,
  normalizeLegacyFounderSnapshot,
  resolveMonthlyPrice,
  vehicleCategoryLabels,
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

test("matriz oficial de preços mensais coincide com a LP dgnclub.com", () => {
  assert.deepEqual(monthlyPriceMatrix.essential, { hatch: 70, sedan: 80, suv: 90, picape: 100 });
  assert.deepEqual(monthlyPriceMatrix.smart, { hatch: 130, sedan: 150, suv: 170, picape: 190 });
  assert.deepEqual(monthlyPriceMatrix.priority, { hatch: 210, sedan: 240, suv: 270, picape: 300 });
});

test("resolveMonthlyPrice devolve exatamente o valor da matriz para cada combinação", () => {
  for (const plan of founderPlanCodes) {
    for (const category of founderVehicleCategories) {
      assert.equal(resolveMonthlyPrice(plan, category), monthlyPriceMatrix[plan][category]);
    }
  }
});

test("catálogo cobre 12 monthly ativos + 6 loyalty inativos (3×4 + 3×2)", () => {
  const monthly = founderOfferCatalog.filter((offer) => offer.contractingMode === "monthly");
  const loyalty = founderOfferCatalog.filter((offer) => offer.contractingMode !== "monthly");
  assert.equal(monthly.length, 12);
  assert.equal(loyalty.length, 6);
  for (const offer of monthly) {
    assert.equal(offer.active, true);
    assert.equal(typeof offer.monthlyPrice, "number");
    assert.ok((offer.monthlyPrice as number) > 0);
    assert.ok(offer.vehicleCategory !== null);
    assert.equal(isCombinationValidatedForPublication(offer), true);
  }
  for (const offer of loyalty) {
    assert.equal(offer.active, false);
    assert.equal(offer.monthlyPrice, null);
    assert.equal(offer.vehicleCategory, null);
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

test("labels públicos de categoria oficiais são Hatch/Sedan/SUV/Picape", () => {
  assert.deepEqual(vehicleCategoryLabels, { hatch: "Hatch", sedan: "Sedan", suv: "SUV", picape: "Picape" });
});

test("guards rejeitam códigos antigos, nomenclaturas proibidas e categorias inválidas", () => {
  assert.equal(isFounderPlanCode("smart-founder-semestral"), false);
  assert.equal(isFounderPlanCode("essential_semestral"), false);
  assert.equal(isFounderPlanCode("Essential"), false);
  assert.equal(isFounderContractingMode("semestral"), false);
  assert.equal(isFounderContractingMode("anual"), false);
  assert.equal(isFounderContractingMode("Mensal"), false);
  assert.equal(isFounderVehicleCategory("moto"), false);
  assert.equal(isFounderVehicleCategory("Sedan"), false);
  assert.equal(getFounderOffer("essential", "semestral"), null);
  assert.equal(getFounderOffer("smart-founder-semestral", "loyalty_6"), null);
});

test("getFounderOffer(monthly, categoria válida) ativa a oferta e resolve o preço", () => {
  const offer = getFounderOffer("essential", "monthly", "hatch");
  assert.ok(offer);
  assert.equal(offer.active, true);
  assert.equal(offer.monthlyPrice, 70);
  assert.equal(offer.vehicleCategory, "hatch");
  assert.equal(offer.vehicleCategoryLabel, "Hatch");
});

test("getFounderOffer(monthly, sem categoria) devolve oferta inativa aguardando categoria", () => {
  const offer = getFounderOffer("priority", "monthly", null);
  assert.ok(offer);
  assert.equal(offer.active, false);
  assert.equal(offer.monthlyPrice, null);
  assert.equal(offer.vehicleCategory, null);
});

test("getFounderOffer(loyalty_6, categoria) permanece inativo mesmo com categoria", () => {
  for (const category of founderVehicleCategories) {
    const offer = getFounderOffer("smart", "loyalty_6", category);
    assert.ok(offer);
    assert.equal(offer.active, false);
    assert.equal(offer.monthlyPrice, null);
  }
});

test("snapshot combina plano com modalidade e categoria e é cópia isolada", () => {
  const snapshot = createFounderPlanSnapshot("essential", "monthly", "sedan");
  assert.ok(snapshot);
  assert.equal(snapshot.planCode, "essential");
  assert.equal(snapshot.contractingMode, "monthly");
  assert.equal(snapshot.contractingModeLabel, "Mensal");
  assert.equal(snapshot.vehicleCategory, "sedan");
  assert.equal(snapshot.vehicleCategoryLabel, "Sedan");
  assert.equal(snapshot.commitmentMonths, 0);
  assert.equal(snapshot.monthlyPrice, 80);
  assert.equal(snapshot.serviceQuantity, 1);
  snapshot.benefits.push("mutação isolada");
  const fresh = createFounderPlanSnapshot("essential", "monthly", "sedan");
  assert.ok(fresh);
  assert.ok(!fresh.benefits.includes("mutação isolada"));
});

test("snapshots das três modalidades trazem commitmentMonths coerentes", () => {
  assert.equal(createFounderPlanSnapshot("smart", "monthly", "hatch")?.commitmentMonths, 0);
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

test("catalog version é founders-2026-v2 em toda oferta", () => {
  for (const offer of founderOfferCatalog) {
    assert.equal(offer.catalogVersion, FOUNDER_CATALOG_VERSION);
  }
});

test("mensagem administrativa para oferta incompleta segue redação oficial", () => {
  assert.equal(INCOMPLETE_OFFER_ADMIN_MESSAGE, "Esta modalidade ainda não possui condição comercial validada.");
});
