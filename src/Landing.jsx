import { useState } from "react";
import { LegalBar, Footer } from "./Layout";
import { Link } from "./router";

// ─── Dados ─────────────────────────────────────────────────────────────────────

const ANALISA = [
  { n: "01", title: "Probabilidade implícita",  desc: "Quanto a odd revela sobre a chance real do evento acontecer — calculado instantaneamente." },
  { n: "02", title: "Margem da casa (vig)",      desc: "A taxa invisível embutida em toda odd. Você nunca vê, mas sempre paga." },
  { n: "03", title: "Exposição ao risco",        desc: "Score 0–100 que resume o nível de risco real da aposta com base na matemática da odd." },
  { n: "04", title: "Chance de perda",           desc: "Estimativa educativa da probabilidade de perder calculada a partir dos dados da odd." },
  { n: "05", title: "Leitura preventiva com IA", desc: "Análise contextual: pontos cegos, cenário necessário e leitura conservadora antes de qualquer decisão." },
];

const TESTIMONIALS = [
  { name: "Ricardo M.", age: 34, city: "São Paulo",      text: "Tomei um susto quando vi o número. Achava que só precisava acertar o jogo, mas a casa já come uma parte antes mesmo de começar." },
  { name: "Ana C.",     age: 28, city: "Belo Horizonte", text: "Fiz a análise de uma aposta que achava certeira, odd 1.50. Deu 66% de chance de perder e eu travei. Não apostei. Perdi mesmo." },
  { name: "Felipe S.",  age: 41, city: "Rio de Janeiro", text: "Tava em dia horrível, 3 perdas seguidas. Fui analisar uma 'recuperação' e o sistema sinalizou risco alto. Parei. Isso vale mais que qualquer dica." },
  { name: "Mariana T.", age: 25, city: "Curitiba",       text: "Não é mágica, não promete nada. É uma lupa em cima do que você vai fazer. Simples assim — uso antes de qualquer decisão agora." },
  { name: "Gustavo R.", age: 37, city: "Porto Alegre",   text: "Coloquei meu padrão de aposta no simulador. Projeção de 30 dias: negativo. Óbvio quando você vê na tela. Impossível de ver sozinho." },
  { name: "Cássia F.",  age: 44, city: "Salvador",       text: "Mostrei ao meu marido a projeção com o que ele apostava por semana. Ele fechou o computador, ficou quieto um minuto. Semana seguinte havia parado." },
];

const FEATURES = [
  "20 análises incluídas no pacote inicial",
  "Score de Risco MotorIA™ (0–100) por análise",
  "Probabilidade implícita calculada na hora",
  "Margem da casa (vig) decodificada por mercado",
  "Simulador de bankroll — projeção 30 e 90 dias",
  "Detector de tilt — alerta comportamental de risco",
  "8 indicadores matemáticos por análise completa",
  "Relatório com pontos cegos e leitura conservadora",
  "Recarregável — +20 análises por R$27 quando precisar",
];

const FAQ_ITEMS = [
  { q: "Funciona para qualquer esporte?",          a: "Sim. A análise se baseia na matemática da odd, que é universal — futebol, basquete, tênis, MMA, eSports e qualquer mercado com odds." },
  { q: "Vocês são uma casa de aposta?",            a: "Não. Somos uma ferramenta educativa independente. Não fazemos apostas, não vendemos odds e não temos nenhuma relação com casas de aposta." },
  { q: "É assinatura mensal?",                     a: "Não. Você compra um pacote de 20 análises por R$27. Sem renovação automática, sem mensalidade. Quando usar tudo, recarregue por mais R$27 quando precisar." },
  { q: "Vocês dão palpites ou previsões?",         a: "Nunca. Mostramos riscos, probabilidades matemáticas e impacto financeiro. A decisão é sempre sua." },
  { q: "Como recebo o acesso após o pagamento?",   a: "Imediatamente. Após o pagamento confirmado, você recebe o link de acesso no email de confirmação." },
  { q: "Funciona no celular?",                     a: "Sim. A ferramenta é 100% mobile-first, feita para usar antes de qualquer decisão, de onde você estiver." },
  { q: "E se eu já tenho problemas com jogo?",     a: "Procure ajuda imediatamente. Acesse jogoresponsavel.com.br ou ligue para o CVV: 188. Problema com jogo é sério e tem tratamento." },
  { q: "Como funciona a garantia?",                a: "7 dias corridos a partir da compra. Não achou útil? Basta enviar um email e devolvemos 100% sem perguntas." },
];

const AVATAR_PALETTES = [
  { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)",   color: "#22c55e" },
  { bg: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.25)",  color: "#818cf8" },
  { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  color: "#f59e0b" },
  { bg: "rgba(244,114,182,0.1)", border: "rgba(244,114,182,0.25)", color: "#f472b6" },
  { bg: "rgba(45,212,191,0.1)",  border: "rgba(45,212,191,0.25)",  color: "#2dd4bf" },
  { bg: "rgba(251,146,60,0.1)",  border: "rgba(251,146,60,0.25)",  color: "#fb923c" },
];

// ─── Componentes ───────────────────────────────────────────────────────────────

function Avatar({ name, index }) {
  const p = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
  const initials = (name.split(" ")[0][0] + (name.split(" ")[1]?.[0] ?? "")).toUpperCase();
  return (
    <div className="lp-avatar" style={{ background: p.bg, border: `1px solid ${p.border}`, color: p.color }}>
      {initials}
    </div>
  );
}

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

// ─── Landing ───────────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <>
      <style>{CSS}</style>
      <LegalBar />

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <div className="lp-logo">
            <div className="lp-logo-mark">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="#050505" stroke="none"/>
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

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-noise"   aria-hidden="true" />
        <div className="lp-hero-grid"    aria-hidden="true" />
        <div className="lp-hero-glow"    aria-hidden="true" />
        <div className="lp-hero-glow-2"  aria-hidden="true" />
        <div className="lp-hero-vignette" aria-hidden="true" />

        <div className="lp-container lp-hero-layout">

          {/* LEFT */}
          <div className="lp-hero-left">
            <div className="lp-tag-pill">
              <span className="lp-tag-dot" />
              Análise matemática de risco em odds
            </div>

            <h1 className="lp-h1">
              As plataformas<br />
              mostram o retorno.<br />
              <em className="lp-h1-em">Nunca o risco real.</em>
            </h1>

            <p className="lp-hero-sub">
              Probabilidade implícita, margem oculta e chance
              real de perda — calculadas antes de qualquer decisão.
            </p>

            <div className="lp-hero-actions">
              <Link to="/pagar" className="lp-btn-hero">
                Garantir acesso — R$27
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <a href="#como-funciona" className="lp-btn-text">Ver como funciona</a>
            </div>

            <div className="lp-hero-stats">
              <div className="lp-hstat">
                <div className="lp-hstat-val">8</div>
                <div className="lp-hstat-key">indicadores por análise</div>
              </div>
              <div className="lp-hstat-sep" />
              <div className="lp-hstat">
                <div className="lp-hstat-val">&lt;60s</div>
                <div className="lp-hstat-key">resultado completo</div>
              </div>
              <div className="lp-hstat-sep" />
              <div className="lp-hstat">
                <div className="lp-hstat-val">0</div>
                <div className="lp-hstat-key">cadastro necessário</div>
              </div>
            </div>
          </div>

          {/* RIGHT — photo */}
          <div className="lp-hero-right">
            <div className="lp-photo-frame">
              <div className="lp-photo-glow" aria-hidden="true" />
              {/* AVIF → WebP → PNG fallback; fetchpriority=high = LCP candidate */}
              <picture>
                <source
                  type="image/avif"
                  srcSet="/jean-analise-480.avif 480w, /jean-analise-960.avif 960w"
                  sizes="(max-width: 960px) 440px, 480px"
                />
                <source
                  type="image/webp"
                  srcSet="/jean-analise-480.webp 480w, /jean-analise-960.webp 960w"
                  sizes="(max-width: 960px) 440px, 480px"
                />
                <img
                  src="/jean-analise-960.webp"
                  alt="Jean Lucca — criador do MotorIA Pro"
                  className="lp-photo-img"
                  width="960"
                  height="1200"
                  fetchpriority="high"
                  decoding="async"
                  onError={(e) => { e.currentTarget.closest(".lp-photo-frame").classList.add("lp-photo-empty"); }}
                />
              </picture>

              {/* Cinematic overlay — blends photo edges into dark background */}
              <div className="lp-photo-overlay" aria-hidden="true" />

              {/* Floating score card */}
              <div className="lp-float-score">
                <div className="lp-float-label">SCORE DE RISCO</div>
                <div className="lp-float-score-row">
                  <div className="lp-float-num">64</div>
                  <div className="lp-float-right">
                    <div className="lp-float-badge">ALTO</div>
                    <div className="lp-float-bar">
                      <div className="lp-float-bar-fill" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating metrics */}
              <div className="lp-float-metrics">
                <div className="lp-float-metric">
                  <div className="lp-float-metric-val lp-c-amber">5,5%</div>
                  <div className="lp-float-metric-key">margem</div>
                </div>
                <div className="lp-float-metric-sep" />
                <div className="lp-float-metric">
                  <div className="lp-float-metric-val lp-c-red">64%</div>
                  <div className="lp-float-metric-key">perda</div>
                </div>
              </div>
            </div>

            {/* Author quote */}
            <div className="lp-author">
              <div className="lp-author-line" />
              <div className="lp-author-content">
                <p className="lp-author-quote">
                  "Parei de perguntar qual era a melhor odd.<br />
                  Comecei a perguntar qual era o risco real."
                </p>
                <div className="lp-author-id">Jean Lucca · Criador do MotorIA Pro</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── DATA STRIP ───────────────────────────────────────────────────────── */}
      <div className="lp-data-strip">
        <div className="lp-container lp-data-inner">
          <div className="lp-data-item">
            <span className="lp-data-num lp-c-amber">5,5%</span>
            <span className="lp-data-desc">da aposta vai para a casa — invisível, em toda odd</span>
          </div>
          <div className="lp-data-sep" />
          <div className="lp-data-item">
            <span className="lp-data-num lp-c-red">64%</span>
            <span className="lp-data-desc">de chance de perda em odds 2.80 que parecem "atraentes"</span>
          </div>
          <div className="lp-data-sep" />
          <div className="lp-data-item">
            <span className="lp-data-num lp-c-red">−R$412</span>
            <span className="lp-data-desc">projeção em 30 dias apostando 5× por semana nesse perfil</span>
          </div>
        </div>
      </div>

      {/* ── O PROBLEMA ───────────────────────────────────────────────────────── */}
      <section className="lp-section" id="problema">
        <div className="lp-container">
          <div className="lp-section-eyebrow">O problema</div>
          <div className="lp-problem-layout">
            <div className="lp-problem-left">
              <h2 className="lp-h2">
                Você vê o retorno.<br />
                Nunca a chance real<br />
                de perder.
              </h2>
              <p className="lp-problem-body">
                As plataformas mostram odds, retorno possível e lucro potencial.
                Mas nunca explicam a probabilidade implícita, a margem da casa
                e a exposição ao risco — os números que realmente importam
                antes de qualquer decisão.
              </p>
              <div className="lp-problem-points">
                {[
                  "Odd 2.80 parece atraente. A plataforma só mostra o retorno.",
                  "A margem embutida torna o valor esperado estruturalmente negativo.",
                  "64% de chance de perda — nenhuma plataforma calcula isso.",
                ].map((pt, i) => (
                  <div className="lp-problem-pt" key={i}>
                    <span className="lp-problem-pt-icon">—</span>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-problem-right">
              <div className="lp-pcard">
                <div className="lp-pcard-hdr">
                  <div className="lp-pcard-hdr-dot lp-pcard-dot-green" />
                  <span className="lp-pcard-hdr-label lp-c-green">O que a plataforma mostra</span>
                </div>
                {[
                  ["Retorno se ganhar",  "+R$280,00", "green"],
                  ["Lucro possível",     "R$180,00",  "green"],
                  ["Odd do evento",      "2.80",      "muted"],
                ].map(([l, v, c]) => (
                  <div className="lp-pcard-row" key={l}>
                    <span className="lp-pcard-row-lbl">{l}</span>
                    <span className={`lp-pcard-row-val lp-c-${c}`}>{v}</span>
                  </div>
                ))}
                <div className="lp-pcard-divider" />
                <div className="lp-pcard-hdr">
                  <div className="lp-pcard-hdr-dot lp-pcard-dot-red" />
                  <span className="lp-pcard-hdr-label lp-c-red">O que ela esconde</span>
                </div>
                {[
                  ["Probabilidade implícita", "35,7%",    "red"  ],
                  ["Margem da casa (vig)",    "5,5%",     "amber"],
                  ["Chance de perda",         "64,3%",    "red"  ],
                  ["Valor esperado (EV)",     "−R$14,50", "red"  ],
                ].map(([l, v, c]) => (
                  <div className="lp-pcard-row" key={l}>
                    <span className="lp-pcard-row-lbl">{l}</span>
                    <span className={`lp-pcard-row-val lp-c-${c}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── O QUE ANALISA ────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-dark">
        <div className="lp-container">
          <div className="lp-section-eyebrow">O que o MotorIA Pro analisa</div>
          <h2 className="lp-h2 lp-h2-narrow">
            5 dimensões de risco.<br />Em menos de 60 segundos.
          </h2>
          <div className="lp-analisa-list">
            {ANALISA.map((item, i) => (
              <div className="lp-analisa-row" key={item.n}>
                <div className="lp-analisa-n">{item.n}</div>
                <div className="lp-analisa-content">
                  <div className="lp-analisa-title">{item.title}</div>
                  <div className="lp-analisa-desc">{item.desc}</div>
                </div>
                {i < ANALISA.length - 1 && <div className="lp-analisa-sep" />}
              </div>
            ))}
          </div>
          <div className="lp-analisa-cta">
            <Link to="/pagar" className="lp-btn-hero">
              Quero ver o risco das minhas apostas
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────────────────────── */}
      <section className="lp-section" id="como-funciona">
        <div className="lp-container">
          <div className="lp-section-eyebrow">Como funciona</div>
          <h2 className="lp-h2 lp-h2-narrow">Três etapas.<br />Menos de um minuto.</h2>
          <div className="lp-steps">
            {[
              { n: "01", title: "Insira a odd e o contexto",         desc: "Informe o jogo, tipo de aposta, odd e valor pretendido. Quanto mais contexto, mais precisa a leitura.",         tags: ["Evento", "Odd", "Tipo", "Valor"] },
              { n: "02", title: "A IA calcula a exposição ao risco",  desc: "Probabilidade implícita, margem da casa, valor esperado e pontos cegos — calculados automaticamente.",           tags: ["Score 0–100", "Probabilidade", "EV", "Margem"] },
              { n: "03", title: "Receba a leitura preventiva",        desc: "Relatório estruturado com cenário necessário, pontos cegos e leitura conservadora — antes de qualquer decisão.", tags: ["Pontos cegos", "Chance de perda", "Leitura final"] },
            ].map((s) => (
              <div className="lp-step" key={s.n}>
                <div className="lp-step-n">{s.n}</div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
                <div className="lp-step-tags">
                  {s.tags.map((t) => <span className="lp-step-tag" key={t}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <Link to="/pagar" className="lp-btn-hero">
              Entender o risco antes de decidir
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ──────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-dark">
        <div className="lp-container">
          <div className="lp-section-eyebrow">Usuários</div>
          <h2 className="lp-h2 lp-h2-narrow">Decisões mais conscientes.</h2>
          {/* Featured */}
          <div className="lp-test-featured">
            <div className="lp-test-featured-quote">
              "{TESTIMONIALS[4].text}"
            </div>
            <div className="lp-test-featured-author">
              <Avatar name={TESTIMONIALS[4].name} index={4} />
              <div>
                <div className="lp-test-featured-name">{TESTIMONIALS[4].name}, {TESTIMONIALS[4].age} anos</div>
                <div className="lp-test-featured-city">{TESTIMONIALS[4].city}</div>
              </div>
            </div>
          </div>
          {/* Grid */}
          <div className="lp-testimonials">
            {TESTIMONIALS.filter((_, i) => i !== 4).map((t, i) => (
              <div className="lp-testimonial" key={i}>
                <div className="lp-test-stars">★★★★★</div>
                <p className="lp-test-text">"{t.text}"</p>
                <div className="lp-test-author">
                  <Avatar name={t.name} index={i} />
                  <div>
                    <div className="lp-test-name-row">
                      <strong>{t.name}</strong>, {t.age} anos
                      <span className="lp-test-verified">✓ verificado</span>
                    </div>
                    <span className="lp-test-city">{t.city}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇO ────────────────────────────────────────────────────────────── */}
      <section className="lp-section" id="preco">
        <div className="lp-container">
          <div className="lp-section-eyebrow">Acesso completo</div>
          <h2 className="lp-h2 lp-h2-narrow">Menos do que uma aposta perdida.</h2>
          <p className="lp-pricing-sub">
            Uma análise que custa R$27 pode te fazer entender por que você perde
            muito mais do que isso toda semana.
          </p>
          <div className="lp-pricing">
            <ul className="lp-features-list">
              {FEATURES.map((f, i) => (
                <li className="lp-feature-item" key={i}>
                  <span className="lp-feature-check">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="lp-price-card">
              <div className="lp-price-card-glow" aria-hidden="true" />
              <div className="lp-price-eyebrow">Pacote de 20 análises</div>
              <div className="lp-price-display">
                <span className="lp-price-curr">R$</span>
                <span className="lp-price-int">27</span>
              </div>
              <p className="lp-price-note">20 análises incluídas. Recarregável por R$27 quando quiser.</p>
              <Link to="/pagar" className="lp-btn-buy">
                Garantir acesso imediato →
              </Link>
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

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-dark">
        <div className="lp-container" style={{ maxWidth: 680 }}>
          <div className="lp-section-eyebrow">Dúvidas</div>
          <h2 className="lp-h2 lp-h2-narrow">Perguntas frequentes.</h2>
          <div className="lp-faq">
            {FAQ_ITEMS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────────── */}
      <section className="lp-cta-final">
        <div className="lp-cta-glow"  aria-hidden="true" />
        <div className="lp-cta-grid"  aria-hidden="true" />
        <div className="lp-container lp-cta-inner">
          <div className="lp-tag-pill" style={{ marginBottom: 32 }}>Ferramenta educativa · +18</div>
          <h2 className="lp-cta-h2">
            Entender o risco<br />
            <span className="lp-cta-h2-dim">antes de decidir.</span>
          </h2>
          <p className="lp-cta-sub">20 análises por R$27. Recarregável quando precisar.</p>
          <div className="lp-cta-actions">
            <Link to="/pagar" className="lp-btn-buy lp-btn-buy-lg">Garantir acesso por R$27 →</Link>
          </div>
          <div className="lp-cta-trust">
            <span>Sem cadastro para testar</span>
            <span className="lp-cta-dot">·</span>
            <span>Garantia de 7 dias</span>
            <span className="lp-cta-dot">·</span>
            <span>Não é casa de aposta</span>
          </div>
          <p className="lp-cta-disclaimer">
            Ferramenta educativa. Não garante resultados. Não incentiva apostas.
            Uso recomendado apenas para maiores de 18 anos.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}

// ─── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
/* ── Reset ─────────────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

/* ── Tokens ─────────────────────────────────────────────────────────────────── */
:root {
  --bg:        #050505;
  --bg-2:      #080809;
  --border:    rgba(255,255,255,0.07);
  --border-md: rgba(255,255,255,0.11);
  --grid:      rgba(255,255,255,0.025);
  --t1: #EBEBEB;
  --t2: #8A8A8A;
  --t3: #525252;
  --green: #22c55e;
  --red:   #ef4444;
  --amber: #f59e0b;
}

/* Colour utilities */
.lp-c-green { color: var(--green); }
.lp-c-red   { color: var(--red);   }
.lp-c-amber { color: var(--amber); }
.lp-c-muted { color: var(--t2);    }

/* Number rendering */
[class*="lp-c-green"],
[class*="lp-c-red"],
[class*="lp-c-amber"],
[class*="lp-data-num"],
[class*="lp-float-num"],
[class*="lp-price-int"],
[class*="lp-hstat-val"] {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

/* ── Layout ──────────────────────────────────────────────────────────────────── */
.lp-container { max-width: 1080px; margin: 0 auto; padding: 0 28px; }
.lp-section   { padding: 112px 0; }
.lp-section-dark { background: var(--bg-2); }

/* Section eyebrow */
.lp-section-eyebrow {
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--green); margin-bottom: 18px;
}

/* Headline scale */
.lp-h2 {
  font-size: clamp(26px, 4vw, 44px);
  font-weight: 900; color: var(--t1);
  line-height: 1.12; letter-spacing: -0.035em;
  margin-bottom: 16px;
}
.lp-h2-narrow { max-width: 520px; margin-bottom: 48px; }

/* ── Keyframes ───────────────────────────────────────────────────────────────── */
@keyframes glowPulse {
  0%, 100% { opacity: .6; }
  50%       { opacity: 1; }
}
@keyframes floatIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Header ──────────────────────────────────────────────────────────────────── */
.lp-header {
  position: sticky; top: 0; z-index: 200;
  background: rgba(5,5,5,.94);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--border);
}
.lp-header-inner {
  max-width: 1080px; margin: 0 auto; padding: 0 28px;
  height: 56px;
  display: flex; align-items: center; justify-content: space-between; gap: 32px;
}
.lp-logo { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
.lp-logo-mark {
  width: 26px; height: 26px; border-radius: 7px;
  background: var(--green); color: #050505;
  display: flex; align-items: center; justify-content: center;
}
.lp-logo-name {
  font-size: 14px; font-weight: 800;
  color: var(--t1); letter-spacing: -0.025em;
}
.lp-nav { display: flex; align-items: center; gap: 28px; }
.lp-nav-link {
  font-size: 13px; color: var(--t3); text-decoration: none;
  transition: color .15s; white-space: nowrap;
}
.lp-nav-link:hover { color: var(--t1); }
.lp-nav-cta {
  font-size: 12px; font-weight: 700; white-space: nowrap;
  color: var(--t1); text-decoration: none;
  border: 1px solid var(--border-md);
  padding: 7px 16px; border-radius: 8px;
  transition: all .15s; background: rgba(255,255,255,.03);
  flex-shrink: 0;
}
.lp-nav-cta:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.18); }

/* ── Hero ────────────────────────────────────────────────────────────────────── */
.lp-hero {
  position: relative; overflow: hidden;
  background: var(--bg);
  padding: 0;
  min-height: calc(100vh - 56px);
  display: flex; align-items: center;
}
.lp-hero-grid {
  position: absolute; inset: 0;
  /* Dot grid — more editorial, less "AI template" than line grids */
  background-image: radial-gradient(circle, rgba(255,255,255,.06) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse 80% 85% at 50% 0%, black 45%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 80% 85% at 50% 0%, black 45%, transparent 100%);
  pointer-events: none; z-index: 0;
}
.lp-hero-glow {
  /* Centered on photo column — creates "halo" behind the founder's photo */
  position: absolute; top: -8%; right: 0%;
  width: 640px; height: 640px;
  background: radial-gradient(circle, rgba(34,197,94,.11) 0%, rgba(34,197,94,.03) 48%, transparent 68%);
  pointer-events: none; z-index: 0;
  animation: glowPulse 6s ease-in-out infinite;
  filter: blur(1px);
}
.lp-hero-glow-2 {
  position: absolute; bottom: -15%; left: -4%;
  width: 480px; height: 480px;
  background: radial-gradient(circle, rgba(99,102,241,.05) 0%, transparent 65%);
  pointer-events: none; z-index: 0;
  animation: glowPulse 8s 2s ease-in-out infinite;
  filter: blur(6px);
}
.lp-hero-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 110% 100% at 50% 50%, transparent 35%, rgba(5,5,5,.5) 100%);
  pointer-events: none; z-index: 0;
}
.lp-hero-noise {
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none; z-index: 0; opacity: .4;
}
.lp-hero-layout {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: 1fr 440px;
  gap: 88px; align-items: center;
  padding-top: 80px; padding-bottom: 80px;
}
.lp-hero-left { display: flex; flex-direction: column; }

/* Tag pill */
.lp-tag-pill {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 9px; font-weight: 700; letter-spacing: .17em;
  text-transform: uppercase; color: rgba(34,197,94,.75);
  border: 1px solid rgba(34,197,94,.16);
  background: rgba(34,197,94,.04);
  padding: 5px 12px; border-radius: 99px;
  margin-bottom: 28px; align-self: flex-start;
}
.lp-tag-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 6px rgba(34,197,94,.8);
}

/* H1 */
.lp-h1 {
  font-size: clamp(46px, 7vw, 90px);
  font-weight: 900; color: var(--t1);
  line-height: 0.97; letter-spacing: -0.052em;
  margin-bottom: 28px;
}
.lp-h1-em {
  font-style: normal;
  color: rgba(235,235,235,.3);
  display: block;
  margin-top: 4px; /* slight detach from lines 1-2 — creates tension */
}

/* Sub */
.lp-hero-sub {
  font-size: 15px; color: var(--t3);
  line-height: 1.72; max-width: 400px;
  margin-bottom: 40px;
  letter-spacing: 0.006em;
}

/* Actions */
.lp-hero-actions { display: flex; align-items: center; gap: 16px; margin-bottom: 48px; flex-wrap: wrap; }
.lp-btn-hero {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--t1); color: #050505;
  font-size: 13px; font-weight: 700;
  padding: 12px 22px; border-radius: 10px;
  text-decoration: none; white-space: nowrap;
  transition: opacity .15s, transform .12s;
  box-shadow: 0 1px 0 rgba(255,255,255,.15) inset;
}
.lp-btn-hero:hover { opacity: .88; transform: translateY(-1px); }
.lp-btn-text {
  font-size: 13px; color: var(--t3); text-decoration: none;
  transition: color .15s;
}
.lp-btn-text:hover { color: var(--t1); }

/* Stats */
.lp-hero-stats { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }
.lp-hstat { display: flex; flex-direction: column; gap: 3px; }
.lp-hstat-val {
  font-size: 18px; font-weight: 900; color: var(--t1);
  letter-spacing: -0.035em; line-height: 1;
}
.lp-hstat-key { font-size: 10px; color: var(--t3); letter-spacing: 0.01em; }
.lp-hstat-sep { width: 1px; height: 28px; background: rgba(255,255,255,.06); flex-shrink: 0; }

/* ── Photo frame ─────────────────────────────────────────────────────────────── */
.lp-hero-right { display: flex; flex-direction: column; gap: 24px; }
.lp-photo-frame {
  position: relative;
  border-radius: 20px;
  overflow: visible;
}
/* <picture> is inline by default — must be block to give <img> a proper containing block */
.lp-photo-frame picture {
  display: block;
  width: 100%;
  position: relative;
  z-index: 1;
}
.lp-photo-glow {
  position: absolute; top: 18%; left: 50%;
  transform: translate(-50%, -50%);
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(34,197,94,.2) 0%, rgba(34,197,94,.06) 48%, transparent 70%);
  filter: blur(64px);
  pointer-events: none; z-index: 0;
  animation: glowPulse 7s ease-in-out infinite;
}
.lp-photo-img {
  width: 100%; display: block;
  border-radius: 16px;
  object-fit: cover; object-position: top center;
  aspect-ratio: 4/5;
  box-shadow: 0 28px 72px rgba(0,0,0,.55);
}
/*
  Cinematic overlay: left-edge fade + bottom fade — sem mask no <img>,
  o overlay faz todo o trabalho de fundir a foto no fundo escuro.
*/
.lp-photo-overlay {
  position: absolute; inset: 0; z-index: 2;
  border-radius: 16px;
  background:
    linear-gradient(100deg, rgba(5,5,5,.55) 0%, rgba(5,5,5,.12) 20%, transparent 38%),
    linear-gradient(to bottom, transparent 30%, rgba(5,5,5,.25) 52%, rgba(5,5,5,.65) 72%, rgba(5,5,5,.97) 100%);
  pointer-events: none;
}
.lp-photo-empty .lp-photo-img { display: none; }
.lp-photo-empty {
  min-height: 300px;
  background: rgba(255,255,255,.02);
  border: 1px solid var(--border);
  border-radius: 16px;
}

/* Floating score card */
.lp-float-score {
  position: absolute; z-index: 10;
  bottom: 36px; left: -28px;
  background: rgba(7,7,9,.88);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 14px; padding: 14px 16px;
  min-width: 162px;
  box-shadow: 0 20px 56px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06);
  animation: floatIn .7s .1s ease both;
}
.lp-float-label {
  font-size: 8px; font-weight: 700; letter-spacing: .18em;
  color: var(--t3); text-transform: uppercase; margin-bottom: 10px;
}
.lp-float-score-row { display: flex; align-items: center; gap: 10px; }
.lp-float-num {
  font-size: 40px; font-weight: 900; color: #FF6B2E;
  line-height: 1; letter-spacing: -0.045em;
}
.lp-float-right { display: flex; flex-direction: column; gap: 7px; }
.lp-float-badge {
  font-size: 8px; font-weight: 800; letter-spacing: .08em;
  color: #FF6B2E; background: rgba(255,107,46,.1);
  border: 1px solid rgba(255,107,46,.22);
  padding: 3px 8px; border-radius: 4px; align-self: flex-start;
}
.lp-float-bar {
  width: 84px; height: 3px;
  background: rgba(255,255,255,.06);
  border-radius: 99px; overflow: hidden;
}
.lp-float-bar-fill {
  height: 100%; width: 64%;
  background: linear-gradient(90deg, #f59e0b 0%, #FF6B2E 100%);
  border-radius: 99px;
}

/* Floating metrics card */
.lp-float-metrics {
  position: absolute; z-index: 10;
  top: 24px; right: -24px;
  background: rgba(7,7,9,.88);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid rgba(255,255,255,.09);
  border-left: 1px solid rgba(34,197,94,.14); /* green accent edge */
  border-radius: 12px; padding: 12px 16px;
  display: flex; align-items: center; gap: 14px;
  box-shadow: 0 12px 36px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.05);
  animation: floatIn .7s .25s ease both;
}
.lp-float-metric { display: flex; flex-direction: column; gap: 3px; align-items: center; }
.lp-float-metric-val {
  font-size: 17px; font-weight: 900;
  line-height: 1; letter-spacing: -0.03em;
}
.lp-float-metric-key { font-size: 8px; color: var(--t3); font-weight: 600; letter-spacing: .04em; }
.lp-float-metric-sep { width: 1px; height: 26px; background: rgba(255,255,255,.07); }

/* Author quote */
.lp-author { display: flex; gap: 14px; align-items: flex-start; }
.lp-author-line {
  width: 1px; flex-shrink: 0; border-radius: 99px;
  background: linear-gradient(to bottom, rgba(34,197,94,.7), transparent);
  min-height: 56px;
}
.lp-author-content { display: flex; flex-direction: column; gap: 7px; }
.lp-author-quote {
  font-size: 13px; color: var(--t2);
  line-height: 1.75; font-style: italic; margin: 0;
  letter-spacing: 0.01em;
}
.lp-author-id { font-size: 10px; color: var(--t3); font-weight: 600; letter-spacing: .03em; }

/* ── Data strip ───────────────────────────────────────────────────────────────── */
.lp-data-strip {
  background: var(--bg-2);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 40px 0;
}
.lp-data-inner {
  display: flex; align-items: stretch; justify-content: center;
  flex-wrap: wrap;
}
.lp-data-item {
  display: flex; align-items: center; gap: 18px;
  padding: 16px 48px; flex: 1; min-width: 240px;
  transition: background .18s;
  cursor: default;
}
.lp-data-item:hover { background: rgba(255,255,255,.015); }
.lp-data-num {
  font-size: 40px; font-weight: 900;
  line-height: 1; flex-shrink: 0;
  letter-spacing: -0.04em;
}
.lp-data-desc { font-size: 13px; color: var(--t2); line-height: 1.55; }
.lp-data-sep {
  width: 1px; background: var(--border);
  flex-shrink: 0; align-self: stretch;
}

/* ── Problem ─────────────────────────────────────────────────────────────────── */
.lp-problem-layout {
  display: grid; grid-template-columns: 1fr 380px;
  gap: 64px; align-items: start;
}
.lp-problem-body {
  font-size: 15px; color: var(--t2);
  line-height: 1.82; margin-bottom: 28px; max-width: 480px;
}
.lp-problem-points { display: flex; flex-direction: column; gap: 14px; }
.lp-problem-pt {
  display: flex; gap: 12px;
  font-size: 14px; color: var(--t3); line-height: 1.65;
}
.lp-problem-pt-icon { color: var(--green); font-weight: 700; flex-shrink: 0; }

/* Problem card */
.lp-pcard {
  background: rgba(255,255,255,.02);
  border: 1px solid var(--border);
  border-radius: 16px; padding: 0;
  overflow: hidden;
}
.lp-pcard-hdr {
  display: flex; align-items: center; gap: 9px;
  padding: 14px 18px;
}
.lp-pcard-hdr-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.lp-pcard-dot-green { background: var(--green); box-shadow: 0 0 8px rgba(34,197,94,.5); }
.lp-pcard-dot-red   { background: var(--red);   box-shadow: 0 0 8px rgba(239,68,68,.5); }
.lp-pcard-hdr-label { font-size: 11px; font-weight: 700; letter-spacing: .04em; }
.lp-pcard-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 11px 18px;
  border-top: 1px solid var(--border);
  transition: background .15s;
}
.lp-pcard-row:hover { background: rgba(255,255,255,.02); }
.lp-pcard-row-lbl { font-size: 13px; color: var(--t3); }
.lp-pcard-row-val {
  font-size: 14px; font-weight: 800;
  letter-spacing: -0.02em; white-space: nowrap;
  min-width: 70px; text-align: right;
}
.lp-pcard-divider { height: 1px; background: var(--border-md); margin: 4px 0; }

/* ── Analisa list ─────────────────────────────────────────────────────────────── */
.lp-analisa-list {
  display: flex; flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 16px; overflow: hidden;
  margin-bottom: 48px;
}
.lp-analisa-row {
  display: grid; grid-template-columns: 56px 1fr;
  gap: 0; position: relative;
  padding: 24px 28px;
  border-bottom: 1px solid var(--border);
  transition: background .18s, box-shadow .18s;
}
.lp-analisa-row:last-child { border-bottom: none; }
.lp-analisa-row:hover {
  background: rgba(34,197,94,.03);
  box-shadow: inset 3px 0 0 rgba(34,197,94,.35);
}
.lp-analisa-n {
  font-size: 12px; font-weight: 800;
  color: rgba(34,197,94,.4); letter-spacing: .06em;
  padding-top: 2px;
}
.lp-analisa-content { display: flex; flex-direction: column; gap: 5px; }
.lp-analisa-title {
  font-size: 15px; font-weight: 700;
  color: var(--t1); letter-spacing: -0.015em;
}
.lp-analisa-desc { font-size: 13px; color: var(--t2); line-height: 1.65; }
.lp-analisa-cta { text-align: center; }

/* ── Steps ───────────────────────────────────────────────────────────────────── */
.lp-steps {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 16px; margin-bottom: 48px;
}
.lp-step {
  background: rgba(255,255,255,.02);
  border: 1px solid var(--border);
  border-radius: 16px; padding: 28px 24px;
  display: flex; flex-direction: column; gap: 12px;
  transition: border-color .2s, transform .2s;
}
.lp-step:hover { border-color: rgba(34,197,94,.2); transform: translateY(-2px); }
.lp-step-n {
  font-size: 11px; font-weight: 900;
  color: rgba(34,197,94,.4); letter-spacing: .06em;
}
.lp-step-title {
  font-size: 16px; font-weight: 800;
  color: var(--t1); line-height: 1.25; letter-spacing: -0.02em;
}
.lp-step-desc { font-size: 13px; color: var(--t2); line-height: 1.72; }
.lp-step-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.lp-step-tag {
  font-size: 10px; font-weight: 600; color: var(--t3);
  border: 1px solid rgba(255,255,255,.06); border-radius: 99px;
  padding: 3px 9px; background: rgba(255,255,255,.02);
}

/* ── Testimonials ─────────────────────────────────────────────────────────────── */
.lp-test-featured {
  background: rgba(255,255,255,.025);
  border: 1px solid var(--border-md);
  border-radius: 16px; padding: 32px 36px;
  margin-bottom: 20px;
}
.lp-test-featured-quote {
  font-size: clamp(16px, 2.5vw, 20px); font-weight: 500;
  color: var(--t1); line-height: 1.65;
  font-style: italic; margin-bottom: 24px;
  letter-spacing: -0.01em;
}
.lp-test-featured-author { display: flex; align-items: center; gap: 14px; }
.lp-test-featured-name { font-size: 14px; font-weight: 700; color: var(--t1); }
.lp-test-featured-city { font-size: 12px; color: var(--t3); }
.lp-testimonials {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px,1fr));
  gap: 12px; margin-top: 0;
}
.lp-testimonial {
  background: rgba(255,255,255,.018);
  border: 1px solid var(--border);
  border-radius: 14px; padding: 22px;
  display: flex; flex-direction: column; gap: 14px;
  transition: border-color .2s;
}
.lp-testimonial:hover { border-color: var(--border-md); }
.lp-test-stars  { font-size: 11px; color: var(--amber); letter-spacing: 2px; }
.lp-test-text   { font-size: 13px; color: var(--t2); line-height: 1.72; font-style: italic; margin: 0; }
.lp-test-author { display: flex; align-items: center; gap: 11px; }
.lp-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; flex-shrink: 0;
}
.lp-test-name-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.lp-test-name-row strong { font-size: 13px; color: var(--t1); }
.lp-test-verified {
  font-size: 9px; font-weight: 700; color: var(--green);
  background: rgba(34,197,94,.07); border: 1px solid rgba(34,197,94,.18);
  padding: 1px 7px; border-radius: 99px;
}
.lp-test-city { font-size: 11px; color: var(--t3); }

/* ── Pricing ─────────────────────────────────────────────────────────────────── */
.lp-pricing-sub {
  font-size: 15px; color: var(--t2);
  line-height: 1.78; max-width: 480px; margin-bottom: 48px;
}
.lp-pricing { display: grid; grid-template-columns: 1fr 300px; gap: 64px; align-items: start; }
.lp-features-list {
  list-style: none; display: flex; flex-direction: column; gap: 16px;
  padding: 0; margin: 0;
}
.lp-feature-item {
  display: flex; gap: 12px; font-size: 15px; color: var(--t2); align-items: baseline;
  padding: 6px 8px; border-radius: 8px; margin: 0 -8px;
  transition: background .15s, color .15s;
}
.lp-feature-item:hover { background: rgba(255,255,255,.025); color: var(--t1); }
.lp-feature-check { color: var(--green); font-weight: 700; flex-shrink: 0; }
.lp-price-card {
  position: sticky; top: 72px;
  background: rgba(255,255,255,.025);
  border: 1px solid var(--border-md);
  border-radius: 20px; padding: 32px 28px;
  display: flex; flex-direction: column; gap: 16px;
  text-align: center;
  box-shadow: 0 32px 80px rgba(0,0,0,.3);
  overflow: hidden;
}
.lp-price-card-glow {
  position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
  width: 240px; height: 160px;
  background: radial-gradient(ellipse, rgba(34,197,94,.12) 0%, transparent 70%);
  pointer-events: none; z-index: 0;
}
.lp-price-eyebrow {
  position: relative; z-index: 1;
  font-size: 10px; font-weight: 700; letter-spacing: .16em;
  color: var(--green); text-transform: uppercase;
}
.lp-price-display {
  position: relative; z-index: 1;
  display: flex; align-items: flex-start; justify-content: center;
  gap: 3px; line-height: 1;
}
.lp-price-curr {
  font-size: 20px; font-weight: 700;
  color: var(--t2); padding-top: 14px; line-height: 1;
}
.lp-price-int {
  font-size: 84px; font-weight: 900;
  color: var(--t1); line-height: 1;
  letter-spacing: -0.05em;
}
.lp-price-note { position: relative; z-index: 1; font-size: 12px; color: var(--t3); }
.lp-btn-buy {
  position: relative; z-index: 1;
  display: block;
  background: var(--t1); color: #050505;
  font-size: 13px; font-weight: 700;
  padding: 14px 20px; border-radius: 10px;
  text-decoration: none; text-align: center;
  transition: opacity .15s, transform .12s;
  box-shadow: 0 1px 0 rgba(255,255,255,.15) inset;
}
.lp-btn-buy:hover { opacity: .88; transform: translateY(-1px); }
.lp-btn-buy-lg { font-size: 14px; padding: 16px 28px; }
.lp-guarantee {
  position: relative; z-index: 1;
  display: flex; align-items: flex-start; gap: 12px;
  background: rgba(34,197,94,.04); border: 1px solid rgba(34,197,94,.14);
  border-radius: 10px; padding: 13px 14px; text-align: left;
}
.lp-guarantee-icon {
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(34,197,94,.12); color: var(--green);
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.lp-guarantee-title { font-size: 12px; font-weight: 700; color: var(--t1); margin-bottom: 3px; }
.lp-guarantee-sub   { font-size: 11px; color: var(--t2); line-height: 1.5; }

/* ── FAQ ─────────────────────────────────────────────────────────────────────── */
.lp-faq { display: flex; flex-direction: column; margin-top: 8px; }
.lp-faq-item {
  border-bottom: 1px solid var(--border);
  padding: 18px 0; cursor: pointer; user-select: none;
}
.lp-faq-q {
  display: flex; justify-content: space-between;
  align-items: center; gap: 16px;
  font-size: 15px; font-weight: 600; color: var(--t1);
  transition: color .15s;
}
.lp-faq-open .lp-faq-q { color: var(--green); }
.lp-faq-icon { font-size: 18px; color: var(--t3); flex-shrink: 0; }
.lp-faq-a { font-size: 14px; color: var(--t2); line-height: 1.75; margin-top: 12px; }

/* ── CTA Final ───────────────────────────────────────────────────────────────── */
.lp-cta-final {
  position: relative; text-align: center;
  overflow: hidden; background: var(--bg);
  padding: 120px 0;
}
.lp-cta-glow {
  position: absolute; bottom: -80px; left: 50%; transform: translateX(-50%);
  width: 800px; height: 500px;
  background: radial-gradient(ellipse, rgba(34,197,94,.08) 0%, transparent 65%);
  pointer-events: none;
}
.lp-cta-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 70% 80% at 50% 100%, black 20%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 70% 80% at 50% 100%, black 20%, transparent 80%);
  pointer-events: none;
}
.lp-cta-inner {
  position: relative; z-index: 1;
  max-width: 600px; display: flex;
  flex-direction: column; align-items: center; gap: 20px;
}
.lp-cta-h2 {
  font-size: clamp(36px, 6vw, 60px); font-weight: 900;
  color: var(--t1); line-height: 1.05; letter-spacing: -0.04em;
}
.lp-cta-h2-dim { color: rgba(235,235,235,.3); }
.lp-cta-sub { font-size: 15px; color: var(--t2); }
.lp-cta-actions { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.lp-btn-ghost-sm {
  font-size: 13px; color: var(--t3);
  text-decoration: underline; text-underline-offset: 3px;
  cursor: pointer; background: none; border: none;
  text-decoration-color: rgba(255,255,255,.15);
  transition: color .15s;
}
.lp-btn-ghost-sm:hover { color: var(--t2); }
.lp-cta-trust {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  justify-content: center; font-size: 12px; color: var(--t3);
}
.lp-cta-dot { color: rgba(255,255,255,.1); }
.lp-cta-disclaimer {
  font-size: 11px; color: var(--t3); line-height: 1.65;
  border-top: 1px solid var(--border);
  padding-top: 20px; max-width: 440px;
}

/* ── Mobile ──────────────────────────────────────────────────────────────────── */
@media (max-width: 960px) {
  .lp-hero-layout {
    grid-template-columns: 1fr;
    gap: 0; /* controlled by margin on hero-right below */
    padding-top: 56px; padding-bottom: 48px;
  }
  .lp-hero-left { align-items: center; text-align: center; }
  .lp-tag-pill { align-self: center; }
  .lp-hero-sub { max-width: none; }
  .lp-hero-actions { justify-content: center; }
  .lp-hero-stats { justify-content: center; }
  .lp-hero-right {
    max-width: 420px; margin: 44px auto 0; width: 100%;
  }
  /* Photo overlay: remove left-edge fade when centered */
  .lp-photo-overlay {
    background:
      linear-gradient(to bottom, transparent 30%, rgba(5,5,5,.25) 52%, rgba(5,5,5,.65) 72%, rgba(5,5,5,.97) 100%);
  }
  .lp-float-score { left: -12px; bottom: 28px; }
  .lp-float-metrics { right: -12px; top: 20px; }
  .lp-problem-layout { grid-template-columns: 1fr; gap: 40px; }
  .lp-pricing { grid-template-columns: 1fr; gap: 40px; }
  .lp-price-card { position: static; }
}
@media (max-width: 700px) {
  .lp-section { padding: 72px 0; }
  .lp-container { padding: 0 20px; }
  .lp-steps { grid-template-columns: 1fr; }
  .lp-nav { display: none; }
  .lp-data-inner { flex-direction: column; gap: 0; }
  .lp-data-sep { width: 80%; height: 1px; align-self: center; }
  .lp-data-item { justify-content: flex-start; padding: 20px 20px; min-width: 0; }
  .lp-testimonials { grid-template-columns: 1fr; }
  .lp-test-featured { padding: 22px 20px; }
  .lp-hero { min-height: unset; }
  /* Keep headline strong on mobile — don't shrink too much */
  .lp-h1 { font-size: clamp(40px, 11vw, 64px); letter-spacing: -0.048em; }
  .lp-cta-final { padding: 80px 0; }
  .lp-cta-h2 { font-size: clamp(32px, 9vw, 48px); }
  .lp-problem-layout { gap: 28px; }
  .lp-h2-narrow { margin-bottom: 32px; }
  .lp-pricing-sub { margin-bottom: 28px; }
  .lp-features-list { gap: 12px; }
  .lp-feature-item { font-size: 14px; }
  .lp-cta-trust { font-size: 11px; gap: 8px; }
  .lp-faq-q { font-size: 14px; }
  .lp-hero-right { max-width: 360px; }
}
@media (max-width: 480px) {
  .lp-float-score { left: 6px; bottom: 22px; min-width: 148px; }
  .lp-float-metrics { right: 6px; top: 16px; }
  .lp-float-num { font-size: 34px; }
  .lp-float-metric-val { font-size: 15px; }
  .lp-price-int { font-size: 68px; }
  .lp-data-num { font-size: 32px; }
  .lp-hero-actions { flex-direction: column; align-items: stretch; }
  .lp-btn-hero { justify-content: center; }
  .lp-analisa-row { padding: 18px 16px; }
  .lp-photo-overlay {
    background: linear-gradient(to bottom, transparent 30%, rgba(5,5,5,.3) 55%, rgba(5,5,5,.7) 75%, rgba(5,5,5,.97) 100%);
  }
}
`;
