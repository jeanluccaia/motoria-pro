/**
 * POST /api/webhook-kiwify
 * Recebe notificação de pagamento confirmado da Kiwify e gera token de acesso.
 *
 * CONFIGURAÇÃO NO PAINEL KIWIFY:
 *   URL do webhook: https://seu-dominio.vercel.app/api/webhook-kiwify?token={WEBHOOK_SECRET}
 *   Evento: order_approved (pagamento confirmado)
 *
 * SEGURANÇA:
 *   - Autenticado via query param ?token=WEBHOOK_SECRET (padrão Kiwify).
 *   - Créditos SÓ são liberados por este endpoint ou por /api/admin-generate.
 *   - Nenhum redirect/callback do frontend pode gerar créditos.
 *   - O token gerado é logado nos Vercel Logs para que o admin o envie
 *     manualmente ao comprador (ou integre com Resend/SendGrid no futuro).
 *   - Idempotente por order_id: se o mesmo pedido chegar duas vezes,
 *     o segundo é ignorado (chave Redis: wh:{order_id}).
 *
 * VARIÁVEL DE AMBIENTE:
 *   WEBHOOK_SECRET — string longa e aleatória configurada também no painel Kiwify.
 *
 * FORMATO DO BODY KIWIFY (eventos order_approved):
 *   {
 *     order_id:     "abc123",
 *     order_status: "paid",
 *     Customer: { email: "cliente@exemplo.com", full_name: "..." },
 *     ...
 *   }
 */

"use strict";

const { generate, INITIAL_CREDITS } = require("./_credits");
const { getIP, perMinute } = require("./_rate");
const db = require("./_db");

// Janela de idempotência: 30 dias (evita gerar dois tokens para o mesmo pedido)
const IDEMPOTENCY_TTL_SECS = 86400 * 30;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const ip = getIP(req);
  const rl = await perMinute(ip);
  if (!rl.allowed) {
    return res.status(429).end();
  }

  // ── Autenticação via query param (padrão Kiwify) ──────────────────────────
  const receivedSecret = (req.query?.token || "").trim();
  if (!process.env.WEBHOOK_SECRET || receivedSecret !== process.env.WEBHOOK_SECRET) {
    console.warn(`[webhook-kiwify] Tentativa não autorizada — IP: ${ip}`);
    return res.status(401).json({ error: "Unauthorized." });
  }

  const body = req.body || {};

  // ── Verificar status de pagamento ─────────────────────────────────────────
  const status   = (body.order_status || body.status || "").toLowerCase();
  const orderId  = String(body.order_id  || body.id || "").trim();
  const email    = (body.Customer?.email || body.customer?.email || body.email || "").trim();

  if (status !== "paid") {
    // Ignorar silenciosamente eventos que não são pagamentos confirmados
    // (reembolsos, chargebacks, eventos de teste etc.)
    console.log(`[webhook-kiwify] Evento ignorado — status: ${status}, order: ${orderId}`);
    return res.status(200).json({ received: true, action: "ignored", status });
  }

  // ── Idempotência: verificar se este pedido já foi processado ─────────────
  if (orderId) {
    const idempotencyKey = `wh:${orderId}`;
    const alreadyProcessed = await db.get(idempotencyKey);
    if (alreadyProcessed) {
      console.log(`[webhook-kiwify] Pedido duplicado ignorado — order: ${orderId}`);
      return res.status(200).json({ received: true, action: "duplicate_ignored" });
    }
    // Marcar como processado antes de gerar o token (evita race condition)
    await db.set(idempotencyKey, "1", IDEMPOTENCY_TTL_SECS);
  }

  // ── Gerar token ───────────────────────────────────────────────────────────
  try {
    const token = await generate(email);

    // Log para o admin localizar o token nos Vercel Logs e enviar ao cliente.
    // IMPORTANTE: em produção, substituir por envio de email via Resend/SendGrid.
    console.log(
      `[webhook-kiwify] TOKEN_GERADO | order: ${orderId} | email: ${email || "(sem email)"} | credits: ${INITIAL_CREDITS} | token: ${token}`
    );

    // Respond 200 imediatamente para o Kiwify não retentar
    return res.status(200).json({ received: true, action: "token_generated" });

  } catch (err) {
    console.error("[webhook-kiwify] Erro ao gerar token:", err.message);
    // Resposta 500 faz o Kiwify retentar — é intencional
    return res.status(500).json({ error: "Erro interno. Retentativa esperada." });
  }
};
