import { supabase } from "./supabase";

const CODE_SESSION_KEY = "motoria_code_session";

function getCodeSessionToken() {
  try {
    const session = JSON.parse(localStorage.getItem(CODE_SESSION_KEY) || "null");
    return session?.sessionToken || "";
  } catch {
    return "";
  }
}

async function apiFetch(path, options = {}) {
  const token = getCodeSessionToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-motoria-code-session": token,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Falha ao salvar bilhete.");
  return data;
}

function normalizeSlip(row) {
  return {
    id: row.id,
    stake: row.stake,
    oddTotal: row.total_odd,
    chanceReal: row.real_chance,
    riskLevel: row.risk_level,
    resultado: row.resultado || "pendente",
    createdAt: row.created_at,
    selecoes: (row.bet_slip_selections || []).map((s) => ({
      id: s.id,
      jogo: s.game,
      mercado: s.market,
      odd: s.odd,
    })),
  };
}

export async function loadSlips(userId) {
  if (getCodeSessionToken()) {
    const data = await apiFetch("/api/data?ns=slips");
    return data.slips || [];
  }

  const { data, error } = await supabase
    .from("bet_slips")
    .select(`
      id, stake, total_odd, real_chance, risk_level, resultado, created_at,
      bet_slip_selections ( id, game, market, odd, acertou )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error || !data) return [];
  return data.map(normalizeSlip);
}

export async function saveSlip(userId, { stake, oddTotal, chanceReal, riskLevel, selecoes }) {
  const body = { stake, oddTotal, chanceReal, riskLevel, selecoes };

  if (getCodeSessionToken()) {
    const data = await apiFetch("/api/data?ns=slips", {
      method: "POST",
      body: JSON.stringify({ action: "save", slip: body }),
    });
    return data.id;
  }

  const { data: slip, error } = await supabase
    .from("bet_slips")
    .insert({
      user_id: userId,
      stake: stake ? parseFloat(stake) : null,
      total_odd: oddTotal,
      real_chance: chanceReal,
      risk_level: riskLevel,
      resultado: "pendente",
    })
    .select("id")
    .single();
  if (error) throw error;

  if (selecoes?.length > 0) {
    await supabase.from("bet_slip_selections").insert(
      selecoes.map((s) => ({
        slip_id: slip.id,
        game: s.jogo,
        market: s.mercado,
        odd: s.odd,
      }))
    );
  }
  return slip.id;
}

export async function updateSlipResult(slipId, resultado) {
  if (getCodeSessionToken()) {
    await apiFetch("/api/data?ns=slips", {
      method: "POST",
      body: JSON.stringify({ action: "update-result", slipId, resultado }),
    });
    return;
  }

  await supabase.from("bet_slips").update({ resultado }).eq("id", slipId);
}

export async function deleteSlip(slipId) {
  if (getCodeSessionToken()) {
    await apiFetch("/api/data?ns=slips", {
      method: "POST",
      body: JSON.stringify({ action: "delete", slipId }),
    });
    return;
  }

  await supabase.from("bet_slips").delete().eq("id", slipId);
}
