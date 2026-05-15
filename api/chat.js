/**
 * POST /api/chat
 * Endpoint principal da IA.
 *
 * Camadas de segurança (em ordem de execução):
 *   0. CORS restrito à origem oficial (ALLOWED_ORIGIN)
 *   1. Método POST obrigatório
 *   2. ANTHROPIC_API_KEY presente
 *   3. Rate limit por minuto (Redis distribuído, fallback memória)
 *   4. Rate limit por hora
 *   5. Validação de payload (whitelist de ferramentas, tamanho, tipo)
 *   6. Token de acesso UUID validado no Redis (créditos + expiração)
 *      OU tier gratuito (FREE_LIMIT usos por IP — fail closed sem Redis)
 *   7. Débito de crédito antes de chamar a Anthropic
 *   8. Nenhum detalhe interno exposto ao cliente
 */

"use strict";

const SYSTEM_PROMPTS = require("./_prompts");
const rate    = require("./_rate");
const credits = require("./_credits");
const { applyCors } = require("./_cors");

const ALLOWED_TOOLS    = new Set(Object.keys(SYSTEM_PROMPTS));
const MAX_INPUT_CHARS  = 1800;
const MAX_OUTPUT_TOKENS = 1600;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // ── 0. CORS ──────────────────────────────────────────────────────────────────
  if (applyCors(req, res)) return;

  // ── 1. Método ────────────────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  // ── 2. Chave configurada ──────────────────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[chat] ANTHROPIC_API_KEY não configurada.");
    return res.status(500).json({ error: "Serviço temporariamente indisponível." });
  }

  const ip = rate.getIP(req);

  // ── 3. Rate limit por minuto ──────────────────────────────────────────────────
  const rlMin = await rate.perMinute(ip);
  if (!rlMin.allowed) {
    return res.status(429).json({ error: "Muitas requisições. Aguarde um momento." });
  }

  // ── 4. Rate limit por hora ────────────────────────────────────────────────────
  const rlHr = await rate.perHour(ip);
  if (!rlHr.allowed) {
    return res.status(429).json({ error: "Limite horário atingido. Tente mais tarde." });
  }

  // ── 5. Validação do payload ───────────────────────────────────────────────────
  const body = req.body || {};
  const { tool, userMessage } = body;

  if (!tool || typeof tool !== "string" || !ALLOWED_TOOLS.has(tool)) {
    return res.status(400).json({ error: "Ferramenta não reconhecida." });
  }
  if (!userMessage || typeof userMessage !== "string") {
    return res.status(400).json({ error: "Mensagem inválida." });
  }

  const trimmed = userMessage.trim();
  if (trimmed.length < 3) {
    return res.status(400).json({ error: "Mensagem muito curta." });
  }
  if (trimmed.length > MAX_INPUT_CHARS) {
    return res.status(400).json({ error: "Mensagem muito longa." });
  }

  // ── 6. Verificar autenticação / créditos ──────────────────────────────────────
  // Aceita token via x-motoria-token (frontend) ou Authorization: Bearer (legacy)
  const tokenStr = (
    req.headers["x-motoria-token"] ||
    (req.headers.authorization || "").replace(/^Bearer\s+/i, "")
  ).trim();
  let creditsRemaining = null;
  let isFree = false;

  if (credits.isValidUUID(tokenStr)) {
    // ── Usuário com token: debitar crédito ────────────────────────────────────
    const result = await credits.deduct(tokenStr);

    if (!result) {
      return res.status(401).json({
        error: "Token inválido ou não encontrado.",
        code:  "INVALID_TOKEN",
      });
    }

    if (!result.ok) {
      if (result.reason === "token_expired") {
        return res.status(401).json({
          error: "Token expirado. Adquira um novo pacote para continuar.",
          code:  "TOKEN_EXPIRED",
        });
      }
      if (result.reason === "no_credits") {
        return res.status(402).json({
          error:   "Seus créditos acabaram. Adquira mais para continuar.",
          code:    "NO_CREDITS",
          credits: 0,
        });
      }
      // Razão desconhecida — não expor detalhes
      return res.status(402).json({ error: "Acesso negado.", code: "ACCESS_DENIED" });
    }

    creditsRemaining = result.credits;

  } else {
    // ── Usuário sem token: verificar tier gratuito ────────────────────────────
    // freeUsed() é fail-closed: sem Redis retorna FREE_LIMIT
    const used = await rate.freeUsed(ip);
    if (used >= rate.FREE_LIMIT) {
      return res.status(402).json({
        error:     "Limite de análises gratuitas atingido.",
        code:      "FREE_LIMIT",
        freeUsed:  used,
        freeLimit: rate.FREE_LIMIT,
      });
    }
    isFree = true;
  }

  // ── 7. Chamar Anthropic ───────────────────────────────────────────────────────
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: MAX_OUTPUT_TOKENS,
        system:     SYSTEM_PROMPTS[tool],
        messages:   [{ role: "user", content: trimmed }],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 403) {
        console.error(`[chat] Erro de autenticação Anthropic: ${status}`);
        return res.status(500).json({ error: "Serviço temporariamente indisponível." });
      }
      if (status === 429) {
        return res.status(429).json({ error: "Serviço sobrecarregado. Tente em alguns segundos." });
      }
      console.error(`[chat] Erro Anthropic HTTP ${status}`);
      return res.status(500).json({ error: "Erro ao processar. Tente novamente." });
    }

    const data = await response.json();

    // ── 8. Registrar uso gratuito APÓS sucesso (não cobra por erro) ───────────
    if (isFree) {
      await rate.incFree(ip);
    }

    // ── 9. Resposta ───────────────────────────────────────────────────────────
    return res.status(200).json({
      content: data.content || [],
      credits:   creditsRemaining,
      freeUsed:  isFree ? await rate.freeUsed(ip) : undefined,
      freeLimit: isFree ? rate.FREE_LIMIT         : undefined,
    });

  } catch (err) {
    console.error("[chat] Erro interno:", err.message);
    return res.status(500).json({ error: "Erro de conexão. Verifique sua internet e tente novamente." });
  }
};
