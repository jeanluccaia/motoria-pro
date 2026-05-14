/**
 * _cors.js — Middleware CORS para endpoints da API
 *
 * Restringe chamadas cross-origin à origem oficial (ALLOWED_ORIGIN) e
 * ao localhost em desenvolvimento.
 *
 * CONTEXTO:
 *   Como o SPA e a API estão no mesmo projeto Vercel (mesma origem), o browser
 *   não envia o header Origin em requests normais — CORS não é acionado para
 *   o uso legítimo. Este middleware protege contra sites de terceiros que
 *   tentarem usar o token de um usuário autenticado via browser (CSRF-like).
 *
 * CONFIGURAÇÃO:
 *   ALLOWED_ORIGIN (env var) — origem(s) permitida(s), separadas por vírgula.
 *   Exemplo: https://motoria-landing.vercel.app,https://motoriapro.com.br
 *
 * USO:
 *   const { applyCors } = require("./_cors");
 *   // No início de cada handler, antes de qualquer processamento:
 *   if (applyCors(req, res)) return; // preflight OPTIONS respondido
 */

"use strict";

const IS_DEV = process.env.NODE_ENV !== "production";

// Origini permitidas — lidas ao carregar o módulo (sem custo por request)
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
);

/**
 * Aplica headers CORS e responde ao preflight OPTIONS.
 * Retorna true se a request foi tratada como preflight (caller deve return).
 * Retorna false se o processamento normal deve continuar.
 */
function applyCors(req, res) {
  const origin = (req.headers.origin || "").trim();

  let allowed = "";
  if (origin) {
    if (ALLOWED_ORIGINS.has(origin)) {
      allowed = origin;
    } else if (IS_DEV && (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1"))) {
      allowed = origin; // localhost liberado apenas em desenvolvimento
    }
  }

  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin",  allowed);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Vary", "Origin");
  }

  // Preflight — responde imediatamente sem processar o body
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  return false;
}

module.exports = { applyCors };
