import { test } from "node:test";
import assert from "node:assert/strict";

import type { DgnCustomer } from "../../dgn-growth-data.ts";
import type { AgentContext, AgentWriter } from "../agent-context.ts";
import { AGENT_ACTOR } from "../agent-context.ts";
import { recordOpportunity } from "./record-opportunity-skill.ts";
import { recordAlert } from "./record-alert-skill.ts";
import { recordCampaignDraft } from "./record-campaign-draft-skill.ts";
import type {
  CreateAgentActionInput,
  CreateAgentActionResult,
} from "../../db/agent-actions-write.ts";
import type {
  UpsertAgentCampaignInput,
  UpsertAgentCampaignResult,
} from "../../db/agent-campaigns-write.ts";

// ---------------------------------------------------------------------------
// Fixture factory — writer stub determinístico. Captura o input para asserts
// de que os parâmetros corretos chegam na camada de persistência.
// ---------------------------------------------------------------------------

const JOSE_LEGACY = "jose-moreira";
const JOSE_UUID = "11111111-1111-4111-8111-111111111111";

function makeCustomer(id: string, name: string): DgnCustomer {
  return {
    id, name, phone: "11900000000",
    vehicle: "Toyota", plate: "", companyLink: "", origin: "",
    attendanceHistory: [], washCount: 0, historicalValue: 0,
    customerSince: "2024-01-01", lastAttendance: "2025-08-01",
    scoreDgn: 60, recommendedPlan: "Smart",
    commercialStatus: "Aguardando Curadoria DGN",
    recurrence: "A validar na curadoria", averageVisitIntervalDays: 0,
    hasValidPhone: true,
    curation: {
      profile: "", originGroup: "", commercialProfile: "", idealSchedule: "",
      founderDecision: "", founderNumber: "", internalNotes: "",
    },
    campaign: {
      currentCampaign: "", founderSelected: false, founderNumber: "", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "", paymentLink: "", lastAction: "",
      nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
    },
  } as DgnCustomer;
}

interface WriterCapture {
  resolveCalls: string[];
  actionCalls: CreateAgentActionInput[];
  campaignCalls: UpsertAgentCampaignInput[];
}

function makeWriter(options: {
  capture?: WriterCapture;
  resolveTo?: (input: string) => string;
  createAction?: (input: CreateAgentActionInput) => Promise<CreateAgentActionResult>;
  upsertCampaign?: (input: UpsertAgentCampaignInput) => Promise<UpsertAgentCampaignResult>;
  failResolve?: boolean;
  failCreate?: boolean;
} = {}): AgentWriter {
  const capture = options.capture;
  return {
    resolveCustomerId: async (input) => {
      capture?.resolveCalls.push(input);
      if (options.failResolve) throw new Error("resolve failed");
      return options.resolveTo ? options.resolveTo(input) : JOSE_UUID;
    },
    createAction: async (input) => {
      capture?.actionCalls.push(input);
      if (options.failCreate) throw new Error("insert failed");
      return (
        options.createAction?.(input) ??
        Promise.resolve({ resultCode: "CREATED", actionId: "action-1", existingActionId: null })
      );
    },
    upsertCampaignDraft: async (input) => {
      capture?.campaignCalls.push(input);
      return (
        options.upsertCampaign?.(input) ??
        Promise.resolve({ resultCode: "CREATED", campaignId: "camp-1" })
      );
    },
  };
}

function makeCtx(writer?: AgentWriter, extraCustomers: DgnCustomer[] = []): AgentContext {
  return {
    customers: [makeCustomer(JOSE_LEGACY, "José Moreira"), ...extraCustomers],
    origin: "json",
    loadedAt: Date.parse("2026-10-22T12:00:00Z"),
    writer,
  };
}

// ---------------------------------------------------------------------------
// Permissões — Writer ausente / cliente ausente / resolve falha.
// ---------------------------------------------------------------------------

test("record_opportunity sem writer injetado devolve unavailable", async () => {
  const ctx = makeCtx(undefined);
  const result = await recordOpportunity(ctx, {
    targetCustomerId: JOSE_LEGACY,
    title: "Upgrade para Priority",
    reason: "Alto score + visitas frequentes",
    recommendation: "Oferecer plano Priority com condição",
  });
  assert.equal(result.status, "unavailable");
  assert.match(result.message ?? "", /writer/i);
});

test("record_alert com cliente ausente da base viva devolve insufficient_data", async () => {
  const capture: WriterCapture = { resolveCalls: [], actionCalls: [], campaignCalls: [] };
  const ctx = makeCtx(makeWriter({ capture }));
  const result = await recordAlert(ctx, {
    targetCustomerId: "cliente-fantasma",
    title: "Renovação próxima",
    reason: "Vencimento em 7 dias",
    recommendation: "Confirmar interesse",
  });
  assert.equal(result.status, "insufficient_data");
  // Guard: não chamou nem resolve nem writer.
  assert.deepEqual(capture.resolveCalls, []);
  assert.deepEqual(capture.actionCalls, []);
});

test("record_opportunity propaga falha do resolve como unavailable", async () => {
  const ctx = makeCtx(makeWriter({ failResolve: true }));
  const result = await recordOpportunity(ctx, {
    targetCustomerId: JOSE_LEGACY,
    title: "Upgrade",
    reason: "r",
    recommendation: "r",
  });
  assert.equal(result.status, "unavailable");
  assert.match(result.message ?? "", /resolver/i);
});

// ---------------------------------------------------------------------------
// Actor fixo — a skill NUNCA deixa o LLM/caller sobrescrever o actor.
// ---------------------------------------------------------------------------

test("record_opportunity fixa p_actor='dgn-agent' e kind='opportunity'", async () => {
  const capture: WriterCapture = { resolveCalls: [], actionCalls: [], campaignCalls: [] };
  const ctx = makeCtx(makeWriter({ capture }));
  await recordOpportunity(ctx, {
    targetCustomerId: JOSE_LEGACY,
    title: "Upgrade para Priority",
    reason: "Alto score",
    recommendation: "Oferecer Priority",
  });
  assert.equal(capture.actionCalls.length, 1);
  const call = capture.actionCalls[0]!;
  assert.equal(call.actor, AGENT_ACTOR);
  assert.equal(call.actor, "dgn-agent");
  assert.equal(call.kind, "opportunity");
  assert.equal(call.sourceTool, "record_opportunity");
  // Legacy_id DEVE ter sido resolvido para UUID antes do write.
  assert.equal(call.targetCustomerId, JOSE_UUID);
  assert.deepEqual(capture.resolveCalls, [JOSE_LEGACY]);
});

test("record_alert fixa kind='alert' e sourceTool='record_alert'", async () => {
  const capture: WriterCapture = { resolveCalls: [], actionCalls: [], campaignCalls: [] };
  const ctx = makeCtx(makeWriter({ capture }));
  await recordAlert(ctx, {
    targetCustomerId: JOSE_LEGACY,
    title: "Renovação próxima",
    reason: "7 dias",
    recommendation: "Confirmar interesse",
  });
  const call = capture.actionCalls[0]!;
  assert.equal(call.kind, "alert");
  assert.equal(call.sourceTool, "record_alert");
  assert.equal(call.actor, "dgn-agent");
});

test("record_campaign_draft fixa p_actor='dgn-agent' e sourceTool", async () => {
  const capture: WriterCapture = { resolveCalls: [], actionCalls: [], campaignCalls: [] };
  const ctx = makeCtx(makeWriter({ capture }));
  await recordCampaignDraft(ctx, {
    name: "Campanha Priority Setembro",
    objective: "Upgrade de Smart para Priority",
    draftMessage: "Olá {{firstName}}, ...",
    suggestedChannel: "whatsapp",
  });
  const call = capture.campaignCalls[0]!;
  assert.equal(call.actor, "dgn-agent");
  assert.equal(call.sourceTool, "record_campaign_draft");
});

// ---------------------------------------------------------------------------
// Result codes & payload shape.
// ---------------------------------------------------------------------------

test("record_opportunity CREATED carrega actionId e status pending_review", async () => {
  const ctx = makeCtx(
    makeWriter({ createAction: async () => ({ resultCode: "CREATED", actionId: "a-99", existingActionId: null }) }),
  );
  const result = await recordOpportunity(ctx, {
    targetCustomerId: JOSE_LEGACY,
    title: "t",
    reason: "r",
    recommendation: "rec",
  });
  assert.equal(result.status, "ok");
  assert.equal(result.data?.resultCode, "CREATED");
  assert.equal(result.data?.actionId, "a-99");
  assert.equal(result.data?.existingActionId, null);
  assert.equal(result.data?.kind, "opportunity");
  assert.equal(result.data?.resolvedCustomerId, JOSE_UUID);
  assert.equal(result.data?.status, "pending_review");
});

test("record_opportunity NO_CHANGE (dedupe) carrega existingActionId", async () => {
  const ctx = makeCtx(
    makeWriter({ createAction: async () => ({ resultCode: "NO_CHANGE", actionId: null, existingActionId: "a-old" }) }),
  );
  const result = await recordOpportunity(ctx, {
    targetCustomerId: JOSE_LEGACY,
    title: "t",
    reason: "r",
    recommendation: "rec",
    dedupeKey: "upgrade_priority_30d",
  });
  assert.equal(result.status, "ok");
  assert.equal(result.data?.resultCode, "NO_CHANGE");
  assert.equal(result.data?.actionId, null);
  assert.equal(result.data?.existingActionId, "a-old");
  // Inferência deve mencionar dedupe.
  assert.ok(
    result.inferences.some((i) => i.includes("ação ativa") || i.includes("ativa")),
    "inferência deve explicar dedupe",
  );
});

// ---------------------------------------------------------------------------
// Dedupe — passagem de dedupeKey ao writer.
// ---------------------------------------------------------------------------

test("record_opportunity propaga dedupeKey ao writer", async () => {
  const capture: WriterCapture = { resolveCalls: [], actionCalls: [], campaignCalls: [] };
  const ctx = makeCtx(makeWriter({ capture }));
  await recordOpportunity(ctx, {
    targetCustomerId: JOSE_LEGACY,
    title: "t",
    reason: "r",
    recommendation: "rec",
    dedupeKey: "upgrade_priority_30d",
  });
  assert.equal(capture.actionCalls[0]!.dedupeKey, "upgrade_priority_30d");
});

test("record_opportunity sem dedupeKey não envia dedupeKey ao writer (null)", async () => {
  const capture: WriterCapture = { resolveCalls: [], actionCalls: [], campaignCalls: [] };
  const ctx = makeCtx(makeWriter({ capture }));
  await recordOpportunity(ctx, {
    targetCustomerId: JOSE_LEGACY,
    title: "t",
    reason: "r",
    recommendation: "rec",
  });
  assert.equal(capture.actionCalls[0]!.dedupeKey, null);
});

// ---------------------------------------------------------------------------
// Idempotência — chamar duas vezes com mesma dedupeKey devolve o mesmo
// existingActionId na segunda vez (writer simula a RPC).
// ---------------------------------------------------------------------------

test("record_opportunity idempotente para mesma (kind, customer, dedupeKey)", async () => {
  // Writer que simula o comportamento da RPC real: 1ª CREATED, demais NO_CHANGE.
  let callCount = 0;
  const ctx = makeCtx(
    makeWriter({
      createAction: async (input) => {
        callCount += 1;
        if (callCount === 1) {
          return { resultCode: "CREATED", actionId: `uuid-created-${input.dedupeKey}`, existingActionId: null };
        }
        return { resultCode: "NO_CHANGE", actionId: null, existingActionId: `uuid-created-${input.dedupeKey}` };
      },
    }),
  );
  const first = await recordOpportunity(ctx, {
    targetCustomerId: JOSE_LEGACY, title: "t", reason: "r", recommendation: "rec",
    dedupeKey: "upgrade_priority_30d",
  });
  const second = await recordOpportunity(ctx, {
    targetCustomerId: JOSE_LEGACY, title: "t", reason: "r", recommendation: "rec",
    dedupeKey: "upgrade_priority_30d",
  });
  assert.equal(first.data?.resultCode, "CREATED");
  assert.equal(second.data?.resultCode, "NO_CHANGE");
  assert.equal(second.data?.existingActionId, first.data?.actionId);
});

// ---------------------------------------------------------------------------
// Concorrência conceitual — duas chamadas em paralelo convergem para o
// mesmo existingActionId quando a 2ª encontra a 1ª já viva.
// ---------------------------------------------------------------------------

test("record_opportunity concorrente — 2ª chamada enxerga a 1ª via dedupe", async () => {
  const createdId = "concurrent-uuid";
  let inserted = false;
  const ctx = makeCtx(
    makeWriter({
      createAction: async () => {
        if (!inserted) {
          inserted = true;
          return { resultCode: "CREATED", actionId: createdId, existingActionId: null };
        }
        return { resultCode: "NO_CHANGE", actionId: null, existingActionId: createdId };
      },
    }),
  );
  const [a, b] = await Promise.all([
    recordOpportunity(ctx, {
      targetCustomerId: JOSE_LEGACY, title: "t", reason: "r", recommendation: "rec",
      dedupeKey: "race",
    }),
    recordOpportunity(ctx, {
      targetCustomerId: JOSE_LEGACY, title: "t", reason: "r", recommendation: "rec",
      dedupeKey: "race",
    }),
  ]);
  const codes = [a.data?.resultCode, b.data?.resultCode].sort();
  assert.deepEqual(codes, ["CREATED", "NO_CHANGE"]);
  const winnerId = a.data?.resultCode === "CREATED" ? a.data.actionId : b.data?.actionId;
  const loserExisting =
    a.data?.resultCode === "NO_CHANGE" ? a.data.existingActionId : b.data?.existingActionId;
  assert.equal(loserExisting, winnerId);
});

// ---------------------------------------------------------------------------
// Writer falha ao inserir → unavailable propagado (não quebra o LLM).
// ---------------------------------------------------------------------------

test("record_opportunity propaga falha do writer como unavailable", async () => {
  const ctx = makeCtx(makeWriter({ failCreate: true }));
  const result = await recordOpportunity(ctx, {
    targetCustomerId: JOSE_LEGACY, title: "t", reason: "r", recommendation: "rec",
  });
  assert.equal(result.status, "unavailable");
  assert.match(result.message ?? "", /writer falhou/i);
});

// ---------------------------------------------------------------------------
// Record campaign draft — result codes.
// ---------------------------------------------------------------------------

test("record_campaign_draft CREATED retorna campaignId e status draft", async () => {
  const ctx = makeCtx(
    makeWriter({ upsertCampaign: async () => ({ resultCode: "CREATED", campaignId: "camp-xyz" }) }),
  );
  const result = await recordCampaignDraft(ctx, {
    name: "Campanha Prior Set",
    objective: "Upgrade Smart→Priority",
  });
  assert.equal(result.status, "ok");
  assert.equal(result.data?.resultCode, "CREATED");
  assert.equal(result.data?.campaignId, "camp-xyz");
  assert.equal(result.data?.status, "draft");
});

test("record_campaign_draft NOT_FOUND vira insufficient_data preservando payload", async () => {
  const ctx = makeCtx(
    makeWriter({ upsertCampaign: async () => ({ resultCode: "NOT_FOUND", campaignId: null }) }),
  );
  const result = await recordCampaignDraft(ctx, {
    campaignId: "camp-inexistente",
    name: "x", objective: "y",
  });
  assert.equal(result.status, "insufficient_data");
  assert.equal(result.data?.resultCode, "NOT_FOUND");
});

test("record_campaign_draft INVALID_STATE_TRANSITION vira unavailable (campanha fora de draft)", async () => {
  const ctx = makeCtx(
    makeWriter({
      upsertCampaign: async () => ({ resultCode: "INVALID_STATE_TRANSITION", campaignId: "camp-approved" }),
    }),
  );
  const result = await recordCampaignDraft(ctx, {
    campaignId: "camp-approved",
    name: "x", objective: "y",
  });
  assert.equal(result.status, "unavailable");
  assert.equal(result.data?.resultCode, "INVALID_STATE_TRANSITION");
  assert.match(result.message ?? "", /draft/i);
});

test("record_campaign_draft bloqueia nome/objetivo vazios antes de chamar writer", async () => {
  const capture: WriterCapture = { resolveCalls: [], actionCalls: [], campaignCalls: [] };
  const ctx = makeCtx(makeWriter({ capture }));
  const emptyName = await recordCampaignDraft(ctx, { name: "   ", objective: "ok" });
  const emptyObj = await recordCampaignDraft(ctx, { name: "ok", objective: "   " });
  assert.equal(emptyName.status, "insufficient_data");
  assert.equal(emptyObj.status, "insufficient_data");
  // Writer NUNCA foi chamado — a validação da skill parou antes.
  assert.equal(capture.campaignCalls.length, 0);
});
