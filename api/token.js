// ─── Tokens de acesso administrativo ────────────────────────────────────────
// Adicione ou remova tokens aqui para controlar acessos de influenciadores,
// parceiros e testes internos. Nunca exponha esta lista publicamente.

const VALID_TOKENS = new Set([
  "MOTORIA_ADMIN_2026",
  "PARCEIRO_VIP_001",
  "PARCEIRO_VIP_002",
  "INFLUENCER_A001",
  "INFLUENCER_A002",
  "BETA_INTERNO_001",
  "BETA_INTERNO_002",
  "BETA_INTERNO_003",
]);

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { token } = req.body || {};

  if (!token || typeof token !== "string" || token.length > 100) {
    return res.status(400).json({ valid: false });
  }

  const valid = VALID_TOKENS.has(token.trim().toUpperCase());
  return res.status(200).json({ valid });
};
