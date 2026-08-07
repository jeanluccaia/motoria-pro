"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { localInputToUtcIso } from "@/lib/tasks/dates";
import type { TaskPriority } from "@/lib/supabase/types";

const PRIORITIES: TaskPriority[] = ["low", "normal", "high"];

type Result = { ok: boolean; message: string; taskId?: string };

function parsePriority(v: FormDataEntryValue | null): TaskPriority {
  const s = String(v ?? "normal");
  if ((PRIORITIES as string[]).includes(s)) return s as TaskPriority;
  return "normal";
}

async function audit(action: string, taskId: string | null, metadata: Record<string, unknown>) {
  const session = await requireSession();
  const admin = getSupabaseAdmin();
  await admin.from("audit_log").insert({
    organization_id: session.organizationId,
    actor_id: session.userId,
    action,
    target_type: "task",
    target_id: taskId,
    metadata,
  });
}

export async function createTask(formData: FormData): Promise<Result> {
  const session = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, message: "Descreva o que precisa ser feito." };

  const description = String(formData.get("description") ?? "").trim() || null;
  const assignedTo = String(formData.get("assigned_to") ?? "").trim();
  if (!assignedTo) return { ok: false, message: "Escolha quem é o responsável." };

  const unitRaw = String(formData.get("unit_id") ?? "").trim();
  const unitId = unitRaw === "" ? null : unitRaw;
  const priority = parsePriority(formData.get("priority"));
  const dueAt = localInputToUtcIso(String(formData.get("due_at") ?? ""));

  const admin = getSupabaseAdmin();

  // Defesa em profundidade: garante que o responsável está na mesma org.
  const { data: membership } = await admin
    .from("user_organizations")
    .select("user_id")
    .eq("organization_id", session.organizationId)
    .eq("user_id", assignedTo)
    .maybeSingle();
  if (!membership) {
    return { ok: false, message: "Esse responsável não faz parte da sua organização." };
  }

  if (unitId) {
    const { data: unit } = await admin
      .from("units")
      .select("id")
      .eq("organization_id", session.organizationId)
      .eq("id", unitId)
      .maybeSingle();
    if (!unit) {
      return { ok: false, message: "Unidade inválida." };
    }
  }

  const { data, error } = await admin
    .from("tasks")
    .insert({
      organization_id: session.organizationId,
      unit_id: unitId,
      title,
      description,
      assigned_to: assignedTo,
      created_by: session.userId,
      priority,
      due_at: dueAt,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  await audit("task.create", data.id, { title, assigned_to: assignedTo, unit_id: unitId, priority });
  revalidatePath("/tarefas");
  return { ok: true, message: "Tarefa criada.", taskId: data.id };
}

export async function updateTask(formData: FormData): Promise<Result> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Tarefa inválida." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, message: "Descreva o que precisa ser feito." };

  const description = String(formData.get("description") ?? "").trim() || null;
  const assignedTo = String(formData.get("assigned_to") ?? "").trim();
  if (!assignedTo) return { ok: false, message: "Escolha quem é o responsável." };

  const unitRaw = String(formData.get("unit_id") ?? "").trim();
  const unitId = unitRaw === "" ? null : unitRaw;
  const priority = parsePriority(formData.get("priority"));
  const dueAt = localInputToUtcIso(String(formData.get("due_at") ?? ""));

  const admin = getSupabaseAdmin();

  const { data: membership } = await admin
    .from("user_organizations")
    .select("user_id")
    .eq("organization_id", session.organizationId)
    .eq("user_id", assignedTo)
    .maybeSingle();
  if (!membership) {
    return { ok: false, message: "Esse responsável não faz parte da sua organização." };
  }

  if (unitId) {
    const { data: unit } = await admin
      .from("units")
      .select("id")
      .eq("organization_id", session.organizationId)
      .eq("id", unitId)
      .maybeSingle();
    if (!unit) return { ok: false, message: "Unidade inválida." };
  }

  const { error } = await admin
    .from("tasks")
    .update({
      title,
      description,
      assigned_to: assignedTo,
      unit_id: unitId,
      priority,
      due_at: dueAt,
    })
    .eq("id", id)
    .eq("organization_id", session.organizationId);
  if (error) return { ok: false, message: error.message };

  await audit("task.update", id, { title, assigned_to: assignedTo, unit_id: unitId, priority });
  revalidatePath("/tarefas");
  return { ok: true, message: "Tarefa atualizada." };
}

export async function completeTask(formData: FormData): Promise<Result> {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Tarefa inválida." };

  // Usa o client de sessão (RLS ativa) para garantir que a pessoa só conclui
  // o que a policy permite. Admins passam livre; não-admin só as próprias.
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: session.userId,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id, organization_id")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "Tarefa não encontrada ou já concluída." };

  await audit("task.complete", id, {});
  revalidatePath("/tarefas");
  return { ok: true, message: "Tarefa concluída." };
}

export async function reopenTask(formData: FormData): Promise<Result> {
  // requireSession garante que só usuário autenticado passa; a policy do
  // Postgres decide se ele pode reabrir esta tarefa em específico.
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Tarefa inválida." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "pending", completed_at: null, completed_by: null })
    .eq("id", id)
    .eq("status", "completed")
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "Tarefa não encontrada." };

  await audit("task.reopen", id, {});
  revalidatePath("/tarefas");
  return { ok: true, message: "Tarefa reaberta." };
}

export async function deleteTask(formData: FormData): Promise<Result> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Tarefa inválida." };

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("organization_id", session.organizationId);
  if (error) return { ok: false, message: error.message };

  await audit("task.delete", id, {});
  revalidatePath("/tarefas");
  return { ok: true, message: "Tarefa excluída." };
}
