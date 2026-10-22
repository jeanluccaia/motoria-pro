import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AGENT_ACTION_POLICIES,
  AGENT_CAMPAIGN_REQUIRES_HUMAN_APPROVAL,
  assertKindHasPolicy,
  canAutoApprove,
  policyFor,
} from "./policies.ts";

// ---------------------------------------------------------------------------
// Decisão homologada (2026-10-22) — Jean, aprovação por kind:
//   "Sem auto-approve. Status inicial sempre 'pending_review'."
// Estes testes blindam a policy contra regressão silenciosa (ex.: alguém
// trocando opportunity para allowAutoApprove=true sem passar pelo Jean).
// ---------------------------------------------------------------------------

test("TODOS os kinds da policy exigem aprovação humana nesta etapa", () => {
  for (const [kind, policy] of Object.entries(AGENT_ACTION_POLICIES)) {
    assert.equal(policy.requiresApproval, true, `${kind} deve exigir aprovação`);
    assert.equal(policy.allowAutoApprove, false, `${kind} NÃO pode permitir auto-approve nesta etapa`);
  }
});

test("canAutoApprove retorna false para todos os kinds", () => {
  const kinds = ["opportunity", "alert", "followup_task", "campaign_draft"] as const;
  for (const kind of kinds) {
    assert.equal(canAutoApprove(kind), false, `${kind} não pode auto-approve`);
  }
});

test("policyFor retorna a policy declarada para cada kind esperado", () => {
  const kinds = ["opportunity", "alert", "followup_task", "campaign_draft"] as const;
  for (const kind of kinds) {
    const policy = policyFor(kind);
    assert.ok(policy, `policy para ${kind} tem que existir`);
    assert.equal(policy.requiresApproval, true);
    assert.equal(policy.allowAutoApprove, false);
    assert.ok(policy.rationale.length > 0, `rationale de ${kind} não pode ser vazio`);
  }
});

test("assertKindHasPolicy aceita kinds declarados e lança para desconhecidos", () => {
  assert.doesNotThrow(() => assertKindHasPolicy("opportunity"));
  assert.doesNotThrow(() => assertKindHasPolicy("alert"));
  assert.doesNotThrow(() => assertKindHasPolicy("followup_task"));
  assert.doesNotThrow(() => assertKindHasPolicy("campaign_draft"));
  assert.throws(() => assertKindHasPolicy("rogue_kind" as never), /sem policy/);
});

test("campanhas também exigem aprovação humana nesta etapa", () => {
  assert.equal(AGENT_CAMPAIGN_REQUIRES_HUMAN_APPROVAL, true);
});
