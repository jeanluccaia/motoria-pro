"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/supabase/types";

const ROLES: Role[] = ["admin", "marketing", "partner", "unit_manager"];

// Deriva a origem correta em qualquer ambiente a partir do request atual —
// mesma origem que o admin usou para acessar /config e disparar o convite.
// Deliberadamente NÃO consultamos NEXT_PUBLIC_APP_URL: uma env local
// desalinhada (ex: localhost) faria os convites saírem apontando para o
// host errado no Preview. `Host` + `x-forwarded-proto` são sempre corretos
// atrás do proxy da Vercel e em `next dev` local.
async function currentOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  if (!host) {
    throw new Error(
      "Não foi possível determinar o Host do request ao gerar redirectTo do convite.",
    );
  }
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function parseRole(v: FormDataEntryValue | null): Role {
  const s = String(v ?? "");
  if ((ROLES as string[]).includes(s)) return s as Role;
  throw new Error("Papel inválido.");
}

async function audit(action: string, targetId: string | null, metadata: Record<string, unknown>) {
  const session = await requireAdmin();
  const admin = getSupabaseAdmin();
  await admin.from("audit_log").insert({
    organization_id: session.organizationId,
    actor_id: session.userId,
    action,
    target_type: "user",
    target_id: targetId,
    metadata,
  });
}

export async function inviteUser(formData: FormData) {
  const session = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = parseRole(formData.get("role"));

  if (!email || !email.includes("@")) {
    return { ok: false, message: "Email inválido." };
  }

  const admin = getSupabaseAdmin();
  const redirectTo = `${await currentOrigin()}/api/auth/callback`;

  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });
  if (inviteErr && !/already been registered/i.test(inviteErr.message)) {
    return { ok: false, message: inviteErr.message };
  }

  let userId = invited?.user?.id;
  if (!userId) {
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase.from("users").select("id").ilike("email", email).maybeSingle();
    userId = profile?.id;
  }
  if (!userId) {
    return {
      ok: false,
      message: "Usuário criado, mas ainda não apareceu em public.users. Peça pra ele abrir o email e clicar no link.",
    };
  }

  const { error: linkErr } = await admin.from("user_organizations").upsert({
    user_id: userId,
    organization_id: session.organizationId,
    role,
  });
  if (linkErr) return { ok: false, message: linkErr.message };

  await audit("user.invite", userId, { email, role });
  revalidatePath("/config");
  return { ok: true, message: `Convite enviado para ${email}.` };
}

export async function changeRole(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const role = parseRole(formData.get("role"));

  if (userId === session.userId && role !== "admin") {
    return { ok: false, message: "Você não pode remover a si mesmo do papel de administrador." };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("user_organizations")
    .update({ role })
    .eq("organization_id", session.organizationId)
    .eq("user_id", userId);
  if (error) return { ok: false, message: error.message };

  await audit("user.role.change", userId, { role });
  revalidatePath("/config");
  return { ok: true, message: "Papel atualizado." };
}

export async function removeUser(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  if (userId === session.userId) {
    return { ok: false, message: "Você não pode remover a si mesmo." };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("user_organizations")
    .delete()
    .eq("organization_id", session.organizationId)
    .eq("user_id", userId);
  if (error) return { ok: false, message: error.message };

  await audit("user.remove", userId, {});
  revalidatePath("/config");
  return { ok: true, message: "Usuário removido da organização." };
}
