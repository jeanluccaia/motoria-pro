import React, { useState, useEffect, useRef } from "react";

const RISK_SECTIONS = [
  "PROBABILIDADE IMPLÍCITA",
  "NÍVEL DE RISCO",
  "CENÁRIO NECESSÁRIO",
  "PONTOS DE ATENÇÃO",
  "LEITURA FINAL",
];

const SECTION_META = {
  "PROBABILIDADE IMPLÍCITA": { icon: "📊", label: "Probabilidade Implícita" },
  "NÍVEL DE RISCO":          { icon: "⚡", label: "Nível de Risco" },
  "CENÁRIO NECESSÁRIO":      { icon: "🎯", label: "Cenário Necessário" },
  "PONTOS DE ATENÇÃO":       { icon: "⚠️", label: "Pontos de Atenção" },
  "LEITURA FINAL":           { icon: "🧠", label: "Leitura Final" },
};

const LOADING_MESSAGES = [
  "Analisando cenário...",
  "Calculando probabilidade...",
  "Processando dados...",
  "Avaliando fatores de risco...",
];

function parseRiskOutput(text) {
  const sections = [];
  RISK_SECTIONS.forEach((label) => {
    const re = new RegExp(
      `${label}:\\s*\\n([\\s\\S]*?)(?=\\n(?:${RISK_SECTIONS.join("|")}):|$)`,
      "i"
    );
    const m = text.match(re);
    if (m) sections.push({ label, content: m[1].trim() });
  });
  return sections.length >= 3 ? sections : null;
}

function getRiskLevel(content) {
  if (/alto/i.test(content)) return "alto";
  if (/médio|medio/i.test(content)) return "medio";
  if (/baixo/i.test(content)) return "baixo";
  return null;
}

function calcProb(oddStr) {
  const n = parseFloat(String(oddStr).replace(",", "."));
  if (!n || n <= 0) return null;
  return (1 / n * 100).toFixed(1);
}

export default function RiskAnalysis() {
  const [jogo, setJogo]       = useState("");
  const [aposta, setAposta]   = useState("");
  const [odd, setOdd]         = useState("");
  const [output, setOutput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(false);

  const msgRef    = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (loading) {
      msgRef.current = setInterval(() => {
        setLoadingMsg((i) => (i + 1) % LOADING_MESSAGES.length);
      }, 1400);
    } else {
      clearInterval(msgRef.current);
      setLoadingMsg(0);
    }
    return () => clearInterval(msgRef.current);
  }, [loading]);

  useEffect(() => {
    if (output && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [output]);

  const impliedProb = calcProb(odd);
  const canSubmit   = jogo.trim().length > 1 && aposta.trim().length > 1 && !!impliedProb;

  const handleAnalyze = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setOutput("");
    setError("");

    const userMessage = `Jogo: ${jogo.trim()}\nAposta: ${aposta.trim()}\nOdd: ${odd.trim()}`;

    try {
      const [res] = await Promise.all([
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool: "risk", userMessage }),
        }),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        const text =
          data.content?.find((c) => c.type === "text")?.text ||
          "Não foi possível analisar. Tente novamente.";
        setOutput(text);
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") handleAnalyze();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setOutput("");
    setError("");
    setJogo("");
    setAposta("");
    setOdd("");
  };

  const sections = output ? parseRiskOutput(output) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #030712;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -webkit-text-size-adjust: 100%;
        }

        /* ─── Root ─── */
        .ra-root {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 40% at 50% -10%, rgba(0,220,100,0.09) 0%, transparent 70%),
            radial-gradient(ellipse 60% 30% at 80% 80%, rgba(99,102,241,0.05) 0%, transparent 60%),
            #030712;
          color: #e2e8f0;
          padding: 0 20px 120px;
        }
        .ra-inner {
          max-width: 520px;
          margin: 0 auto;
        }

        /* ─── Nav ─── */
        .ra-nav {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 28px 0 0;
        }
        .ra-logo {
          font-family: 'Syne', sans-serif;
          font-size: 19px; font-weight: 800;
          letter-spacing: -0.5px; color: #f8fafc;
        }
        .ra-logo em { color: #00dc64; font-style: normal; }
        .ra-back {
          background: none; border: none;
          color: #1e293b; font-size: 13px; font-weight: 500;
          cursor: pointer; padding: 6px 12px; border-radius: 8px;
          transition: color 0.2s, background 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .ra-back:hover { color: #64748b; background: rgba(255,255,255,0.04); }

        /* ─── Header ─── */
        .ra-header { padding: 52px 0 44px; }

        .ra-live-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(0,220,100,0.08);
          border: 1px solid rgba(0,220,100,0.2);
          border-radius: 99px;
          padding: 5px 14px 5px 10px;
          font-size: 11px; font-weight: 700;
          color: #00dc64; letter-spacing: 0.4px;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .ra-live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #00dc64;
          box-shadow: 0 0 0 0 rgba(0,220,100,0.6);
          animation: ra-ping 1.4s ease-in-out infinite;
        }
        @keyframes ra-ping {
          0%   { box-shadow: 0 0 0 0 rgba(0,220,100,0.6); }
          70%  { box-shadow: 0 0 0 7px rgba(0,220,100,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,220,100,0); }
        }

        .ra-title {
          font-family: 'Syne', sans-serif;
          font-size: 34px; font-weight: 800;
          letter-spacing: -1px; line-height: 1.08;
          margin-bottom: 14px;
          background: linear-gradient(135deg, #ffffff 0%, #00dc64 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ra-sub {
          font-size: 15px; color: #334155;
          line-height: 1.6;
        }

        /* ─── Divider ─── */
        .ra-divider {
          width: 40px; height: 2px;
          background: linear-gradient(90deg, #00dc64, transparent);
          border-radius: 2px;
          margin-bottom: 32px;
        }

        /* ─── Fields ─── */
        .ra-fields { display: flex; flex-direction: column; gap: 18px; }
        .ra-field  { display: flex; flex-direction: column; gap: 7px; }
        .ra-label {
          font-size: 11px; font-weight: 700;
          color: #334155; letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .ra-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 15px 16px;
          font-size: 15px; color: #f1f5f9;
          outline: none;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .ra-input:focus {
          border-color: rgba(0,220,100,0.5);
          background: rgba(0,220,100,0.03);
          box-shadow:
            0 0 0 3px rgba(0,220,100,0.08),
            0 0 24px rgba(0,220,100,0.07);
        }
        .ra-input::placeholder { color: #1e293b; }

        /* Probability chip */
        .ra-prob-chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(0,220,100,0.08);
          border: 1px solid rgba(0,220,100,0.18);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 13px; font-weight: 700;
          color: #00dc64;
          transition: all 0.2s;
          width: fit-content;
        }
        .ra-prob-chip-icon { font-size: 12px; opacity: 0.8; }
        .ra-prob-val {
          font-size: 18px; font-weight: 800;
          color: #00dc64;
          font-variant-numeric: tabular-nums;
        }
        .ra-prob-label { font-size: 11px; color: #16a34a; font-weight: 500; }

        /* ─── Button ─── */
        .ra-btn-wrap { margin-top: 10px; }
        .ra-btn {
          width: 100%;
          background: linear-gradient(135deg, #00dc64 0%, #00b34f 100%);
          color: #022c16;
          font-size: 16px; font-weight: 800;
          padding: 19px;
          border-radius: 14px; border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.2px;
          transition: transform 0.15s, box-shadow 0.2s, opacity 0.15s;
          box-shadow:
            0 4px 20px rgba(0,220,100,0.25),
            0 1px 0 rgba(255,255,255,0.1) inset;
          position: relative; overflow: hidden;
        }
        .ra-btn::before {
          content: '';
          position: absolute; top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transition: left 0.5s ease;
        }
        .ra-btn:not(:disabled):hover::before { left: 140%; }
        .ra-btn:disabled { opacity: 0.2; cursor: default; box-shadow: none; }
        .ra-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow:
            0 10px 40px rgba(0,220,100,0.4),
            0 1px 0 rgba(255,255,255,0.1) inset;
        }
        .ra-btn:not(:disabled):active { transform: translateY(0); }

        /* ─── Error ─── */
        .ra-error {
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px; padding: 14px 16px;
          font-size: 13px; color: #f87171;
          margin-top: 20px;
        }

        /* ─── Loading ─── */
        .ra-loading {
          display: flex; flex-direction: column;
          align-items: center; gap: 20px;
          padding: 60px 0;
        }
        .ra-spinner-wrap { position: relative; width: 52px; height: 52px; }
        .ra-spinner-ring {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #00dc64;
          animation: ra-spin 0.9s linear infinite;
        }
        .ra-spinner-ring2 {
          position: absolute; inset: 6px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: rgba(0,220,100,0.3);
          animation: ra-spin 1.4s linear infinite reverse;
        }
        .ra-spinner-glow {
          position: absolute; inset: -8px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,220,100,0.15) 0%, transparent 70%);
          animation: ra-pulse 1.6s ease-in-out infinite;
        }
        @keyframes ra-spin  { to { transform: rotate(360deg); } }
        @keyframes ra-pulse { 0%,100% { opacity: 0.4; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } }
        .ra-loading-msg {
          font-size: 14px; color: #334155;
          font-weight: 500; text-align: center;
        }

        /* ─── Result ─── */
        .ra-result { margin-top: 40px; }
        .ra-result-header {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
        }
        .ra-result-tag {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 700;
          color: #00dc64; letter-spacing: 0.4px;
          text-transform: uppercase;
        }
        .ra-result-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #00dc64;
          box-shadow: 0 0 10px rgba(0,220,100,0.8);
        }
        .ra-actions { display: flex; gap: 8px; }
        .ra-action {
          font-size: 13px; font-weight: 700;
          padding: 9px 16px; border-radius: 10px;
          border: none; cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: transform 0.12s, box-shadow 0.15s;
        }
        .ra-action:hover { transform: translateY(-1px); }
        .ra-action--green {
          background: linear-gradient(135deg, #00dc64, #00b34f);
          color: #022c16;
          box-shadow: 0 2px 10px rgba(0,220,100,0.2);
        }
        .ra-action--green:hover { box-shadow: 0 4px 20px rgba(0,220,100,0.35); }
        .ra-action--ghost {
          background: rgba(255,255,255,0.04);
          color: #334155;
          border: 1px solid #1e293b;
        }
        .ra-action--ghost:hover { color: #64748b; }

        /* ─── Section cards ─── */
        .ra-sections { display: flex; flex-direction: column; gap: 10px; }

        .ra-section {
          background: rgba(15,23,42,0.9);
          border: 1px solid #1e293b;
          border-radius: 14px;
          overflow: hidden;
        }
        .ra-section--alto {
          border-color: rgba(239,68,68,0.35);
          background: rgba(239,68,68,0.04);
          box-shadow: 0 0 20px rgba(239,68,68,0.06) inset;
        }
        .ra-section--medio {
          border-color: rgba(251,191,36,0.35);
          background: rgba(251,191,36,0.04);
          box-shadow: 0 0 20px rgba(251,191,36,0.05) inset;
        }
        .ra-section--baixo {
          border-color: rgba(0,220,100,0.35);
          background: rgba(0,220,100,0.04);
          box-shadow: 0 0 20px rgba(0,220,100,0.07) inset;
        }

        .ra-section__head {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 16px 0;
        }
        .ra-section__icon { font-size: 14px; line-height: 1; }
        .ra-section__key {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.8px; text-transform: uppercase;
          color: #334155; flex: 1;
        }
        .ra-section__badge {
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.8px; text-transform: uppercase;
          padding: 3px 10px; border-radius: 6px;
        }
        .ra-badge--alto  {
          background: rgba(239,68,68,0.15);
          color: #f87171;
          border: 1px solid rgba(239,68,68,0.25);
        }
        .ra-badge--medio {
          background: rgba(251,191,36,0.12);
          color: #fbbf24;
          border: 1px solid rgba(251,191,36,0.25);
        }
        .ra-badge--baixo {
          background: rgba(0,220,100,0.12);
          color: #00dc64;
          border: 1px solid rgba(0,220,100,0.25);
        }

        .ra-section__content {
          font-size: 14px; color: #64748b;
          line-height: 1.8; padding: 8px 16px 16px;
          white-space: pre-wrap;
        }
        .ra-raw {
          background: rgba(15,23,42,0.9);
          border: 1px solid #1e293b;
          border-radius: 14px; padding: 20px;
          font-size: 14px; color: #64748b;
          line-height: 1.8; white-space: pre-wrap;
        }

        /* ─── Disclaimer ─── */
        .ra-disclaimer {
          margin-top: 20px;
          padding: 12px 16px;
          background: rgba(251,191,36,0.04);
          border: 1px solid rgba(251,191,36,0.1);
          border-radius: 10px;
          font-size: 11px; color: #44403c;
          text-align: center; line-height: 1.6;
        }

        @media (max-width: 420px) {
          .ra-title { font-size: 26px; }
          .ra-actions { flex-direction: column; }
          .ra-action { text-align: center; }
        }
      `}</style>

      <div className="ra-root">
        <div className="ra-inner">

          {/* Nav */}
          <nav className="ra-nav">
            <div className="ra-logo">Motor<em>IA</em></div>
            <button className="ra-back" onClick={() => { window.location.hash = ""; }}>
              ← Voltar
            </button>
          </nav>

          {/* Header */}
          <div className="ra-header">
            <div className="ra-live-badge">
              <span className="ra-live-dot" />
              Análise em tempo real
            </div>
            <div className="ra-title">
              Análise Inteligente<br />de Risco de Aposta
            </div>
            <div className="ra-sub">
              Simule cenários e entenda o risco antes de apostar
            </div>
          </div>

          <div className="ra-divider" />

          {/* Fields */}
          <div className="ra-fields">
            <div className="ra-field">
              <label className="ra-label">Jogo ou evento</label>
              <input
                className="ra-input"
                type="text"
                placeholder="Flamengo x Palmeiras"
                value={jogo}
                onChange={(e) => setJogo(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="ra-field">
              <label className="ra-label">Aposta</label>
              <input
                className="ra-input"
                type="text"
                placeholder="Vitória do Flamengo"
                value={aposta}
                onChange={(e) => setAposta(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="ra-field">
              <label className="ra-label">Odd</label>
              <input
                className="ra-input"
                type="text"
                inputMode="decimal"
                placeholder="1.85"
                value={odd}
                onChange={(e) => setOdd(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {impliedProb && (
                <div className="ra-prob-chip">
                  <span className="ra-prob-chip-icon">📊</span>
                  <span className="ra-prob-val">{impliedProb}%</span>
                  <span className="ra-prob-label">probabilidade implícita</span>
                </div>
              )}
            </div>

            <div className="ra-btn-wrap">
              <button
                className="ra-btn"
                disabled={!canSubmit || loading}
                onClick={handleAnalyze}
              >
                {loading ? LOADING_MESSAGES[loadingMsg] : "Analisar risco agora"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <div className="ra-error">{error}</div>}

          {/* Loading */}
          {loading && (
            <div className="ra-loading">
              <div className="ra-spinner-wrap">
                <div className="ra-spinner-glow" />
                <div className="ra-spinner-ring" />
                <div className="ra-spinner-ring2" />
              </div>
              <div className="ra-loading-msg">{LOADING_MESSAGES[loadingMsg]}</div>
            </div>
          )}

          {/* Result */}
          {output && !loading && (
            <div className="ra-result" ref={resultRef}>
              <div className="ra-result-header">
                <div className="ra-result-tag">
                  <span className="ra-result-dot" />
                  Análise concluída
                </div>
                <div className="ra-actions">
                  <button className="ra-action ra-action--green" onClick={handleCopy}>
                    {copied ? "✓ Copiado!" : "Copiar análise"}
                  </button>
                  <button className="ra-action ra-action--ghost" onClick={handleReset}>
                    Analisar outra
                  </button>
                </div>
              </div>

              {sections ? (
                <div className="ra-sections">
                  {sections.map(({ label, content }) => {
                    const meta  = SECTION_META[label] || { icon: "•", label };
                    const isRisk = label === "NÍVEL DE RISCO";
                    const level  = isRisk ? getRiskLevel(content) : null;

                    return (
                      <div key={label} className={`ra-section${level ? ` ra-section--${level}` : ""}`}>
                        <div className="ra-section__head">
                          <span className="ra-section__icon">{meta.icon}</span>
                          <span className="ra-section__key">{meta.label}</span>
                          {isRisk && level && (
                            <span className={`ra-section__badge ra-badge--${level}`}>
                              {level === "alto" ? "ALTO" : level === "medio" ? "MÉDIO" : "BAIXO"}
                            </span>
                          )}
                        </div>
                        <div className="ra-section__content">{content}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="ra-raw">{output}</div>
              )}

              <div className="ra-disclaimer">
                ⚠️ Esta análise não garante resultado. Use como apoio estratégico.
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
