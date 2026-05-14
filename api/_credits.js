/**
 * _credits.js — Sistema de créditos por token UUID
 *
 * Estrutura no Redis:
 *   tok:{uuid} → JSON {
 *     credits:     number,   // créditos restantes
 *     creditsUsed: number,   // total já consumido
 *     created:     number,   // timestamp ms
 *     lastUsed:    number|null,
 *     email:       string,   // email do comprador (se disponível)
 *   }
 */

"use strict";

const { randomUUID } = require("crypto");
const db = require("./_db");

const INITIAL_CREDITS = 20;

/** Valida formato UUID v4 */
function isValidUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    .test(String(str ?? ""));
}

module.exports = {
  INITIAL_CREDITS,
  isValidUUID,

  /** Gera um novo token com INITIAL_CREDITS créditos e salva no Redis. */
  async generate(email = "") {
    if (!db.isConfigured()) throw new Error("Redis não configurado.");
    const token = randomUUID();
    await db.set(`tok:${token}`, {
      credits:     INITIAL_CREDITS,
      creditsUsed: 0,
      created:     Date.now(),
      lastUsed:    null,
      email:       String(email).slice(0, 200),
    });
    return token;
  },

  /** Retorna os dados do token ou null se não existir / formato inválido. */
  async getData(token) {
    if (!isValidUUID(token)) return null;
    return db.get(`tok:${token}`);
  },

  /**
   * Debita 1 crédito do token de forma atômica (lê → valida → salva).
   * Retorna:
   *   null                        — token não existe ou formato inválido
   *   { ok: false, reason: ... }  — sem créditos
   *   { ok: true, credits: n, ... } — sucesso
   */
  async deduct(token) {
    if (!isValidUUID(token)) return null;

    const data = await db.get(`tok:${token}`);
    if (!data) return null;

    if (data.credits <= 0) {
      return { ...data, ok: false, reason: "no_credits" };
    }

    const updated = {
      ...data,
      credits:     data.credits - 1,
      creditsUsed: (data.creditsUsed || 0) + 1,
      lastUsed:    Date.now(),
    };
    await db.set(`tok:${token}`, updated);
    return { ...updated, ok: true };
  },
};
