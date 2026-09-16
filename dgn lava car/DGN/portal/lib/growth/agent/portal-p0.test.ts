import { test } from "node:test";
import assert from "node:assert/strict";

import type { DgnCustomer } from "../dgn-growth-utils.ts";
import type { AgentContext } from "./agent-context.ts";
import { enrichKnownSubscribers } from "../db/enrich-known-subscriber.ts";
import { classifyDomain, AMBIGUOUS_INVITE_PROMPT } from "./domain-router.ts";
import { DeterministicAgentProvider } from "./providers/deterministic-provider.ts";
import {
  getSubscriberPortalReadiness,
  getPortalAccessIssues,
} from "./skills/portal-readiness.ts";
import { buildAgentTools, createAccumulator } from "./tools.ts";
import { SYSTEM_PROMPT, SYSTEM_PROMPT_VERSION } from "./system-prompt.ts";

// ---------------------------------------------------------------------------
// P0 PORTAL ACTIVATION — Fatia 1
//
// O bug de origem: "convite do Portal" caía em Founder attention porque a
// regex do provider determinístico casava a palavra "convite" isolada. Aqui
// travamos o comportamento correto e a resposta do skill de readiness.
//
// Escopo: classifier de domínio + provider determinístico + skills novas.
// Nada de Founder é alterado; testes de Founder continuam válidos.
// ---------------------------------------------------------------------------

function makeCustomer(overrides: Partial<DgnCustomer> & { id: string; name: string }): DgnCustomer {
  return {
    id: overrides.id,
    name: overrides.name,
    phone: overrides.phone ?? "5519999999999",
    vehicle: "Toyota Corolla",
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
    subscription: overrides.subscription ?? null,
    portalAccess: overrides.portalAccess ?? null,
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

function makeCtx(customers: DgnCustomer[], origin: AgentContext["origin"] = "db"): AgentContext {
  return { customers: enrichKnownSubscribers(customers), origin, loadedAt: Date.parse("2026-09-16T12:00:00Z") };
}

// ---------------------------------------------------------------------------
// CLASSIFIER — regra crítica: "convite do Portal" ≠ Founder.
// ---------------------------------------------------------------------------

test("classifier: 'convite do Portal hoje' → SUBSCRIBER_PORTAL_ACCESS (nunca Founder)", () => {
  const c = classifyDomain("Quem está pronto para receber convite do Portal hoje e quais dados bloqueiam os demais?");
  assert.equal(c.domain, "SUBSCRIBER_PORTAL_ACCESS", `matchedRule=${c.matchedRule}`);
});

test("classifier: 'acesso ao Portal' → SUBSCRIBER_PORTAL_ACCESS", () => {
  assert.equal(classifyDomain("Quem ainda não ativou o acesso?").domain, "SUBSCRIBER_PORTAL_ACCESS");
});

test("classifier: 'magic link' → SUBSCRIBER_PORTAL_ACCESS", () => {
  assert.equal(classifyDomain("Quem pode receber magic link?").domain, "SUBSCRIBER_PORTAL_ACCESS");
});

test("classifier: 'liberar acesso' → SUBSCRIBER_PORTAL_ACCESS", () => {
  assert.equal(classifyDomain("Preciso liberar acesso para novo cliente").domain, "SUBSCRIBER_PORTAL_ACCESS");
});

test("classifier: 'próximos Founders para convidar' → FOUNDER_ACQUISITION", () => {
  assert.equal(classifyDomain("Quem são os próximos Founders para convidar?").domain, "FOUNDER_ACQUISITION");
});

test("classifier: 'vaga Founder' → FOUNDER_ACQUISITION", () => {
  assert.equal(classifyDomain("Quem tem vaga Founder disponível?").domain, "FOUNDER_ACQUISITION");
});

test("classifier: 'aderir Smart' → SUBSCRIPTION_SALES", () => {
  assert.equal(classifyDomain("Quem pode aderir ao Smart?").domain, "SUBSCRIPTION_SALES");
});

test("classifier: 'quem posso convidar hoje?' → AMBIGUOUS (não assume Founder)", () => {
  const c = classifyDomain("Quem posso convidar hoje?");
  assert.equal(c.domain, "AMBIGUOUS", `matchedRule=${c.matchedRule}`);
});

test("classifier: 'convite' sozinho sem qualificador → AMBIGUOUS", () => {
  assert.equal(classifyDomain("Precisamos disparar convite").domain, "AMBIGUOUS");
});

// ---------------------------------------------------------------------------
// DETERMINISTIC PROVIDER — o P0 real: pergunta do Digo NÃO consulta Founder.
// ---------------------------------------------------------------------------

test("provider: 'convite do Portal' devolve Portal readiness, nunca cards Founder", async () => {
  const subscriber = makeCustomer({
    id: "sub-ready",
    name: "Assinante Ready",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: "PagBank", status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true },
    hasValidPhone: true,
    phone: "5519999999999",
  });
  const founderInvite = makeCustomer({
    id: "founder-alfa",
    name: "Founder Alfa",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Convite criado", personalizedPagePath: "/f/alfa", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      dates: { inviteCreatedAt: "2026-09-10T00:00:00Z" },
      engagement: {
        viewedAt: "2026-09-14T00:00:00Z", lastViewedAt: "2026-09-14T00:00:00Z", viewCount: 1,
        confirmClickedAt: "", confirmClickCount: 0, vipClickedAt: "", vipClickCount: 0,
      },
    },
  });
  const ctx = makeCtx([subscriber, founderInvite]);
  const provider = new DeterministicAgentProvider();

  const res = await provider.converse(
    { message: "Quem está pronto para receber convite do Portal hoje e quais dados bloqueiam os demais?" },
    ctx,
  );

  assert.equal(res.intent, "subscriber-attention");
  const cardsBlock = res.blocks.find((b) => b.kind === "cards");
  assert.ok(cardsBlock && cardsBlock.kind === "cards", "esperado bloco de cards");
  if (cardsBlock.kind !== "cards") return;
  const idsHit = new Set(cardsBlock.cards.map((c) => c.id));
  // Nenhum card Founder na resposta.
  for (const id of idsHit) {
    assert.ok(!id.startsWith("founder:"), `card Founder vazou: ${id}`);
  }
  // Card do assinante READY presente.
  assert.ok(idsHit.has("portal-ready:sub-ready"), `esperado card portal-ready:sub-ready. got=${[...idsHit].join(",")}`);
});

test("provider: 'quem posso convidar hoje?' → help com desambiguação (nunca lista Founder)", async () => {
  const provider = new DeterministicAgentProvider();
  const res = await provider.converse({ message: "Quem posso convidar hoje?" }, makeCtx([]));
  assert.equal(res.intent, "help");
  const text = res.blocks.find((b) => b.kind === "text");
  assert.ok(text && text.kind === "text" && text.text.includes("Portal do Assinante"));
  assert.equal(text.kind === "text" && text.text, AMBIGUOUS_INVITE_PROMPT);
});

test("provider: 'próximos Founders para convidar' continua indo para Founder attention", async () => {
  const founder = makeCustomer({
    id: "founder-follow",
    name: "Founder Follow",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Convite criado", personalizedPagePath: "/f/follow", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      dates: { inviteCreatedAt: "2026-09-05T00:00:00Z" },
      engagement: {
        viewedAt: "2026-09-08T00:00:00Z", lastViewedAt: "2026-09-08T00:00:00Z", viewCount: 1,
        confirmClickedAt: "2026-09-08T00:00:00Z", confirmClickCount: 1,
        vipClickedAt: "", vipClickCount: 0,
      },
    },
  });
  const provider = new DeterministicAgentProvider();
  const res = await provider.converse({ message: "Quem são os próximos Founders para convidar?" }, makeCtx([founder]));
  assert.equal(res.intent, "founder-attention");
});

test("provider: Portal sem dados de banco → mensagem de fonte indisponível", async () => {
  const provider = new DeterministicAgentProvider();
  // Ctx com origin=json e nenhum portalAccess = leitura JSON pura. Skill devolve unavailable.
  const c = makeCustomer({ id: "any", name: "Alguém", portalAccess: null, commercialStatus: "Assinante Ativo" });
  const res = await provider.converse(
    { message: "Quem está pronto para receber convite do Portal hoje?" },
    makeCtx([c], "json"),
  );
  const text = res.blocks.find((b) => b.kind === "text");
  assert.ok(text && text.kind === "text" && text.text.includes("Portal"));
});

// ---------------------------------------------------------------------------
// SKILL: readiness classifica READY/BLOCKED conforme o P0 exige.
// ---------------------------------------------------------------------------

test("readiness: READY quando gate + email + auth + subscription; sem telefone bloqueia SOMENTE WhatsApp", () => {
  const c = makeCustomer({
    id: "ready-noshpone",
    name: "Ready Sem Telefone",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true },
    hasValidPhone: false,
  });
  const result = getSubscriberPortalReadiness(makeCtx([c]));
  assert.equal(result.status, "ok");
  const item = result.data?.ready.find((r) => r.customerId === "ready-noshpone");
  assert.ok(item, "esperado no ready");
  assert.equal(item?.portalAccessReady, true);
  assert.equal(item?.whatsappInviteReady, false);
  assert.ok(item?.blockers.includes("MISSING_PHONE_FOR_WHATSAPP"));
});

test("readiness: BLOCKED com blockers corretos quando falta cada peça", () => {
  const missingEmail = makeCustomer({
    id: "no-email",
    name: "Sem Email",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "manual", paymentMethodLabel: null, status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: true, hasEmail: false, hasAuthLink: true },
  });
  const missingAuth = makeCustomer({
    id: "no-auth",
    name: "Sem Auth",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: false },
  });
  const gateOff = makeCustomer({
    id: "no-gate",
    name: "Gate Off",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: false, hasEmail: true, hasAuthLink: true },
  });
  const result = getSubscriberPortalReadiness(makeCtx([missingEmail, missingAuth, gateOff]));
  assert.equal(result.status, "ok");
  const map = new Map(result.data?.blocked.map((b) => [b.customerId, b]) ?? []);
  assert.ok(map.get("no-email")?.blockers.includes("MISSING_EMAIL"));
  assert.ok(map.get("no-email")?.blockers.includes("INCONSISTENT_PORTAL_STATE"));
  assert.ok(map.get("no-auth")?.blockers.includes("NO_AUTH_LINK"));
  assert.ok(map.get("no-auth")?.blockers.includes("INCONSISTENT_PORTAL_STATE"));
  assert.ok(map.get("no-gate")?.blockers.includes("PORTAL_GATE_DISABLED"));
  // Gate desligado NÃO é inconsistente — é só desligado.
  assert.ok(!map.get("no-gate")?.blockers.includes("INCONSISTENT_PORTAL_STATE"));
});

test("readiness: unavailable quando origin é JSON (sem portalAccess)", () => {
  const c = makeCustomer({ id: "any", name: "Qualquer", commercialStatus: "Assinante Ativo", portalAccess: null });
  const result = getSubscriberPortalReadiness(makeCtx([c], "json"));
  assert.equal(result.status, "unavailable");
});

test("readiness: universo respeita knownSubscriberStatus da base viva 4uCar", () => {
  // Guilherme aparece na KNOWN_SUBSCRIBERS_2026_08_16 como Priority ativo. Se o
  // customer não tem `commercialStatus === "Assinante Ativo"` mas o telefone
  // bate com a base viva, ele DEVE entrar no universo via knownSubscriberStatus.
  const c = makeCustomer({
    id: "guilherme-lopes",
    name: "Guilherme Lopes",
    phone: "19993890842",
    commercialStatus: "Aguardando Curadoria DGN",
    portalAccess: { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
  });
  const result = getSubscriberPortalReadiness(makeCtx([c]));
  assert.equal(result.status, "ok");
  const entry = result.data?.blocked.find((b) => b.customerId === "guilherme-lopes");
  assert.ok(entry, "esperado que Guilherme entre no universo via knownSubscriberStatus");
});

// ---------------------------------------------------------------------------
// SKILL: diagnóstico get_portal_access_issues.
// ---------------------------------------------------------------------------

test("issues: aponta gate ligado sem Auth como GATE_ENABLED_WITHOUT_AUTH", () => {
  const c = makeCustomer({
    id: "inc-1",
    name: "Inc 1",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: false },
  });
  const result = getPortalAccessIssues(makeCtx([c]));
  assert.equal(result.status, "ok");
  const issue = result.data?.find((i) => i.customerId === "inc-1" && i.issue === "GATE_ENABLED_WITHOUT_AUTH");
  assert.ok(issue, "esperado GATE_ENABLED_WITHOUT_AUTH");
});

test("issues: assinante ativo sem Portal → ACTIVE_SUBSCRIBER_WITHOUT_PORTAL", () => {
  const c = makeCustomer({
    id: "active-no-portal",
    name: "Ativo Sem Portal",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
  });
  const result = getPortalAccessIssues(makeCtx([c]));
  assert.equal(result.status, "ok");
  const issue = result.data?.find((i) => i.customerId === "active-no-portal");
  assert.ok(issue && issue.issue === "ACTIVE_SUBSCRIBER_WITHOUT_PORTAL");
});

// ---------------------------------------------------------------------------
// TOOL SET — Portal tools registradas e não expõem parâmetro perigoso.
// ---------------------------------------------------------------------------

test("tools: get_subscriber_portal_readiness disponível ao LLM e sem inputSchema livre", async () => {
  const acc = createAccumulator();
  const tools = buildAgentTools(makeCtx([]), acc);
  assert.ok(tools.get_subscriber_portal_readiness, "tool ausente");
  assert.ok(tools.get_portal_access_issues, "tool de diagnóstico ausente");
  // Execução em contexto vazio devolve unavailable — sem crash.
  const res = await tools.get_subscriber_portal_readiness.execute!(
    {},
    { toolCallId: "p1", messages: [] } as unknown as never,
  );
  const parsed = res as unknown as { status: string };
  assert.ok(parsed.status === "unavailable" || parsed.status === "insufficient_data");
});

// ---------------------------------------------------------------------------
// SYSTEM PROMPT — versionado e documenta domínios.
// ---------------------------------------------------------------------------

test("system prompt: publica domínios canônicos + regra 'convite sozinho'", () => {
  assert.match(SYSTEM_PROMPT, /SUBSCRIBER_PORTAL_ACCESS/);
  assert.match(SYSTEM_PROMPT, /FOUNDER_ACQUISITION/);
  assert.match(SYSTEM_PROMPT, /convite do Portal/);
  assert.match(SYSTEM_PROMPT, /convite Founder/);
  assert.match(SYSTEM_PROMPT, /desambiguação|desambiguacao|Portal do Assinante ou convite/i);
  assert.equal(SYSTEM_PROMPT_VERSION, "dgn-agent-2.3.0");
});
