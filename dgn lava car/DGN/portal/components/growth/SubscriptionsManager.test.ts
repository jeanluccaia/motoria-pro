import test from "node:test";
import assert from "node:assert/strict";
import {
  isPastDateInput,
  translateEvidenceSource,
  translatePaymentMethod,
  translatePaymentStatus,
} from "./SubscriptionsManager.helpers.ts";

// HOTFIX Fase 1 — helpers puros do editor.

test("isPastDateInput: hoje NÃO é passado", () => {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  assert.equal(isPastDateInput(iso), false);
});

test("isPastDateInput: 2020-01-01 é passado (bloqueia P0.2)", () => {
  assert.equal(isPastDateInput("2020-01-01"), true);
});

test("isPastDateInput: 2099-12-31 é futuro", () => {
  assert.equal(isPastDateInput("2099-12-31"), false);
});

test("isPastDateInput: string vazia não é passado (não bloqueia)", () => {
  assert.equal(isPastDateInput(""), false);
});

test("translatePaymentStatus: enum PT correto", () => {
  assert.equal(translatePaymentStatus("confirmed"), "Confirmado");
  assert.equal(translatePaymentStatus("pending"), "Pendente");
  assert.equal(translatePaymentStatus("failed"), "Falhou");
  assert.equal(translatePaymentStatus("refunded"), "Estornado");
  assert.equal(translatePaymentStatus("unknown"), "Não informado");
  assert.equal(translatePaymentStatus(null), "Não informado");
  assert.equal(translatePaymentStatus(""), "Não informado");
});

test("translatePaymentMethod: enum PT correto", () => {
  assert.equal(translatePaymentMethod("card_recurring"), "Cartão recorrente");
  assert.equal(translatePaymentMethod("manual"), "Manual");
  assert.equal(translatePaymentMethod("unknown"), "Não informado");
});

test("translateEvidenceSource: provider vira PagBank", () => {
  assert.equal(translateEvidenceSource("provider"), "PagBank");
  assert.equal(translateEvidenceSource("manual"), "Manual");
  assert.equal(translateEvidenceSource("legacy"), "Legado");
  assert.equal(translateEvidenceSource("unknown"), "Não informado");
});
