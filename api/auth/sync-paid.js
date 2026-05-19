/**
 * POST /api/auth/sync-paid
 * Authorization: Bearer <supabase_jwt>
 *
 * Chamado pelo AuthCallback após o usuário autenticar via magic link.
 * Verifica Redis auth_email:{email} → se existir, marca profiles.is_paid = true.
 * Retorna { is_paid: boolean }.
 *
 * Env necessárias:
 *   SUPABASE_SERVICE_ROLE_KEY
 *   VITE_SUPABASE_URL
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

"use strict";

const { createClient } = require("@supabase/supabase-js");
const db = require("../_db");

const APP_URL = (process.env.APP_URL || "https://motoriaopro.com.br").replace(/\/$/, "");
const SB_URL  = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_SRV  = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TESTER_EMAILS = new Set(
  (process.env.TESTER_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", APP_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")   return res.status(405).end();

  const jwt = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return res.status(401).json({ error: "Token ausente." });

  if (!SB_URL || !SB_SRV) {
    return res.status(500).json({ error: "Configuração do servidor incompleta." });
  }

  const admin = createClient(SB_URL, SB_SRV);

  // Verificar JWT e obter usuário
  const { data: { user }, error: authErr } = await admin.auth.getUser(jwt);
  if (authErr || !user) {
    return res.status(401).json({ error: "Token inválido." });
  }

  const email = user.email?.toLowerCase();

  // Tester/beta — acesso direto
  if (TESTER_EMAILS.has(email)) {
    console.log(`[sync-paid] tester autorizado: ${email}`);
    return res.status(200).json({ is_paid: true });
  }

  // Verificar se email está autorizado no Redis (pagamento confirmado mas não sincronizado ainda)
  const redisKey  = `auth_email:${email}`;
  const hasRedis  = Boolean(await db.get(redisKey));

  if (hasRedis) {
    // Sincronizar: marcar is_paid no Supabase e remover chave Redis
    let updErr = null;
    const { error: e1 } = await admin
      .from("profiles")
      .upsert({ id: user.id, is_paid: true, paid_at: new Date().toISOString() }, { onConflict: "id" });
    if (e1) {
      console.warn("[sync-paid] upsert completo falhou, tentando minimal:", e1.message);
      const { error: e2 } = await admin
        .from("profiles")
        .upsert({ id: user.id, is_paid: true }, { onConflict: "id" });
      updErr = e2;
    }

    if (updErr) {
      console.error("[sync-paid] Erro ao atualizar profiles:", updErr.message);
    } else {
      await db.del(redisKey);
      console.log(`[sync-paid] is_paid sincronizado para ${email} (uid: ${user.id})`);
    }
    return res.status(200).json({ is_paid: true });
  }

  // Verificar profiles diretamente (usuário já foi sincronizado antes)
  const { data: profile } = await admin
    .from("profiles")
    .select("is_paid")
    .eq("id", user.id)
    .single();

  return res.status(200).json({ is_paid: profile?.is_paid === true });
};
