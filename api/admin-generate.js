/**
 * POST /api/admin-generate
 * Gera um token de acesso com 20 créditos.
 * Uso: após pagamento confirmado (manual ou via webhook).
 *
 * Header: Authorization: Bearer {ADMIN_SECRET}
 * Body:   { email?: string }
 *
 * Protegido por ADMIN_SECRET — nunca expor essa rota publicamente.
 */

"use strict";

const { generate, INITIAL_CREDITS } = require("./_credits");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  // Validar segredo de admin
  const secret = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    // Não revelar se o segredo existe ou não
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { email = "" } = req.body || {};

  try {
    const token = await generate(email);
    console.log(`[admin-generate] Token gerado para: ${email || "(sem email)"}`);
    return res.status(200).json({
      token,
      credits: INITIAL_CREDITS,
      email,
    });
  } catch (err) {
    console.error("[admin-generate] Erro:", err.message);
    return res.status(500).json({ error: "Erro ao gerar token. Redis configurado?" });
  }
};
