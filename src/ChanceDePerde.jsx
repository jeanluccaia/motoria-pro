import React, { useState, useRef } from "react";

// ─── Constantes ────────────────────────────────────────────────────────────────

const LOADING_MSGS = [
  "Calculando probabilidade implícita...",
  "Identificando fatores de risco...",
  "Avaliando cenários de perda...",
  "Preparando análise conservadora...",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcProb(odd) {
  const n = parseFloat(String(odd).replace(",", "."));
  if (!n || n <= 1) return null;
  return ((1 / n) * 100).toFixed(1);
}

function matchLine(text, key) {
  const m = text.match(new RegExp(`^${key}:\\s*(.+)`, "m"));
  return m ? m[1].trim() : null;
}

function matchBlock(text, key) {
  const m = text.match(new RegExp(`^${key}:[^\\n]*\\n([\\s\\S]*?)(?=\\n[A-Z_]{3,}:|$)`, "m"));
  return m ? m[1].trim() : matchLine(text, key);
}

function parseOutput(text) {
  return {
    nivelRisco:          matchLine(text,  "NIVEL_RISCO"),
    cenarioNecessario:   matchBlock(text, "CENARIO_NECESSARIO"),
    oQuePodeDarErrado:   matchBlock(text, "O_QUE_PODE_DAR_ERRADO"),
    leituraConservadora: matchBlock(text, "LEITURA_CONSERVADORA"),
    alertaFinal:         matchBlock(text, "ALERTA_FINAL"),
  };
}

function norm(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function riskColor(risk) {
  const n = norm(risk);
  if (n === "critico") return "#dc2626";
  if (n === "alto")    return "#ef4444";
  if (n === "medio")   return "#f97316";
  return "#f59e0b";
}

function riskBorder(risk) {
  const n = norm(risk);
  if (n === "critico") return "rgba(220,38,38,0.25)";
  if (n === "alto")    return "rgba(239,68,68,0.25)";
  if (n === "medio")   return "rgba(249,115,22,0.25)";
  return "rgba(245,158,11,0.25)";
}

function riskBg(risk) {
  const n = norm(risk);
  if (n === "critico") return "rgba(220,38,38,0.06)";
  if (n === "alto")    return "rgba(239,68,68,0.06)";
  if (n === "medio")   return "rgba(249,115,22,0.06)";
  return "rgba(245,158,11,0.06)";
}

function riskPct(risk) {
  const n = norm(risk);
  if (n === "critico") return "100%";
  if (n === "alto")    return "75%";
  if (n === "medio")   return "48%";
  return "22%";
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ChanceDePerde() {
  const [jogo,   setJogo]   = useState("");
  const [aposta, setAposta] = useState("");
  const [odd,    setOdd]    = useState("");
  const [valor,  setValor]  = useState("");

  const [loading,  setLoading]  = useState(false);
  const [loadMsg,  setLoadMsg]  = useState(0);
  const [error,    setError]    = useState("");
  const [result,   setResult]   = useState(null);
  const [barReady, setBarReady] = useState(false);

  const resultRef = useRef(null);
  const timerRef  = useRef(null);

  function startCycle() {
    let i = 0;
    timerRef.current = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setLoadMsg(i);
    }, 1800);
  }

  function stopCycle() { clearInterval(timerRef.current); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setBarReady(false);

    if (!jogo.trim()) {
      setError("Informe o jogo ou evento.");
      return;
    }
    if (!aposta.trim()) {
      setError("Informe o tipo de aposta.");
      return;
    }
    const oddNum = parseFloat(odd.replace(",", "."));
    if (!odd.trim() || isNaN(oddNum) || oddNum <= 1) {
      setError("Informe uma odd válida — número maior que 1, ex: 1.80.");
      return;
    }

    const prob = calcProb(odd);
    const userMessage = [
      `Jogo: ${jogo.trim()}`,
      `Aposta: ${aposta.trim()}`,
      `Odd: ${odd.trim()}`,
      `Probabilidade implícita: ${prob}%`,
      valor.trim() ? `Valor considerado: R$${valor.trim()}` : "Valor: não informado",
    ].join("\n");

    setLoading(true);
    startCycle();

    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "chance_de_perder", userMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar. Tente novamente.");
      const text = data.content?.[0]?.text || "";
      setResult({ ...parseOutput(text), prob, odd: odd.trim(), valor: valor.trim() });
      setTimeout(() => {
        setBarReady(true);
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } catch (err) {
      setError(err.message || "Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
      stopCycle();
    }
  }

  function reset() {
    setResult(null);
    setBarReady(false);
    setError("");
  }

  const rc  = result ? riskColor(result.nivelRisco)  : "#f59e0b";
  const rbg = result ? riskBg(result.nivelRisco)     : "";
  const rbd = result ? riskBorder(result.nivelRisco) : "";
  const pct = barReady ? riskPct(result?.nivelRisco) : "0%";

  const erradoBullets = (result?.oQuePodeDarErrado || "")
    .split("\n").filter((l) => l.trim()).map((l) => l.replace(/^[-•*]\s*/, ""));

  return (
    <>
      <style>{CSS}</style>
      <div className="cdp-root">

        {/* ── Aviso legal ── */}
        <div className="cdp-legal-bar">
          <span className="cdp-legal-icon">⚠</span>
          <span>
            Ferramenta educativa. Não é recomendação de aposta. Apostas envolvem
            risco financeiro e podem causar prejuízo.{" "}
            <strong>Proibido para menores de 18 anos.</strong>
          </span>
        </div>

        {/* ── Nav ── */}
        <nav className="cdp-nav">
          <a href="#" className="cdp-back">← Voltar</a>
          <span className="cdp-brand">MotorIA Pro</span>
          <span className="cdp-pill">Análise de Risco</span>
        </nav>

        <div className="cdp-wrap">

          {/* ── Header ── */}
          <header className="cdp-header">
            <div className="cdp-header-tag">FERRAMENTA EDUCATIVA DE RISCO</div>
            <h1 className="cdp-h1">
              O que as plataformas<br />de aposta não te explicam.
            </h1>
            <p className="cdp-sub">
              Antes de pensar em ganhar, entenda primeiro<br />
              o quanto você pode perder.
            </p>
          </header>

          {/* ── Formulário ── */}
          {!result && !loading && (
            <form className="cdp-form" onSubmit={handleSubmit} noValidate>

              <div className="cdp-field">
                <label className="cdp-label">Jogo ou evento</label>
                <input
                  className="cdp-input"
                  value={jogo}
                  onChange={(e) => setJogo(e.target.value)}
                  placeholder="Ex: Flamengo x Palmeiras"
                />
              </div>

              <div className="cdp-field">
                <label className="cdp-label">Tipo de aposta</label>
                <input
                  className="cdp-input"
                  value={aposta}
                  onChange={(e) => setAposta(e.target.value)}
                  placeholder="Ex: Vitória do mandante, Mais de 2.5 gols..."
                />
              </div>

              <div className="cdp-row">
                <div className="cdp-field">
                  <label className="cdp-label">Odd</label>
                  <input
                    className="cdp-input"
                    value={odd}
                    onChange={(e) => setOdd(e.target.value)}
                    placeholder="Ex: 1.80"
                    inputMode="decimal"
                  />
                </div>
                <div className="cdp-field">
                  <label className="cdp-label">
                    Valor considerado
                    <span className="cdp-optional"> (opcional)</span>
                  </label>
                  <input
                    className="cdp-input"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="Ex: R$50"
                    inputMode="decimal"
                  />
                </div>
              </div>

              {error && (
                <div className="cdp-err">
                  <span className="cdp-err-dot" />
                  {error}
                </div>
              )}

              <button className="cdp-btn" type="submit">
                Analisar risco de perda
              </button>

              <p className="cdp-form-note">
                Esta análise calcula a probabilidade de perda com base na odd
                informada e no contexto do mercado. Não é palpite nem previsão.
              </p>

            </form>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className="cdp-loading">
              <div className="cdp-spinner" />
              <p className="cdp-load-text">{LOADING_MSGS[loadMsg]}</p>
            </div>
          )}

          {/* ── Resultado ── */}
          {result && !loading && (
            <div className="cdp-results" ref={resultRef}>

              <button className="cdp-reset" onClick={reset}>← Nova análise</button>

              {/* Card 1 — Probabilidade implícita */}
              <div className="cdp-card">
                <div className="cdp-clabel">PROBABILIDADE IMPLÍCITA DA ODD</div>
                <div className="cdp-prob-row">
                  <span className="cdp-prob-num">{result.prob}%</span>
                  <span className="cdp-prob-caption">
                    é o que a casa estima de chance para esse resultado
                  </span>
                </div>
                <p className="cdp-text cdp-text-muted">
                  A margem da casa (vig) reduz ainda mais a rentabilidade real.
                  Na prática, a probabilidade de perda é superior ao que a odd sugere.
                </p>
              </div>

              {/* Card 2 — Nível de risco */}
              <div
                className="cdp-card"
                style={{ background: rbg, borderColor: rbd }}
              >
                <div className="cdp-clabel">NÍVEL DE RISCO</div>
                <div className="cdp-risk-badge" style={{ color: rc }}>
                  {result.nivelRisco || "—"}
                </div>
                <div className="cdp-track">
                  <div
                    className="cdp-fill"
                    style={{
                      width: pct,
                      background: `linear-gradient(90deg, #f59e0b, ${rc})`,
                    }}
                  />
                </div>
              </div>

              {/* Card 3 — Cenário necessário */}
              {result.cenarioNecessario && (
                <div className="cdp-card">
                  <div className="cdp-clabel">
                    O QUE PRECISA ACONTECER PARA ESSA APOSTA DAR CERTO
                  </div>
                  <p className="cdp-text">{result.cenarioNecessario}</p>
                </div>
              )}

              {/* Card 4 — O que pode dar errado */}
              {erradoBullets.length > 0 && (
                <div className="cdp-card cdp-card-danger">
                  <div className="cdp-clabel">O QUE PODE DAR ERRADO</div>
                  <ul className="cdp-list">
                    {erradoBullets.map((b, i) => (
                      <li key={i} className="cdp-li">{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Card 5 — Leitura conservadora */}
              {result.leituraConservadora && (
                <div className="cdp-card">
                  <div className="cdp-clabel">LEITURA CONSERVADORA</div>
                  <p className="cdp-text">{result.leituraConservadora}</p>
                </div>
              )}

              {/* Card 6 — Alerta final (sempre visível) */}
              <div className="cdp-card cdp-card-alert">
                <div className="cdp-clabel">⚠ ALERTA FINAL</div>
                {result.alertaFinal && (
                  <p className="cdp-text" style={{ marginBottom: "16px" }}>
                    {result.alertaFinal}
                  </p>
                )}
                <blockquote className="cdp-quote">
                  "Se você não aceita perder esse valor, a decisão mais segura é não apostar."
                </blockquote>
              </div>

              <p className="cdp-disclaimer">
                Análise gerada por IA com base em probabilidade matemática e contexto
                de mercado. Não é recomendação de aposta. Todo resultado esportivo é
                imprevisível. Jogue com responsabilidade — ou não jogue.
              </p>

            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.cdp-root {
  min-height: 100vh;
  background: #0f0f0f;
  color: #f0eeea;
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ── Aviso legal ────────────────────────────────────── */
.cdp-legal-bar {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 20px;
  background: rgba(245,158,11,0.07);
  border-bottom: 1px solid rgba(245,158,11,0.18);
  font-size: 12px;
  line-height: 1.55;
  color: rgba(245,158,11,0.82);
}
.cdp-legal-icon {
  font-size: 13px;
  flex-shrink: 0;
  margin-top: 1px;
}

/* ── Nav ─────────────────────────────────────────────── */
.cdp-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  border-bottom: 1px solid #1c1c1c;
  position: sticky;
  top: 0;
  background: #0f0f0f;
  z-index: 10;
}

.cdp-back {
  color: #666;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.15s;
}
.cdp-back:hover { color: #f0eeea; }

.cdp-brand {
  flex: 1;
  text-align: center;
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 800;
  color: #f0eeea;
  letter-spacing: 0.02em;
}

.cdp-pill {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  padding: 3px 9px;
  border: 1px solid #2a2a2a;
  border-radius: 20px;
  color: #666;
}

/* ── Container ───────────────────────────────────────── */
.cdp-wrap {
  max-width: 520px;
  margin: 0 auto;
  padding: 36px 20px 80px;
}

/* ── Header ──────────────────────────────────────────── */
.cdp-header {
  margin-bottom: 40px;
}

.cdp-header-tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #f59e0b;
  margin-bottom: 14px;
  text-transform: uppercase;
}

.cdp-h1 {
  font-family: 'Syne', sans-serif;
  font-size: clamp(24px, 6vw, 32px);
  font-weight: 800;
  line-height: 1.18;
  color: #fff;
  margin: 0 0 14px;
  letter-spacing: -0.01em;
}

.cdp-sub {
  font-size: 15px;
  color: #777;
  margin: 0;
  line-height: 1.65;
}

/* ── Form ────────────────────────────────────────────── */
.cdp-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cdp-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cdp-label {
  font-size: 13px;
  font-weight: 600;
  color: #aaa;
  letter-spacing: 0.02em;
}

.cdp-optional {
  font-weight: 400;
  color: #555;
  font-size: 12px;
}

.cdp-input {
  background: #141414;
  border: 1px solid #222;
  border-radius: 10px;
  color: #f0eeea;
  font-size: 15px;
  font-family: inherit;
  padding: 13px 14px;
  outline: none;
  transition: border-color 0.18s;
  width: 100%;
}
.cdp-input::placeholder { color: #3a3a3a; }
.cdp-input:focus { border-color: #444; }

.cdp-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* ── Erro ────────────────────────────────────────────── */
.cdp-err {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.22);
  border-radius: 10px;
  color: #f87171;
  font-size: 14px;
  padding: 12px 14px;
  line-height: 1.5;
}

.cdp-err-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  flex-shrink: 0;
}

/* ── Botão ───────────────────────────────────────────── */
.cdp-btn {
  background: #f0eeea;
  border: none;
  border-radius: 10px;
  color: #0f0f0f;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  padding: 16px;
  cursor: pointer;
  transition: background 0.18s, transform 0.12s;
  margin-top: 4px;
  letter-spacing: 0.01em;
}
.cdp-btn:hover  { background: #d8d6d2; transform: translateY(-1px); }
.cdp-btn:active { transform: translateY(0); }

.cdp-form-note {
  font-size: 12px;
  color: #444;
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

/* ── Loading ─────────────────────────────────────────── */
.cdp-loading {
  text-align: center;
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.cdp-spinner {
  width: 44px;
  height: 44px;
  border: 2px solid #222;
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: cdp-spin 0.8s linear infinite;
}

@keyframes cdp-spin { to { transform: rotate(360deg); } }

.cdp-load-text {
  font-size: 14px;
  color: #555;
  margin: 0;
}

/* ── Resultados ──────────────────────────────────────── */
.cdp-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cdp-reset {
  background: none;
  border: 1px solid #222;
  border-radius: 8px;
  color: #555;
  font-size: 13px;
  font-family: inherit;
  padding: 9px 14px;
  cursor: pointer;
  margin-bottom: 6px;
  transition: all 0.15s;
  align-self: flex-start;
}
.cdp-reset:hover { border-color: #444; color: #aaa; }

/* ── Cards ───────────────────────────────────────────── */
.cdp-card {
  background: #141414;
  border: 1px solid #1e1e1e;
  border-radius: 12px;
  padding: 20px;
}

.cdp-card-danger {
  border-color: rgba(239,68,68,0.2);
  background: rgba(239,68,68,0.04);
}

.cdp-card-alert {
  border-color: rgba(245,158,11,0.22);
  background: rgba(245,158,11,0.04);
}

.cdp-clabel {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #444;
  margin-bottom: 16px;
}

/* ── Probabilidade ───────────────────────────────────── */
.cdp-prob-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.cdp-prob-num {
  font-family: 'Syne', sans-serif;
  font-size: 42px;
  font-weight: 800;
  color: #f0eeea;
  line-height: 1;
}

.cdp-prob-caption {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  max-width: 180px;
}

/* ── Nível de risco ──────────────────────────────────── */
.cdp-risk-badge {
  font-family: 'Syne', sans-serif;
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 16px;
  letter-spacing: 0.01em;
}

.cdp-track {
  height: 4px;
  background: #1e1e1e;
  border-radius: 99px;
  overflow: hidden;
}

.cdp-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 1.4s cubic-bezier(0.22, 1, 0.36, 1);
}

/* ── Texto ───────────────────────────────────────────── */
.cdp-text {
  font-size: 15px;
  line-height: 1.7;
  color: #bbb;
  margin: 0;
  white-space: pre-line;
}

.cdp-text-muted {
  color: #666;
  font-size: 13px;
  line-height: 1.65;
}

/* ── Lista ───────────────────────────────────────────── */
.cdp-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.cdp-li {
  font-size: 14px;
  color: #bbb;
  padding-left: 20px;
  position: relative;
  line-height: 1.6;
}
.cdp-li::before {
  content: "—";
  position: absolute;
  left: 0;
  color: #ef4444;
  font-weight: 700;
}

/* ── Quote ───────────────────────────────────────────── */
.cdp-quote {
  font-size: 14px;
  font-style: italic;
  color: #f59e0b;
  border-left: 2px solid rgba(245,158,11,0.4);
  margin: 0;
  padding: 10px 16px;
  line-height: 1.6;
  background: rgba(245,158,11,0.04);
  border-radius: 0 6px 6px 0;
}

/* ── Disclaimer ──────────────────────────────────────── */
.cdp-disclaimer {
  font-size: 11px;
  color: #333;
  text-align: center;
  line-height: 1.65;
  margin-top: 8px;
}

/* ── Responsivo ──────────────────────────────────────── */
@media (max-width: 380px) {
  .cdp-row { grid-template-columns: 1fr; }
  .cdp-prob-num { font-size: 36px; }
}
`;
