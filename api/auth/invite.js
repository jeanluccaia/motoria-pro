"use strict";

/**
 * POST /api/auth/invite
 * Body: { email: string, code: string }
 *
 * Valida o código de convite (INVITE_CODE env var), cria o usuário,
 * marca is_paid=true e envia magic link por email.
 */

const { createClient } = require("@supabase/supabase-js");
const { applyCors, resolveAppUrl } = require("../_cors");

const SB_URL      = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_SRV      = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY  = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "MotorIA <acesso@motoriaopro.com.br>";
const INVITE_CODE = process.env.INVITE_CODE || "";

function normalizeEmail(e) { return String(e || "").trim().toLowerCase(); }
function isValidEmail(e)   { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const email = normalizeEmail(req.body?.email);
  const code  = String(req.body?.code || "").trim();

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email inválido." });
  }

  if (!INVITE_CODE || code !== INVITE_CODE) {
    console.warn(`[invite] Código inválido: "${code}" — email: ${email}`);
    return res.status(403).json({ error: "Código de convite inválido." });
  }

  if (!SB_URL || !SB_SRV) {
    return res.status(500).json({ error: "Configuração do servidor incompleta." });
  }

  const sb = createClient(SB_URL, SB_SRV, { auth: { autoRefreshToken: false, persistSession: false } });

  // Criar usuário (ou encontrar existente)
  let user = null;
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { source: "invite" },
  });

  if (!createErr && created?.user) {
    user = created.user;
  } else {
    // Usuário já existe — buscar
    let page = 1;
    while (!user) {
      const { data: list, error: listErr } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
      if (listErr || !list?.users) break;
      user = list.users.find(u => normalizeEmail(u.email) === email) || null;
      if (!list.nextPage || user) break;
      page++;
    }
  }

  if (!user) {
    console.error(`[invite] Não foi possível criar/encontrar usuário: ${email}`);
    return res.status(500).json({ error: "Erro ao criar conta. Tente novamente." });
  }

  // Marcar is_paid = true
  const { error: profErr } = await sb.from("profiles")
    .upsert({ id: user.id, is_paid: true, paid_at: new Date().toISOString(), payment_id: "invite" }, { onConflict: "id" });
  if (profErr) {
    // Tentar upsert mínimo
    await sb.from("profiles").upsert({ id: user.id, is_paid: true }, { onConflict: "id" });
  }

  // Gerar magic link
  const appUrl = resolveAppUrl(req, res);
  if (!appUrl) return;

  const { data: linkData, error: linkErr } = await sb.auth.admin.generateLink({
    type:    "magiclink",
    email,
    options: { redirectTo: `${appUrl}/auth/callback` },
  });

  const link = linkData?.properties?.action_link;
  if (!link) {
    console.error(`[invite] generateLink falhou: ${linkErr?.message}`);
    return res.status(500).json({ error: "Erro ao gerar link de acesso." });
  }

  // Enviar por email
  if (RESEND_KEY) {
    await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body:    JSON.stringify({
        from:    RESEND_FROM,
        to:      [email],
        subject: "Seu acesso ao MotorIA Pro está liberado",
        html:    buildEmail(link),
      }),
    });
  }

  console.log(`[invite] Acesso liberado via convite — email: ${email}, uid: ${user.id}`);
  return res.status(200).json({ ok: true });
};

function buildEmail(link) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:40px 16px;background:#060608;font-family:sans-serif;">
<div style="max-width:460px;margin:0 auto;background:#0B0B0F;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:40px 36px;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
    <div style="width:28px;height:28px;background:#22C55E;border-radius:7px;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:13px;font-weight:900;color:#050507;">M</span>
    </div>
    <span style="font-size:14px;font-weight:800;color:#DDDDE0;">MotorIA <span style="color:#22C55E;">Pro</span></span>
  </div>
  <p style="margin:0 0 10px;font-size:10px;font-weight:800;letter-spacing:.16em;color:#22C55E;text-transform:uppercase;">Acesso liberado</p>
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;color:#DDDDE0;line-height:1.2;">Clique para entrar na plataforma.</h1>
  <p style="margin:0 0 28px;font-size:14px;color:#72727A;line-height:1.7;">Seu link expira em 1 hora e pode ser usado uma vez.</p>
  <a href="${link}" style="display:block;background:#22C55E;color:#050507;font-size:13px;font-weight:900;letter-spacing:.08em;text-decoration:none;padding:14px 0;border-radius:8px;text-transform:uppercase;text-align:center;">
    Acessar plataforma &rarr;
  </a>
  <p style="margin:20px 0 0;font-size:10px;color:#444448;word-break:break-all;">
    Link direto: <a href="${link}" style="color:#22C55E;">${link}</a>
  </p>
</div>
</body></html>`;
}
