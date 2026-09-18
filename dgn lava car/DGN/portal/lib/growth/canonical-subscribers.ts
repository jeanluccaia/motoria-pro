/**
 * Fonte única para as métricas de "Assinantes ativos" e "Assinaturas ativas".
 *
 * REGRA CANÔNICA — a única promoção válida para "assinante ativo" é
 * `crm_subscriptions.is_active_subscriber = true` (exposto como
 * `customer.subscription?.isActive` após `mapGrowthSnapshot`).
 *
 * NÃO promovem a ativo:
 *   - `commercialStatus` (contexto operacional / campanha)
 *   - `knownSubscriberStatus` (base viva 4uCar; sinal, não contrato)
 *   - `knownSubscriberPlan` (rótulo do plano, não flag de portal)
 *   - `renovacao_pendente` (contado separadamente como sinal 4uCar)
 *
 * Distinção obrigatória:
 *   - **Assinantes ativos** = `count(distinct customer_id)` — pessoas.
 *   - **Assinaturas ativas** = `count(*)` — contratos. Pode ser > que o
 *     número de assinantes quando o mesmo customer tem N subscriptions
 *     ativas (padrão José Sergio: 1 sub por veículo).
 *
 * `DgnCustomer` só carrega UMA subscription por customer após
 * `mapGrowthSnapshot`. Para conhecer o número real de LINHAS ativas em
 * `crm_subscriptions`, passar `activeSubscriptionRowCount` no `opts`
 * (o endpoint que também lê `readGrowthSnapshot` sabe esse número).
 * Sem ele, `activeSubscriptions` cai para o mesmo valor de `activeCustomers`.
 */
import type { DgnCustomer } from "./dgn-growth-utils.ts";

export function isCanonicalActiveSubscriber(customer: DgnCustomer): boolean {
  return customer.subscription?.isActive === true;
}

/**
 * IDs únicos (customer_id) de assinantes canonicamente ativos.
 * Deduplicação obrigatória: identidade = customer_id.
 */
export function getCanonicalActiveSubscriberIds(customers: DgnCustomer[]): string[] {
  const ids = new Set<string>();
  for (const c of customers) {
    if (isCanonicalActiveSubscriber(c)) ids.add(c.id);
  }
  return Array.from(ids);
}

export function getCanonicalActiveSubscribersCount(customers: DgnCustomer[]): number {
  return getCanonicalActiveSubscriberIds(customers).length;
}

export interface CanonicalActiveMetrics {
  /** Pessoas — `count(distinct customer_id)` com `is_active_subscriber=true`. */
  activeCustomers: number;
  /** Contratos — `count(*)` de rows em `crm_subscriptions` com `is_active_subscriber=true`. */
  activeSubscriptions: number;
  customerIds: string[];
  source: "crm_subscriptions";
}

export function getCanonicalActiveSubscriberMetrics(
  customers: DgnCustomer[],
  opts: { activeSubscriptionRowCount?: number } = {},
): CanonicalActiveMetrics {
  const ids = getCanonicalActiveSubscriberIds(customers);
  const rows = typeof opts.activeSubscriptionRowCount === "number" && opts.activeSubscriptionRowCount >= ids.length
    ? opts.activeSubscriptionRowCount
    : ids.length;
  return {
    activeCustomers: ids.length,
    activeSubscriptions: rows,
    customerIds: ids,
    source: "crm_subscriptions",
  };
}
