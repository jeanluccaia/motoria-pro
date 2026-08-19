import { test } from "node:test";
import assert from "node:assert/strict";

import { isFounderAcquisitionEligible, matchKnownSubscriber, partitionByEligibility } from "./founder-eligibility.ts";
import type { DgnCustomer } from "./dgn-growth-data.ts";

// Fixture mínima: só os campos consultados pelo helper.
function makeCustomer(overrides: Partial<DgnCustomer> & { id: string; name: string }): DgnCustomer {
  return {
    id: overrides.id,
    name: overrides.name,
    phone: overrides.phone ?? "",
    vehicle: "A definir",
    plate: overrides.plate ?? "",
    companyLink: "",
    origin: "",
    attendanceHistory: [],
    washCount: 0,
    historicalValue: 0,
    customerSince: "A definir",
    lastAttendance: "A definir",
    scoreDgn: 0,
    recommendedPlan: "Smart",
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

// -----------------------------------------------------------------------------
// Assinantes conhecidos → não elegíveis
// -----------------------------------------------------------------------------

test("Iara Menezes é reconhecida pelo telefone e bloqueada como assinante Priority", () => {
  const iara = makeCustomer({ id: "iara", name: "Iara Menezes", phone: "19991931501" });
  const result = isFounderAcquisitionEligible(iara);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "assinante_ativo");
  assert.match(result.operatorMessage ?? "", /Priority/);
});

test("Guilherme Lopes (dois veículos) é bloqueado como assinante", () => {
  const guilherme = makeCustomer({ id: "guilherme-lopes", name: "Guilherme Lopes", phone: "19993890842", plate: "TKO5G04" });
  const result = isFounderAcquisitionEligible(guilherme);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "assinante_ativo");
});

test("Guilherme reconhecido também via segunda placa (TJX2D23)", () => {
  const guilherme = makeCustomer({ id: "guilherme-alt", name: "Nome Diferente", phone: "", plate: "TJX2D23" });
  const match = matchKnownSubscriber(guilherme);
  assert.ok(match);
  assert.equal(match?.record.name, "Guilherme Lopes");
  assert.equal(match?.reason, "plate");
});

test("Benedito, José e Rikardo permanecem bloqueados como Founder confirmado", () => {
  for (const id of ["benedito-constantino", "jose-moreira", "rikardo-oliveira"]) {
    const c = makeCustomer({ id, name: id });
    const result = isFounderAcquisitionEligible(c);
    assert.equal(result.eligible, false, `${id} deveria ser bloqueado`);
    assert.equal(result.reason, "founder_confirmado");
  }
});

test("Wellington Felix é bloqueado como assinante", () => {
  const wellington = makeCustomer({ id: "wellington-felix", name: "Wellington Felix", phone: "19981260520" });
  assert.equal(isFounderAcquisitionEligible(wellington).eligible, false);
});

// -----------------------------------------------------------------------------
// Renovação pendente
// -----------------------------------------------------------------------------

test("William Farias (renovação pendente) fica fora da fila com motivo específico", () => {
  const william = makeCustomer({ id: "william-farias", name: "William Farias", phone: "19993658346" });
  const result = isFounderAcquisitionEligible(william);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "renovacao_pendente");
  assert.match(result.operatorMessage ?? "", /renovação pendente/i);
});

test("Paulo Daniel (renovação pendente) fica fora da fila", () => {
  const paulo = makeCustomer({ id: "paulo-daniel", name: "Paulo Daniel", phone: "19983881149", plate: "FMP4C02" });
  const result = isFounderAcquisitionEligible(paulo);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "renovacao_pendente");
});

test("Nina de Melo (renovação pendente) fica fora — reconhecida também via alias Medley Nina", () => {
  const nina = makeCustomer({ id: "medley-nina", name: "Medley Nina", phone: "19991319301" });
  const result = isFounderAcquisitionEligible(nina);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "renovacao_pendente");
});

// -----------------------------------------------------------------------------
// Cliente não assinante — elegível
// -----------------------------------------------------------------------------

test("Cliente não assinante com telefone válido é elegível", () => {
  const c = makeCustomer({ id: "novo-lead", name: "Fulano de Tal", phone: "19999998888" });
  const result = isFounderAcquisitionEligible(c);
  assert.equal(result.eligible, true);
  assert.equal(result.reason, undefined);
});

test("Plano recomendado (Priority) sozinho não torna cliente inelegível", () => {
  const c = makeCustomer({ id: "outro-lead", name: "Cliente X", phone: "19988887777", recommendedPlan: "Priority" });
  const result = isFounderAcquisitionEligible(c);
  assert.equal(result.eligible, true, "recommendedPlan não deve entrar na regra de assinatura");
});

// -----------------------------------------------------------------------------
// Estados de bloqueio de pipeline
// -----------------------------------------------------------------------------

test("Cliente com commercialStage=descartado sai da fila", () => {
  const c = makeCustomer({
    id: "desc-1", name: "Descartado", phone: "19977776666",
    campaign: {
      currentCampaign: "", founderSelected: false, founderNumber: "", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "", paymentLink: "", lastAction: "",
      nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "", commercialStage: "descartado",
    },
  });
  const result = isFounderAcquisitionEligible(c);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "descartado");
});

test("Cliente sem telefone válido sai da fila (dados mínimos)", () => {
  const c = makeCustomer({ id: "sem-fone", name: "Sem Fone", hasValidPhone: false });
  const result = isFounderAcquisitionEligible(c);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "sem_dados_minimos");
});

// -----------------------------------------------------------------------------
// partitionByEligibility
// -----------------------------------------------------------------------------

test("partitionByEligibility separa elegíveis, assinantes e demais", () => {
  const customers = [
    makeCustomer({ id: "novo-lead", name: "Fulano de Tal", phone: "19999998888" }),
    makeCustomer({ id: "iara", name: "Iara Menezes", phone: "19991931501" }),
    makeCustomer({ id: "william-farias", name: "William Farias", phone: "19993658346" }),
    makeCustomer({ id: "sem-fone", name: "Sem Fone", hasValidPhone: false }),
    makeCustomer({ id: "benedito-constantino", name: "Benedito Constantino" }),
  ];
  const { eligible, subscribers, other } = partitionByEligibility(customers);
  assert.equal(eligible.length, 1);
  assert.equal(eligible[0].id, "novo-lead");
  assert.equal(subscribers.length, 3, "Iara + William + Benedito");
  assert.equal(other.length, 1);
  assert.equal(other[0].customer.id, "sem-fone");
});
