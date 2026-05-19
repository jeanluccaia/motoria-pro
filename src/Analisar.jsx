import { useState, useEffect, useRef } from "react";
import { LegalBar, Header, Footer } from "./Layout";
import { Link, useNavigate } from "./router";
import { calcAll } from "./math";
import { useAuth } from "./contexts/AuthContext";

// ─── Constantes ────────────────────────────────────────────────────────────────

const ACCESS_KEY  = "motoria_access_v1";
const ADMIN_BYPASS_KEY = "MOTORIA_OWNER_KEY_2026";

// Retorna headers seguros para fetch — sanitiza o JWT para evitar erro ISO-8859-1
function buildAuthHeaders(session) {
  const headers = { "Content-Type": "application/json" };
  const adminKey = localStorage.getItem("motoria_admin_key");
  if (adminKey === ADMIN_BYPASS_KEY) {
    headers["x-admin-key"] = ADMIN_BYPASS_KEY;
    return headers;
  }
  if (session?.access_token) {
    // JWT deve ser ASCII puro — defensive check
    const token = String(session.access_token).replace(/[^\x20-\x7E]/g, "");
    if (token.length > 10) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

const ESPORTES   = ["Futebol", "Basquete", "Tênis", "MMA", "eSports", "Outro"];
const TIPOS      = ["Resultado final", "Over / Under", "Ambas marcam (BTTS)", "Handicap asiático", "Handicap europeu", "Escanteios", "Cartões", "Primeiro gol", "Múltipla", "Chance dupla", "Draw No Bet", "Outro"];
const CASAS      = ["Bet365", "Betano", "Sportingbet", "KTO", "Betfair", "Superbet", "Pixbet", "Novibet", "Betnacional", "EstrelaBet", "F12.bet", "Parimatch", "Bwin", "1xBet", "Outra"];
const RENDAS     = ["Prefiro não informar", "Até R$2.000", "R$2.001–R$4.000", "R$4.001–R$8.000", "R$8.001–R$15.000", "Acima de R$15.000"];
const SENTIMENTOS = [
  { key: "calmo",              label: "Calmo",                     icon: "😌" },
  { key: "empolgado",          label: "Empolgado",                 icon: "🔥" },
  { key: "frustrado",          label: "Frustrado",                 icon: "😤" },
  { key: "tentando_recuperar", label: "Tentando recuperar perdas", icon: "💸" },
];

const LOADING_MSGS = [
  "Analisando exposição ao risco…",
  "Padrões de armadilha identificados…",
  "Comparando probabilidade implícita…",
  "Calculando distorção da odd…",
  "Mapeando viés da casa de apostas…",
  "Gerando relatório de risco…",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Única fonte de verdade para verificar acesso
function canViewFullAnalysis() {
  return localStorage.getItem(ACCESS_KEY) === "1";
}

function getPartialSignals(math) {
  const margem   = parseFloat(math.margem);
  const ev       = parseFloat(math.evReais);
  const kelly    = parseFloat(math.kelly);
  const ruina    = parseFloat(math.riscoRuina);
  const semaforo = math.semaforo;

  const signals = [];
  if (semaforo === "VERMELHO" || margem >= 7)
    signals.push("Exposição acima da média detectada");
  else
    signals.push("Mercado exige cautela");

  if (ev < 0)
    signals.push("Risco potencial identificado");
  else
    signals.push("Oscilação incomum encontrada");

  if (kelly === 0)
    signals.push("Probabilidade implícita inconsistente");
  else
    signals.push("Padrão de entrada identificado");

  if (ruina >= 50)
    signals.push("Nível de exposição elevado encontrado");
  else
    signals.push("Análise de viés concluída");

  return signals;
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
    nivelRisco:          matchLine(text,  "NIVEL_RISCO"),
    cenarioNecessario:   matchBlock(text, "CENARIO_NECESSARIO"),
    oQuePodeDarErrado:   matchBlock(text, "O_QUE_PODE_DAR_ERRADO"),
    leituraConservadora: matchBlock(text, "LEITURA_CONSERVADORA"),
    alertaComport:       matchBlock(text, "ALERTA_COMPORTAMENTAL"),
    alertaFinal:         matchBlock(text, "ALERTA_FINAL"),
  };
}

function semaforoColor(s) {
  if (s === "VERMELHO") return "#FF4D2E";
  if (s === "AMARELO")  return "#FFB020";
  return "#1FCB7A";
}
function semaforoLabel(s) {
  if (s === "VERMELHO") return "RISCO ALTO";
  if (s === "AMARELO")  return "RISCO MODERADO";
  return "RISCO BAIXO";
}
function semaforoPhrase(s, probReal, casa) {
  if (s === "VERMELHO") return `A casa tem ~${(100 - Number(probReal)).toFixed(0)}% de chance de ficar com seu dinheiro nessa aposta.`;
  if (s === "AMARELO")  return "Essa aposta tem viés desfavorável. Avalie bem antes de avançar.";
  return "Matematicamente, essa odd tem melhor equilíbrio. Mas risco sempre existe.";
}

// ─── Gráfico SVG ──────────────────────────────────────────────────────────────

function SimChart({ data, valor }) {
  const W = 320, H = 160, PX = 36, PY = 16;
  const innerW = W - PX * 2, innerH = H - PY * 2;

  const allV = data.flatMap((d) => [d.expected, d.optimistic, d.pessimistic]);
  const minV = Math.min(0, ...allV);
  const maxV = Math.max(0, ...allV);
  const range = maxV - minV || 1;

  const cx = (d) => PX + (d / 30) * innerW;
  const cy = (v) => PY + innerH - ((v - minV) / range) * innerH;

  const path = (key, arr) =>
    arr.map((d, i) => `${i === 0 ? "M" : "L"} ${cx(d.day).toFixed(1)} ${cy(d[key]).toFixed(1)}`).join(" ");

  const zeroY = cy(0);
  const lastExp = data[30]?.expected ?? 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <line x1={PX} y1={zeroY} x2={W - PX} y2={zeroY} stroke="#2a2a2b" strokeDasharray="4 3" />
      <path d={path("pessimistic", data)} fill="none" stroke="#FF4D2E" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.5" />
      <path d={path("expected", data)} fill="none" stroke="#F2F2F0" strokeWidth="2" />
      <path d={path("optimistic", data)} fill="none" stroke="#1FCB7A" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.5" />
      <circle cx={cx(30)} cy={cy(lastExp)} r="4" fill={lastExp >= 0 ? "#1FCB7A" : "#FF4D2E"} />
      <text x={PX} y={H - 2} fontSize="9" fill="#444" fontFamily="Inter,sans-serif">Dia 0</text>
      <text x={W - PX} y={H - 2} fontSize="9" fill="#444" fontFamily="Inter,sans-serif" textAnchor="end">Dia 30</text>
      <text x={PX - 2} y={PY + 4} fontSize="9" fill="#444" fontFamily="Inter,sans-serif" textAnchor="end">
        {maxV >= 0 ? `+R$${Math.abs(Math.round(maxV))}` : `-R$${Math.abs(Math.round(maxV))}`}
      </text>
      <text x={PX - 2} y={H - PY + 4} fontSize="9" fill="#444" fontFamily="Inter,sans-serif" textAnchor="end">
        {`-R$${Math.abs(Math.round(minV))}`}
      </text>
    </svg>
  );
}

// ─── Componente de indicador ───────────────────────────────────────────────────

function Indicator({ label, value, sub, highlight }) {
  return (
    <div className="an-ind" style={highlight ? { borderColor: highlight + "40", background: highlight + "08" } : {}}>
      <div className="an-ind-label">{label}</div>
      <div className="an-ind-value" style={highlight ? { color: highlight } : {}}>{value}</div>
      {sub && <div className="an-ind-sub">{sub}</div>}
    </div>
  );
}

// ─── Wizard ────────────────────────────────────────────────────────────────────

export default function Analisar() {
  const navigate = useNavigate();
  const { session, isPaid } = useAuth();

  const [step, setStep]         = useState(1);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [loadIdx, setLoadIdx]   = useState(0);
  const [error,  setError]      = useState("");
  const [decision, setDecision] = useState(null);
  const [showCode,    setShowCode]    = useState(false);
  const [codeInput,   setCodeInput]   = useState("");
  const [codeError,   setCodeError]   = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  // Access: Supabase paid session OR localStorage code (admin/webhook grant)
  const accessGranted = isPaid || canViewFullAnalysis();

  const [s1, setS1] = useState({ jogo: "", esporte: "Futebol", tipoAposta: "Resultado final", casa: "Bet365" });
  const [s2, setS2] = useState({ odd: "", valor: "", frequencia: 5 });
  const [s3, setS3] = useState({ renda: "Prefiro não informar", gasto30d: "", sentimento: "calmo" });

  const resultRef = useRef(null);
  const timerRef  = useRef(null);

  useEffect(() => {
    // Purge stale free-trial keys from old versions
    ["motoria_free_v1", "motoria_free", "freeUsed", "motoria_trial"].forEach(
      (k) => localStorage.removeItem(k)
    );

    // URL admin token: /analisar?access=TOKEN
    const params = new URLSearchParams(window.location.search);
    const tk = params.get("access");
    if (tk) {
      fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tk }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.valid) {
            localStorage.setItem(ACCESS_KEY, "1");
            window.history.replaceState({}, "", window.location.pathname);
          }
        })
        .catch(() => {});
    }
  }, []);

  async function handleApplyCode() {
    if (!codeInput.trim()) return;
    setCodeLoading(true);
    setCodeError("");
    try {
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: codeInput.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        localStorage.setItem(ACCESS_KEY, "1");
        // Clear partial result so user re-submits with full access
        setResult(null);
        setShowCode(false);
        setStep(3);
      } else {
        setCodeError("Código inválido ou expirado.");
      }
    } catch {
      setCodeError("Erro ao verificar código. Tente novamente.");
    } finally {
      setCodeLoading(false);
    }
  }

  function set1(k) { return (e) => setS1((p) => ({ ...p, [k]: e.target.value })); }
  function set2(k) { return (e) => setS2((p) => ({ ...p, [k]: e.target.value })); }
  function set3(k, v) { setS3((p) => ({ ...p, [k]: v })); }

  function nextStep() {
    setError("");
    if (step === 1) {
      if (!s1.jogo.trim()) { setError("Informe o jogo ou evento."); return; }
      setStep(2);
    } else if (step === 2) {
      const oddN = parseFloat(s2.odd.replace(",", "."));
      if (!s2.odd || isNaN(oddN) || oddN <= 1) { setError("Informe uma odd válida (maior que 1, ex: 1.80)."); return; }
      setStep(3);
    }
  }

  function startCycle() {
    let i = 0;
    timerRef.current = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setLoadIdx(i);
    }, 1600);
  }
  function stopCycle() { clearInterval(timerRef.current); }

  async function handleSubmit() {
    setError("");
    setDecision(null);

    const oddNum = parseFloat(s2.odd.replace(",", "."));
    const math   = calcAll(oddNum, s2.valor || 0, s1.casa, s2.frequencia, s3.sentimento);

    // If user doesn't have access: show partial result immediately without calling AI
    if (!accessGranted) {
      setResult({ math, ai: {} });
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return;
    }

    const userMessage = [
      `Jogo: ${s1.jogo}`,
      `Esporte: ${s1.esporte}`,
      `Tipo de aposta: ${s1.tipoAposta}`,
      `Casa de apostas: ${s1.casa}`,
      `Odd: ${s2.odd}`,
      `Probabilidade implícita: ${math.probImplicita}%`,
      `Probabilidade real estimada: ${math.probReal}%`,
      `Margem da casa: ${math.margem}%`,
      `Valor considerado: ${s2.valor ? "R$" + s2.valor : "não informado"}`,
      `Frequência: ${s2.frequencia}x por semana`,
      `Sentimento: ${s3.sentimento}`,
      s3.gasto30d ? `Gasto últimos 30 dias: R$${s3.gasto30d}` : "",
    ].filter(Boolean).join("\n");

    setLoading(true);
    startCycle();

    try {
      const headers = buildAuthHeaders(session);

      const res  = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ tool: "analyze", userMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar. Tente novamente.");

      // Server confirmed access is blocked despite client thinking it has access
      if (data.locked) {
        localStorage.removeItem(ACCESS_KEY);
        setResult({ math, ai: {} });
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        return;
      }

      const ai = parseAI(data.content?.[0]?.text || "");
      setResult({ math, ai });
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } catch (err) {
      setError(err.message || "Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
      stopCycle();
    }
  }

  function resetWizard() {
    setResult(null);
    setStep(1);
    setDecision(null);
    setError("");
    setShowCode(false);
    setCodeInput("");
    setCodeError("");
  }

  const sc = result ? semaforoColor(result.math.semaforo) : "#FFB020";

  const bullets = (result?.ai.oQuePodeDarErrado || "")
    .split("\n").filter((l) => l.trim()).map((l) => l.replace(/^[-•*]\s*/, ""));

  return (
    <>
      <style>{CSS}</style>
      <LegalBar />
      <Header />

      <div className="an-root">
        <div className="an-wrap">

          {/* ── WIZARD ───────────────────────────────────────── */}
          {!result && !loading && (
            <>
              <div className="an-progress-wrap">
                <div className="an-step-nums">
                  {[
                    { n: 1, title: "Aposta" },
                    { n: 2, title: "Números" },
                    { n: 3, title: "Contexto" },
                  ].map(({ n, title }, i, arr) => (
                    <div key={n} className="an-step-item">
                      <div className={`an-step-dot${n < step ? " an-step-done" : n === step ? " an-step-active" : ""}`}>
                        {n < step ? "✓" : n}
                      </div>
                      <span className={`an-step-title${n === step ? " an-step-title-active" : ""}`}>{title}</span>
                      {i < arr.length - 1 && (
                        <div className={`an-step-line${n < step ? " an-step-line-done" : ""}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 1 */}
              {step === 1 && (
                <div className="an-form">
                  <h1 className="an-form-title">Sobre a aposta</h1>
                  <div className="an-field">
                    <label className="an-label">Jogo ou evento</label>
                    <input className="an-input" value={s1.jogo} onChange={set1("jogo")} placeholder="Ex: Flamengo x Palmeiras, UFC 300..." />
                  </div>
                  <div className="an-field">
                    <label className="an-label">Esporte</label>
                    <select className="an-input" value={s1.esporte} onChange={set1("esporte")}>
                      {ESPORTES.map((e) => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                  <div className="an-field">
                    <label className="an-label">Tipo de aposta</label>
                    <select className="an-input" value={s1.tipoAposta} onChange={set1("tipoAposta")}>
                      {TIPOS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="an-field">
                    <label className="an-label">Casa de apostas</label>
                    <select className="an-input" value={s1.casa} onChange={set1("casa")}>
                      {CASAS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  {error && <div className="an-err">{error}</div>}
                  <button className="an-next-btn" onClick={nextStep}>Próxima etapa →</button>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="an-form">
                  <h1 className="an-form-title">Os números</h1>

                  <div className="an-field">
                    <label className="an-label">
                      Quanto você vai apostar?
                      <span className="an-opt"> (opcional — personaliza as projeções)</span>
                    </label>
                    <div className="an-valor-wrap">
                      <span className="an-valor-prefix">R$</span>
                      <input
                        className="an-input an-valor-input"
                        value={s2.valor}
                        onChange={(e) => setS2((p) => ({ ...p, valor: e.target.value.replace(",", ".") }))}
                        placeholder="50"
                        inputMode="decimal"
                      />
                    </div>
                  </div>

                  <div className="an-field">
                    <label className="an-label">Odd</label>
                    <input className="an-input" value={s2.odd} onChange={set2("odd")} placeholder="Ex: 1.80" inputMode="decimal" />
                  </div>

                  <div className="an-field">
                    <label className="an-label">
                      Frequência — apostas similares por semana:{" "}
                      <strong className="an-freq-num">{s2.frequencia}×</strong>
                      <span className="an-opt"> (~{Math.round(s2.frequencia * 4.33)}/mês)</span>
                    </label>
                    <input
                      className="an-slider"
                      type="range" min="1" max="30"
                      value={s2.frequencia}
                      onChange={(e) => setS2((p) => ({ ...p, frequencia: Number(e.target.value) }))}
                    />
                    <div className="an-slider-labels"><span>1×</span><span>30×</span></div>
                  </div>
                  {error && <div className="an-err">{error}</div>}
                  <div className="an-btn-row">
                    <button className="an-back-btn" onClick={() => setStep(1)}>← Voltar</button>
                    <button className="an-next-btn" onClick={nextStep}>Próxima etapa →</button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="an-form">
                  <h1 className="an-form-title">Contexto pessoal <span className="an-opt">(opcional)</span></h1>
                  <div className="an-local-save">
                    <span className="an-local-save-icon">🔒</span>
                    <div>
                      <span className="an-local-save-title">Dados 100% locais</span>
                      <span className="an-local-save-sub">Nada é enviado ou salvo fora do seu dispositivo.</span>
                    </div>
                  </div>

                  {(s3.sentimento === "tentando_recuperar" || s3.sentimento === "frustrado") && (
                    <div className="an-tilt-alert">
                      <strong>⚠ Atenção: Sinal de tilt detectado.</strong>
                      <p>Apostadores tentando recuperar perdas ou frustrados perdem, em média, 3.2× mais. Considere pausar suas apostas antes de continuar.</p>
                    </div>
                  )}

                  <div className="an-field">
                    <label className="an-label">Como você está se sentindo agora?</label>
                    <div className="an-sentiment-grid">
                      {SENTIMENTOS.map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          className={`an-sent-btn${s3.sentimento === s.key ? " an-sent-on" : ""}`}
                          onClick={() => set3("sentimento", s.key)}
                        >
                          <span>{s.icon}</span>
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="an-row">
                    <div className="an-field">
                      <label className="an-label">Renda mensal aproximada</label>
                      <select className="an-input" value={s3.renda} onChange={(e) => set3("renda", e.target.value)}>
                        {RENDAS.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="an-field">
                      <label className="an-label">Gasto em apostas nos últimos 30 dias</label>
                      <input className="an-input" value={s3.gasto30d} onChange={(e) => set3("gasto30d", e.target.value)} placeholder="Ex: R$300" inputMode="decimal" />
                    </div>
                  </div>
                  {error && <div className="an-err">{error}</div>}
                  <div className="an-btn-row">
                    <button className="an-back-btn" onClick={() => setStep(2)}>← Voltar</button>
                    <button className="an-submit-btn" onClick={handleSubmit}>Gerar análise completa →</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── LOADING ──────────────────────────────────────── */}
          {loading && (
            <div className="an-loading">
              <div className="an-spinner" />
              <p className="an-load-text">{LOADING_MSGS[loadIdx]}</p>
            </div>
          )}

          {/* ── LOCK SCREEN (sem acesso) ─────────────────────── */}
          {result && !loading && !accessGranted && (
            <div className="an-lock-root" ref={resultRef}>

              <div className="an-partial-header">
                <span className="an-partial-dot" />
                <span className="an-partial-title">Análise parcial concluída</span>
              </div>

              <p className="an-partial-desc">
                O MotorIA encontrou sinais importantes de risco nesta entrada.
              </p>

              <div className="an-signals">
                {getPartialSignals(result.math).map((sig, i) => (
                  <div key={i} className="an-signal-chip">
                    <span className="an-signal-dot" />
                    {sig}
                  </div>
                ))}
              </div>

              {/* Card borrado */}
              <div className="an-blurred-card">
                <div className="an-blurred-inner">
                  <div className="an-blur-section">
                    <div className="an-blur-label">RISCO DA APOSTA</div>
                    <div className="an-blur-value an-blur-block">██ / 100</div>
                  </div>
                  <div className="an-blur-divider" />
                  <div className="an-blur-section">
                    <div className="an-blur-label">CHANCE ESTIMADA</div>
                    <div className="an-blur-value an-blur-block">██,█%</div>
                  </div>
                  <div className="an-blur-divider" />
                  <div className="an-blur-section">
                    <div className="an-blur-label">LEITURA DA IA</div>
                    <div className="an-blur-value an-blur-block an-blur-text">████████████ ████████████</div>
                    <div className="an-blur-value an-blur-block an-blur-text" style={{ marginTop: 6 }}>████ ████████ ███████████</div>
                  </div>
                </div>
                <div className="an-blurred-fog" />
                <div className="an-lock-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="#00dc64" strokeWidth="1.8"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#00dc64" strokeWidth="1.8"/>
                  </svg>
                  Bloqueado
                </div>
              </div>

              {/* CTA */}
              <div className="an-lock-cta">
                <div className="an-lock-headline">Resultado parcial identificado.</div>
                <div className="an-lock-sub">
                  O MotorIA encontrou sinais importantes de risco nesta entrada.
                </div>

                <a href="/login" className="an-lock-btn">
                  Desbloquear análise completa
                </a>

                <div className="an-lock-price">
                  Pagamento único · sem mensalidade · acesso imediato · <strong>R$27</strong>
                </div>
              </div>

              {/* Código de acesso */}
              {!showCode ? (
                <button className="an-code-toggle" onClick={() => setShowCode(true)}>
                  Tenho um código de acesso
                </button>
              ) : (
                <div className="an-code-form">
                  <input
                    className="an-code-input"
                    placeholder="Digite seu código"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCode()}
                  />
                  <button className="an-code-btn" onClick={handleApplyCode} disabled={codeLoading}>
                    {codeLoading ? "Verificando…" : "Aplicar"}
                  </button>
                  {codeError && <div className="an-code-err">{codeError}</div>}
                </div>
              )}

              <button className="an-reset" style={{ marginTop: 20 }} onClick={resetWizard}>
                ← Analisar outra aposta
              </button>
            </div>
          )}

          {/* ── RESULTADO COMPLETO (com acesso) ──────────────── */}
          {result && !loading && accessGranted && (
            <div className="an-result" ref={resultRef}>
              <button className="an-reset" onClick={resetWizard}>← Nova análise</button>

              {/* SEMÁFORO */}
              <div className="an-semaforo" style={{ borderColor: sc + "33", background: sc + "08" }}>
                <div className="an-sem-dot" style={{ background: sc, boxShadow: `0 0 24px ${sc}55` }} />
                <div>
                  <div className="an-sem-label" style={{ color: sc }}>
                    {semaforoLabel(result.math.semaforo)}
                  </div>
                  <div className="an-sem-phrase">
                    {semaforoPhrase(result.math.semaforo, result.math.probReal, s1.casa)}
                  </div>
                </div>
              </div>

              {/* 8 INDICADORES */}
              <div className="an-ind-grid">
                <Indicator label="PROBABILIDADE IMPLÍCITA" value={`${result.math.probImplicita}%`} sub="de chance segundo a odd" />
                <Indicator label="PROBABILIDADE REAL ESTIMADA" value={`${result.math.probReal}%`} sub={`ajustada pela margem da ${s1.casa}`} />
                <Indicator label="MARGEM DA CASA (VIG)" value={`${result.math.margem}%`} sub="taxa invisível por aposta" highlight={parseFloat(result.math.margem) >= 7 ? "#FF4D2E" : "#FFB020"} />
                <Indicator label="VALOR ESPERADO (EV)" value={`${parseFloat(result.math.evReais) >= 0 ? "+" : ""}R$${result.math.evReais}`} sub="por aposta no longo prazo" highlight={parseFloat(result.math.evReais) >= 0 ? "#1FCB7A" : "#FF4D2E"} />
                <Indicator label="PROJEÇÃO 30 DIAS" value={`${parseFloat(result.math.resultado30d) >= 0 ? "+" : ""}R$${result.math.resultado30d}`} sub={`apostando ${s2.frequencia}×/sem`} highlight={parseFloat(result.math.resultado30d) >= 0 ? "#1FCB7A" : "#FF4D2E"} />
                <Indicator label="PROJEÇÃO 90 DIAS" value={`${parseFloat(result.math.resultado90d) >= 0 ? "+" : ""}R$${result.math.resultado90d}`} sub="cenário esperado" highlight={parseFloat(result.math.resultado90d) >= 0 ? "#1FCB7A" : "#FF4D2E"} />
                <Indicator label="KELLY CRITERION" value={parseFloat(result.math.kelly) === 0 ? "0% — não apostar" : `${result.math.kelly}% da banca`} sub="fração racional sugerida" highlight={parseFloat(result.math.kelly) === 0 ? "#FF4D2E" : undefined} />
                <Indicator label="RISCO DE RUÍNA (20 APOSTAS)" value={`${result.math.riscoRuina}%`} sub="prob. de zerar essa série" highlight={parseFloat(result.math.riscoRuina) >= 50 ? "#FF4D2E" : "#FFB020"} />
              </div>

              {/* SIMULAÇÃO */}
              {s2.valor && (
                <div className="an-card">
                  <div className="an-card-label">SIMULAÇÃO — 30 DIAS</div>
                  <SimChart data={result.math.simData} valor={parseFloat(s2.valor)} />
                  <div className="an-chart-legend">
                    <span className="an-leg an-leg-exp">— Cenário esperado</span>
                    <span className="an-leg an-leg-opt">-- Otimista (P90)</span>
                    <span className="an-leg an-leg-pes">-- Pessimista (P10)</span>
                  </div>
                  <p className="an-sim-note">
                    Apostando {s2.frequencia}×/semana com R${s2.valor} por aposta, em 30 dias
                    o resultado esperado é{" "}
                    <strong style={{ color: parseFloat(result.math.resultado30d) >= 0 ? "#1FCB7A" : "#FF4D2E" }}>
                      {parseFloat(result.math.resultado30d) >= 0 ? "+" : ""}R${result.math.resultado30d}
                    </strong>.
                  </p>
                </div>
              )}

              {/* MARGEM DECODIFICADA */}
              <div className="an-card an-card-amber">
                <div className="an-card-label">MARGEM DA CASA DECODIFICADA</div>
                <p className="an-card-text">
                  A <strong>{s1.casa}</strong> cobra uma margem de{" "}
                  <strong>{result.math.margem}%</strong> nesse mercado. Isso significa que de cada{" "}
                  <strong>R$100 apostados</strong>, R${(parseFloat(result.math.margem)).toFixed(2)} vão para
                  o lucro da casa <em>antes</em> de qualquer resultado.
                </p>
              </div>

              {(result.ai.alertaComport && result.ai.alertaComport.trim()) && (
                <div className="an-card an-card-red">
                  <div className="an-card-label">⚠ ALERTA COMPORTAMENTAL</div>
                  <p className="an-card-text">{result.ai.alertaComport}</p>
                </div>
              )}

              {result.ai.cenarioNecessario && (
                <div className="an-card">
                  <div className="an-card-label">O QUE PRECISA ACONTECER PARA DAR CERTO</div>
                  <p className="an-card-text">{result.ai.cenarioNecessario}</p>
                </div>
              )}

              {bullets.length > 0 && (
                <div className="an-card an-card-danger">
                  <div className="an-card-label">O QUE PODE DAR ERRADO</div>
                  <ul className="an-bullets">
                    {bullets.map((b, i) => <li key={i} className="an-bullet">{b}</li>)}
                  </ul>
                </div>
              )}

              {result.ai.leituraConservadora && (
                <div className="an-card">
                  <div className="an-card-label">LEITURA CONSERVADORA</div>
                  <p className="an-card-text">{result.ai.leituraConservadora}</p>
                </div>
              )}

              <div className="an-card an-card-decision">
                <div className="an-card-label">DECISÃO</div>
                {!decision ? (
                  <div className="an-dec-btns">
                    <button className="an-dec-btn an-dec-avoid" onClick={() => setDecision("evitou")}>
                      Não apostar — registrar como evitada ✓
                    </button>
                    {s2.valor && parseFloat(result.math.kelly) > 0 && (
                      <button className="an-dec-btn an-dec-reduce" onClick={() => setDecision("reduziu")}>
                        Reduzir valor (Kelly sugere {result.math.kelly}% da banca)
                      </button>
                    )}
                    <button className="an-dec-btn an-dec-proceed" onClick={() => setDecision("apostou")}>
                      Apostar mesmo assim — registrar no diário
                    </button>
                  </div>
                ) : (
                  <div className={`an-dec-confirm ${decision === "evitou" ? "an-dec-confirm-green" : ""}`}>
                    {decision === "evitou" && "✓ Registrado como aposta evitada. Boa decisão."}
                    {decision === "reduziu" && `✓ Registrado. Considere apostar no máximo ${result.math.kelly}% da sua banca nessa odd.`}
                    {decision === "apostou" && "Registrado no diário. Acompanhe o resultado depois."}
                  </div>
                )}
              </div>

              <div className="an-card an-card-final">
                <div className="an-card-label">⚠ ALERTA FINAL</div>
                {result.ai.alertaFinal && <p className="an-card-text" style={{ marginBottom: 14 }}>{result.ai.alertaFinal}</p>}
                <blockquote className="an-quote">
                  "Se você não aceita perder esse valor, a decisão mais segura é não apostar."
                </blockquote>
              </div>

              <p className="an-disclaimer">
                Análise gerada por IA com base em cálculo matemático. Não é recomendação de aposta.
                Todo resultado esportivo é imprevisível. Jogue com responsabilidade.
              </p>
            </div>
          )}

        </div>
      </div>

      <Footer />
    </>
  );
}

// ─── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
.an-root { min-height: 80vh; padding: 0 0 80px; }
.an-wrap { max-width: 560px; margin: 0 auto; padding: 32px 20px; }

/* Progress numerado */
.an-progress-wrap { margin-bottom: 32px; }
.an-step-nums {
  display: flex; align-items: flex-start; justify-content: space-between; position: relative;
}
.an-step-item {
  display: flex; flex-direction: column; align-items: center;
  gap: 6px; position: relative; flex: 1;
}
.an-step-dot {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 50%;
  font-size: 12px; font-weight: 800; color: #2e2e30;
  border: 1.5px solid #222; background: #0A0A0B;
  transition: all 0.25s; z-index: 1;
}
.an-step-active { color: var(--text); border-color: var(--text); background: rgba(242,242,240,0.07); box-shadow: 0 0 0 4px rgba(242,242,240,0.05); }
.an-step-done { color: #1FCB7A; border-color: rgba(31,203,122,0.5); background: rgba(31,203,122,0.08); font-size: 11px; }
.an-step-title { font-size: 10px; font-weight: 600; color: #2e2e30; letter-spacing: 0.03em; text-align: center; white-space: nowrap; transition: color 0.25s; }
.an-step-title-active { color: var(--muted); }
.an-step-line { position: absolute; top: 15px; left: calc(50% + 18px); right: calc(-50% + 18px); height: 1px; background: #1a1a1b; transition: background 0.3s; }
.an-step-line-done { background: rgba(31,203,122,0.3); }

/* Local save */
.an-local-save { display: flex; align-items: center; gap: 10px; background: rgba(31,203,122,0.05); border: 1px solid rgba(31,203,122,0.18); border-radius: 10px; padding: 10px 14px; margin-top: -4px; }
.an-local-save-icon { font-size: 15px; flex-shrink: 0; }
.an-local-save-title { font-size: 12px; font-weight: 700; color: #1FCB7A; display: block; }
.an-local-save-sub { font-size: 11px; color: #555; display: block; line-height: 1.4; margin-top: 1px; }

/* Form */
.an-form { display: flex; flex-direction: column; gap: 20px; }
.an-form-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 4px; }
.an-field { display: flex; flex-direction: column; gap: 8px; }
.an-label { font-size: 13px; font-weight: 600; color: #aaa; }
.an-opt { font-size: 11px; color: #555; font-weight: 400; }
.an-input { background: #111112; border: 1px solid #222; border-radius: 10px; color: var(--text); font-size: 15px; font-family: inherit; padding: 12px 14px; outline: none; transition: border-color 0.18s; width: 100%; -webkit-appearance: none; appearance: none; }
.an-input::placeholder { color: #333; }
.an-input:focus { border-color: #444; }

/* Valor com prefixo R$ */
.an-valor-wrap { display: flex; align-items: center; background: #111112; border: 1px solid #222; border-radius: 10px; overflow: hidden; transition: border-color 0.18s; }
.an-valor-wrap:focus-within { border-color: #444; }
.an-valor-prefix { padding: 0 4px 0 14px; font-size: 16px; font-weight: 700; color: #1FCB7A; flex-shrink: 0; }
.an-valor-input { border: none !important; background: transparent; padding-left: 4px; font-size: 18px; font-weight: 700; }

/* Slider */
.an-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: #222; border-radius: 99px; outline: none; cursor: pointer; }
.an-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--text); cursor: pointer; }
.an-slider-labels { display: flex; justify-content: space-between; font-size: 11px; color: #444; }
.an-freq-num { color: var(--text); }
.an-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* Buttons */
.an-btn-row { display: flex; gap: 10px; }
.an-next-btn, .an-submit-btn { flex: 1; background: var(--text); color: var(--bg); border: none; border-radius: 10px; font-size: 15px; font-weight: 700; font-family: inherit; padding: 15px; cursor: pointer; transition: opacity 0.15s; }
.an-next-btn:hover, .an-submit-btn:hover { opacity: 0.88; }
.an-back-btn { background: none; border: 1px solid #222; border-radius: 10px; color: #555; font-size: 14px; font-family: inherit; padding: 15px 18px; cursor: pointer; transition: all 0.15s; }
.an-back-btn:hover { border-color: #444; color: #aaa; }

/* Erro */
.an-err { background: rgba(255,77,46,0.08); border: 1px solid rgba(255,77,46,0.2); border-radius: 10px; color: #f87171; font-size: 14px; padding: 12px 14px; }

/* Tilt */
.an-tilt-alert { background: rgba(255,77,46,0.08); border: 1px solid rgba(255,77,46,0.25); border-radius: 12px; padding: 16px; animation: an-pulse 2s infinite; }
@keyframes an-pulse { 0%,100%{opacity:1} 50%{opacity:0.85} }
.an-tilt-alert strong { color: var(--red); display: block; margin-bottom: 6px; }
.an-tilt-alert p { font-size: 14px; color: #bbb; line-height: 1.6; }

/* Sentiment */
.an-sentiment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.an-sent-btn { display: flex; align-items: center; gap: 10px; background: #111112; border: 1px solid #222; border-radius: 9px; color: #888; font-size: 14px; font-family: inherit; padding: 12px 14px; cursor: pointer; transition: all 0.15s; text-align: left; }
.an-sent-btn:hover { border-color: #444; color: var(--text); }
.an-sent-on { border-color: var(--text); color: var(--text); background: rgba(242,242,240,0.06); }

/* Loading */
.an-loading { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
.an-spinner { width: 44px; height: 44px; border: 2px solid #1E1E1F; border-top-color: var(--text); border-radius: 50%; animation: an-spin 0.8s linear infinite; }
@keyframes an-spin { to { transform: rotate(360deg); } }
.an-load-text { font-size: 14px; color: var(--muted); }

/* Lock screen */
.an-lock-root { display: flex; flex-direction: column; gap: 16px; }
.an-partial-header { display: flex; align-items: center; gap: 8px; }
.an-partial-dot { width: 8px; height: 8px; border-radius: 50%; background: #1FCB7A; box-shadow: 0 0 8px #1FCB7A88; animation: an-pulse 2s infinite; flex-shrink: 0; }
.an-partial-title { font-size: 12px; font-weight: 700; color: #1FCB7A; letter-spacing: 0.08em; text-transform: uppercase; }
.an-partial-desc { font-size: 15px; color: #aaa; line-height: 1.6; margin: 0; }

.an-signals { display: flex; flex-direction: column; gap: 8px; }
.an-signal-chip { display: flex; align-items: center; gap: 10px; background: rgba(31,203,122,0.06); border: 1px solid rgba(31,203,122,0.15); border-radius: 9px; padding: 10px 14px; font-size: 13px; color: #ccc; }
.an-signal-dot { width: 6px; height: 6px; border-radius: 50%; background: #1FCB7A; flex-shrink: 0; }

.an-blurred-card { background: #111112; border: 1px solid #1E1E1F; border-radius: 14px; overflow: hidden; position: relative; }
.an-blurred-inner { display: flex; padding: 20px; gap: 0; filter: blur(6px); user-select: none; }
.an-blur-section { flex: 1; padding: 0 12px; }
.an-blur-section:first-child { padding-left: 0; }
.an-blur-section:last-child { padding-right: 0; }
.an-blur-divider { width: 1px; background: #1E1E1F; flex-shrink: 0; }
.an-blur-label { font-size: 9px; font-weight: 700; color: #444; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px; }
.an-blur-value { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--text); }
.an-blur-block { opacity: 0.5; }
.an-blur-text { font-size: 13px; font-family: inherit; letter-spacing: 2px; }
.an-blurred-fog { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 30%, rgba(10,10,11,0.95) 100%); }
.an-lock-badge { position: absolute; bottom: 14px; right: 14px; display: flex; align-items: center; gap: 6px; background: rgba(0,220,100,0.1); border: 1px solid rgba(0,220,100,0.25); border-radius: 8px; padding: 6px 10px; font-size: 12px; font-weight: 700; color: #00dc64; }

.an-lock-cta { background: #111112; border: 1px solid #1E1E1F; border-radius: 14px; padding: 22px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; }
.an-lock-headline { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 900; color: #fff; }
.an-lock-sub { font-size: 14px; color: #888; line-height: 1.6; max-width: 300px; }
.an-lock-btn { display: block; width: 100%; padding: 15px; background: #1FCB7A; color: #000; font-size: 15px; font-weight: 900; border-radius: 10px; text-decoration: none; transition: opacity 0.15s; }
.an-lock-btn:hover { opacity: 0.9; }
.an-lock-price { font-size: 13px; color: #555; }
.an-lock-price strong { color: #1FCB7A; }

.an-code-toggle { background: none; border: none; color: #555; font-size: 13px; font-family: inherit; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; padding: 0; align-self: center; }
.an-code-toggle:hover { color: #888; }
.an-code-form { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.an-code-input { background: #111112; border: 1px solid #222; border-radius: 9px; color: var(--text); font-size: 15px; font-family: inherit; padding: 12px 14px; outline: none; letter-spacing: 0.08em; }
.an-code-input:focus { border-color: #444; }
.an-code-btn { background: var(--text); color: var(--bg); border: none; border-radius: 9px; font-size: 14px; font-weight: 700; font-family: inherit; padding: 12px; cursor: pointer; transition: opacity 0.15s; }
.an-code-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.an-code-err { font-size: 13px; color: #f87171; text-align: center; }

/* Result */
.an-result { display: flex; flex-direction: column; gap: 12px; }
.an-reset { background: none; border: 1px solid #1E1E1F; border-radius: 8px; color: #444; font-size: 13px; font-family: inherit; padding: 9px 14px; cursor: pointer; align-self: flex-start; transition: all 0.15s; margin-bottom: 4px; }
.an-reset:hover { border-color: #444; color: var(--muted); }

.an-semaforo { display: flex; align-items: center; gap: 16px; border: 1px solid; border-radius: 14px; padding: 20px; }
.an-sem-dot { width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0; }
.an-sem-label { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; }
.an-sem-phrase { font-size: 14px; color: var(--muted); margin-top: 4px; line-height: 1.5; }

.an-ind-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.an-ind { background: #111112; border: 1px solid #1E1E1F; border-radius: 12px; padding: 16px; }
.an-ind-label { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; color: #444; margin-bottom: 10px; text-transform: uppercase; }
.an-ind-value { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--text); line-height: 1; margin-bottom: 6px; }
.an-ind-sub { font-size: 11px; color: #555; }

.an-card { background: #111112; border: 1px solid #1E1E1F; border-radius: 12px; padding: 18px; }
.an-card-amber { border-color: rgba(255,176,32,0.2); background: rgba(255,176,32,0.04); }
.an-card-red { border-color: rgba(255,77,46,0.25); background: rgba(255,77,46,0.05); }
.an-card-danger { border-color: rgba(255,77,46,0.15); background: rgba(255,77,46,0.03); }
.an-card-decision { border-color: rgba(242,242,240,0.1); background: rgba(242,242,240,0.03); }
.an-card-final { border-color: rgba(255,176,32,0.2); background: rgba(255,176,32,0.04); }
.an-card-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #444; margin-bottom: 14px; text-transform: uppercase; }
.an-card-text { font-size: 14px; color: #bbb; line-height: 1.7; margin: 0; }

.an-chart-legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: 11px; margin: 10px 0 6px; }
.an-leg { display: flex; align-items: center; gap: 4px; }
.an-leg-exp { color: var(--text); }
.an-leg-opt { color: #1FCB7A; opacity: 0.7; }
.an-leg-pes { color: #FF4D2E; opacity: 0.7; }
.an-sim-note { font-size: 13px; color: #666; margin-top: 8px; }

.an-bullets { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.an-bullet { font-size: 14px; color: #bbb; padding-left: 20px; position: relative; line-height: 1.6; }
.an-bullet::before { content: "—"; position: absolute; left: 0; color: var(--red); font-weight: 700; }

.an-dec-btns { display: flex; flex-direction: column; gap: 10px; }
.an-dec-btn { background: #111112; border: 1px solid #1E1E1F; border-radius: 9px; color: #aaa; font-size: 14px; font-family: inherit; padding: 13px 16px; cursor: pointer; text-align: left; transition: all 0.15s; }
.an-dec-avoid { border-color: rgba(31,203,122,0.25); color: #1FCB7A; }
.an-dec-avoid:hover { background: rgba(31,203,122,0.06); }
.an-dec-reduce:hover { background: rgba(255,176,32,0.06); color: #FFB020; border-color: rgba(255,176,32,0.25); }
.an-dec-proceed:hover { background: rgba(255,77,46,0.05); }
.an-dec-confirm { font-size: 14px; color: var(--muted); padding: 12px 0; }
.an-dec-confirm-green { color: #1FCB7A; }

.an-quote { font-size: 14px; font-style: italic; color: var(--amber); border-left: 2px solid rgba(255,176,32,0.3); padding: 10px 14px; margin: 0; border-radius: 0 6px 6px 0; background: rgba(255,176,32,0.04); line-height: 1.6; }
.an-disclaimer { font-size: 11px; color: #333; text-align: center; line-height: 1.6; }

@media (max-width: 400px) {
  .an-ind-grid { grid-template-columns: 1fr; }
  .an-row { grid-template-columns: 1fr; }
  .an-sentiment-grid { grid-template-columns: 1fr; }
  .an-blurred-inner { flex-direction: column; gap: 12px; }
  .an-blur-divider { display: none; }
}
`;
