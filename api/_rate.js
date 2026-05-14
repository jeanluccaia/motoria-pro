/**
 * _rate.js — Rate limiting distribuído
 *
 * Primário:  Upstash Redis (persiste entre instâncias serverless)
 * Fallback:  Map em memória (por instância — apenas rate limit geral)
 *
 * SEGURANÇA:
 *   - IP extraído de x-real-ip (injetado pelo Vercel, não spoofável pelo cliente).
 *     x-forwarded-for[0] É controlado pelo cliente e NUNCA deve ser usado como
 *     fonte de verdade para autenticação ou controle de acesso.
 *   - Free trial é fail-CLOSED: sem Redis, ninguém obtém tentativas gratuitas.
 *     Isso evita que uma falha de Redis desbloqueie acesso ilimitado.
 *   - Rate limit geral é fail-OPEN (gracioso) porque indisponibilidade não deve
 *     derrubar usuários pagantes com token válido.
 */

"use strict";

const db = require("./_db");

// Fallback em memória — apenas para rate limit geral, NÃO para free trial
const MEM = new Map();

/**
 * Extrai o IP real do cliente de forma resistente a spoofing.
 *
 * No Vercel, o header x-real-ip é injetado pela edge e não pode ser
 * sobrescrito pelo cliente. x-forwarded-for[0] é controlado pelo cliente
 * e serve apenas como último recurso (desenvolvimento local).
 */
function getIP(req) {
  // Vercel injeta x-real-ip com o IP real — é a fonte confiável
  const realIP = (req.headers["x-real-ip"] || "").trim();
  if (realIP) return realIP;

  // Fallback: último entry de x-forwarded-for (Vercel append ao final)
  // NÃO usar o primeiro entry — ele é controlado pelo cliente
  const xff = (req.headers["x-forwarded-for"] || "").split(",");
  const edgeIP = xff[xff.length - 1]?.trim();
  if (edgeIP) return edgeIP;

  return req.socket?.remoteAddress || "unknown";
}

async function checkRate(key, max, windowSecs) {
  // ── Redis (distribuído) ──────────────────────────────────────────────────────
  if (db.isConfigured()) {
    const count = await db.incrTTL(key, windowSecs);
    if (count == null) {
      // Redis falhou durante operação — fail open para rate limit geral
      // (evita bloquear usuários pagantes por falha de infraestrutura)
      console.warn("[rate] Redis incrTTL retornou null — fail open para:", key);
      return { allowed: true, count: 0 };
    }
    return { allowed: count <= max, count };
  }

  // ── Fallback em memória ──────────────────────────────────────────────────────
  const now = Date.now();
  let e = MEM.get(key);
  if (!e || now >= e.resetAt) e = { count: 0, resetAt: now + windowSecs * 1000 };
  e.count += 1;
  MEM.set(key, e);

  // Limpeza periódica para evitar vazamento de memória
  if (MEM.size > 5000) {
    for (const [k, v] of MEM) { if (now >= v.resetAt) MEM.delete(k); }
  }

  return { allowed: e.count <= max, count: e.count };
}

const FREE_LIMIT = 2; // análises gratuitas por IP

module.exports = {
  getIP,
  FREE_LIMIT,

  /** 5 requisições por minuto por IP */
  perMinute: (ip) => checkRate(`rl:min:${ip}`, 5, 60),

  /** 20 requisições por hora por IP */
  perHour: (ip) => checkRate(`rl:hr:${ip}`, 20, 3600),

  /**
   * Retorna quantas análises gratuitas esse IP já usou.
   *
   * FAIL CLOSED: sem Redis retorna FREE_LIMIT (não 0).
   * Isso garante que uma falha/ausência de Redis não desbloqueie free trial
   * ilimitado. Usuários com token válido não são afetados.
   */
  async freeUsed(ip) {
    if (!db.isConfigured()) {
      console.warn("[rate] Redis não configurado — free trial bloqueado (fail closed).");
      return FREE_LIMIT; // sem Redis = sem free trial
    }
    const v = await db.get(`free:${ip}`);
    if (v == null) return 0;
    const n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  },

  /**
   * Incrementa o contador de uso gratuito (TTL de 90 dias).
   * Silencioso se Redis não configurado — o bloqueio já ocorreu em freeUsed().
   */
  async incFree(ip) {
    if (!db.isConfigured()) return;
    await db.incrTTL(`free:${ip}`, 86400 * 90);
  },
};
