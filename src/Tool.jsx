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

const LOADING_STEPS = [
  "Calculando probabilidade implícita...",
  "Analisando risco...",
  "Identificando pontos cegos...",
  "Preparando leitura conservadora...",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcImplicita(odd) {
  return (1 / odd) * 100;
}

function perdaInfo(chancePerda) {
  if (chancePerda > 60) return { label: "ALTA",  color: "#FF4D2E" };
  if (chancePerda > 42) return { label: "MÉDIA", color: "#FFB020" };
  return                       { label: "BAIXA", color: "#1FCB7A" };
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

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Tool() {
  const [jogo,  setJogo]  = useState("");
  const [tipo,  setTipo]  = useState("Resultado final (1X2)");
  const [odd,   setOdd]   = useState("");
  const [valor, setValor] = useState("");
  const [obs,   setObs]   = useState("");

  const [loading, setLoading] = useState(false);
  const [loadIdx, setLoadIdx] = useState(0);
  const [error,   setError]   = useState("");
  const [result,  setResult]  = useState(null);

  const resultRef = useRef(null);
  const timerRef  = useRef(null);

  function startCycle() {
    let i = 0;
    timerRef.current = setInterval(() => {
      i = (i + 1) % LOADING_STEPS.length;
      setLoadIdx(i);
    }, 1400);
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
    const parts = [
      `Jogo: ${jogo.trim()}`,
      `Tipo de aposta: ${tipo}`,
      `Odd: ${odd.trim()}`,
      `Probabilidade implícita: ${prob.toFixed(1)}%`,
    ];
    if (valor.trim()) parts.push(`Valor pretendido: R$ ${valor.trim()}`);
    if (obs.trim())   parts.push(`Contexto adicional: ${obs.trim()}`);

    setLoading(true);
    setLoadIdx(0);
    startCycle();

    try {
      const res  = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tool: "chance_de_perder", userMessage: parts.join("\n") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar. Tente novamente.");
      const text = data.content?.[0]?.text || "";
      setResult({ ai: parseAI(text), oddN, prob });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setError(err.message || "Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
      stopCycle();
    }
  }

  const perda   = result ? perdaInfo(100 - result.prob) : null;
  const bullets = (result?.ai.oQuePodeDarErrado || "")
    .split("\n").filter((l) => l.trim()).map((l) => l.replace(/^[-•*]\s*/, ""));

  return (
    <>
      <style>{CSS}</style>
      <LegalBar />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="tl-header">
        <div className="tl-logo">
          <span className="tl-logo-mark">M</span>
          <span className="tl-logo-name">MotorIA Pro</span>
        </div>
        <nav className="tl-nav">
          <Link to="/analisar" className="tl-nav-link">Análise completa</Link>
          <Link to="/venda"    className="tl-nav-cta">Acesso vitalício</Link>
        </nav>
      </header>

      <main className="tl-main">
        <div className="tl-wrap">

          {/* ── Hero ───────────────────────────────────────────── */}
          <div className="tl-hero">
            <div className="tl-hero-glow" aria-hidden="true" />
            <div className="tl-hero-tag">FERRAMENTA EDUCATIVA DE ANÁLISE DE RISCO</div>
            <h1 className="tl-hero-title">
              Antes de apostar,<br />
              <span className="tl-hero-title-dim">veja o que pode dar errado.</span>
            </h1>
            <p className="tl-hero-sub">
              Uma análise conservadora para entender risco, probabilidade implícita
              e chance de perda antes de tomar qualquer decisão.
            </p>
            <div className="tl-trust-row">
              {[
                "Ferramenta educativa",
                "Não é casa de aposta",
                "Não vende previsões",
                "Não promete lucro",
              ].map((t) => (
                <span className="tl-trust-pill" key={t}>{t}</span>
              ))}
            </div>
          </div>

          {/* ── Formulário ─────────────────────────────────────── */}
          <form className="tl-form-card" onSubmit={handleSubmit} noValidate>

            <div className="tl-field">
              <label className="tl-label">Jogo ou evento</label>
              <input
                className="tl-input"
                value={jogo}
                onChange={(e) => setJogo(e.target.value)}
                placeholder="Ex: Flamengo x Palmeiras, UFC 310, Djokovic x Alcaraz..."
                disabled={loading}
              />
            </div>

            <div className="tl-field">
              <label className="tl-label">Tipo de aposta</label>
              <select
                className="tl-input tl-select"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                disabled={loading}
              >
                {TIPOS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="tl-row-2">
              <div className="tl-field">
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
              <div className="tl-field">
                <label className="tl-label">
                  Valor pretendido <span className="tl-opt">(opcional)</span>
                </label>
                <input
                  className="tl-input"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="R$ 0,00"
                  inputMode="decimal"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="tl-field">
              <label className="tl-label">
                Observações / Contexto <span className="tl-opt">(opcional)</span>
              </label>
              <textarea
                className="tl-input tl-textarea"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Fase da competição, time jogando fora, momento do campeonato, lesões, outros fatores..."
                disabled={loading}
                rows={3}
              />
            </div>

            <p className="tl-microcopy">
              Quanto mais contexto você inserir, melhor será a leitura de risco.
            </p>

            {error && <div className="tl-err">{error}</div>}

            <button className="tl-btn" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="tl-spinner-inline" />
                  {LOADING_STEPS[loadIdx]}
                </>
              ) : "Analisar risco agora →"}
            </button>
          </form>

          {/* ── Resultado ──────────────────────────────────────── */}
          {result && !loading && (
            <div className="tl-result" ref={resultRef}>

              <div className="tl-result-hdr">
                <span className="tl-result-hdr-text">Relatório de risco</span>
                <span className="tl-result-hdr-odd">odd {result.oddN.toFixed(2)}</span>
              </div>

              {/* A — Probabilidade implícita */}
              <div className="tl-card tl-card-a">
                <div className="tl-card-tag">A · PROBABILIDADE IMPLÍCITA</div>
                <div className="tl-big-num tl-c-green">{result.prob.toFixed(1)}%</div>
                <p className="tl-card-text">
                  Essa odd exige aproximadamente{" "}
                  <strong className="tl-c-green">{result.prob.toFixed(1)}%</strong> de
                  chance real para começar a fazer sentido. Se a probabilidade real for
                  menor que esse valor, o resultado esperado é de perda.
                </p>
              </div>

              {/* B — Chance de perda */}
              <div className="tl-card tl-card-b" style={{ borderColor: perda.color + "2e" }}>
                <div className="tl-card-tag">B · CHANCE ESTIMADA DE PERDA</div>
                <div className="tl-perda-row">
                  <span className="tl-big-num" style={{ color: perda.color }}>
                    ~{(100 - result.prob).toFixed(1)}%
                  </span>
                  <span
                    className="tl-badge"
                    style={{
                      background: perda.color + "1a",
                      color: perda.color,
                      border: `1px solid ${perda.color}40`,
                    }}
                  >
                    {perda.label}
                  </span>
                </div>
                <p className="tl-card-text">
                  Considerando a margem operada pelas casas de apostas, a estimativa
                  conservadora de perda é classificada como{" "}
                  <strong style={{ color: perda.color }}>{perda.label}</strong>.
                </p>
              </div>

              {/* C — Risco principal */}
              {result.ai.riscoPrincipal && (
                <div className="tl-card tl-card-c">
                  <div className="tl-card-tag">C · RISCO PRINCIPAL</div>
                  <p className="tl-card-text">{result.ai.riscoPrincipal}</p>
                </div>
              )}

              {/* D — O que precisa acontecer */}
              {result.ai.cenarioNecessario && (
                <div className="tl-card tl-card-d">
                  <div className="tl-card-tag">D · O QUE PRECISA ACONTECER PARA DAR CERTO</div>
                  <p className="tl-card-text">{result.ai.cenarioNecessario}</p>
                </div>
              )}

              {/* E — Pontos cegos */}
              {bullets.length > 0 && (
                <div className="tl-card tl-card-e">
                  <div className="tl-card-tag">E · PONTOS CEGOS</div>
                  <ul className="tl-bullets">
                    {bullets.map((b, i) => (
                      <li key={i} className="tl-bullet">{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* F — Leitura conservadora final */}
              {(result.ai.leituraConservadora || result.ai.alertaFinal) && (
                <div className="tl-card tl-card-f">
                  <div className="tl-card-tag">F · LEITURA CONSERVADORA FINAL</div>
                  {result.ai.leituraConservadora && (
                    <p className="tl-card-text">{result.ai.leituraConservadora}</p>
                  )}
                  {result.ai.alertaFinal && (
                    <blockquote className="tl-quote">{result.ai.alertaFinal}</blockquote>
                  )}
                  <div className="tl-final-note">
                    Esta análise não recomenda aposta. Ela apenas mostra o risco envolvido.
                  </div>
                </div>
              )}

              <button
                className="tl-new-btn"
                onClick={() => { setResult(null); setOdd(""); setObs(""); setValor(""); }}
              >
                ← Nova análise
              </button>

              <p className="tl-disclaimer">
                Ferramenta educativa de análise de risco. Não é recomendação de aposta.
                Não prevê resultados. Apostas envolvem risco financeiro real.{" "}
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
/* ── Header ──────────────────────────────────────────────── */
.tl-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: rgba(10,10,11,0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.tl-logo { display: flex; align-items: center; gap: 9px; }
.tl-logo-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px; height: 26px;
  background: #1FCB7A;
  color: #0A0A0B;
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 900;
  border-radius: 6px;
  flex-shrink: 0;
}
.tl-logo-name {
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 800;
  color: #F2F2F0;
  letter-spacing: -0.02em;
}
.tl-nav { display: flex; align-items: center; gap: 16px; }
.tl-nav-link {
  font-size: 13px; color: #6B7280;
  text-decoration: none; transition: color 0.15s;
}
.tl-nav-link:hover { color: #F2F2F0; }
.tl-nav-cta {
  font-size: 12px; font-weight: 600;
  color: #1FCB7A; text-decoration: none;
  border: 1px solid rgba(31,203,122,0.3);
  padding: 6px 12px; border-radius: 6px;
  transition: all 0.15s; white-space: nowrap;
}
.tl-nav-cta:hover {
  background: rgba(31,203,122,0.1);
  border-color: rgba(31,203,122,0.5);
}

/* ── Layout ───────────────────────────────────────────────── */
.tl-main { min-height: 80vh; }
.tl-wrap {
  max-width: 580px;
  margin: 0 auto;
  padding: 0 20px 80px;
}

/* ── Hero ─────────────────────────────────────────────────── */
.tl-hero {
  position: relative;
  padding: 52px 0 40px;
  text-align: center;
  overflow: hidden;
}
.tl-hero-glow {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 440px; height: 260px;
  background: radial-gradient(ellipse, rgba(31,203,122,0.09) 0%, transparent 68%);
  pointer-events: none;
  z-index: 0;
}
.tl-hero-tag {
  position: relative; z-index: 1;
  display: inline-block;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; color: #1FCB7A;
  text-transform: uppercase;
  margin-bottom: 20px;
  padding: 5px 13px;
  border: 1px solid rgba(31,203,122,0.25);
  border-radius: 99px;
  background: rgba(31,203,122,0.06);
}
.tl-hero-title {
  position: relative; z-index: 1;
  font-family: 'Syne', sans-serif;
  font-size: clamp(28px, 6vw, 44px);
  font-weight: 900;
  color: #F2F2F0;
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin: 0 0 16px;
}
.tl-hero-title-dim { color: rgba(242,242,240,0.7); }
.tl-hero-sub {
  position: relative; z-index: 1;
  font-size: 15px; color: #6B7280;
  line-height: 1.65;
  max-width: 460px;
  margin: 0 auto 28px;
}
.tl-trust-row {
  position: relative; z-index: 1;
  display: flex; flex-wrap: wrap;
  gap: 8px; justify-content: center;
}
.tl-trust-pill {
  font-size: 11px; color: #4a4a4c;
  border: 1px solid #1e1e1f;
  border-radius: 99px;
  padding: 4px 10px;
  white-space: nowrap;
  background: rgba(255,255,255,0.015);
}

/* ── Form card ────────────────────────────────────────────── */
.tl-form-card {
  background: rgba(255,255,255,0.025);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.tl-field { display: flex; flex-direction: column; gap: 7px; }
.tl-label { font-size: 12px; font-weight: 600; color: #777; letter-spacing: 0.02em; }
.tl-opt   { font-weight: 400; color: #3e3e40; }

.tl-input {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  color: #F2F2F0;
  font-size: 15px;
  font-family: inherit;
  padding: 12px 14px;
  outline: none;
  width: 100%;
  transition: border-color 0.18s, background 0.18s;
  -webkit-appearance: none;
  appearance: none;
}
.tl-input::placeholder { color: #2c2c2e; }
.tl-input:focus {
  border-color: rgba(31,203,122,0.35);
  background: rgba(31,203,122,0.03);
}
.tl-input:disabled { opacity: 0.45; cursor: default; }
.tl-select { cursor: pointer; }
option { background: #111; color: #F2F2F0; }
.tl-textarea { resize: vertical; min-height: 80px; line-height: 1.6; }

.tl-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.tl-microcopy {
  font-size: 12px; color: #38383a;
  font-style: italic; line-height: 1.5;
  margin: -4px 0 0;
}

/* ── Error ────────────────────────────────────────────────── */
.tl-err {
  background: rgba(255,77,46,0.07);
  border: 1px solid rgba(255,77,46,0.2);
  border-radius: 10px;
  color: #f87171; font-size: 13px;
  padding: 11px 14px; line-height: 1.5;
}

/* ── Button ───────────────────────────────────────────────── */
.tl-btn {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: #F2F2F0; color: #0A0A0B;
  border: none; border-radius: 12px;
  font-size: 15px; font-weight: 700;
  font-family: 'Inter', sans-serif;
  padding: 16px 20px;
  cursor: pointer; width: 100%;
  transition: opacity 0.15s, transform 0.12s;
  margin-top: 2px;
}
.tl-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.tl-btn:disabled {
  opacity: 0.6; cursor: default; transform: none;
  font-size: 13px;
  background: rgba(255,255,255,0.04);
  color: #6B7280;
}
.tl-spinner-inline {
  display: inline-block;
  width: 14px; height: 14px;
  border: 1.5px solid rgba(107,114,128,0.35);
  border-top-color: #6B7280;
  border-radius: 50%;
  animation: tl-spin 0.75s linear infinite;
  flex-shrink: 0;
}
@keyframes tl-spin { to { transform: rotate(360deg); } }

/* ── Result ───────────────────────────────────────────────── */
.tl-result { display: flex; flex-direction: column; gap: 12px; margin-top: 32px; }

.tl-result-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 4px;
}
.tl-result-hdr-text {
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.1em; color: #333;
  text-transform: uppercase;
}
.tl-result-hdr-odd {
  font-size: 11px; color: #444;
  font-family: 'Syne', sans-serif; font-weight: 700;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  padding: 3px 9px; border-radius: 6px;
}

/* Base card */
.tl-card {
  background: rgba(255,255,255,0.025);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 20px;
}
.tl-card-tag {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.12em; color: #3a3a3c;
  text-transform: uppercase; margin-bottom: 14px;
}

/* A — verde */
.tl-card-a {
  border-color: rgba(31,203,122,0.18);
  background: rgba(31,203,122,0.04);
}
.tl-card-a .tl-card-tag { color: rgba(31,203,122,0.45); }

/* C — perigo/vermelho */
.tl-card-c {
  border-color: rgba(255,77,46,0.18);
  background: rgba(255,77,46,0.03);
}
.tl-card-c .tl-card-tag { color: rgba(255,77,46,0.45); }

/* E — âmbar/pontos cegos */
.tl-card-e {
  border-color: rgba(255,176,32,0.18);
  background: rgba(255,176,32,0.03);
}
.tl-card-e .tl-card-tag { color: rgba(255,176,32,0.45); }

/* F — leitura final */
.tl-card-f {
  border-color: rgba(255,176,32,0.15);
  background: rgba(255,176,32,0.025);
  display: flex; flex-direction: column; gap: 14px;
}
.tl-card-f .tl-card-tag { color: rgba(255,176,32,0.4); }

/* Números grandes */
.tl-big-num {
  font-family: 'Syne', sans-serif;
  font-size: 48px; font-weight: 900;
  line-height: 1; margin-bottom: 12px;
  letter-spacing: -0.02em;
}
.tl-c-green { color: #1FCB7A; }

/* Perda row */
.tl-perda-row {
  display: flex; align-items: center;
  gap: 12px; margin-bottom: 12px; flex-wrap: wrap;
}
.tl-badge {
  font-size: 13px; font-weight: 800;
  letter-spacing: 0.06em;
  padding: 6px 14px; border-radius: 8px; flex-shrink: 0;
}

/* Texto dos cards */
.tl-card-text {
  font-size: 14px; color: #9a9a9e;
  line-height: 1.72; margin: 0;
}
.tl-card-text strong { font-weight: 700; color: inherit; }

/* Bullets */
.tl-bullets { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.tl-bullet {
  font-size: 14px; color: #9a9a9e;
  padding-left: 22px; position: relative; line-height: 1.65;
}
.tl-bullet::before {
  content: "—"; position: absolute; left: 0;
  color: #FFB020; font-weight: 700;
}

/* Quote */
.tl-quote {
  font-size: 13px; font-style: italic; color: #FFB020;
  border-left: 2px solid rgba(255,176,32,0.35);
  padding: 10px 14px; margin: 0;
  background: rgba(255,176,32,0.04);
  border-radius: 0 8px 8px 0;
  line-height: 1.65;
}

/* Nota final */
.tl-final-note {
  font-size: 12px; color: #3e3e42;
  font-style: italic; line-height: 1.6;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 14px;
}

/* Nova análise */
.tl-new-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px; color: #444;
  font-size: 13px; font-family: inherit;
  padding: 11px 16px; cursor: pointer;
  align-self: flex-start; transition: all 0.15s;
}
.tl-new-btn:hover { border-color: rgba(255,255,255,0.15); color: #888; }

/* Disclaimer */
.tl-disclaimer {
  font-size: 11px; color: #2e2e30;
  text-align: center; line-height: 1.7; padding-top: 4px;
}
.tl-disclaimer a { color: #2e2e30; text-decoration: underline; }

/* ── Mobile ───────────────────────────────────────────────── */
@media (max-width: 500px) {
  .tl-hero { padding: 36px 0 28px; }
  .tl-hero-title { font-size: 26px; }
  .tl-hero-sub { font-size: 14px; }
  .tl-form-card { padding: 20px 16px; border-radius: 16px; gap: 16px; }
  .tl-row-2 { grid-template-columns: 1fr; gap: 16px; }
  .tl-big-num { font-size: 38px; }
  .tl-nav-cta { display: none; }
  .tl-btn { font-size: 14px; padding: 15px; }
  .tl-trust-pill { font-size: 10px; padding: 3px 8px; }
  .tl-trust-row { gap: 6px; }
  .tl-card { padding: 16px; }
}
@media (max-width: 360px) {
  .tl-hero-title { font-size: 22px; }
  .tl-hero-tag { font-size: 9px; }
}
`;
