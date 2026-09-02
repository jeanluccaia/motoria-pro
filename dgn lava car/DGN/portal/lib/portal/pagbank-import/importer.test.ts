import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

import { loadPagBankFile } from "./parser.ts";
import {
  runPagBankImport,
  buildMatchIndexes,
  applyReconciledMappings,
  type ExistingSubscription,
} from "./importer.ts";
import { matchCustomer, normalizePhone, normalizeName, shouldAutoAccept } from "./matcher.ts";
import type { CustomerCandidate, PagBankSubscriptionInput } from "./types.ts";

const FIXTURE_PATH = resolve(import.meta.dirname, "fixtures/synthetic-batch.json");

const BASE_INPUT: Omit<PagBankSubscriptionInput, "provider_subscription_id" | "provider_customer_id" | "customer_name"> = {
  plan: "Smart",
  cycle: "mensal",
  amount_monthly: 130,
  status: "ACTIVE",
  payment_method: "CARD_RECURRING",
  payment_status: "CONFIRMED",
  payment_evidence_source: "PROVIDER",
  migration_status: "NOT_NEEDED",
};

function makeInput(
  overrides: Partial<PagBankSubscriptionInput> & Pick<PagBankSubscriptionInput, "provider_subscription_id" | "customer_name">,
): PagBankSubscriptionInput {
  return { ...BASE_INPUT, ...overrides } as PagBankSubscriptionInput;
}

// -----------------------------------------------------------------------------
// Parser + matcher
// -----------------------------------------------------------------------------

test("parser: fixture sintética carrega 13 contratos válidos", () => {
  const file = loadPagBankFile(FIXTURE_PATH);
  assert.equal(file.subscriptions.length, 13);
  assert.equal(file.meta.expected_customers, 11);
  assert.equal(file.meta.expected_contracts, 13);
});

test("parser: rejeita payment_status em minúsculo", () => {
  assert.throws(() =>
    (loadPagBankFile as unknown as (p: string) => unknown)(FIXTURE_PATH.replace(/\.json$/, "-nope.json")),
  );
});

test("matcher: reconciliation aprovada tem prioridade sobre provider_id", () => {
  const cand: CustomerCandidate = {
    id: "c-approved",
    name: "Cliente Aprovado",
    provider_customer_id: "PROV_1",
  };
  const other: CustomerCandidate = {
    id: "c-outro",
    name: "Outro",
    provider_customer_id: "PROV_1",
  };
  const idx = buildMatchIndexes([other]);
  applyReconciledMappings(idx, [
    { provider_customer_id: "PROV_1", crm_customer_id: cand.id, crm_customer_name: cand.name },
  ]);
  const r = matchCustomer(
    makeInput({
      provider_subscription_id: "S1",
      provider_customer_id: "PROV_1",
      customer_name: "outro nome",
    }),
    idx,
  );
  assert.equal(r.strategy, "reconciliation");
  assert.equal(r.candidate?.id, "c-approved");
  assert.equal(r.confidence, 1);
});

test("matcher: provider_customer_id no CRM tem prioridade sobre nome", () => {
  const cand: CustomerCandidate = {
    id: "c1",
    name: "X",
    provider_customer_id: "PROV_1",
  };
  const idx = buildMatchIndexes([cand]);
  const r = matchCustomer(
    makeInput({
      provider_subscription_id: "S1",
      provider_customer_id: "PROV_1",
      customer_name: "outro nome",
    }),
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
    makeInput({
      provider_subscription_id: "S",
      customer_name: "outro",
      customer_phone: "+5519999990002",
    }),
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
    makeInput({
      provider_subscription_id: "S",
      customer_name: "José Sergio Teste",
    }),
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
    makeInput({
      provider_subscription_id: "S",
      customer_name: "João Silva",
    }),
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

// -----------------------------------------------------------------------------
// Runner
// -----------------------------------------------------------------------------

test("dry_run (CRM vazio): 13 rows → 13 pending_reconciliation, 0 create_customer", () => {
  const file = loadPagBankFile(FIXTURE_PATH);
  const summary = runPagBankImport({ file, sourceLabel: "fixture" });

  assert.equal(summary.mode, "dry_run");
  assert.equal(summary.totals.input_rows, 13);
  assert.equal(summary.totals.pending_reconciliation_rows, 13);
  assert.equal(summary.totals.pending_reconciliation_customers, 11);
  assert.equal(summary.totals.matched, 0);
  assert.equal(summary.totals.duplicates, 0);
  assert.equal(summary.totals.subscriptions_would_create, 13);
  assert.equal(summary.totals.total_amount_monthly, 1730);
  assert.equal(summary.totals.unique_provider_customers, 11);

  // NUNCA emitir create_customer no P0.
  for (const r of summary.rows) {
    for (const a of r.actions) {
      assert.notEqual((a as { kind: string }).kind, "create_customer");
    }
  }
});

test("batch dedupe: 2 rows com mesmo provider_customer_id contam como 1 customer PagBank", () => {
  const file = loadPagBankFile(FIXTURE_PATH);
  const summary = runPagBankImport({ file });
  // 11 provider_customer_ids únicos entre 13 rows (José×2 + David×2 + 9 singles).
  assert.equal(summary.totals.unique_provider_customers, 11);
});

test("financial_review batch-aware: David (2 subs, sem placa, sem estado CRM) dispara flag", () => {
  const file = loadPagBankFile(FIXTURE_PATH);
  const summary = runPagBankImport({ file });
  const davidRows = summary.rows.filter((r) => r.input.customer_name === "David Teste");
  assert.equal(davidRows.length, 2);
  for (const r of davidRows) {
    const flag = r.actions.find((a) => a.kind === "flag_financial_review");
    assert.ok(flag, "esperado flag_financial_review em cada row do David");
  }
  assert.equal(summary.totals.financial_reviews_flagged, 1); // 1 customer PagBank flagged
});

test("José (2 subs, com placas distintas) NÃO dispara financial_review", () => {
  const file = loadPagBankFile(FIXTURE_PATH);
  const summary = runPagBankImport({ file });
  const joseRows = summary.rows.filter((r) => r.input.customer_name === "José Sergio Teste");
  assert.equal(joseRows.length, 2);
  for (const r of joseRows) {
    for (const a of r.actions) {
      assert.notEqual(
        a.kind,
        "flag_financial_review",
        "José-like com placas distintas não deve flag",
      );
    }
  }
});

test("Snapshot real-like (sem placas): 2 subs mesmo provider_customer_id disparam review batch-aware", () => {
  const file = {
    meta: { generated_at: "2026-09-01", source: "test" },
    subscriptions: [
      makeInput({
        provider_subscription_id: "S_A",
        provider_customer_id: "CUST_X",
        customer_name: "Cliente X",
      }),
      makeInput({
        provider_subscription_id: "S_B",
        provider_customer_id: "CUST_X",
        customer_name: "Cliente X",
      }),
    ],
  };
  const summary = runPagBankImport({ file });
  assert.equal(summary.totals.financial_reviews_flagged, 1);
  for (const r of summary.rows) {
    const flag = r.actions.find((a) => a.kind === "flag_financial_review");
    assert.ok(flag);
  }
});

test("reconciliation aprovada: pending_reconciliation vira matched com confidence 1", () => {
  const file = {
    meta: { generated_at: "2026-09-01", source: "test" },
    subscriptions: [
      makeInput({
        provider_subscription_id: "S_A",
        provider_customer_id: "CUST_X",
        customer_name: "Cliente X",
      }),
    ],
  };
  const crmCandidate: CustomerCandidate = { id: "crm-x", name: "Cliente X Diferente" };
  const idx = buildMatchIndexes([]);
  applyReconciledMappings(idx, [
    {
      provider_customer_id: "CUST_X",
      crm_customer_id: crmCandidate.id,
      crm_customer_name: crmCandidate.name,
    },
  ]);
  const summary = runPagBankImport({ file, indexes: idx });
  assert.equal(summary.totals.matched, 1);
  assert.equal(summary.totals.pending_reconciliation_rows, 0);
  const row = summary.rows[0]!;
  assert.equal(row.outcome, "matched");
  assert.equal(row.match.strategy, "reconciliation");
  const link = row.actions.find((a) => a.kind === "link_existing_customer");
  assert.ok(link);
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
