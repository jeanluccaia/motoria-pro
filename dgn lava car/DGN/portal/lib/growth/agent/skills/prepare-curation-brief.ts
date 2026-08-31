import { isFounderAcquisitionEligible } from "../../founder-eligibility.ts";
import { customerProfileHref } from "../../customer-links.ts";
import type { AgentContext } from "../agent-context.ts";
import type { PreparedCurationBrief, SkillResult } from "../types.ts";
import { relationshipFacts, resolveCustomer, subscriberFacts } from "../preparation/context.ts";

// Brief pré-atendimento: 5 seções fixas + próxima ação. Cliente inelegível
// devolve brief com `avoid` explicando o motivo — o operador ainda quer ver
// quem é, mas fica claro que não é aquisição Founder.

export function prepareCurationBrief(
  ctx: AgentContext,
  customerId: string,
): SkillResult<PreparedCurationBrief> {
  const customer = resolveCustomer(ctx, customerId);
  if (!customer) {
    return {
      status: "unavailable",
      message: `Cliente ${customerId} não encontrado.`,
      facts: [],
      inferences: [],
    };
  }

  const eligibility = isFounderAcquisitionEligible(customer);
  const subscriber = subscriberFacts(customer);
  const score = Number.isFinite(customer.scoreDgn) ? customer.scoreDgn : 0;
  const washCount = customer.washCount ?? 0;

  const who = buildWho(customer, washCount, subscriber);
  const whyHere = buildWhyHere(score, washCount, customer.commercialStatus);
  const bestArgument = buildBestArgument(score, washCount, subscriber, eligibility.eligible);
  const avoid = buildAvoid(eligibility, subscriber);
  const suggestedApproach = buildApproach(eligibility.eligible, subscriber);
  const nextStep = eligibility.eligible
    ? "Iniciar curadoria e resolver plano recomendado."
    : "Tratar como retenção — não migrar para fila de aquisição Founder.";

  const brief: PreparedCurationBrief = {
    customerId: customer.id,
    customerName: customer.name,
    who,
    whyHere,
    bestArgument,
    avoid,
    suggestedApproach,
    nextStep,
    href: customerProfileHref(customer.id),
    facts: relationshipFacts(customer),
    disclaimer: "Preparado pela IA · revisar antes de enviar",
  };

  return {
    status: "ok",
    data: brief,
    facts: brief.facts,
    inferences: [whyHere, bestArgument],
  };
}

function buildWho(
  customer: { name: string; vehicle?: string | null; recommendedPlan?: string | null },
  washCount: number,
  subscriber: ReturnType<typeof subscriberFacts>,
): string {
  const bits: string[] = [];
  if (subscriber) bits.push(`Assinante ${subscriber.plan} reconhecido`);
  if (washCount > 0) bits.push(`${washCount} atendimento(s)`);
  const vehicle = (customer.vehicle ?? "").trim();
  if (vehicle && vehicle !== "—") bits.push(`veículo ${vehicle}`);
  const plan = (customer.recommendedPlan ?? "").trim();
  if (plan && plan !== "—") bits.push(`plano sugerido ${plan}`);
  return bits.length > 0 ? `${customer.name} — ${bits.join(", ")}.` : `${customer.name}.`;
}

function buildWhyHere(score: number, washCount: number, status: string): string {
  const parts: string[] = [];
  if (score >= 70) parts.push(`score DGN ${score}`);
  else if (score >= 50) parts.push(`score DGN ${score} (faixa média)`);
  if (washCount >= 6) parts.push(`recorrência de ${washCount} atendimentos`);
  if (status) parts.push(`status atual "${status}"`);
  if (parts.length === 0) return "Sem sinal forte — revisar manualmente se a inclusão faz sentido.";
  return `Priorização baseada em ${parts.join(" + ")}.`;
}

function buildBestArgument(
  score: number,
  washCount: number,
  subscriber: ReturnType<typeof subscriberFacts>,
  eligible: boolean,
): string {
  if (!eligible) {
    if (subscriber) return `Retenção do plano ${subscriber.plan} — foco em manter continuidade, não em nova aquisição.`;
    return "Sem argumento comercial claro — investigar situação antes de contato.";
  }
  if (score >= 80) return "Perfil de alta prioridade — argumento é reconhecimento (Founder é vaga limitada, não desconto).";
  if (washCount >= 12) return "Recorrência comprovada — argumento é continuidade tranquila da rotina que ele já tem.";
  if (score >= 60) return "Sinal médio — argumento é presença consultiva, sem pressão de fechamento.";
  return "Sinal moderado — priorizar escuta antes de proposta.";
}

function buildAvoid(
  eligibility: ReturnType<typeof isFounderAcquisitionEligible>,
  subscriber: ReturnType<typeof subscriberFacts>,
): string {
  if (!eligibility.eligible) {
    if (subscriber) return `NÃO tratar como aquisição — cliente é assinante ${subscriber.plan}. Não citar convite Founder.`;
    if (eligibility.reason === "founder_confirmado") return "Founder confirmado — não repetir convite; contexto é retenção/relacionamento.";
    if (eligibility.reason === "descartado") return "Cliente descartado no pipeline — reativar via curadoria avançada antes de novo contato.";
    if (eligibility.reason === "sem_dados_minimos") return "Cadastro incompleto — completar dados antes de qualquer contato.";
  }
  return "Não inventar oferta (preço, número de lavagens, benefício) — usar somente o que a curadoria oficial permite.";
}

function buildApproach(eligible: boolean, subscriber: ReturnType<typeof subscriberFacts>): string {
  if (!eligible && subscriber) {
    return `Contato de retenção — validar satisfação com o plano ${subscriber.plan} e escutar. Sem oferta.`;
  }
  if (!eligible) {
    return "Investigar situação antes de mensagem comercial. Priorizar contato humano do gestor.";
  }
  return "Mensagem curta, consultiva, apresentar o programa Founder como reconhecimento — sem preço nem quantidade de lavagens.";
}
