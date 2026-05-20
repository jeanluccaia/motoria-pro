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
  if (!res.ok) throw new Error(data.error || "Falha ao salvar banca.");
  return data;
}

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function calcProfitLoss(entry) {
  const value = parseFloat(entry.valor);
  const odd = parseFloat(entry.odd);
  const result = entry.resultado?.toLowerCase();
  if (result === "ganhou") return value * (odd - 1);
  if (result === "perdeu") return -value;
  return 0;
}

export async function loadBancaConfig(userId) {
  if (getCodeSessionToken()) {
    const data = await apiFetch("/api/data?ns=banca&resource=config");
    return data.config || null;
  }

  const { data, error } = await supabase
    .from("bankroll")
    .select("initial_balance, current_balance")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return { bancaInicial: data.initial_balance };
}

export async function saveBancaConfig(userId, bancaInicial) {
  if (getCodeSessionToken()) {
    await apiFetch("/api/data?ns=banca", {
      method: "POST",
      body: JSON.stringify({ action: "save-config", bancaInicial }),
    });
    return;
  }

  await supabase.from("bankroll").upsert(
    { user_id: userId, initial_balance: bancaInicial, current_balance: bancaInicial },
    { onConflict: "user_id" }
  );
}

export async function loadEntries(userId) {
  if (getCodeSessionToken()) {
    const data = await apiFetch("/api/data?ns=banca&resource=entries");
    return data.entries || [];
  }

  const { data, error } = await supabase
    .from("bets")
    .select("id, stake, odd, resultado, market, notes, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id,
    ts: new Date(r.created_at).getTime(),
    valor: r.stake,
    odd: r.odd,
    resultado: capitalize(r.resultado),
    mercado: r.market || "",
    obs: r.notes || "",
  }));
}

export async function addEntry(userId, entry) {
  if (getCodeSessionToken()) {
    const data = await apiFetch("/api/data?ns=banca", {
      method: "POST",
      body: JSON.stringify({ action: "add-entry", entry }),
    });
    return data.id;
  }

  const { data, error } = await supabase
    .from("bets")
    .insert({
      user_id: userId,
      stake: entry.valor,
      odd: entry.odd,
      resultado: entry.resultado.toLowerCase(),
      market: entry.mercado,
      notes: entry.obs,
      profit_loss: calcProfitLoss(entry),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteEntry(entryId) {
  if (getCodeSessionToken()) {
    await apiFetch("/api/data?ns=banca", {
      method: "POST",
      body: JSON.stringify({ action: "delete-entry", entryId }),
    });
    return;
  }

  await supabase.from("bets").delete().eq("id", entryId);
}

export async function clearEntries(userId) {
  if (getCodeSessionToken()) {
    await apiFetch("/api/data?ns=banca", {
      method: "POST",
      body: JSON.stringify({ action: "clear-entries" }),
    });
    return;
  }

  await supabase.from("bets").delete().eq("user_id", userId);
}
