import { supabase } from "./supabase";

export async function loadSlips(userId) {
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
  const { data: slip, error } = await supabase
    .from("bet_slips")
    .insert({
      user_id:     userId,
      stake:       stake ? parseFloat(stake) : null,
      total_odd:   oddTotal,
      real_chance: chanceReal,
      risk_level:  riskLevel,
      resultado:   "pendente",
    })
    .select("id")
    .single();
  if (error) throw error;

  if (selecoes?.length > 0) {
    await supabase.from("bet_slip_selections").insert(
      selecoes.map((s) => ({
        slip_id: slip.id,
        game:    s.jogo,
        market:  s.mercado,
        odd:     s.odd,
      }))
    );
  }
  return slip.id;
}

export async function updateSlipResult(slipId, resultado) {
  await supabase.from("bet_slips").update({ resultado }).eq("id", slipId);
}

export async function deleteSlip(slipId) {
  await supabase.from("bet_slips").delete().eq("id", slipId);
}

function normalizeSlip(r) {
  return {
    id:         r.id,
    stake:      r.stake,
    oddTotal:   r.total_odd,
    chanceReal: r.real_chance,
    riskLevel:  r.risk_level,
    resultado:  r.resultado || "pendente",
    createdAt:  r.created_at,
    selecoes:   (r.bet_slip_selections || []).map((s) => ({
      id:      s.id,
      jogo:    s.game,
      mercado: s.market,
      odd:     s.odd,
    })),
  };
}
