import test from "node:test";
import assert from "node:assert/strict";
import { buildSubscribersCentralView } from "./subscribers-view.ts";
import type { DgnCustomer } from "../dgn-growth-utils.ts";

// -----------------------------------------------------------------------------
// Fase 1 (Assinantes central operacional): a view precisa filtrar quem tem
// contrato real, expor os campos canônicos que a page.tsx renderiza, preservar
// os badges Founder e ordenar ativos primeiro.
// -----------------------------------------------------------------------------

function stubCustomer(overrides: Partial<DgnCustomer> & { id: string; name: string }): DgnCustomer {
  const { id, name, ...rest } = overrides;
  return {
    id,
    name,
    phone: "",
    vehicle: "Honda Civic",
    plate: "ABC1D23",
    companyLink: "",
    origin: "",
    attendanceHistory: [],
    washCount: 0,
    historicalValue: 0,
    customerSince: "",
    lastAttendance: "",
    scoreDgn: 0,
    recommendedPlan: "Smart",
    commercialStatus: "Aguardando Curadoria DGN",
    recurrence: "mensal",
    averageVisitIntervalDays: 30,
    activePlan: null,
    subscription: null,
    curation: { profile: "", originGroup: "", commercialProfile: "", idealSchedule: "", founderDecision: "", founderNumber: "", internalNotes: "" },
    campaign: {
      currentCampaign: "", founderSelected: false, founderNumber: "", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "", paymentLink: "", lastAction: "", nextAction: "",
      lastContact: "", conversationStatus: "", notes: "", kitStatus: "", cardStatus: "",
    },
    ...rest,
  };
}

test("inclui cliente com subscription.isActive=true", () => {
  const rows = buildSubscribersCentralView([
    stubCustomer({
      id: "gustavo", name: "Gustavo Plensack",
      activePlan: "Priority",
      subscription: { nextDueDate: "2026-10-15", paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    }),
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.status, "ativo");
  assert.equal(rows[0]?.planLabel, "Priority");
});

test("exclui cliente sem subscription", () => {
  const rows = buildSubscribersCentralView([
    stubCustomer({ id: "lead", name: "Lead Sem Contrato", subscription: null }),
  ]);
  assert.equal(rows.length, 0);
});

test("exclui cliente com status desconhecido e não-ativo", () => {
  const rows = buildSubscribersCentralView([
    stubCustomer({
      id: "cancelado", name: "Cancelado",
      subscription: { nextDueDate: null, paymentMethod: "manual", paymentMethodLabel: null, status: "cancelado", isActive: false },
    }),
  ]);
  assert.equal(rows.length, 0);
});

test("ordena ativos antes de detectados e pendentes", () => {
  const rows = buildSubscribersCentralView([
    stubCustomer({
      id: "pending", name: "Zara Pendente",
      subscription: { nextDueDate: null, paymentMethod: null, paymentMethodLabel: null, status: "pendente_validacao", isActive: false },
    }),
    stubCustomer({
      id: "active", name: "Ana Ativa",
      activePlan: "Smart",
      subscription: { nextDueDate: "2026-10-01", paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    }),
    stubCustomer({
      id: "detected", name: "Bruno Detectado",
      subscription: { nextDueDate: null, paymentMethod: null, paymentMethodLabel: null, status: "detectado", isActive: false },
    }),
  ]);
  assert.deepEqual(rows.map((r) => r.status), ["ativo", "detectado", "pendente_validacao"]);
});

test("preserva badge Founder para IDs canônicos (Nº001/002/003)", () => {
  const rows = buildSubscribersCentralView([
    stubCustomer({
      id: "benedito", name: "Benedito Constantino",
      subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    }),
    stubCustomer({
      id: "jose", name: "Jose Moreira",
      subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    }),
    stubCustomer({
      id: "rikardo", name: "Rikardo Oliveira",
      subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    }),
  ]);
  const numbers = rows.map((r) => r.preservedFounderNumber).sort();
  assert.deepEqual(numbers, ["001", "002", "003"]);
});

test("marca Iara como Founder reaberta (Nº004)", () => {
  const rows = buildSubscribersCentralView([
    stubCustomer({
      id: "iara", name: "Iara Menezes",
      subscription: { nextDueDate: null, paymentMethod: "manual", paymentMethodLabel: null, status: "detectado", isActive: false },
    }),
  ]);
  assert.equal(rows[0]?.isReopenedFounder, true);
  assert.equal(rows[0]?.preservedFounderNumber, undefined);
});

test("fallback amigável de paymentMethod → label quando paymentMethodLabel é null", () => {
  const cases: Array<[NonNullable<DgnCustomer["subscription"]>["paymentMethod"], string]> = [
    ["card_recurring", "Recorrência no cartão"],
    ["manual",         "Cobrança manual"],
    ["not_needed",     "—"],
    ["unknown",        "Não identificada"],
    [null,             "Não identificada"],
  ];
  for (const [method, expected] of cases) {
    const rows = buildSubscribersCentralView([
      stubCustomer({
        id: `c-${method}`, name: `Cliente ${method}`,
        subscription: { nextDueDate: null, paymentMethod: method, paymentMethodLabel: null, status: "ativo", isActive: true },
      }),
    ]);
    assert.equal(rows[0]?.paymentMethodLabel, expected, `paymentMethod=${method}`);
  }
});

test("paymentMethodLabel explícito vence sobre derivação do enum", () => {
  const rows = buildSubscribersCentralView([
    stubCustomer({
      id: "custom", name: "Cliente Custom",
      subscription: { nextDueDate: null, paymentMethod: "manual", paymentMethodLabel: "PIX combinado", status: "ativo", isActive: true },
    }),
  ]);
  assert.equal(rows[0]?.paymentMethodLabel, "PIX combinado");
});

test("planLabel usa activePlan; sem plano ativo cai em '—'", () => {
  const rows = buildSubscribersCentralView([
    stubCustomer({
      id: "sem-plano", name: "Sem Plano",
      activePlan: null,
      subscription: { nextDueDate: null, paymentMethod: "manual", paymentMethodLabel: null, status: "detectado", isActive: false },
    }),
  ]);
  assert.equal(rows[0]?.planLabel, "—");
});

test("mascara placa e preserva veículo label", () => {
  const rows = buildSubscribersCentralView([
    stubCustomer({
      id: "veic", name: "Cliente Com Veículo",
      vehicle: "Honda Civic",
      plate: "FLW2D77",
      subscription: { nextDueDate: null, paymentMethod: "card_recurring", paymentMethodLabel: null, status: "ativo", isActive: true },
    }),
  ]);
  assert.equal(rows[0]?.vehicleLabel, "Honda Civic");
  assert.notEqual(rows[0]?.maskedPlate, "FLW2D77");
  assert.match(rows[0]?.maskedPlate ?? "", /\*/);
});
