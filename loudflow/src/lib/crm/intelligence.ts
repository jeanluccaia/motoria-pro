// Prioridade operacional dos leads de franquia.
//
// Modelo: cada lead é classificado em um ÚNICO tier operacional. O tier
// decide a seção da UI em que o lead aparece ("Responder agora", "Ligar
// hoje", etc.) e o seu peso na fila ativa. Dentro do mesmo tier, usamos
// próximo contato vencido → prioridade manual → interação recente → score
// → data de recebimento para ordenar.
//
// Classificação sempre tenta, nessa ordem:
//
//   1. Campos estruturados (pipeline_stage, priority, next_contact_at,
//      activity_type em `activities`, phone_normalized, received_at).
//   2. Dados explícitos das atividades (ex.: contato posterior à reunião).
//   3. Regex em texto livre (last_conversation_status, notes) SOMENTE como
//      fallback temporário para os ~20 leads importados sem campos
//      estruturados. Marcado com TODO para migrar para colunas tipadas.
//
// Fuso: toda noção de "hoje", "amanhã" e "atrasado" usa America/Sao_Paulo.
// Centralizado em [[dates.ts]] via APP_TZ.

import { APP_TZ } from "@/lib/tasks/dates";
import type {
  FranchiseLead,
  FranchiseLeadActivity,
} from "@/lib/supabase/types";

// ------------------------------------------------------------------
// Tipos públicos
// ------------------------------------------------------------------

// Tier operacional — é o campo que a UI deve usar para montar as seções
// e os indicadores. O número ao lado é o rank (menor = mais urgente).
//
//   1. respond_now   — novo lead < 72h, reunião vencida sem resultado,
//                      qualificado sem próximo passo.
//   2. call_today    — compromisso para hoje, próximo contato vencido ou
//                      marcado para hoje.
//   3. follow_up     — compromisso para amanhã, lead ativo ainda dentro
//                      da janela natural.
//   4. verify_phone  — lead ativo cujo telefone precisa ser conferido
//                      antes de qualquer tentativa de WhatsApp.
//   5. reactivate    — sem retorno após primeira tentativa, novo lead
//                      com mais de 72h sem resposta, no_response.
//   6. awaiting      — reunião ou retorno combinado para data futura.
//   7. deprioritize  — fornecedor, parceria, oferta comercial — não é
//                      candidato a franquia, mas ainda não foi marcado
//                      como lost.
//   8. terminal      — won / lost / disqualified.
export type OperationalTier =
  | "respond_now"
  | "call_today"
  | "follow_up"
  | "verify_phone"
  | "reactivate"
  | "awaiting"
  | "deprioritize"
  | "terminal";

export const OPERATIONAL_TIER_RANK: Record<OperationalTier, number> = {
  respond_now: 1,
  call_today: 2,
  follow_up: 3,
  verify_phone: 4,
  reactivate: 5,
  awaiting: 6,
  deprioritize: 7,
  terminal: 8,
};

// Label base em pt-BR, linguagem comercial. Para `awaiting`, a UI deve
// concatenar com a data concreta: "Aguardando até 19/10".
export const OPERATIONAL_TIER_LABELS: Record<OperationalTier, string> = {
  respond_now: "Responder agora",
  call_today: "Ligar hoje",
  follow_up: "Acompanhar",
  verify_phone: "Conferir telefone",
  reactivate: "Reativar",
  awaiting: "Aguardando",
  deprioritize: "Não priorizar",
  terminal: "Histórico",
};

// AttentionLevel permanece como "estilo visual" — mapeia para a classe
// de badge atual. Não é usado para texto; o texto vem de tierLabel.
export type AttentionLevel = "critical" | "today" | "soon" | "monitor" | "none";
export type Temperature = "hot" | "warm" | "cold" | "inactive";

export type SuggestedAction =
  | "record_meeting_outcome"
  | "call_now"
  | "confirm_meeting"
  | "schedule_meeting"
  | "whatsapp_reconnect"
  | "send_followup"
  | "resend_other_time"
  | "confirm_visit"
  | "validate_phone"
  | "wait_until_scheduled"
  | "answer_new_lead"
  | "forward_to_expansion"
  | "history_only";

export type LeadIntelligence = {
  score: number;
  temperature: Temperature;
  operationalTier: OperationalTier;
  tierLabel: string;
  attentionLevel: AttentionLevel;
  reasons: string[];
  suggestedAction: SuggestedAction;
  suggestedActionLabel: string;
  dueLabel: string | null;
  excludeFromActiveQueue: boolean;
};

// ------------------------------------------------------------------
// Pesos — centralizados e fáceis de ajustar sem caçar na codebase.
// ------------------------------------------------------------------

export const WEIGHTS = {
  // Sinais positivos
  meetingScheduled: 25,
  meetingPastWithoutOutcome: 30,
  qualified: 20,
  startTimelineUpTo3Months: 20,
  investmentFrom700k: 20,
  manualHigh: 15,
  inConversation: 10,
  recentContact: 10,
  nextContactToday: 20,
  nextContactOverdue: 25,
  newLeadFresh: 25,

  // Reduções
  stillStructuringCapital: -10,
  noResponseOver7d: -10,
  noResponseOver14d: -20,
  phoneIncomplete: -20,
  noContactInfo: -30,
} as const;

export const SUGGESTED_ACTION_LABELS: Record<SuggestedAction, string> = {
  record_meeting_outcome: "Registrar o resultado da reunião",
  call_now: "Ligar agora",
  confirm_meeting: "Confirmar a reunião",
  schedule_meeting: "Agendar uma reunião",
  whatsapp_reconnect: "Retomar o contato pelo WhatsApp",
  send_followup: "Enviar follow-up curto",
  resend_other_time: "Reenviar em outro horário",
  confirm_visit: "Confirmar a visita com a sócia",
  validate_phone: "Conferir o telefone",
  wait_until_scheduled: "Aguardar até a data combinada",
  answer_new_lead: "Responder o novo lead",
  forward_to_expansion: "Encaminhar ao responsável por expansão",
  history_only: "Manter somente no histórico",
};

export const ATTENTION_LEVEL_LABELS: Record<AttentionLevel, string> = {
  critical: "Responder agora",
  today: "Hoje",
  soon: "Em breve",
  monitor: "Monitorar",
  none: "Sem alerta",
};

// ------------------------------------------------------------------
// Datas em America/Sao_Paulo
// ------------------------------------------------------------------

const dateOnlyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dayMonthFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TZ,
  day: "2-digit",
  month: "2-digit",
});

function ymdInBrt(d: Date): string {
  return dateOnlyFmt.format(d);
}

function diffDaysInBrt(aIso: string | null, nowYmd: string): number | null {
  if (!aIso) return null;
  const target = ymdInBrt(new Date(aIso));
  const [ty, tm, td] = target.split("-").map((n) => Number(n));
  const [ny, nm, nd] = nowYmd.split("-").map((n) => Number(n));
  const tMs = Date.UTC(ty, tm - 1, td);
  const nMs = Date.UTC(ny, nm - 1, nd);
  // Positivo = hoje é depois do alvo (alvo no passado).
  return Math.round((nMs - tMs) / 86_400_000);
}

function daysSinceInBrt(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const nowYmd = ymdInBrt(now);
  return diffDaysInBrt(iso, nowYmd);
}

function hoursBetween(aIso: string | null, now: Date): number | null {
  if (!aIso) return null;
  const a = new Date(aIso).getTime();
  if (Number.isNaN(a)) return null;
  return (now.getTime() - a) / 3_600_000;
}

// ------------------------------------------------------------------
// Helpers de classificação
// ------------------------------------------------------------------

// TODO: substituir por um booleano estruturado (ex.: lead_kind =
// 'customer' | 'partner' | 'vendor'). Hoje usamos regex em
// last_conversation_status/notes para resgatar os ~20 leads importados
// sem a coluna. Esta função deve ser aposentada quando a coluna existir.
const RE_NON_CUSTOMER = /capta[cç][aã]o de pontos|camisetas|m[eé]dicar|atendimento m[eé]dico|m[aá]quinas de bebidas|propor parceria|parceria com m[aá]quinas|fornecedor|benef[ií]cios? comerciais?|oferecer camisetas|área protegida/i;

const RE_STRUCTURING = /estruturando (o |)capital/i;
const RE_INVESTMENT_700K_PLUS =
  /r\$?\s*7(00|50)\s*mil|r\$?\s*8\d{2}\s*mil|r\$?\s*9\d{2}\s*mil|r\$?\s*[1-9](\.|,)?\s*m[ií]/i;
const RE_START_UPTO_3M = /at[eé]\s*3\s*m[eê]s/i;
const RE_NOT_VISUALIZED = /n[aã]o visualizou/i;
const RE_SAW_NO_REPLY = /visualizou e n[aã]o respondeu/i;
const RE_VISIT = /visita/i;
const RE_CHILD_INTEREST = /interesse do filho|filho na franquia|encaminhar(ia|á)? a apresenta/i;
// Sinais de "retorno frio": lead que recebeu a nossa mensagem e não voltou,
// ou que encerrou a conversa com um "ok obrigada" / "não respondeu".
// Nessas condições, um next_contact_at vencido é só um lembrete — não há
// compromisso real para cobrar e a ação certa é reativação.
const RE_COLD_RESPONSE =
  /n[aã]o visualizou|visualizou e n[aã]o respondeu|n[aã]o respondeu|ok,?\s*obrigad[ao]|sem retorno/i;
// Sinais fortes de que ainda existe um fio comercial vivo. Se qualquer um
// desses aparecer, não rebaixamos o lead para reactivate mesmo que o
// status também contenha algum sinal frio.
const RE_HOT_SIGNAL =
  /reuni[aã]o|visita|sociedade|franqueado|franqueada|c[oô]f|aguardando (visita|conversa|retorno|resposta)|ficou de (marcar|retornar|conversar)/i;
// "Reunião realizada" + lead ainda qualificado = fechar a decisão. Isso é
// mais quente que um qualificado tentando agendar a visita. Fallback por
// texto livre; TODO migrar para `last_meeting_outcome` tipado.
const RE_MEETING_HELD =
  /reuni[aã]o realizada|reuni[aã]o aconteceu|p[oó]s[-\s]reuni[aã]o|na reuni[aã]o com|ap[oó]s a reuni[aã]o/i;

function hasValidPhone(lead: FranchiseLead): boolean {
  return Boolean(lead.phone_normalized);
}

function hasPhoneIncomplete(lead: FranchiseLead): boolean {
  return Boolean(lead.phone) && !lead.phone_normalized;
}

function hasAnyContactInfo(lead: FranchiseLead): boolean {
  return Boolean(lead.phone_normalized) || Boolean(lead.email);
}

function isTerminalStage(
  lead: FranchiseLead,
): "won" | "lost" | "disqualified" | null {
  if (lead.pipeline_stage === "won") return "won";
  if (lead.pipeline_stage === "lost") return "lost";
  if (lead.pipeline_stage === "disqualified") return "disqualified";
  return null;
}

function hasContactAttemptEver(activities: FranchiseLeadActivity[]): boolean {
  return activities.some((a) => a.activity_type === "contact");
}

function hasMeetingOutcomeAfter(
  activities: FranchiseLeadActivity[],
  meetingAtIso: string,
): boolean {
  const meetingMs = new Date(meetingAtIso).getTime();
  return activities.some(
    (a) =>
      (a.activity_type === "contact" || a.activity_type === "stage_change") &&
      new Date(a.occurred_at).getTime() >= meetingMs,
  );
}

function investmentIndicatesSevenHundredPlus(lead: FranchiseLead): boolean {
  if (!lead.investment_range) return false;
  if (RE_STRUCTURING.test(lead.investment_range)) return false;
  return RE_INVESTMENT_700K_PLUS.test(lead.investment_range);
}

function startTimelineUpTo3Months(lead: FranchiseLead): boolean {
  if (!lead.start_timeline) return false;
  return RE_START_UPTO_3M.test(lead.start_timeline);
}

function isStillStructuringCapital(lead: FranchiseLead): boolean {
  return Boolean(
    lead.investment_range && RE_STRUCTURING.test(lead.investment_range),
  );
}

function looksLikeNonCustomer(lead: FranchiseLead): boolean {
  const haystack = [
    lead.last_conversation_status ?? "",
    lead.notes ?? "",
    lead.lost_reason ?? "",
  ].join(" | ");
  return RE_NON_CUSTOMER.test(haystack);
}

function receivedReferenceIso(lead: FranchiseLead): string {
  return lead.received_at ?? lead.created_at;
}

// ------------------------------------------------------------------
// Classificação do tier operacional
// ------------------------------------------------------------------

type TierContext = {
  tier: OperationalTier;
  reasons: string[];
  suggestedAction: SuggestedAction;
  dueLabel: string | null;
  // Metadados usados por score/attentionLevel/sort.
  overdueDays: number; // 0 se não atrasado; positivo = dias de atraso
  isMeetingToday: boolean;
  isMeetingFuture: boolean;
  isMeetingPastWithoutOutcome: boolean;
  isNextContactToday: boolean;
  isNextContactTomorrow: boolean;
  isNewLeadFresh: boolean;
  isNewLeadOverdueSla: boolean;
  isQualifiedWithoutMeeting: boolean;
  hoursSinceReceived: number | null;
  nextContactIso: string | null;
};

function classifyTier(
  lead: FranchiseLead,
  activities: FranchiseLeadActivity[],
  now: Date,
  nowYmd: string,
): TierContext {
  const reasons: string[] = [];
  const ctx: TierContext = {
    tier: "follow_up",
    reasons,
    suggestedAction: "whatsapp_reconnect",
    dueLabel: null,
    overdueDays: 0,
    isMeetingToday: false,
    isMeetingFuture: false,
    isMeetingPastWithoutOutcome: false,
    isNextContactToday: false,
    isNextContactTomorrow: false,
    isNewLeadFresh: false,
    isNewLeadOverdueSla: false,
    isQualifiedWithoutMeeting: false,
    hoursSinceReceived: null,
    nextContactIso: lead.next_contact_at,
  };

  // ----- 1) Terminal real.
  const terminal = isTerminalStage(lead);
  if (terminal) {
    ctx.tier = "terminal";
    ctx.suggestedAction = "history_only";
    reasons.push(terminalReason(terminal));
    return ctx;
  }

  // ----- 2) Lead claramente fora do público (parceria/fornecedor) sem
  // ter sido marcado como lost. Isso NUNCA deve subir para a fila ativa.
  // Fallback por texto livre; TODO migrar para coluna tipada.
  if (looksLikeNonCustomer(lead)) {
    ctx.tier = "deprioritize";
    ctx.suggestedAction = "forward_to_expansion";
    reasons.push(
      "Contato parece ser parceria/fornecedor — não é candidato à franquia",
    );
    return ctx;
  }

  // ----- 3) Novo lead sem nenhuma tentativa de contato.
  // Prioridade estritamente por SLA, independente de dados de qualificação.
  const nenhumContato =
    !hasContactAttemptEver(activities) && !lead.last_contact_at;
  if (lead.pipeline_stage === "new" && nenhumContato) {
    const hours = hoursBetween(receivedReferenceIso(lead), now);
    ctx.hoursSinceReceived = hours;
    if (hours == null || hours <= 24) {
      ctx.tier = "respond_now";
      ctx.isNewLeadFresh = true;
      ctx.suggestedAction = "answer_new_lead";
      reasons.push("Novo lead — responder agora");
      return ctx;
    }
    if (hours <= 72) {
      ctx.tier = "respond_now";
      ctx.isNewLeadOverdueSla = true;
      ctx.suggestedAction = "answer_new_lead";
      reasons.push(
        `Novo lead atrasado — recebido há ${Math.round(hours)} horas sem resposta`,
      );
      return ctx;
    }
    // Depois de 72h sem resposta, cai no caminho de reativação.
    ctx.tier = "reactivate";
    ctx.suggestedAction = hasValidPhone(lead)
      ? "whatsapp_reconnect"
      : "validate_phone";
    reasons.push("Novo lead sem resposta há mais de 72 horas — tentar reativar");
    return ctx;
  }

  // ----- 4) Reunião agendada: distinguir passada, hoje e futura.
  if (lead.pipeline_stage === "meeting_scheduled") {
    const meetingAtIso = lead.next_contact_at;
    if (!meetingAtIso) {
      // Reunião marcada sem data — ação é confirmar o horário HOJE.
      ctx.tier = "call_today";
      ctx.suggestedAction = "confirm_meeting";
      reasons.push("Reunião marcada sem data — confirmar o horário");
      return ctx;
    }
    const diffDays = diffDaysInBrt(meetingAtIso, nowYmd);
    const meetingMs = new Date(meetingAtIso).getTime();
    const nowMs = now.getTime();
    const outcome = hasMeetingOutcomeAfter(activities, meetingAtIso);

    if (diffDays != null && diffDays > 0 && !outcome) {
      ctx.tier = "respond_now";
      ctx.isMeetingPastWithoutOutcome = true;
      ctx.overdueDays = diffDays;
      ctx.suggestedAction = "record_meeting_outcome";
      ctx.dueLabel = `Reunião há ${diffDays} dia${diffDays === 1 ? "" : "s"}`;
      reasons.push(
        `Reunião já aconteceu e falta registrar o resultado (${diffDays} dia${diffDays === 1 ? "" : "s"} atrás)`,
      );
      return ctx;
    }
    if (diffDays === 0) {
      if (meetingMs < nowMs && !outcome) {
        ctx.tier = "respond_now";
        ctx.isMeetingPastWithoutOutcome = true;
        ctx.dueLabel = "Reunião de hoje pendente de resultado";
        ctx.suggestedAction = "record_meeting_outcome";
        reasons.push(
          "Reunião de hoje já aconteceu — falta registrar o resultado",
        );
        return ctx;
      }
      ctx.tier = "call_today";
      ctx.isMeetingToday = true;
      ctx.dueLabel = "Reunião hoje";
      ctx.suggestedAction = "confirm_meeting";
      reasons.push("Reunião marcada para hoje");
      return ctx;
    }
    // Reunião futura.
    ctx.isMeetingFuture = true;
    const absDays = diffDays == null ? 2 : Math.abs(diffDays);
    if (absDays === 1) {
      ctx.tier = "follow_up";
      ctx.suggestedAction = "confirm_meeting";
      ctx.dueLabel = "Reunião amanhã";
      reasons.push("Reunião marcada para amanhã — confirmar com o lead");
      return ctx;
    }
    ctx.tier = "awaiting";
    ctx.suggestedAction = "wait_until_scheduled";
    ctx.dueLabel = `Aguardando até ${dayMonthFmt.format(new Date(meetingAtIso))}`;
    reasons.push(`Reunião futura em ${dayMonthFmt.format(new Date(meetingAtIso))}`);
    return ctx;
  }

  // ----- 5) Telefone precisa ser conferido e o lead segue ativo. Esse
  // tier aparece ANTES de qualquer sugestão de WhatsApp — a ação primária
  // vira "Conferir telefone".
  if (hasPhoneIncomplete(lead)) {
    const stage = lead.pipeline_stage;
    const isActiveStage =
      stage === "new" ||
      stage === "contact_attempt" ||
      stage === "in_conversation" ||
      stage === "qualified" ||
      stage === "cof_sent" ||
      stage === "negotiating";
    if (isActiveStage) {
      ctx.tier = "verify_phone";
      ctx.suggestedAction = "validate_phone";
      reasons.push("Telefone está incompleto — conferir antes de continuar");
      // Se também há sinal de "sem retorno", registramos como motivo
      // adicional mas o tier continua sendo verify_phone para não gastar
      // tentativas de WhatsApp em um número provavelmente errado.
      const daysSinceContact = daysSinceInBrt(lead.last_contact_at, now);
      if (daysSinceContact != null && daysSinceContact >= 3) {
        reasons.push(
          `Sem retorno há ${daysSinceContact} dia${daysSinceContact === 1 ? "" : "s"}`,
        );
      }
      return ctx;
    }
  }

  // ----- 6) Qualificado (ou avançado) sem reunião — precisa agendar.
  const isQualified =
    lead.pipeline_stage === "qualified" ||
    lead.pipeline_stage === "cof_sent" ||
    lead.pipeline_stage === "negotiating";

  if (isQualified) {
    const diffDays =
      lead.next_contact_at != null
        ? diffDaysInBrt(lead.next_contact_at, nowYmd)
        : null;
    // Primeiro olhamos o status atual; depois, como fallback, o summary da
    // atividade mais recente registrada no histórico.
    const latestActivitySummary = activities
      .filter((a) => a.activity_type === "contact")
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))[0]?.summary;
    const meetingHeld =
      RE_MEETING_HELD.test(lead.last_conversation_status ?? "") ||
      (latestActivitySummary ? RE_MEETING_HELD.test(latestActivitySummary) : false);

    if (!lead.next_contact_at) {
      ctx.tier = "respond_now";
      ctx.isQualifiedWithoutMeeting = true;
      ctx.suggestedAction = "schedule_meeting";
      reasons.push("Lead qualificado e sem próximo contato marcado");
      return ctx;
    }
    // Qualificado com reunião JÁ realizada e aguardando próximo passo —
    // fechar a decisão é prioridade máxima entre os ativos.
    if (meetingHeld && diffDays != null && diffDays >= 0) {
      ctx.tier = "respond_now";
      ctx.suggestedAction = "call_now";
      if (diffDays >= 1) {
        ctx.overdueDays = diffDays;
        ctx.dueLabel = `Atrasado há ${diffDays} dia${diffDays === 1 ? "" : "s"}`;
      } else {
        ctx.isNextContactToday = true;
        ctx.dueLabel = "Hoje";
      }
      reasons.push("Reunião realizada — fechar a decisão com o lead");
      return ctx;
    }
    if (diffDays != null && diffDays >= 1) {
      ctx.tier = "call_today";
      ctx.overdueDays = diffDays;
      ctx.suggestedAction = "call_now";
      ctx.dueLabel = `Atrasado há ${diffDays} dia${diffDays === 1 ? "" : "s"}`;
      reasons.push(
        `Próximo contato atrasado há ${diffDays} dia${diffDays === 1 ? "" : "s"}`,
      );
      return ctx;
    }
    if (diffDays === 0) {
      ctx.tier = "call_today";
      ctx.isNextContactToday = true;
      ctx.suggestedAction = "call_now";
      ctx.dueLabel = "Hoje";
      reasons.push("Próximo contato marcado para hoje");
      return ctx;
    }
    if (diffDays === -1) {
      ctx.tier = "follow_up";
      ctx.isNextContactTomorrow = true;
      ctx.suggestedAction = "wait_until_scheduled";
      ctx.dueLabel = "Amanhã";
      reasons.push("Próximo contato marcado para amanhã");
      return ctx;
    }
    // Futuro além de amanhã → aguardando.
    ctx.tier = "awaiting";
    ctx.suggestedAction = "wait_until_scheduled";
    ctx.dueLabel = `Aguardando até ${dayMonthFmt.format(new Date(lead.next_contact_at))}`;
    reasons.push(
      `Qualificado com retorno combinado para ${dayMonthFmt.format(new Date(lead.next_contact_at))}`,
    );
    return ctx;
  }

  // ----- 7) in_conversation / contact_attempt / new (já com contato).
  if (
    lead.pipeline_stage === "in_conversation" ||
    lead.pipeline_stage === "contact_attempt" ||
    (lead.pipeline_stage === "new" && !nenhumContato)
  ) {
    const diffDays =
      lead.next_contact_at != null
        ? diffDaysInBrt(lead.next_contact_at, nowYmd)
        : null;

    // Guard anti-"falso compromisso": se a última interação foi fria (não
    // visualizou / visualizou sem responder / "ok, obrigada") E não há
    // sinal comercial vivo (reunião, visita, sociedade, cof, aguardando
    // retorno concreto), o lead vai para reactivate independentemente de
    // next_contact_at estar atrasado. Atraso sozinho não faz um lead
    // frio subir para "Ligar hoje".
    const status = lead.last_conversation_status ?? "";
    const notViewedNow = RE_NOT_VISUALIZED.test(status);
    const coldSignal = RE_COLD_RESPONSE.test(status);
    const hotSignal = RE_HOT_SIGNAL.test(status) || RE_HOT_SIGNAL.test(lead.notes ?? "");
    if (coldSignal && !hotSignal) {
      ctx.tier = "reactivate";
      ctx.suggestedAction = notViewedNow ? "resend_other_time" : "send_followup";
      const daysSinceContact = daysSinceInBrt(lead.last_contact_at, now);
      reasons.push(
        notViewedNow
          ? "Última mensagem não foi visualizada — reenviar em outro horário"
          : "Sem retorno após a última mensagem",
      );
      if (daysSinceContact != null && daysSinceContact >= 3) {
        reasons.push(
          `Sem resposta há ${daysSinceContact} dia${daysSinceContact === 1 ? "" : "s"}`,
        );
      }
      return ctx;
    }

    if (diffDays != null && diffDays >= 1) {
      ctx.tier = "call_today";
      ctx.overdueDays = diffDays;
      ctx.suggestedAction = "call_now";
      ctx.dueLabel = `Atrasado há ${diffDays} dia${diffDays === 1 ? "" : "s"}`;
      reasons.push(
        `Próximo contato atrasado há ${diffDays} dia${diffDays === 1 ? "" : "s"}`,
      );
      return ctx;
    }
    if (diffDays === 0) {
      ctx.tier = "call_today";
      ctx.isNextContactToday = true;
      ctx.suggestedAction = "call_now";
      ctx.dueLabel = "Hoje";
      reasons.push("Próximo contato marcado para hoje");
      return ctx;
    }
    if (diffDays === -1) {
      ctx.tier = "follow_up";
      ctx.isNextContactTomorrow = true;
      ctx.suggestedAction = "wait_until_scheduled";
      ctx.dueLabel = "Amanhã";
      reasons.push("Próximo contato marcado para amanhã");
      return ctx;
    }
    if (diffDays != null && diffDays < -1) {
      ctx.tier = "awaiting";
      ctx.suggestedAction = "wait_until_scheduled";
      ctx.dueLabel = `Aguardando até ${dayMonthFmt.format(new Date(lead.next_contact_at!))}`;
      reasons.push(
        `Retorno combinado para ${dayMonthFmt.format(new Date(lead.next_contact_at!))}`,
      );
      return ctx;
    }

    // Sem próximo contato: usar status/dias desde o último contato
    // para decidir entre follow_up e reactivate.
    const daysSinceContact = daysSinceInBrt(lead.last_contact_at, now);
    const sawNoReply = RE_SAW_NO_REPLY.test(lead.last_conversation_status ?? "");
    const notViewed = RE_NOT_VISUALIZED.test(lead.last_conversation_status ?? "");
    if (sawNoReply || notViewed || (daysSinceContact != null && daysSinceContact > 2)) {
      ctx.tier = "reactivate";
      ctx.suggestedAction = notViewed ? "resend_other_time" : "send_followup";
      reasons.push(
        daysSinceContact != null
          ? `Sem resposta há ${daysSinceContact} dia${daysSinceContact === 1 ? "" : "s"}`
          : "Última mensagem sem retorno",
      );
      return ctx;
    }

    ctx.tier = "follow_up";
    ctx.suggestedAction = hasValidPhone(lead)
      ? "whatsapp_reconnect"
      : "validate_phone";
    reasons.push("Conversa recente — manter em acompanhamento");
    return ctx;
  }

  // ----- 8) no_response explícito → reativar.
  if (lead.pipeline_stage === "no_response") {
    const daysSinceContact = daysSinceInBrt(lead.last_contact_at, now);
    ctx.tier = "reactivate";
    ctx.suggestedAction = "send_followup";
    reasons.push(
      daysSinceContact != null
        ? `Sem retorno há ${daysSinceContact} dia${daysSinceContact === 1 ? "" : "s"}`
        : "Sem retorno após as últimas tentativas",
    );
    return ctx;
  }

  // Fallback defensivo — nunca deveria chegar aqui.
  ctx.tier = "follow_up";
  reasons.push("Lead sem sinais operacionais relevantes no momento");
  return ctx;
}

function terminalReason(kind: "won" | "lost" | "disqualified"): string {
  if (kind === "won") return "Lead já convertido — manter apenas no histórico";
  if (kind === "lost") return "Lead perdido — manter apenas no histórico";
  return "Lead desqualificado — manter apenas no histórico";
}

// ------------------------------------------------------------------
// Função principal
// ------------------------------------------------------------------

export function calculateLeadIntelligence(
  lead: FranchiseLead,
  activities: FranchiseLeadActivity[],
  now: Date = new Date(),
): LeadIntelligence {
  const nowYmd = ymdInBrt(now);
  const ctx = classifyTier(lead, activities, now, nowYmd);

  // Tier terminal → saída curta.
  if (ctx.tier === "terminal") {
    return {
      score: 0,
      temperature: "inactive",
      operationalTier: "terminal",
      tierLabel: OPERATIONAL_TIER_LABELS.terminal,
      attentionLevel: "none",
      reasons: ctx.reasons,
      suggestedAction: "history_only",
      suggestedActionLabel: SUGGESTED_ACTION_LABELS.history_only,
      dueLabel: null,
      excludeFromActiveQueue: true,
    };
  }

  const daysSinceContact = daysSinceInBrt(lead.last_contact_at, now);

  // Enriquece com motivos adicionais (independentes do tier) para a UI
  // mostrar contexto completo.
  const additionalReasons: string[] = [];

  if (investmentIndicatesSevenHundredPlus(lead)) {
    additionalReasons.push("Pretende investir a partir de R$ 700 mil");
  }
  if (startTimelineUpTo3Months(lead)) {
    additionalReasons.push("Pretende iniciar em até 3 meses");
  }
  if (lead.priority === "high") {
    additionalReasons.push("Prioridade manual alta");
  }
  if (isStillStructuringCapital(lead)) {
    additionalReasons.push("Ainda está estruturando o capital");
  }
  if (
    daysSinceContact != null &&
    daysSinceContact > 14 &&
    ctx.tier !== "verify_phone" &&
    !ctx.reasons.some((r) => /sem resposta|sem retorno/i.test(r))
  ) {
    additionalReasons.push(`Sem resposta há ${daysSinceContact} dias`);
  }

  // Deduplica preservando ordem.
  const combinedReasons: string[] = [];
  for (const r of [...ctx.reasons, ...additionalReasons]) {
    if (!combinedReasons.includes(r)) combinedReasons.push(r);
  }

  // ----------------------------------------------------------------
  // Score (0..100). Serve só para ordenar dentro do tier.
  // ----------------------------------------------------------------
  let score = 0;
  if (ctx.tier === "respond_now") score += 30;
  if (ctx.tier === "call_today") score += 20;
  if (ctx.tier === "follow_up") score += 10;
  if (ctx.tier === "verify_phone") score += 10;

  if (ctx.isMeetingPastWithoutOutcome) score += WEIGHTS.meetingPastWithoutOutcome;
  if (lead.pipeline_stage === "meeting_scheduled" && !ctx.isMeetingPastWithoutOutcome)
    score += WEIGHTS.meetingScheduled;
  if (
    lead.pipeline_stage === "qualified" ||
    lead.pipeline_stage === "cof_sent" ||
    lead.pipeline_stage === "negotiating"
  )
    score += WEIGHTS.qualified;
  if (startTimelineUpTo3Months(lead)) score += WEIGHTS.startTimelineUpTo3Months;
  if (investmentIndicatesSevenHundredPlus(lead)) score += WEIGHTS.investmentFrom700k;
  if (lead.priority === "high") score += WEIGHTS.manualHigh;
  if (lead.pipeline_stage === "in_conversation") score += WEIGHTS.inConversation;
  if (daysSinceContact != null && daysSinceContact <= 2) score += WEIGHTS.recentContact;
  if (ctx.isNextContactToday) score += WEIGHTS.nextContactToday;
  if (ctx.overdueDays > 0) score += WEIGHTS.nextContactOverdue;
  if (ctx.isNewLeadFresh || ctx.isNewLeadOverdueSla) score += WEIGHTS.newLeadFresh;

  if (isStillStructuringCapital(lead)) score += WEIGHTS.stillStructuringCapital;
  if (daysSinceContact != null && daysSinceContact > 14)
    score += WEIGHTS.noResponseOver14d;
  else if (daysSinceContact != null && daysSinceContact > 7)
    score += WEIGHTS.noResponseOver7d;
  if (hasPhoneIncomplete(lead)) score += WEIGHTS.phoneIncomplete;
  if (!hasAnyContactInfo(lead)) score += WEIGHTS.noContactInfo;

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  // ----------------------------------------------------------------
  // Attention level (estilo visual) derivado do tier.
  // ----------------------------------------------------------------
  let attentionLevel: AttentionLevel = "none";
  switch (ctx.tier) {
    case "respond_now":
      attentionLevel = "critical";
      break;
    case "call_today":
    case "verify_phone":
      attentionLevel = "today";
      break;
    case "follow_up":
      attentionLevel = "soon";
      break;
    case "reactivate":
      attentionLevel = "monitor";
      break;
    case "awaiting":
      attentionLevel = "soon";
      break;
    case "deprioritize":
      attentionLevel = "none";
      break;
    default:
      attentionLevel = "none";
      break;
  }

  // ----------------------------------------------------------------
  // Temperature (sinal frio/morno/quente — usado em futuros filtros).
  // ----------------------------------------------------------------
  let temperature: Temperature;
  if (
    ctx.isMeetingPastWithoutOutcome ||
    lead.pipeline_stage === "meeting_scheduled" ||
    (ctx.tier === "respond_now" && lead.pipeline_stage !== "new")
  ) {
    temperature = "hot";
  } else if (
    ctx.tier === "call_today" ||
    ctx.tier === "follow_up" ||
    ctx.tier === "respond_now"
  ) {
    temperature = "warm";
  } else if (
    ctx.tier === "reactivate" ||
    ctx.tier === "verify_phone" ||
    ctx.tier === "awaiting"
  ) {
    temperature = "cold";
  } else {
    temperature = "inactive";
  }

  // ----------------------------------------------------------------
  // Suggested action label.
  //
  // Para tiers 1-3 (ativos), se o lead tem `next_action` cadastrada e ela
  // é mais específica que a nossa frase genérica, exibimos a frase do
  // operador para evitar texto genérico ("Confirmar interesse do filho"
  // vs. "Retomar o contato pelo WhatsApp"). Caso contrário, usamos o
  // label canônico. Isso NÃO altera `suggestedAction`, que continua
  // sendo o enum usado pelo mapeamento de ações no dialog.
  // ----------------------------------------------------------------
  let suggestedActionLabel = SUGGESTED_ACTION_LABELS[ctx.suggestedAction];
  if (
    (ctx.tier === "respond_now" ||
      ctx.tier === "call_today" ||
      ctx.tier === "follow_up") &&
    lead.next_action &&
    lead.next_action.trim().length > 0 &&
    isSpecificNextAction(lead.next_action)
  ) {
    suggestedActionLabel = lead.next_action.trim();
  }
  // Exceção específica: Doni — "Confirmar interesse do filho" tem precedência.
  if (
    (ctx.tier === "call_today" ||
      ctx.tier === "follow_up" ||
      ctx.tier === "reactivate") &&
    RE_CHILD_INTEREST.test(
      `${lead.next_action ?? ""} ${lead.last_conversation_status ?? ""}`,
    )
  ) {
    suggestedActionLabel = "Confirmar interesse do filho";
  }
  // Exceção específica: visita com a sócia.
  if (
    (ctx.tier === "call_today" || ctx.tier === "follow_up") &&
    (RE_VISIT.test(lead.next_action ?? "") ||
      RE_VISIT.test(lead.last_conversation_status ?? ""))
  ) {
    suggestedActionLabel =
      lead.next_action && lead.next_action.trim().length > 0
        ? lead.next_action.trim()
        : SUGGESTED_ACTION_LABELS.confirm_visit;
  }

  // Último fallback: se nenhum motivo foi gerado, dá uma frase operacional
  // para a UI nunca ficar vazia.
  if (combinedReasons.length === 0) {
    combinedReasons.push("Lead sem sinais operacionais relevantes no momento");
  }

  return {
    score,
    temperature,
    operationalTier: ctx.tier,
    tierLabel: tierDisplayLabel(ctx),
    attentionLevel,
    reasons: combinedReasons,
    suggestedAction: ctx.suggestedAction,
    suggestedActionLabel,
    dueLabel: ctx.dueLabel,
    excludeFromActiveQueue: isExcludedFromActiveQueue(ctx.tier),
  };
}

function tierDisplayLabel(ctx: TierContext): string {
  // `awaiting` ganha a data concreta embutida; os demais usam o label base.
  if (ctx.tier === "awaiting" && ctx.nextContactIso) {
    return `Aguardando até ${dayMonthFmt.format(new Date(ctx.nextContactIso))}`;
  }
  return OPERATIONAL_TIER_LABELS[ctx.tier];
}

function isSpecificNextAction(text: string): boolean {
  // Heurística simples para evitar que uma frase genérica "Fazer contato"
  // substitua um label mais informativo. Qualquer texto > 15 chars e sem
  // ser só verbo + preposição conta como "específico".
  const t = text.trim();
  if (t.length < 10) return false;
  if (/^fazer contato$/i.test(t)) return false;
  return true;
}

function isExcludedFromActiveQueue(tier: OperationalTier): boolean {
  // Fila "Quem chamar agora" só mostra tiers 1-4.
  return (
    tier === "reactivate" ||
    tier === "awaiting" ||
    tier === "deprioritize" ||
    tier === "terminal"
  );
}

// ------------------------------------------------------------------
// Ordenação da fila "Quem chamar agora"
// ------------------------------------------------------------------

export type IntelligenceEnrichedLead = {
  lead: FranchiseLead;
  intel: LeadIntelligence;
};

const PRIORITY_RANK = { high: 0, normal: 1, low: 2 } as const;

// Ordenação dentro do tier (regra do usuário):
//   1. Próximo contato vencido (mais atrasado primeiro).
//   2. Prioridade manual (high > normal > low).
//   3. Interação recente (last_contact_at desc).
//   4. Score (desc).
//   5. Data de recebimento (received_at/created_at asc — quem espera há mais).
export function sortByOperationalPriority(
  a: IntelligenceEnrichedLead,
  b: IntelligenceEnrichedLead,
): number {
  const aRank = OPERATIONAL_TIER_RANK[a.intel.operationalTier];
  const bRank = OPERATIONAL_TIER_RANK[b.intel.operationalTier];
  if (aRank !== bRank) return aRank - bRank;

  const aOverdue = overdueMagnitude(a);
  const bOverdue = overdueMagnitude(b);
  if (aOverdue !== bOverdue) return bOverdue - aOverdue;

  const ap = PRIORITY_RANK[a.lead.priority];
  const bp = PRIORITY_RANK[b.lead.priority];
  if (ap !== bp) return ap - bp;

  const aLast = a.lead.last_contact_at ?? "";
  const bLast = b.lead.last_contact_at ?? "";
  if (aLast && bLast && aLast !== bLast) return bLast.localeCompare(aLast);
  if (aLast && !bLast) return -1;
  if (!aLast && bLast) return 1;

  if (a.intel.score !== b.intel.score) return b.intel.score - a.intel.score;

  const aRecv = a.lead.received_at ?? a.lead.created_at;
  const bRecv = b.lead.received_at ?? b.lead.created_at;
  return aRecv.localeCompare(bRecv);
}

function overdueMagnitude(e: IntelligenceEnrichedLead): number {
  const match = /\d+/.exec(e.intel.dueLabel ?? "");
  if (!match) return 0;
  // "Reunião há 4 dias", "Atrasado há 4 dias", "Reunião hoje" (sem número).
  // Só conta como atraso se o label mencionar "atraso" ou "reunião há".
  const label = e.intel.dueLabel ?? "";
  if (/atrasado|reunião há/i.test(label)) return Number(match[0]);
  return 0;
}

export function buildCallQueue(
  leads: FranchiseLead[],
  activitiesByLead: Map<string, FranchiseLeadActivity[]>,
  now: Date = new Date(),
  limit = 5,
): IntelligenceEnrichedLead[] {
  const enriched: IntelligenceEnrichedLead[] = [];
  for (const lead of leads) {
    const intel = calculateLeadIntelligence(
      lead,
      activitiesByLead.get(lead.id) ?? [],
      now,
    );
    if (intel.excludeFromActiveQueue) continue;
    enriched.push({ lead, intel });
  }
  enriched.sort(sortByOperationalPriority);
  return enriched.slice(0, limit);
}

// ------------------------------------------------------------------
// Alertas agregados
// ------------------------------------------------------------------

export type AlertCounters = {
  // Tiers 1-4 com contato vencido (dueLabel começa com "Atrasado" ou
  // "Reunião há"). NUNCA conta leads em Reativar.
  overdueContacts: number;
  // Reuniões vencidas sem resultado — subconjunto de respond_now.
  meetingsWithoutOutcome: number;
  // Leads ativos (tiers 1-4) sem next_action salva.
  leadsWithoutNextAction: number;
  // Qualquer lead com telefone bruto + phone_normalized null.
  phonesToConfirm: number;
  // Novos leads sem nenhuma tentativa de contato (SLA 0-72h).
  newLeadsWithoutContact: number;
  // Reativação: tiers 5 (reactivate) + no_response + contact_attempt sem retorno.
  withoutReturn: number;
};

export function computeAlerts(
  leads: FranchiseLead[],
  activitiesByLead: Map<string, FranchiseLeadActivity[]>,
  now: Date = new Date(),
): AlertCounters {
  const counters: AlertCounters = {
    overdueContacts: 0,
    meetingsWithoutOutcome: 0,
    leadsWithoutNextAction: 0,
    phonesToConfirm: 0,
    newLeadsWithoutContact: 0,
    withoutReturn: 0,
  };
  for (const lead of leads) {
    if (isTerminalStage(lead)) continue;
    const activities = activitiesByLead.get(lead.id) ?? [];
    const intel = calculateLeadIntelligence(lead, activities, now);

    const isActiveTier =
      intel.operationalTier === "respond_now" ||
      intel.operationalTier === "call_today" ||
      intel.operationalTier === "follow_up" ||
      intel.operationalTier === "verify_phone";

    if (
      isActiveTier &&
      intel.dueLabel &&
      /atrasado|reunião há/i.test(intel.dueLabel)
    ) {
      counters.overdueContacts += 1;
    }
    if (intel.suggestedAction === "record_meeting_outcome") {
      counters.meetingsWithoutOutcome += 1;
    }
    if (isActiveTier && !lead.next_action) {
      counters.leadsWithoutNextAction += 1;
    }
    if (hasPhoneIncomplete(lead)) {
      counters.phonesToConfirm += 1;
    }
    if (
      lead.pipeline_stage === "new" &&
      !hasContactAttemptEver(activities) &&
      !lead.last_contact_at
    ) {
      counters.newLeadsWithoutContact += 1;
    }
    if (intel.operationalTier === "reactivate") {
      counters.withoutReturn += 1;
    }
    void hasValidPhone;
  }
  return counters;
}

// Normalização de telefone para link do WhatsApp.
// Retorna só os dígitos (sem "+"), prontos para `https://wa.me/<digits>`.
export function waNumberFor(lead: FranchiseLead): string | null {
  if (!lead.phone_normalized) return null;
  return lead.phone_normalized.replace(/\D+/g, "") || null;
}
