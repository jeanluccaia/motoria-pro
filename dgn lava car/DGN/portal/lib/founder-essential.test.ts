// Testes dedicados ao DGN Essential — checklist do adendo.
// Cobrem presença no catálogo, benefícios oficiais, combinações plano×modalidade,
// bloqueios de publicação, rejeição de nomenclatura proibida, preservação de
// Founders 001-003 e da vaga Nº004 (Iara).

import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  contractingModeLabels,
  createFounderPlanSnapshot,
  founderContractingModes,
  founderOfferCatalog,
  founderPlanDefinitions,
  getFounderOffer,
  getFounderPlan,
  isCombinationValidatedForPublication,
  isFounderContractingMode,
  isFounderPlanCode,
} from "./founder-offer-catalog.ts";
import { FounderCurationWriteError, validateFounderCurationPayload } from "./growth/db/founder-curation-write.ts";
import { normalizePlanCodeForFilter } from "./founder-plan-filter.ts";

const baseWrite = {
  campaignId: "founders-2026",
  action: "save",
  recommendedPlanCode: "essential",
  recommendedContractingMode: "monthly",
  recommendationReasonInternal: "Escolha humana após análise.",
  expectedUpdatedAt: "2026-08-04T12:00:00.000Z",
};

test("Essential ocupa a primeira posição do catálogo com nome oficial DGN Essential", () => {
  assert.equal(founderPlanDefinitions[0].planCode, "essential");
  assert.equal(founderPlanDefinitions[0].planName, "DGN Essential");
  assert.equal(isFounderPlanCode("essential"), true);
  assert.doesNotMatch(founderPlanDefinitions[0].planName, /mensal|semestral|anual|trimestral|fidelidade/i);
});

test("Essential é mensal com 1 lavagem e cinco benefícios oficiais da LP", () => {
  const essential = getFounderPlan("essential");
  assert.ok(essential);
  assert.equal(essential.serviceFrequency, "mensal");
  assert.equal(essential.serviceQuantity, 1);
  assert.equal(essential.benefits.length, 5);
  assert.deepEqual([...essential.benefits], [
    "1 Lavagem Padrão DGN por mês",
    "Vaga programada",
    "Prioridade sobre atendimentos avulsos",
    "Histórico de cuidados",
    "Leva & Traz programado conforme região, rota e disponibilidade",
  ]);
});

test("Essential combina com as três modalidades e todas nascem inativas sem preço", () => {
  for (const mode of founderContractingModes) {
    const offer = getFounderOffer("essential", mode);
    assert.ok(offer, `combinação essential+${mode} deve existir`);
    assert.equal(offer.contractingMode, mode);
    assert.equal(offer.contractingModeLabel, contractingModeLabels[mode]);
    assert.equal(offer.monthlyPrice, null);
    assert.equal(offer.active, false);
    assert.equal(isCombinationValidatedForPublication(offer), false);
  }
});

test("snapshot Essential inclui todos os campos estruturados esperados", () => {
  const snapshot = createFounderPlanSnapshot("essential", "loyalty_12");
  assert.ok(snapshot);
  assert.equal(snapshot.planCode, "essential");
  assert.equal(snapshot.planName, "DGN Essential");
  assert.equal(snapshot.serviceFrequency, "mensal");
  assert.equal(snapshot.serviceQuantity, 1);
  assert.equal(snapshot.contractingMode, "loyalty_12");
  assert.equal(snapshot.contractingModeLabel, "Fidelidade de 12 meses");
  assert.equal(snapshot.commitmentMonths, 12);
  assert.equal(snapshot.monthlyPrice, null);
  assert.match(snapshot.billingRule, /fidelidade de 12 meses/i);
  assert.ok(Array.isArray(snapshot.benefits));
  assert.ok(snapshot.catalogVersion.length > 0);
});

test("guards rejeitam 'essential_semestral', 'essential_anual' e 'essential_monthly'", () => {
  for (const code of ["essential_semestral", "essential_anual", "essential_monthly", "Essential", "essential-anual"]) {
    assert.equal(isFounderPlanCode(code), false, `${code} não pode ser aceito`);
  }
  for (const mode of ["semestral", "anual", "trimestral"]) {
    assert.equal(isFounderContractingMode(mode), false, `${mode} não pode ser modalidade`);
  }
});

test("writer rejeita 'Essential Semestral', 'Essential Anual' e 'essential_monthly'", () => {
  for (const invalid of ["essential_semestral", "essential_anual", "essential_monthly", "Essential Semestral", "Essential Anual"]) {
    assert.throws(() => validateFounderCurationPayload({ ...baseWrite, recommendedPlanCode: invalid }),
      (error) => error instanceof FounderCurationWriteError && error.status === 400);
  }
});

test("writer bloqueia aprovação de combinação Essential ainda inativa", () => {
  for (const mode of ["monthly", "loyalty_6", "loyalty_12"] as const) {
    assert.throws(() => validateFounderCurationPayload({ ...baseWrite, action: "approve", recommendedContractingMode: mode }),
      (error) => error instanceof FounderCurationWriteError && /condição comercial validada/i.test(error.message));
    assert.throws(() => validateFounderCurationPayload({ ...baseWrite, action: "create_page", recommendedContractingMode: mode }),
      (error) => error instanceof FounderCurationWriteError && /condição comercial validada/i.test(error.message));
    assert.throws(() => validateFounderCurationPayload({ ...baseWrite, action: "replace", recommendedContractingMode: mode }),
      (error) => error instanceof FounderCurationWriteError && /condição comercial validada/i.test(error.message));
  }
});

test("writer aceita save do Essential sem preço, gerando snapshot server-side", () => {
  for (const mode of ["monthly", "loyalty_6", "loyalty_12"] as const) {
    const parsed = validateFounderCurationPayload({ ...baseWrite, recommendedContractingMode: mode });
    assert.equal(parsed.snapshot?.planCode, "essential");
    assert.equal(parsed.snapshot?.contractingMode, mode);
    assert.equal(parsed.snapshot?.monthlyPrice, null);
  }
});

test("writer rejeita preço enviado pelo navegador", () => {
  for (const extra of [{ monthlyPrice: 149 }, { displayedValue: "R$ 1" }, { billingRule: "custom" }, { planName: "DGN Essential" }]) {
    assert.throws(() => validateFounderCurationPayload({ ...baseWrite, ...extra }),
      (error) => error instanceof FounderCurationWriteError && error.status === 400);
  }
});

test("filtro 'essential' bate apenas com clientes cujo recommendedPlanCode é essential", () => {
  assert.equal(normalizePlanCodeForFilter("essential"), "essential");
  assert.equal(normalizePlanCodeForFilter("smart"), "smart");
  assert.equal(normalizePlanCodeForFilter("priority"), "priority");
  assert.equal(normalizePlanCodeForFilter("smart-founder-semestral"), "smart");
  assert.equal(normalizePlanCodeForFilter("priority-founder-semestral"), "priority");
  assert.equal(normalizePlanCodeForFilter(""), "");
  assert.equal(normalizePlanCodeForFilter(null), "");
  assert.equal(normalizePlanCodeForFilter(undefined), "");
  assert.equal(normalizePlanCodeForFilter("essential_semestral"), "");
  assert.equal(normalizePlanCodeForFilter("Essential"), "");
});

test("score nunca sugere Essential automaticamente na base operacional", async () => {
  const source = await readFile(new URL("./growth/dgn-customers.json", import.meta.url), "utf8");
  const parsed = JSON.parse(source) as { recommendedPlan?: string }[];
  for (const customer of parsed) {
    assert.notEqual(customer.recommendedPlan, "Essential", "Essential não pode ser plano automático de nenhum cliente");
    assert.notEqual(customer.recommendedPlan, "DGN Essential");
  }
});

test("mapper de leitura mantém apenas Smart/Priority/Corporate Care como planos automáticos", async () => {
  const source = await readFile(new URL("./growth/db/growth-reader.ts", import.meta.url), "utf8");
  assert.match(source, /value === "Priority" \? "Priority" : value === "Corporate Care" \? "Corporate Care" : "Smart"/);
  assert.doesNotMatch(source, /"Essential"/);
});

test("Founders 001-003 permanecem intactos: sem migração forçada de código no cliente", async () => {
  const clients = JSON.parse(await readFile(new URL("./growth/dgn-customers.json", import.meta.url), "utf8")) as Array<{
    id: string;
    campaign?: { founderSelected?: boolean; founderNumber?: string; personalizedPagePath?: string };
  }>;
  const benedito = clients.find((c) => c.id === "benedito-constantino");
  const jose = clients.find((c) => c.id === "jose-moreira");
  const rikardo = clients.find((c) => c.id === "rikardo-oliveira");
  for (const founder of [benedito, jose, rikardo]) {
    assert.ok(founder, "Founder confirmado deve existir na base");
    assert.equal(founder.campaign?.founderSelected, true);
    assert.ok(founder.campaign?.founderNumber);
    assert.ok(founder.campaign?.personalizedPagePath);
  }
});

test("Iara mantém vaga Nº004 sem plano/modalidade automaticamente escolhidos", async () => {
  const clients = JSON.parse(await readFile(new URL("./growth/dgn-customers.json", import.meta.url), "utf8")) as Array<{
    id: string;
    recommendedPlan?: string;
    campaign?: { founderNumber?: string; founderSelected?: boolean };
  }>;
  const iara = clients.find((c) => c.id === "iara");
  assert.ok(iara);
  assert.equal(iara.campaign?.founderNumber, "004");
  assert.notEqual(iara.recommendedPlan, "Essential");
});

test("catálogo público oficial exclui nomes que combinem plano com modalidade", () => {
  for (const offer of founderOfferCatalog) {
    assert.doesNotMatch(offer.planName, /mensal|semestral|anual|trimestral|fidelidade/i,
      `planName '${offer.planName}' não pode misturar plano e modalidade`);
  }
});
