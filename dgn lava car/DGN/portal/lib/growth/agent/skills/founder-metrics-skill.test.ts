import { test } from "node:test";
import assert from "node:assert/strict";

import type { DgnCustomer } from "../../dgn-growth-data.ts";
import type { AgentContext } from "../agent-context.ts";
import { getFounderMetrics } from "./founder-metrics-skill.ts";

function baseCustomer(overrides: Partial<DgnCustomer> & { id: string; name: string }): DgnCustomer {
  return {
    id: overrides.id, name: overrides.name, phone: "", vehicle: "", plate: "",
    companyLink: "", origin: "", attendanceHistory: [], washCount: 0,
    historicalValue: 0, customerSince: "2024-01-01", lastAttendance: "2026-08-01",
    scoreDgn: 0, recommendedPlan: "Smart",
    commercialStatus: "Aguardando Curadoria DGN", recurrence: "",
    averageVisitIntervalDays: 0, hasValidPhone: true,
    curation: { profile: "", originGroup: "", commercialProfile: "", idealSchedule: "", founderDecision: "", founderNumber: "", internalNotes: "" },
    campaign: overrides.campaign ?? { currentCampaign: "", founderSelected: false, founderNumber: "", founderCondition: "", campaignStatus: "", personalizedPagePath: "", paymentLink: "", lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "", kitStatus: "", cardStatus: "" },
  } as DgnCustomer;
}

function ctx(customers: DgnCustomer[]): AgentContext {
  return { customers, origin: "json", loadedAt: Date.parse("2026-08-31T15:00:00Z") };
}

test("get_founder_metrics: confirmedFounders = 3 (base viva)", () => {
  const r = getFounderMetrics(ctx([]));
  assert.equal(r.status, "ok");
  assert.equal(r.data?.confirmedFounders, 3);
  assert.equal(r.data?.available, 27);
  assert.equal(r.data?.goal, 30);
});

test("get_founder_metrics: nextAvailableFounderNumber = 4 (Nº001/002/003 preservados)", () => {
  const r = getFounderMetrics(ctx([]));
  assert.equal(r.data?.nextAvailableFounderNumber, 4);
  assert.equal(r.data?.nextAvailableFounderLabel, "004");
});

test("get_founder_metrics: facts dizem 'Próxima vaga: Nº004' e nunca afirmam que Iara ocupa", () => {
  const r = getFounderMetrics(ctx([]));
  const joined = r.facts.join(" \n ");
  assert.match(joined, /Próxima vaga Founder disponível: Nº004/);
  assert.match(joined, /Founders confirmados: 3/);
  // Nenhuma menção a "reaberta" (semântica banida).
  assert.doesNotMatch(joined, /reaberta/i);
  // "Iara ocupa" positivo é proibido; "NÃO ocupa" (com NEG) é o correto.
  assert.doesNotMatch(joined, /Iara[^.]*[^ÃOã][^ãOÃ ]?\s+ocupa\b/i);
  // Sanity contrário — deve haver a afirmação explícita "NÃO ocupa vaga".
  assert.match(joined, /Iara[^.]*NÃO ocupa vaga/);
});

test("get_founder_metrics: Iara aparece como histórico legado (não ocupa vaga)", () => {
  const r = getFounderMetrics(ctx([]));
  const notes = (r.data?.legacyFounderNotes ?? []).join(" \n ");
  assert.match(notes, /Iara/);
  assert.match(notes, /assinante Priority/);
  assert.match(notes, /NÃO ocupa vaga/);
});

test("get_founder_metrics: inference confirma que Nº004 está livre", () => {
  const r = getFounderMetrics(ctx([]));
  const joined = r.inferences.join(" \n ");
  assert.match(joined, /Nº004 está livre/);
});

test("get_founder_metrics: pipeline conta corretamente convite em aberto", () => {
  const c = baseCustomer({
    id: "c1", name: "C1",
    campaign: { currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "", campaignStatus: "Convite criado", personalizedPagePath: "/f/c1", paymentLink: "", lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "", kitStatus: "", cardStatus: "" },
  });
  const r = getFounderMetrics(ctx([c]));
  assert.equal(r.data?.pipeline.invitesOpen, 1);
  assert.equal(r.data?.openInvites, 1);
});
