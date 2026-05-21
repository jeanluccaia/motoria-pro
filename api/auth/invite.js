"use strict";

/**
 * POST /api/auth/invite
 * Body: { email: string, code: string }
 *
 * Legacy invite entrypoint kept for internal/manual use.
 * It no longer sends magic links. It grants an access code instead.
 */

const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
const { applyCors, resolveAppUrl } = require("../_cors");
const db = require("../_db");

const SB_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SB_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "MotorIA <acesso@motoriaopro.com.br>";
const INVITE_CODE = process.env.INVITE_CODE || "";
const DEFAULT_MAX_USES = 20;

function normalizeEmail(e) {
  return String(e || "").trim().toLowerCase();
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function normalizeCode(c) {
  return String(c || "").trim().toUpperCase().replace(/\s+/g, "");
}

function isMissingTable(error) {
  const msg = String(error?.message || "").toLowerCase();
  return error?.code === "42P01" || msg.includes("does not exist") || msg.includes("schema cache");
}

function generateAccessCode(email) {
  const seed = `${email}:invite:${INVITE_CODE || SB_SRV || Date.now()}`;
  return normalizeCode(`MTR${crypto.createHash("sha256").update(seed).digest("hex").slice(0, 9).toUpperCase()}`);
}

async function findOrCreateUser(sb, email) {
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { source: "invite" },
  });

  if (!createErr && created?.user) return created.user;

  let page = 1;
  while (true) {
    const { data: list, error: listErr } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (listErr || !list?.users) break;
    const found = list.users.find(u => normalizeEmail(u.email) === email);
    if (found) return found;
    if (!list.nextPage) break;
    page++;
  }

  return null;
}

async function persistAccessCode(sb, code) {
  const { error } = await sb
    .from("access_codes")
    .upsert({ code, max_uses: DEFAULT_MAX_USES, active: true }, { onConflict: "code" });

  if (error && !isMissingTable(error)) throw error;

  await db.set(`access_code:${code}`, {
    code,
    max_uses: DEFAULT_MAX_USES,
    active: true,
  }, 86400 * 180);
}

async function sendAccessCodeEmail({ email, code, loginUrl }) {
  if (!RESEND_KEY) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [email],
      subject: "Seu acesso ao MotorIA Pro",
      html: buildEmail({ code, loginUrl }),
    }),
  });

  return res.ok;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const email = normalizeEmail(req.body?.email);
  const inviteCode = String(req.body?.code || "").trim();

  if (!isValidEmail(email)) return res.status(400).json({ error: "Email invalido." });
  if (!INVITE_CODE || inviteCode !== INVITE_CODE) {
    return res.status(403).json({ error: "Codigo de convite invalido." });
  }
  if (!SB_URL || !SB_SRV) return res.status(500).json({ error: "Configuracao do servidor incompleta." });

  const sb = createClient(SB_URL, SB_SRV, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const user = await findOrCreateUser(sb, email);
  if (!user) return res.status(500).json({ error: "Erro ao criar conta. Tente novamente." });

  await sb.from("profiles").upsert({
    id: user.id,
    email,
    is_paid: true,
    paid_at: new Date().toISOString(),
    payment_id: "invite",
  }, { onConflict: "id" });

  const accessCode = generateAccessCode(email);
  await persistAccessCode(sb, accessCode);
  await sb.from("access_grants").insert({
    email,
    user_id: user.id,
    code: accessCode,
    source: "invite",
    status: "active",
    last_login_at: new Date().toISOString(),
  });

  const appUrl = resolveAppUrl(req, res);
  if (!appUrl) return;
  await sendAccessCodeEmail({ email, code: accessCode, loginUrl: `${appUrl}/login` });

  console.log(`[invite] acesso liberado por codigo email=${email}`);
  return res.status(200).json({ ok: true, code: accessCode });
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmail({ code, loginUrl }) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:40px 16px;background:#060608;font-family:sans-serif;">
<div style="max-width:460px;margin:0 auto;background:#0B0B0F;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:40px 36px;">
  <p style="margin:0 0 10px;font-size:10px;font-weight:800;letter-spacing:.16em;color:#22C55E;text-transform:uppercase;">Acesso liberado</p>
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;color:#DDDDE0;line-height:1.2;">Seu acesso ao MotorIA Pro esta ativo.</h1>
  <p style="margin:0 0 18px;font-size:14px;color:#A1A1AA;line-height:1.7;">Use seu email e este codigo de acesso:</p>
  <p style="margin:0 0 24px;padding:16px 18px;background:#111118;border:1px solid rgba(34,197,94,.35);border-radius:10px;color:#22C55E;font-size:26px;font-weight:900;letter-spacing:.08em;font-family:'Courier New',monospace;">${escapeHtml(code)}</p>
  <a href="${escapeHtml(loginUrl)}" style="display:block;background:#22C55E;color:#050507;font-size:13px;font-weight:900;letter-spacing:.08em;text-decoration:none;padding:14px 0;border-radius:8px;text-transform:uppercase;text-align:center;">
    Entrar no MotorIA Pro
  </a>
</div>
</body></html>`;
}
