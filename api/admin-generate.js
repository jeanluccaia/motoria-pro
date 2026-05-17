/**
 * POST /api/admin-generate
 * Gera um token de acesso com INITIAL_CREDITS créditos.
 * Uso: após pagamento confirmado manualmente.
 *
 * Header: Authorization: Bearer {ADMIN_SECRET}
 * Body:   { email?: string }
 *
 * SEGURANÇA:
 *   - Requer ADMIN_SECRET via header Authorization.
 *   - Rate limitado: máximo 10 tokens por hora por IP.
 *   - Tentativas negadas são logadas (sem expor o segredo).
 *   - O token gerado é retornado apenas na resposta HTTP (não logado).
 *   - Nunca expor esta rota publicamente; usar apenas via cliente HTTP seguro.
 *
 * PRODUÇÃO: prefira usar /api/webhook-kiwify (geração automática pós-pagamento).
 */

"use strict";

const { generate, INITIAL_CREDITS, TOKEN_TTL_DAYS } = require("./_credits");
const { getIP, perMinute } = require("./_rate");
const { applyCors } = require("./_cors");

// Rate limit específico do admin: 10 gerações por hora por IP
const ADMIN_HOURLY_MAX  = 10;
const ADMIN_WINDOW_SECS = 3600;
const db = require("./_db");

async function adminRateLimit(ip) {
  const key = `rl:admin:${ip}`;
  if (db.isConfigured()) {
    const count = await db.incrTTL(key, ADMIN_WINDOW_SECS);
    return { allowed: count != null ? count <= ADMIN_HOURLY_MAX : true, count: count ?? 0 };
  }
  return { allowed: true, count: 0 }; // sem Redis: falha aberta (endpoint já requer ADMIN_SECRET)
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const ip = getIP(req);

  // Rate limit por minuto (anti-hammering)
  const rlMin = await perMinute(ip);
  if (!rlMin.allowed) {
    return res.status(429).json({ error: "Muitas requisições." });
  }

  // Rate limit horário específico do admin
  const rlAdmin = await adminRateLimit(ip);
  if (!rlAdmin.allowed) {
    console.warn(`[admin-generate] Rate limit atingido — IP: ${ip}`);
    return res.status(429).json({ error: "Limite de geração horário atingido." });
  }

  // Validar segredo de admin
  const secret = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    // Logar tentativa sem expor o segredo recebido
    console.warn(`[admin-generate] Tentativa não autorizada — IP: ${ip}, timestamp: ${Date.now()}`);
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { email = "", credits } = req.body || {};
  const creditsNum = credits != null ? Number(credits) : INITIAL_CREDITS;

  try {
    const token = await generate(email, creditsNum);
    const qty   = Math.max(1, Math.min(500, creditsNum || INITIAL_CREDITS));
    console.log(`[admin-generate] Token gerado — email: ${email || "(sem email)"}, credits: ${qty}, IP: ${ip}`);
    return res.status(200).json({
      token,
      credits:   qty,
      link:      `https://motoriaopro.com.br/app?t=${token}`,
      expiresIn: `${TOKEN_TTL_DAYS} dias`,
      email,
    });
  } catch (err) {
    console.error("[admin-generate] Erro:", err.message);
    return res.status(500).json({ error: "Erro ao gerar token. Redis configurado?" });
  }
};
