"use strict";

/**
 * POST /api/webhook/payment
 *
 * Kiwify payment webhook.
 *
 * Final MVP flow:
 *   1. Receive approved payment
 *   2. Create/find Supabase user
 *   3. Mark profile as paid
 *   4. Create an access code
 *   5. Create/update access_grants
 *   6. Send the customer an email with email + code login instructions
 */

const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const SB_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "MotorIA <acesso@motoriaopro.com.br>";
const WH_SECRET = process.env.KIWIFY_WEBHOOK_SECRET || "";
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const PAID_STATUSES = ["paid", "approved", "complete", "completed", "active", "order_approved"];
const DEFAULT_MAX_USES = 20;
const ACCESS_CODE_TTL = 86400 * 180;

function getAppUrl() {
  return (process.env.APP_URL || "https://motoria-pro.vercel.app").replace(/\/$/, "");
}

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

function firstValue(...values) {
  return values.find(v => v !== undefined && v !== null && String(v).trim() !== "") || "";
}

function extractEmail(body) {
  return normalizeEmail(firstValue(
    body?.Customer?.email,
    body?.customer?.email,
    body?.customer?.email_address,
    body?.data?.customer?.email,
    body?.data?.Customer?.email,
    body?.buyer?.email,
    body?.email
  ));
}

function extractName(body) {
  return String(firstValue(
    body?.Customer?.full_name,
    body?.customer?.full_name,
    body?.customer?.name,
    body?.data?.customer?.full_name,
    body?.buyer?.name
  )).trim();
}

function extractOrderId(body) {
  return String(firstValue(
    body?.order_id,
    body?.orderId,
    body?.id,
    body?.data?.order_id,
    body?.data?.id
  )).trim();
}

function extractStatus(body) {
  return String(firstValue(
    body?.order_status,
    body?.status,
    body?.payment_status,
    body?.webhook_event_type,
    body?.event,
    body?.data?.status
  )).toLowerCase();
}

function validateAuth(req) {
  if (!WH_SECRET) return true;

  const queryToken = String(req.query?.token || "").trim();
  if (queryToken && queryToken === WH_SECRET) return true;

  const sig = String(req.headers["x-kiwify-signature"] || "");
  if (sig) {
    const expected = crypto
      .createHmac("sha256", WH_SECRET)
      .update(JSON.stringify(req.body || {}))
      .digest("hex");
    if (sig === expected) return true;
  }

  return false;
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
    // Redis is an optional fallback.
  }
}

function generateAccessCode({ email, orderId }) {
  const seed = `${orderId || email}:${email}:${WH_SECRET || SB_SRV || "motoria"}`;
  const hash = crypto.createHash("sha256").update(seed).digest("hex").slice(0, 9).toUpperCase();
  return normalizeCode(`MTR${hash}`);
}

async function createOrFindUser(supabase, email) {
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { source: "kiwify_payment" },
  });

  if (!createErr && created?.user) return created.user;

  let page = 1;
  while (true) {
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (listErr || !list?.users) break;
    const found = list.users.find(u => normalizeEmail(u.email) === email);
    if (found) return found;
    if (!list.nextPage) break;
    page++;
  }

  return null;
}

async function grantAccess(supabase, userId, email, orderId) {
  const full = {
    id: userId,
    email,
    is_paid: true,
    paid_at: new Date().toISOString(),
    payment_id: orderId || null,
  };

  const { error } = await supabase.from("profiles").upsert(full, { onConflict: "id" });
  if (!error) return true;

  const { error: minimalError } = await supabase
    .from("profiles")
    .upsert({ id: userId, email, is_paid: true }, { onConflict: "id" });
  return !minimalError;
}

async function persistAccessCode(supabase, code) {
  const row = {
    code,
    max_uses: DEFAULT_MAX_USES,
    active: true,
    expires_at: null,
  };

  const { error } = await supabase
    .from("access_codes")
    .upsert(row, { onConflict: "code" });

  if (error && !isMissingTable(error)) {
    console.warn("[webhook] access_codes skipped:", String(error.message || error).slice(0, 120));
  }

  await redisSet(`access_code:${code}`, {
    code,
    max_uses: DEFAULT_MAX_USES,
    active: true,
  }, ACCESS_CODE_TTL);

  return !error || isMissingTable(error);
}

async function grantAccessRecord(supabase, { email, userId, source, code }) {
  const payload = {
    email,
    user_id: userId,
    code,
    source: source || "kiwify",
    status: "active",
    last_login_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from("access_grants").insert(payload);
    if (!error) return true;
    if (isMissingTable(error)) return false;

    const { error: updateErr } = await supabase
      .from("access_grants")
      .update({
        user_id: userId,
        source: payload.source,
        status: "active",
        last_login_at: payload.last_login_at,
      })
      .eq("email", email)
      .eq("code", code);

    if (updateErr && !isMissingTable(updateErr)) {
      console.warn("[webhook] access_grants update skipped:", String(updateErr.message || updateErr).slice(0, 120));
    }
    return !updateErr;
  } catch (err) {
    console.warn("[webhook] access_grants skipped:", String(err.message || err).slice(0, 120));
    return false;
  }
}

async function sendAccessCodeEmail({ email, code, name }) {
  if (!RESEND_KEY) {
    console.error("[webhook] RESEND_API_KEY missing. Access code email not sent.");
    return false;
  }

  const loginUrl = `${getAppUrl()}/login`;
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
      html: buildAccessCodeEmail({ code, loginUrl, name }),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`[webhook] Resend error status=${res.status} msg=${data?.message || "unknown"}`);
    return false;
  }

  console.log(`[webhook] Access code email sent to ${email} id=${data.id || "unknown"}`);
  return true;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") return res.status(405).end();

  if (!validateAuth(req)) {
    console.warn("[webhook] Unauthorized webhook request");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = req.body || {};
  const orderId = extractOrderId(body);
  const status = extractStatus(body);
  const email = extractEmail(body);
  const name = extractName(body);

  console.log(`[webhook] received order=${orderId || "(none)"} status=${status || "(none)"} email=${email || "(empty)"}`);

  if (status && !PAID_STATUSES.some(s => status.includes(s))) {
    return res.status(200).json({ received: true, ignored: true, status });
  }

  if (!isValidEmail(email)) {
    console.error(`[webhook] invalid email: "${email}"`);
    return res.status(200).json({ received: true, error: "email_invalido" });
  }

  if (!SB_URL || !SB_SRV) {
    console.error("[webhook] Supabase service env vars missing");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const supabase = createClient(SB_URL, SB_SRV, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await redisSet(`auth_email:${email}`, "1", 86400 * 60);

  const user = await createOrFindUser(supabase, email);
  if (!user) {
    console.error(`[webhook] user unavailable for ${email}`);
    return res.status(200).json({ received: true, note: "user_unavailable_redis_fallback" });
  }

  const accessCode = generateAccessCode({ email, orderId });

  await grantAccess(supabase, user.id, email, orderId);
  await persistAccessCode(supabase, accessCode);
  await grantAccessRecord(supabase, { email, userId: user.id, source: "kiwify", code: accessCode });

  const emailOk = await sendAccessCodeEmail({ email, code: accessCode, name });

  console.log(`[webhook] completed order=${orderId || "(none)"} email=${email} emailOk=${emailOk}`);
  return res.status(200).json({
    success: true,
    emailSent: emailOk,
    accessCodeCreated: true,
  });
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildAccessCodeEmail({ code, loginUrl, name }) {
  const greeting = name ? `Ola, ${escapeHtml(name)}.` : "Ola.";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Seu acesso ao MotorIA Pro</title>
</head>
<body style="margin:0;padding:0;background:#060608;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;background:#060608;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0B0B0F;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:40px;">
        <tr><td>
          <p style="margin:0 0 12px;font-size:10px;font-weight:800;letter-spacing:.16em;color:#22C55E;text-transform:uppercase;">Compra aprovada</p>
          <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#DDDDE0;line-height:1.15;">Seu acesso ao MotorIA Pro esta liberado.</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#A1A1AA;line-height:1.7;">${greeting} Use o email da compra e o codigo abaixo para entrar na plataforma.</p>
          <div style="margin:0 0 28px;padding:18px 20px;background:#111118;border:1px solid rgba(34,197,94,.35);border-radius:10px;">
            <p style="margin:0 0 6px;font-size:11px;color:#71717A;text-transform:uppercase;font-weight:800;letter-spacing:.12em;">Codigo de acesso</p>
            <p style="margin:0;font-size:28px;color:#22C55E;font-weight:900;letter-spacing:.08em;font-family:'Courier New',monospace;">${escapeHtml(code)}</p>
          </div>
          <p style="margin:0 0 28px;font-size:14px;color:#A1A1AA;line-height:1.7;">No login, digite seu email + codigo de acesso.</p>
          <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#22C55E;color:#050507;font-size:13px;font-weight:900;letter-spacing:.08em;text-decoration:none;padding:16px 28px;border-radius:10px;text-transform:uppercase;">
            Entrar no MotorIA Pro
          </a>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:28px 0 18px;" />
          <p style="margin:0;font-size:11px;color:#71717A;line-height:1.6;">Link do login:<br /><a href="${escapeHtml(loginUrl)}" style="color:#22C55E;word-break:break-all;">${escapeHtml(loginUrl)}</a></p>
          <p style="margin:16px 0 0;font-size:10px;color:#52525B;">Duvidas: suporte@motoriaopro.com.br</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
