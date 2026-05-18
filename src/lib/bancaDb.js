import { supabase } from "./supabase";

// ─── Bankroll config (initial balance) ────────────────────────────────────────

export async function loadBancaConfig(userId) {
  const { data, error } = await supabase
    .from("bankroll")
    .select("initial_balance, current_balance")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return { bancaInicial: data.initial_balance };
}

export async function saveBancaConfig(userId, bancaInicial) {
  await supabase.from("bankroll").upsert(
    { user_id: userId, initial_balance: bancaInicial, current_balance: bancaInicial },
    { onConflict: "user_id" }
  );
}

// ─── Bet entries ──────────────────────────────────────────────────────────────

export async function loadEntries(userId) {
  const { data, error } = await supabase
    .from("bets")
    .select("id, stake, odd, resultado, market, notes, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  // Normalize to the local format expected by AppDashboard
  return data.map((r) => ({
    id:        r.id,
    ts:        new Date(r.created_at).getTime(),
    valor:     r.stake,
    odd:       r.odd,
    resultado: capitalize(r.resultado),   // "ganhou" → "Ganhou"
    mercado:   r.market || "",
    obs:       r.notes || "",
  }));
}

export async function addEntry(userId, entry) {
  const { data, error } = await supabase
    .from("bets")
    .insert({
      user_id:    userId,
      stake:      entry.valor,
      odd:        entry.odd,
      resultado:  entry.resultado.toLowerCase(),
      market:     entry.mercado,
      notes:      entry.obs,
      profit_loss: calcProfitLoss(entry),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteEntry(entryId) {
  await supabase.from("bets").delete().eq("id", entryId);
}

export async function clearEntries(userId) {
  await supabase.from("bets").delete().eq("user_id", userId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function calcProfitLoss(entry) {
  const v   = parseFloat(entry.valor);
  const odd = parseFloat(entry.odd);
  const res = entry.resultado?.toLowerCase();
  if (res === "ganhou") return v * (odd - 1);
  if (res === "perdeu") return -v;
  return 0;
}
