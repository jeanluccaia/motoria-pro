"use strict";

// Tokens de acesso lidos da env var VALID_TOKENS (separados por vírgula).
// Configure no painel Vercel → Settings → Environment Variables.
// Exemplo: VALID_TOKENS=PARCEIRO_VIP_001,INFLUENCER_A001

const { applyCors } = require("./_cors");

const VALID_TOKENS = new Set(
  (process.env.VALID_TOKENS || "")
    .split(",")
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { token } = req.body || {};

  if (!token || typeof token !== "string" || token.length > 100) {
    return res.status(400).json({ valid: false });
  }

  const valid = VALID_TOKENS.size > 0 && VALID_TOKENS.has(token.trim().toUpperCase());
  return res.status(200).json({ valid });
};
