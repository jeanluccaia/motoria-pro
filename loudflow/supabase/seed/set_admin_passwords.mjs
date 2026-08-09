#!/usr/bin/env node
// Define/atualiza senhas individuais para admins do Loud Flow.
//
// Segurança:
//   * NENHUMA senha é lida de arquivo commitado nem de env variable.
//   * Modo padrão: prompt interativo com echo desligado — a senha
//     digitada NÃO aparece na tela e NÃO fica no histórico do shell.
//   * Modo lote (--stdin): aceita JSON em stdin, útil para colar
//     senhas de um cofre local e apagar em seguida. Nada é ecoado.
//   * Nunca imprime a senha nem no console nem no log — só o e-mail e
//     o resultado ("atualizada" / "senha curta" / "usuário não
//     encontrado").
//
// Uso:
//   node --env-file=.env.local supabase/seed/set_admin_passwords.mjs
//     → busca todos os admins da org "loud-fit" e pergunta uma senha
//       para cada. Enter em branco pula.
//
//   LF_ADMIN_EMAILS="a@b.com,c@d.com" \
//     node --env-file=.env.local supabase/seed/set_admin_passwords.mjs
//     → só pergunta pelos e-mails da lista.
//
//   type pw.json | node --env-file=.env.local ...set_admin_passwords.mjs --stdin
//     → lê { "email": "senha", ... } via stdin, aplica, sai.
//       Depois: `del pw.json` (ou `rm pw.json`).
//
// Requisitos:
//   * SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL no ambiente.
//   * Usuários já devem existir em auth.users. Não criamos ninguém
//     novo por aqui — cadastro público continua desligado.

import { createClient } from "@supabase/supabase-js";

const MIN_PASSWORD_LENGTH = 10;
const CTRL_C = "";
const DEL = "";
const BS = "\b";

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url) fail("Faltam NEXT_PUBLIC_SUPABASE_URL.");
if (!key) fail("Faltam SUPABASE_SERVICE_ROLE_KEY.");

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ----- input helpers ------------------------------------------------

async function readAllStdin() {
  return new Promise((resolve) => {
    let acc = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (d) => (acc += d));
    process.stdin.on("end", () => resolve(acc));
  });
}

// Prompt sem exibir a senha na tela. Funciona em TTY (Windows Terminal,
// PowerShell, bash/mingw). Fora de TTY (stdin redirecionado) devolve
// null — caller decide.
async function askHiddenLine(prompt) {
  const stdin = process.stdin;
  if (!stdin.isTTY) return null;
  process.stdout.write(prompt);
  stdin.setEncoding("utf8");
  stdin.setRawMode(true);
  let buf = "";
  try {
    for await (const chunk of stdin) {
      for (const ch of chunk) {
        // Enter finaliza a linha.
        if (ch === "\r" || ch === "\n") {
          process.stdout.write("\n");
          return buf;
        }
        // Ctrl+C (U+0003) aborta o script todo.
        if (ch === CTRL_C) {
          process.stdout.write("\n");
          process.exit(130);
        }
        // Backspace (POSIX U+007F, outros terminais U+0008) apaga —
        // sem eco.
        if (ch === DEL || ch === BS) {
          if (buf.length > 0) buf = buf.slice(0, -1);
          continue;
        }
        // Ignora outros caracteres de controle (< U+0020), exceto tab.
        if (ch < " " && ch !== "\t") continue;
        buf += ch;
      }
    }
    return buf;
  } finally {
    stdin.setRawMode(false);
    stdin.pause();
  }
}

// ----- admin discovery ---------------------------------------------

async function loadTargetEmails() {
  const envList = process.env.LF_ADMIN_EMAILS;
  if (envList) {
    return envList
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  const { data, error } = await admin
    .from("user_organizations")
    .select("user_id, users!inner(email)")
    .eq("role", "admin");
  if (error) fail(`Falha ao listar admins: ${error.message}`);
  return (data ?? [])
    .map((r) => (r.users?.email ?? "").toLowerCase())
    .filter(Boolean)
    .sort();
}

async function collectPairsInteractive(emails) {
  if (!process.stdin.isTTY) {
    fail(
      "Sem TTY para prompt interativo. Use `--stdin` com JSON ou LF_ADMIN_EMAILS + terminal.",
    );
  }
  console.log(`Vou pedir a senha de ${emails.length} admin(s). Enter em branco pula.`);
  console.log(`(mínimo ${MIN_PASSWORD_LENGTH} caracteres; nada é ecoado)`);
  const pairs = new Map();
  for (const email of emails) {
const pw = await askHiddenLine(`  ${email}: `);
    if (pw && pw.length > 0) pairs.set(email, pw);
  }
  return pairs;
}

async function collectPairsFromStdinJson() {
  const raw = await readAllStdin();
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    fail(`JSON inválido no stdin: ${e.message}`);
  }
  if (!obj || typeof obj !== "object") fail("Esperado objeto JSON { email: senha, ... }.");
  const pairs = new Map();
  for (const [e, p] of Object.entries(obj)) {
    if (typeof e !== "string" || typeof p !== "string") continue;
    pairs.set(e.toLowerCase(), p);
  }
  return pairs;
}

// ----- apply --------------------------------------------------------

async function applyPair(email, password) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, reason: `senha curta (mínimo ${MIN_PASSWORD_LENGTH})` };
  }
  const { data: userRow, error: findErr } = await admin
    .from("users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (findErr) return { ok: false, reason: findErr.message };
  if (!userRow) return { ok: false, reason: "usuário não encontrado em public.users" };

  const { error: upErr } = await admin.auth.admin.updateUserById(userRow.id, {
    password,
  });
  if (upErr) return { ok: false, reason: upErr.message };
  return { ok: true };
}

// ----- main ---------------------------------------------------------

async function main() {
  const useStdin = process.argv.includes("--stdin");
  let pairs;
  if (useStdin) {
    pairs = await collectPairsFromStdinJson();
  } else {
    const emails = await loadTargetEmails();
    if (emails.length === 0) fail("Nenhum admin encontrado.");
    pairs = await collectPairsInteractive(emails);
  }

  if (pairs.size === 0) {
    console.log("Nada a fazer — nenhuma senha fornecida.");
    return;
  }

  let ok = 0;
  let fails = 0;
  for (const [email, password] of pairs) {
const res = await applyPair(email, password);
    if (res.ok) {
      console.log(`  ${email}: atualizada.`);
      ok += 1;
    } else {
      console.error(`  ${email}: ${res.reason}`);
      fails += 1;
    }
  }
  console.log(`\nFeito. Sucesso: ${ok}. Falhas: ${fails}.`);
  if (useStdin) {
    console.log(
      "Lembrete: apague o arquivo local usado como stdin " +
        "(ex.: `del pw.json` ou `rm pw.json`) e limpe o histórico do shell se " +
        "colou a senha à mão.",
    );
  }
  if (fails > 0) process.exitCode = 1;
}

await main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
