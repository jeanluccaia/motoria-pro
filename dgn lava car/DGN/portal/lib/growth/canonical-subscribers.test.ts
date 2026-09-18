import test from "node:test";
import assert from "node:assert/strict";
import type { DgnCustomer } from "./dgn-growth-utils.ts";
import {
  getCanonicalActiveSubscriberIds,
  getCanonicalActiveSubscriberMetrics,
  getCanonicalActiveSubscribersCount,
  isCanonicalActiveSubscriber,
} from "./canonical-subscribers.ts";

function mk(id: string, isActive: boolean, extras: Partial<DgnCustomer> = {}): DgnCustomer {
  return {
    id, name: id, phone: "", vehicle: "", plate: "",
    companyLink: "", origin: "", attendanceHistory: [],
    washCount: 0, historicalValue: 0, customerSince: "", lastAttendance: "",
    scoreDgn: 0, recommendedPlan: "Smart",
    commercialStatus: "Aguardando Curadoria DGN",
    recurrence: "", averageVisitIntervalDays: 0,
    hasValidPhone: false,
    subscription: isActive ? { nextDueDate: null, paymentMethod: null, paymentMethodLabel: null, status: "ativo", isActive: true } : null,
    portalAccess: null,
    curation: { profile: "", originGroup: "", commercialProfile: "", idealSchedule: "", founderDecision: "", founderNumber: "", internalNotes: "" },
    campaign: {
      currentCampaign: "", founderSelected: false, founderNumber: "", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "", paymentLink: "", lastAction: "",
      nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "", founderStatus: "nao_avaliado",
      commercialStage: "aguardando_analise", selectionReason: "", lostReason: "",
      kitStatusRaw: "nao_aplicavel", cardStatusRaw: "nao_aplicavel",
      dates: { inviteCreatedAt: "", inviteSentAt: "", viewedAt: "", respondedAt: "", conversationStartedAt: "", paymentSentAt: "", convertedAt: "", lostAt: "", kitUpdatedAt: "", cardUpdatedAt: "" },
      history: [],
      engagement: { viewedAt: "", lastViewedAt: "", viewCount: 0, confirmClickedAt: "", confirmClickCount: 0, vipClickedAt: "", vipClickCount: 0 },
      curation: { recommendedPlanCode: "", recommendedPlanName: "", recommendedPlanVersion: "", recommendedContractingMode: "", recommendedContractingModeLabel: "", recommendedCommitmentMonths: null, recommendedMonthlyPrice: null, recommendedBillingRule: "", recommendedVehicleCategory: "", recommendationReasonInternal: "", recommendationMessagePublic: "", curatedBy: "", curatedAt: "", approvedAt: "", planSnapshot: null, publicLink: null, inviteSentAt: "" },
      updatedAt: "",
    },
    ...extras,
  } as DgnCustomer;
}

test("isCanonicalActiveSubscriber: só true quando subscription.isActive=true", () => {
  assert.equal(isCanonicalActiveSubscriber(mk("a", true)), true);
  assert.equal(isCanonicalActiveSubscriber(mk("b", false)), false);
});

test("commercialStatus sozinho não conta", () => {
  const c = mk("x", false, { commercialStatus: "Assinante Ativo" });
  assert.equal(isCanonicalActiveSubscriber(c), false);
});

test("knownSubscriberPlan sozinho não conta", () => {
  const c = mk("x", false, { knownSubscriberPlan: "Priority", knownSubscriberStatus: "ativo" });
  assert.equal(isCanonicalActiveSubscriber(c), false);
});

test("sub inativa não conta", () => {
  const c = mk("x", false, {
    subscription: { nextDueDate: null, paymentMethod: null, paymentMethodLabel: null, status: "detectado", isActive: false },
  });
  assert.equal(isCanonicalActiveSubscriber(c), false);
});

test("getCanonicalActiveSubscriberIds: dedupe por customer_id (segurança)", () => {
  const ids = getCanonicalActiveSubscriberIds([mk("dup", true), mk("dup", true), mk("solo", true), mk("inact", false)]);
  assert.deepEqual(ids.sort(), ["dup", "solo"]);
});

test("getCanonicalActiveSubscribersCount: 3 ativos + 2 inativos = 3", () => {
  const customers = [mk("a", true), mk("b", true), mk("c", true), mk("d", false), mk("e", false)];
  assert.equal(getCanonicalActiveSubscribersCount(customers), 3);
});

test("getCanonicalActiveSubscriberMetrics: sem opts.rows → activeSubscriptions === activeCustomers", () => {
  const metrics = getCanonicalActiveSubscriberMetrics([mk("a", true), mk("b", true)]);
  assert.equal(metrics.activeCustomers, 2);
  assert.equal(metrics.activeSubscriptions, 2);
  assert.equal(metrics.source, "crm_subscriptions");
});

test("getCanonicalActiveSubscriberMetrics: com opts.rows (padrão José Sergio 15 customers, 17 rows)", () => {
  const customers = Array.from({ length: 15 }, (_, i) => mk(`c${i}`, true));
  const metrics = getCanonicalActiveSubscriberMetrics(customers, { activeSubscriptionRowCount: 17 });
  assert.equal(metrics.activeCustomers, 15);
  assert.equal(metrics.activeSubscriptions, 17);
});

test("getCanonicalActiveSubscriberMetrics: opts.rows menor que customers é ignorado (proteção contra dado inválido)", () => {
  const customers = [mk("a", true), mk("b", true)];
  const metrics = getCanonicalActiveSubscriberMetrics(customers, { activeSubscriptionRowCount: 1 });
  assert.equal(metrics.activeCustomers, 2);
  assert.equal(metrics.activeSubscriptions, 2);
});
