// api/matches.js — Vercel serverless function
// Returns today's soccer matches from TheSportsDB (free tier, key "1")
// Falls back to a curated list based on the day of week if the API returns no data.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=60");

  if (req.method === "OPTIONS") return res.status(200).end();

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    const url = `https://www.thesportsdb.com/api/v1/json/1/eventsday.php?d=${today}&s=Soccer`;
    const r = await fetch(url, {
      headers: { "User-Agent": "MotorIA/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!r.ok) throw new Error("TheSportsDB unavailable");

    const data = await r.json();
    const events = (data.events || []).filter(Boolean);

    // Leagues we care about
    const RELEVANT = [
      "brazil", "brasileir", "série a", "serie a",
      "premier league", "la liga", "champions league",
      "libertadores", "copa do brasil", "serie b", "bundesliga",
      "ligue 1", "serie a", "eredivisie", "primeira liga",
    ];

    const relevant = events
      .filter(e => {
        const l = (e.strLeague || "").toLowerCase();
        return RELEVANT.some(k => l.includes(k));
      })
      .slice(0, 14);

    if (relevant.length >= 2) {
      const matches = relevant.map(e => ({
        id: e.idEvent || String(Math.random()),
        home: e.strHomeTeam || "—",
        away: e.strAwayTeam || "—",
        league: e.strLeague || "",
        time: e.strTime ? e.strTime.substring(0, 5) : null,
        country: e.strCountry || "",
      }));
      return res.status(200).json({ matches, source: "live", date: today });
    }

    // Fall through to curated list
    throw new Error("Insufficient data");
  } catch (_) {
    return res.status(200).json({
      matches: getCurated(today),
      source: "curated",
      date: today,
    });
  }
}

// Day-based curated list — weekends lean Brazilian, weekdays lean European
function getCurated(dateStr) {
  const d = new Date(dateStr + "T12:00:00Z");
  const dow = d.getUTCDay(); // 0=Sun…6=Sat

  const BR_WEEKEND = [
    { id: "br1", home: "Flamengo",    away: "Palmeiras",       league: "Brasileirão",   time: "16:00" },
    { id: "br2", home: "Corinthians", away: "São Paulo",       league: "Brasileirão",   time: "18:30" },
    { id: "br3", home: "Atlético-MG", away: "Grêmio",         league: "Brasileirão",   time: "21:00" },
    { id: "br4", home: "Santos",      away: "Botafogo",        league: "Brasileirão",   time: "18:30" },
    { id: "br5", home: "Fortaleza",   away: "Internacional",   league: "Brasileirão",   time: "19:00" },
    { id: "br6", home: "Cruzeiro",    away: "Bahia",           league: "Série B",       time: "16:00" },
    { id: "eu1", home: "Arsenal",     away: "Chelsea",         league: "Premier League",time: "13:30" },
    { id: "eu2", home: "Real Madrid", away: "Atlético Madrid", league: "La Liga",       time: "21:00" },
  ];

  const EU_WEEKDAY = [
    { id: "eu3", home: "Manchester City", away: "Liverpool",     league: "Premier League",  time: "17:30" },
    { id: "eu4", home: "Barcelona",       away: "Sevilla",       league: "La Liga",          time: "21:00" },
    { id: "eu5", home: "Bayern München",  away: "Dortmund",      league: "Bundesliga",       time: "20:30" },
    { id: "eu6", home: "PSG",             away: "Olympique Lyon",league: "Ligue 1",          time: "21:00" },
    { id: "lib1",home: "Flamengo",        away: "River Plate",   league: "Libertadores",     time: "21:30" },
    { id: "lib2",home: "Palmeiras",       away: "Boca Juniors",  league: "Libertadores",     time: "19:00" },
    { id: "cl1", home: "Real Madrid",     away: "Man City",      league: "Champions League", time: "21:00" },
    { id: "cl2", home: "Bayern München",  away: "Arsenal",       league: "Champions League", time: "21:00" },
  ];

  const MIXED = [
    { id: "m1", home: "Flamengo",        away: "Atlético-MG",   league: "Brasileirão",      time: "20:00" },
    { id: "m2", home: "Palmeiras",       away: "Corinthians",   league: "Brasileirão",      time: "17:00" },
    { id: "m3", home: "Barcelona",       away: "Real Madrid",   league: "La Liga",          time: "21:00" },
    { id: "m4", home: "Arsenal",         away: "Man City",      league: "Premier League",   time: "16:00" },
    { id: "m5", home: "São Paulo",       away: "Grêmio",        league: "Brasileirão",      time: "21:30" },
    { id: "m6", home: "Bayern München",  away: "Juventus",      league: "Champions League", time: "21:00" },
  ];

  if (dow === 0 || dow === 6) return BR_WEEKEND; // Sat/Sun
  if (dow === 2 || dow === 4) return EU_WEEKDAY;  // Tue/Thu
  return MIXED;
}
