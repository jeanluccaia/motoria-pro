import test from "node:test";
import assert from "node:assert/strict";
import {
  balanceDisplay,
  formatAppointmentDateTime,
  formatDueDate,
  nextAppointmentDisplay,
  nextServiceDisplay,
  paymentDisplayLabel,
  type AppointmentShape,
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
test("formatDueDate retorna 'Data em atualização' quando ausente", () => {
  assert.equal(formatDueDate(null), "Data em atualização");
  assert.equal(formatDueDate(sub({ billing_due_at: null })), "Data em atualização");
});

test("formatDueDate formata pt-BR quando presente", () => {
  const label = formatDueDate(sub({ billing_due_at: "2026-12-31T03:00:00+00:00" }));
  assert.match(label, /^\d{2}\/\d{2}\/2026$/);
});

// ---------------------------------------------------------------------------
// Batch 2: appointments (crm_appointments)
// ---------------------------------------------------------------------------

function appt(over: Partial<AppointmentShape> = {}): AppointmentShape {
  return {
    scheduled_at: "2026-09-15T14:30:00-03:00",
    service_type: null,
    status: "scheduled",
    ...over,
  };
}

test("formatAppointmentDateTime respeita America/Sao_Paulo (14h30 BRT)", () => {
  const label = formatAppointmentDateTime("2026-09-15T14:30:00-03:00");
  // "15/09/2026 às 14h30"
  assert.match(label, /^15\/09\/2026 às 14h30$/);
});

test("formatAppointmentDateTime devolve string cru quando data inválida", () => {
  assert.equal(formatAppointmentDateTime("not-a-date"), "not-a-date");
});

test("nextAppointmentDisplay vazio quando lista vazia", () => {
  assert.equal(nextAppointmentDisplay([]), "");
});

test("nextAppointmentDisplay usa primeiro item + service_type quando presente", () => {
  const label = nextAppointmentDisplay([appt({ service_type: "Lavagem completa" })]);
  assert.equal(label, "15/09/2026 às 14h30 — Lavagem completa");
});

test("nextAppointmentDisplay omite service_type quando null/vazio", () => {
  assert.equal(nextAppointmentDisplay([appt({ service_type: null })]), "15/09/2026 às 14h30");
  assert.equal(nextAppointmentDisplay([appt({ service_type: "  " })]), "15/09/2026 às 14h30");
});
