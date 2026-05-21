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
const { getCodeSessionFromReq } = require("./_codeSession");

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
  // Aceita: (a) UUID token via x-motoria-token, (b) Supabase JWT via Authorization
  // (c) bypass de admin via x-admin-key (apenas para dono da conta — teste interno)
  const uuidToken  = (req.headers["x-motoria-token"] || "").trim();
  const bearerJwt  = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  const adminKey   = (req.headers["x-admin-key"] || "").trim();

  let isAuthorized   = false;
  let creditsRemaining = null;

  // ── (admin) bypass para testes do dono ───────────────────────────────────
  const ADMIN_KEYS = new Set(
    (process.env.ADMIN_KEYS || "").split(",").map(s => s.trim()).filter(Boolean)
  );
  if (ADMIN_KEYS.size > 0 && ADMIN_KEYS.has(adminKey)) {
    isAuthorized = true;
  }

  // ── (a) UUID token (sistema legado de créditos) ───────────────────────────
  if (!isAuthorized && getCodeSessionFromReq(req)) {
    isAuthorized = true;
  }

  if (!isAuthorized && credits.isValidUUID(uuidToken)) {
    const result = await credits.deduct(uuidToken);

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
        return res.status(402).json({ locked: true, code: "NO_CREDITS" });
      }
      return res.status(402).json({ locked: true, code: "ACCESS_DENIED" });
    }

    creditsRemaining = result.credits;
    isAuthorized     = true;
  }

  // ── (b) Supabase JWT — usuário pago via magic link ────────────────────────
  if (!isAuthorized && bearerJwt) {
    const sbUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (sbUrl && sbKey) {
      try {
        const { createClient } = require("@supabase/supabase-js");
        const sb = createClient(sbUrl, sbKey, { auth: { persistSession: false } });
        const { data: { user } } = await sb.auth.getUser(bearerJwt);
        if (user) {
          const { data: profile } = await sb
            .from("profiles")
            .select("is_paid")
            .eq("id", user.id)
            .single();
          isAuthorized = profile?.is_paid === true;
        }
      } catch (_) {}
    }
  }

  // ── Bloqueio real: sem autorização → preview parcial ─────────────────────
  if (!isAuthorized) {
    return res.status(200).json({
      locked: true,
      preview: {
        signals: [
          "Exposição acima da média detectada",
          "Mercado exige cautela neste cenário",
          "Oscilação incomum identificada na odd",
          "Probabilidade implícita com inconsistência detectada",
        ],
      },
    });
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

    // ── 8. Resposta ─────────────────────────────────────────────────────────────
    return res.status(200).json({
      locked:  false,
      content: data.content || [],
      credits: creditsRemaining,
    });

  } catch (err) {
    console.error("[chat] Erro interno:", err.message);
    return res.status(500).json({ error: "Erro de conexão. Verifique sua internet e tente novamente." });
  }
};
