"use strict";

/**
 * Consolidated data handler — replaces /api/banca and /api/slips
 * Namespace via ?ns=banca | ?ns=slips
 */

const { createClient } = require("@supabase/supabase-js");
const { applyCors } = require("./_cors");
const { getCodeSessionFromReq } = require("./_codeSession");

const SB_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;

function adminClient() {
  if (!SB_URL || !SB_SRV) return null;
  return createClient(SB_URL, SB_SRV, { auth: { autoRefreshToken: false, persistSession: false } });
}

function requireCodeSession(req, res) {
  const session = getCodeSessionFromReq(req);
  if (!session?.userId) { res.status(401).json({ error: "Sessao invalida." }); return null; }
  return session;
}

// ── /api/banca logic ──────────────────────────────────────────────────────────

function calcProfitLoss(entry) {
  const value = Number(entry?.valor || entry?.stake || 0);
  const odd   = Number(entry?.odd || 0);
  const result = String(entry?.resultado || "").toLowerCase();
  if (result === "ganhou") return value * (odd - 1);
  if (result === "perdeu") return -value;
  return 0;
}

function normalizeEntry(row) {
  const resultado = row.resultado
    ? row.resultado.charAt(0).toUpperCase() + row.resultado.slice(1)
    : row.resultado;
  return { id: row.id, ts: new Date(row.created_at).getTime(), valor: Number(row.stake), odd: Number(row.odd), resultado, mercado: row.market || "", obs: row.notes || "" };
}

async function handleBanca(req, res, sb, session) {
  if (req.method === "GET") {
    const resource = String(req.query?.resource || "entries");
    if (resource === "config") {
      const { data, error } = await sb.from("bankroll").select("initial_balance,current_balance").eq("user_id", session.userId).maybeSingle();
      if (error || !data) return res.status(200).json({ config: null });
      return res.status(200).json({ config: { bancaInicial: Number(data.initial_balance || 0) } });
    }
    const { data, error } = await sb.from("bets").select("id, stake, odd, resultado, market, notes, created_at").eq("user_id", session.userId).order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: "Falha ao carregar banca." });
    return res.status(200).json({ entries: (data || []).map(normalizeEntry) });
  }

  if (req.method !== "POST") return res.status(405).end();

  const action = String(req.body?.action || "");

  if (action === "save-config") {
    const bancaInicial = Number(req.body?.bancaInicial || 0);
    const { error } = await sb.from("bankroll").upsert({ user_id: session.userId, initial_balance: bancaInicial, current_balance: bancaInicial }, { onConflict: "user_id" });
    if (error) return res.status(500).json({ error: "Falha ao salvar banca." });
    return res.status(200).json({ ok: true });
  }

  if (action === "add-entry") {
    const entry = req.body?.entry || {};
    const { data, error } = await sb.from("bets").insert({ user_id: session.userId, stake: Number(entry.valor || 0), odd: Number(entry.odd || 0), resultado: String(entry.resultado || "pendente").toLowerCase(), market: entry.mercado || "", notes: entry.obs || "", profit_loss: calcProfitLoss(entry) }).select("id").single();
    if (error) return res.status(500).json({ error: "Falha ao salvar entrada." });
    return res.status(200).json({ id: data.id });
  }

  if (action === "delete-entry") {
    await sb.from("bets").delete().eq("id", req.body?.entryId).eq("user_id", session.userId);
    return res.status(200).json({ ok: true });
  }

  if (action === "clear-entries") {
    await sb.from("bets").delete().eq("user_id", session.userId);
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: "Acao invalida." });
}

// ── /api/slips logic ──────────────────────────────────────────────────────────

function normalizeSlip(row) {
  return {
    id: row.id, stake: row.stake, oddTotal: row.total_odd, chanceReal: row.real_chance,
    riskLevel: row.risk_level, resultado: row.resultado || "pendente", createdAt: row.created_at,
    selecoes: (row.bet_slip_selections || []).map(s => ({ id: s.id, jogo: s.game, mercado: s.market, odd: s.odd })),
  };
}

async function handleSlips(req, res, sb, session) {
  if (req.method === "GET") {
    const { data, error } = await sb.from("bet_slips").select(`id, stake, total_odd, real_chance, risk_level, resultado, created_at, bet_slip_selections ( id, game, market, odd, acertou )`).eq("user_id", session.userId).order("created_at", { ascending: false }).limit(30);
    if (error) return res.status(500).json({ error: "Falha ao carregar bilhetes." });
    return res.status(200).json({ slips: (data || []).map(normalizeSlip) });
  }

  if (req.method !== "POST") return res.status(405).end();

  const action = String(req.body?.action || "");

  if (action === "save") {
    const slipBody = req.body?.slip || {};
    const { data: slip, error } = await sb.from("bet_slips").insert({ user_id: session.userId, stake: slipBody.stake ? Number(slipBody.stake) : null, total_odd: Number(slipBody.oddTotal || 0), real_chance: Number(slipBody.chanceReal || 0), risk_level: slipBody.riskLevel, resultado: "pendente" }).select("id").single();
    if (error) return res.status(500).json({ error: "Falha ao salvar bilhete." });

    const selecoes = Array.isArray(slipBody.selecoes) ? slipBody.selecoes : [];
    if (selecoes.length > 0) {
      const { error: selError } = await sb.from("bet_slip_selections").insert(selecoes.map(s => ({ slip_id: slip.id, game: s.jogo, market: s.mercado, odd: Number(s.odd || 0) })));
      if (selError) return res.status(500).json({ error: "Falha ao salvar selecoes." });
    }
    return res.status(200).json({ id: slip.id });
  }

  if (action === "update-result") {
    await sb.from("bet_slips").update({ resultado: req.body?.resultado }).eq("id", req.body?.slipId).eq("user_id", session.userId);
    return res.status(200).json({ ok: true });
  }

  if (action === "delete") {
    await sb.from("bet_slips").delete().eq("id", req.body?.slipId).eq("user_id", session.userId);
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: "Acao invalida." });
}

// ── Router ────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (applyCors(req, res)) return;

  const session = requireCodeSession(req, res);
  if (!session) return;

  const sb = adminClient();
  if (!sb) return res.status(500).json({ error: "Supabase env vars ausentes." });

  const ns = String(req.query?.ns || "");
  if (ns === "banca") return handleBanca(req, res, sb, session);
  if (ns === "slips") return handleSlips(req, res, sb, session);

  return res.status(400).json({ error: "ns invalido. Use: banca | slips" });
};
