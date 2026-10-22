import { test } from "node:test";
import assert from "node:assert/strict";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  upsertAgentCampaignDraft,
  approveAgentCampaign,
  AgentCampaignsWriteError,
} from "./agent-campaigns-write.ts";

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
// upsertAgentCampaignDraft — validação + mapping snake_case + result_codes.
// ---------------------------------------------------------------------------

test("upsertAgentCampaignDraft exige actor / sourceTool / name / objective", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  const base = { campaignId: null, sourceTool: "record_campaign_draft", actor: "dgn-agent", db };
  await assert.rejects(() => upsertAgentCampaignDraft({ ...base, name: "", objective: "o" } as never));
  await assert.rejects(() => upsertAgentCampaignDraft({ ...base, name: "n", objective: "" } as never));
  await assert.rejects(() =>
    upsertAgentCampaignDraft({ ...base, name: "n", objective: "o", actor: "   " } as never),
  );
  await assert.rejects(() =>
    upsertAgentCampaignDraft({ ...base, name: "n", objective: "o", sourceTool: "   " } as never),
  );
});

test("upsertAgentCampaignDraft chama agent_campaign_upsert_draft com params snake_case", async () => {
  const { db, calls } = makeDb(() => ({
    data: [{ result_code: "CREATED", campaign_id: "c-1" }],
    error: null,
  }));
  await upsertAgentCampaignDraft({
    campaignId: null,
    name: "Campanha Set",
    objective: "Upgrade Smart→Priority",
    audienceRules: { score: { gte: 70 } },
    estimatedAudience: 42,
    draftMessage: "Olá {{firstName}}",
    suggestedChannel: "whatsapp",
    sourceTool: "record_campaign_draft",
    actor: "dgn-agent",
    db,
  });
  assert.equal(calls[0]!.fn, "agent_campaign_upsert_draft");
  const p = calls[0]!.params;
  assert.equal(p.p_campaign_id, null);
  assert.equal(p.p_name, "Campanha Set");
  assert.equal(p.p_objective, "Upgrade Smart→Priority");
  assert.deepEqual(p.p_audience_rules, { score: { gte: 70 } });
  assert.equal(p.p_estimated_audience, 42);
  assert.equal(p.p_draft_message, "Olá {{firstName}}");
  assert.equal(p.p_suggested_channel, "whatsapp");
  assert.equal(p.p_source_tool, "record_campaign_draft");
  assert.equal(p.p_actor, "dgn-agent");
});

test("upsertAgentCampaignDraft retorna CREATED / UPDATED / NO_CHANGE / NOT_FOUND / INVALID_STATE_TRANSITION", async () => {
  for (const code of [
    "CREATED", "UPDATED", "NO_CHANGE", "NOT_FOUND", "INVALID_STATE_TRANSITION",
  ] as const) {
    const { db } = makeDb(() => ({
      data: [{ result_code: code, campaign_id: code === "NOT_FOUND" ? null : "c-1" }],
      error: null,
    }));
    const result = await upsertAgentCampaignDraft({
      campaignId: code === "CREATED" ? null : "c-1",
      name: "n", objective: "o",
      sourceTool: "record_campaign_draft", actor: "dgn-agent", db,
    });
    assert.equal(result.resultCode, code);
  }
});

test("upsertAgentCampaignDraft rejeita result_code inesperado como 502", async () => {
  const { db } = makeDb(() => ({
    data: [{ result_code: "ROLLED_BACK" }],
    error: null,
  }));
  await assert.rejects(
    () =>
      upsertAgentCampaignDraft({
        campaignId: null, name: "n", objective: "o",
        sourceTool: "record_campaign_draft", actor: "dgn-agent", db,
      }),
    (err: unknown) => err instanceof AgentCampaignsWriteError && err.status === 502,
  );
});

// ---------------------------------------------------------------------------
// approveAgentCampaign — operador autenticado obrigatório.
// ---------------------------------------------------------------------------

test("approveAgentCampaign exige actor (operador autenticado)", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  await assert.rejects(
    () => approveAgentCampaign({ campaignId: "c-1", actor: "   ", db }),
    (err: unknown) => err instanceof AgentCampaignsWriteError && err.status === 400,
  );
});

test("approveAgentCampaign mapeia result_codes esperados", async () => {
  for (const code of [
    "UPDATED", "ALREADY_APPROVED", "NOT_FOUND", "INVALID_STATE_TRANSITION",
  ] as const) {
    const { db } = makeDb(() => ({
      data: [{ result_code: code, campaign_id: code === "NOT_FOUND" ? null : "c-1" }],
      error: null,
    }));
    const result = await approveAgentCampaign({ campaignId: "c-1", actor: "jean@dgn", db });
    assert.equal(result.resultCode, code);
  }
});

test("approveAgentCampaign propaga erro da RPC como 502", async () => {
  const { db } = makeDb(() => ({ data: null, error: { message: "db exploded" } }));
  await assert.rejects(
    () => approveAgentCampaign({ campaignId: "c-1", actor: "jean@dgn", db }),
    (err: unknown) => err instanceof AgentCampaignsWriteError && err.status === 502,
  );
});
