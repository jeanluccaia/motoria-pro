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
      fontSize: 10,
      letterSpacing: 1,
      padding: "2px 8px",
      borderRadius: 5,
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
          background: #0d0d1a;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -webkit-text-size-adjust: 100%;
        }

        .ra-root {
          min-height: 100vh;
          background: #0d0d1a;
          color: #e8e6f4;
          padding: 0 20px 100px;
        }
        .ra-inner { max-width: 520px; margin: 0 auto; }

        /* Nav */
        .ra-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 0 0;
        }
        .ra-logo {
          font-family: 'Syne', sans-serif;
          font-size: 19px; font-weight: 800;
          letter-spacing: -0.5px; color: #f4f2ff;
        }
        .ra-logo em { color: #22c55e; font-style: normal; }
        .ra-back {
          background: none; border: none;
          color: #4b5563; font-size: 13px; font-weight: 500;
          cursor: pointer; padding: 6px 10px; border-radius: 8px;
          transition: color 0.15s, background 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .ra-back:hover { color: #e8e6f4; background: rgba(255,255,255,0.05); }

        /* Header */
        .ra-header {
          padding: 48px 0 36px;
        }
        .ra-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px; font-weight: 800;
          letter-spacing: -0.6px; color: #f4f2ff;
          line-height: 1.15;
          margin-bottom: 10px;
        }
        .ra-sub {
          font-size: 15px; color: #4b5563;
          line-height: 1.5;
        }

        /* Fields */
        .ra-field { margin-bottom: 18px; }
        .ra-label {
          display: block; font-size: 11px; font-weight: 600;
          color: #6b7280; letter-spacing: 0.4px;
          margin-bottom: 7px; text-transform: uppercase;
        }
        .ra-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 15px; color: #e8e6f4;
          outline: none;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.15s, background 0.15s;
        }
        .ra-input:focus {
          border-color: rgba(34,197,94,0.4);
          background: rgba(34,197,94,0.04);
        }
        .ra-input::placeholder { color: #2d3748; }

        /* Button */
        .ra-btn {
          width: 100%; margin-top: 8px;
          background: #22c55e;
          color: #051a08; font-size: 16px; font-weight: 700;
          padding: 18px; border-radius: 14px; border: none;
          cursor: pointer; font-family: 'Inter', sans-serif;
          letter-spacing: -0.2px;
          transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
          box-shadow: 0 0 0 0 rgba(34,197,94,0);
        }
        .ra-btn:disabled { opacity: 0.25; cursor: default; transform: none; }
        .ra-btn:not(:disabled):hover {
          background: #16a34a;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(34,197,94,0.28);
        }

        /* Error */
        .ra-error {
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.18);
          border-radius: 10px; padding: 12px 16px;
          font-size: 13px; color: #f87171;
          margin-top: 16px;
        }

        /* Loading */
        .ra-loading {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 12px; padding: 52px 0;
        }
        .ra-spinner {
          width: 30px; height: 30px;
          border: 2px solid rgba(34,197,94,0.12);
          border-top-color: #22c55e;
          border-radius: 50%;
          animation: ra-spin 0.7s linear infinite;
        }
        @keyframes ra-spin { to { transform: rotate(360deg); } }
        .ra-loading-text { font-size: 13px; color: #4b5563; }

        /* Result */
        .ra-result { margin-top: 32px; }
        .ra-result-header {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 16px; flex-wrap: wrap; gap: 8px;
        }
        .ra-result-title {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; font-weight: 600; color: #22c55e;
          letter-spacing: 0.3px;
        }
        .ra-dot {
          width: 6px; height: 6px; border-radius: 50%;
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
          background: #22c55e;
          color: #051a08;
        }
        .ra-action--primary:hover { background: #16a34a; }
        .ra-action--ghost {
          background: transparent; color: #6b7280;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .ra-action--ghost:hover { color: #d1d5db; background: rgba(255,255,255,0.05); }

        .ra-sections { display: flex; flex-direction: column; gap: 8px; }
        .ra-section {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; overflow: hidden;
        }
        .ra-section--alto { border-color: rgba(239,68,68,0.25); background: rgba(239,68,68,0.03); }
        .ra-section--medio { border-color: rgba(234,179,8,0.25); background: rgba(234,179,8,0.02); }
        .ra-section--baixo { border-color: rgba(34,197,94,0.25); background: rgba(34,197,94,0.02); }
        .ra-section__label {
          display: flex; align-items: center;
          font-size: 9px; font-weight: 700;
          letter-spacing: 1px; text-transform: uppercase;
          color: #22c55e; opacity: 0.7;
          padding: 12px 16px 0;
        }
        .ra-section__content {
          font-size: 14px; color: #c9c7d8;
          line-height: 1.75; padding: 6px 16px 14px;
          white-space: pre-wrap;
        }
        .ra-raw {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 16px;
          font-size: 14px; color: #c9c7d8;
          line-height: 1.75; white-space: pre-wrap;
        }

        @media (max-width: 420px) {
          .ra-title { font-size: 24px; }
          .ra-actions { flex-direction: column; }
          .ra-action { text-align: center; }
        }
      `}</style>

      <div className="ra-root">
        <div className="ra-inner">

          <nav className="ra-nav">
            <div className="ra-logo">Motor<em>IA</em></div>
            <button className="ra-back" onClick={() => { window.location.hash = ""; }}>
              ← Voltar
            </button>
          </nav>

          <div className="ra-header">
            <div className="ra-title">Análise de risco de aposta</div>
            <div className="ra-sub">Digite os dados e receba a análise em segundos</div>
          </div>

          <div className="ra-field">
            <label className="ra-label">Jogo ou evento</label>
            <input
              className="ra-input"
              type="text"
              placeholder="Digite o jogo ou evento"
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
              placeholder="Qual cenário você está considerando?"
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
              placeholder="Odd (ex: 1.85)"
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
            {loading ? `Analisando${dots}` : "Analisar risco agora"}
          </button>

          {error && <div className="ra-error">{error}</div>}

          {loading && (
            <div className="ra-loading">
              <div className="ra-spinner" />
              <span className="ra-loading-text">Calculando probabilidades{dots}</span>
            </div>
          )}

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
                      ? /alto/i.test(content) ? " ra-section--alto"
                        : /médio|medio/i.test(content) ? " ra-section--medio"
                        : /baixo/i.test(content) ? " ra-section--baixo"
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
