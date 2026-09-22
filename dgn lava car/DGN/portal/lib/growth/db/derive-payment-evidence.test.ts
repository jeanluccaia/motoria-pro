import test from "node:test";
import assert from "node:assert/strict";
import { derivePaymentEvidence } from "./derive-payment-evidence.ts";

// Fase 4 — derivação canônica de "situação financeira". Cobre os 5 estados
// canônicos + os 3 casos reais observados em prod 2026-09-22
// (Bruno Rossetti = PagBank stale, Benedito = manual sem verif, Iara = sem
// evidência) para servir de regressão sempre que a lógica evoluir.

const NOW = new Date("2026-09-22T12:00:00Z");

test("Fase 4: PagBank confirmado com conciliação recente → PAGBANK_CONFIRMED (isTrustedPaid=true)", () => {
  const r = derivePaymentEvidence({
    paymentEvidenceSource: "provider",
    paymentVerificationStatus: "provider_confirmed",
    paymentStatus: "confirmed",
    lastPaymentConfirmedAt: "2026-09-20T00:00:00Z",
    lastVerifiedAt: "2026-09-21T00:00:00Z",
    now: NOW,
  });
  assert.equal(r.state, "PAGBANK_CONFIRMED");
  assert.equal(r.isTrustedPaid, true);
  assert.equal(r.needsVerificationLabel, false);
  assert.equal(r.tone, "emerald");
});

test("Fase 4: PagBank verificado há 20 dias → PAGBANK_STALE (não é pago; verificação necessária)", () => {
  // Cenário real: Bruno Rossetti, verificado em 2026-09-02, hoje 2026-09-22.
  const r = derivePaymentEvidence({
    paymentEvidenceSource: "provider",
    paymentVerificationStatus: "provider_confirmed",
    paymentStatus: "confirmed",
    lastPaymentConfirmedAt: "2026-08-04T00:00:00Z",
    lastVerifiedAt: "2026-09-02T23:27:27Z",
    now: NOW,
  });
  assert.equal(r.state, "PAGBANK_STALE");
  assert.equal(r.isTrustedPaid, false);
  assert.equal(r.needsVerificationLabel, true);
  assert.equal(r.tone, "amber");
  assert.equal(r.ageOfVerificationDays, 19);
  assert.match(r.detail, /19 dias/);
});

test("Fase 4: PagBank verificado há exatamente 7 dias ainda é fresh (não stale por default)", () => {
  const r = derivePaymentEvidence({
    paymentEvidenceSource: "provider",
    paymentVerificationStatus: "provider_confirmed",
    paymentStatus: "confirmed",
    lastPaymentConfirmedAt: "2026-08-15T00:00:00Z",
    lastVerifiedAt: "2026-09-15T12:00:00Z",
    now: NOW,
  });
  assert.equal(r.state, "PAGBANK_CONFIRMED");
  assert.equal(r.ageOfVerificationDays, 7);
});

test("Fase 4: threshold customizável — mesma sub com staleAfterDays=3 vira stale", () => {
  const r = derivePaymentEvidence({
    paymentEvidenceSource: "provider",
    paymentVerificationStatus: "provider_confirmed",
    paymentStatus: "confirmed",
    lastPaymentConfirmedAt: "2026-08-15T00:00:00Z",
    lastVerifiedAt: "2026-09-15T12:00:00Z",
    now: NOW,
    staleAfterDays: 3,
  });
  assert.equal(r.state, "PAGBANK_STALE");
});

test("Fase 4: manual + manual_confirmation → MANUAL_VERIFIED (isTrustedPaid=true)", () => {
  const r = derivePaymentEvidence({
    paymentEvidenceSource: "manual",
    paymentVerificationStatus: "manual_confirmation",
    paymentStatus: "confirmed",
    lastPaymentConfirmedAt: null,
    lastVerifiedAt: "2026-09-20T00:00:00Z",
    now: NOW,
  });
  assert.equal(r.state, "MANUAL_VERIFIED");
  assert.equal(r.isTrustedPaid, true);
  assert.equal(r.needsVerificationLabel, false);
  assert.equal(r.tone, "emerald");
});

test("Fase 4: manual + not_verified (backfill Founder) → MANUAL_REGISTERED (não é pago)", () => {
  // Cenário real: Benedito Constantino, promovido 2026-09-18 via
  // crm_promote_existing_subscription. Ainda não deve ser tratado como pago.
  const r = derivePaymentEvidence({
    paymentEvidenceSource: "manual",
    paymentVerificationStatus: "not_verified",
    paymentStatus: "confirmed",
    lastPaymentConfirmedAt: null,
    lastVerifiedAt: "2026-09-18T00:28:37Z",
    now: NOW,
  });
  assert.equal(r.state, "MANUAL_REGISTERED");
  assert.equal(r.isTrustedPaid, false);
  assert.equal(r.needsVerificationLabel, true);
  assert.equal(r.tone, "amber");
  assert.match(r.detail, /Backfill sem verifica/i);
});

test("Fase 4: unknown/legacy sem evidência + status=confirmed → NO_EVIDENCE (nunca infere pago)", () => {
  const r = derivePaymentEvidence({
    paymentEvidenceSource: "unknown",
    paymentVerificationStatus: "not_verified",
    paymentStatus: "confirmed",
    lastPaymentConfirmedAt: null,
    lastVerifiedAt: null,
    now: NOW,
  });
  assert.equal(r.state, "NO_EVIDENCE");
  assert.equal(r.isTrustedPaid, false);
  assert.equal(r.needsVerificationLabel, true);
  assert.equal(r.tone, "red");
  // Detail precisa denunciar o padrão inseguro:
  assert.match(r.detail, /sem evid/i);
});

test("Fase 4: unknown + status=unknown → NO_EVIDENCE (padrão Iara Menezes Nº004)", () => {
  const r = derivePaymentEvidence({
    paymentEvidenceSource: "unknown",
    paymentVerificationStatus: "not_verified",
    paymentStatus: "unknown",
    lastPaymentConfirmedAt: null,
    lastVerifiedAt: null,
    now: NOW,
  });
  assert.equal(r.state, "NO_EVIDENCE");
  assert.equal(r.isTrustedPaid, false);
  assert.equal(r.needsVerificationLabel, true);
});

test("Fase 4: null/undefined em todos os campos → NO_EVIDENCE (nunca crasha)", () => {
  const r = derivePaymentEvidence({
    paymentEvidenceSource: null,
    paymentVerificationStatus: null,
    paymentStatus: null,
    lastPaymentConfirmedAt: null,
    lastVerifiedAt: null,
    now: NOW,
  });
  assert.equal(r.state, "NO_EVIDENCE");
  assert.equal(r.ageOfVerificationDays, null);
});

test("Fase 4: lastVerifiedAt inválido → ageOfVerificationDays fica null (não crasha)", () => {
  const r = derivePaymentEvidence({
    paymentEvidenceSource: "provider",
    paymentVerificationStatus: "provider_confirmed",
    paymentStatus: "confirmed",
    lastPaymentConfirmedAt: null,
    lastVerifiedAt: "não-é-data",
    now: NOW,
  });
  assert.equal(r.state, "PAGBANK_CONFIRMED"); // sem age, cai no fresh
  assert.equal(r.ageOfVerificationDays, null);
});

test("Fase 4: casos maiúsculos/minúsculos misturados (source vindo do banco) — normaliza", () => {
  const r = derivePaymentEvidence({
    paymentEvidenceSource: "PROVIDER",
    paymentVerificationStatus: "Provider_Confirmed",
    paymentStatus: "CONFIRMED",
    lastPaymentConfirmedAt: null,
    lastVerifiedAt: "2026-09-21T00:00:00Z",
    now: NOW,
  });
  assert.equal(r.state, "PAGBANK_CONFIRMED");
  assert.equal(r.isTrustedPaid, true);
});

test("Fase 4: provider MAS verification=not_verified → NO_EVIDENCE (não confia em provider sem verif)", () => {
  // Guarda: se por algum bug o evidence é 'provider' mas verification NÃO é
  // 'provider_confirmed', não tratamos como pago. Cai em NO_EVIDENCE por
  // não bater em nenhuma cláusula segura acima.
  const r = derivePaymentEvidence({
    paymentEvidenceSource: "provider",
    paymentVerificationStatus: "not_verified",
    paymentStatus: "confirmed",
    lastPaymentConfirmedAt: null,
    lastVerifiedAt: "2026-09-20T00:00:00Z",
    now: NOW,
  });
  assert.equal(r.state, "NO_EVIDENCE");
  assert.equal(r.isTrustedPaid, false);
});
