import test from "node:test";
import assert from "node:assert/strict";
import { canonicalPlanLabel, getCanonicalSubscriberPlan } from "./canonical-plan.ts";
import type { DgnCustomer } from "./dgn-growth-utils.ts";

// -----------------------------------------------------------------------------
// Regressão P0: antes do hotfix, o `growth-reader` mapeava qualquer
// subscription_plan fora de {Smart,Priority,Corporate Care} para "Smart".
// Consequência real observada:
//   - Gustavo Plensack (Priority) aparecia como Smart em algumas telas.
//   - Ronaldo Faria (Essential) aparecia como Smart.
// Agora `activePlan` carrega o valor bruto de crm_subscriptions e a UI usa
// canonicalPlanLabel(), que prefere activePlan sempre que existir.
// -----------------------------------------------------------------------------

function stubCustomer(overrides: Partial<DgnCustomer>): DgnCustomer {
  return {
    id: overrides.id ?? "id",
    name: overrides.name ?? "Cliente",
    phone: "",
    vehicle: "",
    plate: "",
    companyLink: "",
    origin: "",
    attendanceHistory: [],
    washCount: 0,
    historicalValue: 0,
    customerSince: "",
    lastAttendance: "",
    scoreDgn: 0,
    recommendedPlan: overrides.recommendedPlan ?? "Smart",
    activePlan: overrides.activePlan,
    commercialStatus: "Aguardando Curadoria DGN",
    recurrence: "",
    averageVisitIntervalDays: 0,
    curation: { profile: "", originGroup: "", commercialProfile: "", idealSchedule: "", founderDecision: "", founderNumber: "", internalNotes: "" },
    campaign: {
      currentCampaign: "", founderSelected: false, founderNumber: "", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "", paymentLink: "", lastAction: "", nextAction: "",
      lastContact: "", conversationStatus: "", notes: "", kitStatus: "", cardStatus: "",
    },
    ...overrides,
  };
}

test("Gustavo com activePlan=Priority devolve Priority, source=subscription", () => {
  const gustavo = stubCustomer({ id: "gustavo", recommendedPlan: "Smart", activePlan: "Priority" });
  const result = getCanonicalSubscriberPlan(gustavo);
  assert.equal(result.label, "Priority");
  assert.equal(result.source, "subscription");
  assert.equal(canonicalPlanLabel(gustavo), "Priority");
});

test("Ronaldo com activePlan=Essential devolve Essential (não colapsa em Smart)", () => {
  const ronaldo = stubCustomer({ id: "ronaldo", recommendedPlan: "Smart", activePlan: "Essential" });
  assert.equal(canonicalPlanLabel(ronaldo), "Essential");
});

test("Thiago com activePlan=Smart devolve Smart, source=subscription", () => {
  const thiago = stubCustomer({ id: "thiago", recommendedPlan: "Smart", activePlan: "Smart" });
  const result = getCanonicalSubscriberPlan(thiago);
  assert.equal(result.label, "Smart");
  assert.equal(result.source, "subscription");
});

test("Lead sem activePlan cai no recommendedPlan como sugestão", () => {
  const lead = stubCustomer({ id: "lead", recommendedPlan: "Priority", activePlan: null });
  const result = getCanonicalSubscriberPlan(lead);
  assert.equal(result.label, "Priority");
  assert.equal(result.source, "recommendation");
});

test("activePlan vazio/whitespace não substitui recommendedPlan", () => {
  const lead = stubCustomer({ id: "lead", recommendedPlan: "Smart", activePlan: "   " });
  assert.equal(getCanonicalSubscriberPlan(lead).source, "recommendation");
});
