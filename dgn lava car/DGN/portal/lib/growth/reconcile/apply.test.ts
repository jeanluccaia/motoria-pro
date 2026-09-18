import test from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedForApply,
  planApplyDecision,
  summarizeApplyPlan,
  toResultCode,
  type ApplySelection,
} from "./apply.ts";
import type { ProposedAction, ReconcilePreviewItem } from "./types.ts";

function item(overrides: Partial<ReconcilePreviewItem>): ReconcilePreviewItem {
  return {
    rowIndex: 0,
    input: {},
    customer: { strategy: "phone", customerId: "cust-1", legacyId: "cust-1", customerName: "X", ambiguousIds: [], reason: "ok" },
    classification: "PROMOTE_EXISTING",
    reason: "",
    facts: {
      matchedByPhone: true, matchedByPlate: false, matchedByLegacyId: false, matchedByName: false,
      fuzzyName: false, ambiguousCandidates: 0, subscriptionMatch: null,
      planReported: null, planCanonical: null, cycleEndsAtReported: null, cycleEndsAtCurrent: null,
      divergingFields: [], missingFields: [],
    },
    proposed: null,
    applyEnabled: false,
    ...overrides,
  } as ReconcilePreviewItem;
}

const proposedPromote: ProposedAction = {
  kind: "PROMOTE_EXISTING",
  subscriptionId: "sub-1", expectedCustomerId: "cust-1",
  paymentStatus: "confirmed", paymentEvidenceSource: "manual",
  cycleEndsAtIso: null, sourceReference: "ref", notesAppend: null,
};

const proposedCreate: ProposedAction = {
  kind: "CREATE_NEW",
  customerId: "cust-1", plan: "Smart", cycle: "não identificado",
  paymentStatus: "unknown", paymentEvidenceSource: "legacy",
  cycleEndsAtIso: null, sourceReference: "ref", notes: null, vehicleId: null,
};

// ---------------------------------------------------------------------------
// planApplyDecision
// ---------------------------------------------------------------------------

test("planApplyDecision: PROCEED quando tudo bate", () => {
  const selection: ApplySelection = { rowIndex: 0, expectedClassification: "PROMOTE_EXISTING", expectedSubscriptionId: "sub-1", expectedCustomerId: "cust-1" };
  const fresh = item({ classification: "PROMOTE_EXISTING", applyEnabled: true, proposed: proposedPromote });
  const decision = planApplyDecision(selection, fresh);
  assert.equal(decision.outcome, "PROCEED");
  assert.deepEqual(decision.action, proposedPromote);
});

test("planApplyDecision: STALE quando classification mudou", () => {
  const selection: ApplySelection = { rowIndex: 0, expectedClassification: "PROMOTE_EXISTING" };
  const fresh = item({ classification: "ALREADY_CORRECT", applyEnabled: false, proposed: null });
  const decision = planApplyDecision(selection, fresh);
  assert.equal(decision.outcome, "NOT_APPLICABLE");
  assert.match(decision.reason, /já está correto/);
});

test("planApplyDecision: STALE quando classification virou algo diferente", () => {
  const selection: ApplySelection = { rowIndex: 0, expectedClassification: "CREATE_NEW" };
  const fresh = item({ classification: "CONFLICT", applyEnabled: false, proposed: null });
  const decision = planApplyDecision(selection, fresh);
  assert.equal(decision.outcome, "STALE");
  assert.match(decision.reason, /deixou de ser aplicável/);
});

test("planApplyDecision: STALE quando subscription_id divergiu", () => {
  const selection: ApplySelection = { rowIndex: 0, expectedClassification: "PROMOTE_EXISTING", expectedSubscriptionId: "sub-antigo" };
  const fresh = item({ classification: "PROMOTE_EXISTING", applyEnabled: true, proposed: proposedPromote });
  const decision = planApplyDecision(selection, fresh);
  assert.equal(decision.outcome, "STALE");
  assert.match(decision.reason, /subscription_id/);
});

test("planApplyDecision: STALE quando customer_id divergiu", () => {
  const selection: ApplySelection = { rowIndex: 0, expectedClassification: "PROMOTE_EXISTING", expectedCustomerId: "outro" };
  const fresh = item({ classification: "PROMOTE_EXISTING", applyEnabled: true, proposed: proposedPromote });
  const decision = planApplyDecision(selection, fresh);
  assert.equal(decision.outcome, "STALE");
  assert.match(decision.reason, /Customer alvo mudou/);
});

test("planApplyDecision: STALE quando applyEnabled=false mesmo com classification correta", () => {
  const selection: ApplySelection = { rowIndex: 0, expectedClassification: "CREATE_NEW" };
  const fresh = item({ classification: "CREATE_NEW", applyEnabled: false, proposed: null });
  const decision = planApplyDecision(selection, fresh);
  assert.equal(decision.outcome, "STALE");
});

test("planApplyDecision: PROCEED em CREATE_NEW", () => {
  const selection: ApplySelection = { rowIndex: 0, expectedClassification: "CREATE_NEW", expectedCustomerId: "cust-1" };
  const fresh = item({ classification: "CREATE_NEW", applyEnabled: true, proposed: proposedCreate });
  const decision = planApplyDecision(selection, fresh);
  assert.equal(decision.outcome, "PROCEED");
});

// ---------------------------------------------------------------------------
// toResultCode
// ---------------------------------------------------------------------------

test("toResultCode: STALE outcome", () => {
  assert.equal(toResultCode("STALE"), "STALE_PREVIEW_REVIEW_REQUIRED");
});
test("toResultCode: NOT_APPLICABLE outcome", () => {
  assert.equal(toResultCode("NOT_APPLICABLE"), "ALREADY_CORRECT");
});
test("toResultCode: CREATED da RPC", () => {
  assert.equal(toResultCode("PROCEED", { code: "CREATED" }), "CREATED");
});
test("toResultCode: PROMOTED", () => {
  assert.equal(toResultCode("PROCEED", { code: "PROMOTED" }), "PROMOTED");
});
test("toResultCode: REVIEW_EXISTING_SUBSCRIPTION", () => {
  assert.equal(toResultCode("PROCEED", { code: "REVIEW_EXISTING_SUBSCRIPTION" }), "REVIEW_EXISTING_SUBSCRIPTION");
});
test("toResultCode: erro vira FAILED", () => {
  assert.equal(toResultCode("PROCEED", { error: new Error("boom") }), "FAILED");
});

// ---------------------------------------------------------------------------
// isAllowedForApply
// ---------------------------------------------------------------------------

test("isAllowedForApply: só PROMOTE_EXISTING e CREATE_NEW", () => {
  assert.equal(isAllowedForApply("PROMOTE_EXISTING"), true);
  assert.equal(isAllowedForApply("CREATE_NEW"), true);
  assert.equal(isAllowedForApply("ALREADY_CORRECT"), false);
  assert.equal(isAllowedForApply("RENEWAL_PENDING"), false);
  assert.equal(isAllowedForApply("UPDATE_EXISTING_REVIEW"), false);
  assert.equal(isAllowedForApply("CUSTOMER_NOT_FOUND"), false);
  assert.equal(isAllowedForApply("POSSIBLE_MATCH"), false);
  assert.equal(isAllowedForApply("CONFLICT"), false);
});

// ---------------------------------------------------------------------------
// summarizeApplyPlan
// ---------------------------------------------------------------------------

test("summarizeApplyPlan: sempre inclui frase PagBank", () => {
  const s = summarizeApplyPlan({ proceedCount: 2, staleCount: 1, alreadyCorrect: 3, failed: 0 });
  assert.match(s, /nenhuma cobrança PagBank será alterada/);
  assert.match(s, /2 subscription/);
  assert.match(s, /1 requer/);
  assert.match(s, /3 já estava/);
});
