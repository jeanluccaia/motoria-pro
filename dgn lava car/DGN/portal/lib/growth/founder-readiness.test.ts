import { test } from "node:test";
import assert from "node:assert/strict";

import type { DgnCustomer } from "./dgn-growth-data.ts";
import { getFounderReadiness } from "./founder-readiness.ts";

// -----------------------------------------------------------------------------
// Prova de que readiness ≠ eligibility: cliente elegível ainda pode não estar
// pronto para receber convite (precisa curadoria/seleção primeiro). Cliente
// inelegível (assinante) mostra explicitamente o motivo. Founder confirmado
// nunca aparece como "aguardando curadoria" mesmo tendo elegibilidade
// bloqueada.
// -----------------------------------------------------------------------------

function baseCustomer(overrides: Partial<DgnCustomer> & { id: string; name: string }): DgnCustomer {
  return {
    id: overrides.id, name: overrides.name, phone: "", vehicle: "", plate: "",
    companyLink: "", origin: "", attendanceHistory: [], washCount: 0,
    historicalValue: 0, customerSince: "2024-01-01", lastAttendance: "2026-08-01",
    scoreDgn: overrides.scoreDgn ?? 50, recommendedPlan: "Smart",
    commercialStatus: overrides.commercialStatus ?? "Aguardando Curadoria DGN",
    recurrence: "", averageVisitIntervalDays: 0, hasValidPhone: true,
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
    knownSubscriberPlan: overrides.knownSubscriberPlan,
    knownSubscriberStatus: overrides.knownSubscriberStatus,
  } as DgnCustomer;
}

test("awaiting_curation: cliente elegível, sem passagem pela curadoria", () => {
  const c = baseCustomer({ id: "c1", name: "Cliente Novo", scoreDgn: 70 });
  const r = getFounderReadiness(c);
  assert.equal(r.state, "awaiting_curation");
  assert.equal(r.primaryCta, "Abrir Curadoria");
});

test("curated: founderStatus recomendado", () => {
  const c = baseCustomer({
    id: "c2", name: "Curado",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: false, founderNumber: "", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "", paymentLink: "", lastAction: "",
      nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      founderStatus: "recomendado",
    } as DgnCustomer["campaign"],
  });
  const r = getFounderReadiness(c);
  assert.equal(r.state, "curated");
  assert.equal(r.primaryCta, "Preparar convite Founder");
});

test("selected: founderStatus selecionado sem convite ativo", () => {
  const c = baseCustomer({
    id: "c3", name: "Selecionado",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "", paymentLink: "", lastAction: "",
      nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      founderStatus: "selecionado",
    } as DgnCustomer["campaign"],
  });
  const r = getFounderReadiness(c);
  assert.equal(r.state, "selected");
  assert.equal(r.primaryCta, "Preparar convite Founder");
});

test("invited: convite ativo mas ainda não confirmado", () => {
  const c = baseCustomer({
    id: "c4", name: "Convidado",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Convite criado", personalizedPagePath: "/f/c4", paymentLink: "", lastAction: "",
      nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
    },
  });
  const r = getFounderReadiness(c);
  assert.equal(r.state, "invited");
  assert.equal(r.primaryCta, "Preparar follow-up Founder");
});

test("founder: confirmado sobrescreve eligibility ineligible", () => {
  const c = baseCustomer({
    id: "c5", name: "Founder",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "001", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "/f/c5", paymentLink: "", lastAction: "",
      nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      founderStatus: "confirmado",
    } as DgnCustomer["campaign"],
  });
  const r = getFounderReadiness(c);
  assert.equal(r.state, "founder");
  assert.equal(r.primaryCta, "Preparar follow-up Founder");
});

test("ineligible: assinante ativo (William Farias, renovacao_pendente) nunca vira awaiting_curation", () => {
  const william = baseCustomer({
    id: "william-farias", name: "William Farias", phone: "19993658346",
    // Enriquecimento server-side: William é Smart em renovação pendente.
    knownSubscriberPlan: "Smart", knownSubscriberStatus: "renovacao_pendente",
  });
  const r = getFounderReadiness(william);
  assert.equal(r.state, "ineligible");
  assert.match(r.eligibilityReason ?? "", /renovacao_pendente|assinante_ativo|assinatura_detectada/);
});

test("awaiting_curation NUNCA sugere Preparar convite Founder", () => {
  const c = baseCustomer({ id: "c6", name: "Elegível novo" });
  const r = getFounderReadiness(c);
  assert.equal(r.state, "awaiting_curation");
  assert.notEqual(r.primaryCta, "Preparar convite Founder");
});
