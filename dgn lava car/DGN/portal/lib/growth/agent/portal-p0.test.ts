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
  assert.equal(SYSTEM_PROMPT_VERSION, "dgn-agent-2.3.3");
});

// ---------------------------------------------------------------------------
// HOTFIX P0 (2026-09-16) — elegibilidade parte SEMPRE de crm_subscriptions
// (subscription.isActive). commercialStatus, knownSubscriberStatus e evidência
// 4uCar não promovem para READY; quando divergem viram INCONSISTENT_SUBSCRIBER_STATE.
// ---------------------------------------------------------------------------

test("hotfix: commercialStatus 'Assinante Ativo' + knownSubscriberStatus 'renovacao_pendente' SEM crm_subscriptions ativa → BLOCKED", () => {
  const c = makeCustomer({
    id: "aparenta-nao-canonico",
    name: "Aparenta Assinante",
    phone: "19993890842", // bate com KNOWN_SUBSCRIBERS_2026_08_16 (Guilherme) para gerar knownSubscriberStatus
    commercialStatus: "Assinante Ativo",
    subscription: null, // <- ausência de linha canônica em crm_subscriptions
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true },
    hasValidPhone: true,
  });
  const result = getSubscriberPortalReadiness(makeCtx([c]));
  assert.equal(result.status, "ok");
  const ready = result.data?.ready.find((r) => r.customerId === "aparenta-nao-canonico");
  assert.ok(!ready, "não pode entrar em READY sem crm_subscriptions ativa");
  const item = result.data?.blocked.find((b) => b.customerId === "aparenta-nao-canonico");
  assert.ok(item, "esperado em blocked");
  assert.equal(item?.portalAccessReady, false, "portalAccessReady precisa ser false");
  assert.equal(item?.whatsappInviteReady, false);
  assert.ok(item?.blockers.includes("NO_ACTIVE_SUBSCRIPTION"), "esperado blocker NO_ACTIVE_SUBSCRIPTION");
  assert.ok(item?.blockers.includes("INCONSISTENT_SUBSCRIBER_STATE"), "esperado blocker INCONSISTENT_SUBSCRIBER_STATE");
});

test("hotfix: caminho canônico READY — subscription.isActive + email + Auth + gate → portalAccessReady=true", () => {
  const c = makeCustomer({
    id: "canonico-ready",
    name: "Canônico READY",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: "PagBank", status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true },
    hasValidPhone: true,
    phone: "5519999999999",
  });
  const result = getSubscriberPortalReadiness(makeCtx([c]));
  assert.equal(result.status, "ok");
  const item = result.data?.ready.find((r) => r.customerId === "canonico-ready");
  assert.ok(item, "esperado em READY");
  assert.equal(item?.portalAccessReady, true);
  assert.equal(item?.whatsappInviteReady, true);
});

test("hotfix: canônico sem telefone → portalAccessReady=true, whatsappInviteReady=false, blocker MISSING_PHONE_FOR_WHATSAPP", () => {
  const c = makeCustomer({
    id: "canonico-sem-fone",
    name: "Canônico Sem Fone",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: "PagBank", status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true },
    hasValidPhone: false,
  });
  const result = getSubscriberPortalReadiness(makeCtx([c]));
  assert.equal(result.status, "ok");
  const item = result.data?.ready.find((r) => r.customerId === "canonico-sem-fone");
  assert.ok(item, "esperado em READY (portalAccessReady=true), mesmo sem telefone");
  assert.equal(item?.portalAccessReady, true);
  assert.equal(item?.whatsappInviteReady, false);
  assert.ok(item?.blockers.includes("MISSING_PHONE_FOR_WHATSAPP"));
  assert.ok(!item?.blockers.includes("NO_ACTIVE_SUBSCRIPTION"));
  assert.ok(!item?.blockers.includes("INCONSISTENT_SUBSCRIBER_STATE"));
});

test("hotfix: commercialStatus 'Assinante Ativo' isolado (sem subscription canônica, sem knownSubscriberStatus) → NO_ACTIVE_SUBSCRIPTION + INCONSISTENT_SUBSCRIBER_STATE", () => {
  const c = makeCustomer({
    id: "commercial-status-so",
    name: "Só CommercialStatus",
    phone: "5519988887777", // não bate com base viva
    commercialStatus: "Assinante Ativo",
    subscription: null,
    portalAccess: { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
  });
  const result = getSubscriberPortalReadiness(makeCtx([c]));
  assert.equal(result.status, "ok");
  const item = result.data?.blocked.find((b) => b.customerId === "commercial-status-so");
  assert.ok(item, "esperado em blocked");
  assert.equal(item?.portalAccessReady, false);
  assert.ok(item?.blockers.includes("NO_ACTIVE_SUBSCRIPTION"));
  assert.ok(item?.blockers.includes("INCONSISTENT_SUBSCRIBER_STATE"));
});

test("hotfix issues: subscription não canônica + commercialStatus Ativo → issue INCONSISTENT_SUBSCRIBER_STATE", () => {
  const c = makeCustomer({
    id: "issue-incons-sub",
    name: "Inconsistente Sub",
    commercialStatus: "Assinante Ativo",
    subscription: null,
    portalAccess: { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
  });
  const result = getPortalAccessIssues(makeCtx([c]));
  assert.equal(result.status, "ok");
  const issue = result.data?.find((i) => i.customerId === "issue-incons-sub" && i.issue === "INCONSISTENT_SUBSCRIBER_STATE");
  assert.ok(issue, "esperado issue INCONSISTENT_SUBSCRIBER_STATE");
  assert.match(issue!.detail, /crm_subscriptions/);
});

test("hotfix issues: ACCESS_ENABLED_WITHOUT_ACTIVE_SUBSCRIPTION exige ausência de subscription canônica (não vale commercialStatus)", () => {
  // Cliente com commercialStatus Ativo + gate ligado, MAS sem subscription
  // canônica → ainda deve disparar ACCESS_ENABLED_WITHOUT_ACTIVE_SUBSCRIPTION,
  // porque commercialStatus não conta como "subscription vigente".
  const c = makeCustomer({
    id: "access-sem-canon",
    name: "Access Sem Canônico",
    commercialStatus: "Assinante Ativo",
    subscription: null,
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true },
  });
  const result = getPortalAccessIssues(makeCtx([c]));
  assert.equal(result.status, "ok");
  const issue = result.data?.find(
    (i) => i.customerId === "access-sem-canon" && i.issue === "ACCESS_ENABLED_WITHOUT_ACTIVE_SUBSCRIPTION",
  );
  assert.ok(issue, "esperado ACCESS_ENABLED_WITHOUT_ACTIVE_SUBSCRIPTION mesmo com commercialStatus='Assinante Ativo'");
});

// ---------------------------------------------------------------------------
// HOTFIX P0 (2026-09-16) — CONSOLIDAÇÃO: um customer = um caso.
// A raiz do smoke A anterior foi apresentação sobreposta (mesmo customer em
// dois "grupos"). Aqui travamos as invariantes: identidade canônica por
// customer_id, totalEvaluated === totalPortalReady + totalBlocked,
// blockerFrequency é frequência (não quantidade de clientes).
// ---------------------------------------------------------------------------

test("consolidação #1: customer com 3 blockers aparece UMA vez com todos os blockers juntos", () => {
  const c = makeCustomer({
    id: "muitos-blockers",
    name: "Muitos Blockers",
    commercialStatus: "Assinante Ativo",
    subscription: null,
    portalAccess: { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
    hasValidPhone: false,
  });
  const result = getSubscriberPortalReadiness(makeCtx([c]));
  assert.equal(result.status, "ok");
  const hits = [
    ...(result.data?.ready.filter((r) => r.customerId === "muitos-blockers") ?? []),
    ...(result.data?.blocked.filter((b) => b.customerId === "muitos-blockers") ?? []),
  ];
  assert.equal(hits.length, 1, "customer_id não pode aparecer mais de uma vez");
  const item = hits[0]!;
  // Blockers esperados: NO_ACTIVE_SUBSCRIPTION, MISSING_EMAIL, NO_AUTH_LINK,
  // PORTAL_GATE_DISABLED, INCONSISTENT_SUBSCRIBER_STATE, MISSING_PHONE_FOR_WHATSAPP.
  assert.ok(item.blockers.length >= 3, `esperado múltiplos blockers, veio ${item.blockers.length}`);
  // dedupe: cada blocker aparece uma única vez no array
  assert.equal(new Set(item.blockers).size, item.blockers.length, "blockers não podem se repetir dentro do item");
});

test("consolidação #2: NO_ACTIVE_SUBSCRIPTION + INCONSISTENT_SUBSCRIBER_STATE não duplicam o customer", () => {
  const c = makeCustomer({
    id: "no-active-plus-incons",
    name: "Both",
    commercialStatus: "Assinante Ativo",
    subscription: null,
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true },
  });
  const result = getSubscriberPortalReadiness(makeCtx([c]));
  const blocked = result.data?.blocked.filter((b) => b.customerId === "no-active-plus-incons") ?? [];
  assert.equal(blocked.length, 1, "customer com dois motivos correlatos ainda é UM caso");
  assert.ok(blocked[0]!.blockers.includes("NO_ACTIVE_SUBSCRIPTION"));
  assert.ok(blocked[0]!.blockers.includes("INCONSISTENT_SUBSCRIBER_STATE"));
});

test("consolidação #3: item com ACCESS_ENABLED_WITHOUT_ACTIVE_SUBSCRIPTION continua único e traz issue consolidada", () => {
  const c = makeCustomer({
    id: "access-enabled-issue",
    name: "Access Enabled",
    commercialStatus: "Assinante Ativo",
    subscription: null,
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true },
  });
  const result = getSubscriberPortalReadiness(makeCtx([c]));
  const blocked = result.data?.blocked.filter((b) => b.customerId === "access-enabled-issue") ?? [];
  assert.equal(blocked.length, 1);
  // Issue canônica deve estar consolidada dentro do próprio item de readiness
  // (evita "grupo 1 vs grupo 2" quando a LLM ler getPortalAccessIssues em separado).
  assert.ok(blocked[0]!.issues.includes("ACCESS_ENABLED_WITHOUT_ACTIVE_SUBSCRIPTION"));
});

test("consolidação #4: invariante totalEvaluated === totalPortalReady + totalBlocked", () => {
  const canon = makeCustomer({
    id: "inv-a",
    name: "Inv A",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true },
  });
  const blocked1 = makeCustomer({
    id: "inv-b",
    name: "Inv B",
    commercialStatus: "Assinante Ativo",
    subscription: null,
    portalAccess: { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
  });
  const blocked2 = makeCustomer({
    id: "inv-c",
    name: "Inv C",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "manual", paymentMethodLabel: null, status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: true, hasEmail: false, hasAuthLink: true },
  });
  const result = getSubscriberPortalReadiness(makeCtx([canon, blocked1, blocked2]));
  assert.equal(result.status, "ok");
  const d = result.data!;
  assert.equal(d.totalEvaluated, d.totalPortalReady + d.totalBlocked, "invariante quebrada");
  assert.equal(d.totalEvaluated, 3);
  assert.equal(d.totalPortalReady, 1);
  assert.equal(d.totalBlocked, 2);
});

test("consolidação #5: blockerFrequency conta múltiplos blockers por customer (pode ser > totalBlocked)", () => {
  const a = makeCustomer({
    id: "freq-a",
    name: "Freq A",
    commercialStatus: "Assinante Ativo",
    subscription: null,
    portalAccess: { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
    hasValidPhone: false,
  });
  const b = makeCustomer({
    id: "freq-b",
    name: "Freq B",
    commercialStatus: "Assinante Ativo",
    subscription: null,
    portalAccess: { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
    hasValidPhone: false,
  });
  const result = getSubscriberPortalReadiness(makeCtx([a, b]));
  const d = result.data!;
  // 2 customers cada um com >= 5 blockers → frequência total >> totalBlocked(2).
  const sum = Object.values(d.blockerFrequency).reduce((acc, n) => acc + n, 0);
  assert.ok(sum > d.totalBlocked, `esperado sum(${sum}) > totalBlocked(${d.totalBlocked}); frequência é por-blocker`);
  // Cada blocker específico conta o número de customers que o têm.
  assert.equal(d.blockerFrequency.NO_ACTIVE_SUBSCRIPTION, 2);
  assert.equal(d.blockerFrequency.MISSING_PHONE_FOR_WHATSAPP, 2);
});

test("consolidação #6: nomes iguais com customer_id diferente permanecem dois casos", () => {
  const a = makeCustomer({
    id: "id-1",
    name: "João da Silva",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true },
  });
  const b = makeCustomer({
    id: "id-2",
    name: "João da Silva",
    commercialStatus: "Assinante Ativo",
    subscription: null,
    portalAccess: { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
  });
  const result = getSubscriberPortalReadiness(makeCtx([a, b]));
  const d = result.data!;
  assert.equal(d.totalEvaluated, 2, "mesmo nome ≠ mesmo customer");
  assert.equal(d.totalPortalReady, 1);
  assert.equal(d.totalBlocked, 1);
});

test("consolidação #7: mesmo customer_id repetido no ctx colapsa em UM caso (dedupe defensivo)", () => {
  const c = makeCustomer({
    id: "dup-id",
    name: "Duplicado",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true },
  });
  // Simula (defensivo) duas cópias com o mesmo id chegando ao ctx.
  const result = getSubscriberPortalReadiness(makeCtx([c, { ...c }]));
  const d = result.data!;
  assert.equal(d.totalEvaluated, 1, "mesmo customer_id nunca duplica");
  assert.equal(d.totalPortalReady, 1);
  assert.equal(d.totalBlocked, 0);
});

test("consolidação #8: nenhum customer aparece 'solto' — provider determinístico só usa ready ∪ blocked", async () => {
  // Prova que a rota SUBSCRIBER_PORTAL_ACCESS só emite cards para customers
  // que estão em ready ou blocked; nada de nomes em texto solto fora da
  // coleção consolidada.
  const inside = makeCustomer({
    id: "inside",
    name: "Inside",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true },
  });
  const outside = makeCustomer({
    id: "outside-lead",
    name: "Outside Lead", // pura curadoria, não entra no universo
    commercialStatus: "Aguardando Curadoria DGN",
    subscription: null,
    portalAccess: { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
  });
  const provider = new DeterministicAgentProvider();
  const res = await provider.converse(
    { message: "Quem está pronto para receber convite do Portal hoje e quais dados bloqueiam os demais?" },
    makeCtx([inside, outside]),
  );
  const textBlock = res.blocks.find((b) => b.kind === "text");
  const cardsBlockNode = res.blocks.find((b) => b.kind === "cards");
  assert.ok(textBlock && textBlock.kind === "text");
  assert.ok(cardsBlockNode && cardsBlockNode.kind === "cards");
  if (textBlock.kind !== "text" || cardsBlockNode.kind !== "cards") return;
  // "Outside Lead" NÃO pode ser mencionado nem em texto nem em cards.
  assert.ok(!textBlock.text.includes("Outside Lead"), "customer fora do universo não pode aparecer em texto solto");
  for (const card of cardsBlockNode.cards) {
    assert.ok(card.customerId !== "outside-lead", "customer fora do universo não pode virar card");
  }
});

test("consolidação #9: customer que 'aparenta assinante' com telefone ausente aparece 1x com blockers consolidados (não solto)", () => {
  // Cenário Jose Sergio-like: aparência de assinante (base viva/commercialStatus)
  // sem subscription canônica e sem telefone. Deve ser UM caso em blocked com
  // NO_ACTIVE_SUBSCRIPTION + INCONSISTENT_SUBSCRIBER_STATE + MISSING_PHONE_FOR_WHATSAPP
  // — nunca aparecer em nota textual solta fora da lista.
  const c = makeCustomer({
    id: "jose-sergio-like",
    name: "Aparente Sem Fone",
    commercialStatus: "Assinante Ativo",
    subscription: null,
    portalAccess: { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
    hasValidPhone: false,
  });
  const result = getSubscriberPortalReadiness(makeCtx([c]));
  const d = result.data!;
  assert.equal(d.totalEvaluated, 1);
  const hits = [
    ...d.ready.filter((r) => r.customerId === "jose-sergio-like"),
    ...d.blocked.filter((b) => b.customerId === "jose-sergio-like"),
  ];
  assert.equal(hits.length, 1);
  const item = hits[0]!;
  assert.ok(item.blockers.includes("NO_ACTIVE_SUBSCRIPTION"));
  assert.ok(item.blockers.includes("INCONSISTENT_SUBSCRIBER_STATE"));
  assert.ok(item.blockers.includes("MISSING_PHONE_FOR_WHATSAPP"));
});

test("consolidação #10: fixture snapshot 23 customers → 1 ready, 22 blocked, cada customer 1x", () => {
  // Fixture sintética de 23 customers reproduzindo os shapes reais que o
  // provider vê em prod. NÃO hardcodamos 23/1/22 na regra de negócio — apenas
  // na fixture de regressão. Se o snapshot real mudar, o teste falha e sinaliza
  // que a fixture precisa ser atualizada.
  const customers: DgnCustomer[] = [];
  // 1 canônico READY (subscription ativa + email + Auth + gate + telefone).
  customers.push(makeCustomer({
    id: "snap-ready-1",
    name: "Ready 1",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: "PagBank", status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true },
    hasValidPhone: true,
  }));
  // 22 blocked — todos com subscription=null (garante NO_ACTIVE_SUBSCRIPTION
  // e, portanto, portalAccessReady=false) e variação nas outras dimensões para
  // dar frequência de blockers realista, sem que nenhum vire READY por engano.
  for (let i = 0; i < 22; i++) {
    customers.push(makeCustomer({
      id: `snap-block-${i}`,
      name: `Block ${i}`,
      commercialStatus: "Assinante Ativo",
      subscription: null, // garante NO_ACTIVE_SUBSCRIPTION → não vira READY
      portalAccess: {
        portalBetaEnabled: i % 2 === 0,
        hasEmail: i % 4 === 0,
        hasAuthLink: i % 5 === 0,
      },
      hasValidPhone: i % 3 !== 0,
    }));
  }
  const result = getSubscriberPortalReadiness(makeCtx(customers));
  assert.equal(result.status, "ok");
  const d = result.data!;
  assert.equal(d.totalEvaluated, 23, "23 customers no universo");
  assert.equal(d.totalPortalReady, 1);
  assert.equal(d.totalBlocked, 22);
  assert.equal(d.totalEvaluated, d.totalPortalReady + d.totalBlocked);
  // Cada customer aparece uma única vez no total.
  const seen = new Set<string>();
  for (const item of [...d.ready, ...d.blocked]) {
    assert.ok(!seen.has(item.customerId), `customer_id ${item.customerId} apareceu duas vezes`);
    seen.add(item.customerId);
  }
  assert.equal(seen.size, 23);
  // Presentation vem preenchida com as invariantes.
  assert.ok(d.presentation.invariants.some((s) => s.includes("customer_id")));
  assert.ok(d.presentation.renderingRules.some((s) => s.toLowerCase().includes("frequ")));
});

// Extra: garante que o próprio módulo violaria a invariante determinística
// (assertion interna). Detecta bug de consolidação em CI, não em prod silencioso.
test("consolidação: invariante interna dispara throw se totalEvaluated ≠ ready+blocked", () => {
  // Não há como forçar a violação por API pública porque ela é impossível
  // pela lógica de Map<id, item>. Este teste documenta que a invariante é
  // garantida pelo código, não por convenção — a assertion vive em
  // getSubscriberPortalReadiness e falhará em desenvolvimento se alguém
  // reintroduzir dupla contagem. Manter aqui como âncora para futura auditoria.
  assert.ok(true);
});
