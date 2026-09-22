import type { ImportRowOutcome } from "./types.ts";

// -----------------------------------------------------------------------------
// buildSubscriptionRow — helper puro, sem I/O. Monta o record que o CLI de
// import PagBank persiste em crm_subscriptions.
//
// Regras Fase 4 (2026-09-22):
//   * `sourceLabel` é OBRIGATÓRIO — nunca gravamos "pagbank:snapshot-YYYY-MM-DD"
//     hardcoded; a origem do import viaja explicitamente e vai pra
//     `billing_due_source`.
//   * Em UPDATE, `notes` só é sobrescrita quando o snapshot traz nova
//     observação (input.note não-vazio); senão preserva `existingNotes`.
//   * Em UPDATE, `subscription_detected_at` é preservado do banco — o carimbo
//     é da PRIMEIRA descoberta e nunca deve mudar por refresh.
// -----------------------------------------------------------------------------

export interface FinancialReviewSignal {
  required: boolean;
  reason: string | null;
}

export interface BuildSubscriptionRowMode {
  /** True em UPDATE de sub existente; controla preservação de campos humanos. */
  isUpdate: boolean;
  /** Notes atuais no banco (usado só quando isUpdate=true). */
  existingNotes?: string | null;
  /** subscription_detected_at atual no banco (usado só quando isUpdate=true). */
  existingDetectedAt?: string | null;
}

const SUBSCRIPTION_STATUS_MAP: Record<string, string> = {
  ACTIVE: "ativo",
  PENDING: "pendente_validacao",
  CANCELLED: "cancelado",
  ENDED: "encerrado",
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  CARD_RECURRING: "card_recurring",
  MANUAL: "manual",
  UNKNOWN: "unknown",
};

const PAYMENT_STATUS_MAP: Record<string, string> = {
  CONFIRMED: "confirmed",
  PENDING: "pending",
  FAILED: "failed",
  REFUNDED: "refunded",
  UNKNOWN: "unknown",
};

const PAYMENT_EVIDENCE_SOURCE_MAP: Record<string, string> = {
  PROVIDER: "provider",
  MANUAL: "manual",
  LEGACY: "legacy",
  UNKNOWN: "unknown",
};

const MIGRATION_STATUS_MAP: Record<string, string> = {
  NOT_NEEDED: "not_needed",
  PENDING: "pending",
  COMPLETE: "complete",
};

export function buildSubscriptionRow(
  input: ImportRowOutcome["input"],
  customerId: string,
  vehicleId: string | null,
  financialReview: FinancialReviewSignal,
  providerCustomerId: string | null,
  sourceLabel: string,
  mode: BuildSubscriptionRowMode,
): Record<string, unknown> {
  const paymentMethodLabel =
    input.payment_method === "CARD_RECURRING"
      ? "Cartão recorrente (PagBank)"
      : input.payment_method === "MANUAL"
        ? "Manual"
        : "Desconhecido";
  const paymentVerification =
    input.payment_evidence_source === "PROVIDER" && input.payment_status === "CONFIRMED"
      ? "provider_confirmed"
      : "not_verified";

  const incomingNote = (input.note ?? "").trim();
  const notes = mode.isUpdate
    ? incomingNote.length > 0
      ? input.note
      : mode.existingNotes ?? null
    : input.note ?? null;

  const subscriptionDetectedAt = mode.isUpdate
    ? mode.existingDetectedAt ?? new Date().toISOString()
    : new Date().toISOString();

  return {
    customer_id: customerId,
    subscription_plan: input.plan,
    subscription_cycle: input.cycle,
    subscription_status: SUBSCRIPTION_STATUS_MAP[input.status] ?? "detectado",
    subscription_source: "Importação",
    subscription_detected_at: subscriptionDetectedAt,
    billing_status: "active",
    billing_due_at: input.next_due_date ? new Date(input.next_due_date).toISOString() : null,
    billing_due_source: sourceLabel,
    payment_method_label: paymentMethodLabel,
    payment_verification_status: paymentVerification,
    payment_method: PAYMENT_METHOD_MAP[input.payment_method] ?? "unknown",
    payment_status: PAYMENT_STATUS_MAP[input.payment_status] ?? "unknown",
    payment_evidence_source: PAYMENT_EVIDENCE_SOURCE_MAP[input.payment_evidence_source] ?? "unknown",
    payment_confidence:
      input.payment_status === "CONFIRMED" && input.payment_evidence_source === "PROVIDER" ? 1 : 0,
    provider_customer_id: providerCustomerId,
    provider_subscription_id: input.provider_subscription_id,
    last_payment_confirmed_at: input.last_payment_confirmed_at
      ? new Date(input.last_payment_confirmed_at).toISOString()
      : null,
    next_due_date: input.next_due_date ?? null,
    migration_status: MIGRATION_STATUS_MAP[input.migration_status] ?? "not_needed",
    last_verified_at: new Date().toISOString(),
    financial_review_required: financialReview.required,
    financial_review_reason: financialReview.reason,
    vehicle_id: vehicleId,
    is_active_subscriber: input.status === "ACTIVE",
    notes,
  };
}
