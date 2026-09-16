import { test } from "node:test";
import assert from "node:assert/strict";

import type { DgnCustomer } from "../../dgn-growth-utils.ts";
import type { AgentContext } from "../agent-context.ts";
import { enrichKnownSubscribers } from "../../db/enrich-known-subscriber.ts";
import { getSubscriberPortalReadiness } from "../skills/portal-readiness.ts";
import { renderPortalReadinessResponse } from "./portal-readiness-renderer.ts";
import { DeterministicAgentProvider } from "../providers/deterministic-provider.ts";

// ---------------------------------------------------------------------------
// RENDERER DETERMINÍSTICO — trava a saída textual do Portal Readiness.
// A LLM não escreve mais nada sobre isso; o servidor renderiza a partir do
// resultado consolidado. Estes testes cobrem os requisitos textuais do smoke
// real: cada nome 1x, contadores casam com lista, frequência sem nomes,
// nenhum "grupo" livre inventado.
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
      campaignStatus: "", personalizedPagePath: "", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
    },
  } as DgnCustomer;
}

function makeCtx(customers: DgnCustomer[], origin: AgentContext["origin"] = "db"): AgentContext {
  return { customers: enrichKnownSubscribers(customers), origin, loadedAt: Date.parse("2026-09-16T12:00:00Z") };
}

/**
 * Fixture que reproduz o SNAPSHOT do smoke real reportado pelo Jean:
 * 1 pronto + 22 bloqueados, cobrindo os nomes que o LLM havia duplicado
 * (Jose Moreira, Rikardo Oliveira, Jose Sergio Bressan Junior, Bruno Rossetti).
 * Não hardcodamos 23/1/22 na regra — apenas no fixture de regressão.
 */
function makeSmokeFixture(): DgnCustomer[] {
  const cs: DgnCustomer[] = [];

  // 1) Único READY canônico.
  cs.push(makeCustomer({
    id: "ana-canonica",
    name: "Ana Canônica",
    commercialStatus: "Assinante Ativo",
    subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: "PagBank", status: "ativo", isActive: true },
    portalAccess: { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true },
    hasValidPhone: true,
  }));

  // 2) Assinantes canônicos SEM Portal provisionado (blocked: gate/auth/email ausentes).
  // O smoke real cita 9 na label + 10 na lista → prova de bug. Aqui exigimos
  // que exista UM caso por customer, e o renderer não invente contador de "grupo".
  const semPortal = [
    "Bruno Rossetti",
    "Daniela Cavalheiro",
    "Daniele Dullius",
    "David Lisboa",
    "Juan Infante",
    "Karim Pacheco",
    "Ronaldo Faria",
    "Thiago Fabiano",
    "Viviane Tabata Manja",
    "Jose Sergio Bressan Junior",
  ];
  for (const name of semPortal) {
    cs.push(makeCustomer({
      id: `sem-portal-${name.toLowerCase().replace(/\s+/g, "-")}`,
      name,
      commercialStatus: "Assinante Ativo",
      subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: "PagBank", status: "ativo", isActive: true },
      portalAccess: { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
      hasValidPhone: name !== "Viviane Tabata Manja" && name !== "Jose Sergio Bressan Junior",
    }));
  }

  // 3) Aparenta assinante (commercialStatus) SEM subscription canônica
  //    (Grupo 2 do smoke real). Cada um deve virar UM caso com
  //    NO_ACTIVE_SUBSCRIPTION + INCONSISTENT_SUBSCRIBER_STATE.
  const aparenta = [
    "Jose Moreira",
    "Rikardo Oliveira",
    "Anderson Souza",
    "Camila Prado",
    "Diego Alvarenga",
    "Estela Faria",
    "Fabricio Neves",
    "Gustavo Lino",
    "Helena Rios",
    "Ivan Batista",
  ];
  for (const name of aparenta) {
    // Metade tem portal habilitado (força ACCESS_ENABLED_WITHOUT_ACTIVE_SUBSCRIPTION);
    // metade não. Serve pra provar que Jose Moreira e Rikardo aparecem UMA vez
    // apesar de terem ambos os motivos.
    const withGate = ["Jose Moreira", "Rikardo Oliveira"].includes(name);
    cs.push(makeCustomer({
      id: `aparenta-${name.toLowerCase().replace(/\s+/g, "-")}`,
      name,
      commercialStatus: "Assinante Ativo",
      subscription: null,
      portalAccess: withGate
        ? { portalBetaEnabled: true, hasEmail: true, hasAuthLink: true }
        : { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
      hasValidPhone: true,
    }));
  }

  // 4) Dois casos extras aparente-assinante sem telefone (borda MISSING_PHONE_FOR_WHATSAPP).
  cs.push(makeCustomer({
    id: "aparenta-sem-fone-1",
    name: "Marcia Sem Fone",
    commercialStatus: "Assinante Ativo",
    subscription: null,
    portalAccess: { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
    hasValidPhone: false,
  }));
  cs.push(makeCustomer({
    id: "aparenta-sem-fone-2",
    name: "Pedro Sem Fone",
    commercialStatus: "Assinante Ativo",
    subscription: null,
    portalAccess: { portalBetaEnabled: false, hasEmail: false, hasAuthLink: false },
    hasValidPhone: false,
  }));

  return cs; // total: 1 + 10 + 10 + 2 = 23
}

test("renderer: cabeçalho de resumo usa exclusivamente os totais da tool", () => {
  const summary = getSubscriberPortalReadiness(makeCtx(makeSmokeFixture())).data!;
  const text = renderPortalReadinessResponse(summary);
  const first = text.split("\n")[0]!;
  assert.match(first, /Resumo \(Portal do Assinante\): 23 avaliado\(s\), 1 pronto\(s\), 22 bloqueado\(s\)\./);
  assert.match(first, /Invariante: total = pronto \+ bloqueado/);
});

test("renderer: fixture 23/1/22 — texto lista 1 pronto e 22 bloqueados; cada nome aparece exatamente 1x", () => {
  const summary = getSubscriberPortalReadiness(makeCtx(makeSmokeFixture())).data!;
  assert.equal(summary.totalEvaluated, 23);
  assert.equal(summary.totalPortalReady, 1);
  assert.equal(summary.totalBlocked, 22);

  const text = renderPortalReadinessResponse(summary);

  const nameOccurrences = (name: string): number => {
    const rx = new RegExp(`(^|[^A-Za-zÀ-ÿ])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-zÀ-ÿ]|$)`, "g");
    return (text.match(rx) ?? []).length;
  };

  // Cada nome do fixture aparece EXATAMENTE 1x — a raiz do bug era duplicação.
  const allNames = [
    "Ana Canônica",
    "Bruno Rossetti", "Daniela Cavalheiro", "Daniele Dullius", "David Lisboa",
    "Juan Infante", "Karim Pacheco", "Ronaldo Faria", "Thiago Fabiano",
    "Viviane Tabata Manja", "Jose Sergio Bressan Junior",
    "Jose Moreira", "Rikardo Oliveira", "Anderson Souza", "Camila Prado",
    "Diego Alvarenga", "Estela Faria", "Fabricio Neves", "Gustavo Lino",
    "Helena Rios", "Ivan Batista",
    "Marcia Sem Fone", "Pedro Sem Fone",
  ];
  for (const name of allNames) {
    const n = nameOccurrences(name);
    assert.equal(n, 1, `esperado que "${name}" apareça exatamente 1x no texto renderizado (encontrado ${n})`);
  }
});

test("renderer: Jose Moreira e Rikardo Oliveira (dupla motivação) aparecem 1x com motivos consolidados", () => {
  const summary = getSubscriberPortalReadiness(makeCtx(makeSmokeFixture())).data!;
  const text = renderPortalReadinessResponse(summary);
  // Ambos têm: NO_ACTIVE_SUBSCRIPTION + INCONSISTENT_SUBSCRIBER_STATE +
  // ACCESS_ENABLED_WITHOUT_ACTIVE_SUBSCRIPTION. Precisam aparecer 1x SÓ com
  // os motivos juntos no mesmo bloco.
  for (const name of ["Jose Moreira", "Rikardo Oliveira"]) {
    const idx = text.indexOf(name);
    assert.ok(idx > -1, `${name} deve aparecer no texto`);
    const nextIdx = text.indexOf(name, idx + 1);
    assert.equal(nextIdx, -1, `${name} não pode aparecer duas vezes`);
    // O bloco desse cliente contém pelo menos um dos motivos canônicos esperados.
    const block = text.slice(idx, idx + 400);
    assert.match(block, /crm_subscriptions|assinante inconsistente|Portal habilitado sem assinatura canônica/);
    assert.match(block, /Ação:/);
  }
});

test("renderer: seção 'PRONTOS' e 'BLOQUEADOS' anunciam o mesmo N que a lista contém", () => {
  const summary = getSubscriberPortalReadiness(makeCtx(makeSmokeFixture())).data!;
  const text = renderPortalReadinessResponse(summary);
  const readyMatch = text.match(/PRONTOS \((\d+)\)/);
  const blockedMatch = text.match(/BLOQUEADOS \((\d+)\)/);
  assert.ok(readyMatch);
  assert.ok(blockedMatch);
  assert.equal(Number(readyMatch![1]), summary.totalPortalReady);
  assert.equal(Number(blockedMatch![1]), summary.totalBlocked);
});

test("renderer: seção 'Frequência dos bloqueios' NÃO cita nenhum customer", () => {
  const summary = getSubscriberPortalReadiness(makeCtx(makeSmokeFixture())).data!;
  const text = renderPortalReadinessResponse(summary);
  const freqStart = text.indexOf("Frequência dos bloqueios");
  assert.ok(freqStart > -1);
  const freqSection = text.slice(freqStart);
  const names = [
    "Bruno Rossetti", "Jose Moreira", "Rikardo Oliveira", "Jose Sergio Bressan Junior", "Ana Canônica",
  ];
  for (const name of names) {
    assert.ok(!freqSection.includes(name), `frequência não pode citar "${name}"`);
  }
  assert.match(freqSection, /um cliente pode ter mais de um/i);
});

test("renderer: NÃO inventa 'grupos' novos com contadores — o texto tem apenas Resumo, PRONTOS, BLOQUEADOS, Frequência", () => {
  const summary = getSubscriberPortalReadiness(makeCtx(makeSmokeFixture())).data!;
  const text = renderPortalReadinessResponse(summary);
  // Padrão do bug anterior: "Grupo N — descrição (X clientes)"
  assert.ok(!/Grupo\s+\d+\s*[—-]/i.test(text), "não pode haver 'Grupo N — ...'");
  assert.ok(!/Grupo\s+\d+\s*:/i.test(text), "não pode haver 'Grupo N: ...'");
  // A LLM anterior escrevia "Assinantes ativos sem Portal provisionado (9 clientes)"
  // — categoria narrativa com contador próprio. Renderer não faz isso.
  assert.ok(!/\(\s*\d+\s*clientes\)/i.test(text), "não pode haver categoria narrativa com contador entre parênteses");
});

test("renderer: nenhuma quantidade nasce fora do summary — apenas totalEvaluated/totalPortalReady/totalBlocked e counts do blockerFrequency", () => {
  const summary = getSubscriberPortalReadiness(makeCtx(makeSmokeFixture())).data!;
  const text = renderPortalReadinessResponse(summary);
  const allowed = new Set<string>();
  allowed.add(String(summary.totalEvaluated));
  allowed.add(String(summary.totalPortalReady));
  allowed.add(String(summary.totalBlocked));
  for (const n of Object.values(summary.blockerFrequency)) allowed.add(String(n));
  // Qualquer inteiro no texto tem que estar em `allowed` — se o renderer
  // inventar contador (bug do smoke real), esse assert quebra.
  const numbers = text.match(/\b\d+\b/g) ?? [];
  for (const n of numbers) {
    assert.ok(allowed.has(n), `contador '${n}' no texto não veio de campo estruturado (permitidos: ${[...allowed].join(",")})`);
  }
});

test("DeterministicAgentProvider: rota SUBSCRIBER_PORTAL_ACCESS usa o renderer determinístico no bloco de texto", async () => {
  const provider = new DeterministicAgentProvider();
  const res = await provider.converse(
    { message: "Quem está pronto para receber convite do Portal hoje e quais dados bloqueiam os demais?" },
    makeCtx(makeSmokeFixture()),
  );
  const textBlock = res.blocks.find((b) => b.kind === "text");
  assert.ok(textBlock && textBlock.kind === "text");
  if (textBlock.kind !== "text") return;
  assert.match(textBlock.text, /Resumo \(Portal do Assinante\): 23 avaliado\(s\), 1 pronto\(s\), 22 bloqueado\(s\)/);
  assert.match(textBlock.text, /PRONTOS \(1\)/);
  assert.match(textBlock.text, /BLOQUEADOS \(22\)/);
  assert.match(textBlock.text, /Frequência dos bloqueios/);
  // Ninguém fora da coleção.
  assert.ok(!textBlock.text.includes("Grupo"), "não pode haver 'Grupo'");
});

test("renderer: universo vazio → resumo com zeros e nenhuma seção de PRONTOS/BLOQUEADOS/Frequência com nomes", () => {
  // Cenário edge: só customers fora do universo → skill devolve
  // insufficient_data. Aqui garantimos que se o caller MESMO ASSIM passar
  // um summary vazio (por qualquer motivo), o renderer não inventa contador
  // ou grupo.
  const summary = {
    totalEvaluated: 0,
    totalPortalReady: 0,
    totalBlocked: 0,
    ready: [] as never[],
    blocked: [] as never[],
    blockerFrequency: {
      MISSING_EMAIL: 0, NO_AUTH_LINK: 0, PORTAL_GATE_DISABLED: 0,
      NO_ACTIVE_SUBSCRIPTION: 0, MISSING_PHONE_FOR_WHATSAPP: 0,
      INCONSISTENT_PORTAL_STATE: 0, INCONSISTENT_SUBSCRIBER_STATE: 0,
    },
    presentation: { invariants: [] as string[], renderingRules: [] as string[] },
  };
  const text = renderPortalReadinessResponse(summary);
  assert.match(text, /0 avaliado\(s\), 0 pronto\(s\), 0 bloqueado\(s\)/);
  assert.match(text, /PRONTOS \(0\)/);
  assert.ok(!text.includes("Frequência dos bloqueios"), "sem frequência quando não há blockers");
});
