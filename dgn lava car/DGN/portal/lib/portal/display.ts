/**
 * Derivadores puros de estado do Portal.
 *
 * Sem I/O, sem next/headers, sem server-only. Podem ser importados por
 * testes unitários e por Server Components.
 */

export interface SubscriberSubscriptionShape {
  billing_status: string | null;
  billing_due_at: string | null;
  payment_method_label: string | null;
  payment_verification_status: string | null;
  next_scheduled_service_at: string | null;
}

export function paymentDisplayLabel(
  sub: SubscriberSubscriptionShape | null,
): string {
  if (!sub) return "Assinatura em validação";
  if (sub.payment_verification_status === "provider_confirmed") return "Pagamento confirmado";
  if (sub.payment_verification_status === "manual_confirmation") return "Pagamento confirmado (manual)";
  if (sub.payment_verification_status === "failed") return "Falha de pagamento";
  if (sub.billing_status === "renewal_pending") return "Renovação pendente";
  if (sub.billing_status === "overdue") return "Em atraso";
  return "Pagamento em verificação";
}

export function balanceDisplay(): string {
  // MVP: saldo real depende de OS/atendimento da 4uCar. Não inferir.
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
  if (!sub?.billing_due_at) return "Sem vencimento cadastrado";
  return new Date(sub.billing_due_at).toLocaleDateString("pt-BR");
}
