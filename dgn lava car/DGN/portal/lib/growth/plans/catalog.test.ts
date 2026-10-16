import test from "node:test";
import assert from "node:assert/strict";
import { DGN_SUBSCRIBER_PLANS, DGN_BILLING_MODALITIES, DGN_FORBIDDEN_MODALITIES } from "../dgn-plans.ts";
import { DGN_PLAN_CATALOG, listPlanOffers, getPlanOffer, formatPlanPrice, resolvePreselectedPlan } from "./catalog.ts";

test("catálogo cobre exatamente os 3 planos oficiais e nada mais", () => {
  const keys = Object.keys(DGN_PLAN_CATALOG).sort();
  assert.deepEqual(keys, [...DGN_SUBSCRIBER_PLANS].sort());
  assert.equal(listPlanOffers().length, 3);
});

test("lavagens incluídas por mês batem com a regra oficial 1/2/4", () => {
  assert.equal(DGN_PLAN_CATALOG.Essential.washesPerMonth, 1);
  assert.equal(DGN_PLAN_CATALOG.Smart.washesPerMonth, 2);
  assert.equal(DGN_PLAN_CATALOG.Priority.washesPerMonth, 4);
});

test("nenhuma modalidade proibida (Semestral/Anual/Trimestral) vaza para o catálogo", () => {
  for (const entry of listPlanOffers()) {
    for (const modality of entry.modalities) {
      assert.ok(
        (DGN_BILLING_MODALITIES as readonly string[]).includes(modality),
        `modalidade ${modality} do plano ${entry.plan} não é oficial`,
      );
      assert.ok(
        !(DGN_FORBIDDEN_MODALITIES as readonly string[]).includes(modality),
        `modalidade ${modality} do plano ${entry.plan} está na lista proibida`,
      );
    }
  }
});

test("preço vem como 'Sob consulta operacional' enquanto operação não injetou valor", () => {
  for (const entry of listPlanOffers()) {
    assert.equal(entry.priceMonthlyBRL, null, `plano ${entry.plan} não deve ter preço hardcoded`);
    assert.equal(formatPlanPrice(entry), "Sob consulta operacional");
  }
});

test("formatPlanPrice formata BRL quando operação injeta número", () => {
  const injected = { ...DGN_PLAN_CATALOG.Priority, priceMonthlyBRL: 210 };
  const label = formatPlanPrice(injected);
  assert.match(label, /R\$\s?210,00\/mês/);
});

test("getPlanOffer recusa plano fora da lista oficial (defesa contra typo/query injection)", () => {
  assert.equal(getPlanOffer("Priority")?.plan, "Priority");
  assert.equal(getPlanOffer("Corporate Care"), null, "Corporate Care é plano B2B, não oferta DGN padrão");
  assert.equal(getPlanOffer("Semestral"), null);
  assert.equal(getPlanOffer(""), null);
  assert.equal(getPlanOffer("<script>"), null);
});

test("benefícios de cada plano citam a quantidade correta de lavagens — zero drift texto × regra", () => {
  assert.ok(DGN_PLAN_CATALOG.Essential.benefits.some((b) => /1\s+lavagem/i.test(b)));
  assert.ok(DGN_PLAN_CATALOG.Smart.benefits.some((b) => /2\s+lavagens/i.test(b)));
  assert.ok(DGN_PLAN_CATALOG.Priority.benefits.some((b) => /4\s+lavagens/i.test(b)));
});

test("resolvePreselectedPlan aceita planos oficiais e cai no fallback para qualquer outra coisa", () => {
  assert.equal(resolvePreselectedPlan("Priority"), "Priority");
  assert.equal(resolvePreselectedPlan("Smart"), "Smart");
  assert.equal(resolvePreselectedPlan("Essential"), "Essential");
  // Nunca throw em input absurdo:
  assert.equal(resolvePreselectedPlan(null), "Smart");
  assert.equal(resolvePreselectedPlan(undefined), "Smart");
  assert.equal(resolvePreselectedPlan(""), "Smart");
  assert.equal(resolvePreselectedPlan("priority"), "Smart", "case-sensitive — defesa contra link antigo");
  assert.equal(resolvePreselectedPlan("Corporate Care"), "Smart", "não é oferta DGN padrão");
  assert.equal(resolvePreselectedPlan("Semestral"), "Smart");
  assert.equal(resolvePreselectedPlan({ foo: 1 }), "Smart");
  // Fallback custom (caso a UI queira default Priority em algum lugar):
  assert.equal(resolvePreselectedPlan("xyz", "Priority"), "Priority");
});
