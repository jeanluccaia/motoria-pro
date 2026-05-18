import { useState, useRef, useEffect } from "react";
import { Link } from "./router";

// ─── Constantes ────────────────────────────────────────────────────────────────

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
  { label: "Calculando a chance real de ganhar…",        pct: 18 },
  { label: "Detectando o corte da casa…",                pct: 36 },
  { label: "Medindo o nível de perigo da aposta…",       pct: 56 },
  { label: "Encontrando o que a plataforma esconde…",    pct: 76 },
  { label: "Preparando sua análise completa…",           pct: 92 },
];

const TOKEN_KEY     = "motoria_token";
const HISTORY_KEY   = "motoria_hist_v2";
const MAX_HISTORY   = 8;
const KIWIFY_URL    = "https://pay.kiwify.com.br/DIVD8zl";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcImplicita(odd)    { return (1 / odd) * 100; }

function calcVig(oddN) {
  // Margem típica por faixa de odd
  if (oddN <= 1.4)  return 4.0;
  if (oddN <= 1.7)  return 4.8;
  if (oddN <= 2.2)  return 5.5;
  if (oddN <= 3.0)  return 6.5;
  return 8.0;
}

function calcEV(prob, oddN) {
  // Valor esperado por R$100 apostado
  return (prob / 100) * (oddN - 1) * 100 - (1 - prob / 100) * 100;
}

function perdaInfo(chancePerda) {
  if (chancePerda > 60) return { label: "ALTA",   color: "#FF4D2E" };
  if (chancePerda > 42) return { label: "MÉDIA",  color: "#FFB020" };
  return                       { label: "BAIXA",  color: "#1FCB7A" };
}

function calcScore(oddN) {
  const score = Math.min(100, Math.round(100 - calcImplicita(oddN)));
  let label, color;
  if (score <= 30)      { label = "BAIXO";    color = "#1FCB7A"; }
  else if (score <= 60) { label = "MODERADO"; color = "#FFB020"; }
  else if (score <= 80) { label = "ALTO";     color = "#FF6B2E"; }
  else                  { label = "CRÍTICO";  color = "#FF4D2E"; }
  return { score, label, color };
}

function matchLine(text, key) {
  const m = text.match(new RegExp(`^${key}:\\s*(.+)`, "m"));
  return m ? m[1].trim() : null;
}
function matchBlock(text, key) {
  const m = text.match(new RegExp(`^${key}:[^\\n]*\\n([\\s\\S]*?)(?=\\n[A-Z_]{3,}:|$)`, "m"));
  return m ? m[1].trim() : matchLine(text, key);
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

function fmtTime() {
  return new Date().toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).replace(",", "");
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}
function saveHistory(arr) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr)); } catch {}
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Tool() {
  // Form state
  const [jogo,  setJogo]  = useState("");
  const [tipo,  setTipo]  = useState("Resultado final (1X2)");
  const [odd,   setOdd]   = useState("");
  const [valor, setValor] = useState("");
  const [obs,   setObs]   = useState("");

  // App state
  const [loading,     setLoading]     = useState(false);
  const [loadStepIdx, setLoadStepIdx] = useState(0);
  const [loadPct,     setLoadPct]     = useState(0);
  const [error,       setError]       = useState("");
  const [result,      setResult]      = useState(null);

  // History
  const [history, setHistory] = useState(loadHistory);

  // Auth / credits
  const [token,        setToken]        = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [credits,      setCredits]      = useState(null);
  const [freeUsed,     setFreeUsed]     = useState(0);
  const [gateMode,     setGateMode]     = useState(null); // null | "free_limit" | "no_credits" | "no_access"
  const [tokenInput,   setTokenInput]   = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError,   setTokenError]   = useState("");

  const resultRef  = useRef(null);
  const timerRef   = useRef(null);
  const progRef    = useRef(null);

  // ── Validar token salvo ao montar ────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) validateToken(saved, false);
  }, []); // eslint-disable-line

  async function validateToken(t, showErrorOnFail = true) {
    try {
      const res  = await fetch("/api/validate-token", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setToken(t);
        setCredits(data.credits);
        localStorage.setItem(TOKEN_KEY, t);
        setGateMode(null);
        setTokenError("");
        return true;
      } else {
        const msg = data.code === "TOKEN_EXPIRED"
          ? "Seu token expirou. Adquira um novo pacote para continuar."
          : "Token inválido ou não encontrado.";
        if (showErrorOnFail) setTokenError(msg);
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        return false;
      }
    } catch {
      if (showErrorOnFail) setTokenError("Erro de conexão ao validar token.");
      return false;
    }
  }

  async function handleActivateToken(e) {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) { setTokenError("Digite seu código de acesso."); return; }
    setTokenLoading(true);
    setTokenError("");
    const ok = await validateToken(t, true);
    setTokenLoading(false);
    if (!ok && !tokenError) setTokenError("Token inválido ou não encontrado.");
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setCredits(null);
    setGateMode(null);
  }

  // ── Loading cycle ─────────────────────────────────────────────────────────────
  function startCycle() {
    let i = 0;
    setLoadStepIdx(0);
    setLoadPct(LOAD_STEPS[0].pct);

    timerRef.current = setInterval(() => {
      i = Math.min(i + 1, LOAD_STEPS.length - 1);
      setLoadStepIdx(i);
      setLoadPct(LOAD_STEPS[i].pct);
    }, 1300);
  }
  function stopCycle() {
    clearInterval(timerRef.current);
    setLoadPct(100);
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!jogo.trim()) { setError("Informe o jogo ou evento."); return; }
    const oddN = parseFloat(odd.replace(",", "."));
    if (!odd.trim() || isNaN(oddN) || oddN <= 1) {
      setError("Informe uma odd válida — número maior que 1 (ex: 1.80).");
      return;
    }

    const prob  = calcImplicita(oddN);
    const parts = [
      `Jogo: ${jogo.trim()}`,
      `Tipo de aposta: ${tipo}`,
      `Odd: ${odd.trim()}`,
      `Probabilidade implícita: ${prob.toFixed(1)}%`,
    ];
    if (valor.trim()) parts.push(`Valor pretendido: R$ ${valor.trim()}`);
    if (obs.trim())   parts.push(`Contexto adicional: ${obs.trim()}`);

    setLoading(true);
    startCycle();

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res  = await fetch("/api/chat", {
        method:  "POST",
        headers,
        body:    JSON.stringify({ tool: "chance_de_perder", userMessage: parts.join("\n") }),
      });
      const data = await res.json();

      // ── Sem token → bloqueio real (API não chamou Anthropic) ─────────────────
      if (data.locked) {
        stopCycle();
        setGateMode("no_access");
        setLoading(false);
        return;
      }

      // ── Crédito / paywall ────────────────────────────────────────────────────
      if (res.status === 402) {
        if (data.code === "NO_CREDITS") { setCredits(0); setGateMode("no_credits"); }
        else if (data.code === "FREE_LIMIT") { setFreeUsed(data.freeUsed ?? 2); setGateMode("free_limit"); }
        stopCycle(); setLoading(false);
        return;
      }
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setCredits(null);
        const msg = data.code === "TOKEN_EXPIRED"
          ? "Seu token expirou. Adquira um novo pacote."
          : "Sessão inválida. Insira seu token novamente.";
        throw new Error(msg);
      }
      if (!res.ok) throw new Error(data.error || "Erro ao processar. Tente novamente.");

      // ── Atualizar créditos ───────────────────────────────────────────────────
      if (data.credits  != null) setCredits(data.credits);
      if (data.freeUsed != null) setFreeUsed(data.freeUsed);

      const text  = data.content?.[0]?.text || "";
      const vig   = calcVig(oddN);
      const ev    = calcEV(prob, oddN);
      const newResult = { ai: parseAI(text), oddN, prob, vig, ev };
      setResult(newResult);

      // ── Histórico ────────────────────────────────────────────────────────────
      const sd = calcScore(oddN);
      setHistory(prev => {
        const next = [
          { id: Date.now(), jogo: jogo.trim(), tipo, odd: oddN, score: sd.score, label: sd.label, color: sd.color, date: fmtTime() },
          ...prev,
        ].slice(0, MAX_HISTORY);
        saveHistory(next);
        return next;
      });

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);

    } catch (err) {
      setError(err.message || "Erro de conexão. Verifique sua internet.");
    } finally {
      stopCycle();
      setLoading(false);
    }
  }

  function handleNewAnalysis() {
    setResult(null);
    setError("");
    setOdd("");
    setObs("");
    setValor("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Derivados ─────────────────────────────────────────────────────────────────
  const perda     = result ? perdaInfo(100 - result.prob) : null;
  const scoreData = result ? calcScore(result.oddN)       : null;
  const bullets   = (result?.ai.oQuePodeDarErrado || "")
    .split("\n").filter(l => l.trim()).map(l => l.replace(/^[-•*]\s*/, ""));

  const freeLeft = Math.max(0, 2 - freeUsed);

  return (
    <>
      <style>{CSS}</style>

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <header className="tl-header">
        <div className="tl-header-left">
          <div className="tl-logo">
            <div className="tl-logo-mark">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="#050505"/>
                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="currentColor" fillOpacity=".9"/>
              </svg>
            </div>
            <div className="tl-logo-group">
              <span className="tl-logo-name">MotorIA Pro</span>
              <span className="tl-logo-status">Ferramenta educativa</span>
            </div>
          </div>
        </div>

        <div className="tl-header-right">
          {/* Créditos */}
          {token && credits !== null ? (
            <div className="tl-credits-pill tl-credits-paid">
              <span className="tl-credits-dot" />
              <span className="tl-credits-count">{credits}</span>
              <span className="tl-credits-label">análise{credits !== 1 ? "s" : ""}</span>
            </div>
          ) : !token ? (
            <div className="tl-credits-pill tl-credits-free">
              <span className="tl-credits-label">{freeLeft} grátis</span>
            </div>
          ) : null}

          {/* Comprar mais */}
          {((credits !== null && credits <= 3) || gateMode) && (
            <a href={KIWIFY_URL} className="tl-header-buy" target="_blank" rel="noopener noreferrer">
              + créditos
            </a>
          )}

          {/* Voltar */}
          <Link to="/" className="tl-header-back">← Início</Link>

          {/* Sair */}
          {token && (
            <button className="tl-nav-logout" onClick={handleLogout}>Sair</button>
          )}
        </div>
      </header>

      <main className="tl-main">
        <div className="tl-wrap">

          {/* ── HERO ─────────────────────────────────────────────────────────── */}
          {!result && !loading && (
            <div className="tl-hero">
              <div className="tl-hero-glow" aria-hidden="true" />
              <div className="tl-hero-eyebrow">MotorIA Pro · Ferramenta educativa</div>
              <h1 className="tl-hero-title">
                Veja o risco <em className="tl-hero-em">REAL</em><br />
                <span className="tl-hero-dim">antes de apostar.</span>
              </h1>
              <p className="tl-hero-sub">
                A ferramenta mostra o que a plataforma não mostra:
                chance de perda, nível de perigo e o que você tende
                a perder no longo prazo.
              </p>
              <div className="tl-trust-row">
                {["Ferramenta educativa", "Não vende previsões", "Não promete lucro", "+18"].map(t => (
                  <span className="tl-trust-pill" key={t}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── GATE / PAYWALL ───────────────────────────────────────────────── */}
          {gateMode && (
            <div className="tl-gate">
              <div className="tl-gate-glow" aria-hidden="true" />
              <div className="tl-gate-icon" aria-hidden="true">
                {gateMode === "no_credits" ? (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M11 7v5M11 15h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                ) : gateMode === "no_access" ? (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="11" cy="15" r="1.3" fill="currentColor"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 3L19 7V15L11 19L3 15V7L11 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M11 8v4M11 15h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <div className="tl-gate-body">
                <h2 className="tl-gate-title">
                  {gateMode === "no_credits"
                    ? "Suas análises acabaram."
                    : gateMode === "no_access"
                    ? "Resultado completo disponível."
                    : "Você usou as 2 análises gratuitas."}
                </h2>
                <p className="tl-gate-sub">
                  {gateMode === "no_credits"
                    ? "Recarregue 20 novas análises por R$27 e continue vendo o risco real antes de apostar."
                    : gateMode === "no_access"
                    ? "Desbloqueie a análise completa, controle de banca e histórico. Pagamento único — sem mensalidade."
                    : "Para continuar vendo o risco real das suas apostas, desbloqueie o acesso completo — 20 análises por R$27."}
                </p>
                {gateMode === "no_access" && (
                  <div className="tl-gate-price">
                    <span className="tl-gate-price-old">R$47</span>
                    <span className="tl-gate-price-real">R$27</span>
                  </div>
                )}
                <a href={KIWIFY_URL} className="tl-gate-btn" target="_blank" rel="noopener noreferrer">
                  {gateMode === "no_access" ? "Desbloquear agora →" : "Comprar 20 análises — R$27 →"}
                </a>
                {gateMode === "no_access" && (
                  <p className="tl-gate-payment-note">Pagamento único · Sem mensalidade · Acesso imediato</p>
                )}
                <ul className="tl-gate-feats">
                  {(gateMode === "no_access"
                    ? ["Análise de risco completa por aposta", "Controle de Banca: ROI, saldo e sequência", "Alertas de exposição alta", "20 análises incluídas · Pagamento único"]
                    : ["20 análises incluídas", "Nível de risco por aposta", "O que pode dar errado em cada uma", "Recarregável quando precisar"]
                  ).map(f => (
                    <li key={f}><span className="tl-gate-check">✓</span> {f}</li>
                  ))}
                </ul>
              </div>
              <div className="tl-gate-divider"><span>Já tem um código de acesso?</span></div>
              <form onSubmit={handleActivateToken} className="tl-token-form">
                <input
                  className="tl-input tl-token-input"
                  placeholder="Cole seu código de acesso aqui"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  disabled={tokenLoading}
                  autoComplete="off"
                  spellCheck={false}
                />
                {tokenError && <p className="tl-token-err">{tokenError}</p>}
                <button className="tl-token-btn" type="submit" disabled={tokenLoading}>
                  {tokenLoading ? "Validando…" : "Ativar acesso"}
                </button>
              </form>
            </div>
          )}

          {/* ── FORMULÁRIO ───────────────────────────────────────────────────── */}
          {!gateMode && !loading && !result && (
            <form className="tl-form-card" onSubmit={handleSubmit} noValidate>

              <div className="tl-form-header">
                <div className="tl-form-header-left">
                  <div className="tl-form-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="currentColor" fillOpacity=".5"/>
                      <circle cx="7" cy="7" r="2" fill="currentColor"/>
                    </svg>
                  </div>
                  <span className="tl-form-title">Analisar minha aposta</span>
                </div>
                <span className="tl-form-badge">engine v2</span>
              </div>

              <div className="tl-field">
                <label className="tl-label">Jogo ou evento</label>
                <input
                  className="tl-input"
                  value={jogo}
                  onChange={e => setJogo(e.target.value)}
                  placeholder="Ex: Flamengo × Palmeiras, UFC 310, Djokovic × Alcaraz…"
                  disabled={loading}
                />
              </div>

              <div className="tl-field">
                <label className="tl-label">Tipo de aposta</label>
                <select
                  className="tl-input tl-select"
                  value={tipo}
                  onChange={e => setTipo(e.target.value)}
                  disabled={loading}
                >
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="tl-row-2">
                <div className="tl-field">
                  <label className="tl-label">
                    Odd
                    <span className="tl-tooltip-wrap" tabIndex="0" aria-label="O que é odd?">
                      <span className="tl-info-icon">?</span>
                      <span className="tl-tooltip" role="tooltip">
                        A odd é o multiplicador pago pela casa se você ganhar. Odd 2.00 = casa estima 50% de chance. Quanto maior a odd, menor essa chance — e maior o risco real.
                      </span>
                    </span>
                  </label>
                  <input
                    className="tl-input"
                    value={odd}
                    onChange={e => setOdd(e.target.value)}
                    placeholder="Ex: 1.80"
                    inputMode="decimal"
                    disabled={loading}
                  />
                </div>
                <div className="tl-field">
                  <label className="tl-label">
                    Valor pretendido <span className="tl-opt">(opcional)</span>
                  </label>
                  <input
                    className="tl-input"
                    value={valor}
                    onChange={e => setValor(e.target.value)}
                    placeholder="R$ 0,00"
                    inputMode="decimal"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="tl-field">
                <label className="tl-label">
                  Contexto adicional <span className="tl-opt">(opcional)</span>
                </label>
                <textarea
                  className="tl-input tl-textarea"
                  value={obs}
                  onChange={e => setObs(e.target.value)}
                  placeholder="Fase da competição, time fora de casa, lesões, momento da temporada, outros fatores relevantes…"
                  disabled={loading}
                  rows={3}
                />
              </div>

              <p className="tl-microcopy">
                Quanto mais informação você der, mais precisa será a análise.
              </p>

              {error && <div className="tl-err">{error}</div>}

              <button className="tl-btn" type="submit" disabled={loading}>
                Ver o risco dessa aposta
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
          )}

          {/* ── LOADING ───────────────────────────────────────────────────────── */}
          {loading && (
            <div className="tl-loading-panel">
              <div className="tl-loading-glow" aria-hidden="true" />

              <div className="tl-loading-top">
                <div className="tl-loading-ring" aria-hidden="true">
                  <svg viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="15" stroke="rgba(31,203,122,0.12)" strokeWidth="2.5"/>
                    <circle cx="18" cy="18" r="15" stroke="#1FCB7A" strokeWidth="2.5"
                      strokeDasharray={`${loadPct * 0.942} 94.2`}
                      strokeDashoffset="23.55"
                      strokeLinecap="round"
                      style={{transition: "stroke-dasharray .8s cubic-bezier(.4,0,.2,1)"}}
                    />
                  </svg>
                  <span className="tl-loading-pct">{loadPct}%</span>
                </div>
                <div className="tl-loading-text">
                  <div className="tl-loading-step">{LOAD_STEPS[loadStepIdx].label}</div>
                  <div className="tl-loading-sub">Etapa {loadStepIdx + 1} de {LOAD_STEPS.length}</div>
                </div>
              </div>

              <div className="tl-prog-track">
                <div
                  className="tl-prog-fill"
                  style={{ width: `${loadPct}%`, transition: "width .8s cubic-bezier(.4,0,.2,1)" }}
                />
              </div>

              <div className="tl-prog-steps">
                {LOAD_STEPS.map((s, i) => (
                  <div key={i} className={`tl-prog-step${i <= loadStepIdx ? " tl-prog-done" : ""}`}>
                    <span className="tl-prog-dot" />
                    <span className="tl-prog-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── RESULTADO ─────────────────────────────────────────────────────── */}
          {result && !loading && (
            <div className="tl-result" ref={resultRef}>

              {/* CABEÇALHO DO RELATÓRIO */}
              <div className="tl-report-hdr">
                <div className="tl-report-hdr-left">
                  <span className="tl-report-label">RELATÓRIO DE RISCO</span>
                  <span className="tl-report-meta">{jogo || "Análise"} · odd {result.oddN.toFixed(2)} · {tipo}</span>
                </div>
                <div className="tl-report-badges">
                  <span className="tl-report-badge">MotorIA™</span>
                  <span className="tl-report-ts">{fmtTime()}</span>
                </div>
              </div>

              {/* SCORE */}
              <div
                className="tl-card tl-card-score"
                style={{ borderColor: scoreData.color + "30", background: scoreData.color + "07" }}
              >
                <div className="tl-card-tag" style={{ color: scoreData.color + "80" }}>
                  NÍVEL DE RISCO · MOTORIA™
                </div>
                <div className="tl-score-risk-banner" style={{ color: scoreData.color }}>
                  RISCO {scoreData.label}
                </div>
                <div className="tl-score-row">
                  <div className="tl-score-num" style={{ color: scoreData.color }}>
                    {scoreData.score}
                  </div>
                  <div className="tl-score-right">
                    <span
                      className="tl-score-badge"
                      style={{ background: scoreData.color + "18", color: scoreData.color, border: `1px solid ${scoreData.color}40` }}
                    >
                      {scoreData.score <= 30 ? "Risco baixo — mais segura" : scoreData.score <= 60 ? "Risco moderado — atenção" : scoreData.score <= 80 ? "Risco alto — cuidado" : "Risco crítico — perigo real"}
                    </span>
                    <div className="tl-score-bar-wrap">
                      <div className="tl-score-bar-track">
                        <div
                          className="tl-score-bar-fill"
                          style={{ width: `${scoreData.score}%`, background: scoreData.color }}
                        />
                        {[30, 60, 80].map(tick => (
                          <div key={tick} className="tl-score-tick" style={{ left: `${tick}%` }} />
                        ))}
                      </div>
                      <div className="tl-score-bar-labels">
                        <span>Baixo</span><span>Moderado</span><span>Alto</span><span>Crítico</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="tl-score-note">
                  Calculado a partir da odd e do contexto fornecido. Não recomenda nenhuma entrada — apenas mostra o nível de perigo dessa aposta.
                </p>
              </div>

              {/* MÉTRICAS — grid 2×2 */}
              <div className="tl-metrics-grid">
                <div className="tl-metric-card">
                  <div className="tl-metric-label">Chance que a casa dá pra você ganhar</div>
                  <div className="tl-metric-val" style={{ color: "#1FCB7A" }}>
                    {result.prob.toFixed(1)}%
                  </div>
                  <div className="tl-metric-hint">o mínimo pra aposta valer a pena</div>
                </div>
                <div className="tl-metric-card">
                  <div className="tl-metric-label">Chance de perder</div>
                  <div className="tl-metric-val" style={{ color: perda.color }}>
                    ~{(100 - result.prob).toFixed(1)}%
                    <span className="tl-metric-badge" style={{ background: perda.color + "18", color: perda.color }}>
                      {perda.label}
                    </span>
                  </div>
                  <div className="tl-metric-hint">estimativa conservadora</div>
                </div>
                <div className="tl-metric-card">
                  <div className="tl-metric-label">O que a casa retém de cada aposta</div>
                  <div className="tl-metric-val" style={{ color: "#FFB020" }}>
                    ~{result.vig.toFixed(1)}%
                  </div>
                  <div className="tl-metric-hint">antes mesmo do resultado</div>
                </div>
                <div className="tl-metric-card">
                  <div className="tl-metric-label">O que você tende a perder por R$100</div>
                  <div className="tl-metric-val" style={{ color: result.ev >= 0 ? "#1FCB7A" : "#FF4D2E" }}>
                    {result.ev >= 0 ? "+R$" : "-R$"}{Math.abs(result.ev).toFixed(2)}
                  </div>
                  <div className="tl-metric-hint">
                    {result.ev < -10 ? "perda esperada alta no longo prazo" : result.ev < 0 ? "desfavorável no longo prazo" : "dentro da variância normal"}
                  </div>
                </div>
              </div>

              {/* ANÁLISE IA */}
              {result.ai.riscoPrincipal && (
                <div className="tl-card tl-card-risk">
                  <div className="tl-card-tag">① O PRINCIPAL RISCO DESSA APOSTA</div>
                  <p className="tl-card-text">{result.ai.riscoPrincipal}</p>
                </div>
              )}

              {result.ai.cenarioNecessario && (
                <div className="tl-card tl-card-scenario">
                  <div className="tl-card-tag">② O QUE PRECISA ACONTECER PRA VOCÊ GANHAR</div>
                  <p className="tl-card-text">{result.ai.cenarioNecessario}</p>
                </div>
              )}

              {bullets.length > 0 && (
                <div className="tl-card tl-card-blind">
                  <div className="tl-card-tag">③ O QUE PODE DAR ERRADO</div>
                  <ul className="tl-bullets">
                    {bullets.map((b, i) => (
                      <li key={i} className="tl-bullet">{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(result.ai.leituraConservadora || result.ai.alertaFinal) && (
                <div className="tl-card tl-card-final">
                  <div className="tl-card-tag">④ O QUE VOCÊ DEVERIA CONSIDERAR ANTES DE APOSTAR</div>
                  {result.ai.leituraConservadora && (
                    <p className="tl-card-text">{result.ai.leituraConservadora}</p>
                  )}
                  {result.ai.alertaFinal && (
                    <blockquote className="tl-quote">{result.ai.alertaFinal}</blockquote>
                  )}
                  <p className="tl-final-note">
                    Esta análise tem finalidade exclusivamente educativa. Não é recomendação de aposta. Apostas envolvem risco financeiro real.
                  </p>
                </div>
              )}

              {/* AÇÕES */}
              <div className="tl-result-actions">
                <button className="tl-new-btn" onClick={handleNewAnalysis}>
                  ← Nova análise
                </button>
                {credits !== null && credits <= 5 && (
                  <a href={KIWIFY_URL} className="tl-recharge-btn" target="_blank" rel="noopener noreferrer">
                    + 20 análises — R$27
                  </a>
                )}
              </div>

            </div>
          )}

          {/* ── HISTÓRICO ─────────────────────────────────────────────────────── */}
          {history.length > 0 && !loading && (
            <div className="tl-history">
              <div className="tl-history-hdr">
                <span className="tl-history-title">Últimas análises</span>
                <button
                  className="tl-history-clear"
                  onClick={() => { setHistory([]); saveHistory([]); }}
                >
                  Limpar
                </button>
              </div>
              {history.map(item => (
                <div className="tl-history-row" key={item.id}>
                  <div
                    className="tl-history-score"
                    style={{ color: item.color }}
                  >
                    {item.score}
                  </div>
                  <div className="tl-history-info">
                    <div className="tl-history-jogo">{item.jogo}</div>
                    <div className="tl-history-meta">{item.tipo} · odd {item.odd.toFixed(2)}</div>
                  </div>
                  <div className="tl-history-label" style={{ color: item.color }}>
                    {item.label}
                  </div>
                  <div className="tl-history-date">{item.date}</div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* ── FOOTER COMPACTO ───────────────────────────────────────────────────── */}
      <footer className="tl-footer">
        <p className="tl-footer-text">
          Ferramenta educativa. Não é recomendação de aposta. Apostas envolvem risco financeiro real. Proibido para menores de 18 anos.
        </p>
        <div className="tl-footer-links">
          <a href="https://www.jogoresponsavel.com.br" target="_blank" rel="noopener noreferrer">jogoresponsavel.com.br</a>
          <span>·</span>
          <span>CVV 188</span>
          <span>·</span>
          <span>+18</span>
        </div>
      </footer>
    </>
  );
}

// ─── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
/* ── Reset / Tokens ─────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
:root {
  --bg:    #050505;
  --bg2:   #08080a;
  --t1:    #EBEBEB;
  --t2:    #8A8A8A;
  --t3:    #525252;
  --green: #1FCB7A;
  --amber: #FFB020;
  --red:   #FF4D2E;
  --border: rgba(255,255,255,0.07);
  --bmd:    rgba(255,255,255,0.11);
}

/* ── Keyframes ──────────────────────────────────────────────────────────────── */
@keyframes tl-spin { to { transform: rotate(360deg); } }
@keyframes tl-glow {
  0%, 100% { opacity: .5; }
  50%       { opacity: 1; }
}
@keyframes tl-fadein {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes tl-prog-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(31,203,122,0); }
  50%       { box-shadow: 0 0 0 4px rgba(31,203,122,0.12); }
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.tl-header {
  position: sticky; top: 0; z-index: 200;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; height: 56px;
  background: rgba(5,5,5,.94);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--border);
  gap: 12px;
}
.tl-header-left { display: flex; align-items: center; flex-shrink: 0; }
.tl-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; }

.tl-logo { display: flex; align-items: center; gap: 10px; }
.tl-logo-mark {
  width: 26px; height: 26px; border-radius: 7px;
  background: var(--green); color: #050505;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.tl-logo-group { display: flex; flex-direction: column; gap: 1px; }
.tl-logo-name {
  font-size: 14px; font-weight: 800; color: var(--t1);
  letter-spacing: -0.025em; line-height: 1;
}
.tl-logo-status {
  font-size: 9px; font-weight: 600; letter-spacing: .1em;
  text-transform: uppercase; color: var(--t3); line-height: 1;
}

/* Credits pill */
.tl-credits-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 11px; border-radius: 99px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
}
.tl-credits-paid {
  background: rgba(31,203,122,0.07);
  border: 1px solid rgba(31,203,122,0.18);
}
.tl-credits-free {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  color: var(--t3);
}
.tl-credits-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--green); box-shadow: 0 0 6px rgba(31,203,122,.6);
  flex-shrink: 0;
}
.tl-credits-count {
  font-size: 13px; font-weight: 800; color: var(--green); line-height: 1;
  font-variant-numeric: tabular-nums;
}
.tl-credits-label { color: var(--t3); font-size: 11px; }

/* Header actions */
.tl-header-buy {
  font-size: 11px; font-weight: 700;
  color: var(--green); text-decoration: none;
  border: 1px solid rgba(31,203,122,0.25);
  background: rgba(31,203,122,0.06);
  padding: 5px 11px; border-radius: 7px;
  transition: all .15s; white-space: nowrap;
}
.tl-header-buy:hover { background: rgba(31,203,122,0.12); border-color: rgba(31,203,122,.4); }
.tl-header-back {
  font-size: 12px; color: var(--t3); text-decoration: none;
  transition: color .15s; white-space: nowrap;
}
.tl-header-back:hover { color: var(--t2); }
.tl-nav-logout {
  font-size: 11px; color: var(--t3); background: none; border: none;
  cursor: pointer; text-decoration: underline; text-underline-offset: 3px;
  transition: color .15s; padding: 0; white-space: nowrap;
}
.tl-nav-logout:hover { color: var(--t2); }

/* ── Layout ─────────────────────────────────────────────────────────────────── */
.tl-main  { min-height: 80vh; background: var(--bg); }
.tl-wrap  { max-width: 600px; margin: 0 auto; padding: 0 20px 80px; }

/* ── Hero ───────────────────────────────────────────────────────────────────── */
.tl-hero {
  position: relative; overflow: hidden;
  padding: 56px 0 40px; text-align: center;
}
.tl-hero-glow {
  position: absolute; top: 40%; left: 50%;
  transform: translate(-50%, -50%);
  width: 480px; height: 280px;
  background: radial-gradient(ellipse,
    rgba(255,77,46,0.07) 0%,
    rgba(31,203,122,0.05) 50%,
    transparent 70%);
  pointer-events: none;
  animation: tl-glow 6s ease-in-out infinite;
}
.tl-hero-eyebrow {
  position: relative; z-index: 1;
  display: inline-block;
  font-size: 10px; font-weight: 700; letter-spacing: .16em;
  text-transform: uppercase; color: var(--green);
  border: 1px solid rgba(31,203,122,.22);
  background: rgba(31,203,122,.05);
  padding: 5px 14px; border-radius: 99px;
  margin-bottom: 22px;
}
.tl-hero-title {
  position: relative; z-index: 1;
  font-size: clamp(28px, 6vw, 46px); font-weight: 900;
  color: var(--t1); line-height: 1.1; letter-spacing: -0.04em;
  margin: 0 0 16px;
}
.tl-hero-dim { color: rgba(235,235,235,.35); }
.tl-hero-em {
  font-style: normal;
  color: #FF4D2E;
  text-shadow: 0 0 40px rgba(255,77,46,.35);
}
.tl-hero-sub {
  position: relative; z-index: 1;
  font-size: 15px; color: var(--t2); line-height: 1.72;
  max-width: 460px; margin: 0 auto 28px;
}
.tl-trust-row {
  position: relative; z-index: 1;
  display: flex; flex-wrap: wrap; gap: 7px; justify-content: center;
}
.tl-trust-pill {
  font-size: 11px; color: var(--t3);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 99px; padding: 4px 11px;
  background: rgba(255,255,255,.025); white-space: nowrap;
}

/* ── Form card ──────────────────────────────────────────────────────────────── */
.tl-form-card {
  background: rgba(255,255,255,.025);
  border: 1px solid var(--border);
  border-radius: 20px; padding: 0;
  display: flex; flex-direction: column;
  overflow: hidden;
  animation: tl-fadein .3s ease;
}
.tl-form-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px 16px;
  border-bottom: 1px solid var(--border);
  background: rgba(255,255,255,.015);
}
.tl-form-header-left { display: flex; align-items: center; gap: 10px; }
.tl-form-icon {
  width: 26px; height: 26px; border-radius: 7px;
  background: rgba(31,203,122,.1); border: 1px solid rgba(31,203,122,.2);
  color: var(--green); display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.tl-form-title {
  font-size: 13px; font-weight: 700; color: var(--t1);
  letter-spacing: -0.01em;
}
.tl-form-badge {
  font-size: 9px; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: var(--t3);
  border: 1px solid rgba(255,255,255,.07); border-radius: 5px;
  padding: 3px 8px;
}

.tl-form-card .tl-field:first-of-type { margin-top: 0; }
.tl-form-card > .tl-field,
.tl-form-card > .tl-row-2,
.tl-form-card > .tl-microcopy,
.tl-form-card > .tl-err,
.tl-form-card > .tl-btn { padding-left: 24px; padding-right: 24px; }
.tl-form-card > .tl-field { padding-top: 0; margin-top: 18px; }
.tl-form-card > .tl-row-2 { margin-top: 18px; }
.tl-form-card > .tl-microcopy { margin-top: 12px; }
.tl-form-card > .tl-err { margin-top: 12px; }
.tl-form-card > .tl-btn { margin: 20px 24px 24px; width: calc(100% - 48px); padding-left: 20px; padding-right: 20px; }

.tl-field { display: flex; flex-direction: column; gap: 7px; }
.tl-label {
  font-size: 11px; font-weight: 700; color: var(--t3);
  letter-spacing: .04em; text-transform: uppercase;
}
.tl-opt { font-weight: 400; color: rgba(255,255,255,.15); text-transform: none; letter-spacing: 0; }

.tl-input {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 10px; color: var(--t1);
  font-size: 15px; font-family: inherit;
  padding: 13px 15px; outline: none; width: 100%;
  transition: border-color .18s, background .18s;
  -webkit-appearance: none; appearance: none;
}
.tl-input::placeholder { color: rgba(255,255,255,.12); }
.tl-input:focus {
  border-color: rgba(31,203,122,.35);
  background: rgba(31,203,122,.025);
}
.tl-input:disabled { opacity: .4; cursor: default; }
.tl-select { cursor: pointer; }
option { background: #111; color: var(--t1); }
.tl-textarea { resize: vertical; min-height: 84px; line-height: 1.6; }
.tl-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.tl-microcopy {
  font-size: 12px; color: var(--t3); font-style: italic; line-height: 1.5;
}

/* Error */
.tl-err {
  background: rgba(255,77,46,.07); border: 1px solid rgba(255,77,46,.2);
  border-radius: 10px; color: #f87171; font-size: 13px;
  padding: 11px 15px; line-height: 1.5;
}

/* Submit button */
.tl-btn {
  display: flex; align-items: center; justify-content: center; gap: 9px;
  background: var(--t1); color: #050505;
  border: none; border-radius: 11px;
  font-size: 14px; font-weight: 700; font-family: inherit;
  padding: 15px 20px; cursor: pointer;
  transition: opacity .15s, transform .12s;
  box-shadow: 0 1px 0 rgba(255,255,255,.15) inset;
}
.tl-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
.tl-btn:disabled { opacity: .5; cursor: default; }

/* ── Loading panel ──────────────────────────────────────────────────────────── */
.tl-loading-panel {
  position: relative; overflow: hidden;
  background: rgba(255,255,255,.02);
  border: 1px solid var(--border);
  border-radius: 20px; padding: 36px 28px 28px;
  display: flex; flex-direction: column; gap: 28px;
  animation: tl-fadein .3s ease;
}
.tl-loading-glow {
  position: absolute; top: -40px; left: 50%; transform: translateX(-50%);
  width: 320px; height: 200px;
  background: radial-gradient(ellipse, rgba(31,203,122,.1) 0%, transparent 70%);
  pointer-events: none;
  animation: tl-glow 3s ease-in-out infinite;
}
.tl-loading-top {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 20px;
}
.tl-loading-ring {
  position: relative; flex-shrink: 0;
  width: 56px; height: 56px;
}
.tl-loading-ring svg {
  width: 100%; height: 100%;
  transform: rotate(-90deg);
  animation: none;
}
.tl-loading-pct {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px; font-weight: 800; color: var(--green);
  font-variant-numeric: tabular-nums;
}
.tl-loading-step {
  font-size: 14px; font-weight: 600; color: var(--t1);
  line-height: 1.4; letter-spacing: -0.01em;
}
.tl-loading-sub { font-size: 11px; color: var(--t3); margin-top: 4px; }

/* Progress bar */
.tl-prog-track {
  height: 3px; background: rgba(255,255,255,.06); border-radius: 99px;
  overflow: hidden;
}
.tl-prog-fill {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, rgba(31,203,122,.6) 0%, var(--green) 100%);
  box-shadow: 0 0 8px rgba(31,203,122,.4);
}

/* Progress steps list */
.tl-prog-steps {
  display: flex; flex-direction: column; gap: 10px;
}
.tl-prog-step {
  display: flex; align-items: center; gap: 10px;
  transition: opacity .3s;
}
.tl-prog-step:not(.tl-prog-done) { opacity: .22; }
.tl-prog-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
  background: rgba(255,255,255,.2); transition: background .3s;
}
.tl-prog-done .tl-prog-dot {
  background: var(--green);
  box-shadow: 0 0 6px rgba(31,203,122,.5);
  animation: tl-prog-pulse 2s ease infinite;
}
.tl-prog-label { font-size: 12px; color: var(--t2); }
.tl-prog-done .tl-prog-label { color: var(--t1); }

/* ── Result ─────────────────────────────────────────────────────────────────── */
.tl-result {
  display: flex; flex-direction: column; gap: 10px;
  margin-top: 8px;
  animation: tl-fadein .4s ease;
}

/* Report header */
.tl-report-hdr {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 0 2px 14px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px; gap: 12px; flex-wrap: wrap;
}
.tl-report-hdr-left { display: flex; flex-direction: column; gap: 4px; }
.tl-report-label {
  font-size: 10px; font-weight: 700; letter-spacing: .14em;
  text-transform: uppercase; color: var(--t3);
}
.tl-report-meta { font-size: 12px; color: var(--t3); line-height: 1.4; }
.tl-report-badges { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.tl-report-badge {
  font-size: 9px; font-weight: 800; letter-spacing: .1em;
  color: var(--green); background: rgba(31,203,122,.08);
  border: 1px solid rgba(31,203,122,.2);
  padding: 3px 9px; border-radius: 5px;
}
.tl-report-ts { font-size: 11px; color: var(--t3); font-variant-numeric: tabular-nums; }

/* Base card */
.tl-card {
  background: rgba(255,255,255,.025);
  border: 1px solid var(--border);
  border-radius: 14px; padding: 20px;
}
.tl-card-tag {
  font-size: 9px; font-weight: 700; letter-spacing: .12em;
  color: var(--t3); text-transform: uppercase; margin-bottom: 14px;
}

/* Score card */
.tl-card-score {}
.tl-score-risk-banner {
  font-size: clamp(28px, 6vw, 40px);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 18px;
  text-shadow: 0 0 32px currentColor;
  opacity: 0.92;
}
.tl-score-row {
  display: flex; align-items: flex-start; gap: 20px;
  margin-bottom: 14px; flex-wrap: wrap;
}
.tl-score-num {
  font-size: 72px; font-weight: 900;
  line-height: 1; letter-spacing: -0.04em;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.tl-score-right {
  flex: 1; display: flex; flex-direction: column; gap: 12px; padding-top: 6px;
}
.tl-score-badge {
  font-size: 12px; font-weight: 800; letter-spacing: .08em;
  padding: 5px 14px; border-radius: 7px; align-self: flex-start;
}
.tl-score-bar-wrap { display: flex; flex-direction: column; gap: 6px; }
.tl-score-bar-track {
  position: relative; height: 5px;
  background: rgba(255,255,255,.06); border-radius: 99px; overflow: visible;
}
.tl-score-bar-fill {
  height: 100%; border-radius: 99px;
  transition: width .8s cubic-bezier(.4,0,.2,1);
}
.tl-score-tick {
  position: absolute; top: -3px;
  width: 1px; height: 11px;
  background: rgba(255,255,255,.1);
  transform: translateX(-50%);
}
.tl-score-bar-labels {
  display: flex; justify-content: space-between;
  font-size: 9px; color: rgba(255,255,255,.15);
  font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
}
.tl-score-note {
  font-size: 11px; color: var(--t3); font-style: italic;
  line-height: 1.6; margin: 0;
  border-top: 1px solid rgba(255,255,255,.04); padding-top: 12px;
}

/* Metrics grid */
.tl-metrics-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.tl-metric-card {
  background: rgba(255,255,255,.02);
  border: 1px solid var(--border);
  border-radius: 12px; padding: 16px;
  display: flex; flex-direction: column; gap: 6px;
  transition: border-color .18s;
}
.tl-metric-card:hover { border-color: var(--bmd); }
.tl-metric-label {
  font-size: 10px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--t3);
}
.tl-metric-val {
  font-size: 26px; font-weight: 900; line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.tl-metric-badge {
  font-size: 10px; font-weight: 800; letter-spacing: .06em;
  padding: 3px 8px; border-radius: 5px;
}
.tl-metric-hint {
  font-size: 11px; color: var(--t3); line-height: 1.4;
}

/* Analysis cards */
.tl-card-risk {
  border-color: rgba(255,77,46,.15);
  background: rgba(255,77,46,.025);
}
.tl-card-risk .tl-card-tag { color: rgba(255,77,46,.45); }

.tl-card-scenario {
  border-color: rgba(255,255,255,.07);
}
.tl-card-scenario .tl-card-tag { color: var(--t3); }

.tl-card-blind {
  border-color: rgba(255,176,32,.15);
  background: rgba(255,176,32,.02);
}
.tl-card-blind .tl-card-tag { color: rgba(255,176,32,.45); }

.tl-card-final {
  border-color: rgba(255,176,32,.12);
  background: rgba(255,176,32,.02);
  display: flex; flex-direction: column; gap: 14px;
}
.tl-card-final .tl-card-tag { color: rgba(255,176,32,.4); }

.tl-card-text {
  font-size: 14px; color: var(--t2); line-height: 1.75; margin: 0;
}

.tl-bullets {
  list-style: none; display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0;
}
.tl-bullet {
  font-size: 14px; color: var(--t2);
  padding-left: 22px; position: relative; line-height: 1.65;
}
.tl-bullet::before {
  content: "—"; position: absolute; left: 0;
  color: var(--amber); font-weight: 700;
}

.tl-quote {
  font-size: 13px; font-style: italic; color: var(--amber);
  border-left: 2px solid rgba(255,176,32,.35);
  padding: 10px 14px; margin: 0;
  background: rgba(255,176,32,.04); border-radius: 0 8px 8px 0;
  line-height: 1.65;
}

.tl-final-note {
  font-size: 11px; color: var(--t3); font-style: italic; line-height: 1.6;
  border-top: 1px solid rgba(255,255,255,.04); padding-top: 14px; margin: 0;
}

/* Result actions */
.tl-result-actions {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding-top: 4px;
}
.tl-new-btn {
  background: transparent; border: 1px solid var(--border);
  border-radius: 10px; color: var(--t3);
  font-size: 13px; font-family: inherit;
  padding: 11px 18px; cursor: pointer; transition: all .15s;
}
.tl-new-btn:hover { border-color: var(--bmd); color: var(--t2); }
.tl-recharge-btn {
  font-size: 12px; font-weight: 700; color: var(--green);
  text-decoration: none; border: 1px solid rgba(31,203,122,.25);
  background: rgba(31,203,122,.06);
  padding: 10px 16px; border-radius: 10px;
  transition: all .15s;
}
.tl-recharge-btn:hover { background: rgba(31,203,122,.12); }

/* ── Tooltip ────────────────────────────────────────────────────────────────── */
.tl-tooltip-wrap {
  position: relative; display: inline-flex; align-items: center;
  margin-left: 6px; cursor: pointer; vertical-align: middle; outline: none;
}
.tl-info-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; border-radius: 50%;
  border: 1px solid #444; font-size: 9px; color: #555;
  font-weight: 700; line-height: 1;
  transition: border-color .15s, color .15s;
}
.tl-tooltip-wrap:hover .tl-info-icon,
.tl-tooltip-wrap:focus .tl-info-icon { border-color: #888; color: #aaa; }
.tl-tooltip {
  display: none; position: absolute;
  bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
  background: #1a1a1c; border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px; padding: 10px 12px;
  font-size: 12px; color: #aaa; line-height: 1.6; width: 240px;
  z-index: 300; font-weight: 400; pointer-events: none;
  box-shadow: 0 8px 24px rgba(0,0,0,.5);
  letter-spacing: 0; text-transform: none;
}
.tl-tooltip::after {
  content: ""; position: absolute; top: 100%; left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent; border-top-color: rgba(255,255,255,.1);
}
.tl-tooltip-wrap:hover .tl-tooltip,
.tl-tooltip-wrap:focus .tl-tooltip { display: block; }

/* ── Gate (paywall) ─────────────────────────────────────────────────────────── */
.tl-gate {
  position: relative; overflow: hidden;
  background: rgba(255,255,255,.02);
  border: 1px solid var(--border);
  border-radius: 20px; padding: 36px 28px 28px;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 0;
  animation: tl-fadein .3s ease;
}
.tl-gate-glow {
  position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
  width: 300px; height: 200px;
  background: radial-gradient(ellipse, rgba(31,203,122,.09) 0%, transparent 70%);
  pointer-events: none;
}
.tl-gate-icon {
  position: relative; z-index: 1;
  width: 52px; height: 52px; border-radius: 14px;
  background: rgba(31,203,122,.08); border: 1px solid rgba(31,203,122,.2);
  color: var(--green);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.tl-gate-body { position: relative; z-index: 1; }
.tl-gate-title {
  font-size: 22px; font-weight: 800; color: var(--t1);
  letter-spacing: -0.025em; margin: 0 0 10px;
}
.tl-gate-sub {
  font-size: 14px; color: var(--t2); line-height: 1.65;
  max-width: 360px; margin: 0 auto 20px;
}
.tl-gate-btn {
  display: inline-block; position: relative; z-index: 1;
  background: var(--t1); color: #050505;
  font-size: 14px; font-weight: 700; padding: 14px 26px;
  border-radius: 11px; text-decoration: none;
  transition: opacity .15s, transform .12s;
  box-shadow: 0 1px 0 rgba(255,255,255,.15) inset;
  margin-bottom: 20px;
}
.tl-gate-btn:hover { opacity: .88; transform: translateY(-1px); }
.tl-gate-feats {
  list-style: none; display: flex; flex-direction: column;
  gap: 8px; padding: 0; margin: 0 auto 20px;
  text-align: left; max-width: 240px;
}
.tl-gate-feats li { font-size: 13px; color: var(--t2); }
.tl-gate-check { color: var(--green); font-weight: 700; margin-right: 6px; }
.tl-gate-price {
  display: flex; align-items: baseline; gap: 10px;
  justify-content: center; margin-bottom: 10px;
}
.tl-gate-price-old {
  font-size: 14px; color: var(--t3);
  text-decoration: line-through; font-weight: 600;
}
.tl-gate-price-real {
  font-size: 28px; font-weight: 900; color: var(--t1); letter-spacing: -.03em;
}
.tl-gate-payment-note {
  font-size: 11px; color: var(--t3); margin: 4px 0 0; text-align: center;
}
.tl-gate-divider {
  display: flex; align-items: center; gap: 12px;
  width: 100%; margin: 8px 0 16px;
}
.tl-gate-divider::before,
.tl-gate-divider::after { content: ""; flex: 1; height: 1px; background: rgba(255,255,255,.06); }
.tl-gate-divider span { font-size: 12px; color: var(--t3); white-space: nowrap; }
.tl-token-form { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.tl-token-input { font-size: 13px; text-align: center; letter-spacing: .02em; }
.tl-token-err   { font-size: 12px; color: #ef4444; margin: 0; }
.tl-token-btn {
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px; color: #9ca3af;
  font-size: 13px; font-weight: 600; font-family: inherit;
  padding: 11px; cursor: pointer; transition: all .15s;
}
.tl-token-btn:hover:not(:disabled) {
  background: rgba(255,255,255,.08); color: var(--t1);
  border-color: rgba(255,255,255,.14);
}
.tl-token-btn:disabled { opacity: .5; cursor: default; }

/* ── History ────────────────────────────────────────────────────────────────── */
.tl-history {
  margin-top: 32px;
  border: 1px solid var(--border); border-radius: 16px;
  overflow: hidden;
}
.tl-history-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  background: rgba(255,255,255,.015);
  border-bottom: 1px solid var(--border);
}
.tl-history-title {
  font-size: 11px; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: var(--t3);
}
.tl-history-clear {
  font-size: 11px; color: var(--t3); background: none; border: none;
  cursor: pointer; text-decoration: underline; text-underline-offset: 3px;
  transition: color .15s; padding: 0;
}
.tl-history-clear:hover { color: var(--t2); }
.tl-history-row {
  display: grid;
  grid-template-columns: 44px 1fr auto auto;
  gap: 12px; align-items: center;
  padding: 13px 18px;
  border-bottom: 1px solid var(--border);
  transition: background .15s;
}
.tl-history-row:last-child { border-bottom: none; }
.tl-history-row:hover { background: rgba(255,255,255,.015); }
.tl-history-score {
  font-size: 22px; font-weight: 900; line-height: 1;
  letter-spacing: -0.03em; font-variant-numeric: tabular-nums;
}
.tl-history-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.tl-history-jogo {
  font-size: 13px; font-weight: 600; color: var(--t1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tl-history-meta { font-size: 11px; color: var(--t3); }
.tl-history-label {
  font-size: 10px; font-weight: 800; letter-spacing: .06em;
  text-align: right; white-space: nowrap;
}
.tl-history-date { font-size: 10px; color: var(--t3); white-space: nowrap; }

/* ── Footer compacto ────────────────────────────────────────────────────────── */
.tl-footer {
  background: var(--bg2); border-top: 1px solid var(--border);
  padding: 20px 24px; text-align: center;
}
.tl-footer-text {
  font-size: 11px; color: var(--t3); line-height: 1.65; margin: 0 0 8px;
  max-width: 520px; margin-left: auto; margin-right: auto;
}
.tl-footer-links {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; flex-wrap: wrap;
  font-size: 11px; color: var(--t3);
}
.tl-footer-links a { color: var(--t3); text-decoration: underline; text-underline-offset: 3px; }
.tl-footer-links a:hover { color: var(--t2); }

/* ── Mobile ─────────────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .tl-header { padding: 0 16px; height: 52px; }
  .tl-logo-status { display: none; }
  .tl-header-back { display: none; }

  .tl-wrap { padding: 0 16px 60px; }

  .tl-hero { padding: 40px 0 28px; }
  .tl-hero-title { font-size: clamp(26px, 8vw, 36px); }

  .tl-form-header { padding: 15px 18px 13px; }
  .tl-form-card > .tl-field  { padding-left: 18px; padding-right: 18px; margin-top: 16px; }
  .tl-form-card > .tl-row-2  { padding-left: 18px; padding-right: 18px; margin-top: 16px; }
  .tl-form-card > .tl-microcopy { padding-left: 18px; padding-right: 18px; margin-top: 10px; }
  .tl-form-card > .tl-err   { padding-left: 18px; padding-right: 18px; margin-top: 10px; }
  .tl-form-card > .tl-btn   { margin: 18px 18px 20px; width: calc(100% - 36px); }

  .tl-row-2 { grid-template-columns: 1fr; gap: 16px; }

  .tl-metrics-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
  .tl-metric-val   { font-size: 22px; }
  .tl-metric-card  { padding: 13px; }

  .tl-score-num { font-size: 56px; }
  .tl-score-risk-banner { font-size: 26px; margin-bottom: 14px; }
  .tl-card { padding: 16px; }

  .tl-gate { padding: 28px 20px 22px; }

  .tl-loading-panel { padding: 28px 20px 22px; }

  .tl-history-row {
    grid-template-columns: 38px 1fr auto;
    grid-template-rows: auto auto;
  }
  .tl-history-score { grid-row: 1 / 3; font-size: 20px; }
  .tl-history-date  { grid-column: 3; font-size: 9px; }
  .tl-history-label { grid-column: 3; grid-row: 2; font-size: 9px; }

  .tl-trust-pill { font-size: 10px; padding: 3px 8px; }
  .tl-trust-row  { gap: 6px; }

  .tl-result-actions { gap: 8px; }
  .tl-new-btn { font-size: 12px; padding: 10px 14px; }
}

@media (max-width: 400px) {
  .tl-credits-pill .tl-credits-label { display: none; }
  .tl-metrics-grid { grid-template-columns: 1fr; }
  .tl-history-row { grid-template-columns: 38px 1fr; }
  .tl-history-date, .tl-history-label { display: none; }
}
`;
