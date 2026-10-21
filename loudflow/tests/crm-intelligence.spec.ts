import { test, expect } from "@playwright/test";
import {
  calculateLeadIntelligence,
  sortByOperationalPriority,
  buildCallQueue,
  computeAlerts,
  waNumberFor,
  WEIGHTS,
  SUGGESTED_ACTION_LABELS,
  OPERATIONAL_TIER_LABELS,
  type IntelligenceEnrichedLead,
  type OperationalTier,
} from "../src/lib/crm/intelligence";
import type {
  FranchiseLead,
  FranchiseLeadActivity,
  FranchiseLeadStage,
  FranchiseLeadPriority,
} from "../src/lib/supabase/types";

// ============================================================================
// Testes unitários do módulo de inteligência operacional dos leads de franquia.
//
// Rodam sem banco e sem servidor Next — basta `npx playwright test
// tests/crm-intelligence.spec.ts`. São determinísticos: congelamos "now" em
// um instante específico BRT para que "hoje"/"ontem"/"amanhã" sejam estáveis.
//
// Fixado em 2026-10-16 12:00 BRT (= 15:00 UTC). Esta data é o "hoje" para a
// equipe no momento desta primeira versão do CRM. Troca aqui propaga para
// todos os testes. Em produção o módulo sempre usa `new Date()`; a data
// fixa existe apenas no escopo destes testes.
// ============================================================================

const NOW_BRT_YMD = "2026-10-16";
const NOW = new Date("2026-10-16T15:00:00.000Z"); // 12:00 BRT

// ---------- helpers de BRT → ISO UTC ----------

function brtDate(ymd: string, hhmm = "12:00"): string {
  // BRT (UTC-3) sem horário de verão: hhmm BRT + 3h = UTC.
  const [y, m, d] = ymd.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, h + 3, mi, 0)).toISOString();
}

function daysFromNow(days: number): string {
  const [y, m, d] = NOW_BRT_YMD.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d + days);
  return new Date(base + 15 * 3600 * 1000).toISOString();
}

function hoursFromNow(hours: number): string {
  return new Date(NOW.getTime() + hours * 3600 * 1000).toISOString();
}

function makeLead(overrides: Partial<FranchiseLead> = {}): FranchiseLead {
  return {
    id: "lead-" + Math.random().toString(36).slice(2, 10),
    organization_id: "org-1",
    full_name: "Lead Teste",
    phone: "+5519997555366",
    phone_normalized: "+5519997555366",
    email: null,
    received_at: null,
    last_contact_at: null,
    last_conversation_status: null,
    next_action: null,
    next_contact_at: null,
    pipeline_stage: "new" as FranchiseLeadStage,
    priority: "normal" as FranchiseLeadPriority,
    source: null,
    investment_range: null,
    start_timeline: null,
    whatsapp_label: null,
    notes: null,
    lost_reason: null,
    owner_id: null,
    created_by: null,
    created_at: "2026-10-01T15:00:00.000Z",
    updated_at: "2026-10-01T15:00:00.000Z",
    sla_contact_attempts: 0,
    sla_response_received_at: null,
    sla_archive_type: null,
    sla_archived_at: null,
    sla_last_retry_at: null,
    ...overrides,
  };
}

function act(
  leadId: string,
  type: FranchiseLeadActivity["activity_type"],
  summary: string,
  occurredAtIso: string,
): FranchiseLeadActivity {
  return {
    id: "act-" + Math.random().toString(36).slice(2, 10),
    organization_id: "org-1",
    lead_id: leadId,
    activity_type: type,
    summary,
    occurred_at: occurredAtIso,
    created_by: null,
    created_at: occurredAtIso,
  };
}

test.describe("CRM lead intelligence — tiers e SLAs", () => {
  // ----------------------------------------------------------------
  // Terminal / exclusões
  // ----------------------------------------------------------------
  test("Lead perdido → tier terminal, fora da fila ativa", () => {
    const lead = makeLead({ pipeline_stage: "lost", lost_reason: "Concorrente" });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("terminal" satisfies OperationalTier);
    expect(r.excludeFromActiveQueue).toBe(true);
    expect(r.suggestedAction).toBe("history_only");
    expect(r.tierLabel).toBe(OPERATIONAL_TIER_LABELS.terminal);
  });

  test("Lead convertido → tier terminal", () => {
    const r = calculateLeadIntelligence(makeLead({ pipeline_stage: "won" }), [], NOW);
    expect(r.operationalTier).toBe("terminal");
    expect(r.excludeFromActiveQueue).toBe(true);
  });

  test("Lead desqualificado → tier terminal", () => {
    const r = calculateLeadIntelligence(
      makeLead({ pipeline_stage: "disqualified" }),
      [],
      NOW,
    );
    expect(r.operationalTier).toBe("terminal");
    expect(r.excludeFromActiveQueue).toBe(true);
  });

  // ----------------------------------------------------------------
  // SLA do novo lead
  // ----------------------------------------------------------------
  test("Novo lead recebido há 10 minutos → responder agora", () => {
    const lead = makeLead({
      pipeline_stage: "new",
      received_at: hoursFromNow(-10 / 60), // 10 minutos atrás
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("respond_now");
    expect(r.tierLabel).toBe("Responder agora");
    expect(r.suggestedAction).toBe("answer_new_lead");
    expect(r.reasons[0]).toMatch(/responder agora/i);
    expect(r.excludeFromActiveQueue).toBe(false);
  });

  test("Novo lead há 48h → responder agora com rótulo 'atrasado'", () => {
    const lead = makeLead({
      pipeline_stage: "new",
      received_at: hoursFromNow(-48),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("respond_now");
    expect(r.suggestedAction).toBe("answer_new_lead");
    expect(r.reasons.some((x) => /atrasado/i.test(x))).toBe(true);
  });

  test("Novo lead há 96h sem resposta → Reativar", () => {
    const lead = makeLead({
      pipeline_stage: "new",
      received_at: hoursFromNow(-96),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("reactivate");
    expect(r.excludeFromActiveQueue).toBe(true);
    expect(r.reasons.some((x) => /mais de 72 horas/i.test(x))).toBe(true);
  });

  // ----------------------------------------------------------------
  // Reunião
  // ----------------------------------------------------------------
  test("Reunião passada sem resultado → respond_now + registrar resultado", () => {
    const lead = makeLead({
      pipeline_stage: "meeting_scheduled",
      priority: "high",
      next_contact_at: daysFromNow(-4),
      last_contact_at: daysFromNow(-5),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("respond_now");
    expect(r.suggestedAction).toBe("record_meeting_outcome");
    expect(r.dueLabel).toContain("Reunião há 4 dias");
  });

  test("Reunião passada COM resultado registrado → não é mais crítica", () => {
    const lead = makeLead({
      id: "lead-m",
      pipeline_stage: "meeting_scheduled",
      next_contact_at: daysFromNow(-2),
      last_contact_at: daysFromNow(-1),
    });
    const activities = [
      act(lead.id, "contact", "Reunião realizada; cliente vai pensar.", daysFromNow(-1)),
    ];
    const r = calculateLeadIntelligence(lead, activities, NOW);
    expect(r.suggestedAction).not.toBe("record_meeting_outcome");
  });

  test("Reunião futura (3 dias) → awaiting fora da fila ativa", () => {
    const lead = makeLead({
      pipeline_stage: "meeting_scheduled",
      next_contact_at: daysFromNow(3),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("awaiting");
    expect(r.excludeFromActiveQueue).toBe(true);
    expect(r.tierLabel).toMatch(/aguardando até/i);
  });

  test("Reunião amanhã → follow_up (dentro da fila ativa)", () => {
    const lead = makeLead({
      pipeline_stage: "meeting_scheduled",
      next_contact_at: daysFromNow(-1), // "amanhã" (diffDays = -1 em passado-futuro)
    });
    // next_contact_at: usa dias no futuro. amanhã = +1 dia.
    const amanha = makeLead({
      pipeline_stage: "meeting_scheduled",
      next_contact_at: daysFromNow(1),
    });
    const r = calculateLeadIntelligence(amanha, [], NOW);
    expect(r.operationalTier).toBe("follow_up");
    expect(r.excludeFromActiveQueue).toBe(false);
    void lead;
  });

  test("Reunião hoje → call_today", () => {
    const lead = makeLead({
      pipeline_stage: "meeting_scheduled",
      next_contact_at: brtDate(NOW_BRT_YMD, "16:00"),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("call_today");
    expect(r.suggestedAction).toBe("confirm_meeting");
    expect(r.dueLabel).toMatch(/reunião hoje/i);
  });

  // ----------------------------------------------------------------
  // Próximo contato
  // ----------------------------------------------------------------
  test("Próximo contato HOJE → call_today + call_now", () => {
    const lead = makeLead({
      pipeline_stage: "in_conversation",
      next_contact_at: brtDate(NOW_BRT_YMD, "16:00"),
      last_contact_at: daysFromNow(-1),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("call_today");
    expect(r.suggestedAction).toBe("call_now");
    expect(r.dueLabel).toBe("Hoje");
    expect(r.score).toBeGreaterThanOrEqual(WEIGHTS.nextContactToday);
  });

  test("Próximo contato vencido 4 dias → call_today (atraso é multiplicador, não tier próprio)", () => {
    const lead = makeLead({
      pipeline_stage: "in_conversation",
      next_contact_at: daysFromNow(-4),
      last_contact_at: daysFromNow(-5),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("call_today");
    expect(r.suggestedAction).toBe("call_now");
    expect(r.dueLabel).toBe("Atrasado há 4 dias");
    expect(r.score).toBeGreaterThanOrEqual(WEIGHTS.nextContactOverdue);
  });

  test("Qualificado sem reunião nem próximo contato → respond_now + schedule_meeting", () => {
    const lead = makeLead({
      pipeline_stage: "qualified",
      priority: "high",
      next_contact_at: null,
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("respond_now");
    expect(r.suggestedAction).toBe("schedule_meeting");
  });

  test("Qualificado pós-reunião aguardando decisão → respond_now (Luana/Vanessa)", () => {
    const lead = makeLead({
      pipeline_stage: "qualified",
      priority: "high",
      next_contact_at: brtDate(NOW_BRT_YMD, "16:00"),
      last_contact_at: daysFromNow(-5),
      last_conversation_status:
        "Reunião realizada; ficou de avaliar com o marido",
      next_action: "Fazer follow-up sobre a decisão com o marido",
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("respond_now");
    expect(r.reasons.some((x) => /reunião realizada/i.test(x))).toBe(true);
  });

  test("Qualificado tentando agendar visita (sem reunião realizada) → call_today", () => {
    const lead = makeLead({
      pipeline_stage: "qualified",
      priority: "high",
      next_contact_at: daysFromNow(-6),
      last_contact_at: daysFromNow(-6),
      last_conversation_status: "Ficou de marcar uma visita à unidade com a sócia",
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("call_today");
    expect(r.dueLabel).toMatch(/atrasado há 6 dias/i);
  });

  test("Qualificado com retorno para 19/10 (futuro > 1 dia) → awaiting", () => {
    const lead = makeLead({
      pipeline_stage: "qualified",
      priority: "high",
      next_contact_at: daysFromNow(6),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("awaiting");
    expect(r.excludeFromActiveQueue).toBe(true);
    expect(r.tierLabel).toMatch(/aguardando até/i);
  });

  // ----------------------------------------------------------------
  // Telefone inválido / Conferir telefone
  // ----------------------------------------------------------------
  test("Telefone incompleto + lead ativo → tier verify_phone (sem WhatsApp)", () => {
    const lead = makeLead({
      phone: "+55 83 9648-8258",
      phone_normalized: null,
      pipeline_stage: "in_conversation",
      next_contact_at: brtDate(NOW_BRT_YMD, "16:00"),
      last_contact_at: daysFromNow(-5),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("verify_phone");
    expect(r.suggestedAction).toBe("validate_phone");
    expect(r.suggestedActionLabel).toBe("Conferir o telefone");
    expect(r.tierLabel).toBe(OPERATIONAL_TIER_LABELS.verify_phone);
    // waNumberFor retorna null quando phone_normalized é null.
    expect(waNumberFor(lead)).toBeNull();
  });

  test("Telefone null + stage ativo → verify_phone (José Costa / Faby)", () => {
    const lead = makeLead({
      phone: "+55 82 8807-0732",
      phone_normalized: null,
      pipeline_stage: "in_conversation",
      next_contact_at: daysFromNow(-5),
      last_contact_at: daysFromNow(-5),
      last_conversation_status: "Ficou de retornar e não voltou",
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("verify_phone");
    expect(r.suggestedActionLabel).toMatch(/conferir o telefone/i);
    expect(r.reasons.some((x) => /telefone/i.test(x))).toBe(true);
  });

  // ----------------------------------------------------------------
  // Parceria / fornecedor
  // ----------------------------------------------------------------
  test("Lead stage=new descrito como parceria/captação de pontos → deprioritize", () => {
    const lead = makeLead({
      pipeline_stage: "new",
      last_contact_at: daysFromNow(-5),
      last_conversation_status:
        "Trabalha com captação de pontos comerciais para franquias",
      notes: "Potencial parceiro para captação de pontos; não é candidato comum à franquia.",
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("deprioritize");
    expect(r.excludeFromActiveQueue).toBe(true);
    expect(r.suggestedAction).toBe("forward_to_expansion");
  });

  test("Lead stage=in_conversation descrito como fornecedor de camisetas → deprioritize", () => {
    const lead = makeLead({
      pipeline_stage: "in_conversation",
      last_conversation_status:
        "Entrou em contato para oferecer camisetas esportivas importadas",
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("deprioritize");
  });

  // ----------------------------------------------------------------
  // Doni — interesse do filho
  // ----------------------------------------------------------------
  test("Doni-like: next_action menciona 'interesse do filho' → ação específica", () => {
    const lead = makeLead({
      full_name: "Doni",
      pipeline_stage: "in_conversation",
      next_contact_at: brtDate(NOW_BRT_YMD, "16:00"),
      last_contact_at: daysFromNow(-4),
      last_conversation_status:
        "Perguntou o valor da franquia e informou que encaminharia a apresentação ao filho",
      next_action: "Retomar e confirmar o interesse do filho na franquia",
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.suggestedActionLabel).toBe("Confirmar interesse do filho");
  });

  // ----------------------------------------------------------------
  // Reativação
  // ----------------------------------------------------------------
  test("Pipeline no_response → tier reactivate", () => {
    const lead = makeLead({
      pipeline_stage: "no_response",
      last_contact_at: daysFromNow(-10),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("reactivate");
    expect(r.excludeFromActiveQueue).toBe(true);
  });

  test("contact_attempt sem retorno há 5 dias → reactivate", () => {
    const lead = makeLead({
      pipeline_stage: "contact_attempt",
      last_contact_at: daysFromNow(-5),
      last_conversation_status: "Visualizou e não respondeu",
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("reactivate");
    expect(r.suggestedAction).toBe("send_followup");
  });

  test("Fabio-like: contact_attempt 'não visualizou' + atraso → reactivate, não call_today", () => {
    // Último contato 16 dias atrás, next_contact_at atrasado 8 dias, mas
    // o status é 'não visualizou' e NÃO existe reunião/visita/sociedade:
    // atraso sozinho não deve mover o lead para 'Ligar hoje'.
    const lead = makeLead({
      full_name: "Fabio",
      pipeline_stage: "contact_attempt",
      last_contact_at: daysFromNow(-16),
      next_contact_at: daysFromNow(-8),
      last_conversation_status: "Não visualizou a última mensagem",
      next_action: "Reenviar mensagem em horário diferente",
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("reactivate");
    expect(r.suggestedAction).toBe("resend_other_time");
    // Ação sugerida deve ser follow-up/reenvio curto, nunca "Ligar agora".
    expect(r.suggestedActionLabel).not.toMatch(/ligar agora/i);
    // Fora da fila ativa (tiers 1-4).
    expect(r.excludeFromActiveQueue).toBe(true);
  });

  test("contact_attempt 'ficou de retornar e não retornou' + reunião pendente → mantém ativo", () => {
    // Guard positivo: um sinal cold ("não retornou") combinado com um
    // sinal hot explícito (reunião) NÃO deve rebaixar o lead.
    const lead = makeLead({
      pipeline_stage: "in_conversation",
      last_contact_at: daysFromNow(-3),
      next_contact_at: brtDate(NOW_BRT_YMD, "15:00"),
      last_conversation_status:
        "Ficou de retornar após a reunião para confirmar sociedade",
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("call_today");
  });

  test("contact_attempt com 'ok, obrigada' depois do convite → reactivate", () => {
    const lead = makeLead({
      pipeline_stage: "in_conversation",
      last_contact_at: daysFromNow(-6),
      next_contact_at: daysFromNow(-3),
      last_conversation_status:
        "Perguntou sobre unidade; convidada a avaliar franquia, respondeu 'Ok, obrigada'",
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("reactivate");
  });

  // ----------------------------------------------------------------
  // Score clamp
  // ----------------------------------------------------------------
  test("Pontuação sempre entre 0 e 100 (clamp)", () => {
    const hot = makeLead({
      pipeline_stage: "meeting_scheduled",
      priority: "high",
      next_contact_at: daysFromNow(-2),
      investment_range: "De R$ 700 mil a R$ 899 mil",
      start_timeline: "Até 3 meses",
      last_contact_at: daysFromNow(-1),
    });
    const rHot = calculateLeadIntelligence(hot, [], NOW);
    expect(rHot.score).toBeLessThanOrEqual(100);
    expect(rHot.score).toBeGreaterThanOrEqual(0);

    const cold = makeLead({
      phone: "99",
      phone_normalized: null,
      email: null,
      last_contact_at: daysFromNow(-30),
      investment_range: "Ainda estou estruturando o capital",
    });
    const rCold = calculateLeadIntelligence(cold, [], NOW);
    expect(rCold.score).toBeGreaterThanOrEqual(0);
    expect(rCold.score).toBeLessThanOrEqual(100);
  });

  // ----------------------------------------------------------------
  // Ordenação da fila
  // ----------------------------------------------------------------
  test("Fila ordena por tier (respond_now antes de call_today antes de follow_up)", () => {
    const respondNow = makeLead({
      id: "respondNow",
      full_name: "Reunião vencida",
      pipeline_stage: "meeting_scheduled",
      next_contact_at: daysFromNow(-2),
    });
    const callToday = makeLead({
      id: "callToday",
      full_name: "Hoje",
      pipeline_stage: "in_conversation",
      next_contact_at: brtDate(NOW_BRT_YMD, "15:00"),
      last_contact_at: daysFromNow(-1),
    });
    const followUp = makeLead({
      id: "followUp",
      full_name: "Amanhã",
      pipeline_stage: "in_conversation",
      next_contact_at: daysFromNow(1),
      last_contact_at: daysFromNow(-3),
    });
    const terminal = makeLead({
      id: "terminal",
      full_name: "Perdido",
      pipeline_stage: "lost",
      lost_reason: "Concorrente",
    });

    const queue = buildCallQueue(
      [callToday, followUp, respondNow, terminal],
      new Map(),
      NOW,
      5,
    );
    expect(queue.map((q) => q.lead.full_name)).not.toContain("Perdido");
    expect(queue[0].lead.full_name).toBe("Reunião vencida");
    expect(queue[1].lead.full_name).toBe("Hoje");
    expect(queue[2].lead.full_name).toBe("Amanhã");
  });

  test("Dentro do mesmo tier call_today: atraso maior vem antes", () => {
    const a: IntelligenceEnrichedLead = {
      lead: makeLead({
        id: "a",
        full_name: "A",
        pipeline_stage: "in_conversation",
        next_contact_at: daysFromNow(-5),
      }),
      intel: calculateLeadIntelligence(
        makeLead({
          id: "a",
          pipeline_stage: "in_conversation",
          next_contact_at: daysFromNow(-5),
        }),
        [],
        NOW,
      ),
    };
    const b: IntelligenceEnrichedLead = {
      lead: makeLead({
        id: "b",
        full_name: "B",
        pipeline_stage: "in_conversation",
        next_contact_at: daysFromNow(-2),
      }),
      intel: calculateLeadIntelligence(
        makeLead({
          id: "b",
          pipeline_stage: "in_conversation",
          next_contact_at: daysFromNow(-2),
        }),
        [],
        NOW,
      ),
    };
    const sorted = [b, a].sort(sortByOperationalPriority);
    expect(sorted[0].lead.id).toBe("a"); // atraso 5 > 2
  });

  test("Prioridade manual decide ordem só dentro do mesmo tier — nunca sobre leads mais quentes", () => {
    const quentePriorityNormal = makeLead({
      id: "quente",
      full_name: "Reunião vencida",
      pipeline_stage: "meeting_scheduled",
      priority: "normal",
      next_contact_at: daysFromNow(-2),
    });
    const frioPriorityHigh = makeLead({
      id: "frio",
      full_name: "Amanhã prioridade alta",
      pipeline_stage: "in_conversation",
      priority: "high",
      next_contact_at: daysFromNow(1),
      last_contact_at: daysFromNow(-2),
    });
    const queue = buildCallQueue(
      [frioPriorityHigh, quentePriorityNormal],
      new Map(),
      NOW,
      5,
    );
    expect(queue[0].lead.id).toBe("quente");
  });

  // ----------------------------------------------------------------
  // Alerts
  // ----------------------------------------------------------------
  test("computeAlerts separa 'Ações atrasadas' (tiers 1-4) de 'Sem retorno' (tier reactivate)", () => {
    const overdueCallToday = makeLead({
      id: "l1",
      pipeline_stage: "in_conversation",
      next_contact_at: daysFromNow(-5),
      last_contact_at: daysFromNow(-7),
    });
    const reactivate = makeLead({
      id: "l2",
      pipeline_stage: "no_response",
      last_contact_at: daysFromNow(-10),
    });
    const meetingNoOutcome = makeLead({
      id: "l3",
      pipeline_stage: "meeting_scheduled",
      next_contact_at: daysFromNow(-3),
    });
    const alerts = computeAlerts(
      [overdueCallToday, reactivate, meetingNoOutcome],
      new Map(),
      NOW,
    );
    // 'Ações atrasadas': overdueCallToday (atrasado 5d) + meeting (há 3d).
    expect(alerts.overdueContacts).toBe(2);
    // 'Sem retorno': só reactivate.
    expect(alerts.withoutReturn).toBe(1);
    // Reactivate não entra em overdueContacts.
    expect(alerts.overdueContacts).not.toBe(3);
    expect(alerts.meetingsWithoutOutcome).toBe(1);
  });

  test("computeAlerts.phonesToConfirm conta phone_normalized null + phone presente", () => {
    const l1 = makeLead({
      phone: "+55 83 9648-8258",
      phone_normalized: null,
      pipeline_stage: "in_conversation",
    });
    const alerts = computeAlerts([l1], new Map(), NOW);
    expect(alerts.phonesToConfirm).toBe(1);
  });

  // ----------------------------------------------------------------
  // Datas BRT
  // ----------------------------------------------------------------
  test("23:30 UTC = 20:30 BRT ainda hoje → call_today", () => {
    const lead = makeLead({
      pipeline_stage: "in_conversation",
      next_contact_at: `${NOW_BRT_YMD}T23:30:00.000Z`,
      last_contact_at: daysFromNow(-1),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("call_today");
    expect(r.dueLabel).toBe("Hoje");
  });

  test("00:30 UTC do dia seguinte = 21:30 BRT ainda hoje → call_today", () => {
    const [y, m, d] = NOW_BRT_YMD.split("-").map(Number);
    const iso = new Date(Date.UTC(y, m - 1, d + 1, 0, 30, 0)).toISOString();
    const lead = makeLead({
      pipeline_stage: "in_conversation",
      next_contact_at: iso,
      last_contact_at: daysFromNow(-1),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.operationalTier).toBe("call_today");
  });

  // ----------------------------------------------------------------
  // waNumberFor
  // ----------------------------------------------------------------
  test("WhatsApp number — só dígitos", () => {
    const lead = makeLead({ phone_normalized: "+5519997555366" });
    expect(waNumberFor(lead)).toBe("5519997555366");
  });

  test("WhatsApp number null quando phone_normalized é null", () => {
    expect(waNumberFor(makeLead({ phone: "9648-8258", phone_normalized: null }))).toBeNull();
  });

  // ----------------------------------------------------------------
  // SuggestedActionLabel fallback para next_action
  // ----------------------------------------------------------------
  test("SuggestedActionLabel usa next_action quando específico (tier ativo)", () => {
    const lead = makeLead({
      pipeline_stage: "qualified",
      priority: "high",
      next_contact_at: brtDate(NOW_BRT_YMD, "16:00"),
      last_contact_at: daysFromNow(-1),
      next_action: "Pedir confirmação da reunião e enviar COF",
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.suggestedActionLabel).toBe("Pedir confirmação da reunião e enviar COF");
    // suggestedAction (enum) permanece o canônico — label é só a frase.
    expect(r.suggestedAction).toBe("call_now");
  });

  test("SuggestedActionLabel usa label canônico quando next_action é vazio", () => {
    const lead = makeLead({
      pipeline_stage: "qualified",
      next_contact_at: brtDate(NOW_BRT_YMD, "16:00"),
      last_contact_at: daysFromNow(-1),
      next_action: null,
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.suggestedActionLabel).toBe(SUGGESTED_ACTION_LABELS.call_now);
  });
});
