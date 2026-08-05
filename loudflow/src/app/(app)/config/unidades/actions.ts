"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function audit(action: string, unitId: string, metadata: Record<string, unknown>) {
  const session = await requireAdmin();
  const admin = getSupabaseAdmin();
  await admin.from("audit_log").insert({
    organization_id: session.organizationId,
    actor_id: session.userId,
    action,
    target_type: "unit",
    target_id: unitId,
    metadata,
  });
}

export async function createUnit(formData: FormData) {
  const session = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "Informe o nome." };
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugInput ? slugify(slugInput) : slugify(name);
  if (!slug) return { ok: false, message: "Slug inválido." };

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("units")
    .insert({ organization_id: session.organizationId, name, slug })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  await audit("unit.create", data.id, { name, slug });
  revalidatePath("/config/unidades");
  return { ok: true, message: "Unidade criada." };
}

export async function renameUnit(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return { ok: false, message: "Dados incompletos." };

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("units")
    .update({ name })
    .eq("id", id)
    .eq("organization_id", session.organizationId);
  if (error) return { ok: false, message: error.message };

  await audit("unit.rename", id, { name });
  revalidatePath("/config/unidades");
  return { ok: true, message: "Nome atualizado." };
}

export async function toggleArchive(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("units")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("organization_id", session.organizationId);
  if (error) return { ok: false, message: error.message };

  await audit(archived ? "unit.archive" : "unit.unarchive", id, {});
  revalidatePath("/config/unidades");
  return { ok: true, message: archived ? "Unidade arquivada." : "Unidade reativada." };
}
