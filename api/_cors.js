"use strict";

/**
 * _cors.js — CORS + APP_URL centralizado
 *
 * Origens permitidas (hardcoded + extensíveis via ALLOWED_ORIGINS env var):
 *   https://motoria-pro.vercel.app
 *   https://motoriaopro.com.br
 *   http://localhost:5173
 *
 * Uso nos handlers:
 *   const { applyCors, resolveAppUrl } = require("../_cors");
 *   if (applyCors(req, res)) return; // responde preflight e sai
 *   const appUrl = resolveAppUrl(req, res); // retorna url ou responde 500 e retorna null
 */

const BASE_ORIGINS = new Set([
  "https://motoria-pro.vercel.app",
  "https://motoriaopro.com.br",
  "http://localhost:5173",
]);

// Origens extras via env var (separadas por vírgula)
const extraOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = new Set([...BASE_ORIGINS, ...extraOrigins]);

/**
 * Aplica headers CORS e responde preflight OPTIONS.
 * Retorna true se foi preflight (caller deve fazer `return`).
 */
function applyCors(req, res) {
  const origin = (req.headers.origin || "").trim();
  const allowed = ALLOWED_ORIGINS.has(origin)
    ? origin
    : "https://motoria-pro.vercel.app";

  res.setHeader("Access-Control-Allow-Origin",  allowed);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-secret, x-motoria-code-session");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

/**
 * Retorna a APP_URL canônica.
 * Em produção, exige que APP_URL esteja configurada ou responde 500.
 * Em dev (localhost origin), usa a origin da request.
 * Nunca retorna motoriaopro.com.br como fallback silencioso.
 */
function resolveAppUrl(req, res) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");

  const origin = (req?.headers?.origin || "").trim();
  if (origin === "http://localhost:5173") return "http://localhost:5173";

  if (res) {
    res.status(500).json({
      error: "APP_URL não configurada no servidor. Configure a variável de ambiente APP_URL.",
    });
  }
  return null;
}

module.exports = { applyCors, resolveAppUrl, ALLOWED_ORIGINS };
