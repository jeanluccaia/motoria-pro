/**
 * POST /api/admin/grant
 * Header: x-admin-secret: ADMIN_SECRET
 * Body: { email: string, note?: string }
 *
 * Libera acesso manual para um email — para casos onde o webhook falhou.
 * Faz exatamente o que o webhook deveria ter feito:
 *   1. Cria usuário no Supabase (se não existe)
 *   2. profiles.is_paid = true
 *   3. Salva auth_email no Redis (se configurado)
 *   4. Gera magic link
 *   5. Envia por Resend
 *
 * NUNCA expor este endpoint sem ADMIN_SECRET configurado.
 */

"use strict";

const { createClient } = require("@supabase/supabase-js");

const ADMIN_SECRET = process.env.ADMIN_SECRET;
const APP_URL      = (process.env.APP_URL || "https://motoriaopro.com.br").replace(/\/$/, "");
const SB_URL       = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_SRV       = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY   = process.env.RESEND_API_KEY;
const RESEND_FROM  = process.env.RESEND_FROM || "MotorIA <acesso@motoriaopro.com.br>";
const REDIS_URL    = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN  = process.env.UPSTASH_REDIS_REST_TOKEN;

function normalizeEmail(e) { return String(e || "").trim().toLowerCase(); }
function isValidEmail(e)   { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

async function redisSet(key, value, ttlSecs) {
  if (!REDIS_URL || !REDIS_TOKEN) return;
  try {
    await fetch(REDIS_URL, {
      method:  "POST",
      headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
      body:    JSON.stringify(["SET", key, value, "EX", ttlSecs]),
    });
  } catch { /* opcional */ }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).end();

  // ── Auth ───────────────────────────────────────────────────────────────────
  if (!ADMIN_SECRET) {
    return res.status(500).json({ error: "ADMIN_SECRET não configurado." });
  }
  const secret = req.headers["x-admin-secret"] || "";
  if (secret !== ADMIN_SECRET) {
    console.warn("[admin/grant] Tentativa não autorizada");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const email = normalizeEmail(req.body?.email);
  const note  = String(req.body?.note || "manual_grant").slice(0, 100);

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email inválido." });
  }
  if (!SB_URL || !SB_SRV) {
    return res.status(500).json({ error: "Supabase env vars ausentes." });
  }

  console.log(`[admin/grant] Liberando acesso manual — email: ${email}, note: ${note}`);

  const supabase = createClient(SB_URL, SB_SRV, { auth: { autoRefreshToken: false, persistSession: false } });
  const result   = { email, steps: {} };

  // 1. Criar ou encontrar usuário
  let user = null;
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { source: "admin_grant", note },
  });

  if (!createErr && created?.user) {
    user = created.user;
    result.steps.user = "created";
  } else {
    // Buscar existente
    let page = 1;
    while (!user) {
      const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (listErr || !list?.users) break;
      user = list.users.find(u => normalizeEmail(u.email) === email) || null;
      if (!list.nextPage || user) break;
      page++;
    }
    result.steps.user = user ? "found_existing" : "not_found";
  }

  if (!user) {
    console.error(`[admin/grant] Não foi possível criar/encontrar usuário para ${email}`);
    return res.status(500).json({ error: "Falha ao criar/encontrar usuário.", result });
  }

  // 2. Liberar acesso no Supabase profiles
  const { error: profErr } = await supabase
    .from("profiles")
    .upsert({ id: user.id, is_paid: true, paid_at: new Date().toISOString(), payment_id: note },
             { onConflict: "id" });
  result.steps.profiles = profErr ? `error: ${profErr.message}` : "is_paid=true";
  if (profErr) console.error("[admin/grant] profiles upsert error:", profErr.message);

  // 3. Redis
  await redisSet(`auth_email:${email}`, "1", 86400 * 60);
  result.steps.redis = "set (se configurado)";

  // 4. Gerar magic link
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${APP_URL}/auth/callback` },
  });

  const link = linkData?.properties?.action_link;
  result.steps.link = link ? "gerado" : `error: ${linkErr?.message}`;

  // 5. Enviar email
  if (link && RESEND_KEY) {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body:    JSON.stringify({
        from:    RESEND_FROM,
        to:      [email],
        subject: "🔓 Seu acesso ao MotorIA Pro — link de entrada",
        html:    buildEmail(link),
      }),
    });
    const eData = await emailRes.json().catch(() => ({}));
    result.steps.email = emailRes.ok ? `enviado (${eData.id})` : `error: ${eData?.message}`;
    if (!emailRes.ok) console.error("[admin/grant] Resend error:", eData?.message);
  } else {
    result.steps.email = link
      ? "RESEND_API_KEY ausente — email não enviado"
      : "link não gerado — email não enviado";
  }

  // Retornar link nos logs mesmo se email falhou (para reenvio manual)
  console.log(`[admin/grant] CONCLUÍDO`, JSON.stringify({ ...result, link: link || "N/A" }));

  return res.status(200).json({
    success: true,
    uid:     user.id,
    result,
    // Incluir link para que o admin possa repassar manualmente se email falhou
    magic_link: link || null,
  });
};

function buildEmail(link) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:40px 16px;background:#060608;font-family:sans-serif;">
<div style="max-width:480px;margin:0 auto;background:#0B0B0F;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:40px;">
  <p style="margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:.16em;color:#22C55E;text-transform:uppercase;">Acesso liberado</p>
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;color:#DDDDE0;line-height:1.2;">Seu acesso ao MotorIA Pro está ativo.</h1>
  <p style="margin:0 0 28px;font-size:14px;color:#72727A;line-height:1.7;">Clique no botão abaixo para entrar. O link expira em 1 hora.</p>
  <a href="${link}" style="display:inline-block;background:#22C55E;color:#050507;font-size:13px;font-weight:900;letter-spacing:.08em;text-decoration:none;padding:14px 28px;border-radius:8px;text-transform:uppercase;">
    Acessar plataforma &rarr;
  </a>
  <p style="margin:20px 0 0;font-size:10px;color:#444448;word-break:break-all;">
    Link direto: <a href="${link}" style="color:#22C55E;">${link}</a>
  </p>
</div>
</body></html>`;
}
