import { isFounderAcquisitionEligible } from "../../founder-eligibility.ts";
import type { DgnCustomer } from "../../dgn-growth-data.ts";
import type { AgentContext } from "../agent-context.ts";
import type { NextActionSuggestion, SkillResult } from "../types.ts";

// Sugere a próxima ação baseando-se somente em fatos presentes no snapshot.
// Regras determinísticas — nunca "provavelmente vai comprar". Se não houver
// sinal claro, devolve `insufficient_data` em vez de inventar.

function parseTs(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const ts = Date.parse(raw);
  return Number.isFinite(ts) ? ts : null;
}

function pickAction(customer: DgnCustomer, loadedAt: number): { headline: string; rationale: string } | null {
  const eng = customer.campaign?.engagement;
  const dates = customer.campaign?.dates ?? {};
  const hasActiveInvite = Boolean(customer.campaign?.personalizedPagePath);
  const confirmClickedAt = parseTs(eng?.confirmClickedAt);
  const viewedAt = parseTs(eng?.viewedAt ?? dates.viewedAt);
  const respondedAt = parseTs(dates.respondedAt);
  const paymentSentAt = parseTs(dates.paymentSentAt);

  if (hasActiveInvite && confirmClickedAt && !respondedAt && !paymentSentAt) {
    return {
      headline: "Chamar direto no WhatsApp",
      rationale: "Cliente clicou em confirmar via WhatsApp e ainda não iniciou conversa.",
    };
  }
  if (hasActiveInvite && viewedAt && !respondedAt && !paymentSentAt) {
    const hours = (loadedAt - viewedAt) / (60 * 60 * 1000);
    if (hours >= 24) {
      return {
        headline: "Follow-up pessoal",
        rationale: "Convite visualizado há mais de 24h sem retorno.",
      };
    }
    return {
      headline: "Aguardar retorno espontâneo",
      rationale: "Convite visualizado dentro das últimas 24h — ainda dentro da janela natural.",
    };
  }
  if (hasActiveInvite && !viewedAt) {
    return {
      headline: "Reforçar envio do convite",
      rationale: "Convite gerado mas ainda não visualizado — checar canal e preview.",
    };
  }

  const eligibility = isFounderAcquisitionEligible(customer);
  if (eligibility.eligible && customer.commercialStatus === "Aguardando Curadoria DGN") {
    return {
      headline: "Iniciar curadoria",
      rationale: `Cliente elegível com plano sugerido ${customer.recommendedPlan}.`,
    };
  }
  if (!eligibility.eligible && eligibility.operatorMessage) {
    return {
      headline: "Não elegível para aquisição Founder",
      rationale: eligibility.operatorMessage,
    };
  }
  return null;
}

export function suggestNextAction(ctx: AgentContext, customerId: string): SkillResult<NextActionSuggestion> {
  const customer = ctx.customers.find((c) => c.id === customerId);
  if (!customer) {
    return {
      status: "unavailable",
      message: `Cliente ${customerId} não encontrado.`,
      facts: [],
      inferences: [],
    };
  }

  const pick = pickAction(customer, ctx.loadedAt);
  if (!pick) {
    return {
      status: "insufficient_data",
      message: "Não há sinais suficientes para sugerir a próxima ação com segurança.",
      facts: [`Status atual: ${customer.commercialStatus}.`],
      inferences: [],
    };
  }

  return {
    status: "ok",
    data: {
      customerId: customer.id,
      headline: pick.headline,
      rationale: pick.rationale,
      href: customer.campaign?.personalizedPagePath
        ? `/admin/growth/founders-2026?customer=${encodeURIComponent(customer.id)}`
        : `/admin/growth/curadoria?customer=${encodeURIComponent(customer.id)}`,
    },
    facts: [`Status atual: ${customer.commercialStatus}.`],
    inferences: [pick.rationale],
  };
}
