import { useState, useEffect, useRef } from "react";
import { Footer } from "./Layout";
import { Link } from "./router";

// ─── Data ───────────────────────────────────────────────────────────────────────

const COMPARISON_SHOW = [
  "A odd e quanto você pode ganhar",
  "O lado bom da aposta",
  "O que a casa quer que você veja",
];

const COMPARISON_HIDE = [
  "Quantos % de chance você tem de verdade",
  "O quanto a casa já tirou antes de você ganhar",
  "Se a odd realmente tem valor",
  "Quanto custa essa aposta no longo prazo",
];

const DASH_CARDS = [
  { num: "64,3%", color: "#EF4444", label: "Chance de perder nessa aposta", bar: 64.3, desc: "Chance de perder nessa aposta" },
  { num: "67",    color: "#F97316", label: "Nota de risco",                  bar: 67,   desc: "Nota de risco (0 = tranquilo, 100 = armadilha)" },
  { num: "5,5%",  color: "#F59E0B", label: "Margem da casa",                 bar: 5.5,  desc: "A fatia que a casa já tirou antes de você ganhar qualquer coisa" },
  { num: "−R$14", color: "#EF4444", label: "Perda média por R$100",          bar: 61,   desc: "A cada R$100 apostado nessa odd, você perde R$14 no longo prazo" },
];

const STEPS = [
  { n: "01", title: "Cole sua odd",                    desc: "Informe a odd que você tá de olho e o tipo de aposta. 10 segundos." },
  { n: "02", title: "O MotorIA analisa",               desc: "A ferramenta abre os números que a casa esconde — probabilidade real, margem e nota de risco." },
  { n: "03", title: "Você decide com informação",      desc: "Se vale, você aposta com confiança. Se não vale, você economiza. Simples." },
];

const BEFORE_AFTER = [
  {
    before:      '"Ia entrar em qualquer jogo com odd acima de 2.0"',
    after:       '"Agora filtro pelo que o MotorIA aprova"',
    attribution: '— Rafael S., Rio de Janeiro',
  },
  {
    before:      '"Ia dobrar a aposta pra recuperar"',
    after:       '"Nota de risco estava em 78. Não dobrei."',
    attribution: '— Marcos V., Belo Horizonte',
  },
  {
    before:      '"Vi que tinha 64% de chance de perder. Fechei."',
    after:       '"Economizei R$200 só na primeira semana."',
    attribution: '— André M., São Paulo',
  },
];

const TESTIMONIALS = [
  { name: "Rafael S.",  city: "Rio de Janeiro",   context: "Apostador de futebol há 2 anos",    text: "Ia entrar pra recuperar o loss.\nA análise mostrou risco alto.\nFechei o app." },
  { name: "André M.",   city: "São Paulo",         context: "Apostador há 3 anos",               text: "Achava que odd baixa era segura.\nAgora olho diferente." },
  { name: "Felipe T.",  city: "Curitiba",          context: "Apostador de fim de semana",         text: "Não me prometeu green.\nSó me fez pensar antes de clicar." },
  { name: "Marcos V.",  city: "Belo Horizonte",    context: "Apostador recreativo",               text: "Eu ia apostar no impulso.\nA nota de risco me travou." },
];

const FEATURES = [
  { text: "20 análises completas (sem mensalidade)", sub: "→ Precisa de mais? Recarregue por R$9,90 a qualquer momento." },
  { text: "Nota de risco instantânea por aposta" },
  { text: "Probabilidade real em segundos" },
  { text: "Margem escondida da casa revelada" },
  { text: "Controle de Banca: ROI, saldo e sequência de perdas em tempo real" },
  { text: 'Alerta de tilt — avisa antes de você entrar em modo "recuperação"', tilt: true },
];

const BK_BANCA_FEATURES = [
  "Acompanhe saldo, lucro/prejuízo e ROI em tempo real",
  "Veja quanto da sua banca está em risco por entrada",
  "Identifique sequências de perdas antes de agir no impulso",
  "Registre suas entradas e entenda seus padrões",
  "Receba alertas quando a exposição estiver alta demais",
];

const FAQ_ITEMS = [
  {
    q: "Isso me ajuda a ganhar mais?",
    a: "Depende do que você faz com a informação. O MotorIA não garante lucro — ninguém garante isso de forma honesta. O que ele faz: mostra os números reais por trás de cada aposta. Se a odd tem valor, você vê. Se a casa tá te enganando, você vê também. Apostador que decide com informação toma decisão melhor.",
  },
  {
    q: "Como funciona na prática?",
    a: "Você informa a odd que tá analisando e o tipo de aposta. Em menos de 10 segundos, o MotorIA retorna a probabilidade real, a margem da casa, a nota de risco (0 a 100) e uma análise completa. Tudo no celular, sem precisar baixar nada.",
  },
  {
    q: "É palpite ou é análise?",
    a: "É análise matemática. Não damos palpite, não dizemos em quem apostar, não somos tipster. Mostramos o risco que a odd esconde — chance real de perder, margem da casa, impacto no longo prazo. Somos uma ferramenta educativa independente, sem relação com casas de aposta.",
  },
  {
    q: "É assinatura ou pagamento único?",
    a: "Pagamento único. R$27, uma vez, sem cobrar de novo. Sem mensalidade, sem fidelidade, sem surpresa na fatura.",
  },
  {
    q: "Funciona no celular?",
    a: "Sim. A ferramenta foi feita para o celular — pra usar antes de qualquer decisão, de onde você estiver. Sem baixar app.",
  },
  {
    q: "E se eu não gostar?",
    a: "Garantia de 7 dias sem perguntas. Se não achar útil por qualquer motivo, devolvemos 100% do valor. Basta entrar em contato.",
  },
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

/* ── Controle de Banca dashboard (static simulation) ─────────────────────── */
function BancaSection() {
  const [barVisible, setBarVisible] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setBarVisible(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const cards = [
    { label: "Saldo Atual",           val: "R$ 1.247,00", sub: "+R$ 247 desde o início",      color: "#22c55e", type: "money" },
    { label: "Lucro / Prejuízo",      val: "+R$ 247,00",  sub: "+24,7% sobre a banca inicial", color: "#22c55e", type: "money" },
    { label: "ROI",                   val: "+12,4%",       sub: "Últimas 30 entradas",          color: "#22c55e", type: "roi" },
    { label: "% da Banca em Risco",   val: "3,2%",         sub: "Dentro do limite seguro",      color: "#22c55e", type: "bar" },
    { label: "Sequência de Perdas",   val: "1",            sub: "Sem alerta ativo",             color: "#22c55e", type: "streak" },
    { label: "Total de Entradas",     val: "30",           sub: "Entradas registradas",         color: "#e8e8e6", type: "count" },
  ];

  return (
    <section className="lp-section lp-banca-section" id="controle-banca">
      <div className="lp-container">

        {/* Header */}
        <div className="lp-section-eyebrow">Controle de Banca</div>
        <h2 className="lp-h2 lp-h2-narrow">
          Risco também é<br />tamanho de entrada.
        </h2>
        <p className="lp-banca-sub">
          Uma análise boa não salva uma banca mal gerida. Mesmo uma entrada com boa
          leitura pode virar problema quando o valor exposto é alto demais.
        </p>

        {/* Dashboard simulado */}
        <div className="lp-bk-grid" ref={barRef}>
          {cards.map((c, i) => (
            <div className="lp-bk-card" key={i}>
              <div className="lp-bk-label">{c.label}</div>
              <div className="lp-bk-val" style={{ color: c.color }}>{c.val}</div>
              {c.type === "bar" ? (
                <>
                  <div className="lp-bk-pct-bar">
                    <div className="lp-bk-pct-zone lp-bk-zone-g" />
                    <div className="lp-bk-pct-zone lp-bk-zone-y" />
                    <div className="lp-bk-pct-zone lp-bk-zone-r" />
                    <div
                      className="lp-bk-pct-thumb"
                      style={{ left: `${barVisible ? 3.2 : 0}%`, transition: barVisible ? "left 1.1s cubic-bezier(.4,0,.2,1)" : "none" }}
                    />
                  </div>
                  <div className="lp-bk-bar-labels">
                    <span>0%</span><span>5%</span><span>10%</span><span>+</span>
                  </div>
                  <div className="lp-bk-sub">{c.sub}</div>
                </>
              ) : (
                <div className="lp-bk-sub">{c.sub}</div>
              )}
            </div>
          ))}
        </div>

        {/* Alerta dinâmico */}
        <div className="lp-bk-alert">
          <div className="lp-bk-alert-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 22h20L12 2z" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 9v5M12 17.5v.5" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="lp-bk-alert-text">
            <strong>Atenção à exposição:</strong> Você está na 3ª entrada consecutiva com exposição acima de 5%.
            Considere reduzir o tamanho da próxima entrada.
          </p>
        </div>

        {/* Feature list */}
        <ul className="lp-bk-features">
          {BK_BANCA_FEATURES.map((f, i) => (
            <li key={i} className="lp-bk-feature-row">
              <span className="lp-bk-check" aria-hidden="true">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

      </div>
    </section>
  );
}

function Stars() {
  return (
    <div className="lp-stars" aria-label="5 estrelas">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="#F59E0B" aria-hidden="true">
          <path d="M6 1l1.3 2.7L10 4.1 8 6l.5 2.9L6 7.5 3.5 8.9 4 6 2 4.1l2.7-.4L6 1z"/>
        </svg>
      ))}
    </div>
  );
}

// ─── Landing ────────────────────────────────────────────────────────────────────

export default function Landing() {
  useEffect(() => {
    const bar = document.getElementById('sticky-cta');
    const hero = document.querySelector('.lp-hero');
    const pricing = document.querySelector('#preco');
    if (!bar) return;
    function handleScroll() {
      const heroBottom = hero ? hero.getBoundingClientRect().bottom : 400;
      const pricingTop = pricing ? pricing.getBoundingClientRect().top : 99999;
      if (heroBottom < 0 && pricingTop > window.innerHeight) {
        bar.style.display = 'block';
      } else {
        bar.style.display = 'none';
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <style>{CSS}</style>

      {/* ── BARRA DE CONFIANÇA (substitui o banner de aviso no topo) ─────────── */}
      <div className="lp-trust-topbar">
        <span>✓ Pagamento único</span>
        <span className="lp-trust-sep" aria-hidden="true">·</span>
        <span>✓ Garantia de 7 dias</span>
        <span className="lp-trust-sep" aria-hidden="true">·</span>
        <span>✓ Funciona no celular</span>
      </div>

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
          <Link to="/app" className="lp-nav-cta">Ver análise grátis →</Link>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-grid" aria-hidden="true" />
        <div className="lp-container lp-hero-layout">

          {/* LEFT */}
          <div className="lp-hero-left">
            <h1 className="lp-h1">
              O problema não é<br />só a odd.
            </h1>
            <p className="lp-hero-sub">
              É quanto da sua banca você expõe nela.
            </p>
            <p className="lp-hero-desc">
              Analise o risco da entrada, controle sua banca e entenda quando uma aposta
              aparentemente boa pode comprometer seu saldo.
            </p>
            <div className="lp-hero-actions">
              <Link to="/app" className="lp-btn-hero">
                Ver análise agora
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <a href="#controle-banca" className="lp-btn-ghost">Entender como funciona ↓</a>
            </div>
            <div className="lp-hero-trust-row">
              Garantia de 7 dias
              <span className="lp-meta-sep">·</span>
              Sem mensalidade
              <span className="lp-meta-sep">·</span>
              Resultado em segundos
            </div>

            {/* Mini mock do card de resultado */}
            <div className="lp-hero-mock-card">
              <div className="lp-hmc-status">
                <span className="lp-hmc-icon">✅</span>
                <span className="lp-hmc-label">VALE APOSTAR</span>
              </div>
              <p className="lp-hmc-frase">"Os números favorecem essa entrada."</p>
              <div className="lp-hmc-divider" />
              <div className="lp-hmc-details">
                <span className="lp-hmc-row">Chance de ganhar: 58%</span>
                <span className="lp-hmc-row">Odd ideal: 1.72 · +22% de vantagem</span>
              </div>
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
                <span className="lp-mock-title">MotorIA · Análise de risco</span>
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
                    <span className="lp-mock-verdict-badge lp-mock-verdict-bad">PASSA LONGE</span>
                    <span className="lp-mock-verdict-detail">A casa levou vantagem nessa odd</span>
                  </div>
                </div>
              </div>
              <div className="lp-mock-footer">
                Isso é o que você vê em 10 segundos →
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
            A odd não te<br />conta tudo.
          </h2>
          <p className="lp-problem-text">
            Quando você vê uma odd de 2.10, parece que tá 50/50.<br />
            Mas não tá.
          </p>
          <p className="lp-problem-text lp-problem-text-em">
            A casa já embutiu a margem dela. E você não vê isso em lugar nenhum.
            O MotorIA abre o capô e mostra o que tá escondido.
          </p>
          <div className="lp-compare">
            <div className="lp-compare-col lp-compare-show">
              <div className="lp-compare-hdr">
                <span className="lp-compare-dot lp-compare-dot-dim" />
                <span className="lp-compare-title">Você só vê</span>
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
                <span className="lp-compare-title">O MotorIA mostra o resto</span>
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

      {/* ── 4 NÚMEROS ──────────────────────────────────────────────────────────── */}
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
          <p className="lp-dash-anchor">
            Esses números são gerados automaticamente quando você digita sua odd.
            Leva menos de 10 segundos.
          </p>
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
              Analisar minha aposta agora
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── O QUE MUDA (substitui "Nossa Posição") ─────────────────────────────── */}
      <section className="lp-section lp-before-after-section">
        <div className="lp-container">
          <div className="lp-section-eyebrow">O que muda</div>
          <h2 className="lp-h2 lp-h2-narrow">
            Quem analisa antes<br />aposta diferente.
          </h2>
          <p className="lp-ba-sub">
            Não porque parou de apostar. Porque parou de apostar no escuro.
          </p>
          <div className="lp-ba-grid">
            {BEFORE_AFTER.map((item, i) => (
              <div className="lp-ba-card" key={i}>
                <div className="lp-ba-block lp-ba-before">
                  <span className="lp-ba-tag">Antes</span>
                  <p className="lp-ba-text">{item.before}</p>
                </div>
                <div className="lp-ba-arrow" aria-hidden="true">↓</div>
                <div className="lp-ba-block lp-ba-after">
                  <span className="lp-ba-tag lp-ba-tag-after">Depois</span>
                  <p className="lp-ba-text">{item.after}</p>
                  {item.attribution && <span className="antes-depois-attribution">{item.attribution}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ────────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-dark">
        <div className="lp-container">
          <div className="lp-section-eyebrow">Quem usou</div>
          <h2 className="lp-h2 lp-h2-narrow">O que disseram.</h2>
          <div className="lp-user-count">
            <span className="lp-user-count-num">+847</span> apostadores já analisaram com o MotorIA Pro
          </div>
          <div className="lp-testimonials">
            {TESTIMONIALS.map((t, i) => (
              <div className="lp-testimonial" key={i}>
                <Stars />
                <p className="lp-test-text" style={{ whiteSpace: "pre-line" }}>"{t.text}"</p>
                <div className="lp-test-byline">
                  <span className="lp-test-name">— {t.name}, {t.city}</span>
                  <span className="lp-test-context">{t.context}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTROLE DE BANCA ──────────────────────────────────────────────────── */}
      <BancaSection />

      {/* ── PREÇO ──────────────────────────────────────────────────────────────── */}
      <section className="lp-section" id="preco">
        <div className="lp-container">
          <div className="lp-section-eyebrow">Acesso completo</div>
          <h2 className="lp-h2 lp-h2-narrow">Custa menos que uma aposta perdida.</h2>
          <p className="lp-pricing-sub">
            Por R$27 — menos do que você provavelmente perdeu na última aposta ruim —
            você nunca mais aposta sem saber o que está fazendo.
          </p>
          <div className="lp-pricing">
            <ul className="lp-features-list">
              {FEATURES.map((f, i) => (
                <li className={`lp-feature-item${f.tilt ? " lp-feature-tilt" : ""}`} key={i}>
                  <span className="lp-feature-check">{f.tilt ? "⚡" : "✓"}</span>
                  <span>
                    {f.text}
                    {f.sub && <span className="lp-feature-sub">{f.sub}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <div className="lp-price-card">
              <div className="lp-price-eyebrow">ACESSO IMEDIATO AO MOTORIA PRO</div>
              <div className="lp-price-includes">Análise de risco + Controle de Banca</div>
              <div className="lp-price-display">
                <span className="lp-price-old">R$47</span>
                <div className="lp-price-main">
                  <span className="lp-price-curr">R$</span>
                  <span className="lp-price-int">27</span>
                </div>
              </div>
              <div className="lp-price-today">Hoje apenas</div>

              {/* Urgência: barra de progresso */}
              <div className="lp-urgency">
                <div className="lp-urgency-hdr">
                  <span className="lp-urgency-icon">⚡</span>
                  <span className="lp-urgency-title">PREÇO DE LANÇAMENTO</span>
                </div>
                <div className="lp-urgency-bar-wrap">
                  <div className="lp-urgency-bar" style={{ width: "84.7%" }} />
                </div>
                <div className="lp-urgency-foot">
                  <span className="lp-urgency-count">847 / 1.000 usuários</span>
                  <span className="lp-urgency-after">Hoje R$27 → depois R$47</span>
                </div>
              </div>

              <div className="lp-price-payment-note">Pagamento único • Sem mensalidade</div>
              <p className="lp-price-note">Ativação imediata após o pagamento.</p>
              <Link to="/pagar" className="lp-btn-buy">Desbloquear agora →</Link>
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
            Sua próxima aposta<br />
            <span className="lp-cta-dim">merece mais que um palpite.</span>
          </h2>
          <p className="lp-cta-sub">Analise antes. Decida melhor.</p>
          <div className="lp-cta-actions">
            <Link to="/pagar" className="lp-btn-buy lp-btn-buy-lg">Garantir acesso por R$27 →</Link>
            <p className="cta-guarantee-text">Garantia de 7 dias — não gostou, devolvemos 100%.</p>
          </div>

          {/* Selos de confiança */}
          <div className="lp-trust-seals">
            <div className="lp-seal">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1" y="6" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M5 6V4a3 3 0 1 1 6 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Pagamento seguro
            </div>
            <div className="lp-seal">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Garantia de 7 dias
            </div>
            <div className="lp-seal">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Acesso em segundos
            </div>
            <div className="lp-seal">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="3" y="2" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M6 6h4M6 9h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Funciona no celular
            </div>
          </div>
        </div>
      </section>

      {/* ── STICKY CTA MOBILE ──────────────────────────────────────────────────── */}
      <div id="sticky-cta" className="sticky-cta-bar">
        <a href="#preco" className="sticky-cta-btn">
          Garantir acesso por R$27 →
        </a>
      </div>

      {/* ── RODAPÉ ─────────────────────────────────────────────────────────────── */}
      <footer className="lp-footer-custom">
        <div className="lp-container">
          <div className="lp-footer-legal">
            ⚠️ Ferramenta educativa de análise. Não é recomendação de aposta.
            Apostas envolvem risco financeiro real. Jogue com responsabilidade.
            Proibido para menores de 18 anos.{" "}
            <a href="https://www.jogoresponsavel.com.br" target="_blank" rel="noopener noreferrer">
              jogoresponsavel.com.br
            </a>
          </div>
          <div className="lp-footer-links">
            <span>© 2026 MotorIA Pro</span>
            <span className="lp-footer-sep">·</span>
            <a href="/termos">Termos de Uso</a>
            <span className="lp-footer-sep">·</span>
            <a href="/privacidade">Política de Privacidade</a>
            <span className="lp-footer-sep">·</span>
            <a href="mailto:suporte@motoriaopro.com.br">Contato</a>
          </div>
        </div>
      </footer>
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

/* ── Trust top bar ──────────────────────────────────────────────────────────── */
.lp-trust-topbar {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  background: #0f0f12; border-bottom: 1px solid var(--border);
  padding: 8px 20px;
  font-size: 11px; font-weight: 600; color: var(--t2); letter-spacing: .04em;
}
.lp-trust-sep { color: var(--t3); }

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
  font-size: 13px; font-weight: 500; color: var(--t2);
  text-decoration: none; transition: color .15s;
}
.lp-nav-link:hover { color: var(--t1); }
.lp-nav-cta {
  background: var(--green); color: #060607;
  font-size: 13px; font-weight: 800; padding: 8px 16px;
  border-radius: 8px; text-decoration: none; white-space: nowrap;
  letter-spacing: -.01em; transition: opacity .15s;
}
.lp-nav-cta:hover { opacity: .88; }

/* ── Hero ───────────────────────────────────────────────────────────────────── */
.lp-hero {
  position: relative; overflow: hidden;
  padding: 72px 0 80px; background: var(--bg);
}
.lp-hero-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent);
}
.lp-hero-layout {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 60px; align-items: center;
}
.lp-hero-left { display: flex; flex-direction: column; gap: 18px; }
.lp-h1 {
  font-size: clamp(36px, 5vw, 58px);
  font-weight: 900; color: var(--t1);
  line-height: 1.05; letter-spacing: -0.04em;
}
.lp-hero-sub {
  font-size: clamp(20px, 2.8vw, 28px);
  font-weight: 800; color: var(--green);
  letter-spacing: -0.025em; line-height: 1.2;
}
.lp-hero-desc {
  font-size: 16px; color: var(--t2); line-height: 1.6; max-width: 400px;
}
.lp-hero-actions { display: flex; flex-direction: column; gap: 10px; }
.lp-btn-hero {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--t1); color: var(--bg);
  font-size: 15px; font-weight: 800; letter-spacing: -.01em;
  padding: 14px 24px; border-radius: 10px; text-decoration: none;
  transition: opacity .15s; width: fit-content;
}
.lp-btn-hero:hover { opacity: .88; }
.lp-btn-ghost {
  font-size: 13px; font-weight: 600; color: var(--t2);
  text-decoration: none; transition: color .13s;
}
.lp-btn-ghost:hover { color: var(--t1); }
.lp-hero-trust-row {
  font-size: 11px; color: var(--t3); letter-spacing: .04em;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.lp-meta-sep { color: var(--t3); }

/* Mini mock card below CTA */
.lp-hero-mock-card {
  background: #0d2818; border: 1px solid rgba(29,185,84,.3);
  border-radius: 12px; padding: 16px;
  display: flex; flex-direction: column; gap: 8px;
  width: 100%; animation: lp-fadein .6s ease both .2s;
}
.lp-hmc-status { display: flex; align-items: center; gap: 8px; }
.lp-hmc-icon { font-size: 16px; line-height: 1; }
.lp-hmc-label {
  font-size: 13px; font-weight: 900; color: #1DB954;
  letter-spacing: .06em; text-transform: uppercase;
}
.lp-hmc-frase {
  font-size: 14px; color: #fff; font-style: italic; margin: 0; line-height: 1.5;
}
.lp-hmc-divider { height: 1px; background: #2a2a2a; }
.lp-hmc-details { display: flex; flex-direction: column; gap: 3px; }
.lp-hmc-row { font-size: 13px; color: #aaa; }

/* ── Mock panel ─────────────────────────────────────────────────────────────── */
.lp-hero-right { display: flex; justify-content: center; }
.lp-mock {
  background: #0C0C10; border: 1px solid rgba(255,255,255,.1);
  border-radius: 16px; width: 340px; overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,.5);
  animation: lp-fadein .7s ease both .1s;
}
.lp-mock-topbar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,.07);
  background: rgba(255,255,255,.025);
}
.lp-mock-traffic { display: flex; gap: 5px; align-items: center; }
.lp-mock-dot-r, .lp-mock-dot-y, .lp-mock-dot-g {
  width: 7px; height: 7px; border-radius: 50%;
}
.lp-mock-dot-r { background: #EF4444; }
.lp-mock-dot-y { background: #F59E0B; }
.lp-mock-dot-g { background: #22C55E; }
.lp-mock-title { font-size: 10px; color: rgba(255,255,255,.35); font-weight: 600; letter-spacing: .04em; flex: 1; }
.lp-mock-live {
  font-size: 7.5px; font-weight: 800; color: #22C55E;
  letter-spacing: .12em; animation: lp-blink 1.6s ease-in-out infinite;
}
.lp-mock-body { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.lp-mock-session { display: flex; align-items: center; justify-content: space-between; }
.lp-mock-session-id { font-size: 8.5px; font-weight: 800; letter-spacing: .12em; color: rgba(255,255,255,.35); }
.lp-mock-session-ts { font-size: 8.5px; color: rgba(255,255,255,.2); }
.lp-mock-input-row { display: flex; gap: 10px; }
.lp-mock-cell { flex: 1; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; }
.lp-mock-cell-sm { flex: 0 0 auto; min-width: 60px; }
.lp-mock-cell-lbl { font-size: 8px; font-weight: 700; letter-spacing: .1em; color: rgba(255,255,255,.28); }
.lp-mock-cell-val { font-size: 12px; font-weight: 700; color: var(--t1); }
.lp-mock-cell-sub { font-size: 9px; color: rgba(255,255,255,.35); }
.lp-mock-odd { font-size: 18px !important; font-weight: 800 !important; color: #22C55E !important; letter-spacing: -0.03em; }
.lp-mock-prob-split { display: flex; height: 6px; border-radius: 99px; overflow: hidden; gap: 2px; }
.lp-mock-prob-win { flex: 357; background: rgba(34,197,94,.55); border-radius: 99px 0 0 99px; }
.lp-mock-prob-lose { flex: 643; background: rgba(239,68,68,.55); border-radius: 0 99px 99px 0; }
.lp-mock-prob-labels { display: flex; justify-content: space-between; }
.lp-mock-prob-lbl { font-size: 8px; font-weight: 700; letter-spacing: .04em; }
.lp-mock-prob-w { color: rgba(34,197,94,.7); }
.lp-mock-prob-l { color: rgba(239,68,68,.7); }
.lp-mock-rule { height: 1px; background: rgba(255,255,255,.06); }
.lp-mock-data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.lp-mock-dc { display: flex; flex-direction: column; gap: 2px; }
.lp-mock-dk { font-size: 7.5px; font-weight: 700; letter-spacing: .08em; color: rgba(255,255,255,.28); }
.lp-mock-dv { font-size: 13px; font-weight: 800; letter-spacing: -0.02em; }
.lp-mock-dv-g { color: #22C55E; }
.lp-mock-dv-a { color: #F59E0B; }
.lp-mock-dv-r { color: #EF4444; }
.lp-mock-score-hdr { display: flex; align-items: center; justify-content: space-between; }
.lp-mock-score-lbl { font-size: 8px; font-weight: 700; letter-spacing: .1em; color: rgba(255,255,255,.28); }
.lp-mock-risk-tag { font-size: 7.5px; font-weight: 800; letter-spacing: .12em; color: #F97316; background: rgba(249,115,22,.1); padding: 2px 6px; border-radius: 4px; }
.lp-mock-score-row { display: flex; align-items: center; gap: 12px; }
.lp-mock-score-left { display: flex; align-items: baseline; gap: 2px; }
.lp-mock-score-num { font-size: 36px; font-weight: 900; color: #F97316; letter-spacing: -0.04em; line-height: 1; }
.lp-mock-score-denom { font-size: 12px; color: rgba(255,255,255,.3); }
.lp-mock-bar-wrap { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.lp-mock-bar-track { height: 6px; background: rgba(255,255,255,.06); border-radius: 99px; position: relative; overflow: hidden; }
.lp-mock-bar-fill { position: absolute; left: 0; top: 0; height: 100%; width: 67%; background: linear-gradient(90deg, #22C55E, #F59E0B 50%, #F97316); border-radius: 99px; animation: lp-bar-grow 1.2s ease both .4s; }
.lp-mock-bar-tick { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,.15); }
.lp-mock-bar-labels { display: flex; justify-content: space-between; }
.lp-mock-bar-labels span { font-size: 7px; color: rgba(255,255,255,.2); }
.lp-mock-verdict { display: flex; align-items: center; gap: 8px; }
.lp-mock-verdict-badge {
  font-size: 9px; font-weight: 800; letter-spacing: .1em;
  padding: 3px 8px; border-radius: 4px;
}
.lp-mock-verdict-bad {
  color: #EF4444; background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.2);
}
.lp-mock-verdict-detail { font-size: 9.5px; color: rgba(255,255,255,.28); }
.lp-mock-footer {
  padding: 9px 14px; border-top: 1px solid rgba(255,255,255,.06);
  font-size: 8.5px; color: rgba(255,255,255,.2); text-align: center; font-style: italic;
}

/* ── Problema ───────────────────────────────────────────────────────────────── */
.lp-problem { padding: 80px 0; }
.lp-problem-text {
  font-size: 16px; color: var(--t2); line-height: 1.7;
  max-width: 580px; margin-bottom: 16px;
}
.lp-problem-text-em { color: rgba(232,232,230,.7); font-style: italic; }
.lp-compare {
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  margin-top: 40px;
}
.lp-compare-col {
  background: rgba(255,255,255,.025); border-radius: 12px;
  border: 1px solid rgba(255,255,255,.07); padding: 24px;
  display: flex; flex-direction: column; gap: 14px;
}
.lp-compare-hide { border-color: rgba(34,197,94,.18); background: rgba(34,197,94,.04); }
.lp-compare-hdr { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.lp-compare-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.lp-compare-dot-dim   { background: rgba(255,255,255,.18); }
.lp-compare-dot-green { background: var(--green); }
.lp-compare-title { font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--t2); }
.lp-compare-row { display: flex; align-items: flex-start; gap: 10px; }
.lp-compare-icon { font-size: 13px; line-height: 1.5; flex-shrink: 0; }
.lp-compare-text { font-size: 13px; color: var(--t1); line-height: 1.55; }

/* ── 4 Números ──────────────────────────────────────────────────────────────── */
.lp-dash { padding: 80px 0; }
.lp-dash-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  margin-bottom: 28px;
}
.lp-dash-card {
  background: rgba(255,255,255,.028); border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px; padding: 22px 18px;
  display: flex; flex-direction: column; gap: 8px;
  transition: border-color .2s;
}
.lp-dash-card:hover { border-color: rgba(255,255,255,.14); }
.lp-dash-card-num  { font-size: 32px; font-weight: 900; line-height: 1; letter-spacing: -0.04em; }
.lp-dash-card-label { font-size: 12px; font-weight: 700; color: var(--t1); line-height: 1.4; }
.lp-dash-mini-bar { height: 3px; background: rgba(255,255,255,.07); border-radius: 99px; overflow: hidden; }
.lp-dash-mini-fill { height: 100%; border-radius: 99px; }
.lp-dash-card-desc { font-size: 11px; color: var(--t2); line-height: 1.5; }
.lp-dash-anchor {
  font-size: 13px; color: var(--t2); text-align: center; line-height: 1.6;
  padding: 16px; background: rgba(34,197,94,.04); border: 1px solid rgba(34,197,94,.14);
  border-radius: 8px;
}

/* ── Steps ──────────────────────────────────────────────────────────────────── */
.lp-steps {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 32px; margin-bottom: 48px;
}
.lp-step { display: flex; flex-direction: column; gap: 12px; }
.lp-step-n {
  font-size: 11px; font-weight: 800; letter-spacing: .12em;
  color: var(--green); font-family: 'Syne', sans-serif;
}
.lp-step-title { font-size: 18px; font-weight: 800; color: var(--t1); letter-spacing: -0.02em; line-height: 1.3; }
.lp-step-desc  { font-size: 14px; color: var(--t2); line-height: 1.65; }

/* ── Before / After ─────────────────────────────────────────────────────────── */
.lp-before-after-section { background: var(--bg); }
.lp-ba-sub {
  font-size: 16px; color: var(--t2); line-height: 1.6;
  max-width: 500px; margin-bottom: 40px;
}
.lp-ba-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
}
.lp-ba-card {
  display: flex; flex-direction: column; gap: 0;
  background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px; overflow: hidden;
}
.lp-ba-block { padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
.lp-ba-before { background: rgba(239,68,68,.04); border-bottom: 1px solid rgba(255,255,255,.06); }
.lp-ba-after  { background: rgba(34,197,94,.04); }
.lp-ba-tag {
  font-size: 9px; font-weight: 800; letter-spacing: .12em;
  text-transform: uppercase; color: rgba(239,68,68,.7);
}
.lp-ba-tag-after { color: rgba(34,197,94,.8); }
.lp-ba-text { font-size: 13px; color: var(--t1); line-height: 1.55; font-style: italic; }
.lp-ba-arrow {
  text-align: center; font-size: 16px; color: var(--t3);
  padding: 4px 0; background: rgba(255,255,255,.02);
}
.antes-depois-attribution {
  font-size: 11px; color: #666; margin-top: 8px; font-style: normal; display: block;
}

/* ── Depoimentos ────────────────────────────────────────────────────────────── */
.lp-user-count {
  display: flex; align-items: baseline; gap: 6px;
  margin-bottom: 32px;
  font-size: 14px; color: var(--t2);
}
.lp-user-count-num {
  font-size: 22px; font-weight: 900; color: var(--green);
  letter-spacing: -0.03em;
}
.lp-testimonials {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;
}
.lp-testimonial {
  background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px; padding: 24px;
  display: flex; flex-direction: column; gap: 12px;
}
.lp-stars { display: flex; gap: 2px; }
.lp-test-text {
  font-size: 14px; color: var(--t1); line-height: 1.7;
  font-style: italic; flex: 1;
}
.lp-test-byline { display: flex; flex-direction: column; gap: 2px; }
.lp-test-name { font-size: 12px; font-weight: 700; color: var(--t2); }
.lp-test-context { font-size: 12px; color: #888888; margin-top: 2px; display: block; }

/* ── Pricing ────────────────────────────────────────────────────────────────── */
.lp-pricing-sub {
  font-size: 16px; color: var(--t2); line-height: 1.65;
  max-width: 580px; margin-bottom: 40px;
}
.lp-pricing {
  display: grid; grid-template-columns: 1fr 420px; gap: 40px; align-items: start;
}
.lp-features-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.lp-feature-item  { display: flex; align-items: flex-start; gap: 12px; font-size: 15px; color: var(--t1); line-height: 1.5; }
.lp-feature-check { color: var(--green); font-size: 16px; flex-shrink: 0; line-height: 1.5; }
.lp-feature-tilt .lp-feature-check { color: var(--amber); }
.lp-feature-sub {
  display: block; font-size: 12px; color: var(--t2); margin-top: 3px;
}
.lp-price-card {
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.1);
  border-radius: 16px; padding: 28px; display: flex; flex-direction: column; gap: 16px;
}
.lp-price-eyebrow {
  font-size: 8.5px; font-weight: 800; letter-spacing: .14em;
  text-transform: uppercase; color: var(--t2);
}
.lp-price-display { display: flex; align-items: baseline; gap: 8px; }
.lp-price-old {
  font-size: 20px; font-weight: 700; color: var(--t3);
  text-decoration: line-through;
}
.lp-price-main { display: flex; align-items: baseline; }
.lp-price-curr { font-size: 22px; font-weight: 800; color: var(--t1); letter-spacing: -0.02em; margin-right: 2px; }
.lp-price-int  { font-size: 52px; font-weight: 900; color: var(--t1); letter-spacing: -0.04em; line-height: 1; }
.lp-price-today { font-size: 11px; color: var(--amber); font-weight: 700; letter-spacing: .06em; }

/* Urgency */
.lp-urgency {
  background: rgba(34,197,94,.05); border: 1px solid rgba(34,197,94,.2);
  border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px;
}
.lp-urgency-hdr { display: flex; align-items: center; gap: 7px; }
.lp-urgency-icon { font-size: 13px; }
.lp-urgency-title { font-size: 10px; font-weight: 800; letter-spacing: .1em; color: var(--green); }
.lp-urgency-bar-wrap { height: 6px; background: rgba(255,255,255,.07); border-radius: 99px; overflow: hidden; }
.lp-urgency-bar { height: 100%; background: var(--green); border-radius: 99px; }
.lp-urgency-foot { display: flex; justify-content: space-between; }
.lp-urgency-count { font-size: 11px; color: var(--t2); }
.lp-urgency-after { font-size: 13px; color: #F0B429; font-weight: 700; letter-spacing: -0.2px; }

.lp-price-note { font-size: 12px; color: var(--t3); }
.lp-btn-buy {
  display: block; text-align: center;
  background: var(--green); color: #060607;
  font-size: 15px; font-weight: 800; padding: 16px 24px;
  border-radius: 10px; text-decoration: none; letter-spacing: -.01em;
  transition: opacity .15s; width: 100%;
}
.lp-btn-buy:hover { opacity: .88; }
.lp-btn-buy-lg { font-size: 16px; padding: 18px 28px; }
.lp-guarantee {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px; background: rgba(34,197,94,.05);
  border: 1px solid rgba(34,197,94,.15); border-radius: 8px;
}
.lp-guarantee-icon {
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(34,197,94,.2); color: var(--green);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; flex-shrink: 0;
}
.lp-guarantee-title { font-size: 13px; font-weight: 700; color: var(--t1); }
.lp-guarantee-sub   { font-size: 12px; color: var(--t2); margin-top: 2px; }

/* ── FAQ ────────────────────────────────────────────────────────────────────── */
.lp-faq { display: flex; flex-direction: column; gap: 2px; }
.lp-faq-item {
  border: 1px solid rgba(255,255,255,.07); border-radius: 10px;
  padding: 16px 18px; cursor: pointer;
  transition: border-color .15s, background .15s;
}
.lp-faq-item:hover { border-color: rgba(255,255,255,.13); background: rgba(255,255,255,.02); }
.lp-faq-open { border-color: rgba(34,197,94,.2) !important; background: rgba(34,197,94,.03) !important; }
.lp-faq-q {
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  font-size: 14px; font-weight: 700; color: var(--t1); line-height: 1.4;
}
.lp-faq-icon { font-size: 18px; color: var(--t3); flex-shrink: 0; }
.lp-faq-open .lp-faq-icon { color: var(--green); }
.lp-faq-a {
  font-size: 14px; color: var(--t2); line-height: 1.7; margin-top: 12px;
}

/* ── CTA Final ──────────────────────────────────────────────────────────────── */
.lp-cta-final {
  position: relative; padding: 100px 0; background: var(--bg);
  overflow: hidden;
}
.lp-cta-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(34,197,94,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34,197,94,.04) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, black, transparent);
}
.lp-cta-inner {
  position: relative; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 24px;
}
.lp-cta-h2 {
  font-size: clamp(28px, 4vw, 48px); font-weight: 900; color: var(--t1);
  line-height: 1.1; letter-spacing: -0.035em;
}
.lp-cta-dim   { color: rgba(232,232,230,.28); }
.lp-cta-sub   { font-size: 18px; color: var(--t2); }
.lp-cta-actions {
  display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; max-width: 360px;
}
.cta-guarantee-text {
  font-size: 13px; color: #666; text-align: center; margin-top: 12px; margin-bottom: 0;
}

/* Trust seals */
.lp-trust-seals {
  display: flex; align-items: center; gap: 24px; flex-wrap: wrap; justify-content: center;
  margin-top: 8px;
}
.lp-seal {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600; color: var(--t3); letter-spacing: .03em;
}
.lp-seal svg { color: var(--t3); }

/* ── Footer ─────────────────────────────────────────────────────────────────── */
.lp-footer-custom {
  background: var(--bg2); border-top: 1px solid var(--border);
  padding: 40px 0 32px;
}
.lp-footer-legal {
  font-size: 12px; color: var(--t3); line-height: 1.7;
  text-align: center; max-width: 680px; margin: 0 auto 16px;
}
.lp-footer-legal a { color: var(--t3); text-decoration: underline; }
.lp-footer-links {
  display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;
  font-size: 11px; color: var(--t3);
}
.lp-footer-links a { color: var(--t3); text-decoration: underline; }
.lp-footer-sep { color: var(--t3); }

/* ── Sticky CTA bar (mobile only) ───────────────────────────────────────────── */
.sticky-cta-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 12px 16px 20px;
  background: linear-gradient(to top, #0a0a0a 70%, transparent);
  z-index: 999; display: none;
  transition: opacity 0.3s ease;
}
.sticky-cta-btn {
  display: block; width: 100%;
  background: #1DB954; color: #000;
  font-weight: 700; font-size: 16px;
  text-align: center; padding: 16px;
  border-radius: 12px; text-decoration: none;
  letter-spacing: -0.2px;
}
@media (min-width: 481px) {
  .sticky-cta-bar { display: none !important; }
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 880px) {
  .lp-hero-layout { grid-template-columns: 1fr; gap: 40px; }
  .lp-hero-right  { display: none; }
  .lp-compare    { grid-template-columns: 1fr; }
  .lp-dash-grid  { grid-template-columns: repeat(2, 1fr); }
  .lp-steps      { grid-template-columns: 1fr; gap: 24px; }
  .lp-ba-grid    { grid-template-columns: 1fr; }
  .lp-testimonials { grid-template-columns: 1fr; }
  .lp-pricing    { grid-template-columns: 1fr; }
  .lp-nav        { display: none; }
}
@media (max-width: 480px) {
  section,
  [data-section],
  .section,
  .lp-section {
    margin-top: 56px;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  .lp-container  { padding: 0 20px; }
  .lp-hero       { padding: 48px 0 40px; margin-top: 0; }
  .lp-problem    { padding: 48px 0; margin-top: 0; }
  .lp-dash       { padding: 48px 0; margin-top: 0; }
  .lp-section    { padding: 56px 0; margin-top: 0; }
  .lp-cta-final  { padding: 56px 0; margin-top: 0; }
  .lp-dash-grid  { grid-template-columns: 1fr 1fr; }
  .lp-trust-seals { gap: 16px; }
}

/* ─ Controle de Banca — Landing Page ───────────────────────────────────────── */

.lp-banca-section { background: #0a0a0a; }

.lp-banca-sub {
  font-size: 16px; color: var(--t2); line-height: 1.7;
  max-width: 560px; margin: 0 auto 40px; text-align: center;
}

/* 6-card dashboard grid */
.lp-bk-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.lp-bk-card {
  background: #111111;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 18px 16px 16px;
  display: flex; flex-direction: column; gap: 5px;
  transition: transform .18s ease, border-color .18s;
}
.lp-bk-card:hover {
  transform: scale(1.02);
  border-color: rgba(255,255,255,0.12);
}

.lp-bk-label {
  font-size: 9px; font-weight: 800;
  letter-spacing: .12em; color: #888888;
  text-transform: uppercase;
}

.lp-bk-val {
  font-size: 22px; font-weight: 900;
  line-height: 1.1; letter-spacing: -.02em;
}

.lp-bk-sub {
  font-size: 11px; color: #888888; margin-top: 2px;
}

/* Barra de progresso % de banca — 3 zonas coloridas */
.lp-bk-pct-bar {
  position: relative; height: 7px; border-radius: 99px;
  display: flex; overflow: hidden; margin-top: 6px;
}
.lp-bk-pct-zone { flex: 1; }
.lp-bk-zone-g   { background: rgba(34,197,94,.35); }
.lp-bk-zone-y   { background: rgba(245,158,11,.35); }
.lp-bk-zone-r   { background: rgba(239,68,68,.35); }

.lp-bk-pct-thumb {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 11px; height: 11px; border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 7px rgba(34,197,94,.7);
}

.lp-bk-bar-labels {
  display: flex; justify-content: space-between;
  font-size: 9px; color: #484848; margin-top: 4px;
}

/* Alerta dinâmico */
.lp-bk-alert {
  display: flex; align-items: flex-start; gap: 13px;
  background: rgba(245,158,11,.06);
  border: 1px solid rgba(245,158,11,.2);
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 28px;
}
.lp-bk-alert-icon { flex-shrink: 0; margin-top: 1px; }
.lp-bk-alert-text {
  font-size: 13px; color: #e8e8e6; line-height: 1.6;
}
.lp-bk-alert-text strong { color: #fcd34d; font-weight: 700; }

/* Feature list */
.lp-bk-features {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 10px;
  max-width: 520px; margin-left: auto; margin-right: auto;
}
.lp-bk-feature-row {
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 14px; color: var(--t2); line-height: 1.5;
}
.lp-bk-check {
  color: #22c55e; font-weight: 900;
  font-size: 13px; flex-shrink: 0; margin-top: 1px;
}

/* Price card additions */
.lp-price-includes {
  font-size: 11px; font-weight: 700; letter-spacing: .07em;
  color: #22c55e; margin-bottom: 8px;
}
.lp-price-payment-note {
  font-size: 11px; color: #888888; letter-spacing: .04em;
  margin-bottom: 6px; text-align: center;
}

/* Responsive — tablet */
@media (max-width: 768px) {
  .lp-bk-grid { grid-template-columns: repeat(2, 1fr); }
  .lp-bk-val  { font-size: 18px; }
}

/* Responsive — mobile */
@media (max-width: 480px) {
  .lp-banca-section { padding: 48px 0; margin-top: 0; }
  .lp-bk-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .lp-bk-val  { font-size: 17px; }
  .lp-banca-sub { font-size: 14px; }
  .lp-bk-feature-row { font-size: 13px; }
}

/* Extra small — 375px */
@media (max-width: 400px) {
  .lp-bk-card { padding: 14px 12px 12px; }
  .lp-bk-val  { font-size: 16px; }
}
`;
