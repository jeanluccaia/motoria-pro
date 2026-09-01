/**
 * Derivadores puros de estado do Portal.
 *
 * Sem I/O, sem next/headers, sem server-only. Podem ser importados por
 * testes unitários e por Server Components.
 *
 * P0: usa preferencialmente os campos canônicos (payment_status,
 * payment_evidence_source, financial_review_required); mantém compat com
 * o subset MVP (billing_status, payment_verification_status).
 */

export interface SubscriberSubscriptionShape {
  billing_status: string | null;
  billing_due_at: string | null;
  payment_method_label: string | null;
  payment_verification_status: string | null;
  next_scheduled_service_at: string | null;
  /** Campos P0 (opcionais aqui para preservar compat com testes MVP). */
  payment_status?: string | null;
  payment_evidence_source?: string | null;
  financial_review_required?: boolean | null;
  next_due_date?: string | null;
}

/**
 * Rótulo honesto de status financeiro. Ordem de preferência:
 *   1. Sem subscription → "em validação".
 *   2. Financial review em curso → "em verificação".
 *   3. Provider + confirmed → "confirmado".
 *   4. Falha/renovação/atraso — só se sinalizado por fonte válida.
 *   5. Caso contrário → "em verificação".
 */
export function paymentDisplayLabel(
  sub: SubscriberSubscriptionShape | null,
): string {
  if (!sub) return "Assinatura em validação";

  if (sub.financial_review_required === true) return "Pagamento em verificação";

  // P0: fonte canônica quando disponível.
  if (
    sub.payment_status === "confirmed" &&
    sub.payment_evidence_source === "provider"
  ) {
    return "Pagamento confirmado";
  }
  if (sub.payment_status === "confirmed" && sub.payment_evidence_source === "manual") {
    return "Pagamento confirmado (manual)";
  }
  if (sub.payment_status === "failed") return "Falha de pagamento";
  if (sub.payment_status === "refunded") return "Pagamento estornado";

  // Compat MVP.
  if (sub.payment_verification_status === "provider_confirmed") return "Pagamento confirmado";
  if (sub.payment_verification_status === "manual_confirmation") return "Pagamento confirmado (manual)";
  if (sub.payment_verification_status === "failed") return "Falha de pagamento";
  if (sub.billing_status === "renewal_pending") return "Renovação pendente";
  if (sub.billing_status === "overdue") return "Em atraso";
  return "Pagamento em verificação";
}

/**
 * Fonte da evidência exibida ao operador quando necessário (auditabilidade).
 * Retorna null quando não faz sentido explicitar fonte.
 */
export function paymentSourceLabel(
  sub: SubscriberSubscriptionShape | null,
): string | null {
  if (!sub) return null;
  if (sub.payment_evidence_source === "provider") return "PagBank";
  if (sub.payment_evidence_source === "manual") return "Confirmação manual";
  if (sub.payment_evidence_source === "legacy") return "Registro legado";
  return null;
}

export function balanceDisplay(): string {
  // Saldo real depende de OS/atendimento da 4uCar. NÃO inferir.
  // AGENDADO ≠ UTILIZADO. Só decrementa após ATENDIMENTO CONCLUÍDO.
  return "Saldo do ciclo em validação";
}

export function nextServiceDisplay(
  sub: SubscriberSubscriptionShape | null,
): string {
  if (sub?.next_scheduled_service_at) {
    return new Date(sub.next_scheduled_service_at).toLocaleDateString("pt-BR");
  }
  return "Nenhum atendimento futuro sincronizado";
}

export function formatDueDate(
  sub: SubscriberSubscriptionShape | null,
): string {
  if (!sub) return "Sem vencimento cadastrado";
  const iso = sub.billing_due_at ?? sub.next_due_date ?? null;
  if (!iso) return "Sem vencimento cadastrado";
  return new Date(iso).toLocaleDateString("pt-BR");
}
