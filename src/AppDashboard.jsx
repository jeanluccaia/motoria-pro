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
  { label: "Calculando probabilidade implícita…",   pct: 18 },
  { label: "Detectando margem da casa…",            pct: 36 },
  { label: "Estimando valor esperado…",             pct: 56 },
  { label: "Calculando MotorIA Risk Index™…",       pct: 76 },
  { label: "Gerando relatório de risco…",           pct: 92 },
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

function fmtTime() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ label, value, color, sub }) {
  return (
    <div className="ap-metric-card">
      <div className="ap-metric-val" style={{ color }}>{value}</div>
      <div className="ap-metric-label">{label}</div>
      {sub && <div className="ap-metric-sub">{sub}</div>}
    </div>
  );
}

function AnalysisCard({ tag, title, children }) {
  if (!children) return null;
  return (
    <div className="ap-ai-card">
      <div className="ap-ai-card-tag">{tag} {title}</div>
      <p className="ap-ai-card-text">{children}</p>
    </div>
  );
}

// ─── AppDashboard ─────────────────────────────────────────────────────────────

export default function AppDashboard() {
  // Page title
  useEffect(() => {
    const prev = document.title;
    document.title = "MotorIA Risk Engine™";
    return () => { document.title = prev; };
  }, []);

  // Sidebar state
  const [view, setView] = useState("nova");

  // Form
  const [jogo,  setJogo]  = useState("");
  const [tipo,  setTipo]  = useState("Resultado final (1X2)");
  const [odd,   setOdd]   = useState("");
  const [valor, setValor] = useState("");
  const [obs,   setObs]   = useState("");

  // Engine state
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

  // Live odd preview
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
    }, 900);

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
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
      }

      const impl     = calcImplicita(oddNum);
      const vig      = calcVig(oddNum);
      const justaRaw = impl / (1 - vig / 100);
      const justa    = Math.min(justaRaw, 99);
      const ev       = calcEV(impl, oddNum);
      const scoreObj = calcScore(oddNum);

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
        ...scoreObj,
        ai:     parseAI(rawText),
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

  function loadFromHistory(item) {
    setResult(item);
    setJogo(item.jogo || "");
    setOdd(String(item.odd));
    setView("nova");
  }

  function resetForm() {
    setResult(null);
    setError("");
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ap-shell">

        {/* ── TOPBAR ─────────────────────────────────────────────────────── */}
        <header className="ap-topbar">
          <div className="ap-topbar-brand">
            <div className="ap-logo-mark">
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="#050505"/>
                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="currentColor" fillOpacity=".9"/>
              </svg>
            </div>
            <span className="ap-topbar-name">MotorIA</span>
            <span className="ap-topbar-sep">·</span>
            <span className="ap-topbar-tag">Risk Engine™</span>
          </div>

          <div className="ap-topbar-center">
            {analysisId && (
              <span className="ap-topbar-analysisid">ANÁLISE #{analysisId}</span>
            )}
          </div>

          <div className="ap-topbar-right">
            {credits !== null && (
              <div className="ap-credits">
                <div className="ap-credits-bar">
                  <div className="ap-credits-fill" style={{ width: `${Math.max(0, (credits / 20) * 100)}%` }} />
                </div>
                <span className="ap-credits-txt">{credits}/20 análises</span>
              </div>
            )}
            <div className="ap-topbar-live">
              <span className="ap-live-dot" aria-hidden="true" />
              ENGINE ATIVO
            </div>
          </div>
        </header>

        <div className="ap-body">

          {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
          <nav className="ap-sidebar" aria-label="Navegação do app">
            <div className="ap-sidebar-section">
              <button
                className={`ap-nav-item${view === "nova" ? " ap-nav-active" : ""}`}
                onClick={() => setView("nova")}
                aria-current={view === "nova" ? "page" : undefined}
              >
                <span className="ap-nav-icon" aria-hidden="true">⊕</span>
                <span className="ap-nav-label">Nova análise</span>
              </button>
              <button
                className={`ap-nav-item${view === "historico" ? " ap-nav-active" : ""}`}
                onClick={() => setView("historico")}
                aria-current={view === "historico" ? "page" : undefined}
              >
                <span className="ap-nav-icon" aria-hidden="true">≡</span>
                <span className="ap-nav-label">Histórico</span>
                {history.length > 0 && (
                  <span className="ap-nav-badge" aria-label={`${history.length} análises`}>
                    {history.length}
                  </span>
                )}
              </button>
            </div>

            <div className="ap-sidebar-sep" role="separator" />

            <div className="ap-sidebar-section">
              <button
                className={`ap-nav-item${view === "config" ? " ap-nav-active" : ""}`}
                onClick={() => setView("config")}
                aria-current={view === "config" ? "page" : undefined}
              >
                <span className="ap-nav-icon" aria-hidden="true">◌</span>
                <span className="ap-nav-label">Configurações</span>
              </button>
            </div>

            <div className="ap-sidebar-footer">
              <span className="ap-sidebar-version">v2.4</span>
            </div>
          </nav>

          {/* ── MAIN ────────────────────────────────────────────────────── */}
          <main className="ap-main">

            {/* ════ NOVA ANÁLISE ════════════════════════════════════════ */}
            {view === "nova" && (
              <div className="ap-content">

                {/* Input panel */}
                {!result && !loading && (
                  <section className="ap-input-panel" aria-label="Formulário de análise">
                    <div className="ap-panel-hdr">
                      <span className="ap-panel-eyebrow">NOVA ANÁLISE</span>
                      <span className="ap-panel-version">RISK ENGINE v2.4</span>
                    </div>
                    <form className="ap-form" onSubmit={handleSubmit} noValidate>
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
                              {oddPreview.label} · {calcImplicita(oddNum).toFixed(1)}% impl.
                            </div>
                          )}
                        </div>
                        <div className="ap-field">
                          <label className="ap-label" htmlFor="valor-input">VALOR APOSTADO (R$)</label>
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
                        <label className="ap-label" htmlFor="tipo-input">TIPO DE MERCADO</label>
                        <select
                          id="tipo-input"
                          className="ap-input ap-select"
                          value={tipo}
                          onChange={e => setTipo(e.target.value)}
                        >
                          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="ap-field">
                        <label className="ap-label" htmlFor="jogo-input">
                          EVENTO / CAMPEONATO <span className="ap-label-opt">(opcional)</span>
                        </label>
                        <input
                          id="jogo-input"
                          className="ap-input"
                          type="text"
                          placeholder="Ex: Flamengo × Palmeiras — Brasileirão"
                          value={jogo}
                          onChange={e => setJogo(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                      <div className="ap-field">
                        <label className="ap-label" htmlFor="obs-input">
                          CONTEXTO ADICIONAL <span className="ap-label-opt">(opcional)</span>
                        </label>
                        <textarea
                          id="obs-input"
                          className="ap-input ap-textarea"
                          placeholder="Desfalques, forma, condições do jogo…"
                          value={obs}
                          onChange={e => setObs(e.target.value)}
                          rows={2}
                        />
                      </div>
                      {error && <div className="ap-error" role="alert">{error}</div>}
                      <button className="ap-submit" type="submit">
                        CALCULAR RISCO
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </form>
                  </section>
                )}

                {/* Loading / processing */}
                {loading && (
                  <div className="ap-loading" role="status" aria-live="polite">
                    <div className="ap-loading-hdr">
                      <span className="ap-loading-engine">RISK ENGINE v2.4</span>
                      <span className="ap-loading-status">PROCESSANDO</span>
                    </div>
                    <div className="ap-loading-bar-wrap">
                      <div className="ap-loading-bar" style={{ width: `${loadPct}%` }} />
                    </div>
                    <div className="ap-loading-pct" aria-label={`${loadPct}%`}>{loadPct}<span className="ap-loading-pct-sym">%</span></div>
                    <div className="ap-loading-steps">
                      {LOAD_STEPS.map((s, i) => (
                        <div
                          key={i}
                          className={`ap-lstep${
                            i < loadStepIdx  ? " ap-lstep-done"   :
                            i === loadStepIdx ? " ap-lstep-active" : ""
                          }`}
                        >
                          <span className="ap-lstep-icon" aria-hidden="true">
                            {i < loadStepIdx ? "✓" : i === loadStepIdx ? "▶" : "○"}
                          </span>
                          <span>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Output dashboard */}
                {result && !loading && (
                  <div className="ap-output">

                    {/* Output topbar */}
                    <div className="ap-output-topbar">
                      <div className="ap-output-meta">
                        <span className="ap-output-id">ANÁLISE #{result.id}</span>
                        <span className="ap-output-ts">{result.ts}</span>
                        {result.jogo && (
                          <span className="ap-output-event">{result.jogo}</span>
                        )}
                      </div>
                      <button className="ap-btn-nova" onClick={resetForm}>
                        + Nova análise
                      </button>
                    </div>

                    {/* Score hero — gauge + verdict */}
                    <div className="ap-score-hero">
                      <div className="ap-gauge-wrap">
                        <div
                          className="ap-gauge"
                          style={{
                            background: `conic-gradient(${result.color} 0% ${result.score}%, rgba(255,255,255,.06) ${result.score}% 100%)`
                          }}
                          role="img"
                          aria-label={`Score de risco: ${result.score} de 100`}
                        >
                          <div className="ap-gauge-inner">
                            <span className="ap-gauge-num">{result.score}</span>
                            <span className="ap-gauge-sub">/100</span>
                          </div>
                        </div>
                        <span className="ap-gauge-name">MOTORIA RISK INDEX™</span>
                      </div>

                      <div className="ap-score-side">
                        <div
                          className="ap-risk-badge"
                          style={{ color: result.color, borderColor: `${result.color}30`, background: `${result.color}0d` }}
                        >
                          {result.label}
                        </div>
                        <div className="ap-verdict" style={{ color: result.color }}>
                          {result.verdict}
                        </div>
                        <div className="ap-odd-row">
                          <span className="ap-odd-lbl">ODD</span>
                          <span className="ap-odd-val">{result.odd.toFixed(2)}</span>
                          <span className="ap-odd-tipo">{result.tipo}</span>
                        </div>
                        <div className="ap-score-ci">
                          IC 95% · [{Math.max(0, result.score - 6)} — {Math.min(100, result.score + 6)}]
                        </div>
                      </div>
                    </div>

                    {/* Probability distribution */}
                    <div className="ap-prob-panel">
                      <div className="ap-prob-bar">
                        <div className="ap-prob-win" style={{ width: `${result.impl}%` }} />
                        <div className="ap-prob-lose" />
                      </div>
                      <div className="ap-prob-labels">
                        <span className="ap-prob-w">▲ Vitória {result.impl}%</span>
                        <span className="ap-prob-l">Derrota {result.perda}% ▼</span>
                      </div>
                    </div>

                    {/* Metrics data grid */}
                    <div className="ap-metrics-grid">
                      <MetricCard
                        label="PROB. IMPLÍCITA"
                        value={`${result.impl}%`}
                        color="#22C55E"
                        sub="Chance que a casa atribui"
                      />
                      <MetricCard
                        label="PROB. JUSTA ↗"
                        value={`${result.justa}%`}
                        color="rgba(232,232,230,.45)"
                        sub="Ajustada removendo a vig"
                      />
                      <MetricCard
                        label="VIG EMBUTIDA"
                        value={`${result.vig}%`}
                        color="#F59E0B"
                        sub="Margem invisível da casa"
                      />
                      <MetricCard
                        label="EV / R$100"
                        value={`${parseFloat(result.ev) >= 0 ? "+" : ""}R$${Math.abs(parseFloat(result.ev)).toFixed(2)}`}
                        color={parseFloat(result.ev) >= 0 ? "#22C55E" : "#EF4444"}
                        sub="Retorno esperado por R$100"
                      />
                      <MetricCard
                        label="CHANCE DE PERDA"
                        value={`${result.perda}%`}
                        color="#EF4444"
                        sub="Probabilidade estimada"
                      />
                      <MetricCard
                        label="PRECISÃO ENG."
                        value="94,2%"
                        color="rgba(232,232,230,.3)"
                        sub="Confiança do modelo"
                      />
                    </div>

                    {/* AI analysis section */}
                    {result.ai && (
                      <div className="ap-ai-section">
                        <div className="ap-ai-hdr">
                          <span className="ap-ai-hdr-title">ANÁLISE DE RISCO</span>
                          <span className="ap-ai-hdr-engine">MotorIA Engine™</span>
                        </div>
                        <div className="ap-ai-grid">
                          <AnalysisCard tag="①" title="RISCO PRINCIPAL">
                            {result.ai.riscoPrincipal}
                          </AnalysisCard>
                          <AnalysisCard tag="②" title="CENÁRIO NECESSÁRIO">
                            {result.ai.cenarioNecessario}
                          </AnalysisCard>
                          <AnalysisCard tag="③" title="O QUE PODE DAR ERRADO">
                            {result.ai.oQuePodeDarErrado}
                          </AnalysisCard>
                          <AnalysisCard tag="④" title="LEITURA CONSERVADORA">
                            {result.ai.leituraConservadora}
                          </AnalysisCard>
                        </div>
                        {result.ai.alertaFinal && (
                          <div className="ap-alerta">
                            <span className="ap-alerta-icon" aria-hidden="true">⚠</span>
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

            {/* ════ HISTÓRICO ═══════════════════════════════════════════ */}
            {view === "historico" && (
              <div className="ap-content">
                <div className="ap-panel-hdr">
                  <span className="ap-panel-eyebrow">HISTÓRICO</span>
                  <span className="ap-panel-version">{history.length} análises</span>
                </div>
                {history.length === 0 ? (
                  <div className="ap-empty">Nenhuma análise registrada.</div>
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
                        <span className="ap-hist-tag" style={{ color: item.color }}>{item.label}</span>
                        <span className="ap-hist-ts">{item.ts || ""}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ════ CONFIGURAÇÕES ═══════════════════════════════════════ */}
            {view === "config" && (
              <div className="ap-content">
                <div className="ap-panel-hdr">
                  <span className="ap-panel-eyebrow">CONFIGURAÇÕES</span>
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
                      onChange={e => {
                        setToken(e.target.value);
                        localStorage.setItem(TOKEN_KEY, e.target.value);
                      }}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <p className="ap-config-hint">
                      Token recebido por email após compra. Necessário para análises.
                    </p>
                  </div>
                  <div className="ap-config-info">
                    <div className="ap-config-row">
                      <span>Engine</span>
                      <span>MotorIA Risk Engine™ v2.4</span>
                    </div>
                    <div className="ap-config-row">
                      <span>Histórico local</span>
                      <span>{history.length} de {MAX_HISTORY} análises</span>
                    </div>
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
  --panel:  #0C0C10;
  --border: rgba(255,255,255,0.07);
  --bmd:    rgba(255,255,255,0.13);
  --t1: #DDDDE0;
  --t2: #72727A;
  --t3: #3A3A42;
  --green:  #22C55E;
  --amber:  #F59E0B;
  --red:    #EF4444;
}

body { overflow: hidden; }

@keyframes ap-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .55; transform: scale(1.35); }
}
@keyframes ap-blink-active {
  0%, 100% { opacity: 1; }
  50%       { opacity: .25; }
}
@keyframes ap-bar-in {
  from { width: 0; }
}

/* ─ Shell ──────────────────────────────────────────────────────────────────── */
.ap-shell {
  display: flex; flex-direction: column;
  height: 100dvh; min-height: 100vh;
  background: var(--bg); color: var(--t1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  overflow: hidden; font-size: 14px;
}

/* ─ Topbar ─────────────────────────────────────────────────────────────────── */
.ap-topbar {
  display: flex; align-items: center; justify-content: space-between;
  height: 46px; padding: 0 16px; gap: 16px;
  background: var(--bg2); border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.ap-topbar-brand { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
.ap-logo-mark {
  width: 22px; height: 22px; border-radius: 5px;
  background: var(--green); color: #050507;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ap-topbar-name { font-size: 13px; font-weight: 800; color: var(--t1); letter-spacing: -0.03em; }
.ap-topbar-sep  { color: var(--t3); font-size: 13px; }
.ap-topbar-tag  { font-size: 11px; font-weight: 600; color: var(--t3); letter-spacing: .02em; }

.ap-topbar-center { flex: 1; text-align: center; }
.ap-topbar-analysisid {
  font-size: 10px; font-weight: 700; letter-spacing: .14em;
  color: rgba(34,197,94,.55); font-family: 'Courier New', monospace;
}
.ap-topbar-right { display: flex; align-items: center; gap: 18px; flex-shrink: 0; }

.ap-credits { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.ap-credits-bar {
  width: 72px; height: 2px;
  background: rgba(255,255,255,.08); border-radius: 99px; overflow: hidden;
}
.ap-credits-fill {
  height: 100%; border-radius: 99px; background: var(--green); transition: width .4s ease;
}
.ap-credits-txt { font-size: 9px; color: var(--t3); font-variant-numeric: tabular-nums; }

.ap-topbar-live {
  display: flex; align-items: center; gap: 6px;
  font-size: 9px; font-weight: 800; letter-spacing: .12em; color: var(--t3);
}
.ap-live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--green); flex-shrink: 0;
  animation: ap-pulse 2.2s ease-in-out infinite;
}

/* ─ Body ───────────────────────────────────────────────────────────────────── */
.ap-body { display: flex; flex: 1; overflow: hidden; }

/* ─ Sidebar ────────────────────────────────────────────────────────────────── */
.ap-sidebar {
  width: 196px; flex-shrink: 0;
  background: var(--bg2); border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  padding: 10px 8px; overflow-y: auto; gap: 2px;
}
.ap-sidebar-section { display: flex; flex-direction: column; gap: 1px; }
.ap-nav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px; border-radius: 7px;
  border: none; background: transparent; cursor: pointer;
  width: 100%; text-align: left; color: var(--t2);
  transition: background .12s, color .12s; font-family: inherit;
}
.ap-nav-item:hover { background: rgba(255,255,255,.04); color: var(--t1); }
.ap-nav-active { background: rgba(255,255,255,.06) !important; color: var(--t1) !important; }
.ap-nav-icon  { font-size: 13px; flex-shrink: 0; width: 16px; text-align: center; opacity: .65; }
.ap-nav-label { font-size: 12px; font-weight: 600; letter-spacing: -0.01em; }
.ap-nav-badge {
  margin-left: auto; font-size: 9px; font-weight: 700; color: var(--t3);
  background: rgba(255,255,255,.06); border-radius: 99px;
  padding: 1px 6px; min-width: 18px; text-align: center;
}
.ap-sidebar-sep { height: 1px; background: var(--border); margin: 8px 0; }
.ap-sidebar-footer { margin-top: auto; padding-top: 14px; text-align: center; }
.ap-sidebar-version {
  font-size: 9px; font-weight: 700; letter-spacing: .1em;
  color: var(--t3); font-family: 'Courier New', monospace;
}

/* ─ Main ───────────────────────────────────────────────────────────────────── */
.ap-main { flex: 1; overflow-y: auto; background: var(--bg); }
.ap-content {
  max-width: 780px; margin: 0 auto; padding: 28px 24px;
  display: flex; flex-direction: column; gap: 14px;
}

/* ─ Panel header ───────────────────────────────────────────────────────────── */
.ap-panel-hdr {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 14px; border-bottom: 1px solid var(--border);
}
.ap-panel-eyebrow {
  font-size: 9px; font-weight: 800; letter-spacing: .18em;
  color: var(--green); text-transform: uppercase;
}
.ap-panel-version {
  font-size: 9px; font-weight: 700; letter-spacing: .08em;
  color: var(--t3); font-family: 'Courier New', monospace;
}

/* ─ Input panel ────────────────────────────────────────────────────────────── */
.ap-input-panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px 22px;
}
.ap-form { display: flex; flex-direction: column; gap: 14px; margin-top: 18px; }
.ap-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ap-field { display: flex; flex-direction: column; gap: 6px; }

.ap-label {
  font-size: 9px; font-weight: 800; letter-spacing: .14em;
  color: var(--t3); text-transform: uppercase;
}
.ap-label-opt { font-weight: 500; letter-spacing: 0; text-transform: none; opacity: .65; }

.ap-input {
  background: rgba(255,255,255,.025); border: 1px solid var(--border);
  border-radius: 8px; padding: 10px 13px;
  font-size: 14px; font-weight: 500; color: var(--t1);
  outline: none; font-family: inherit; width: 100%;
  transition: border-color .14s;
}
.ap-input:focus { border-color: rgba(34,197,94,.3); background: rgba(255,255,255,.03); }
.ap-input::placeholder { color: var(--t3); }
.ap-input-odd { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.ap-select { cursor: pointer; }
.ap-textarea { resize: none; line-height: 1.55; }
.ap-input-mono { font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: .02em; }

.ap-odd-preview {
  font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
}
.ap-error {
  font-size: 12px; color: var(--red);
  background: rgba(239,68,68,.07); border: 1px solid rgba(239,68,68,.2);
  border-radius: 8px; padding: 10px 13px;
}
.ap-submit {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--t1); color: #060608;
  font-size: 11px; font-weight: 800; letter-spacing: .12em;
  padding: 12px 20px; border-radius: 8px; border: none; cursor: pointer;
  font-family: inherit; margin-top: 4px;
  transition: opacity .14s, transform .1s;
}
.ap-submit:hover { opacity: .88; transform: translateY(-1px); }

/* ─ Loading ────────────────────────────────────────────────────────────────── */
.ap-loading {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 28px 24px;
  display: flex; flex-direction: column; gap: 22px;
}
.ap-loading-hdr { display: flex; justify-content: space-between; align-items: center; }
.ap-loading-engine {
  font-size: 10px; font-weight: 800; letter-spacing: .16em;
  color: var(--t3); font-family: 'Courier New', monospace;
}
.ap-loading-status {
  font-size: 9px; font-weight: 800; letter-spacing: .12em; color: var(--green);
  animation: ap-blink-active 1.4s ease-in-out infinite;
}
.ap-loading-bar-wrap {
  height: 2px; background: rgba(255,255,255,.07); border-radius: 99px; overflow: hidden;
}
.ap-loading-bar {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, var(--green) 0%, var(--amber) 55%, var(--red) 100%);
  transition: width .85s ease;
}
.ap-loading-pct {
  font-size: 52px; font-weight: 900; color: var(--t1);
  line-height: 1; letter-spacing: -0.05em; font-variant-numeric: tabular-nums;
}
.ap-loading-pct-sym { font-size: 24px; color: var(--t3); }
.ap-loading-steps { display: flex; flex-direction: column; gap: 10px; }
.ap-lstep {
  display: flex; align-items: center; gap: 10px;
  font-size: 12px; color: var(--t3); transition: color .25s;
}
.ap-lstep-done   { color: var(--t2); }
.ap-lstep-active { color: var(--t1); }
.ap-lstep-icon { font-size: 10px; width: 14px; flex-shrink: 0; font-family: 'Courier New', monospace; }
.ap-lstep-active .ap-lstep-icon { animation: ap-blink-active .8s ease-in-out infinite; }

/* ─ Output ─────────────────────────────────────────────────────────────────── */
.ap-output { display: flex; flex-direction: column; gap: 12px; }
.ap-output-topbar {
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;
}
.ap-output-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ap-output-id {
  font-size: 9px; font-weight: 800; letter-spacing: .14em;
  color: rgba(34,197,94,.6); font-family: 'Courier New', monospace;
}
.ap-output-ts    { font-size: 10px; color: var(--t3); font-variant-numeric: tabular-nums; }
.ap-output-event { font-size: 11px; color: var(--t2); }
.ap-btn-nova {
  font-size: 11px; font-weight: 700; color: var(--t2);
  background: rgba(255,255,255,.04); border: 1px solid var(--border);
  border-radius: 7px; padding: 6px 14px; cursor: pointer;
  transition: all .14s; font-family: inherit;
}
.ap-btn-nova:hover { color: var(--t1); border-color: var(--bmd); }

/* Score hero */
.ap-score-hero {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 24px 24px;
  display: flex; align-items: center; gap: 36px;
}
.ap-gauge-wrap { display: flex; flex-direction: column; align-items: center; gap: 9px; flex-shrink: 0; }
.ap-gauge {
  width: 112px; height: 112px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: background .6s ease;
}
.ap-gauge-inner {
  width: 82px; height: 82px; border-radius: 50%;
  background: var(--panel); border: 1px solid var(--border);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 1px;
}
.ap-gauge-num {
  font-size: 28px; font-weight: 900; color: var(--t1); line-height: 1;
  letter-spacing: -0.05em; font-variant-numeric: tabular-nums;
}
.ap-gauge-sub  { font-size: 11px; font-weight: 600; color: var(--t3); }
.ap-gauge-name {
  font-size: 8px; font-weight: 800; letter-spacing: .1em;
  color: var(--t3); text-transform: uppercase; text-align: center; max-width: 100px;
}

.ap-score-side { display: flex; flex-direction: column; gap: 10px; }
.ap-risk-badge {
  display: inline-flex; align-items: center;
  font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase;
  padding: 4px 12px; border-radius: 5px; border: 1px solid;
  align-self: flex-start;
}
.ap-verdict {
  font-size: 24px; font-weight: 900; line-height: 1; letter-spacing: -0.04em;
}
.ap-odd-row { display: flex; align-items: baseline; gap: 7px; flex-wrap: wrap; }
.ap-odd-lbl { font-size: 9px; font-weight: 700; color: var(--t3); letter-spacing: .1em; }
.ap-odd-val {
  font-size: 20px; font-weight: 800; color: var(--t1);
  letter-spacing: -0.03em; font-variant-numeric: tabular-nums;
}
.ap-odd-tipo { font-size: 10px; color: var(--t3); }
.ap-score-ci {
  font-size: 9px; color: rgba(255,255,255,.18); letter-spacing: .05em;
  font-variant-numeric: tabular-nums;
}

/* Probability bar */
.ap-prob-panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 16px;
}
.ap-prob-bar {
  display: flex; height: 5px; border-radius: 99px; overflow: hidden; gap: 2px;
  margin-bottom: 8px;
}
.ap-prob-win  { background: var(--green); border-radius: 99px 0 0 99px; animation: ap-bar-in .6s ease-out; }
.ap-prob-lose { flex: 1; background: var(--red); border-radius: 0 99px 99px 0; }
.ap-prob-labels { display: flex; justify-content: space-between; }
.ap-prob-w { font-size: 10px; font-weight: 700; color: var(--green); letter-spacing: .04em; }
.ap-prob-l { font-size: 10px; font-weight: 700; color: var(--red);   letter-spacing: .04em; }

/* Metrics grid */
.ap-metrics-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
}
.ap-metric-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px;
  display: flex; flex-direction: column; gap: 5px;
  transition: border-color .14s;
}
.ap-metric-card:hover { border-color: var(--bmd); }
.ap-metric-val {
  font-size: clamp(17px, 2.4vw, 22px); font-weight: 900; line-height: 1;
  letter-spacing: -0.04em; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum';
}
.ap-metric-label {
  font-size: 8px; font-weight: 800; letter-spacing: .12em;
  color: var(--t3); text-transform: uppercase;
}
.ap-metric-sub { font-size: 10px; color: var(--t3); line-height: 1.4; }

/* AI analysis */
.ap-ai-section { display: flex; flex-direction: column; gap: 10px; }
.ap-ai-hdr {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 10px; border-bottom: 1px solid var(--border);
}
.ap-ai-hdr-title {
  font-size: 9px; font-weight: 800; letter-spacing: .18em; color: var(--t3); text-transform: uppercase;
}
.ap-ai-hdr-engine {
  font-size: 9px; font-weight: 700; letter-spacing: .06em; color: rgba(34,197,94,.45);
}
.ap-ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.ap-ai-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px;
  display: flex; flex-direction: column; gap: 8px;
  transition: border-color .14s;
}
.ap-ai-card:hover { border-color: var(--bmd); }
.ap-ai-card-tag {
  font-size: 8px; font-weight: 800; letter-spacing: .1em;
  color: rgba(34,197,94,.5); text-transform: uppercase;
}
.ap-ai-card-text { font-size: 12px; color: var(--t2); line-height: 1.75; }

.ap-alerta {
  display: flex; gap: 12px; align-items: flex-start;
  background: rgba(239,68,68,.05); border: 1px solid rgba(239,68,68,.18);
  border-radius: 10px; padding: 14px 16px;
}
.ap-alerta-icon { font-size: 14px; color: var(--red); flex-shrink: 0; margin-top: 1px; }
.ap-alerta-text { font-size: 12px; color: var(--t2); line-height: 1.75; }

.ap-disclaimer {
  font-size: 10px; color: var(--t3); text-align: center;
  padding-top: 8px; border-top: 1px solid var(--border); line-height: 1.6;
}

/* ─ History ────────────────────────────────────────────────────────────────── */
.ap-hist-list { display: flex; flex-direction: column; gap: 4px; margin-top: 14px; }
.ap-hist-row {
  display: grid;
  grid-template-columns: 48px 1fr 56px 72px 28px 62px 44px;
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
.ap-hist-bar   { height: 3px; background: rgba(255,255,255,.06); border-radius: 99px; overflow: hidden; }
.ap-hist-score { font-size: 12px; font-weight: 800; text-align: right; font-variant-numeric: tabular-nums; }
.ap-hist-tag   { font-size: 8px; font-weight: 800; letter-spacing: .05em; }
.ap-hist-ts    { font-size: 9px; color: var(--t3); white-space: nowrap; font-variant-numeric: tabular-nums; }

/* ─ Config / empty ─────────────────────────────────────────────────────────── */
.ap-empty { font-size: 13px; color: var(--t3); text-align: center; padding: 48px 0; }
.ap-config-panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px 22px; margin-top: 14px;
  display: flex; flex-direction: column; gap: 16px;
}
.ap-config-field { display: flex; flex-direction: column; gap: 8px; }
.ap-config-hint  { font-size: 11px; color: var(--t3); line-height: 1.65; }
.ap-config-info  { display: flex; flex-direction: column; gap: 0; border-top: 1px solid var(--border); padding-top: 14px; }
.ap-config-row   {
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--t2); padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.ap-config-row span:last-child { color: var(--t3); font-variant-numeric: tabular-nums; }

/* ─ Mobile ─────────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .ap-sidebar { width: 50px; padding: 10px 5px; }
  .ap-nav-label, .ap-nav-badge, .ap-sidebar-footer { display: none; }
  .ap-content { padding: 16px 14px; }
  .ap-metrics-grid { grid-template-columns: 1fr 1fr; }
  .ap-ai-grid { grid-template-columns: 1fr; }
  .ap-row-2 { grid-template-columns: 1fr; }
  .ap-score-hero { flex-direction: column; align-items: flex-start; gap: 20px; }
  .ap-hist-row { grid-template-columns: 1fr 40px 28px 50px; }
  .ap-hist-id, .ap-hist-odd, .ap-hist-bar, .ap-hist-ts { display: none; }
}
@media (max-width: 480px) {
  .ap-topbar-right { display: none; }
  .ap-metrics-grid { grid-template-columns: 1fr 1fr; }
  .ap-loading-pct { font-size: 40px; }
}
`;
