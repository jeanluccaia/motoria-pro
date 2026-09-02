/**
 * Loader único do Portal do Assinante (P0 Beta).
 *
 * Chama a RPC `portal_get_current_subscriber()` (security definer),
 * que autoriza pelo `auth.uid()` da sessão. Nunca aceita customer_id
 * vindo do browser — todo o roteamento de identidade acontece no
 * servidor via cookie de sessão.
 *
 * Retorna ARRAY de subscriptions (cliente pode ter múltiplos contratos —
 * ex.: José Sergio com 2 veículos + 2 contratos). Cada subscription
 * carrega os campos P0 canônicos (payment_method/status/evidence_source,
 * financial_review_required, provider_*, migration_status).
 */
import "server-only";
import { createPortalClient } from "./supabase-server";

export type SubscriberStatus =
  | "not_signed_in"
  | "no_link"
  | "beta_gate_closed"
  | "linked_no_subscription"
  | "linked";

export type PaymentMethod = "card_recurring" | "manual" | "unknown";
export type PaymentStatus =
  | "confirmed"
  | "pending"
  | "failed"
  | "refunded"
  | "unknown";
export type PaymentEvidenceSource =
  | "provider"
  | "manual"
  | "legacy"
  | "unknown";
export type MigrationStatus = "not_needed" | "pending" | "complete";
export type CommunicationConsent = "allowed" | "blocked" | "unknown";

export interface SubscriberVehicle {
  id: string;
  plate: string | null;
  masked_plate: string | null;
  brand: string | null;
  model: string | null;
  is_primary: boolean | null;
}

export interface SubscriberSubscription {
  id: string;
  plan: string | null;
  cycle: string | null;
  status: string | null;
  billing_status: string | null;
  billing_due_at: string | null;
  billing_due_source: string | null;
  payment_method_label: string | null;
  payment_verification_status: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_evidence_source: PaymentEvidenceSource;
  payment_confidence: number;
  last_payment_confirmed_at: string | null;
  next_due_date: string | null;
  last_verified_at: string | null;
  migration_status: MigrationStatus;
  financial_review_required: boolean;
  financial_review_reason: string | null;
  cycle_started_at: string | null;
  cycle_ends_at: string | null;
  is_active_subscriber: boolean | null;
  next_scheduled_service_at: string | null;
  vehicle_id: string | null;
}

export interface SubscriberFounder {
  status: string | null;
  number: string | null;
}

export interface SubscriberCustomer {
  id: string;
  name: string;
  first_name: string;
  masked_phone: string | null;
  communication_consent: CommunicationConsent;
}

export interface CurrentSubscriber {
  status: SubscriberStatus;
  customer: SubscriberCustomer | null;
  subscriptions: SubscriberSubscription[];
  vehicles: SubscriberVehicle[];
  founder: SubscriberFounder | null;
  /** Motivo humano quando status != "linked" (para exibir na UI). */
  reason?: string | null;
}

const EMPTY: CurrentSubscriber = {
  status: "not_signed_in",
  customer: null,
  subscriptions: [],
  vehicles: [],
  founder: null,
  reason: null,
};

export async function loadCurrentSubscriber(): Promise<CurrentSubscriber> {
  const supabase = await createPortalClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...EMPTY };

  const { data, error } = await supabase.rpc("portal_get_current_subscriber");
  if (error) {
    console.error("[portal] rpc portal_get_current_subscriber falhou", error.message);
    return { ...EMPTY, status: "no_link" };
  }
  const payload = (data ?? {}) as Record<string, unknown>;
  if (!payload.linked) {
    return { ...EMPTY, status: "no_link", reason: (payload.reason as string) ?? null };
  }
  if (payload.beta_enabled === false) {
    return {
      ...EMPTY,
      status: "beta_gate_closed",
      reason:
        (payload.reason as string) ??
        "Portal em beta fechada — acesso ainda não liberado.",
    };
  }
  const subscriptions =
    ((payload.subscriptions ?? []) as SubscriberSubscription[]) ?? [];
  const vehicles = ((payload.vehicles ?? []) as SubscriberVehicle[]) ?? [];
  const customer = (payload.customer ?? null) as SubscriberCustomer | null;
  return {
    status: subscriptions.length > 0 ? "linked" : "linked_no_subscription",
    customer,
    subscriptions,
    vehicles,
    founder: (payload.founder ?? null) as SubscriberFounder | null,
    reason: null,
  };
}

// -----------------------------------------------------------------------------
// Derivações puras — usadas pelas telas do Portal para exibir estados honestos
// -----------------------------------------------------------------------------

/**
 * A "subscription primária" é o contrato ativo mais recente. Se todos são
 * ativos, escolhe o primeiro que não está em review. Se todos estão em
 * review, escolhe o primeiro. Nunca undefined quando há subscriptions.
 */
export function primarySubscription(
  subs: SubscriberSubscription[],
): SubscriberSubscription | null {
  if (subs.length === 0) return null;
  const activeNotUnderReview = subs.find(
    (s) => s.is_active_subscriber && !s.financial_review_required,
  );
  if (activeNotUnderReview) return activeNotUnderReview;
  const active = subs.find((s) => s.is_active_subscriber);
  return active ?? subs[0]!;
}

export function findVehicleForSubscription(
  subscription: SubscriberSubscription,
  vehicles: SubscriberVehicle[],
): SubscriberVehicle | null {
  if (subscription.vehicle_id) {
    const found = vehicles.find((v) => v.id === subscription.vehicle_id);
    if (found) return found;
  }
  return vehicles.find((v) => v.is_primary) ?? vehicles[0] ?? null;
}

export function hasFinancialReview(subs: SubscriberSubscription[]): boolean {
  return subs.some((s) => s.financial_review_required);
}

// Re-exporta os derivadores puros para conveniência dos Server Components
export {
  balanceDisplay,
  formatDueDate,
  nextServiceDisplay,
  paymentDisplayLabel,
} from "./display";
