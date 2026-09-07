import type { DgnCustomer } from "./dgn-growth-utils.ts";
import { isFounderAcquisitionEligible } from "./founder-eligibility.ts";
import { isConfirmedFounderCustomer } from "./founder-metrics.ts";

// -----------------------------------------------------------------------------
// getFounderReadiness — camada acima de `isFounderAcquisitionEligible`.
//
// A eligibility responde: "pode ENTRAR no processo de aquisição Founder?".
// A readiness responde: "onde no pipeline o cliente está AGORA e qual é a
// próxima ação humana concreta?".
//
// Estados (do início ao fim do funil):
//   ineligible         → assinante ativo, descartado, dados incompletos.
//   awaiting_curation  → elegível mas ainda não passou pela curadoria.
//   curated            → curadoria completa (founderStatus recomendado ou
//                        curation.founderDecision === "Sim"), aguardando decisão.
//   selected           → equipe selecionou (founderStatus "selecionado" ou
//                        founderSelected=true) mas ainda NÃO enviou convite.
//   invited            → convite ativo (personalizedPagePath) esperando resposta.
//   founder            → Founder confirmado (001/002/003).
//
// Todos os estados carregam:
//  - `label`: nome curto para badge.
//  - `description`: uma linha explicando o momento atual.
//  - `primaryCta`: rótulo do CTA principal recomendado (o link fica com quem
//    consome — sabendo o estado, sabe se linka pra Curadoria, Prepare Founder,
//    Prepare Follow-up etc.).
// -----------------------------------------------------------------------------

export type FounderReadinessState =
  | "ineligible"
  | "awaiting_curation"
  | "curated"
  | "selected"
  | "invited"
  | "founder";

export interface FounderReadiness {
  state: FounderReadinessState;
  label: string;
  description: string;
  /** CTA sugerido para o estado atual. Consumidor escolhe o destino apropriado. */
  primaryCta: string;
  /** Motivo canônico da eligibility subjacente (útil para explicar bloqueios). */
  eligibilityReason: string | null;
}

function readinessLabel(state: FounderReadinessState): string {
  switch (state) {
    case "founder": return "Founder confirmado";
    case "invited": return "Convite ativo";
    case "selected": return "Selecionado";
    case "curated": return "Curado";
    case "awaiting_curation": return "Potencial Founder";
    case "ineligible": return "Não elegível";
  }
}

function readinessDescription(state: FounderReadinessState): string {
  switch (state) {
    case "founder":
      return "Founder confirmado da campanha 2026 — foco em relacionamento e retenção.";
    case "invited":
      return "Convite Founder ativo — aguardando resposta.";
    case "selected":
      return "Selecionado pela equipe, convite ainda não enviado.";
    case "curated":
      return "Curadoria concluída — aguardando seleção do time.";
    case "awaiting_curation":
      return "Perfil elegível para aquisição Founder — abrir na Curadoria antes de qualquer contato.";
    case "ineligible":
      return "Cliente fora da fila de aquisição Founder segundo a regra canônica.";
  }
}

function readinessCta(state: FounderReadinessState): string {
  switch (state) {
    case "founder": return "Preparar follow-up Founder";
    case "invited": return "Preparar follow-up Founder";
    case "selected": return "Preparar convite Founder";
    case "curated": return "Preparar convite Founder";
    case "awaiting_curation": return "Abrir Curadoria";
    case "ineligible": return "Ver perfil";
  }
}

function isSelectedByStatus(customer: DgnCustomer): boolean {
  if (customer.campaign?.founderStatus === "selecionado") return true;
  // Fallback: campanha marcou o cliente como selected sem alterar founderStatus.
  if (customer.campaign?.founderSelected === true && !isConfirmedFounderCustomer(customer)) {
    return true;
  }
  return false;
}

function isCuratedByDecision(customer: DgnCustomer): boolean {
  if (customer.campaign?.founderStatus === "recomendado") return true;
  if (customer.curation?.founderDecision === "Sim") return true;
  return false;
}

function hasActiveInvite(customer: DgnCustomer): boolean {
  return Boolean(customer.campaign?.personalizedPagePath);
}

export function getFounderReadiness(customer: DgnCustomer): FounderReadiness {
  const eligibility = isFounderAcquisitionEligible(customer);

  // 1. Founder confirmado sobrescreve tudo — mesmo se eligibility.reason for
  //    "founder_confirmado" e retorne ineligible.
  if (isConfirmedFounderCustomer(customer) || eligibility.reason === "founder_confirmado") {
    return {
      state: "founder",
      label: readinessLabel("founder"),
      description: readinessDescription("founder"),
      primaryCta: readinessCta("founder"),
      eligibilityReason: eligibility.reason ?? null,
    };
  }

  // 2. Cliente com convite ativo mas não confirmado → convite pendente.
  if (hasActiveInvite(customer) && !isConfirmedFounderCustomer(customer)) {
    return {
      state: "invited",
      label: readinessLabel("invited"),
      description: readinessDescription("invited"),
      primaryCta: readinessCta("invited"),
      eligibilityReason: eligibility.reason ?? null,
    };
  }

  // 3. Elegibilidade bloqueia — mostra o motivo canônico.
  if (!eligibility.eligible) {
    return {
      state: "ineligible",
      label: readinessLabel("ineligible"),
      description: readinessDescription("ineligible"),
      primaryCta: readinessCta("ineligible"),
      eligibilityReason: eligibility.reason ?? null,
    };
  }

  // 4. Selecionado pela equipe (mas ainda sem convite).
  if (isSelectedByStatus(customer)) {
    return {
      state: "selected",
      label: readinessLabel("selected"),
      description: readinessDescription("selected"),
      primaryCta: readinessCta("selected"),
      eligibilityReason: eligibility.reason ?? null,
    };
  }

  // 5. Curadoria concluída, aguardando decisão do time.
  if (isCuratedByDecision(customer)) {
    return {
      state: "curated",
      label: readinessLabel("curated"),
      description: readinessDescription("curated"),
      primaryCta: readinessCta("curated"),
      eligibilityReason: eligibility.reason ?? null,
    };
  }

  // 6. Aguardando curadoria — elegível mas pipeline ainda nao_avaliado.
  return {
    state: "awaiting_curation",
    label: readinessLabel("awaiting_curation"),
    description: readinessDescription("awaiting_curation"),
    primaryCta: readinessCta("awaiting_curation"),
    eligibilityReason: eligibility.reason ?? null,
  };
}
