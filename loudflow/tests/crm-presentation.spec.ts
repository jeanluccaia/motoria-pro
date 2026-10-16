// Testes da camada de apresentação do CRM.
//
// A camada SOMENTE traduz os resultados já calculados pela inteligência
// para o que a UI precisa (ícone, cor, label, agrupamento). Qualquer
// desvio nesse contrato é um bug — a inteligência operacional continua
// sendo a única fonte de verdade.

import { test, expect } from "@playwright/test";
import {
  calculateLeadIntelligence,
  sortByOperationalPriority,
} from "../src/lib/crm/intelligence";
import {
  getLeadPresentation,
  groupOrderedLeads,
  countsFromBuckets,
  groupForTier,
  isWhatsAppPrimary,
  phoneState,
  shortActionLabel,
  LEAD_GROUP_LABELS,
  type LeadGroup,
} from "../src/lib/crm/presentation";
import type {
  FranchiseLead,
  FranchiseLeadStage,
  FranchiseLeadPriority,
} from "../src/lib/supabase/types";

const NOW_BRT_YMD = "2026-10-16";
const NOW = new Date("2026-10-16T15:00:00.000Z");

function brtDate(ymd: string, hhmm = "12:00"): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, h + 3, mi, 0)).toISOString();
}

function daysFromNow(days: number): string {
  const [y, m, d] = NOW_BRT_YMD.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days, 15, 0, 0)).toISOString();
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

function present(lead: FranchiseLead) {
  const intel = calculateLeadIntelligence(lead, [], NOW);
  const presentation = getLeadPresentation(lead, intel);
  return { intel, presentation };
}

test.describe("Apresentação — agrupamento 8 → 4 abas", () => {
  test("respond_now, call_today, follow_up e verify_phone caem em 'Agir agora'", () => {
    expect(groupForTier("respond_now")).toBe("act_now");
    expect(groupForTier("call_today")).toBe("act_now");
    expect(groupForTier("follow_up")).toBe("act_now");
    expect(groupForTier("verify_phone")).toBe("act_now");
  });

  test("reactivate → 'Reativar'", () => {
    expect(groupForTier("reactivate")).toBe("reactivate");
  });

  test("awaiting → 'Aguardando'", () => {
    expect(groupForTier("awaiting")).toBe("awaiting");
  });

  test("deprioritize → 'Histórico' com selo próprio", () => {
    const lead = makeLead({
      pipeline_stage: "in_conversation",
      last_contact_at: daysFromNow(-3),
      last_conversation_status:
        "Entrou em contato para oferecer camisetas esportivas importadas",
    });
    const { presentation } = present(lead);
    expect(presentation.group).toBe("history" satisfies LeadGroup);
    expect(presentation.historyBadge).toBe("deprioritize");
    expect(presentation.tierLabel).toBe("Não priorizar");
  });

  test("terminal → 'Histórico'", () => {
    expect(groupForTier("terminal")).toBe("history");
    const lead = makeLead({ pipeline_stage: "lost", lost_reason: "Concorrente" });
    const { presentation } = present(lead);
    expect(presentation.group).toBe("history");
    expect(presentation.historyBadge).toBe("terminal");
  });

  test("labels pt-BR das abas estão corretos", () => {
    expect(LEAD_GROUP_LABELS.act_now).toBe("Agir agora");
    expect(LEAD_GROUP_LABELS.reactivate).toBe("Reativar");
    expect(LEAD_GROUP_LABELS.awaiting).toBe("Aguardando");
    expect(LEAD_GROUP_LABELS.history).toBe("Histórico");
  });
});

test.describe("Apresentação — WhatsApp e telefone", () => {
  test("ação principal já é WhatsApp → não duplica como secundário", () => {
    const lead = makeLead({
      pipeline_stage: "contact_attempt",
      last_contact_at: daysFromNow(-5),
      last_conversation_status: "Não visualizou a última mensagem",
    });
    const { intel, presentation } = present(lead);
    expect(isWhatsAppPrimary(intel.suggestedAction)).toBe(true);
    expect(presentation.phone.primaryIsWhatsApp).toBe(true);
    expect(presentation.phone.canUseWhatsAppSecondary).toBe(false);
  });

  test("ação principal NÃO-WA + telefone válido → WhatsApp como secundário", () => {
    const lead = makeLead({
      pipeline_stage: "qualified",
      priority: "high",
      next_contact_at: brtDate(NOW_BRT_YMD, "16:00"),
      last_contact_at: daysFromNow(-1),
      last_conversation_status: "Ficou de marcar uma visita à unidade com a sócia",
    });
    const { intel, presentation } = present(lead);
    expect(intel.suggestedAction).toBe("call_now");
    expect(presentation.phone.state).toBe("valid");
    expect(presentation.phone.canUseWhatsAppSecondary).toBe(true);
    expect(presentation.phone.waHref).toContain("https://wa.me/");
  });

  test("telefone incompleto → sem WhatsApp e sem ligação primária", () => {
    const lead = makeLead({
      phone: "+55 83 9648-8258",
      phone_normalized: null,
      pipeline_stage: "in_conversation",
      next_contact_at: daysFromNow(-3),
      last_contact_at: daysFromNow(-5),
    });
    const { intel, presentation } = present(lead);
    expect(intel.operationalTier).toBe("verify_phone");
    expect(phoneState(lead)).toBe("incomplete");
    expect(presentation.phone.waHref).toBeNull();
    expect(presentation.phone.canUseWhatsAppSecondary).toBe(false);
    // A ação primária continua existindo (Conferir telefone), mas nunca é WA.
    expect(presentation.action.kind).toBe("validate_phone");
    expect(presentation.action.label).toMatch(/conferir o telefone/i);
  });

  test("telefone ausente → sem WhatsApp", () => {
    const lead = makeLead({
      phone: null,
      phone_normalized: null,
      email: "x@y.com",
      pipeline_stage: "qualified",
      priority: "high",
      next_contact_at: brtDate(NOW_BRT_YMD, "16:00"),
      last_contact_at: daysFromNow(-1),
      last_conversation_status: "Na reunião com Diego, conversaram sobre sociedade",
    });
    const { presentation } = present(lead);
    expect(phoneState(lead)).toBe("missing");
    expect(presentation.phone.waHref).toBeNull();
    expect(presentation.phone.canUseWhatsAppSecondary).toBe(false);
  });
});

test.describe("Apresentação — ações primárias por grupo", () => {
  test("awaiting não tem ação primária clicável (sem antecipar)", () => {
    const lead = makeLead({
      pipeline_stage: "qualified",
      priority: "high",
      next_contact_at: daysFromNow(5),
      last_contact_at: daysFromNow(-2),
    });
    const { presentation } = present(lead);
    expect(presentation.group).toBe("awaiting");
    expect(presentation.action.primary).toBe(false);
    expect(presentation.statusLabel).toMatch(/aguardando até/i);
  });

  test("deprioritize (fornecedor) não tem ação comercial principal", () => {
    const lead = makeLead({
      pipeline_stage: "in_conversation",
      last_contact_at: daysFromNow(-3),
      last_conversation_status:
        "Trabalha com captação de pontos comerciais para franquias",
    });
    const { presentation } = present(lead);
    expect(presentation.group).toBe("history");
    expect(presentation.historyBadge).toBe("deprioritize");
    expect(presentation.action.primary).toBe(false);
  });

  test("terminal (lost real) não tem ação comercial principal", () => {
    const lead = makeLead({ pipeline_stage: "lost", lost_reason: "Concorrente" });
    const { presentation } = present(lead);
    expect(presentation.action.primary).toBe(false);
  });

  test("respond_now / call_today / follow_up / verify_phone têm ação primária", () => {
    for (const lead of [
      makeLead({ pipeline_stage: "new", received_at: new Date(NOW.getTime() - 10 * 60 * 1000).toISOString() }),
      makeLead({ pipeline_stage: "in_conversation", next_contact_at: brtDate(NOW_BRT_YMD, "16:00"), last_contact_at: daysFromNow(-1) }),
      makeLead({ pipeline_stage: "in_conversation", next_contact_at: daysFromNow(1), last_contact_at: daysFromNow(-1) }),
      makeLead({ phone: "+55 83 9648-8258", phone_normalized: null, pipeline_stage: "in_conversation", next_contact_at: daysFromNow(-2) }),
    ]) {
      const { presentation } = present(lead);
      expect(presentation.action.primary).toBe(true);
    }
  });
});

test.describe("Apresentação — groupOrderedLeads preserva a ordem canônica", () => {
  test("ordem dentro das abas = ordem produzida pelo sortByOperationalPriority", () => {
    const leads = [
      makeLead({ id: "L1", full_name: "L1 — call hoje", pipeline_stage: "in_conversation", next_contact_at: brtDate(NOW_BRT_YMD, "15:00"), last_contact_at: daysFromNow(-1) }),
      makeLead({ id: "L2", full_name: "L2 — respond now (reunião realizada)", pipeline_stage: "qualified", priority: "high", next_contact_at: brtDate(NOW_BRT_YMD, "15:00"), last_contact_at: daysFromNow(-3), last_conversation_status: "Reunião realizada; vai pensar" }),
      makeLead({ id: "L3", full_name: "L3 — reactivate", pipeline_stage: "contact_attempt", last_contact_at: daysFromNow(-10), last_conversation_status: "Visualizou e não respondeu" }),
      makeLead({ id: "L4", full_name: "L4 — awaiting", pipeline_stage: "qualified", priority: "high", next_contact_at: daysFromNow(6), last_contact_at: daysFromNow(-1) }),
      makeLead({ id: "L5", full_name: "L5 — lost", pipeline_stage: "lost", lost_reason: "Concorrente" }),
    ];
    const enriched = leads
      .map((lead) => ({ lead, intel: calculateLeadIntelligence(lead, [], NOW) }))
      .sort(sortByOperationalPriority);
    const buckets = groupOrderedLeads(enriched);

    expect(buckets.act_now.map((e) => e.lead.id)).toEqual(["L2", "L1"]);
    expect(buckets.reactivate.map((e) => e.lead.id)).toEqual(["L3"]);
    expect(buckets.awaiting.map((e) => e.lead.id)).toEqual(["L4"]);
    expect(buckets.history.map((e) => e.lead.id)).toEqual(["L5"]);

    const counts = countsFromBuckets(buckets);
    expect(counts).toEqual({ act_now: 2, reactivate: 1, awaiting: 1, history: 1 });
  });
});

test.describe("Apresentação — CTA curto do botão primário", () => {
  test("shortActionLabel mapeia ações WhatsApp para 'Chamar no WhatsApp'", () => {
    expect(shortActionLabel("whatsapp_reconnect")).toBe("Chamar no WhatsApp");
    expect(shortActionLabel("send_followup")).toBe("Chamar no WhatsApp");
    expect(shortActionLabel("resend_other_time")).toBe("Chamar no WhatsApp");
    expect(shortActionLabel("answer_new_lead")).toBe("Chamar no WhatsApp");
  });

  test("shortActionLabel: call_now → 'Ligar agora'; validate_phone → 'Conferir telefone'", () => {
    expect(shortActionLabel("call_now")).toBe("Ligar agora");
    expect(shortActionLabel("validate_phone")).toBe("Conferir telefone");
  });

  test("shortActionLabel: ações de reunião/agendamento → 'Registrar contato'", () => {
    expect(shortActionLabel("record_meeting_outcome")).toBe("Registrar contato");
    expect(shortActionLabel("confirm_meeting")).toBe("Registrar contato");
    expect(shortActionLabel("schedule_meeting")).toBe("Registrar contato");
    expect(shortActionLabel("confirm_visit")).toBe("Registrar contato");
  });

  test("shortActionLabel: forward_to_expansion → 'Encaminhar'", () => {
    expect(shortActionLabel("forward_to_expansion")).toBe("Encaminhar");
  });

  test("shortActionLabel: terminais/aguardando → 'Aguardar' ou 'Ver detalhes'", () => {
    expect(shortActionLabel("wait_until_scheduled")).toBe("Aguardar");
    expect(shortActionLabel("history_only")).toBe("Ver detalhes");
  });

  test("buttonLabel sempre tem ≤ 24 caracteres (cabe no CTA sem truncate)", () => {
    const actions = [
      "whatsapp_reconnect",
      "send_followup",
      "resend_other_time",
      "call_now",
      "validate_phone",
      "record_meeting_outcome",
      "confirm_meeting",
      "schedule_meeting",
      "confirm_visit",
      "answer_new_lead",
      "forward_to_expansion",
      "wait_until_scheduled",
      "history_only",
    ] as const;
    for (const a of actions) {
      expect(shortActionLabel(a).length).toBeLessThanOrEqual(24);
    }
  });

  test("presentation.action.buttonLabel reflete shortActionLabel", () => {
    const lead = makeLead({
      pipeline_stage: "qualified",
      priority: "high",
      next_contact_at: brtDate(NOW_BRT_YMD, "16:00"),
      last_contact_at: daysFromNow(-1),
      last_conversation_status: "Ficou de marcar uma visita à unidade com a sócia",
      next_action: "Chamar e agendar a visita com a sócia",
    });
    const { intel, presentation } = present(lead);
    expect(intel.suggestedAction).toBe("call_now");
    expect(presentation.action.buttonLabel).toBe("Ligar agora");
    // A instrução LONGA (vinda do next_action) continua acessível em action.label
    expect(presentation.action.label).toBe("Chamar e agendar a visita com a sócia");
  });
});

test.describe("Apresentação — reason e statusLabel", () => {
  test("reason usa o primeiro motivo da inteligência quando existe", () => {
    const lead = makeLead({
      pipeline_stage: "qualified",
      priority: "high",
      next_contact_at: brtDate(NOW_BRT_YMD, "16:00"),
      last_contact_at: daysFromNow(-1),
      last_conversation_status: "Reunião realizada; ficou de pensar",
    });
    const { intel, presentation } = present(lead);
    expect(presentation.reason).toBe(intel.reasons[0]);
  });

  test("statusLabel para awaiting embute a data", () => {
    const lead = makeLead({
      pipeline_stage: "qualified",
      priority: "high",
      next_contact_at: daysFromNow(3),
      last_contact_at: daysFromNow(-1),
    });
    const { presentation } = present(lead);
    expect(presentation.statusLabel).toMatch(/aguardando até/i);
  });

  test("city permanece null — não extraímos de texto livre", () => {
    const lead = makeLead({
      pipeline_stage: "qualified",
      notes: "Interessada em abrir uma unidade em Campinas ou região.",
    });
    const { presentation } = present(lead);
    expect(presentation.city).toBeNull();
  });
});
