import { test } from "node:test";
import assert from "node:assert/strict";

import type { DgnCustomer } from "../dgn-growth-data.ts";
import type { AgentContext } from "./agent-context.ts";
import { getDailyBriefing } from "./skills/daily-briefing.ts";
import { getFounderAttention } from "./skills/founder-attention.ts";
import { getCurationOpportunities } from "./skills/curation-opportunities.ts";
import { getSubscriberAttention } from "./skills/subscriber-attention.ts";
import { getCustomerSummary, findCustomerByFuzzyName } from "./skills/customer-summary.ts";
import { suggestNextAction } from "./skills/next-action.ts";
import { KNOWN_SUBSCRIBERS_2026_08_16 } from "../known-subscribers.ts";
import { DeterministicAgentProvider } from "./agent-provider.ts";

// Rotas válidas do Shell V2 — usadas para provar que todo card gera deep-link
// para uma tela existente. Prioridade é o perfil 360 canônico
// (/admin/growth/customers/<id>); listas continuam válidas como fallback quando
// não há cliente resolvido no snapshot (ex.: assinante só na base viva 4uCar).
const VALID_ROUTE_PREFIXES = new Set([
  "/admin/growth/customers",
  "/admin/growth/founders-2026",
  "/admin/growth/curadoria",
  "/admin/growth/assinantes-detectados",
]);

// ---------------------------------------------------------------------------
// Fixture factory — só os campos consultados pelas skills.
// ---------------------------------------------------------------------------

function makeCustomer(overrides: Partial<DgnCustomer> & { id: string; name: string }): DgnCustomer {
  return {
    id: overrides.id,
    name: overrides.name,
    phone: overrides.phone ?? "11900000000",
    vehicle: overrides.vehicle ?? "Toyota Corolla",
    plate: overrides.plate ?? "",
    companyLink: "",
    origin: "",
    attendanceHistory: [],
    washCount: overrides.washCount ?? 0,
    historicalValue: 0,
    customerSince: "2024-01-01",
    lastAttendance: "2025-08-01",
    scoreDgn: overrides.scoreDgn ?? 0,
    recommendedPlan: overrides.recommendedPlan ?? "Smart",
    commercialStatus: overrides.commercialStatus ?? "Aguardando Curadoria DGN",
    recurrence: "A validar na curadoria",
    averageVisitIntervalDays: 0,
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
    commercial: overrides.commercial,
  } as DgnCustomer;
}

function makeCtx(customers: DgnCustomer[], now = Date.parse("2026-08-27T12:00:00Z")): AgentContext {
  return { customers, origin: "json", loadedAt: now };
}

// ---------------------------------------------------------------------------
// FOUNDER ATTENTION
// ---------------------------------------------------------------------------

test("founder-attention: prioridade alta para click WhatsApp sem resposta", () => {
  const now = Date.parse("2026-08-27T12:00:00Z");
  const customer = makeCustomer({
    id: "cliente-alfa",
    name: "Cliente Alfa",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Convite criado", personalizedPagePath: "/f/alfa", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      dates: { inviteCreatedAt: "2026-08-25T10:00:00Z" },
      engagement: {
        viewedAt: "2026-08-26T10:00:00Z",
        lastViewedAt: "2026-08-26T10:00:00Z",
        viewCount: 1,
        confirmClickedAt: "2026-08-26T11:00:00Z",
        confirmClickCount: 1,
        vipClickedAt: "",
        vipClickCount: 0,
      },
    },
  });
  const result = getFounderAttention(makeCtx([customer], now));
  assert.equal(result.status, "ok");
  assert.equal(result.data?.length, 1);
  assert.equal(result.data?.[0].priority, "alta");
  assert.equal(result.data?.[0].customerId, "cliente-alfa");
  assert.match(result.data?.[0].href ?? "", /^\/admin\/growth\/customers\//);
});

test("founder-attention: convertido não aparece", () => {
  const customer = makeCustomer({
    id: "convertido",
    name: "Convertido",
    commercialStatus: "Assinante Ativo",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "004", founderCondition: "",
      campaignStatus: "Assinante ativo", personalizedPagePath: "/f/convertido", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      commercialStage: "convertido",
    },
  });
  const result = getFounderAttention(makeCtx([customer]));
  assert.equal(result.status, "insufficient_data");
});

test("founder-attention: sem convites → insufficient_data", () => {
  const result = getFounderAttention(makeCtx([]));
  assert.equal(result.status, "insufficient_data");
});

// ---------------------------------------------------------------------------
// CURATION OPPORTUNITIES
// ---------------------------------------------------------------------------

test("curation-opportunities: elegível com score alto aparece com prioridade alta", () => {
  const customer = makeCustomer({
    id: "prospect-hot",
    name: "Prospect Quente",
    scoreDgn: 82,
    washCount: 10,
    recommendedPlan: "Priority",
    commercialStatus: "Aguardando Curadoria DGN",
  });
  const result = getCurationOpportunities(makeCtx([customer]));
  assert.equal(result.status, "ok");
  assert.equal(result.data?.[0].priority, "alta");
  assert.match(result.data?.[0].href ?? "", /^\/admin\/growth\/customers\//);
});

test("curation-opportunities: assinante conhecido nunca aparece (regra canônica)", () => {
  // Iara é assinante Priority na base viva — tem que ser bloqueada mesmo com score alto.
  const iara = makeCustomer({
    id: "iara-menezes",
    name: "Iara Menezes",
    phone: "19991931501",
    scoreDgn: 95,
    washCount: 20,
  });
  const result = getCurationOpportunities(makeCtx([iara]));
  assert.equal(result.status, "insufficient_data", "Assinante conhecido não deve virar oportunidade");
});

test("curation-opportunities: honra threshold médio + recorrência", () => {
  const customer = makeCustomer({
    id: "prospect-med", name: "Prospect Médio",
    scoreDgn: 55, washCount: 8,
  });
  const result = getCurationOpportunities(makeCtx([customer]));
  assert.equal(result.status, "ok");
  assert.equal(result.data?.[0].priority, "media");
});

// ---------------------------------------------------------------------------
// SUBSCRIBER ATTENTION
// ---------------------------------------------------------------------------

test("subscriber-attention: renovação pendente entra como alta e nunca inventa vencimento", () => {
  const result = getSubscriberAttention(makeCtx([]));
  // A base viva tem pelo menos um assinante em renovação pendente (Iara ou similar).
  const anyRenewal = KNOWN_SUBSCRIBERS_2026_08_16.some((s) => s.status === "renovacao_pendente");
  if (!anyRenewal) {
    assert.equal(result.status, "insufficient_data");
    return;
  }
  assert.equal(result.status, "ok");
  const card = result.data?.find((c) => c.id.startsWith("subscriber-renewal:"));
  assert.ok(card, "esperado card de renovação pendente");
  assert.equal(card?.priority, "alta");
  // Prova de que não inventa vencimento — nenhum campo com "vence em" na razão.
  for (const c of result.data ?? []) {
    assert.doesNotMatch(c.reason, /vence em|vencimento em \d/i, "não deve inventar data de vencimento");
  }
});

// ---------------------------------------------------------------------------
// CUSTOMER SUMMARY
// ---------------------------------------------------------------------------

test("customer-summary: retorna visão 360 apenas do cliente pedido", () => {
  const alfa = makeCustomer({ id: "cliente-alfa", name: "Cliente Alfa", scoreDgn: 65, washCount: 8 });
  const beta = makeCustomer({ id: "cliente-beta", name: "Cliente Beta", scoreDgn: 90, washCount: 12 });
  const result = getCustomerSummary(makeCtx([alfa, beta]), "cliente-alfa");
  assert.equal(result.status, "ok");
  assert.equal(result.data?.name, "Cliente Alfa");
  assert.equal(result.data?.score?.total, 65);
  // Nenhum campo do Beta pode ter vazado.
  const flat = JSON.stringify(result.data);
  assert.ok(!flat.includes("Cliente Beta"), "resposta não deve conter outro cliente");
});

test("customer-summary: cliente inexistente → unavailable", () => {
  const result = getCustomerSummary(makeCtx([]), "id-que-nao-existe");
  assert.equal(result.status, "unavailable");
});

test("findCustomerByFuzzyName: encontra acento-insensível", () => {
  const jose = makeCustomer({ id: "jose", name: "José Moreira", phone: "19999999999" });
  const found = findCustomerByFuzzyName(makeCtx([jose]), "jose moreira");
  assert.equal(found?.id, "jose");
});

// ---------------------------------------------------------------------------
// NEXT ACTION
// ---------------------------------------------------------------------------

test("next-action: WhatsApp click → follow-up direto", () => {
  const c = makeCustomer({
    id: "click", name: "Click Cliente",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Convite criado", personalizedPagePath: "/f/click", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      engagement: {
        viewedAt: "2026-08-26T00:00:00Z", lastViewedAt: "2026-08-26T00:00:00Z", viewCount: 1,
        confirmClickedAt: "2026-08-26T01:00:00Z", confirmClickCount: 1,
        vipClickedAt: "", vipClickCount: 0,
      },
    },
  });
  const result = suggestNextAction(makeCtx([c]), "click");
  assert.equal(result.status, "ok");
  assert.match(result.data?.headline ?? "", /WhatsApp/);
});

test("next-action: sem sinais → insufficient_data (não inventa)", () => {
  const c = makeCustomer({ id: "silent", name: "Silent", commercialStatus: "Curado" });
  const result = suggestNextAction(makeCtx([c]), "silent");
  assert.equal(result.status, "insufficient_data");
});

// ---------------------------------------------------------------------------
// DAILY BRIEFING (orquestração)
// ---------------------------------------------------------------------------

test("daily-briefing: consolida cards das três skills e limita quantidade", () => {
  const now = Date.parse("2026-08-27T12:00:00Z");
  const customers = Array.from({ length: 6 }, (_, i) =>
    makeCustomer({
      id: `hot-${i}`,
      name: `Prospect ${i}`,
      scoreDgn: 82,
      washCount: 10,
      commercialStatus: "Aguardando Curadoria DGN",
    }),
  );
  const result = getDailyBriefing(makeCtx(customers, now));
  assert.equal(result.status, "ok");
  assert.ok((result.data?.cards.length ?? 0) <= 5, "máximo 5 cards no briefing");
  assert.equal(result.data?.totals.curation, 6);
});

// ---------------------------------------------------------------------------
// DEEP LINKS
// ---------------------------------------------------------------------------

// Regressão do canonical deep-link: sempre que houver customerId resolvido,
// o href deve levar ao perfil 360 canônico. Fallback de lista só quando não há
// cliente resolvido (registro só na base viva 4uCar).

test("deep-link canônico: founder-attention aponta para /customers/<id>", () => {
  const now = Date.parse("2026-08-27T12:00:00Z");
  const customer = makeCustomer({
    id: "founder-1",
    name: "Founder Alfa",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Convite criado", personalizedPagePath: "/f/a", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      dates: { inviteCreatedAt: "2026-08-20T00:00:00Z" },
      engagement: {
        viewedAt: "2026-08-25T00:00:00Z", lastViewedAt: "2026-08-25T00:00:00Z", viewCount: 1,
        confirmClickedAt: "", confirmClickCount: 0, vipClickedAt: "", vipClickCount: 0,
      },
    },
  });
  const result = getFounderAttention(makeCtx([customer], now));
  assert.equal(result.status, "ok");
  assert.equal(result.data?.[0].href, "/admin/growth/customers/founder-1");
  assert.equal(result.data?.[0].customerId, "founder-1");
});

test("deep-link canônico: curation-opportunities aponta para /customers/<id>", () => {
  const customer = makeCustomer({
    id: "curation-1", name: "Curation Alfa",
    scoreDgn: 82, washCount: 10, commercialStatus: "Aguardando Curadoria DGN",
  });
  const result = getCurationOpportunities(makeCtx([customer]));
  assert.equal(result.status, "ok");
  assert.equal(result.data?.[0].href, "/admin/growth/customers/curation-1");
});

test("deep-link canônico: subscriber com match no snapshot → /customers/<id>", () => {
  const renewal = KNOWN_SUBSCRIBERS_2026_08_16.find((s) => s.status === "renovacao_pendente");
  if (!renewal) {
    // Sem renovação pendente na base viva → nada a validar.
    return;
  }
  const customer = makeCustomer({
    id: "sub-match",
    name: renewal.name,
    phone: renewal.phones[0] ?? "11900000000",
  });
  const result = getSubscriberAttention(makeCtx([customer]));
  assert.equal(result.status, "ok");
  const card = result.data?.find((c) => c.customerId === "sub-match");
  assert.ok(card, "esperado card com customerId resolvido");
  assert.equal(card?.href, "/admin/growth/customers/sub-match");
  assert.equal(card?.ctaLabel, "Ver cliente");
});

test("deep-link canônico: subscriber SEM match → fallback lista (não inventa cliente)", () => {
  // Sem passar clientes correspondentes, renewal card cai no fallback da lista.
  const anyRenewal = KNOWN_SUBSCRIBERS_2026_08_16.some((s) => s.status === "renovacao_pendente");
  if (!anyRenewal) return;
  const result = getSubscriberAttention(makeCtx([]));
  assert.equal(result.status, "ok");
  const card = result.data?.find((c) => c.id.startsWith("subscriber-renewal:"));
  assert.ok(card, "esperado card de renovação pendente");
  assert.equal(card?.href, "/admin/growth/assinantes-detectados");
  assert.equal(card?.customerId, undefined);
});

test("deep-link canônico: customer-summary.primaryHref → /customers/<id>", () => {
  const customer = makeCustomer({ id: "sum-1", name: "Sum Alfa", scoreDgn: 60, washCount: 5 });
  const result = getCustomerSummary(makeCtx([customer]), "sum-1");
  assert.equal(result.status, "ok");
  assert.equal(result.data?.primaryHref, "/admin/growth/customers/sum-1");
});

test("deep-link canônico: next-action.href → /customers/<id>", () => {
  const customer = makeCustomer({
    id: "next-1", name: "Next Alfa",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Convite criado", personalizedPagePath: "/f/n", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      engagement: {
        viewedAt: "2026-08-26T00:00:00Z", lastViewedAt: "2026-08-26T00:00:00Z", viewCount: 1,
        confirmClickedAt: "2026-08-26T01:00:00Z", confirmClickCount: 1,
        vipClickedAt: "", vipClickCount: 0,
      },
    },
  });
  const result = suggestNextAction(makeCtx([customer]), "next-1");
  assert.equal(result.status, "ok");
  assert.equal(result.data?.href, "/admin/growth/customers/next-1");
});

test("todo card gera href apontando para tela existente do Shell V2", () => {
  const now = Date.parse("2026-08-27T12:00:00Z");
  const customers = [
    makeCustomer({
      id: "with-invite", name: "Com Convite",
      campaign: {
        currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
        campaignStatus: "Convite criado", personalizedPagePath: "/f/x", paymentLink: "",
        lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
        kitStatus: "", cardStatus: "",
        dates: { inviteCreatedAt: "2026-08-20T00:00:00Z" },
        engagement: {
          viewedAt: "2026-08-25T00:00:00Z", lastViewedAt: "2026-08-25T00:00:00Z", viewCount: 1,
          confirmClickedAt: "", confirmClickCount: 0, vipClickedAt: "", vipClickCount: 0,
        },
      },
    }),
    makeCustomer({ id: "hot", name: "Hot", scoreDgn: 82, washCount: 10 }),
  ];
  const briefing = getDailyBriefing(makeCtx(customers, now));
  for (const card of briefing.data?.cards ?? []) {
    const prefix = "/" + card.href.split("?")[0].split("/").slice(1).join("/");
    assert.ok(
      Array.from(VALID_ROUTE_PREFIXES).some((r) => prefix.startsWith(r)),
      `href inválido: ${card.href}`,
    );
  }
});

// ---------------------------------------------------------------------------
// PROVIDER (Chat)
// ---------------------------------------------------------------------------

test("provider: intenção 'quem devo chamar hoje' → daily-briefing", async () => {
  const provider = new DeterministicAgentProvider();
  const ctx = makeCtx([
    makeCustomer({ id: "p1", name: "P1", scoreDgn: 82, washCount: 10 }),
  ]);
  const res = await provider.converse({ message: "quem devo chamar hoje?" }, ctx);
  assert.equal(res.intent, "daily-briefing");
});

test("provider: intenção fora do escopo → help", async () => {
  const provider = new DeterministicAgentProvider();
  const res = await provider.converse(
    { message: "qual a capital da França?" },
    makeCtx([]),
  );
  assert.equal(res.intent, "help");
});

test("provider: 'resuma José Moreira' → customer-summary do José", async () => {
  const provider = new DeterministicAgentProvider();
  const jose = makeCustomer({ id: "jose-moreira", name: "José Moreira", scoreDgn: 60, washCount: 5 });
  const res = await provider.converse({ message: "resuma José Moreira" }, makeCtx([jose]));
  assert.equal(res.intent, "customer-summary");
  const summaryBlock = res.blocks.find((b) => b.kind === "summary");
  assert.ok(summaryBlock, "esperado bloco summary");
});
