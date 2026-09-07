import type { DgnCustomer } from "./dgn-growth-utils.ts";

// -----------------------------------------------------------------------------
// Fonte canônica única do "plano do assinante" para uso na UI.
//
// Regra: se o cliente tem contrato ativo (populado em `activePlan` a partir de
// `crm_subscriptions.subscription_plan`), esse é o valor exibido — sem
// normalização (Essential/Smart/Priority/Corporate Care/…). Só quando NÃO há
// contrato ativo o fallback exibe `recommendedPlan`, que é sugestão de
// curadoria/lead.
//
// Antes deste helper o código usava sempre `recommendedPlan`, e como o
// mapeamento no growth-reader devolvia "Smart" para qualquer valor fora da
// tripla {Smart,Priority,Corporate Care}, Ronaldo (Essential) e Gustavo
// (Priority) apareciam como "Smart" na ficha.
// -----------------------------------------------------------------------------

export interface CanonicalPlan {
  label: string;
  source: "subscription" | "recommendation";
}

export function getCanonicalSubscriberPlan(customer: DgnCustomer): CanonicalPlan {
  const active = customer.activePlan?.trim();
  if (active) return { label: active, source: "subscription" };
  return { label: customer.recommendedPlan, source: "recommendation" };
}

/** Rótulo simples do plano canônico (para célula de tabela / chip). */
export function canonicalPlanLabel(customer: DgnCustomer): string {
  return getCanonicalSubscriberPlan(customer).label;
}
