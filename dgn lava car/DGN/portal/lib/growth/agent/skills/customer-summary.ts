import { isFounderAcquisitionEligible } from "../../founder-eligibility.ts";
import { matchKnownSubscriber } from "../../founder-eligibility-server.ts";
import type { DgnCustomer } from "../../dgn-growth-data.ts";
import type { AgentContext } from "../agent-context.ts";
import type { CustomerSummary, SkillResult } from "../types.ts";
import { customerProfileHref } from "../../customer-links.ts";
import { formatDatePtBr } from "../../date-format.ts";
import { buildDisplayIdentityRows, formatScoreDgn } from "../pii-display.ts";

// Visão 360 de um cliente único. Só lê o que já existe no `DgnCustomer` +
// resultado de elegibilidade + match contra base de assinantes. Nunca junta
// clientes; nunca inventa campo ausente (usa "—" quando dado não está no
// snapshot).

function fallback(value: string | undefined | null): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || "—";
}

function tierFor(score: number): string {
  if (score >= 80) return "Prioridade máxima";
  if (score >= 60) return "Forte candidato";
  if (score >= 40) return "Precisa curadoria";
  return "Baixa prioridade";
}

function stageLabel(customer: DgnCustomer): string {
  const stage = customer.campaign?.commercialStage;
  if (stage) return stage.replace(/_/g, " ");
  return customer.commercialStatus || "—";
}

function lastEngagementFor(customer: DgnCustomer): string | null {
  const eng = customer.campaign?.engagement;
  const candidates = [eng?.lastViewedAt, eng?.viewedAt, eng?.confirmClickedAt, eng?.vipClickedAt]
    .filter((v): v is string => Boolean(v));
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (Date.parse(a) > Date.parse(b) ? a : b));
}

export function getCustomerSummary(ctx: AgentContext, customerId: string): SkillResult<CustomerSummary> {
  const customer = ctx.customers.find((c) => c.id === customerId);
  if (!customer) {
    return {
      status: "unavailable",
      message: `Cliente ${customerId} não encontrado na base atual.`,
      facts: [],
      inferences: [],
    };
  }

  const eligibility = isFounderAcquisitionEligible(customer);
  const subscriberMatch = matchKnownSubscriber(customer);
  const hasActiveInvite = Boolean(customer.campaign?.personalizedPagePath);
  const score = Number.isFinite(customer.scoreDgn) ? customer.scoreDgn : 0;

  // Helper canônico: telefone/placa mascarados (mesma política da UI de admin).
  // Datas em pt-BR (dd/mm/yyyy). NUNCA envia PII completa ao LLM.
  const identity = buildDisplayIdentityRows(customer);

  const commercial = [
    { label: "Status comercial", value: fallback(customer.commercialStatus) },
    { label: "Estágio na campanha", value: stageLabel(customer) },
    { label: "Plano recomendado", value: fallback(customer.recommendedPlan) },
    {
      label: "Elegível para aquisição Founder",
      value: eligibility.eligible
        ? "Sim"
        : `Não — ${eligibility.operatorMessage ?? eligibility.reason ?? "regra não elegível"}`,
    },
    { label: "Convite ativo", value: hasActiveInvite ? "Sim" : "Não" },
  ];

  const summary: CustomerSummary = {
    customerId: customer.id,
    name: customer.name,
    identity,
    commercial,
    score: score > 0 ? { total: score, tier: tierFor(score) } : undefined,
    founder: hasActiveInvite
      ? {
          stage: stageLabel(customer),
          hasActiveInvite: true,
          lastEngagement: lastEngagementFor(customer),
        }
      : undefined,
    subscriber: subscriberMatch
      ? {
          plan: subscriberMatch.record.plan,
          status: subscriberMatch.record.status,
        }
      : undefined,
    primaryHref: customerProfileHref(customer.id),
  };

  const facts = [
    `${customer.washCount ?? 0} atendimento(s) registrado(s).`,
    `Último atendimento: ${formatDatePtBr(customer.lastAttendance)}.`,
    `Status atual: ${fallback(customer.commercialStatus)}.`,
  ];
  const inferences: string[] = [];
  if (score > 0) inferences.push(`Score ${formatScoreDgn(score)} → tier "${tierFor(score)}".`);
  if (!eligibility.eligible && eligibility.operatorMessage) {
    inferences.push(eligibility.operatorMessage);
  }
  if (subscriberMatch) {
    inferences.push(`Reconhecido na base viva 4uCar como assinante ${subscriberMatch.record.plan}.`);
  }

  return { status: "ok", data: summary, facts, inferences };
}

/**
 * Busca fuzzy simples por nome — usada pelo chat para "resuma o Fulano".
 * Case/accent-insensitive; devolve o primeiro que contém o termo.
 */
export function findCustomerByFuzzyName(ctx: AgentContext, term: string): DgnCustomer | null {
  const normalize = (v: string) =>
    v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const needle = normalize(term);
  if (needle.length < 2) return null;
  return ctx.customers.find((c) => normalize(c.name).includes(needle)) ?? null;
}
