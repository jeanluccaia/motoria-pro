/**
 * POST /api/webhook/payment
 *
 * Webhook unificado de pagamento — Kiwify.
 *
 * Autenticação suportada (qualquer uma das duas):
 *   1. Query param:  ?token=KIWIFY_WEBHOOK_SECRET  (padrão Kiwify)
 *   2. Header HMAC:  x-kiwify-signature (SHA-256 do corpo)
 *
 * Fluxo após pagamento confirmado:
 *   1. Normaliza e valida email do comprador
 *   2. Cria usuário no Supabase (se não existe) — email_confirm: true
 *   3. Upsert profiles.is_paid = true
 *   4. Salva auth_email:{email} no Redis (fallback, se Redis configurado)
 *   5. Gera magic link via Supabase Admin
 *   6. Envia magic link por Resend
 *   7. Retorna 200 para Kiwify parar de retentar
 *
 * Env necessárias (Vercel dashboard):
 *   KIWIFY_WEBHOOK_SECRET   — secret do webhook (query param ou HMAC)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   VITE_SUPABASE_URL
 *   RESEND_API_KEY
 *   RESEND_FROM             — ex: "MotorIA <acesso@motoriaopro.com.br>"
 *   APP_URL                 — ex: "https://motoriaopro.com.br"
 *   UPSTASH_REDIS_REST_URL  (opcional — fallback)
 *   UPSTASH_REDIS_REST_TOKEN (opcional)
 */

"use strict";

const { createClient } = require("@supabase/supabase-js");
const crypto           = require("crypto");

function getAppUrl() {
  const url = process.env.APP_URL;
  if (!url) console.warn("[webhook] APP_URL não configurada — usando fallback motoria-pro.vercel.app");
  return (url || "https://motoria-pro.vercel.app").replace(/\/$/, "");
}
const SB_URL      = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_SRV      = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY  = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "MotorIA <acesso@motoriaopro.com.br>";
const WH_SECRET   = process.env.KIWIFY_WEBHOOK_SECRET || "";

// Redis (opcional — só usado se configurado)
const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Statuses que indicam pagamento confirmado pela Kiwify
const PAID_STATUSES = ["paid", "approved", "complete", "completed", "active", "order_approved"];

function normalizeEmail(e) { return String(e || "").trim().toLowerCase(); }
function isValidEmail(e)   { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function validateAuth(req) {
  if (!WH_SECRET) return true; // sem secret configurado → aceita tudo (não recomendado)

  // Método 1: query param (padrão Kiwify)
  const queryToken = String(req.query?.token || "").trim();
  if (queryToken && queryToken === WH_SECRET) return true;

  // Método 2: HMAC header
  const sig = req.headers["x-kiwify-signature"] || "";
  if (sig) {
    const expected = crypto.createHmac("sha256", WH_SECRET)
      .update(JSON.stringify(req.body)).digest("hex");
    if (sig === expected) return true;
  }

  return false;
}

async function redisSet(key, value, ttlSecs) {
  if (!REDIS_URL || !REDIS_TOKEN) return;
  try {
    await fetch(REDIS_URL, {
      method:  "POST",
      headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
      body:    JSON.stringify(["SET", key, value, "EX", ttlSecs]),
    });
  } catch { /* Redis opcional — falha silenciosa */ }
}

async function createOrFindUser(supabase, email) {
  // Tentar criar — se já existe, capturar o erro e buscar o usuário
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { source: "kiwify_payment" },
  });

  if (!createErr && created?.user) {
    console.log(`[webhook] Usuário criado no Supabase — email: ${email}, uid: ${created.user.id}`);
    return created.user;
  }

  // Usuário provavelmente já existe — buscar por email
  console.log(`[webhook] createUser falhou (${createErr?.message}) — buscando usuário existente`);

  let page = 1;
  while (true) {
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (listErr) { console.error("[webhook] listUsers error:", listErr.message); break; }
    const found = (list?.users || []).find(u => normalizeEmail(u.email) === email);
    if (found) return found;
    if (!list?.nextPage) break;
    page++;
  }

  return null;
}

async function grantAccess(supabase, userId, orderId) {
  // Tenta upsert completo; se falhar por coluna inexistente, tenta só is_paid
  const full = { id: userId, is_paid: true, paid_at: new Date().toISOString(), payment_id: orderId || null };
  const { error } = await supabase.from("profiles").upsert(full, { onConflict: "id" });
  if (!error) return true;

  console.warn("[webhook] upsert completo falhou, tentando minimal:", error.message);
  const { error: e2 } = await supabase
    .from("profiles")
    .upsert({ id: userId, is_paid: true }, { onConflict: "id" });
  if (e2) console.error("[webhook] profiles upsert minimal error:", e2.message);
  return !e2;
}

async function sendMagicLinkEmail(supabase, email) {
  if (!RESEND_KEY) {
    console.error("[webhook] RESEND_API_KEY não configurada — email não enviado.");
    return false;
  }

  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type:    "magiclink",
    email,
    options: { redirectTo: `${getAppUrl()}/auth/callback` },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    console.error("[webhook] generateLink error:", linkErr?.message || "link vazio");
    return false;
  }

  const link = linkData.properties.action_link;
  console.log(`[webhook] Magic link gerado para ${email}`);

  const html = buildWelcomeEmail({ link });
  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body:    JSON.stringify({
      from:    RESEND_FROM,
      to:      [email],
      subject: "🔓 Seu acesso ao MotorIA Pro está liberado",
      html,
    }),
  });

  const rData = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`[webhook] Resend error — status: ${res.status}, msg: ${rData?.message}`);
    return false;
  }
  console.log(`[webhook] Email enviado via Resend — to: ${email}, id: ${rData.id}`);
  return true;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") return res.status(405).end();

  // ── Auth ───────────────────────────────────────────────────────────────────
  if (!validateAuth(req)) {
    console.warn("[webhook] Auth falhou — secret inválido ou ausente");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body    = req.body || {};
  const orderId = String(body.order_id || body.id || "").trim();
  const status  = String(body.order_status || body.status || "").toLowerCase();
  const rawEmail = body?.Customer?.email || body?.customer?.email || body?.email || "";
  const email   = normalizeEmail(rawEmail);
  const name    = String(body?.Customer?.full_name || body?.customer?.full_name || "").trim();

  console.log(`[webhook] Recebido — order: ${orderId}, status: ${status}, email: ${email || "(vazio)"}`);

  // ── Filtrar status que não são pagamento ────────────────────────────────────
  if (status && !PAID_STATUSES.some(s => status.includes(s))) {
    console.log(`[webhook] Status ignorado: ${status}`);
    return res.status(200).json({ received: true, ignored: true, status });
  }

  if (!isValidEmail(email)) {
    console.error(`[webhook] Email inválido ou ausente: "${email}"`);
    return res.status(200).json({ received: true, error: "email_invalido" });
  }

  // ── Verificar config ────────────────────────────────────────────────────────
  if (!SB_URL || !SB_SRV) {
    console.error("[webhook] SUPABASE env vars ausentes — VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const supabase = createClient(SB_URL, SB_SRV, { auth: { autoRefreshToken: false, persistSession: false } });

  // ── Redis (fallback opcional) ────────────────────────────────────────────────
  await redisSet(`auth_email:${email}`, "1", 86400 * 60);
  console.log(`[webhook] Redis auth_email gravado (ou ignorado se não configurado)`);

  // ── Criar ou encontrar usuário ───────────────────────────────────────────────
  const user = await createOrFindUser(supabase, email);

  if (!user) {
    // Não conseguiu criar nem encontrar — Redis salvo, sync-paid vai completar depois
    console.error(`[webhook] Não foi possível criar/encontrar usuário para ${email}`);
    return res.status(200).json({ received: true, note: "user_unavailable_redis_fallback" });
  }

  // ── Liberar acesso ──────────────────────────────────────────────────────────
  await grantAccess(supabase, user.id, orderId);
  console.log(`[webhook] Acesso liberado — email: ${email}, uid: ${user.id}`);

  // ── Enviar magic link por email ────────────────────────────────────────────
  const emailOk = await sendMagicLinkEmail(supabase, email);
  if (!emailOk) {
    console.error(`[webhook] ATENÇÃO: email não enviado para ${email}. Link manual necessário.`);
  }

  console.log(`[webhook] CONCLUÍDO — order: ${orderId}, email: ${email}, emailOk: ${emailOk}`);
  return res.status(200).json({ success: true, emailSent: emailOk });
};

function buildWelcomeEmail({ link }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Seu acesso ao MotorIA Pro</title>
</head>
<body style="margin:0;padding:0;background:#060608;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;background:#060608;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="max-width:520px;background:#0B0B0F;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:44px 40px;">
      <tr><td>
        <!-- Logo -->
        <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td style="width:32px;height:32px;background:#22C55E;border-radius:8px;text-align:center;vertical-align:middle;">
              <span style="font-size:16px;font-weight:900;color:#050507;line-height:32px;">M</span>
            </td>
            <td style="padding-left:12px;vertical-align:middle;font-size:15px;font-weight:800;color:#DDDDE0;letter-spacing:-.02em;">MotorIA Pro</td>
          </tr>
        </table>

        <p style="margin:0 0 12px;font-size:10px;font-weight:800;letter-spacing:.16em;color:#22C55E;text-transform:uppercase;">Pagamento confirmado · acesso liberado</p>
        <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#DDDDE0;letter-spacing:-.03em;line-height:1.15;">
          Bem-vindo ao MotorIA Pro.<br/>Clique para entrar.
        </h1>
        <p style="margin:0 0 32px;font-size:14px;color:#72727A;line-height:1.75;">
          Seu acesso está ativo. Use o botão abaixo para entrar na plataforma agora — sem senha, sem complicação.
          O link expira em <strong style="color:#DDDDE0;">1 hora</strong> e pode ser usado apenas uma vez.
        </p>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td>
              <a href="${link}"
                style="display:inline-block;background:#22C55E;color:#050507;font-size:13px;font-weight:900;letter-spacing:.08em;text-decoration:none;padding:16px 32px;border-radius:10px;text-transform:uppercase;">
                Acessar o MotorIA Pro &rarr;
              </a>
            </td>
          </tr>
        </table>

        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:0 0 20px;"/>

        <p style="margin:0 0 8px;font-size:11px;color:#444448;line-height:1.7;">
          Ou copie este link no navegador:<br/>
          <a href="${link}" style="color:#22C55E;font-size:10px;word-break:break-all;font-family:'Courier New',monospace;">${link}</a>
        </p>
        <p style="margin:0;font-size:10px;color:#38383E;">
          Não reconhece este email? Ignore — nenhuma ação é necessária.
          Dúvidas: suporte@motoriaopro.com.br
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
