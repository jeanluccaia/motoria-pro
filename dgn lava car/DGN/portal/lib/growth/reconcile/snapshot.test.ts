import test from "node:test";
import assert from "node:assert/strict";
import type { DgnCustomer } from "../dgn-growth-utils.ts";
import { reconcile } from "./reconciler.ts";
import { buildUuidToDgnIdMap, mapSubscriptionsForReconciler, mapVehiclesForReconciler } from "./snapshot.ts";

// ---------------------------------------------------------------------------
// Regressão do bug encontrado no smoke real (2026-09-17):
//   DgnCustomer.id = legacy_id quando existe (ex.: "benedito-constantino").
//   crm_subscriptions.customer_id = UUID sempre (ex.: "c4debcc9-...").
// Sem o remap, o matcher perde subs de qualquer customer com legacy_id →
// classifica como CREATE_NEW no lugar de ALREADY_CORRECT.
// ---------------------------------------------------------------------------

function dgnCustomer(id: string, name: string, phone: string): DgnCustomer {
  return {
    id, name, phone,
    vehicle: "", plate: "", companyLink: "", origin: "",
    attendanceHistory: [], washCount: 0, historicalValue: 0,
    customerSince: "", lastAttendance: "", scoreDgn: 0,
    recommendedPlan: "Smart", commercialStatus: "Aguardando Curadoria DGN",
    recurrence: "", averageVisitIntervalDays: 0,
    hasValidPhone: true, subscription: null, portalAccess: null,
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
  } as DgnCustomer;
}

const BENEDITO_UUID = "c4debcc9-3a79-4d6b-820f-bbfcf0d41cdf";
const BENEDITO_DGN_ID = "benedito-constantino";

const rawCustomers = [
  { id: BENEDITO_UUID, legacy_id: BENEDITO_DGN_ID },
  { id: "bf513bc2-e5a4-4460-99c8-9e08a8306460", legacy_id: null }, // Bruno (sem legacy)
];

const rawSubs = [
  {
    id: "1f798eab-d2d2-4295-900e-857d60a1c454",
    customer_id: BENEDITO_UUID, // UUID — não bate com "benedito-constantino"
    subscription_plan: "Priority", subscription_cycle: "semestral",
    subscription_status: "ativo", is_active_subscriber: true,
    provider_customer_id: null, provider_subscription_id: null,
    vehicle_id: null, cycle_ends_at: "2026-12-31T03:00:00+00:00",
    billing_due_at: null, source_reference: "Founder Nº001 confirmado",
    payment_status: "confirmed", payment_evidence_source: "manual",
  },
];

const rawVehicles: Array<{ id: string; customer_id: string; plate: string; brand: string | null; model: string | null }> = [];

test("buildUuidToDgnIdMap: UUID → legacy_id quando existe, UUID caso contrário", () => {
  const map = buildUuidToDgnIdMap(rawCustomers);
  assert.equal(map.get(BENEDITO_UUID), BENEDITO_DGN_ID);
  assert.equal(map.get("bf513bc2-e5a4-4460-99c8-9e08a8306460"), "bf513bc2-e5a4-4460-99c8-9e08a8306460");
  assert.equal(map.get("uuid-inexistente"), undefined);
});

test("mapSubscriptionsForReconciler: sub.customer_id UUID vira DgnCustomer.id", () => {
  const map = buildUuidToDgnIdMap(rawCustomers);
  const mapped = mapSubscriptionsForReconciler(rawSubs, map);
  assert.equal(mapped[0]!.customer_id, BENEDITO_DGN_ID);
  assert.equal(mapped[0]!.id, "1f798eab-d2d2-4295-900e-857d60a1c454");
  assert.equal(mapped[0]!.subscription_plan, "Priority");
  assert.equal(mapped[0]!.is_active_subscriber, true);
});

test("REGRESSÃO: sem remap, Benedito vira CREATE_NEW (bug real de prod 2026-09-17)", () => {
  const benedito = dgnCustomer(BENEDITO_DGN_ID, "Benedito Constantino", "19981723362");
  const preview = reconcile({
    rows: [{ name: "Benedito Constantino", phone: "19981723362", plan: "Priority", status: "ativo", paid_until: "31/12/2026" }],
    customers: [benedito],
    // subscriptions SEM remap (usando customer_id=UUID direto) — cenário do bug
    subscriptions: rawSubs.map((s) => ({
      id: s.id, customer_id: s.customer_id,
      subscription_plan: s.subscription_plan, subscription_cycle: s.subscription_cycle,
      subscription_status: s.subscription_status, is_active_subscriber: s.is_active_subscriber,
      provider_customer_id: s.provider_customer_id, provider_subscription_id: s.provider_subscription_id,
      vehicle_id: s.vehicle_id, cycle_ends_at: s.cycle_ends_at, billing_due_at: s.billing_due_at,
      source_reference: s.source_reference, payment_status: s.payment_status,
      payment_evidence_source: s.payment_evidence_source,
    })),
    vehicles: [],
    dataOrigin: "db",
    now: new Date("2026-09-18T12:00:00Z"),
  });
  // Sem correção, matcher.matchSubscription não acha sub → classifier vai para
  // CREATE_NEW porque customer existe + plano + status ativo. Isso É o bug.
  assert.equal(preview.items[0]!.classification, "CREATE_NEW");
});

test("COM remap: Benedito vira ALREADY_CORRECT (comportamento correto)", () => {
  const benedito = dgnCustomer(BENEDITO_DGN_ID, "Benedito Constantino", "19981723362");
  const map = buildUuidToDgnIdMap(rawCustomers);
  const subscriptions = mapSubscriptionsForReconciler(rawSubs, map);
  const vehicles = mapVehiclesForReconciler(rawVehicles, map);
  const preview = reconcile({
    rows: [{ name: "Benedito Constantino", phone: "19981723362", plan: "Priority", status: "ativo", paid_until: "31/12/2026" }],
    customers: [benedito],
    subscriptions,
    vehicles,
    dataOrigin: "db",
    now: new Date("2026-09-18T12:00:00Z"),
  });
  assert.equal(preview.items[0]!.classification, "ALREADY_CORRECT");
  assert.equal(preview.items[0]!.facts.planCanonical, "Priority");
  assert.equal(preview.items[0]!.facts.subscriptionMatch?.subscriptionId, "1f798eab-d2d2-4295-900e-857d60a1c454");
});
