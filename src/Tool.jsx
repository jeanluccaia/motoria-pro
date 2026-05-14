import { useState, useRef, useEffect } from "react";
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
  "Cruzando odd com exposição ao risco...",
  "Identificando pontos cegos...",
  "Montando leitura conservadora...",
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

function calcScore(oddN) {
  const score = Math.min(100, Math.round(100 - calcImplicita(oddN)));
  let label, color;
  if (score <= 30)      { label = "BAIXO";    color = "#1FCB7A"; }
  else if (score <= 60) { label = "MODERADO"; color = "#FFB020"; }
  else if (score <= 80) { label = "ALTO";     color = "#FF6B2E"; }
  else                  { label = "EXTREMO";  color = "#FF4D2E"; }
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

// ─── Componente ───────────────────────────────────────────────────────────────

const TOKEN_KEY = "motoria_token";

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

  // ── Sistema de créditos ───────────────────────────────────────────────────────
  const [token,    setToken]    = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [credits,  setCredits]  = useState(null);   // null = desconhecido
  const [freeUsed, setFreeUsed] = useState(0);
  const [gateMode, setGateMode] = useState(null);   // null | "free_limit" | "no_credits"
  const [tokenInput,   setTokenInput]   = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError,   setTokenError]   = useState("");

  const resultRef = useRef(null);
  const timerRef  = useRef(null);

  // Valida token salvo ao carregar
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) validateToken(saved, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function validateToken(t, showErrorOnFail = true) {
    try {
      const res = await fetch("/api/validate-token", {
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
        // Diferenciar token expirado de token inválido
        const msg =
          data.code === "TOKEN_EXPIRED"
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
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res  = await fetch("/api/chat", {
        method:  "POST",
        headers,
        body:    JSON.stringify({ tool: "chance_de_perder", userMessage: parts.join("\n") }),
      });
      const data = await res.json();

      // ── Tratamento de erros de crédito ─────────────────────────────────────
      if (res.status === 402) {
        if (data.code === "NO_CREDITS") {
          setCredits(0);
          setGateMode("no_credits");
        } else if (data.code === "FREE_LIMIT") {
          setFreeUsed(data.freeUsed ?? 2);
          setGateMode("free_limit");
        }
        setLoading(false);
        stopCycle();
        return;
      }
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setCredits(null);
        const msg =
          data.code === "TOKEN_EXPIRED"
            ? "Seu token expirou. Adquira um novo pacote para continuar."
            : "Sessão inválida. Insira seu token novamente.";
        throw new Error(msg);
      }
      if (!res.ok) throw new Error(data.error || "Erro ao processar. Tente novamente.");

      // ── Atualizar créditos na UI ────────────────────────────────────────────
      if (data.credits != null)   setCredits(data.credits);
      if (data.freeUsed != null)  setFreeUsed(data.freeUsed);

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

  const perda     = result ? perdaInfo(100 - result.prob) : null;
  const scoreData = result ? calcScore(result.oddN) : null;
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
          {token && credits !== null ? (
            <div className="tl-credits-pill">
              <span className="tl-credits-dot" />
              <span className="tl-credits-count">{credits}</span>
              <span className="tl-credits-label">análise{credits !== 1 ? "s" : ""} restante{credits !== 1 ? "s" : ""}</span>
            </div>
          ) : !token ? (
            <div className="tl-credits-pill tl-credits-free">
              <span className="tl-credits-label">{Math.max(0, 2 - freeUsed)} grátis restante{(2 - freeUsed) !== 1 ? "s" : ""}</span>
            </div>
          ) : null}
          {token ? (
            <button className="tl-nav-logout" onClick={handleLogout}>Sair</button>
          ) : (
            <Link to="/" className="tl-nav-cta">Acesso completo</Link>
          )}
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
              <span className="tl-hero-title-dim">entenda o risco.</span>
            </h1>
            <p className="tl-hero-sub">
              Uma ferramenta educativa para analisar probabilidade implícita,
              chance de perda e pontos cegos antes de qualquer decisão.
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

          {/* ── Gate de créditos ───────────────────────────────── */}
          {gateMode && (
            <div className="tl-gate">
              <div className="tl-gate-icon">
                {gateMode === "no_credits" ? "◎" : "↑"}
              </div>
              <h2 className="tl-gate-title">
                {gateMode === "no_credits"
                  ? "Seus créditos acabaram."
                  : "Você utilizou as análises gratuitas."}
              </h2>
              <p className="tl-gate-sub">
                {gateMode === "no_credits"
                  ? "Adquira mais 20 análises por R$27 para continuar."
                  : "Para continuar analisando, desbloqueie o acesso completo."}
              </p>
              <a href="https://pay.kiwify.com.br/DIVD8zl" className="tl-gate-btn">
                {gateMode === "no_credits"
                  ? "Comprar mais 20 análises — R$27 →"
                  : "Desbloquear acesso completo — R$27 →"}
              </a>
              <div className="tl-gate-divider">
                <span>Já tem um código de acesso?</span>
              </div>
              <form onSubmit={handleActivateToken} className="tl-token-form">
                <input
                  className="tl-input tl-token-input"
                  placeholder="Cole seu código de acesso aqui"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  disabled={tokenLoading}
                  autoComplete="off"
                  spellCheck={false}
                />
                {tokenError && <p className="tl-token-err">{tokenError}</p>}
                <button className="tl-token-btn" type="submit" disabled={tokenLoading}>
                  {tokenLoading ? "Validando..." : "Ativar acesso"}
                </button>
              </form>
            </div>
          )}

          {/* ── Formulário ─────────────────────────────────────── */}
          {!gateMode && <form className="tl-form-card" onSubmit={handleSubmit} noValidate>

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
                <label className="tl-label">
                  Odd
                  <span className="tl-tooltip-wrap" tabIndex="0" aria-label="O que é odd?">
                    <span className="tl-info-icon">?</span>
                    <span className="tl-tooltip" role="tooltip">
                      A odd é o multiplicador pago pela casa se você ganhar. Odd 2.00 significa que a casa estima 50% de chance de você acertar. Quanto maior a odd, menor essa chance — e maior o risco real.
                    </span>
                  </span>
                </label>
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
          </form>}

          {/* ── Resultado ──────────────────────────────────────── */}
          {result && !loading && (
            <div className="tl-result" ref={resultRef}>

              <div className="tl-result-hdr">
                <span className="tl-result-hdr-text">Relatório de risco</span>
                <span className="tl-result-hdr-odd">odd {result.oddN.toFixed(2)}</span>
              </div>

              {/* SCORE DE RISCO MOTORIA */}
              <div
                className="tl-card tl-card-score"
                style={{ borderColor: scoreData.color + "33", background: scoreData.color + "07" }}
              >
                <div className="tl-card-tag" style={{ color: scoreData.color + "88" }}>
                  SCORE DE RISCO MOTORIA™
                </div>
                <div className="tl-score-row">
                  <div className="tl-score-num" style={{ color: scoreData.color }}>
                    {scoreData.score}
                  </div>
                  <div className="tl-score-right">
                    <span
                      className="tl-badge tl-score-badge"
                      style={{
                        background: scoreData.color + "18",
                        color: scoreData.color,
                        border: `1px solid ${scoreData.color}40`,
                      }}
                    >
                      {scoreData.label}
                    </span>
                    <div className="tl-score-bar-wrap">
                      <div className="tl-score-bar-track">
                        <div
                          className="tl-score-bar-fill"
                          style={{ width: `${scoreData.score}%`, background: scoreData.color }}
                        />
                        {[30, 60, 80].map((tick) => (
                          <div key={tick} className="tl-score-tick" style={{ left: `${tick}%` }} />
                        ))}
                      </div>
                      <div className="tl-score-bar-labels">
                        <span>Baixo</span>
                        <span>Moderado</span>
                        <span>Alto</span>
                        <span>Extremo</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="tl-score-note">
                  Este score não recomenda aposta. Ele apenas resume a exposição ao risco
                  com base nas informações fornecidas.
                </p>
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
                Esta ferramenta tem finalidade educativa. Não constitui recomendação de aposta,
                investimento ou garantia de resultado. Apostas envolvem risco financeiro real.{" "}
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
  font-size: 11px; color: #888;
  border: 1px solid #333;
  border-radius: 99px;
  padding: 4px 10px;
  white-space: nowrap;
  background: rgba(255,255,255,0.03);
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

/* ── Tooltip ─────────────────────────────────────────────── */
.tl-tooltip-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  cursor: pointer;
  vertical-align: middle;
  outline: none;
}
.tl-info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px; height: 14px;
  border-radius: 50%;
  border: 1px solid #444;
  font-size: 9px;
  color: #555;
  font-weight: 700;
  line-height: 1;
  transition: border-color 0.15s, color 0.15s;
}
.tl-tooltip-wrap:hover .tl-info-icon,
.tl-tooltip-wrap:focus .tl-info-icon { border-color: #888; color: #aaa; }
.tl-tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a1c;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  color: #aaa;
  line-height: 1.6;
  width: 240px;
  z-index: 300;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
  pointer-events: none;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.tl-tooltip::after {
  content: "";
  position: absolute;
  top: 100%; left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(255,255,255,0.1);
}
.tl-tooltip-wrap:hover .tl-tooltip,
.tl-tooltip-wrap:focus .tl-tooltip { display: block; }

/* ── Score de Risco ──────────────────────────────────────── */
.tl-score-row {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.tl-score-num {
  font-family: 'Syne', sans-serif;
  font-size: 64px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.03em;
  flex-shrink: 0;
  min-width: 80px;
}
.tl-score-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 6px;
}
.tl-score-badge {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 5px 14px;
  border-radius: 8px;
  align-self: flex-start;
}
.tl-score-bar-wrap { display: flex; flex-direction: column; gap: 6px; }
.tl-score-bar-track {
  position: relative;
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 99px;
  overflow: visible;
}
.tl-score-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
}
.tl-score-tick {
  position: absolute;
  top: -3px;
  width: 1px;
  height: 12px;
  background: rgba(255,255,255,0.1);
  transform: translateX(-50%);
}
.tl-score-bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #2e2e30;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.tl-score-note {
  font-size: 11px;
  color: #3a3a3c;
  font-style: italic;
  line-height: 1.6;
  margin: 0;
  border-top: 1px solid rgba(255,255,255,0.04);
  padding-top: 12px;
}

/* ── Credits pill ────────────────────────────────────────── */
.tl-credits-pill {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 600;
  background: rgba(31,203,122,0.07);
  border: 1px solid rgba(31,203,122,0.18);
  border-radius: 99px; padding: 5px 12px;
  white-space: nowrap;
}
.tl-credits-pill.tl-credits-free {
  background: rgba(255,255,255,0.03);
  border-color: rgba(255,255,255,0.07);
}
.tl-credits-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #1FCB7A; box-shadow: 0 0 6px rgba(31,203,122,0.6);
  flex-shrink: 0;
}
.tl-credits-count {
  font-size: 13px; font-weight: 800;
  color: #1FCB7A; line-height: 1;
  font-variant-numeric: tabular-nums;
}
.tl-credits-label { color: #4b5563; }
.tl-nav-logout {
  font-size: 11px; color: #374151;
  background: none; border: none; cursor: pointer;
  text-decoration: underline; text-underline-offset: 3px;
  transition: color .15s; padding: 0;
}
.tl-nav-logout:hover { color: #6b7280; }

/* ── Gate card ────────────────────────────────────────────── */
.tl-gate {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px; padding: 36px 28px;
  display: flex; flex-direction: column;
  align-items: center; text-align: center;
  gap: 16px;
}
.tl-gate-icon {
  font-size: 28px; color: #1FCB7A;
  width: 52px; height: 52px;
  background: rgba(31,203,122,0.08);
  border: 1px solid rgba(31,203,122,0.2);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 900;
}
.tl-gate-title {
  font-size: 20px; font-weight: 800;
  color: #f2f2f0; letter-spacing: -0.02em;
  margin: 0;
}
.tl-gate-sub {
  font-size: 14px; color: #6b7280;
  line-height: 1.65; max-width: 360px;
  margin: 0;
}
.tl-gate-btn {
  display: inline-flex; align-items: center;
  background: #f2f2f0; color: #050505;
  font-size: 14px; font-weight: 700;
  padding: 13px 24px; border-radius: 10px;
  text-decoration: none; transition: opacity .15s, transform .12s;
  margin-top: 4px;
}
.tl-gate-btn:hover { opacity: .88; transform: translateY(-1px); }
.tl-gate-divider {
  display: flex; align-items: center; gap: 12px;
  width: 100%; margin: 4px 0;
}
.tl-gate-divider::before,
.tl-gate-divider::after {
  content: ""; flex: 1; height: 1px;
  background: rgba(255,255,255,0.06);
}
.tl-gate-divider span { font-size: 12px; color: #374151; white-space: nowrap; }
.tl-token-form { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.tl-token-input {
  font-size: 13px; text-align: center;
  letter-spacing: 0.02em;
}
.tl-token-err { font-size: 12px; color: #ef4444; margin: 0; }
.tl-token-btn {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; color: #9ca3af;
  font-size: 13px; font-weight: 600;
  font-family: inherit; padding: 11px;
  cursor: pointer; transition: all .15s;
}
.tl-token-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.08);
  color: #f2f2f0; border-color: rgba(255,255,255,0.14);
}
.tl-token-btn:disabled { opacity: .5; cursor: default; }

/* ── Mobile ───────────────────────────────────────────────── */
@media (max-width: 500px) {
  .tl-hero { padding: 36px 0 28px; }
  .tl-hero-title { font-size: 26px; }
  .tl-hero-title-dim { color: #F2F2F0; }
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
