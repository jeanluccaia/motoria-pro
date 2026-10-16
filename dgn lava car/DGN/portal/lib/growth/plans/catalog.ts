// -----------------------------------------------------------------------------
// Catálogo canônico de ofertas DGN — fonte única usada pela UI "Oferecer
// assinatura" na ficha do cliente. Reaproveita DGN_SUBSCRIBER_PLANS (planos
// oficiais) e includedPerMonthFromPlan (lavagens incluídas por plano).
//
// Preço NÃO é hardcoded. A operação informa quando quiser — a UI mostra
// "Sob consulta operacional" enquanto priceMonthlyBRL for null. Isso respeita
// o invariante "não inventar número de cobrança sem fonte oficial".
//
// Modalidades aceitas por plano também não são opinião: hoje todos os planos
// aceitam as 3 modalidades (Mensal, Fid 6m, Fid 12m), mas o schema deixa
// restringir se um dia um plano virar exclusivo de uma modalidade.
// -----------------------------------------------------------------------------

import { DGN_SUBSCRIBER_PLANS, DGN_BILLING_MODALITIES, type DgnSubscriberPlan, type DgnBillingModality } from "../dgn-plans.ts";
import { includedPerMonthFromPlan } from "../db/subscriptions-write.ts";

export interface PlanOfferEntry {
  plan: DgnSubscriberPlan;
  /** Lavagens incluídas por mês para o plano. Vem de includedPerMonthFromPlan. */
  washesPerMonth: number;
  /** Resumo curto do público-alvo. Nunca inventa — só reusa o que a campanha oficial já comunica. */
  idealFor: string;
  /** Benefícios concretos do plano. Lista curta — nada de marketing solto. */
  benefits: readonly string[];
  /** Modalidades oficialmente aceitas. Nunca inclui Semestral/Anual/Trimestral soltos. */
  modalities: readonly DgnBillingModality[];
  /** Preço mensal em BRL. null = "Sob consulta operacional" — operação informa quando quiser. */
  priceMonthlyBRL: number | null;
}

const SHARED_MODALITIES = DGN_BILLING_MODALITIES;

export const DGN_PLAN_CATALOG: Record<DgnSubscriberPlan, PlanOfferEntry> = {
  Essential: {
    plan: "Essential",
    washesPerMonth: includedPerMonthFromPlan("Essential") ?? 1,
    idealFor: "Primeira experiência DGN — rotina enxuta, uma lavagem mensal.",
    benefits: [
      "1 lavagem completa por mês",
      "Agendamento prioritário pela operação",
      "Sem taxa de adesão",
    ],
    modalities: SHARED_MODALITIES,
    priceMonthlyBRL: null,
  },
  Smart: {
    plan: "Smart",
    washesPerMonth: includedPerMonthFromPlan("Smart") ?? 2,
    idealFor: "Uso recorrente — duas lavagens por mês para quem dirige com mais frequência.",
    benefits: [
      "2 lavagens completas por mês",
      "Agendamento prioritário",
      "Histórico operacional vinculado ao veículo",
    ],
    modalities: SHARED_MODALITIES,
    priceMonthlyBRL: null,
  },
  Priority: {
    plan: "Priority",
    washesPerMonth: includedPerMonthFromPlan("Priority") ?? 4,
    idealFor: "Rotina intensa — quatro lavagens por mês com atendimento preferencial.",
    benefits: [
      "4 lavagens completas por mês",
      "Prioridade na agenda operacional",
      "Acompanhamento comercial humano",
    ],
    modalities: SHARED_MODALITIES,
    priceMonthlyBRL: null,
  },
} as const;

export function listPlanOffers(): PlanOfferEntry[] {
  return DGN_SUBSCRIBER_PLANS.map((plan) => DGN_PLAN_CATALOG[plan]);
}

export function getPlanOffer(plan: string): PlanOfferEntry | null {
  return (DGN_SUBSCRIBER_PLANS as readonly string[]).includes(plan)
    ? DGN_PLAN_CATALOG[plan as DgnSubscriberPlan]
    : null;
}

/**
 * Resolve o plano pré-selecionado para o formulário de criação de assinatura.
 * Qualquer input inválido (null, undefined, string vazia, plano forbidden,
 * typo com case diferente) cai no fallback. Nunca throw — a UI continua
 * funcionando mesmo com query maliciosa / rota antiga.
 */
export function resolvePreselectedPlan(input: unknown, fallback: DgnSubscriberPlan = "Smart"): DgnSubscriberPlan {
  if (typeof input !== "string") return fallback;
  return (DGN_SUBSCRIBER_PLANS as readonly string[]).includes(input)
    ? (input as DgnSubscriberPlan)
    : fallback;
}

/**
 * Rótulo de preço para a UI. Nunca inventa número — se priceMonthlyBRL é null,
 * devolve "Sob consulta operacional". Operação injeta valor oficial quando houver.
 */
export function formatPlanPrice(entry: PlanOfferEntry): string {
  if (entry.priceMonthlyBRL == null) return "Sob consulta operacional";
  return entry.priceMonthlyBRL.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + "/mês";
}
