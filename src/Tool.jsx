import { useState, useRef } from "react";
import { LegalBar, Footer } from "./Layout";
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

const LOADING_MSGS = [
  "Calculando probabilidade implícita...",
  "Estimando chance de perda...",
  "Avaliando nível de risco...",
  "Preparando análise conservadora...",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcImplicita(odd) {
  return (1 / odd) * 100;
}

function calcRiscoNivel(odd) {
  const p = calcImplicita(odd);
  if (p < 25)  return "Crítico";
  if (p < 40)  return "Alto";
  if (p < 58)  return "Médio";
  return "Baixo";
}

function riscoColor(nivel) {
  if (nivel === "Crítico") return "#FF4D2E";
  if (nivel === "Alto")    return "#FF4D2E";
  if (nivel === "Médio")   return "#FFB020";
  return "#1FCB7A";
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
    cenarioNecessario:   matchBlock(text, "CENARIO_NECESSARIO"),
    oQuePodeDarErrado:   matchBlock(text, "O_QUE_PODE_DAR_ERRADO"),
    leituraConservadora: matchBlock(text, "LEITURA_CONSERVADORA"),
    alertaFinal:         matchBlock(text, "ALERTA_FINAL"),
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Tool() {
  const [jogo,   setJogo]   = useState("");
  const [tipo,   setTipo]   = useState("Resultado final (1X2)");
  const [odd,    setOdd]    = useState("");

  const [loading,  setLoading]  = useState(false);
  const [loadIdx,  setLoadIdx]  = useState(0);
  const [error,    setError]    = useState("");
  const [result,   setResult]   = useState(null);

  const resultRef = useRef(null);
  const timerRef  = useRef(null);

  function startCycle() {
    let i = 0;
    timerRef.current = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setLoadIdx(i);
    }, 1500);
  }
  function stopCycle() { clearInterval(timerRef.current); }

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

    const prob = calcImplicita(oddN);
    const userMessage = [
      `Jogo: ${jogo.trim()}`,
      `Tipo de aposta: ${tipo}`,
      `Odd: ${odd.trim()}`,
      `Probabilidade implícita: ${prob.toFixed(1)}%`,
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
      setResult({ ai: parseAI(text), oddN, prob });
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (err) {
      setError(err.message || "Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
      stopCycle();
    }
  }

  const nivel     = result ? calcRiscoNivel(result.oddN) : null;
  const rc        = nivel  ? riscoColor(nivel) : "#FFB020";
  const chancePerda = result ? (100 - result.prob).toFixed(1) : null;

  const bullets = (result?.ai.oQuePodeDarErrado || "")
    .split("\n").filter((l) => l.trim()).map((l) => l.replace(/^[-•*]\s*/, ""));

  return (
    <>
      <style>{CSS}</style>
      <LegalBar />

      {/* ── Header da ferramenta ─────────────────────────── */}
      <header className="tl-header">
        <div className="tl-logo">
          <span className="tl-logo-name">MotorIA Pro</span>
          <span className="tl-logo-sep">·</span>
          <span className="tl-logo-tag">Análise de Risco</span>
        </div>
        <nav className="tl-nav">
          <Link to="/analisar" className="tl-nav-link">Análise completa</Link>
          <Link to="/venda"    className="tl-nav-link">Acesso vitalício</Link>
        </nav>
      </header>

      <main className="tl-main">
        <div className="tl-wrap">

          {/* ── Título da ferramenta ─────────────────────── */}
          <div className="tl-tool-header">
            <div className="tl-tool-tag">FERRAMENTA EDUCATIVA DE RISCO</div>
            <h1 className="tl-tool-title">Chance de Perder</h1>
            <p className="tl-tool-sub">
              Informe a aposta e entenda o risco antes de apostar.
              Sem palpite. Sem previsão. Sem promessa de lucro.
            </p>
          </div>

          {/* ── Formulário ──────────────────────────────── */}
          <form className="tl-form" onSubmit={handleSubmit} noValidate>
            <div className="tl-field">
              <label className="tl-label">Jogo ou evento</label>
              <input
                className="tl-input"
                value={jogo}
                onChange={(e) => setJogo(e.target.value)}
                placeholder="Ex: Flamengo x Palmeiras, UFC 300, Djokovic x Alcaraz..."
                disabled={loading}
              />
            </div>

            <div className="tl-field">
              <label className="tl-label">Tipo de aposta</label>
              <select
                className="tl-input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                disabled={loading}
              >
                {TIPOS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="tl-field tl-field-odd">
              <label className="tl-label">Odd</label>
              <input
                className="tl-input"
                value={odd}
                onChange={(e) => setOdd(e.target.value)}
                placeholder="Ex: 1.80"
                inputMode="decimal"
                disabled={loading}
              />
            </div>

            {error && <div className="tl-err">{error}</div>}

            <button className="tl-btn" type="submit" disabled={loading}>
              {loading ? LOADING_MSGS[loadIdx] : "Analisar chance de perder →"}
            </button>
          </form>

          {/* ── Loading ──────────────────────────────────── */}
          {loading && (
            <div className="tl-loading">
              <div className="tl-spinner" />
            </div>
          )}

          {/* ── Resultado ────────────────────────────────── */}
          {result && !loading && (
            <div className="tl-result" ref={resultRef}>
              <div className="tl-result-divider">
                <span>Relatório</span>
              </div>

              {/* 1 + 2: Probabilidade implícita / Chance de perda */}
              <div className="tl-prob-row">
                <div className="tl-prob-card">
                  <div className="tl-prob-label">PROBABILIDADE IMPLÍCITA</div>
                  <div className="tl-prob-num">{result.prob.toFixed(1)}%</div>
                  <div className="tl-prob-sub">
                    de chance de ganhar segundo a odd {result.oddN.toFixed(2)}
                  </div>
                </div>
                <div className="tl-prob-card tl-prob-card-danger">
                  <div className="tl-prob-label">CHANCE ESTIMADA DE PERDA</div>
                  <div className="tl-prob-num tl-prob-red">~{chancePerda}%</div>
                  <div className="tl-prob-sub">
                    considerando a margem da casa de aposta
                  </div>
                </div>
              </div>

              {/* 3: Nível de risco */}
              <div className="tl-card tl-card-risk" style={{ borderColor: rc + "33", background: rc + "07" }}>
                <div className="tl-card-label">NÍVEL DE RISCO</div>
                <div className="tl-risk-level" style={{ color: rc }}>{nivel}</div>
                <div className="tl-risk-bar-track">
                  <div
                    className="tl-risk-bar-fill"
                    style={{
                      width: nivel === "Crítico" ? "100%" : nivel === "Alto" ? "75%" : nivel === "Médio" ? "48%" : "22%",
                      background: rc,
                    }}
                  />
                </div>
              </div>

              {/* 4: Cenário necessário */}
              {result.ai.cenarioNecessario && (
                <div className="tl-card">
                  <div className="tl-card-label">CENÁRIO NECESSÁRIO PARA DAR CERTO</div>
                  <p className="tl-card-text">{result.ai.cenarioNecessario}</p>
                </div>
              )}

              {/* 5: Pontos de atenção */}
              {bullets.length > 0 && (
                <div className="tl-card tl-card-danger">
                  <div className="tl-card-label">PRINCIPAIS PONTOS DE ATENÇÃO</div>
                  <ul className="tl-bullets">
                    {bullets.map((b, i) => (
                      <li key={i} className="tl-bullet">{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 6: Leitura final conservadora */}
              {(result.ai.leituraConservadora || result.ai.alertaFinal) && (
                <div className="tl-card tl-card-final">
                  <div className="tl-card-label">LEITURA FINAL CONSERVADORA</div>
                  {result.ai.leituraConservadora && (
                    <p className="tl-card-text">{result.ai.leituraConservadora}</p>
                  )}
                  {result.ai.alertaFinal && (
                    <blockquote className="tl-quote">
                      {result.ai.alertaFinal}
                    </blockquote>
                  )}
                  <p className="tl-fixed-alert">
                    "Se você não aceita perder esse valor, a decisão mais segura é não apostar."
                  </p>
                </div>
              )}

              <button className="tl-new-btn" onClick={() => { setResult(null); setOdd(""); }}>
                ← Analisar outra aposta
              </button>

              <p className="tl-disclaimer">
                Ferramenta educativa. Não é recomendação de aposta. Não prevê resultados.
                Apostas envolvem risco financeiro real.{" "}
                <a href="https://www.jogoresponsavel.com.br" target="_blank" rel="noopener noreferrer">
                  jogoresponsavel.com.br
                </a>
              </p>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}

// ─── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
/* ── Layout ──────────────────────────────────────── */
.tl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid #1a1a1b;
  position: sticky;
  top: 0;
  background: rgba(10,10,11,0.96);
  backdrop-filter: blur(8px);
  z-index: 100;
}

.tl-logo { display: flex; align-items: center; gap: 6px; }
.tl-logo-name {
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 900;
  color: #F2F2F0;
  letter-spacing: -0.02em;
}
.tl-logo-sep { color: #333; font-size: 14px; }
.tl-logo-tag { font-size: 13px; color: #6B7280; font-weight: 500; }

.tl-nav { display: flex; align-items: center; gap: 20px; }
.tl-nav-link {
  font-size: 13px;
  color: #6B7280;
  text-decoration: none;
  transition: color 0.15s;
}
.tl-nav-link:hover { color: #F2F2F0; }

.tl-main { min-height: 80vh; }
.tl-wrap {
  max-width: 560px;
  margin: 0 auto;
  padding: 40px 20px 80px;
}

/* ── Tool header ─────────────────────────────────── */
.tl-tool-header { margin-bottom: 36px; }
.tl-tool-tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #FFB020;
  margin-bottom: 10px;
  text-transform: uppercase;
}
.tl-tool-title {
  font-family: 'Syne', sans-serif;
  font-size: clamp(26px, 5vw, 36px);
  font-weight: 900;
  color: #fff;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 10px;
}
.tl-tool-sub {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.65;
}

/* ── Form ────────────────────────────────────────── */
.tl-form { display: flex; flex-direction: column; gap: 16px; }
.tl-field { display: flex; flex-direction: column; gap: 7px; }
.tl-field-odd { max-width: 180px; }
.tl-label { font-size: 12px; font-weight: 600; color: #999; letter-spacing: 0.03em; }
.tl-input {
  background: #111112;
  border: 1px solid #1E1E1F;
  border-radius: 9px;
  color: #F2F2F0;
  font-size: 15px;
  font-family: inherit;
  padding: 12px 14px;
  outline: none;
  transition: border-color 0.18s;
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
}
.tl-input::placeholder { color: #2a2a2b; }
.tl-input:focus { border-color: #333; }

.tl-err {
  background: rgba(255,77,46,0.07);
  border: 1px solid rgba(255,77,46,0.2);
  border-radius: 9px;
  color: #f87171;
  font-size: 13px;
  padding: 11px 14px;
}

.tl-btn {
  background: #F2F2F0;
  color: #0A0A0B;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  padding: 15px 20px;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  margin-top: 4px;
  text-align: center;
}
.tl-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.tl-btn:disabled { opacity: 0.5; cursor: default; transform: none; font-size: 13px; }

/* ── Loading ──────────────────────────────────────── */
.tl-loading {
  display: flex;
  justify-content: center;
  padding: 32px 0 0;
}
.tl-spinner {
  width: 36px; height: 36px;
  border: 2px solid #1E1E1F;
  border-top-color: #F2F2F0;
  border-radius: 50%;
  animation: tl-spin 0.75s linear infinite;
}
@keyframes tl-spin { to { transform: rotate(360deg); } }

/* ── Result ───────────────────────────────────────── */
.tl-result { display: flex; flex-direction: column; gap: 12px; margin-top: 36px; }

.tl-result-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}
.tl-result-divider::before,
.tl-result-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #1a1a1b;
}
.tl-result-divider span {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #333;
  text-transform: uppercase;
}

/* Prob cards */
.tl-prob-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.tl-prob-card {
  background: #111112;
  border: 1px solid #1E1E1F;
  border-radius: 12px;
  padding: 18px;
}
.tl-prob-card-danger {
  border-color: rgba(255,77,46,0.15);
  background: rgba(255,77,46,0.04);
}
.tl-prob-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #444;
  margin-bottom: 10px;
  text-transform: uppercase;
}
.tl-prob-num {
  font-family: 'Syne', sans-serif;
  font-size: 32px;
  font-weight: 800;
  color: #F2F2F0;
  line-height: 1;
  margin-bottom: 8px;
}
.tl-prob-red { color: #FF4D2E; }
.tl-prob-sub { font-size: 11px; color: #555; line-height: 1.5; }

/* Cards */
.tl-card {
  background: #111112;
  border: 1px solid #1E1E1F;
  border-radius: 12px;
  padding: 18px;
}
.tl-card-danger {
  border-color: rgba(255,77,46,0.15);
  background: rgba(255,77,46,0.03);
}
.tl-card-final {
  border-color: rgba(255,176,32,0.18);
  background: rgba(255,176,32,0.03);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tl-card-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #444;
  margin-bottom: 14px;
  text-transform: uppercase;
}
.tl-card-risk { }
.tl-risk-level {
  font-family: 'Syne', sans-serif;
  font-size: 26px;
  font-weight: 800;
  margin-bottom: 14px;
}
.tl-risk-bar-track {
  height: 4px; background: #1a1a1b; border-radius: 99px; overflow: hidden;
}
.tl-risk-bar-fill {
  height: 100%; border-radius: 99px;
  transition: width 1.2s cubic-bezier(0.22,1,0.36,1);
}

.tl-card-text {
  font-size: 14px; color: #bbb; line-height: 1.7; margin: 0;
}

/* Bullets */
.tl-bullets { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.tl-bullet {
  font-size: 14px; color: #bbb; padding-left: 20px;
  position: relative; line-height: 1.6;
}
.tl-bullet::before {
  content: "—"; position: absolute; left: 0;
  color: #FF4D2E; font-weight: 700;
}

/* Quote */
.tl-quote {
  font-size: 13px; font-style: italic; color: #FFB020;
  border-left: 2px solid rgba(255,176,32,0.3);
  padding: 9px 14px; margin: 0;
  border-radius: 0 6px 6px 0;
  background: rgba(255,176,32,0.04);
  line-height: 1.6;
}
.tl-fixed-alert {
  font-size: 13px; font-style: italic;
  color: #555; line-height: 1.6;
  border-top: 1px solid #1a1a1b;
  padding-top: 12px;
  margin-top: 0;
}

/* Bottom */
.tl-new-btn {
  background: none; border: 1px solid #1a1a1b;
  border-radius: 8px; color: #444; font-size: 13px;
  font-family: inherit; padding: 10px 14px;
  cursor: pointer; align-self: flex-start;
  transition: all 0.15s;
}
.tl-new-btn:hover { border-color: #333; color: #888; }

.tl-disclaimer {
  font-size: 11px; color: #2a2a2b;
  text-align: center; line-height: 1.6;
}
.tl-disclaimer a { color: #2a2a2b; text-decoration: underline; }

@media (max-width: 400px) {
  .tl-prob-row { grid-template-columns: 1fr; }
  .tl-field-odd { max-width: 100%; }
}
`;
