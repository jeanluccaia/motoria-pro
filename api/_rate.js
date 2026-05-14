/**
 * _rate.js — Rate limiting distribuído
 *
 * Primário:  Upstash Redis (persiste entre instâncias serverless)
 * Fallback:  Map em memória (por instância — usado quando Redis não configurado)
 */

"use strict";

const db = require("./_db");

// Fallback em memória (funciona dentro de uma instância)
const MEM = new Map();

function getIP(req) {
  return (
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.headers["x-real-ip"]         ||
    req.socket?.remoteAddress        ||
    "unknown"
  );
}

async function checkRate(key, max, windowSecs) {
  // ── Redis (distribuído) ──────────────────────────────────────────────────────
  if (db.isConfigured()) {
    const count = await db.incrTTL(key, windowSecs);
    if (count == null) return { allowed: true, count: 0 }; // falha graciosa
    return { allowed: count <= max, count };
  }

  // ── Fallback em memória ──────────────────────────────────────────────────────
  const now = Date.now();
  let e = MEM.get(key);
  if (!e || now >= e.resetAt) e = { count: 0, resetAt: now + windowSecs * 1000 };
  e.count += 1;
  MEM.set(key, e);

  // Limpeza periódica para evitar vazamento
  if (MEM.size > 5000) {
    for (const [k, v] of MEM) { if (now >= v.resetAt) MEM.delete(k); }
  }

  return { allowed: e.count <= max, count: e.count };
}

module.exports = {
  getIP,

  FREE_LIMIT: 2, // análises gratuitas por IP

  /** 5 requisições por minuto por IP */
  perMinute: (ip) => checkRate(`rl:min:${ip}`, 5, 60),

  /** 20 requisições por hora por IP */
  perHour: (ip) => checkRate(`rl:hr:${ip}`, 20, 3600),

  /** Retorna quantas análises gratuitas esse IP já usou. */
  async freeUsed(ip) {
    if (!db.isConfigured()) return 0;
    const v = await db.get(`free:${ip}`);
    return v != null ? parseInt(v, 10) : 0;
  },

  /** Incrementa o contador de uso gratuito (TTL de 90 dias). */
  async incFree(ip) {
    if (!db.isConfigured()) return;
    await db.incrTTL(`free:${ip}`, 86400 * 90);
  },
};
