// api/matches.js — MotorIA Sports Data Layer v2
// Sources: TheSportsDB free tier → curated smart fallback
// Returns standardized match objects with real-time status (live / upcoming / ended)
// based on Brazilian time (UTC-3).

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  // 5-minute edge cache, 60-second stale-while-revalidate
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");

  if (req.method === "OPTIONS") return res.status(200).end();

  const now   = new Date();
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

  let matches = [];
  let source  = "curated";

  // ── Primary: TheSportsDB free tier ───────────────────────────────────────────
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/1/eventsday.php?d=${today}&s=Soccer`;
    const r   = await fetch(url, {
      headers: { "User-Agent": "MotorIA/2.0" },
      signal:  AbortSignal.timeout(5000),
    });

    if (r.ok) {
      const data   = await r.json();
      const events = (data.events || []).filter(Boolean);

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
        .slice(0, 16);

      if (relevant.length >= 3) {
        matches = relevant.map(e => fromTheSportsDB(e, now));
        source  = "live";
      }
    }
  } catch (_) { /* fall through */ }

  // ── Fallback: smart curated schedule ─────────────────────────────────────────
  if (matches.length < 3) {
    matches = getCurated(now);
    source  = "curated";
  }

  // Sort: live first, then upcoming (by time), then ended
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

// ── Normalize a TheSportsDB event ─────────────────────────────────────────────
function fromTheSportsDB(e, now) {
  const timeStr = e.strTime ? e.strTime.substring(0, 5) : null;
  const { status, elapsed } = deriveStatus(timeStr, now);

  // Scores: TheSportsDB returns null strings when not yet played
  const rawHome = e.intHomeScore;
  const rawAway = e.intAwayScore;
  const hasScore =
    rawHome !== null && rawHome !== undefined && rawHome !== "" &&
    rawAway !== null && rawAway !== undefined && rawAway !== "";

  return {
    id:        e.idEvent || String(Math.random()),
    home:      e.strHomeTeam  || "—",
    away:      e.strAwayTeam  || "—",
    league:    e.strLeague    || "",
    country:   e.strCountry   || "",
    time:      timeStr,
    status,
    elapsed,
    scoreHome: hasScore ? Number(rawHome) : null,
    scoreAway: hasScore ? Number(rawAway) : null,
    round:     e.intRound ? `Rodada ${e.intRound}` : null,
  };
}

// ── Status from match kick-off time (Brazil = UTC-3) ─────────────────────────
// Returns { status: "live"|"upcoming"|"ended", elapsed: number|null }
function deriveStatus(timeStr, now) {
  if (!timeStr) return { status: "upcoming", elapsed: null };

  const [h, m]        = timeStr.split(":").map(Number);
  const matchMin      = h * 60 + m;                          // BRT minutes since midnight
  const utcMin        = now.getUTCHours() * 60 + now.getUTCMinutes();
  const brtMin        = ((utcMin - 180) + 1440) % 1440;     // UTC → BRT
  const diff          = brtMin - matchMin;                   // minutes since kick-off

  if (diff < -10)  return { status: "upcoming", elapsed: null };
  if (diff > 110)  return { status: "ended",    elapsed: null };  // ~90' + 20' buffer
  return { status: "live", elapsed: Math.min(90, Math.max(1, diff)) };
}

// ── Curated schedule by day-of-week ──────────────────────────────────────────
// All times are BRT (UTC-3). Status is computed at request time via deriveStatus.
function getCurated(now) {
  const dow      = now.getUTCDay();               // 0 = Sun … 6 = Sat
  const schedule = (dow === 0 || dow === 6)
    ? WEEKEND
    : (dow === 2 || dow === 4)
    ? CHAMPIONS_DAYS
    : MIDWEEK;

  return schedule.map((m, i) => {
    const { status, elapsed } = deriveStatus(m.time, now);
    return {
      ...m,
      id:        `c${i}`,
      status,
      elapsed,
      scoreHome: null,
      scoreAway: null,
    };
  });
}

// Times in BRT (UTC-3).
const WEEKEND = [
  { home: "Arsenal",       away: "Chelsea",         league: "Premier League",   time: "11:30" },
  { home: "Real Madrid",   away: "Barcelona",       league: "La Liga",          time: "13:00" },
  { home: "Juventus",      away: "AC Milan",        league: "Serie A",          time: "14:45" },
  { home: "Corinthians",   away: "São Paulo",       league: "Brasileirão",      time: "16:00" },
  { home: "Grêmio",        away: "Internacional",   league: "Brasileirão",      time: "16:00" },
  { home: "Santos",        away: "Botafogo",        league: "Brasileirão",      time: "18:30" },
  { home: "Flamengo",      away: "Palmeiras",       league: "Brasileirão",      time: "18:30" },
  { home: "Atlético-MG",   away: "Cruzeiro",        league: "Brasileirão",      time: "20:30" },
  { home: "Fortaleza",     away: "Bahia",           league: "Brasileirão",      time: "20:30" },
  { home: "Bayer Leverkusen", away: "Bayern München", league: "Bundesliga",    time: "15:30" },
];

const CHAMPIONS_DAYS = [
  { home: "Bayern München",  away: "Arsenal",         league: "Champions League", time: "16:00" },
  { home: "Real Madrid",     away: "Manchester City", league: "Champions League", time: "16:00" },
  { home: "Inter de Milão",  away: "PSG",             league: "Champions League", time: "16:00" },
  { home: "Atlético Madrid", away: "Dortmund",        league: "Champions League", time: "13:45" },
  { home: "Flamengo",        away: "River Plate",     league: "Libertadores",     time: "21:30" },
  { home: "Palmeiras",       away: "Boca Juniors",    league: "Libertadores",     time: "19:00" },
  { home: "Atlético-MG",     away: "Vélez Sársfield", league: "Libertadores",     time: "21:00" },
];

const MIDWEEK = [
  { home: "Manchester City",  away: "Liverpool",       league: "Premier League",   time: "17:30" },
  { home: "Barcelona",        away: "Sevilla",         league: "La Liga",          time: "21:00" },
  { home: "Bayern München",   away: "Dortmund",        league: "Bundesliga",       time: "20:30" },
  { home: "PSG",              away: "Olympique Lyon",  league: "Ligue 1",          time: "21:00" },
  { home: "Flamengo",         away: "Atlético-MG",     league: "Brasileirão",      time: "20:00" },
  { home: "Palmeiras",        away: "Corinthians",     league: "Brasileirão",      time: "20:00" },
  { home: "São Paulo",        away: "Santos",          league: "Brasileirão",      time: "21:30" },
  { home: "Cruzeiro",         away: "Grêmio",          league: "Série B",          time: "18:30" },
];
