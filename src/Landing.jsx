import { useState } from "react";
import { LegalBar, Header, Footer } from "./Layout";
import { Link } from "./router";

// ─── Dados estáticos ───────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { name: "Ricardo M.", age: 34, city: "São Paulo",        text: "Finalmente entendi por que perdia toda semana. A margem da casa me engolia e eu nem sabia disso." },
  { name: "Ana C.",     age: 28, city: "Belo Horizonte",   text: "Vi que minha odd 'segura' de 1.50 tinha 66% de chance de dar errado. Nunca mais apostei sem analisar antes." },
  { name: "Felipe S.",  age: 41, city: "Rio de Janeiro",   text: "O alerta de tilt salvou meu mês. Eu ia dobrar o prejuízo tentando recuperar e nem percebia." },
  { name: "Mariana T.", age: 25, city: "Curitiba",         text: "Simples, direto, honesto. Não promete nada mas mostra tudo que a casa esconde na odd." },
  { name: "Gustavo R.", age: 37, city: "Porto Alegre",     text: "Em anos apostando, nunca tinha visto meu prejuízo projetado calculado assim. Assustador e essencial." },
  { name: "Cássia F.",  age: 44, city: "Salvador",         text: "Meu marido apostava R$200/semana. Depois da simulação de 30 dias, parou na hora." },
];

const FEATURES = [
  "Análises ilimitadas (versão grátis: 1 por dia)",
  "Relatório completo com 8 indicadores matemáticos",
  "Margem da casa (vig) calculada e explicada",
  "Simulador de bankroll: projeção de 30 e 90 dias",
  "Detector de tilt — alerta quando você está apostando emocionalmente",
  "Histórico salvo de todas as suas análises",
  "Diário de apostas com resultado real vs esperado",
  "Alerta de stop-loss personalizado por mês",
  "Comparador de odds entre as principais casas",
  "Glossário 'o que a casa não te conta' (40 termos)",
  "Acesso vitalício — pague uma vez, use para sempre",
];

const FAQ_ITEMS = [
  {
    q: "Funciona pra qualquer esporte?",
    a: "Sim. A análise se baseia na matemática da odd, que é universal para futebol, basquete, tênis, MMA, eSports e qualquer outro esporte com mercado de apostas.",
  },
  {
    q: "Vocês são uma casa de aposta?",
    a: "Não. Somos uma ferramenta educativa independente. Não fazemos apostas, não vendemos odds e não temos nenhuma relação com casas de aposta.",
  },
  {
    q: "É assinatura mensal?",
    a: "Não. Você paga R$27 uma vez e tem acesso vitalício. Sem renovações, sem surpresas.",
  },
  {
    q: "Vocês dão palpites ou previsões de resultado?",
    a: "Nunca. Mostramos riscos, probabilidades matemáticas e impacto financeiro. A decisão é sempre sua.",
  },
  {
    q: "Como recebo o acesso após o pagamento?",
    a: "Imediatamente. Após o pagamento confirmado, você recebe o link de acesso no email de confirmação.",
  },
  {
    q: "Funciona no celular?",
    a: "Sim. A ferramenta é 100% mobile-first, desenvolvida para ser usada antes de apostar, de onde você estiver.",
  },
  {
    q: "E se eu já estou com problemas com jogo?",
    a: "Procure ajuda imediatamente. Acesse jogoresponsavel.com.br ou ligue para o CVV: 188. Problema com jogo é sério e tem tratamento.",
  },
  {
    q: "Como funciona a garantia?",
    a: "7 dias corridos a partir da compra. Não achou útil? Basta enviar um email e devolvemos 100% sem perguntas.",
  },
];

// ─── Componentes internos ──────────────────────────────────────────────────────

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lp-faq-item" onClick={() => setOpen(!open)}>
      <div className="lp-faq-q">
        <span>{q}</span>
        <span className="lp-faq-arrow">{open ? "−" : "+"}</span>
      </div>
      {open && <p className="lp-faq-a">{a}</p>}
    </div>
  );
}

function Avatar({ name }) {
  return (
    <div className="lp-avatar">
      {name.split(" ")[0][0]}
      {name.split(" ")[1]?.[0] ?? ""}
    </div>
  );
}

// ─── Landing Page ──────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <>
      <style>{CSS}</style>
      <LegalBar />
      <Header />

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-tag">⚠ FERRAMENTA EDUCATIVA DE RISCO</div>
          <h1 className="lp-h1">
            Antes de apostar, descubra o quanto você{" "}
            <em>REALMENTE</em> pode perder.
          </h1>
          <p className="lp-hero-sub">
            Cole sua aposta. Em segundos a IA mostra a probabilidade real,
            a margem escondida da casa, o impacto no seu bolso em 30 dias
            e quando parar.
          </p>
          <Link to="/analisar" className="lp-hero-cta">
            Analisar minha aposta grátis →
          </Link>
          <div className="lp-seals">
            <span>✓ Sem cadastro pra testar</span>
            <span>✓ 100% anônimo</span>
            <span>✓ Não somos casa de aposta</span>
          </div>
        </div>
      </section>

      {/* ── DOR ─────────────────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <p className="lp-section-tag">SE VOCÊ JÁ PENSOU NISSO...</p>
          <div className="lp-dor-grid">
            <div className="lp-dor-card">
              <div className="lp-dor-icon">😤</div>
              <p>"Tô quase ganhando" — mas nunca ganha de verdade.</p>
            </div>
            <div className="lp-dor-card">
              <div className="lp-dor-icon">📉</div>
              <p>Perdeu mais do que ganhou no ano e não sabe exatamente quanto.</p>
            </div>
            <div className="lp-dor-card">
              <div className="lp-dor-icon">🎯</div>
              <p>Aposta odd baixa achando que é "seguro" — não é.</p>
            </div>
          </div>
          <div className="lp-dor-reveal">
            <p>
              Existe um motivo matemático para isso.
              <br />
              <strong>E ele está escondido dentro da odd.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ───────────────────────────────── */}
      <section className="lp-section lp-section-alt">
        <div className="lp-section-inner">
          <p className="lp-section-tag">COMO FUNCIONA</p>
          <h2 className="lp-h2">Três etapas. Menos de 1 minuto.</h2>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-num">01</div>
              <h3 className="lp-step-title">Informe sua aposta</h3>
              <p className="lp-step-desc">
                Jogo, esporte, tipo de aposta, casa, odd e o valor que
                pensava em apostar.
              </p>
            </div>
            <div className="lp-step-arrow">→</div>
            <div className="lp-step">
              <div className="lp-step-num">02</div>
              <h3 className="lp-step-title">A IA calcula o risco real</h3>
              <p className="lp-step-desc">
                Probabilidade real, margem da casa, valor esperado, projeção
                de 30 e 90 dias.
              </p>
            </div>
            <div className="lp-step-arrow">→</div>
            <div className="lp-step">
              <div className="lp-step-num">03</div>
              <h3 className="lp-step-title">Você recebe o relatório</h3>
              <p className="lp-step-desc">
                Semáforo de risco, 8 indicadores, gráfico de simulação
                e decisão recomendada.
              </p>
            </div>
          </div>
          <div className="lp-steps-cta">
            <Link to="/analisar" className="lp-hero-cta">
              Testar grátis agora →
            </Link>
          </div>
        </div>
      </section>

      {/* ── PREVIEW DO RELATÓRIO ─────────────────────────── */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <p className="lp-section-tag">PRÉVIA DO RELATÓRIO</p>
          <h2 className="lp-h2">O que você vê após a análise</h2>
          <div className="lp-preview">
            {/* Semáforo mockup */}
            <div className="lp-preview-semaforo">
              <div className="lp-sem-dot lp-sem-red" />
              <div>
                <div className="lp-sem-label">RISCO ALTO</div>
                <div className="lp-sem-phrase">
                  A casa tem 67% de chance de ficar com seu dinheiro nessa
                  aposta.
                </div>
              </div>
            </div>
            {/* 3 cards mockup */}
            <div className="lp-preview-cards">
              <div className="lp-preview-card">
                <div className="lp-pc-label">PROBABILIDADE IMPLÍCITA</div>
                <div className="lp-pc-value">55.6%</div>
                <div className="lp-pc-sub">de chance segundo a casa (odd 1.80)</div>
              </div>
              <div className="lp-preview-card">
                <div className="lp-pc-label">MARGEM DA CASA (VIG)</div>
                <div className="lp-pc-value lp-pc-red">5.5%</div>
                <div className="lp-pc-sub">taxa invisível em cada R$100 apostados</div>
              </div>
              <div className="lp-preview-card">
                <div className="lp-pc-label">PROJEÇÃO 30 DIAS</div>
                <div className="lp-pc-value lp-pc-red">−R$ 412</div>
                <div className="lp-pc-sub">apostando 5x/semana nesse perfil</div>
              </div>
            </div>
            <div className="lp-preview-blur-label">
              + 5 indicadores, gráfico de simulação e decisão recomendada
            </div>
          </div>
        </div>
      </section>

      {/* ── PROVA SOCIAL ────────────────────────────────── */}
      <section className="lp-section lp-section-alt">
        <div className="lp-section-inner">
          <p className="lp-section-tag">QUEM JÁ USOU</p>
          <div className="lp-counter">
            <span className="lp-counter-num">47.812</span>
            <span className="lp-counter-sep">apostas analisadas</span>
            <span className="lp-counter-num">R$ 2,3M</span>
            <span className="lp-counter-sep">
              em perdas evitadas (estimativa baseada em uso)
            </span>
          </div>
          <div className="lp-testimonials">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="lp-testimonial">
                <p className="lp-test-text">"{t.text}"</p>
                <div className="lp-test-author">
                  <Avatar name={t.name} />
                  <div>
                    <strong>{t.name}</strong>, {t.age} anos
                    <br />
                    <span className="lp-test-city">{t.city}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇO ───────────────────────────────────────── */}
      <section className="lp-section" id="preco">
        <div className="lp-section-inner">
          <p className="lp-section-tag">ACESSO COMPLETO</p>
          <h2 className="lp-h2">O que você leva por R$27</h2>
          <div className="lp-pricing">
            <ul className="lp-features">
              {FEATURES.map((f, i) => (
                <li key={i} className="lp-feature-item">
                  <span className="lp-check">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="lp-price-box">
              <div className="lp-price-old">De R$197</div>
              <div className="lp-price-now">R$27</div>
              <div className="lp-price-parcel">ou 3× de R$9,90</div>
              <div className="lp-price-note">
                Acesso vitalício — pague uma vez, sem renovação.
              </div>
              <Link to="/pagar" className="lp-buy-btn">
                Garantir acesso vitalício →
              </Link>
              <div className="lp-guarantee">
                🛡 7 dias de garantia. Não achou útil?
                <br />
                Devolvemos 100%, sem perguntas.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section className="lp-section lp-section-alt">
        <div className="lp-section-inner lp-faq-wrap">
          <p className="lp-section-tag">DÚVIDAS FREQUENTES</p>
          <h2 className="lp-h2">Perguntas e respostas</h2>
          <div className="lp-faq">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────── */}
      <section className="lp-section lp-final-cta">
        <div className="lp-section-inner lp-final-inner">
          <h2 className="lp-final-h2">
            Acesso vitalício por R$27.
            <br />
            Sem mensalidade. Sem renovação.
          </h2>
          <p className="lp-final-sub">
            Ou teste grátis agora — sem cadastro, sem cartão.
          </p>
          <div className="lp-final-btns">
            <Link to="/pagar" className="lp-buy-btn">
              Garantir acesso vitalício →
            </Link>
            <Link to="/analisar" className="lp-free-btn">
              Analisar uma aposta grátis
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

// ─── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
/* ── Hero ─────────────────────────────────────────── */
.lp-hero {
  padding: 80px 24px 72px;
  text-align: center;
  border-bottom: 1px solid var(--border);
}
.lp-hero-inner { max-width: 680px; margin: 0 auto; }

.lp-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--amber);
  margin-bottom: 20px;
}

.lp-h1 {
  font-family: 'Syne', sans-serif;
  font-size: clamp(28px, 6vw, 48px);
  font-weight: 900;
  line-height: 1.12;
  letter-spacing: -0.02em;
  color: #fff;
  margin-bottom: 20px;
}
.lp-h1 em { font-style: normal; color: var(--amber); }

.lp-hero-sub {
  font-size: 17px;
  color: var(--muted);
  max-width: 520px;
  margin: 0 auto 32px;
  line-height: 1.7;
}

.lp-hero-cta {
  display: inline-block;
  background: var(--text);
  color: var(--bg);
  font-size: 15px;
  font-weight: 700;
  padding: 15px 28px;
  border-radius: 10px;
  text-decoration: none;
  transition: opacity 0.15s, transform 0.12s;
  margin-bottom: 20px;
}
.lp-hero-cta:hover { opacity: 0.9; transform: translateY(-1px); }

.lp-seals {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: #555;
}

/* ── Sections ─────────────────────────────────────── */
.lp-section { padding: 72px 24px; }
.lp-section-alt { background: #0D0D0E; }
.lp-section-inner { max-width: 860px; margin: 0 auto; }
.lp-section-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--muted);
  margin-bottom: 12px;
  text-transform: uppercase;
}
.lp-h2 {
  font-family: 'Syne', sans-serif;
  font-size: clamp(22px, 4vw, 32px);
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 36px;
  letter-spacing: -0.01em;
}

/* ── Dor ──────────────────────────────────────────── */
.lp-dor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}
.lp-dor-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}
.lp-dor-icon { font-size: 28px; margin-bottom: 12px; }
.lp-dor-card p { font-size: 15px; color: var(--muted); line-height: 1.6; }
.lp-dor-reveal {
  background: rgba(255,176,32,0.06);
  border: 1px solid rgba(255,176,32,0.18);
  border-radius: 12px;
  padding: 20px 24px;
  text-align: center;
}
.lp-dor-reveal p { font-size: 16px; color: var(--muted); line-height: 1.7; }
.lp-dor-reveal strong { color: var(--amber); }

/* ── Como funciona ────────────────────────────────── */
.lp-steps {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 36px;
}
.lp-step { flex: 1; min-width: 180px; }
.lp-step-num {
  font-family: 'Syne', sans-serif;
  font-size: 36px;
  font-weight: 900;
  color: var(--border);
  line-height: 1;
  margin-bottom: 10px;
}
.lp-step-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}
.lp-step-desc { font-size: 14px; color: var(--muted); line-height: 1.6; }
.lp-step-arrow {
  font-size: 20px;
  color: #333;
  padding-top: 16px;
  flex-shrink: 0;
}
.lp-steps-cta { text-align: center; }

/* ── Preview ──────────────────────────────────────── */
.lp-preview {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.lp-preview-semaforo {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255,77,46,0.06);
  border: 1px solid rgba(255,77,46,0.2);
  border-radius: 12px;
}
.lp-sem-dot {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}
.lp-sem-red { background: var(--red); box-shadow: 0 0 20px rgba(255,77,46,0.4); }
.lp-sem-label {
  font-family: 'Syne', sans-serif;
  font-size: 18px;
  font-weight: 800;
  color: var(--red);
}
.lp-sem-phrase { font-size: 14px; color: var(--muted); margin-top: 2px; }

.lp-preview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.lp-preview-card {
  background: #0A0A0B;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
}
.lp-pc-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #444;
  margin-bottom: 8px;
  text-transform: uppercase;
}
.lp-pc-value {
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 4px;
}
.lp-pc-red { color: var(--red); }
.lp-pc-sub { font-size: 11px; color: #555; }
.lp-preview-blur-label {
  text-align: center;
  font-size: 13px;
  color: #444;
  padding: 8px 0 4px;
}

/* ── Prova social ─────────────────────────────────── */
.lp-counter {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 40px;
}
.lp-counter-num {
  font-family: 'Syne', sans-serif;
  font-size: 28px;
  font-weight: 900;
  color: #fff;
}
.lp-counter-sep { font-size: 14px; color: var(--muted); }

.lp-testimonials {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}
.lp-testimonial {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.lp-test-text { font-size: 14px; color: #aaa; line-height: 1.7; font-style: italic; }
.lp-test-author {
  display: flex;
  align-items: center;
  gap: 12px;
}
.lp-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #1E1E1F;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  flex-shrink: 0;
  text-transform: uppercase;
}
.lp-test-author strong { font-size: 13px; color: var(--text); }
.lp-test-city { font-size: 12px; color: var(--muted); }

/* ── Preço ────────────────────────────────────────── */
.lp-pricing {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 40px;
  align-items: start;
}
.lp-features { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.lp-feature-item { display: flex; gap: 12px; font-size: 15px; color: #ccc; }
.lp-check { color: var(--green); font-weight: 700; flex-shrink: 0; }

.lp-price-box {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px 24px;
  min-width: 220px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: sticky;
  top: 80px;
}
.lp-price-old {
  font-size: 14px;
  color: #444;
  text-decoration: line-through;
}
.lp-price-now {
  font-family: 'Syne', sans-serif;
  font-size: 42px;
  font-weight: 900;
  color: #fff;
  line-height: 1;
}
.lp-price-parcel { font-size: 13px; color: var(--muted); }
.lp-price-note { font-size: 12px; color: #444; }

.lp-buy-btn {
  display: block;
  background: var(--text);
  color: var(--bg);
  font-size: 15px;
  font-weight: 700;
  padding: 15px 20px;
  border-radius: 10px;
  text-decoration: none;
  text-align: center;
  transition: opacity 0.15s;
  margin-top: 4px;
}
.lp-buy-btn:hover { opacity: 0.88; }

.lp-guarantee {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.6;
}

/* ── FAQ ──────────────────────────────────────────── */
.lp-faq-wrap { max-width: 640px; }
.lp-faq { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }
.lp-faq-item {
  border-bottom: 1px solid var(--border);
  padding: 16px 0;
  cursor: pointer;
  user-select: none;
}
.lp-faq-q {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}
.lp-faq-arrow { font-size: 20px; color: var(--muted); flex-shrink: 0; }
.lp-faq-a {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.7;
  margin-top: 12px;
}

/* ── CTA final ────────────────────────────────────── */
.lp-final-cta {
  background: #0D0D0E;
  text-align: center;
}
.lp-final-inner { max-width: 560px; }
.lp-final-h2 {
  font-family: 'Syne', sans-serif;
  font-size: clamp(22px, 4vw, 32px);
  font-weight: 900;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 14px;
}
.lp-final-sub { font-size: 15px; color: var(--muted); margin-bottom: 28px; }
.lp-final-btns {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.lp-free-btn {
  font-size: 14px;
  color: var(--muted);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.lp-free-btn:hover { color: var(--text); }

/* ── Responsivo ───────────────────────────────────── */
@media (max-width: 640px) {
  .lp-pricing { grid-template-columns: 1fr; }
  .lp-price-box { position: static; }
  .lp-preview-cards { grid-template-columns: 1fr; }
  .lp-step-arrow { display: none; }
  .lp-steps { gap: 20px; }
  .lp-counter { gap: 8px; }
}
`;
