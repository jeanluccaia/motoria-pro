/**
 * _credits.js — Sistema de créditos por token UUID
 *
 * Estrutura no Redis (chave: tok:{uuid}):
 *   {
 *     credits:     number,        // créditos restantes
 *     creditsUsed: number,        // total já consumido
 *     created:     number,        // timestamp ms da criação
 *     expiresAt:   number,        // timestamp ms de expiração (1 ano)
 *     lastUsed:    number | null, // timestamp ms do último uso
 *     email:       string,        // email do comprador (se disponível)
 *   }
 *
 * SEGURANÇA:
 *   - Tokens expiram em TOKEN_TTL_DAYS dias (default: 365).
 *   - A chave Redis também recebe TTL equivalente → sem acúmulo infinito.
 *   - deduct() é read-then-write (não atômico); em caso de requisição dupla
 *     simultânea, o crédito pode ser debitado duas vezes. Para escala maior,
 *     substituir por script Lua. No volume atual (< 1000 req/dia), o risco é
 *     aceitável e o prejuízo máximo é uma análise extra.
 *   - Tokens são UUIDs v4 (122 bits de entropia) — computacionalmente
 *     inviável de adivinhar. Signing HMAC seria redundante pois sempre
 *     consultamos o Redis para validar — o UUID já é o secret opaco.
 */

"use strict";

const { randomUUID } = require("crypto");
const db = require("./_db");

const INITIAL_CREDITS = 20;
const TOKEN_TTL_DAYS  = 365; // 1 ano
const TOKEN_TTL_SECS  = TOKEN_TTL_DAYS * 86400;
const TOKEN_TTL_MS    = TOKEN_TTL_SECS * 1000;

/** Valida formato UUID v4 */
function isValidUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    .test(String(str ?? ""));
}

module.exports = {
  INITIAL_CREDITS,
  TOKEN_TTL_DAYS,
  isValidUUID,

  /**
   * Gera um novo token com INITIAL_CREDITS créditos e salva no Redis.
   * O token expira em TOKEN_TTL_DAYS dias (TTL aplicado tanto no campo
   * expiresAt quanto na chave Redis).
   */
  async generate(email = "") {
    if (!db.isConfigured()) throw new Error("Redis não configurado.");

    const token = randomUUID();
    const now   = Date.now();

    await db.set(
      `tok:${token}`,
      {
        credits:     INITIAL_CREDITS,
        creditsUsed: 0,
        created:     now,
        expiresAt:   now + TOKEN_TTL_MS,
        lastUsed:    null,
        email:       String(email).slice(0, 200),
      },
      TOKEN_TTL_SECS // Redis também expira a chave após 1 ano
    );

    return token;
  },

  /** Retorna os dados do token ou null se não existir / formato inválido. */
  async getData(token) {
    if (!isValidUUID(token)) return null;
    return db.get(`tok:${token}`);
  },

  /**
   * Debita 1 crédito do token.
   * Retorna:
   *   null                                    — token não existe ou UUID inválido
   *   { ok: false, reason: "token_expired" }  — token vencido
   *   { ok: false, reason: "no_credits" }     — sem créditos restantes
   *   { ok: true,  credits: n, ... }          — sucesso
   */
  async deduct(token) {
    if (!isValidUUID(token)) return null;

    const data = await db.get(`tok:${token}`);
    if (!data) return null;

    // ── Verificar expiração ──────────────────────────────────────────────────
    if (data.expiresAt && Date.now() > data.expiresAt) {
      return { ...data, ok: false, reason: "token_expired" };
    }

    // ── Verificar créditos disponíveis ───────────────────────────────────────
    if (data.credits <= 0) {
      return { ...data, ok: false, reason: "no_credits" };
    }

    // ── Debitar ──────────────────────────────────────────────────────────────
    const updated = {
      ...data,
      credits:     data.credits - 1,
      creditsUsed: (data.creditsUsed || 0) + 1,
      lastUsed:    Date.now(),
    };

    // Preserva o TTL original no Redis ao atualizar
    const remainingSecs = data.expiresAt
      ? Math.max(1, Math.floor((data.expiresAt - Date.now()) / 1000))
      : TOKEN_TTL_SECS;

    await db.set(`tok:${token}`, updated, remainingSecs);
    return { ...updated, ok: true };
  },
};
