// -----------------------------------------------------------------------------
// Catálogo canônico de ofertas DGN — fonte única usada pela UI "Oferecer
// assinatura" na ficha do cliente.
//
// Benefícios: espelhamos APENAS os bullets homologados em
// founder-offer-catalog.ts (fonte extraída de dgnclub.com e já validada por
// testes de drift). Como o briefing de 12/10 tira "Founder" do centro das
// chamadas de adesão, o rótulo "Founder" não aparece na UI — só a redação
// oficial dos bullets.
//
// Preço NÃO é hardcoded aqui. A matriz oficial em founder-offer-catalog.ts
// depende de categoria do veículo (Hatch/Sedan/SUV/Picape). Enquanto a UI
// "Oferecer assinatura" não pedir a categoria, exibimos "Sob consulta
// operacional" — comportamento seguro, zero número presumido.
//
// Modalidades aceitas por plano também não são opinião: hoje todos os planos
// aceitam as 3 modalidades (Mensal, Fid 6m, Fid 12m), mas o schema deixa
// restringir se um dia um plano virar exclusivo de uma modalidade.
// -----------------------------------------------------------------------------

import { DGN_SUBSCRIBER_PLANS, DGN_BILLING_MODALITIES, type DgnSubscriberPlan, type DgnBillingModality } from "../dgn-plans.ts";
import { founderPlanDefinitions, type FounderPlanCode } from "../../founder-offer-catalog.ts";

// Lavagens incluídas por mês — regra canônica DGN. Inlined aqui para que
// catalog.ts seja client-safe (subscriptions-write.ts é server-only e
// carrega service_role). Teste cruzado garante zero drift com
// includedPerMonthFromPlan e com founderPlanDefinitions.
const WASHES_PER_MONTH: Record<DgnSubscriberPlan, number> = {
  Essential: 1,
  Smart: 2,
  Priority: 4,
};

export interface PlanOfferEntry {
  plan: DgnSubscriberPlan;
  /** Lavagens incluídas por mês para o plano. Vem de includedPerMonthFromPlan. */
  washesPerMonth: number;
  /** Resumo curto do público-alvo. Reusa a descrição oficial do catálogo canônico. */
  idealFor: string;
  /** Benefícios concretos do plano — redação EXATA do catálogo canônico homologado. */
  benefits: readonly string[];
  /** Modalidades oficialmente aceitas. Nunca inclui Semestral/Anual/Trimestral soltos. */
  modalities: readonly DgnBillingModality[];
  /** Preço mensal em BRL. null = "Sob consulta operacional" (depende da categoria do veículo). */
  priceMonthlyBRL: number | null;
}

const SHARED_MODALITIES = DGN_BILLING_MODALITIES;

const PLAN_TO_FOUNDER_CODE: Record<DgnSubscriberPlan, FounderPlanCode> = {
  Essential: "essential",
  Smart: "smart",
  Priority: "priority",
};

function officialBenefits(plan: DgnSubscriberPlan): readonly string[] {
  const code = PLAN_TO_FOUNDER_CODE[plan];
  const def = founderPlanDefinitions.find((p) => p.planCode === code);
  if (!def) throw new Error(`Plano ${plan} sem definição canônica em founderPlanDefinitions`);
  return def.benefits;
}

function officialDescription(plan: DgnSubscriberPlan): string {
  const code = PLAN_TO_FOUNDER_CODE[plan];
  const def = founderPlanDefinitions.find((p) => p.planCode === code);
  if (!def) throw new Error(`Plano ${plan} sem definição canônica em founderPlanDefinitions`);
  return def.description;
}

export const DGN_PLAN_CATALOG: Record<DgnSubscriberPlan, PlanOfferEntry> = {
  Essential: {
    plan: "Essential",
    washesPerMonth: WASHES_PER_MONTH.Essential,
    idealFor: officialDescription("Essential"),
    benefits: officialBenefits("Essential"),
    modalities: SHARED_MODALITIES,
    priceMonthlyBRL: null,
  },
  Smart: {
    plan: "Smart",
    washesPerMonth: WASHES_PER_MONTH.Smart,
    idealFor: officialDescription("Smart"),
    benefits: officialBenefits("Smart"),
    modalities: SHARED_MODALITIES,
    priceMonthlyBRL: null,
  },
  Priority: {
    plan: "Priority",
    washesPerMonth: WASHES_PER_MONTH.Priority,
    idealFor: officialDescription("Priority"),
    benefits: officialBenefits("Priority"),
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
