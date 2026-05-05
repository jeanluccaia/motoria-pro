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

const EXAMPLE = [
  { label: "PROBABILIDADE IMPLÍCITA", content: "54% — a odd de 1.85 indica que o mercado estima pouco mais de 50% de chance." },
  { label: "NÍVEL DE RISCO", content: "Médio — odd intermediária, resultado incerto.", isRisk: true, riskValue: "medio" },
  { label: "CENÁRIO NECESSÁRIO", content: "O time mandante precisa vencer dentro do tempo regulamentar, sem prorrogação." },
  { label: "PONTOS DE ATENÇÃO", content: "* Histórico recente do time em casa\n* Desfalques por lesão ou suspensão\n* Motivação (posição na tabela, mata-mata)" },
  { label: "LEITURA FINAL", content: "A odd reflete equilíbrio entre os times. O risco é proporcional — não há vantagem clara do mercado para nenhum dos lados." },
];

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
          padding: 0 16px 100px;
        }
        .ra-inner { max-width: 540px; margin: 0 auto; }

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

        /* Hero */
        .ra-hero {
          padding: 40px 0 0;
          text-align: center;
        }
        .ra-hero-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 11px; font-weight: 600;
          color: #22c55e; letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .ra-hero-tag-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #22c55e;
        }
        .ra-hero-title {
          font-family: 'Syne', sans-serif;
          font-size: 26px; font-weight: 800;
          letter-spacing: -0.5px; color: #f4f2ff;
          line-height: 1.2;
          margin-bottom: 10px;
        }
        .ra-hero-sub {
          font-size: 14px; color: #6b7280;
          line-height: 1.6; max-width: 380px; margin: 0 auto;
        }

        /* Example preview */
        .ra-example {
          margin-top: 32px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
          position: relative;
        }
        .ra-example::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 60px;
          background: linear-gradient(to bottom, transparent, #0d0d1a);
          pointer-events: none;
        }
        .ra-example-label {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px 8px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 1px; text-transform: uppercase;
          color: #374151;
        }
        .ra-example-label span {
          background: rgba(255,255,255,0.04);
          border-radius: 4px; padding: 2px 6px;
          color: #4b5563; font-size: 9px;
        }
        .ra-example-rows { padding: 0 16px 32px; display: flex; flex-direction: column; gap: 8px; }
        .ra-example-row {
          display: flex; gap: 10px; align-items: flex-start;
        }
        .ra-example-key {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.8px; text-transform: uppercase;
          color: #22c55e; opacity: 0.4;
          min-width: 110px; padding-top: 2px;
          flex-shrink: 0;
        }
        .ra-example-val {
          font-size: 12px; color: #374151;
          line-height: 1.5; white-space: pre-wrap;
        }
        .ra-example-badge {
          display: inline-block;
          background: rgba(234,179,8,0.15);
          color: #ca8a04;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.8px; text-transform: uppercase;
          padding: 1px 7px; border-radius: 4px; margin-left: 6px;
        }

        /* Form card */
        .ra-card {
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 28px 24px 24px;
          margin-top: 24px;
        }

        .ra-field { margin-bottom: 14px; }
        .ra-label {
          display: block; font-size: 11px; font-weight: 600;
          color: #6b7280; letter-spacing: 0.3px;
          margin-bottom: 6px; text-transform: uppercase;
        }
        .ra-input {
          width: 100%;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 13px 14px;
          font-size: 15px; color: #e8e6f4;
          outline: none;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.15s, background 0.15s;
        }
        .ra-input:focus {
          border-color: rgba(34,197,94,0.35);
          background: rgba(34,197,94,0.03);
        }
        .ra-input::placeholder { color: #2d3748; }

        .ra-btn {
          width: 100%; margin-top: 6px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #051a08; font-size: 16px; font-weight: 700;
          padding: 17px; border-radius: 12px; border: none;
          cursor: pointer; font-family: 'Inter', sans-serif;
          letter-spacing: -0.2px;
          transition: opacity 0.15s, transform 0.12s, box-shadow 0.15s;
          box-shadow: 0 4px 20px rgba(34,197,94,0.2);
        }
        .ra-btn:disabled { opacity: 0.3; cursor: default; transform: none; box-shadow: none; }
        .ra-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(34,197,94,0.3);
        }

        .ra-disclaimer {
          font-size: 11px; color: #374151;
          text-align: center; margin-top: 10px; line-height: 1.6;
        }

        /* Error */
        .ra-error {
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.18);
          border-radius: 10px; padding: 12px 14px;
          font-size: 13px; color: #f87171;
          margin-top: 16px;
        }

        /* Loading */
        .ra-loading {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 12px; padding: 48px 0;
        }
        .ra-spinner {
          width: 32px; height: 32px;
          border: 2.5px solid rgba(34,197,94,0.12);
          border-top-color: #22c55e;
          border-radius: 50%;
          animation: ra-spin 0.7s linear infinite;
        }
        @keyframes ra-spin { to { transform: rotate(360deg); } }
        .ra-loading-text { font-size: 13px; color: #4b5563; }

        /* Result */
        .ra-result { margin-top: 28px; }
        .ra-result-header {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 14px; flex-wrap: wrap; gap: 8px;
        }
        .ra-result-title {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; font-weight: 600; color: #22c55e;
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
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #051a08;
        }
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
          padding: 10px 14px 0;
        }
        .ra-section__content {
          font-size: 14px; color: #c9c7d8;
          line-height: 1.75; padding: 5px 14px 14px;
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
          .ra-hero-title { font-size: 22px; }
          .ra-card { padding: 20px 16px; }
          .ra-actions { flex-direction: column; }
          .ra-action { text-align: center; }
          .ra-example-key { min-width: 90px; font-size: 8px; }
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

          {/* Hero */}
          <div className="ra-hero">
            <div className="ra-hero-tag">
              <span className="ra-hero-tag-dot" />
              Análise de risco
            </div>
            <div className="ra-hero-title">Entenda o risco antes de decidir</div>
            <div className="ra-hero-sub">
              Veja probabilidade, cenário e pontos de atenção em segundos
            </div>
          </div>

          {/* Example preview */}
          <div className="ra-example">
            <div className="ra-example-label">
              Exemplo de análise <span>prévia</span>
            </div>
            <div className="ra-example-rows">
              {EXAMPLE.map(({ label, content, isRisk, riskValue }) => (
                <div className="ra-example-row" key={label}>
                  <div className="ra-example-key">{label}</div>
                  <div className="ra-example-val">
                    {content}
                    {isRisk && <span className="ra-example-badge">MÉDIO</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="ra-card">
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

            <p className="ra-disclaimer">
              Análise baseada em probabilidade. Sem previsão, sem recomendação.
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
