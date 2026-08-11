#!/usr/bin/env node
// Gera links de recuperação de senha para usuários da organização.
//
// Uso:
//   * Sem args → gera link para todos os membros da org (menos os
//     listados em LF_SKIP_EMAILS, default: jean.lucca@icloud.com).
//   * Com args → gera link só para os e-mails passados na linha.
//
// Exemplo:
//   node --env-file=.env.local supabase/seed/send_recovery_links.mjs \
//     andresbroggio@hotmail.com cmmussato@gmail.com
//
// Segurança:
//   * Nunca envia o link por SMTP — imprime na tela para o admin
//     distribuir por canal seguro (WhatsApp direto do sócio).
//   * NEXT_PUBLIC_APP_URL define a origem do redirectTo. Sem essa env,
//     usa https://loudflow.vercel.app (produção). Nunca aponta para
//     localhost automaticamente.
//   * Requer SUPABASE_SERVICE_ROLE_KEY — só rode em ambiente do admin.
//   * O link expira conforme configurado no Supabase Auth (padrão 24h).

import { createClient } from "@supabase/supabase-js";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://loudflow.vercel.app";
const DEFAULT_SKIP = "jean.lucca@icloud.com";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseSkip() {
  const raw = process.env.LF_SKIP_EMAILS ?? DEFAULT_SKIP;
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function loadTargetsFromDb() {
  const skip = parseSkip();
  const { data, error } = await admin
    .from("user_organizations")
    .select("users!inner(email)");
  if (error) {
    console.error(`Falha ao listar usuários: ${error.message}`);
    process.exit(1);
  }
  return (data ?? [])
    .map((r) => (r.users?.email ?? "").toLowerCase())
    .filter(Boolean)
    .filter((e) => !skip.has(e))
    .sort();
}

async function main() {
  const argv = process.argv.slice(2).map((s) => s.trim().toLowerCase()).filter(Boolean);
  const emails = argv.length > 0 ? argv : await loadTargetsFromDb();
  if (emails.length === 0) {
    console.log("Nenhum destinatário — nada a fazer.");
    return;
  }

  const redirectTo = `${APP_URL}/api/auth/callback?type=recovery`;
  console.log(`\nGerando ${emails.length} link(s) de recovery.`);
  console.log(`Destino após clique: ${redirectTo}\n`);

  for (const email of emails) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (error) {
      console.log(`❌ ${email}\n   erro: ${error.message}\n`);
      continue;
    }
    const link = data?.properties?.action_link;
    if (!link) {
      console.log(`❌ ${email}\n   generateLink não devolveu action_link\n`);
      continue;
    }
    console.log(`✅ ${email}`);
    console.log(`   ${link}\n`);
  }

  console.log(`Cole cada link no WhatsApp da pessoa correspondente.`);
  console.log(`O link expira conforme configurado no Supabase Auth (padrão 24h).`);
}

await main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
