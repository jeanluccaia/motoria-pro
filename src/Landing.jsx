import { useState } from "react";
import { LegalBar, Footer } from "./Layout";
import { Link } from "./router";

// ─── Dados ─────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { name: "Ricardo M.", age: 34, city: "São Paulo",      text: "Finalmente entendi por que perdia toda semana. A margem da casa me engolia e eu nem sabia disso." },
  { name: "Ana C.",     age: 28, city: "Belo Horizonte", text: "Vi que minha odd 'segura' de 1.50 tinha 66% de chance de dar errado. Nunca mais apostei sem analisar antes." },
  { name: "Felipe S.",  age: 41, city: "Rio de Janeiro", text: "O alerta de tilt salvou meu mês. Ia dobrar o prejuízo tentando recuperar e nem percebia." },
  { name: "Mariana T.", age: 25, city: "Curitiba",       text: "Simples, direto, honesto. Não promete nada mas mostra tudo que a casa esconde na odd." },
  { name: "Gustavo R.", age: 37, city: "Porto Alegre",   text: "Em anos apostando, nunca tinha visto meu prejuízo projetado calculado assim. Assustador e essencial." },
  { name: "Cássia F.",  age: 44, city: "Salvador",       text: "Meu marido apostava R$200 por semana. Depois da simulação de 30 dias, parou na hora." },
];

const FEATURES = [
  "Análises ilimitadas",
  "Score de Risco MotorIA™ (0–100) por aposta",
  "Probabilidade implícita calculada automaticamente",
  "Margem da casa (vig) decodificada por mercado",
  "Simulador de bankroll — projeção 30 e 90 dias",
  "Detector de tilt — alerta de risco comportamental",
  "8 indicadores matemáticos por análise completa",
  "Diário de apostas com resultado real vs esperado",
  "Alerta de stop-loss personalizado por período",
  "Acesso vitalício — pague uma vez, use para sempre",
];

const FAQ_ITEMS = [
  { q: "Funciona para qualquer esporte?",             a: "Sim. A análise se baseia na matemática da odd, que é universal — futebol, basquete, tênis, MMA, eSports e qualquer mercado com odds." },
  { q: "Vocês são uma casa de aposta?",               a: "Não. Somos uma ferramenta educativa independente. Não fazemos apostas, não vendemos odds e não temos nenhuma relação com casas de aposta." },
  { q: "É assinatura mensal?",                        a: "Não. Você paga R$27 uma vez e tem acesso vitalício. Sem renovações, sem surpresas." },
  { q: "Vocês dão palpites ou previsões?",            a: "Nunca. Mostramos riscos, probabilidades matemáticas e impacto financeiro. A decisão é sempre sua." },
  { q: "Como recebo o acesso após o pagamento?",      a: "Imediatamente. Após o pagamento confirmado, você recebe o link de acesso no email de confirmação." },
  { q: "Funciona no celular?",                        a: "Sim. A ferramenta é 100% mobile-first, desenvolvida para ser usada antes de apostar, de onde você estiver." },
  { q: "E se eu já estou com problemas com jogo?",   a: "Procure ajuda imediatamente. Acesse jogoresponsavel.com.br ou ligue para o CVV: 188. Problema com jogo é sério e tem tratamento." },
  { q: "Como funciona a garantia?",                   a: "7 dias corridos a partir da compra. Não achou útil? Basta enviar um email e devolvemos 100% sem perguntas." },
];

const AVATAR_PALETTES = [
  { bg: "rgba(31,203,122,0.12)",  border: "rgba(31,203,122,0.3)",  color: "#1FCB7A" },
  { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)",  color: "#818cf8" },
  { bg: "rgba(255,176,32,0.12)",  border: "rgba(255,176,32,0.3)",  color: "#FFB020" },
  { bg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.3)", color: "#f472b6" },
  { bg: "rgba(45,212,191,0.12)",  border: "rgba(45,212,191,0.3)",  color: "#2dd4bf" },
  { bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.3)",  color: "#fb923c" },
];

// ─── Componentes internos ──────────────────────────────────────────────────────

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
    <div className="lp-faq-item" onClick={() => setOpen(!open)}>
      <div className="lp-faq-q">
        <span>{q}</span>
        <span className="lp-faq-icon">{open ? "−" : "+"}</span>
      </div>
      {open && <p className="lp-faq-a">{a}</p>}
    </div>
  );
}

// ─── Landing Page ──────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <>
      <style>{CSS}</style>
      <LegalBar />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <div className="lp-logo">
            <span className="lp-logo-mark">M</span>
            <span className="lp-logo-name">MotorIA Pro</span>
          </div>
          <nav className="lp-nav">
            <a href="#como-funciona" className="lp-nav-link">Como funciona</a>
            <a href="#exemplo"       className="lp-nav-link">Exemplo</a>
            <a href="#preco"         className="lp-nav-link">Preço</a>
            <Link to="/" className="lp-nav-cta">Testar grátis</Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-glow" aria-hidden="true" />
        <div className="lp-grid-bg"   aria-hidden="true" />
        <div className="lp-container">
          <div className="lp-hero-layout">

            {/* Texto */}
            <div className="lp-hero-text">
              <div className="lp-tag-pill">FERRAMENTA EDUCATIVA DE ANÁLISE DE RISCO</div>
              <h1 className="lp-h1">
                Antes de apostar,<br />
                <span className="lp-h1-accent">entenda o risco.</span>
              </h1>
              <p className="lp-hero-sub">
                Uma ferramenta educativa de análise preventiva para calcular probabilidade
                implícita, exposição ao risco e chance de perda antes de qualquer decisão.
              </p>
              <div className="lp-hero-btns">
                <Link to="/" className="lp-btn-primary">Testar análise →</Link>
                <a href="#exemplo" className="lp-btn-ghost">Ver exemplo</a>
              </div>
              <div className="lp-trust-row">
                {["Não é casa de aposta", "Não vende previsões", "Não promete lucro", "Ferramenta educativa"].map((t) => (
                  <span className="lp-trust-pill" key={t}>{t}</span>
                ))}
              </div>
            </div>

            {/* Mock da ferramenta */}
            <div className="lp-hero-visual">
              <div className="lp-mock">
                <div className="lp-mock-hdr">
                  <span className="lp-mock-hdr-title">Relatório de risco</span>
                  <span className="lp-mock-hdr-odd">odd 2.80</span>
                </div>

                {/* Score */}
                <div className="lp-mock-score">
                  <div className="lp-mock-score-tag">SCORE DE RISCO MOTORIA™</div>
                  <div className="lp-mock-score-row">
                    <div className="lp-mock-score-num">64</div>
                    <div className="lp-mock-score-right">
                      <span className="lp-mock-badge">ALTO</span>
                      <div className="lp-mock-bar-track">
                        <div className="lp-mock-bar-fill" />
                        <div className="lp-mock-bar-glow" />
                      </div>
                      <div className="lp-mock-bar-labels">
                        <span>Baixo</span><span>Mod.</span><span>Alto</span><span>Extr.</span>
                      </div>
                    </div>
                  </div>
                  <p className="lp-mock-score-note">
                    Score educativo. Não recomenda aposta — resume exposição ao risco.
                  </p>
                </div>

                {/* Mini indicadores */}
                <div className="lp-mock-grid">
                  <div className="lp-mock-ind">
                    <div className="lp-mock-ind-label">PROB. IMPLÍCITA</div>
                    <div className="lp-mock-ind-val lp-col-green">35.7%</div>
                  </div>
                  <div className="lp-mock-ind">
                    <div className="lp-mock-ind-label">CHANCE DE PERDA</div>
                    <div className="lp-mock-ind-val lp-col-red">~64.3%</div>
                  </div>
                  <div className="lp-mock-ind">
                    <div className="lp-mock-ind-label">MARGEM DA CASA</div>
                    <div className="lp-mock-ind-val lp-col-amber">5.5%</div>
                  </div>
                  <div className="lp-mock-ind">
                    <div className="lp-mock-ind-label">EV POR APOSTA</div>
                    <div className="lp-mock-ind-val lp-col-red">-R$14.50</div>
                  </div>
                </div>

                <div className="lp-mock-footer">
                  Esta análise não recomenda aposta. Mostra apenas o risco envolvido.
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── O QUE VOCÊ VÊ VS O QUE VOCÊ IGNORA ───────────────────────── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-label">ANÁLISE PREVENTIVA</div>
          <h2 className="lp-h2">O que você vê — e o que você ignora.</h2>
          <p className="lp-h2-sub">
            A casa de apostas não te mostra tudo. O MotorIA Pro revela o que está escondido dentro da odd.
          </p>

          <div className="lp-vs-grid">
            {/* Esquerda — O que o apostador vê */}
            <div className="lp-vs-card lp-vs-left">
              <div className="lp-vs-card-hdr lp-vs-hdr-left">
                <span className="lp-vs-dot lp-vs-dot-green" />
                O que o apostador costuma ver
              </div>
              {[
                { label: "Retorno se ganhar",  val: "+R$280" },
                { label: "Lucro possível",     val: "R$180"  },
                { label: "Odd atraente",       val: "2.80"   },
                { label: "Cenário favorável",  val: "Possível" },
              ].map((row) => (
                <div className="lp-vs-row lp-vs-row-green" key={row.label}>
                  <span className="lp-vs-row-label">{row.label}</span>
                  <span className="lp-vs-row-val lp-col-green">{row.val}</span>
                </div>
              ))}
            </div>

            {/* Divisor */}
            <div className="lp-vs-divider">
              <div className="lp-vs-div-line" />
              <div className="lp-vs-div-vs">vs</div>
              <div className="lp-vs-div-line" />
            </div>

            {/* Direita — O que a odd esconde */}
            <div className="lp-vs-card lp-vs-right">
              <div className="lp-vs-card-hdr lp-vs-hdr-right">
                <span className="lp-vs-dot lp-vs-dot-red" />
                O que a odd esconde
              </div>
              {[
                { label: "Probabilidade implícita",  val: "35.7%"    },
                { label: "Margem da casa (vig)",     val: "5.5%"     },
                { label: "Chance real de perda",     val: "~64.3%"   },
                { label: "EV por aposta",            val: "-R$14.50" },
              ].map((row) => (
                <div className="lp-vs-row lp-vs-row-red" key={row.label}>
                  <span className="lp-vs-row-label">{row.label}</span>
                  <span className="lp-vs-row-val lp-col-red">{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ──────────────────────────────────────────────── */}
      <section className="lp-section lp-section-dark" id="como-funciona">
        <div className="lp-container">
          <div className="lp-section-label">COMO FUNCIONA</div>
          <h2 className="lp-h2">Três etapas. Menos de um minuto.</h2>

          <div className="lp-steps">
            {[
              {
                n: "01",
                title: "Insira a odd e o contexto",
                desc: "Informe o jogo, tipo de aposta, odd e valor pretendido. Quanto mais contexto, mais precisa será a leitura de risco.",
                tags: ["Evento", "Odd", "Tipo de aposta", "Valor"],
              },
              {
                n: "02",
                title: "A IA calcula a exposição ao risco",
                desc: "O motor analisa probabilidade implícita, margem da casa, valor esperado e pontos cegos — em segundos.",
                tags: ["Score de Risco", "Probabilidade", "EV", "Margem"],
              },
              {
                n: "03",
                title: "Receba a leitura preventiva",
                desc: "Um relatório estruturado com cenário necessário, pontos cegos e leitura conservadora final — tudo antes de qualquer decisão.",
                tags: ["Pontos cegos", "Chance de perda", "Leitura final"],
              },
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

          <div className="lp-steps-cta">
            <Link to="/" className="lp-btn-primary">Testar análise gratuitamente →</Link>
          </div>
        </div>
      </section>

      {/* ── EXEMPLO COMPLETO ───────────────────────────────────────────── */}
      <section className="lp-section" id="exemplo">
        <div className="lp-container">
          <div className="lp-section-label">EXEMPLO REAL</div>
          <h2 className="lp-h2">Veja como a análise funciona na prática.</h2>
          <p className="lp-h2-sub">
            Flamengo x Palmeiras — Resultado final. Odd 2.80. R$100 de exposição.
          </p>

          <div className="lp-exemplo">
            {/* Contexto */}
            <div className="lp-ex-ctx">
              {[
                ["Jogo",   "Flamengo x Palmeiras — Brasileirão Série A"],
                ["Tipo",   "Resultado final — Flamengo vence (1X2)"],
                ["Odd",    "2.80"],
                ["Valor",  "R$100,00"],
              ].map(([k, v]) => (
                <div className="lp-ex-ctx-row" key={k}>
                  <span className="lp-ex-ctx-key">{k}</span>
                  <span className="lp-ex-ctx-val">{v}</span>
                </div>
              ))}
            </div>

            {/* Score */}
            <div className="lp-ex-score">
              <div className="lp-ex-score-tag">SCORE DE RISCO MOTORIA™</div>
              <div className="lp-ex-score-row">
                <div className="lp-ex-score-num">64</div>
                <div className="lp-ex-score-right">
                  <span className="lp-ex-score-badge">ALTO</span>
                  <div className="lp-ex-bar-track">
                    <div className="lp-ex-bar-fill" />
                    {[30, 60, 80].map((t) => (
                      <div key={t} className="lp-ex-bar-tick" style={{ left: `${t}%` }} />
                    ))}
                  </div>
                  <div className="lp-ex-bar-labels">
                    <span>Baixo</span><span>Moderado</span><span>Alto</span><span>Extremo</span>
                  </div>
                </div>
              </div>
              <p className="lp-ex-score-note">
                Score educativo — resume a exposição ao risco. Não recomenda aposta.
              </p>
            </div>

            {/* Indicadores */}
            <div className="lp-ex-ind-grid">
              {[
                { label: "A · PROBABILIDADE IMPLÍCITA", val: "35.7%",    col: "#1FCB7A", sub: "de chance segundo a odd 2.80" },
                { label: "B · CHANCE DE PERDA",         val: "~64.3%",   col: "#FF4D2E", sub: "estimativa conservadora" },
                { label: "MARGEM DA CASA (VIG)",         val: "5.5%",     col: "#FFB020", sub: "taxa invisível por aposta" },
                { label: "VALOR ESPERADO (EV)",          val: "-R$14.50", col: "#FF4D2E", sub: "resultado no longo prazo" },
              ].map((ind) => (
                <div className="lp-ex-ind" key={ind.label}>
                  <div className="lp-ex-ind-label">{ind.label}</div>
                  <div className="lp-ex-ind-val" style={{ color: ind.col }}>{ind.val}</div>
                  <div className="lp-ex-ind-sub">{ind.sub}</div>
                </div>
              ))}
            </div>

            {/* Risco principal */}
            <div className="lp-ex-card lp-ex-card-red">
              <div className="lp-ex-card-label">C · RISCO PRINCIPAL</div>
              <p className="lp-ex-card-text">
                A odd 2.80 exige que o Flamengo vença, mas a probabilidade implícita de 35.7%
                está abaixo do que o histórico do Brasileirão sugere para mandantes em confrontos
                equilibrados. O mercado está precificando incerteza elevada.
              </p>
            </div>

            {/* Pontos cegos */}
            <div className="lp-ex-card lp-ex-card-amber">
              <div className="lp-ex-card-label">E · PONTOS CEGOS</div>
              <ul className="lp-ex-bullets">
                {[
                  "Confrontos diretos entre Flamengo e Palmeiras são historicamente equilibrados.",
                  "Calendário congestionado aumenta a variância de desempenho em ambos os lados.",
                  "A margem de 5.5% da casa torna o valor esperado estruturalmente negativo.",
                  "Resultados de jogos únicos têm alta variância — imprevisíveis por natureza.",
                ].map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>

            {/* Leitura conservadora */}
            <div className="lp-ex-card lp-ex-card-final">
              <div className="lp-ex-card-label">F · LEITURA CONSERVADORA FINAL</div>
              <p className="lp-ex-card-text">
                Com probabilidade implícita de 35.7% e margem estrutural da casa de 5.5%,
                a exposição ao risco nessa aposta é classificada como ALTA. Para apostas
                com esse perfil, a maioria dos cenários resulta em perda financeira ao longo
                do tempo — mesmo com análise cuidadosa do jogo.
              </p>
              <div className="lp-ex-final-note">
                Esta análise tem finalidade educativa. Não constitui recomendação de aposta,
                investimento ou garantia de resultado.
              </div>
            </div>

            <div className="lp-ex-cta">
              <Link to="/" className="lp-btn-primary">Analisar minha aposta →</Link>
              <span className="lp-ex-cta-note">Grátis. Sem cadastro. Sem cartão.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-dark">
        <div className="lp-container">
          <div className="lp-section-label">O QUE DIZEM OS USUÁRIOS</div>
          <h2 className="lp-h2">Decisões mais conscientes.</h2>
          <div className="lp-testimonials">
            {TESTIMONIALS.map((t, i) => (
              <div className="lp-testimonial" key={i}>
                <div className="lp-test-stars">★★★★★</div>
                <p className="lp-test-text">"{t.text}"</p>
                <div className="lp-test-author">
                  <Avatar name={t.name} index={i} />
                  <div>
                    <div className="lp-test-name-row">
                      <strong>{t.name}</strong>, {t.age} anos
                      <span className="lp-test-verified">verificado</span>
                    </div>
                    <span className="lp-test-city">{t.city}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇO ──────────────────────────────────────────────────────── */}
      <section className="lp-section" id="preco">
        <div className="lp-container">
          <div className="lp-section-label">ACESSO COMPLETO</div>
          <h2 className="lp-h2">Uma análise que vale mais do que uma aposta perdida.</h2>
          <div className="lp-pricing">
            <div className="lp-features-list">
              {FEATURES.map((f, i) => (
                <div className="lp-feature-item" key={i}>
                  <span className="lp-feature-check">✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <div className="lp-price-box">
              <div className="lp-price-label">ACESSO VITALÍCIO</div>
              <div className="lp-price-val">R$27</div>
              <div className="lp-price-sub">Pague uma vez. Use para sempre.</div>
              <Link to="/pagar" className="lp-btn-buy">Garantir acesso imediato →</Link>
              <div className="lp-price-guarantee">
                Garantia de 7 dias. Não achou útil?<br />
                Devolvemos 100% sem perguntas.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-dark">
        <div className="lp-container lp-faq-container">
          <div className="lp-section-label">DÚVIDAS</div>
          <h2 className="lp-h2">Perguntas frequentes.</h2>
          <div className="lp-faq">
            {FAQ_ITEMS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────── */}
      <section className="lp-section lp-cta-final">
        <div className="lp-cta-glow" aria-hidden="true" />
        <div className="lp-container lp-cta-inner">
          <div className="lp-tag-pill">FERRAMENTA EDUCATIVA</div>
          <h2 className="lp-final-h2">
            Antes de apostar,<br />entenda o risco.
          </h2>
          <p className="lp-final-sub">
            Acesso imediato por R$27. Vitalício, sem mensalidade.
          </p>
          <div className="lp-final-btns">
            <Link to="/pagar" className="lp-btn-buy">Garantir acesso por R$27 →</Link>
            <Link to="/"      className="lp-btn-ghost-sm">Testar grátis primeiro</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

// ─── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
/* ── Base ─────────────────────────────────────────────────── */
.lp-container {
  max-width: 940px;
  margin: 0 auto;
  padding: 0 24px;
}
.lp-section       { padding: 88px 0; }
.lp-section-dark  { background: #080809; }

.lp-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #1FCB7A;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.lp-h2 {
  font-family: 'Syne', sans-serif;
  font-size: clamp(24px, 4vw, 36px);
  font-weight: 900;
  color: #F2F2F0;
  line-height: 1.18;
  letter-spacing: -0.02em;
  margin-bottom: 14px;
}
.lp-h2-sub {
  font-size: 15px;
  color: #555;
  line-height: 1.7;
  max-width: 540px;
  margin-bottom: 40px;
}

/* ── Colors ───────────────────────────────────────────────── */
.lp-col-green { color: #1FCB7A; }
.lp-col-red   { color: #FF4D2E; }
.lp-col-amber { color: #FFB020; }

/* ── Header ───────────────────────────────────────────────── */
.lp-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(5,5,5,0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.lp-header-inner {
  max-width: 940px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.lp-logo { display: flex; align-items: center; gap: 9px; }
.lp-logo-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px; height: 26px;
  background: #1FCB7A;
  color: #050505;
  font-family: 'Syne', sans-serif;
  font-size: 13px; font-weight: 900;
  border-radius: 6px;
}
.lp-logo-name {
  font-family: 'Syne', sans-serif;
  font-size: 15px; font-weight: 800;
  color: #F2F2F0;
  letter-spacing: -0.02em;
}
.lp-nav { display: flex; align-items: center; gap: 20px; }
.lp-nav-link { font-size: 13px; color: #555; text-decoration: none; transition: color 0.15s; }
.lp-nav-link:hover { color: #F2F2F0; }
.lp-nav-cta {
  font-size: 12px; font-weight: 600;
  color: #1FCB7A; text-decoration: none;
  border: 1px solid rgba(31,203,122,0.3);
  padding: 7px 14px; border-radius: 7px;
  transition: all 0.15s;
}
.lp-nav-cta:hover { background: rgba(31,203,122,0.08); border-color: rgba(31,203,122,0.5); }

/* ── Hero ─────────────────────────────────────────────────── */
.lp-hero {
  position: relative;
  padding: 72px 0 80px;
  background: #050505;
  overflow: hidden;
}
.lp-hero-glow {
  position: absolute;
  top: -80px; left: 50%;
  transform: translateX(-50%);
  width: 800px; height: 500px;
  background: radial-gradient(ellipse, rgba(31,203,122,0.07) 0%, transparent 65%);
  pointer-events: none; z-index: 0;
}
.lp-grid-bg {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none; z-index: 0;
}
.lp-hero-layout {
  position: relative; z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: center;
}
.lp-hero-text { display: flex; flex-direction: column; gap: 0; }

.lp-tag-pill {
  display: inline-block;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em;
  color: #1FCB7A;
  text-transform: uppercase;
  border: 1px solid rgba(31,203,122,0.25);
  background: rgba(31,203,122,0.06);
  padding: 5px 13px;
  border-radius: 99px;
  margin-bottom: 22px;
  align-self: flex-start;
}

.lp-h1 {
  font-family: 'Syne', sans-serif;
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 900;
  color: #F2F2F0;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 20px;
}
.lp-h1-accent { color: rgba(242,242,240,0.55); }

.lp-hero-sub {
  font-size: 15px;
  color: #6B7280;
  line-height: 1.75;
  max-width: 420px;
  margin-bottom: 32px;
}

/* Buttons */
.lp-hero-btns  { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 28px; }
.lp-btn-primary {
  display: inline-flex;
  align-items: center;
  background: #F2F2F0;
  color: #050505;
  font-size: 14px; font-weight: 700;
  padding: 13px 22px;
  border-radius: 10px;
  text-decoration: none;
  transition: opacity 0.15s, transform 0.12s;
  white-space: nowrap;
}
.lp-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
.lp-btn-ghost {
  display: inline-flex;
  align-items: center;
  background: transparent;
  color: #555;
  font-size: 14px; font-weight: 600;
  padding: 13px 20px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.07);
  text-decoration: none;
  transition: all 0.15s;
}
.lp-btn-ghost:hover { border-color: rgba(255,255,255,0.15); color: #F2F2F0; }

/* Trust pills */
.lp-trust-row  { display: flex; flex-wrap: wrap; gap: 8px; }
.lp-trust-pill {
  font-size: 11px; color: #3a3a3c;
  border: 1px solid #1e1e20;
  border-radius: 99px;
  padding: 4px 10px;
  background: rgba(255,255,255,0.02);
  white-space: nowrap;
}

/* ── Mock da ferramenta ───────────────────────────────────── */
.lp-hero-visual { position: relative; }
.lp-mock {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  padding: 20px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04);
}
.lp-mock-hdr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.lp-mock-hdr-title {
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.1em; color: #2a2a2c;
  text-transform: uppercase;
}
.lp-mock-hdr-odd {
  font-size: 10px; color: #333;
  font-family: 'Syne', sans-serif; font-weight: 700;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  padding: 3px 9px; border-radius: 5px;
}

/* Score no mock */
.lp-mock-score {
  background: rgba(255,107,46,0.06);
  border: 1px solid rgba(255,107,46,0.2);
  border-radius: 12px;
  padding: 14px;
}
.lp-mock-score-tag {
  font-size: 8px; font-weight: 700;
  letter-spacing: 0.12em; color: rgba(255,107,46,0.5);
  text-transform: uppercase; margin-bottom: 10px;
}
.lp-mock-score-row { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 10px; }
.lp-mock-score-num {
  font-family: 'Syne', sans-serif;
  font-size: 52px; font-weight: 900;
  line-height: 1; color: #FF6B2E;
  letter-spacing: -0.02em; flex-shrink: 0;
}
.lp-mock-score-right { flex: 1; padding-top: 4px; display: flex; flex-direction: column; gap: 8px; }
.lp-mock-badge {
  font-size: 11px; font-weight: 800;
  letter-spacing: 0.06em;
  background: rgba(255,107,46,0.15);
  color: #FF6B2E;
  border: 1px solid rgba(255,107,46,0.35);
  padding: 4px 11px; border-radius: 6px;
  align-self: flex-start;
}
.lp-mock-bar-track {
  position: relative;
  height: 5px;
  background: rgba(255,255,255,0.05);
  border-radius: 99px;
  overflow: hidden;
}
.lp-mock-bar-fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 64%;
  background: #FF6B2E;
  border-radius: 99px;
}
.lp-mock-bar-glow {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 64%;
  background: linear-gradient(90deg, transparent, rgba(255,107,46,0.3));
  border-radius: 99px;
}
.lp-mock-bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 8px; color: #252525;
  font-weight: 600; letter-spacing: 0.03em;
  text-transform: uppercase; margin-top: 4px;
}
.lp-mock-score-note {
  font-size: 10px; color: #2a2a2c;
  font-style: italic; line-height: 1.5;
  border-top: 1px solid rgba(255,255,255,0.04);
  padding-top: 10px; margin: 0;
}

/* Indicadores do mock */
.lp-mock-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.lp-mock-ind {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 9px;
  padding: 11px 12px;
}
.lp-mock-ind-label {
  font-size: 8px; font-weight: 700;
  letter-spacing: 0.1em; color: #2a2a2c;
  text-transform: uppercase; margin-bottom: 6px;
}
.lp-mock-ind-val {
  font-family: 'Syne', sans-serif;
  font-size: 18px; font-weight: 800;
  line-height: 1;
}
.lp-mock-footer {
  font-size: 10px; color: #1e1e20;
  text-align: center; font-style: italic;
  line-height: 1.5; padding-top: 4px;
}

/* ── VS Section ───────────────────────────────────────────── */
.lp-vs-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  align-items: stretch;
}
.lp-vs-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.06);
}
.lp-vs-left  { border-color: rgba(31,203,122,0.15); background: rgba(31,203,122,0.03); }
.lp-vs-right { border-color: rgba(255,77,46,0.15);  background: rgba(255,77,46,0.03);  }

.lp-vs-card-hdr {
  display: flex; align-items: center; gap: 10px;
  font-size: 12px; font-weight: 700;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.lp-vs-hdr-left { color: #1FCB7A; }
.lp-vs-hdr-right { color: #FF4D2E; }
.lp-vs-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.lp-vs-dot-green { background: #1FCB7A; box-shadow: 0 0 8px rgba(31,203,122,0.6); }
.lp-vs-dot-red   { background: #FF4D2E; box-shadow: 0 0 8px rgba(255,77,46,0.6); }

.lp-vs-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 13px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.lp-vs-row:last-child { border-bottom: none; }
.lp-vs-row-green { background: rgba(31,203,122,0.02); }
.lp-vs-row-red   { background: rgba(255,77,46,0.02); }
.lp-vs-row-label { font-size: 13px; color: #666; }
.lp-vs-row-val {
  font-family: 'Syne', sans-serif;
  font-size: 15px; font-weight: 800;
}

.lp-vs-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 56px; flex-shrink: 0;
}
.lp-vs-div-line { flex: 1; width: 1px; background: rgba(255,255,255,0.05); }
.lp-vs-div-vs {
  font-family: 'Syne', sans-serif;
  font-size: 11px; font-weight: 900;
  color: #222; letter-spacing: 0.05em;
}

/* ── Passos ───────────────────────────────────────────────── */
.lp-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 40px;
}
.lp-step {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 28px 24px;
  display: flex; flex-direction: column; gap: 12px;
  transition: border-color 0.2s;
}
.lp-step:hover { border-color: rgba(31,203,122,0.2); }
.lp-step-n {
  font-family: 'Syne', sans-serif;
  font-size: 13px; font-weight: 900;
  color: rgba(31,203,122,0.5);
  letter-spacing: 0.04em;
}
.lp-step-title {
  font-family: 'Syne', sans-serif;
  font-size: 17px; font-weight: 800;
  color: #F2F2F0; line-height: 1.25;
}
.lp-step-desc { font-size: 14px; color: #666; line-height: 1.7; }
.lp-step-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.lp-step-tag {
  font-size: 10px; font-weight: 600;
  color: #333; border: 1px solid #1a1a1c;
  border-radius: 99px; padding: 3px 9px;
  background: rgba(255,255,255,0.02);
}
.lp-steps-cta { text-align: center; }

/* ── Exemplo ──────────────────────────────────────────────── */
.lp-exemplo {
  background: rgba(255,255,255,0.018);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  padding: 28px;
  display: flex; flex-direction: column; gap: 14px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.3);
}

/* Contexto */
.lp-ex-ctx {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.lp-ex-ctx-row {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px; padding: 7px 12px;
}
.lp-ex-ctx-key {
  font-size: 10px; font-weight: 700;
  color: #333; letter-spacing: 0.05em;
  text-transform: uppercase;
}
.lp-ex-ctx-val { font-size: 13px; color: #888; }

/* Score no exemplo */
.lp-ex-score {
  background: rgba(255,107,46,0.05);
  border: 1px solid rgba(255,107,46,0.18);
  border-radius: 14px;
  padding: 18px;
}
.lp-ex-score-tag {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.12em; color: rgba(255,107,46,0.45);
  text-transform: uppercase; margin-bottom: 12px;
}
.lp-ex-score-row { display: flex; gap: 18px; align-items: flex-start; margin-bottom: 12px; }
.lp-ex-score-num {
  font-family: 'Syne', sans-serif;
  font-size: 60px; font-weight: 900;
  color: #FF6B2E; line-height: 1; flex-shrink: 0;
  letter-spacing: -0.02em;
}
.lp-ex-score-right { flex: 1; display: flex; flex-direction: column; gap: 10px; padding-top: 5px; }
.lp-ex-score-badge {
  font-size: 12px; font-weight: 800;
  letter-spacing: 0.06em;
  background: rgba(255,107,46,0.12);
  color: #FF6B2E;
  border: 1px solid rgba(255,107,46,0.3);
  padding: 5px 13px; border-radius: 7px;
  align-self: flex-start;
}
.lp-ex-bar-track {
  position: relative;
  height: 6px;
  background: rgba(255,255,255,0.05);
  border-radius: 99px; overflow: visible;
}
.lp-ex-bar-fill {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 64%; background: #FF6B2E; border-radius: 99px;
}
.lp-ex-bar-tick {
  position: absolute; top: -3px;
  width: 1px; height: 12px;
  background: rgba(255,255,255,0.1);
  transform: translateX(-50%);
}
.lp-ex-bar-labels {
  display: flex; justify-content: space-between;
  font-size: 9px; color: #2e2e30;
  font-weight: 600; letter-spacing: 0.04em;
  text-transform: uppercase;
}
.lp-ex-score-note {
  font-size: 11px; color: #3a3a3c;
  font-style: italic; line-height: 1.5; margin: 0;
  border-top: 1px solid rgba(255,255,255,0.04);
  padding-top: 12px;
}

/* Indicadores do exemplo */
.lp-ex-ind-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.lp-ex-ind {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 11px; padding: 14px;
}
.lp-ex-ind-label {
  font-size: 8px; font-weight: 700;
  letter-spacing: 0.1em; color: #2e2e30;
  text-transform: uppercase; margin-bottom: 8px;
}
.lp-ex-ind-val {
  font-family: 'Syne', sans-serif;
  font-size: 20px; font-weight: 800;
  line-height: 1; margin-bottom: 4px;
}
.lp-ex-ind-sub { font-size: 10px; color: #444; line-height: 1.4; }

/* Cards do exemplo */
.lp-ex-card {
  border-radius: 13px; padding: 18px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.02);
}
.lp-ex-card-red  { border-color: rgba(255,77,46,0.18);  background: rgba(255,77,46,0.03); }
.lp-ex-card-amber { border-color: rgba(255,176,32,0.18); background: rgba(255,176,32,0.03); }
.lp-ex-card-final { border-color: rgba(255,176,32,0.15); }

.lp-ex-card-label {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.12em; color: #2e2e30;
  text-transform: uppercase; margin-bottom: 12px;
}
.lp-ex-card-text {
  font-size: 14px; color: #888; line-height: 1.72; margin: 0;
}
.lp-ex-bullets {
  list-style: none;
  display: flex; flex-direction: column; gap: 9px;
}
.lp-ex-bullets li {
  font-size: 14px; color: #888;
  padding-left: 20px; position: relative; line-height: 1.65;
}
.lp-ex-bullets li::before {
  content: "—"; position: absolute; left: 0;
  color: #FFB020; font-weight: 700;
}
.lp-ex-final-note {
  font-size: 11px; color: #2e2e30;
  font-style: italic; line-height: 1.6;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 12px; margin-top: 12px;
}
.lp-ex-cta {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  padding-top: 4px;
}
.lp-ex-cta-note { font-size: 12px; color: #333; }

/* ── Depoimentos ──────────────────────────────────────────── */
.lp-testimonials {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}
.lp-testimonial {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 20px;
  display: flex; flex-direction: column; gap: 14px;
  transition: border-color 0.2s;
}
.lp-testimonial:hover { border-color: rgba(255,255,255,0.1); }
.lp-test-stars { font-size: 12px; color: #FFB020; letter-spacing: 2px; }
.lp-test-text  { font-size: 14px; color: #777; line-height: 1.75; font-style: italic; margin: 0; }
.lp-test-author { display: flex; align-items: center; gap: 12px; }
.lp-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; flex-shrink: 0;
  letter-spacing: 0.02em;
}
.lp-test-name-row {
  display: flex; align-items: center;
  gap: 7px; flex-wrap: wrap;
}
.lp-test-name-row strong { font-size: 13px; color: #F2F2F0; }
.lp-test-verified {
  font-size: 9px; font-weight: 700;
  color: #1FCB7A;
  background: rgba(31,203,122,0.08);
  border: 1px solid rgba(31,203,122,0.2);
  padding: 1px 6px; border-radius: 99px;
  letter-spacing: 0.04em;
}
.lp-test-city { font-size: 12px; color: #3a3a3c; }

/* ── Preço ────────────────────────────────────────────────── */
.lp-pricing {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 48px;
  align-items: start;
}
.lp-features-list { display: flex; flex-direction: column; gap: 13px; }
.lp-feature-item {
  display: flex; gap: 12px;
  font-size: 15px; color: #888;
  align-items: baseline;
}
.lp-feature-check { color: #1FCB7A; font-weight: 700; flex-shrink: 0; }

.lp-price-box {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  padding: 30px 26px;
  min-width: 230px;
  display: flex; flex-direction: column; gap: 12px;
  text-align: center;
  position: sticky; top: 80px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.35);
}
.lp-price-label {
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.14em; color: #1FCB7A;
  text-transform: uppercase;
}
.lp-price-val {
  font-family: 'Syne', sans-serif;
  font-size: 48px; font-weight: 900;
  color: #F2F2F0; line-height: 1;
}
.lp-price-sub { font-size: 13px; color: #555; }
.lp-btn-buy {
  display: block;
  background: #F2F2F0; color: #050505;
  font-size: 14px; font-weight: 700;
  padding: 14px 20px;
  border-radius: 10px;
  text-decoration: none; text-align: center;
  transition: opacity 0.15s, transform 0.12s;
  margin-top: 4px;
}
.lp-btn-buy:hover { opacity: 0.88; transform: translateY(-1px); }
.lp-price-guarantee {
  font-size: 12px; color: #3a3a3c;
  line-height: 1.65;
}

/* ── FAQ ──────────────────────────────────────────────────── */
.lp-faq-container { max-width: 640px; }
.lp-faq { display: flex; flex-direction: column; margin-top: 4px; }
.lp-faq-item {
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding: 17px 0; cursor: pointer; user-select: none;
}
.lp-faq-q {
  display: flex; justify-content: space-between;
  align-items: center; gap: 16px;
  font-size: 15px; font-weight: 600; color: #F2F2F0;
}
.lp-faq-icon { font-size: 18px; color: #555; flex-shrink: 0; }
.lp-faq-a {
  font-size: 14px; color: #666;
  line-height: 1.72; margin-top: 12px;
}

/* ── CTA Final ────────────────────────────────────────────── */
.lp-cta-final {
  position: relative;
  text-align: center;
  overflow: hidden;
  background: #050505;
}
.lp-cta-glow {
  position: absolute;
  bottom: -100px; left: 50%;
  transform: translateX(-50%);
  width: 700px; height: 400px;
  background: radial-gradient(ellipse, rgba(31,203,122,0.06) 0%, transparent 65%);
  pointer-events: none;
}
.lp-cta-inner {
  position: relative; z-index: 1;
  max-width: 560px;
  display: flex; flex-direction: column;
  align-items: center; gap: 20px;
}
.lp-final-h2 {
  font-family: 'Syne', sans-serif;
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 900;
  color: #F2F2F0;
  line-height: 1.12;
  letter-spacing: -0.03em;
}
.lp-final-sub { font-size: 15px; color: #555; }
.lp-final-btns {
  display: flex; flex-direction: column;
  align-items: center; gap: 12px;
}
.lp-btn-ghost-sm {
  font-size: 13px; color: #3a3a3c;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.lp-btn-ghost-sm:hover { color: #888; }

/* ── Mobile ───────────────────────────────────────────────── */
@media (max-width: 800px) {
  .lp-hero-layout { grid-template-columns: 1fr; gap: 40px; }
  .lp-hero-text .lp-tag-pill { align-self: center; }
  .lp-hero-text { align-items: center; text-align: center; }
  .lp-hero-sub  { text-align: center; }
  .lp-trust-row { justify-content: center; }
  .lp-hero-btns { justify-content: center; }
  .lp-steps     { grid-template-columns: 1fr; }
  .lp-pricing   { grid-template-columns: 1fr; }
  .lp-price-box { position: static; min-width: 0; }
  .lp-ex-ind-grid { grid-template-columns: 1fr 1fr; }
  .lp-nav-link  { display: none; }
}
@media (max-width: 640px) {
  .lp-section { padding: 60px 0; }
  .lp-vs-grid { grid-template-columns: 1fr; gap: 16px; }
  .lp-vs-divider { flex-direction: row; width: auto; height: 36px; }
  .lp-vs-div-line { flex: none; width: 60px; height: 1px; }
  .lp-ex-ind-grid { grid-template-columns: 1fr 1fr; }
  .lp-exemplo { padding: 20px 16px; }
  .lp-mock { padding: 16px; }
  .lp-ex-score-num { font-size: 48px; }
  .lp-mock-score-num { font-size: 42px; }
  .lp-testimonials { grid-template-columns: 1fr; }
}
@media (max-width: 400px) {
  .lp-ex-ind-grid { grid-template-columns: 1fr; }
  .lp-mock-grid { grid-template-columns: 1fr; }
}
`;
