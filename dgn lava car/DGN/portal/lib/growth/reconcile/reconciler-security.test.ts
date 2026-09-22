import test from "node:test";
import assert from "node:assert/strict";
import { reconcile } from "./reconciler.ts";
import type {
  ReconcileInputRow,
  ReconcileSubscriptionRow,
  ReconcileVehicleRow,
} from "./types.ts";
import type { DgnCustomer } from "../dgn-growth-utils.ts";

// Fase 4 — Testes de segurança do reconciliador (contrato 4uCar × PagBank).
//
// Objetivo: comprovar que uma linha do relatório operacional 4uCar
// (fonte-terceira, sem privilégio), sozinha, NUNCA consegue:
//   (a) confirmar pagamento de contrato PagBank
//   (b) renovar vigência financeira de contrato PagBank
//   (c) sobrescrever evidence=provider por caminho manual
//   (d) alterar provider_customer_id / provider_subscription_id
//
// O reconciliador é o único vetor de escrita "vindo do 4uCar" no admin.
// Todo o guard vive em duas camadas:
//   1. classifier.ts — nunca gera ProposedAction para sub provider-linked;
//      subs manuais só sobem via PROMOTE_EXISTING/CREATE_NEW e nunca via
//      classificação livre.
//   2. RPCs (crm_promote_existing_subscription, crm_create_manual_subscription)
//      — bloqueiam provider-linked e recusam evidence=provider no nível DB.
//
// Este arquivo cobre a camada (1) — puramente in-process, sem DB.

function customer(overrides: Partial<DgnCustomer>): DgnCustomer {
  return {
    id: "cust-david",
    name: "David Lisboa",
    phone: "11912345678",
    normalizedPhone: "11912345678",
    plate: null,
    normalizedPlate: null,
    activePlan: "Smart",
    commercial: {} as DgnCustomer["commercial"],
    subscription: null,
    portalAccess: null,
    attendanceHistory: [],
    vehicle: null,
    firstServiceAt: null,
    lastAttendance: null,
    customerSince: null,
    knownSubscriberStatus: null,
    knownSubscriberPlan: null,
    ...overrides,
  } as unknown as DgnCustomer;
}

function pagBankSub(overrides: Partial<ReconcileSubscriptionRow> = {}): ReconcileSubscriptionRow {
  return {
    id: "sub-pagbank-david-1",
    customer_id: "cust-david",
    subscription_plan: "Smart",
    subscription_cycle: "mensal",
    subscription_status: "ativo",
    is_active_subscriber: true,
    provider_customer_id: "CUST_B5274A77-E95A-409C-BD2D-98FBF11EBEC4",
    provider_subscription_id: "SUBS_ABB43587-8EF5-499F-96BB-7CA019984426",
    vehicle_id: null,
    cycle_ends_at: null,
    billing_due_at: "2026-09-05T03:00:00+00:00",
    source_reference: null,
    payment_status: "confirmed",
    payment_evidence_source: "provider",
    ...overrides,
  };
}

function line(overrides: Partial<ReconcileInputRow> = {}): ReconcileInputRow {
  return {
    name: "David Lisboa",
    phone: "11912345678",
    plan: "Smart",
    status: "ativo",
    payment_method: "pagbank",
    paid_until: "31/12/2027",
    notes: "confirmado no 4uCar",
    ...overrides,
  };
}

const NO_VEHICLES: ReconcileVehicleRow[] = [];

// ---------------------------------------------------------------------------
// (a) 4uCar não confirma pagamento de contrato PagBank
// ---------------------------------------------------------------------------
test("Segurança 4uCar: sub PagBank ativa NÃO sofre PROMOTE_EXISTING nem CREATE_NEW", () => {
  const preview = reconcile({
    rows: [line()],
    customers: [customer({})],
    subscriptions: [pagBankSub()],
    vehicles: NO_VEHICLES,
    dataOrigin: "db",
  });
  const item = preview.items[0]!;
  assert.equal(item.applyEnabled, false, "não pode ser aplicável — bloqueia caminho manual");
  assert.equal(item.proposed, null, "não pode gerar ProposedAction");
  assert.equal(item.classification, "ALREADY_CORRECT",
    "sub PagBank + relatório coerente → nada a fazer (nunca PROMOTE)");
});

// ---------------------------------------------------------------------------
// (b) 4uCar não renova vigência financeira de contrato PagBank
// ---------------------------------------------------------------------------
test("Segurança 4uCar: paid_until novo do relatório NÃO vira write em sub PagBank", () => {
  const preview = reconcile({
    rows: [line({ paid_until: "31/12/2027" })], // relatório finge que já pagou até 2027
    customers: [customer({})],
    subscriptions: [pagBankSub({ cycle_ends_at: null })],
    vehicles: NO_VEHICLES,
    dataOrigin: "db",
  });
  const item = preview.items[0]!;
  assert.equal(item.proposed, null);
  assert.equal(item.applyEnabled, false);
  // Nunca é PROMOTE — mesmo com vigência divergente, sub provider-linked cai
  // em ALREADY_CORRECT (nada muda) ou CONFLICT (revisão humana obrigatória).
  assert.notEqual(item.classification, "PROMOTE_EXISTING");
  assert.notEqual(item.classification, "CREATE_NEW");
});

// ---------------------------------------------------------------------------
// (c) 4uCar não sobrescreve evidence=provider por caminho manual
// ---------------------------------------------------------------------------
test("Segurança 4uCar: plano do relatório divergindo do PagBank NÃO gera write — vira CONFLICT humano", () => {
  const preview = reconcile({
    rows: [line({ plan: "Priority" })],           // relatório diz Priority
    customers: [customer({})],
    subscriptions: [pagBankSub({ subscription_plan: "Smart" })], // CRM/PagBank diz Smart
    vehicles: NO_VEHICLES,
    dataOrigin: "db",
  });
  const item = preview.items[0]!;
  assert.equal(item.classification, "CONFLICT");
  assert.equal(item.applyEnabled, false);
  assert.equal(item.proposed, null);
  // O reason precisa deixar claro para o operador que a reconciliação
  // não faz o UPDATE por conta própria.
  assert.match(item.reason, /PagBank|reconciliar|manual/i);
});

// ---------------------------------------------------------------------------
// (d) ProposedAction gerada NUNCA declara payment_evidence_source=provider
//     — tipo TS já protege, teste ancora a intenção contra futura regressão.
// ---------------------------------------------------------------------------
test("Segurança 4uCar: quando o classifier gera PROMOTE ou CREATE, evidence NUNCA é 'provider'", () => {
  // Cenário legítimo: customer existe, sub 'detectado' (não PagBank), relatório
  // 4uCar confirma ativo. Classifier deve emitir PROMOTE_EXISTING com evidence
  // 'manual' ou 'unknown' — provider é banido no TS e no DB.
  const detectedManual: ReconcileSubscriptionRow = {
    id: "sub-benedito-manual",
    customer_id: "cust-benedito",
    subscription_plan: "Priority",
    subscription_cycle: "semestral",
    subscription_status: "detectado",
    is_active_subscriber: false,
    provider_customer_id: null,
    provider_subscription_id: null,
    vehicle_id: null,
    cycle_ends_at: null,
    billing_due_at: "2026-12-31T03:00:00+00:00",
    source_reference: "4uCar/planilha_2026-08-16",
    payment_status: "unknown",
    payment_evidence_source: "unknown",
  };
  const cust = customer({ id: "cust-benedito", name: "Benedito Constantino" });
  const preview = reconcile({
    rows: [line({
      name: "Benedito Constantino",
      plan: "Priority",
      status: "ativo",
      payment_method: "pagbank",
      paid_until: "31/12/2026",
    })],
    customers: [cust],
    subscriptions: [detectedManual],
    vehicles: NO_VEHICLES,
    dataOrigin: "db",
  });
  const item = preview.items[0]!;
  assert.equal(item.classification, "PROMOTE_EXISTING");
  assert.ok(item.proposed, "deve haver proposed em PROMOTE_EXISTING legítimo");
  assert.equal(item.proposed!.kind, "PROMOTE_EXISTING");
  // Ponto crítico:
  assert.notEqual((item.proposed as { paymentEvidenceSource: string }).paymentEvidenceSource, "provider");
});

// ---------------------------------------------------------------------------
// (e) Múltiplos contratos manuais / David padrão — não escolhe silenciosamente
// ---------------------------------------------------------------------------
test("Segurança 4uCar: 2 subs PagBank do mesmo customer, sem discriminador → UPDATE_EXISTING_REVIEW", () => {
  const subA = pagBankSub({ id: "sub-david-a", provider_subscription_id: "SUBS_98C742E6" });
  const subB = pagBankSub({ id: "sub-david-b", provider_subscription_id: "SUBS_ABB43587" });
  const preview = reconcile({
    rows: [line()],
    customers: [customer({})],
    subscriptions: [subA, subB],
    vehicles: NO_VEHICLES,
    dataOrigin: "db",
  });
  const item = preview.items[0]!;
  assert.equal(item.applyEnabled, false);
  assert.equal(item.proposed, null);
  // Padrão David: sub-plate = null nos dois → matcher devolve multiple_review.
  assert.equal(item.classification, "UPDATE_EXISTING_REVIEW");
});

// ---------------------------------------------------------------------------
// (f) Customer não existe → nunca cria fantasma
// ---------------------------------------------------------------------------
test("Segurança 4uCar: linha sem customer conhecido nunca vira write", () => {
  const preview = reconcile({
    rows: [line({ name: "Ninguém", phone: "99999999999" })],
    customers: [], // base vazia
    subscriptions: [],
    vehicles: NO_VEHICLES,
    dataOrigin: "db",
  });
  const item = preview.items[0]!;
  assert.equal(item.classification, "CUSTOMER_NOT_FOUND");
  assert.equal(item.applyEnabled, false);
  assert.equal(item.proposed, null);
});
