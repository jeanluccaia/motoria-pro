import { useState, useEffect, useRef } from "react";
import { useNavigate } from "./router";
import { useAuth } from "./contexts/AuthContext";
import {
  loadBancaConfig, saveBancaConfig,
  loadEntries, addEntry, deleteEntry, clearEntries,
} from "./lib/bancaDb";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPOS = [
  "Resultado da partida",
  "Mais ou menos gols",
  "Ambos marcam",
  "Handicap",
  "Empate devolve",
  "Chance dupla",
  "Primeiro gol",
  "Escanteios",
  "Cartões",
  "Múltipla",
];

const TIPO_DESC = {
  "Resultado da partida": "Análise baseada no vencedor da partida.",
  "Mais ou menos gols":   "Análise baseada na quantidade total de gols.",
  "Ambos marcam":         "Análise baseada na possibilidade dos dois times marcarem.",
  "Handicap":             "Análise com vantagem ou desvantagem aplicada a um dos times.",
  "Empate devolve":       "Aposta é devolvida se a partida terminar empatada.",
  "Chance dupla":         "Cobre dois dos três resultados possíveis da partida.",
  "Primeiro gol":         "Análise baseada em qual time marca o primeiro gol.",
  "Escanteios":           "Análise baseada no número total de escanteios da partida.",
  "Cartões":              "Análise baseada no número de cartões durante a partida.",
  "Múltipla":             "Combinação de múltiplas apostas em um único bilhete.",
};

const CAMPEONATOS = [
  "Brasileirão", "Libertadores", "Champions", "Premier League",
  "La Liga", "Copa do Brasil", "Série B",
];

// Primary markets shown in the quick-flow market selection step
const MAIN_MARKETS = [
  { tipo: "Resultado da partida", ref: "1.85" },
  { tipo: "Mais ou menos gols",   ref: "1.90" },
  { tipo: "Ambos marcam",         ref: "1.95" },
  { tipo: "Handicap",             ref: "2.10" },
  { tipo: "Empate devolve",       ref: "1.65" },
  { tipo: "Chance dupla",         ref: "1.40" },
];

// Suggested reference odds by market — used as quick-fill hint when a game is selected
const SUGGESTED_ODDS = {
  "Resultado da partida": "1.85",
  "Mais ou menos gols":   "1.90",
  "Ambos marcam":         "1.95",
  "Handicap":             "2.10",
  "Empate devolve":       "1.65",
  "Chance dupla":         "1.40",
  "Primeiro gol":         "3.50",
  "Escanteios":           "1.90",
  "Cartões":              "1.85",
  "Múltipla":             "4.00",
};

const LOAD_STEPS = [
  { label: "Analisando odd informada",        pct: 16 },
  { label: "Calculando chance estimada",       pct: 32 },
  { label: "Medindo exposição da banca",       pct: 52 },
  { label: "Avaliando retorno esperado",       pct: 70 },
  { label: "Gerando leitura da IA",            pct: 86 },
  { label: "Compilando painel de análise",     pct: 96 },
];

const TOKEN_KEY      = "motoria_token";
const HISTORY_KEY    = "motoria_hist_v2";
const MAX_HISTORY    = 8;
const KIWIFY_URL     = "https://pay.kiwify.com.br/DIVD8zl";
const BANKROLL_KEY   = "motoria_bankroll_entries";
const BANKROLL_CFG   = "motoria_bankroll_cfg";

const BK_MERCADOS = [
  "Resultado da partida", "Mais ou menos gols", "Ambos marcam",
  "Handicap", "Empate devolve", "Chance dupla",
  "Primeiro gol", "Escanteios", "Cartões", "Múltipla",
];

// ─── Math helpers ─────────────────────────────────────────────────────────────

function calcImplicita(odd) { return (1 / odd) * 100; }
function calcVig(oddN) {
  if (oddN <= 1.4) return 4.0;
  if (oddN <= 1.7) return 4.8;
  if (oddN <= 2.2) return 5.5;
  if (oddN <= 3.0) return 6.5;
  return 8.0;
}
function calcEV(prob, oddN) {
  return (prob / 100) * (oddN - 1) * 100 - (1 - prob / 100) * 100;
}
function calcScore(oddN) {
  const impl  = calcImplicita(oddN);
  const score = Math.min(100, Math.round(100 - impl));
  let label, color, verdict;
  if (score <= 30)      { label = "BAIXO";    color = "#22C55E"; verdict = "FAVORÁVEL"; }
  else if (score <= 60) { label = "MODERADO"; color = "#F59E0B"; verdict = "NEUTRO"; }
  else if (score <= 80) { label = "ALTO";     color = "#F97316"; verdict = "DESFAVORÁVEL"; }
  else                  { label = "CRÍTICO";  color = "#EF4444"; verdict = "DESFAVORÁVEL"; }
  return { score, label, color, verdict };
}
function matchBlock(text, key) {
  const m  = text.match(new RegExp(`^${key}:[^\\n]*\\n([\\s\\S]*?)(?=\\n[A-Z_]{3,}:|$)`, "m"));
  const m2 = text.match(new RegExp(`^${key}:\\s*(.+)`, "m"));
  return (m ? m[1].trim() : null) || (m2 ? m2[1].trim() : null);
}
function parseAI(text) {
  return {
    riscoPrincipal:      matchBlock(text, "RISCO_PRINCIPAL"),
    cenarioNecessario:   matchBlock(text, "CENARIO_NECESSARIO"),
    oQuePodeDarErrado:   matchBlock(text, "O_QUE_PODE_DAR_ERRADO"),
    leituraConservadora: matchBlock(text, "LEITURA_CONSERVADORA"),
    alertaFinal:         matchBlock(text, "ALERTA_FINAL"),
  };
}
function parseAIJson(text) {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch {}
  return null;
}
function lookupTeam(name, data) {
  if (!data?.teams || !name) return null;
  if (data.teams[name]) return data.teams[name];
  const n = name.toLowerCase();
  const key = Object.keys(data.teams).find(k =>
    n.includes(k.toLowerCase()) || k.toLowerCase().includes(n)
  );
  return key ? data.teams[key] : null;
}
function lookupH2H(home, away, data) {
  if (!data?.h2h) return null;
  return data.h2h[`${home}-${away}`] || data.h2h[`${away}-${home}`] || null;
}
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}
function saveHistory(arr) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr)); } catch {}
}
function fmtClock(d) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function fmtTime() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function fmtDateBR() {
  return new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();
}
function mapLeague(league) {
  const l = (league || "").toLowerCase();
  if (l.includes("serie b") || l.includes("série b")) return "Série B";
  if (l.includes("brasileir") || (l.includes("brazil") && l.includes("serie a"))) return "Brasileirão";
  if (l.includes("libertad")) return "Libertadores";
  if (l.includes("champions")) return "Champions";
  if (l.includes("premier league")) return "Premier League";
  if (l.includes("la liga") || l.includes("laliga") || l.includes("primera division")) return "La Liga";
  if (l.includes("copa do brasil")) return "Copa do Brasil";
  if (l.includes("bundesliga")) return "Bundesliga";
  if (l.includes("ligue 1")) return "Ligue 1";
  return "";
}

// ─── Bankroll helpers ─────────────────────────────────────────────────────────

function loadBankroll() {
  try { return JSON.parse(localStorage.getItem(BANKROLL_KEY) || "[]"); }
  catch { return []; }
}
function saveBankroll(arr) {
  try { localStorage.setItem(BANKROLL_KEY, JSON.stringify(arr)); } catch {}
}
function loadBkCfg() {
  try { return JSON.parse(localStorage.getItem(BANKROLL_CFG) || "{}"); }
  catch { return {}; }
}
function saveBkCfg(cfg) {
  try { localStorage.setItem(BANKROLL_CFG, JSON.stringify(cfg)); } catch {}
}

function calcBkStats(entries, bancaInicial) {
  if (!bancaInicial || bancaInicial <= 0) return null;
  let saldo       = bancaInicial;
  let ganhos      = 0;
  let perdas      = 0;
  let wins        = 0;
  let losses      = 0;
  let streak      = 0;
  let maxStreak   = 0;
  let curStreak   = 0;
  let totalApos   = 0;

  const sorted = [...entries].sort((a, b) => a.ts - b.ts);

  for (const e of sorted) {
    if (e.resultado === "Anulada") continue;
    totalApos++;
    if (e.resultado === "Ganhou") {
      const lucro = parseFloat(e.valor) * (parseFloat(e.odd) - 1);
      saldo   += lucro;
      ganhos  += lucro;
      wins++;
      curStreak = curStreak > 0 ? curStreak + 1 : 1;
    } else {
      saldo   -= parseFloat(e.valor);
      perdas  += parseFloat(e.valor);
      losses++;
      curStreak = curStreak < 0 ? curStreak - 1 : -1;
    }
    if (curStreak < 0 && Math.abs(curStreak) > maxStreak) maxStreak = Math.abs(curStreak);
    streak = curStreak;
  }

  const lucroTotal  = ganhos - perdas;
  const roi         = totalApos > 0 ? (lucroTotal / (perdas + ganhos)) * 100 : 0;
  const acerto      = totalApos > 0 ? (wins / totalApos) * 100 : 0;

  return { saldo, lucroTotal, roi, acerto, wins, losses, totalApos, streak, maxStreak };
}

function getBkAlerts(entries, bancaInicial) {
  const alerts = [];
  if (!bancaInicial || bancaInicial <= 0 || entries.length === 0) return alerts;
  const last = entries[0]; // most recent
  const pctBanca = (parseFloat(last?.valor || 0) / bancaInicial) * 100;
  if (pctBanca > 10)  alerts.push({ type: "danger", msg: `Última entrada: ${pctBanca.toFixed(1)}% da banca — exposição acima do recomendado.` });
  else if (pctBanca >= 5) alerts.push({ type: "warn",   msg: `Última entrada: ${pctBanca.toFixed(1)}% da banca — atenção à gestão.` });

  const stats = calcBkStats(entries, bancaInicial);
  if (stats) {
    if (stats.streak <= -3) alerts.push({ type: "danger", msg: `Sequência de ${Math.abs(stats.streak)} derrotas seguidas — revise a estratégia.` });
    if (stats.lucroTotal < 0) alerts.push({ type: "warn",   msg: `Resultado acumulado negativo: R$ ${Math.abs(stats.lucroTotal).toFixed(2)} abaixo do investido.` });
  }
  return alerts;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconOverview = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="8" y="1.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="1.5" y="8" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="8" y="8" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);

const IconAnalyze = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 11L5 7.5L8 9.5L12 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="5" cy="7.5" r="1" fill="currentColor"/>
    <circle cx="8" cy="9.5" r="1" fill="currentColor"/>
    <circle cx="12" cy="3.5" r="1" fill="currentColor"/>
  </svg>
);

const IconCompare = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 10V6M5 10V4M8 10V7M11 10V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M1 12.5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".4"/>
  </svg>
);

const IconLive = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="2" fill="currentColor" fillOpacity=".9"/>
    <path d="M3.5 3.5a5 5 0 0 0 0 7M10.5 3.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IconStar = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 1.5l1.5 3.2L12 5.3l-2.5 2.4.6 3.4L7 9.5l-3.1 1.6.6-3.4L2 5.3l3.5-.6L7 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
);

const IconHistory = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M7 4.5V7L8.8 8.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IconConfig = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M7 1v2M7 11v2M1 7h2M11 7h2M3.22 3.22l1.41 1.41M9.37 9.37l1.41 1.41M3.22 10.78l1.41-1.41M9.37 4.63l1.41-1.41" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const IconJogos = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <rect x="1.5" y="3" width="11" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M1.5 6h11" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M4.5 1.5V4M9.5 1.5V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="4.5" cy="9" r=".9" fill="currentColor" opacity=".55"/>
    <circle cx="7" cy="9" r=".9" fill="currentColor" opacity=".55"/>
    <circle cx="9.5" cy="9" r=".9" fill="currentColor" opacity=".55"/>
  </svg>
);

const IconBanca = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <rect x="1.5" y="5" width="11" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M4 5V3.5a3 3 0 0 1 6 0V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="7" cy="9" r="1.2" fill="currentColor" opacity=".7"/>
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ label, value, color, sub, tm }) {
  return (
    <div className="ap-metric-card">
      <div className="ap-metric-val" style={{ color }}>{value}</div>
      <div className="ap-metric-label">{label}{tm && <span className="ap-tm">™</span>}</div>
      {sub && <div className="ap-metric-sub">{sub}</div>}
    </div>
  );
}

function ModuleCard({ mod, title, children }) {
  if (!children) return null;
  return (
    <div className="ap-ai-card">
      <div className="ap-ai-card-mod">{mod}</div>
      <div className="ap-ai-card-title">{title}</div>
      <p className="ap-ai-card-text">{children}</p>
    </div>
  );
}

function ComingSoon({ mod, title, desc }) {
  return (
    <div className="ap-content">
      <div className="ap-panel-hdr">
        <div className="ap-panel-hdr-left">
          <div className="ap-panel-mod">{mod}</div>
          <div className="ap-panel-title">{title}</div>
        </div>
      </div>
      <div className="ap-coming-panel">
        <div className="ap-coming-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="1.5" y="1.5" width="19" height="19" rx="5" stroke="rgba(255,255,255,.1)" strokeWidth="1.5"/>
            <path d="M8 11h6M11 8v6" stroke="rgba(255,255,255,.15)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="ap-coming-desc">{desc}</p>
        <div className="ap-coming-tag">Em desenvolvimento · Próxima versão</div>
      </div>
    </div>
  );
}

// ─── Dashboard helpers ────────────────────────────────────────────────────────

function getRiscoFrase(score) {
  if (score <= 30) return "Exposição dentro do esperado.";
  if (score <= 55) return "Cenário exige atenção. Revise antes de confirmar.";
  if (score <= 75) return "Risco acima do ideal. Melhor rever o valor.";
  return "Exposição muito alta. Cautela recomendada.";
}

function deriveLeituraIA(score) {
  if (score <= 30) return { text: "Cenário equilibrado",  color: "#22C55E", sub: "Exposição dentro do esperado para o perfil." };
  if (score <= 55) return { text: "Ok com cautela",       color: "#F59E0B", sub: "Revise o valor apostado antes de confirmar." };
  if (score <= 75) return { text: "Risco elevado",        color: "#F97316", sub: "Cenário menos favorável. Exposição acima do ideal." };
  return             { text: "Exposição agressiva",  color: "#EF4444", sub: "Risco alto. Melhor revisar banca e odd." };
}

function deriveBullets(r) {
  const bullets = [];
  if (r.ai?.riscoPrincipal)      bullets.push(r.ai.riscoPrincipal);
  if (r.ai?.cenarioNecessario)   bullets.push(r.ai.cenarioNecessario);
  if (r.ai?.leituraConservadora) bullets.push(r.ai.leituraConservadora);
  if (parseFloat(r.ev) < -5)    bullets.push(`Retorno esperado negativo: R$ ${r.ev} por R$ 100 apostados.`);
  if (r.ai?.alertaFinal && bullets.length < 4) bullets.push(r.ai.alertaFinal);
  return bullets.slice(0, 5);
}

// ─── CustomSelect ─────────────────────────────────────────────────────────────

function CustomSelect({ id, options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    function onOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onOutside);
    };
  }, [open]);

  return (
    <div className="sel-wrap" ref={wrapRef}>
      <button
        id={id}
        type="button"
        className={`sel-trigger${open ? " sel-trigger-open" : ""}`}
        onClick={() => setOpen(s => !s)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`sel-val${placeholder && !options.includes(value) ? " sel-placeholder" : ""}`}>
          {placeholder && !options.includes(value) ? placeholder : value}
        </span>
        <span className={`sel-chev${open ? " sel-chev-up" : ""}`} aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      {open && (
        <ul className="sel-list" role="listbox" aria-label={placeholder || "Opções"}>
          {placeholder && (
            <li
              role="option"
              aria-selected={!options.includes(value)}
              className={`sel-opt${!options.includes(value) ? " sel-opt-on" : ""}`}
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(""); setOpen(false); }}
            >
              <span className="sel-check" aria-hidden="true">
                {!options.includes(value) && (
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className="sel-opt-text sel-opt-dim">{placeholder}</span>
            </li>
          )}
          {options.map(opt => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={`sel-opt${opt === value ? " sel-opt-on" : ""}`}
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              <span className="sel-check" aria-hidden="true">
                {opt === value && (
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className="sel-opt-text">{opt}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── AppDashboard ─────────────────────────────────────────────────────────────

export default function AppDashboard() {
  const { session, isPaid, authLoading } = useAuth();

  // Route guard: redirect unauthenticated or unpaid users
  useEffect(() => {
    if (authLoading) return;
    const hasUuidToken = !!(localStorage.getItem("motoria_token") && localStorage.getItem("motoria_token").length > 10);
    if (!session && !hasUuidToken) {
      window.location.replace("/login");
    }
  }, [session, isPaid, authLoading]);

  useEffect(() => {
    const prev = document.title;
    document.title = "MotorIA Risk Engine™";
    return () => { document.title = prev; };
  }, []);

  // Live clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-leitura de token via URL ?t=<uuid>
  const [accessBanner, setAccessBanner] = useState(false);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("t") || params.get("token");
      if (urlToken && urlToken.length > 10) {
        localStorage.setItem(TOKEN_KEY, urlToken);
        setToken(urlToken);
        setAccessBanner(true);
        window.history.replaceState(null, "", window.location.pathname);
        const t = setTimeout(() => setAccessBanner(false), 4200);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view,        setView]        = useState("jogos"); // jogos is the primary entry point
  const [flowStep,    setFlowStep]    = useState("lista"); // "lista" | "mercado" | "resultado"
  function navigate(v) {
    setView(v);
    setSidebarOpen(false);
    if (v === "jogos") {
      setFlowStep("lista");
      setResult(null);
      setError("");
    }
  }

  // Form
  const [jogo,        setJogo]        = useState("");
  const [campeonato,  setCampeonato]  = useState("");
  const [tipo,        setTipo]        = useState("Resultado da partida");
  const [odd,         setOdd]         = useState("");
  const [valor,       setValor]       = useState("");
  const [obs,         setObs]         = useState("");

  // Engine
  const [loading,     setLoading]     = useState(false);
  const [loadStepIdx, setLoadStepIdx] = useState(0);
  const [loadPct,     setLoadPct]     = useState(0);
  const [error,       setError]       = useState("");
  const [result,      setResult]      = useState(null);

  // System
  const [history,    setHistory]    = useState(loadHistory);
  const [token,      setToken]      = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [credits,    setCredits]    = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const [copiedId,   setCopiedId]   = useState(null);

  // Jogos de Hoje
  const [matches,          setMatches]          = useState([]);
  const [matchesLoading,   setMatchesLoading]   = useState(false);
  const [matchesError,     setMatchesError]     = useState("");
  const [matchesSource,    setMatchesSource]    = useState(null);
  const [matchesUpdatedAt, setMatchesUpdatedAt] = useState(null);
  const [selectedGame,     setSelectedGame]     = useState(null);
  const [leagueFilter,     setLeagueFilter]     = useState("todos");

  // Controle de Banca
  const [bkEntries,      setBkEntries]      = useState(loadBankroll);
  const [bkCfg,          setBkCfg]          = useState(loadBkCfg);
  const [bkFormOpen,     setBkFormOpen]     = useState(false);
  const [bkFormExpanded, setBkFormExpanded] = useState(false);
  const [bkClearConfirm, setBkClearConfirm] = useState(false);
  const [bkForm,         setBkForm]         = useState({
    valor: "", odd: "", resultado: "Ganhou", mercado: "Resultado da partida", obs: "",
  });
  const [bkSetupVal,     setBkSetupVal]     = useState("");
  const [bkSyncing,      setBkSyncing]      = useState(false);

  // Sync bankroll from Supabase when user is authenticated
  useEffect(() => {
    if (!session?.user?.id) return;
    setBkSyncing(true);
    Promise.all([
      loadBancaConfig(session.user.id),
      loadEntries(session.user.id),
    ]).then(([cfg, entries]) => {
      if (cfg) {
        setBkCfg(cfg);
        saveBkCfg(cfg);
      }
      if (entries.length > 0) {
        setBkEntries(entries);
        saveBankroll(entries);
      }
    }).catch(() => {}).finally(() => setBkSyncing(false));
  }, [session?.user?.id]);

  // Team form / H2H data (static JSON)
  const [teamData,       setTeamData]       = useState(null);
  const [selectedMarket, setSelectedMarket] = useState(null); // { tipo, ref }
  const [marketOdd,      setMarketOdd]      = useState("");
  const [marketValor,    setMarketValor]    = useState("");

  useEffect(() => {
    fetch("/jogos-data.json").then(r => r.json()).then(setTeamData).catch(() => {});
  }, []);

  function loadMatches() {
    setMatchesLoading(true);
    setMatchesError("");
    setMatches([]);
    fetch("/api/matches")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        const games = Array.isArray(d.matches) ? d.matches : [];
        const src   = d.source || "unknown";
        console.log("[MotorIA] API games:", games);
        if (games.length === 0) {
          console.log("[MotorIA] No real games returned — source:", src);
        }
        setMatches(games);
        setMatchesSource(src);
        setMatchesUpdatedAt(d.updatedAt ? new Date(d.updatedAt) : new Date());
        setMatchesLoading(false);
      })
      .catch(err => {
        console.log("[MotorIA] API failed —", err.message || err);
        setMatchesError("network");
        setMatchesLoading(false);
      });
  }

  useEffect(() => {
    if (view !== "jogos") return;
    if (matches.length > 0 && !matchesError) return;
    loadMatches();
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const oddNum    = parseFloat((odd || "").replace(",", "."));
  const oddPreview = odd && !isNaN(oddNum) && oddNum >= 1.01 ? calcScore(oddNum) : null;

  // Computed stats for Visão Geral
  const avgScore = history.length
    ? Math.round(history.reduce((s, h) => s + (h.score || 0), 0) / history.length)
    : null;
  const lastItem = history[0] || null;

  // ── Core analysis engine — called by both form submit and quick flow ──────
  async function doAnalysis({ jogoVal, campVal, tipoVal, oddVal, valorVal }) {
    const oddN = parseFloat(String(oddVal).replace(",", "."));
    setLoading(true);
    setError("");
    setResult(null);
    setLoadStepIdx(0);
    setLoadPct(LOAD_STEPS[0].pct);

    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, LOAD_STEPS.length - 1);
      setLoadStepIdx(stepIdx);
      setLoadPct(LOAD_STEPS[stepIdx].pct);
    }, 820);

    try {
      // Build forma/H2H context from static data
      let formaCtx = "";
      if (teamData && jogoVal && jogoVal !== "Aposta") {
        const parts = jogoVal.split(" × ");
        if (parts.length === 2) {
          const homeTeam = lookupTeam(parts[0].trim(), teamData);
          const awayTeam = lookupTeam(parts[1].trim(), teamData);
          if (homeTeam) formaCtx += ` | ${parts[0].trim()} forma: ${homeTeam.forma.join("-")} GM:${homeTeam.gm} GS:${homeTeam.gs}`;
          if (awayTeam) formaCtx += ` | ${parts[1].trim()} forma: ${awayTeam.forma.join("-")} GM:${awayTeam.gm} GS:${awayTeam.gs}`;
          const h2h = lookupH2H(parts[0].trim(), parts[1].trim(), teamData);
          if (h2h) formaCtx += ` | H2H: H${h2h.h} D${h2h.d} A${h2h.a} méd.${h2h.mediaGols}gols`;
        }
      }

      const userMsg = `Jogo: ${jogoVal || "não informado"} | Campeonato: ${campVal || "não informado"} | Mercado: ${tipoVal} | Odd: ${oddVal}${valorVal ? ` | Valor: R$${valorVal}` : ""}${formaCtx}`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-motoria-token": token } : {}),
          ...(!token && session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ tool: "aposta", userMessage: userMsg }),
      });
      clearInterval(stepInterval);
      // 402 = créditos esgotados → locked card (não redireciona)
      if (res.status === 402) {
        setResult({ locked: true, signals: [] });
        setLoadPct(100);
        setTimeout(() => setLoading(false), 280);
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Erro ao processar análise.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.credits !== undefined) setCredits(data.credits);
      if (data.token) { localStorage.setItem(TOKEN_KEY, data.token); setToken(data.token); }
      // Sem token → API retorna locked: true sem chamar Anthropic
      // Efeito cinético: pausa em 75%, blur-in de 800ms, então exibe o paywall
      if (data.locked) {
        setLoadPct(75);
        await new Promise(r => setTimeout(r, 1500));
        setResult({ locked: true, signals: data.preview?.signals || [] });
        setLoadPct(100);
        setTimeout(() => setLoading(false), 280);
        return;
      }
      const rawText = data.content?.[0]?.text || "";

      const aiResult = parseAIJson(rawText);
      const impl     = calcImplicita(oddN);
      const vig      = calcVig(oddN);
      const justaRaw = impl / (1 - vig / 100);
      const justa    = Math.min(justaRaw, 99);
      const ev       = calcEV(impl, oddN);
      const scoreObj = calcScore(oddN);
      const exposure = Math.min(100, Math.round((100 - justa) * 1.1));
      const valorNum = parseFloat(valorVal) || 100;

      const r = {
        id: Math.floor(Math.random() * 8000) + 2000,
        ts: fmtTime(),
        jogo: jogoVal || "Aposta",
        tipo: tipoVal,
        odd:  oddN,
        impl:        impl.toFixed(2),
        justa:       justa.toFixed(2),
        vig:         vig.toFixed(2),
        ev:          ev.toFixed(2),
        perda:       (100 - impl).toFixed(1),
        exposure,
        valorAposta: valorNum,
        valorRisco:  ((valorNum * (100 - impl)) / 100).toFixed(2),
        ...scoreObj,
        ai:       parseAI(rawText),
        aiResult,
      };
      setResult(r);
      setAnalysisId(r.id);
      const newHist = [r, ...history].slice(0, MAX_HISTORY);
      setHistory(newHist);
      saveHistory(newHist);
      setLoadPct(100);
      setTimeout(() => setLoading(false), 280);
    } catch {
      clearInterval(stepInterval);
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  // Manual form submit (legacy / advanced flow)
  function handleSubmit(e) {
    e.preventDefault();
    const oddN = parseFloat((odd || "").replace(",", "."));
    if (!odd || isNaN(oddN) || oddN < 1.01) {
      setError("Informe uma odd válida (mínimo 1.01).");
      return;
    }
    doAnalysis({ jogoVal: jogo, campVal: campeonato, tipoVal: tipo, oddVal: odd, valorVal: valor });
  }

  // Quick-flow: market tapped → analyze immediately with reference (or custom) odd
  function quickAnalyze(tipoVal, oddStr, valorStr) {
    if (!tipoVal || !oddStr) return;
    const jogoVal = selectedGame ? `${selectedGame.home} × ${selectedGame.away}` : jogo;
    const campVal = selectedGame?.campeonato || campeonato;
    setTipo(tipoVal);
    setOdd(String(oddStr));
    setFlowStep("resultado");
    doAnalysis({ jogoVal, campVal, tipoVal, oddVal: String(oddStr), valorVal: valorStr || valor || "100" });
  }

  function loadFromHistory(item) { setResult(item); setJogo(item.jogo || ""); setOdd(String(item.odd)); setView("nova"); }

  function resetForm() {
    setResult(null); setError(""); setJogo(""); setOdd("");
    setValor(""); setObs(""); setCampeonato(""); setSelectedGame(null);
    setSelectedMarket(null); setMarketOdd(""); setMarketValor("");
    setFlowStep("lista");
  }

  function selectGame(match) {
    const camp = mapLeague(match.league);
    setJogo(`${match.home} × ${match.away}`);
    setCampeonato(camp);
    setSelectedGame({ ...match, campeonato: camp });
    setFlowStep("mercado"); // → market selection step (stays in jogos view)
  }

  // ── Bankroll handlers ─────────────────────────────────────────────────────
  function setupBanca() {
    const v = parseFloat(bkSetupVal.replace(",", "."));
    if (!v || v <= 0) return;
    const cfg = { bancaInicial: v };
    setBkCfg(cfg);
    saveBkCfg(cfg);
    setBkSetupVal("");
    if (session?.user?.id) saveBancaConfig(session.user.id, v).catch(() => {});
  }

  async function addBankrollEntry() {
    const valor = parseFloat(bkForm.valor.replace(",", "."));
    const odd   = parseFloat(bkForm.odd.replace(",", "."));
    if (!valor || valor <= 0 || !odd || odd < 1.01) return;
    const localEntry = {
      id:        Math.random().toString(36).slice(2),
      ts:        Date.now(),
      valor,
      odd,
      resultado: bkForm.resultado,
      mercado:   bkForm.mercado,
      obs:       bkForm.obs.trim(),
    };
    // Persist to Supabase if logged in; replace local id with DB id
    if (session?.user?.id) {
      try {
        const dbId = await addEntry(session.user.id, localEntry);
        localEntry.id = dbId;
      } catch (_) {}
    }
    const updated = [localEntry, ...bkEntries];
    setBkEntries(updated);
    saveBankroll(updated);
    setBkForm({ valor: "", odd: "", resultado: "Ganhou", mercado: "Resultado da partida", obs: "" });
    setBkFormOpen(false);
  }

  function deleteBankrollEntry(id) {
    const updated = bkEntries.filter(e => e.id !== id);
    setBkEntries(updated);
    saveBankroll(updated);
    if (session?.user?.id) deleteEntry(id).catch(() => {});
  }

  function clearBankroll() {
    setBkEntries([]);
    saveBankroll([]);
    setBkClearConfirm(false);
    if (session?.user?.id) clearEntries(session.user.id).catch(() => {});
  }

  // Shared result-card renderer — used in both quick flow and manual flow
  function renderResultCard(r) {
    const ai = r.aiResult;

    const STATUS_MAP = {
      "BOA ENTRADA":          { color: "#1DB954", icon: "✅" },
      "BOA, MAS COM CUIDADO": { color: "#8BC34A", icon: "⚠️" },
      "CUIDADO":              { color: "#F0B429", icon: "⚠️" },
      "ENTRADA FRACA":        { color: "#FF8C00", icon: "⚠️" },
      "DESFAVORÁVEL":         { color: "#E8641A", icon: "❌" },
      "RISCO ALTO":           { color: "#E53E3E", icon: "❌" },
      "NÃO COMPENSA":         { color: "#C0392B", icon: "❌" },
    };
    const status = ai?.status || "CUIDADO";
    const badge  = STATUS_MAP[status] || { color: "#FF8C00", icon: "⚠️" };
    const frase  = ai?.frase || "";

    const chanceGanhar = ai?.chance_ganhar != null
      ? `${Number(ai.chance_ganhar).toFixed(0)}%`
      : `${r.impl}%`;
    const oddIdeal = ai?.odd_ideal != null
      ? Number(ai.odd_ideal).toFixed(2)
      : r.justa;
    const vantagem = ai?.vantagem != null ? Number(ai.vantagem) : null;

    let valeAPena = null, valeColor = "#999", valeSubtext = "";
    if (vantagem != null) {
      if (vantagem > 5)        { valeAPena = "SIM";    valeColor = "#1DB954"; valeSubtext = "mercado favorável"; }
      else if (vantagem >= -5) { valeAPena = "TALVEZ"; valeColor = "#F0B429"; valeSubtext = "mercado neutro"; }
      else                     { valeAPena = "NÃO";    valeColor = "#E53E3E"; valeSubtext = "mercado desfavorável"; }
    }

    const airisco = ai?.valor_em_risco != null && Number(ai.valor_em_risco) > 0
      ? Number(ai.valor_em_risco)
      : parseFloat(r.valorRisco) || null;
    const valorEmRisco = airisco
      ? `R$ ${airisco.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "—";

    const bullets = ai?.bullets || [];
    const alerta  = ai?.alerta || r.ai?.alertaFinal || r.ai?.riscoPrincipal || "";
    const isCopied = copiedId === r.id;

    return (
      <div className="db-result-card">
        {/* Header: jogo + tipo + odd */}
        <div className="db-rc-header">
          <div className="db-rc-event">{r.jogo !== "Aposta" ? r.jogo : r.tipo}</div>
          <div className="db-rc-meta">
            {r.jogo !== "Aposta" && <span className="db-rc-badge">{r.tipo}</span>}
            <span className="db-rc-odd">Odd {r.odd.toFixed(2)}</span>
          </div>
        </div>

        <div className="db-rc-divider" />

        {/* 01 — Badge de status */}
        <div className="db-status-badge" style={{ background: `${badge.color}1A`, borderLeftColor: badge.color }}>
          <span className="db-status-icon" aria-hidden="true">{badge.icon}</span>
          <span className="db-status-text" style={{ color: badge.color }}>{status}</span>
        </div>

        {/* 02 — Frase humana */}
        {frase && <div className="db-frase">"{frase}"</div>}

        {/* 03 — Grid 2×2 de indicadores */}
        <div className="db-ind-grid">
          <div className="db-ind-card">
            <div className="db-ind-label">CHANCE DE GANHAR</div>
            <div className="db-ind-value">{chanceGanhar}</div>
          </div>
          <div className="db-ind-card">
            <div className="db-ind-label">ODD IDEAL</div>
            <div className="db-ind-value">{oddIdeal}</div>
            <div className="db-ind-micro">a odd que faria essa aposta equilibrada</div>
          </div>
          <div className="db-ind-card">
            <div className="db-ind-label">VALE A PENA?</div>
            {valeAPena ? (
              <>
                <div className="db-ind-value" style={{ color: valeColor }}>{valeAPena}</div>
                <div className="db-ind-micro">{valeSubtext}</div>
                {vantagem != null && (
                  <div className="db-ind-pct">{vantagem >= 0 ? `+${vantagem}%` : `${vantagem}%`}</div>
                )}
              </>
            ) : (
              <div className="db-ind-value" style={{ color: "var(--t3)" }}>—</div>
            )}
          </div>
          <div className="db-ind-card">
            <div className="db-ind-label">VALOR EM RISCO</div>
            <div className="db-ind-value" style={{ color: "#FF8C00" }}>{valorEmRisco}</div>
            <div className="db-ind-micro">com base no valor que você informou</div>
          </div>
        </div>

        {/* 04 — Por que esse cenário */}
        {bullets.length > 0 && (
          <div className="db-bullets-block">
            <div className="db-bullets-title">POR QUE ESSE CENÁRIO</div>
            {bullets.map((bullet, i) => (
              <div key={i} className="db-bullet-item">
                <span className="db-bullet-dot" aria-hidden="true">•</span>
                <span className="db-bullet-text">{bullet}</span>
              </div>
            ))}
          </div>
        )}

        {/* 05 — Alerta */}
        {alerta && (
          <div className="db-alerta-block" role="alert">
            <span className="db-alerta-icon" aria-hidden="true">⚠️</span>
            <p className="db-alerta-text">{alerta}</p>
          </div>
        )}

        {/* 06 — Rodapé */}
        <div className="db-rc-footer-divider" />
        <div className="db-rc-footer-row">
          <span className="db-rc-footer-note">
            Análise com odd de referência. Use a odd real da sua casa de apostas.
          </span>
          <button
            className={`db-copy-btn${isCopied ? " db-copy-btn-done" : ""}`}
            onClick={() => handleCopyResult(r)}
            type="button"
          >
            {isCopied ? "✓ Copiado!" : "📋 Copiar análise"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Locked card ─────────────────────────────────────────────────────────────
  // SEGURANÇA: o resultado real NUNCA foi gerado. A API retornou apenas sinais
  // parciais sem chamar Anthropic. Este card é display-only.
  function renderLockedCard(signals = []) {
    return (
      <div className="lk-wrap">
        <div className="lk-preview-card">

          {/* Blurred header */}
          <div className="lk-header">
            <div className="lk-header-event">█████████ × █████████</div>
            <div className="lk-header-meta">
              <span className="lk-badge-blur">████████</span>
              <span className="lk-odd-blur">Odd █.██</span>
            </div>
          </div>

          <div className="lk-divider" />

          {/* Blurred risk score */}
          <div className="lk-risk-row">
            <div>
              <span className="lk-section-label">RISCO DA APOSTA</span>
              <div className="lk-score-blur">██<span className="lk-score-denom">/100</span></div>
            </div>
            <div className="lk-level-blur">███████</div>
          </div>
          <div className="lk-bar-wrap">
            <div className="lk-bar-track"><div className="lk-bar-fill" /></div>
          </div>

          <div className="lk-divider" />

          {/* Sinais parciais — único conteúdo visível real */}
          <div className="lk-signals">
            <span className="lk-section-label">SINAIS DETECTADOS</span>
            {signals.map((s, i) => (
              <div key={i} className="lk-signal">
                <span className="lk-signal-dot" aria-hidden="true" />
                <span>{s}</span>
              </div>
            ))}
          </div>

          <div className="lk-divider" />

          {/* Blurred AI reading */}
          <div className="lk-ai-row">
            <span className="lk-section-label">LEITURA DA IA</span>
            <div className="lk-ai-blur">
              <span className="lk-ai-dot" aria-hidden="true" />
              <span>██████████████████</span>
            </div>
            <div className="lk-ai-text-blur">████████████████████████████████████</div>
          </div>

          {/* Gradient overlay + CTA */}
          <div className="lk-overlay">
            <div className="lk-lock-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <div className="lk-lock-title">Análise completa disponível com acesso</div>
            <div className="lk-lock-sub">Score real · Chance estimada · Leitura completa da IA</div>
            <a href={KIWIFY_URL} className="lk-cta-btn" target="_blank" rel="noopener noreferrer">
              Desbloquear análise completa
            </a>
            <div className="lk-price-note">Pagamento único · sem mensalidade · acesso imediato · R$ 27</div>
          </div>

        </div>
        <button className="lk-back" onClick={() => { setResult(null); setError(""); }} type="button">
          ← Tentar outra análise
        </button>
      </div>
    );
  }

  function handleCopyResult(r) {
    const ai = r.aiResult;
    const status = ai?.status || "—";
    const frase  = ai?.frase || "";
    const chanceGanhar = ai?.chance_ganhar != null ? `${Number(ai.chance_ganhar).toFixed(0)}%` : `${r.impl}%`;
    const oddIdeal = ai?.odd_ideal != null ? Number(ai.odd_ideal).toFixed(2) : r.justa;
    const vantagem = ai?.vantagem != null ? Number(ai.vantagem) : null;
    const valeAPena = vantagem != null ? (vantagem > 5 ? "SIM" : vantagem >= -5 ? "TALVEZ" : "NÃO") : "—";
    const alerta = ai?.alerta || r.ai?.alertaFinal || "";

    const text = [
      "🔍 MotorIA Pro — Análise de Aposta",
      "",
      r.jogo !== "Aposta" ? r.jogo : r.tipo,
      `Mercado: ${r.tipo}`,
      `Odd analisada: ${r.odd.toFixed(2)}`,
      "",
      `Status: ${status}`,
      frase,
      "",
      "📊 Números:",
      `• Chance de ganhar: ${chanceGanhar}`,
      `• Odd ideal: ${oddIdeal}`,
      `• Vale a pena? ${valeAPena}`,
      alerta ? "" : null,
      alerta ? `⚠️ ${alerta}` : null,
      "",
      "—",
      "Análise gerada pelo MotorIA Pro",
      "motoriaopro.com.br",
    ].filter(v => v !== null).join("\n");

    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(r.id);
    setTimeout(() => setCopiedId(cur => cur === r.id ? null : cur), 2000);
  }

  // ─── Sidebar nav structure ──────────────────────────────────────────────────
  const hasAccess = isPaid || !!(token && token.length > 10);

  const NAV = [
    {
      group: "ANÁLISE",
      items: [
        { id: "jogos",      label: "Jogos de Hoje",      Icon: IconJogos },
        { id: "nova",       label: "Análise Manual",      Icon: IconAnalyze, manual: true },
        { id: "geral",      label: "Visão Geral",         Icon: IconOverview },
        { id: "banca",      label: "Controle de Banca",   Icon: IconBanca },
        { id: "comparador", label: "Comparador",          Icon: IconCompare, dim: true },
      ],
    },
    {
      group: "MERCADOS",
      items: [
        { id: "aovivo",    label: "Ao Vivo",   Icon: IconLive, live: true, dim: true },
        { id: "favoritos", label: "Favoritos", Icon: IconStar, dim: true },
      ],
    },
    {
      group: "ARQUIVO",
      items: [
        { id: "historico", label: "Histórico", Icon: IconHistory, badge: history.length || null },
      ],
    },
    {
      group: "SISTEMA",
      items: [
        { id: "config", label: "Configurações", Icon: IconConfig },
      ],
    },
  ];

  return (
    <>
      <style>{CSS}</style>

      {sidebarOpen && (
        <div className="ap-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {accessBanner && (
        <div className="ap-access-banner" role="status" aria-live="polite">
          <span className="ap-access-banner-dot" aria-hidden="true" />
          Acesso ativado — plataforma pronta para uso
        </div>
      )}

      <div className="ap-shell">

        {/* ── TOPBAR ──────────────────────────────────────────────────────── */}
        <header className="ap-topbar">
          <div className="ap-topbar-row">
            <div className="ap-topbar-left">
              <button
                className="ap-hamburger"
                onClick={() => setSidebarOpen(s => !s)}
                aria-label="Menu"
                aria-expanded={sidebarOpen}
              >
                <span /><span /><span />
              </button>
              <div className="ap-topbar-brand">
                <div className="ap-logo-mark" aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="#060608"/>
                    <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="currentColor" fillOpacity=".95"/>
                  </svg>
                </div>
                <span className="ap-topbar-name">MotorIA</span>
                <span className="ap-topbar-sep" aria-hidden="true">·</span>
                <span className="ap-topbar-tag">Risk Engine™</span>
              </div>
            </div>

            <div className="ap-topbar-center">
              <span className="ap-topbar-clock">{fmtClock(now)}</span>
              {analysisId && <span className="ap-topbar-aid"> · #{analysisId}</span>}
            </div>

            <div className="ap-topbar-right">
              {credits !== null && (
                <div className="ap-credits-wrap" title="Créditos restantes">
                  <div className="ap-credits-bar">
                    <div className="ap-credits-fill" style={{ width: `${Math.max(0, (credits / 20) * 100)}%` }} />
                  </div>
                </div>
              )}
              <div className="ap-engine-live">
                <span className="ap-live-dot" aria-hidden="true" />
                <span className="ap-live-lbl">IA ONLINE</span>
              </div>
            </div>
          </div>
        </header>

        <div className="ap-body">

          {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
          <nav className={`ap-sidebar${sidebarOpen ? " ap-sidebar-open" : ""}`} aria-label="Navegação">

            {/* Brand mark dentro da sidebar */}
            <div className="ap-sidebar-brand">
              <div className="ap-sidebar-brand-mark" aria-hidden="true">
                <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="#22C55E"/>
                </svg>
              </div>
              <span className="ap-sidebar-brand-name">MotorIA Pro</span>
            </div>

            <div className="ap-sidebar-divider" role="separator" />

            {/* Nav groups */}
            {NAV.map(({ group, items }) => (
              <div className="ap-sidebar-group" key={group}>
                <div className="ap-sidebar-group-lbl">{group}</div>
                {items.map(({ id, label, Icon, badge, live, dim, manual }) => (
                  <button
                    key={id}
                    className={`ap-nav-item${view === id ? " ap-nav-active" : ""}${dim ? " ap-nav-dim" : ""}${manual ? " ap-nav-manual" : ""}`}
                    onClick={() => navigate(id)}
                    aria-current={view === id ? "page" : undefined}
                  >
                    <span className="ap-nav-icon"><Icon /></span>
                    <span className="ap-nav-label">{label}</span>
                    {live && <span className="ap-nav-live-dot" aria-label="ao vivo" />}
                    {badge > 0 && !live && (
                      <span className="ap-nav-badge" aria-label={`${badge} itens`}>{badge}</span>
                    )}
                    {dim && !live && (
                      <span className="ap-nav-soon" aria-label="em breve">
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                          <path d="M5 2v3.5M5 7v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                          <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" opacity=".5"/>
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}

            {/* Engine status */}
            <div className="ap-sidebar-engine">
              <div className="ap-sidebar-engine-dot" aria-hidden="true" />
              <div className="ap-sidebar-engine-info">
                <span className="ap-sidebar-engine-name">RISK ENGINE v2.4</span>
                <span className="ap-sidebar-engine-status">ONLINE</span>
              </div>
            </div>
          </nav>

          {/* ── MAIN ────────────────────────────────────────────────────── */}
          <main className="ap-main">

            {/* ════ VISÃO GERAL ═════════════════════════════════════════ */}
            {view === "geral" && (
              <div className="ap-content" key="geral">
                <div className="ap-panel-hdr">
                  <div className="ap-panel-hdr-left">
                    <div className="ap-panel-mod">MÓDULO I</div>
                    <div className="ap-panel-title">Visão Geral</div>
                  </div>
                  <div className="ap-panel-online">
                    <span className="ap-status-dot" aria-hidden="true" />
                    SISTEMA ONLINE
                  </div>
                </div>

                {/* Stat row */}
                <div className="ap-geral-stats">
                  <div className="ap-geral-stat">
                    <div className="ap-geral-stat-val">{history.length}</div>
                    <div className="ap-geral-stat-lbl">ANÁLISES</div>
                  </div>
                  <div className="ap-geral-stat">
                    <div className="ap-geral-stat-val" style={{ color: avgScore !== null ? (avgScore > 60 ? "#EF4444" : avgScore > 40 ? "#F59E0B" : "#22C55E") : "var(--t3)" }}>
                      {avgScore !== null ? avgScore : "—"}
                    </div>
                    <div className="ap-geral-stat-lbl">SCORE MÉDIO</div>
                  </div>
                  <div className="ap-geral-stat">
                    <div className="ap-geral-stat-val">{lastItem ? lastItem.odd.toFixed(2) : "—"}</div>
                    <div className="ap-geral-stat-lbl">ÚLTIMA ODD</div>
                  </div>
                  <div className="ap-geral-stat">
                    <div className="ap-geral-stat-val ap-geral-stat-val-sm">v2.4</div>
                    <div className="ap-geral-stat-lbl">ENGINE</div>
                  </div>
                </div>

                {/* Quick action */}
                <div className="ap-geral-action">
                  <div className="ap-geral-action-left">
                    <div className="ap-geral-action-title">Iniciar nova análise quantitativa</div>
                    <div className="ap-geral-action-sub">MOTORIA RISK INDEX™ · Probabilidade · EV · Exposição</div>
                  </div>
                  <button className="ap-geral-btn" onClick={() => navigate("nova")}>
                    Analisar
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* Recent mini list */}
                {history.length > 0 && (
                  <div className="ap-geral-recent">
                    <div className="ap-geral-recent-hdr">ANÁLISES RECENTES</div>
                    <div className="ap-geral-recent-list">
                      {history.slice(0, 4).map((item, i) => (
                        <button key={i} className="ap-geral-recent-row" onClick={() => loadFromHistory(item)}>
                          <span className="ap-geral-recent-id">#{item.id}</span>
                          <span className="ap-geral-recent-event">{item.jogo || "Aposta"}</span>
                          <span className="ap-geral-recent-odd">Odd {item.odd}</span>
                          <div className="ap-geral-recent-bar">
                            <div style={{ width: `${item.score}%`, background: item.color, height: "100%", borderRadius: 99 }} />
                          </div>
                          <span className="ap-geral-recent-score" style={{ color: item.color }}>{item.score}</span>
                          <span className="ap-geral-recent-tag" style={{ color: item.color }}>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {history.length === 0 && (
                  <div className="ap-geral-empty">
                    <p>Nenhuma análise registrada ainda.</p>
                    <button className="ap-geral-btn" onClick={() => navigate("nova")}>Iniciar primeira análise →</button>
                  </div>
                )}
              </div>
            )}

            {/* ════ NOVA ANÁLISE ════════════════════════════════════════ */}
            {view === "nova" && (
              <div className="ap-content ap-content-nova" key="nova">

                {selectedGame && !result && !loading && (
                  <div className={`ap-game-strip${selectedGame.status === "live" ? " ap-game-strip-live" : ""}`}>
                    <span className={`ap-game-strip-dot${selectedGame.status === "live" ? " ap-gsd-live" : ""}`} aria-hidden="true" />
                    <span className="ap-game-strip-text">{selectedGame.home} × {selectedGame.away}</span>
                    {selectedGame.campeonato && (
                      <span className="ap-game-strip-league">{selectedGame.campeonato}</span>
                    )}
                    {selectedGame.status === "live" ? (
                      <span className="ap-gsd-live-badge">
                        AO VIVO{selectedGame.elapsed ? ` · ${selectedGame.elapsed}'` : ""}
                      </span>
                    ) : selectedGame.time ? (
                      <span className="ap-game-strip-time">{selectedGame.time}</span>
                    ) : null}
                    <button
                      className="ap-game-strip-clear"
                      onClick={() => { setSelectedGame(null); setJogo(""); setCampeonato(""); }}
                      aria-label="Remover jogo selecionado"
                      type="button"
                    >×</button>
                  </div>
                )}

                {!result && !loading && (
                  <section className="ap-input-panel">
                    <form className="ap-form" onSubmit={handleSubmit} noValidate>

                      {/* ── Campos principais ──────────────────────────── */}
                      <div className="ap-row-2">
                        <div className="ap-field">
                          <label className="ap-label" htmlFor="odd-input">ODD</label>
                          <input
                            id="odd-input"
                            className="ap-input ap-input-odd"
                            type="text"
                            placeholder="2.80"
                            value={odd}
                            onChange={e => setOdd(e.target.value)}
                            inputMode="decimal"
                            autoComplete="off"
                          />
                          {oddPreview && (
                            <div className="ap-odd-preview" style={{ color: oddPreview.color }}>
                              <span>{oddPreview.label}</span>
                              <span className="ap-odd-preview-sep">·</span>
                              <span>chance {calcImplicita(oddNum).toFixed(0)}%</span>
                            </div>
                          )}
                        </div>
                        <div className="ap-field">
                          <label className="ap-label" htmlFor="valor-input">QUANTO VAI APOSTAR?</label>
                          <input
                            id="valor-input"
                            className="ap-input"
                            type="text"
                            placeholder="R$ 100"
                            value={valor}
                            onChange={e => setValor(e.target.value)}
                            inputMode="decimal"
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      <div className="ap-field">
                        <label className="ap-label" htmlFor="tipo-input">TIPO DE APOSTA</label>
                        <CustomSelect id="tipo-input" options={TIPOS} value={tipo} onChange={setTipo} />
                      </div>

                      {/* Odd sugestiva — shown when game is selected + odd not filled */}
                      {selectedGame && SUGGESTED_ODDS[tipo] && !odd && (
                        <div className="ap-odd-sug">
                          <span className="ap-odd-sug-icon" aria-hidden="true">💡</span>
                          <span className="ap-odd-sug-text">
                            Odd referência para <em>{tipo}</em>:{" "}
                            <strong>{SUGGESTED_ODDS[tipo]}</strong>
                          </span>
                          <button
                            type="button"
                            className="ap-odd-sug-btn"
                            onClick={() => setOdd(SUGGESTED_ODDS[tipo])}
                          >
                            Usar
                          </button>
                        </div>
                      )}

                      {/* ── Campos secundários ─────────────────────────── */}
                      <div className="ap-row-2 ap-row-secondary">
                        <div className="ap-field">
                          <label className="ap-label ap-label-dim" htmlFor="camp-input">CAMPEONATO</label>
                          <CustomSelect
                            id="camp-input"
                            options={CAMPEONATOS}
                            value={campeonato}
                            onChange={setCampeonato}
                            placeholder="Selecionar"
                          />
                        </div>
                        <div className="ap-field">
                          <label className="ap-label ap-label-dim" htmlFor="jogo-input">PARTIDA</label>
                          <input
                            id="jogo-input"
                            className="ap-input"
                            type="text"
                            placeholder="Ex: Flamengo × Palmeiras"
                            value={jogo}
                            onChange={e => setJogo(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      {error && <div className="ap-error" role="alert">{error}</div>}
                      <button className="ap-submit" type="submit">
                        INICIAR ANÁLISE →
                      </button>
                    </form>
                  </section>
                )}

                {/* Loading */}
                {loading && (
                  <div className="ap-loading" role="status" aria-live="polite">
                    {/* Engine header */}
                    <div className="ap-loading-hdr">
                      <div>
                        <div className="ap-loading-engine">
                          RISK ENGINE v2.4
                          <span className="ap-loading-engine-dot" aria-hidden="true" />
                        </div>
                        {selectedGame ? (
                          <div className="ap-loading-sub ap-loading-sub-game">
                            {selectedGame.home} × {selectedGame.away}
                          </div>
                        ) : (
                          <div className="ap-loading-sub">Processamento quantitativo em execução</div>
                        )}
                      </div>
                      <span className="ap-loading-status">CALCULANDO</span>
                    </div>

                    {/* Progress bar */}
                    <div className="ap-loading-bar-wrap">
                      <div className="ap-loading-bar" style={{ width: `${loadPct}%` }} />
                      <div className="ap-loading-bar-glow" style={{ left: `${loadPct}%` }} />
                    </div>

                    {/* Large percentage */}
                    <div className="ap-loading-pct" aria-label={`${loadPct}%`}>
                      {loadPct}<span className="ap-loading-pct-sym">%</span>
                    </div>

                    {/* Steps list */}
                    <div className="ap-loading-steps">
                      {LOAD_STEPS.map((s, i) => (
                        <div key={i} className={`ap-lstep${i < loadStepIdx ? " ap-lstep-done" : i === loadStepIdx ? " ap-lstep-active" : ""}`}>
                          <span className="ap-lstep-icon" aria-hidden="true">
                            {i < loadStepIdx ? "✓" : i === loadStepIdx ? "▶" : "○"}
                          </span>
                          <span className="ap-lstep-lbl">{s.label}</span>
                          {i === loadStepIdx && (
                            <span className="ap-lstep-cursor" aria-hidden="true">_</span>
                          )}
                          {i < loadStepIdx && <span className="ap-lstep-done-tag">OK</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Output — locked */}
                {result && !loading && result.locked && renderLockedCard(result.signals || [])}

                {/* Output — completo */}
                {result && !loading && !result.locked && (
                  <div className="db-output" role="region" aria-label="Resultado da análise">
                    <div className="db-topbar">
                      <div className="db-topbar-meta">
                        <span className="db-id">#{result.id}</span>
                        <span className="db-sep" aria-hidden="true">·</span>
                        <span className="db-ts">{result.ts}</span>
                        <span className="db-sep" aria-hidden="true">·</span>
                        <span className="db-ai-badge">
                          <span className="db-ai-dot" aria-hidden="true" />
                          IA ativa
                        </span>
                      </div>
                      <button className="db-btn-ghost" onClick={resetForm} aria-label="Nova análise">
                        Nova análise →
                      </button>
                    </div>

                    {renderResultCard(result)}

                    <p className="db-disclaimer">
                      Análise educativa. Não representa garantia de resultado. A decisão é sua.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ════ PLACEHOLDERS ════════════════════════════════════════ */}
            {view === "comparador" && (
              <ComingSoon
                mod="MÓDULO III"
                title="Comparador de Odds"
                desc="Compare múltiplas odds simultaneamente e identifique distorções entre casas de apostas. O Comparador cruza probabilidades implícitas em tempo real."
              />
            )}
            {view === "aovivo" && (
              <ComingSoon
                mod="MERCADOS"
                title="Ao Vivo"
                desc="Feed de análises em tempo real com atualizações automáticas de probabilidade para eventos em andamento. Integração com dados de mercado ao vivo."
              />
            )}
            {view === "favoritos" && (
              <ComingSoon
                mod="ARQUIVO"
                title="Favoritos"
                desc="Salve e organize suas análises mais relevantes. Crie coleções por campeonato, mercado ou período para consulta rápida."
              />
            )}

            {/* ════ JOGOS DE HOJE — 3-step primary flow ═══════════════════ */}
            {view === "jogos" && (
              <div className="ap-content ap-content-flow" key={`jogos-${flowStep}`}>

                {/* ══ STEP 1: LISTA ══════════════════════════════════════════ */}
                {flowStep === "lista" && (
                  <div className="fl-step">

                    {/* Panel header */}
                    <div className="ap-panel-hdr">
                      <div className="ap-panel-hdr-left">
                        <div className="ap-panel-mod">ANÁLISE ESPORTIVA</div>
                        <div className="ap-panel-title">Jogos de Hoje</div>
                      </div>
                      <div className="jg-hdr-right">
                        <div className="jg-data-badge">
                          <span className="jg-data-dot" aria-hidden="true" />
                          DADOS ESPORTIVOS
                        </div>
                        {matchesUpdatedAt && (
                          <span className="jg-updated">
                            {matchesUpdatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        <button className="jg-refresh-btn" onClick={loadMatches} disabled={matchesLoading} title="Atualizar" type="button" aria-label="Atualizar partidas">
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M12 7A5 5 0 1 1 7 2M12 7V2.5M12 2.5H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {matchesLoading && (
                      <div className="jg-loading">
                        <span className="jg-dot" /><span className="jg-dot" /><span className="jg-dot" />
                        <span className="jg-loading-lbl">Atualizando jogos reais…</span>
                      </div>
                    )}
                    {matchesError && !matchesLoading && (
                      <div className="ap-geral-empty" role="alert">
                        <div className="jg-empty-icon" aria-hidden="true">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.4"/>
                            <path d="M12 7v5.5M12 15.5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <p className="jg-empty-title">Não conseguimos atualizar os jogos.</p>
                        <p className="jg-empty-sub">Você pode tentar novamente ou fazer uma análise manual.</p>
                        <div className="jg-empty-actions">
                          <button className="jg-retry-btn" onClick={loadMatches} type="button">Tentar novamente</button>
                          <button className="ap-geral-btn" onClick={() => navigate("nova")} type="button">Analisar manualmente</button>
                        </div>
                      </div>
                    )}
                    {!matchesLoading && matches.length === 0 && !matchesError && (
                      <div className="ap-geral-empty">
                        <div className="jg-empty-icon" aria-hidden="true">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.4"/>
                            <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            <path d="M7.5 14h9M7.5 17.5h5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <p className="jg-empty-title">Nenhum jogo real encontrado agora.</p>
                        <p className="jg-empty-sub">Os jogos aparecem aqui quando a API retorna partidas disponíveis para hoje.</p>
                        <button className="ap-geral-btn" onClick={() => navigate("nova")} type="button">Analisar manualmente →</button>
                      </div>
                    )}

                    {!matchesLoading && matches.length > 0 && (() => {
                      const liveCount = matches.filter(m => m.status === "live").length;
                      const leagues   = [...new Set(matches.map(m => mapLeague(m.league)).filter(Boolean))];
                      const allPills  = ["todos", ...(liveCount > 0 ? ["live"] : []), ...leagues];
                      const filtered  = leagueFilter === "todos" ? matches
                        : leagueFilter === "live" ? matches.filter(m => m.status === "live")
                        : matches.filter(m => mapLeague(m.league) === leagueFilter);
                      return (
                        <>
                          <div className="jg-filters">
                            {allPills.map(f => (
                              <button
                                key={f}
                                className={["jg-pill", leagueFilter === f ? "jg-pill-on" : "", f === "live" ? "jg-pill-live" : ""].join(" ").trim()}
                                onClick={() => setLeagueFilter(f)}
                                type="button"
                              >
                                {f === "todos" ? "Todos" : f === "live"
                                  ? <><span className="jg-pill-dot" aria-hidden="true" />Ao Vivo ({liveCount})</>
                                  : f}
                              </button>
                            ))}
                          </div>
                          <div className="jg-grid">
                            {filtered.map((m, idx) => {
                              const hasScore = m.scoreHome !== null && m.scoreAway !== null;
                              return (
                                <button
                                  key={m.id || idx}
                                  className={`jg-card jg-card-${m.status}`}
                                  onClick={() => selectGame(m)}
                                  type="button"
                                  style={{ animationDelay: `${Math.min(idx, 6) * 40}ms` }}
                                >
                                  <div className="jg-card-header">
                                    <span className="jg-league">{mapLeague(m.league) || m.league}</span>
                                    {m.status === "upcoming" && m.time && <span className="jg-time">{m.time}</span>}
                                  </div>
                                  {m.status === "live" && (
                                    <div className="jg-status-row">
                                      <span className="jg-live-dot" aria-hidden="true" />
                                      <span className="jg-status-live-text">AO VIVO</span>
                                      {m.elapsed != null && <span className="jg-elapsed">{m.elapsed}'</span>}
                                    </div>
                                  )}
                                  {m.status === "ended" && (
                                    <div className="jg-status-row">
                                      <span className="jg-status-ended-text">ENCERRADO</span>
                                    </div>
                                  )}
                                  <div className="jg-matchup">
                                    <span className="jg-team-name">{m.home}</span>
                                    <div className="jg-score-center">
                                      {hasScore
                                        ? <span className="jg-score-pair"><span className="jg-score-num">{m.scoreHome}</span><span className="jg-score-dash">—</span><span className="jg-score-num">{m.scoreAway}</span></span>
                                        : <span className="jg-vs">×</span>}
                                    </div>
                                    <span className="jg-team-name jg-team-right">{m.away}</span>
                                  </div>
                                  {teamData && (() => {
                                    const homeT = lookupTeam(m.home, teamData);
                                    const awayT = lookupTeam(m.away, teamData);
                                    if (!homeT && !awayT) return null;
                                    const dotColor = r => r === "W" ? "#22C55E" : r === "D" ? "#F59E0B" : "#EF4444";
                                    return (
                                      <div className="jg-forma-row">
                                        <div className="jg-forma-side">
                                          {(homeT?.forma || []).map((r, i) => (
                                            <span key={i} className="jg-forma-dot" style={{ background: dotColor(r) }} title={r} />
                                          ))}
                                        </div>
                                        <div className="jg-forma-mid" />
                                        <div className="jg-forma-side jg-forma-side-r">
                                          {(awayT?.forma || []).map((r, i) => (
                                            <span key={i} className="jg-forma-dot" style={{ background: dotColor(r) }} title={r} />
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                  <div className="jg-card-footer">
                                    <span className="jg-cta">Vale apostar? →</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <div className="jg-disclaimer" role="note">
                            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                              <path d="M7 6.5v3.5M7 4.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            </svg>
                            Ferramenta educativa. Dados de partidas para contexto de análise de risco. Não é recomendação de aposta.
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* ══ STEP 2: MERCADO ════════════════════════════════════════ */}
                {flowStep === "mercado" && selectedGame && (
                  <div className="fl-step">

                    {/* Back */}
                    <button className="fl-back-btn" onClick={() => { setSelectedGame(null); setFlowStep("lista"); }} type="button">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Mudar partida
                    </button>

                    {/* Game hero */}
                    <div className={`fl-game-hero${selectedGame.status === "live" ? " fl-game-hero-live" : ""}`}>
                      <div className="fl-hero-meta">
                        <span className="fl-hero-league">{selectedGame.campeonato}</span>
                        {selectedGame.status === "live" ? (
                          <div className="fl-hero-status-live">
                            <span className="fl-hero-live-dot" aria-hidden="true" />
                            AO VIVO{selectedGame.elapsed ? ` · ${selectedGame.elapsed}'` : ""}
                          </div>
                        ) : selectedGame.time ? (
                          <span className="fl-hero-time">{selectedGame.time}</span>
                        ) : null}
                      </div>
                      <div className="fl-teams">
                        <span className="fl-team">{selectedGame.home}</span>
                        <span className="fl-vs">×</span>
                        <span className="fl-team fl-team-right">{selectedGame.away}</span>
                      </div>
                    </div>

                    {/* Market grid — inline editable odds */}
                    <div className="fl-section-hdr">ESCOLHA O MERCADO</div>
                    <div className="fl-market-list">
                      {MAIN_MARKETS.map(m => {
                        const isOpen = selectedMarket?.tipo === m.tipo;
                        return (
                          <div key={m.tipo} className={`fl-mcard${isOpen ? " fl-mcard-open" : ""}`}>
                            <button
                              className="fl-mcard-hdr"
                              onClick={() => {
                                if (isOpen) { setSelectedMarket(null); setMarketOdd(""); setMarketValor(""); }
                                else { setSelectedMarket(m); setMarketOdd(m.ref); setMarketValor(""); }
                              }}
                              type="button"
                            >
                              <span className="fl-mcard-name">{m.tipo}</span>
                              <span className="fl-mcard-ref">Ref. {m.ref}</span>
                              <svg className="fl-mcard-chev" width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ transform: isOpen ? "rotate(180deg)" : "none" }}>
                                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            {isOpen && (() => {
                              const bancaIni = parseFloat(bkCfg?.bancaInicial) || 0;
                              const vNum     = parseFloat(marketValor);
                              const pctBanca = bancaIni > 0 && vNum > 0 ? ((vNum / bancaIni) * 100).toFixed(1) : null;
                              return (
                                <div className="fl-mcard-body">
                                  <div className="fl-mcard-fields">
                                    <div className="fl-mcard-field-wrap">
                                      <span className="fl-mcard-odd-lbl">Odd</span>
                                      <input
                                        className="fl-mcard-odd-input"
                                        type="text"
                                        value={marketOdd}
                                        onChange={e => setMarketOdd(e.target.value)}
                                        placeholder={m.ref}
                                        inputMode="decimal"
                                        autoComplete="off"
                                        autoFocus
                                        aria-label="Informe a odd"
                                      />
                                    </div>
                                    <div className="fl-mcard-field-wrap">
                                      <span className="fl-mcard-odd-lbl">Valor R$</span>
                                      <input
                                        className="fl-mcard-odd-input"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={marketValor}
                                        onChange={e => setMarketValor(e.target.value)}
                                        placeholder={bancaIni > 0 ? (bancaIni * 0.05).toFixed(0) : "50"}
                                        inputMode="decimal"
                                        autoComplete="off"
                                        aria-label="Valor apostado"
                                      />
                                    </div>
                                  </div>
                                  {pctBanca !== null && (
                                    <div className="fl-mcard-banca-hint">
                                      {pctBanca}% da banca · {parseFloat(marketValor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </div>
                                  )}
                                  {bancaIni === 0 && (
                                    <div className="fl-mcard-banca-hint fl-mcard-banca-setup">
                                      Configure sua banca em Controle de Banca para ver a exposição
                                    </div>
                                  )}
                                  <button
                                    className="fl-mcard-confirm"
                                    onClick={() => quickAnalyze(m.tipo, marketOdd || m.ref, marketValor)}
                                    type="button"
                                  >
                                    Analisar →
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>

                    {/* Link to full manual form */}
                    <button className="fl-manual-link" onClick={() => navigate("nova")} type="button">
                      Abrir análise manual completa →
                    </button>
                  </div>
                )}

                {/* ══ STEP 3: RESULTADO (loading + result) ═══════════════════ */}
                {flowStep === "resultado" && (
                  <div className="fl-step">

                    {/* Context strip */}
                    {selectedGame && (
                      <div className={`fl-ctx-strip${selectedGame.status === "live" ? " fl-ctx-live" : ""}`}>
                        <span className="fl-ctx-dot" aria-hidden="true" />
                        <span className="fl-ctx-match">{selectedGame.home} × {selectedGame.away}</span>
                        <span className="fl-ctx-sep" aria-hidden="true">·</span>
                        <span className="fl-ctx-tipo">{tipo}</span>
                        {selectedGame.status === "live" && (
                          <span className="fl-ctx-live-badge">AO VIVO</span>
                        )}
                      </div>
                    )}

                    {/* Loading */}
                    {loading && (
                      <div className="ap-loading" role="status" aria-live="polite">
                        <div className="ap-loading-hdr">
                          <div>
                            <div className="ap-loading-engine">
                              RISK ENGINE v2.4
                              <span className="ap-loading-engine-dot" aria-hidden="true" />
                            </div>
                            <div className="ap-loading-sub ap-loading-sub-game">
                              {selectedGame ? `${selectedGame.home} × ${selectedGame.away}` : "Processando análise"}
                            </div>
                          </div>
                          <span className="ap-loading-status">CALCULANDO</span>
                        </div>
                        <div className="ap-loading-bar-wrap">
                          <div className="ap-loading-bar" style={{ width: `${loadPct}%` }} />
                          <div className="ap-loading-bar-glow" style={{ left: `${loadPct}%` }} />
                        </div>
                        <div className="ap-loading-pct" aria-label={`${loadPct}%`}>
                          {loadPct}<span className="ap-loading-pct-sym">%</span>
                        </div>
                        <div className="ap-loading-steps">
                          {LOAD_STEPS.map((s, i) => (
                            <div key={i} className={`ap-lstep${i < loadStepIdx ? " ap-lstep-done" : i === loadStepIdx ? " ap-lstep-active" : ""}`}>
                              <span className="ap-lstep-icon" aria-hidden="true">
                                {i < loadStepIdx ? "✓" : i === loadStepIdx ? "▶" : "○"}
                              </span>
                              <span className="ap-lstep-lbl">{s.label}</span>
                              {i === loadStepIdx && <span className="ap-lstep-cursor" aria-hidden="true">_</span>}
                              {i < loadStepIdx && <span className="ap-lstep-done-tag">OK</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {error && !loading && (
                      <div className="ap-error" role="alert">
                        {error}
                        <button
                          className="fl-retry"
                          onClick={() => { setError(""); quickAnalyze(tipo, odd); }}
                          type="button"
                        >
                          Tentar novamente
                        </button>
                      </div>
                    )}

                    {/* Result — locked */}
                    {result && !loading && result.locked && renderLockedCard(result.signals || [])}

                    {/* Result — completo */}
                    {result && !loading && !result.locked && (
                      <div className="db-output" role="region" aria-label="Resultado da análise">
                        <div className="db-topbar">
                          <div className="db-topbar-meta">
                            <span className="db-id">#{result.id}</span>
                            <span className="db-sep" aria-hidden="true">·</span>
                            <span className="db-ts">{result.ts}</span>
                            <span className="db-sep" aria-hidden="true">·</span>
                            <span className="db-ai-badge">
                              <span className="db-ai-dot" aria-hidden="true" />IA ativa
                            </span>
                          </div>
                          <div className="fl-result-nav">
                            <button className="db-btn-ghost" onClick={() => { setResult(null); setError(""); setFlowStep("mercado"); }} type="button">
                              ← Outro mercado
                            </button>
                          </div>
                        </div>

                        {renderResultCard(result)}

                        {/* H2H block */}
                        {teamData && result.jogo && result.jogo !== "Aposta" && (() => {
                          const parts = result.jogo.split(" × ");
                          if (parts.length !== 2) return null;
                          const h2h = lookupH2H(parts[0].trim(), parts[1].trim(), teamData);
                          if (!h2h) return null;
                          const total = h2h.h + h2h.d + h2h.a;
                          const homeShort = parts[0].trim().split(" ")[0];
                          const awayShort = parts[1].trim().split(" ")[0];
                          return (
                            <div className="db-h2h">
                              <div className="db-h2h-title">H2H · Últimos {total} jogos</div>
                              <div className="db-h2h-row">
                                <div className="db-h2h-item">
                                  <span className="db-h2h-val" style={{ color: "#22C55E" }}>{h2h.h}</span>
                                  <span className="db-h2h-lbl">{homeShort}</span>
                                </div>
                                <div className="db-h2h-item">
                                  <span className="db-h2h-val">{h2h.d}</span>
                                  <span className="db-h2h-lbl">Empate</span>
                                </div>
                                <div className="db-h2h-item">
                                  <span className="db-h2h-val" style={{ color: "#EF4444" }}>{h2h.a}</span>
                                  <span className="db-h2h-lbl">{awayShort}</span>
                                </div>
                                <div className="db-h2h-item">
                                  <span className="db-h2h-val" style={{ color: "#F59E0B" }}>{h2h.mediaGols}</span>
                                  <span className="db-h2h-lbl">Méd. gols</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Note if using reference odd */}
                        {MAIN_MARKETS.some(m => m.ref === result.odd.toFixed(2)) && (
                          <div className="fl-ref-note">
                            Análise com odd de referência ({result.odd.toFixed(2)}).
                            Use a odd real da sua casa para maior precisão.
                          </div>
                        )}

                        <div className="db-actions">
                          <button
                            className="db-btn-primary"
                            onClick={() => { setResult(null); setError(""); setSelectedGame(null); setFlowStep("lista"); }}
                            type="button"
                          >
                            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                              <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Nova partida
                          </button>
                        </div>
                        <p className="db-disclaimer">
                          Análise educativa. Não representa garantia de resultado. A decisão é sempre sua.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* ════ CONTROLE DE BANCA ══════════════════════════════════ */}
            {view === "banca" && (() => {
              const bancaInicial = parseFloat(bkCfg?.bancaInicial) || 0;
              const stats        = bancaInicial > 0 ? calcBkStats(bkEntries, bancaInicial) : null;
              const alerts       = bancaInicial > 0 ? getBkAlerts(bkEntries, bancaInicial) : [];
              const pctBancaAtual = stats ? ((stats.saldo / bancaInicial) * 100).toFixed(1) : null;

              return (
                <div className="ap-content" key="banca">
                  <div className="ap-panel-hdr">
                    <div className="ap-panel-hdr-left">
                      <div className="ap-panel-mod">GESTÃO</div>
                      <div className="ap-panel-title">Controle de Banca</div>
                    </div>
                    <div className="ap-panel-online">
                      <span className="ap-status-dot" aria-hidden="true" />
                      {bkSyncing ? "SINCRONIZANDO…" : `${bkEntries.length} ENTRADAS${session ? " · SALVO" : ""}`}
                    </div>
                  </div>

                  {/* ── Paywall: sem token → locked preview ─────────────── */}
                  {!hasAccess ? (
                    <div className="lk-wrap" style={{ marginTop: 12 }}>
                      <div className="lk-preview-card" style={{ minHeight: 340 }}>
                        <div className="lk-header">
                          <div className="lk-header-event">Controle de Banca</div>
                          <div className="lk-header-meta">
                            <span className="lk-badge-blur">████████</span>
                          </div>
                        </div>
                        <div className="lk-divider" />
                        <div className="bk-stats-blur-row">
                          {["Saldo atual","ROI","Acerto","Perda máx."].map(l => (
                            <div key={l} className="bk-stat-blur-card">
                              <div className="bk-stat-blur-val">██.█</div>
                              <div className="bk-stat-blur-label">{l}</div>
                            </div>
                          ))}
                        </div>
                        <div className="lk-overlay">
                          <div className="lk-lock-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="11" width="18" height="11" rx="3" stroke="rgba(255,255,255,.25)" strokeWidth="1.5"/>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="rgba(255,255,255,.25)" strokeWidth="1.5" strokeLinecap="round"/>
                              <circle cx="12" cy="16" r="1.5" fill="rgba(255,255,255,.25)"/>
                            </svg>
                          </div>
                          <div className="lk-lock-title">Controle de banca disponível com acesso</div>
                          <div className="lk-lock-sub">Registre entradas · acompanhe ROI · gerencie sua banca</div>
                          <a href={KIWIFY_URL} className="lk-cta-btn">Desbloquear acesso completo</a>
                          <div className="lk-price-note">Pagamento único · sem mensalidade · acesso imediato · R$ 27</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* ── Setup da banca inicial ──────────────────────── */}
                      {!bancaInicial && (
                        <div className="bk-setup-panel">
                          <div className="bk-setup-title">Configure sua banca inicial</div>
                          <div className="bk-setup-sub">Informe o valor total que você dedica às apostas para calcular métricas precisas.</div>
                          <div className="bk-setup-row">
                            <div className="bk-setup-input-wrap">
                              <span className="bk-currency">R$</span>
                              <input
                                className="ap-input bk-setup-input"
                                type="number"
                                min="1"
                                step="0.01"
                                placeholder="Ex: 500.00"
                                value={bkSetupVal}
                                onChange={e => setBkSetupVal(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && setupBanca()}
                              />
                            </div>
                            <button className="bk-setup-btn" onClick={setupBanca}>Confirmar</button>
                          </div>
                        </div>
                      )}

                      {/* ── Alertas inteligentes ─────────────────────────── */}
                      {alerts.length > 0 && (
                        <div className="bk-alerts">
                          {alerts.map((a, i) => (
                            <div key={i} className={`bk-alert bk-alert-${a.type}`}>
                              <span className="bk-alert-icon">{a.type === "danger" ? "⚠" : "●"}</span>
                              {a.msg}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ── Dashboard cards ──────────────────────────────── */}
                      {bancaInicial > 0 && bkEntries.length === 0 && (
                        <div className="bk-empty-state">
                          <div className="bk-empty-icon">📊</div>
                          <div className="bk-empty-title">Nenhuma entrada ainda</div>
                          <div className="bk-empty-sub">Registre sua primeira aposta para começar a acompanhar sua banca.</div>
                        </div>
                      )}

                      {bancaInicial > 0 && bkEntries.length > 0 && stats && (
                        <div className="bk-cards">
                          <div className="bk-card">
                            <div className="bk-card-label">SALDO ATUAL</div>
                            <div className="bk-card-val" style={{ color: stats.saldo >= bancaInicial ? "var(--green)" : "var(--red)" }}>
                              R$ {stats.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="bk-card-sub">{pctBancaAtual}% da banca inicial</div>
                          </div>
                          <div className="bk-card">
                            <div className="bk-card-label">LUCRO / PREJUÍZO</div>
                            <div className="bk-card-val" style={{ color: stats.lucroTotal >= 0 ? "var(--green)" : "var(--red)" }}>
                              {stats.lucroTotal >= 0 ? "+" : ""}R$ {Math.abs(stats.lucroTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="bk-card-sub">{stats.wins}G · {stats.losses}P de {stats.totalApos} apostas</div>
                          </div>
                          <div className="bk-card">
                            <div className="bk-card-label">ROI</div>
                            <div className="bk-card-val" style={{ color: stats.roi >= 0 ? "var(--green)" : "var(--red)" }}>
                              {stats.roi >= 0 ? "+" : ""}{stats.roi.toFixed(1)}%
                            </div>
                            <div className="bk-card-sub">Retorno sobre investido</div>
                          </div>
                          <div className="bk-card">
                            <div className="bk-card-label">TAXA DE ACERTO</div>
                            <div className="bk-card-val" style={{ color: stats.acerto >= 55 ? "var(--green)" : stats.acerto >= 45 ? "var(--amber)" : "var(--red)" }}>
                              {stats.acerto.toFixed(1)}%
                            </div>
                            <div className="bk-card-sub">{stats.wins} vitórias</div>
                          </div>
                          <div className="bk-card">
                            <div className="bk-card-label">SEQUÊNCIA ATUAL</div>
                            <div className="bk-card-val" style={{ color: stats.streak > 0 ? "var(--green)" : stats.streak < 0 ? "var(--red)" : "var(--t2)" }}>
                              {stats.streak > 0 ? `+${stats.streak}` : stats.streak === 0 ? "—" : stats.streak}
                            </div>
                            <div className="bk-card-sub">Pior sequência: {stats.maxStreak} derrotas</div>
                          </div>
                          <div className="bk-card">
                            <div className="bk-card-label">BANCA INICIAL</div>
                            <div className="bk-card-val" style={{ color: "var(--t1)" }}>
                              R$ {bancaInicial.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="bk-card-sub bk-reset-link" onClick={() => { setBkCfg({}); saveBkCfg({}); }}>redefinir</div>
                          </div>
                        </div>
                      )}

                      {/* ── Botão adicionar entrada ──────────────────────── */}
                      <div className="bk-actions">
                        <button className="bk-add-btn" onClick={() => { setBkFormOpen(o => !o); setBkFormExpanded(false); }}>
                          {bkFormOpen ? "Cancelar" : "+ Registrar entrada"}
                        </button>
                        {bkEntries.length > 0 && (
                          bkClearConfirm ? (
                            <div className="bk-clear-confirm">
                              <span>Apagar tudo?</span>
                              <button className="bk-clear-yes" onClick={clearBankroll}>Sim, apagar</button>
                              <button className="bk-clear-no"  onClick={() => setBkClearConfirm(false)}>Cancelar</button>
                            </div>
                          ) : (
                            <button className="bk-clear-btn" onClick={() => setBkClearConfirm(true)}>Limpar histórico</button>
                          )
                        )}
                      </div>

                      {/* ── Formulário de entrada ────────────────────────── */}
                      {bkFormOpen && (
                        <div className="bk-form">
                          <p className="bk-form-intro">Registre o resultado da sua aposta para atualizar sua banca.</p>

                          {/* Required fields */}
                          <div className="bk-form-row">
                            <div className="bk-form-field">
                              <label className="ap-label">VALOR (R$)</label>
                              <input
                                className="ap-input"
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Ex: 25.00"
                                value={bkForm.valor}
                                onChange={e => setBkForm(f => ({ ...f, valor: e.target.value }))}
                              />
                            </div>
                            <div className="bk-form-field">
                              <label className="ap-label">ODD</label>
                              <input
                                className="ap-input"
                                type="number"
                                min="1.01"
                                step="0.01"
                                placeholder="Ex: 1.85"
                                value={bkForm.odd}
                                onChange={e => setBkForm(f => ({ ...f, odd: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div className="bk-form-field">
                            <label className="ap-label">RESULTADO</label>
                            <select
                              className="ap-input"
                              value={bkForm.resultado}
                              onChange={e => setBkForm(f => ({ ...f, resultado: e.target.value }))}
                            >
                              <option>Ganhou</option>
                              <option>Perdeu</option>
                              <option>Anulada</option>
                            </select>
                          </div>

                          {/* Optional fields toggle */}
                          <button
                            className="bk-form-more"
                            type="button"
                            onClick={() => setBkFormExpanded(v => !v)}
                          >
                            {bkFormExpanded ? "− Menos opções" : "+ Mercado e observação"}
                          </button>
                          {bkFormExpanded && (
                            <>
                              <div className="bk-form-field">
                                <label className="ap-label">MERCADO</label>
                                <select
                                  className="ap-input"
                                  value={bkForm.mercado}
                                  onChange={e => setBkForm(f => ({ ...f, mercado: e.target.value }))}
                                >
                                  {BK_MERCADOS.map(m => <option key={m}>{m}</option>)}
                                </select>
                              </div>
                              <div className="bk-form-field">
                                <label className="ap-label">OBSERVAÇÃO</label>
                                <input
                                  className="ap-input"
                                  type="text"
                                  maxLength={120}
                                  placeholder="Ex: Flamengo × Palmeiras — aposta no empate"
                                  value={bkForm.obs}
                                  onChange={e => setBkForm(f => ({ ...f, obs: e.target.value }))}
                                />
                              </div>
                            </>
                          )}

                          <button
                            className="bk-submit-btn"
                            onClick={addBankrollEntry}
                            disabled={!bkForm.valor || !bkForm.odd}
                          >
                            Salvar entrada
                          </button>
                        </div>
                      )}

                      {/* ── Histórico de entradas ────────────────────────── */}
                      {bkEntries.length > 0 ? (
                        <div className="bk-hist">
                          <div className="bk-hist-hdr">
                            <span>Data</span>
                            <span>Mercado</span>
                            <span>Odd</span>
                            <span>Valor</span>
                            <span>Resultado</span>
                            <span></span>
                          </div>
                          {bkEntries.map(e => {
                            const cor = e.resultado === "Ganhou" ? "var(--green)" : e.resultado === "Perdeu" ? "var(--red)" : "var(--t2)";
                            const retorno = e.resultado === "Ganhou"
                              ? `+R$ ${(e.valor * (e.odd - 1)).toFixed(2)}`
                              : e.resultado === "Perdeu"
                              ? `-R$ ${parseFloat(e.valor).toFixed(2)}`
                              : "—";
                            return (
                              <div key={e.id} className="bk-hist-row">
                                <span className="bk-hist-date">{new Date(e.ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                                <span className="bk-hist-mercado">{e.mercado}</span>
                                <span className="bk-hist-odd">{parseFloat(e.odd).toFixed(2)}</span>
                                <span className="bk-hist-valor">R$ {parseFloat(e.valor).toFixed(2)}</span>
                                <span className="bk-hist-res" style={{ color: cor }}>{retorno}</span>
                                <button className="bk-hist-del" onClick={() => deleteBankrollEntry(e.id)} aria-label="Remover">×</button>
                              </div>
                            );
                          })}
                        </div>
                      ) : bancaInicial > 0 ? (
                        <div className="ap-empty">Nenhuma entrada registrada. Use o botão acima para adicionar.</div>
                      ) : null}

                      {/* ── Frases educativas ────────────────────────────── */}
                      <div className="bk-edu">
                        <p>A gestão de banca é o único fator que você controla totalmente em apostas. Defina um limite, respeite-o.</p>
                        <p>Recomenda-se arriscar entre 1% e 3% da banca por entrada para preservar o capital a longo prazo.</p>
                      </div>
                      <p className="db-disclaimer">
                        Ferramenta educativa. Não representa orientação financeira. A responsabilidade pelas decisões é inteiramente sua.
                      </p>
                    </>
                  )}
                </div>
              );
            })()}

            {/* ════ HISTÓRICO ══════════════════════════════════════════ */}
            {view === "historico" && (
              <div className="ap-content" key="historico">
                <div className="ap-panel-hdr">
                  <div className="ap-panel-hdr-left">
                    <div className="ap-panel-mod">ARQUIVO</div>
                    <div className="ap-panel-title">Histórico de análises</div>
                  </div>
                  <div className="ap-panel-online">
                    <span className="ap-status-dot" aria-hidden="true" />
                    {history.length} REGISTROS
                  </div>
                </div>
                {history.length === 0 ? (
                  <div className="ap-empty">Nenhuma análise registrada nesta sessão.</div>
                ) : (
                  <div className="ap-hist-list">
                    {history.map((item, i) => (
                      <button key={i} className="ap-hist-row" onClick={() => loadFromHistory(item)}>
                        <span className="ap-hist-id">#{item.id || "—"}</span>
                        <span className="ap-hist-event">{item.jogo || "Aposta"}</span>
                        <span className="ap-hist-odd">Odd {item.odd}</span>
                        <div className="ap-hist-bar">
                          <div style={{ width: `${item.score}%`, background: item.color, height: "100%", borderRadius: 99 }} />
                        </div>
                        <span className="ap-hist-score" style={{ color: item.color }}>{item.score}</span>
                        <span className="ap-hist-tag" style={{ color: item.color, borderColor: `${item.color}33` }}>{item.label}</span>
                        <span className="ap-hist-ts">{item.ts || ""}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ════ CONFIGURAÇÕES ══════════════════════════════════════ */}
            {view === "config" && (
              <div className="ap-content" key="config">
                <div className="ap-panel-hdr">
                  <div className="ap-panel-hdr-left">
                    <div className="ap-panel-mod">SISTEMA</div>
                    <div className="ap-panel-title">Configurações</div>
                  </div>
                </div>
                <div className="ap-config-panel">
                  <div className="ap-config-field">
                    <label className="ap-label" htmlFor="token-input">TOKEN DE ACESSO</label>
                    <input
                      id="token-input"
                      className="ap-input ap-input-mono"
                      type="text"
                      placeholder="Cole seu token de acesso aqui"
                      value={token}
                      onChange={e => { setToken(e.target.value); localStorage.setItem(TOKEN_KEY, e.target.value); }}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <p className="ap-config-hint">Token recebido por email após a confirmação de acesso.</p>
                  </div>
                  <div className="ap-config-info">
                    <div className="ap-config-row"><span>Engine</span><span>MotorIA Risk Engine™ v2.4</span></div>
                    <div className="ap-config-row"><span>Modelo</span><span>Quantitative Risk v2</span></div>
                    <div className="ap-config-row"><span>Histórico local</span><span>{history.length} / {MAX_HISTORY}</span></div>
                    <div className="ap-config-row"><span>Status</span><span className="ap-config-online">● ONLINE</span></div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

        {/* ── MOBILE TAB BAR ──────────────────────────────────────────── */}
        <nav className="ap-tab-bar" aria-label="Navegação principal">
          {[
            { id: "jogos",  label: "Jogos",   Icon: IconJogos },
            { id: "nova",   label: "Análise", Icon: IconAnalyze },
            { id: "banca",  label: "Banca",   Icon: IconBanca },
            { id: "config", label: "Config",  Icon: IconConfig },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`ap-tab-item${view === id ? " ap-tab-active" : ""}`}
              onClick={() => navigate(id)}
              aria-current={view === id ? "page" : undefined}
              type="button"
            >
              <Icon />
              <span className="ap-tab-label">{label}</span>
            </button>
          ))}
        </nav>

      </div>
    </>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:     #060608;
  --bg2:    #07070A;
  --panel:  #0B0B0F;
  --border: rgba(255,255,255,0.065);
  --bmd:    rgba(255,255,255,0.11);
  --t1: #DDDDE0;
  --t2: #6E6E76;
  --t3: #36363C;
  --green:  #22C55E;
  --amber:  #F59E0B;
  --red:    #EF4444;
  --orange: #F97316;
}

html, body { overflow-x: hidden; max-width: 100%; }
body { overflow: hidden; }

@keyframes ap-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .4; transform: scale(1.55); }
}
@keyframes ap-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: .18; }
}
@keyframes ap-bar-in {
  from { width: 0; }
}
@keyframes ap-fade-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ap-banner-in {
  from { opacity: 0; transform: translateY(-100%); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ─ Shell ──────────────────────────────────────────────────────────────────── */
.ap-shell {
  display: flex; flex-direction: column;
  height: 100dvh; min-height: 100vh;
  background: var(--bg); color: var(--t1);
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif;
  overflow: hidden; font-size: 14px;
}

/* ─ Overlay ────────────────────────────────────────────────────────────────── */
.ap-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.65);
  z-index: 40; backdrop-filter: blur(3px);
}

/* ─ Access banner ──────────────────────────────────────────────────────────── */
.ap-access-banner {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: var(--green); color: #050507;
  font-size: 11px; font-weight: 800; letter-spacing: .1em;
  padding: 10px 20px;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  animation: ap-banner-in .3s ease both;
}
.ap-access-banner-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #050507; opacity: .55;
  animation: ap-pulse 1.5s ease-in-out infinite;
}

/* ─ Topbar ─────────────────────────────────────────────────────────────────── */
.ap-topbar {
  background: var(--bg2);
  border-bottom: 1px solid rgba(255,255,255,.08);
  flex-shrink: 0; z-index: 30; position: relative;
  /* Push content below iOS status bar / Dynamic Island */
  padding-top: env(safe-area-inset-top);
}
.ap-topbar-row {
  display: flex; align-items: center; justify-content: space-between;
  height: 46px; padding: 0 16px; gap: 12px;
  overflow: hidden; min-width: 0;
}
.ap-topbar-left  { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.ap-topbar-right { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }

.ap-hamburger {
  display: none; flex-direction: column; gap: 4.5px;
  background: none; border: none; cursor: pointer; padding: 4px 3px; flex-shrink: 0;
}
.ap-hamburger span {
  display: block; width: 16px; height: 1.5px;
  background: var(--t2); border-radius: 99px; transition: opacity .15s;
}
.ap-hamburger:hover span { background: var(--t1); }

.ap-topbar-brand { display: flex; align-items: center; gap: 7px; }
.ap-logo-mark {
  width: 22px; height: 22px; border-radius: 5px;
  background: #16a34a; color: #f0fdf4;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 0 12px rgba(22,163,74,.28), 0 2px 6px rgba(0,0,0,.4);
}
.ap-topbar-name { font-size: 13px; font-weight: 800; color: #E8E8E6; letter-spacing: -0.03em; }
.ap-topbar-sep  { color: var(--t3); font-size: 13px; }
.ap-topbar-tag  { font-size: 10.5px; font-weight: 600; color: rgba(255,255,255,.28); letter-spacing: .04em; }

.ap-topbar-center { flex: 1; display: flex; align-items: center; justify-content: center; min-width: 0; overflow: hidden; }
.ap-topbar-clock {
  font-size: 11px; font-weight: 700; letter-spacing: .06em; color: rgba(255,255,255,.3);
  font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace;
}
.ap-topbar-aid {
  font-size: 10px; font-weight: 700; letter-spacing: .1em;
  color: rgba(34,197,94,.45); font-family: 'Courier New', monospace;
}

.ap-credits-wrap { display: flex; align-items: center; }
.ap-credits-bar {
  width: 56px; height: 2px;
  background: rgba(255,255,255,.07); border-radius: 99px; overflow: hidden;
}
.ap-credits-fill { height: 100%; border-radius: 99px; background: var(--green); transition: width .4s ease; }

.ap-engine-live {
  display: flex; align-items: center; gap: 6px;
  font-size: 9px; font-weight: 800; letter-spacing: .12em; color: rgba(255,255,255,.28);
}
.ap-live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--green); flex-shrink: 0;
  animation: ap-pulse 2.4s ease-in-out infinite;
}
.ap-live-lbl { letter-spacing: .1em; }

/* ─ Body ───────────────────────────────────────────────────────────────────── */
.ap-body { display: flex; flex: 1; overflow: hidden; }

/* ─ Sidebar ────────────────────────────────────────────────────────────────── */
.ap-sidebar {
  width: 210px; flex-shrink: 0;
  background: var(--bg2);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  padding: 0 0 12px; overflow-y: auto;
  transition: transform .22s ease;
}

/* Sidebar brand mark */
.ap-sidebar-brand {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid var(--border);
}
.ap-sidebar-brand-mark {
  width: 20px; height: 20px; border-radius: 5px;
  background: rgba(22,163,74,.14);
  border: 1px solid rgba(22,163,74,.2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ap-sidebar-brand-name {
  font-size: 11px; font-weight: 800; color: rgba(255,255,255,.45);
  letter-spacing: -0.01em;
}

.ap-sidebar-divider { height: 1px; background: var(--border); }

/* Sidebar groups */
.ap-sidebar-group {
  display: flex; flex-direction: column; gap: 1px;
  padding: 10px 8px 4px;
}
.ap-sidebar-group-lbl {
  font-size: 8px; font-weight: 800; letter-spacing: .2em;
  color: var(--t3); padding: 0 6px 5px; text-transform: uppercase;
}

/* Nav items */
.ap-nav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 7.5px 10px; border-radius: 7px;
  border: none; background: transparent; cursor: pointer;
  width: 100%; text-align: left; color: var(--t2);
  transition: background .12s, color .12s; font-family: inherit;
  position: relative;
}
.ap-nav-item:hover:not(.ap-nav-dim) {
  background: rgba(255,255,255,.045); color: var(--t1);
}
.ap-nav-active {
  background: rgba(255,255,255,.06) !important;
  color: var(--t1) !important;
}
.ap-nav-active::before {
  content: '';
  position: absolute; left: 0; top: 22%; bottom: 22%;
  width: 2px; border-radius: 99px; background: var(--green);
}

.ap-nav-dim { opacity: .42; cursor: default; }
.ap-nav-dim:hover { background: transparent !important; color: var(--t2) !important; }

.ap-nav-icon {
  display: flex; align-items: center; justify-content: center;
  width: 16px; flex-shrink: 0; opacity: .7; color: inherit;
}
.ap-nav-active .ap-nav-icon { opacity: 1; }

.ap-nav-label { font-size: 12px; font-weight: 600; letter-spacing: -0.01em; flex: 1; }

.ap-nav-badge {
  font-size: 9px; font-weight: 700; color: var(--t3);
  background: rgba(255,255,255,.055); border-radius: 99px;
  padding: 1px 6px; min-width: 18px; text-align: center;
}
.ap-nav-live-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--green); flex-shrink: 0;
  animation: ap-pulse 2s ease-in-out infinite;
}
.ap-nav-soon {
  color: var(--t3); display: flex; align-items: center;
  opacity: .6;
}

/* Sidebar engine block */
.ap-sidebar-engine {
  margin-top: auto; padding: 14px 14px 4px;
  border-top: 1px solid var(--border);
  display: flex; align-items: center; gap: 9px;
}
.ap-sidebar-engine-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--green); flex-shrink: 0;
  animation: ap-pulse 3s ease-in-out infinite;
}
.ap-sidebar-engine-info { display: flex; flex-direction: column; gap: 2px; }
.ap-sidebar-engine-name {
  font-size: 8px; font-weight: 800; letter-spacing: .1em;
  color: var(--t3); font-family: 'Courier New', monospace;
}
.ap-sidebar-engine-status {
  font-size: 8px; font-weight: 700; letter-spacing: .08em; color: rgba(34,197,94,.5);
}

/* ─ Main ───────────────────────────────────────────────────────────────────── */
.ap-main {
  flex: 1; overflow-y: auto; overflow-x: hidden; background: var(--bg);
  /* Bottom safe area keeps content above iPhone home indicator */
  padding-bottom: env(safe-area-inset-bottom);
}
.ap-content {
  max-width: 800px; margin: 0 auto; padding: 24px 22px;
  display: flex; flex-direction: column; gap: 11px;
  animation: ap-fade-up .2s ease both;
}

/* ─ Nova analysis: constrained width gives form intentional presence ────────── */
.ap-content-nova {
  max-width: 500px;
  padding-top: 28px;
}
@media (max-width: 640px) {
  .ap-content-nova { padding-top: 12px; }
}

/* ─ Panel header ───────────────────────────────────────────────────────────── */
.ap-panel-hdr {
  display: flex; justify-content: space-between; align-items: flex-end;
  padding-bottom: 13px; border-bottom: 1px solid var(--border); margin-bottom: 4px;
}
.ap-panel-hdr-left { display: flex; flex-direction: column; gap: 2px; }
.ap-panel-mod {
  font-size: 8px; font-weight: 800; letter-spacing: .2em;
  color: var(--t3); font-family: 'Courier New', monospace;
}
.ap-panel-title { font-size: 16px; font-weight: 700; color: var(--t1); letter-spacing: -0.03em; }
.ap-panel-online {
  display: flex; align-items: center; gap: 6px;
  font-size: 8px; font-weight: 800; letter-spacing: .14em; color: var(--t3);
}
.ap-status-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--green);
  animation: ap-pulse 2.8s ease-in-out infinite;
}

/* ─ Visão Geral ────────────────────────────────────────────────────────────── */
.ap-geral-stats {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px;
}
.ap-geral-stat {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 14px 12px;
  display: flex; flex-direction: column; gap: 6px;
}
.ap-geral-stat-val {
  font-size: 26px; font-weight: 900; color: var(--t1);
  letter-spacing: -0.05em; line-height: 1;
  font-variant-numeric: tabular-nums;
}
.ap-geral-stat-val-sm { font-size: 18px; }
.ap-geral-stat-lbl {
  font-size: 8px; font-weight: 800; letter-spacing: .14em;
  color: var(--t3); text-transform: uppercase;
}

.ap-geral-action {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 16px 18px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.ap-geral-action-left { display: flex; flex-direction: column; gap: 4px; }
.ap-geral-action-title { font-size: 13px; font-weight: 700; color: var(--t1); letter-spacing: -0.02em; }
.ap-geral-action-sub { font-size: 10px; color: var(--t3); letter-spacing: .02em; }
.ap-geral-btn {
  display: flex; align-items: center; gap: 7px;
  background: var(--t1); color: #060608;
  font-size: 11px; font-weight: 900; letter-spacing: .12em;
  padding: 9px 18px; border-radius: 7px; border: none; cursor: pointer;
  font-family: inherit; white-space: nowrap; flex-shrink: 0;
  transition: opacity .14s;
}
.ap-geral-btn:hover { opacity: .88; }

.ap-geral-recent {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 10px;
}
.ap-geral-recent-hdr {
  font-size: 8px; font-weight: 800; letter-spacing: .16em; color: var(--t3);
}
.ap-geral-recent-list { display: flex; flex-direction: column; gap: 3px; }
.ap-geral-recent-row {
  display: grid; grid-template-columns: 52px 1fr 56px 64px 28px 60px;
  align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 7px;
  background: transparent; border: none; cursor: pointer;
  width: 100%; text-align: left; font-family: inherit; color: inherit;
  transition: background .1s;
}
.ap-geral-recent-row:hover { background: rgba(255,255,255,.035); }
.ap-geral-recent-id    { font-family: 'Courier New', monospace; font-size: 9px; color: var(--t3); }
.ap-geral-recent-event { font-size: 11px; color: var(--t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ap-geral-recent-odd   { font-size: 10px; color: var(--t3); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ap-geral-recent-bar   { height: 3px; background: rgba(255,255,255,.05); border-radius: 99px; overflow: hidden; }
.ap-geral-recent-score { font-size: 12px; font-weight: 800; text-align: right; font-variant-numeric: tabular-nums; }
.ap-geral-recent-tag   { font-size: 8px; font-weight: 800; letter-spacing: .04em; }

.ap-geral-empty {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 36px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  text-align: center;
}
.ap-geral-empty p { font-size: 13px; color: var(--t3); }
.jg-empty-icon { color: var(--t3); opacity: .5; margin-bottom: 2px; }
.jg-empty-title { font-size: 14px !important; font-weight: 600; color: var(--t1) !important; margin: 0; }
.jg-empty-sub   { font-size: 12px !important; color: var(--t3) !important; line-height: 1.6; max-width: 280px; margin: 0; }
.jg-empty-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }

/* ─ Coming soon ────────────────────────────────────────────────────────────── */
.ap-coming-panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 40px 32px;
  display: flex; flex-direction: column; align-items: flex-start; gap: 14px;
  margin-top: 6px;
}
.ap-coming-icon { opacity: .6; margin-bottom: 4px; }
.ap-coming-desc { font-size: 13px; color: var(--t2); line-height: 1.75; max-width: 440px; }
.ap-coming-tag {
  font-size: 9px; font-weight: 800; letter-spacing: .12em;
  color: var(--t3); font-family: 'Courier New', monospace;
  border: 1px solid var(--border); border-radius: 5px; padding: 5px 10px;
}

/* ─ Input panel ────────────────────────────────────────────────────────────── */
.ap-input-panel {
  background: #0C0C11;
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 14px; padding: 22px 22px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,.4), 0 12px 40px rgba(0,0,0,.35);
}

/* Form header */
.ap-form-hdr {
  border-bottom-color: rgba(255,255,255,.06);
  padding-bottom: 16px; margin-bottom: 6px;
}
.ap-nova-title {
  font-size: 18px; font-weight: 800; color: #DDDDE0;
  letter-spacing: -0.035em; line-height: 1;
}
.ap-nova-sub {
  font-size: 11.5px; color: rgba(255,255,255,.32); margin-top: 5px; line-height: 1.55;
}
.ap-ia-online {
  display: flex; align-items: center; gap: 6px;
  font-size: 8px; font-weight: 800; letter-spacing: .14em; color: rgba(34,197,94,.5);
  flex-shrink: 0;
}

/* Form anchor strip */
.ap-form-anchor {
  display: inline-flex; align-items: center; gap: 7px;
  align-self: flex-start;
  padding: 5px 11px;
  background: rgba(22,163,74,.05);
  border: 1px solid rgba(22,163,74,.13);
  border-radius: 99px;
  font-size: 9px; font-weight: 700; color: rgba(34,197,94,.6);
  letter-spacing: .04em;
}

.ap-form { display: flex; flex-direction: column; gap: 14px; margin-top: 0; }
.ap-row-2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; }
.ap-field { display: flex; flex-direction: column; gap: 6px; }

/* Dim label for secondary fields */
.ap-label-dim { opacity: .62; }
/* Secondary row: slightly visually recessed */
.ap-row-secondary { margin-top: -2px; }

.ap-label {
  font-size: 9px; font-weight: 700; letter-spacing: .1em;
  color: rgba(255,255,255,.5); text-transform: uppercase;
}
.ap-label-opt { font-weight: 500; letter-spacing: 0; text-transform: none; font-size: 8px; opacity: .7; }

.ap-input {
  background: rgba(255,255,255,.048);
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 8px; padding: 11px 13px;
  font-size: 14px; font-weight: 500; color: #E8E8E6;
  outline: none; font-family: inherit; width: 100%;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04), inset 0 -1px 0 rgba(0,0,0,.15);
  transition: border-color .18s ease-out, background .18s ease-out, box-shadow .18s ease-out;
}
.ap-input:focus {
  border-color: rgba(34,197,94,.38);
  background: rgba(22,163,74,.03);
  box-shadow: 0 0 0 3px rgba(22,163,74,.08), inset 0 1px 0 rgba(255,255,255,.04);
}
.ap-input::placeholder { color: rgba(255,255,255,.42); }
.ap-input-odd {
  font-size: 22px; font-weight: 700; letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums; font-feature-settings: 'tnum';
}
.ap-select { cursor: pointer; }
.ap-textarea { resize: none; line-height: 1.55; font-size: 13px; }
.ap-input-mono { font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: .03em; }

.ap-odd-preview {
  display: flex; align-items: center; gap: 5px;
  font-size: 9px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  opacity: .85;
}
.ap-odd-preview-sep { color: var(--t3); }
.ap-error {
  font-size: 12px; color: var(--red);
  background: rgba(239,68,68,.06); border: 1px solid rgba(239,68,68,.18);
  border-radius: 8px; padding: 10px 12px;
}

.ap-submit {
  display: flex; align-items: center; justify-content: center; gap: 9px;
  background: #15803d; color: #dcfce7;
  font-size: 11.5px; font-weight: 700; letter-spacing: .08em;
  padding: 14px 20px; border-radius: 9px; border: none; cursor: pointer;
  font-family: inherit; margin-top: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,.35);
  transition: background .15s ease-out, transform .1s ease-out;
}
.ap-submit:hover {
  background: #166534;
  transform: translateY(-1px);
}
.ap-submit:active { transform: translateY(0); }

/* ─ Loading ────────────────────────────────────────────────────────────────── */
.ap-loading {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 26px 22px;
  display: flex; flex-direction: column; gap: 20px;
}
.ap-loading-hdr { display: flex; justify-content: space-between; align-items: flex-start; }
.ap-loading-engine { font-size: 10px; font-weight: 800; letter-spacing: .16em; color: var(--t2); font-family: 'Courier New', monospace; }
.ap-loading-sub { font-size: 11px; color: var(--t3); margin-top: 3px; }
.ap-loading-status { font-size: 9px; font-weight: 800; letter-spacing: .12em; color: var(--green); animation: ap-blink 1.3s ease-in-out infinite; }
.ap-loading-bar-wrap { height: 2px; background: rgba(255,255,255,.06); border-radius: 99px; overflow: hidden; }
.ap-loading-bar {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, var(--green) 0%, var(--amber) 55%, var(--red) 100%);
  transition: width .8s ease;
}
.ap-loading-pct {
  font-size: 56px; font-weight: 900; color: var(--t1);
  line-height: 1; letter-spacing: -0.06em;
  font-variant-numeric: tabular-nums; font-feature-settings: 'tnum';
}
.ap-loading-pct-sym { font-size: 26px; color: var(--t3); }
.ap-loading-steps { display: flex; flex-direction: column; gap: 9px; }
.ap-lstep { display: flex; align-items: center; gap: 10px; font-size: 11.5px; color: var(--t3); transition: color .3s; }
.ap-lstep-done   { color: var(--t3); }
.ap-lstep-active { color: var(--t1); }
.ap-lstep-icon { font-size: 9px; width: 14px; flex-shrink: 0; font-family: 'Courier New', monospace; color: inherit; }
.ap-lstep-active .ap-lstep-icon { animation: ap-blink .7s ease-in-out infinite; }
.ap-lstep-done-tag { margin-left: auto; font-size: 8px; font-weight: 800; letter-spacing: .08em; color: rgba(34,197,94,.4); font-family: 'Courier New', monospace; }
.ap-lstep-cursor {
  font-family: 'Courier New', monospace; font-size: 11px; color: var(--green);
  animation: ap-blink .6s step-start infinite; margin-left: 1px;
}
.ap-loading-engine-dot {
  display: inline-block; width: 5px; height: 5px; border-radius: 50%;
  background: var(--green); margin-left: 7px; vertical-align: middle;
  animation: ap-pulse 1.8s ease-in-out infinite;
}
.ap-loading-sub-game {
  color: var(--t1) !important; font-weight: 600; font-size: 12px;
}
.ap-loading-bar-wrap { position: relative; height: 2px; background: rgba(255,255,255,.06); border-radius: 99px; overflow: visible; }
.ap-loading-bar-glow {
  position: absolute; top: 50%; transform: translate(-50%, -50%);
  width: 20px; height: 6px;
  background: radial-gradient(ellipse, rgba(34,197,94,.45) 0%, transparent 70%);
  pointer-events: none; transition: left .8s ease;
}

/* ─ Output ─────────────────────────────────────────────────────────────────── */
.ap-output { display: flex; flex-direction: column; gap: 10px; animation: ap-fade-up .25s ease both; }
.ap-output-topbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.ap-output-meta { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.ap-output-id   { font-size: 9px; font-weight: 800; letter-spacing: .14em; color: rgba(34,197,94,.5); font-family: 'Courier New', monospace; }
.ap-output-dot  { color: var(--t3); font-size: 10px; }
.ap-output-ts   { font-size: 10px; color: var(--t3); font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace; }
.ap-output-event { font-size: 11px; color: var(--t2); }
.ap-btn-nova {
  font-size: 10px; font-weight: 700; color: var(--t2);
  background: rgba(255,255,255,.04); border: 1px solid var(--border);
  border-radius: 6px; padding: 5px 13px; cursor: pointer;
  transition: all .14s; font-family: inherit; letter-spacing: .04em;
}
.ap-btn-nova:hover { color: var(--t1); border-color: var(--bmd); }

/* Score hero */
.ap-score-hero {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 22px 22px;
  display: flex; align-items: center; gap: 32px;
}
.ap-gauge-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0; }
.ap-gauge {
  width: 120px; height: 120px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: background .7s ease;
}
.ap-gauge-inner {
  width: 88px; height: 88px; border-radius: 50%;
  background: var(--panel); border: 1px solid var(--border);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
}
.ap-gauge-num   { font-size: 30px; font-weight: 900; color: var(--t1); line-height: 1; letter-spacing: -0.05em; font-variant-numeric: tabular-nums; }
.ap-gauge-denom { font-size: 11px; font-weight: 600; color: var(--t3); }
.ap-gauge-name  { font-size: 7.5px; font-weight: 800; letter-spacing: .1em; color: var(--t3); text-transform: uppercase; text-align: center; max-width: 110px; }
.ap-gauge-ci    { font-size: 8px; color: rgba(255,255,255,.14); letter-spacing: .04em; font-variant-numeric: tabular-nums; text-align: center; }

.ap-score-side { display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0; }
.ap-risk-badge {
  display: inline-flex; align-items: center;
  font-size: 10px; font-weight: 800; letter-spacing: .1em;
  padding: 4px 11px; border-radius: 5px; border: 1px solid; align-self: flex-start;
}
.ap-verdict { font-size: 26px; font-weight: 900; line-height: 1; letter-spacing: -0.04em; }
.ap-score-data { display: flex; flex-direction: column; gap: 8px; margin-top: 2px; }
.ap-score-data-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ap-score-data-lbl { font-size: 8px; font-weight: 800; letter-spacing: .12em; color: var(--t3); text-transform: uppercase; min-width: 88px; flex-shrink: 0; }
.ap-score-data-val { font-size: 12px; font-weight: 700; color: var(--t2); font-variant-numeric: tabular-nums; }
.ap-score-data-val-lg { font-size: 18px; font-weight: 800; color: var(--t1); letter-spacing: -0.03em; }
.ap-exposure-row { display: flex; align-items: center; gap: 8px; flex: 1; }
.ap-exposure-track { flex: 1; height: 3px; background: rgba(255,255,255,.07); border-radius: 99px; overflow: hidden; max-width: 100px; }
.ap-exposure-fill { height: 100%; border-radius: 99px; transition: width .6s ease; animation: ap-bar-in .6s ease both; }
.ap-exposure-val { font-size: 11px; font-weight: 800; font-variant-numeric: tabular-nums; }

/* Probability Distortion */
.ap-prob-panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.ap-prob-hdr { display: flex; justify-content: space-between; align-items: center; }
.ap-prob-title { font-size: 8px; font-weight: 800; letter-spacing: .14em; color: var(--t3); text-transform: uppercase; }
.ap-prob-vig   { font-size: 8px; font-weight: 700; letter-spacing: .06em; color: rgba(245,158,11,.5); font-family: 'Courier New', monospace; }
.ap-prob-bar   { display: flex; height: 5px; border-radius: 99px; overflow: hidden; gap: 2px; }
.ap-prob-win   { background: var(--green); border-radius: 99px 0 0 99px; animation: ap-bar-in .65s ease-out both; }
.ap-prob-lose  { flex: 1; background: var(--red); border-radius: 0 99px 99px 0; }
.ap-prob-labels { display: flex; justify-content: space-between; }
.ap-prob-w { font-size: 9px; font-weight: 800; color: var(--green); letter-spacing: .05em; }
.ap-prob-l { font-size: 9px; font-weight: 800; color: var(--red);   letter-spacing: .05em; }

/* Metrics grid */
.ap-metrics-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
.ap-metric-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 13px 12px;
  display: flex; flex-direction: column; gap: 5px;
  transition: border-color .14s;
}
.ap-metric-card:hover { border-color: var(--bmd); }
.ap-metric-val   { font-size: clamp(16px, 2.2vw, 21px); font-weight: 900; line-height: 1; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }
.ap-metric-label { font-size: 7.5px; font-weight: 800; letter-spacing: .12em; color: var(--t3); text-transform: uppercase; }
.ap-tm           { font-size: 7px; vertical-align: super; opacity: .7; }
.ap-metric-sub   { font-size: 10px; color: var(--t3); line-height: 1.4; }

/* AI Modules */
.ap-ai-section { display: flex; flex-direction: column; gap: 9px; }
.ap-ai-hdr {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 9px; border-bottom: 1px solid var(--border);
}
.ap-ai-hdr-title { font-size: 8px; font-weight: 800; letter-spacing: .18em; color: var(--t3); }
.ap-ai-hdr-tag   { font-size: 8px; font-weight: 700; letter-spacing: .06em; color: rgba(34,197,94,.38); }
.ap-ai-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 7px; }
.ap-ai-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 13px 14px;
  display: flex; flex-direction: column; gap: 5px;
  transition: border-color .14s;
}
.ap-ai-card:hover { border-color: var(--bmd); }
.ap-ai-card-mod   { font-size: 7.5px; font-weight: 800; letter-spacing: .12em; color: rgba(34,197,94,.42); font-family: 'Courier New', monospace; }
.ap-ai-card-title { font-size: 9px; font-weight: 800; letter-spacing: .1em; color: var(--t3); text-transform: uppercase; margin-bottom: 2px; }
.ap-ai-card-text  { font-size: 12px; color: var(--t2); line-height: 1.8; }

.ap-alerta {
  display: flex; flex-direction: column; gap: 8px;
  background: rgba(239,68,68,.04); border: 1px solid rgba(239,68,68,.16);
  border-radius: 10px; padding: 14px 16px;
}
.ap-alerta-hdr  { display: flex; align-items: center; gap: 8px; }
.ap-alerta-icon { font-size: 9px; color: var(--red); }
.ap-alerta-tag  { font-size: 8px; font-weight: 800; letter-spacing: .12em; color: var(--red); opacity: .7; }
.ap-alerta-text { font-size: 12px; color: var(--t2); line-height: 1.8; }

.ap-disclaimer {
  font-size: 10px; color: var(--t3); text-align: center;
  padding-top: 8px; border-top: 1px solid var(--border); line-height: 1.6;
}

/* ─ History ────────────────────────────────────────────────────────────────── */
.ap-hist-list { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
.ap-hist-row {
  display: grid; grid-template-columns: 52px 1fr 58px 70px 30px 64px 46px;
  align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 9px;
  background: var(--panel); border: 1px solid var(--border);
  cursor: pointer; width: 100%; text-align: left; font-family: inherit; color: inherit;
  transition: border-color .12s;
}
.ap-hist-row:hover { border-color: var(--bmd); }
.ap-hist-id    { font-family: 'Courier New', monospace; font-size: 9px; color: var(--t3); }
.ap-hist-event { font-size: 11px; color: var(--t2); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ap-hist-odd   { font-size: 10px; color: var(--t3); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ap-hist-bar   { height: 3px; background: rgba(255,255,255,.05); border-radius: 99px; overflow: hidden; }
.ap-hist-score { font-size: 12px; font-weight: 800; text-align: right; font-variant-numeric: tabular-nums; }
.ap-hist-tag   { font-size: 8px; font-weight: 800; letter-spacing: .05em; padding: 2px 6px; border-radius: 4px; border: 1px solid; }
.ap-hist-ts    { font-size: 9px; color: var(--t3); white-space: nowrap; font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace; }

/* ─ Config ─────────────────────────────────────────────────────────────────── */
.ap-empty { font-size: 13px; color: var(--t3); text-align: center; padding: 52px 0; }
.ap-config-panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px 20px; margin-top: 10px;
  display: flex; flex-direction: column; gap: 16px;
}
.ap-config-field { display: flex; flex-direction: column; gap: 8px; }
.ap-config-hint  { font-size: 11px; color: var(--t3); line-height: 1.65; }
.ap-config-info  { display: flex; flex-direction: column; border-top: 1px solid var(--border); padding-top: 14px; }
.ap-config-row {
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--t2); padding: 9px 0;
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.ap-config-row span:last-child { color: var(--t3); font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace; font-size: 11px; }
.ap-config-online { color: rgba(34,197,94,.6) !important; }

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD DE RESULTADO — componentes db-*
   ═══════════════════════════════════════════════════════════════════════════ */

@keyframes db-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes db-card-in {
  from { opacity: 0; transform: translateY(6px) scale(.99); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}
@keyframes db-bar-in {
  from { width: 0; }
}

/* ── Wrapper ──────────────────────────────────────────────────────────────── */
.db-output {
  display: flex; flex-direction: column; gap: 10px;
  animation: db-in .25s ease both;
}

/* ── Topbar ───────────────────────────────────────────────────────────────── */
.db-topbar {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 8px;
}
.db-topbar-meta  { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.db-id   { font-size: 9px; font-weight: 800; letter-spacing: .14em; color: rgba(34,197,94,.5); font-family: 'Courier New', monospace; }
.db-ts   { font-size: 10px; color: var(--t3); font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace; }
.db-sep  { color: var(--t3); font-size: 10px; }
.db-ai-badge {
  display: flex; align-items: center; gap: 5px;
  font-size: 9px; font-weight: 700; letter-spacing: .05em; color: var(--t3);
}
.db-ai-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--green);
  animation: ap-pulse 2.5s ease-in-out infinite;
}
.db-btn-ghost {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 700; color: var(--t2);
  background: rgba(255,255,255,.04); border: 1px solid var(--border);
  border-radius: 6px; padding: 5px 13px; cursor: pointer;
  transition: all .14s; font-family: inherit; letter-spacing: .04em;
}
.db-btn-ghost:hover { color: var(--t1); border-color: var(--bmd); }

/* ── Event strip ──────────────────────────────────────────────────────────── */
.db-event-strip {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 11px 16px;
}
.db-strip-sep {
  width: 1px; height: 12px; background: var(--border); flex-shrink: 0;
}
.db-event-name  { font-size: 13px; font-weight: 700; color: var(--t1); letter-spacing: -0.02em; }
.db-event-tag   { font-size: 11px; font-weight: 600; color: var(--t2); }
.db-event-odd   { font-size: 11px; color: var(--t3); font-variant-numeric: tabular-nums; }
.db-event-odd strong { color: var(--t1); font-weight: 700; }
.db-event-valor { font-size: 11px; color: var(--t3); font-variant-numeric: tabular-nums; }

/* ── Cards grid ───────────────────────────────────────────────────────────── */
.db-cards {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-rows: auto auto;
  gap: 8px;
}
.db-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 18px 18px;
  display: flex; flex-direction: column; gap: 10px;
  animation: db-card-in .28s ease both;
  transition: border-color .14s;
}
.db-card:hover { border-color: var(--bmd); }

.db-card-label {
  font-size: 8.5px; font-weight: 800; letter-spacing: .18em;
  color: var(--t3); text-transform: uppercase;
}

/* ── Card 1: Risco ────────────────────────────────────────────────────────── */
.db-card-risco { grid-column: 1 / -1; } /* full width */

.db-risco-score {
  font-size: 72px; font-weight: 900; line-height: 1;
  letter-spacing: -0.06em; font-variant-numeric: tabular-nums;
  transition: color .4s;
}
.db-risco-denom { font-size: 26px; font-weight: 600; color: var(--t3); letter-spacing: 0; }

.db-rbar-wrap { display: flex; flex-direction: column; gap: 6px; }
.db-rbar-track {
  position: relative; height: 8px; border-radius: 99px; overflow: visible;
  display: flex; gap: 2px;
}
.db-rbar-zone {
  flex: 1; height: 8px; border-radius: 99px;
}
.db-rbar-z1 { background: rgba(34,197,94,.25); }
.db-rbar-z2 { background: rgba(245,158,11,.25); }
.db-rbar-z3 { background: rgba(249,115,22,.25); }
.db-rbar-z4 { background: rgba(239,68,68,.25); }
.db-rbar-marker {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--t1); border: 2px solid var(--panel);
  box-shadow: 0 0 0 3px rgba(255,255,255,.18);
  transition: left .6s cubic-bezier(.22,.68,0,1.2);
  z-index: 2;
}
.db-rbar-labels {
  display: flex; justify-content: space-between;
  font-size: 7.5px; font-weight: 700; letter-spacing: .06em; color: var(--t3);
}

.db-card-level {
  font-size: 13px; font-weight: 800; letter-spacing: .1em;
  text-transform: uppercase; transition: color .4s;
}
.db-card-sub {
  font-size: 12px; color: var(--t3); line-height: 1.55;
}

/* ── Cards 2–4 shared ─────────────────────────────────────────────────────── */
.db-big-num {
  font-size: 42px; font-weight: 900; line-height: 1;
  letter-spacing: -0.05em; font-variant-numeric: tabular-nums;
}
.db-big-sym { font-size: 22px; font-weight: 600; color: var(--t3); }
.db-big-green { color: #22C55E; }
.db-big-red   { color: #EF4444; font-size: 32px; }

.db-mini-table { display: flex; flex-direction: column; gap: 5px; margin-top: 2px; }
.db-mini-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; color: var(--t3); gap: 8px;
}
.db-mini-row span:last-child {
  font-weight: 700; font-variant-numeric: tabular-nums; text-align: right;
  color: var(--t2);
}
.db-green  { color: #22C55E !important; }
.db-amber  { color: #F59E0B !important; }
.db-red    { color: #EF4444 !important; }
.db-muted  { color: var(--t3) !important; font-weight: 500 !important; }

/* ── Card 4: Leitura IA ───────────────────────────────────────────────────── */
.db-leitura-status {
  display: flex; align-items: center; gap: 9px;
  font-size: 18px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2;
  transition: color .3s;
}
.db-leitura-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  animation: ap-pulse 2.8s ease-in-out infinite;
}
.db-leitura-detail {
  display: flex; flex-direction: column; gap: 4px;
  background: rgba(255,255,255,.025); border: 1px solid var(--border);
  border-radius: 8px; padding: 10px 12px; margin-top: 2px;
}
.db-leitura-detail-lbl {
  font-size: 8px; font-weight: 800; letter-spacing: .12em; color: var(--t3); text-transform: uppercase;
}
.db-leitura-detail-txt { font-size: 11.5px; color: var(--t2); line-height: 1.65; }

/* ── Summary ──────────────────────────────────────────────────────────────── */
.db-summary {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 12px;
}
.db-summary-hdr {
  display: flex; justify-content: space-between; align-items: center;
}
.db-summary-title {
  font-size: 8.5px; font-weight: 800; letter-spacing: .16em; color: var(--t3); text-transform: uppercase;
}
.db-summary-tag {
  font-size: 8px; font-weight: 700; letter-spacing: .06em; color: rgba(34,197,94,.38);
}
.db-bullets { display: flex; flex-direction: column; gap: 8px; list-style: none; }
.db-bullet {
  display: flex; align-items: flex-start; gap: 9px;
  font-size: 12.5px; color: var(--t2); line-height: 1.7;
}
.db-bullet-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: rgba(34,197,94,.4); flex-shrink: 0; margin-top: 6px;
}

/* ── Actions ──────────────────────────────────────────────────────────────── */
.db-actions {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.db-btn-primary {
  display: flex; align-items: center; gap: 7px;
  background: var(--t1); color: #060608;
  font-size: 11px; font-weight: 900; letter-spacing: .12em;
  padding: 12px 22px; border-radius: 8px; border: none; cursor: pointer;
  font-family: inherit; transition: opacity .14s, transform .1s;
}
.db-btn-primary:hover  { opacity: .88; transform: translateY(-1px); }
.db-btn-primary:active { transform: translateY(0); opacity: .95; }
.db-btn-copy {
  display: flex; align-items: center; gap: 7px;
  background: transparent; color: var(--t2);
  font-size: 11px; font-weight: 700; letter-spacing: .08em;
  padding: 11px 18px; border-radius: 8px;
  border: 1px solid var(--border); cursor: pointer;
  font-family: inherit; transition: all .14s;
}
.db-btn-copy:hover { color: var(--t1); border-color: var(--bmd); background: rgba(255,255,255,.03); }

/* ── Disclaimer ───────────────────────────────────────────────────────────── */
.db-disclaimer {
  font-size: 10px; color: var(--t3); text-align: center;
  padding-top: 6px; border-top: 1px solid var(--border); line-height: 1.6;
}

/* ─ Tipo description ───────────────────────────────────────────────────────── */
@keyframes ap-desc-in {
  from { opacity: 0; transform: translateY(-3px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ap-tipo-desc {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 11.5px; color: rgba(255,255,255,.55); line-height: 1.6;
  padding: 9px 12px;
  background: rgba(34,197,94,.06);
  border: 1px solid rgba(34,197,94,.14);
  border-radius: 8px;
  animation: ap-desc-in .18s ease both;
}
.ap-tipo-desc-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--green); flex-shrink: 0;
  margin-top: 5px; opacity: .75;
  animation: ap-pulse 2.4s ease-in-out infinite;
}

/* ─ Custom Select ──────────────────────────────────────────────────────────── */
@keyframes sel-open {
  from { opacity: 0; transform: translateY(-5px) scaleY(.96); }
  to   { opacity: 1; transform: translateY(0)    scaleY(1); }
}

.sel-wrap {
  position: relative; width: 100%;
}

.sel-trigger {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  width: 100%; padding: 11px 13px;
  background: rgba(255,255,255,.048); border: 1px solid rgba(255,255,255,.13);
  border-radius: 8px; cursor: pointer; font-family: inherit;
  font-size: 14px; font-weight: 500; color: #E8E8E6;
  outline: none; text-align: left;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04), inset 0 -1px 0 rgba(0,0,0,.15);
  transition: border-color .18s ease-out, background .18s ease-out, box-shadow .18s ease-out;
  -webkit-appearance: none; appearance: none;
}
.sel-trigger:hover {
  background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.18);
}
.sel-trigger-open {
  border-color: rgba(34,197,94,.38) !important;
  background: rgba(22,163,74,.03) !important;
  box-shadow: 0 0 0 3px rgba(22,163,74,.08), inset 0 1px 0 rgba(255,255,255,.04);
}

.sel-val {
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 14px; font-weight: 500; color: var(--t1);
}

.sel-chev {
  display: flex; align-items: center; justify-content: center;
  color: var(--t3); flex-shrink: 0;
  transition: transform .18s ease, color .14s;
}
.sel-chev-up { transform: rotate(180deg); color: rgba(34,197,94,.6); }

.sel-list {
  position: absolute; top: calc(100% + 5px); left: 0; right: 0; z-index: 200;
  background: #0D0D12; border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px; padding: 5px;
  max-height: 228px; overflow-y: auto;
  list-style: none;
  box-shadow: 0 16px 48px rgba(0,0,0,.7), 0 2px 12px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.04);
  animation: sel-open .16s cubic-bezier(.22,.68,0,1.2) both;
  transform-origin: top center;

  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.08) transparent;
}
.sel-list::-webkit-scrollbar { width: 4px; }
.sel-list::-webkit-scrollbar-track { background: transparent; }
.sel-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 99px; }
.sel-list::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.14); }

.sel-opt {
  display: flex; align-items: center; gap: 9px;
  padding: 8.5px 10px; border-radius: 7px; cursor: pointer;
  font-size: 13px; font-weight: 500; color: var(--t2);
  transition: background .1s, color .1s;
  user-select: none;
}
.sel-opt:hover {
  background: rgba(255,255,255,.055); color: var(--t1);
}
.sel-opt-on {
  background: rgba(34,197,94,.08) !important;
  color: #22C55E !important;
}
.sel-opt-on:hover { background: rgba(34,197,94,.12) !important; }

.sel-check {
  width: 16px; height: 16px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #22C55E;
}

.sel-opt-text { flex: 1; }

/* ─ Mobile ─────────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .ap-hamburger { display: flex; }
  /* Extra 8px of vertical breathing room for logo and menu */
  .ap-topbar-row { height: 54px; }
  .ap-sidebar {
    position: fixed;
    /* Sidebar anchors below taller mobile topbar + safe area */
    top: calc(54px + env(safe-area-inset-top));
    left: 0; bottom: 0;
    z-index: 50; transform: translateX(-100%);
    width: 230px; box-shadow: 6px 0 32px rgba(0,0,0,.6);
  }
  .ap-sidebar-open { transform: translateX(0); }
}
@media (max-width: 640px) {
  .ap-content { padding: 12px 12px; }
  .ap-topbar-row { padding: 0 12px; }
  /* Mobile status: show text label, hide the pulsing dot (no floating dot bug) */
  .ap-live-dot { display: none; }
  .ap-engine-live { font-size: 8px; letter-spacing: .06em; gap: 0; }
  .ap-topbar-tag { display: none; }
  .ap-topbar-aid { display: none; }
  .ap-geral-stats { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .ap-geral-action { flex-direction: column; align-items: flex-start; }
  .ap-geral-recent-row { grid-template-columns: 1fr 36px 28px 50px; }
  .ap-geral-recent-id, .ap-geral-recent-odd, .ap-geral-recent-bar { display: none; }
  .ap-metrics-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .ap-ai-grid { grid-template-columns: minmax(0, 1fr); }
  .ap-row-2 { grid-template-columns: minmax(0, 1fr); }
  .ap-score-hero { flex-direction: column; align-items: flex-start; gap: 18px; padding: 18px 16px; }
  .ap-score-data-lbl { min-width: 80px; }
  .ap-hist-row { grid-template-columns: 1fr 36px 28px 52px; }
  .ap-hist-id, .ap-hist-odd, .ap-hist-bar, .ap-hist-ts { display: none; }
  .ap-loading-pct { font-size: 44px; }

  /* Form mobile — compact for first-fold visibility */
  .ap-input-panel { padding: 16px 14px 18px; border-radius: 12px; }
  .ap-form { gap: 11px; }
  .ap-field { gap: 5px; }
  .ap-input { padding: 9px 11px; font-size: 13.5px; }
  .ap-input-odd { font-size: 20px; }
  .ap-submit { padding: 14px 20px; font-size: 11.5px; margin-top: 4px; }

  /* Dashboard mobile */
  .db-cards { grid-template-columns: minmax(0, 1fr); }
  .db-card-risco { grid-column: 1; }
  .db-risco-score { font-size: 56px; }
  .db-big-num { font-size: 36px; }
  .db-big-red { font-size: 28px; }
  .db-leitura-status { font-size: 16px; }
  .db-card { padding: 16px 15px; }
  .db-event-strip { gap: 7px; padding: 10px 13px; }
  .db-actions { flex-direction: column; align-items: stretch; }
  .db-btn-primary, .db-btn-copy { justify-content: center; padding: 14px 20px; }
  .db-rbar-labels { font-size: 7px; }

  /* Result card mobile */
  .db-rc-header { padding: 14px 16px 12px; }
  .db-rc-event  { font-size: 15px; }
  .db-rc-risk   { padding: 14px 16px; }
  .db-rc-score  { font-size: 48px; }
  .db-rc-data   { padding: 14px 16px; flex-direction: column; gap: 16px; }
  .db-rc-data-sep { width: 100%; height: 1px; align-self: auto; margin: 0; }
  .db-rc-big    { font-size: 28px; }
  .db-rc-ai     { padding: 14px 16px; }
  .db-rc-ai-verdict { font-size: 15px; }
}

/* ─ Form separator (optional section) ─────────────────────────────────────── */
.ap-form-sep {
  display: flex; align-items: center; gap: 12px;
  padding: 4px 0;
}
.ap-form-sep::before,
.ap-form-sep::after {
  content: ''; flex: 1; height: 1px; background: rgba(255,255,255,.06);
}
.ap-form-sep-lbl {
  font-size: 8px; font-weight: 700; letter-spacing: .16em;
  color: var(--t3); text-transform: uppercase; flex-shrink: 0;
}

/* ─ Select placeholder state ───────────────────────────────────────────────── */
.sel-placeholder { color: rgba(255,255,255,.32) !important; }
.sel-opt-dim { color: var(--t3) !important; font-style: italic; }

/* ─ Result Card — db-rc-* ──────────────────────────────────────────────────── */
.db-result-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  animation: db-card-in .28s ease both;
  transition: border-color .14s;
}
.db-result-card:hover { border-color: var(--bmd); }

/* Header */
.db-rc-header {
  padding: 16px 20px 14px;
  display: flex; flex-direction: column; gap: 8px;
}
.db-rc-event {
  font-size: 18px; font-weight: 800;
  color: var(--t1); letter-spacing: -0.03em; line-height: 1.15;
}
.db-rc-meta {
  display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
}
.db-rc-badge {
  padding: 3px 9px; border-radius: 5px;
  background: rgba(255,255,255,.06); border: 1px solid var(--border);
  font-size: 9.5px; font-weight: 700; letter-spacing: .05em;
  color: var(--t3); text-transform: uppercase;
}
.db-rc-odd {
  font-size: 11px; font-weight: 700;
  color: var(--t2); font-variant-numeric: tabular-nums;
}
.db-rc-valor {
  font-size: 11px; color: var(--t3);
  font-variant-numeric: tabular-nums;
}

/* Divider */
.db-rc-divider { height: 1px; background: var(--border); }

/* Shared section label */
.db-rc-label {
  font-size: 8px; font-weight: 800; letter-spacing: .18em;
  color: var(--t3); text-transform: uppercase; display: block;
}

/* Risk section */
.db-rc-risk {
  padding: 16px 20px; display: flex; flex-direction: column; gap: 10px;
}
.db-rc-risk-top {
  display: flex; justify-content: space-between; align-items: center;
}
.db-rc-level {
  font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase;
}
.db-rc-score {
  font-size: 60px; font-weight: 900; line-height: 1;
  letter-spacing: -0.06em; font-variant-numeric: tabular-nums;
  transition: color .4s;
}
.db-rc-score-denom {
  font-size: 22px; font-weight: 600; color: var(--t3); letter-spacing: 0;
}
.db-rc-phrase {
  font-size: 12px; color: var(--t3); line-height: 1.55; margin-top: -2px;
}

/* Data section */
.db-rc-data {
  padding: 16px 20px;
  display: flex; align-items: flex-start; gap: 0;
}
.db-rc-data-item {
  flex: 1; display: flex; flex-direction: column; gap: 5px;
}
.db-rc-data-sep {
  width: 1px; background: var(--border); flex-shrink: 0;
  align-self: stretch; margin: 0 20px;
}
.db-rc-big {
  font-size: 34px; font-weight: 900; line-height: 1;
  letter-spacing: -0.05em; font-variant-numeric: tabular-nums;
  color: var(--t1);
}
.db-rc-big-green { color: #22C55E; }
.db-rc-sym {
  font-size: 18px; font-weight: 600; color: var(--t3); letter-spacing: 0;
}
.db-rc-sub {
  font-size: 11px; color: var(--t3); line-height: 1.5;
}

/* AI section */
.db-rc-ai {
  padding: 16px 20px; display: flex; flex-direction: column; gap: 8px;
}
.db-rc-ai-verdict {
  display: flex; align-items: center; gap: 8px;
  font-size: 18px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2;
  transition: color .3s;
}
.db-rc-ai-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  animation: ap-pulse 2.8s ease-in-out infinite;
}
.db-rc-ai-sentence {
  font-size: 12.5px; color: var(--t2); line-height: 1.7;
  font-style: italic;
  background: rgba(255,255,255,.025); border: 1px solid var(--border);
  border-radius: 8px; padding: 10px 12px; margin-top: 2px;
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOGOS DE HOJE — jg-* components
   ═══════════════════════════════════════════════════════════════════════════ */

@keyframes jg-card-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes jg-dot-bounce {
  0%, 80%, 100% { transform: scale(0.4); opacity: .3; }
  40%           { transform: scale(1);   opacity: 1; }
}

/* Loading state */
.jg-loading {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 48px 0;
}
.jg-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--t3);
  animation: jg-dot-bounce 1.4s ease-in-out infinite;
}
.jg-dot:nth-child(2) { animation-delay: .18s; }
.jg-dot:nth-child(3) { animation-delay: .36s; }
.jg-loading-lbl {
  font-size: 11px; color: var(--t3); margin-left: 8px; letter-spacing: .03em;
}

/* League filter pills */
.jg-filters {
  display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 2px;
}
.jg-pill {
  padding: 5px 13px; border-radius: 99px;
  background: rgba(255,255,255,.04); border: 1px solid var(--border);
  font-size: 10px; font-weight: 700; letter-spacing: .04em; color: var(--t2);
  cursor: pointer; font-family: inherit; transition: all .13s;
  white-space: nowrap;
}
.jg-pill:hover { color: var(--t1); border-color: var(--bmd); background: rgba(255,255,255,.07); }
.jg-pill-on {
  background: rgba(34,197,94,.1) !important;
  border-color: rgba(34,197,94,.3) !important;
  color: var(--green) !important;
}

/* Match cards grid */
.jg-grid {
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px;
}

.jg-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 13px;
  cursor: pointer; font-family: inherit; text-align: left;
  width: 100%; color: inherit;
  transition: border-color .15s, transform .13s, background .15s, box-shadow .15s;
  animation: jg-card-in .24s ease both;
}
.jg-card:hover {
  border-color: rgba(34,197,94,.26);
  background: rgba(34,197,94,.03);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0,0,0,.3), 0 0 0 1px rgba(34,197,94,.06) inset;
}
.jg-card:active { transform: translateY(0); }

.jg-card-header {
  display: flex; justify-content: space-between; align-items: center; gap: 6px;
}
.jg-league {
  font-size: 8px; font-weight: 800; letter-spacing: .14em;
  color: var(--t3); text-transform: uppercase;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.jg-time {
  font-size: 10px; font-weight: 700; color: var(--t2);
  font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.jg-teams {
  display: flex; align-items: center; gap: 8px;
}
.jg-team {
  font-size: 13px; font-weight: 700; color: var(--t1);
  letter-spacing: -0.02em; line-height: 1.25; flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.jg-team-away { text-align: right; }
.jg-vs {
  font-size: 10px; font-weight: 700; color: var(--t3); flex-shrink: 0;
}

.jg-card-footer { display: flex; justify-content: flex-end; }
.jg-cta {
  font-size: 9.5px; font-weight: 800; letter-spacing: .06em;
  color: rgba(34,197,94,.4); transition: color .13s; text-transform: uppercase;
}
.jg-card:hover .jg-cta { color: var(--green); }

/* Hint text */
.jg-hint {
  font-size: 10.5px; color: var(--t3); text-align: center;
  padding: 4px 0 6px; line-height: 1.6; opacity: .7;
}

/* ─ Selected game strip ─────────────────────────────────────────────────────── */
.ap-game-strip {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  background: rgba(34,197,94,.06);
  border: 1px solid rgba(34,197,94,.2);
  border-radius: 10px; padding: 10px 14px;
  animation: ap-fade-up .18s ease both;
}
.ap-game-strip-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--green);
  flex-shrink: 0; animation: ap-pulse 2.4s ease-in-out infinite;
}
.ap-game-strip-text {
  font-size: 13px; font-weight: 700; color: var(--t1);
  letter-spacing: -0.02em; flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ap-game-strip-league {
  font-size: 9px; font-weight: 800; letter-spacing: .1em;
  color: rgba(34,197,94,.7); text-transform: uppercase; flex-shrink: 0;
}
.ap-game-strip-time {
  font-size: 10px; color: var(--t3); font-variant-numeric: tabular-nums;
  font-family: 'Courier New', monospace; flex-shrink: 0;
}
.ap-game-strip-clear {
  background: none; border: none; cursor: pointer;
  font-size: 16px; color: var(--t3); line-height: 1;
  padding: 0 2px; display: flex; align-items: center; justify-content: center;
  transition: color .12s; flex-shrink: 0; width: 20px; height: 20px;
}
.ap-game-strip-clear:hover { color: var(--t1); }

/* Mobile responsive */
@media (max-width: 640px) {
  .jg-grid { grid-template-columns: minmax(0, 1fr); }
  .jg-card { padding: 14px 15px; gap: 11px; }
  .jg-team { font-size: 12.5px; }
  .ap-game-strip { padding: 9px 12px; }
  .ap-game-strip-text { font-size: 12px; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOGOS v2 — premium match cards + live status
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Panel header right block ──────────────────────────────────────────────── */
.jg-hdr-right {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
.jg-data-badge {
  display: flex; align-items: center; gap: 5px;
  font-size: 7.5px; font-weight: 800; letter-spacing: .13em;
  color: rgba(34,197,94,.6);
  background: rgba(34,197,94,.06); border: 1px solid rgba(34,197,94,.16);
  border-radius: 99px; padding: 4px 9px; white-space: nowrap;
}
.jg-data-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--green); flex-shrink: 0;
  animation: ap-pulse 2.2s ease-in-out infinite;
}
.jg-updated {
  font-size: 8.5px; color: var(--t3); font-variant-numeric: tabular-nums;
  font-family: 'Courier New', monospace; letter-spacing: .03em; flex-shrink: 0;
}
.jg-refresh-btn {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
  background: rgba(255,255,255,.04); border: 1px solid var(--border);
  color: var(--t2); cursor: pointer; transition: all .13s; flex-shrink: 0;
}
.jg-refresh-btn:hover:not(:disabled) { color: var(--t1); border-color: var(--bmd); background: rgba(255,255,255,.07); }
.jg-refresh-btn:disabled { opacity: .35; cursor: not-allowed; }

/* ── Status rows ───────────────────────────────────────────────────────────── */
.jg-status-row {
  display: flex; align-items: center; gap: 5px; min-height: 14px;
}
.jg-live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #EF4444; flex-shrink: 0;
  animation: ap-pulse 1.4s ease-in-out infinite;
}
.jg-status-live-text {
  font-size: 7.5px; font-weight: 800; letter-spacing: .14em; color: #EF4444; text-transform: uppercase;
}
.jg-elapsed {
  font-size: 10px; font-weight: 700; color: rgba(239,68,68,.65);
  font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace;
}
.jg-status-ended-text {
  font-size: 7.5px; font-weight: 800; letter-spacing: .12em; color: var(--t3); text-transform: uppercase;
}

/* ── Match layout ──────────────────────────────────────────────────────────── */
.jg-matchup {
  display: flex; align-items: center; gap: 8px; min-width: 0;
}
.jg-team-name {
  font-size: 13px; font-weight: 700; color: var(--t1);
  letter-spacing: -0.02em; flex: 1; line-height: 1.2;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.jg-team-right { text-align: right; }
.jg-score-center { flex-shrink: 0; }
.jg-score-pair { display: flex; align-items: center; gap: 2px; }
.jg-score-num {
  font-size: 20px; font-weight: 900; line-height: 1;
  font-variant-numeric: tabular-nums; color: var(--t1); min-width: 16px; text-align: center;
}
.jg-score-dash { font-size: 11px; color: var(--t3); font-weight: 700; margin: 0 1px; }

/* ── Card state variants ───────────────────────────────────────────────────── */

/* Live: red-tinted border, pulsing glow */
@keyframes jg-live-pulse {
  0%, 100% { border-color: rgba(239,68,68,.18); }
  50%       { border-color: rgba(239,68,68,.38); box-shadow: 0 0 18px rgba(239,68,68,.07); }
}
.jg-card-live {
  border-color: rgba(239,68,68,.2);
  animation: jg-card-in .24s ease both, jg-live-pulse 2.4s ease-in-out infinite;
}
.jg-card-live:hover {
  animation: none !important;
  border-color: rgba(239,68,68,.45) !important;
  background: rgba(239,68,68,.03) !important;
  transform: translateY(-2px);
}
.jg-card-live .jg-team-name { color: var(--t1); }

/* Ended: dimmed */
.jg-card-ended { opacity: .55; }
.jg-card-ended:hover {
  opacity: .78; transform: translateY(-1px) !important;
  border-color: var(--bmd) !important; background: rgba(255,255,255,.02) !important;
  box-shadow: none !important;
}
.jg-card-ended .jg-team-name { color: var(--t2); }
.jg-card-ended .jg-score-num { color: var(--t2); }
.jg-card-ended .jg-cta { color: rgba(255,255,255,.16); }

/* ── Filter pill live variant ──────────────────────────────────────────────── */
.jg-pill-live { color: rgba(239,68,68,.65) !important; }
.jg-pill-live.jg-pill-on {
  background: rgba(239,68,68,.1) !important;
  border-color: rgba(239,68,68,.28) !important;
  color: #EF4444 !important;
}
.jg-pill-dot {
  display: inline-block; width: 5px; height: 5px; border-radius: 50%;
  background: currentColor; margin-right: 4px; vertical-align: middle;
  animation: ap-pulse 1.4s ease-in-out infinite;
}

/* ── Error retry button ────────────────────────────────────────────────────── */
.jg-retry-btn {
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: var(--t1); cursor: pointer;
  background: var(--bg); border: 1px solid var(--border); font-family: inherit;
  border-radius: 8px; padding: 8px 16px; transition: border-color .18s;
}
.jg-retry-btn:hover { border-color: var(--t3); }

/* ── Disclaimer ────────────────────────────────────────────────────────────── */
.jg-disclaimer {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 10.5px; color: var(--t3); line-height: 1.65;
  padding: 11px 14px;
  background: rgba(255,255,255,.02); border: 1px solid var(--border);
  border-radius: 9px;
}
.jg-disclaimer svg { flex-shrink: 0; margin-top: 2px; opacity: .45; }

/* ── Selected game strip — live variant ────────────────────────────────────── */
.ap-game-strip-live {
  background: rgba(239,68,68,.05) !important;
  border-color: rgba(239,68,68,.22) !important;
}
.ap-gsd-live { background: #EF4444 !important; }
.ap-gsd-live-badge {
  font-size: 8.5px; font-weight: 800; letter-spacing: .1em;
  color: rgba(239,68,68,.75); text-transform: uppercase; flex-shrink: 0;
  animation: ap-blink 1.6s ease-in-out infinite;
}

/* ── Odd sugestiva ─────────────────────────────────────────────────────────── */
.ap-odd-sug {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 9px 13px;
  background: rgba(34,197,94,.04); border: 1px solid rgba(34,197,94,.14);
  border-radius: 8px; animation: ap-fade-up .17s ease both;
}
.ap-odd-sug-icon { font-size: 12px; flex-shrink: 0; line-height: 1; }
.ap-odd-sug-text {
  font-size: 11.5px; color: var(--t2); flex: 1; min-width: 0; line-height: 1.4;
}
.ap-odd-sug-text em  { font-style: normal; color: var(--t1); font-weight: 600; }
.ap-odd-sug-text strong { color: var(--green); font-weight: 800; }
.ap-odd-sug-btn {
  padding: 5px 13px; border-radius: 6px; flex-shrink: 0;
  background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.22);
  color: var(--green); font-size: 10px; font-weight: 800; letter-spacing: .06em;
  cursor: pointer; font-family: inherit; white-space: nowrap;
  transition: background .12s, border-color .12s;
}
.ap-odd-sug-btn:hover { background: rgba(34,197,94,.18); border-color: rgba(34,197,94,.38); }

/* ── Jogos v2 mobile ───────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .jg-data-badge { display: none; }  /* too wide on narrow screens */
  .jg-hdr-right { gap: 6px; }
  .jg-team-name { font-size: 12px; }
  .jg-score-num { font-size: 18px; }
  .jg-disclaimer { font-size: 10px; }
  .ap-odd-sug { padding: 8px 11px; }
  .ap-odd-sug-text { font-size: 11px; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   FLOW — 3-step primary flow (fl-* components)
   JOGOS → MERCADO → RESULTADO: zero-friction analysis in <15 seconds
   ═══════════════════════════════════════════════════════════════════════════ */

@keyframes fl-step-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Content wrapper (flow variant) ───────────────────────────────────────── */
.ap-content-flow {
  max-width: 600px;
  padding-top: 20px;
}

/* ── Step wrapper ─────────────────────────────────────────────────────────── */
.fl-step {
  display: flex; flex-direction: column; gap: 14px;
  animation: fl-step-in .2s ease both;
}

/* ── Back button ──────────────────────────────────────────────────────────── */
.fl-back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  font-size: 11.5px; font-weight: 700; color: var(--t2);
  font-family: inherit; padding: 0; letter-spacing: .02em;
  align-self: flex-start; transition: color .13s;
}
.fl-back-btn:hover { color: var(--t1); }

/* ── Game hero card (large match display in mercado step) ─────────────────── */
.fl-game-hero {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 14px; padding: 20px 22px;
  display: flex; flex-direction: column; gap: 14px;
}
.fl-game-hero-live {
  border-color: rgba(239,68,68,.25);
  background: rgba(239,68,68,.025);
}

.fl-hero-meta {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.fl-hero-league {
  font-size: 9px; font-weight: 800; letter-spacing: .16em;
  color: var(--t3); text-transform: uppercase;
}
.fl-hero-time {
  font-size: 12px; font-weight: 700; color: var(--t2);
  font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace;
}
.fl-hero-status-live {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 800; letter-spacing: .1em; color: #EF4444;
}
.fl-hero-live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #EF4444; flex-shrink: 0;
  animation: ap-pulse 1.4s ease-in-out infinite;
}

/* Teams row — prominent match display */
.fl-teams {
  display: flex; align-items: center; gap: 12px;
}
.fl-team {
  font-size: 22px; font-weight: 900; color: var(--t1);
  letter-spacing: -0.04em; flex: 1; line-height: 1.1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.fl-team-right { text-align: right; }
.fl-vs {
  font-size: 14px; font-weight: 700; color: var(--t3); flex-shrink: 0;
}

/* ── Section header ───────────────────────────────────────────────────────── */
.fl-section-hdr {
  font-size: 8px; font-weight: 800; letter-spacing: .2em;
  color: var(--t3); text-transform: uppercase;
  margin-top: 2px; margin-bottom: -2px;
}

/* ── Market grid (2 × 3 = 6 buttons) ─────────────────────────────────────── */
.fl-market-grid {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;
}

.fl-market-btn {
  display: flex; flex-direction: column; gap: 5px;
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 13px 14px;
  cursor: pointer; font-family: inherit; text-align: left;
  transition: border-color .14s, background .14s, transform .12s;
}
.fl-market-btn:hover {
  border-color: rgba(34,197,94,.32);
  background: rgba(34,197,94,.04);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,.25);
}
.fl-market-btn:active { transform: translateY(0); }

.fl-market-name {
  font-size: 11.5px; font-weight: 700; color: var(--t1);
  letter-spacing: -0.01em; line-height: 1.3;
}
.fl-market-ref {
  font-size: 9px; font-weight: 700; letter-spacing: .04em;
  color: rgba(34,197,94,.6); font-family: 'Courier New', monospace;
}

/* ── Separator ────────────────────────────────────────────────────────────── */
.fl-sep {
  display: flex; align-items: center; gap: 10px; margin: 2px 0;
}
.fl-sep-line {
  flex: 1; height: 1px; background: rgba(255,255,255,.06);
}
.fl-sep-lbl {
  font-size: 9px; font-weight: 700; letter-spacing: .1em;
  color: var(--t3); text-transform: uppercase; flex-shrink: 0;
}

/* ── Custom odd row ───────────────────────────────────────────────────────── */
.fl-custom-row {
  display: grid; grid-template-columns: 1fr 88px auto; gap: 8px; align-items: end;
}
.fl-custom-tipo { min-width: 0; }
.fl-custom-odd {
  font-size: 18px !important; font-weight: 800 !important;
  letter-spacing: -0.03em !important; padding: 11px 10px !important;
  text-align: center;
}
.fl-custom-submit {
  display: flex; align-items: center; justify-content: center;
  background: #15803d; color: #dcfce7;
  font-size: 10px; font-weight: 900; letter-spacing: .1em;
  padding: 0 16px; border-radius: 8px; border: none; cursor: pointer;
  font-family: inherit; white-space: nowrap; flex-shrink: 0;
  height: 44px; min-width: 80px;
  transition: background .15s, transform .12s;
}
.fl-custom-submit:hover:not(:disabled) {
  background: #166534; transform: translateY(-1px);
}
.fl-custom-submit:active { transform: translateY(0); }
.fl-custom-submit:disabled { opacity: .4; cursor: not-allowed; }

/* ── Manual analysis link (secondary action) ──────────────────────────────── */
.fl-manual-link {
  display: block; text-align: center;
  font-size: 10.5px; font-weight: 700; color: var(--t3);
  background: none; border: none; cursor: pointer; font-family: inherit;
  letter-spacing: .03em; padding: 4px 0;
  transition: color .13s; align-self: center;
}
.fl-manual-link:hover { color: var(--t2); }

/* ── Context strip (resultado step — shows selected game + market) ─────────── */
.fl-ctx-strip {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  background: rgba(34,197,94,.05);
  border: 1px solid rgba(34,197,94,.16);
  border-radius: 10px; padding: 9px 14px;
  animation: ap-fade-up .18s ease both;
}
.fl-ctx-live {
  background: rgba(239,68,68,.04) !important;
  border-color: rgba(239,68,68,.2) !important;
}
.fl-ctx-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--green);
  flex-shrink: 0; animation: ap-pulse 2.4s ease-in-out infinite;
}
.fl-ctx-live .fl-ctx-dot { background: #EF4444; animation-duration: 1.4s; }
.fl-ctx-match {
  font-size: 12px; font-weight: 700; color: var(--t1); letter-spacing: -0.02em;
}
.fl-ctx-sep { color: var(--t3); font-size: 10px; }
.fl-ctx-tipo { font-size: 11px; color: var(--t2); }
.fl-ctx-live-badge {
  font-size: 8px; font-weight: 800; letter-spacing: .1em;
  color: rgba(239,68,68,.8); text-transform: uppercase; flex-shrink: 0;
  animation: ap-blink 1.6s ease-in-out infinite;
}

/* ── Result nav row (← Outro mercado button) ──────────────────────────────── */
.fl-result-nav {
  display: flex; align-items: center;
}

/* ── Retry button (inside error block) ───────────────────────────────────── */
.fl-retry {
  display: inline-block; margin-left: 10px;
  font-size: 11px; font-weight: 700; color: var(--red);
  background: none; border: none; cursor: pointer; font-family: inherit;
  text-decoration: underline; padding: 0;
}

/* ── Reference odd note ───────────────────────────────────────────────────── */
.fl-ref-note {
  font-size: 10px; color: var(--t3); line-height: 1.55;
  padding: 8px 12px;
  background: rgba(255,255,255,.02); border: 1px solid var(--border);
  border-radius: 7px;
}

/* ── Secondary nav item style (Análise Manual) ────────────────────────────── */
.ap-nav-manual { opacity: .72; }
.ap-nav-manual:hover:not(.ap-nav-dim) { opacity: 1; }
.ap-nav-manual.ap-nav-active { opacity: 1; }

/* ── Flow mobile ──────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .ap-content-flow { padding-top: 12px; }
  .fl-game-hero { padding: 16px 16px; }
  .fl-team { font-size: 17px; }
  .fl-market-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .fl-market-btn { padding: 11px 12px; }
  .fl-market-name { font-size: 11px; }
  /* Custom row: tipo spans full width, then odd + submit on row 2 */
  .fl-custom-row {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
  }
  .fl-custom-tipo { grid-column: 1 / -1; }
  .fl-custom-odd { width: auto; text-align: left; }
}

/* ── Status badge (01) ─────────────────────────────────────────────────────── */
.db-status-badge {
  margin: 16px 20px 0;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.06);
  border-left-width: 3px;
  border-left-style: solid;
  padding: 16px 20px;
  display: flex; align-items: center; gap: 12px;
  animation: ap-fade-up .22s ease both;
}
.db-status-icon { font-size: 20px; line-height: 1; flex-shrink: 0; }
.db-status-text {
  font-size: 20px; font-weight: 900;
  letter-spacing: .02em; text-transform: uppercase; line-height: 1.1;
}

/* ── Frase humana (02) ─────────────────────────────────────────────────────── */
.db-frase {
  margin: 14px 20px 0;
  font-size: 17px; font-weight: 400; color: #FFFFFF;
  line-height: 1.5; font-style: italic;
}

/* ── Grid 2×2 de indicadores (03) ─────────────────────────────────────────── */
.db-ind-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  padding: 16px 20px;
}
.db-ind-card {
  background: #111111; border-radius: 10px; padding: 14px;
  display: flex; flex-direction: column; gap: 4px;
}
.db-ind-label {
  font-size: 9px; font-weight: 800; letter-spacing: .14em;
  color: var(--t3); text-transform: uppercase;
}
.db-ind-value {
  font-size: 22px; font-weight: 900; color: #FFFFFF;
  letter-spacing: -0.04em; line-height: 1;
  font-variant-numeric: tabular-nums;
}
.db-ind-micro { font-size: 10px; color: var(--t2); line-height: 1.4; }
.db-ind-pct   { font-size: 10px; color: var(--t3); font-variant-numeric: tabular-nums; }

/* ── Bullets (04) ──────────────────────────────────────────────────────────── */
.db-bullets-block {
  padding: 0 20px 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.db-bullets-title {
  font-size: 9px; font-weight: 800; letter-spacing: .18em;
  color: var(--t3); text-transform: uppercase; margin-bottom: 2px;
}
.db-bullet-item { display: flex; align-items: flex-start; gap: 8px; }
.db-bullet-dot  { color: #1DB954; font-size: 16px; line-height: 1.3; flex-shrink: 0; }
.db-bullet-text {
  font-size: 14px; color: var(--t1); line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}

/* ── Alerta block (05) ─────────────────────────────────────────────────────── */
.db-alerta-block {
  margin: 0 20px 16px;
  background: #1a1200; border: 1px solid rgba(240,180,41,.4);
  border-radius: 10px; padding: 16px;
  display: flex; align-items: flex-start; gap: 10px;
}
.db-alerta-icon { font-size: 16px; color: #F0B429; flex-shrink: 0; line-height: 1.3; }
.db-alerta-text { font-size: 13px; color: var(--t2); line-height: 1.6; margin: 0; }

/* ── Rodapé do card (06) ───────────────────────────────────────────────────── */
.db-rc-footer-divider { height: 1px; background: #222; }
.db-rc-footer-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; gap: 12px;
}
.db-rc-footer-note { font-size: 11px; color: var(--t3); line-height: 1.4; flex: 1; }
.db-copy-btn {
  background: transparent; border: 1px solid #333; color: #999;
  border-radius: 6px; padding: 6px 12px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  font-family: inherit; white-space: nowrap; flex-shrink: 0;
  transition: border-color .12s, color .12s;
}
.db-copy-btn:hover { border-color: #555; color: #CCC; }
.db-copy-btn-done { border-color: rgba(29,185,84,.4) !important; color: #1DB954 !important; }

/* ── Mobile (< 480px) ──────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .db-status-badge { margin: 14px 16px 0; padding: 14px 16px; }
  .db-status-text  { font-size: 18px; }
  .db-frase        { margin: 12px 16px 0; font-size: 15px; }
  .db-ind-grid     { padding: 12px 16px; gap: 6px; }
  .db-ind-card     { padding: 12px; }
  .db-ind-label    { font-size: 10px; }
  .db-ind-value    { font-size: 18px; }
  .db-bullets-block { padding: 0 16px 12px; }
  .db-bullet-text  { font-size: 13px; }
  .db-alerta-block { margin: 0 16px 12px; padding: 12px; }
  .db-alerta-text  { font-size: 13px; }
  .db-rc-footer-row { flex-direction: column; align-items: stretch; gap: 8px; padding: 12px 16px; }
  .db-copy-btn     { width: 100%; text-align: center; padding: 10px 12px; }
}

/* ── H2H block ─────────────────────────────────────────────────────────────── */
.db-h2h {
  background: rgba(255,255,255,.025); border: 1px solid var(--border);
  border-radius: 10px; padding: 12px 14px;
  display: flex; flex-direction: column; gap: 10px;
  animation: ap-fade-up .2s ease both;
}
.db-h2h-title {
  font-size: 9px; font-weight: 800; letter-spacing: .1em; color: var(--t2); text-transform: uppercase;
}
.db-h2h-row {
  display: flex; gap: 0;
}
.db-h2h-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
}
.db-h2h-val {
  font-size: 18px; font-weight: 800; color: var(--t1); letter-spacing: -0.02em;
}
.db-h2h-lbl {
  font-size: 9px; font-weight: 700; color: var(--t2); letter-spacing: .04em;
}

/* ── Forma dots on game cards ──────────────────────────────────────────────── */
.jg-forma-row {
  display: flex; align-items: center; gap: 6px; padding: 4px 0 2px;
}
.jg-forma-side { display: flex; gap: 3px; flex: 1; }
.jg-forma-side-r { justify-content: flex-end; }
.jg-forma-mid { width: 16px; flex-shrink: 0; }
.jg-forma-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
}

/* ── Inline market cards (P4) ──────────────────────────────────────────────── */
.fl-market-list {
  display: flex; flex-direction: column; gap: 6px;
}
.fl-mcard {
  border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
  background: rgba(255,255,255,.02);
  transition: border-color .15s;
}
.fl-mcard-open {
  border-color: rgba(34,197,94,.35);
}
.fl-mcard-hdr {
  display: flex; align-items: center; gap: 10px; padding: 12px 14px;
  background: none; border: none; cursor: pointer; width: 100%;
  font-family: inherit; text-align: left;
  transition: background .12s;
}
.fl-mcard-hdr:hover { background: rgba(255,255,255,.03); }
.fl-mcard-name {
  flex: 1; font-size: 13px; font-weight: 700; color: var(--t1);
}
.fl-mcard-ref {
  font-size: 11px; color: var(--t2); font-weight: 600;
}
.fl-mcard-chev {
  color: var(--t3); flex-shrink: 0; transition: transform .15s;
}
.fl-mcard-body {
  display: flex; flex-direction: column; gap: 8px;
  padding: 10px 12px 12px; border-top: 1px solid var(--border);
}
.fl-mcard-fields {
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px;
}
.fl-mcard-field-wrap { display: flex; flex-direction: column; gap: 4px; }
.fl-mcard-odd-lbl {
  font-size: 10px; font-weight: 700; color: var(--t2); letter-spacing: .05em; white-space: nowrap; text-transform: uppercase;
}
.fl-mcard-odd-input {
  background: rgba(255,255,255,.05); border: 1px solid rgba(34,197,94,.3);
  border-radius: 7px; color: var(--t1); font-family: inherit;
  font-size: 16px; font-weight: 800; letter-spacing: -0.02em;
  padding: 8px 10px; outline: none; min-width: 0; width: 100%;
}
.fl-mcard-odd-input:focus { border-color: rgba(34,197,94,.6); }
.fl-mcard-banca-hint {
  font-size: 10.5px; font-weight: 600; color: var(--green);
  letter-spacing: .02em;
}
.fl-mcard-banca-setup { color: var(--t3); }
.fl-mcard-confirm {
  background: #15803d; color: #dcfce7;
  font-size: 11px; font-weight: 900; letter-spacing: .06em;
  padding: 11px 16px; border-radius: 7px; border: none; cursor: pointer;
  font-family: inherit; width: 100%;
  transition: background .13s;
}
.fl-mcard-confirm:hover { background: #166534; }

/* ═══════════════════════════════════════════════════════════════════════════
   LOCKED STATE — lk-* components
   Card premium exibido quando o usuário não tem token válido.
   SEGURANÇA: a análise real NUNCA foi gerada — API retornou apenas sinais
   parciais sem chamar Anthropic. Score/chance/AI nunca chegam ao DOM.
   ═══════════════════════════════════════════════════════════════════════════ */

@keyframes lk-glow {
  0%, 100% { box-shadow: 0 0 32px rgba(34,197,94,.06), 0 0 0 1px rgba(34,197,94,.1) inset; }
  50%       { box-shadow: 0 0 56px rgba(34,197,94,.12), 0 0 0 1px rgba(34,197,94,.18) inset; }
}

.lk-wrap {
  display: flex; flex-direction: column; gap: 12px;
  animation: db-in .25s ease both;
}

.lk-preview-card {
  position: relative;
  background: var(--panel); border: 1px solid rgba(34,197,94,.14);
  border-radius: 14px; overflow: hidden;
  animation: lk-glow 3.2s ease-in-out infinite;
}

/* Blurred header */
.lk-header {
  padding: 16px 20px 14px;
  display: flex; flex-direction: column; gap: 8px;
}
.lk-header-event {
  font-size: 18px; font-weight: 800;
  color: rgba(255,255,255,.1); letter-spacing: -0.03em;
  filter: blur(4px); user-select: none; pointer-events: none;
}
.lk-header-meta { display: flex; align-items: center; gap: 7px; }
.lk-badge-blur, .lk-odd-blur {
  font-size: 10px; color: rgba(255,255,255,.08);
  filter: blur(3px); user-select: none; pointer-events: none;
  padding: 3px 8px; border-radius: 4px;
  background: rgba(255,255,255,.03);
}

.lk-divider { height: 1px; background: var(--border); }

/* Section label */
.lk-section-label {
  display: block;
  font-size: 8px; font-weight: 800; letter-spacing: .18em;
  color: var(--t3); text-transform: uppercase; margin-bottom: 8px;
}

/* Blurred score */
.lk-risk-row {
  padding: 16px 20px 10px;
  display: flex; align-items: flex-start; justify-content: space-between;
}
.lk-score-blur {
  font-size: 60px; font-weight: 900; line-height: 1;
  letter-spacing: -0.06em; font-variant-numeric: tabular-nums;
  color: rgba(255,255,255,.1); filter: blur(6px);
  user-select: none; pointer-events: none;
}
.lk-score-denom {
  font-size: 22px; font-weight: 600; color: rgba(255,255,255,.06); letter-spacing: 0;
}
.lk-level-blur {
  font-size: 10px; font-weight: 800; letter-spacing: .12em;
  color: rgba(255,255,255,.1); filter: blur(4px);
  user-select: none; pointer-events: none; margin-top: 4px;
}

/* Fake progress bar */
.lk-bar-wrap { padding: 0 20px 14px; }
.lk-bar-track {
  height: 8px; border-radius: 99px;
  background: rgba(255,255,255,.04); overflow: hidden;
}
.lk-bar-fill {
  width: 58%; height: 100%; border-radius: 99px;
  background: rgba(255,255,255,.07); filter: blur(2px);
}

/* Signals — único conteúdo real visível */
.lk-signals {
  padding: 14px 20px 18px;
  display: flex; flex-direction: column; gap: 10px;
}
.lk-signal {
  display: flex; align-items: flex-start; gap: 9px;
  font-size: 12.5px; color: var(--t2); line-height: 1.6;
}
.lk-signal-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: rgba(34,197,94,.55); flex-shrink: 0; margin-top: 5px;
}

/* Blurred AI */
.lk-ai-row {
  padding: 12px 20px 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.lk-ai-blur {
  display: flex; align-items: center; gap: 8px;
  font-size: 18px; font-weight: 800;
  color: rgba(255,255,255,.08); filter: blur(5px);
  user-select: none; pointer-events: none;
}
.lk-ai-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: rgba(34,197,94,.25); flex-shrink: 0;
}
.lk-ai-text-blur {
  font-size: 12px; color: rgba(255,255,255,.05);
  filter: blur(4px); user-select: none; pointer-events: none;
}

/* Lock overlay — gradient + CTA */
.lk-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(6,6,8,0)    0%,
    rgba(6,6,8,.55) 22%,
    rgba(6,6,8,.95) 52%,
    rgba(6,6,8,.99) 100%
  );
  display: flex; flex-direction: column;
  align-items: center; justify-content: flex-end;
  padding: 20px 24px 28px; gap: 9px; text-align: center;
}
.lk-lock-icon { color: rgba(34,197,94,.65); margin-bottom: 4px; }
.lk-lock-title {
  font-size: 15px; font-weight: 800; color: var(--t1); letter-spacing: -0.02em;
}
.lk-lock-sub {
  font-size: 11.5px; color: var(--t2); line-height: 1.55; max-width: 300px;
}
.lk-cta-btn {
  display: flex; align-items: center; justify-content: center;
  background: #16a34a; color: #dcfce7;
  font-size: 12px; font-weight: 900; letter-spacing: .07em;
  padding: 14px 32px; border-radius: 9px;
  text-decoration: none; margin-top: 4px; width: 100%;
  box-shadow: 0 4px 22px rgba(22,163,74,.4), 0 1px 3px rgba(0,0,0,.4);
  transition: background .15s, transform .12s;
}
.lk-cta-btn:hover { background: #15803d; transform: translateY(-1px); }
.lk-cta-btn:active { transform: translateY(0); }
.lk-price-note {
  font-size: 10px; color: rgba(255,255,255,.3); letter-spacing: .03em;
}

.lk-back {
  display: block; text-align: center;
  font-size: 10.5px; font-weight: 700; color: var(--t3);
  background: none; border: none; cursor: pointer; font-family: inherit;
  padding: 4px 0; transition: color .13s;
}
.lk-back:hover { color: var(--t2); }

@media (max-width: 640px) {
  .lk-overlay { padding: 18px 18px 24px; gap: 8px; }
  .lk-lock-title { font-size: 14px; }
  .lk-lock-sub { font-size: 11px; }
  .lk-score-blur { font-size: 48px; }
}

/* ─ Controle de Banca ──────────────────────────────────────────────────────── */

/* Setup */
.bk-setup-panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 24px 22px; margin-bottom: 16px;
  display: flex; flex-direction: column; gap: 12px;
}
.bk-setup-title { font-size: 13px; font-weight: 800; color: var(--t1); }
.bk-setup-sub   { font-size: 11.5px; color: var(--t2); line-height: 1.5; }
.bk-setup-row   { display: flex; flex-direction: column; gap: 8px; }
.bk-setup-input-wrap { display: flex; align-items: center; gap: 8px; }
.bk-currency    { font-size: 13px; font-weight: 700; color: var(--t2); flex-shrink: 0; }
.bk-setup-input { flex: 1; min-width: 0; }
.bk-setup-btn {
  background: #16a34a; color: #dcfce7;
  font-size: 11.5px; font-weight: 800; letter-spacing: .05em;
  width: 100%;
  border: none; border-radius: 8px; padding: 10px 18px;
  cursor: pointer; font-family: inherit; white-space: nowrap;
  transition: background .15s;
}
.bk-setup-btn:hover { background: #15803d; }

/* Alerts */
.bk-alerts { display: flex; flex-direction: column; gap: 7px; margin-bottom: 14px; }
.bk-alert {
  display: flex; align-items: flex-start; gap: 8px;
  border-radius: 8px; padding: 10px 13px; font-size: 11.5px; line-height: 1.5;
  border: 1px solid transparent;
}
.bk-alert-danger { background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.2); color: #fca5a5; }
.bk-alert-warn   { background: rgba(245,158,11,.08); border-color: rgba(245,158,11,.18); color: #fcd34d; }
.bk-alert-icon   { font-size: 13px; flex-shrink: 0; margin-top: 1px; }

/* Dashboard cards */
.bk-cards {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;
  margin-bottom: 14px;
}
.bk-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 14px 12px;
  display: flex; flex-direction: column; gap: 4px;
}
.bk-card-label { font-size: 9px; font-weight: 800; letter-spacing: .1em; color: var(--t2); }
.bk-card-val   { font-size: 18px; font-weight: 900; line-height: 1.1; }
.bk-card-sub   { font-size: 10px; color: var(--t2); }
.bk-reset-link { cursor: pointer; color: var(--t3); transition: color .12s; }
.bk-reset-link:hover { color: var(--t2); }

/* Actions row */
.bk-actions { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.bk-add-btn {
  background: #16a34a; color: #dcfce7;
  font-size: 11.5px; font-weight: 800; letter-spacing: .05em;
  border: none; border-radius: 8px; padding: 10px 20px;
  cursor: pointer; font-family: inherit;
  transition: background .15s, transform .12s;
}
.bk-add-btn:hover { background: #15803d; transform: translateY(-1px); }
.bk-clear-btn {
  background: transparent; border: 1px solid var(--border);
  color: var(--t2); font-size: 11px; font-weight: 700; letter-spacing: .04em;
  border-radius: 7px; padding: 9px 14px; cursor: pointer; font-family: inherit;
  transition: border-color .13s, color .13s;
}
.bk-clear-btn:hover { border-color: rgba(239,68,68,.3); color: #fca5a5; }
.bk-clear-confirm { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: var(--t2); }
.bk-clear-yes {
  background: rgba(239,68,68,.15); color: #fca5a5; border: 1px solid rgba(239,68,68,.25);
  font-size: 11px; font-weight: 700; border-radius: 6px;
  padding: 6px 12px; cursor: pointer; font-family: inherit;
}
.bk-clear-no {
  background: transparent; color: var(--t2); border: 1px solid var(--border);
  font-size: 11px; font-weight: 700; border-radius: 6px;
  padding: 6px 12px; cursor: pointer; font-family: inherit;
}

/* Form */
.bk-form {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 18px; margin-bottom: 14px;
  display: flex; flex-direction: column; gap: 12px;
  animation: ap-fade-up .18s ease both;
}
.bk-form-row   { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; }
.bk-form-field { display: flex; flex-direction: column; gap: 5px; }
.bk-submit-btn {
  background: #16a34a; color: #dcfce7;
  font-size: 12px; font-weight: 900; letter-spacing: .07em;
  border: none; border-radius: 9px; padding: 13px;
  cursor: pointer; font-family: inherit;
  transition: background .15s; margin-top: 2px;
}
.bk-submit-btn:hover:not(:disabled) { background: #15803d; }
.bk-submit-btn:disabled { opacity: .45; cursor: not-allowed; }
.bk-form-intro {
  font-size: 11.5px; color: var(--t2); margin: 0 0 4px; line-height: 1.5;
}
.bk-form-more {
  background: none; border: none; cursor: pointer; font-family: inherit;
  font-size: 11px; font-weight: 700; color: var(--t3); letter-spacing: .04em;
  padding: 2px 0; text-align: left; transition: color .12s;
}
.bk-form-more:hover { color: var(--t2); }
.bk-empty-state {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 32px 22px;
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; text-align: center; margin-bottom: 14px;
}
.bk-empty-icon  { font-size: 28px; }
.bk-empty-title { font-size: 13px; font-weight: 800; color: var(--t1); }
.bk-empty-sub   { font-size: 11.5px; color: var(--t2); line-height: 1.5; max-width: 260px; }

/* History table */
.bk-hist { margin-bottom: 18px; }
.bk-hist-hdr {
  display: grid; grid-template-columns: 56px 1fr 60px 80px 100px 28px;
  gap: 8px; padding: 6px 8px;
  font-size: 9px; font-weight: 800; letter-spacing: .1em; color: var(--t2);
  border-bottom: 1px solid var(--border);
}
.bk-hist-row {
  display: grid; grid-template-columns: 56px 1fr 60px 80px 100px 28px;
  gap: 8px; padding: 9px 8px;
  font-size: 11.5px; color: var(--t1);
  border-bottom: 1px solid rgba(255,255,255,.04);
  align-items: center;
  transition: background .1s;
}
.bk-hist-row:hover { background: rgba(255,255,255,.02); border-radius: 6px; }
.bk-hist-date    { color: var(--t2); font-size: 10.5px; }
.bk-hist-mercado { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }
.bk-hist-odd     { font-weight: 700; }
.bk-hist-valor   { }
.bk-hist-res     { font-weight: 800; font-size: 11.5px; }
.bk-hist-del {
  background: none; border: none; color: var(--t3);
  cursor: pointer; font-size: 15px; line-height: 1;
  padding: 2px 4px; border-radius: 4px;
  transition: color .12s, background .12s;
}
.bk-hist-del:hover { color: #fca5a5; background: rgba(239,68,68,.1); }

/* Blurred stats (paywall preview) */
.bk-stats-blur-row {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; padding: 12px 0 36px;
}
.bk-stat-blur-card {
  background: rgba(255,255,255,.03); border-radius: 8px;
  padding: 12px 10px; display: flex; flex-direction: column; gap: 5px;
  user-select: none; pointer-events: none;
}
.bk-stat-blur-val   { font-size: 20px; font-weight: 900; filter: blur(7px); color: var(--t2); }
.bk-stat-blur-label { font-size: 9px; font-weight: 800; letter-spacing: .1em; color: var(--t3); }

/* Educational */
.bk-edu {
  display: flex; flex-direction: column; gap: 7px;
  background: rgba(255,255,255,.02); border: 1px solid var(--border);
  border-radius: 9px; padding: 14px 16px; margin-bottom: 12px;
}
.bk-edu p { font-size: 11px; color: var(--t2); line-height: 1.6; }

@media (max-width: 640px) {
  .bk-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bk-hist-hdr,
  .bk-hist-row { grid-template-columns: 48px 1fr 52px 70px 28px; }
  .bk-hist-mercado { display: none; }
  .bk-stats-blur-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bk-form-row { grid-template-columns: minmax(0, 1fr); }
}

/* ─ Locked card entrance animation ─────────────────────────────────────────── */
@keyframes lk-reveal {
  from { opacity: 0; filter: blur(8px); transform: translateY(6px); }
  to   { opacity: 1; filter: blur(0px); transform: translateY(0); }
}
.lk-wrap {
  animation: lk-reveal .8s cubic-bezier(.4,0,.2,1) both;
}

/* ─ Mobile bottom tab bar ───────────────────────────────────────────────────── */
.ap-tab-bar { display: none; }

@media (max-width: 640px) {
  /* Show tab bar */
  .ap-tab-bar {
    display: flex;
    position: fixed; bottom: 0; left: 0; right: 0;
    background: var(--bg2);
    border-top: 1px solid var(--border);
    padding-bottom: max(env(safe-area-inset-bottom), 8px);
    z-index: 45;
    /* keep above main content, below sidebar overlay */
  }

  .ap-tab-item {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 3px; padding: 9px 4px 4px;
    background: none; border: none;
    cursor: pointer; font-family: inherit;
    color: var(--t2); transition: color .12s;
    -webkit-tap-highlight-color: transparent;
  }
  .ap-tab-item:active { background: rgba(255,255,255,.03); }
  .ap-tab-label {
    font-size: 9px; font-weight: 700; letter-spacing: .05em;
    line-height: 1;
  }
  .ap-tab-active { color: var(--green); }

  /* Push main content up above tab bar (~60px bar + safe area) */
  .ap-main {
    padding-bottom: calc(60px + max(env(safe-area-inset-bottom), 8px));
  }

  /* Sidebar bottom safe area (home indicator below last nav item) */
  .ap-sidebar {
    padding-bottom: max(env(safe-area-inset-bottom), 16px);
  }
}
`;
