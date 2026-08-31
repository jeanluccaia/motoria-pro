import { test } from "node:test";
import assert from "node:assert/strict";

import type { DgnCustomer } from "../../dgn-growth-data.ts";
import type { AgentContext } from "../agent-context.ts";
import { BATCH_PREPARATION_CAP } from "../types.ts";
import { prepareFollowupMessage } from "./prepare-followup-message.ts";
import { prepareFounderApproach } from "./prepare-founder-approach.ts";
import { prepareRenewalMessage } from "./prepare-renewal-message.ts";
import { prepareCustomerContact } from "./prepare-customer-contact.ts";
import { prepareCurationBrief } from "./prepare-curation-brief.ts";
import { prepareDailyAttackPlan } from "./prepare-daily-attack-plan.ts";

// -----------------------------------------------------------------------------
// Provas de comportamento das 6 skills prepare_only:
// - Elegibilidade: recusa Founder acquisition para assinantes/founders confirmados.
// - insufficient_data: renewal sem base de assinatura, followup sem engajamento.
// - Batch cap: prepare_daily_attack_plan nunca ultrapassa BATCH_PREPARATION_CAP.
// - Disclaimer canônico: presente em toda resposta ok.
// Fixtures reais da base viva 4uCar são usados para credibilidade — telefones
// exatos, planos e status conforme known-subscribers.ts.
// -----------------------------------------------------------------------------

const DISCLAIMER = "Preparado pela IA · revisar antes de enviar";

function baseCustomer(overrides: Partial<DgnCustomer> & { id: string; name: string }): DgnCustomer {
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
    lastAttendance: "2026-08-01",
    scoreDgn: overrides.scoreDgn ?? 40,
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

function ctxOf(customers: DgnCustomer[]): AgentContext {
  return { customers, origin: "json", loadedAt: Date.parse("2026-08-31T12:00:00Z") };
}

// ---------------------------------------------------------------------------
// prepare_founder_approach — elegibilidade
// ---------------------------------------------------------------------------

test("prepare_founder_approach: recusa Founder confirmado (Benedito Nº001)", () => {
  const benedito = baseCustomer({
    id: "benedito-constantino",
    name: "Benedito Constantino",
    phone: "19981723362",
    scoreDgn: 90,
    washCount: 15,
  });
  const result = prepareFounderApproach(ctxOf([benedito]), benedito.id);
  assert.equal(result.status, "unavailable");
  assert.ok(!result.data, "não deve gerar mensagem");
  assert.match(result.facts.join("\n"), /Motivo canônico/);
});

test("prepare_founder_approach: recusa assinante ativo (William Farias)", () => {
  const william = baseCustomer({
    id: "william-farias",
    name: "William Farias",
    phone: "19993658346",
    scoreDgn: 70,
    washCount: 12,
  });
  const result = prepareFounderApproach(ctxOf([william]), william.id);
  assert.equal(result.status, "unavailable", "assinante não pode ser aquisição");
});

test("prepare_founder_approach: elegível → mensagem pronta com disclaimer", () => {
  const novo = baseCustomer({
    id: "novo-cliente",
    name: "Novo Cliente Teste",
    phone: "11987654321",
    scoreDgn: 82,
    washCount: 8,
    commercialStatus: "Aguardando Curadoria DGN",
  });
  const result = prepareFounderApproach(ctxOf([novo]), novo.id);
  assert.equal(result.status, "ok");
  assert.ok(result.data, "deve preparar mensagem");
  assert.equal(result.data?.disclaimer, DISCLAIMER);
  assert.equal(result.data?.objective, "founder_acquisition");
  assert.ok(result.data?.draftMessage.length > 20, "mensagem não pode ser vazia");
});

// ---------------------------------------------------------------------------
// prepare_renewal_message — insufficient_data para não-assinantes
// ---------------------------------------------------------------------------

test("prepare_renewal_message: insufficient_data para cliente sem base de assinatura", () => {
  const novo = baseCustomer({
    id: "novo-cliente",
    name: "Novo Cliente Teste",
    phone: "11987654321",
  });
  const result = prepareRenewalMessage(ctxOf([novo]), novo.id);
  assert.equal(result.status, "insufficient_data");
});

test("prepare_renewal_message: OK para assinante com renovação pendente (William)", () => {
  const william = baseCustomer({
    id: "william-farias",
    name: "William Farias",
    phone: "19993658346",
  });
  const result = prepareRenewalMessage(ctxOf([william]), william.id);
  assert.equal(result.status, "ok");
  assert.equal(result.data?.objective, "renewal");
  assert.equal(result.data?.disclaimer, DISCLAIMER);
});

test("prepare_renewal_message: insufficient_data para assinante ativo sem renovação pendente (Guido)", () => {
  const guido = baseCustomer({
    id: "guido-sabbadin",
    name: "Guido Sabbadin",
    phone: "19981118226",
  });
  const result = prepareRenewalMessage(ctxOf([guido]), guido.id);
  assert.equal(result.status, "insufficient_data");
});

// ---------------------------------------------------------------------------
// prepare_followup_message — insufficient_data sem engajamento nem convite
// ---------------------------------------------------------------------------

test("prepare_followup_message: insufficient_data sem convite nem engajamento", () => {
  const novo = baseCustomer({ id: "novo-cliente", name: "Novo Cliente Teste" });
  const result = prepareFollowupMessage(ctxOf([novo]), novo.id);
  assert.equal(result.status, "insufficient_data");
});

test("prepare_followup_message: OK quando cliente visualizou convite", () => {
  const engajado = baseCustomer({
    id: "engajado",
    name: "Cliente Engajado",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Convite criado", personalizedPagePath: "/f/engajado", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      dates: { inviteCreatedAt: "2026-08-25T10:00:00Z", viewedAt: "2026-08-26T10:00:00Z" },
      engagement: {
        viewedAt: "2026-08-26T10:00:00Z",
        lastViewedAt: "2026-08-26T10:00:00Z",
        viewCount: 2,
        confirmClickedAt: "", confirmClickCount: 0, vipClickedAt: "", vipClickCount: 0,
      },
    },
  });
  const result = prepareFollowupMessage(ctxOf([engajado]), engajado.id);
  assert.equal(result.status, "ok");
  assert.equal(result.data?.objective, "followup");
});

// ---------------------------------------------------------------------------
// prepare_customer_contact — validações cruzadas
// ---------------------------------------------------------------------------

test("prepare_customer_contact: rejeita founder_acquisition para assinante ativo", () => {
  const william = baseCustomer({
    id: "william-farias",
    name: "William Farias",
    phone: "19993658346",
  });
  const result = prepareCustomerContact(ctxOf([william]), william.id, "founder_acquisition");
  assert.equal(result.status, "unavailable");
});

test("prepare_customer_contact: aceita relationship para qualquer cliente ativo", () => {
  const novo = baseCustomer({ id: "novo-cliente", name: "Novo Cliente Teste" });
  const result = prepareCustomerContact(ctxOf([novo]), novo.id, "relationship");
  assert.equal(result.status, "ok");
  assert.equal(result.data?.objective, "relationship");
});

// ---------------------------------------------------------------------------
// prepare_curation_brief — 5 seções + avoid explicando inelegibilidade
// ---------------------------------------------------------------------------

test("prepare_curation_brief: brief tem 5 seções e disclaimer", () => {
  const novo = baseCustomer({
    id: "novo-cliente",
    name: "Novo Cliente Teste",
    scoreDgn: 75,
    washCount: 10,
  });
  const result = prepareCurationBrief(ctxOf([novo]), novo.id);
  assert.equal(result.status, "ok");
  assert.ok(result.data?.who);
  assert.ok(result.data?.whyHere);
  assert.ok(result.data?.bestArgument);
  assert.ok(result.data?.avoid);
  assert.ok(result.data?.suggestedApproach);
  assert.ok(result.data?.nextStep);
  assert.equal(result.data?.disclaimer, DISCLAIMER);
});

test("prepare_curation_brief: assinante → avoid alerta para não tratar como aquisição", () => {
  const william = baseCustomer({
    id: "william-farias",
    name: "William Farias",
    phone: "19993658346",
    scoreDgn: 65,
  });
  const result = prepareCurationBrief(ctxOf([william]), william.id);
  assert.equal(result.status, "ok");
  assert.match(result.data?.avoid ?? "", /assinante|Smart|NÃO tratar como aquisição/i);
});

// ---------------------------------------------------------------------------
// prepare_daily_attack_plan — batch cap
// ---------------------------------------------------------------------------

function highScoreCustomer(i: number): DgnCustomer {
  return baseCustomer({
    id: `alvo-${i}`,
    name: `Alvo ${i}`,
    phone: `1199000${String(i).padStart(4, "0")}`,
    scoreDgn: 85,
    washCount: 10,
    commercialStatus: "Aguardando Curadoria DGN",
  });
}

test("prepare_daily_attack_plan: rascunhos inline nunca ultrapassam BATCH_PREPARATION_CAP", () => {
  const candidatos = Array.from({ length: 10 }, (_, i) => highScoreCustomer(i));
  const result = prepareDailyAttackPlan(ctxOf(candidatos), { prepareDrafts: 10 });
  assert.equal(result.status, "ok");
  assert.ok(result.data);
  assert.ok(
    result.data!.preparedDrafts.length <= BATCH_PREPARATION_CAP,
    `esperado <= ${BATCH_PREPARATION_CAP}, veio ${result.data!.preparedDrafts.length}`,
  );
  assert.match(result.data?.preparedNotice ?? "", /Limitado a 5|revisão humana/i);
  assert.equal(result.data?.disclaimer, DISCLAIMER);
});

test("prepare_daily_attack_plan: sem customers ainda inclui subscribers da base viva 4uCar", () => {
  // Base viva 4uCar carrega renovações pendentes (William/Paulo/Nina) mesmo
  // com ctx.customers vazio — Prioridade 1 nunca deve ficar em branco quando
  // há assinantes conhecidos em atenção.
  const result = prepareDailyAttackPlan(ctxOf([]));
  assert.equal(result.status, "ok");
  const p1 = result.data?.priorities.find((p) => p.label.startsWith("Prioridade 1"));
  assert.ok(p1, "Prioridade 1 (Receita em risco) deve estar presente");
  assert.ok((p1?.cards.length ?? 0) > 0, "Prioridade 1 deve ter pelo menos 1 assinante");
});

test("prepare_daily_attack_plan: prepareDrafts=3 respeita solicitação abaixo do cap", () => {
  const candidatos = Array.from({ length: 6 }, (_, i) => highScoreCustomer(i));
  const result = prepareDailyAttackPlan(ctxOf(candidatos), { prepareDrafts: 3 });
  assert.equal(result.status, "ok");
  assert.ok(result.data);
  assert.ok(
    result.data!.preparedDrafts.length <= 3,
    "não deveria exceder o solicitado",
  );
});
