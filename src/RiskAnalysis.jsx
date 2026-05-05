import React, { useState, useEffect, useRef } from "react";

const RISK_SECTIONS = [
  "PROBABILIDADE IMPLÍCITA",
  "NÍVEL DE RISCO",
  "CENÁRIO NECESSÁRIO",
  "PONTOS DE ATENÇÃO",
  "LEITURA FINAL",
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

function RiskLevelBadge({ content }) {
  const low = /baixo/i.test(content);
  const mid = /médio|medio/i.test(content);
  const high = /alto/i.test(content);
  const color = high ? "#ef4444" : mid ? "#eab308" : low ? "#22c55e" : "#9ca3af";
  const label = high ? "ALTO" : mid ? "MÉDIO" : low ? "BAIXO" : null;
  if (!label) return null;
  return (
    <span style={{
      display: "inline-block",
      background: color,
      color: "#000",
      fontWeight: 800,
      fontSize: 11,
      letterSpacing: 1,
      padding: "2px 10px",
      borderRadius: 6,
      marginLeft: 8,
    }}>{label}</span>
  );
}

export default function RiskAnalysis() {
  const [jogo, setJogo] = useState("");
  const [aposta, setAposta] = useState("");
  const [odd, setOdd] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dots, setDots] = useState("");
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (loading) {
      intervalRef.current = setInterval(
        () => setDots((d) => (d.length >= 3 ? "" : d + ".")),
        380
      );
    } else {
      clearInterval(intervalRef.current);
      setDots("");
    }
    return () => clearInterval(intervalRef.current);
  }, [loading]);

  useEffect(() => {
    if (output && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [output]);

  const canSubmit = jogo.trim().length > 1 && aposta.trim().length > 1 && odd.trim().length > 0;

  const handleAnalyze = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setOutput("");
    setError("");

    const userMessage = `Jogo: ${jogo.trim()}\nAposta: ${aposta.trim()}\nOdd: ${odd.trim()}`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "risk", userMessage }),
      });
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
          background: #10101d;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -webkit-text-size-adjust: 100%;
        }
        .ra-root {
          min-height: 100vh;
          background: #10101d;
          color: #e8e6f4;
          padding: 0 16px 80px;
        }
        .ra-inner { max-width: 560px; margin: 0 auto; }

        .ra-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 0 0;
        }
        .ra-logo {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 800;
          letter-spacing: -0.5px; color: #f4f2ff;
        }
        .ra-logo em { color: #22c55e; font-style: normal; }
        .ra-back {
          background: none; border: none;
          color: #6b7280; font-size: 13px; font-weight: 500;
          cursor: pointer; padding: 6px 10px; border-radius: 8px;
          transition: color 0.15s, background 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .ra-back:hover { color: #e8e6f4; background: rgba(255,255,255,0.05); }

        .ra-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 28px 24px;
          margin-top: 32px;
        }
        .ra-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 800;
          letter-spacing: -0.3px; color: #f4f2ff;
          margin-bottom: 4px;
        }
        .ra-card-sub {
          font-size: 13px; color: #6b7280; margin-bottom: 24px;
          line-height: 1.5;
        }

        .ra-field { margin-bottom: 16px; }
        .ra-label {
          display: block; font-size: 12px; font-weight: 600;
          color: #9ca3af; letter-spacing: 0.3px;
          margin-bottom: 6px; text-transform: uppercase;
        }
        .ra-input {
          width: 100%;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 15px; color: #e8e6f4;
          outline: none;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.15s, background 0.15s;
        }
        .ra-input:focus {
          border-color: rgba(34,197,94,0.4);
          background: rgba(34,197,94,0.04);
        }
        .ra-input::placeholder { color: #374151; }

        .ra-btn {
          width: 100%; margin-top: 8px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #051a08; font-size: 15px; font-weight: 700;
          padding: 15px; border-radius: 12px; border: none;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: opacity 0.15s, transform 0.12s;
          box-shadow: 0 4px 16px rgba(34,197,94,0.25);
        }
        .ra-btn:disabled { opacity: 0.35; cursor: default; transform: none; }
        .ra-btn:not(:disabled):hover { transform: translateY(-1px); }

        .ra-disclaimer {
          font-size: 11px; color: #374151;
          text-align: center; margin-top: 12px; line-height: 1.6;
        }

        .ra-error {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px; padding: 12px 14px;
          font-size: 13px; color: #f87171;
          margin-top: 16px;
        }

        .ra-loading {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 14px; padding: 48px 0;
        }
        .ra-spinner {
          width: 34px; height: 34px;
          border: 3px solid rgba(34,197,94,0.15);
          border-top-color: #22c55e;
          border-radius: 50%;
          animation: ra-spin 0.7s linear infinite;
        }
        @keyframes ra-spin { to { transform: rotate(360deg); } }
        .ra-loading-text { font-size: 14px; color: #6b7280; }

        .ra-result { margin-top: 24px; }
        .ra-result-header {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 16px; flex-wrap: wrap; gap: 8px;
        }
        .ra-result-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 600; color: #22c55e;
        }
        .ra-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e; flex-shrink: 0;
        }
        .ra-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .ra-action {
          font-size: 13px; font-weight: 600;
          padding: 8px 14px; border-radius: 9px;
          border: none; cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: background 0.15s, transform 0.12s;
        }
        .ra-action:hover { transform: translateY(-1px); }
        .ra-action--primary {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #051a08;
        }
        .ra-action--ghost {
          background: transparent; color: #6b7280;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .ra-action--ghost:hover { color: #d1d5db; background: rgba(255,255,255,0.05); }

        .ra-sections { display: flex; flex-direction: column; gap: 10px; }
        .ra-section {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; overflow: hidden;
        }
        .ra-section--alto { border-color: rgba(239,68,68,0.3); }
        .ra-section--medio { border-color: rgba(234,179,8,0.3); }
        .ra-section--baixo { border-color: rgba(34,197,94,0.3); }
        .ra-section__label {
          display: flex; align-items: center;
          font-size: 10px; font-weight: 700;
          letter-spacing: 1px; text-transform: uppercase;
          color: #22c55e; opacity: 0.8;
          padding: 10px 14px 0;
        }
        .ra-section__content {
          font-size: 14px; color: #d1d5db;
          line-height: 1.7; padding: 6px 14px 14px;
          white-space: pre-wrap;
        }
        .ra-raw {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 16px;
          font-size: 14px; color: #d1d5db;
          line-height: 1.7; white-space: pre-wrap;
        }

        @media (max-width: 420px) {
          .ra-card { padding: 20px 16px; }
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

          {/* Form */}
          <div className="ra-card">
            <div className="ra-card-title">🧠 Análise de risco de aposta</div>
            <div className="ra-card-sub">
              Análise racional baseada na odd. Sem recomendação — só dados.
            </div>

            <div className="ra-field">
              <label className="ra-label">Qual jogo?</label>
              <input
                className="ra-input"
                type="text"
                placeholder="Ex: Flamengo x Palmeiras, NBA Finals, Fórmula 1..."
                value={jogo}
                onChange={(e) => setJogo(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="ra-field">
              <label className="ra-label">Qual aposta você considera?</label>
              <input
                className="ra-input"
                type="text"
                placeholder="Ex: Vitória do Flamengo, Over 2.5 gols, ambos marcam..."
                value={aposta}
                onChange={(e) => setAposta(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="ra-field">
              <label className="ra-label">Qual é a odd?</label>
              <input
                className="ra-input"
                type="text"
                inputMode="decimal"
                placeholder="Ex: 1.85"
                value={odd}
                onChange={(e) => setOdd(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <button
              className="ra-btn"
              disabled={!canSubmit || loading}
              onClick={handleAnalyze}
            >
              {loading ? `Analisando${dots}` : "Analisar risco →"}
            </button>

            <p className="ra-disclaimer">
              Esta análise é informativa e não constitui conselho financeiro.
            </p>
          </div>

          {/* Error */}
          {error && <div className="ra-error">{error}</div>}

          {/* Loading */}
          {loading && (
            <div className="ra-loading">
              <div className="ra-spinner" />
              <span className="ra-loading-text">Calculando probabilidades{dots}</span>
            </div>
          )}

          {/* Result */}
          {output && !loading && (
            <div className="ra-result" ref={resultRef}>
              <div className="ra-result-header">
                <div className="ra-result-title">
                  <span className="ra-dot" />
                  Análise concluída
                </div>
                <div className="ra-actions">
                  <button className="ra-action ra-action--primary" onClick={handleCopy}>
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
                    const isRiscoLabel = label === "NÍVEL DE RISCO";
                    const riskClass = isRiscoLabel
                      ? /alto/i.test(content)
                        ? " ra-section--alto"
                        : /médio|medio/i.test(content)
                        ? " ra-section--medio"
                        : /baixo/i.test(content)
                        ? " ra-section--baixo"
                        : ""
                      : "";
                    return (
                      <div key={label} className={`ra-section${riskClass}`}>
                        <div className="ra-section__label">
                          {label}
                          {isRiscoLabel && <RiskLevelBadge content={content} />}
                        </div>
                        <div className="ra-section__content">{content}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="ra-raw">{output}</div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
