/**
 * GET /api/validate-token
 * Valida um token e retorna os créditos restantes.
 * Header: Authorization: Bearer {token}
 */

"use strict";

const { getIP, perMinute } = require("./_rate");
const { getData, isValidUUID } = require("./_credits");

module.exports = async function handler(req, res) {
  // CORS headers mínimos para prevenir requisições cross-origin não esperadas
  res.setHeader("Cache-Control", "no-store");

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
    return res.status(404).json({ valid: false, error: "Token não encontrado." });
  }

  return res.status(200).json({
    valid:       true,
    credits:     data.credits,
    creditsUsed: data.creditsUsed,
  });
};
