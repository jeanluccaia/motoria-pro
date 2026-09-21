import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SubscriptionsWriteError,
  cancelSubscription,
  createSubscription,
  dbCycleToModality,
  editSubscription,
  listSubscriptions,
  modalityToDbCycle,
} from "./subscriptions-write.ts";

// -----------------------------------------------------------------------------
// Testes do editor manual de assinaturas (FASE 1 do plano do Digo).
// Fake mínimo do SupabaseClient — reaproveita padrão do appointments-write.test.
// Cobre:
//   1. mapeamento modalidade UI ↔ enum DB
//   2. list mapeia crm_subscriptions e sinaliza pagBankLocked
//   3. create manual chama RPC crm_create_manual_subscription com dgn-admin
//   4. create manual bloqueia plano inválido e modalidade não-oficial
//   5. edit rejeita reason vazia
//   6. edit devolve erro amigável quando RPC bloqueia PagBank
//   7. cancel devolve erro amigável quando RPC bloqueia PagBank
//   8. cancel rejeita motivo vazio
//   9. listSubscriptions rejeita cliente inexistente com erro do resolver
//  10. slug/legacy_id vira UUID via resolveCustomerId antes da RPC
//  11. paymentEvidenceSource='provider' é sempre rejeitado (create + edit)
// -----------------------------------------------------------------------------

interface CustomerRow { id: string; legacy_id: string | null }
interface VehicleRow { id: string; customer_id: string }
interface SubRow {
  id: string;
  customer_id: string;
  subscription_plan: string;
  subscription_cycle: string;
  subscription_status: string;
  is_active_subscriber: boolean;
  subscription_source: string;
  payment_method: string;
  payment_status: string;
  payment_evidence_source: string;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  cycle_ends_at: string | null;
  next_due_date: string | null;
  vehicle_id: string | null;
  source_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface State {
  customers: CustomerRow[];
  vehicles: VehicleRow[];
  subscriptions: SubRow[];
  rpcCalls: Array<{ fn: string; args: Record<string, unknown> }>;
  rpcResponses: Record<string, { data?: unknown; error?: { message: string } | null }>;
}

function buildFake(state: State): SupabaseClient {
  const makeBuilder = <T>(rows: T[]) => {
    const filters: Array<{ column: string; value: unknown }> = [];
    let wantSingle = false;
    let wantMaybe = false;
    let orderCol: string | null = null;
    let orderAsc = true;

    const runSelect = () => {
      let filtered = rows.slice();
      for (const f of filters) filtered = filtered.filter((r) => (r as Record<string, unknown>)[f.column] === f.value);
      if (orderCol) {
        filtered.sort((a, b) => {
          const av = (a as Record<string, unknown>)[orderCol!];
          const bv = (b as Record<string, unknown>)[orderCol!];
          if (av === bv) return 0;
          return (av! > bv! ? 1 : -1) * (orderAsc ? 1 : -1);
        });
      }
      if (wantMaybe) return { data: (filtered[0] ?? null) as unknown, error: null };
      if (wantSingle) {
        if (filtered.length !== 1) return { data: null, error: { message: "not single", code: "PGRST116" } };
        return { data: filtered[0] as unknown, error: null };
      }
      return { data: filtered as unknown, error: null };
    };

    const finish = () => Promise.resolve(runSelect());

    const chain: Record<string, unknown> = {
      select() { return chain; },
      eq(column: string, value: unknown) { filters.push({ column, value }); return chain; },
      order(column: string, opts?: { ascending?: boolean }) { orderCol = column; orderAsc = opts?.ascending !== false; return chain; },
      maybeSingle() { wantMaybe = true; return finish(); },
      single() { wantSingle = true; return finish(); },
      then(resolve: (v: unknown) => unknown) { return finish().then(resolve); },
    };
    return chain;
  };

  const client = {
    from(table: string) {
      if (table === "crm_customers") return { select: () => makeBuilder(state.customers) };
      if (table === "crm_vehicles") return { select: () => makeBuilder(state.vehicles) };
      if (table === "crm_subscriptions") return { select: () => makeBuilder(state.subscriptions) };
      throw new Error(`fake: tabela ${table} n/i`);
    },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      state.rpcCalls.push({ fn, args });
      return state.rpcResponses[fn] ?? { data: null, error: null };
    },
  } as unknown as SupabaseClient;

  return client;
}

function baseState(): State {
  return {
    customers: [
      { id: "11111111-1111-1111-1111-111111111111", legacy_id: "digo-cliente" },
      { id: "22222222-2222-2222-2222-222222222222", legacy_id: "outro" },
    ],
    vehicles: [
      { id: "aaaa1111-1111-1111-1111-111111111111", customer_id: "11111111-1111-1111-1111-111111111111" },
      { id: "bbbb2222-2222-2222-2222-222222222222", customer_id: "22222222-2222-2222-2222-222222222222" },
    ],
    subscriptions: [
      {
        id: "sub-manual",
        customer_id: "11111111-1111-1111-1111-111111111111",
        subscription_plan: "Smart",
        subscription_cycle: "mensal",
        subscription_status: "ativo",
        is_active_subscriber: true,
        subscription_source: "Manual",
        payment_method: "manual",
        payment_status: "unknown",
        payment_evidence_source: "manual",
        provider_customer_id: null,
        provider_subscription_id: null,
        cycle_ends_at: null,
        next_due_date: null,
        vehicle_id: null,
        source_reference: "Manual admin",
        notes: null,
        created_at: "2026-09-01T00:00:00.000Z",
        updated_at: "2026-09-01T00:00:00.000Z",
      },
      {
        id: "sub-pagbank",
        customer_id: "11111111-1111-1111-1111-111111111111",
        subscription_plan: "Priority",
        subscription_cycle: "anual",
        subscription_status: "ativo",
        is_active_subscriber: true,
        subscription_source: "Importação",
        payment_method: "card_recurring",
        payment_status: "confirmed",
        payment_evidence_source: "provider",
        provider_customer_id: "cust-pagbank-1",
        provider_subscription_id: "sub-pagbank-1",
        cycle_ends_at: "2026-12-31T23:59:59.000Z",
        next_due_date: "2026-10-05",
        vehicle_id: "aaaa1111-1111-1111-1111-111111111111",
        source_reference: "PagBank recurring",
        notes: null,
        created_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-09-01T00:00:00.000Z",
      },
    ],
    rpcCalls: [],
    rpcResponses: {},
  };
}

// 1: mapeamento modalidade ↔ enum
test("modality ↔ db cycle mapping segue termos oficiais", () => {
  assert.equal(modalityToDbCycle("Mensal"), "mensal");
  assert.equal(modalityToDbCycle("Fidelidade de 6 meses"), "semestral");
  assert.equal(modalityToDbCycle("Fidelidade de 12 meses"), "anual");
  assert.equal(modalityToDbCycle(null), "não identificado");
  assert.throws(() => modalityToDbCycle("Semestral"), SubscriptionsWriteError);
  assert.throws(() => modalityToDbCycle("Anual"), SubscriptionsWriteError);

  assert.equal(dbCycleToModality("mensal"), "Mensal");
  assert.equal(dbCycleToModality("semestral"), "Fidelidade de 6 meses");
  assert.equal(dbCycleToModality("anual"), "Fidelidade de 12 meses");
  assert.equal(dbCycleToModality("outro"), "Outra");
  assert.equal(dbCycleToModality("não identificado"), "Outra");
});

// 2 + 10: list mapeia sinal PagBank e resolve slug/legacy_id → UUID
test("list: mapeia PagBank locked e resolve legacy_id → UUID", async () => {
  const state = baseState();
  const db = buildFake(state);
  const rows = await listSubscriptions("digo-cliente", db);
  assert.equal(rows.length, 2);
  const manual = rows.find((r) => r.id === "sub-manual")!;
  const pagbank = rows.find((r) => r.id === "sub-pagbank")!;
  assert.equal(manual.pagBankLocked, false);
  assert.equal(manual.modality, "Mensal");
  assert.equal(pagbank.pagBankLocked, true);
  assert.equal(pagbank.modality, "Fidelidade de 12 meses");
});

// 9: cliente inexistente → erro do resolver
test("list: cliente inexistente devolve erro 404", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => listSubscriptions("cliente-que-nao-existe", db),
    (err: unknown) => err instanceof SubscriptionsWriteError && err.status === 404,
  );
});

// 3: create manual chama RPC com args certos
test("create: chama crm_create_manual_subscription com args corretos", async () => {
  const state = baseState();
  state.rpcResponses.crm_create_manual_subscription = {
    data: [{ result_code: "CREATED", subscription_id: "new-sub-uuid" }],
    error: null,
  };
  const db = buildFake(state);
  const result = await createSubscription({
    customerId: "digo-cliente",
    plan: "Priority",
    modality: "Fidelidade de 6 meses",
    vehicleId: "aaaa1111-1111-1111-1111-111111111111",
    cycleEndsAt: "2027-03-21T23:59:59.000Z",
    sourceReference: "Novo contrato manual",
    notes: "obs",
    actor: "dgn-admin",
    db,
  });
  assert.equal(result.resultCode, "CREATED");
  assert.equal(result.subscriptionId, "new-sub-uuid");
  const call = state.rpcCalls.find((c) => c.fn === "crm_create_manual_subscription")!;
  assert.equal(call.args.p_customer_id, "11111111-1111-1111-1111-111111111111");
  assert.equal(call.args.p_plan, "Priority");
  assert.equal(call.args.p_cycle, "semestral"); // modalidade "Fidelidade de 6 meses" → semestral
  assert.equal(call.args.p_vehicle_id, "aaaa1111-1111-1111-1111-111111111111");
  assert.equal(call.args.p_source_reference, "Novo contrato manual");
  assert.equal(call.args.p_actor, "dgn-admin");
});

// 4: create rejeita plano inválido
test("create: plano inválido → 400", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => createSubscription({
      customerId: "digo-cliente",
      plan: "Trimestral",
      modality: "Mensal",
      sourceReference: "x",
      actor: "dgn-admin",
      db,
    }),
    (err: unknown) => err instanceof SubscriptionsWriteError && err.status === 400,
  );
});

// 4b: create rejeita modalidade não oficial
test("create: modalidade não oficial → 400 (Semestral bloqueada por dgn-plans)", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => createSubscription({
      customerId: "digo-cliente",
      plan: "Smart",
      modality: "Semestral",
      sourceReference: "x",
      actor: "dgn-admin",
      db,
    }),
    (err: unknown) => err instanceof SubscriptionsWriteError && err.status === 400,
  );
});

// 4c: sourceReference obrigatório
test("create: sem sourceReference → 400", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => createSubscription({
      customerId: "digo-cliente",
      plan: "Smart",
      modality: "Mensal",
      sourceReference: "",
      actor: "dgn-admin",
      db,
    }),
    (err: unknown) => err instanceof SubscriptionsWriteError && err.status === 400,
  );
});

// 4d: veículo de outro customer → 403
test("create: veículo de outro customer → 403", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => createSubscription({
      customerId: "digo-cliente",
      plan: "Smart",
      modality: "Mensal",
      vehicleId: "bbbb2222-2222-2222-2222-222222222222",
      sourceReference: "x",
      actor: "dgn-admin",
      db,
    }),
    (err: unknown) => err instanceof SubscriptionsWriteError && err.status === 403,
  );
});

// 11a: create rejeita evidence=provider
test("create: paymentEvidenceSource=provider → 400", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => createSubscription({
      customerId: "digo-cliente",
      plan: "Smart",
      modality: "Mensal",
      sourceReference: "x",
      paymentEvidenceSource: "provider" as unknown as "manual",
      actor: "dgn-admin",
      db,
    }),
    (err: unknown) => err instanceof SubscriptionsWriteError && err.status === 400,
  );
});

// 5: edit sem motivo → 400
test("edit: sem reason → 400", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => editSubscription({
      customerId: "digo-cliente",
      subscriptionId: "sub-manual",
      reason: "",
      actor: "dgn-admin",
      db,
    }),
    (err: unknown) => err instanceof SubscriptionsWriteError && err.status === 400,
  );
});

// 6: edit devolve erro amigável quando Postgres bloqueia PagBank
test("edit: RPC bloqueia PagBank → 409 amigável", async () => {
  const state = baseState();
  state.rpcResponses.crm_edit_manual_subscription = {
    data: null,
    error: { message: "subscription X é vinculada a provider (customer=..., sub=...); edição manual bloqueada" },
  };
  const db = buildFake(state);
  await assert.rejects(
    () => editSubscription({
      customerId: "digo-cliente",
      subscriptionId: "sub-pagbank",
      reason: "tentar alterar",
      actor: "dgn-admin",
      db,
    }),
    (err: unknown) => err instanceof SubscriptionsWriteError && err.status === 409 && /PagBank/i.test(err.message),
  );
});

// 6b: edit chama RPC com dgn-admin e reason
test("edit: chama crm_edit_manual_subscription com args certos", async () => {
  const state = baseState();
  state.rpcResponses.crm_edit_manual_subscription = {
    data: [{ result_code: "UPDATED", subscription_id: "sub-manual" }],
    error: null,
  };
  const db = buildFake(state);
  const result = await editSubscription({
    customerId: "digo-cliente",
    subscriptionId: "sub-manual",
    reason: "Cliente pediu upgrade Priority",
    plan: "Priority",
    modality: "Mensal",
    actor: "dgn-admin",
    db,
  });
  assert.equal(result.resultCode, "UPDATED");
  const call = state.rpcCalls.find((c) => c.fn === "crm_edit_manual_subscription")!;
  assert.equal(call.args.p_subscription_id, "sub-manual");
  assert.equal(call.args.p_expected_customer_id, "11111111-1111-1111-1111-111111111111");
  assert.equal(call.args.p_reason, "Cliente pediu upgrade Priority");
  assert.equal(call.args.p_plan, "Priority");
  assert.equal(call.args.p_cycle, "mensal");
});

// 11b: edit rejeita evidence=provider antes de chamar RPC
test("edit: paymentEvidenceSource=provider → 400", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => editSubscription({
      customerId: "digo-cliente",
      subscriptionId: "sub-manual",
      reason: "x",
      paymentEvidenceSource: "provider" as unknown as "manual",
      actor: "dgn-admin",
      db,
    }),
    (err: unknown) => err instanceof SubscriptionsWriteError && err.status === 400,
  );
  // Não chegou a chamar RPC
  assert.equal(state.rpcCalls.length, 0);
});

// 7: cancel bloqueado por PagBank vira 409 amigável
test("cancel: RPC bloqueia PagBank → 409 amigável", async () => {
  const state = baseState();
  state.rpcResponses.crm_cancel_manual_subscription = {
    data: null,
    error: { message: "subscription X é vinculada a provider (customer=..., sub=...); cancelamento manual bloqueado" },
  };
  const db = buildFake(state);
  await assert.rejects(
    () => cancelSubscription({
      customerId: "digo-cliente",
      subscriptionId: "sub-pagbank",
      reason: "tentar cancelar",
      actor: "dgn-admin",
      db,
    }),
    (err: unknown) => err instanceof SubscriptionsWriteError && err.status === 409 && /PagBank/i.test(err.message),
  );
});

// 8: cancel sem motivo → 400 antes de tocar RPC
test("cancel: sem reason → 400 sem RPC", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => cancelSubscription({
      customerId: "digo-cliente",
      subscriptionId: "sub-manual",
      reason: "  ",
      actor: "dgn-admin",
      db,
    }),
    (err: unknown) => err instanceof SubscriptionsWriteError && err.status === 400,
  );
  assert.equal(state.rpcCalls.length, 0);
});

// 8b: cancel manual OK
test("cancel: OK chama RPC com args e devolve CANCELLED", async () => {
  const state = baseState();
  state.rpcResponses.crm_cancel_manual_subscription = {
    data: [{ result_code: "CANCELLED", subscription_id: "sub-manual" }],
    error: null,
  };
  const db = buildFake(state);
  const result = await cancelSubscription({
    customerId: "digo-cliente",
    subscriptionId: "sub-manual",
    reason: "Cliente pediu encerramento",
    actor: "dgn-admin",
    db,
  });
  assert.equal(result.resultCode, "CANCELLED");
  const call = state.rpcCalls.find((c) => c.fn === "crm_cancel_manual_subscription")!;
  assert.equal(call.args.p_subscription_id, "sub-manual");
  assert.equal(call.args.p_expected_customer_id, "11111111-1111-1111-1111-111111111111");
  assert.equal(call.args.p_reason, "Cliente pediu encerramento");
  assert.equal(call.args.p_actor, "dgn-admin");
});
