import { isFounderAcquisitionEligible, matchKnownSubscriber } from "../../founder-eligibility.ts";
import { customerProfileHref } from "../../customer-links.ts";
import type { DgnCustomer } from "../../dgn-growth-data.ts";
import type { AgentContext } from "../agent-context.ts";
import type {
  PreparationObjective,
  PreparationTone,
  PreparedMessage,
} from "../types.ts";

// Helpers puros usados por TODAS as skills prepare_*. Sem I/O, sem Supabase,
// sem HTTP — só lê `ctx.customers` e cruza com elegibilidade canônica.

export function firstName(fullName: string): string {
  const cleaned = fullName.trim().split(/\s+/)[0] ?? "";
  if (!cleaned) return "";
  // Capitaliza apenas a primeira letra; preserva acentos.
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

export function resolveCustomer(ctx: AgentContext, customerId: string): DgnCustomer | null {
  return ctx.customers.find((c) => c.id === customerId) ?? null;
}

export function hasActiveInvite(customer: DgnCustomer): boolean {
  return Boolean(customer.campaign?.personalizedPagePath);
}

/** Descrição enxuta do relacionamento do cliente com a marca — só fatos. */
export function relationshipFacts(customer: DgnCustomer): string[] {
  const facts: string[] = [];
  if (customer.washCount && customer.washCount > 0) {
    facts.push(`${customer.washCount} atendimento(s) registrado(s).`);
  }
  if (customer.customerSince) facts.push(`Cliente desde ${customer.customerSince}.`);
  if (customer.lastAttendance) facts.push(`Último atendimento em ${customer.lastAttendance}.`);
  const stage = customer.campaign?.commercialStage;
  if (stage) facts.push(`Estágio na campanha: ${stage.replace(/_/g, " ")}.`);
  const status = customer.commercialStatus;
  if (status) facts.push(`Status comercial: ${status}.`);
  return facts;
}

/**
 * Consentimento de comunicação — respeitado por TODAS as skills prepare_*.
 * Se o Supabase tem `communication_consent = 'blocked'`, nenhuma mensagem
 * comercial é preparada. Como o snapshot atual do Growth admin ainda usa
 * JSON legado sem esse campo, tratamos ausência como `unknown` (permissivo).
 */
export function communicationConsentBlocked(customer: DgnCustomer): boolean {
  const consent = (customer as unknown as { communication_consent?: string })
    .communication_consent;
  return consent === "blocked";
}

/** Assinatura ativa reconhecida — para prepare_renewal e para bloquear founder. */
export function subscriberFacts(customer: DgnCustomer) {
  const match = matchKnownSubscriber(customer);
  if (!match) return null;
  return {
    plan: match.record.plan,
    status: match.record.status,
    note: match.record.note ?? null,
  };
}

/** Assinatura de contexto para "por que estamos falando com esse cliente". */
export function inferContext(
  customer: DgnCustomer,
  objective: PreparationObjective,
): string {
  switch (objective) {
    case "followup": {
      const eng = customer.campaign?.engagement;
      if (eng?.confirmClickedAt) return "Cliente clicou em confirmar via WhatsApp e não iniciou a conversa.";
      if (eng?.viewedAt || eng?.lastViewedAt) return "Cliente visualizou o convite Founder e ainda não respondeu.";
      if (customer.campaign?.dates?.inviteCreatedAt) return "Convite Founder gerado — sem resposta até agora.";
      return "Follow-up de contato pendente.";
    }
    case "founder_acquisition":
      return "Cliente elegível para aquisição Founder da DGN Club.";
    case "founder_followup":
      return "Follow-up com Founder confirmado.";
    case "renewal":
      return "Assinante com renovação pendente na base 4uCar.";
    case "reactivation":
      return "Cliente sem atendimento recente — retomar relacionamento.";
    case "relationship":
      return "Manter relacionamento com cliente ativo.";
  }
}

/** Ângulo comercial curto — só palavras neutras, nunca preço/desconto/oferta. */
export function inferAngle(
  customer: DgnCustomer,
  objective: PreparationObjective,
): string {
  const facts: string[] = [];
  if (customer.washCount && customer.washCount >= 6) facts.push("recorrência mensal comprovada");
  const score = Number.isFinite(customer.scoreDgn) ? customer.scoreDgn : 0;
  if (score >= 70) facts.push(`score DGN ${score}`);
  if (objective === "founder_acquisition") {
    return facts.length > 0
      ? `Perfil compatível com o programa Founder — ${facts.join(" e ")}.`
      : "Perfil compatível com o programa Founder segundo os sinais disponíveis.";
  }
  if (objective === "renewal") {
    return "Manter continuidade da assinatura antes da renovação vencer.";
  }
  if (objective === "followup") {
    return "Reforçar interesse já demonstrado sem pressão comercial.";
  }
  if (objective === "reactivation") {
    return "Retomar relacionamento; entender se algo mudou na rotina.";
  }
  if (objective === "founder_followup") {
    return "Manter presença — Founder ativo merece atenção pessoal.";
  }
  return "Relacionamento consultivo sem apelo comercial imediato.";
}

/** Nunca inventa objeção — só devolve quando há sinal concreto no dado. */
export function inferObjection(
  customer: DgnCustomer,
  objective: PreparationObjective,
): string | undefined {
  if (objective !== "founder_acquisition") return undefined;
  const eligibility = isFounderAcquisitionEligible(customer);
  if (!eligibility.eligible && eligibility.operatorMessage) {
    return eligibility.operatorMessage;
  }
  return undefined;
}

/** Próximo passo depois do envio — depende do objetivo, não do resultado. */
export function inferNextStep(objective: PreparationObjective): string {
  switch (objective) {
    case "founder_acquisition":
      return "Aguardar retorno; se responder, iniciar curadoria e gerar convite Founder.";
    case "followup":
      return "Se responder, retomar conversa; se não responder em 48h, encerrar tentativa.";
    case "founder_followup":
      return "Registrar retorno espontâneo; agendar próximo contato se houver contexto.";
    case "renewal":
      return "Confirmar interesse antes de qualquer alteração de assinatura.";
    case "reactivation":
      return "Se responder, propor agenda; se não, encerrar tentativa.";
    case "relationship":
      return "Sem próxima ação obrigatória — manter registro de contato.";
  }
}

export function toneLabel(tone: PreparationTone): string {
  switch (tone) {
    case "padrao": return "padrão";
    case "mais_curta": return "mais curta";
    case "mais_direta": return "mais direta";
    case "mais_consultiva": return "mais consultiva";
    case "mais_pessoal": return "mais pessoal";
    case "menos_comercial": return "menos comercial";
  }
}

export function buildPreparedMessage(params: {
  customer: DgnCustomer;
  objective: PreparationObjective;
  tone: PreparationTone;
  draftMessage: string;
  extraFacts?: string[];
}): PreparedMessage {
  const { customer, objective, tone, draftMessage, extraFacts = [] } = params;
  return {
    customerId: customer.id,
    customerName: customer.name,
    objective,
    channel: "whatsapp",
    context: inferContext(customer, objective),
    angle: inferAngle(customer, objective),
    objection: inferObjection(customer, objective),
    draftMessage,
    nextStep: inferNextStep(objective),
    tone,
    href: customerProfileHref(customer.id),
    facts: [...relationshipFacts(customer), ...extraFacts],
    disclaimer: "Preparado pela IA · revisar antes de enviar",
  };
}
