import { test } from "node:test";
import assert from "node:assert/strict";

import type { DgnCustomer } from "../dgn-growth-data.ts";
import type { AgentContext } from "./agent-context.ts";
import { AGENT_SKILL_REGISTRY } from "./registry.ts";
import { AGENT_TOOL_NAMES, assertToolsAreRegistered, buildAgentTools, createAccumulator } from "./tools.ts";
import { LIMIT_HARD_CAP as CURATION_CAP } from "./skills/curation-opportunities.ts";
import { LIMIT_HARD_CAP as FOUNDER_CAP } from "./skills/founder-attention.ts";
import { LIMIT_HARD_CAP as SUBSCRIBER_CAP } from "./skills/subscriber-attention.ts";

// ---------------------------------------------------------------------------
// Fixture factory (compacta — só campos usados pelas tools).
// ---------------------------------------------------------------------------
function makeCustomer(overrides: Partial<DgnCustomer> & { id: string; name: string }): DgnCustomer {
  return {
    id: overrides.id, name: overrides.name, phone: overrides.phone ?? "11900000000",
    vehicle: "Toyota", plate: overrides.plate ?? "", companyLink: "", origin: "",
    attendanceHistory: [], washCount: overrides.washCount ?? 0, historicalValue: 0,
    customerSince: "2024-01-01", lastAttendance: "2025-08-01",
    scoreDgn: overrides.scoreDgn ?? 0, recommendedPlan: overrides.recommendedPlan ?? "Smart",
    commercialStatus: overrides.commercialStatus ?? "Aguardando Curadoria DGN",
    recurrence: "A validar na curadoria", averageVisitIntervalDays: 0,
    hasValidPhone: overrides.hasValidPhone ?? true,
    curation: overrides.curation ?? {
      profile: "", originGroup: "", commercialProfile: "", idealSchedule: "",
      founderDecision: "", founderNumber: "", internalNotes: "",
    },
    campaign: overrides.campaign ?? {
      currentCampaign: "", founderSelected: false, founderNumber: "", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "", paymentLink: "", lastAction: "",
      nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
    },
  } as DgnCustomer;
}
function makeCtx(customers: DgnCustomer[], now = Date.parse("2026-08-27T12:00:00Z")): AgentContext {
  return { customers, origin: "json", loadedAt: now };
}

// ---------------------------------------------------------------------------
// Segurança: tool set == read_only registry (nenhuma tool fora do escopo).
// ---------------------------------------------------------------------------

test("todas as tools expostas ao LLM têm skill correspondente (read_only ou prepare_only)", () => {
  assertToolsAreRegistered();
  const acc = createAccumulator();
  const tools = buildAgentTools(makeCtx([]), acc);
  const exposed = Object.keys(tools).sort();
  const expected = [...AGENT_TOOL_NAMES].sort();
  assert.deepEqual(exposed, expected);
  for (const name of exposed) {
    const registered = AGENT_SKILL_REGISTRY.find((s) => s.name === name);
    assert.ok(registered, `${name} não está no registry`);
    assert.ok(
      registered.mode === "read_only" || registered.mode === "prepare_only",
      `${name} tem mode inválido: ${registered.mode}`,
    );
  }
});

test("nenhuma tool aceita SQL, tabela ou parâmetro genérico de banco", () => {
  const acc = createAccumulator();
  const tools = buildAgentTools(makeCtx([]), acc);
  const forbiddenParams = /^(sql|query|table|from|select|expression|rpc|statement)$/i;
  for (const [name, entry] of Object.entries(tools)) {
    // Cada tool AI SDK v7 expõe `inputSchema` — a shape do zod é acessível via toJSON().
    const schemaSource = JSON.stringify(entry);
    assert.ok(
      !forbiddenParams.test(schemaSource),
      `${name} pode ter parâmetro proibido: ${schemaSource.slice(0, 200)}`,
    );
  }
});

// ---------------------------------------------------------------------------
// Limits nas skills de lista — Agent não fica preso à paginação da UI.
// ---------------------------------------------------------------------------

test("get_curation_opportunities respeita limit customizado até LIMIT_HARD_CAP", async () => {
  const customers = Array.from({ length: 25 }, (_, i) =>
    makeCustomer({ id: `p${i}`, name: `Prospect ${i}`, scoreDgn: 82, washCount: 12 }),
  );
  const acc = createAccumulator();
  const tools = buildAgentTools(makeCtx(customers), acc);
  const result = await tools.get_curation_opportunities.execute!(
    { limit: 15 },
    { toolCallId: "t1", messages: [] } as unknown as never,
  );
  assert.ok(result && typeof result === "object" && "status" in result);
  assert.equal(result.status, "ok");
  const items = (result as unknown as { items: unknown[] }).items;
  assert.equal(items.length, 15, "Deve honrar limit=15");
  assert.ok(CURATION_CAP >= 15, "Hard cap deve permitir esse pedido");
});

test("limits acima do hard cap são clampados", async () => {
  const customers = Array.from({ length: 40 }, (_, i) =>
    makeCustomer({ id: `p${i}`, name: `Prospect ${i}`, scoreDgn: 82, washCount: 12 }),
  );
  const acc = createAccumulator();
  const tools = buildAgentTools(makeCtx(customers), acc);
  const result = await tools.get_curation_opportunities.execute!(
    { limit: 999 },
    { toolCallId: "t2", messages: [] } as unknown as never,
  );
  const items = (result as unknown as { items: unknown[] }).items;
  assert.ok(items.length <= CURATION_CAP, `Deve clampar em CURATION_CAP=${CURATION_CAP}`);
});

test("hard caps das skills de lista são finitos e consistentes (<=20)", () => {
  assert.ok(CURATION_CAP > 0 && CURATION_CAP <= 20);
  assert.ok(FOUNDER_CAP > 0 && FOUNDER_CAP <= 20);
  assert.ok(SUBSCRIBER_CAP > 0 && SUBSCRIBER_CAP <= 20);
});

// ---------------------------------------------------------------------------
// Acumulador — as tools sempre reportam ao acc para o provider hidratar UI.
// ---------------------------------------------------------------------------

test("execute() das tools popula o acumulador com cards + facts + inferences", async () => {
  const customers = [
    makeCustomer({ id: "p1", name: "Prospect 1", scoreDgn: 82, washCount: 10 }),
  ];
  const acc = createAccumulator();
  const tools = buildAgentTools(makeCtx(customers), acc);
  await tools.get_curation_opportunities.execute!(
    {},
    { toolCallId: "t3", messages: [] } as unknown as never,
  );
  assert.ok(acc.cards.length > 0, "Cards devem ir para o acumulador");
  assert.ok(acc.facts.length > 0, "Facts devem ir para o acumulador");
  assert.equal(acc.invocations.length, 1);
  assert.equal(acc.invocations[0].name, "get_curation_opportunities");
});

test("get_customer_summary aceita nameQuery e resolve fuzzy", async () => {
  const jose = makeCustomer({ id: "jose", name: "José Moreira", scoreDgn: 60, washCount: 5 });
  const acc = createAccumulator();
  const tools = buildAgentTools(makeCtx([jose]), acc);
  const result = await tools.get_customer_summary.execute!(
    { nameQuery: "jose moreira" },
    { toolCallId: "t4", messages: [] } as unknown as never,
  );
  const parsed = result as unknown as { status: string; customerId?: string };
  assert.equal(parsed.status, "ok");
  assert.equal(parsed.customerId, "jose");
  assert.ok(acc.summaries.length === 1);
});
