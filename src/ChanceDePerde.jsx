import React, { useState, useRef } from "react";

// ─── Constantes ────────────────────────────────────────────────────────────────

const LOADING_MSGS = [
  "Analisando sua aposta...",
  "Calculando chance de perder...",
  "Verificando sinais de impulso...",
  "Preparando sua leitura...",
];

const SENTIMENTOS = ["Tranquilo", "Ansioso", "Irritado", "Confiante demais", "Desesperado"];

// ─── Parse helpers ─────────────────────────────────────────────────────────────

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
    chancePerder:    matchLine(text, "CHANCE_PERDER"),
    perigoScore:     Math.min(100, Math.max(0, parseInt(matchLine(text, "PERIGO_SCORE") || "50", 10))),
    alertaEmocao:    matchBlock(text, "ALERTA_EMOCAO"),
    impactoSePerder: matchBlock(text, "IMPACTO_SE_PERDER"),
    oQueObservar:    matchBlock(text, "O_QUE_OBSERVAR"),
    melhorDecisao:   matchLine(text, "MELHOR_DECISAO"),
    leituraFinal:    matchBlock(text, "LEITURA_FINAL"),
  };
}

// ─── Helpers de cor ────────────────────────────────────────────────────────────

function norm(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function chanceColor(chance) {
  const n = norm(chance);
  if (n === "critica")  return "#ef4444";
  if (n === "alta")     return "#f97316";
  if (n === "moderada") return "#fbbf24";
  if (n === "baixa")    return "#22c55e";
  return "#fbbf24";
}

function chanceBg(chance) {
  const n = norm(chance);
  if (n === "critica")  return "rgba(239,68,68,0.08)";
  if (n === "alta")     return "rgba(249,115,22,0.08)";
  if (n === "moderada") return "rgba(251,191,36,0.08)";
  if (n === "baixa")    return "rgba(34,197,94,0.08)";
  return "rgba(251,191,36,0.08)";
}

function scoreColor(score) {
  if (score >= 70) return "#ef4444";
  if (score >= 40) return "#f97316";
  return "#22c55e";
}

function scoreLabel(score) {
  if (score >= 70) return "Perigo alto — cuidado";
  if (score >= 40) return "Perigo moderado";
  return "Perigo baixo";
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="cdp-field">
      <label className="cdp-label">{label}</label>
      {children}
    </div>
  );
}

function Opts({ options, value, onChange, wrap }) {
  return (
    <div className={`cdp-opts${wrap ? " cdp-opts-wrap" : ""}`}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={`cdp-opt${value === o ? " cdp-opt-on" : ""}`}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Card({ children, warn, decision, highlight, style }) {
  const cls = [
    "cdp-card",
    warn      ? "cdp-card-warn" : "",
    decision  ? "cdp-card-dec"  : "",
    highlight ? "cdp-card-hl"   : "",
  ].filter(Boolean).join(" ");
  return <div className={cls} style={style}>{children}</div>;
}

function CardLabel({ children }) {
  return <div className="cdp-clabel">{children}</div>;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ChanceDePerde() {
  const [form, setForm] = useState({
    jogo: "", aposta: "", odd: "", valor: "", apostas7: "",
    recuperar: "", sentimento: "", fazFalta: "",
  });
  const [loading,  setLoading]  = useState(false);
  const [loadMsg,  setLoadMsg]  = useState(0);
  const [error,    setError]    = useState("");
  const [result,   setResult]   = useState(null);
  const [barReady, setBarReady] = useState(false);

  const resultRef = useRef(null);
  const timerRef  = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const pick = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function startCycle() {
    let i = 0;
    timerRef.current = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setLoadMsg(i);
    }, 1800);
  }

  function stopCycle() {
    clearInterval(timerRef.current);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setBarReady(false);

    if (!form.jogo.trim() || !form.aposta.trim() || !form.odd.trim()) {
      setError("Preencha o jogo, a aposta e a odd para continuar.");
      return;
    }
    if (!form.recuperar || !form.sentimento || !form.fazFalta) {
      setError("Responda todas as perguntas para continuar.");
      return;
    }

    const userMessage = [
      `Jogo: ${form.jogo.trim()}`,
      `Aposta: ${form.aposta.trim()}`,
      `Odd: ${form.odd.trim()}`,
      `Valor: ${form.valor.trim() ? "R$" + form.valor.trim() : "não informado"}`,
      `Apostas nos últimos 7 dias: ${form.apostas7.trim() || "não informado"}`,
      `Tentando recuperar dinheiro: ${form.recuperar}`,
      `Sentimento agora: ${form.sentimento}`,
      `Se perder, vai fazer falta: ${form.fazFalta}`,
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
      setResult(parseOutput(text));
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

  const cc  = result ? chanceColor(result.chancePerder) : "#22c55e";
  const cbg = result ? chanceBg(result.chancePerder)    : "rgba(34,197,94,0.08)";
  const sc  = result ? scoreColor(result.perigoScore)   : "#22c55e";
  const pct = barReady ? `${result?.perigoScore ?? 0}%` : "0%";

  const bullets = (result?.oQueObservar || "")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => l.replace(/^[-•*]\s*/, ""));

  return (
    <>
      <style>{CSS}</style>
      <div className="cdp-root">

        {/* ── Nav ── */}
        <nav className="cdp-nav">
          <a href="#" className="cdp-back">← Voltar</a>
          <span className="cdp-brand">MotorIA Pro</span>
          <span className="cdp-pill">BETA</span>
        </nav>

        <div className="cdp-wrap">

          {/* ── Header ── */}
          <header className="cdp-header">
            <div className="cdp-icon">⚠️</div>
            <h1 className="cdp-h1">
              Antes de apostar,<br />veja sua chance de perder.
            </h1>
            <p className="cdp-sub">
              Responda rápido e descubra se essa aposta<br />
              está vindo da lógica ou da emoção.
            </p>
          </header>

          {/* ── Formulário ── */}
          {!result && !loading && (
            <form className="cdp-form" onSubmit={handleSubmit} noValidate>

              <Field label="Qual é o jogo ou evento?">
                <input
                  className="cdp-input"
                  value={form.jogo}
                  onChange={set("jogo")}
                  placeholder="Ex: Flamengo x Palmeiras"
                />
              </Field>

              <Field label="Qual é a aposta?">
                <input
                  className="cdp-input"
                  value={form.aposta}
                  onChange={set("aposta")}
                  placeholder="Ex: Flamengo vence, mais de 2.5 gols…"
                />
              </Field>

              <div className="cdp-row">
                <Field label="Qual é a odd?">
                  <input
                    className="cdp-input"
                    value={form.odd}
                    onChange={set("odd")}
                    placeholder="Ex: 1.80"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Quanto vai apostar?">
                  <input
                    className="cdp-input"
                    value={form.valor}
                    onChange={set("valor")}
                    placeholder="Ex: R$50"
                    inputMode="decimal"
                  />
                </Field>
              </div>

              <Field label="Quantas apostas nos últimos 7 dias?">
                <input
                  className="cdp-input"
                  value={form.apostas7}
                  onChange={set("apostas7")}
                  placeholder="Ex: 8"
                  inputMode="numeric"
                />
              </Field>

              <Field label="Está tentando recuperar dinheiro perdido?">
                <Opts
                  options={["Sim", "Não"]}
                  value={form.recuperar}
                  onChange={(v) => pick("recuperar", v)}
                />
              </Field>

              <Field label="Como você está se sentindo agora?">
                <Opts
                  options={SENTIMENTOS}
                  value={form.sentimento}
                  onChange={(v) => pick("sentimento", v)}
                  wrap
                />
              </Field>

              <Field label="Se perder essa aposta, vai fazer falta?">
                <Opts
                  options={["Sim", "Não"]}
                  value={form.fazFalta}
                  onChange={(v) => pick("fazFalta", v)}
                />
              </Field>

              {error && <div className="cdp-err">{error}</div>}

              <button className="cdp-btn" type="submit">
                Ver minha chance de perder
              </button>

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

              <button className="cdp-reset" onClick={reset}>
                ← Analisar outra aposta
              </button>

              {/* Card 1: Chance de perder */}
              <Card style={{ background: cbg, borderColor: cc + "44" }}>
                <CardLabel>Chance de perder</CardLabel>
                <div
                  className="cdp-badge"
                  style={{ color: cc, borderColor: cc + "55", background: cc + "18" }}
                >
                  {result.chancePerder || "—"}
                </div>
              </Card>

              {/* Card 2: Nível de perigo */}
              <Card>
                <CardLabel>Nível de perigo</CardLabel>
                <div className="cdp-score" style={{ color: sc }}>
                  {result.perigoScore}
                  <span className="cdp-unit">/100</span>
                </div>
                <div className="cdp-track">
                  <div className="cdp-fill" style={{ width: pct, background: sc }} />
                </div>
                <div className="cdp-score-label" style={{ color: sc }}>
                  {scoreLabel(result.perigoScore)}
                </div>
              </Card>

              {/* Card 3: Alerta de impulso */}
              {result.alertaEmocao && (
                <Card warn>
                  <CardLabel>⚡ Alerta de impulso</CardLabel>
                  <p className="cdp-text">{result.alertaEmocao}</p>
                </Card>
              )}

              {/* Card 4: Impacto se perder */}
              {result.impactoSePerder && (
                <Card>
                  <CardLabel>💸 Se você perder</CardLabel>
                  <p className="cdp-text">{result.impactoSePerder}</p>
                </Card>
              )}

              {/* Card 5: O que observar */}
              {bullets.length > 0 && (
                <Card>
                  <CardLabel>👁 O que observar antes de apostar</CardLabel>
                  <ul className="cdp-list">
                    {bullets.map((b, i) => (
                      <li key={i} className="cdp-li">{b}</li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Card 6: Melhor decisão */}
              {result.melhorDecisao && (
                <Card decision>
                  <CardLabel>Melhor decisão agora</CardLabel>
                  <div className="cdp-decision">{result.melhorDecisao}</div>
                </Card>
              )}

              {/* Card 7: Leitura final */}
              {result.leituraFinal && (
                <Card>
                  <CardLabel>🧠 Leitura final</CardLabel>
                  <p className="cdp-text">{result.leituraFinal}</p>
                </Card>
              )}

              <p className="cdp-disclaimer">
                Ferramenta educativa. Não prevê resultados e não incentiva apostas.
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ─── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.cdp-root {
  min-height: 100vh;
  background: #10101d;
  color: #e8e6f4;
  font-family: 'Inter', sans-serif;
}

/* Nav */
.cdp-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  position: sticky;
  top: 0;
  background: #10101d;
  z-index: 10;
}

.cdp-back {
  color: #22c55e;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.15s;
}
.cdp-back:hover { opacity: 0.7; }

.cdp-brand {
  flex: 1;
  text-align: center;
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 800;
  color: #22c55e;
  letter-spacing: 0.02em;
}

.cdp-pill {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 3px 8px;
  border: 1px solid rgba(34,197,94,0.4);
  border-radius: 20px;
  color: rgba(34,197,94,0.8);
}

/* Container */
.cdp-wrap {
  max-width: 520px;
  margin: 0 auto;
  padding: 32px 20px 72px;
}

/* Header */
.cdp-header {
  text-align: center;
  margin-bottom: 36px;
}

.cdp-icon {
  font-size: 38px;
  margin-bottom: 14px;
}

.cdp-h1 {
  font-family: 'Syne', sans-serif;
  font-size: clamp(22px, 5.5vw, 28px);
  font-weight: 800;
  line-height: 1.22;
  color: #fff;
  margin: 0 0 12px;
}

.cdp-sub {
  font-size: 15px;
  color: rgba(232,230,244,0.55);
  margin: 0;
  line-height: 1.6;
}

/* Form */
.cdp-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.cdp-field {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.cdp-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(232,230,244,0.8);
}

.cdp-input {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.11);
  border-radius: 10px;
  color: #e8e6f4;
  font-size: 15px;
  font-family: inherit;
  padding: 13px 14px;
  outline: none;
  transition: border-color 0.18s;
  width: 100%;
}
.cdp-input::placeholder { color: rgba(232,230,244,0.3); }
.cdp-input:focus { border-color: rgba(34,197,94,0.5); }

.cdp-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Opções */
.cdp-opts {
  display: flex;
  gap: 10px;
}
.cdp-opts-wrap { flex-wrap: wrap; }

.cdp-opt {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.11);
  border-radius: 9px;
  color: rgba(232,230,244,0.65);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.16s;
  flex: 1;
  min-width: 80px;
}
.cdp-opt:hover {
  border-color: rgba(34,197,94,0.35);
  color: #e8e6f4;
}
.cdp-opt-on {
  background: rgba(34,197,94,0.14);
  border-color: rgba(34,197,94,0.65);
  color: #4ade80;
  font-weight: 600;
}

/* Erro */
.cdp-err {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 10px;
  color: #f87171;
  font-size: 14px;
  padding: 12px 14px;
  line-height: 1.5;
}

/* Botão submit */
.cdp-btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  border-radius: 12px;
  color: #071510;
  font-size: 16px;
  font-weight: 800;
  font-family: 'Syne', sans-serif;
  padding: 17px;
  cursor: pointer;
  transition: opacity 0.18s, transform 0.12s;
  margin-top: 4px;
  box-shadow: 0 4px 24px rgba(34,197,94,0.25);
}
.cdp-btn:hover  { opacity: 0.88; transform: translateY(-1px); }
.cdp-btn:active { transform: translateY(0); }

/* Loading */
.cdp-loading {
  text-align: center;
  padding: 70px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
}

.cdp-spinner {
  width: 46px;
  height: 46px;
  border: 3px solid rgba(34,197,94,0.18);
  border-top-color: #22c55e;
  border-radius: 50%;
  animation: cdp-spin 0.75s linear infinite;
}

@keyframes cdp-spin { to { transform: rotate(360deg); } }

.cdp-load-text {
  font-size: 15px;
  color: rgba(232,230,244,0.6);
  margin: 0;
}

/* Resultados */
.cdp-results {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cdp-reset {
  background: none;
  border: 1px solid rgba(255,255,255,0.11);
  border-radius: 8px;
  color: rgba(232,230,244,0.5);
  font-size: 13px;
  font-family: inherit;
  padding: 9px 14px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: all 0.16s;
  align-self: flex-start;
}
.cdp-reset:hover {
  border-color: rgba(34,197,94,0.4);
  color: #22c55e;
}

/* Cards */
.cdp-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 20px;
}

.cdp-card-warn {
  border-color: rgba(249,115,22,0.28);
  background: rgba(249,115,22,0.06);
}

.cdp-card-dec {
  border-color: rgba(34,197,94,0.28);
  background: rgba(34,197,94,0.06);
}

.cdp-clabel {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(232,230,244,0.42);
  margin-bottom: 14px;
}

/* Badge de chance */
.cdp-badge {
  display: inline-block;
  font-family: 'Syne', sans-serif;
  font-size: 26px;
  font-weight: 800;
  padding: 10px 22px;
  border: 2px solid;
  border-radius: 10px;
  letter-spacing: 0.02em;
}

/* Score */
.cdp-score {
  font-family: 'Syne', sans-serif;
  font-size: 44px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 14px;
}

.cdp-unit {
  font-size: 20px;
  font-weight: 600;
  opacity: 0.5;
  margin-left: 2px;
}

.cdp-track {
  height: 8px;
  background: rgba(255,255,255,0.07);
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 10px;
}

.cdp-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 1.3s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.cdp-score-label {
  font-size: 13px;
  font-weight: 600;
}

/* Texto de card */
.cdp-text {
  font-size: 15px;
  line-height: 1.7;
  color: rgba(232,230,244,0.82);
  margin: 0;
  white-space: pre-line;
}

/* Lista */
.cdp-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cdp-li {
  font-size: 15px;
  color: rgba(232,230,244,0.82);
  padding-left: 22px;
  position: relative;
  line-height: 1.55;
}
.cdp-li::before {
  content: "—";
  position: absolute;
  left: 0;
  color: #22c55e;
  font-weight: 700;
}

/* Decisão */
.cdp-decision {
  font-family: 'Syne', sans-serif;
  font-size: 20px;
  font-weight: 800;
  color: #4ade80;
  line-height: 1.3;
}

/* Disclaimer */
.cdp-disclaimer {
  text-align: center;
  font-size: 12px;
  color: rgba(232,230,244,0.28);
  margin-top: 6px;
  line-height: 1.5;
}
`;
