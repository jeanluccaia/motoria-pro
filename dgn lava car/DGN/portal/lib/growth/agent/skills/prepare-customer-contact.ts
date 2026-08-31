import { isFounderAcquisitionEligible } from "../../founder-eligibility.ts";
import type { AgentContext } from "../agent-context.ts";
import type {
  PreparationObjective,
  PreparationTone,
  PreparedMessage,
  SkillResult,
} from "../types.ts";
import {
  buildPreparedMessage,
  firstName,
  resolveCustomer,
  subscriberFacts,
} from "../preparation/context.ts";
import { renderDraftMessage } from "../preparation/templates.ts";

// Skill genérica controlada. Recebe (customerId, objective) e VALIDA se o
// objetivo faz sentido para aquele cliente antes de gerar. Exemplo canônico:
// assinante ativo + objective "founder_acquisition" → recusa e devolve motivo.

const VALID_OBJECTIVES: PreparationObjective[] = [
  "followup",
  "founder_acquisition",
  "founder_followup",
  "renewal",
  "relationship",
  "reactivation",
];

export interface PrepareCustomerContactOptions {
  tone?: PreparationTone;
}

export function prepareCustomerContact(
  ctx: AgentContext,
  customerId: string,
  objective: PreparationObjective,
  options: PrepareCustomerContactOptions = {},
): SkillResult<PreparedMessage> {
  if (!VALID_OBJECTIVES.includes(objective)) {
    return {
      status: "unavailable",
      message: `Objetivo "${objective}" não é reconhecido.`,
      facts: [],
      inferences: [],
    };
  }

  const customer = resolveCustomer(ctx, customerId);
  if (!customer) {
    return {
      status: "unavailable",
      message: `Cliente ${customerId} não encontrado.`,
      facts: [],
      inferences: [],
    };
  }

  // Regras cruzadas: objetivo × situação do cliente.
  const eligibility = isFounderAcquisitionEligible(customer);
  const subscriber = subscriberFacts(customer);

  if (objective === "founder_acquisition" && !eligibility.eligible) {
    return {
      status: "unavailable",
      message: eligibility.operatorMessage ?? "Cliente inelegível para aquisição Founder.",
      facts: [`Motivo canônico: ${eligibility.reason ?? "desconhecido"}.`],
      inferences: [
        "Aquisição Founder recusada — regra `isFounderAcquisitionEligible` bloqueou.",
      ],
    };
  }

  if (objective === "founder_followup" && customer.campaign?.founderStatus !== "confirmado") {
    return {
      status: "insufficient_data",
      message: "Cliente não é Founder confirmado. Use `prepare_founder_approach` se elegível ou `prepare_customer_contact` com outro objetivo.",
      facts: [],
      inferences: [],
    };
  }

  if (objective === "renewal") {
    if (!subscriber && customer.commercialStatus !== "Assinante Ativo") {
      return {
        status: "insufficient_data",
        message: "Cliente não é assinante reconhecido — não há base para preparar renovação.",
        facts: [],
        inferences: [],
      };
    }
    if (subscriber && subscriber.status !== "renovacao_pendente") {
      return {
        status: "insufficient_data",
        message: `Assinatura ${subscriber.plan} não sinaliza renovação pendente.`,
        facts: [`Status assinatura: ${subscriber.status}.`],
        inferences: [],
      };
    }
  }

  const tone = options.tone ?? "padrao";
  const draftMessage = renderDraftMessage({
    objective,
    tone,
    firstName: firstName(customer.name),
    vehicle: customer.vehicle,
    plan: subscriber?.plan,
  });

  const extraFacts = subscriber
    ? [`Assinatura reconhecida: ${subscriber.plan} (${subscriber.status}).`]
    : [];

  const prepared = buildPreparedMessage({
    customer,
    objective,
    tone,
    draftMessage,
    extraFacts,
  });

  return {
    status: "ok",
    data: prepared,
    facts: prepared.facts,
    inferences: [prepared.context, prepared.angle],
  };
}
