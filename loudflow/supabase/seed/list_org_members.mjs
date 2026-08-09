#!/usr/bin/env node
// Imprime, um por linha, os e-mails de TODOS os membros da organizacao
// -- independente do papel. Usado pelo wrapper PowerShell no modo
// -Single, onde queremos alinhar a senha de varias contas mesmo que
// nem todas tenham role='admin'.
//
// Complementa list_admins.mjs (que so devolve role='admin').

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
  .select("users!inner(email)");

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
