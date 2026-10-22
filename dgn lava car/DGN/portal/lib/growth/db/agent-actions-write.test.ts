import { test } from "node:test";
import assert from "node:assert/strict";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createAgentAction,
  approveAgentAction,
  rejectAgentAction,
  markAgentActionExecuted,
  AgentActionsWriteError,
} from "./agent-actions-write.ts";

// ---------------------------------------------------------------------------
// Mock mínimo de SupabaseClient — captura chamadas rpc() e retorna rows.
// Toda a lógica de dedupe / transições vive na RPC SECURITY DEFINER (testada
// via migrations locais em outra etapa). Aqui a camada TS tem contrato bem
// menor: valida inputs, mapeia parâmetros snake_case, interpreta result_code
// textual estável. É esse contrato que os testes abaixo blindam.
// ---------------------------------------------------------------------------

interface RpcCall {
  fn: string;
  params: Record<string, unknown>;
}

function makeDb(rpcHandler: (fn: string, params: Record<string, unknown>) => { data: unknown; error: unknown }) {
  const calls: RpcCall[] = [];
  const db = {
    rpc: async (fn: string, params: Record<string, unknown>) => {
      calls.push({ fn, params });
      return rpcHandler(fn, params);
    },
  } as unknown as SupabaseClient;
  return { db, calls };
}

// ---------------------------------------------------------------------------
// createAgentAction — validação local (actor / source_tool / title / etc.)
// ---------------------------------------------------------------------------

test("createAgentAction exige actor não-vazio (defesa client-side)", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  await assert.rejects(
    () =>
      createAgentAction({
        kind: "opportunity",
        title: "t", reason: "r", recommendation: "rec",
        sourceTool: "record_opportunity",
        actor: "   ",
        db,
      }),
    (err: unknown) => err instanceof AgentActionsWriteError && err.status === 400,
  );
});

test("createAgentAction exige sourceTool não-vazio", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  await assert.rejects(
    () =>
      createAgentAction({
        kind: "opportunity",
        title: "t", reason: "r", recommendation: "rec",
        sourceTool: "   ",
        actor: "dgn-agent",
        db,
      }),
    (err: unknown) => err instanceof AgentActionsWriteError && err.status === 400,
  );
});

test("createAgentAction exige title/reason/recommendation não-vazios", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  const base = { kind: "opportunity" as const, sourceTool: "record_opportunity", actor: "dgn-agent", db };
  await assert.rejects(() => createAgentAction({ ...base, title: "", reason: "r", recommendation: "rec" }));
  await assert.rejects(() => createAgentAction({ ...base, title: "t", reason: "   ", recommendation: "rec" }));
  await assert.rejects(() => createAgentAction({ ...base, title: "t", reason: "r", recommendation: "" }));
});

test("createAgentAction mapeia inputs camelCase para p_* snake_case da RPC", async () => {
  const { db, calls } = makeDb(() => ({
    data: [{ result_code: "CREATED", action_id: "a-1", existing_action_id: null }],
    error: null,
  }));
  await createAgentAction({
    kind: "opportunity",
    title: "Upgrade",
    reason: "Alto score",
    recommendation: "Oferecer Priority",
    sourceTool: "record_opportunity",
    actor: "dgn-agent",
    targetCustomerId: "uuid-1",
    nextStep: "Agendar atendimento",
    expectedBenefit: "+R$ 90/mês",
    payload: { score: 85 },
    dedupeKey: "upgrade_priority_30d",
    expiresAt: "2026-11-01T00:00:00Z",
    sourceRunId: "run-123",
    targetCampaignId: null,
    db,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.fn, "agent_action_create");
  const p = calls[0]!.params;
  assert.equal(p.p_kind, "opportunity");
  assert.equal(p.p_target_customer_id, "uuid-1");
  assert.equal(p.p_title, "Upgrade");
  assert.equal(p.p_reason, "Alto score");
  assert.equal(p.p_recommendation, "Oferecer Priority");
  assert.equal(p.p_source_tool, "record_opportunity");
  assert.equal(p.p_actor, "dgn-agent");
  assert.equal(p.p_next_step, "Agendar atendimento");
  assert.equal(p.p_expected_benefit, "+R$ 90/mês");
  assert.deepEqual(p.p_payload, { score: 85 });
  assert.equal(p.p_dedupe_key, "upgrade_priority_30d");
  assert.equal(p.p_expires_at, "2026-11-01T00:00:00Z");
  assert.equal(p.p_source_run_id, "run-123");
  assert.equal(p.p_target_campaign_id, null);
});

test("createAgentAction interpreta result_code CREATED / NO_CHANGE", async () => {
  {
    const { db } = makeDb(() => ({
      data: [{ result_code: "CREATED", action_id: "a-1", existing_action_id: null }],
      error: null,
    }));
    const result = await createAgentAction({
      kind: "alert", title: "t", reason: "r", recommendation: "rec",
      sourceTool: "record_alert", actor: "dgn-agent", db,
    });
    assert.equal(result.resultCode, "CREATED");
    assert.equal(result.actionId, "a-1");
    assert.equal(result.existingActionId, null);
  }
  {
    const { db } = makeDb(() => ({
      data: [{ result_code: "NO_CHANGE", action_id: null, existing_action_id: "existing-1" }],
      error: null,
    }));
    const result = await createAgentAction({
      kind: "alert", title: "t", reason: "r", recommendation: "rec",
      sourceTool: "record_alert", actor: "dgn-agent", dedupeKey: "k", db,
    });
    assert.equal(result.resultCode, "NO_CHANGE");
    assert.equal(result.actionId, null);
    assert.equal(result.existingActionId, "existing-1");
  }
});

test("createAgentAction rejeita result_code inesperado como 502", async () => {
  const { db } = makeDb(() => ({
    data: [{ result_code: "FOO_BAR" }],
    error: null,
  }));
  await assert.rejects(
    () =>
      createAgentAction({
        kind: "alert", title: "t", reason: "r", recommendation: "rec",
        sourceTool: "record_alert", actor: "dgn-agent", db,
      }),
    (err: unknown) => err instanceof AgentActionsWriteError && err.status === 502,
  );
});

test("createAgentAction propaga erro da RPC como 502", async () => {
  const { db } = makeDb(() => ({ data: null, error: { message: "network down" } }));
  await assert.rejects(
    () =>
      createAgentAction({
        kind: "alert", title: "t", reason: "r", recommendation: "rec",
        sourceTool: "record_alert", actor: "dgn-agent", db,
      }),
    (err: unknown) => err instanceof AgentActionsWriteError && err.status === 502 && /network down/.test(err.message),
  );
});

// ---------------------------------------------------------------------------
// Transições — approve / reject / mark_executed.
// ---------------------------------------------------------------------------

test("approveAgentAction mapeia result_codes UPDATED/ALREADY_APPROVED/NOT_FOUND/INVALID_STATE_TRANSITION", async () => {
  for (const code of ["UPDATED", "ALREADY_APPROVED", "NOT_FOUND", "INVALID_STATE_TRANSITION"] as const) {
    const { db } = makeDb(() => ({
      data: [{ result_code: code, action_id: code === "NOT_FOUND" ? null : "a-1" }],
      error: null,
    }));
    const result = await approveAgentAction({ actionId: "a-1", actor: "jean@dgn", db });
    assert.equal(result.resultCode, code);
  }
});

test("approveAgentAction exige actor (operador autenticado)", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  await assert.rejects(
    () => approveAgentAction({ actionId: "a-1", actor: "", db }),
    (err: unknown) => err instanceof AgentActionsWriteError && err.status === 400,
  );
});

test("rejectAgentAction exige motivo (reason) obrigatório", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  // rejectAgentAction não é async e lança sync — envolver em async thunk para
  // que assert.rejects enxergue a rejeição em vez de propagar o throw sync.
  await assert.rejects(
    async () => rejectAgentAction({ actionId: "a-1", actor: "jean@dgn", reason: "   ", db }),
    (err: unknown) => err instanceof AgentActionsWriteError && err.status === 400,
  );
});

test("rejectAgentAction propaga ALREADY_REJECTED sem erro", async () => {
  const { db } = makeDb(() => ({
    data: [{ result_code: "ALREADY_REJECTED", action_id: "a-1" }],
    error: null,
  }));
  const result = await rejectAgentAction({
    actionId: "a-1", actor: "jean@dgn", reason: "duplicado", db,
  });
  assert.equal(result.resultCode, "ALREADY_REJECTED");
});

test("markAgentActionExecuted sinaliza INVALID_STATE_TRANSITION quando ainda pending_review", async () => {
  const { db } = makeDb(() => ({
    data: [{ result_code: "INVALID_STATE_TRANSITION", action_id: "a-1" }],
    error: null,
  }));
  const result = await markAgentActionExecuted({
    actionId: "a-1", actor: "jean@dgn", executionRef: "ref-1", db,
  });
  assert.equal(result.resultCode, "INVALID_STATE_TRANSITION");
});

test("markAgentActionExecuted passa executionRef como p_execution_ref", async () => {
  const { db, calls } = makeDb(() => ({
    data: [{ result_code: "UPDATED", action_id: "a-1" }],
    error: null,
  }));
  await markAgentActionExecuted({
    actionId: "a-1", actor: "jean@dgn", executionRef: "wa.me opened", db,
  });
  assert.equal(calls[0]!.fn, "agent_action_mark_executed");
  assert.equal(calls[0]!.params.p_execution_ref, "wa.me opened");
});
