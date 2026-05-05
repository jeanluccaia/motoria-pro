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
  const n = parseFloat(oddStr.replace(",", "."));
  if (!n || n <= 0) return null;
  return (1 / n * 100).toFixed(1);
}

export default function RiskAnalysis() {
  const [jogo, setJogo]     = useState("");
  const [aposta, setAposta] = useState("");
  const [odd, setOdd]       = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [error, setError]   = useState("");
  const [copied, setCopied] = useState(false);

  const msgRef   = useRef(null);
  const resultRef = useRef(null);

  // Cycle loading messages
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
  const canSubmit = jogo.trim().length > 1 && aposta.trim().length > 1 && odd.trim().length > 0 && impliedProb;

  const handleAnalyze = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setOutput("");
    setError("");

    const userMessage = `Jogo: ${jogo.trim()}\nAposta: ${aposta.trim()}\nOdd: ${odd.trim()}`;

    try {
      // Mínimo de 1.5s para percepção de processamento real
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #050816;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -webkit-text-size-adjust: 100%;
        }

        .ra-root {
          min-height: 100vh;
          background: linear-gradient(180deg, #050816 0%, #080c1f 60%, #050816 100%);
          color: #e2e8f0;
          padding: 0 20px 120px;
        }
        .ra-inner {
          max-width: 540px;
          margin: 0 auto;
        }

        /* ── Nav ── */
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
        .ra-logo em { color: #22c55e; font-style: normal; }
        .ra-back {
          background: none; border: none;
          color: #334155; font-size: 13px; font-weight: 500;
          cursor: pointer; padding: 6px 12px; border-radius: 8px;
          transition: color 0.2s, background 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .ra-back:hover { color: #94a3b8; background: rgba(255,255,255,0.04); }

        /* ── Header ── */
        .ra-header { padding: 52px 0 40px; }
        .ra-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.18);
          border-radius: 20px;
          padding: 4px 12px 4px 8px;
          font-size: 11px; font-weight: 600;
          color: #22c55e; letter-spacing: 0.3px;
          margin-bottom: 20px;
        }
        .ra-badge-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
        }
        .ra-title {
          font-family: 'Syne', sans-serif;
          font-size: 30px; font-weight: 800;
          letter-spacing: -0.8px; color: #f8fafc;
          line-height: 1.1; margin-bottom: 12px;
        }
        .ra-sub {
          font-size: 15px; color: #475569;
          line-height: 1.6;
        }

        /* ── Form ── */
        .ra-form { display: flex; flex-direction: column; gap: 16px; }

        .ra-field { display: flex; flex-direction: column; gap: 7px; }
        .ra-label {
          font-size: 11px; font-weight: 600;
          color: #475569; letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .ra-input {
          width: 100%;
          background: rgba(15,23,42,0.8);
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 15px; color: #e2e8f0;
          outline: none;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          backdrop-filter: blur(8px);
        }
        .ra-input:focus {
          border-color: rgba(34,197,94,0.5);
          background: rgba(34,197,94,0.04);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.08), 0 0 20px rgba(34,197,94,0.06);
        }
        .ra-input::placeholder { color: #1e293b; }

        /* Prob hint under odd input */
        .ra-prob-hint {
          font-size: 12px; color: #22c55e;
          opacity: 0.7; margin-top: 2px;
          font-variant-numeric: tabular-nums;
          transition: opacity 0.2s;
        }

        /* ── Button ── */
        .ra-btn-wrap { margin-top: 8px; }
        .ra-btn {
          width: 100%;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #052e16;
          font-size: 16px; font-weight: 700;
          padding: 18px;
          border-radius: 14px; border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.2px;
          transition: transform 0.15s, box-shadow 0.2s, opacity 0.15s;
          box-shadow: 0 4px 24px rgba(34,197,94,0.2);
          position: relative; overflow: hidden;
        }
        .ra-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .ra-btn:disabled {
          opacity: 0.22; cursor: default;
          transform: none; box-shadow: none;
        }
        .ra-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 36px rgba(34,197,94,0.35);
        }
        .ra-btn:not(:disabled):active { transform: translateY(0); }

        /* ── Error ── */
        .ra-error {
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px; padding: 14px 16px;
          font-size: 13px; color: #f87171;
          margin-top: 20px;
        }

        /* ── Loading ── */
        .ra-loading {
          display: flex; flex-direction: column;
          align-items: center; gap: 16px;
          padding: 56px 0;
        }
        .ra-spinner-wrap {
          position: relative; width: 48px; height: 48px;
        }
        .ra-spinner {
          width: 48px; height: 48px;
          border: 2px solid rgba(34,197,94,0.1);
          border-top-color: #22c55e;
          border-radius: 50%;
          animation: ra-spin 0.8s linear infinite;
        }
        .ra-spinner-glow {
          position: absolute; inset: -4px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%);
          animation: ra-pulse 1.6s ease-in-out infinite;
        }
        @keyframes ra-spin { to { transform: rotate(360deg); } }
        @keyframes ra-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        .ra-loading-msg {
          font-size: 14px; color: #475569;
          min-height: 20px; text-align: center;
          transition: opacity 0.3s;
        }

        /* ── Result ── */
        .ra-result { margin-top: 36px; }
        .ra-result-header {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
        }
        .ra-result-tag {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 600;
          color: #22c55e; letter-spacing: 0.3px;
        }
        .ra-result-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34,197,94,0.6);
        }
        .ra-actions { display: flex; gap: 8px; }
        .ra-action {
          font-size: 13px; font-weight: 600;
          padding: 8px 16px; border-radius: 10px;
          border: none; cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: transform 0.12s, background 0.15s, box-shadow 0.15s;
        }
        .ra-action:hover { transform: translateY(-1px); }
        .ra-action--green {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #052e16;
        }
        .ra-action--green:hover { box-shadow: 0 4px 16px rgba(34,197,94,0.3); }
        .ra-action--ghost {
          background: rgba(255,255,255,0.04);
          color: #475569;
          border: 1px solid #1e293b;
        }
        .ra-action--ghost:hover { color: #94a3b8; background: rgba(255,255,255,0.07); }

        /* ── Section cards ── */
        .ra-sections { display: flex; flex-direction: column; gap: 10px; }
        .ra-section {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 14px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .ra-section--alto  { border-color: rgba(239,68,68,0.3);  background: rgba(239,68,68,0.04); }
        .ra-section--medio { border-color: rgba(234,179,8,0.3);  background: rgba(234,179,8,0.03); }
        .ra-section--baixo { border-color: rgba(34,197,94,0.3);  background: rgba(34,197,94,0.03); }

        .ra-section__head {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 16px 0;
        }
        .ra-section__icon { font-size: 14px; line-height: 1; }
        .ra-section__key {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.8px; text-transform: uppercase;
          color: #334155;
        }
        .ra-section__badge {
          margin-left: auto;
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.8px; text-transform: uppercase;
          padding: 2px 9px; border-radius: 5px;
        }
        .ra-badge--alto  { background: rgba(239,68,68,0.15);  color: #f87171; }
        .ra-badge--medio { background: rgba(234,179,8,0.15);  color: #fbbf24; }
        .ra-badge--baixo { background: rgba(34,197,94,0.15);  color: #4ade80; }

        .ra-section__content {
          font-size: 14px; color: #94a3b8;
          line-height: 1.75; padding: 8px 16px 16px;
          white-space: pre-wrap;
        }

        .ra-raw {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 14px; padding: 20px;
          font-size: 14px; color: #94a3b8;
          line-height: 1.75; white-space: pre-wrap;
        }

        /* ── Disclaimer ── */
        .ra-disclaimer-result {
          margin-top: 20px;
          padding: 12px 16px;
          background: rgba(234,179,8,0.05);
          border: 1px solid rgba(234,179,8,0.12);
          border-radius: 10px;
          font-size: 12px; color: #78716c;
          line-height: 1.5; text-align: center;
        }

        @media (max-width: 420px) {
          .ra-title { font-size: 24px; }
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
            <div className="ra-badge">
              <span className="ra-badge-dot" />
              Análise de risco
            </div>
            <div className="ra-title">Análise Inteligente<br />de Risco de Aposta</div>
            <div className="ra-sub">Simule cenários e entenda o risco antes de apostar</div>
          </div>

          {/* Form */}
          <div className="ra-form">
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
                <div className="ra-prob-hint">
                  Probabilidade implícita: {impliedProb}%
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
                <div className="ra-spinner" />
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
                    const meta = SECTION_META[label] || { icon: "•", label };
                    const isRisk = label === "NÍVEL DE RISCO";
                    const level = isRisk ? getRiskLevel(content) : null;
                    const sectionClass = level ? ` ra-section--${level}` : "";

                    return (
                      <div key={label} className={`ra-section${sectionClass}`}>
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

              <div className="ra-disclaimer-result">
                ⚠️ Esta análise não garante resultado. Use como apoio estratégico.
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
