"use strict";

/**
 * POST /api/auth/magic-link
 * Body: { email: string }
 *
 * 1. Verifica se email está autorizado (TESTER_EMAILS, Redis, profiles.is_paid)
 * 2. Tenta enviar magic link via Resend
 * 3. Se Resend não estiver configurado, retorna { ok: true, sent: false }
 *    → cliente usa supabase.auth.signInWithOtp como fallback
 */

const { createClient } = require("@supabase/supabase-js");
const db = require("../_db");
const { applyCors, resolveAppUrl } = require("../_cors");

const RESEND_KEY  = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "MotorIA <acesso@motoriaopro.com.br>";
const SB_URL      = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_SRV      = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Emails de tester/beta — sempre autorizados
const TESTER_EMAILS = new Set(
  (process.env.TESTER_EMAILS || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
);

function normalizeEmail(e) { return String(e || "").trim().toLowerCase(); }
function isValidEmail(e)   { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function isTesterEmail(email) {
  return TESTER_EMAILS.has(normalizeEmail(email));
}

async function isAuthorized(email) {
  // 1. TESTER_EMAILS
  if (isTesterEmail(email)) {
    console.log(`[magic-link] AUTORIZADO via TESTER_EMAILS — ${email}`);
    return { ok: true, via: "tester" };
  }
  console.log(`[magic-link] Não é tester (TESTER_EMAILS.size=${TESTER_EMAILS.size}) — ${email}`);

  // 2. Redis
  try {
    const val = await db.get(`auth_email:${email}`);
    if (val) {
      console.log(`[magic-link] AUTORIZADO via Redis — ${email}`);
      return { ok: true, via: "redis" };
    }
    console.log(`[magic-link] Redis: sem chave para ${email}`);
  } catch (e) {
    console.log(`[magic-link] Redis: exceção (${e.message})`);
  }

  // 3. Supabase profiles.is_paid
  if (!SB_URL || !SB_SRV) {
    console.error(`[magic-link] NEGADO — Supabase env vars ausentes: SB_URL=${!!SB_URL} SB_SRV=${!!SB_SRV}`);
    return { ok: false };
  }

  try {
    const admin = createClient(SB_URL, SB_SRV);
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) {
      console.error(`[magic-link] listUsers falhou: ${listErr.message}`);
      return { ok: false };
    }
    const user = (list?.users || []).find(u => normalizeEmail(u.email) === email);
    if (!user) {
      console.log(`[magic-link] NEGADO — email não existe em auth.users: ${email} (total=${list?.users?.length})`);
      return { ok: false };
    }
    console.log(`[magic-link] Usuário encontrado uid=${user.id} — verificando profiles...`);
    const { data: profile, error: profErr } = await admin.from("profiles").select("is_paid").eq("id", user.id).single();
    if (profErr) {
      console.error(`[magic-link] profiles select error: ${profErr.message}`);
      return { ok: false };
    }
    if (profile?.is_paid === true) {
      console.log(`[magic-link] AUTORIZADO via profiles.is_paid — ${email}`);
      return { ok: true, via: "profiles" };
    }
    console.log(`[magic-link] NEGADO — profiles.is_paid=${profile?.is_paid} para ${email}`);
  } catch (e) {
    console.error(`[magic-link] Exceção no check de profiles: ${e.message}`);
  }

  return { ok: false };
}

async function sendViaResend(email, link) {
  if (!RESEND_KEY) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body:    JSON.stringify({
        from:    RESEND_FROM,
        to:      [email],
        subject: "Seu link de acesso ao MotorIA Pro",
        html:    buildEmail(link),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[magic-link] Resend erro: ${data?.message || res.status}`);
      return false;
    }
    console.log(`[magic-link] Email enviado via Resend — to: ${email}, id: ${data.id}`);
    return true;
  } catch (e) {
    console.error(`[magic-link] Resend exceção: ${e.message}`);
    return false;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) return res.status(400).json({ error: "Email inválido." });

  // Verificar autorização
  const auth = await isAuthorized(email);
  if (!auth.ok) {
    console.log(`[magic-link] Negado — email não autorizado: ${email}`);
    return res.status(403).json({
      error: "Email não encontrado. Use o email da compra ou fale com o suporte.",
    });
  }
  console.log(`[magic-link] Autorizado via ${auth.via} — email: ${email}`);

  // Gerar magic link
  if (!SB_URL || !SB_SRV) {
    return res.status(500).json({ error: "Configuração do servidor incompleta." });
  }

  const appUrl = resolveAppUrl(req, res);
  if (!appUrl) return;

  const admin = createClient(SB_URL, SB_SRV);
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type:    "magiclink",
    email,
    options: { redirectTo: `${appUrl}/auth/callback` },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    console.error(`[magic-link] generateLink falhou: ${linkErr?.message}`);
    // Retornar sent:false → cliente usa signInWithOtp como fallback
    return res.status(200).json({ ok: true, sent: false });
  }

  const link = linkData.properties.action_link;

  // Tentar enviar via Resend
  const sent = await sendViaResend(email, link);

  if (!sent) {
    // Resend não configurado — cliente vai usar signInWithOtp
    console.log(`[magic-link] Resend indisponível — cliente usará OTP fallback`);
    return res.status(200).json({ ok: true, sent: false });
  }

  return res.status(200).json({ ok: true, sent: true });
};

function buildEmail(link) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:40px 16px;background:#060608;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:0;background:#060608;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="max-width:500px;background:#0B0B0F;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:44px 40px;">
      <tr><td>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td style="width:30px;height:30px;background:#22C55E;border-radius:8px;text-align:center;vertical-align:middle;">
              <span style="font-size:14px;font-weight:900;color:#050507;line-height:30px;">M</span>
            </td>
            <td style="padding-left:10px;font-size:14px;font-weight:800;color:#DDDDE0;">MotorIA Pro</td>
          </tr>
        </table>
        <p style="margin:0 0 10px;font-size:10px;font-weight:800;letter-spacing:.16em;color:#22C55E;text-transform:uppercase;">Link de acesso</p>
        <h1 style="margin:0 0 16px;font-size:24px;font-weight:900;color:#DDDDE0;line-height:1.2;letter-spacing:-.02em;">
          Clique para entrar na plataforma.
        </h1>
        <p style="margin:0 0 32px;font-size:14px;color:#72727A;line-height:1.75;">
          Seu link expira em <strong style="color:#DDDDE0;">1 hora</strong> e pode ser usado uma vez.
        </p>
        <a href="${link}"
          style="display:inline-block;background:#22C55E;color:#050507;font-size:13px;font-weight:900;letter-spacing:.08em;text-decoration:none;padding:16px 32px;border-radius:10px;text-transform:uppercase;">
          Acessar o MotorIA Pro &rarr;
        </a>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:28px 0 20px;"/>
        <p style="margin:0;font-size:11px;color:#444448;line-height:1.7;">
          Link direto:<br/>
          <a href="${link}" style="color:#22C55E;font-size:10px;word-break:break-all;">${link}</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}
