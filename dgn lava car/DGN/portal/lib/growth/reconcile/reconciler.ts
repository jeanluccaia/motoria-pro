/**
 * Ponto único de entrada do reconciliador read-only.
 * Recebe input JÁ carregado (customers, subscriptions, vehicles) + linhas
 * parseadas, e devolve preview determinístico. Nenhum I/O aqui.
 */

import type { DgnCustomer } from "../dgn-growth-utils.ts";
import { buildCustomerIndex, matchCustomer, matchSubscription } from "./matcher.ts";
import { classifyRow } from "./classifier.ts";
import type {
  ReconcileClassification,
  ReconcileInputRow,
  ReconcilePreview,
  ReconcileSubscriptionRow,
  ReconcileVehicleRow,
} from "./types.ts";

const EMPTY_COUNTS: Record<ReconcileClassification, number> = {
  ALREADY_CORRECT: 0,
  PROMOTE_EXISTING: 0,
  UPDATE_EXISTING_REVIEW: 0,
  CREATE_NEW: 0,
  RENEWAL_PENDING: 0,
  CUSTOMER_NOT_FOUND: 0,
  POSSIBLE_MATCH: 0,
  CONFLICT: 0,
};

export interface ReconcileArgs {
  rows: ReconcileInputRow[];
  customers: DgnCustomer[];
  subscriptions: ReconcileSubscriptionRow[];
  vehicles: ReconcileVehicleRow[];
  dataOrigin: "db" | "json" | "json-fallback";
  now?: Date;
}

export function reconcile({ rows, customers, subscriptions, vehicles, dataOrigin, now }: ReconcileArgs): ReconcilePreview {
  const index = buildCustomerIndex(customers, vehicles);
  const currentNow = now ?? new Date();
  const items = rows.map((row, rowIndex) => {
    const customerMatch = matchCustomer(row, index);
    const subscriptionMatch = customerMatch.customerId
      ? matchSubscription(row, customerMatch.customerId, subscriptions, vehicles)
      : { strategy: "none" as const, subscriptionId: null, currentPlan: null, currentCycle: null,
          currentStatus: null, currentIsActive: false, providerLinked: false, candidatesCount: 0 };
    return classifyRow({
      row, rowIndex,
      customer: customerMatch,
      subscription: subscriptionMatch,
      subscriptions, vehicles,
      now: currentNow,
    });
  });

  const counts: Record<ReconcileClassification, number> = { ...EMPTY_COUNTS };
  for (const item of items) counts[item.classification] += 1;

  const toPromote = counts.PROMOTE_EXISTING;
  const toCreate = counts.CREATE_NEW;
  const summary = `${items.length} linha(s) avaliada(s) · ${toPromote} promoção(ões) candidata(s) · ${toCreate} criação(ões) candidata(s) · nenhuma cobrança PagBank será alterada.`;

  return { totalRows: items.length, counts, items, dataOrigin, summary };
}
