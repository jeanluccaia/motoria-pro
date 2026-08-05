#!/usr/bin/env node
// Vincula SEED_ADMIN_EMAIL como admin da organização "loud-fit".
// Pré-requisito: o usuário já deve ter feito login pelo menos uma vez
// (magic link) para existir em auth.users e public.users.
//
// Uso: node supabase/seed/seed_admin.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_ADMIN_EMAIL;

if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!email) {
  console.error("Faltam SEED_ADMIN_EMAIL.");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const { data: org, error: orgErr } = await admin
  .from("organizations")
  .select("id, name")
  .eq("slug", "loud-fit")
  .single();
if (orgErr || !org) {
  console.error("Organização loud-fit não encontrada. Rode a seed SQL primeiro.");
  process.exit(1);
}

const { data: user, error: userErr } = await admin
  .from("users")
  .select("id, email")
  .ilike("email", email)
  .maybeSingle();
if (userErr || !user) {
  console.error(
    `Usuário com email ${email} não existe ainda. Faça login uma vez pelo magic link e rode de novo.`,
  );
  process.exit(1);
}

const { error: upErr } = await admin
  .from("user_organizations")
  .upsert({ user_id: user.id, organization_id: org.id, role: "admin" });
if (upErr) {
  console.error("Falha ao vincular admin:", upErr.message);
  process.exit(1);
}

console.log(`OK — ${user.email} agora é admin de ${org.name}.`);
