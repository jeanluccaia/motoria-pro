import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeCustomerForList, sanitizeCustomerListPayload } from "./sanitize-customer.ts";
import type { DgnCustomer } from "../dgn-growth-utils.ts";

// -----------------------------------------------------------------------------
// P0: garantir que PII sensível (phone, plate, histórico, notas) NÃO cruza
// a fronteira server → client para customers da lista.
// Só o customer alvo (view=profile, id específico) mantém payload completo.
// -----------------------------------------------------------------------------

function stubCustomer(overrides: Partial<DgnCustomer>): DgnCustomer {
  return {
    id: overrides.id ?? "id",
    name: overrides.name ?? "Cliente Teste",
    phone: "5511999998888",
    vehicle: "Honda Civic",
    plate: "FLW2D77",
    companyLink: "",
    origin: "google-ads",
    attendanceHistory: ["Lavagem completa 2026-08-01", "Enceramento 2026-08-15"],
    washCount: 12,
    historicalValue: 3600,
    customerSince: "2024-01-10",
    lastAttendance: "2026-08-30",
    scoreDgn: 87,
    recommendedPlan: "Smart",
    commercialStatus: "Assinante Ativo",
    recurrence: "mensal",
    averageVisitIntervalDays: 30,
    commercial: {
      owner: "digo",
      commercialNotes: "Nota interna sensível — não vazar",
      nextAction: "Próxima ação privada",
      nextActionAt: "",
      priority: "normal",
      updatedAt: "",
    },
    curation: { profile: "", originGroup: "", commercialProfile: "", idealSchedule: "", founderDecision: "", founderNumber: "", internalNotes: "PII interna" },
    campaign: {
      currentCampaign: "", founderSelected: false, founderNumber: "", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "", paymentLink: "", lastAction: "", nextAction: "",
      lastContact: "", conversationStatus: "", notes: "notas de campanha internas",
      kitStatus: "", cardStatus: "",
    },
    ...overrides,
  };
}

test("sanitizeCustomerForList mascara phone/plate e zera histórico + notas", () => {
  const raw = stubCustomer({ id: "1" });
  const clean = sanitizeCustomerForList(raw);
  assert.equal(clean.phone, "", "phone deve ser removido");
  assert.equal(clean.plate.includes("2D7"), false, "placa completa não pode aparecer");
  assert.match(clean.plate, /\*\*\*/, "placa deve estar mascarada");
  assert.deepEqual(clean.attendanceHistory, [], "histórico zerado");
  assert.equal(clean.commercial?.commercialNotes, "", "notas comerciais zeradas");
  assert.equal(clean.commercial?.nextAction, "", "próxima ação zerada");
  assert.equal(clean.curation.internalNotes, "", "notas internas zeradas");
  assert.equal(clean.campaign.notes, "", "notas campanha zeradas");
});

test("sanitizeCustomerForList preserva campos operacionais não-PII", () => {
  const raw = stubCustomer({ id: "1", name: "Fulano" });
  const clean = sanitizeCustomerForList(raw);
  assert.equal(clean.id, "1");
  assert.equal(clean.name, "Fulano");
  assert.equal(clean.commercialStatus, "Assinante Ativo");
  assert.equal(clean.scoreDgn, 87);
  assert.equal(clean.recommendedPlan, "Smart");
});

test("sanitizeCustomerListPayload passa target completo, resto mascarado", () => {
  const target = stubCustomer({ id: "target", phone: "5511987654321", plate: "TAR1234" });
  const other = stubCustomer({ id: "other", phone: "5511999998888", plate: "OTH5678" });
  const result = sanitizeCustomerListPayload([target, other], "target");

  assert.equal(result[0]?.phone, "5511987654321", "target phone intocado");
  assert.equal(result[0]?.plate, "TAR1234", "target plate intocada");
  assert.equal(result[0]?.attendanceHistory.length, 2, "target histórico intocado");

  assert.equal(result[1]?.phone, "", "other phone zerado");
  assert.notEqual(result[1]?.plate, "OTH5678", "other plate mascarada");
});

test("sanitizeCustomerListPayload sem targetId mascara tudo", () => {
  const customers = [stubCustomer({ id: "a", phone: "5511111111111" }), stubCustomer({ id: "b", phone: "5511222222222" })];
  const result = sanitizeCustomerListPayload(customers, undefined);
  assert.equal(result[0]?.phone, "");
  assert.equal(result[1]?.phone, "");
});

test("nunca vaza a string bruta 'FLW2D77' quando o customer não é o target", () => {
  const gustavo = stubCustomer({ id: "gustavo", plate: "FLW2D77" });
  const clean = sanitizeCustomerForList(gustavo);
  assert.equal(clean.plate.includes("FLW2D77"), false);
});
