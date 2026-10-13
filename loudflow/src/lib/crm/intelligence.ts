// Prioridade operacional dos leads de franquia.
//
// Objetivo: responder quatro perguntas da equipe comercial sem depender de
// LLM, cron ou integrações externas.
//
//   1. Quem precisamos chamar agora?
//   2. Por que esse lead está priorizado?
//   3. Qual é a próxima ação recomendada?
//   4. Quais contatos ou reuniões estão atrasados?
//
// Regras determinísticas, calculadas a partir dos dados do lead + histórico
// de atividades. O número final (score 0-100) serve só para ORDENAR o
// trabalho — nunca aparece sozinho; sempre acompanhado de motivos humanos.
//
// Nome correto do campo exposto na UI: "Prioridade operacional".
// Não é "probabilidade de fechamento".
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
  | "history_only";

export type LeadIntelligence = {
  score: number;
  temperature: Temperature;
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

  // Reduções
  stillStructuringCapital: -10,
  noResponseOver7d: -10,
  noResponseOver14d: -20,
  phoneIncomplete: -20,
  noContactInfo: -30,
} as const;

// Rótulos pt-BR das próximas ações sugeridas. Mantidos aqui para a UI
// nunca inventar texto novo.
export const SUGGESTED_ACTION_LABELS: Record<SuggestedAction, string> = {
  record_meeting_outcome: "Registrar o resultado da reunião",
  call_now: "Ligar agora",
  confirm_meeting: "Confirmar a reunião",
  schedule_meeting: "Agendar uma reunião",
  whatsapp_reconnect: "Retomar o contato pelo WhatsApp",
  send_followup: "Enviar follow-up curto",
  resend_other_time: "Reenviar em outro horário",
  confirm_visit: "Confirmar a visita com a sócia",
  validate_phone: "Validar o telefone",
  wait_until_scheduled: "Aguardar até a data combinada",
  history_only: "Manter somente no histórico",
};

export const ATTENTION_LEVEL_LABELS: Record<AttentionLevel, string> = {
  critical: "Crítico",
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

function ymdInBrt(d: Date): string {
  return dateOnlyFmt.format(d);
}

function diffDaysInBrt(aIso: string | null, nowYmd: string): number | null {
  if (!aIso) return null;
  const target = ymdInBrt(new Date(aIso));
  // Comparação em YMD lexicográfica é segura para datas no formato en-CA.
  // Usamos UTC midnight para subtrair dias sem drift de horário de verão.
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

// ------------------------------------------------------------------
// Classificação textual auxiliar
// ------------------------------------------------------------------

const RE_STRUCTURING = /estruturando (o |)capital/i;
const RE_INVESTMENT_700K_PLUS = /r\$?\s*7(00|50)\s*mil|r\$?\s*8\d{2}\s*mil|r\$?\s*9\d{2}\s*mil|r\$?\s*[1-9](\.|,)?\s*m[ií]/i;
const RE_START_UPTO_3M = /at[eé]\s*3\s*m[eê]s/i;

function hasValidPhone(lead: FranchiseLead): boolean {
  return Boolean(lead.phone_normalized);
}

function hasPhoneIncomplete(lead: FranchiseLead): boolean {
  // Operador registrou um bruto mas a normalização falhou.
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
  // Qualquer atividade de contato OU mudança de etapa posterior ao horário
  // da reunião conta como "resultado registrado" para efeito de alerta.
  const meetingMs = new Date(meetingAtIso).getTime();
  return activities.some(
    (a) =>
      (a.activity_type === "contact" || a.activity_type === "stage_change") &&
      new Date(a.occurred_at).getTime() >= meetingMs,
  );
}

function investmentIndicatesSevenHundredPlus(lead: FranchiseLead): boolean {
  if (!lead.investment_range) return false;
  // Guarda contra "ainda estou estruturando o capital" classificar como alto.
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

// ------------------------------------------------------------------
// Função principal
// ------------------------------------------------------------------

export function calculateLeadIntelligence(
  lead: FranchiseLead,
  activities: FranchiseLeadActivity[],
  now: Date = new Date(),
): LeadIntelligence {
  const terminal = isTerminalStage(lead);
  if (terminal) {
    return {
      score: 0,
      temperature: "inactive",
      attentionLevel: "none",
      reasons: terminalReason(terminal),
      suggestedAction: "history_only",
      suggestedActionLabel: SUGGESTED_ACTION_LABELS.history_only,
      dueLabel: null,
      excludeFromActiveQueue: true,
    };
  }

  const nowYmd = ymdInBrt(now);
  const daysSinceContact = daysSinceInBrt(lead.last_contact_at, now);
  const daysUntilNextContact =
    lead.next_contact_at != null
      ? -1 * (diffDaysInBrt(lead.next_contact_at, nowYmd) ?? 0)
      : null;
  const nowMs = now.getTime();

  const reasons: string[] = [];
  const flags = {
    meetingPastWithoutOutcome: false,
    meetingToday: false,
    meetingFuture: false,
    nextContactToday: false,
    nextContactTomorrow: false,
    nextContactOverdueDays: 0,
    qualifiedWithoutMeeting: false,
    qualifiedAwaitingConfirmation: false,
    newLeadNoAttempt: false,
    noResponse7d: false,
    noResponse14d: false,
    phoneIncomplete: hasPhoneIncomplete(lead),
    noContactInfo: !hasAnyContactInfo(lead),
    stillStructuringCapital: isStillStructuringCapital(lead),
    investment700kPlus: investmentIndicatesSevenHundredPlus(lead),
    startUpTo3Months: startTimelineUpTo3Months(lead),
    manualHigh: lead.priority === "high",
    inConversation: lead.pipeline_stage === "in_conversation",
    recentContact: daysSinceContact != null && daysSinceContact <= 2,
    qualified:
      lead.pipeline_stage === "qualified" ||
      lead.pipeline_stage === "cof_sent" ||
      lead.pipeline_stage === "negotiating",
    meetingScheduled: lead.pipeline_stage === "meeting_scheduled",
    waitingToConfirmVisit: false,
    waitingAtScheduledDate: false,
  };

  // Reunião agendada: distinguimos passada, hoje e futura.
  if (lead.pipeline_stage === "meeting_scheduled") {
    const meetingAtIso = lead.next_contact_at;
    if (meetingAtIso) {
      const diffDays = diffDaysInBrt(meetingAtIso, nowYmd);
      const meetingMs = new Date(meetingAtIso).getTime();
      if (diffDays == null) {
        // next_contact_at inválido — tratamos como "a confirmar"
        flags.meetingFuture = true;
      } else if (diffDays > 0) {
        // Reunião em dia anterior ao de hoje.
        const outcome = hasMeetingOutcomeAfter(activities, meetingAtIso);
        if (!outcome) {
          flags.meetingPastWithoutOutcome = true;
          reasons.push(
            `Reunião já aconteceu e falta registrar o resultado (${diffDays} dia${diffDays === 1 ? "" : "s"} atrás)`,
          );
        }
      } else if (diffDays === 0) {
        // Mesmo dia — passou ou está por vir dentro de hoje?
        if (meetingMs < nowMs) {
          const outcome = hasMeetingOutcomeAfter(activities, meetingAtIso);
          if (!outcome) {
            flags.meetingPastWithoutOutcome = true;
            reasons.push(
              "Reunião de hoje já aconteceu — falta registrar o resultado",
            );
          } else {
            flags.meetingToday = true;
          }
        } else {
          flags.meetingToday = true;
          reasons.push("Reunião marcada para hoje");
        }
      } else {
        flags.meetingFuture = true;
        reasons.push("Reunião futura — confirmar com o lead");
      }
    } else {
      // Reunião marcada sem data → tratar como pendência de confirmação.
      flags.qualifiedAwaitingConfirmation = true;
      reasons.push("Reunião marcada sem data — confirmar o horário");
    }
  }

  // Próximo contato — classificação por dia (BRT).
  if (lead.next_contact_at && !flags.meetingPastWithoutOutcome) {
    const diffDays = diffDaysInBrt(lead.next_contact_at, nowYmd);
    if (diffDays != null) {
      if (diffDays > 0) {
        flags.nextContactOverdueDays = diffDays;
        if (!flags.meetingToday && !flags.meetingFuture) {
          reasons.push(
            `Próximo contato atrasado há ${diffDays} dia${diffDays === 1 ? "" : "s"}`,
          );
        }
      } else if (diffDays === 0) {
        if (!flags.meetingPastWithoutOutcome && !flags.meetingToday) {
          flags.nextContactToday = true;
          reasons.push("Próximo contato marcado para hoje");
        }
      } else if (diffDays === -1) {
        flags.nextContactTomorrow = true;
        reasons.push("Próximo contato marcado para amanhã");
      }
    }
  }

  // Qualificado sem reunião ainda.
  if (
    flags.qualified &&
    !flags.meetingScheduled &&
    !lead.next_contact_at
  ) {
    flags.qualifiedWithoutMeeting = true;
    reasons.push("Lead qualificado e ainda não tem reunião agendada");
  }

  // Lead novo sem nenhuma tentativa de contato.
  if (
    lead.pipeline_stage === "new" &&
    !hasContactAttemptEver(activities) &&
    !lead.last_contact_at
  ) {
    flags.newLeadNoAttempt = true;
    reasons.push("Lead novo — nenhuma tentativa de contato ainda");
  }

  // Sem resposta há dias (gate: lead já teve algum contato).
  if (daysSinceContact != null) {
    if (daysSinceContact > 14) {
      flags.noResponse14d = true;
      reasons.push(`Sem resposta há ${daysSinceContact} dias`);
    } else if (daysSinceContact > 7) {
      flags.noResponse7d = true;
      reasons.push(`Sem resposta há ${daysSinceContact} dias`);
    }
  }

  // Investimento / prazo / prioridade manual.
  if (flags.investment700kPlus) {
    reasons.push("Pretende investir a partir de R$ 700 mil");
  }
  if (flags.startUpTo3Months) {
    reasons.push("Pretende iniciar em até 3 meses");
  }
  if (flags.manualHigh) {
    reasons.push("Prioridade manual alta");
  }
  if (flags.qualified) {
    reasons.push("Lead qualificado");
  }

  // Reduções / avisos
  if (flags.phoneIncomplete) {
    reasons.push("Telefone precisa ser confirmado");
  }
  if (flags.noContactInfo) {
    reasons.push("Sem telefone válido nem email");
  }
  if (flags.stillStructuringCapital) {
    reasons.push("Ainda está estruturando o capital");
  }

  // Prioridade alta sem próxima ação é um problema operacional em si.
  if (lead.priority === "high" && !lead.next_action) {
    reasons.push("Prioridade alta sem próxima ação definida");
  }

  // Qualificado sem próximo contato também.
  if (flags.qualified && !lead.next_contact_at && !flags.meetingScheduled) {
    reasons.push("Qualificado sem próximo contato marcado");
  }

  // ----------------------------------------------------------------
  // Score
  // ----------------------------------------------------------------
  let score = 0;
  if (flags.meetingScheduled) score += WEIGHTS.meetingScheduled;
  if (flags.meetingPastWithoutOutcome) score += WEIGHTS.meetingPastWithoutOutcome;
  if (flags.qualified) score += WEIGHTS.qualified;
  if (flags.startUpTo3Months) score += WEIGHTS.startTimelineUpTo3Months;
  if (flags.investment700kPlus) score += WEIGHTS.investmentFrom700k;
  if (flags.manualHigh) score += WEIGHTS.manualHigh;
  if (flags.inConversation) score += WEIGHTS.inConversation;
  if (flags.recentContact) score += WEIGHTS.recentContact;
  if (flags.nextContactToday) score += WEIGHTS.nextContactToday;
  if (flags.nextContactOverdueDays > 0) score += WEIGHTS.nextContactOverdue;

  if (flags.stillStructuringCapital) score += WEIGHTS.stillStructuringCapital;
  if (flags.noResponse14d) score += WEIGHTS.noResponseOver14d;
  else if (flags.noResponse7d) score += WEIGHTS.noResponseOver7d;
  if (flags.phoneIncomplete) score += WEIGHTS.phoneIncomplete;
  if (flags.noContactInfo) score += WEIGHTS.noContactInfo;

  // Limitação 0..100
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  // ----------------------------------------------------------------
  // Attention level
  // ----------------------------------------------------------------
  let attentionLevel: AttentionLevel = "none";

  // Crítico
  if (
    flags.meetingPastWithoutOutcome ||
    flags.nextContactOverdueDays >= 3 ||
    (lead.priority === "high" && !lead.next_action) ||
    (flags.qualified && !lead.next_contact_at && !flags.meetingScheduled) ||
    flags.newLeadNoAttempt
  ) {
    attentionLevel = "critical";
  }
  // Hoje
  else if (
    flags.nextContactToday ||
    flags.meetingToday ||
    (flags.nextContactOverdueDays >= 1 && flags.nextContactOverdueDays <= 2) ||
    flags.qualifiedAwaitingConfirmation
  ) {
    attentionLevel = "today";
  }
  // Em breve
  else if (
    flags.nextContactTomorrow ||
    (flags.inConversation && daysSinceContact != null && daysSinceContact >= 3)
  ) {
    attentionLevel = "soon";
  }
  // Monitorar
  else if (
    flags.stillStructuringCapital ||
    flags.noResponse7d ||
    flags.noResponse14d ||
    flags.phoneIncomplete ||
    lead.pipeline_stage === "no_response"
  ) {
    attentionLevel = "monitor";
  }

  // ----------------------------------------------------------------
  // Suggested action
  // ----------------------------------------------------------------
  let suggestedAction: SuggestedAction;
  if (flags.meetingPastWithoutOutcome) {
    suggestedAction = "record_meeting_outcome";
  } else if (flags.phoneIncomplete) {
    suggestedAction = "validate_phone";
  } else if (flags.nextContactOverdueDays >= 1) {
    suggestedAction = "call_now";
  } else if (flags.meetingToday || flags.meetingFuture) {
    suggestedAction = "confirm_meeting";
  } else if (flags.qualifiedWithoutMeeting || flags.qualified) {
    suggestedAction = "schedule_meeting";
  } else if (flags.nextContactToday) {
    suggestedAction = "call_now";
  } else if (
    lead.pipeline_stage === "contact_attempt" &&
    /n[aã]o visualizou/i.test(lead.last_conversation_status ?? "")
  ) {
    suggestedAction = "resend_other_time";
  } else if (
    lead.pipeline_stage === "no_response" ||
    /visualizou e n[aã]o respondeu/i.test(lead.last_conversation_status ?? "")
  ) {
    suggestedAction = "send_followup";
  } else if (
    /visita/i.test(lead.next_action ?? "") ||
    /visita/i.test(lead.last_conversation_status ?? "")
  ) {
    suggestedAction = "confirm_visit";
  } else if (flags.newLeadNoAttempt) {
    suggestedAction = "whatsapp_reconnect";
  } else if (
    flags.nextContactTomorrow ||
    (lead.next_contact_at && daysUntilNextContact != null && daysUntilNextContact > 1)
  ) {
    suggestedAction = "wait_until_scheduled";
  } else {
    suggestedAction = "whatsapp_reconnect";
  }

  // ----------------------------------------------------------------
  // Temperature
  // ----------------------------------------------------------------
  let temperature: Temperature;
  if (
    flags.meetingPastWithoutOutcome ||
    flags.meetingScheduled ||
    (flags.qualified && (flags.startUpTo3Months || flags.investment700kPlus))
  ) {
    temperature = "hot";
  } else if (
    flags.qualified ||
    flags.inConversation ||
    flags.nextContactToday ||
    flags.nextContactOverdueDays > 0 ||
    flags.manualHigh
  ) {
    temperature = "warm";
  } else if (flags.noResponse14d || flags.phoneIncomplete || flags.noContactInfo) {
    temperature = "cold";
  } else {
    temperature = "warm";
  }

  // ----------------------------------------------------------------
  // Due label
  // ----------------------------------------------------------------
  let dueLabel: string | null = null;
  if (flags.meetingPastWithoutOutcome && lead.next_contact_at) {
    const diffDays = diffDaysInBrt(lead.next_contact_at, nowYmd);
    if (diffDays != null && diffDays > 0) {
      dueLabel = `Reunião há ${diffDays} dia${diffDays === 1 ? "" : "s"}`;
    } else {
      dueLabel = "Reunião pendente de resultado";
    }
  } else if (flags.nextContactOverdueDays >= 1) {
    dueLabel = `Atrasado há ${flags.nextContactOverdueDays} dia${flags.nextContactOverdueDays === 1 ? "" : "s"}`;
  } else if (flags.nextContactToday) {
    dueLabel = "Hoje";
  } else if (flags.nextContactTomorrow) {
    dueLabel = "Amanhã";
  }

  // Reasons mínimo: se não gerou nenhum motivo mas o lead está em etapas
  // intermediárias, sempre damos ao menos uma frase operacional para a UI.
  if (reasons.length === 0) {
    reasons.push("Lead sem sinais operacionais relevantes no momento");
  }

  return {
    score,
    temperature,
    attentionLevel,
    reasons,
    suggestedAction,
    suggestedActionLabel: SUGGESTED_ACTION_LABELS[suggestedAction],
    dueLabel,
    excludeFromActiveQueue: false,
  };
}

function terminalReason(kind: "won" | "lost" | "disqualified"): string[] {
  if (kind === "won") return ["Lead já convertido — manter apenas no histórico"];
  if (kind === "lost") return ["Lead perdido — manter apenas no histórico"];
  return ["Lead desqualificado — manter apenas no histórico"];
}

// ------------------------------------------------------------------
// Ordenação da fila "Quem chamar agora"
// ------------------------------------------------------------------

export type IntelligenceEnrichedLead = {
  lead: FranchiseLead;
  intel: LeadIntelligence;
};

const ATTENTION_RANK: Record<AttentionLevel, number> = {
  critical: 0,
  today: 1,
  soon: 2,
  monitor: 3,
  none: 4,
};

const PRIORITY_RANK = { high: 0, normal: 1, low: 2 } as const;

// Ordenação:
// 1. Atenção crítica
// 2. Reunião vencida sem resultado
// 3. Próximo contato mais atrasado
// 4. Score (prioridade operacional)
// 5. Prioridade manual
// 6. Contato mais antigo (ou criação, se nunca houve contato)
export function sortByOperationalPriority(
  a: IntelligenceEnrichedLead,
  b: IntelligenceEnrichedLead,
): number {
  const aRank = ATTENTION_RANK[a.intel.attentionLevel];
  const bRank = ATTENTION_RANK[b.intel.attentionLevel];
  if (aRank !== bRank) return aRank - bRank;

  const aMeeting = a.intel.suggestedAction === "record_meeting_outcome" ? 0 : 1;
  const bMeeting = b.intel.suggestedAction === "record_meeting_outcome" ? 0 : 1;
  if (aMeeting !== bMeeting) return aMeeting - bMeeting;

  // Mais atrasado primeiro — comparamos dueLabel via extração numérica.
  const aOverdue = overdueMagnitude(a);
  const bOverdue = overdueMagnitude(b);
  if (aOverdue !== bOverdue) return bOverdue - aOverdue;

  if (a.intel.score !== b.intel.score) return b.intel.score - a.intel.score;

  const ap = PRIORITY_RANK[a.lead.priority];
  const bp = PRIORITY_RANK[b.lead.priority];
  if (ap !== bp) return ap - bp;

  // Último recurso: contato mais antigo primeiro (quem está esperando há mais tempo).
  const aContact = a.lead.last_contact_at ?? a.lead.created_at;
  const bContact = b.lead.last_contact_at ?? b.lead.created_at;
  return aContact.localeCompare(bContact);
}

function overdueMagnitude(e: IntelligenceEnrichedLead): number {
  const match = /\d+/.exec(e.intel.dueLabel ?? "");
  if (!match) return 0;
  return Number(match[0]);
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
    if (intel.attentionLevel === "none") continue;
    enriched.push({ lead, intel });
  }
  enriched.sort(sortByOperationalPriority);
  return enriched.slice(0, limit);
}

// ------------------------------------------------------------------
// Alertas agregados
// ------------------------------------------------------------------

export type AlertCounters = {
  overdueContacts: number;
  meetingsWithoutOutcome: number;
  leadsWithoutNextAction: number;
  phonesToConfirm: number;
  newLeadsWithoutContact: number;
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
  };
  for (const lead of leads) {
    if (isTerminalStage(lead)) continue;
    const intel = calculateLeadIntelligence(
      lead,
      activitiesByLead.get(lead.id) ?? [],
      now,
    );
    if (intel.suggestedAction === "record_meeting_outcome") {
      counters.meetingsWithoutOutcome += 1;
    }
    const nowYmd = ymdInBrt(now);
    const diffDays = diffDaysInBrt(lead.next_contact_at, nowYmd);
    if (diffDays != null && diffDays >= 1) {
      counters.overdueContacts += 1;
    }
    if (!lead.next_action) {
      counters.leadsWithoutNextAction += 1;
    }
    if (hasPhoneIncomplete(lead)) {
      counters.phonesToConfirm += 1;
    }
    if (
      lead.pipeline_stage === "new" &&
      !hasContactAttemptEver(activitiesByLead.get(lead.id) ?? []) &&
      !lead.last_contact_at
    ) {
      counters.newLeadsWithoutContact += 1;
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
