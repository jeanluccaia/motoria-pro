import test from "node:test";
import assert from "node:assert/strict";
import { derivePortalAccessStatus } from "./access-status.ts";

// 8 casos canônicos da spec P0 — cada um mapeando para um dos 4 códigos.

test("Caso 1: sub + email + auth + gate → ACCESS_PROVISIONED", () => {
  const r = derivePortalAccessStatus({ canonicalSubscriptionActive: true, hasEmail: true, hasAuthLink: true, portalBetaEnabled: true });
  assert.equal(r.status, "ACCESS_PROVISIONED");
  assert.equal(r.label, "Acesso liberado");
  assert.deepEqual(r.blockers, []);
});

test("Caso 2: sub + email + auth + gate OFF → ACCESS_INCOMPLETE", () => {
  const r = derivePortalAccessStatus({ canonicalSubscriptionActive: true, hasEmail: true, hasAuthLink: true, portalBetaEnabled: false });
  assert.equal(r.status, "ACCESS_INCOMPLETE");
  assert.equal(r.label, "Acesso incompleto");
  assert.ok(r.blockers.includes("PORTAL_GATE_DISABLED"));
});

test("Caso 3: sub + sem email + sem auth + gate OFF → NOT_PROVISIONED", () => {
  const r = derivePortalAccessStatus({ canonicalSubscriptionActive: true, hasEmail: false, hasAuthLink: false, portalBetaEnabled: false });
  assert.equal(r.status, "NOT_PROVISIONED");
  assert.equal(r.label, "Não liberado");
});

test("Caso 4: sub + email + gate ON + sem auth → ACCESS_INCOMPLETE", () => {
  const r = derivePortalAccessStatus({ canonicalSubscriptionActive: true, hasEmail: true, hasAuthLink: false, portalBetaEnabled: true });
  assert.equal(r.status, "ACCESS_INCOMPLETE");
  assert.ok(r.blockers.includes("MISSING_AUTH_LINK"));
});

test("Caso 5: email + auth + gate ON + SEM sub ativa → INCONSISTENT", () => {
  const r = derivePortalAccessStatus({ canonicalSubscriptionActive: false, hasEmail: true, hasAuthLink: true, portalBetaEnabled: true });
  assert.equal(r.status, "INCONSISTENT");
  assert.equal(r.label, "Inconsistente");
  assert.ok(r.blockers.includes("MISSING_ACTIVE_SUBSCRIPTION"));
});

test("Caso 6: subscription detectada/inativa + email/auth/gate → INCONSISTENT (nunca provisionado)", () => {
  // subscription detectada => canonicalSubscriptionActive=false (só is_active_subscriber=true conta)
  const r = derivePortalAccessStatus({ canonicalSubscriptionActive: false, hasEmail: true, hasAuthLink: true, portalBetaEnabled: true });
  assert.equal(r.status, "INCONSISTENT");
  assert.notEqual(r.status, "ACCESS_PROVISIONED");
});

test("Caso 7: knownSubscriberPlan sozinho (sem sub canônica, sem email/auth/gate) → NOT_PROVISIONED", () => {
  // Simula Benedito no bug antigo: knownSubscriberPlan não entra nesta função,
  // portanto quem chama passa canonicalSubscriptionActive=true APENAS quando
  // é canônico. Se só knownSubscriberPlan existe, o caller passa tudo false.
  const r = derivePortalAccessStatus({ canonicalSubscriptionActive: false, hasEmail: false, hasAuthLink: false, portalBetaEnabled: false });
  assert.equal(r.status, "NOT_PROVISIONED");
});

test("Caso 8: CTA coerente — status ACCESS_PROVISIONED nunca combina com blocker", () => {
  // Invariante: ACCESS_PROVISIONED => blockers vazio → UI que renderiza CTA
  // "Liberar acesso ao Portal" olha para `status !== "ACCESS_PROVISIONED"`.
  const provisioned = derivePortalAccessStatus({ canonicalSubscriptionActive: true, hasEmail: true, hasAuthLink: true, portalBetaEnabled: true });
  assert.equal(provisioned.status, "ACCESS_PROVISIONED");
  assert.equal(provisioned.blockers.length, 0);

  const notProv = derivePortalAccessStatus({ canonicalSubscriptionActive: true, hasEmail: false, hasAuthLink: false, portalBetaEnabled: false });
  assert.notEqual(notProv.status, "ACCESS_PROVISIONED");
  assert.ok(notProv.blockers.length > 0);
});
