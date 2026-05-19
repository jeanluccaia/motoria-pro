/**
 * POST /api/auth/magic-link
 * Body: { email: string }
 *
 * Fluxo seguro:
 *   1. Verifica se email está autorizado (Redis auth_email: ou profiles.is_paid)
 *   2. Se autorizado: gera link via Supabase Admin + envia por Resend
 *   3. Se não:        retorna 403 sem vazar se o email existe ou não
 *
 * Env necessárias:
 *   SUPABASE_SERVICE_ROLE_KEY
 *   VITE_SUPABASE_URL
 *   RESEND_API_KEY
 *   RESEND_FROM
 *   APP_URL
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

"use strict";

const { createClient } = require("@supabase/supabase-js");
const db = require("../_db");

const APP_URL      = (process.env.APP_URL || "https://motoriaopro.com.br").replace(/\/$/, "");
const RESEND_KEY   = process.env.RESEND_API_KEY;
const RESEND_FROM  = process.env.RESEND_FROM || "MotorIA <acesso@motoriaopro.com.br>";
const SB_URL       = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_SRV       = process.env.SUPABASE_SERVICE_ROLE_KEY;

function normalizeEmail(e) {
  return String(e || "").trim().toLowerCase();
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

async function isAuthorizedByRedis(email) {
  const val = await db.get(`auth_email:${email}`);
  return Boolean(val);
}

async function isAuthorizedBySupabase(email) {
  if (!SB_URL || !SB_SRV) return false;
  const admin = createClient(SB_URL, SB_SRV);

  // Find user by email via admin
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    console.error("[magic-link] listUsers error:", error.message);
    return false;
  }
  const user = (data?.users || []).find(u => normalizeEmail(u.email) === email);
  if (!user) return false;

  // Check is_paid in profiles
  const { data: profile } = await admin
    .from("profiles")
    .select("is_paid")
    .eq("id", user.id)
    .single();

  return profile?.is_paid === true;
}

async function generateAndSendLink(email) {
  if (!SB_URL || !SB_SRV) throw new Error("Supabase service key não configurada.");
  const admin = createClient(SB_URL, SB_SRV);

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${APP_URL}/auth/callback` },
  });

  if (error) throw new Error(`generateLink: ${error.message}`);

  const link = data?.properties?.action_link;
  if (!link) throw new Error("Link não gerado pelo Supabase.");

  // Envia via Resend (confiável, não vai para spam)
  if (!RESEND_KEY) {
    console.warn("[magic-link] RESEND_API_KEY não configurada — link não enviado:", link);
    return;
  }

  const html = buildMagicLinkEmail({ link });
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:    RESEND_FROM,
      to:      [email],
      subject: "Seu link de acesso ao MotorIA Pro",
      html,
    }),
  });

  const resData = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend erro: ${resData?.message || res.status}`);
  }
  console.log(`[magic-link] Link enviado via Resend — to: ${email}, id: ${resData.id}`);
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", APP_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")   return res.status(405).end();

  const email = normalizeEmail(req.body?.email);

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email inválido." });
  }

  try {
    // Verificar autorização (Redis tem prioridade — cobre usuários que ainda não criaram conta)
    const byRedis    = await isAuthorizedByRedis(email);
    const bySupabase = byRedis ? false : await isAuthorizedBySupabase(email);

    if (!byRedis && !bySupabase) {
      console.log(`[magic-link] Acesso negado — email não autorizado: ${email}`);
      // Resposta genérica — não vaza se o email existe ou não
      return res.status(403).json({ error: "Acesso não encontrado. Verifique se este é o email usado na compra." });
    }

    console.log(`[magic-link] Autorizado via ${byRedis ? "Redis" : "Supabase"} — email: ${email}`);
    await generateAndSendLink(email);
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("[magic-link] Erro:", err.message);
    return res.status(500).json({ error: "Erro ao enviar link. Tente novamente." });
  }
};

function buildMagicLinkEmail({ link }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Seu link de acesso</title>
</head>
<body style="margin:0;padding:0;background:#060608;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;background:#060608;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0B0B0F;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:44px 40px;">
      <tr><td>
        <!-- Logo -->
        <table cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
          <tr>
            <td style="width:28px;height:28px;background:#22C55E;border-radius:6px;text-align:center;vertical-align:middle;">
              <span style="font-size:13px;font-weight:900;color:#050507;line-height:28px;">M</span>
            </td>
            <td style="padding-left:10px;vertical-align:middle;font-size:14px;font-weight:800;color:#DDDDE0;">MotorIA Pro</td>
          </tr>
        </table>

        <p style="margin:0 0 10px;font-size:9px;font-weight:800;letter-spacing:.18em;color:#22C55E;text-transform:uppercase;">Link de acesso</p>
        <h1 style="margin:0 0 20px;font-size:24px;font-weight:900;color:#DDDDE0;letter-spacing:-.03em;line-height:1.2;">
          Clique para entrar<br/>na plataforma.
        </h1>
        <p style="margin:0 0 32px;font-size:14px;color:#72727A;line-height:1.75;">
          Seu link de acesso está pronto. Ele expira em 1 hora e pode ser usado apenas uma vez.
        </p>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td>
              <a href="${link}" style="display:inline-block;background:#DDDDE0;color:#060608;font-size:12px;font-weight:900;letter-spacing:.12em;text-decoration:none;padding:15px 28px;border-radius:8px;text-transform:uppercase;">
                Acessar Plataforma &rarr;
              </a>
            </td>
          </tr>
        </table>

        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:0 0 20px;"/>

        <p style="margin:0 0 8px;font-size:11px;color:#38383E;line-height:1.7;">
          Se o botão não funcionar, copie este link:<br/>
          <a href="${link}" style="color:#22C55E;font-size:10px;word-break:break-all;">${link}</a>
        </p>
        <p style="margin:0;font-size:10px;color:#38383E;">
          Não solicitou este acesso? Ignore este email.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
