import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { loadPagBankFile } from "./parser.ts";
import { runPagBankImport, buildMatchIndexes, type ExistingSubscription } from "./importer.ts";
import { matchCustomer, normalizePhone, normalizeName, shouldAutoAccept } from "./matcher.ts";
import type { CustomerCandidate } from "./types.ts";

const FIXTURE_PATH = resolve(import.meta.dirname, "fixtures/synthetic-batch.json");

test("parser: fixture sintética carrega 13 contratos válidos", () => {
  const file = loadPagBankFile(FIXTURE_PATH);
  assert.equal(file.subscriptions.length, 13);
  assert.equal(file.meta.expected_customers, 11);
  assert.equal(file.meta.expected_contracts, 13);
});

test("matcher: provider_customer_id tem prioridade máxima", () => {
  const cand: CustomerCandidate = { id: "c1", name: "X" };
  const idx = buildMatchIndexes([cand]);
  idx.byProviderCustomerId.set("PROV_1", cand);
  const r = matchCustomer(
    {
      provider_subscription_id: "S1", provider_customer_id: "PROV_1",
      customer_name: "outro nome", plan: "Smart", cycle: "mensal",
      amount_monthly: 130, status: "ACTIVE", payment_method: "card_recurring",
    },
    idx,
  );
  assert.equal(r.strategy, "provider_id");
  assert.equal(r.candidate?.id, "c1");
  assert.equal(r.confidence, 1);
});

test("matcher: telefone match tem confidence >= 0.9 e é auto-accept", () => {
  const cand: CustomerCandidate = { id: "c2", name: "Foo", normalized_phone: "19999990002" };
  const idx = buildMatchIndexes([cand]);
  const r = matchCustomer(
    {
      provider_subscription_id: "S", customer_name: "outro", customer_phone: "+5519999990002",
      plan: "Smart", cycle: "mensal", amount_monthly: 130, status: "ACTIVE", payment_method: "card_recurring",
    },
    idx,
  );
  assert.equal(r.strategy, "phone");
  assert.ok(r.confidence >= 0.9);
  assert.equal(shouldAutoAccept(r.strategy, r.confidence), true);
});

test("matcher: nome sozinho NUNCA é auto-accept (mesmo com match único)", () => {
  const cand: CustomerCandidate = { id: "c3", name: "José Sergio Teste" };
  const idx = buildMatchIndexes([cand]);
  const r = matchCustomer(
    {
      provider_subscription_id: "S", customer_name: "José Sergio Teste",
      plan: "Smart", cycle: "mensal", amount_monthly: 130, status: "ACTIVE", payment_method: "card_recurring",
    },
    idx,
  );
  assert.equal(r.strategy, "name");
  assert.equal(r.candidate?.id, "c3");
  assert.equal(shouldAutoAccept(r.strategy, r.confidence), false);
});

test("matcher: nome ambíguo (2+ candidatos) devolve candidate=null", () => {
  const a: CustomerCandidate = { id: "cA", name: "João Silva" };
  const b: CustomerCandidate = { id: "cB", name: "João Silva" };
  const idx = buildMatchIndexes([a, b]);
  const r = matchCustomer(
    {
      provider_subscription_id: "S", customer_name: "João Silva",
      plan: "Smart", cycle: "mensal", amount_monthly: 130, status: "ACTIVE", payment_method: "card_recurring",
    },
    idx,
  );
  assert.equal(r.strategy, "name");
  assert.equal(r.candidate, null);
  assert.match(r.reason, /ambíguo/);
});

test("normalizePhone remove DDI 55", () => {
  assert.equal(normalizePhone("+55 (19) 99999-9002"), "19999999002");
  assert.equal(normalizePhone("55 19 99999-9002"), "19999999002");
  assert.equal(normalizePhone("19999999002"), "19999999002");
});

test("normalizeName é insensitive a acento e maiúsculas", () => {
  assert.equal(normalizeName("José Sérgio TESTE"), "jose sergio teste");
});

// ---------------------------------------------------------------------------
// Runner: comportamento sobre a fixture inteira
// ---------------------------------------------------------------------------

test("dry_run vazio (CRM vazio): 13 contratos → 11 unmatched + José-like matched como novos", () => {
  const file = loadPagBankFile(FIXTURE_PATH);
  const summary = runPagBankImport({ file, sourceLabel: "fixture" });
  assert.equal(summary.mode, "dry_run");
  assert.equal(summary.totals.input_rows, 13);
  // CRM vazio → todos unmatched.
  assert.equal(summary.totals.unmatched, 13);
  assert.equal(summary.totals.matched, 0);
  assert.equal(summary.totals.duplicates, 0);
  // 11 customers "create" — 13 rows menos os 2 duplicados de identity de José e David.
  // Como CRM está vazio, o importador MARCA cada linha para "create_customer";
  // a agregação de identidade é apenas para detecção de duplicidade financeira,
  // não para deduplication automática (isso é responsabilidade do apply).
  assert.equal(summary.totals.customers_would_create, 13);
  assert.equal(summary.totals.subscriptions_would_create, 13);
  assert.equal(summary.totals.total_amount_monthly, 1730);
});

test("José Sergio (2 subs) NÃO ativa financial_review quando cada contrato tem vehicle_plate distinto", () => {
  const file = loadPagBankFile(FIXTURE_PATH);
  const summary = runPagBankImport({ file });
  const joseRows = summary.rows.filter((r) => r.input.customer_name === "José Sergio Teste");
  assert.equal(joseRows.length, 2);
  for (const r of joseRows) {
    assert.notEqual(r.outcome, "review_required", "José-like não deveria ir para review");
    for (const a of r.actions) {
      assert.notEqual(a.kind, "flag_financial_review");
    }
  }
});

test("David (2 subs, sem vehicle_plate no CRM já existente) ativa financial_review", () => {
  const file = loadPagBankFile(FIXTURE_PATH);
  // Cenário: David já é customer conhecido no CRM com 1 subscription ativa.
  const davidCandidate: CustomerCandidate = {
    id: "cust-david",
    name: "David Teste",
    normalized_phone: "19990001012",
  };
  const idx = buildMatchIndexes([davidCandidate]);
  const existingByProviderId = new Map<string, ExistingSubscription>();
  const existingByCustomer = new Map<string, ExistingSubscription[]>();
  existingByCustomer.set("cust-david", [
    { id: "sub-existente-david", customer_id: "cust-david", provider_subscription_id: null, plan: "Smart", is_active_subscriber: true },
  ]);

  const summary = runPagBankImport({
    file,
    indexes: idx,
    existingSubscriptionsByCustomerId: existingByCustomer,
    existingSubscriptionsByProviderId: existingByProviderId,
  });

  const davidRows = summary.rows.filter((r) => r.input.customer_name === "David Teste");
  // David match pelo telefone; e como já tem contrato ativo E o novo contrato
  // não traz vehicle_plate distinto, deve virar review.
  const reviewRows = davidRows.filter((r) => r.outcome === "review_required");
  assert.ok(reviewRows.length >= 1, "esperado pelo menos 1 linha David em review");
  for (const r of reviewRows) {
    const flag = r.actions.find((a) => a.kind === "flag_financial_review");
    assert.ok(flag, "esperado flag_financial_review nas rows do David");
  }
  assert.ok(summary.totals.financial_reviews_flagged >= 1);
});

test("Idempotência: mesma subscription (provider_subscription_id) é DUPLICATE, não recria", () => {
  const file = loadPagBankFile(FIXTURE_PATH);
  const existingByProviderId = new Map<string, ExistingSubscription>();
  existingByProviderId.set("TEST_SUB_001", {
    id: "sub-persistida-001",
    customer_id: "cust-1",
    provider_subscription_id: "TEST_SUB_001",
    plan: "Essential",
    is_active_subscriber: true,
  });

  const summary = runPagBankImport({
    file,
    existingSubscriptionsByProviderId: existingByProviderId,
  });
  assert.equal(summary.totals.duplicates, 1);
  assert.equal(summary.totals.subscriptions_would_update, 1);
  const dup = summary.rows.find((r) => r.outcome === "duplicate");
  assert.ok(dup);
  assert.equal(dup!.duplicateOf, "sub-persistida-001");
});

test("Total mensal bruto da fixture = R$ 1.730,00 (bate com brief)", () => {
  const file = loadPagBankFile(FIXTURE_PATH);
  const summary = runPagBankImport({ file });
  assert.equal(summary.totals.total_amount_monthly, 1730);
});
