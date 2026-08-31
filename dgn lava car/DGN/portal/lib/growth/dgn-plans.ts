// Fonte canônica dos planos e modalidades DGN autorizados. Qualquer skill de
// preparação (prepare_only) que mencionar plano ou modalidade DEVE cruzar com
// esta lista — se não bater, é vazamento.
//
// Nunca renomear os valores aqui sem alinhar com a operação. Semestral/Anual/
// Trimestral estão explicitamente bloqueados porque não são oferta oficial da
// campanha Founder 2026.

export const DGN_SUBSCRIBER_PLANS = ["Essential", "Smart", "Priority"] as const;
export type DgnSubscriberPlan = (typeof DGN_SUBSCRIBER_PLANS)[number];

export const DGN_ACQUISITION_PLANS = ["Smart", "Priority", "Corporate Care"] as const;
export type DgnAcquisitionPlan = (typeof DGN_ACQUISITION_PLANS)[number];

export const DGN_BILLING_MODALITIES = [
  "Mensal",
  "Fidelidade de 6 meses",
  "Fidelidade de 12 meses",
] as const;
export type DgnBillingModality = (typeof DGN_BILLING_MODALITIES)[number];

/** Termos que a IA NÃO pode citar como modalidade — não são oferta oficial. */
export const DGN_FORBIDDEN_MODALITIES = ["Semestral", "Anual", "Trimestral"] as const;

/** Lista consolidada usada por testes de leak. */
export const DGN_CANONICAL_TERMS = [
  ...DGN_SUBSCRIBER_PLANS,
  ...DGN_ACQUISITION_PLANS,
  ...DGN_BILLING_MODALITIES,
] as const;

export function isDgnCanonicalPlan(value: string): boolean {
  const lc = value.toLowerCase();
  return DGN_CANONICAL_TERMS.some((t) => t.toLowerCase() === lc);
}

export function isForbiddenModality(value: string): boolean {
  const lc = value.toLowerCase();
  return DGN_FORBIDDEN_MODALITIES.some((t) => t.toLowerCase() === lc);
}
