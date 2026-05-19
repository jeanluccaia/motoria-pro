import { useState, useEffect } from "react";
import { Link } from "./router";

// ─── Constants ────────────────────────────────────────────────────────────────

const KIWIFY_URL = "https://pay.kiwify.com.br/DIVD8zl";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { text: "Eu achava que controlava, mas só olhava aposta por aposta.", name: "Carlos R.", detail: "São Paulo · apostador há 2 anos" },
  { text: "O controle foi o que mais me chamou atenção. Eu nunca sabia quanto tinha perdido no mês.", name: "André M.", detail: "São Paulo · apostador há 3 anos" },
  { text: "Ver quanto gastei no mês mudou tudo. Antes eu não sabia nem o total.", name: "Felipe T.", detail: "Curitiba · apostador de fim de semana" },
  { text: "Antes eu só via a odd. Agora vejo o quanto isso pesa na minha grana.", name: "Marcos V.", detail: "Belo Horizonte · apostador recreativo" },
];

const FAQ_ITEMS = [
  {
    q: "Isso me ajuda a ganhar mais?",
    a: "Não prometemos ganhos. Mas você vai parar de perder no escuro. Saber o risco antes de entrar já faz diferença.",
  },
  {
    q: "É palpite ou análise?",
    a: "Não damos palpite. Mostramos o risco da aposta que você já escolheu. A decisão é sempre sua.",
  },
  {
    q: "É assinatura ou pagamento único?",
    a: "Pagamento único de R$27. Não cobra mais nada nunca.",
  },
  {
    q: "E se eu não gostar?",
    a: "Não gostou em 7 dias? Devolvo seu dinheiro. Sem burocracia.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`lp-faq-item${open ? " lp-faq-open" : ""}`}
      onClick={() => setOpen(!open)}
    >
      <div className="lp-faq-q">
        <span>{q}</span>
        <span className="lp-faq-icon" aria-hidden="true">{open ? "−" : "+"}</span>
      </div>
      {open && <p className="lp-faq-a">{a}</p>}
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

export default function Landing() {
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const hero  = document.querySelector(".lp-hero");
    const offer = document.querySelector("#oferta");
    function onScroll() {
      const heroBottom = hero  ? hero.getBoundingClientRect().bottom  : 400;
      const offerTop   = offer ? offer.getBoundingClientRect().top    : 99999;
      setStickyVisible(heroBottom < 0 && offerTop > window.innerHeight);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{CSS}</style>

      {/* ── SCARCITY TOPBAR ────────────────────────────────────────────────── */}
      <div className="lp-scarcity">
        <span className="lp-scarcity-dot" aria-hidden="true" />
        <span>+800 usuários ativos</span>
        <span className="lp-scarcity-sep" aria-hidden="true">·</span>
        <span>Valor de lançamento: <strong>R$27</strong> por tempo limitado</span>
      </div>

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <div className="lp-logo">
            <div className="lp-logo-mark" aria-hidden="true">M</div>
            <span className="lp-logo-name">MotorIA<span className="lp-logo-pro"> Pro</span></span>
          </div>
          <nav className="lp-nav" aria-label="Navegação principal">
            <a href="#como-funciona" className="lp-nav-link">Como funciona</a>
            <a href="#banca"         className="lp-nav-link">Controle de banca</a>
            <a href="#oferta"        className="lp-nav-link">Preço</a>
          </nav>
          <a href={KIWIFY_URL} className="lp-nav-cta" target="_blank" rel="noopener noreferrer">
            Desbloquear por R$27
          </a>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="lp-hero" id="topo">
        <div className="lp-hero-glow" aria-hidden="true" />
        <div className="lp-container lp-hero-layout">

          {/* Left — text */}
          <div className="lp-hero-left">
            <div className="lp-hero-tag">Análise de risco · Controle de banca</div>
            <h1 className="lp-h1">
              Vai apostar?<br />
              <span className="lp-h1-accent">Analise o risco</span><br />
              antes da entrada.
            </h1>
            <p className="lp-hero-sub">
              Antes de entrar em qualquer aposta, veja se vale a pena.<br />
              E acompanhe quanto você ganhou ou perdeu no mês.
            </p>
            <div className="lp-hero-actions">
              <Link to="/multipla" className="lp-btn-hero">
                Analisar meu bilhete
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <a href="#como-funciona" className="lp-btn-ghost">Entender como funciona ↓</a>
            </div>
            <p className="lp-hero-micro">R$27 uma vez só · acesso imediato · sem mensalidade</p>
          </div>

          {/* Right — imagem hero */}
          <div className="lp-hero-right">
            <div className="lp-img-wrap">
              <img
                src="/hero-risk-awareness.png"
                alt="Homem analisando aposta no celular antes de entrar"
                className="lp-hero-img"
                loading="eager"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────────────────────── */}
      <section className="lp-section lp-dark" id="como-funciona">
        <div className="lp-container">
          <div className="lp-eyebrow">Como funciona</div>
          <h2 className="lp-h2">Antes de apostar,<br />passe por 3 passos.</h2>
          <div className="lp-steps">
            {[
              { n: "01", title: "Informe a aposta",    desc: "Digite a odd e quanto vai apostar." },
              { n: "02", title: "Veja o risco",         desc: "A ferramenta te avisa se a aposta é arriscada demais." },
              { n: "03", title: "Decida com clareza",   desc: "Você vê tudo antes de confirmar. Sem surpresa depois." },
            ].map((s, i) => (
              <div className="lp-step" key={i}>
                <div className="lp-step-n" aria-hidden="true">{s.n}</div>
                <div className="lp-step-body">
                  <h3 className="lp-step-title">{s.title}</h3>
                  <p className="lp-step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VEJA COMO FUNCIONA — vídeo demo ─────────────────────────────────── */}
      <section className="lp-section lp-dark lp-video-section" id="demo">
        <div className="lp-container" style={{ textAlign: "center" }}>
          <div className="lp-eyebrow">Demonstração</div>
          <h2 className="lp-h2" style={{ marginBottom: 12 }}>Veja como funciona</h2>
          <p className="lp-video-sub">
            Em poucos segundos você monta sua entrada, entende o risco e acompanha sua banca.
          </p>
          <div className="lp-video-wrap">
            {/* Substituir o src abaixo pelo caminho do MP4 renderizado */}
            <video
              className="lp-video"
              src="/demo-motoria-v3.mp4"
              autoPlay
              muted
              loop
              playsInline
              poster="/video-poster.jpg"
            />
          </div>
        </div>
      </section>

      {/* ── ANÁLISE DE RISCO ─────────────────────────────────────────────────── */}
      <section className="lp-section" id="analise">
        <div className="lp-container lp-risk-layout">

          {/* Left — copy */}
          <div className="lp-risk-left">
            <div className="lp-eyebrow">Análise de risco</div>
            <h2 className="lp-h2">Nem toda aposta que parece boa tem risco baixo.</h2>
            <p className="lp-risk-desc">
              A ferramenta te mostra o que você normalmente só descobre depois de perder.
            </p>
          </div>

          {/* Right — mock locked card */}
          <div className="lp-risk-right">
            <div className="lp-risk-card">
              <div className="lp-risk-card-top">
                <span className="lp-risk-card-title">Resultado parcial identificado.</span>
                <span className="lp-risk-badge">⚠ CAUTELA</span>
              </div>
              <div className="lp-risk-signals">
                {[
                  "Exposição elevada detectada",
                  "Entrada exige cautela",
                  "Impacto relevante na banca",
                  "Análise completa bloqueada",
                ].map((s, i) => (
                  <div className="lp-risk-signal" key={i}>
                    <span className="lp-risk-signal-dot" aria-hidden="true" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <div className="lp-risk-metrics">
                <div className="lp-risk-metric">
                  <div className="lp-risk-metric-lbl">RISCO DA APOSTA</div>
                  <div className="lp-risk-metric-val">██ / 100</div>
                </div>
                <div className="lp-risk-metric">
                  <div className="lp-risk-metric-lbl">CHANCE ESTIMADA</div>
                  <div className="lp-risk-metric-val">██,█%</div>
                </div>
              </div>
              <div className="lp-risk-leitura">
                <div className="lp-risk-metric-lbl">LEITURA</div>
                <div className="lp-risk-blur">████████████████████████████</div>
              </div>
              <a href={KIWIFY_URL} className="lp-risk-cta" target="_blank" rel="noopener noreferrer">
                Desbloquear análise completa por R$27
              </a>
              <p className="lp-risk-micro">Pagamento único · sem mensalidade · acesso imediato</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── CONTROLE DE BANCA ────────────────────────────────────────────────── */}
      <section className="lp-section lp-dark" id="banca">
        <div className="lp-container">
          <div className="lp-eyebrow">Controle de Banca</div>
          <h2 className="lp-h2">Sabe quanto você<br />perdeu esse mês?</h2>
          <p className="lp-banca-sub">
            A maioria dos apostadores não sabe. O MotorIA Pro mostra seu saldo, seu lucro e suas perdas — tudo num lugar só.
          </p>

          {/* Mock dashboard */}
          <div className="lp-bk-grid">
            {[
              { label: "Saldo Atual",           val: "R$ 1.247",  sub: "+R$247 desde o início",      c: "#22c55e" },
              { label: "Lucro do mês",          val: "+R$ 247",   sub: "Em 30 entradas registradas",   c: "#22c55e" },
              { label: "Rendimento",            val: "+12,4%",    sub: "Sobre o valor apostado",       c: "#22c55e" },
              { label: "Entradas registradas",  val: "30",        sub: "Total no período",             c: "#e8e8e6" },
              { label: "Sequência de perdas",   val: "1",         sub: "Sem alerta ativo",             c: "#22c55e" },
              { label: "Apostado hoje",         val: "R$ 80",     sub: "Dentro do limite diário",      c: "#22c55e" },
            ].map((c, i) => (
              <div className="lp-bk-card" key={i}>
                <div className="lp-bk-label">{c.label}</div>
                <div className="lp-bk-val" style={{ color: c.c }}>{c.val}</div>
                <div className="lp-bk-sub">{c.sub}</div>
              </div>
            ))}
          </div>

          <p className="lp-banca-quote">
            "A maioria só olha a odd.<br />Poucos sabem o quanto já perderam esse mês."
          </p>

          <div className="lp-img-wrap lp-img-wrap-banca">
            <img
              src="/bankroll-control-dashboard.png"
              alt="Celular mostrando dashboard de controle de banca com saldo e lucro"
              className="lp-banca-img"
              loading="lazy"
            />
          </div>

        </div>
      </section>

      {/* ── O QUE VOCÊ PASSA A VER ───────────────────────────────────────────── */}
      <section className="lp-section" id="padroes">
        <div className="lp-container">
          <div className="lp-eyebrow">O que você passa a ver</div>
          <h2 className="lp-h2">Informação que você<br />não tinha antes.</h2>
          <div className="lp-patterns">
            {[
              "Quanto você ganhou esse mês",
              "Quanto você perdeu",
              "Se você está apostando mais do que devia",
              "Quando está no prejuízo e tentando recuperar no impulso",
            ].map((item, i) => (
              <div className="lp-pattern" key={i}>
                <span className="lp-pattern-dot" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEEDBACKS ────────────────────────────────────────────────────────── */}
      <section className="lp-section lp-dark" id="feedbacks">
        <div className="lp-container">
          <div className="lp-eyebrow">Quem usou</div>
          <div className="lp-user-count">
            <span className="lp-user-num">+800</span>
            <span className="lp-user-lbl"> apostadores ativos</span>
          </div>
          <div className="lp-testimonials">
            {TESTIMONIALS.map((t, i) => (
              <div className="lp-test" key={i}>
                <p className="lp-test-text">"{t.text}"</p>
                <div className="lp-test-by">— {t.name}</div>
                <div className="lp-test-detail">{t.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OFERTA FINAL ─────────────────────────────────────────────────────── */}
      <section className="lp-section" id="oferta">
        <div className="lp-container">
          <div className="lp-eyebrow">Acesso completo</div>
          <h2 className="lp-h2">Desbloqueie análise de risco<br />+ controle de banca.</h2>
          <div className="lp-offer-layout">

            {/* Feature list */}
            <ul className="lp-features" aria-label="O que está incluído">
              {[
                "Análise de risco antes da aposta",
                "Controle de banca completo",
                "Histórico de entradas",
                "Lucro e prejuízo no período",
                "ROI e exposição em tempo real",
                "Pagamento único",
                "Sem mensalidade",
              ].map((f, i) => (
                <li className="lp-feature" key={i}>
                  <span className="lp-feature-check" aria-hidden="true">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* Price card */}
            <div className="lp-price-card">
              <div className="lp-price-label">MOTORIA PRO · ACESSO IMEDIATO</div>
              <div className="lp-price-display">
                <span className="lp-price-old">R$47</span>
                <div className="lp-price-main">
                  <span className="lp-price-curr">R$</span>
                  <span className="lp-price-int">27</span>
                </div>
              </div>

              {/* Urgency bar */}
              <div className="lp-urgency">
                <div className="lp-urgency-top">
                  <span className="lp-urgency-dot" aria-hidden="true" />
                  <span className="lp-urgency-txt">Vagas restantes: 153 de 1.000</span>
                </div>
                <div className="lp-urgency-track">
                  <div className="lp-urgency-fill" />
                </div>
              </div>

              <a
                href={KIWIFY_URL}
                className="lp-btn-buy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Desbloquear por R$27
              </a>
              <p className="lp-btn-micro">Acesso imediato · pagamento único</p>
              <div className="lp-guarantee">
                <span className="lp-guarantee-icon" aria-hidden="true">✓</span>
                <span>Não gostou em 7 dias? Devolvo seu dinheiro. Sem burocracia.</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="lp-section lp-dark" id="faq">
        <div className="lp-container lp-faq-wrap">
          <div className="lp-eyebrow">Dúvidas</div>
          <h2 className="lp-h2">Perguntas frequentes.</h2>
          <div className="lp-faq">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────────── */}
      <section className="lp-cta-final">
        <div className="lp-cta-glow" aria-hidden="true" />
        <div className="lp-container lp-cta-inner">
          <h2 className="lp-cta-h2">
            Analise antes.<br />
            <span className="lp-cta-dim">Decida melhor.</span>
          </h2>
          <a
            href={KIWIFY_URL}
            className="lp-btn-buy lp-btn-buy-lg"
            target="_blank"
            rel="noopener noreferrer"
          >
            Desbloquear por R$27 →
          </a>
          <p className="lp-cta-micro">Acesso imediato · pagamento único · garantia de 7 dias</p>
        </div>
      </section>

      {/* ── STICKY CTA ───────────────────────────────────────────────────────── */}
      {stickyVisible && (
        <div className="lp-sticky" role="complementary" aria-label="Oferta">
          <a
            href={KIWIFY_URL}
            className="lp-sticky-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Desbloquear por R$27 →
          </a>
        </div>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <p className="lp-footer-legal">
            ⚠️ Ferramenta educativa de análise. Não é recomendação de aposta. Apostas envolvem risco financeiro real.
            Jogue com responsabilidade. Proibido para menores de 18 anos.{" "}
            <a href="https://www.jogoresponsavel.com.br" target="_blank" rel="noopener noreferrer">
              jogoresponsavel.com.br
            </a>
          </p>
          <div className="lp-footer-links">
            <span>© 2026 MotorIA Pro</span>
            <span className="lp-footer-sep" aria-hidden="true">·</span>
            <a href="/termos">Termos de Uso</a>
            <span className="lp-footer-sep" aria-hidden="true">·</span>
            <a href="/privacidade">Privacidade</a>
            <span className="lp-footer-sep" aria-hidden="true">·</span>
            <a href="mailto:suporte@motoriaopro.com.br">Contato</a>
          </div>
        </div>
      </footer>
    </>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:     #070709;
  --bg2:    #0A0A0D;
  --panel:  #0E0E12;
  --border: rgba(255,255,255,.07);
  --bmd:    rgba(255,255,255,.12);
  --t1: #E8E8E6;
  --t2: #7A7A7A;
  --t3: #3E3E42;
  --green:  #22C55E;
  --amber:  #F59E0B;
  --red:    #EF4444;
}

html { scroll-behavior: smooth; }
body { background: var(--bg); color: var(--t1); font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; }

/* ── Keyframes ─────────────────────────────────────────────────────────────── */
@keyframes lp-fadein {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes lp-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .5; transform: scale(1.5); }
}
@keyframes lp-glow-pulse {
  0%, 100% { opacity: .18; }
  50%       { opacity: .28; }
}
@keyframes lp-urgency-in {
  from { width: 0; }
  to   { width: 84.7%; }
}
@keyframes lp-slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Layout ─────────────────────────────────────────────────────────────────── */
.lp-container { max-width: 1080px; margin: 0 auto; padding: 0 28px; }
.lp-section   { padding: 88px 0; }
.lp-dark      { background: var(--bg2); }

.lp-eyebrow {
  font-size: 10px; font-weight: 700; letter-spacing: .2em;
  text-transform: uppercase; color: var(--green);
  margin-bottom: 18px;
}
.lp-h2 {
  font-size: clamp(28px, 4vw, 46px);
  font-weight: 900; line-height: 1.08;
  letter-spacing: -0.04em; color: var(--t1);
  margin-bottom: 20px;
}

/* ── Scarcity bar ───────────────────────────────────────────────────────────── */
.lp-scarcity {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  background: #0B0B0E; border-bottom: 1px solid var(--border);
  padding: 9px 20px;
  font-size: 11.5px; font-weight: 500; color: var(--t2); letter-spacing: .02em;
}
.lp-scarcity strong { color: var(--green); font-weight: 700; }
.lp-scarcity-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--green); flex-shrink: 0;
  animation: lp-pulse 2.4s ease-in-out infinite;
}
.lp-scarcity-sep { color: var(--t3); }

/* ── Header ─────────────────────────────────────────────────────────────────── */
.lp-header {
  position: sticky; top: 0; z-index: 200;
  background: rgba(7,7,9,.94);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--border);
}
.lp-header-inner {
  max-width: 1080px; margin: 0 auto; padding: 0 28px;
  height: 58px; display: flex; align-items: center;
  justify-content: space-between; gap: 24px;
}
.lp-logo { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.lp-logo-mark {
  width: 24px; height: 24px; border-radius: 6px;
  background: #16a34a; color: #f0fdf4;
  font-size: 11px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 14px rgba(22,163,74,.3);
}
.lp-logo-name {
  font-size: 14px; font-weight: 800; color: var(--t1); letter-spacing: -0.03em;
}
.lp-logo-pro { color: var(--green); }

.lp-nav { display: flex; align-items: center; gap: 28px; }
.lp-nav-link {
  font-size: 12.5px; font-weight: 500; color: var(--t2);
  text-decoration: none; letter-spacing: .01em;
  transition: color .15s;
}
.lp-nav-link:hover { color: var(--t1); }

.lp-nav-cta {
  font-size: 11.5px; font-weight: 800; letter-spacing: .04em;
  color: #dcfce7; background: #16a34a; border-radius: 8px;
  padding: 8px 16px; text-decoration: none; flex-shrink: 0;
  transition: background .15s;
}
.lp-nav-cta:hover { background: #15803d; }

/* ── Hero ───────────────────────────────────────────────────────────────────── */
.lp-hero {
  position: relative; overflow: hidden;
  padding: 96px 0 88px; min-height: 86vh;
  display: flex; align-items: center;
}
.lp-hero-glow {
  position: absolute; top: -120px; left: -100px;
  width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, rgba(34,197,94,.12) 0%, transparent 70%);
  pointer-events: none;
  animation: lp-glow-pulse 4s ease-in-out infinite;
}
.lp-hero-layout {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 64px; align-items: center; width: 100%;
}
.lp-hero-left {
  display: flex; flex-direction: column; gap: 0;
  animation: lp-fadein .5s ease both;
}
.lp-hero-tag {
  font-size: 10px; font-weight: 700; letter-spacing: .18em;
  text-transform: uppercase; color: var(--green);
  margin-bottom: 22px;
}
.lp-h1 {
  font-size: clamp(36px, 5.5vw, 66px);
  font-weight: 900; line-height: 1.04;
  letter-spacing: -0.045em; color: var(--t1);
  margin-bottom: 24px;
}
.lp-h1-accent { color: var(--green); }
.lp-hero-sub {
  font-size: clamp(14px, 1.6vw, 16.5px); color: var(--t2);
  line-height: 1.65; margin-bottom: 36px; max-width: 460px;
}
.lp-hero-actions { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-bottom: 14px; margin-top: 0; }
.lp-hero-micro {
  font-size: 11px; color: var(--t3); letter-spacing: .04em;
}

.lp-hero-right {
  display: flex; justify-content: center; align-items: center;
  animation: lp-fadein .5s .15s ease both;
}
/* ── Image wrappers ─────────────────────────────────────────────────────────── */
.lp-img-wrap {
  width: 100%; border-radius: 16px; overflow: hidden;
  box-shadow: 0 0 60px rgba(34,197,94,.12), 0 24px 80px rgba(0,0,0,.6);
  border: 1px solid rgba(34,197,94,.15);
}
.lp-img-wrap-banca {
  margin-top: 40px;
  box-shadow: 0 0 40px rgba(34,197,94,.08), 0 20px 60px rgba(0,0,0,.4);
}
.lp-hero-img {
  width: 100%; display: block; object-fit: cover;
  border-radius: 16px;
}
.lp-banca-img {
  width: 100%; display: block; object-fit: cover;
  border-radius: 16px;
}

/* ── Buttons ─────────────────────────────────────────────────────────────────── */
.lp-btn-hero {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--green); color: #050907;
  font-size: 13px; font-weight: 900; letter-spacing: .04em;
  padding: 14px 26px; border-radius: 10px; text-decoration: none;
  transition: background .15s, transform .12s;
}
.lp-btn-hero:hover { background: #16a34a; transform: translateY(-1px); }

.lp-btn-ghost {
  font-size: 14px; font-weight: 500; color: #666;
  text-decoration: none; letter-spacing: .01em;
  transition: color .15s; cursor: pointer;
}
.lp-btn-ghost:hover { color: var(--t2); }

.lp-btn-buy {
  display: block; width: 100%; text-align: center;
  background: var(--green); color: #050907;
  font-size: 14px; font-weight: 900; letter-spacing: .04em;
  padding: 16px 24px; border-radius: 10px; text-decoration: none;
  transition: background .15s, transform .12s;
}
.lp-btn-buy:hover { background: #16a34a; transform: translateY(-1px); }
.lp-btn-buy-lg { padding: 18px 32px; font-size: 15px; max-width: 380px; margin: 0 auto 16px; }

/* ── Image placeholders ─────────────────────────────────────────────────────── */
.lp-placeholder {
  display: flex; align-items: center; justify-content: center;
  border: 1px dashed rgba(255,255,255,.08);
  border-radius: 18px; background: var(--panel);
  position: relative; overflow: hidden;
}
.lp-placeholder::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(34,197,94,.05) 0%, transparent 70%);
}
.lp-placeholder-hero {
  width: 100%; aspect-ratio: 4/5;
  max-height: 520px;
  box-shadow: 0 0 60px rgba(34,197,94,.10), 0 24px 80px rgba(0,0,0,.5);
}
.lp-placeholder-banca {
  width: 100%; aspect-ratio: 16/7;
  margin-top: 40px;
  box-shadow: 0 0 40px rgba(34,197,94,.08), 0 20px 60px rgba(0,0,0,.4);
}
.lp-placeholder-lbl {
  font-size: 10px; font-weight: 600; color: var(--t3);
  letter-spacing: .1em; text-transform: uppercase;
  z-index: 1; position: relative;
}

/* ── Steps ───────────────────────────────────────────────────────────────────── */
.lp-steps {
  display: flex; gap: 0; align-items: stretch; margin-top: 52px;
}
.lp-step {
  flex: 1; display: flex; flex-direction: column; gap: 14px;
  padding: 28px 28px 28px 0;
  border-right: 1px solid var(--border);
  padding-right: 36px;
}
.lp-step:last-child { border-right: none; padding-right: 0; }
.lp-step:not(:first-child) { padding-left: 36px; }
.lp-step-n {
  font-size: 11px; font-weight: 900; letter-spacing: .14em;
  color: var(--green); font-family: 'Courier New', monospace;
}
.lp-step-title {
  font-size: 16px; font-weight: 800; color: var(--t1); letter-spacing: -0.02em;
}
.lp-step-body { display: flex; flex-direction: column; gap: 8px; }
.lp-step-desc { font-size: 13.5px; color: var(--t2); line-height: 1.6; }

/* ── Video section ──────────────────────────────────────────────────────────── */
.lp-video-section { padding: 80px 0; }
.lp-video-sub {
  font-size: 15px; color: var(--t2); line-height: 1.65;
  max-width: 480px; margin: 0 auto 40px; text-align: center;
}
.lp-video-wrap {
  max-width: 380px;
  margin: 0 auto;
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 0 60px rgba(34,197,94,0.08), 0 32px 80px rgba(0,0,0,0.5);
  background: #0a0a0a;
  aspect-ratio: 9/16;
  display: flex; align-items: center; justify-content: center;
}
.lp-video {
  width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 28px;
}
@media (max-width: 480px) {
  .lp-video-wrap { max-width: 90vw; border-radius: 20px; }
}

/* ── Risk section ───────────────────────────────────────────────────────────── */
.lp-risk-layout {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 72px; align-items: center;
}
.lp-risk-desc { font-size: 15px; color: var(--t2); line-height: 1.65; }
.lp-risk-card {
  background: var(--panel); border: 1px solid rgba(239,68,68,.2);
  border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 16px;
  box-shadow: 0 0 40px rgba(239,68,68,.06), 0 16px 48px rgba(0,0,0,.4);
}
.lp-risk-card-top {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.lp-risk-card-title { font-size: 13px; font-weight: 800; color: var(--t1); }
.lp-risk-badge {
  font-size: 9px; font-weight: 800; letter-spacing: .1em;
  color: #fbbf24; background: rgba(251,191,36,.1);
  border: 1px solid rgba(251,191,36,.2);
  border-radius: 99px; padding: 3px 8px; white-space: nowrap;
}
.lp-risk-signals { display: flex; flex-direction: column; gap: 8px; }
.lp-risk-signal {
  display: flex; align-items: center; gap: 10px;
  font-size: 12.5px; color: var(--t2);
}
.lp-risk-signal-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--amber); flex-shrink: 0;
}
.lp-risk-metrics {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.lp-risk-metric {
  background: rgba(255,255,255,.03); border: 1px solid var(--border);
  border-radius: 8px; padding: 12px;
  display: flex; flex-direction: column; gap: 6px;
}
.lp-risk-metric-lbl {
  font-size: 8.5px; font-weight: 800; letter-spacing: .14em; color: var(--t2);
}
.lp-risk-metric-val {
  font-size: 18px; font-weight: 900; color: var(--t3);
  letter-spacing: .06em; font-family: 'Courier New', monospace;
}
.lp-risk-leitura {
  background: rgba(255,255,255,.02); border: 1px solid var(--border);
  border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 6px;
}
.lp-risk-blur {
  font-size: 13px; color: var(--t3); letter-spacing: .12em;
  font-family: 'Courier New', monospace;
  filter: blur(3px); user-select: none;
}
.lp-risk-cta {
  display: block; text-align: center;
  background: #16a34a; color: #dcfce7;
  font-size: 12.5px; font-weight: 800; letter-spacing: .04em;
  padding: 13px 20px; border-radius: 9px; text-decoration: none;
  transition: background .15s;
}
.lp-risk-cta:hover { background: #15803d; }
.lp-risk-micro {
  text-align: center; font-size: 10.5px; color: var(--t3); letter-spacing: .03em;
}

/* ── Banca section ──────────────────────────────────────────────────────────── */
.lp-banca-sub {
  font-size: 15px; color: var(--t2); line-height: 1.65; max-width: 520px; margin-bottom: 40px;
}
.lp-bk-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 40px;
}
.lp-bk-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 18px 16px;
  display: flex; flex-direction: column; gap: 6px;
}
.lp-bk-label { font-size: 9px; font-weight: 800; letter-spacing: .12em; color: var(--t2); }
.lp-bk-val   { font-size: 20px; font-weight: 900; line-height: 1.1; }
.lp-bk-sub   { font-size: 10.5px; color: var(--t3); }
.lp-banca-quote {
  font-size: 16px; font-weight: 600; color: var(--t2);
  border-left: 2px solid var(--green); padding-left: 18px;
  line-height: 1.6; max-width: 520px; margin-bottom: 8px;
}

/* ── Patterns ───────────────────────────────────────────────────────────────── */
.lp-patterns { display: flex; flex-direction: column; gap: 0; margin-top: 40px; }
.lp-pattern {
  display: flex; align-items: center; gap: 16px;
  padding: 18px 0; border-bottom: 1px solid var(--border);
  font-size: 15px; color: var(--t2); font-weight: 500;
}
.lp-pattern:last-child { border-bottom: none; }
.lp-pattern-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--green); flex-shrink: 0;
}

/* ── Testimonials ───────────────────────────────────────────────────────────── */
.lp-user-count {
  display: flex; align-items: baseline; gap: 6px; margin-bottom: 40px;
}
.lp-user-num  { font-size: 42px; font-weight: 900; color: var(--green); letter-spacing: -0.04em; }
.lp-user-lbl  { font-size: 14px; color: var(--t2); }
.lp-testimonials { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.lp-test {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 14px; padding: 24px;
  display: flex; flex-direction: column; gap: 16px;
}
.lp-test-text {
  font-size: 14px; color: var(--t1); line-height: 1.65; font-weight: 400;
}
.lp-test-by     { font-size: 12px; color: var(--t2); font-weight: 700; }
.lp-test-detail { font-size: 11px; color: var(--t3); margin-top: 3px; }

/* ── Offer section ──────────────────────────────────────────────────────────── */
.lp-offer-layout {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 64px; align-items: start; margin-top: 52px;
}
.lp-features { list-style: none; display: flex; flex-direction: column; gap: 14px; }
.lp-feature  { display: flex; align-items: center; gap: 14px; font-size: 14.5px; color: var(--t1); }
.lp-feature-check { color: var(--green); font-size: 13px; font-weight: 700; flex-shrink: 0; }

.lp-price-card {
  background: var(--panel); border: 1px solid rgba(34,197,94,.2);
  border-radius: 16px; padding: 28px 24px;
  display: flex; flex-direction: column; gap: 14px;
  box-shadow: 0 0 60px rgba(34,197,94,.08), 0 20px 60px rgba(0,0,0,.4);
}
.lp-price-label {
  font-size: 9px; font-weight: 800; letter-spacing: .18em;
  color: var(--t3); font-family: 'Courier New', monospace;
}
.lp-price-display { display: flex; align-items: center; gap: 16px; }
.lp-price-old {
  font-size: 15px; font-weight: 600; color: var(--t3);
  text-decoration: line-through;
}
.lp-price-main { display: flex; align-items: flex-start; gap: 2px; line-height: 1; }
.lp-price-curr { font-size: 20px; font-weight: 900; color: var(--t1); padding-top: 6px; }
.lp-price-int  { font-size: 60px; font-weight: 900; color: var(--t1); letter-spacing: -0.05em; line-height: 1; }

.lp-urgency { display: flex; flex-direction: column; gap: 8px; }
.lp-urgency-top {
  display: flex; align-items: center; gap: 8px;
  font-size: 9px; font-weight: 700; letter-spacing: .12em; color: var(--t3);
}
.lp-urgency-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--green); flex-shrink: 0;
  animation: lp-pulse 1.8s ease-in-out infinite;
}
.lp-urgency-track {
  height: 4px; background: rgba(255,255,255,.06); border-radius: 99px; overflow: hidden;
}
.lp-urgency-fill {
  height: 100%; background: var(--green); border-radius: 99px;
  animation: lp-urgency-in 1.5s ease both;
  width: 84.7%;
}

.lp-btn-micro { text-align: center; font-size: 11px; color: var(--t3); letter-spacing: .03em; }
.lp-guarantee {
  display: flex; align-items: center; gap: 10px;
  padding-top: 6px; border-top: 1px solid var(--border);
  font-size: 12px; color: var(--t2);
}
.lp-guarantee-icon { color: var(--green); font-size: 11px; flex-shrink: 0; }

/* ── FAQ ─────────────────────────────────────────────────────────────────────── */
.lp-faq-wrap { max-width: 700px; }
.lp-faq { display: flex; flex-direction: column; gap: 0; margin-top: 36px; }
.lp-faq-item {
  border-bottom: 1px solid var(--border); padding: 20px 0; cursor: pointer;
}
.lp-faq-item:first-child { border-top: 1px solid var(--border); }
.lp-faq-q {
  display: flex; justify-content: space-between; align-items: center; gap: 20px;
  font-size: 14px; font-weight: 700; color: var(--t1); letter-spacing: -0.01em;
}
.lp-faq-icon { color: var(--green); font-size: 18px; flex-shrink: 0; }
.lp-faq-a { font-size: 13.5px; color: var(--t2); line-height: 1.7; margin-top: 14px; }

/* ── CTA Final ──────────────────────────────────────────────────────────────── */
.lp-cta-final {
  position: relative; overflow: hidden;
  padding: 100px 0; text-align: center;
  background: var(--bg);
}
.lp-cta-glow {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 700px; height: 400px; border-radius: 50%;
  background: radial-gradient(circle, rgba(34,197,94,.1) 0%, transparent 65%);
  pointer-events: none;
}
.lp-cta-inner {
  position: relative; display: flex; flex-direction: column;
  align-items: center; gap: 20px;
}
.lp-cta-h2 {
  font-size: clamp(36px, 5vw, 60px);
  font-weight: 900; line-height: 1.08; letter-spacing: -0.045em;
  color: var(--t1);
}
.lp-cta-dim { color: var(--t3); }
.lp-cta-micro { font-size: 11.5px; color: var(--t3); letter-spacing: .04em; }

/* ── Sticky CTA ─────────────────────────────────────────────────────────────── */
.lp-sticky {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 300;
  background: rgba(7,7,9,.95); backdrop-filter: blur(20px);
  border-top: 1px solid rgba(34,197,94,.2);
  padding: 12px 20px; display: flex; justify-content: center;
  animation: lp-slide-up .22s ease both;
}
.lp-sticky-btn {
  background: var(--green); color: #050907;
  font-size: 13px; font-weight: 900; letter-spacing: .05em;
  padding: 13px 32px; border-radius: 9px; text-decoration: none;
  transition: background .15s;
}
.lp-sticky-btn:hover { background: #16a34a; }

/* ── Footer ─────────────────────────────────────────────────────────────────── */
.lp-footer {
  background: var(--bg2); border-top: 1px solid var(--border);
  padding: 32px 0;
}
.lp-footer-legal {
  font-size: 11px; color: var(--t3); line-height: 1.65; margin-bottom: 16px;
}
.lp-footer-legal a { color: var(--t3); text-decoration: underline; }
.lp-footer-links {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  font-size: 11.5px; color: var(--t3);
}
.lp-footer-links a { color: var(--t3); text-decoration: none; }
.lp-footer-links a:hover { color: var(--t2); }
.lp-footer-sep { color: var(--t3); }

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .lp-container { padding: 0 18px; }
  .lp-section   { padding: 60px 0; }

  /* Header */
  .lp-nav { display: none; }
  .lp-header-inner { height: 52px; }
  .lp-nav-cta { font-size: 11px; padding: 7px 13px; }

  /* Hero */
  .lp-hero { padding: 56px 0 48px; min-height: auto; }
  .lp-hero-layout { grid-template-columns: 1fr; gap: 32px; }
  .lp-hero-right { order: -1; }
  .lp-hero-img { height: 420px; }
  .lp-banca-img { height: 360px; }
  .lp-h1 { font-size: clamp(32px, 8vw, 48px); }
  .lp-hero-sub { font-size: 15px; }

  /* Steps */
  .lp-steps { flex-direction: column; gap: 0; }
  .lp-step {
    border-right: none; padding: 22px 0;
    border-bottom: 1px solid var(--border);
  }
  .lp-step:last-child { border-bottom: none; }
  .lp-step:not(:first-child) { padding-left: 0; }

  /* Risk layout */
  .lp-risk-layout { grid-template-columns: 1fr; gap: 36px; }

  /* Banca */
  .lp-bk-grid { grid-template-columns: 1fr 1fr; }
  .lp-placeholder-banca { aspect-ratio: 4/3; }

  /* Testimonials */
  .lp-testimonials { grid-template-columns: 1fr; }

  /* Offer */
  .lp-offer-layout { grid-template-columns: 1fr; gap: 40px; }

  /* Hero actions */
  .lp-hero-actions { flex-direction: column; align-items: flex-start; }
  .lp-btn-hero { width: 100%; justify-content: center; }

  /* Scarcity */
  .lp-scarcity { font-size: 10.5px; gap: 8px; padding: 8px 14px; flex-wrap: wrap; text-align: center; }
}

@media (max-width: 480px) {
  .lp-bk-grid { grid-template-columns: 1fr; }
  .lp-risk-metrics { grid-template-columns: 1fr; }
  .lp-h2 { font-size: clamp(24px, 7vw, 34px); }
}
`;
