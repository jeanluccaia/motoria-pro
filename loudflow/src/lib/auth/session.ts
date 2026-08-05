import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/supabase/types";

export type Session = {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  organizationId: string;
  organizationName: string;
  role: Role;
  unitIds: string[];
};

export async function getSession(): Promise<Session | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return null;

  const { data: membership } = await supabase
    .from("user_organizations")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", membership.organization_id)
    .maybeSingle();
  if (!org) return null;

  const { data: units } = await supabase
    .from("user_units")
    .select("unit_id")
    .eq("user_id", user.id);

  return {
    userId: profile.id,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.avatar_url,
    organizationId: org.id,
    organizationName: org.name,
    role: membership.role,
    unitIds: (units ?? []).map((u) => u.unit_id),
  };
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireAdmin(): Promise<Session> {
  const s = await requireSession();
  if (s.role !== "admin") redirect("/");
  return s;
}
