import { Link } from "./router";

export function LegalBar() {
  return (
    <div className="ly-legal">
      <span>⚠</span>
      <span>
        Ferramenta educativa de risco. Não é recomendação de aposta. Apostas
        envolvem risco financeiro real e podem causar prejuízo.{" "}
        <strong>Proibido para menores de 18 anos.</strong>{" "}
        <a
          href="https://www.jogoresponsavel.com.br"
          target="_blank"
          rel="noopener noreferrer"
        >
          jogoresponsavel.com.br
        </a>
      </span>
    </div>
  );
}

export function Header() {
  return (
    <header className="ly-header">
      <Link to="/" className="ly-logo">
        <span className="ly-logo-main">MotorIA Pro</span>
        <span className="ly-logo-tag">· Análise de Risco</span>
      </Link>
      <Link to="/analisar" className="ly-cta-btn">
        Analisar minha aposta
      </Link>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="ly-footer">
      <div className="ly-footer-inner">
        <p className="ly-footer-legal">
          ⚠ Ferramenta educativa. Não é recomendação de aposta. Apostas
          envolvem risco financeiro real e podem causar prejuízo. Jogue com
          responsabilidade.
        </p>
        <p className="ly-footer-links">
          <a
            href="https://www.jogoresponsavel.com.br"
            target="_blank"
            rel="noopener noreferrer"
          >
            jogoresponsavel.com.br
          </a>
          {" · "}
          <a href="tel:188">CVV 188</a>
          {" · "}
          Proibido para menores de 18 anos.
        </p>
        <p className="ly-footer-copy">
          © 2026 MotorIA Pro — Análise de Risco. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:    #0A0A0B;
  --text:  #F2F2F0;
  --muted: #6B7280;
  --red:   #FF4D2E;
  --amber: #FFB020;
  --green: #1FCB7A;
  --border: #1E1E1F;
  --card:  #111112;
}

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  line-height: 1.6;
}

a { color: inherit; }

/* ── Legal bar ───────────────────────────────────────── */
.ly-legal {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 9px 20px;
  background: rgba(255,176,32,0.07);
  border-bottom: 1px solid rgba(255,176,32,0.15);
  font-size: 12px;
  color: rgba(255,176,32,0.8);
  line-height: 1.5;
}
.ly-legal a { color: rgba(255,176,32,0.8); text-decoration: underline; }

/* ── Header ──────────────────────────────────────────── */
.ly-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: rgba(10,10,11,0.95);
  backdrop-filter: blur(8px);
  z-index: 100;
}

.ly-logo {
  text-decoration: none;
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.ly-logo-main {
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 900;
  color: var(--text);
  letter-spacing: -0.02em;
}
.ly-logo-tag {
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
}

.ly-cta-btn {
  background: var(--text);
  color: var(--bg);
  font-size: 13px;
  font-weight: 700;
  padding: 9px 18px;
  border-radius: 8px;
  text-decoration: none;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.ly-cta-btn:hover { opacity: 0.85; }

/* ── Footer ──────────────────────────────────────────── */
.ly-footer {
  border-top: 1px solid var(--border);
  padding: 40px 24px;
}
.ly-footer-inner {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ly-footer-legal {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
}
.ly-footer-links {
  font-size: 12px;
  color: #444;
}
.ly-footer-links a { color: #444; text-decoration: underline; }
.ly-footer-copy {
  font-size: 11px;
  color: #333;
}
`;
