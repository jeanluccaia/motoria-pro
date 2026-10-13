#!/usr/bin/env node
// Semeia os 10 primeiros leads de franquia da Loud Fit no CRM.
//
// Idempotente: usa (organization_id, phone_normalized) como chave de upsert
// quando o telefone normaliza; para números incompletos, cai em busca por
// (organization_id, lower(full_name)) para evitar duplicata na reexecução.
//
// Uso:
//   dotenv -e .env.local node supabase/seed/seed_franchise_leads.mjs --dry-run
//   dotenv -e .env.local node supabase/seed/seed_franchise_leads.mjs --apply
//
// Sem flag, roda em dry-run e descreve o que faria. Nunca escreve nada fora
// das tabelas franchise_leads / audit_log.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const dryRun = !args.has("--apply");

const admin = createClient(url, key, { auth: { persistSession: false } });

const BR_CC = "55";

function normalizePhone(raw) {
  if (!raw) return { normalized: null, isPlausible: false };
  const digits = String(raw).replace(/\D+/g, "");
  if (!digits) return { normalized: null, isPlausible: false };
  let national = digits;
  if ((national.length === 12 || national.length === 13) && national.startsWith(BR_CC)) {
    national = national.slice(2);
  }
  if (national.length === 10 || national.length === 11) {
    return { normalized: `+${BR_CC}${national}`, isPlausible: true };
  }
  return { normalized: null, isPlausible: false };
}

// Data no formato "DD/MM/YYYY" ou "DD/MM/YYYY HH:mm" → ISO UTC (BRT = UTC-3)
function brtToIso(brt) {
  if (!brt) return null;
  const m = String(brt).match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (!m) return null;
  const [, d, mo, y, h = "12", mi = "00"] = m;
  // BRT (UTC-3) sem horário de verão. 12:00 BRT = 15:00 UTC.
  const utcMs = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h) + 3, Number(mi), 0);
  return new Date(utcMs).toISOString();
}

const ORG_SLUG = "loud-fit";

const LEADS = [
  {
    full_name: "Camilla Kojima Moura",
    phone: "+5512992340351",
    email: "camillasouzakojima@gmail.com",
    last_contact_at: brtToIso("16/09/2026"),
    last_conversation_status: "Não respondeu após o último contato",
    pipeline_stage: "no_response",
    priority: "normal",
    next_action: "Fazer nova tentativa de contato",
    investment_range: "Ainda estou estruturando o capital",
    start_timeline: "Até 3 meses",
    source: "meta_instant_form",
  },
  {
    full_name: "Robert Moura",
    phone: "+5519982550494",
    email: "mourarobert21@gmail.com",
    last_contact_at: brtToIso("18/09/2026"),
    last_conversation_status: "Não respondeu; buscava uma rede que oferecesse recursos de financiamento",
    pipeline_stage: "no_response",
    priority: "normal",
    next_action: "Retomar e entender a necessidade de financiamento",
    investment_range: "Ainda estou estruturando o capital",
    start_timeline: "Até 3 meses",
    source: "meta_instant_form",
  },
  {
    full_name: "Sergio Maraca",
    phone: "+5561985283836",
    email: "sergiogeronto@gmail.com",
    last_contact_at: brtToIso("21/09/2026"),
    last_conversation_status: "Informou que já fechou com uma concorrente",
    pipeline_stage: "lost",
    priority: "low",
    next_action: "Sem ação comercial; manter apenas o histórico",
    investment_range: "De R$ 700 mil a R$ 899 mil",
    start_timeline: "Até 3 meses",
    source: "meta_instant_form",
    lost_reason: "Concorrente",
  },
  {
    full_name: "Fabio",
    phone: "+5519996464563",
    whatsapp_label: "~renovacorretora372",
    last_contact_at: brtToIso("30/09/2026"),
    last_conversation_status: "Não visualizou a última mensagem",
    pipeline_stage: "contact_attempt",
    priority: "normal",
    next_action: "Reenviar mensagem em outro horário",
    source: "meta_whatsapp",
  },
  {
    full_name: "Léo Nogueira",
    phone: "+5519991767918",
    whatsapp_label: "~Tribos Gym - Léo Nogueira",
    last_contact_at: brtToIso("01/10/2026"),
    last_conversation_status: "Visualizou e não respondeu",
    pipeline_stage: "no_response",
    priority: "normal",
    next_action: "Enviar follow-up curto",
    source: "meta_whatsapp",
  },
  {
    full_name: "José Costa",
    phone: "+55 83 9648-8258", // dígito faltando — mantido como veio
    whatsapp_label: "~José Costa",
    last_contact_at: brtToIso("04/10/2026"),
    last_conversation_status: "Ficou de entrar em contato e não retornou",
    pipeline_stage: "in_conversation",
    priority: "normal",
    next_action: "Cobrar retorno e confirmar o telefone",
    notes: "O telefone parece estar com um dígito faltando. Confira ao retomar.",
    source: "meta_whatsapp",
  },
  {
    full_name: "Aramys Raposo",
    phone: "+5515981125251",
    whatsapp_label: "~Aramys Raposo",
    last_contact_at: brtToIso("07/10/2026"),
    last_conversation_status: "Ficou de marcar uma visita à unidade com a sócia",
    pipeline_stage: "qualified",
    priority: "high",
    next_action: "Chamar e agendar a visita com a sócia",
    notes: "Lead importante para acompanhamento.",
    source: "meta_whatsapp",
  },
  {
    full_name: "Frank Miguel",
    phone: "+5519997555366",
    last_contact_at: brtToIso("07/10/2026"),
    last_conversation_status: "Interessado, mas ainda não confirmou a reunião",
    pipeline_stage: "qualified",
    priority: "high",
    next_action: "Pedir confirmação da reunião",
    source: "meta_whatsapp",
  },
  {
    full_name: "Ahmad Lakis Rosa",
    phone: "+5511915583591",
    last_contact_at: brtToIso("07/10/2026"),
    last_conversation_status: "Reunião marcada para 07/10/2026 às 15:30",
    pipeline_stage: "meeting_scheduled",
    priority: "high",
    next_action: "Realizar a reunião e registrar o resultado",
    next_contact_at: brtToIso("07/10/2026 15:30"),
    source: "meta_whatsapp",
  },
  {
    full_name: "Luana Gavioli dos Santos",
    phone: "+5519993933215",
    email: "luanagaviolidossantos@yahoo.com.br",
    last_contact_at: brtToIso("08/10/2026"),
    last_conversation_status:
      "Reunião marcada para 09/10/2026; horário não informado",
    pipeline_stage: "meeting_scheduled",
    priority: "high",
    next_action: "Registrar o resultado da reunião",
    next_contact_at: brtToIso("09/10/2026"),
    source: "meta_whatsapp",
    notes: "Interessada em abrir uma unidade em Campinas ou região",
  },
];

// 1) Resolver organização.
const { data: orgRows, error: orgErr } = await admin
  .from("organizations")
  .select("id, name, slug")
  .eq("slug", ORG_SLUG);
if (orgErr) {
  console.error("Falha ao consultar organizações:", orgErr.message);
  process.exit(1);
}
if (!orgRows || orgRows.length === 0) {
  console.error(`Organização '${ORG_SLUG}' não encontrada.`);
  process.exit(1);
}
if (orgRows.length > 1) {
  console.error("Mais de uma organização com o slug esperado — pare e revise:", orgRows);
  process.exit(1);
}
const org = orgRows[0];

console.log(`Organização alvo: ${org.name} (${org.id})`);
console.log(dryRun ? "Modo: DRY-RUN (nada será escrito)" : "Modo: APLICAR");

// 2) Pre-carregar leads existentes para detectar duplicatas.
const { data: existing, error: existingErr } = await admin
  .from("franchise_leads")
  .select("id, full_name, phone_normalized")
  .eq("organization_id", org.id);
if (existingErr) {
  console.error("Falha ao listar leads existentes:", existingErr.message);
  process.exit(1);
}

const byPhone = new Map();
const byName = new Map();
for (const row of existing ?? []) {
  if (row.phone_normalized) byPhone.set(row.phone_normalized, row.id);
  byName.set(row.full_name.toLowerCase(), row.id);
}

let created = 0;
let updated = 0;
let skipped = 0;

for (const lead of LEADS) {
  const phoneCheck = normalizePhone(lead.phone);
  const existingId =
    (phoneCheck.normalized && byPhone.get(phoneCheck.normalized)) ||
    byName.get(lead.full_name.toLowerCase()) ||
    null;

  const payload = {
    organization_id: org.id,
    full_name: lead.full_name,
    phone: lead.phone,
    phone_normalized: phoneCheck.normalized,
    email: lead.email ?? null,
    received_at: null, // sem informação confiável
    last_contact_at: lead.last_contact_at ?? null,
    last_conversation_status: lead.last_conversation_status ?? null,
    pipeline_stage: lead.pipeline_stage,
    priority: lead.priority,
    source: lead.source ?? null,
    next_action: lead.next_action ?? null,
    next_contact_at: lead.next_contact_at ?? null,
    investment_range: lead.investment_range ?? null,
    start_timeline: lead.start_timeline ?? null,
    whatsapp_label: lead.whatsapp_label ?? null,
    notes: lead.notes ?? null,
    lost_reason: lead.lost_reason ?? null,
  };

  if (existingId) {
    console.log(`• atualizar ${lead.full_name} (${existingId})${!phoneCheck.isPlausible ? " [telefone a conferir]" : ""}`);
    if (!dryRun) {
      const { error } = await admin
        .from("franchise_leads")
        .update(payload)
        .eq("id", existingId)
        .eq("organization_id", org.id);
      if (error) {
        console.error(`  falha ao atualizar: ${error.message}`);
        skipped += 1;
        continue;
      }
    }
    updated += 1;
  } else {
    console.log(`• criar ${lead.full_name}${!phoneCheck.isPlausible ? " [telefone a conferir]" : ""}`);
    if (!dryRun) {
      const { error } = await admin
        .from("franchise_leads")
        .insert(payload);
      if (error) {
        console.error(`  falha ao criar: ${error.message}`);
        skipped += 1;
        continue;
      }
    }
    created += 1;
  }
}

console.log("---");
console.log(`Resumo: criados=${created}, atualizados=${updated}, ignorados=${skipped} (${dryRun ? "dry-run" : "aplicado"})`);
if (dryRun) {
  console.log("Rode novamente com --apply para persistir.");
}
