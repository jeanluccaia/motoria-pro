import { useState } from "react";
import { LegalBar, Footer } from "./Layout";
import { Link } from "./router";

// ─── Data ───────────────────────────────────────────────────────────────────────

const COMPARISON_SHOW = [
  "A odd e o retorno possível",
  "Quanto você pode ganhar",
  "O lado positivo da aposta",
];

const COMPARISON_HIDE = [
  "Chance real de perder",
  "Margem escondida da casa",
  "Nota de risco 0 a 100",
  "Custo médio por R$100 apostado",
];

const DASH_CARDS = [
  { num: "64,3%", color: "#EF4444", label: "Chance de perder",        bar: 64.3, desc: "O risco real dessa entrada." },
  { num: "67",    color: "#F97316", label: "Nota de risco",           bar: 67,   desc: "Quanto maior, mais arriscada." },
  { num: "5,5%",  color: "#F59E0B", label: "Margem da casa",          bar: 5.5,  desc: "O quanto a casa ganha em cima." },
  { num: "−R$14", color: "#EF4444", label: "Perda média por R$100",   bar: 61,   desc: "O impacto dessa odd no longo prazo." },
];

const STEPS = [
  { n: "01", title: "Informe a odd",             desc: "Coloque a odd, o valor e o tipo de aposta. Leva menos de 30 segundos." },
  { n: "02", title: "O MotorIA calcula o risco", desc: "Ele transforma a odd em uma leitura simples — chance de perda, nota de risco e custo estimado." },
  { n: "03", title: "Decida com consciência",    desc: "Você vê se a aposta parece segura ou se exige cautela. A decisão é sempre sua." },
];

const TESTIMONIALS = [
  { name: "R.", text: "Ia entrar pra recuperar o loss.\nA análise mostrou risco alto.\nFechei o app." },
  { name: "A.", text: "Achava que odd baixa era segura.\nAgora olho diferente." },
  { name: "F.", text: "Não me prometeu green.\nSó me fez pensar antes de clicar." },
  { name: "M.", text: "Eu ia apostar no impulso.\nA nota de risco me travou." },
];

const FEATURES = [
  { text: "20 análises para usar quando quiser" },
  { text: "Nota de risco de 0 a 100 por aposta" },
  { text: "Chance de perder em segundos" },
  { text: "Margem da casa revelada por tipo de aposta" },
  { text: "Simulador de banca — impacto em 30 dias" },
  { text: "Alerta de tilt — avisa quando você está no limite", tilt: true },
];

const FAQ_ITEMS = [
  { q: "Isso garante lucro?",                         a: "Não. Não existe ferramenta que garanta ganhos em apostas. O MotorIA te mostra o risco antes de decidir — não como vencer." },
  { q: "Vocês dão palpites?",                         a: "Nunca. Mostramos probabilidade e risco matemático. A decisão é sempre sua." },
  { q: "Vocês são uma casa de aposta?",               a: "Não. Somos uma ferramenta educativa independente. Sem relação nenhuma com plataformas ou casas de aposta." },
  { q: "É assinatura mensal?",                        a: "Não. É um acesso único por R$27. Sem mensalidade, sem renovação automática, sem surpresa no cartão." },
  { q: "Funciona no celular?",                        a: "Sim. A ferramenta foi feita para o celular — pra usar antes de qualquer decisão, de onde você estiver." },
  { q: "E se eu já tenho problema com jogo?",         a: "Se apostar está te causando prejuízo, ansiedade ou perda de controle, a recomendação é procurar ajuda especializada — não usar a ferramenta para apostar. Acesse jogoresponsavel.com.br ou ligue 188 (CVV)." },
];

// ─── Sub-components ─────────────────────────────────────────────────────────────

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`lp-faq-item${open ? " lp-faq-open" : ""}`} onClick={() => setOpen(!open)}>
      <div className="lp-faq-q">
        <span>{q}</span>
        <span className="lp-faq-icon">{open ? "−" : "+"}</span>
      </div>
      {open && <p className="lp-faq-a">{a}</p>}
    </div>
  );
}

// ─── Landing ────────────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <>
      <style>{CSS}</style>
      <LegalBar />

      {/* ── HEADER ─────────────────────────────────────────────────────────────── */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <div className="lp-logo">
            <div className="lp-logo-mark">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="#050505"/>
                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="currentColor" fillOpacity=".9"/>
              </svg>
            </div>
            <span className="lp-logo-name">MotorIA Pro</span>
          </div>
          <nav className="lp-nav">
            <a href="#problema"      className="lp-nav-link">O problema</a>
            <a href="#como-funciona" className="lp-nav-link">Como funciona</a>
            <a href="#preco"         className="lp-nav-link">Preço</a>
          </nav>
          <Link to="/pagar" className="lp-nav-cta">Garantir acesso →</Link>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-grid" aria-hidden="true" />
        <div className="lp-container lp-hero-layout">

          {/* LEFT */}
          <div className="lp-hero-left">
            <h1 className="lp-h1">
              Essa odd<br />parecia boa.
            </h1>
            <p className="lp-hero-sub">
              Até o MotorIA mostrar o risco.
            </p>
            <p className="lp-hero-desc">
              Veja o risco antes de apostar.
            </p>
            <div className="lp-hero-actions">
              <Link to="/app" className="lp-btn-hero">
                Analisar uma aposta
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/pagar" className="lp-btn-ghost">Acesso completo por R$27</Link>
            </div>
            <div className="lp-hero-meta">
              Ferramenta educativa
              <span className="lp-meta-sep">·</span>
              +18
              <span className="lp-meta-sep">·</span>
              Não promete lucro
            </div>
          </div>

          {/* RIGHT — mock analysis panel */}
          <div className="lp-hero-right">
            <div className="lp-mock">
              <div className="lp-mock-topbar">
                <div className="lp-mock-traffic">
                  <span className="lp-mock-dot-r" />
                  <span className="lp-mock-dot-y" />
                  <span className="lp-mock-dot-g" />
                </div>
                <span className="lp-mock-title">MotorIA · Leitura de risco</span>
                <span className="lp-mock-live">LIVE</span>
              </div>
              <div className="lp-mock-body">
                <div className="lp-mock-session">
                  <span className="lp-mock-session-id">ANÁLISE #2847</span>
                  <span className="lp-mock-session-ts">hoje · 14:23</span>
                </div>
                <div className="lp-mock-input-row">
                  <div className="lp-mock-cell">
                    <span className="lp-mock-cell-lbl">Jogo</span>
                    <span className="lp-mock-cell-val">Flamengo × Palmeiras</span>
                    <span className="lp-mock-cell-sub">Vitória do Flamengo</span>
                  </div>
                  <div className="lp-mock-cell lp-mock-cell-sm">
                    <span className="lp-mock-cell-lbl">Odd</span>
                    <span className="lp-mock-cell-val lp-mock-odd">2.80</span>
                  </div>
                </div>
                <div className="lp-mock-prob-split">
                  <div className="lp-mock-prob-win" />
                  <div className="lp-mock-prob-lose" />
                </div>
                <div className="lp-mock-prob-labels">
                  <span className="lp-mock-prob-lbl lp-mock-prob-w">▲ Chance de ganhar 35,7%</span>
                  <span className="lp-mock-prob-lbl lp-mock-prob-l">64,3% de perder ▼</span>
                </div>
                <div className="lp-mock-rule" />
                <div className="lp-mock-data-grid">
                  <div className="lp-mock-dc"><span className="lp-mock-dk">CHANCE DE GANHAR</span><span className="lp-mock-dv lp-mock-dv-g">35,71%</span></div>
                  <div className="lp-mock-dc"><span className="lp-mock-dk">MARGEM DA CASA</span><span className="lp-mock-dv lp-mock-dv-a">5,47%</span></div>
                  <div className="lp-mock-dc"><span className="lp-mock-dk">CHANCE DE PERDER</span><span className="lp-mock-dv lp-mock-dv-r">64,3%</span></div>
                  <div className="lp-mock-dc"><span className="lp-mock-dk">CUSTO POR R$100</span><span className="lp-mock-dv lp-mock-dv-r">−R$14,50</span></div>
                </div>
                <div className="lp-mock-rule" />
                <div className="lp-mock-score-wrap">
                  <div className="lp-mock-score-hdr">
                    <span className="lp-mock-score-lbl">NOTA DE RISCO</span>
                    <span className="lp-mock-risk-tag">ALTO</span>
                  </div>
                  <div className="lp-mock-score-row">
                    <div className="lp-mock-score-left">
                      <span className="lp-mock-score-num">67</span>
                      <span className="lp-mock-score-denom">/100</span>
                    </div>
                    <div className="lp-mock-bar-wrap">
                      <div className="lp-mock-bar-track">
                        <div className="lp-mock-bar-fill" />
                        {[30, 60, 80].map(t => (
                          <div key={t} className="lp-mock-bar-tick" style={{ left: `${t}%` }} />
                        ))}
                      </div>
                      <div className="lp-mock-bar-labels">
                        <span>Baixo</span><span>Mod.</span><span>Alto</span><span>Crítico</span>
                      </div>
                    </div>
                  </div>
                  <div className="lp-mock-verdict">
                    <span className="lp-mock-verdict-badge">DESFAVORÁVEL</span>
                    <span className="lp-mock-verdict-detail">Verifique antes de decidir</span>
                  </div>
                </div>
              </div>
              <div className="lp-mock-footer">
                Ferramenta educativa · Não é recomendação de aposta
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── PROBLEMA ───────────────────────────────────────────────────────────── */}
      <section className="lp-problem lp-section-dark" id="problema">
        <div className="lp-container">
          <div className="lp-section-eyebrow">O problema</div>
          <h2 className="lp-h2">
            Nem toda aposta ruim<br />
            parece arriscada.
          </h2>
          <p className="lp-problem-text">
            Às vezes a odd parece boa. O jogo parece fácil.
            A vontade de recuperar fala mais alto.
          </p>
          <p className="lp-problem-text lp-problem-text-em">
            O MotorIA entra antes disso — mostrando o risco
            que você talvez não esteja vendo.
          </p>
          <div className="lp-compare">
            <div className="lp-compare-col lp-compare-show">
              <div className="lp-compare-hdr">
                <span className="lp-compare-dot lp-compare-dot-dim" />
                <span className="lp-compare-title">Você normalmente vê</span>
              </div>
              {COMPARISON_SHOW.map((item, i) => (
                <div className="lp-compare-row" key={i}>
                  <span className="lp-compare-icon lp-c-dim">→</span>
                  <span className="lp-compare-text">{item}</span>
                </div>
              ))}
            </div>
            <div className="lp-compare-col lp-compare-hide">
              <div className="lp-compare-hdr">
                <span className="lp-compare-dot lp-compare-dot-green" />
                <span className="lp-compare-title">O MotorIA mostra</span>
              </div>
              {COMPARISON_HIDE.map((item, i) => (
                <div className="lp-compare-row" key={i}>
                  <span className="lp-compare-icon lp-c-green">✓</span>
                  <span className="lp-compare-text">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INDICADORES ────────────────────────────────────────────────────────── */}
      <section className="lp-dash" id="como-funciona">
        <div className="lp-container">
          <div className="lp-section-eyebrow">O que você descobre</div>
          <h2 className="lp-h2 lp-h2-narrow">
            4 números que a odd<br />não te mostra.
          </h2>
          <div className="lp-dash-grid">
            {DASH_CARDS.map(c => (
              <div className="lp-dash-card" key={c.label}>
                <div className="lp-dash-card-num" style={{ color: c.color }}>{c.num}</div>
                <div className="lp-dash-card-label">{c.label}</div>
                <div className="lp-dash-mini-bar">
                  <div className="lp-dash-mini-fill" style={{ width: `${c.bar}%`, background: c.color }} />
                </div>
                <div className="lp-dash-card-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ──────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-dark" id="como-funciona-steps">
        <div className="lp-container">
          <div className="lp-section-eyebrow">Como funciona</div>
          <h2 className="lp-h2 lp-h2-narrow">Simples assim.</h2>
          <div className="lp-steps">
            {STEPS.map(s => (
              <div className="lp-step" key={s.n}>
                <div className="lp-step-n">{s.n}</div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <Link to="/app" className="lp-btn-hero">
              Analisar uma aposta
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── POSICIONAMENTO ─────────────────────────────────────────────────────── */}
      <section className="lp-position">
        <div className="lp-container">
          <div className="lp-position-layout">

            <div className="lp-position-left">
              <div className="lp-section-eyebrow">Nossa posição</div>
              <h2 className="lp-h2">
                Não prometemos lucro.<br />
                <span className="lp-h2-dim">Nunca prometemos.</span>
              </h2>
              <div className="lp-position-points">
                {[
                  "Não somos casa de aposta",
                  "Não vendemos palpite",
                  "Não garantimos resultado",
                  "Não incentivamos apostar mais",
                ].map((pt, i) => (
                  <div className="lp-position-pt" key={i}>
                    <span className="lp-position-pt-icon" aria-hidden="true">○</span>
                    <span className="lp-position-pt-title">{pt}</span>
                  </div>
                ))}
              </div>
              <p className="lp-position-bottom">
                O objetivo é simples: te mostrar o risco antes da decisão.
              </p>
            </div>

            <div className="lp-position-right">
              <div className="lp-founder-photo-wrap">
                <picture>
                  <source type="image/avif" srcSet="/jean-analise-960.avif" />
                  <source type="image/webp" srcSet="/jean-analise-960.webp" />
                  <img
                    src="/jean-analise.png"
                    alt="Jean Lucca — criador do MotorIA Pro"
                    className="lp-founder-img"
                    loading="lazy"
                    decoding="async"
                    height="auto"
                  />
                </picture>
                <div className="lp-founder-caption">
                  <span className="lp-founder-caption-name">Jean Lucca</span>
                  <span className="lp-founder-caption-role">Criador do MotorIA Pro</span>
                </div>
              </div>
              <blockquote className="lp-position-quote">
                <p className="lp-position-quote-text">
                  "O problema nunca foi a odd.
                  Foi não entender o risco por trás dela."
                </p>
              </blockquote>
            </div>

          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ────────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-dark">
        <div className="lp-container">
          <div className="lp-section-eyebrow">Quem usou</div>
          <h2 className="lp-h2 lp-h2-narrow">O que disseram.</h2>
          <div className="lp-testimonials">
            {TESTIMONIALS.map((t, i) => (
              <div className="lp-testimonial" key={i}>
                <p className="lp-test-text" style={{ whiteSpace: "pre-line" }}>"{t.text}"</p>
                <div className="lp-test-name">— {t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇO ──────────────────────────────────────────────────────────────── */}
      <section className="lp-section" id="preco">
        <div className="lp-container">
          <div className="lp-section-eyebrow">Acesso completo</div>
          <h2 className="lp-h2 lp-h2-narrow">Custa menos que uma aposta perdida.</h2>
          <p className="lp-pricing-sub">
            Por R$27, você acessa uma ferramenta para entender o risco antes de decidir.
          </p>
          <div className="lp-pricing">
            <ul className="lp-features-list">
              {FEATURES.map((f, i) => (
                <li className={`lp-feature-item${f.tilt ? " lp-feature-tilt" : ""}`} key={i}>
                  <span className="lp-feature-check">{f.tilt ? "⚡" : "✓"}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
            <div className="lp-price-card">
              <div className="lp-price-eyebrow">Acesso único</div>
              <div className="lp-price-display">
                <span className="lp-price-curr">R$</span>
                <span className="lp-price-int">27</span>
              </div>
              <p className="lp-price-note">Sem mensalidade. Ativação imediata após o pagamento.</p>
              <Link to="/pagar" className="lp-btn-buy">Garantir acesso por R$27 →</Link>
              <div className="lp-guarantee">
                <div className="lp-guarantee-icon">✓</div>
                <div>
                  <div className="lp-guarantee-title">Garantia de 7 dias</div>
                  <div className="lp-guarantee-sub">Não achou útil? Devolvemos 100% sem perguntas.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-dark">
        <div className="lp-container" style={{ maxWidth: 680 }}>
          <div className="lp-section-eyebrow">Dúvidas</div>
          <h2 className="lp-h2 lp-h2-narrow">Perguntas frequentes.</h2>
          <div className="lp-faq">
            {FAQ_ITEMS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────────────── */}
      <section className="lp-cta-final">
        <div className="lp-cta-grid" aria-hidden="true" />
        <div className="lp-container lp-cta-inner">
          <h2 className="lp-cta-h2">
            Antes de apostar,<br />
            <span className="lp-cta-dim">veja o risco.</span>
          </h2>
          <p className="lp-cta-sub">O risco que a odd esconde.</p>
          <div className="lp-cta-actions">
            <Link to="/app" className="lp-btn-buy lp-btn-buy-lg">Analisar uma aposta →</Link>
            <Link to="/pagar" className="lp-cta-alt-link">Ou garanta acesso completo por R$27</Link>
          </div>
          <div className="lp-cta-trust">
            <span>Ferramenta educativa</span>
            <span className="lp-meta-sep">·</span>
            <span>Garantia de 7 dias</span>
            <span className="lp-meta-sep">·</span>
            <span>Não é casa de aposta</span>
          </div>
          <p className="lp-cta-disclaimer">
            Não garante resultados. Não incentiva apostas.
            Uso recomendado apenas para maiores de 18 anos.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}

// ─── CSS ────────────────────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; }

:root {
  --bg:     #070709;
  --bg2:    #0A0A0D;
  --border: rgba(255,255,255,0.07);
  --bmd:    rgba(255,255,255,0.12);
  --t1: #E8E8E6;
  --t2: #7A7A7A;
  --t3: #484848;
  --green:  #22C55E;
  --amber:  #F59E0B;
  --red:    #EF4444;
  --orange: #F97316;
}

.lp-c-green { color: var(--green); }
.lp-c-dim   { color: var(--t3); }

/* tabular nums */
.lp-mock-odd, .lp-mock-score-num, .lp-mock-score-denom,
.lp-dash-card-num, .lp-price-int {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

/* ── Layout ─────────────────────────────────────────────────────────────────── */
.lp-container  { max-width: 1080px; margin: 0 auto; padding: 0 28px; }
.lp-section    { padding: 80px 0; }
.lp-section-dark { background: var(--bg2); }

.lp-section-eyebrow {
  font-size: 10px; font-weight: 700;
  letter-spacing: .18em; text-transform: uppercase;
  color: var(--green); margin-bottom: 16px;
}
.lp-h2 {
  font-size: clamp(26px, 3.8vw, 42px);
  font-weight: 900; color: var(--t1);
  line-height: 1.1; letter-spacing: -0.035em; margin-bottom: 16px;
}
.lp-h2-narrow { max-width: 480px; margin-bottom: 40px; }
.lp-h2-dim    { color: rgba(232,232,230,.22); }

/* ── Keyframes ──────────────────────────────────────────────────────────────── */
@keyframes lp-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: .35; }
}
@keyframes lp-fadein {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes lp-bar-grow {
  from { width: 0; opacity: 0; }
  to   { width: 67%; opacity: 1; }
}
@keyframes lp-pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.4); opacity: .7; }
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.lp-header {
  position: sticky; top: 0; z-index: 200;
  background: rgba(7,7,9,.96);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
}
.lp-header-inner {
  max-width: 1080px; margin: 0 auto; padding: 0 28px;
  height: 56px; display: flex; align-items: center;
  justify-content: space-between; gap: 32px;
}
.lp-logo    { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
.lp-logo-mark {
  width: 24px; height: 24px; border-radius: 6px;
  background: var(--green); color: #070709;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.lp-logo-name { font-size: 14px; font-weight: 800; color: var(--t1); letter-spacing: -0.025em; }
.lp-nav { display: flex; align-items: center; gap: 28px; }
.lp-nav-link {
  font-size: 13px; color: var(--t3); text-decoration: none; transition: color .15s;
}
.lp-nav-link:hover { color: var(--t1); }
.lp-nav-cta {
  font-size: 12px; font-weight: 700; color: var(--t1); text-decoration: none;
  border: 1px solid var(--bmd); padding: 7px 16px; border-radius: 7px;
  background: rgba(255,255,255,.04); transition: all .15s; flex-shrink: 0; white-space: nowrap;
}
.lp-nav-cta:hover { background: rgba(255,255,255,.08); }

/* ── Hero ───────────────────────────────────────────────────────────────────── */
.lp-hero {
  position: relative; overflow: hidden; background: var(--bg);
  min-height: calc(100vh - 56px); display: flex; align-items: center;
}
.lp-hero-grid {
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,.028) 1px, transparent 1px);
  background-size: 40px 40px;
}
.lp-hero-layout {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: 1fr 480px;
  gap: 80px; align-items: center;
  padding-top: 80px; padding-bottom: 80px;
}
.lp-hero-left { display: flex; flex-direction: column; }

.lp-h1 {
  font-size: clamp(40px, 5.6vw, 72px);
  font-weight: 900; color: var(--t1);
  line-height: 1.02; letter-spacing: -0.04em; margin-bottom: 16px;
}
.lp-hero-sub {
  font-size: clamp(18px, 2.4vw, 24px);
  font-weight: 700; color: var(--green);
  line-height: 1.3; letter-spacing: -0.02em;
  margin-bottom: 16px;
}
.lp-hero-desc {
  font-size: 16px; color: var(--t2); line-height: 1.5;
  max-width: 420px; margin-bottom: 32px;
}
.lp-hero-actions {
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 20px; flex-wrap: wrap;
}
.lp-btn-hero {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--t1); color: #070709;
  font-size: 13px; font-weight: 700;
  padding: 13px 22px; border-radius: 8px;
  text-decoration: none; white-space: nowrap;
  transition: opacity .15s, transform .1s;
}
.lp-btn-hero:hover { opacity: .88; transform: translateY(-1px); }
.lp-btn-ghost {
  font-size: 13px; color: var(--t3); text-decoration: none; transition: color .15s;
}
.lp-btn-ghost:hover { color: var(--t1); }
.lp-hero-meta {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; color: var(--t3);
}
.lp-meta-sep { color: rgba(255,255,255,.12); }

/* ── Mock panel ─────────────────────────────────────────────────────────────── */
.lp-hero-right { display: flex; align-items: center; justify-content: center; }
.lp-mock {
  width: 100%; max-width: 460px;
  background: #0B0B0E;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 12px; overflow: hidden;
  box-shadow: 0 0 0 1px rgba(255,255,255,.04) inset, 0 32px 80px rgba(0,0,0,.65);
  animation: lp-fadein .5s ease;
}
.lp-mock-topbar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  background: rgba(255,255,255,.025);
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.lp-mock-traffic { display: flex; align-items: center; gap: 5px; }
.lp-mock-dot-r, .lp-mock-dot-y, .lp-mock-dot-g {
  width: 10px; height: 10px; border-radius: 50%; display: block;
}
.lp-mock-dot-r { background: #FF5F57; }
.lp-mock-dot-y { background: #FEBC2E; }
.lp-mock-dot-g { background: #28C840; }
.lp-mock-title {
  flex: 1; font-size: 11px; font-weight: 600; color: var(--t3); letter-spacing: .02em;
}
.lp-mock-live {
  font-size: 9px; font-weight: 700; letter-spacing: .1em; color: var(--green);
  animation: lp-blink 1.8s ease-in-out infinite;
  display: flex; align-items: center; gap: 4px;
}
.lp-mock-live::before {
  content: '';
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--green);
  animation: lp-pulse-dot 1.8s ease-in-out infinite;
  flex-shrink: 0;
}
.lp-mock-body { padding: 16px; display: flex; flex-direction: column; gap: 0; }
.lp-mock-input-row {
  display: grid; grid-template-columns: 1fr auto; gap: 10px; margin-bottom: 14px;
}
.lp-mock-cell {
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
  border-radius: 7px; padding: 10px 12px;
  display: flex; flex-direction: column; gap: 4px;
}
.lp-mock-cell-sm { min-width: 80px; align-items: flex-end; }
.lp-mock-cell-lbl {
  font-size: 9px; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: var(--t3);
}
.lp-mock-cell-val { font-size: 13px; font-weight: 600; color: var(--t1); }
.lp-mock-cell-sub { font-size: 9px; color: var(--t3); margin-top: 1px; }
.lp-mock-odd { font-size: 24px; font-weight: 900; letter-spacing: -0.03em; }
.lp-mock-rule { height: 1px; background: rgba(255,255,255,.06); margin: 10px 0; }
.lp-mock-score-wrap { margin-top: 4px; }
.lp-mock-score-hdr {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
}
.lp-mock-score-lbl {
  font-size: 9px; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: var(--t3);
}
.lp-mock-risk-tag {
  font-size: 9px; font-weight: 800; letter-spacing: .1em;
  color: var(--orange); background: rgba(249,115,22,.1);
  border: 1px solid rgba(249,115,22,.25); padding: 3px 9px; border-radius: 4px;
}
.lp-mock-score-row { display: flex; align-items: center; gap: 14px; }
.lp-mock-score-num {
  font-size: 52px; font-weight: 900; color: var(--orange);
  line-height: 1; letter-spacing: -0.04em; flex-shrink: 0;
}
.lp-mock-bar-wrap { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.lp-mock-bar-track {
  position: relative; height: 5px;
  background: rgba(255,255,255,.07); border-radius: 99px; overflow: visible;
}
.lp-mock-bar-fill {
  height: 100%; width: 67%; border-radius: 99px;
  background: linear-gradient(90deg, var(--amber) 0%, var(--orange) 100%);
  animation: lp-bar-grow .9s .4s ease-out both;
}
.lp-mock-bar-tick {
  position: absolute; top: -3px; width: 1px; height: 11px;
  background: rgba(255,255,255,.18); transform: translateX(-50%);
}
.lp-mock-bar-labels {
  display: flex; justify-content: space-between;
  font-size: 9px; color: rgba(255,255,255,.22);
  font-weight: 600; letter-spacing: .03em; text-transform: uppercase;
}
.lp-mock-session {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 10px; margin-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,.05);
}
.lp-mock-session-id {
  font-size: 9px; font-weight: 800; letter-spacing: .14em;
  color: rgba(34,197,94,.65); text-transform: uppercase;
}
.lp-mock-session-ts {
  font-size: 9px; color: var(--t3);
}
.lp-mock-data-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 1px; background: rgba(255,255,255,.06);
  border-radius: 6px; overflow: hidden; margin-bottom: 0;
}
.lp-mock-dc {
  display: flex; flex-direction: column; gap: 3px;
  padding: 9px 10px; background: #0B0B0E;
}
.lp-mock-dk {
  font-size: 8px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: var(--t3);
}
.lp-mock-dv {
  font-size: 14px; font-weight: 800; letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums; font-feature-settings: 'tnum';
}
.lp-mock-dv-g { color: #22C55E; }
.lp-mock-dv-a { color: #F59E0B; }
.lp-mock-dv-r { color: #EF4444; }
.lp-mock-score-left {
  display: flex; align-items: flex-end; gap: 2px; flex-shrink: 0;
}
.lp-mock-score-denom {
  font-size: 16px; font-weight: 700; color: var(--t3);
  line-height: 1; margin-bottom: 10px; letter-spacing: -0.02em;
}
.lp-mock-prob-split {
  display: flex; height: 4px; border-radius: 99px; overflow: hidden;
  margin: 12px 0 4px; gap: 1px;
}
.lp-mock-prob-win  { width: 35.7%; background: var(--green); border-radius: 99px 0 0 99px; }
.lp-mock-prob-lose { flex: 1; background: var(--red); border-radius: 0 99px 99px 0; }
.lp-mock-prob-labels {
  display: flex; justify-content: space-between; margin-bottom: 8px;
}
.lp-mock-prob-lbl {
  font-size: 9px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
}
.lp-mock-prob-w { color: var(--green); }
.lp-mock-prob-l { color: var(--red); }
.lp-mock-verdict {
  display: flex; align-items: center; gap: 8px;
  margin-top: 10px; padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,.05);
}
.lp-mock-verdict-badge {
  font-size: 8px; font-weight: 800; letter-spacing: .12em;
  color: var(--orange); background: rgba(249,115,22,.08);
  border: 1px solid rgba(249,115,22,.22); padding: 3px 8px; border-radius: 4px;
}
.lp-mock-verdict-detail { font-size: 10px; color: var(--t3); }
.lp-mock-footer {
  padding: 8px 16px; font-size: 10px; color: var(--t3); text-align: center;
  background: rgba(255,255,255,.015); border-top: 1px solid rgba(255,255,255,.05);
}

/* ── Problema ───────────────────────────────────────────────────────────────── */
.lp-problem { padding: 80px 0; }
.lp-problem-text {
  font-size: 16px; color: var(--t2); line-height: 1.7;
  max-width: 540px; margin-bottom: 12px;
}
.lp-problem-text-em {
  color: var(--t1); font-weight: 500; margin-bottom: 40px;
}
.lp-compare {
  display: grid; grid-template-columns: 1fr 1fr;
  border: 1px solid var(--border); border-radius: 14px; overflow: hidden;
}
.lp-compare-col { padding: 28px 24px; display: flex; flex-direction: column; }
.lp-compare-show { background: rgba(255,255,255,.01); border-right: 1px solid var(--border); }
.lp-compare-hide { background: rgba(34,197,94,.025); }
.lp-compare-hdr {
  display: flex; align-items: center; gap: 9px;
  padding-bottom: 14px; border-bottom: 1px solid var(--border); margin-bottom: 14px;
}
.lp-compare-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.lp-compare-dot-dim   { background: var(--t3); }
.lp-compare-dot-green { background: var(--green); box-shadow: 0 0 7px rgba(34,197,94,.5); }
.lp-compare-title { font-size: 12px; font-weight: 700; color: var(--t1); }
.lp-compare-row {
  display: flex; align-items: baseline; gap: 10px;
  padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,.04);
}
.lp-compare-row:last-child { border-bottom: none; }
.lp-compare-icon { font-size: 11px; font-weight: 700; flex-shrink: 0; }
.lp-compare-text { font-size: 13px; color: var(--t2); line-height: 1.5; }

/* ── Dashboard ──────────────────────────────────────────────────────────────── */
.lp-dash { padding: 80px 0; background: var(--bg); }
.lp-dash-grid {
  display: grid; grid-template-columns: repeat(4,1fr); gap: 8px;
}
.lp-dash-card {
  background: rgba(255,255,255,.02); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px 16px;
  display: flex; flex-direction: column; gap: 8px; transition: border-color .18s;
}
.lp-dash-card:hover { border-color: var(--bmd); }
.lp-dash-card-num {
  font-size: clamp(20px, 2.8vw, 28px); font-weight: 900; line-height: 1; letter-spacing: -0.04em;
}
.lp-dash-card-label {
  font-size: 10px; font-weight: 700; color: var(--t3);
  letter-spacing: .05em; text-transform: uppercase; line-height: 1.3;
}
.lp-dash-mini-bar {
  height: 3px; background: rgba(255,255,255,.06);
  border-radius: 99px; overflow: hidden;
}
.lp-dash-mini-fill { height: 100%; border-radius: 99px; opacity: 0.7; }
.lp-dash-card-desc { font-size: 12px; color: var(--t3); line-height: 1.65; }

/* ── Steps ──────────────────────────────────────────────────────────────────── */
.lp-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 48px; }
.lp-step {
  background: rgba(255,255,255,.02); border: 1px solid var(--border);
  border-radius: 12px; padding: 24px 20px;
  display: flex; flex-direction: column; gap: 10px; transition: border-color .18s;
}
.lp-step:hover { border-color: rgba(34,197,94,.2); }
.lp-step-n {
  font-size: 11px; font-weight: 900; color: rgba(34,197,94,.4);
  letter-spacing: .06em; font-family: 'Courier New', Courier, monospace;
}
.lp-step-title { font-size: 15px; font-weight: 800; color: var(--t1); line-height: 1.3; letter-spacing: -0.02em; }
.lp-step-desc  { font-size: 13px; color: var(--t2); line-height: 1.7; }

/* ── Positioning ────────────────────────────────────────────────────────────── */
.lp-position { padding: 80px 0; background: var(--bg); border-top: 1px solid var(--border); }
.lp-position-layout {
  display: grid; grid-template-columns: 1fr 320px; gap: 72px; align-items: start;
}
.lp-position-points { display: flex; flex-direction: column; gap: 14px; margin-top: 28px; margin-bottom: 28px; }
.lp-position-pt { display: flex; gap: 12px; align-items: center; }
.lp-position-pt-icon { font-size: 14px; color: rgba(34,197,94,.35); flex-shrink: 0; }
.lp-position-pt-title { font-size: 14px; font-weight: 600; color: var(--t2); }
.lp-position-bottom {
  font-size: 15px; color: var(--t1); font-weight: 500;
  line-height: 1.6; padding-top: 20px; border-top: 1px solid var(--border);
}
.lp-position-quote {
  background: rgba(255,255,255,.025); border: 1px solid var(--border);
  border-left: 3px solid rgba(34,197,94,.3);
  border-radius: 0 10px 10px 0;
  padding: 22px 22px 20px; margin: 0 0 16px;
}
.lp-position-quote-text {
  font-size: 15px; font-style: italic;
  color: var(--t1); line-height: 1.65; letter-spacing: -0.01em; margin: 0;
}

/* founder photo inside positioning */
.lp-founder-photo-wrap {
  display: flex; flex-direction: column; gap: 0; position: relative;
  margin-bottom: 20px;
}
.lp-founder-photo-wrap::after {
  content: '';
  position: absolute; inset: 0;
  background:
    linear-gradient(to right, transparent 58%, var(--bg) 96%),
    linear-gradient(to bottom, transparent 72%, var(--bg) 100%);
  pointer-events: none; z-index: 1;
}
.lp-founder-img {
  width: 100%; height: auto; display: block;
  aspect-ratio: 4/5; object-fit: cover; object-position: top center;
  border-radius: 2px;
  filter: grayscale(100%) contrast(1.35) brightness(0.82) saturate(0);
  mask-image: radial-gradient(
    ellipse 92% 96% at 50% 20%,
    black 28%, rgba(0,0,0,.92) 48%, rgba(0,0,0,.48) 72%, transparent 92%
  );
  -webkit-mask-image: radial-gradient(
    ellipse 92% 96% at 50% 20%,
    black 28%, rgba(0,0,0,.92) 48%, rgba(0,0,0,.48) 72%, transparent 92%
  );
}
.lp-founder-caption {
  display: flex; flex-direction: column; gap: 2px;
  padding-top: 12px; margin-top: 12px;
  border-top: 1px solid var(--border);
  position: relative; z-index: 2;
}
.lp-founder-caption-name  { font-size: 12px; font-weight: 700; color: var(--t1); }
.lp-founder-caption-role  { font-size: 11px; color: var(--t3); }

/* ── Testimonials ───────────────────────────────────────────────────────────── */
.lp-testimonials {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
}
.lp-testimonial {
  background: rgba(255,255,255,.018); border: 1px solid var(--border);
  border-radius: 10px; padding: 20px;
  display: flex; flex-direction: column; gap: 12px;
}
.lp-test-text {
  font-size: 14px; color: var(--t1); line-height: 1.65;
  font-style: italic; margin: 0; flex: 1;
}
.lp-test-name { font-size: 12px; color: var(--t3); }

/* ── Pricing ────────────────────────────────────────────────────────────────── */
.lp-pricing-sub {
  font-size: 15px; color: var(--t2); line-height: 1.75; max-width: 480px; margin-bottom: 40px;
}
.lp-pricing { display: grid; grid-template-columns: 1fr 300px; gap: 64px; align-items: start; }
.lp-features-list {
  list-style: none; display: flex; flex-direction: column; gap: 14px; padding: 0; margin: 0;
}
.lp-feature-item {
  display: flex; gap: 12px; font-size: 14px; color: var(--t2); align-items: center;
  padding: 4px 0;
}
.lp-feature-check { color: var(--green); font-weight: 700; flex-shrink: 0; }
.lp-feature-tilt {
  color: var(--t1) !important;
  background: rgba(34,197,94,.05);
  border: 1px solid rgba(34,197,94,.18);
  border-radius: 8px; padding: 10px 12px;
  margin: 4px -12px; font-weight: 600;
}
.lp-feature-tilt .lp-feature-check { font-size: 13px; }
.lp-price-card {
  position: sticky; top: 72px;
  background: rgba(255,255,255,.025); border: 1px solid var(--bmd);
  border-radius: 14px; padding: 28px 24px;
  display: flex; flex-direction: column; gap: 14px; text-align: center;
  box-shadow: 0 24px 64px rgba(0,0,0,.3);
}
.lp-price-eyebrow {
  font-size: 10px; font-weight: 700; letter-spacing: .16em;
  color: var(--green); text-transform: uppercase;
}
.lp-price-display {
  display: flex; align-items: flex-start; justify-content: center; gap: 3px; line-height: 1;
}
.lp-price-curr { font-size: 18px; font-weight: 700; color: var(--t2); padding-top: 12px; }
.lp-price-int  { font-size: 76px; font-weight: 900; color: var(--t1); line-height: 1; letter-spacing: -0.05em; }
.lp-price-note { font-size: 12px; color: var(--t3); }
.lp-btn-buy {
  display: block; background: var(--t1); color: #070709;
  font-size: 13px; font-weight: 700; padding: 13px 20px; border-radius: 8px;
  text-decoration: none; text-align: center; transition: opacity .15s, transform .1s;
}
.lp-btn-buy:hover { opacity: .88; transform: translateY(-1px); }
.lp-btn-buy-lg { display: inline-block; font-size: 14px; padding: 15px 28px; }
.lp-guarantee {
  display: flex; align-items: flex-start; gap: 10px;
  background: rgba(34,197,94,.04); border: 1px solid rgba(34,197,94,.14);
  border-radius: 9px; padding: 12px 13px; text-align: left;
}
.lp-guarantee-icon {
  width: 18px; height: 18px; border-radius: 50%;
  background: rgba(34,197,94,.12); color: var(--green);
  font-size: 9px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
}
.lp-guarantee-title { font-size: 12px; font-weight: 700; color: var(--t1); margin-bottom: 2px; }
.lp-guarantee-sub   { font-size: 11px; color: var(--t2); line-height: 1.5; }

/* ── FAQ ────────────────────────────────────────────────────────────────────── */
.lp-faq { display: flex; flex-direction: column; margin-top: 8px; }
.lp-faq-item {
  border-bottom: 1px solid var(--border); padding: 18px 0; cursor: pointer; user-select: none;
}
.lp-faq-q {
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  font-size: 14px; font-weight: 600; color: var(--t1); transition: color .15s;
}
.lp-faq-open .lp-faq-q { color: var(--green); }
.lp-faq-icon { font-size: 18px; color: var(--t3); flex-shrink: 0; }
.lp-faq-a { font-size: 13px; color: var(--t2); line-height: 1.75; margin-top: 11px; }

/* ── CTA Final ──────────────────────────────────────────────────────────────── */
.lp-cta-final {
  position: relative; text-align: center; overflow: hidden;
  background: var(--bg); padding: 88px 0;
  border-top: 1px solid var(--border);
}
.lp-cta-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 60% 80% at 50% 100%, black 20%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 60% 80% at 50% 100%, black 20%, transparent 75%);
}
.lp-cta-inner {
  position: relative; z-index: 1; max-width: 560px;
  display: flex; flex-direction: column; align-items: center; gap: 20px;
}
.lp-cta-h2 {
  font-size: clamp(32px, 5vw, 54px); font-weight: 900;
  color: var(--t1); line-height: 1.06; letter-spacing: -0.04em;
}
.lp-cta-dim  { color: rgba(232,232,230,.22); }
.lp-cta-sub  { font-size: 15px; color: var(--t2); max-width: 400px; line-height: 1.6; }
.lp-cta-actions {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.lp-cta-alt-link {
  font-size: 12px; color: var(--t3); text-decoration: none;
  transition: color .15s; text-align: center;
}
.lp-cta-alt-link:hover { color: var(--t1); }
.lp-cta-trust {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  justify-content: center; font-size: 12px; color: var(--t3);
}
.lp-cta-disclaimer {
  font-size: 11px; color: var(--t3); line-height: 1.65;
  border-top: 1px solid var(--border); padding-top: 20px; max-width: 400px;
}

/* ── Mobile 1024px ──────────────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .lp-hero-layout { grid-template-columns: 1fr; gap: 44px; padding-top: 56px; padding-bottom: 56px; }
  .lp-hero-left { align-items: center; text-align: center; }
  .lp-hero-desc { max-width: none; }
  .lp-hero-actions { justify-content: center; }
  .lp-hero-meta { justify-content: center; }
  .lp-hero-right { max-width: 460px; width: 100%; margin: 0 auto; }
  .lp-dash-grid { grid-template-columns: repeat(2, 1fr); }
  .lp-position-layout { grid-template-columns: 1fr; gap: 48px; }
  .lp-pricing { grid-template-columns: 1fr; gap: 40px; }
  .lp-price-card { position: static; }
  .lp-testimonials { grid-template-columns: repeat(2, 1fr); }
  .lp-founder-img { aspect-ratio: 5/4; }
}

/* ── Mobile 768px ───────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .lp-section, .lp-problem, .lp-dash, .lp-position { padding: 56px 0; }
  .lp-container { padding: 0 18px; }
  .lp-nav { display: none; }
  .lp-hero { min-height: unset; }
  .lp-steps { grid-template-columns: 1fr; }
  .lp-compare { grid-template-columns: 1fr; }
  .lp-compare-show { border-right: none; border-bottom: 1px solid var(--border); }
  .lp-testimonials { grid-template-columns: 1fr; }
  .lp-cta-final { padding: 64px 0; }
  .lp-founder-img { aspect-ratio: 3/2; }
}

/* ── Mobile 480px ───────────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .lp-h1 { font-size: clamp(34px, 9.5vw, 52px); }
  .lp-hero-sub { font-size: clamp(16px, 5vw, 20px); }
  .lp-hero-desc { font-size: 14px; margin-bottom: 24px; }
  .lp-hero-layout { gap: 0; padding-top: 44px; padding-bottom: 44px; }
  .lp-hero-right { display: none; }
  .lp-hero-actions { flex-direction: column; align-items: stretch; width: 100%; }
  .lp-btn-hero { justify-content: center; }
  .lp-btn-ghost { text-align: center; }
  .lp-dash-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
  .lp-dash-card { padding: 14px 12px; }
  .lp-dash-card-num { font-size: 20px; }
  .lp-compare-col { padding: 16px 14px; }
  .lp-mock-input-row { grid-template-columns: 1fr; }
  .lp-section-eyebrow { margin-bottom: 8px; }
  .lp-h2 { margin-bottom: 8px; }
  .lp-h2-narrow { margin-bottom: 24px; }
  .lp-problem-text { font-size: 14px; }
  .lp-problem-text-em { margin-bottom: 28px; }
  .lp-cta-actions { width: 100%; }
  .lp-btn-buy-lg { width: 100%; text-align: center; }
  .lp-cta-final { padding: 56px 0; }
  .lp-pricing-sub { margin-bottom: 24px; font-size: 14px; }
  .lp-founder-img { aspect-ratio: 4/3; }
  .lp-steps { gap: 8px; margin-bottom: 32px; }
  .lp-step { padding: 18px 16px; }
  .lp-feature-tilt { margin: 4px -4px; }
}
`;
