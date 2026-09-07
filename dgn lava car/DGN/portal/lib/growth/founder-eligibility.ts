/**
 * Regra canônica: quem pode receber convite Founder de AQUISIÇÃO?
 *
 * Curadoria Founder é fila de aquisição. Cliente com assinatura vigente,
 * renovação pendente, Founder confirmado ou descartado NÃO deve aparecer
 * como candidato — mesmo que tenha score alto ou plano sugerido válido.
 *
 * Client-safe: este módulo NÃO importa mais `KNOWN_SUBSCRIBERS_2026_08_16`.
 * O matching por telefone/placa/nome contra a base sensível é feito uma vez
 * server-side (`enrich-known-subscriber.ts` chama
 * `founder-eligibility-server.matchKnownSubscriber`) e o resultado é
 * persistido no customer como `knownSubscriberPlan` + `knownSubscriberStatus`.
 * Aqui apenas lemos esses dois campos — nenhuma PII de terceiros sobra no
 * bundle público.
 */

import { isConfirmedFounder, type DgnCustomer } from "./dgn-growth-utils.ts";

export type FounderIneligibleReason =
  | "founder_confirmado"
  | "assinante_ativo"
  | "renovacao_pendente"
  | "descartado"
  | "assinatura_detectada"
  | "sem_dados_minimos";

// Preserva shape público. `subscriberMatch`/`subscriberMatchReason` foram
// removidos (traziam a KnownSubscriberRecord completa — telefone, placa, nome
// legal). O cliente hoje só precisa do plano/status já sanitizados.
export interface FounderEligibility {
  eligible: boolean;
  reason?: FounderIneligibleReason;
  operatorMessage?: string;
  /** Rótulo do plano detectado (Essential/Smart/Priority) quando aplicável. */
  subscriberPlan?: string;
  /** Deprecated: mantido no shape para compat de import de outros server-modules. */
  subscriberMatchReason?: "phone" | "plate" | "name" | "alias" | "legacy_id" | "preserved_founder";
}

/**
 * Retorna se um cliente pode entrar na fila de Curadoria Founder.
 *
 * Blocking (por ordem de prioridade):
 *  1. Founder confirmado (001/002/003 ou founder_status = 'confirmado').
 *  2. Assinante ativo já reconhecido (via customer.knownSubscriberPlan/Status
 *     enriquecido server-side, ou commercialStatus = "Assinante Ativo").
 *  3. Renovação pendente na base reconhecida.
 *  4. Descartado / bloqueado no pipeline.
 *  5. Sem dados mínimos (sem nome, sem telefone válido).
 */
export function isFounderAcquisitionEligible(customer: DgnCustomer): FounderEligibility {
  if (isConfirmedFounder(customer) || customer.campaign?.founderStatus === "confirmado") {
    return {
      eligible: false,
      reason: "founder_confirmado",
      operatorMessage: "Founder confirmado. Fora da fila de aquisição.",
      subscriberMatchReason: "preserved_founder",
    };
  }

  const plan = customer.knownSubscriberPlan;
  const status = customer.knownSubscriberStatus;
  if (plan) {
    if (status === "renovacao_pendente") {
      return {
        eligible: false,
        reason: "renovacao_pendente",
        operatorMessage: `Assinante ${plan} com renovação pendente. Fora da fila de aquisição até a renovação ser resolvida.`,
        subscriberPlan: plan,
      };
    }
    return {
      eligible: false,
      reason: "assinante_ativo",
      operatorMessage: `Já é assinante DGN ${plan}. Fora da fila de aquisição — trate como retenção.`,
      subscriberPlan: plan,
    };
  }

  if (customer.commercialStatus === "Assinante Ativo") {
    return {
      eligible: false,
      reason: "assinante_ativo",
      operatorMessage: "Cliente marcado como Assinante Ativo. Fora da fila de aquisição.",
    };
  }

  if (
    customer.campaign?.founderStatus === "descartado" ||
    customer.campaign?.commercialStage === "descartado" ||
    customer.commercialStatus === "Perdido"
  ) {
    return {
      eligible: false,
      reason: "descartado",
      operatorMessage: "Cliente descartado. Reative pela curadoria avançada antes de gerar convite.",
    };
  }

  if (customer.hasValidPhone === false) {
    return {
      eligible: false,
      reason: "sem_dados_minimos",
      operatorMessage: "Telefone não cadastrado. Complete o cadastro antes de convidar como Founder.",
    };
  }
  if (!customer.name?.trim()) {
    return {
      eligible: false,
      reason: "sem_dados_minimos",
      operatorMessage: "Cliente sem nome. Complete o cadastro antes de convidar.",
    };
  }

  return { eligible: true };
}

/**
 * Batch helper para a Curadoria: separa elegíveis, assinantes e demais.
 * Preserva a ordem original em cada bucket.
 */
export function partitionByEligibility(customers: DgnCustomer[]) {
  const eligible: DgnCustomer[] = [];
  const subscribers: Array<{ customer: DgnCustomer; eligibility: FounderEligibility }> = [];
  const other: Array<{ customer: DgnCustomer; eligibility: FounderEligibility }> = [];

  for (const customer of customers) {
    const eligibility = isFounderAcquisitionEligible(customer);
    if (eligibility.eligible) {
      eligible.push(customer);
    } else if (
      eligibility.reason === "assinante_ativo" ||
      eligibility.reason === "renovacao_pendente" ||
      eligibility.reason === "founder_confirmado" ||
      eligibility.reason === "assinatura_detectada"
    ) {
      subscribers.push({ customer, eligibility });
    } else {
      other.push({ customer, eligibility });
    }
  }

  return { eligible, subscribers, other };
}
