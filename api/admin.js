"use strict";

/**
 * Consolidated admin handler.
 *
 * Use:
 *   POST /api/admin?action=grant
 *   GET  /api/admin?action=status
 *   POST /api/admin?action=access-code
 */

const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
const { ALLOWED_ORIGINS } = require("./_cors");

const ADMIN_SECRET = process.env.ADMIN_SECRET;
const SB_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "MotorIA <acesso@motoriaopro.com.br>";
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const DEFAULT_MAX_USES = 20;
const ACCESS_CODE_TTL = 86400 * 180;

function normalizeEmail(e) {
  return String(e || "").trim().toLowerCase();
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function normalizeCode(c) {
  return String(c || "").trim().toUpperCase().replace(/\s+/g, "");
}

function mask(v) {
  if (!v) return null;
  const s = String(v);
  return s.slice(0, 6) + "..." + s.slice(-4);
}

function isMissingTable(error) {
  const msg = String(error?.message || "").toLowerCase();
  return error?.code === "42P01" || msg.includes("does not exist") || msg.includes("schema cache");
}

function getAppUrl() {
  return (process.env.APP_URL || "https://motoria-pro.vercel.app").replace(/\/$/, "");
}

function createAdminClient() {
  return createClient(SB_URL, SB_SRV, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function generateAccessCode({ email, source }) {
  const seed = `${email}:${source || "admin"}:${ADMIN_SECRET || SB_SRV || Date.now()}`;
  const hash = crypto.createHash("sha256").update(seed).digest("hex").slice(0, 9).toUpperCase();
  return normalizeCode(`MTR${hash}`);
}

async function redisSet(key, value, ttlSecs) {
  if (!REDIS_URL || !REDIS_TOKEN) return;
  const stored = typeof value === "object" ? JSON.stringify(value) : String(value);
  try {
    await fetch(REDIS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["SET", key, stored, "EX", ttlSecs]),
    });
  } catch {
    // Optional fallback only.
  }
}

async function findOrCreateUser(supabase, email, source) {
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { source: "admin_grant", grant_source: source },
  });

  if (!createErr && created?.user) return { user: created.user, step: "created" };

  let page = 1;
  while (true) {
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (listErr || !list?.users) break;
    const found = list.users.find(u => normalizeEmail(u.email) === email);
    if (found) return { user: found, step: "found_existing" };
    if (!list.nextPage) break;
    page++;
  }

  return { user: null, step: "not_found" };
}

async function persistProfile(supabase, user, email, source) {
  const fullProfile = {
    id: user.id,
    email,
    is_paid: true,
    paid_at: new Date().toISOString(),
    payment_id: source,
  };

  const { error } = await supabase.from("profiles").upsert(fullProfile, { onConflict: "id" });
  if (!error) return "is_paid=true";

  const { error: minErr } = await supabase
    .from("profiles")
    .upsert({ id: user.id, email, is_paid: true }, { onConflict: "id" });
  return minErr ? `error: ${minErr.message}` : "is_paid=true (fallback)";
}

async function persistAccessCode(supabase, code, maxUses, active = true, expiresAt = null) {
  const row = {
    code,
    max_uses: maxUses,
    active,
    expires_at: expiresAt,
  };

  const { data, error } = await supabase
    .from("access_codes")
    .upsert(row, { onConflict: "code" })
    .select("code,max_uses,used_count,active,created_at,expires_at")
    .single();

  await redisSet(`access_code:${code}`, {
    code,
    max_uses: maxUses,
    active,
    expires_at: expiresAt,
  }, ACCESS_CODE_TTL);

  if (error && !isMissingTable(error)) throw error;
  return data || { code, max_uses: maxUses, used_count: 0, active, expires_at: expiresAt };
}

async function persistGrant(supabase, { email, user, source, code }) {
  try {
    const payload = {
      email,
      user_id: user.id,
      code,
      source,
      status: "active",
      last_login_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("access_grants").insert(payload);
    if (!error) return "active";
    if (isMissingTable(error)) return "table_missing";

    const { error: updateErr } = await supabase
      .from("access_grants")
      .update({
        user_id: user.id,
        source,
        status: "active",
        last_login_at: payload.last_login_at,
      })
      .eq("email", email)
      .eq("code", code);

    return updateErr ? `error: ${updateErr.message}` : "active";
  } catch (err) {
    return `ignored: ${String(err.message || err).slice(0, 120)}`;
  }
}

async function sendAccessCodeEmail({ email, code, appUrl }) {
  if (!RESEND_KEY) return "RESEND_API_KEY ausente";

  const loginUrl = `${appUrl}/login`;
  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [email],
      subject: "Seu acesso ao MotorIA Pro",
      html: buildAccessCodeEmail({ code, loginUrl }),
    }),
  });

  const data = await emailRes.json().catch(() => ({}));
  return emailRes.ok ? `enviado (${data.id || "sem_id"})` : `error: ${data?.message || emailRes.status}`;
}

async function handleGrant(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const email = normalizeEmail(req.body?.email);
  const source = String(req.body?.source || req.body?.note || "manual_test").trim().slice(0, 100) || "manual_test";
  const providedCode = normalizeCode(req.body?.code);
  const code = providedCode || generateAccessCode({ email, source });
  const maxUses = Math.max(1, Math.min(100000, Number(req.body?.max_uses || req.body?.maxUses || DEFAULT_MAX_USES) || DEFAULT_MAX_USES));
  const sendEmail = req.body?.sendEmail === undefined ? true : Boolean(req.body.sendEmail);

  if (!isValidEmail(email)) return res.status(400).json({ error: "Email invalido." });
  if (!SB_URL || !SB_SRV) return res.status(500).json({ error: "Supabase env vars ausentes." });

  const supabase = createAdminClient();
  const result = { email, source, code, steps: {} };

  const { user, step } = await findOrCreateUser(supabase, email, source);
  result.steps.user = step;
  if (!user) return res.status(500).json({ error: "Falha ao criar/encontrar usuario.", result });

  result.steps.profiles = await persistProfile(supabase, user, email, source);
  await redisSet(`auth_email:${email}`, "1", 86400 * 60);
  result.steps.redis = "set (se configurado)";

  const accessCode = await persistAccessCode(supabase, code, maxUses, true, null);
  result.steps.access_codes = accessCode.active === false ? "inactive" : "active";
  result.steps.access_grants = await persistGrant(supabase, { email, user, source, code });

  const appUrl = getAppUrl();

  result.steps.email = sendEmail
    ? await sendAccessCodeEmail({ email, code, appUrl })
    : "pulado por sendEmail=false";

  return res.status(200).json({
    success: true,
    uid: user.id,
    code,
    result,
  });
}

async function handleStatus(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const TESTER_EMAILS_RAW = process.env.TESTER_EMAILS || "";
  const testerEmails = TESTER_EMAILS_RAW.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const report = {
    timestamp: new Date().toISOString(),
    env: {
      VITE_SUPABASE_URL: SB_URL ? `OK ${SB_URL}` : "AUSENTE",
      SUPABASE_SERVICE_ROLE_KEY: SB_SRV ? `OK ${mask(SB_SRV)}` : "AUSENTE",
      RESEND_API_KEY: RESEND_KEY ? `OK ${mask(RESEND_KEY)}` : "AUSENTE",
      RESEND_FROM: RESEND_FROM ? `OK ${RESEND_FROM}` : "AUSENTE",
      APP_URL: process.env.APP_URL ? `OK ${process.env.APP_URL}` : "AUSENTE",
      KIWIFY_WEBHOOK_SECRET: process.env.KIWIFY_WEBHOOK_SECRET ? `OK ${mask(process.env.KIWIFY_WEBHOOK_SECRET)}` : "AUSENTE",
      ADMIN_SECRET: ADMIN_SECRET ? "configurado" : "AUSENTE",
      UPSTASH_REDIS_REST_URL: REDIS_URL ? `OK ${mask(REDIS_URL)}` : "AUSENTE",
      TESTER_EMAILS: testerEmails.length ? `${testerEmails.length} emails` : "AUSENTE",
    },
    cors: { allowed_origins: [...ALLOWED_ORIGINS], app_url: process.env.APP_URL || "nao configurado" },
    connectivity: {},
  };

  if (SB_URL && SB_SRV) {
    try {
      const sb = createAdminClient();
      const { data, error } = await sb.from("profiles").select("id").limit(1);
      report.connectivity.supabase_profiles = error ? `ERRO: ${error.message}` : `OK (${data?.length ?? 0} rows)`;
      const { data: users, error: userErr } = await sb.auth.admin.listUsers({ page: 1, perPage: 1 });
      report.connectivity.supabase_auth_admin = userErr ? `ERRO: ${userErr.message}` : `OK (total: ${users?.total ?? "?"})`;
      const { data: codes, error: codeErr } = await sb.from("access_codes").select("code").limit(1);
      report.connectivity.access_codes = codeErr ? `ERRO: ${codeErr.message}` : `OK (${codes?.length ?? 0} rows checked)`;
    } catch (e) {
      report.connectivity.supabase = `EXCECAO: ${e.message}`;
    }
  } else {
    report.connectivity.supabase = "env vars ausentes";
  }

  return res.status(200).json(report);
}

async function handleAccessCode(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!SB_URL || !SB_SRV) return res.status(500).json({ error: "Supabase env vars ausentes." });

  const code = normalizeCode(req.body?.code || generateAccessCode({
    email: String(req.body?.label || "admin_code"),
    source: String(Date.now()),
  }));
  if (!code) return res.status(400).json({ error: "Codigo ausente." });

  const maxUses = Math.max(1, Math.min(100000, Number(req.body?.max_uses || req.body?.maxUses || DEFAULT_MAX_USES) || DEFAULT_MAX_USES));
  const active = req.body?.active === undefined ? true : Boolean(req.body.active);
  const expiresAt = req.body?.expires_at || req.body?.expiresAt || null;

  const supabase = createAdminClient();
  const data = await persistAccessCode(supabase, code, maxUses, active, expiresAt);

  console.log(`[admin/access-code] code=${code} max_uses=${maxUses} active=${active}`);
  return res.status(200).json({ ok: true, code: data });
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!ADMIN_SECRET || req.headers["x-admin-secret"] !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const action = String(req.query?.action || "").trim();
  if (action === "grant") return handleGrant(req, res);
  if (action === "status") return handleStatus(req, res);
  if (action === "access-code") return handleAccessCode(req, res);

  return res.status(400).json({ error: "action invalida. Use: grant | status | access-code" });
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildAccessCodeEmail({ code, loginUrl }) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:40px 16px;background:#060608;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:480px;margin:0 auto;background:#0B0B0F;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:40px;">
  <p style="margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:.16em;color:#22C55E;text-transform:uppercase;">Compra aprovada</p>
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;color:#DDDDE0;line-height:1.2;">Seu acesso ao MotorIA Pro esta liberado.</h1>
  <p style="margin:0 0 18px;font-size:14px;color:#A1A1AA;line-height:1.7;">Use o email da compra e este codigo de acesso:</p>
  <div style="margin:0 0 24px;padding:16px 18px;background:#111118;border:1px solid rgba(34,197,94,.35);border-radius:10px;">
    <p style="margin:0;font-size:26px;color:#22C55E;font-weight:900;letter-spacing:.08em;font-family:'Courier New',monospace;">${escapeHtml(code)}</p>
  </div>
  <p style="margin:0 0 28px;font-size:14px;color:#A1A1AA;line-height:1.7;">No login, digite seu email + codigo.</p>
  <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#22C55E;color:#050507;font-size:13px;font-weight:900;letter-spacing:.08em;text-decoration:none;padding:14px 28px;border-radius:8px;text-transform:uppercase;">
    Entrar no MotorIA Pro
  </a>
  <p style="margin:20px 0 0;font-size:10px;color:#71717A;word-break:break-all;">Link do login: <a href="${escapeHtml(loginUrl)}" style="color:#22C55E;">${escapeHtml(loginUrl)}</a></p>
</div>
</body></html>`;
}
