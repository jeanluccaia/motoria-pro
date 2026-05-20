/**
 * _db.js — Upstash Redis REST helper
 * Usa fetch nativo (Node 18+). Zero dependências externas.
 *
 * Variáveis de ambiente necessárias:
 *   UPSTASH_REDIS_REST_URL   — endpoint do Redis (ex: https://xxx.upstash.io)
 *   UPSTASH_REDIS_REST_TOKEN — token de autenticação REST
 */

"use strict";

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Executa um comando Redis via REST.
 * Retorna null em vez de lançar erro (degradação graciosa).
 */
async function cmd(...args) {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  try {
    const r = await fetch(REDIS_URL, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body:  JSON.stringify(args),
      cache: "no-store",
    });
    const d = await r.json();
    if (d.error) {
      // Truncar mensagem de erro — não expor config interna nos logs
      console.error("[db] Redis error:", String(d.error).slice(0, 120));
      return null;
    }
    return d.result ?? null;
  } catch (err) {
    console.error("[db] Fetch error:", String(err.message).slice(0, 120));
    return null;
  }
}

/** Parseia resultado do Redis (JSON ou primitivo). */
function parse(v) {
  if (v == null) return null;
  if (typeof v === "string") {
    try { return JSON.parse(v); } catch { return v; }
  }
  return v;
}

module.exports = {
  isConfigured: () => Boolean(REDIS_URL && REDIS_TOKEN),

  async get(key) {
    return parse(await cmd("GET", key));
  },

  async set(key, value, exSecs) {
    const v = typeof value === "object" ? JSON.stringify(value) : String(value);
    return exSecs ? cmd("SET", key, v, "EX", exSecs) : cmd("SET", key, v);
  },

  async del(key) {
    return cmd("DEL", key);
  },

  async sadd(key, member) {
    return cmd("SADD", key, String(member));
  },

  async scard(key) {
    const n = await cmd("SCARD", key);
    return n == null ? null : Number(n);
  },

  async sismember(key, member) {
    const n = await cmd("SISMEMBER", key, String(member));
    return Number(n) === 1;
  },

  /**
   * Incrementa atomicamente e define TTL apenas na primeira chamada.
   * Padrão seguro para rate limiting em serverless.
   */
  async incrTTL(key, ttlSecs) {
    const n = await cmd("INCR", key);
    if (n === 1) await cmd("EXPIRE", key, ttlSecs);
    return n;
  },
};
