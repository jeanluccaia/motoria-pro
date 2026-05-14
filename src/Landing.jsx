import { useState } from "react";
import { LegalBar, Footer } from "./Layout";
import { Link } from "./router";

// ─── Dados ─────────────────────────────────────────────────────────────────────

const ANALISA = [
  { icon: "⟳", title: "Probabilidade implícita",  desc: "Quanto a odd revela sobre a chance real do evento acontecer — calculado na hora." },
  { icon: "▼", title: "Margem da casa (vig)",       desc: "A taxa invisível embutida em toda odd. Você nunca vê, mas sempre paga." },
  { icon: "◎", title: "Exposição ao risco",         desc: "Score 0–100 que resume o nível de risco real da aposta de forma objetiva." },
  { icon: "✕", title: "Chance de perda",            desc: "Estimativa educativa da probabilidade de perder baseada nos dados da odd." },
  { icon: "AI", title: "Leitura preventiva com IA", desc: "Análise contextual com pontos cegos, cenário necessário e leitura conservadora." },
];

const TESTIMONIALS = [
  { name: "Ricardo M.", age: 34, city: "São Paulo",      text: "Finalmente entendi por que perdia toda semana. A margem da casa me engolia e eu nem sabia disso." },
  { name: "Ana C.",     age: 28, city: "Belo Horizonte", text: "Vi que minha odd 'segura' de 1.50 tinha 66% de chance de dar errado. Nunca mais apostei sem analisar antes." },
  { name: "Felipe S.",  age: 41, city: "Rio de Janeiro", text: "O alerta de tilt salvou meu mês. Ia dobrar o prejuízo tentando recuperar e nem percebia." },
  { name: "Mariana T.", age: 25, city: "Curitiba",       text: "Simples, direto, honesto. Não promete nada mas mostra tudo que a casa esconde na odd." },
  { name: "Gustavo R.", age: 37, city: "Porto Alegre",   text: "Em anos apostando, nunca tinha visto meu prejuízo projetado calculado assim. Assustador e essencial." },
  { name: "Cássia F.",  age: 44, city: "Salvador",       text: "Meu marido apostava R$200 por semana. Depois da simulação de 30 dias, parou na hora." },
];

const FEATURES = [
  "Análises ilimitadas — sem limite diário",
  "Score de Risco MotorIA™ (0–100) por aposta",
  "Probabilidade implícita calculada na hora",
  "Margem da casa (vig) decodificada por mercado",
  "Simulador de bankroll — projeção 30 e 90 dias",
  "Detector de tilt — alerta comportamental de risco",
  "8 indicadores matemáticos por análise completa",
  "Diário de apostas: resultado real vs esperado",
  "Acesso vitalício — pague uma vez, use para sempre",
];

const FAQ_ITEMS = [
  { q: "Funciona para qualquer esporte?",           a: "Sim. A análise se baseia na matemática da odd, que é universal — futebol, basquete, tênis, MMA, eSports e qualquer mercado com odds." },
  { q: "Vocês são uma casa de aposta?",             a: "Não. Somos uma ferramenta educativa independente. Não fazemos apostas, não vendemos odds e não temos nenhuma relação com casas de aposta." },
  { q: "É assinatura mensal?",                      a: "Não. Você paga R$27 uma vez e tem acesso vitalício. Sem renovações, sem surpresas." },
  { q: "Vocês dão palpites ou previsões?",          a: "Nunca. Mostramos riscos, probabilidades matemáticas e impacto financeiro. A decisão é sempre sua." },
  { q: "Como recebo o acesso após o pagamento?",    a: "Imediatamente. Após o pagamento confirmado, você recebe o link de acesso no email de confirmação." },
  { q: "Funciona no celular?",                      a: "Sim. A ferramenta é 100% mobile-first, feita para usar antes de qualquer decisão, de onde você estiver." },
  { q: "E se eu já estou com problemas com jogo?", a: "Procure ajuda imediatamente. Acesse jogoresponsavel.com.br ou ligue para o CVV: 188. Problema com jogo é sério e tem tratamento." },
  { q: "Como funciona a garantia?",                 a: "7 dias corridos a partir da compra. Não achou útil? Basta enviar um email e devolvemos 100% sem perguntas." },
];

const AVATAR_PALETTES = [
  { bg: "rgba(31,203,122,0.12)",  border: "rgba(31,203,122,0.3)",  color: "#1FCB7A" },
  { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)",  color: "#818cf8" },
  { bg: "rgba(255,176,32,0.12)",  border: "rgba(255,176,32,0.3)",  color: "#FFB020" },
  { bg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.3)", color: "#f472b6" },
  { bg: "rgba(45,212,191,0.12)",  border: "rgba(45,212,191,0.3)",  color: "#2dd4bf" },
  { bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.3)",  color: "#fb923c" },
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
    <div className="lp-faq-item" onClick={() => setOpen(!open)}>
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
            <span className="lp-logo-mark">M</span>
            <span className="lp-logo-name">MotorIA Pro</span>
          </div>
          <nav className="lp-nav">
            <a href="#problema"      className="lp-nav-link">O problema</a>
            <a href="#como-funciona" className="lp-nav-link">Como funciona</a>
            <a href="#preco"         className="lp-nav-link">Preço</a>
            <Link to="/ferramenta"   className="lp-nav-cta">Acessar ferramenta</Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-glow"  aria-hidden="true" />
        <div className="lp-grid-bg"    aria-hidden="true" />
        <div className="lp-container lp-hero-inner">
          <div className="lp-tag-pill">FERRAMENTA EDUCATIVA DE ANÁLISE PREVENTIVA</div>
          <h1 className="lp-h1">
            O que as plataformas<br />
            <span className="lp-h1-accent">de aposta não te explicam.</span>
          </h1>
          <p className="lp-hero-sub">
            Antes de tomar qualquer decisão, entenda a chance de perder,
            a margem implícita e o risco real por trás dos números.
          </p>
          <div className="lp-hero-btns">
            <Link to="/ferramenta" className="lp-btn-primary">Acessar análise preventiva →</Link>
            <a href="#como-funciona" className="lp-btn-ghost">Ver como funciona</a>
          </div>
          <div className="lp-trust-row">
            {["Não é casa de aposta", "Não vende previsões", "Não promete lucro", "Grátis para testar"].map((t) => (
              <span className="lp-trust-pill" key={t}>{t}</span>
            ))}
          </div>
          <div className="lp-stats-bar">
            <div className="lp-stat">
              <span className="lp-stat-num">8</span>
              <span className="lp-stat-label">indicadores por análise</span>
            </div>
            <div className="lp-stat-div" />
            <div className="lp-stat">
              <span className="lp-stat-num">&lt;60s</span>
              <span className="lp-stat-label">resultado em segundos</span>
            </div>
            <div className="lp-stat-div" />
            <div className="lp-stat">
              <span className="lp-stat-num">0</span>
              <span className="lp-stat-label">cadastro necessário</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── ALERTA MATEMÁTICO ────────────────────────────────────────────────── */}
      <div className="lp-alert-strip">
        <div className="lp-container">
          <div className="lp-alert-inner">
            <div className="lp-alert-item">
              <span className="lp-alert-num lp-num-amber">5,5%</span>
              <span className="lp-alert-desc">da sua aposta vai para a casa — invisível, em toda odd</span>
            </div>
            <div className="lp-alert-sep" />
            <div className="lp-alert-item">
              <span className="lp-alert-num lp-num-red">64%</span>
              <span className="lp-alert-desc">de chance de perda numa odd 2.80 que parece "atraente"</span>
            </div>
            <div className="lp-alert-sep" />
            <div className="lp-alert-item">
              <span className="lp-alert-num lp-num-red">−R$412</span>
              <span className="lp-alert-desc">projeção de 30 dias apostando 5× por semana nesse perfil</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── O PROBLEMA ───────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-dark" id="problema">
        <div className="lp-container lp-problema-grid">
          <div className="lp-problema-text">
            <div className="lp-section-label">O PROBLEMA</div>
            <h2 className="lp-h2">
              A plataforma mostra o retorno.<br />Esconde o risco.
            </h2>
            <p className="lp-problema-desc">
              As plataformas mostram odds, retorno possível e lucro potencial.
              Mas quase nunca explicam a probabilidade implícita,
              a margem da casa e a exposição ao risco — os números que realmente importam
              antes de qualquer decisão.
            </p>
            <div className="lp-problema-items">
              {[
                "Odd 2.80 parece atraente. A casa só te mostra o retorno possível.",
                "A margem embutida (5,5%) torna o valor esperado estruturalmente negativo.",
                "64% de chance de perda — nenhuma plataforma calcula isso pra você.",
              ].map((item, i) => (
                <div className="lp-problema-item" key={i}>
                  <span className="lp-problema-dash">—</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-problema-card">
            <div className="lp-pcard-label">O QUE A PLATAFORMA MOSTRA</div>
            {[["Retorno se ganhar", "+R$280,00", "green"], ["Lucro possível", "R$180,00", "green"], ["Odd", "2.80", "neutral"]].map(([l, v, c]) => (
              <div className="lp-pcard-row" key={l}>
                <span className="lp-pcard-row-label">{l}</span>
                <span className={`lp-pcard-row-val ${c === "green" ? "lp-num-green" : "lp-num-muted"}`}>{v}</span>
              </div>
            ))}
            <div className="lp-pcard-div" />
            <div className="lp-pcard-label lp-pcard-label-red">O QUE ELA ESCONDE</div>
            {[["Probabilidade implícita", "35,7%", "red"], ["Margem da casa", "5,5%", "amber"], ["Chance de perda", "64,3%", "red"], ["Valor esperado", "−R$14,50", "red"]].map(([l, v, c]) => (
              <div className="lp-pcard-row" key={l}>
                <span className="lp-pcard-row-label">{l}</span>
                <span className={`lp-pcard-row-val lp-num-${c}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── O QUE O MOTORIA PRO ANALISA ──────────────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-label">O QUE O MOTORIA PRO ANALISA</div>
          <h2 className="lp-h2">5 dimensões de risco. Em menos de 60 segundos.</h2>
          <p className="lp-h2-sub">
            Cada análise entrega um relatório completo com os dados que as plataformas omitem.
          </p>
          <div className="lp-analisa-grid">
            {ANALISA.map((item) => (
              <div className="lp-analisa-card" key={item.title}>
                <div className="lp-analisa-icon">{item.icon}</div>
                <h3 className="lp-analisa-title">{item.title}</h3>
                <p className="lp-analisa-desc">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="lp-analisa-cta">
            <Link to="/ferramenta" className="lp-btn-primary">Conhecer a ferramenta →</Link>
          </div>
        </div>
      </section>

      {/* ── FOTO + QUOTE ─────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-dark">
        <div className="lp-container lp-photo-grid">
          <div className="lp-photo-wrap">
            <img
              src="/jean-analise.png"
              alt="Jean Lucca"
              className="lp-photo"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
          <div className="lp-photo-text">
            <div className="lp-section-label">QUEM ESTÁ POR TRÁS</div>
            <h2 className="lp-h2 lp-photo-h2">
              Eu comecei a estudar o que quase ninguém mostra.
            </h2>
            <p className="lp-photo-quote">
              "O prejuízo provável antes da aposta acontecer. Não existe forma mais honesta
              de ajudar alguém a tomar uma decisão consciente do que mostrar o risco real
              antes — não depois."
            </p>
            <div className="lp-photo-name">Jean Lucca · Criador do MotorIA Pro</div>
            <Link to="/ferramenta" className="lp-btn-primary lp-photo-cta">
              Acessar análise preventiva →
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────────────────────── */}
      <section className="lp-section" id="como-funciona">
        <div className="lp-container">
          <div className="lp-section-label">COMO FUNCIONA</div>
          <h2 className="lp-h2">Três etapas. Menos de um minuto.</h2>
          <div className="lp-steps">
            {[
              { n: "01", title: "Insira a odd e o contexto",        desc: "Informe o jogo, tipo de aposta, odd e valor pretendido. Quanto mais contexto, mais precisa a leitura.",        tags: ["Evento", "Odd", "Tipo", "Valor"] },
              { n: "02", title: "A IA calcula a exposição ao risco", desc: "Probabilidade implícita, margem da casa, valor esperado e pontos cegos — calculados automaticamente.",          tags: ["Score 0–100", "Probabilidade", "EV", "Margem"] },
              { n: "03", title: "Receba a leitura preventiva",       desc: "Relatório estruturado com cenário necessário, pontos cegos e leitura conservadora — antes de qualquer decisão.", tags: ["Pontos cegos", "Chance de perda", "Leitura final"] },
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
            <Link to="/ferramenta" className="lp-btn-primary">Entender o risco antes de decidir →</Link>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ──────────────────────────────────────────────────────── */}
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

      {/* ── PREÇO ────────────────────────────────────────────────────────────── */}
      <section className="lp-section" id="preco">
        <div className="lp-container">
          <div className="lp-section-label">ACESSO COMPLETO</div>
          <h2 className="lp-h2">Menos do que uma aposta perdida.</h2>
          <p className="lp-h2-sub">
            Uma análise que custa R$27 pode te fazer entender por que você perde
            muito mais do que isso toda semana.
          </p>
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
              <div className="lp-price-display">
                <span className="lp-price-curr">R$</span>
                <span className="lp-price-int">27</span>
              </div>
              <div className="lp-price-sub">Pague uma vez. Use para sempre.</div>
              <Link to="/pagar" className="lp-btn-buy">
                Garantir acesso imediato →
              </Link>
              <div className="lp-guarantee-card">
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
        <div className="lp-container lp-faq-container">
          <div className="lp-section-label">DÚVIDAS</div>
          <h2 className="lp-h2">Perguntas frequentes.</h2>
          <div className="lp-faq">
            {FAQ_ITEMS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────────── */}
      <section className="lp-section lp-cta-final">
        <div className="lp-cta-glow" aria-hidden="true" />
        <div className="lp-container lp-cta-inner">
          <div className="lp-tag-pill">FERRAMENTA EDUCATIVA</div>
          <h2 className="lp-final-h2">
            Entender o risco<br />antes de decidir.
          </h2>
          <p className="lp-final-sub">Acesso imediato por R$27. Vitalício, sem mensalidade.</p>
          <div className="lp-final-btns">
            <Link to="/pagar"      className="lp-btn-buy lp-btn-buy-lg">Garantir acesso por R$27 →</Link>
            <Link to="/ferramenta" className="lp-btn-ghost-sm">Testar grátis primeiro</Link>
          </div>
          <div className="lp-final-trust">
            <span>Sem cadastro para testar</span>
            <span>·</span>
            <span>Garantia de 7 dias</span>
            <span>·</span>
            <span>Não é casa de aposta</span>
          </div>
          <div className="lp-final-disclaimer">
            Ferramenta educativa. Não garante resultados. Não incentiva apostas.
            Uso recomendado apenas para maiores de 18 anos.
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

// ─── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
/* ── Reset / base ──────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
.lp-container { max-width: 980px; margin: 0 auto; padding: 0 24px; }
.lp-section { padding: 88px 0; }
.lp-section-dark { background: #080809; }

/* Números — sempre alinhados */
.lp-num-green   { color: #22c55e; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }
.lp-num-red     { color: #ef4444; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }
.lp-num-amber   { color: #f59e0b; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }
.lp-num-muted   { color: #6b7280; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }

.lp-section-label {
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.16em; color: #22c55e;
  text-transform: uppercase; margin-bottom: 14px;
}
.lp-h2 {
  font-size: clamp(22px, 3.5vw, 36px);
  font-weight: 800; color: #f2f2f0;
  line-height: 1.18; letter-spacing: -0.025em;
  margin-bottom: 12px;
}
.lp-h2-sub {
  font-size: 15px; color: #4b5563;
  line-height: 1.78; max-width: 520px;
  margin-bottom: 44px;
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.lp-header {
  position: sticky; top: 0; z-index: 100;
  background: rgba(5,5,5,0.96);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.lp-header-inner {
  max-width: 980px; margin: 0 auto;
  padding: 14px 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.lp-logo { display: flex; align-items: center; gap: 9px; }
.lp-logo-mark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px;
  background: #22c55e; color: #050505;
  font-size: 13px; font-weight: 900; border-radius: 6px;
}
.lp-logo-name {
  font-size: 15px; font-weight: 800;
  color: #f2f2f0; letter-spacing: -0.02em;
}
.lp-nav { display: flex; align-items: center; gap: 22px; }
.lp-nav-link { font-size: 13px; color: #4b5563; text-decoration: none; transition: color .15s; }
.lp-nav-link:hover { color: #f2f2f0; }
.lp-nav-cta {
  font-size: 12px; font-weight: 600;
  color: #22c55e; text-decoration: none;
  border: 1px solid rgba(34,197,94,.3);
  padding: 7px 15px; border-radius: 8px; transition: all .15s;
  white-space: nowrap;
}
.lp-nav-cta:hover { background: rgba(34,197,94,.07); border-color: rgba(34,197,94,.5); }

/* ── Hero ────────────────────────────────────────────────────────────────── */
.lp-hero {
  position: relative; padding: 100px 0 96px;
  background: #050505; overflow: hidden;
}
.lp-hero-glow {
  position: absolute; top: -100px; left: 50%; transform: translateX(-50%);
  width: 900px; height: 600px;
  background: radial-gradient(ellipse, rgba(34,197,94,.07) 0%, transparent 65%);
  pointer-events: none; z-index: 0;
}
.lp-grid-bg {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,.035) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none; z-index: 0;
}
.lp-hero-inner {
  position: relative; z-index: 1;
  display: flex; flex-direction: column;
  align-items: center; text-align: center;
  gap: 0;
}

.lp-tag-pill {
  display: inline-block;
  font-size: 10px; font-weight: 700;
  letter-spacing: .14em; color: #22c55e;
  text-transform: uppercase;
  border: 1px solid rgba(34,197,94,.25);
  background: rgba(34,197,94,.06);
  padding: 5px 14px; border-radius: 99px;
  margin-bottom: 28px;
}
.lp-h1 {
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 900; color: #f2f2f0;
  line-height: 1.06; letter-spacing: -0.035em;
  margin-bottom: 22px;
}
.lp-h1-accent { color: rgba(242,242,240,.38); }
.lp-hero-sub {
  font-size: 16px; color: #6b7280;
  line-height: 1.75; max-width: 520px;
  margin-bottom: 36px;
}

/* Buttons */
.lp-hero-btns { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-bottom: 28px; }
.lp-btn-primary {
  display: inline-flex; align-items: center;
  background: #f2f2f0; color: #050505;
  font-size: 14px; font-weight: 700;
  padding: 13px 24px; border-radius: 10px;
  text-decoration: none; white-space: nowrap;
  transition: opacity .15s, transform .12s;
}
.lp-btn-primary:hover { opacity: .88; transform: translateY(-1px); }
.lp-btn-ghost {
  display: inline-flex; align-items: center;
  background: transparent; color: #4b5563;
  font-size: 14px; font-weight: 600;
  padding: 13px 20px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,.07);
  text-decoration: none; transition: all .15s;
}
.lp-btn-ghost:hover { border-color: rgba(255,255,255,.15); color: #f2f2f0; }

/* Trust pills */
.lp-trust-row  { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; margin-bottom: 32px; }
.lp-trust-pill {
  font-size: 11px; color: #374151;
  border: 1px solid #1c1c1e; border-radius: 99px;
  padding: 4px 11px; background: rgba(255,255,255,.015);
  white-space: nowrap;
}

/* Stats bar */
.lp-stats-bar { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; justify-content: center; }
.lp-stat { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.lp-stat-num {
  font-size: 22px; font-weight: 900;
  color: #f2f2f0; line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.025em;
}
.lp-stat-label { font-size: 11px; color: #374151; }
.lp-stat-div { width: 1px; height: 36px; background: rgba(255,255,255,.06); flex-shrink: 0; }

/* ── Alert strip ─────────────────────────────────────────────────────────── */
.lp-alert-strip {
  background: #070708;
  border-top: 1px solid rgba(255,255,255,.04);
  border-bottom: 1px solid rgba(255,255,255,.04);
  padding: 36px 0;
}
.lp-alert-inner {
  display: flex; align-items: stretch;
  justify-content: center; flex-wrap: wrap;
}
.lp-alert-item {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 36px; flex: 1; min-width: 220px;
}
.lp-alert-num {
  font-size: 36px; font-weight: 900;
  line-height: 1; flex-shrink: 0;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
.lp-alert-desc { font-size: 13px; color: #4b5563; line-height: 1.55; }
.lp-alert-sep { width: 1px; background: rgba(255,255,255,.05); flex-shrink: 0; align-self: stretch; }

/* ── O Problema ──────────────────────────────────────────────────────────── */
.lp-problema-grid {
  display: grid; grid-template-columns: 1fr 340px;
  gap: 56px; align-items: start;
}
.lp-problema-desc {
  font-size: 15px; color: #4b5563;
  line-height: 1.8; margin-bottom: 28px;
}
.lp-problema-items { display: flex; flex-direction: column; gap: 12px; }
.lp-problema-item {
  display: flex; gap: 12px;
  font-size: 14px; color: #374151; line-height: 1.65;
}
.lp-problema-dash { color: #22c55e; font-weight: 700; flex-shrink: 0; }

/* Card do problema */
.lp-problema-card {
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 16px; padding: 22px;
  display: flex; flex-direction: column; gap: 0;
}
.lp-pcard-label {
  font-size: 9px; font-weight: 700;
  letter-spacing: .14em; color: #2a2a2c;
  text-transform: uppercase;
  padding-bottom: 12px; margin-bottom: 4px;
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.lp-pcard-label-red { color: rgba(239,68,68,.45); margin-top: 12px; }
.lp-pcard-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,.03);
}
.lp-pcard-row:last-child { border-bottom: none; }
.lp-pcard-row-label { font-size: 13px; color: #374151; }
.lp-pcard-row-val {
  font-size: 15px; font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  white-space: nowrap; min-width: 72px; text-align: right;
}
.lp-pcard-div {
  height: 1px; background: rgba(255,255,255,.05);
  margin: 8px 0;
}

/* ── O que analisa ───────────────────────────────────────────────────────── */
.lp-analisa-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px; margin-bottom: 44px;
}
.lp-analisa-card {
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 14px; padding: 22px 18px;
  display: flex; flex-direction: column; gap: 10px;
  transition: border-color .2s, transform .2s;
}
.lp-analisa-card:hover {
  border-color: rgba(34,197,94,.2);
  transform: translateY(-2px);
}
.lp-analisa-icon {
  font-size: 18px; color: #22c55e;
  font-weight: 900; line-height: 1;
}
.lp-analisa-title {
  font-size: 14px; font-weight: 700;
  color: #f2f2f0; line-height: 1.25;
}
.lp-analisa-desc { font-size: 12px; color: #4b5563; line-height: 1.65; }
.lp-analisa-cta { text-align: center; }

/* ── Foto + Quote ────────────────────────────────────────────────────────── */
.lp-photo-grid {
  display: grid; grid-template-columns: 340px 1fr;
  gap: 60px; align-items: center;
}
.lp-photo-wrap {
  position: relative;
  border-radius: 18px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.02);
  aspect-ratio: 3/4; min-height: 320px;
  box-shadow: 0 24px 64px rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center;
}
.lp-photo {
  width: 100%; height: 100%;
  object-fit: cover; object-position: center top;
  display: block;
}
.lp-photo-h2 { margin-bottom: 20px; }
.lp-photo-quote {
  font-size: 15px; color: #6b7280;
  line-height: 1.82; font-style: italic;
  border-left: 2px solid rgba(34,197,94,.3);
  padding-left: 18px; margin-bottom: 20px;
}
.lp-photo-name {
  font-size: 13px; font-weight: 600; color: #4b5563;
  margin-bottom: 28px;
}
.lp-photo-cta { align-self: flex-start; }

/* ── Steps ───────────────────────────────────────────────────────────────── */
.lp-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; margin-bottom: 44px; }
.lp-step {
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 16px; padding: 28px 22px;
  display: flex; flex-direction: column; gap: 12px;
  transition: border-color .2s;
}
.lp-step:hover { border-color: rgba(34,197,94,.2); }
.lp-step-n {
  font-size: 12px; font-weight: 900;
  color: rgba(34,197,94,.45); letter-spacing: .05em;
}
.lp-step-title {
  font-size: 16px; font-weight: 800;
  color: #f2f2f0; line-height: 1.25;
}
.lp-step-desc { font-size: 14px; color: #4b5563; line-height: 1.72; }
.lp-step-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.lp-step-tag {
  font-size: 10px; font-weight: 600; color: #1f2937;
  border: 1px solid #161618; border-radius: 99px;
  padding: 3px 9px; background: rgba(255,255,255,.015);
}
.lp-steps-cta { text-align: center; }

/* ── Depoimentos ─────────────────────────────────────────────────────────── */
.lp-testimonials {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px,1fr));
  gap: 14px; margin-top: 8px;
}
.lp-testimonial {
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 14px; padding: 22px;
  display: flex; flex-direction: column; gap: 14px;
  transition: border-color .2s;
}
.lp-testimonial:hover { border-color: rgba(255,255,255,.1); }
.lp-test-stars  { font-size: 12px; color: #f59e0b; letter-spacing: 2px; }
.lp-test-text   { font-size: 14px; color: #6b7280; line-height: 1.75; font-style: italic; margin: 0; }
.lp-test-author { display: flex; align-items: center; gap: 12px; }
.lp-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; flex-shrink: 0;
}
.lp-test-name-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.lp-test-name-row strong { font-size: 13px; color: #f2f2f0; }
.lp-test-verified {
  font-size: 9px; font-weight: 700; color: #22c55e;
  background: rgba(34,197,94,.08);
  border: 1px solid rgba(34,197,94,.2);
  padding: 1px 6px; border-radius: 99px;
}
.lp-test-city { font-size: 12px; color: #1f2937; }

/* ── Preço ───────────────────────────────────────────────────────────────── */
.lp-pricing { display: grid; grid-template-columns: 1fr auto; gap: 56px; align-items: start; }
.lp-features-list { display: flex; flex-direction: column; gap: 15px; }
.lp-feature-item { display: flex; gap: 12px; font-size: 15px; color: #6b7280; align-items: baseline; }
.lp-feature-check { color: #22c55e; font-weight: 700; flex-shrink: 0; }
.lp-price-box {
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px; padding: 30px 26px;
  min-width: 250px;
  display: flex; flex-direction: column; gap: 16px;
  text-align: center;
  position: sticky; top: 80px;
  box-shadow: 0 24px 64px rgba(0,0,0,.3);
}
.lp-price-label {
  font-size: 10px; font-weight: 700;
  letter-spacing: .14em; color: #22c55e; text-transform: uppercase;
}
.lp-price-display {
  display: flex; align-items: flex-start;
  justify-content: center; gap: 3px;
  line-height: 1;
}
.lp-price-curr {
  font-size: 22px; font-weight: 700;
  color: #6b7280; padding-top: 12px; line-height: 1;
}
.lp-price-int {
  font-size: 80px; font-weight: 900;
  color: #f2f2f0; line-height: 1;
  letter-spacing: -0.045em;
  font-variant-numeric: tabular-nums;
}
.lp-price-sub { font-size: 13px; color: #374151; }
.lp-btn-buy {
  display: block;
  background: #f2f2f0; color: #050505;
  font-size: 14px; font-weight: 700;
  padding: 15px 20px; border-radius: 10px;
  text-decoration: none; text-align: center;
  transition: opacity .15s, transform .12s;
}
.lp-btn-buy:hover { opacity: .88; transform: translateY(-1px); }
.lp-btn-buy-lg { font-size: 15px; padding: 16px 30px; }
.lp-guarantee-card {
  display: flex; align-items: flex-start; gap: 12px;
  background: rgba(34,197,94,.04);
  border: 1px solid rgba(34,197,94,.15);
  border-radius: 10px; padding: 13px 14px;
  text-align: left;
}
.lp-guarantee-icon {
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(34,197,94,.12); color: #22c55e;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.lp-guarantee-title { font-size: 13px; font-weight: 700; color: #f2f2f0; margin-bottom: 3px; }
.lp-guarantee-sub   { font-size: 11px; color: #4b5563; line-height: 1.5; }

/* ── FAQ ─────────────────────────────────────────────────────────────────── */
.lp-faq-container { max-width: 640px; }
.lp-faq { display: flex; flex-direction: column; margin-top: 4px; }
.lp-faq-item {
  border-bottom: 1px solid rgba(255,255,255,.05);
  padding: 18px 0; cursor: pointer; user-select: none;
}
.lp-faq-q {
  display: flex; justify-content: space-between;
  align-items: center; gap: 16px;
  font-size: 15px; font-weight: 600; color: #f2f2f0;
}
.lp-faq-icon { font-size: 18px; color: #4b5563; flex-shrink: 0; }
.lp-faq-a { font-size: 14px; color: #4b5563; line-height: 1.72; margin-top: 12px; }

/* ── CTA Final ───────────────────────────────────────────────────────────── */
.lp-cta-final {
  position: relative; text-align: center;
  overflow: hidden; background: #050505;
}
.lp-cta-glow {
  position: absolute; bottom: -100px; left: 50%; transform: translateX(-50%);
  width: 700px; height: 400px;
  background: radial-gradient(ellipse, rgba(34,197,94,.06) 0%, transparent 65%);
  pointer-events: none;
}
.lp-cta-inner {
  position: relative; z-index: 1;
  max-width: 560px; display: flex;
  flex-direction: column; align-items: center; gap: 20px;
}
.lp-final-h2 {
  font-size: clamp(28px,5vw,48px); font-weight: 900;
  color: #f2f2f0; line-height: 1.1; letter-spacing: -0.03em;
}
.lp-final-sub { font-size: 15px; color: #4b5563; }
.lp-final-btns { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.lp-btn-ghost-sm {
  font-size: 13px; color: #374151;
  text-decoration: underline; text-underline-offset: 3px;
  cursor: pointer; background: none; border: none;
}
.lp-btn-ghost-sm:hover { color: #6b7280; }
.lp-final-trust {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  justify-content: center; font-size: 12px; color: #1f2937;
}
.lp-final-disclaimer {
  font-size: 11px; color: #1f2937;
  line-height: 1.6; text-align: center;
  border-top: 1px solid rgba(255,255,255,.04);
  padding-top: 20px; max-width: 420px;
}

/* ── Mobile ──────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .lp-analisa-grid { grid-template-columns: repeat(3, 1fr); }
  .lp-problema-grid { grid-template-columns: 1fr; gap: 36px; }
  .lp-photo-grid { grid-template-columns: 1fr; gap: 36px; }
  .lp-photo-wrap { max-width: 320px; margin: 0 auto; aspect-ratio: 3/4; }
  .lp-pricing { grid-template-columns: 1fr; }
  .lp-price-box { position: static; min-width: 0; }
}
@media (max-width: 700px) {
  .lp-section { padding: 64px 0; }
  .lp-hero { padding: 72px 0 72px; }
  .lp-steps { grid-template-columns: 1fr; }
  .lp-analisa-grid { grid-template-columns: 1fr 1fr; }
  .lp-nav-link { display: none; }
  .lp-alert-inner { flex-direction: column; }
  .lp-alert-sep { width: 80%; height: 1px; align-self: center; }
  .lp-alert-item { justify-content: flex-start; padding: 18px 24px; min-width: 0; }
  .lp-testimonials { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .lp-analisa-grid { grid-template-columns: 1fr; }
  .lp-price-int { font-size: 64px; }
  .lp-h1 { font-size: clamp(30px, 8vw, 48px); }
  .lp-hero-btns { flex-direction: column; align-items: center; }
}
`;
