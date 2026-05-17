// api/matches.js — MotorIA Sports Data Layer v4
// Fonte: ESPN Scoreboard API (pública, sem chave, dados reais em tempo real)
// POLÍTICA: nunca retornar jogos inventados. Se a API falhar → array vazio.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  // Cache de 2 minutos na edge, stale-while-revalidate 30s
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=30");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Ligas que buscamos em paralelo na ESPN
  const ESPN_LEAGUES = [
    { slug: "bra.1",                   name: "Brasileirão"       },
    { slug: "bra.2",                   name: "Série B"           },
    { slug: "bra.cup",                 name: "Copa do Brasil"    },
    { slug: "eng.1",                   name: "Premier League"    },
    { slug: "esp.1",                   name: "La Liga"           },
    { slug: "ger.1",                   name: "Bundesliga"        },
    { slug: "ita.1",                   name: "Serie A"           },
    { slug: "fra.1",                   name: "Ligue 1"           },
    { slug: "uefa.champions",          name: "Champions League"  },
    { slug: "conmebol.libertadores",   name: "Libertadores"      },
    { slug: "conmebol.sudamericana",   name: "Sul-Americana"     },
  ];

  const now = new Date();
  let matches = [];
  let source  = "empty";

  try {
    // Busca todas as ligas em paralelo
    const results = await Promise.allSettled(
      ESPN_LEAGUES.map(({ slug, name }) => fetchESPNLeague(slug, name))
    );

    const all = results
      .filter(r => r.status === "fulfilled")
      .flatMap(r => r.value);

    console.log(`[matches] ESPN retornou ${all.length} jogos no total`);

    if (all.length > 0) {
      matches = all.map(e => normalizeESPN(e, now));
      source  = "api";
      console.log("[matches] API games:", matches.map(m => `${m.home} x ${m.away} (${m.league}) ${m.status}`));
    } else {
      console.log("[matches] No real games returned today");
    }
  } catch (err) {
    console.log("[matches] API failed —", err.message || err);
    source = "api_error";
  }

  // Ordena: ao vivo → agendado (por horário) → encerrado
  const ORDER = { live: 0, upcoming: 1, ended: 2 };
  matches.sort((a, b) => {
    if (ORDER[a.status] !== ORDER[b.status]) return ORDER[a.status] - ORDER[b.status];
    return (a.timestamp || 0) - (b.timestamp || 0);
  });

  return res.status(200).json({
    matches,
    source,
    date:      now.toISOString().split("T")[0],
    updatedAt: now.toISOString(),
    total:     matches.length,
    liveCount: matches.filter(m => m.status === "live").length,
  });
}

// ── Busca jogos de uma liga na ESPN ──────────────────────────────────────────
async function fetchESPNLeague(slug, leagueName) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard`;
  const r = await fetch(url, {
    headers: { "User-Agent": "MotorIA/4.0" },
    signal:  AbortSignal.timeout(6000),
  });
  if (!r.ok) return [];
  const data = await r.json();
  return (data.events || []).map(ev => ({ ...ev, _leagueName: leagueName }));
}

// ── Normaliza evento ESPN → formato padrão MotorIA ──────────────────────────
function normalizeESPN(ev, now) {
  const comp = (ev.competitions || [])[0] || {};
  const competitors = comp.competitors || [];

  const home = competitors.find(c => c.homeAway === "home");
  const away = competitors.find(c => c.homeAway === "away");

  const homeTeam  = home?.team?.displayName || home?.team?.name || "—";
  const awayTeam  = away?.team?.displayName || away?.team?.name || "—";
  const homeScore = home?.score ?? null;
  const awayScore = away?.score ?? null;

  const dateStr    = comp.date || ev.date || null;
  const timestamp  = dateStr ? new Date(dateStr).getTime() : null;
  const { status, elapsed, timeBRT } = deriveStatusESPN(comp.status, timestamp, now);

  const hasScore = status !== "upcoming" &&
    homeScore !== null && awayScore !== null &&
    homeScore !== "" && awayScore !== "";

  return {
    id:        comp.id || ev.id || String(Math.random()),
    home:      homeTeam,
    away:      awayTeam,
    league:    ev._leagueName || ev.name || "",
    time:      timeBRT,
    timestamp,
    status,
    elapsed,
    scoreHome: hasScore ? Number(homeScore) : null,
    scoreAway: hasScore ? Number(awayScore) : null,
    round:     null,
    source:    "espn",
  };
}

// ── Deriva status a partir do objeto de status ESPN ──────────────────────────
function deriveStatusESPN(statusObj, timestamp, now) {
  const state = statusObj?.type?.state || "";      // "pre" | "in" | "post"
  const name  = statusObj?.type?.name  || "";      // "STATUS_SCHEDULED", "STATUS_IN_PROGRESS", "STATUS_FINAL", etc.
  const clock = statusObj?.displayClock || "";     // "45:00", "2nd Half", etc.

  // Converte timestamp UTC para horário BRT (UTC-3) para exibição
  let timeBRT = null;
  if (timestamp) {
    const d = new Date(timestamp);
    const brtH = String((d.getUTCHours() + 21) % 24).padStart(2, "0"); // UTC-3 = -3h mod 24
    const brtM = String(d.getUTCMinutes()).padStart(2, "0");
    timeBRT = `${brtH}:${brtM}`;
  }

  if (state === "post" || name.includes("FINAL") || name.includes("FT")) {
    return { status: "ended", elapsed: null, timeBRT };
  }

  if (state === "in" || name.includes("PROGRESS") || name.includes("HALFTIME") || name.includes("PAUSED")) {
    // Tenta extrair minutos do clock ("45:00" → 45)
    const mins = parseInt(clock, 10);
    const elapsed = !isNaN(mins) ? Math.min(90, mins) : null;
    return { status: "live", elapsed, timeBRT };
  }

  // "pre" ou desconhecido → agendado
  return { status: "upcoming", elapsed: null, timeBRT };
}
