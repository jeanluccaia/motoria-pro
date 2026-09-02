import { isFounderAcquisitionEligible } from "../../founder-eligibility.ts";
import type { AgentContext } from "../agent-context.ts";
import type { PreparationTone, PreparedMessage, SkillResult } from "../types.ts";
import {
  buildPreparedMessage,
  communicationConsentBlocked,
  firstName,
  resolveCustomer,
} from "../preparation/context.ts";
import { renderDraftMessage } from "../preparation/templates.ts";

// Aquisição Founder é uma decisão sensível: só prepara se
// `isFounderAcquisitionEligible` diz sim. Se o cliente é assinante, Founder
// confirmado, renovação pendente ou descartado — a skill RECUSA com o motivo
// canônico. O LLM vê o `status: "unavailable"` + operatorMessage e comunica
// ao operador sem inventar alternativa.

export interface PrepareFounderApproachOptions {
  tone?: PreparationTone;
}

export function prepareFounderApproach(
  ctx: AgentContext,
  customerId: string,
  options: PrepareFounderApproachOptions = {},
): SkillResult<PreparedMessage> {
  const customer = resolveCustomer(ctx, customerId);
  if (!customer) {
    return {
      status: "unavailable",
      message: `Cliente ${customerId} não encontrado.`,
      facts: [],
      inferences: [],
    };
  }

  if (communicationConsentBlocked(customer)) {
    return {
      status: "unavailable",
      message: "Contato comercial bloqueado pela preferência atual do cliente.",
      facts: ["communication_consent = blocked"],
      inferences: [],
    };
  }

  const eligibility = isFounderAcquisitionEligible(customer);
  if (!eligibility.eligible) {
    return {
      status: "unavailable",
      message: eligibility.operatorMessage ?? "Cliente inelegível para aquisição Founder.",
      facts: [
        `Motivo canônico: ${eligibility.reason ?? "desconhecido"}.`,
      ],
      inferences: [
        "Aquisição Founder não preparada — regra `isFounderAcquisitionEligible` bloqueou.",
      ],
    };
  }

  const tone = options.tone ?? "padrao";
  const draftMessage = renderDraftMessage({
    objective: "founder_acquisition",
    tone,
    firstName: firstName(customer.name),
    vehicle: customer.vehicle,
  });

  const prepared = buildPreparedMessage({
    customer,
    objective: "founder_acquisition",
    tone,
    draftMessage,
  });

  return {
    status: "ok",
    data: prepared,
    facts: prepared.facts,
    inferences: [prepared.context, prepared.angle],
  };
}
