import assert from "node:assert/strict";
import test from "node:test";

import { diagnose } from "./diagnose-customers-2025.ts";
import type { LegacyCustomer } from "./migrate-legacy-json.ts";

function row(id: string, lastAttendance: string): LegacyCustomer {
  return {
    id, name: "Maria da Silva", phone: "(19) 99999-9999", vehicle: "Honda Civic", plate: "ABC1D23",
    companyLink: "", origin: "4uCar", attendanceHistory: [], washCount: 2, historicalValue: 200,
    customerSince: "2024-01-01", lastAttendance, scoreDgn: 50, recommendedPlan: "Smart",
    commercialStatus: "", recurrence: "", averageVisitIntervalDays: 30,
    curation: { profile: "", originGroup: "", commercialProfile: "", idealSchedule: "", founderDecision: "", founderNumber: "", internalNotes: "" },
    campaign: { currentCampaign: "", founderSelected: false, founderNumber: "", founderCondition: "", campaignStatus: "", personalizedPagePath: "", paymentLink: "", lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "", kitStatus: "", cardStatus: "" },
  };
}

test("corte inclui 01/01/2025 e exclui 2024", async () => {
  const report = await diagnose([row("entra", "2025-01-01"), row("fora", "2024-12-31")]);
  assert.equal(report.dates.eligible, 1);
  assert.equal(report.dates.beforeCutoff, 1);
});

test("data ausente e invalida ficam no relatorio", async () => {
  const report = await diagnose([row("sem-data", "A definir"), row("invalida", "2025-02-30")]);
  assert.equal(report.dates.missing, 1);
  assert.equal(report.dates.invalid, 1);
});

test("sem banco o diagnostico permanece read-only", async () => {
  const report = await diagnose([row("novo", "2025-01-02")]);
  assert.equal(report.database.connected, false);
  assert.match(report.database.error ?? "", /credenciais/);
  assert.equal(report.reconciliation.inserts, 1);
  assert.equal(report.mode, "dry-run");
});
