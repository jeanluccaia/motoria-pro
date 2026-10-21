"use server";

// Matriz de permissões — repetida aqui no servidor (defense in depth; RLS
// e o trigger de guarda do Postgres continuam sendo a última barreira):
//
//   createLead:            admin, marketing
//   updateLead:            admin, marketing  (cadastro completo)
//   registerContact:       admin, marketing, partner
//   markResponseReceived:  admin, marketing, partner
//   changeStage:           admin, marketing, partner
//   scheduleNextContact:   admin, marketing, partner
//   deleteLead:            admin
//
// unit_manager não cai em nenhum conjunto — não acessa /crm/franquias
// (bloqueado em page.tsx) e, mesmo invocando o action direto, é rejeitado
// por essas checagens antes de qualquer round-trip ao banco.

import { revalidatePath } from "next/cache";
import { requireAdmin, requireSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/crm/phone";
import { brtInputToUtcIso } from "@/lib/crm/dates";
import { STAGE_LABELS } from "@/lib/crm/labels";
import type {
  FranchiseLead,
  FranchiseLeadStage,
  FranchiseLeadPriority,
  FranchiseLeadSource,
  FranchiseLeadActivityType,
  Role,
} from "@/lib/supabase/types";

type Result = { ok: boolean; message: string; leadId?: string };

const STAGES: FranchiseLeadStage[] = [
  "new",
  "contact_attempt",
  "in_conversation",
  "qualified",
  "meeting_scheduled",
  "cof_sent",
  "negotiating",
  "won",
  "no_response",
  "disqualified",
  "lost",
];
const PRIORITIES: FranchiseLeadPriority[] = ["low", "normal", "high"];
const SOURCES: FranchiseLeadSource[] = [
  "meta_instant_form",
  "meta_whatsapp",
  "manual",
  "google_ads",
  "site",
];

const WRITE_ROLES: Role[] = ["admin", "marketing", "partner"];
const MANAGE_ROLES: Role[] = ["admin", "marketing"];

function parseStage(v: FormDataEntryValue | null, fallback: FranchiseLeadStage = "new"): FranchiseLeadStage {
  const s = String(v ?? fallback);
  return (STAGES as string[]).includes(s) ? (s as FranchiseLeadStage) : fallback;
}

function parsePriority(v: FormDataEntryValue | null, fallback: FranchiseLeadPriority = "normal"): FranchiseLeadPriority {
  const s = String(v ?? fallback);
  return (PRIORITIES as string[]).includes(s) ? (s as FranchiseLeadPriority) : fallback;
}

function parseSource(v: FormDataEntryValue | null): FranchiseLeadSource | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  return (SOURCES as string[]).includes(s) ? (s as FranchiseLeadSource) : null;
}

function parseOptionalText(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

async function audit(
  action: string,
  leadId: string | null,
  metadata: Record<string, unknown>,
): Promise<void> {
  const session = await requireSession();
  const admin = getSupabaseAdmin();
  await admin.from("audit_log").insert({
    organization_id: session.organizationId,
    actor_id: session.userId,
    action,
    target_type: "franchise_lead",
    target_id: leadId,
    metadata,
  });
}

export async function createLead(formData: FormData): Promise<Result> {
  const session = await requireSession();
  if (!MANAGE_ROLES.includes(session.role)) {
    return { ok: false, message: "Seu perfil não pode cadastrar leads." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { ok: false, message: "Informe o nome do lead." };

  const phoneRaw = String(formData.get("phone") ?? "").trim();
  if (!phoneRaw) return { ok: false, message: "Informe o celular do lead." };

  const phoneCheck = normalizePhone(phoneRaw);

  const email = parseOptionalText(formData.get("email"));
  const source = parseSource(formData.get("source"));
  const receivedAt = brtInputToUtcIso(String(formData.get("received_at") ?? ""));
  const stage = parseStage(formData.get("pipeline_stage"), "new");
  const priority = parsePriority(formData.get("priority"), "normal");
  const nextAction = parseOptionalText(formData.get("next_action"));
  const nextContactAt = brtInputToUtcIso(String(formData.get("next_contact_at") ?? ""));
  const investmentRange = parseOptionalText(formData.get("investment_range"));
  const startTimeline = parseOptionalText(formData.get("start_timeline"));
  const whatsappLabel = parseOptionalText(formData.get("whatsapp_label"));
  const notes = parseOptionalText(formData.get("notes"));
  const lostReason = stage === "lost" ? parseOptionalText(formData.get("lost_reason")) : null;

  if (stage === "lost" && !lostReason) {
    return { ok: false, message: "Informe o motivo da perda ou escolha outra etapa." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: created, error } = await supabase
    .from("franchise_leads")
    .insert({
      organization_id: session.organizationId,
      full_name: fullName,
      phone: phoneRaw,
      phone_normalized: phoneCheck.normalized,
      email,
      source,
      received_at: receivedAt,
      pipeline_stage: stage,
      priority,
      next_action: nextAction,
      next_contact_at: nextContactAt,
      investment_range: investmentRange,
      start_timeline: startTimeline,
      whatsapp_label: whatsappLabel,
      notes,
      lost_reason: lostReason,
      owner_id: session.userId,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        message: "Já existe um lead com esse telefone nesta organização.",
      };
    }
    return { ok: false, message: error.message };
  }

  await audit("franchise_lead.create", created.id, {
    full_name: fullName,
    phone_plausible: phoneCheck.isPlausible,
    stage,
    priority,
    source,
  });

  revalidatePath("/crm/franquias");
  return {
    ok: true,
    message: phoneCheck.isPlausible
      ? "Lead cadastrado."
      : "Lead cadastrado. Confira o telefone — pode estar incompleto.",
    leadId: created.id,
  };
}

export async function updateLead(formData: FormData): Promise<Result> {
  const session = await requireSession();
  if (!MANAGE_ROLES.includes(session.role)) {
    return { ok: false, message: "Seu perfil não pode editar o cadastro do lead." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Lead inválido." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { ok: false, message: "Informe o nome do lead." };

  const phoneRaw = String(formData.get("phone") ?? "").trim();
  if (!phoneRaw) return { ok: false, message: "Informe o celular do lead." };
  const phoneCheck = normalizePhone(phoneRaw);

  const email = parseOptionalText(formData.get("email"));
  const source = parseSource(formData.get("source"));
  const receivedAt = brtInputToUtcIso(String(formData.get("received_at") ?? ""));
  const stage = parseStage(formData.get("pipeline_stage"));
  const priority = parsePriority(formData.get("priority"));
  const nextAction = parseOptionalText(formData.get("next_action"));
  const nextContactAt = brtInputToUtcIso(String(formData.get("next_contact_at") ?? ""));
  const investmentRange = parseOptionalText(formData.get("investment_range"));
  const startTimeline = parseOptionalText(formData.get("start_timeline"));
  const whatsappLabel = parseOptionalText(formData.get("whatsapp_label"));
  const notes = parseOptionalText(formData.get("notes"));
  const lostReason = stage === "lost" ? parseOptionalText(formData.get("lost_reason")) : null;

  if (stage === "lost" && !lostReason) {
    return { ok: false, message: "Informe o motivo da perda ou escolha outra etapa." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: updated, error } = await supabase
    .from("franchise_leads")
    .update({
      full_name: fullName,
      phone: phoneRaw,
      phone_normalized: phoneCheck.normalized,
      email,
      source,
      received_at: receivedAt,
      pipeline_stage: stage,
      priority,
      next_action: nextAction,
      next_contact_at: nextContactAt,
      investment_range: investmentRange,
      start_timeline: startTimeline,
      whatsapp_label: whatsappLabel,
      notes,
      lost_reason: lostReason,
    })
    .eq("id", id)
    .eq("organization_id", session.organizationId)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        message: "Já existe outro lead com esse telefone nesta organização.",
      };
    }
    return { ok: false, message: error.message };
  }
  if (!updated) return { ok: false, message: "Lead não encontrado." };

  await audit("franchise_lead.update", id, {
    full_name: fullName,
    stage,
    priority,
  });

  revalidatePath("/crm/franquias");
  return {
    ok: true,
    message: phoneCheck.isPlausible
      ? "Lead atualizado."
      : "Lead atualizado. Confira o telefone — pode estar incompleto.",
  };
}

// Operacional: usado por admin, marketing e partner. Registra um contato
// no histórico e atualiza os campos "último contato" + "próxima ação" do
// lead em uma única transação lógica (duas operações serializadas; RLS
// garante escopo).
export async function registerContact(formData: FormData): Promise<Result> {
  const session = await requireSession();
  if (!WRITE_ROLES.includes(session.role)) {
    return { ok: false, message: "Seu perfil não pode registrar contatos." };
  }

  const leadId = String(formData.get("lead_id") ?? "");
  if (!leadId) return { ok: false, message: "Lead inválido." };

  const summary = String(formData.get("summary") ?? "").trim();
  if (!summary) return { ok: false, message: "Resuma o que foi conversado." };

  const occurredAt = brtInputToUtcIso(String(formData.get("occurred_at") ?? ""))
    ?? new Date().toISOString();
  const stage = parseStage(formData.get("pipeline_stage"), "contact_attempt");
  const nextAction = parseOptionalText(formData.get("next_action"));
  const nextContactAt = brtInputToUtcIso(String(formData.get("next_contact_at") ?? ""));
  const conversationStatus = parseOptionalText(formData.get("last_conversation_status")) ?? summary;

  const supabase = await createSupabaseServerClient();

  // Confirma escopo + lê etapa atual (para auditar mudanças).
  const { data: current, error: readErr } = await supabase
    .from("franchise_leads")
    .select("id, pipeline_stage, sla_contact_attempts")
    .eq("id", leadId)
    .eq("organization_id", session.organizationId)
    .maybeSingle();
  if (readErr) return { ok: false, message: readErr.message };
  if (!current) return { ok: false, message: "Lead não encontrado." };

  const updates: Partial<FranchiseLead> = {
    last_contact_at: occurredAt,
    last_conversation_status: conversationStatus,
    // SLA: cada contato registrado incrementa o contador até o lead
    // responder. Quando o cron SLA arquiva (temp ou final) ou quando o
    // sócio marca "lead respondeu" (markResponseReceived), o contador é
    // zerado — então essa soma reflete sempre "contatos desde a última
    // resposta". Ver [[src/lib/crm/sla.ts]].
    sla_contact_attempts: (current.sla_contact_attempts ?? 0) + 1,
  };
  if (nextAction !== null) updates.next_action = nextAction;
  if (nextContactAt !== null) updates.next_contact_at = nextContactAt;
  if (stage !== current.pipeline_stage) updates.pipeline_stage = stage;

  const { error: updErr } = await supabase
    .from("franchise_leads")
    .update(updates)
    .eq("id", leadId)
    .eq("organization_id", session.organizationId);
  if (updErr) return { ok: false, message: updErr.message };

  const { error: actErr } = await supabase.from("franchise_lead_activities").insert({
    organization_id: session.organizationId,
    lead_id: leadId,
    activity_type: "contact" as FranchiseLeadActivityType,
    summary,
    occurred_at: occurredAt,
    created_by: session.userId,
  });
  if (actErr) return { ok: false, message: actErr.message };

  if (stage !== current.pipeline_stage) {
    await supabase.from("franchise_lead_activities").insert({
      organization_id: session.organizationId,
      lead_id: leadId,
      activity_type: "stage_change" as FranchiseLeadActivityType,
      summary: `Etapa alterada: ${STAGE_LABELS[current.pipeline_stage]} → ${STAGE_LABELS[stage]}`,
      occurred_at: occurredAt,
      created_by: session.userId,
    });
  }

  await audit("franchise_lead.contact", leadId, {
    stage_from: current.pipeline_stage,
    stage_to: stage,
    has_next_contact: nextContactAt !== null,
  });

  revalidatePath("/crm/franquias");
  return { ok: true, message: "Contato registrado." };
}

// SLA: marca que o lead respondeu. Zera o contador de tentativas e sai
// do loop (o cron SLA ignora leads com sla_response_received_at setado).
// Também encerra qualquer "retry round" em andamento. Usado pelo botão
// "Lead respondeu" no card do lead. Não altera pipeline_stage — o próximo
// contato real é quem move o lead para in_conversation/qualified/etc.
export async function markResponseReceived(formData: FormData): Promise<Result> {
  const session = await requireSession();
  if (!WRITE_ROLES.includes(session.role)) {
    return { ok: false, message: "Seu perfil não pode marcar respostas." };
  }

  const leadId = String(formData.get("lead_id") ?? "");
  if (!leadId) return { ok: false, message: "Lead inválido." };

  const summary = parseOptionalText(formData.get("summary")) ?? "Lead respondeu.";
  const occurredAt =
    brtInputToUtcIso(String(formData.get("occurred_at") ?? "")) ??
    new Date().toISOString();

  const supabase = await createSupabaseServerClient();

  // Confirma escopo.
  const { data: current, error: readErr } = await supabase
    .from("franchise_leads")
    .select("id")
    .eq("id", leadId)
    .eq("organization_id", session.organizationId)
    .maybeSingle();
  if (readErr) return { ok: false, message: readErr.message };
  if (!current) return { ok: false, message: "Lead não encontrado." };

  const { error: updErr } = await supabase
    .from("franchise_leads")
    .update({
      sla_response_received_at: occurredAt,
      sla_contact_attempts: 0,
      // Fecha retry em andamento se houver.
      sla_last_retry_at: null,
      last_contact_at: occurredAt,
      last_conversation_status: summary,
    })
    .eq("id", leadId)
    .eq("organization_id", session.organizationId);
  if (updErr) return { ok: false, message: updErr.message };

  const { error: actErr } = await supabase
    .from("franchise_lead_activities")
    .insert({
      organization_id: session.organizationId,
      lead_id: leadId,
      activity_type: "note" as FranchiseLeadActivityType,
      summary: `Lead respondeu: ${summary}`,
      occurred_at: occurredAt,
      created_by: session.userId,
    });
  if (actErr) return { ok: false, message: actErr.message };

  await audit("franchise_lead.response_received", leadId, {});

  revalidatePath("/crm/franquias");
  return { ok: true, message: "Resposta registrada." };
}

// Mudança rápida de etapa sem passar pelo formulário completo. Usado pelo
// botão "Alterar etapa" no painel do lead. Também grava uma atividade.
export async function changeStage(formData: FormData): Promise<Result> {
  const session = await requireSession();
  if (!WRITE_ROLES.includes(session.role)) {
    return { ok: false, message: "Seu perfil não pode mudar a etapa." };
  }

  const leadId = String(formData.get("lead_id") ?? "");
  if (!leadId) return { ok: false, message: "Lead inválido." };

  const stage = parseStage(formData.get("pipeline_stage"));
  const lostReason = stage === "lost" ? parseOptionalText(formData.get("lost_reason")) : null;
  if (stage === "lost" && !lostReason) {
    return { ok: false, message: "Para marcar como perdido, informe o motivo." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: current, error: readErr } = await supabase
    .from("franchise_leads")
    .select("id, pipeline_stage")
    .eq("id", leadId)
    .eq("organization_id", session.organizationId)
    .maybeSingle();
  if (readErr) return { ok: false, message: readErr.message };
  if (!current) return { ok: false, message: "Lead não encontrado." };

  if (stage === current.pipeline_stage && !lostReason) {
    return { ok: true, message: "Etapa inalterada." };
  }

  const { error } = await supabase
    .from("franchise_leads")
    .update({ pipeline_stage: stage, lost_reason: lostReason })
    .eq("id", leadId)
    .eq("organization_id", session.organizationId);
  if (error) return { ok: false, message: error.message };

  await supabase.from("franchise_lead_activities").insert({
    organization_id: session.organizationId,
    lead_id: leadId,
    activity_type: "stage_change" as FranchiseLeadActivityType,
    summary: `Etapa alterada: ${STAGE_LABELS[current.pipeline_stage]} → ${STAGE_LABELS[stage]}`,
    occurred_at: new Date().toISOString(),
    created_by: session.userId,
  });

  await audit("franchise_lead.stage_change", leadId, {
    from: current.pipeline_stage,
    to: stage,
    lost_reason: lostReason,
  });

  revalidatePath("/crm/franquias");
  return { ok: true, message: "Etapa atualizada." };
}

export async function scheduleNextContact(formData: FormData): Promise<Result> {
  const session = await requireSession();
  if (!WRITE_ROLES.includes(session.role)) {
    return { ok: false, message: "Seu perfil não pode agendar contatos." };
  }

  const leadId = String(formData.get("lead_id") ?? "");
  if (!leadId) return { ok: false, message: "Lead inválido." };

  const nextContactAt = brtInputToUtcIso(String(formData.get("next_contact_at") ?? ""));
  if (!nextContactAt) return { ok: false, message: "Informe a data do próximo contato." };

  const nextAction = parseOptionalText(formData.get("next_action"));

  const supabase = await createSupabaseServerClient();

  const { data: updated, error } = await supabase
    .from("franchise_leads")
    .update({
      next_contact_at: nextContactAt,
      ...(nextAction !== null ? { next_action: nextAction } : {}),
    })
    .eq("id", leadId)
    .eq("organization_id", session.organizationId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!updated) return { ok: false, message: "Lead não encontrado." };

  await supabase.from("franchise_lead_activities").insert({
    organization_id: session.organizationId,
    lead_id: leadId,
    activity_type: "schedule" as FranchiseLeadActivityType,
    summary: nextAction ? `Agendado: ${nextAction}` : "Próximo contato agendado",
    occurred_at: new Date().toISOString(),
    created_by: session.userId,
  });

  await audit("franchise_lead.schedule", leadId, {
    next_contact_at: nextContactAt,
    has_action: nextAction !== null,
  });

  revalidatePath("/crm/franquias");
  return { ok: true, message: "Próximo contato agendado." };
}

export async function deleteLead(formData: FormData): Promise<Result> {
  // Delete é vida real: só admin. Marketing e partner não.
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Lead inválido." };

  const supabase = await createSupabaseServerClient();
  const { data: deleted, error } = await supabase
    .from("franchise_leads")
    .delete()
    .eq("id", id)
    .eq("organization_id", session.organizationId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!deleted) return { ok: false, message: "Lead não encontrado." };

  await audit("franchise_lead.delete", id, {});
  revalidatePath("/crm/franquias");
  return { ok: true, message: "Lead removido." };
}
