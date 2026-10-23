import { test } from "node:test";
import assert from "node:assert/strict";

import { derivePulseSummary } from "./pulse-summary.ts";
import type { AgentActionRow } from "./agent-actions-write.ts";

function row(partial: Partial<AgentActionRow>): AgentActionRow {
  return {
    id: partial.id ?? "id",
    kind: partial.kind ?? "opportunity",
    status: partial.status ?? "pending_review",
    targetCustomerId: partial.targetCustomerId ?? null,
    targetCampaignId: partial.targetCampaignId ?? null,
    title: partial.title ?? "t",
    reason: partial.reason ?? "r",
    recommendation: partial.recommendation ?? "rec",
    nextStep: partial.nextStep ?? null,
    expectedBenefit: partial.expectedBenefit ?? null,
    payload: partial.payload ?? {},
    sourceTool: partial.sourceTool ?? "record_opportunity",
    sourceRunId: partial.sourceRunId ?? null,
    dedupeKey: partial.dedupeKey ?? null,
    reviewedBy: partial.reviewedBy ?? null,
    reviewedAt: partial.reviewedAt ?? null,
    reviewReason: partial.reviewReason ?? null,
    executedAt: partial.executedAt ?? null,
    executionRef: partial.executionRef ?? null,
    expiresAt: partial.expiresAt ?? null,
    createdAt: partial.createdAt ?? "2026-10-22T00:00:00Z",
    updatedAt: partial.updatedAt ?? "2026-10-22T00:00:00Z",
  };
}

test("derivePulseSummary: lista vazia zera tudo", () => {
  const s = derivePulseSummary([]);
  assert.equal(s.totalPending, 0);
  assert.deepEqual(s.counts, { opportunity: 0, alert: 0, followupTask: 0, campaignDraft: 0 });
  assert.deepEqual(s.topActions, []);
  assert.equal(s.loadError, null);
});

test("derivePulseSummary: só conta pending_review (ignora approved/rejected/executed/archived)", () => {
  const s = derivePulseSummary([
    row({ id: "p1", kind: "opportunity", status: "pending_review" }),
    row({ id: "ap", kind: "opportunity", status: "approved" }),
    row({ id: "rj", kind: "alert", status: "rejected" }),
    row({ id: "ex", kind: "alert", status: "executed" }),
    row({ id: "ar", kind: "alert", status: "archived" }),
    row({ id: "p2", kind: "alert", status: "pending_review" }),
  ]);
  assert.equal(s.totalPending, 2);
  assert.equal(s.counts.opportunity, 1);
  assert.equal(s.counts.alert, 1);
  assert.equal(s.counts.followupTask, 0);
  assert.equal(s.counts.campaignDraft, 0);
  assert.equal(s.topActions.length, 2);
  assert.ok(s.topActions.every((r) => r.status === "pending_review"));
});

test("derivePulseSummary: conta por kind corretamente", () => {
  const s = derivePulseSummary([
    row({ id: "1", kind: "opportunity" }),
    row({ id: "2", kind: "opportunity" }),
    row({ id: "3", kind: "alert" }),
    row({ id: "4", kind: "followup_task" }),
    row({ id: "5", kind: "campaign_draft" }),
    row({ id: "6", kind: "campaign_draft" }),
  ]);
  assert.equal(s.totalPending, 6);
  assert.deepEqual(s.counts, { opportunity: 2, alert: 1, followupTask: 1, campaignDraft: 2 });
});

test("derivePulseSummary: topActions prioriza alerts antes de opportunities antes de followups antes de campaign_drafts", () => {
  const s = derivePulseSummary(
    [
      row({ id: "cd", kind: "campaign_draft", createdAt: "2026-10-22T10:00:00Z" }),
      row({ id: "ft", kind: "followup_task", createdAt: "2026-10-22T10:00:00Z" }),
      row({ id: "op", kind: "opportunity", createdAt: "2026-10-22T10:00:00Z" }),
      row({ id: "al", kind: "alert", createdAt: "2026-10-22T10:00:00Z" }),
    ],
    4,
  );
  assert.deepEqual(
    s.topActions.map((r) => r.id),
    ["al", "op", "ft", "cd"],
  );
});

test("derivePulseSummary: dentro do mesmo kind, mais recente primeiro", () => {
  const s = derivePulseSummary(
    [
      row({ id: "op-old", kind: "opportunity", createdAt: "2026-10-20T10:00:00Z" }),
      row({ id: "op-new", kind: "opportunity", createdAt: "2026-10-22T12:00:00Z" }),
      row({ id: "op-mid", kind: "opportunity", createdAt: "2026-10-21T12:00:00Z" }),
    ],
    3,
  );
  assert.deepEqual(
    s.topActions.map((r) => r.id),
    ["op-new", "op-mid", "op-old"],
  );
});

test("derivePulseSummary: respeita topN", () => {
  const rows = Array.from({ length: 10 }, (_, i) =>
    row({ id: `r${i}`, kind: "opportunity", createdAt: `2026-10-${22 - (i % 10)}T10:00:00Z` }),
  );
  assert.equal(derivePulseSummary(rows, 3).topActions.length, 3);
  assert.equal(derivePulseSummary(rows, 0).topActions.length, 0);
  assert.equal(derivePulseSummary(rows, 100).topActions.length, 10);
});

test("derivePulseSummary: topN negativo é tratado como 0", () => {
  const rows = [row({ id: "a" }), row({ id: "b" })];
  assert.equal(derivePulseSummary(rows, -5).topActions.length, 0);
});
