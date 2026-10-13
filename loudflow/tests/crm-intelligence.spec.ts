import { test, expect } from "@playwright/test";
import {
  calculateLeadIntelligence,
  sortByOperationalPriority,
  buildCallQueue,
  computeAlerts,
  waNumberFor,
  WEIGHTS,
  SUGGESTED_ACTION_LABELS,
  type IntelligenceEnrichedLead,
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
// Fixado em 2026-10-13 12:00 BRT (= 15:00 UTC). Esta data é o "hoje" para a
// equipe no momento desta primeira versão do CRM. Troca aqui propaga para
// todos os testes.
// ============================================================================

const NOW_BRT_YMD = "2026-10-13";
const NOW = new Date("2026-10-13T15:00:00.000Z"); // 12:00 BRT

// ---------- helpers de BRT → ISO UTC ----------

function brtDate(ymd: string, hhmm = "12:00"): string {
  // BRT (UTC-3) sem horário de verão: hhmm BRT + 3h = UTC.
  const [y, m, d] = ymd.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, h + 3, mi, 0)).toISOString();
}

function daysFromNow(days: number): string {
  // days > 0 = futuro; days < 0 = passado. Base: NOW em dia BRT.
  const [y, m, d] = NOW_BRT_YMD.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d + days);
  // Fixa em 12:00 BRT (15:00 UTC)
  return new Date(base + 15 * 3600 * 1000).toISOString();
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

test.describe("CRM lead intelligence", () => {
  test("1. Reunião passada sem resultado — crítico + registrar resultado", () => {
    const lead = makeLead({
      pipeline_stage: "meeting_scheduled",
      priority: "high",
      next_contact_at: daysFromNow(-4),
      last_contact_at: daysFromNow(-5),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.attentionLevel).toBe("critical");
    expect(r.suggestedAction).toBe("record_meeting_outcome");
    expect(r.suggestedActionLabel).toBe(
      SUGGESTED_ACTION_LABELS.record_meeting_outcome,
    );
    expect(r.dueLabel).toContain("Reunião há 4 dias");
    expect(r.reasons.some((x) => /falta registrar o resultado/i.test(x))).toBe(
      true,
    );
    expect(r.excludeFromActiveQueue).toBe(false);
  });

  test("2. Reunião futura — hoje + confirmar reunião", () => {
    const lead = makeLead({
      pipeline_stage: "meeting_scheduled",
      next_contact_at: daysFromNow(3),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    // Reunião futura entra em "soon" se não for amanhã nem hoje; mas a flag
    // interna já definiu suggestedAction=confirm_meeting.
    expect(["soon", "none"]).toContain(r.attentionLevel);
    expect(r.suggestedAction).toBe("confirm_meeting");
  });

  test("3. Próximo contato HOJE — attention=today, score inclui +20", () => {
    const lead = makeLead({
      pipeline_stage: "in_conversation",
      next_contact_at: brtDate(NOW_BRT_YMD, "16:00"),
      last_contact_at: daysFromNow(-1),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.attentionLevel).toBe("today");
    expect(r.suggestedAction).toBe("call_now");
    expect(r.dueLabel).toBe("Hoje");
    expect(r.score).toBeGreaterThanOrEqual(WEIGHTS.nextContactToday);
  });

  test("4. Próximo contato VENCIDO há 4 dias — crítico, call_now, score contempla +25", () => {
    const lead = makeLead({
      pipeline_stage: "in_conversation",
      next_contact_at: daysFromNow(-4),
      last_contact_at: daysFromNow(-5),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.attentionLevel).toBe("critical");
    expect(r.suggestedAction).toBe("call_now");
    expect(r.dueLabel).toBe("Atrasado há 4 dias");
    // overdue bonus (+25) + inConversation (+10) = 35; mas cap 0..100.
    expect(r.score).toBeGreaterThanOrEqual(WEIGHTS.nextContactOverdue);
  });

  test("5. Qualificado sem reunião — crítico, schedule_meeting", () => {
    const lead = makeLead({
      pipeline_stage: "qualified",
      priority: "high",
      next_contact_at: null,
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.attentionLevel).toBe("critical"); // qualified sem next_contact
    expect(r.suggestedAction).toBe("schedule_meeting");
  });

  test("6. Lead novo sem contato — crítico, whatsapp_reconnect", () => {
    const lead = makeLead({ pipeline_stage: "new" });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.attentionLevel).toBe("critical");
    expect(r.suggestedAction).toBe("whatsapp_reconnect");
    expect(r.reasons.some((x) => /lead novo/i.test(x))).toBe(true);
  });

  test("7. Sem retorno há > 7 dias — monitor, score reduzido", () => {
    const lead = makeLead({
      pipeline_stage: "no_response",
      last_contact_at: daysFromNow(-10),
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.attentionLevel).toBe("monitor");
    // Com apenas penalidade -10 (noResponse7d), score 0 após clamp.
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.reasons.some((x) => /sem resposta há 10/i.test(x))).toBe(true);
  });

  test("8. Sem retorno há > 14 dias — penalidade -20 e temperature cold", () => {
    const lead = makeLead({
      pipeline_stage: "no_response",
      last_contact_at: daysFromNow(-20),
      investment_range: "Ainda estou estruturando o capital",
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.temperature).toBe("cold");
    expect(r.reasons.some((x) => /sem resposta há 20/i.test(x))).toBe(true);
    expect(r.score).toBe(0); // clamp aplicado
  });

  test("9. Telefone incompleto — valida_phone + reason + penalidade", () => {
    const lead = makeLead({
      phone: "+55 83 9648-8258",
      phone_normalized: null,
      pipeline_stage: "in_conversation",
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.suggestedAction).toBe("validate_phone");
    expect(r.reasons.some((x) => /telefone precisa/i.test(x))).toBe(true);
  });

  test("10. Lead perdido fora da fila ativa", () => {
    const lead = makeLead({
      pipeline_stage: "lost",
      lost_reason: "Concorrente",
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.excludeFromActiveQueue).toBe(true);
    expect(r.suggestedAction).toBe("history_only");
    expect(r.attentionLevel).toBe("none");
    expect(r.score).toBe(0);
  });

  test("11. Lead convertido fora da fila ativa", () => {
    const lead = makeLead({ pipeline_stage: "won" });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.excludeFromActiveQueue).toBe(true);
    expect(r.suggestedAction).toBe("history_only");
  });

  test("12. Lead desqualificado fora da fila ativa", () => {
    const lead = makeLead({ pipeline_stage: "disqualified" });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.excludeFromActiveQueue).toBe(true);
    expect(r.suggestedAction).toBe("history_only");
  });

  test("13. Pontuação sempre entre 0 e 100 (clamp)", () => {
    // Lead extremamente positivo
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

    // Lead extremamente negativo
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

  test("14. Fila ordena crítico → reunião vencida → mais atrasado → score", () => {
    const now = NOW;
    const l1 = makeLead({
      id: "l1",
      full_name: "Normal em breve",
      pipeline_stage: "in_conversation",
      next_contact_at: daysFromNow(1),
      last_contact_at: daysFromNow(-3),
    });
    const l2 = makeLead({
      id: "l2",
      full_name: "Reunião vencida",
      pipeline_stage: "meeting_scheduled",
      next_contact_at: daysFromNow(-2),
      last_contact_at: daysFromNow(-3),
    });
    const l3 = makeLead({
      id: "l3",
      full_name: "Qualificado hoje",
      pipeline_stage: "qualified",
      next_contact_at: brtDate(NOW_BRT_YMD, "15:00"),
      last_contact_at: daysFromNow(-1),
    });
    const l4 = makeLead({
      id: "l4",
      full_name: "Perdido",
      pipeline_stage: "lost",
      lost_reason: "Concorrente",
    });

    const activities = new Map<string, FranchiseLeadActivity[]>();
    const queue = buildCallQueue([l1, l2, l3, l4], activities, now, 5);
    // L4 excluído.
    expect(queue.map((q) => q.lead.full_name)).not.toContain("Perdido");
    // L2 (crítico reunião vencida) deve vir antes.
    expect(queue[0]?.lead.full_name).toBe("Reunião vencida");
  });

  test("15. Datas respeitam America/Sao_Paulo — virada de dia 23:30 UTC = 20:30 BRT (hoje)", () => {
    // next_contact às 23:30 UTC do dia NOW. BRT isso é 20:30 do mesmo dia.
    const lead = makeLead({
      pipeline_stage: "in_conversation",
      next_contact_at: `${NOW_BRT_YMD}T23:30:00.000Z`,
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.attentionLevel).toBe("today");
    expect(r.dueLabel).toBe("Hoje");
  });

  test("15b. Datas BRT — 00:30 UTC do dia seguinte = 21:30 BRT dia atual (hoje)", () => {
    // Para instant 2026-10-14T00:30:00Z = 2026-10-13T21:30 BRT → ainda hoje.
    const [y, m, d] = NOW_BRT_YMD.split("-").map(Number);
    const iso = new Date(Date.UTC(y, m - 1, d + 1, 0, 30, 0)).toISOString();
    const lead = makeLead({
      pipeline_stage: "in_conversation",
      next_contact_at: iso,
    });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.attentionLevel).toBe("today");
  });

  test("Reunião passada COM resultado registrado — não é mais crítica", () => {
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

  test("WhatsApp number — só digits, sem sinal de mais", () => {
    const lead = makeLead({ phone_normalized: "+5519997555366" });
    const r = calculateLeadIntelligence(lead, [], NOW);
    expect(r.excludeFromActiveQueue).toBe(false);
    // Confirmação via função dedicada.
    expect(waNumberFor(lead)).toBe("5519997555366");
  });

  test("computeAlerts — contadores básicos", () => {
    const l1 = makeLead({
      id: "l1",
      pipeline_stage: "meeting_scheduled",
      next_contact_at: daysFromNow(-3),
    });
    const l2 = makeLead({
      id: "l2",
      pipeline_stage: "in_conversation",
      next_contact_at: daysFromNow(-5),
      last_contact_at: daysFromNow(-7),
    });
    const l3 = makeLead({
      id: "l3",
      pipeline_stage: "new",
    });
    const l4 = makeLead({
      id: "l4",
      pipeline_stage: "in_conversation",
      phone: "+55 83 9648-8258",
      phone_normalized: null,
    });
    const l5 = makeLead({
      id: "l5",
      pipeline_stage: "lost",
      lost_reason: "Concorrente",
    });
    const activities = new Map<string, FranchiseLeadActivity[]>();
    const alerts = computeAlerts([l1, l2, l3, l4, l5], activities, NOW);
    expect(alerts.meetingsWithoutOutcome).toBeGreaterThanOrEqual(1);
    expect(alerts.overdueContacts).toBeGreaterThanOrEqual(2);
    expect(alerts.newLeadsWithoutContact).toBe(1);
    expect(alerts.phonesToConfirm).toBe(1);
    expect(alerts.leadsWithoutNextAction).toBeGreaterThanOrEqual(1);
  });

  test("sortByOperationalPriority é estável para empates por nome/data", () => {
    const l1: IntelligenceEnrichedLead = {
      lead: makeLead({ id: "a", full_name: "Lead A", last_contact_at: daysFromNow(-5) }),
      intel: {
        score: 10,
        temperature: "warm",
        attentionLevel: "soon",
        reasons: ["x"],
        suggestedAction: "send_followup",
        suggestedActionLabel: SUGGESTED_ACTION_LABELS.send_followup,
        dueLabel: null,
        excludeFromActiveQueue: false,
      },
    };
    const l2: IntelligenceEnrichedLead = {
      lead: makeLead({ id: "b", full_name: "Lead B", last_contact_at: daysFromNow(-10) }),
      intel: { ...l1.intel },
    };
    const r = [l1, l2].sort(sortByOperationalPriority);
    expect(r[0].lead.id).toBe("b"); // contato mais antigo primeiro
  });
});
