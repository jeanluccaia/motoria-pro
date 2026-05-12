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
  { q: "Funciona no celular?",                      a: "Sim. A ferramenta é 100% mobile-first, feita para usar antes de apostar, de onde você estiver." },
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

      {/* ── HEADER ─────────────────────────────────────── */}
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
            <Link to="/ferramenta"   className="lp-nav-cta">Testar grátis</Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-glow"   aria-hidden="true" />
        <div className="lp-grid-bg"     aria-hidden="true" />
        <div className="lp-container">
          <div className="lp-hero-layout">

            <div className="lp-hero-text">
              <div className="lp-tag-pill">FERRAMENTA EDUCATIVA DE ANÁLISE DE RISCO</div>
              <h1 className="lp-h1">
                Antes de apostar,<br />
                <span className="lp-h1-accent">entenda o risco.</span>
              </h1>
              <p className="lp-hero-sub">
                Ferramenta educativa que calcula probabilidade implícita,
                margem da casa e chance de perda em segundos —
                antes de qualquer decisão.
              </p>
              <div className="lp-hero-btns">
                <Link to="/ferramenta" className="lp-btn-primary">Analisar minha aposta →</Link>
                <a href="#exemplo"     className="lp-btn-ghost">Ver exemplo real</a>
              </div>
              <div className="lp-trust-row">
                {["Não é casa de aposta","Não vende previsões","Não promete lucro","Grátis para testar"].map((t) => (
                  <span className="lp-trust-pill" key={t}>{t}</span>
                ))}
              </div>
              {/* Stats bar */}
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

            {/* Mock da ferramenta */}
            <div className="lp-hero-visual">
              <div className="lp-mock">
                <div className="lp-mock-hdr">
                  <span className="lp-mock-hdr-title">Relatório de risco</span>
                  <span className="lp-mock-hdr-odd">odd 2.80</span>
                </div>

                <div className="lp-mock-score-card">
                  <div className="lp-mock-score-tag">SCORE DE RISCO MOTORIA™</div>
                  <div className="lp-mock-score-row">
                    <div className="lp-mock-score-num">64</div>
                    <div className="lp-mock-score-right">
                      <span className="lp-mock-badge">ALTO</span>
                      <div className="lp-mock-bar-wrap">
                        <div className="lp-mock-bar-track">
                          <div className="lp-mock-bar-fill" />
                        </div>
                        <div className="lp-mock-bar-labels">
                          <span>Baixo</span><span>Mod.</span><span>Alto</span><span>Extr.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lp-mock-grid">
                  {[
                    { label: "PROB. IMPLÍCITA",  val: "35.7%",    cls: "lp-num-green" },
                    { label: "CHANCE DE PERDA",  val: "64.3%",    cls: "lp-num-red"   },
                    { label: "MARGEM DA CASA",   val: "5.5%",     cls: "lp-num-amber" },
                    { label: "EV POR APOSTA",    val: "−R$14,50", cls: "lp-num-red"   },
                  ].map((ind) => (
                    <div className="lp-mock-ind" key={ind.label}>
                      <div className="lp-mock-ind-label">{ind.label}</div>
                      <div className={`lp-mock-ind-val ${ind.cls}`}>{ind.val}</div>
                    </div>
                  ))}
                </div>

                <div className="lp-mock-footer">
                  Análise educativa — não recomenda aposta.
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── ALERTA MATEMÁTICO ──────────────────────────── */}
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

      {/* ── O QUE VOCÊ VÊ VS O QUE VOCÊ IGNORA ────────── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-label">POR QUE VOCÊ CONTINUA PERDENDO</div>
          <h2 className="lp-h2">O que você vê — e o que a odd esconde.</h2>
          <p className="lp-h2-sub">
            A casa mostra o retorno possível. Esconde tudo o que importa.
          </p>

          <div className="lp-vs-grid">
            <div className="lp-vs-card lp-vs-left">
              <div className="lp-vs-card-hdr lp-vs-hdr-green">
                <span className="lp-vs-dot lp-vs-dot-green" />
                O que o apostador vê
              </div>
              {[
                ["Retorno se ganhar",  "+R$280,00"],
                ["Lucro possível",     "R$180,00" ],
                ["Odd do evento",      "2.80"     ],
                ["Cenário favorável",  "Possível" ],
              ].map(([label, val]) => (
                <div className="lp-vs-row" key={label}>
                  <span className="lp-vs-row-label">{label}</span>
                  <span className="lp-vs-row-val lp-num-green">{val}</span>
                </div>
              ))}
            </div>

            <div className="lp-vs-divider">
              <div className="lp-vs-div-line" />
              <div className="lp-vs-div-vs">vs</div>
              <div className="lp-vs-div-line" />
            </div>

            <div className="lp-vs-card lp-vs-right">
              <div className="lp-vs-card-hdr lp-vs-hdr-red">
                <span className="lp-vs-dot lp-vs-dot-red" />
                O que a odd esconde
              </div>
              {[
                ["Probabilidade implícita",  "35,7%"    ],
                ["Margem da casa (vig)",      "5,5%"     ],
                ["Chance real de perda",     "64,3%"    ],
                ["EV por aposta",            "−R$14,50" ],
              ].map(([label, val]) => (
                <div className="lp-vs-row lp-vs-row-right" key={label}>
                  <span className="lp-vs-row-label">{label}</span>
                  <span className="lp-vs-row-val lp-num-red">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-vs-cta">
            <Link to="/ferramenta" className="lp-btn-primary">Ver o risco da minha aposta →</Link>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ──────────────────────────────── */}
      <section className="lp-section lp-section-dark" id="como-funciona">
        <div className="lp-container">
          <div className="lp-section-label">COMO FUNCIONA</div>
          <h2 className="lp-h2">Três etapas. Menos de um minuto.</h2>
          <div className="lp-steps">
            {[
              { n:"01", title:"Insira a odd e o contexto",       desc:"Informe o jogo, tipo de aposta, odd e valor pretendido. Quanto mais contexto, mais precisa a leitura.",       tags:["Evento","Odd","Tipo","Valor"] },
              { n:"02", title:"A IA calcula a exposição ao risco",desc:"Probabilidade implícita, margem da casa, valor esperado e pontos cegos — calculados automaticamente.",         tags:["Score 0–100","Probabilidade","EV","Margem"] },
              { n:"03", title:"Receba a leitura preventiva",      desc:"Relatório estruturado com cenário necessário, pontos cegos e leitura conservadora — antes de qualquer decisão.",tags:["Pontos cegos","Chance de perda","Leitura final"] },
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
            <Link to="/ferramenta" className="lp-btn-primary">Testar gratuitamente →</Link>
          </div>
        </div>
      </section>

      {/* ── EXEMPLO COMPLETO ───────────────────────────── */}
      <section className="lp-section" id="exemplo">
        <div className="lp-container">
          <div className="lp-section-label">EXEMPLO REAL</div>
          <h2 className="lp-h2">Veja como a análise funciona.</h2>
          <p className="lp-h2-sub">
            Flamengo x Palmeiras · Resultado final · Odd 2.80 · R$100,00
          </p>

          <div className="lp-exemplo">
            <div className="lp-ex-ctx">
              {[["Jogo","Flamengo x Palmeiras — Brasileirão"],["Tipo","Resultado final (1X2)"],["Odd","2.80"],["Valor","R$100,00"]].map(([k,v]) => (
                <div className="lp-ex-ctx-chip" key={k}>
                  <span className="lp-ex-ctx-key">{k}</span>
                  <span className="lp-ex-ctx-val">{v}</span>
                </div>
              ))}
            </div>

            {/* Score */}
            <div className="lp-ex-score">
              <div className="lp-ex-score-tag">SCORE DE RISCO MOTORIA™</div>
              <div className="lp-ex-score-body">
                <div className="lp-ex-score-left">
                  <div className="lp-ex-score-num">64</div>
                  <span className="lp-ex-score-badge">ALTO</span>
                </div>
                <div className="lp-ex-score-right">
                  <div className="lp-ex-bar-track">
                    <div className="lp-ex-bar-fill" />
                    {[30,60,80].map((t) => <div key={t} className="lp-ex-bar-tick" style={{left:`${t}%`}} />)}
                  </div>
                  <div className="lp-ex-bar-labels">
                    <span>0 — Baixo</span>
                    <span>Moderado</span>
                    <span>Alto</span>
                    <span>Extremo — 100</span>
                  </div>
                  <p className="lp-ex-score-note">
                    Score educativo — resume exposição ao risco. Não recomenda aposta.
                  </p>
                </div>
              </div>
            </div>

            {/* Indicadores */}
            <div className="lp-ex-ind-grid">
              {[
                { tag:"A", label:"PROBABILIDADE IMPLÍCITA", val:"35,7%",    note:"de chance segundo a odd 2.80", color:"#1FCB7A" },
                { tag:"B", label:"CHANCE DE PERDA",         val:"64,3%",    note:"estimativa conservadora",      color:"#FF4D2E" },
                { tag:"",  label:"MARGEM DA CASA (VIG)",     val:"5,5%",     note:"taxa invisível por aposta",    color:"#FFB020" },
                { tag:"",  label:"VALOR ESPERADO (EV)",      val:"−R$14,50", note:"resultado esperado longo prazo",color:"#FF4D2E" },
              ].map((ind) => (
                <div className="lp-ex-ind" key={ind.label} style={{borderColor: ind.color+"22"}}>
                  <div className="lp-ex-ind-label">{ind.tag ? `${ind.tag} · ` : ""}{ind.label}</div>
                  <div className="lp-ex-ind-val" style={{color: ind.color}}>{ind.val}</div>
                  <div className="lp-ex-ind-note">{ind.note}</div>
                </div>
              ))}
            </div>

            {/* Cards */}
            <div className="lp-ex-card lp-ex-card-red">
              <div className="lp-ex-card-label">C · RISCO PRINCIPAL</div>
              <p className="lp-ex-card-text">
                A odd 2.80 exige que o Flamengo vença, mas a probabilidade implícita de 35,7%
                está abaixo do que o histórico de confrontos diretos sugere. O mercado
                está precificando incerteza elevada nesse jogo específico.
              </p>
            </div>

            <div className="lp-ex-card lp-ex-card-amber">
              <div className="lp-ex-card-label">E · PONTOS CEGOS</div>
              <ul className="lp-ex-bullets">
                {[
                  "Confrontos Fla x Pal são historicamente equilibrados.",
                  "Calendário congestionado aumenta variância em ambos os lados.",
                  "Margem de 5,5% torna o valor esperado estruturalmente negativo.",
                  "Resultados de jogos únicos têm alta variância — imprevisíveis por natureza.",
                ].map((b,i) => <li key={i}>{b}</li>)}
              </ul>
            </div>

            <div className="lp-ex-card lp-ex-card-final">
              <div className="lp-ex-card-label">F · LEITURA CONSERVADORA</div>
              <p className="lp-ex-card-text">
                Com probabilidade implícita de 35,7% e margem estrutural da casa de 5,5%,
                a exposição ao risco é classificada como <strong style={{color:"#FF6B2E"}}>ALTA</strong>. Para apostas
                com esse perfil, a maioria dos cenários resulta em perda financeira ao longo do tempo.
              </p>
              <div className="lp-ex-disclaimer">
                Esta análise tem finalidade educativa. Não constitui recomendação de aposta ou garantia de resultado.
              </div>
            </div>

            <div className="lp-ex-cta-row">
              <Link to="/ferramenta" className="lp-btn-primary">Analisar minha aposta →</Link>
              <span className="lp-ex-cta-note">Grátis · Sem cadastro · Sem cartão</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ────────────────────────────────── */}
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

      {/* ── PREÇO ──────────────────────────────────────── */}
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

      {/* ── FAQ ────────────────────────────────────────── */}
      <section className="lp-section lp-section-dark">
        <div className="lp-container lp-faq-container">
          <div className="lp-section-label">DÚVIDAS</div>
          <h2 className="lp-h2">Perguntas frequentes.</h2>
          <div className="lp-faq">
            {FAQ_ITEMS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────── */}
      <section className="lp-section lp-cta-final">
        <div className="lp-cta-glow" aria-hidden="true" />
        <div className="lp-container lp-cta-inner">
          <div className="lp-tag-pill">FERRAMENTA EDUCATIVA</div>
          <h2 className="lp-final-h2">
            Antes de apostar,<br />entenda o risco.
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
        </div>
      </section>

      <Footer />
    </>
  );
}

// ─── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
/* ── Reset / base ─────────────────────────────────── */
.lp-container { max-width: 960px; margin: 0 auto; padding: 0 24px; }
.lp-section { padding: 88px 0; }
.lp-section-dark { background: #080809; }

/* Números alinhados globalmente */
.lp-num-green { color: #1FCB7A; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }
.lp-num-red   { color: #FF4D2E; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }
.lp-num-amber { color: #FFB020; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }

.lp-section-label {
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.16em; color: #1FCB7A;
  text-transform: uppercase; margin-bottom: 14px;
}
.lp-h2 {
  font-family: 'Syne', sans-serif;
  font-size: clamp(24px,4vw,38px);
  font-weight: 900; color: #F2F2F0;
  line-height: 1.16; letter-spacing: -0.02em;
  margin-bottom: 12px;
}
.lp-h2-sub {
  font-size: 15px; color: #555;
  line-height: 1.75; max-width: 520px;
  margin-bottom: 40px;
}

/* ── Header ───────────────────────────────────────── */
.lp-header {
  position: sticky; top: 0; z-index: 100;
  background: rgba(5,5,5,0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.lp-header-inner {
  max-width: 960px; margin: 0 auto;
  padding: 14px 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.lp-logo { display: flex; align-items: center; gap: 9px; }
.lp-logo-mark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px;
  background: #1FCB7A; color: #050505;
  font-family: 'Syne', sans-serif;
  font-size: 13px; font-weight: 900; border-radius: 6px;
}
.lp-logo-name {
  font-family: 'Syne', sans-serif;
  font-size: 15px; font-weight: 800;
  color: #F2F2F0; letter-spacing: -0.02em;
}
.lp-nav { display: flex; align-items: center; gap: 20px; }
.lp-nav-link { font-size: 13px; color: #555; text-decoration: none; transition: color .15s; }
.lp-nav-link:hover { color: #F2F2F0; }
.lp-nav-cta {
  font-size: 12px; font-weight: 600;
  color: #1FCB7A; text-decoration: none;
  border: 1px solid rgba(31,203,122,.3);
  padding: 7px 14px; border-radius: 7px; transition: all .15s;
}
.lp-nav-cta:hover { background: rgba(31,203,122,.08); border-color: rgba(31,203,122,.5); }

/* ── Hero ─────────────────────────────────────────── */
.lp-hero {
  position: relative; padding: 72px 0 80px;
  background: #050505; overflow: hidden;
}
.lp-hero-glow {
  position: absolute; top: -80px; left: 50%;
  transform: translateX(-50%);
  width: 800px; height: 500px;
  background: radial-gradient(ellipse, rgba(31,203,122,.08) 0%, transparent 65%);
  pointer-events: none; z-index: 0;
}
.lp-grid-bg {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none; z-index: 0;
}
.lp-hero-layout {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 56px; align-items: center;
}
.lp-hero-text { display: flex; flex-direction: column; }

.lp-tag-pill {
  display: inline-block;
  font-size: 10px; font-weight: 700;
  letter-spacing: .14em; color: #1FCB7A;
  text-transform: uppercase;
  border: 1px solid rgba(31,203,122,.25);
  background: rgba(31,203,122,.06);
  padding: 5px 13px; border-radius: 99px;
  margin-bottom: 22px; align-self: flex-start;
}
.lp-h1 {
  font-family: 'Syne', sans-serif;
  font-size: clamp(32px,5vw,54px);
  font-weight: 900; color: #F2F2F0;
  line-height: 1.08; letter-spacing: -0.03em;
  margin-bottom: 20px;
}
.lp-h1-accent { color: rgba(242,242,240,.5); }
.lp-hero-sub {
  font-size: 15px; color: #6B7280;
  line-height: 1.75; max-width: 400px; margin-bottom: 30px;
}

/* Buttons */
.lp-hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
.lp-btn-primary {
  display: inline-flex; align-items: center;
  background: #F2F2F0; color: #050505;
  font-size: 14px; font-weight: 700;
  padding: 13px 22px; border-radius: 10px;
  text-decoration: none; white-space: nowrap;
  transition: opacity .15s, transform .12s;
}
.lp-btn-primary:hover { opacity: .88; transform: translateY(-1px); }
.lp-btn-ghost {
  display: inline-flex; align-items: center;
  background: transparent; color: #555;
  font-size: 14px; font-weight: 600;
  padding: 13px 20px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,.07);
  text-decoration: none; transition: all .15s;
}
.lp-btn-ghost:hover { border-color: rgba(255,255,255,.15); color: #F2F2F0; }

/* Trust pills */
.lp-trust-row  { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 28px; }
.lp-trust-pill {
  font-size: 11px; color: #383838;
  border: 1px solid #1c1c1e; border-radius: 99px;
  padding: 4px 10px; background: rgba(255,255,255,.02);
  white-space: nowrap;
}

/* Stats bar */
.lp-stats-bar {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
}
.lp-stat { display: flex; flex-direction: column; gap: 2px; }
.lp-stat-num {
  font-family: 'Syne', sans-serif;
  font-size: 20px; font-weight: 900;
  color: #F2F2F0; line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.lp-stat-label { font-size: 11px; color: #3a3a3c; }
.lp-stat-div { width: 1px; height: 32px; background: rgba(255,255,255,.07); flex-shrink: 0; }

/* ── Mock ferramenta ──────────────────────────────── */
.lp-hero-visual { position: relative; }
.lp-mock {
  background: rgba(255,255,255,.025);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px; padding: 20px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex; flex-direction: column; gap: 14px;
  box-shadow: 0 32px 72px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04);
}
.lp-mock-hdr {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,.05);
}
.lp-mock-hdr-title {
  font-size: 10px; font-weight: 700;
  letter-spacing: .1em; color: #2a2a2c; text-transform: uppercase;
}
.lp-mock-hdr-odd {
  font-size: 10px; color: #333;
  font-family: 'Syne', sans-serif; font-weight: 700;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.06);
  padding: 3px 9px; border-radius: 5px;
}
.lp-mock-score-card {
  background: rgba(255,107,46,.06);
  border: 1px solid rgba(255,107,46,.2);
  border-radius: 12px; padding: 14px;
}
.lp-mock-score-tag {
  font-size: 8px; font-weight: 700;
  letter-spacing: .12em; color: rgba(255,107,46,.5);
  text-transform: uppercase; margin-bottom: 10px;
}
.lp-mock-score-row { display: flex; gap: 14px; align-items: flex-start; }
.lp-mock-score-num {
  font-family: 'Syne', sans-serif;
  font-size: 54px; font-weight: 900;
  color: #FF6B2E; line-height: 1; flex-shrink: 0;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
.lp-mock-score-right { flex: 1; padding-top: 4px; display: flex; flex-direction: column; gap: 8px; }
.lp-mock-badge {
  font-size: 11px; font-weight: 800; letter-spacing: .06em;
  background: rgba(255,107,46,.15); color: #FF6B2E;
  border: 1px solid rgba(255,107,46,.35);
  padding: 4px 11px; border-radius: 6px; align-self: flex-start;
}
.lp-mock-bar-wrap { display: flex; flex-direction: column; gap: 5px; }
.lp-mock-bar-track {
  position: relative; height: 5px;
  background: rgba(255,255,255,.05); border-radius: 99px; overflow: hidden;
}
.lp-mock-bar-fill {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 64%; background: #FF6B2E; border-radius: 99px;
}
.lp-mock-bar-labels {
  display: flex; justify-content: space-between;
  font-size: 8px; color: #1e1e1e; font-weight: 600;
  letter-spacing: .02em; text-transform: uppercase;
}
.lp-mock-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.lp-mock-ind {
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.05);
  border-radius: 9px; padding: 11px 12px;
}
.lp-mock-ind-label {
  font-size: 8px; font-weight: 700;
  letter-spacing: .1em; color: #222; text-transform: uppercase; margin-bottom: 6px;
}
.lp-mock-ind-val {
  font-family: 'Syne', sans-serif;
  font-size: 17px; font-weight: 800; line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.lp-mock-footer {
  font-size: 10px; color: #1a1a1a;
  text-align: center; font-style: italic; line-height: 1.5;
}

/* ── Alert strip ──────────────────────────────────── */
.lp-alert-strip {
  background: #0a0a0b;
  border-top: 1px solid rgba(255,255,255,.04);
  border-bottom: 1px solid rgba(255,255,255,.04);
  padding: 32px 0;
}
.lp-alert-inner {
  display: flex; align-items: center;
  justify-content: center; gap: 0; flex-wrap: wrap;
}
.lp-alert-item {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 32px; flex: 1; min-width: 220px;
}
.lp-alert-num {
  font-family: 'Syne', sans-serif;
  font-size: 32px; font-weight: 900;
  line-height: 1; flex-shrink: 0;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
.lp-alert-desc { font-size: 13px; color: #555; line-height: 1.5; }
.lp-alert-sep {
  width: 1px; height: 48px;
  background: rgba(255,255,255,.06); flex-shrink: 0;
}

/* ── VS Section ───────────────────────────────────── */
.lp-vs-grid {
  display: grid; grid-template-columns: 1fr auto 1fr;
  gap: 0; align-items: stretch;
}
.lp-vs-card {
  display: flex; flex-direction: column;
  border-radius: 14px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.06);
}
.lp-vs-left  { border-color: rgba(31,203,122,.15); background: rgba(31,203,122,.025); }
.lp-vs-right { border-color: rgba(255,77,46,.15);  background: rgba(255,77,46,.025);  }
.lp-vs-card-hdr {
  display: flex; align-items: center; gap: 9px;
  font-size: 12px; font-weight: 700;
  padding: 15px 18px;
  border-bottom: 1px solid rgba(255,255,255,.05);
}
.lp-vs-hdr-green { color: #1FCB7A; }
.lp-vs-hdr-red   { color: #FF4D2E; }
.lp-vs-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.lp-vs-dot-green { background: #1FCB7A; box-shadow: 0 0 8px rgba(31,203,122,.5); }
.lp-vs-dot-red   { background: #FF4D2E; box-shadow: 0 0 8px rgba(255,77,46,.5); }
.lp-vs-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 13px 18px;
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.lp-vs-row:last-child { border-bottom: none; }
.lp-vs-row-right { background: rgba(255,77,46,.02); }
.lp-vs-row-label { font-size: 13px; color: #555; }
.lp-vs-row-val {
  font-family: 'Syne', sans-serif;
  font-size: 16px; font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  white-space: nowrap; min-width: 80px; text-align: right;
}
.lp-vs-divider {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px; width: 52px; flex-shrink: 0;
}
.lp-vs-div-line { flex: 1; width: 1px; background: rgba(255,255,255,.05); }
.lp-vs-div-vs {
  font-family: 'Syne', sans-serif;
  font-size: 11px; font-weight: 900; color: #1e1e1e;
}
.lp-vs-cta { text-align: center; margin-top: 36px; }

/* ── Steps ────────────────────────────────────────── */
.lp-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-bottom: 40px; }
.lp-step {
  background: rgba(255,255,255,.025);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 16px; padding: 28px 22px;
  display: flex; flex-direction: column; gap: 12px;
  transition: border-color .2s;
}
.lp-step:hover { border-color: rgba(31,203,122,.2); }
.lp-step-n {
  font-family: 'Syne', sans-serif;
  font-size: 13px; font-weight: 900;
  color: rgba(31,203,122,.45); letter-spacing: .04em;
}
.lp-step-title {
  font-family: 'Syne', sans-serif;
  font-size: 17px; font-weight: 800;
  color: #F2F2F0; line-height: 1.22;
}
.lp-step-desc { font-size: 14px; color: #555; line-height: 1.72; }
.lp-step-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.lp-step-tag {
  font-size: 10px; font-weight: 600; color: #2a2a2a;
  border: 1px solid #181818; border-radius: 99px;
  padding: 3px 9px; background: rgba(255,255,255,.02);
}
.lp-steps-cta { text-align: center; }

/* ── Exemplo ──────────────────────────────────────── */
.lp-exemplo {
  background: rgba(255,255,255,.018);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 20px; padding: 28px;
  display: flex; flex-direction: column; gap: 14px;
  box-shadow: 0 32px 80px rgba(0,0,0,.3);
}
.lp-ex-ctx {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255,255,255,.05);
}
.lp-ex-ctx-chip {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 8px; padding: 6px 12px;
}
.lp-ex-ctx-key {
  font-size: 10px; font-weight: 700;
  color: #2e2e2e; letter-spacing: .06em; text-transform: uppercase;
}
.lp-ex-ctx-val { font-size: 13px; color: #777; }

/* Score exemplo */
.lp-ex-score {
  background: rgba(255,107,46,.05);
  border: 1px solid rgba(255,107,46,.18);
  border-radius: 14px; padding: 20px;
}
.lp-ex-score-tag {
  font-size: 9px; font-weight: 700;
  letter-spacing: .12em; color: rgba(255,107,46,.45);
  text-transform: uppercase; margin-bottom: 14px;
}
.lp-ex-score-body { display: flex; gap: 24px; align-items: flex-start; }
.lp-ex-score-left {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; flex-shrink: 0;
}
.lp-ex-score-num {
  font-family: 'Syne', sans-serif;
  font-size: 72px; font-weight: 900; color: #FF6B2E;
  line-height: 1; letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}
.lp-ex-score-badge {
  font-size: 12px; font-weight: 800; letter-spacing: .06em;
  background: rgba(255,107,46,.12); color: #FF6B2E;
  border: 1px solid rgba(255,107,46,.3);
  padding: 5px 14px; border-radius: 7px;
}
.lp-ex-score-right { flex: 1; padding-top: 8px; }
.lp-ex-bar-track {
  position: relative; height: 8px;
  background: rgba(255,255,255,.05);
  border-radius: 99px; overflow: visible; margin-bottom: 8px;
}
.lp-ex-bar-fill {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 64%; background: #FF6B2E; border-radius: 99px;
}
.lp-ex-bar-tick {
  position: absolute; top: -4px;
  width: 1px; height: 16px;
  background: rgba(255,255,255,.1);
  transform: translateX(-50%);
}
.lp-ex-bar-labels {
  display: flex; justify-content: space-between;
  font-size: 9px; color: #252525;
  font-weight: 600; letter-spacing: .03em;
  text-transform: uppercase; margin-bottom: 12px;
}
.lp-ex-score-note {
  font-size: 12px; color: #333;
  font-style: italic; line-height: 1.55; margin: 0;
}

/* Indicadores exemplo */
.lp-ex-ind-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
.lp-ex-ind {
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.05);
  border-radius: 11px; padding: 15px 14px;
}
.lp-ex-ind-label {
  font-size: 8px; font-weight: 700;
  letter-spacing: .1em; color: #2a2a2a;
  text-transform: uppercase; margin-bottom: 10px;
}
.lp-ex-ind-val {
  font-family: 'Syne', sans-serif;
  font-size: 22px; font-weight: 900;
  line-height: 1; margin-bottom: 6px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
}
.lp-ex-ind-note { font-size: 10px; color: #444; line-height: 1.4; }

/* Cards exemplo */
.lp-ex-card {
  border-radius: 12px; padding: 18px;
  border: 1px solid rgba(255,255,255,.06);
  background: rgba(255,255,255,.02);
}
.lp-ex-card-red   { border-color: rgba(255,77,46,.18);  background: rgba(255,77,46,.03); }
.lp-ex-card-amber { border-color: rgba(255,176,32,.18); background: rgba(255,176,32,.03); }
.lp-ex-card-final { border-color: rgba(255,176,32,.1); }
.lp-ex-card-label {
  font-size: 9px; font-weight: 700;
  letter-spacing: .12em; color: #2e2e2e;
  text-transform: uppercase; margin-bottom: 12px;
}
.lp-ex-card-text { font-size: 14px; color: #777; line-height: 1.75; margin: 0; }
.lp-ex-bullets { list-style: none; display: flex; flex-direction: column; gap: 9px; }
.lp-ex-bullets li {
  font-size: 14px; color: #777;
  padding-left: 20px; position: relative; line-height: 1.65;
}
.lp-ex-bullets li::before {
  content: "—"; position: absolute; left: 0;
  color: #FFB020; font-weight: 700;
}
.lp-ex-disclaimer {
  font-size: 11px; color: #282828; font-style: italic;
  line-height: 1.6;
  border-top: 1px solid rgba(255,255,255,.05);
  padding-top: 12px; margin-top: 12px;
}
.lp-ex-cta-row {
  display: flex; align-items: center; gap: 16px;
  flex-wrap: wrap; padding-top: 4px;
}
.lp-ex-cta-note { font-size: 12px; color: #2a2a2a; }

/* ── Depoimentos ──────────────────────────────────── */
.lp-testimonials {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px,1fr));
  gap: 14px;
}
.lp-testimonial {
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 14px; padding: 20px;
  display: flex; flex-direction: column; gap: 14px;
  transition: border-color .2s;
}
.lp-testimonial:hover { border-color: rgba(255,255,255,.1); }
.lp-test-stars { font-size: 12px; color: #FFB020; letter-spacing: 2px; }
.lp-test-text  { font-size: 14px; color: #666; line-height: 1.75; font-style: italic; margin: 0; }
.lp-test-author { display: flex; align-items: center; gap: 12px; }
.lp-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; flex-shrink: 0;
}
.lp-test-name-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.lp-test-name-row strong { font-size: 13px; color: #F2F2F0; }
.lp-test-verified {
  font-size: 9px; font-weight: 700; color: #1FCB7A;
  background: rgba(31,203,122,.08);
  border: 1px solid rgba(31,203,122,.2);
  padding: 1px 6px; border-radius: 99px;
}
.lp-test-city { font-size: 12px; color: #333; }

/* ── Preço ────────────────────────────────────────── */
.lp-pricing { display: grid; grid-template-columns: 1fr auto; gap: 52px; align-items: start; }
.lp-features-list { display: flex; flex-direction: column; gap: 14px; }
.lp-feature-item { display: flex; gap: 12px; font-size: 15px; color: #777; align-items: baseline; }
.lp-feature-check { color: #1FCB7A; font-weight: 700; flex-shrink: 0; }

.lp-price-box {
  background: rgba(255,255,255,.025);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px; padding: 30px 26px;
  min-width: 240px;
  display: flex; flex-direction: column; gap: 14px;
  text-align: center;
  position: sticky; top: 80px;
  box-shadow: 0 24px 64px rgba(0,0,0,.35);
}
.lp-price-label {
  font-size: 10px; font-weight: 700;
  letter-spacing: .14em; color: #1FCB7A; text-transform: uppercase;
}
.lp-price-display {
  display: flex; align-items: flex-start;
  justify-content: center; gap: 3px;
}
.lp-price-curr {
  font-family: 'Syne', sans-serif;
  font-size: 22px; font-weight: 700;
  color: #888; padding-top: 10px; line-height: 1;
}
.lp-price-int {
  font-family: 'Syne', sans-serif;
  font-size: 76px; font-weight: 900;
  color: #F2F2F0; line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}
.lp-price-sub { font-size: 13px; color: #444; }
.lp-btn-buy {
  display: block;
  background: #F2F2F0; color: #050505;
  font-size: 14px; font-weight: 700;
  padding: 15px 20px; border-radius: 10px;
  text-decoration: none; text-align: center;
  transition: opacity .15s, transform .12s;
}
.lp-btn-buy:hover { opacity: .88; transform: translateY(-1px); }
.lp-btn-buy-lg { font-size: 15px; padding: 16px 28px; }
.lp-guarantee-card {
  display: flex; align-items: flex-start; gap: 12px;
  background: rgba(31,203,122,.05);
  border: 1px solid rgba(31,203,122,.15);
  border-radius: 10px; padding: 12px 14px;
  text-align: left;
}
.lp-guarantee-icon {
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(31,203,122,.15); color: #1FCB7A;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.lp-guarantee-title { font-size: 13px; font-weight: 700; color: #F2F2F0; margin-bottom: 2px; }
.lp-guarantee-sub   { font-size: 11px; color: #555; line-height: 1.5; }

/* ── FAQ ──────────────────────────────────────────── */
.lp-faq-container { max-width: 640px; }
.lp-faq { display: flex; flex-direction: column; margin-top: 4px; }
.lp-faq-item {
  border-bottom: 1px solid rgba(255,255,255,.05);
  padding: 17px 0; cursor: pointer; user-select: none;
}
.lp-faq-q {
  display: flex; justify-content: space-between;
  align-items: center; gap: 16px;
  font-size: 15px; font-weight: 600; color: #F2F2F0;
}
.lp-faq-icon { font-size: 18px; color: #555; flex-shrink: 0; }
.lp-faq-a { font-size: 14px; color: #555; line-height: 1.72; margin-top: 12px; }

/* ── CTA Final ────────────────────────────────────── */
.lp-cta-final {
  position: relative; text-align: center;
  overflow: hidden; background: #050505;
}
.lp-cta-glow {
  position: absolute; bottom: -120px; left: 50%;
  transform: translateX(-50%);
  width: 700px; height: 400px;
  background: radial-gradient(ellipse, rgba(31,203,122,.07) 0%, transparent 65%);
  pointer-events: none;
}
.lp-cta-inner {
  position: relative; z-index: 1;
  max-width: 560px; display: flex;
  flex-direction: column; align-items: center; gap: 20px;
}
.lp-final-h2 {
  font-family: 'Syne', sans-serif;
  font-size: clamp(28px,5vw,46px); font-weight: 900;
  color: #F2F2F0; line-height: 1.1; letter-spacing: -0.03em;
}
.lp-final-sub { font-size: 15px; color: #555; }
.lp-final-btns { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.lp-btn-ghost-sm {
  font-size: 13px; color: #333;
  text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
}
.lp-btn-ghost-sm:hover { color: #777; }
.lp-final-trust {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  justify-content: center;
  font-size: 12px; color: #282828;
}

/* ── Mobile ───────────────────────────────────────── */
@media (max-width: 820px) {
  .lp-hero-layout { grid-template-columns: 1fr; gap: 40px; }
  .lp-hero-text { align-items: center; text-align: center; }
  .lp-tag-pill, .lp-hero-sub { align-self: center; text-align: center; }
  .lp-trust-row, .lp-hero-btns, .lp-stats-bar { justify-content: center; }
  .lp-steps { grid-template-columns: 1fr; }
  .lp-pricing { grid-template-columns: 1fr; }
  .lp-price-box { position: static; min-width: 0; }
  .lp-ex-ind-grid { grid-template-columns: 1fr 1fr; }
  .lp-nav-link { display: none; }
  .lp-alert-inner { flex-direction: column; gap: 0; }
  .lp-alert-sep { width: 80px; height: 1px; }
  .lp-alert-item { justify-content: center; text-align: left; padding: 16px 24px; }
}
@media (max-width: 620px) {
  .lp-section { padding: 60px 0; }
  .lp-vs-grid { grid-template-columns: 1fr; gap: 14px; }
  .lp-vs-divider { flex-direction: row; width: auto; height: 28px; }
  .lp-vs-div-line { flex: none; width: 60px; height: 1px; }
  .lp-ex-ind-grid { grid-template-columns: 1fr 1fr; }
  .lp-exemplo { padding: 18px 16px; }
  .lp-ex-score-body { flex-direction: column; gap: 16px; }
  .lp-ex-score-left { flex-direction: row; align-items: center; }
  .lp-ex-score-num { font-size: 56px; }
  .lp-mock { padding: 16px; }
  .lp-mock-score-num { font-size: 44px; }
  .lp-testimonials { grid-template-columns: 1fr; }
  .lp-price-int { font-size: 60px; }
}
@media (max-width: 400px) {
  .lp-ex-ind-grid { grid-template-columns: 1fr; }
  .lp-mock-grid { grid-template-columns: 1fr; }
}
`;
