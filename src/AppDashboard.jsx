import { useState, useEffect } from "react";
import { useNavigate } from "./router";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPOS = [
  "Resultado final (1X2)",
  "Over / Under gols",
  "Ambas marcam (BTTS)",
  "Handicap asiático",
  "Handicap europeu",
  "Chance dupla",
  "Draw No Bet",
  "Primeiro gol",
  "Escanteios",
  "Cartões",
  "Múltipla",
  "Outro",
];

const LOAD_STEPS = [
  { label: "Calibrando modelo probabilístico",   pct: 16 },
  { label: "Calculando probabilidade implícita", pct: 32 },
  { label: "Detectando distorção da casa",       pct: 52 },
  { label: "Estimando valor esperado",           pct: 70 },
  { label: "Computando MOTORIA RISK INDEX™",     pct: 86 },
  { label: "Compilando relatório quantitativo",  pct: 96 },
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

const IconAnalyze = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 12L5 8L8 10L12 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="5" cy="8" r="1" fill="currentColor"/>
    <circle cx="8" cy="10" r="1" fill="currentColor"/>
    <circle cx="12" cy="4" r="1" fill="currentColor"/>
  </svg>
);

const IconHistory = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M7 4.5V7L9 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
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
      <div className="ap-metric-label">
        {label}{tm && <span className="ap-tm">™</span>}
      </div>
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

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState("nova");
  function navigate(v) { setView(v); setSidebarOpen(false); }

  // Form
  const [jogo,  setJogo]  = useState("");
  const [tipo,  setTipo]  = useState("Resultado final (1X2)");
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

  const oddNum = parseFloat((odd || "").replace(",", "."));
  const oddPreview = odd && !isNaN(oddNum) && oddNum >= 1.01 ? calcScore(oddNum) : null;

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

      const r = {
        id:     Math.floor(Math.random() * 8000) + 2000,
        ts:     fmtTime(),
        jogo:   jogo || "Aposta",
        tipo,
        odd:    oddNum,
        impl:   impl.toFixed(2),
        justa:  justa.toFixed(2),
        vig:    vig.toFixed(2),
        ev:     ev.toFixed(2),
        perda:  (100 - impl).toFixed(1),
        exposure,
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

  return (
    <>
      <style>{CSS}</style>

      {sidebarOpen && (
        <div className="ap-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
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
            {analysisId && (
              <span className="ap-topbar-aid"> · #{analysisId}</span>
            )}
          </div>

          <div className="ap-topbar-right">
            {credits !== null && (
              <div className="ap-credits-bar-wrap" title={`${credits} análises restantes`}>
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

            <div className="ap-sidebar-group">
              <div className="ap-sidebar-group-lbl">MÓDULOS</div>
              <button className={`ap-nav-item${view === "nova" ? " ap-nav-active" : ""}`} onClick={() => navigate("nova")} aria-current={view === "nova" ? "page" : undefined}>
                <span className="ap-nav-icon"><IconAnalyze /></span>
                <span className="ap-nav-label">Nova análise</span>
              </button>
              <button className={`ap-nav-item${view === "historico" ? " ap-nav-active" : ""}`} onClick={() => navigate("historico")} aria-current={view === "historico" ? "page" : undefined}>
                <span className="ap-nav-icon"><IconHistory /></span>
                <span className="ap-nav-label">Histórico</span>
                {history.length > 0 && (
                  <span className="ap-nav-badge">{history.length}</span>
                )}
              </button>
            </div>

            <div className="ap-sidebar-sep" role="separator" />

            <div className="ap-sidebar-group">
              <div className="ap-sidebar-group-lbl">SISTEMA</div>
              <button className={`ap-nav-item${view === "config" ? " ap-nav-active" : ""}`} onClick={() => navigate("config")} aria-current={view === "config" ? "page" : undefined}>
                <span className="ap-nav-icon"><IconConfig /></span>
                <span className="ap-nav-label">Configurações</span>
              </button>
            </div>

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

            {/* ════ NOVA ANÁLISE ════════════════════════════════════════ */}
            {view === "nova" && (
              <div className="ap-content">

                {!result && !loading && (
                  <section className="ap-input-panel">
                    <div className="ap-panel-hdr">
                      <div className="ap-panel-hdr-left">
                        <div className="ap-panel-mod">MÓDULO I</div>
                        <div className="ap-panel-title">Parâmetros de entrada</div>
                      </div>
                      <div className="ap-panel-online">
                        <span className="ap-status-dot" aria-hidden="true" />
                        SISTEMA ONLINE
                      </div>
                    </div>

                    <form className="ap-form" onSubmit={handleSubmit} noValidate>
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
                        <select id="tipo-input" className="ap-input ap-select" value={tipo} onChange={e => setTipo(e.target.value)}>
                          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
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
                        INICIAR ANÁLISE
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </form>
                  </section>
                )}

                {/* ── Loading ─────────────────────────────────────────── */}
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

                {/* ── Output ──────────────────────────────────────────── */}
                {result && !loading && (
                  <div className="ap-output">

                    <div className="ap-output-topbar">
                      <div className="ap-output-meta">
                        <span className="ap-output-id">#{result.id}</span>
                        <span className="ap-output-dot" aria-hidden="true">·</span>
                        <span className="ap-output-ts">{result.ts}</span>
                        {result.jogo && result.jogo !== "Aposta" && (
                          <>
                            <span className="ap-output-dot" aria-hidden="true">·</span>
                            <span className="ap-output-event">{result.jogo}</span>
                          </>
                        )}
                      </div>
                      <button className="ap-btn-nova" onClick={resetForm}>Nova análise</button>
                    </div>

                    {/* Score hero */}
                    <div className="ap-score-hero">
                      <div className="ap-gauge-wrap">
                        <div
                          className="ap-gauge"
                          style={{ background: `conic-gradient(${result.color} 0% ${result.score}%, rgba(255,255,255,.05) ${result.score}% 100%)` }}
                          role="img"
                          aria-label={`MOTORIA RISK INDEX: ${result.score} de 100`}
                        >
                          <div className="ap-gauge-inner">
                            <span className="ap-gauge-num">{result.score}</span>
                            <span className="ap-gauge-denom">/100</span>
                          </div>
                        </div>
                        <span className="ap-gauge-name">MOTORIA RISK INDEX™</span>
                        <span className="ap-gauge-ci">
                          IC 95% · [{Math.max(0, result.score - 6)} — {Math.min(100, result.score + 6)}]
                        </span>
                      </div>

                      <div className="ap-score-side">
                        <div className="ap-risk-badge" style={{ color: result.color, borderColor: `${result.color}28`, background: `${result.color}0c` }}>
                          {result.label}
                        </div>
                        <div className="ap-verdict" style={{ color: result.color }}>{result.verdict}</div>

                        <div className="ap-score-data">
                          <div className="ap-score-data-row">
                            <span className="ap-score-data-lbl">ODD</span>
                            <span className="ap-score-data-val ap-score-data-val-lg">{result.odd.toFixed(2)}</span>
                          </div>
                          <div className="ap-score-data-row">
                            <span className="ap-score-data-lbl">MERCADO</span>
                            <span className="ap-score-data-val">{result.tipo}</span>
                          </div>
                          <div className="ap-score-data-row">
                            <span className="ap-score-data-lbl">EXPOSURE LEVEL™</span>
                            <div className="ap-exposure-row">
                              <div className="ap-exposure-track">
                                <div className="ap-exposure-fill" style={{ width: `${result.exposure}%`, background: result.color }} />
                              </div>
                              <span className="ap-exposure-val" style={{ color: result.color }}>{result.exposure}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Probability Distortion */}
                    <div className="ap-prob-panel">
                      <div className="ap-prob-hdr">
                        <span className="ap-prob-title">PROBABILITY DISTORTION™</span>
                        <span className="ap-prob-vig">HOUSE MARGIN {result.vig}%</span>
                      </div>
                      <div className="ap-prob-bar" role="img" aria-label={`Vitória ${result.impl}%, derrota ${result.perda}%`}>
                        <div className="ap-prob-win" style={{ width: `${result.impl}%` }} />
                        <div className="ap-prob-lose" />
                      </div>
                      <div className="ap-prob-labels">
                        <span className="ap-prob-w">VITÓRIA · {result.impl}%</span>
                        <span className="ap-prob-l">DERROTA · {result.perda}%</span>
                      </div>
                    </div>

                    {/* Metrics grid */}
                    <div className="ap-metrics-grid">
                      <MetricCard label="PROB. IMPLÍCITA"    value={`${result.impl}%`}  color="#22C55E"               sub="Chance atribuída pela casa" />
                      <MetricCard label="PROB. JUSTA"        value={`${result.justa}%`} color="rgba(232,232,230,.38)" sub="Sem margem da casa" />
                      <MetricCard label="HOUSE MARGIN"       value={`${result.vig}%`}   color="#F59E0B"               sub="Distorção embutida" tm />
                      <MetricCard
                        label="EV / R$100"
                        value={`${parseFloat(result.ev) >= 0 ? "+" : ""}R$${Math.abs(parseFloat(result.ev)).toFixed(2)}`}
                        color={parseFloat(result.ev) >= 0 ? "#22C55E" : "#EF4444"}
                        sub="Retorno esperado"
                      />
                      <MetricCard label="RISK EXPOSURE"      value={`${result.perda}%`} color="#EF4444"               sub="Probabilidade de derrota" tm />
                      <MetricCard label="SIGNAL CONFIDENCE"  value="94,2%"              color="rgba(232,232,230,.22)" sub="Confiança do modelo" tm />
                    </div>

                    {/* AI Modules */}
                    {result.ai && (
                      <div className="ap-ai-section">
                        <div className="ap-ai-hdr">
                          <span className="ap-ai-hdr-title">ANÁLISE QUALITATIVA</span>
                          <span className="ap-ai-hdr-tag">MotorIA Engine™</span>
                        </div>
                        <div className="ap-ai-grid">
                          <ModuleCard mod="MOD-01" title="RISCO PRINCIPAL">{result.ai.riscoPrincipal}</ModuleCard>
                          <ModuleCard mod="MOD-02" title="CENÁRIO NECESSÁRIO">{result.ai.cenarioNecessario}</ModuleCard>
                          <ModuleCard mod="MOD-03" title="PONTOS DE FALHA">{result.ai.oQuePodeDarErrado}</ModuleCard>
                          <ModuleCard mod="MOD-04" title="LEITURA CONSERVADORA">{result.ai.leituraConservadora}</ModuleCard>
                        </div>
                        {result.ai.alertaFinal && (
                          <div className="ap-alerta">
                            <div className="ap-alerta-hdr">
                              <span className="ap-alerta-icon" aria-hidden="true">▲</span>
                              <span className="ap-alerta-tag">RISK SIGNAL™</span>
                            </div>
                            <p className="ap-alerta-text">{result.ai.alertaFinal}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="ap-disclaimer">
                      Ferramenta educativa · Não constitui recomendação de aposta ·
                      MotorIA Risk Engine™ v2.4
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ════ HISTÓRICO ══════════════════════════════════════════ */}
            {view === "historico" && (
              <div className="ap-content">
                <div className="ap-panel-hdr">
                  <div className="ap-panel-hdr-left">
                    <div className="ap-panel-mod">MÓDULO II</div>
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
              <div className="ap-content">
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
                    <p className="ap-config-hint">
                      Token recebido por email após a confirmação de acesso.
                    </p>
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
  --bg2:    #08080C;
  --panel:  #0B0B0F;
  --border: rgba(255,255,255,0.065);
  --bmd:    rgba(255,255,255,0.12);
  --t1: #DDDDE0;
  --t2: #72727A;
  --t3: #38383E;
  --green:  #22C55E;
  --amber:  #F59E0B;
  --red:    #EF4444;
  --orange: #F97316;
}

body { overflow: hidden; }

@keyframes ap-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .45; transform: scale(1.5); }
}
@keyframes ap-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: .2; }
}
@keyframes ap-bar-in {
  from { width: 0; }
}
@keyframes ap-fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ─ Shell ─────────────────────────────────────────────────────────────────── */
.ap-shell {
  display: flex; flex-direction: column;
  height: 100dvh; min-height: 100vh;
  background: var(--bg); color: var(--t1);
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif;
  overflow: hidden; font-size: 14px;
}

/* ─ Overlay (mobile) ──────────────────────────────────────────────────────── */
.ap-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.6);
  z-index: 40; backdrop-filter: blur(2px);
}

/* ─ Topbar ────────────────────────────────────────────────────────────────── */
.ap-topbar {
  display: flex; align-items: center; justify-content: space-between;
  height: 46px; padding: 0 14px; gap: 12px;
  background: var(--bg2); border-bottom: 1px solid var(--border);
  flex-shrink: 0; z-index: 30; position: relative;
}
.ap-topbar-left  { display: flex; align-items: center; gap: 10px; flex-shrink: 0; min-width: 0; }
.ap-topbar-right { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }

.ap-hamburger {
  display: none; flex-direction: column; gap: 4px;
  background: none; border: none; cursor: pointer;
  padding: 4px 3px; flex-shrink: 0;
}
.ap-hamburger span {
  display: block; width: 16px; height: 1.5px;
  background: var(--t2); border-radius: 99px; transition: opacity .15s;
}
.ap-hamburger:hover span { background: var(--t1); }

.ap-topbar-brand { display: flex; align-items: center; gap: 7px; }
.ap-logo-mark {
  width: 22px; height: 22px; border-radius: 5px;
  background: var(--green); color: #050507;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ap-topbar-name { font-size: 13px; font-weight: 800; color: var(--t1); letter-spacing: -0.03em; }
.ap-topbar-sep  { color: var(--t3); font-size: 13px; }
.ap-topbar-tag  { font-size: 11px; font-weight: 600; color: var(--t3); letter-spacing: .02em; }

.ap-topbar-center { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0; min-width: 0; }
.ap-topbar-clock {
  font-size: 11px; font-weight: 700; letter-spacing: .06em;
  color: var(--t3); font-variant-numeric: tabular-nums;
  font-family: 'Courier New', monospace;
}
.ap-topbar-aid {
  font-size: 10px; font-weight: 700; letter-spacing: .1em;
  color: rgba(34,197,94,.5); font-family: 'Courier New', monospace;
}

.ap-credits-bar-wrap { display: flex; align-items: center; }
.ap-credits-bar {
  width: 60px; height: 2px;
  background: rgba(255,255,255,.07); border-radius: 99px; overflow: hidden;
}
.ap-credits-fill { height: 100%; border-radius: 99px; background: var(--green); transition: width .4s ease; }

.ap-engine-live {
  display: flex; align-items: center; gap: 6px;
  font-size: 9px; font-weight: 800; letter-spacing: .12em; color: var(--t3);
}
.ap-live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--green); flex-shrink: 0;
  animation: ap-pulse 2.4s ease-in-out infinite;
}
.ap-live-lbl { letter-spacing: .1em; }

/* ─ Body ──────────────────────────────────────────────────────────────────── */
.ap-body { display: flex; flex: 1; overflow: hidden; }

/* ─ Sidebar ───────────────────────────────────────────────────────────────── */
.ap-sidebar {
  width: 188px; flex-shrink: 0;
  background: var(--bg2); border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  padding: 12px 8px 10px; overflow-y: auto; gap: 0;
  transition: transform .22s ease;
}
.ap-sidebar-group { display: flex; flex-direction: column; gap: 1px; }
.ap-sidebar-group-lbl {
  font-size: 8px; font-weight: 800; letter-spacing: .18em;
  color: var(--t3); padding: 6px 10px 5px; text-transform: uppercase;
}
.ap-nav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px; border-radius: 7px;
  border: none; background: transparent; cursor: pointer;
  width: 100%; text-align: left; color: var(--t2);
  transition: background .12s, color .12s; font-family: inherit;
  position: relative;
}
.ap-nav-item:hover { background: rgba(255,255,255,.04); color: var(--t1); }
.ap-nav-active {
  background: rgba(255,255,255,.055) !important;
  color: var(--t1) !important;
}
.ap-nav-active::before {
  content: '';
  position: absolute; left: 0; top: 20%; bottom: 20%;
  width: 2px; border-radius: 99px;
  background: var(--green);
}
.ap-nav-icon  { display: flex; align-items: center; justify-content: center; width: 16px; flex-shrink: 0; opacity: .7; }
.ap-nav-active .ap-nav-icon { opacity: 1; }
.ap-nav-label { font-size: 12px; font-weight: 600; letter-spacing: -0.01em; }
.ap-nav-badge {
  margin-left: auto; font-size: 9px; font-weight: 700; color: var(--t3);
  background: rgba(255,255,255,.055); border-radius: 99px;
  padding: 1px 6px; min-width: 18px; text-align: center;
}
.ap-sidebar-sep { height: 1px; background: var(--border); margin: 10px 0; }

.ap-sidebar-engine {
  margin-top: auto; padding-top: 14px;
  display: flex; align-items: center; gap: 9px;
  padding-left: 10px; padding-bottom: 4px;
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
  font-size: 8px; font-weight: 700; letter-spacing: .08em;
  color: rgba(34,197,94,.55);
}

/* ─ Main ──────────────────────────────────────────────────────────────────── */
.ap-main { flex: 1; overflow-y: auto; background: var(--bg); }
.ap-content {
  max-width: 800px; margin: 0 auto; padding: 26px 22px;
  display: flex; flex-direction: column; gap: 12px;
  animation: ap-fade-up .2s ease both;
}

/* ─ Panel header ──────────────────────────────────────────────────────────── */
.ap-panel-hdr {
  display: flex; justify-content: space-between; align-items: flex-end;
  padding-bottom: 14px; border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
}
.ap-panel-hdr-left { display: flex; flex-direction: column; gap: 2px; }
.ap-panel-mod {
  font-size: 8px; font-weight: 800; letter-spacing: .2em;
  color: var(--t3); font-family: 'Courier New', monospace;
}
.ap-panel-title {
  font-size: 16px; font-weight: 700; color: var(--t1); letter-spacing: -0.03em;
}
.ap-panel-online {
  display: flex; align-items: center; gap: 6px;
  font-size: 8px; font-weight: 800; letter-spacing: .14em; color: var(--t3);
}
.ap-status-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--green); animation: ap-pulse 2.8s ease-in-out infinite;
}

/* ─ Input panel ───────────────────────────────────────────────────────────── */
.ap-input-panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px 20px;
}
.ap-form { display: flex; flex-direction: column; gap: 13px; margin-top: 16px; }
.ap-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
.ap-field { display: flex; flex-direction: column; gap: 6px; }

.ap-label {
  font-size: 8.5px; font-weight: 800; letter-spacing: .15em;
  color: var(--t3); text-transform: uppercase;
}
.ap-label-opt { font-weight: 500; letter-spacing: 0; text-transform: none; font-size: 8px; opacity: .7; }

.ap-input {
  background: rgba(255,255,255,.022); border: 1px solid var(--border);
  border-radius: 8px; padding: 10px 12px;
  font-size: 14px; font-weight: 500; color: var(--t1);
  outline: none; font-family: inherit; width: 100%;
  transition: border-color .14s, background .14s;
}
.ap-input:focus { border-color: rgba(34,197,94,.28); background: rgba(255,255,255,.028); }
.ap-input::placeholder { color: var(--t3); }
.ap-input-odd {
  font-size: 20px; font-weight: 700; letter-spacing: -0.03em;
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
  background: var(--t1); color: #060608;
  font-size: 11px; font-weight: 900; letter-spacing: .14em;
  padding: 13px 20px; border-radius: 8px; border: none; cursor: pointer;
  font-family: inherit; margin-top: 3px;
  transition: opacity .14s, transform .1s;
}
.ap-submit:hover { opacity: .87; transform: translateY(-1px); }
.ap-submit:active { transform: translateY(0); opacity: .95; }

/* ─ Loading ───────────────────────────────────────────────────────────────── */
.ap-loading {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 26px 22px;
  display: flex; flex-direction: column; gap: 20px;
}
.ap-loading-hdr { display: flex; justify-content: space-between; align-items: flex-start; }
.ap-loading-engine {
  font-size: 10px; font-weight: 800; letter-spacing: .16em;
  color: var(--t2); font-family: 'Courier New', monospace;
}
.ap-loading-sub { font-size: 11px; color: var(--t3); margin-top: 3px; }
.ap-loading-status {
  font-size: 9px; font-weight: 800; letter-spacing: .12em; color: var(--green);
  animation: ap-blink 1.3s ease-in-out infinite;
}
.ap-loading-bar-wrap {
  height: 2px; background: rgba(255,255,255,.06); border-radius: 99px; overflow: hidden;
}
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
.ap-lstep {
  display: flex; align-items: center; gap: 10px;
  font-size: 11.5px; color: var(--t3); transition: color .3s;
}
.ap-lstep-done   { color: var(--t3); }
.ap-lstep-active { color: var(--t1); }
.ap-lstep-icon {
  font-size: 9px; width: 14px; flex-shrink: 0;
  font-family: 'Courier New', monospace; color: inherit;
}
.ap-lstep-active .ap-lstep-icon { animation: ap-blink .7s ease-in-out infinite; }
.ap-lstep-done-tag {
  margin-left: auto; font-size: 8px; font-weight: 800;
  letter-spacing: .08em; color: rgba(34,197,94,.4);
  font-family: 'Courier New', monospace;
}

/* ─ Output ────────────────────────────────────────────────────────────────── */
.ap-output { display: flex; flex-direction: column; gap: 10px; animation: ap-fade-up .25s ease both; }

.ap-output-topbar {
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;
}
.ap-output-meta { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.ap-output-id {
  font-size: 9px; font-weight: 800; letter-spacing: .14em;
  color: rgba(34,197,94,.55); font-family: 'Courier New', monospace;
}
.ap-output-dot { color: var(--t3); font-size: 10px; }
.ap-output-ts  { font-size: 10px; color: var(--t3); font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace; }
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
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 1px;
}
.ap-gauge-num {
  font-size: 30px; font-weight: 900; color: var(--t1); line-height: 1;
  letter-spacing: -0.05em; font-variant-numeric: tabular-nums;
}
.ap-gauge-denom { font-size: 11px; font-weight: 600; color: var(--t3); }
.ap-gauge-name {
  font-size: 7.5px; font-weight: 800; letter-spacing: .1em;
  color: var(--t3); text-transform: uppercase; text-align: center; max-width: 110px;
}
.ap-gauge-ci {
  font-size: 8px; color: rgba(255,255,255,.15);
  letter-spacing: .04em; font-variant-numeric: tabular-nums; text-align: center;
}

.ap-score-side { display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0; }
.ap-risk-badge {
  display: inline-flex; align-items: center;
  font-size: 10px; font-weight: 800; letter-spacing: .1em;
  padding: 4px 11px; border-radius: 5px; border: 1px solid;
  align-self: flex-start;
}
.ap-verdict {
  font-size: 26px; font-weight: 900; line-height: 1; letter-spacing: -0.04em;
}

.ap-score-data { display: flex; flex-direction: column; gap: 8px; margin-top: 2px; }
.ap-score-data-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ap-score-data-lbl {
  font-size: 8px; font-weight: 800; letter-spacing: .12em;
  color: var(--t3); text-transform: uppercase; min-width: 88px; flex-shrink: 0;
}
.ap-score-data-val {
  font-size: 12px; font-weight: 700; color: var(--t2);
  font-variant-numeric: tabular-nums;
}
.ap-score-data-val-lg {
  font-size: 18px; font-weight: 800; color: var(--t1);
  letter-spacing: -0.03em;
}

.ap-exposure-row { display: flex; align-items: center; gap: 8px; flex: 1; }
.ap-exposure-track {
  flex: 1; height: 3px; background: rgba(255,255,255,.07);
  border-radius: 99px; overflow: hidden; max-width: 100px;
}
.ap-exposure-fill { height: 100%; border-radius: 99px; transition: width .6s ease; animation: ap-bar-in .6s ease both; }
.ap-exposure-val { font-size: 11px; font-weight: 800; font-variant-numeric: tabular-nums; }

/* Probability Distortion */
.ap-prob-panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.ap-prob-hdr { display: flex; justify-content: space-between; align-items: center; }
.ap-prob-title {
  font-size: 8px; font-weight: 800; letter-spacing: .14em;
  color: var(--t3); text-transform: uppercase;
}
.ap-prob-vig {
  font-size: 8px; font-weight: 700; letter-spacing: .06em;
  color: rgba(245,158,11,.5); font-family: 'Courier New', monospace;
}
.ap-prob-bar {
  display: flex; height: 5px; border-radius: 99px; overflow: hidden; gap: 2px;
}
.ap-prob-win  { background: var(--green); border-radius: 99px 0 0 99px; animation: ap-bar-in .65s ease-out both; }
.ap-prob-lose { flex: 1; background: var(--red); border-radius: 0 99px 99px 0; }
.ap-prob-labels { display: flex; justify-content: space-between; }
.ap-prob-w { font-size: 9px; font-weight: 800; color: var(--green); letter-spacing: .05em; }
.ap-prob-l { font-size: 9px; font-weight: 800; color: var(--red);   letter-spacing: .05em; }

/* Metrics grid */
.ap-metrics-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px;
}
.ap-metric-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 13px 12px;
  display: flex; flex-direction: column; gap: 5px;
  transition: border-color .14s;
}
.ap-metric-card:hover { border-color: var(--bmd); }
.ap-metric-val {
  font-size: clamp(16px, 2.2vw, 21px); font-weight: 900; line-height: 1;
  letter-spacing: -0.04em; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum';
}
.ap-metric-label {
  font-size: 7.5px; font-weight: 800; letter-spacing: .12em;
  color: var(--t3); text-transform: uppercase;
}
.ap-tm { font-size: 7px; vertical-align: super; opacity: .7; }
.ap-metric-sub { font-size: 10px; color: var(--t3); line-height: 1.4; }

/* AI Modules */
.ap-ai-section { display: flex; flex-direction: column; gap: 9px; }
.ap-ai-hdr {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 9px; border-bottom: 1px solid var(--border);
}
.ap-ai-hdr-title {
  font-size: 8px; font-weight: 800; letter-spacing: .18em; color: var(--t3);
}
.ap-ai-hdr-tag {
  font-size: 8px; font-weight: 700; letter-spacing: .06em;
  color: rgba(34,197,94,.4);
}
.ap-ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.ap-ai-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 13px 14px;
  display: flex; flex-direction: column; gap: 5px;
  transition: border-color .14s;
}
.ap-ai-card:hover { border-color: var(--bmd); }
.ap-ai-card-mod {
  font-size: 7.5px; font-weight: 800; letter-spacing: .12em;
  color: rgba(34,197,94,.45); font-family: 'Courier New', monospace;
}
.ap-ai-card-title {
  font-size: 9px; font-weight: 800; letter-spacing: .1em;
  color: var(--t3); text-transform: uppercase; margin-bottom: 2px;
}
.ap-ai-card-text { font-size: 12px; color: var(--t2); line-height: 1.8; }

.ap-alerta {
  display: flex; flex-direction: column; gap: 8px;
  background: rgba(239,68,68,.04); border: 1px solid rgba(239,68,68,.16);
  border-radius: 10px; padding: 14px 16px;
}
.ap-alerta-hdr { display: flex; align-items: center; gap: 8px; }
.ap-alerta-icon { font-size: 9px; color: var(--red); }
.ap-alerta-tag {
  font-size: 8px; font-weight: 800; letter-spacing: .12em; color: var(--red);
  opacity: .7;
}
.ap-alerta-text { font-size: 12px; color: var(--t2); line-height: 1.8; }

.ap-disclaimer {
  font-size: 10px; color: var(--t3); text-align: center;
  padding-top: 8px; border-top: 1px solid var(--border); line-height: 1.6;
}

/* ─ History ───────────────────────────────────────────────────────────────── */
.ap-hist-list { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
.ap-hist-row {
  display: grid;
  grid-template-columns: 52px 1fr 58px 70px 30px 64px 46px;
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

/* ─ Config ────────────────────────────────────────────────────────────────── */
.ap-empty { font-size: 13px; color: var(--t3); text-align: center; padding: 52px 0; }
.ap-config-panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px 20px; margin-top: 10px;
  display: flex; flex-direction: column; gap: 16px;
}
.ap-config-field { display: flex; flex-direction: column; gap: 8px; }
.ap-config-hint  { font-size: 11px; color: var(--t3); line-height: 1.65; }
.ap-config-info  { display: flex; flex-direction: column; border-top: 1px solid var(--border); padding-top: 14px; }
.ap-config-row   {
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--t2); padding: 9px 0;
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.ap-config-row span:last-child { color: var(--t3); font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace; font-size: 11px; }
.ap-config-online { color: rgba(34,197,94,.6) !important; }

/* ─ Mobile ────────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .ap-hamburger { display: flex; }
  .ap-sidebar {
    position: fixed; top: 46px; left: 0; bottom: 0;
    z-index: 50; transform: translateX(-100%);
    width: 220px; box-shadow: 4px 0 24px rgba(0,0,0,.5);
  }
  .ap-sidebar-open { transform: translateX(0); }
}
@media (max-width: 640px) {
  .ap-content { padding: 14px 13px; }
  .ap-topbar { padding: 0 12px; }
  .ap-live-lbl { display: none; }
  .ap-topbar-tag { display: none; }
  .ap-topbar-aid { display: none; }
  .ap-metrics-grid { grid-template-columns: 1fr 1fr; }
  .ap-ai-grid { grid-template-columns: 1fr; }
  .ap-row-2 { grid-template-columns: 1fr; }
  .ap-score-hero { flex-direction: column; align-items: flex-start; gap: 18px; padding: 18px 16px; }
  .ap-score-data-lbl { min-width: 80px; }
  .ap-hist-row { grid-template-columns: 1fr 36px 28px 52px; }
  .ap-hist-id, .ap-hist-odd, .ap-hist-bar, .ap-hist-ts { display: none; }
  .ap-loading-pct { font-size: 44px; }
}
`;
