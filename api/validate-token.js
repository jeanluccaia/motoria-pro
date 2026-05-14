/**
 * GET /api/validate-token
 * Valida um token e retorna os créditos restantes.
 * Header: Authorization: Bearer {token}
 *
 * Resposta de sucesso:
 *   { valid: true, credits: N, creditsUsed: N, expiresAt: ms }
 *
 * Respostas de erro:
 *   400 — formato inválido
 *   401 — expirado   { valid: false, code: "TOKEN_EXPIRED" }
 *   404 — não existe { valid: false, code: "NOT_FOUND" }
 *   429 — rate limit
 */

"use strict";

const { getIP, perMinute } = require("./_rate");
const { getData, isValidUUID } = require("./_credits");
const { applyCors } = require("./_cors");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const ip = getIP(req);
  const rl = await perMinute(ip);
  if (!rl.allowed) {
    return res.status(429).json({ error: "Muitas requisições." });
  }

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!isValidUUID(token)) {
    return res.status(400).json({ valid: false, error: "Formato de token inválido." });
  }

  const data = await getData(token);
  if (!data) {
    return res.status(404).json({ valid: false, code: "NOT_FOUND", error: "Token não encontrado." });
  }

  // Verificar expiração
  if (data.expiresAt && Date.now() > data.expiresAt) {
    return res.status(401).json({
      valid: false,
      code:  "TOKEN_EXPIRED",
      error: "Token expirado. Adquira um novo pacote.",
    });
  }

  return res.status(200).json({
    valid:       true,
    credits:     data.credits,
    creditsUsed: data.creditsUsed,
    expiresAt:   data.expiresAt ?? null,
  });
};
