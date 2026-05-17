// api/matches.js — MotorIA Sports Data Layer v3
// POLÍTICA: nunca retornar jogos inventados/hardcoded.
// Se a API não retornar dados reais → array vazio.
// Fonte: TheSportsDB free tier (dados reais somente).

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=30");

  if (req.method === "OPTIONS") return res.status(200).end();

  const now   = new Date();
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

  let matches = [];
  let source  = "empty";

  // ── TheSportsDB free tier ─────────────────────────────────────────────────────
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/1/eventsday.php?d=${today}&s=Soccer`;
    console.log(`[matches] fetching TheSportsDB for ${today}…`);

    const r = await fetch(url, {
      headers: { "User-Agent": "MotorIA/3.0" },
      signal:  AbortSignal.timeout(6000),
    });

    if (!r.ok) {
      console.log(`[matches] API failed — HTTP ${r.status}`);
      source = "api_error";
    } else {
      const data   = await r.json();
      const events = (data.events || []).filter(Boolean);
      console.log(`[matches] API returned ${events.length} total soccer events`);

      const RELEVANT = [
        "brazil", "brasileir", "serie a", "série a",
        "premier league", "la liga", "champions league",
        "libertadores", "copa do brasil", "serie b", "série b",
        "bundesliga", "ligue 1",
      ];

      const relevant = events
        .filter(e => {
          const l = (e.strLeague || "").toLowerCase();
          return RELEVANT.some(k => l.includes(k));
        })
        .slice(0, 20);

      if (relevant.length > 0) {
        matches = relevant.map(e => fromTheSportsDB(e, now));
        source  = "api";
        console.log(`[matches] API games: ${matches.length} relevant fixtures`, matches.map(m => `${m.home} x ${m.away} (${m.league})`));
      } else {
        console.log("[matches] No real games returned — empty state shown");
        source = "empty";
      }
    }
  } catch (err) {
    console.log("[matches] API failed —", err.message || err);
    source = "api_error";
  }

  // Sort: live → upcoming (by time) → ended
  const ORDER = { live: 0, upcoming: 1, ended: 2 };
  matches.sort((a, b) => {
    if (ORDER[a.status] !== ORDER[b.status]) return ORDER[a.status] - ORDER[b.status];
    return (a.time || "").localeCompare(b.time || "");
  });

  return res.status(200).json({
    matches,
    source,
    date:      today,
    updatedAt: now.toISOString(),
    total:     matches.length,
    liveCount: matches.filter(m => m.status === "live").length,
  });
}

// ── Normaliza evento do TheSportsDB ──────────────────────────────────────────
function fromTheSportsDB(e, now) {
  // strTime do TheSportsDB está em UTC — convertemos para BRT (UTC-3) para exibição
  const rawTime = e.strTime ? e.strTime.substring(0, 5) : null;
  const brtTime = rawTime ? utcToBRT(rawTime) : null;
  const { status, elapsed } = deriveStatus(rawTime, now);

  const rawHome = e.intHomeScore;
  const rawAway = e.intAwayScore;
  const hasScore =
    rawHome !== null && rawHome !== undefined && rawHome !== "" &&
    rawAway !== null && rawAway !== undefined && rawAway !== "";

  return {
    id:        e.idEvent || String(Math.random()),
    home:      e.strHomeTeam || "—",
    away:      e.strAwayTeam || "—",
    league:    e.strLeague   || "",
    country:   e.strCountry  || "",
    timeUTC:   rawTime,
    time:      brtTime,   // exibido na UI (BRT)
    status,
    elapsed,
    scoreHome: hasScore ? Number(rawHome) : null,
    scoreAway: hasScore ? Number(rawAway) : null,
    round:     e.intRound ? `Rodada ${e.intRound}` : null,
    source:    "thesportsdb",
  };
}

// Converte "HH:MM" UTC para "HH:MM" BRT (UTC-3)
function utcToBRT(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMin = h * 60 + m - 180; // -3h
  const brtMin   = ((totalMin % 1440) + 1440) % 1440;
  const bh = Math.floor(brtMin / 60).toString().padStart(2, "0");
  const bm = (brtMin % 60).toString().padStart(2, "0");
  return `${bh}:${bm}`;
}

// ── Status baseado no horário UTC do jogo vs hora atual UTC ──────────────────
function deriveStatus(timeUTC, now) {
  if (!timeUTC) return { status: "upcoming", elapsed: null };

  const [h, m]   = timeUTC.split(":").map(Number);
  const matchMin = h * 60 + m;                           // minutos UTC desde meia-noite
  const nowMin   = now.getUTCHours() * 60 + now.getUTCMinutes(); // minutos UTC agora
  const diff     = nowMin - matchMin;                    // minutos desde o início

  if (diff < -10)  return { status: "upcoming", elapsed: null };
  if (diff > 115)  return { status: "ended",    elapsed: null }; // 90' + 25' buffer
  return { status: "live", elapsed: Math.min(90, Math.max(1, diff)) };
}
