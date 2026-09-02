import test from "node:test";
import assert from "node:assert/strict";
import {
  balanceDisplay,
  formatDueDate,
  nextServiceDisplay,
  paymentDisplayLabel,
  type SubscriberSubscriptionShape,
} from "./display.ts";
import { PLANS, planFor } from "./plan-catalog.ts";

function sub(over: Partial<SubscriberSubscriptionShape> = {}): SubscriberSubscriptionShape {
  return {
    billing_status: "active",
    billing_due_at: null,
    payment_method_label: null,
    payment_verification_status: "not_verified",
    next_scheduled_service_at: null,
    ...over,
  };
}

// ---------------------------------------------------------------------------
// planFor
// ---------------------------------------------------------------------------
test("planFor mapeia rótulos oficiais", () => {
  assert.equal(planFor("Essential"), PLANS.Essential);
  assert.equal(planFor("Smart"), PLANS.Smart);
  assert.equal(planFor("Priority"), PLANS.Priority);
  assert.equal(planFor(null), null);
  assert.equal(planFor("Não identificado"), null);
});

test("planFor NUNCA aceita nomenclatura legada", () => {
  assert.equal(planFor("Elite"), null);
  assert.equal(planFor("Premium"), null);
  assert.equal(planFor("Daily"), null);
});

test("frequências oficiais permanecem fixas (1/2/4 por mês)", () => {
  assert.equal(PLANS.Essential.frequencyPerMonth, 1);
  assert.equal(PLANS.Smart.frequencyPerMonth, 2);
  assert.equal(PLANS.Priority.frequencyPerMonth, 4);
});

// ---------------------------------------------------------------------------
// paymentDisplayLabel
// ---------------------------------------------------------------------------
test("Pix/Cartão/Recorrência não conta como pago automático (MVP)", () => {
  assert.equal(paymentDisplayLabel(sub()), "Pagamento em verificação");
});

test("provider_confirmed é o único caminho para 'confirmado'", () => {
  assert.equal(
    paymentDisplayLabel(sub({ payment_verification_status: "provider_confirmed" })),
    "Pagamento confirmado",
  );
  assert.equal(
    paymentDisplayLabel(sub({ payment_verification_status: "manual_confirmation" })),
    "Pagamento confirmado (manual)",
  );
});

test("renewal_pending e overdue têm labels distintas", () => {
  assert.equal(paymentDisplayLabel(sub({ billing_status: "renewal_pending" })), "Renovação pendente");
  assert.equal(paymentDisplayLabel(sub({ billing_status: "overdue" })), "Em atraso");
  assert.equal(paymentDisplayLabel(sub({ payment_verification_status: "failed" })), "Falha de pagamento");
});

test("assinatura ausente vira 'em validação'", () => {
  assert.equal(paymentDisplayLabel(null), "Assinatura em validação");
});

// ---------------------------------------------------------------------------
// balanceDisplay — nunca inventa
// ---------------------------------------------------------------------------
test("balanceDisplay NUNCA retorna número inventado", () => {
  const label = balanceDisplay();
  assert.equal(label, "Saldo do ciclo em validação");
  assert.ok(!/[0-9]/.test(label));
});

// ---------------------------------------------------------------------------
// nextServiceDisplay — nunca deriva de vencimento
// ---------------------------------------------------------------------------
test("nextServiceDisplay NÃO usa billing_due_at como próxima agenda", () => {
  const s = sub({ billing_due_at: "2026-12-31T00:00:00Z", next_scheduled_service_at: null });
  const label = nextServiceDisplay(s);
  assert.equal(label, "Nenhum atendimento futuro sincronizado");
  assert.ok(!label.includes("2026"));
});

test("nextServiceDisplay usa next_scheduled_service_at quando presente", () => {
  const s = sub({ next_scheduled_service_at: "2026-10-05" });
  const label = nextServiceDisplay(s);
  assert.match(label, /\d{2}\/\d{2}\/\d{4}/);
});

// ---------------------------------------------------------------------------
// formatDueDate
// ---------------------------------------------------------------------------
test("formatDueDate retorna 'Sem vencimento cadastrado' quando ausente", () => {
  assert.equal(formatDueDate(null), "Sem vencimento cadastrado");
  assert.equal(formatDueDate(sub({ billing_due_at: null })), "Sem vencimento cadastrado");
});

test("formatDueDate formata pt-BR quando presente", () => {
  const label = formatDueDate(sub({ billing_due_at: "2026-12-31T03:00:00+00:00" }));
  assert.match(label, /^\d{2}\/\d{2}\/2026$/);
});
