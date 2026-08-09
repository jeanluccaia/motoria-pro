#!/usr/bin/env node
// Define/atualiza senhas individuais para admins do Loud Flow.
//
// Modos:
//   * Padrão (interativo, senha individual por admin): keypress
//     events + mascaramento com "*", com fallback para CONIN$/CONOUT$
//     (Windows) e /dev/tty (POSIX) quando process.stdin não é TTY.
//   * --single (interativo, uma senha para vários): pede uma única
//     senha + confirmação e aplica a todos os admins exceto os
//     listados em LF_SKIP_EMAILS (default: jean.lucca@icloud.com).
//     Uso típico: alinhar as senhas dos demais admins com a senha
//     de uma conta de referência já cadastrada, sem tocar nela.
//   * --stdin: lê JSON { "email": "senha", ... } do stdin, aplica.
//     Usado pelo wrapper PowerShell set-admin-passwords.ps1.
//
// Segurança:
//   * Nunca imprime a senha nem no console nem no log — só e-mail +
//     resultado ("atualizada" / "senha curta" / erro específico).
//   * Não persiste senha em arquivo — o buffer da promise é descartado
//     assim que o Supabase confirma.
//   * `for await (stdin)` NÃO é usado: causava
//     `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` no
//     Windows quando combinado com setRawMode. Usamos keypress via
//     readline.emitKeypressEvents em cima do TTY, padrão consagrado
//     (mesmo que inquirer / prompts / read-password usam).

import { createClient } from "@supabase/supabase-js";
import { emitKeypressEvents } from "node:readline";
import { openSync } from "node:fs";
import { ReadStream, WriteStream } from "node:tty";
import { platform } from "node:process";

const MIN_PASSWORD_LENGTH = 10;
const MAX_MISMATCH_ATTEMPTS = 3;
// Admins que NUNCA devem ter a senha reescrita pelo modo --single.
// Padrão pensado para o MVP atual: Jean é a conta de referência.
// Sobrescrevível com LF_SKIP_EMAILS="a@b.com,c@d.com".
const DEFAULT_SKIP_EMAILS = "jean.lucca@icloud.com";

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

// ============================================================
// TTY / prompt
// ============================================================

// Devolve { input, output, close } — process.stdin/stdout quando são
// TTY; caso contrário abre o console do OS diretamente. Isso é o que
// resolve o cenário `npm run admin:passwords` no Windows, onde o npm
// às vezes pipeia stdio e faz `process.stdin.isTTY === false` mesmo
// rodando num terminal real.
function openTTY() {
  if (process.stdin.isTTY && process.stdout.isTTY) {
    return { input: process.stdin, output: process.stdout, close: () => {} };
  }
  try {
    const inPath = platform === "win32" ? "CONIN$" : "/dev/tty";
    const outPath = platform === "win32" ? "CONOUT$" : "/dev/tty";
    const inFd = openSync(inPath, "r+");
    const outFd = openSync(outPath, "r+");
    const input = new ReadStream(inFd);
    const output = new WriteStream(outFd);
    return {
      input,
      output,
      close: () => {
        try {
          input.destroy();
        } catch {
          /* noop */
        }
        try {
          output.destroy();
        } catch {
          /* noop */
        }
      },
    };
  } catch {
    return null;
  }
}

// Prompt de senha mascarada. Cada tecla imprimível vira `*` na tela.
// Backspace apaga (com feedback visual `\b \b`). Ctrl+C aborta o
// script inteiro. Enter finaliza a linha e resolve a promise.
function askMasked(tty, prompt) {
  return new Promise((resolve) => {
    const { input, output } = tty;
    output.write(prompt);
    emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();

    let buf = "";
    const cleanup = () => {
      input.removeListener("keypress", onKeypress);
      try {
        input.setRawMode(false);
      } catch {
        /* noop */
      }
      input.pause();
    };

    const onKeypress = (str, keyMeta) => {
      const key = keyMeta ?? {};
      // Ctrl+C — aborta todo o script.
      if (key.ctrl && key.name === "c") {
        output.write("\n");
        cleanup();
        process.exit(130);
      }
      // Enter / Return — fim da linha.
      if (key.name === "return" || key.name === "enter") {
        output.write("\n");
        cleanup();
        resolve(buf);
        return;
      }
      // Backspace / Delete — apaga um caractere e um `*`.
      if (key.name === "backspace" || key.name === "delete") {
        if (buf.length > 0) {
          buf = buf.slice(0, -1);
          output.write("\b \b");
        }
        return;
      }
      // Ignora setas, F-keys, page-up/down, etc. Nomes de teclas
      // especiais têm mais de 1 char (ex.: "up", "left", "escape").
      if (key.name && key.name.length > 1) return;
      // Aceita apenas caracteres imprimíveis únicos.
      if (str && str.length === 1 && str >= " ") {
        buf += str;
        output.write("*");
      }
    };

    input.on("keypress", onKeypress);
  });
}

// ============================================================
// Discovery / apply
// ============================================================

async function loadTargetEmails({ allRoles = false } = {}) {
  const envList = process.env.LF_ADMIN_EMAILS;
  if (envList) {
    return envList
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  // `allRoles=true` no modo --single: alinhamos a senha de multiplas
  // contas da mesma organizacao (nao so admins). O filtro por papel
  // fica na skip list — controle explicito, sem surpresa.
  const query = admin
    .from("user_organizations")
    .select("user_id, users!inner(email)");
  const { data, error } = await (allRoles ? query : query.eq("role", "admin"));
  if (error) fail(`Falha ao listar usuarios: ${error.message}`);
  return (data ?? [])
    .map((r) => (r.users?.email ?? "").toLowerCase())
    .filter(Boolean)
    .sort();
}

async function applyPassword(email, password) {
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

// ============================================================
// Interactive flow
// ============================================================

async function runInteractive() {
  const tty = openTTY();
  if (!tty) {
    fail(
      "Sem TTY disponível para prompt interativo.\n" +
        "Rode diretamente no seu terminal (sem npm run):\n" +
        "  node --env-file=.env.local supabase/seed/set_admin_passwords.mjs\n" +
        "Ou use o wrapper PowerShell no Windows:\n" +
        "  powershell -ExecutionPolicy Bypass -File supabase/seed/set-admin-passwords.ps1",
    );
  }

  const emails = await loadTargetEmails();
  if (emails.length === 0) fail("Nenhum admin encontrado.");

  tty.output.write(`\nVou pedir a senha de ${emails.length} admin(s).\n`);
  tty.output.write(`Cada tecla aparece como * na tela.\n`);
  tty.output.write(`Mínimo ${MIN_PASSWORD_LENGTH} caracteres. Confirmação obrigatória.\n`);
  tty.output.write(`Enter em branco pula o admin. Ctrl+C aborta o script.\n\n`);

  const updated = [];
  const failed = [];

  for (const email of emails) {
    tty.output.write(`${email}\n`);

    let attempt = 0;
    let handled = false;
    while (attempt < MAX_MISMATCH_ATTEMPTS && !handled) {
      attempt += 1;
      const pw1 = await askMasked(tty, `  senha:    `);
      if (pw1.length === 0) {
        tty.output.write(`  pulado (senha em branco).\n\n`);
        failed.push({ email, reason: "pulado pelo operador" });
        handled = true;
        break;
      }
      if (pw1.length < MIN_PASSWORD_LENGTH) {
        tty.output.write(
          `  senha muito curta (mínimo ${MIN_PASSWORD_LENGTH}). Tente de novo.\n`,
        );
        continue;
      }
      const pw2 = await askMasked(tty, `  confirme: `);
      if (pw1 !== pw2) {
        tty.output.write(`  as senhas não conferem. Tente de novo.\n`);
        continue;
      }
      const res = await applyPassword(email, pw1);
      if (res.ok) {
        tty.output.write(`  atualizada.\n\n`);
        updated.push(email);
      } else {
        tty.output.write(`  erro: ${res.reason}\n\n`);
        failed.push({ email, reason: res.reason });
      }
      handled = true;
    }
    if (!handled) {
      tty.output.write(
        `  desisti depois de ${MAX_MISMATCH_ATTEMPTS} tentativas. Pulado.\n\n`,
      );
      failed.push({
        email,
        reason: `sem confirmação após ${MAX_MISMATCH_ATTEMPTS} tentativas`,
      });
    }
  }

  tty.output.write(`\nAtualizados (${updated.length}):\n`);
  if (updated.length === 0) tty.output.write(`  (nenhum)\n`);
  for (const e of updated) tty.output.write(`  ${e}\n`);
  if (failed.length > 0) {
    tty.output.write(`\nNão atualizados (${failed.length}):\n`);
    for (const f of failed) tty.output.write(`  ${f.email}: ${f.reason}\n`);
    process.exitCode = 1;
  }
  tty.close();
}

// ============================================================
// Single-password flow (uma senha aplicada a vários admins)
// ============================================================

function parseSkipEmails() {
  const raw = process.env.LF_SKIP_EMAILS ?? DEFAULT_SKIP_EMAILS;
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function runSingle() {
  const tty = openTTY();
  if (!tty) {
    fail(
      "Sem TTY disponível para prompt interativo.\n" +
        "Rode diretamente no seu terminal (sem npm run):\n" +
        "  node --env-file=.env.local supabase/seed/set_admin_passwords.mjs --single\n" +
        "Ou use o wrapper PowerShell no Windows:\n" +
        "  powershell -NoProfile -ExecutionPolicy Bypass -File supabase/seed/set-admin-passwords.ps1 -Single",
    );
  }

  // --single: alinhar senha de N contas da org (qualquer papel), pulando
  // apenas as listadas em LF_SKIP_EMAILS (default: jean.lucca@icloud.com).
  const allEmails = await loadTargetEmails({ allRoles: true });
  if (allEmails.length === 0) fail("Nenhum membro da organizacao encontrado.");

  const skip = parseSkipEmails();
  const targets = allEmails.filter((e) => !skip.has(e));
  const skipped = allEmails.filter((e) => skip.has(e));

  if (targets.length === 0) {
    fail(
      `Nenhum admin restante depois de aplicar LF_SKIP_EMAILS.\n` +
        `Skip atual: ${[...skip].join(", ") || "(vazio)"}.`,
    );
  }

  tty.output.write(`\nModo --single: uma senha para ${targets.length} admin(s).\n`);
  tty.output.write(`Cada tecla aparece como * na tela.\n`);
  tty.output.write(
    `Mínimo ${MIN_PASSWORD_LENGTH} caracteres. Confirmação obrigatória.\n`,
  );
  tty.output.write(`Ctrl+C aborta o script sem aplicar nada.\n\n`);

  tty.output.write(`Serão atualizados:\n`);
  for (const e of targets) tty.output.write(`  ${e}\n`);
  if (skipped.length > 0) {
    tty.output.write(`\nPreservados (LF_SKIP_EMAILS):\n`);
    for (const e of skipped) tty.output.write(`  ${e}\n`);
  }
  tty.output.write(`\n`);

  let password = null;
  let attempts = 0;
  while (password === null && attempts < MAX_MISMATCH_ATTEMPTS) {
    attempts += 1;
    const pw1 = await askMasked(tty, `senha:    `);
    if (pw1.length === 0) {
      tty.output.write(`senha em branco — abortando sem aplicar nada.\n`);
      tty.close();
      process.exit(0);
    }
    if (pw1.length < MIN_PASSWORD_LENGTH) {
      tty.output.write(
        `senha muito curta (mínimo ${MIN_PASSWORD_LENGTH}). Tente de novo.\n`,
      );
      continue;
    }
    const pw2 = await askMasked(tty, `confirme: `);
    if (pw1 !== pw2) {
      tty.output.write(`as senhas não conferem. Tente de novo.\n`);
      continue;
    }
    password = pw1;
  }
  if (password === null) {
    tty.output.write(
      `desisti depois de ${MAX_MISMATCH_ATTEMPTS} tentativas. Nada foi aplicado.\n`,
    );
    tty.close();
    process.exit(1);
  }

  tty.output.write(`\nAplicando via Supabase...\n\n`);
  const updated = [];
  const failed = [];
  for (const email of targets) {
    const res = await applyPassword(email, password);
    if (res.ok) {
      tty.output.write(`  ${email}: atualizada.\n`);
      updated.push(email);
    } else {
      tty.output.write(`  ${email}: erro — ${res.reason}\n`);
      failed.push({ email, reason: res.reason });
    }
  }
  // Descarta a senha da memória do interpretador o quanto antes.
  password = null;

  tty.output.write(`\nResumo:\n`);
  tty.output.write(`  atualizados: ${updated.length}\n`);
  tty.output.write(`  preservados: ${skipped.length} (${[...skip].join(", ") || "-"})\n`);
  tty.output.write(`  falhas:      ${failed.length}\n`);
  if (failed.length > 0) {
    tty.output.write(`\nFalhas por admin:\n`);
    for (const f of failed) tty.output.write(`  ${f.email}: ${f.reason}\n`);
    process.exitCode = 1;
  }
  tty.close();
}

// ============================================================
// JSON stdin flow (batch, usado pelo wrapper PowerShell)
// ============================================================

async function runStdinJson() {
  const raw = await new Promise((resolve) => {
    let acc = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (d) => (acc += d));
    process.stdin.on("end", () => resolve(acc));
  });
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    fail(`JSON inválido no stdin: ${e.message}`);
  }
  if (!obj || typeof obj !== "object") {
    fail("Esperado objeto JSON { email: senha, ... }.");
  }
  const pairs = new Map();
  for (const [e, p] of Object.entries(obj)) {
    if (typeof e === "string" && typeof p === "string") {
      pairs.set(e.toLowerCase(), p);
    }
  }
  if (pairs.size === 0) fail("Nenhum par email/senha válido no JSON.");

  const updated = [];
  const failed = [];
  for (const [email, password] of pairs) {
    if (password.length < MIN_PASSWORD_LENGTH) {
      failed.push({ email, reason: `senha curta (mínimo ${MIN_PASSWORD_LENGTH})` });
      continue;
    }
    const res = await applyPassword(email, password);
    if (res.ok) updated.push(email);
    else failed.push({ email, reason: res.reason });
  }
  console.log(`Atualizados (${updated.length}):`);
  if (updated.length === 0) console.log(`  (nenhum)`);
  for (const e of updated) console.log(`  ${e}`);
  if (failed.length > 0) {
    console.log(`\nNão atualizados (${failed.length}):`);
    for (const f of failed) console.log(`  ${f.email}: ${f.reason}`);
    process.exitCode = 1;
  }
}

// ============================================================
// Main
// ============================================================

async function main() {
  if (process.argv.includes("--stdin")) {
    await runStdinJson();
  } else if (process.argv.includes("--single")) {
    await runSingle();
  } else {
    await runInteractive();
  }
}

await main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
