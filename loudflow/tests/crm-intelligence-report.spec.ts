// Relatório opcional: roda a lógica de inteligência sobre os 20 leads
// canônicos do seed e imprime um ranking legível + 4 cenários sintéticos.
//
// NÃO altera dados, não bate em banco. É um diagnóstico determinístico que
// usamos para revisar a classificação quando mexemos nos pesos ou tiers.
//
// Rodar: `NO_WEBSERVER=1 npx playwright test tests/crm-intelligence-report.spec.ts`

import { test } from "@playwright/test";
import {
  calculateLeadIntelligence,
  buildCallQueue,
  computeAlerts,
  sortByOperationalPriority,
  type OperationalTier,
} from "../src/lib/crm/intelligence";
import type {
  FranchiseLead,
  FranchiseLeadStage,
  FranchiseLeadPriority,
} from "../src/lib/supabase/types";

const NOW_BRT_YMD = "2026-10-16";
const NOW = new Date("2026-10-16T15:00:00.000Z"); // 12:00 BRT

function brtDateToIso(ymd: string | null): string | null {
  if (!ymd) return null;
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), 15, 0, 0)).toISOString();
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D+/g, "");
  if (!digits) return null;
  let national = digits;
  if ((national.length === 12 || national.length === 13) && national.startsWith("55")) {
    national = national.slice(2);
  }
  if (national.length === 10 || national.length === 11) {
    return `+55${national}`;
  }
  return null;
}

type SeedLead = {
  full_name: string;
  phone: string | null;
  phone_incomplete?: boolean;
  email?: string;
  received_at?: string | null;
  last_contact_at: string | null;
  next_contact_at: string | null;
  last_conversation_status?: string;
  pipeline_stage: FranchiseLeadStage;
  priority: FranchiseLeadPriority;
  next_action?: string | null;
  source?: string;
  investment_range?: string;
  start_timeline?: string;
  whatsapp_label?: string;
  notes?: string;
  lost_reason?: string;
};

const SEED: SeedLead[] = [
  { full_name: "Camilla Kojima Moura", phone: "+5512992340351", email: "camillasouzakojima@gmail.com", last_contact_at: brtDateToIso("2026-09-16"), next_contact_at: brtDateToIso("2026-10-08"), last_conversation_status: "Não respondeu após o último contato", pipeline_stage: "no_response", priority: "normal", next_action: "Fazer nova tentativa de contato", investment_range: "Ainda estou estruturando o capital", start_timeline: "Até 3 meses", source: "meta_instant_form" },
  { full_name: "Robert Moura", phone: "+5519982550494", email: "mourarobert21@gmail.com", last_contact_at: brtDateToIso("2026-09-18"), next_contact_at: brtDateToIso("2026-10-08"), last_conversation_status: "Não respondeu; buscava uma rede com recursos de financiamento", pipeline_stage: "no_response", priority: "normal", next_action: "Retomar e entender a necessidade de financiamento", investment_range: "Ainda estou estruturando o capital", start_timeline: "Até 3 meses", source: "meta_instant_form" },
  { full_name: "Sergio Maraca", phone: "+5561985283836", email: "sergiogeronto@gmail.com", last_contact_at: brtDateToIso("2026-09-21"), next_contact_at: null, last_conversation_status: "Informou que já fechou com uma concorrente", pipeline_stage: "lost", priority: "low", next_action: "Sem ação comercial; manter histórico", investment_range: "De R$ 700 mil a R$ 899 mil", start_timeline: "Até 3 meses", source: "meta_instant_form", lost_reason: "Concorrente" },
  { full_name: "Fabio", phone: "+5519996464563", whatsapp_label: "~renovacorretora372", last_contact_at: brtDateToIso("2026-09-30"), next_contact_at: brtDateToIso("2026-10-08"), last_conversation_status: "Não visualizou a última mensagem", pipeline_stage: "contact_attempt", priority: "normal", next_action: "Reenviar mensagem em horário diferente", source: "meta_whatsapp" },
  { full_name: "Léo Nogueira", phone: "+5519991767918", whatsapp_label: "~Tribos Gym - Léo Nogueira", last_contact_at: brtDateToIso("2026-10-01"), next_contact_at: brtDateToIso("2026-10-08"), last_conversation_status: "Visualizou e não respondeu", pipeline_stage: "no_response", priority: "normal", next_action: "Enviar follow-up curto", source: "meta_whatsapp" },
  { full_name: "José Costa", phone: "+55 83 9648-8258", phone_incomplete: true, whatsapp_label: "~José Costa", last_contact_at: brtDateToIso("2026-10-04"), next_contact_at: brtDateToIso("2026-10-08"), last_conversation_status: "Ficou de entrar em contato e não retornou", pipeline_stage: "in_conversation", priority: "normal", next_action: "Cobrar retorno e confirmar o número de telefone", notes: "Conferir o telefone antes do contato — o número parece estar incompleto.", source: "meta_whatsapp" },
  { full_name: "Aramys Raposo", phone: "+5515981125251", whatsapp_label: "~Aramys Raposo", last_contact_at: brtDateToIso("2026-10-07"), next_contact_at: brtDateToIso("2026-10-07"), last_conversation_status: "Ficou de marcar uma visita à unidade com a sócia", pipeline_stage: "qualified", priority: "high", next_action: "Chamar e agendar a visita com a sócia", notes: "Lead importante — aguardando visita com a sócia.", source: "meta_whatsapp" },
  { full_name: "Frank Miguel", phone: "+5519997555366", whatsapp_label: "FRANK MIGUEL", last_contact_at: brtDateToIso("2026-10-07"), next_contact_at: brtDateToIso("2026-10-07"), last_conversation_status: "Interessado; ainda não confirmou a reunião", pipeline_stage: "qualified", priority: "high", next_action: "Pedir confirmação da reunião", source: "meta_whatsapp" },
  { full_name: "Ahmad Lakis Rosa", phone: "+5511915583591", last_contact_at: brtDateToIso("2026-10-07"), next_contact_at: null, last_conversation_status: "Participou da reunião apenas para propor parceria com máquinas de bebidas", pipeline_stage: "lost", priority: "low", next_action: "Sem ação de franquia; encaminhar ao responsável por parcerias", notes: "Contato comercial/parceiro, não lead de franquia.", source: "meta_whatsapp", lost_reason: "Parceria comercial — não busca franquia" },
  { full_name: "Luana Gavioli dos Santos", phone: "+5519993933215", email: "luanagaviolidossantos@yahoo.com.br", whatsapp_label: "Luana", last_contact_at: brtDateToIso("2026-10-08"), next_contact_at: brtDateToIso("2026-10-13"), last_conversation_status: "Reunião realizada; ficou de avaliar a oportunidade com o marido", pipeline_stage: "qualified", priority: "high", next_action: "Fazer follow-up sobre a decisão com o marido", notes: "Interessada em abrir uma unidade em Campinas ou região.", source: "meta_whatsapp" },
  { full_name: "Neto", phone: "+5511987972974", last_contact_at: brtDateToIso("2026-10-08"), next_contact_at: brtDateToIso("2026-10-13"), last_conversation_status: "Trabalha com captação de pontos comerciais para franquias e perguntou com quem deve conversar", pipeline_stage: "new", priority: "normal", next_action: "Responder e encaminhar ao responsável por expansão", notes: "Potencial parceiro para captação de pontos; não é candidato comum à franquia.", source: "manual" },
  { full_name: "Faby", phone: "+55 82 8807-0732", phone_incomplete: true, whatsapp_label: "~Faby", last_contact_at: brtDateToIso("2026-10-08"), next_contact_at: brtDateToIso("2026-10-13"), last_conversation_status: "Perguntou sobre unidade em Sumaré; ao ser questionada sobre abrir uma unidade, respondeu apenas 'Ok, obrigada'", pipeline_stage: "in_conversation", priority: "normal", next_action: "Retomar o interesse em Sumaré e confirmar o telefone", notes: "Demonstrou interesse inicial em ser franqueada em Sumaré; telefone a conferir.", source: "meta_whatsapp" },
  { full_name: "Bruno", phone: "+5519974229809", whatsapp_label: "~bruno", last_contact_at: brtDateToIso("2026-10-08"), next_contact_at: brtDateToIso("2026-10-13"), last_conversation_status: "Pediu mais informações; recebeu convite para uma conversa e ainda não respondeu", pipeline_stage: "contact_attempt", priority: "normal", next_action: "Fazer follow-up e pedir um horário para reunião", source: "meta_whatsapp" },
  { full_name: "Osvaldina", phone: "+55 62 8452-9645", phone_incomplete: true, whatsapp_label: "~Osvaldina", last_contact_at: brtDateToIso("2026-10-09"), next_contact_at: brtDateToIso("2026-10-13"), last_conversation_status: "Pediu mais informações; recebeu convite para uma conversa e ainda não respondeu", pipeline_stage: "contact_attempt", priority: "normal", next_action: "Fazer follow-up e pedir um horário para reunião", notes: "Telefone a conferir — número parece estar incompleto.", source: "meta_whatsapp" },
  { full_name: "Daniel", phone: "+5519994091433", whatsapp_label: "Daniel 'BoyMotos'", last_contact_at: brtDateToIso("2026-10-11"), next_contact_at: brtDateToIso("2026-10-13"), last_conversation_status: "Pediu mais informações; recebeu convite para uma conversa e ainda não respondeu", pipeline_stage: "contact_attempt", priority: "normal", next_action: "Fazer follow-up e pedir um horário para reunião", source: "meta_whatsapp" },
  { full_name: "Doni", phone: "+5519996026052", whatsapp_label: "~Doni", last_contact_at: brtDateToIso("2026-10-09"), next_contact_at: brtDateToIso("2026-10-13"), last_conversation_status: "Perguntou o valor da franquia e informou que encaminharia a apresentação ao filho", pipeline_stage: "in_conversation", priority: "normal", next_action: "Retomar e confirmar o interesse do filho na franquia", notes: "Aguardando confirmação de interesse em investir na região de Campinas.", source: "meta_whatsapp" },
  { full_name: "Raul Carrasco", phone: "+5519989980087", whatsapp_label: "~Raul Carrasco", last_contact_at: brtDateToIso("2026-10-09"), next_contact_at: null, last_conversation_status: "Entrou em contato para oferecer camisetas esportivas importadas para academias", pipeline_stage: "lost", priority: "low", next_action: "Sem ação de franquia; encaminhar ao responsável por compras/parcerias", notes: "Fornecedor/parceiro comercial, não lead de franquia.", source: "meta_whatsapp", lost_reason: "Fornecedor de camisetas — não busca franquia" },
  { full_name: "Vanessa Barros Rodrigues", phone: null, email: "vanessabarros.rodrigues02@gmail.com", last_contact_at: brtDateToIso("2026-10-09"), next_contact_at: brtDateToIso("2026-10-13"), last_conversation_status: "Na reunião com Diego, conversaram sobre formar sociedade para abrir uma unidade em Valinhos", pipeline_stage: "qualified", priority: "high", next_action: "Perguntar se criaram o grupo e avançaram na sociedade", notes: "Telefone pendente. Fazer um contato leve para entender se criaram o grupo e avançaram nas conversas.", source: "manual" },
  { full_name: "Diego Correa", phone: null, email: "d2_correa@yahoo.com.br", last_contact_at: brtDateToIso("2026-10-09"), next_contact_at: brtDateToIso("2026-10-19"), last_conversation_status: "Na reunião com Vanessa, conversaram sobre formar sociedade para abrir uma unidade em Valinhos", pipeline_stage: "qualified", priority: "high", next_action: "Retomar após a viagem à Bahia e alinhar os próximos passos", notes: "Telefone pendente. Viajaria de férias para a Bahia nesta semana; retomar após a viagem.", source: "manual" },
  { full_name: "Jacqueline Lisboa", phone: "+5519991943191", whatsapp_label: "Jacqueline Lisboa", received_at: brtDateToIso("2026-10-13"), last_contact_at: brtDateToIso("2026-10-13"), next_contact_at: null, last_conversation_status: "Apresentou o plano Área Protegida da Medicar para atendimento médico e UTI móvel em academias", pipeline_stage: "lost", priority: "low", next_action: "Sem ação de franquia; encaminhar ao responsável por parcerias/benefícios", notes: "Proposta comercial anunciada por menos de 3,99 por dia.", source: "manual", lost_reason: "Fornecedor Medicar — não busca franquia" },
];

function toLead(seed: SeedLead, idx: number): FranchiseLead {
  const normalized = seed.phone_incomplete ? null : normalizePhone(seed.phone);
  return {
    id: `lead-${idx}`,
    organization_id: "org-1",
    full_name: seed.full_name,
    phone: seed.phone,
    phone_normalized: normalized,
    email: seed.email ?? null,
    received_at: seed.received_at ?? null,
    last_contact_at: seed.last_contact_at,
    last_conversation_status: seed.last_conversation_status ?? null,
    next_action: seed.next_action ?? null,
    next_contact_at: seed.next_contact_at,
    pipeline_stage: seed.pipeline_stage,
    priority: seed.priority,
    source: (seed.source ?? null) as FranchiseLead["source"],
    investment_range: seed.investment_range ?? null,
    start_timeline: seed.start_timeline ?? null,
    whatsapp_label: seed.whatsapp_label ?? null,
    notes: seed.notes ?? null,
    lost_reason: seed.lost_reason ?? null,
    owner_id: null,
    created_by: null,
    created_at: "2026-10-01T15:00:00.000Z",
    updated_at: "2026-10-01T15:00:00.000Z",
    sla_contact_attempts: 0,
    sla_response_received_at: null,
    sla_archive_type: null,
    sla_archived_at: null,
    sla_last_retry_at: null,
  };
}

const TIER_HEADER: Record<OperationalTier, string> = {
  respond_now: "TIER 1 — RESPONDER AGORA",
  call_today: "TIER 2 — LIGAR HOJE",
  follow_up: "TIER 3 — ACOMPANHAR",
  verify_phone: "TIER 4 — CONFERIR TELEFONE",
  reactivate: "TIER 5 — REATIVAR",
  awaiting: "TIER 6 — AGUARDANDO",
  deprioritize: "TIER 7 — NÃO PRIORIZAR",
  terminal: "TIER 8 — HISTÓRICO",
};

test("Ranking operacional + cenários (diagnóstico)", () => {
  const leads = SEED.map(toLead);
  const activities = new Map<string, never[]>();

  const enriched = leads
    .map((lead) => ({
      lead,
      intel: calculateLeadIntelligence(lead, [], NOW),
    }))
    .sort(sortByOperationalPriority);

  const lines: string[] = [];
  lines.push(`\n==== Ranking operacional (now=${NOW_BRT_YMD} 12:00 BRT) ====\n`);

  let currentTier: OperationalTier | null = null;
  for (const row of enriched) {
    if (row.intel.operationalTier !== currentTier) {
      currentTier = row.intel.operationalTier;
      lines.push(`\n[${TIER_HEADER[currentTier]}]`);
    }
    const due = row.intel.dueLabel ? ` · ${row.intel.dueLabel}` : "";
    lines.push(
      `  • ${row.lead.full_name.padEnd(28)} → ${row.intel.suggestedActionLabel}${due}  [score ${row.intel.score}/100]`,
    );
    if (row.intel.reasons.length > 0) {
      lines.push(`      motivo: ${row.intel.reasons[0]}`);
    }
  }

  const alerts = computeAlerts(leads, activities, NOW);
  lines.push("\n==== Indicadores ====\n");
  lines.push(`  Ações atrasadas (tiers 1-4):   ${alerts.overdueContacts}`);
  lines.push(`  Sem retorno (tier Reativar):   ${alerts.withoutReturn}`);
  lines.push(`  Reuniões sem resultado:         ${alerts.meetingsWithoutOutcome}`);
  lines.push(`  Sem próxima ação:               ${alerts.leadsWithoutNextAction}`);
  lines.push(`  Telefones a conferir:           ${alerts.phonesToConfirm}`);
  lines.push(`  Novos sem contato:              ${alerts.newLeadsWithoutContact}`);

  lines.push("\n==== Fila 'Quem chamar agora' (top 5) ====\n");
  const queue = buildCallQueue(leads, activities, NOW, 5);
  for (const q of queue) {
    lines.push(
      `  • ${q.lead.full_name}  [${q.intel.tierLabel}]  → ${q.intel.suggestedActionLabel}`,
    );
  }

  function appendScenario(title: string, lead: FranchiseLead) {
    const r = calculateLeadIntelligence(lead, [], NOW);
    lines.push(`\n>>> ${title}`);
    lines.push(
      `    tier=${r.operationalTier}  attention=${r.attentionLevel}  score=${r.score}/100`,
    );
    lines.push(
      `    label='${r.tierLabel}'  ação='${r.suggestedActionLabel}'`,
    );
    lines.push(`    dueLabel=${r.dueLabel ?? "—"}`);
    lines.push(`    excludeFromActiveQueue=${r.excludeFromActiveQueue}`);
    lines.push(`    motivos: ${r.reasons.join(" | ")}`);
  }

  lines.push("\n==== Cenários de sanidade ====");

  appendScenario("A) Novo lead recebido há 10 minutos", {
    id: "s1",
    organization_id: "org-1",
    full_name: "Nova lead · 10 min",
    phone: "+5511999887766",
    phone_normalized: "+5511999887766",
    email: null,
    received_at: new Date(NOW.getTime() - 10 * 60 * 1000).toISOString(),
    last_contact_at: null,
    last_conversation_status: null,
    next_action: null,
    next_contact_at: null,
    pipeline_stage: "new",
    priority: "normal",
    source: "meta_instant_form",
    investment_range: null,
    start_timeline: null,
    whatsapp_label: null,
    notes: null,
    lost_reason: null,
    owner_id: null,
    created_by: null,
    created_at: new Date(NOW.getTime() - 10 * 60 * 1000).toISOString(),
    updated_at: new Date(NOW.getTime() - 10 * 60 * 1000).toISOString(),
    sla_contact_attempts: 0,
    sla_response_received_at: null,
    sla_archive_type: null,
    sla_archived_at: null,
    sla_last_retry_at: null,
  });

  appendScenario("B) Telefone inválido com interesse ativo", {
    id: "s2",
    organization_id: "org-1",
    full_name: "Lead · tel incompleto",
    phone: "+55 71 1234",
    phone_normalized: null,
    email: null,
    received_at: null,
    last_contact_at: brtDateToIso("2026-10-08"),
    last_conversation_status: "Interessado em avançar",
    next_action: null,
    next_contact_at: brtDateToIso("2026-10-13"),
    pipeline_stage: "in_conversation",
    priority: "high",
    source: "meta_whatsapp",
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
  });

  appendScenario("C) Próximo contato marcado para 19/10 (futuro)", {
    id: "s3",
    organization_id: "org-1",
    full_name: "Lead · aguardando viagem",
    phone: "+5511977665544",
    phone_normalized: "+5511977665544",
    email: null,
    received_at: null,
    last_contact_at: brtDateToIso("2026-10-09"),
    last_conversation_status: "Lead vai viajar e retornar depois",
    next_action: "Retomar após a viagem",
    next_contact_at: brtDateToIso("2026-10-19"),
    pipeline_stage: "qualified",
    priority: "high",
    source: "meta_whatsapp",
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
  });

  appendScenario("D) Fornecedor/parceria em stage=new", {
    id: "s4",
    organization_id: "org-1",
    full_name: "Fornecedor camisetas",
    phone: "+5511966554433",
    phone_normalized: "+5511966554433",
    email: null,
    received_at: null,
    last_contact_at: brtDateToIso("2026-10-10"),
    last_conversation_status:
      "Entrou em contato para oferecer camisetas esportivas importadas",
    next_action: "Encaminhar à compras",
    next_contact_at: null,
    pipeline_stage: "new",
    priority: "normal",
    source: "meta_whatsapp",
    investment_range: null,
    start_timeline: null,
    whatsapp_label: null,
    notes: "Fornecedor — não busca franquia.",
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
  });

  console.log(lines.join("\n"));
});
