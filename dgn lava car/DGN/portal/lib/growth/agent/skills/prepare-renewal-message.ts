import type { AgentContext } from "../agent-context.ts";
import type { PreparationTone, PreparedMessage, SkillResult } from "../types.ts";
import {
  buildPreparedMessage,
  firstName,
  resolveCustomer,
  subscriberFacts,
} from "../preparation/context.ts";
import { renderDraftMessage } from "../preparation/templates.ts";

// Renovação exige dados concretos:
//  - Reconhecido na base viva 4uCar (matchKnownSubscriber) OU
//  - commercialStatus === "Assinante Ativo"
// e o status precisa sinalizar renovação pendente. Sem esses sinais:
// insufficient_data. Nunca inventamos vencimento/preço.

export interface PrepareRenewalOptions {
  tone?: PreparationTone;
}

export function prepareRenewalMessage(
  ctx: AgentContext,
  customerId: string,
  options: PrepareRenewalOptions = {},
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

  const subscriber = subscriberFacts(customer);
  if (!subscriber && customer.commercialStatus !== "Assinante Ativo") {
    return {
      status: "insufficient_data",
      message: "Cliente não reconhecido como assinante DGN. Sem base para preparar renovação.",
      facts: [`Status atual: ${customer.commercialStatus}.`],
      inferences: [],
    };
  }

  if (subscriber && subscriber.status !== "renovacao_pendente") {
    return {
      status: "insufficient_data",
      message: `Assinatura ${subscriber.plan} está com status "${subscriber.status}" — sem sinal de renovação pendente para preparar.`,
      facts: [`Status assinatura: ${subscriber.status}.`],
      inferences: [],
    };
  }

  const tone = options.tone ?? "padrao";
  const draftMessage = renderDraftMessage({
    objective: "renewal",
    tone,
    firstName: firstName(customer.name),
    vehicle: customer.vehicle,
    plan: subscriber?.plan,
  });

  const prepared = buildPreparedMessage({
    customer,
    objective: "renewal",
    tone,
    draftMessage,
    extraFacts: subscriber ? [`Assinatura reconhecida: ${subscriber.plan} (${subscriber.status}).`] : [],
  });

  return {
    status: "ok",
    data: prepared,
    facts: prepared.facts,
    inferences: [
      prepared.context,
      prepared.angle,
      "Sem dado de vencimento no schema atual — mensagem não menciona data.",
    ],
  };
}
