/**
 * Loader único do Portal do Assinante.
 *
 * Chama a RPC `portal_get_current_subscriber()` (security definer),
 * que autoriza pelo `auth.uid()` da sessão. Nunca aceita customer_id
 * vindo do browser — todo o roteamento de identidade acontece no
 * servidor via cookie de sessão.
 */
import "server-only";
import { createPortalClient } from "./supabase-server";

export type SubscriberStatus =
  | "not_signed_in"
  | "no_link"
  | "linked_no_subscription"
  | "linked";

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
  cycle_started_at: string | null;
  cycle_ends_at: string | null;
  is_active_subscriber: boolean | null;
  next_scheduled_service_at: string | null;
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
}

export interface CurrentSubscriber {
  status: SubscriberStatus;
  customer: SubscriberCustomer | null;
  subscription: SubscriberSubscription | null;
  vehicles: SubscriberVehicle[];
  founder: SubscriberFounder | null;
}

const EMPTY: CurrentSubscriber = {
  status: "not_signed_in",
  customer: null,
  subscription: null,
  vehicles: [],
  founder: null,
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
    return { ...EMPTY, status: "no_link" };
  }
  const subscription = (payload.subscription ?? null) as SubscriberSubscription | null;
  return {
    status: subscription ? "linked" : "linked_no_subscription",
    customer: (payload.customer ?? null) as SubscriberCustomer | null,
    subscription,
    vehicles: ((payload.vehicles ?? []) as SubscriberVehicle[]) ?? [],
    founder: (payload.founder ?? null) as SubscriberFounder | null,
  };
}

// Re-exporta os derivadores puros para conveniência dos Server Components
export {
  balanceDisplay,
  formatDueDate,
  nextServiceDisplay,
  paymentDisplayLabel,
} from "./display";
