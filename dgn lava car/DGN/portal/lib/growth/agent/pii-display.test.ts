import { test } from "node:test";
import assert from "node:assert/strict";

import type { DgnCustomer } from "../dgn-growth-data.ts";
import { buildDisplayIdentityRows, formatScoreDgn } from "./pii-display.ts";

function baseCustomer(overrides: Partial<DgnCustomer> & { id: string; name: string }): DgnCustomer {
  return {
    id: overrides.id, name: overrides.name,
    phone: overrides.phone ?? "(19) 99999-1234",
    vehicle: overrides.vehicle ?? "Toyota Corolla",
    plate: overrides.plate ?? "ABC1D23",
    companyLink: "", origin: "", attendanceHistory: [],
    washCount: overrides.washCount ?? 5, historicalValue: 0,
    customerSince: overrides.customerSince ?? "2024-01-01",
    lastAttendance: overrides.lastAttendance ?? "2026-08-15",
    scoreDgn: overrides.scoreDgn ?? 65, recommendedPlan: "Smart",
    commercialStatus: "Aguardando Curadoria DGN",
    recurrence: "", averageVisitIntervalDays: 0, hasValidPhone: true,
    curation: { profile: "", originGroup: "", commercialProfile: "", idealSchedule: "", founderDecision: "", founderNumber: "", internalNotes: "" },
    campaign: { currentCampaign: "", founderSelected: false, founderNumber: "", founderCondition: "", campaignStatus: "", personalizedPagePath: "", paymentLink: "", lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "", kitStatus: "", cardStatus: "" },
  } as DgnCustomer;
}

test("buildDisplayIdentityRows: telefone mascarado por padrão", () => {
  const c = baseCustomer({ id: "c1", name: "Cliente" });
  const rows = buildDisplayIdentityRows(c);
  const phone = rows.find((r) => r.label === "Telefone");
  assert.ok(phone);
  assert.doesNotMatch(phone!.value, /99999-1234/, "PII bruta não pode vazar");
  assert.match(phone!.value, /\*{3,}/, "telefone precisa estar mascarado");
});

test("buildDisplayIdentityRows: placa mascarada por padrão", () => {
  const c = baseCustomer({ id: "c1", name: "Cliente", plate: "ABC1D23" });
  const rows = buildDisplayIdentityRows(c);
  const plate = rows.find((r) => r.label === "Placa");
  assert.ok(plate);
  assert.notEqual(plate!.value, "ABC1D23", "placa não pode vazar completa");
  assert.match(plate!.value, /\*/, "placa precisa estar mascarada");
});

test("buildDisplayIdentityRows: datas em pt-BR, nunca ISO", () => {
  const c = baseCustomer({ id: "c1", name: "Cliente", customerSince: "2024-01-15", lastAttendance: "2026-08-31" });
  const rows = buildDisplayIdentityRows(c);
  const since = rows.find((r) => r.label === "Cliente desde");
  const last = rows.find((r) => r.label === "Último atendimento");
  assert.equal(since?.value, "15/01/2024");
  assert.equal(last?.value, "31/08/2026");
});

test("buildDisplayIdentityRows: opt-in unmask revela PII completa", () => {
  const c = baseCustomer({ id: "c1", name: "Cliente", phone: "(19) 99999-1234", plate: "ABC1D23" });
  const rows = buildDisplayIdentityRows(c, { unmask: true });
  const phone = rows.find((r) => r.label === "Telefone");
  const plate = rows.find((r) => r.label === "Placa");
  assert.equal(phone?.value, "(19) 99999-1234");
  assert.equal(plate?.value, "ABC1D23");
});

test("formatScoreDgn: usa vírgula pt-BR e omite valores inválidos", () => {
  assert.equal(formatScoreDgn(82.5), "82,5");
  assert.equal(formatScoreDgn(65), "65");
  assert.equal(formatScoreDgn(0), "—");
  assert.equal(formatScoreDgn(null), "—");
  assert.equal(formatScoreDgn(undefined), "—");
});
