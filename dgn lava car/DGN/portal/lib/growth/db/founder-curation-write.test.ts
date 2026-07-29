import assert from "node:assert/strict";
import test from "node:test";
import { FounderCurationWriteError, validateFounderCurationPayload } from "./founder-curation-write.ts";

const base = { campaignId: "founders-2026", action: "save", recommendedPlanCode: "smart-founder-semestral", recommendationReasonInternal: "Escolha humana após análise.", expectedUpdatedAt: "2026-07-29T12:00:00.000Z" };

test("seleção manual cria snapshot usando preço server-side", () => {
  const parsed = validateFounderCurationPayload(base);
  assert.equal(parsed.snapshot?.displayedValue, "6x de R$ 110");
});

test("payload fechado rejeita preço e campos adicionais", () => {
  assert.throws(() => validateFounderCurationPayload({ ...base, displayedValue: "R$ 1" }), (error) => error instanceof FounderCurationWriteError && error.status === 400);
});

test("plano inválido e aprovação sem motivo são rejeitados", () => {
  assert.throws(() => validateFounderCurationPayload({ ...base, recommendedPlanCode: "inventado" }));
  assert.throws(() => validateFounderCurationPayload({ ...base, action: "approve", recommendationReasonInternal: "" }));
});
