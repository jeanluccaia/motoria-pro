import { useState, useEffect, useRef } from "react";
import { useNavigate } from "./router";

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

const LOAD_STEPS = [
  { label: "Analisando odd informada",        pct: 16 },
  { label: "Calculando chance estimada",       pct: 32 },
  { label: "Medindo exposição da banca",       pct: 52 },
  { label: "Avaliando retorno esperado",       pct: 70 },
  { label: "Gerando leitura da IA",            pct: 86 },
  { label: "Compilando painel de análise",     pct: 96 },
];

const TOKEN_KEY   = "motoria_token";
const HISTORY_KEY = "motoria_hist_v2";
const MAX_HISTORY = 8;
const KIWIFY_URL  = "https://pay.kiwify.com.br/DIVD8zl";

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

function CustomSelect({ id, options, value, onChange }) {
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
        <span className="sel-val">{value}</span>
        <span className={`sel-chev${open ? " sel-chev-up" : ""}`} aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      {open && (
        <ul className="sel-list" role="listbox" aria-label="Mercado">
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
  const [view, setView] = useState("nova");
  function navigate(v) { setView(v); setSidebarOpen(false); }

  // Form
  const [jogo,  setJogo]  = useState("");
  const [tipo,  setTipo]  = useState("Resultado da partida");
  const [odd,   setOdd]   = useState("");
  const [valor, setValor] = useState("");
  const [obs,   setObs]   = useState("");

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

  const oddNum    = parseFloat((odd || "").replace(",", "."));
  const oddPreview = odd && !isNaN(oddNum) && oddNum >= 1.01 ? calcScore(oddNum) : null;

  // Computed stats for Visão Geral
  const avgScore = history.length
    ? Math.round(history.reduce((s, h) => s + (h.score || 0), 0) / history.length)
    : null;
  const lastItem = history[0] || null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!odd || isNaN(oddNum) || oddNum < 1.01) {
      setError("Informe uma odd válida (mínimo 1.01).");
      return;
    }
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
      const userMsg = `Aposta: ${jogo || "não informado"} | Tipo: ${tipo} | Odd: ${odd} | Valor: R$${valor || "100"} | Obs: ${obs || "nenhuma"}`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-motoria-token": token } : {}),
        },
        body: JSON.stringify({ tool: "chance_de_perder", userMessage: userMsg }),
      });
      clearInterval(stepInterval);
      if (res.status === 402) { window.location.href = KIWIFY_URL; return; }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Erro ao processar análise.");
        setLoading(false);
        return;
      }
      const data    = await res.json();
      const rawText = data.content?.[0]?.text || "";
      if (data.credits !== undefined) setCredits(data.credits);
      if (data.token) { localStorage.setItem(TOKEN_KEY, data.token); setToken(data.token); }

      const impl     = calcImplicita(oddNum);
      const vig      = calcVig(oddNum);
      const justaRaw = impl / (1 - vig / 100);
      const justa    = Math.min(justaRaw, 99);
      const ev       = calcEV(impl, oddNum);
      const scoreObj = calcScore(oddNum);
      const exposure = Math.min(100, Math.round((100 - justa) * 1.1));

      const valorNum = parseFloat(valor) || 100;
      const r = {
        id: Math.floor(Math.random() * 8000) + 2000,
        ts: fmtTime(),
        jogo: jogo || "Aposta",
        tipo,
        odd: oddNum,
        impl:        impl.toFixed(2),
        justa:       justa.toFixed(2),
        vig:         vig.toFixed(2),
        ev:          ev.toFixed(2),
        perda:       (100 - impl).toFixed(1),
        exposure,
        valorAposta: valorNum,
        valorRisco:  ((valorNum * (100 - impl)) / 100).toFixed(2),
        ...scoreObj,
        ai: parseAI(rawText),
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

  function loadFromHistory(item) { setResult(item); setJogo(item.jogo || ""); setOdd(String(item.odd)); setView("nova"); }
  function resetForm() { setResult(null); setError(""); }
  function handleCopy(r, bullets) {
    const riskLbl = r.label === "CRÍTICO" ? "MUITO ALTO" : r.label;
    const lines = [
      `MotorIA Pro · Análise #${r.id}`,
      `${r.jogo} | ${r.tipo} | Odd ${r.odd.toFixed(2)}`,
      ``,
      `Risco da Aposta: ${r.score}/100 · ${riskLbl}`,
      `Chance Estimada: ${r.impl}%`,
      r.valorRisco ? `Valor em Risco: R$ ${r.valorRisco}` : null,
      ``,
      `Resumo:`,
      ...bullets.map(b => `• ${b}`),
      ``,
      `Análise educativa. Não representa garantia de resultado.`,
    ].filter(l => l !== null).join("\n");
    navigator.clipboard.writeText(lines).catch(() => {});
  }

  // ─── Sidebar nav structure ──────────────────────────────────────────────────
  const NAV = [
    {
      group: "ANÁLISE",
      items: [
        { id: "geral",   label: "Visão Geral",  Icon: IconOverview },
        { id: "nova",    label: "Nova Análise", Icon: IconAnalyze },
        { id: "comparador", label: "Comparador", Icon: IconCompare, dim: true },
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
              <span className="ap-live-lbl">ENGINE ATIVO</span>
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
                {items.map(({ id, label, Icon, badge, live, dim }) => (
                  <button
                    key={id}
                    className={`ap-nav-item${view === id ? " ap-nav-active" : ""}${dim ? " ap-nav-dim" : ""}`}
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
              <div className="ap-content" key="nova">

                {!result && !loading && (
                  <section className="ap-input-panel">
                    <div className="ap-panel-hdr ap-form-hdr">
                      <div className="ap-panel-hdr-left">
                        <div className="ap-nova-title">NOVA ANÁLISE</div>
                        <div className="ap-nova-sub">Configure os dados da aposta para gerar uma leitura de risco.</div>
                      </div>
                      <div className="ap-ia-online">
                        <span className="ap-status-dot" aria-hidden="true" />
                        IA ONLINE
                      </div>
                    </div>
                    <form className="ap-form" onSubmit={handleSubmit} noValidate>
                      <div className="ap-form-anchor" aria-hidden="true">
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                          <path d="M6 3.5v2.3L7.5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                        Análise matemática de risco em tempo real
                      </div>
                      <div className="ap-row-2">
                        <div className="ap-field">
                          <label className="ap-label" htmlFor="odd-input">ODD DECIMAL</label>
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
                              <span>impl. {calcImplicita(oddNum).toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                        <div className="ap-field">
                          <label className="ap-label" htmlFor="valor-input">EXPOSIÇÃO (R$)</label>
                          <input
                            id="valor-input"
                            className="ap-input"
                            type="text"
                            placeholder="100"
                            value={valor}
                            onChange={e => setValor(e.target.value)}
                            inputMode="decimal"
                            autoComplete="off"
                          />
                        </div>
                      </div>
                      <div className="ap-field">
                        <label className="ap-label" htmlFor="tipo-input">MERCADO</label>
                        <CustomSelect id="tipo-input" options={TIPOS} value={tipo} onChange={setTipo} />
                        {TIPO_DESC[tipo] && (
                          <div className="ap-tipo-desc">
                            <span className="ap-tipo-desc-dot" aria-hidden="true" />
                            {TIPO_DESC[tipo]}
                          </div>
                        )}
                      </div>
                      <div className="ap-field">
                        <label className="ap-label" htmlFor="jogo-input">
                          EVENTO <span className="ap-label-opt">/ opcional</span>
                        </label>
                        <input
                          id="jogo-input"
                          className="ap-input"
                          type="text"
                          placeholder="Ex: Flamengo × Palmeiras · Brasileirão"
                          value={jogo}
                          onChange={e => setJogo(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                      <div className="ap-field">
                        <label className="ap-label" htmlFor="obs-input">
                          CONTEXTO <span className="ap-label-opt">/ opcional</span>
                        </label>
                        <textarea
                          id="obs-input"
                          className="ap-input ap-textarea"
                          placeholder="Desfalques, forma recente, condições do jogo…"
                          value={obs}
                          onChange={e => setObs(e.target.value)}
                          rows={2}
                        />
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
                    <div className="ap-loading-hdr">
                      <div>
                        <div className="ap-loading-engine">RISK ENGINE v2.4</div>
                        <div className="ap-loading-sub">Processamento quantitativo em execução</div>
                      </div>
                      <span className="ap-loading-status">CALCULANDO</span>
                    </div>
                    <div className="ap-loading-bar-wrap">
                      <div className="ap-loading-bar" style={{ width: `${loadPct}%` }} />
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
                          {i < loadStepIdx && <span className="ap-lstep-done-tag">OK</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Output — Dashboard Premium */}
                {result && !loading && (() => {
                  const leitura = deriveLeituraIA(result.score);
                  const bullets = deriveBullets(result);
                  const riskLbl = result.label === "CRÍTICO" ? "MUITO ALTO" : result.label;
                  const evNum   = parseFloat(result.ev);
                  return (
                  <div className="db-output" role="region" aria-label="Resultado da análise">

                    {/* ── Topbar ────────────────────────────────────── */}
                    <div className="db-topbar">
                      <div className="db-topbar-meta">
                        <span className="db-id">#{result.id}</span>
                        <span className="db-sep" aria-hidden="true">·</span>
                        <span className="db-ts">{result.ts}</span>
                        <span className="db-sep" aria-hidden="true">·</span>
                        <span className="db-ai-badge">
                          <span className="db-ai-dot" aria-hidden="true" />
                          Análise gerada pela IA
                        </span>
                      </div>
                      <button className="db-btn-ghost" onClick={resetForm} aria-label="Iniciar nova análise">
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Nova análise
                      </button>
                    </div>

                    {/* ── Event strip ───────────────────────────────── */}
                    <div className="db-event-strip">
                      {result.jogo !== "Aposta" && (
                        <span className="db-event-name">{result.jogo}</span>
                      )}
                      {result.jogo !== "Aposta" && <span className="db-strip-sep" aria-hidden="true" />}
                      <span className="db-event-tag">{result.tipo}</span>
                      <span className="db-strip-sep" aria-hidden="true" />
                      <span className="db-event-odd">Odd <strong>{result.odd.toFixed(2)}</strong></span>
                      {result.valorAposta && (
                        <>
                          <span className="db-strip-sep" aria-hidden="true" />
                          <span className="db-event-valor">R$ {result.valorAposta.toFixed(0)}</span>
                        </>
                      )}
                    </div>

                    {/* ── 4 Cards ───────────────────────────────────── */}
                    <div className="db-cards">

                      {/* Card 1 — Risco da Aposta */}
                      <div className="db-card db-card-risco">
                        <div className="db-card-label">Risco da Aposta</div>
                        <div className="db-risco-score" style={{ color: result.color }}>
                          {result.score}
                          <span className="db-risco-denom">/100</span>
                        </div>

                        {/* Risk bar com zonas de cor */}
                        <div className="db-rbar-wrap" role="img" aria-label={`Risco ${result.score} de 100`}>
                          <div className="db-rbar-track">
                            <div className="db-rbar-zone db-rbar-z1" />
                            <div className="db-rbar-zone db-rbar-z2" />
                            <div className="db-rbar-zone db-rbar-z3" />
                            <div className="db-rbar-zone db-rbar-z4" />
                            <div
                              className="db-rbar-marker"
                              style={{ left: `calc(${Math.min(result.score, 98)}% - 5px)` }}
                            />
                          </div>
                          <div className="db-rbar-labels">
                            <span>Baixo</span>
                            <span>Moderado</span>
                            <span>Alto</span>
                            <span>Muito Alto</span>
                          </div>
                        </div>

                        <div className="db-card-level" style={{ color: result.color }}>{riskLbl}</div>
                        <div className="db-card-sub">{getRiscoFrase(result.score)}</div>
                      </div>

                      {/* Card 2 — Chance Estimada */}
                      <div className="db-card db-card-chance">
                        <div className="db-card-label">Chance Estimada</div>
                        <div className="db-big-num db-big-green">
                          {result.impl}<span className="db-big-sym">%</span>
                        </div>
                        <div className="db-card-sub">Baseada na odd {result.odd.toFixed(2)}</div>
                        <div className="db-mini-table">
                          <div className="db-mini-row">
                            <span>Margem da casa</span>
                            <span className="db-amber">{result.vig}%</span>
                          </div>
                          <div className="db-mini-row">
                            <span>Prob. justa</span>
                            <span>{result.justa}%</span>
                          </div>
                          <div className="db-mini-row">
                            <span>Chance de perda</span>
                            <span className="db-red">{result.perda}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Card 3 — Valor em Risco */}
                      <div className="db-card db-card-valor">
                        <div className="db-card-label">Valor em Risco</div>
                        <div className="db-big-num db-big-red">
                          R$ <span>{result.valorRisco || "—"}</span>
                        </div>
                        <div className="db-card-sub">
                          de R$ {result.valorAposta?.toFixed(0) || "—"} apostados
                        </div>
                        <div className="db-mini-table">
                          <div className="db-mini-row">
                            <span>Retorno esperado</span>
                            <span className={evNum >= 0 ? "db-green" : "db-red"}>
                              {evNum >= 0 ? "+" : ""}R$ {Math.abs(evNum).toFixed(2)}
                            </span>
                          </div>
                          <div className="db-mini-row">
                            <span>Por R$ 100 apostados</span>
                            <span className="db-muted">referência</span>
                          </div>
                        </div>
                      </div>

                      {/* Card 4 — Leitura da IA */}
                      <div className="db-card db-card-leitura">
                        <div className="db-card-label">Leitura da IA</div>
                        <div className="db-leitura-status" style={{ color: leitura.color }}>
                          <span className="db-leitura-dot" style={{ background: leitura.color }} aria-hidden="true" />
                          {leitura.text}
                        </div>
                        <div className="db-card-sub">{leitura.sub}</div>
                        {result.ai?.oQuePodeDarErrado && (
                          <div className="db-leitura-detail">
                            <span className="db-leitura-detail-lbl">Ponto de atenção</span>
                            <span className="db-leitura-detail-txt">{result.ai.oQuePodeDarErrado}</span>
                          </div>
                        )}
                      </div>

                    </div>{/* /db-cards */}

                    {/* ── Resumo da análise ─────────────────────────── */}
                    {bullets.length > 0 && (
                      <div className="db-summary">
                        <div className="db-summary-hdr">
                          <span className="db-summary-title">Resumo da análise</span>
                          <span className="db-summary-tag">MotorIA Engine™</span>
                        </div>
                        <ul className="db-bullets" aria-label="Pontos principais da análise">
                          {bullets.map((b, i) => (
                            <li key={i} className="db-bullet">
                              <span className="db-bullet-dot" aria-hidden="true" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ── Ações ─────────────────────────────────────── */}
                    <div className="db-actions">
                      <button className="db-btn-primary" onClick={resetForm}>
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Nova análise
                      </button>
                      <button
                        className="db-btn-copy"
                        onClick={() => handleCopy(result, bullets)}
                        title="Copiar resumo da análise"
                      >
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                          <path d="M9 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                        Copiar resumo
                      </button>
                    </div>

                    <p className="db-disclaimer">
                      Análise educativa. Não representa garantia de resultado.
                      A decisão é sua.
                    </p>
                  </div>
                  );
                })()}
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
  display: flex; align-items: center; justify-content: space-between;
  height: 46px; padding: 0 16px; gap: 12px;
  background: var(--bg2);
  border-bottom: 1px solid rgba(255,255,255,.08);
  flex-shrink: 0; z-index: 30; position: relative;
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

.ap-topbar-center { flex: 1; display: flex; align-items: center; justify-content: center; }
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
.ap-main { flex: 1; overflow-y: auto; background: var(--bg); }
.ap-content {
  max-width: 800px; margin: 0 auto; padding: 24px 22px;
  display: flex; flex-direction: column; gap: 11px;
  animation: ap-fade-up .2s ease both;
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
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
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
  border-radius: 10px; padding: 32px 20px;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  text-align: center;
}
.ap-geral-empty p { font-size: 13px; color: var(--t3); }

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
  background: #0E0E14;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 14px; padding: 22px 22px;
  box-shadow: 0 0 0 1px rgba(34,197,94,.05), 0 16px 48px rgba(0,0,0,.55);
}

/* Form header */
.ap-form-hdr {
  border-bottom-color: rgba(255,255,255,.07);
}
.ap-nova-title {
  font-size: 19px; font-weight: 900; color: #EAEAEC;
  letter-spacing: -0.04em; line-height: 1;
}
.ap-nova-sub {
  font-size: 11.5px; color: rgba(255,255,255,.38); margin-top: 6px; line-height: 1.55;
}
.ap-ia-online {
  display: flex; align-items: center; gap: 6px;
  font-size: 8px; font-weight: 800; letter-spacing: .14em; color: rgba(34,197,94,.6);
  flex-shrink: 0;
}

/* Form anchor strip */
.ap-form-anchor {
  display: inline-flex; align-items: center; gap: 7px;
  align-self: flex-start;
  padding: 5px 11px;
  background: rgba(22,163,74,.06);
  border: 1px solid rgba(22,163,74,.16);
  border-radius: 99px;
  font-size: 9.5px; font-weight: 700; color: rgba(34,197,94,.72);
  letter-spacing: .04em;
}

.ap-form { display: flex; flex-direction: column; gap: 14px; margin-top: 18px; }
.ap-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
.ap-field { display: flex; flex-direction: column; gap: 6px; }

.ap-label {
  font-size: 8.5px; font-weight: 800; letter-spacing: .15em;
  color: rgba(255,255,255,.52); text-transform: uppercase;
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
  font-size: 9px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
}
.ap-odd-preview-sep { color: var(--t3); }
.ap-error {
  font-size: 12px; color: var(--red);
  background: rgba(239,68,68,.06); border: 1px solid rgba(239,68,68,.18);
  border-radius: 8px; padding: 10px 12px;
}

.ap-submit {
  display: flex; align-items: center; justify-content: center; gap: 9px;
  background: #16a34a; color: #f0fdf4;
  font-size: 11.5px; font-weight: 800; letter-spacing: .12em;
  padding: 15px 20px; border-radius: 9px; border: none; cursor: pointer;
  font-family: inherit; margin-top: 4px;
  box-shadow: 0 2px 12px rgba(22,163,74,.18), inset 0 1px 0 rgba(255,255,255,.12);
  transition: background .18s ease-out, box-shadow .18s ease-out, transform .12s ease-out;
}
.ap-submit:hover {
  background: #15803d;
  box-shadow: 0 4px 20px rgba(22,163,74,.26), inset 0 1px 0 rgba(255,255,255,.1);
  transform: translateY(-1px);
}
.ap-submit:active { transform: translateY(0); box-shadow: 0 1px 6px rgba(22,163,74,.16); }

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
.ap-metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
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
.ap-ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
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
  grid-template-columns: 1fr 1fr;
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
  .ap-sidebar {
    position: fixed; top: 46px; left: 0; bottom: 0;
    z-index: 50; transform: translateX(-100%);
    width: 230px; box-shadow: 6px 0 32px rgba(0,0,0,.6);
  }
  .ap-sidebar-open { transform: translateX(0); }
}
@media (max-width: 640px) {
  .ap-content { padding: 14px 13px; }
  .ap-topbar { padding: 0 12px; }
  .ap-live-lbl { display: none; }
  .ap-topbar-tag { display: none; }
  .ap-topbar-aid { display: none; }
  .ap-geral-stats { grid-template-columns: 1fr 1fr; }
  .ap-geral-action { flex-direction: column; align-items: flex-start; }
  .ap-geral-recent-row { grid-template-columns: 1fr 36px 28px 50px; }
  .ap-geral-recent-id, .ap-geral-recent-odd, .ap-geral-recent-bar { display: none; }
  .ap-metrics-grid { grid-template-columns: 1fr 1fr; }
  .ap-ai-grid { grid-template-columns: 1fr; }
  .ap-row-2 { grid-template-columns: 1fr; }
  .ap-score-hero { flex-direction: column; align-items: flex-start; gap: 18px; padding: 18px 16px; }
  .ap-score-data-lbl { min-width: 80px; }
  .ap-hist-row { grid-template-columns: 1fr 36px 28px 52px; }
  .ap-hist-id, .ap-hist-odd, .ap-hist-bar, .ap-hist-ts { display: none; }
  .ap-loading-pct { font-size: 44px; }

  /* Form mobile */
  .ap-input-panel { padding: 16px 15px; }
  .ap-nova-title { font-size: 16px; }
  .ap-nova-sub { font-size: 11px; }
  .ap-submit { padding: 16px 20px; font-size: 12px; }
  .ap-form-anchor { font-size: 9.5px; }

  /* Dashboard mobile */
  .db-cards { grid-template-columns: 1fr; }
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
}
`;
