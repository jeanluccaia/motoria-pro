#!/usr/bin/env node
// Imprime, um por linha, os e-mails dos admins da organizacao. Usado
// pelo wrapper PowerShell set-admin-passwords.ps1 para descobrir a
// lista antes de pedir as senhas.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await admin
  .from("user_organizations")
  .select("users!inner(email)")
  .eq("role", "admin");

if (error) {
  console.error(error.message);
  process.exit(1);
}

const emails = (data ?? [])
  .map((r) => (r.users?.email ?? "").toLowerCase())
  .filter(Boolean)
  .sort();

for (const e of emails) {
  console.log(e);
}
