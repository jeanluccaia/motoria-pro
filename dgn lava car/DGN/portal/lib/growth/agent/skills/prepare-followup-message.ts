import type { AgentContext } from "../agent-context.ts";
import type { PreparationTone, PreparedMessage, SkillResult } from "../types.ts";
import {
  buildPreparedMessage,
  firstName,
  hasActiveInvite,
  resolveCustomer,
} from "../preparation/context.ts";
import { renderDraftMessage } from "../preparation/templates.ts";

// Follow-up é ativado quando o cliente já engajou com o convite Founder e não
// avançou (viewedAt, confirmClickedAt). Sem sinal de engajamento a skill devolve
// insufficient_data — o operador é orientado a rodar `prepare_customer_contact`
// com objetivo `relationship` se quiser um contato genérico.

export interface PrepareFollowupOptions {
  tone?: PreparationTone;
}

export function prepareFollowupMessage(
  ctx: AgentContext,
  customerId: string,
  options: PrepareFollowupOptions = {},
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

  const tone = options.tone ?? "padrao";
  const eng = customer.campaign?.engagement;
  const dates = customer.campaign?.dates ?? {};
  const hasEngagement = Boolean(
    eng?.viewedAt || eng?.lastViewedAt || eng?.confirmClickedAt || eng?.vipClickedAt || dates.viewedAt,
  );

  if (!hasActiveInvite(customer) && !hasEngagement) {
    return {
      status: "insufficient_data",
      message: "Sem convite ativo nem engajamento registrado — não há contexto para follow-up. Considere prepare_customer_contact com objetivo `relationship`.",
      facts: [`Status atual: ${customer.commercialStatus}.`],
      inferences: [],
    };
  }

  const draftMessage = renderDraftMessage({
    objective: "followup",
    tone,
    firstName: firstName(customer.name),
    vehicle: customer.vehicle,
  });

  const prepared = buildPreparedMessage({
    customer,
    objective: "followup",
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
