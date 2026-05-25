import { useState, useEffect, useRef } from "react";
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
    q: "É recomendação ou análise?",
    a: "É análise simples. Você vê o risco, quanto da banca fica em jogo e o que precisa dar certo antes de decidir.",
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

// ─── VideoSection ─────────────────────────────────────────────────────────────

function VideoSection() {
  const videoRef  = useRef(null);
  const [muted,   setMuted]   = useState(true);
  // showPlay: true when autoplay was blocked and the user hasn't tapped yet
  const [showPlay, setShowPlay] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Try to play immediately (works when autoPlay attr + muted are present)
    v.play().catch(() => setShowPlay(true));

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.play().catch(() => setShowPlay(true));
        } else {
          v.pause();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(v);

    // ── Hero moment: analysis result (~12s–19.5s) ──────────────────────────
    // Frames 360–570 at 30fps = 12.0s–19.0s in the 30s video
    function onTimeUpdate() {
      const t = v.currentTime;
      const inResult = t >= 12 && t <= 19.5;
      const wrap = v.closest(".lp-video-wrap");
      if (wrap) {
        wrap.style.transition = "transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)";
        wrap.style.transform  = inResult ? "scale(1.055)" : "scale(1)";
      }
      v.style.transition = "filter 0.5s ease";
      v.style.filter     = inResult
        ? "contrast(1.12) brightness(1.04) saturate(1.08)"
        : "none";
    }
    v.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      observer.disconnect();
      v.removeEventListener("timeupdate", onTimeUpdate);
      // Reset styles on unmount
      const wrap = v.closest?.(".lp-video-wrap");
      if (wrap) { wrap.style.transform = ""; wrap.style.transition = ""; }
      v.style.filter = ""; v.style.transition = "";
    };
  }, []);

  function handlePlayClick() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;        // ensure muted so browser allows autoplay after tap
    setMuted(true);
    v.play().then(() => setShowPlay(false)).catch(() => {});
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    if (!next) v.play().catch(() => {});
    setMuted(next);
  }

  return (
    <section className="lp-section lp-dark lp-video-section" id="demo">
      <div className="lp-container" style={{ textAlign: "center" }}>
        <div className="lp-eyebrow">Demonstração</div>
        <h2 className="lp-h2" style={{ marginBottom: 12 }}>Veja como funciona</h2>
        <p className="lp-video-sub">
          Em poucos segundos você coloca os dados do bilhete, entende o risco e acompanha sua banca.
        </p>
        <div className="lp-video-wrap" style={{ position: "relative" }}>
          <video
            ref={videoRef}
            className="lp-video"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster="/hero-risk-awareness.png"
          >
            <source src="/video/motoria-demo.mp4" type="video/mp4" />
          </video>

          {/* Fallback play button — shown when autoplay is blocked by browser */}
          {showPlay && (
            <button
              className="lp-play-btn"
              onClick={handlePlayClick}
              aria-label="Reproduzir vídeo"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </button>
          )}

          {/* Mute toggle — only show when video is playing */}
          {!showPlay && (
            <button
              className={`lp-mute-btn${muted ? " lp-mute-btn-on" : ""}`}
              onClick={toggleMute}
              aria-label={muted ? "Ativar som" : "Silenciar"}
            >
              {muted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
              )}
              <span>{muted ? "Ativar som" : "Silenciar"}</span>
            </button>
          )}
        </div>
      </div>
    </section>
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
        <span>Lançamento: <strong>R$27</strong></span>
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
          <div className="lp-header-actions">
            <Link to="/login" className="lp-nav-login">Entrar</Link>
            <a href={KIWIFY_URL} className="lp-nav-cta" target="_blank" rel="noopener noreferrer">
              Desbloquear
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="lp-hero" id="topo">
        <div className="lp-hero-glow" aria-hidden="true" />
        <div className="lp-container lp-hero-layout">

          {/* Left — text */}
          <div className="lp-hero-left">
            <div className="lp-hero-tag">Leitura de bilhete · Análise de risco · Controle de banca</div>
            <h1 className="lp-h1">
              Vai apostar?<br />
              <span className="lp-h1-accent">Analise o risco</span><br />
              antes de apostar.
            </h1>
            <p className="lp-hero-sub">
              Importe o print do bilhete ou cole a odd. O MotorIA lê a aposta,
              avalia o risco em segundos e mostra o impacto na sua banca.
            </p>
            <div className="lp-hero-actions">
              <Link to="/app" className="lp-btn-hero">
                Analisar minha próxima aposta →
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

      {/* ── CONTROLE DE BANCA ────────────────────────────────────────────────── */}
      <section className="lp-section lp-dark" id="banca">
        <div className="lp-container">
          <div className="lp-eyebrow">Controle de Banca</div>
          <h2 className="lp-h2">Sabe quanto você<br />perdeu esse mês?</h2>
          <p className="lp-banca-sub">
            A maioria dos apostadores não vê o quadro completo. O MotorIA Pro mostra resultado, banca e quanto dinheiro ficou em jogo — tudo num lugar só.
          </p>

          {/* Mock dashboard */}
          <div className="lp-bk-grid">
            {[
              { label: "Saldo Atual",           val: "R$ 1.247",  sub: "+R$247 desde o início",      c: "#22c55e" },
              { label: "Dinheiro em jogo no mês", val: "R$ 1.240",  sub: "Somando apostas registradas", c: "#f59e0b" },
              { label: "Rendimento",            val: "+12,4%",    sub: "Sobre o valor apostado",       c: "#22c55e" },
              { label: "Decisões registradas",  val: "30",        sub: "Total no período",             c: "#e8e8e6" },
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

      {/* ── IMPORTAR BILHETE ─────────────────────────────────────────────────── */}
      <section className="lp-section lp-dark lp-import-section" id="importar">
        <div className="lp-container">

          {/* Momento 1 — Headline */}
          <div className="lp-slip-headline">
            <h2 className="lp-h2">Tire um print<br />do seu bilhete.</h2>
            <p className="lp-slip-sub">O MotorIA lê, identifica e analisa em segundos.</p>
          </div>

          {/* Momento 2 — Bilhete full width */}
          <div className="lp-mock-slip lp-slip-full">
            <div className="lp-mock-slip-hdr">
              <span className="lp-mock-slip-dot" /><span className="lp-mock-slip-dot" />
              <span className="lp-mock-slip-name">betano</span>
              <span className="lp-mock-slip-badge">Meu Bilhete</span>
            </div>
            {[
              { match: "Man City x Arsenal",   mkt: "Over 1.0/1.5 Gols",     odd: "1.82" },
              { match: "Real Madrid x Bayern", mkt: "Ambos Marcam – Sim",    odd: "1.70" },
              { match: "Liverpool x PSG",      mkt: "Resultado – Liverpool", odd: "2.10" },
            ].map((r, i) => (
              <div key={i} className="lp-mock-slip-row">
                <div className="lp-mock-slip-match">{r.match}</div>
                <div className="lp-mock-slip-mkt">{r.mkt}</div>
                <div className="lp-mock-slip-odd">{r.odd}</div>
              </div>
            ))}
            <div className="lp-mock-slip-foot">
              <span>R$50,00</span>
              <span className="lp-mock-slip-ret">Retorno: R$323,40</span>
            </div>
          </div>

          {/* Momento 3 — Transição visual */}
          <div className="lp-slip-transition">
            <div className="lp-slip-transition-line" />
            <div className="lp-slip-transition-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
              </svg>
              <span className="lp-slip-engine">MotorIA Risk Engine™</span>
            </div>
            <div className="lp-slip-transition-line" />
          </div>

          {/* Momento 4 — Resultado full width */}
          <div className="lp-slip-result">
            <div className="lp-slip-result-hdr">
              <span className="lp-slip-result-label">RESULTADO DA ANÁLISE</span>
              <span className="lp-slip-result-badge">⚠ EXIGE CAUTELA</span>
            </div>
            <div className="lp-slip-metrics">
              <div className="lp-slip-metric">
                <div className="lp-slip-metric-lbl">RISCO DO BILHETE</div>
                <div className="lp-slip-metric-val lp-slip-val-red">73/100</div>
              </div>
              <div className="lp-slip-metric-divider" aria-hidden="true" />
              <div className="lp-slip-metric">
                <div className="lp-slip-metric-lbl">CHANCE DE PERDA</div>
                <div className="lp-slip-metric-val lp-slip-val-amber">32,4%</div>
              </div>
            </div>
            <p className="lp-slip-result-desc">
              Múltipla de 3 seleções com linha asiática. Risco real maior do que a odd sugere.
            </p>
          </div>

          {/* Tagline */}
          <p className="lp-slip-tagline">
            <em>Não é uma IA lendo odds. É uma análise estrutural da aposta.</em>
          </p>

          {/* CTA */}
          <div className="lp-slip-cta-wrap">
            <a href={KIWIFY_URL} className="lp-btn-buy" target="_blank" rel="noopener noreferrer">
              Desbloquear por R$27 →
            </a>
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
      <VideoSection />

      {/* ── ANÁLISE DE RISCO ─────────────────────────────────────────────────── */}
      <section className="lp-section" id="analise">
        <div className="lp-container lp-risk-layout">

          {/* Left — copy */}
          <div className="lp-risk-left">
            <div className="lp-eyebrow">Análise de risco</div>
            <h2 className="lp-h2">Nem toda aposta que parece fácil tem risco baixo.</h2>
            <p className="lp-risk-desc">
              A ferramenta te mostra o que você normalmente só descobre depois de perder.
            </p>
          </div>

          {/* Right — mock locked card */}
          <div className="lp-risk-right">
            <div className="lp-risk-card">
              <div className="lp-risk-card-top">
                <span className="lp-risk-card-title">Resultado da análise</span>
                <span className="lp-risk-badge">⚠ CAUTELA</span>
              </div>
              <div className="lp-risk-signals">
                {[
                  "Dinheiro demais em jogo",
                  "Decisão pede calma",
                  "Pode pesar na sua banca",
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
                  <div className="lp-risk-metric-val lp-risk-val-red">72 / 100</div>
                  <div className="lp-risk-bar-wrap">
                    <div className="lp-risk-bar-fill" style={{ width: "72%" }} />
                  </div>
                </div>
                <div className="lp-risk-metric">
                  <div className="lp-risk-metric-lbl">CHANCE ESTIMADA</div>
                  <div className="lp-risk-metric-val lp-risk-val-amber">38,6%</div>
                </div>
              </div>
              <div className="lp-risk-leitura">
                <div className="lp-risk-metric-lbl">LEITURA</div>
                <div className="lp-risk-leitura-body">
                  <p className="lp-risk-leitura-text">Valor alto para sua banca.</p>
                  <div className="lp-risk-leitura-fade" aria-hidden="true" />
                  <div className="lp-risk-lock-hint">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    análise completa bloqueada
                  </div>
                </div>
              </div>
              <a href={KIWIFY_URL} className="lp-risk-cta" target="_blank" rel="noopener noreferrer">
                Desbloquear análise completa por R$27
              </a>
              <p className="lp-risk-micro">🔒 Garantia de 7 dias · Pagamento único · Sem mensalidade</p>
            </div>
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
                "Histórico de apostas",
                "Resultado e dinheiro em jogo no período",
                "ROI e banca em tempo real",
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

              <a
                href={KIWIFY_URL}
                className="lp-btn-buy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Desbloquear por R$27
              </a>
              <p className="lp-btn-micro">Acesso imediato · pagamento único</p>
              <p className="lp-guarantee-text">🔒 Garantia de 7 dias. Se não gostar, devolvemos tudo.</p>
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
          <p className="lp-guarantee-text">🔒 Garantia de 7 dias. Se não gostar, devolvemos tudo.</p>
          <p className="lp-cta-micro">Acesso imediato · Pagamento único · Sem mensalidade</p>
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
.lp-header-actions { display: flex; align-items: center; gap: 10px; }

.lp-nav { display: flex; align-items: center; gap: 28px; }
.lp-nav-link {
  font-size: 12.5px; font-weight: 500; color: var(--t2);
  text-decoration: none; letter-spacing: .01em;
  transition: color .15s;
}
.lp-nav-link:hover { color: var(--t1); }

.lp-nav-login {
  font-size: 12px; font-weight: 600; color: var(--t2);
  text-decoration: none; padding: 7px 14px;
  border: 1px solid var(--border); border-radius: 8px;
  transition: color .15s, border-color .15s; flex-shrink: 0;
}
.lp-nav-login:hover { color: var(--t1); border-color: rgba(255,255,255,.25); }

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
  font-size: 62px;
  font-weight: 850; line-height: 1.12;
  letter-spacing: 0; color: var(--t1);
  margin-bottom: 24px;
  text-wrap: balance;
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

/* ── Play fallback button ───────────────────────────────────────────────────── */
.lp-play-btn {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,.45); border: none; border-radius: 28px;
  color: #fff; cursor: pointer; transition: background .15s;
}
.lp-play-btn:hover { background: rgba(0,0,0,.6); }
.lp-play-btn svg { filter: drop-shadow(0 2px 8px rgba(0,0,0,.6)); }

/* ── Mute button ────────────────────────────────────────────────────────────── */
.lp-mute-btn {
  position: absolute; bottom: 14px; right: 14px;
  display: flex; align-items: center; gap: 7px;
  background: rgba(0,0,0,.65); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 99px; padding: 8px 14px 8px 10px;
  color: #fff; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: background .15s, border-color .15s;
  letter-spacing: .02em;
}
.lp-mute-btn:hover { background: rgba(0,0,0,.85); border-color: rgba(255,255,255,.3); }
.lp-mute-btn-on { border-color: rgba(34,197,94,.4); color: var(--green); }

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
  font-size: 22px; font-weight: 900; letter-spacing: .03em;
  font-family: 'Courier New', monospace; line-height: 1;
}
.lp-risk-val-red   { color: #ef4444; }
.lp-risk-val-amber { color: #f59e0b; }
.lp-risk-bar-wrap {
  height: 3px; background: rgba(255,255,255,.08); border-radius: 2px; overflow: hidden;
}
.lp-risk-bar-fill {
  height: 100%; background: #ef4444; border-radius: 2px;
}
.lp-risk-leitura {
  background: rgba(255,255,255,.02); border: 1px solid var(--border);
  border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 6px;
}
.lp-risk-leitura-body {
  position: relative; overflow: hidden;
}
.lp-risk-leitura-text {
  font-size: 13px; font-weight: 600; color: var(--t1);
  margin: 0 0 28px; line-height: 1.5;
}
.lp-risk-leitura-fade {
  position: absolute; bottom: 18px; left: 0; right: 0; height: 28px;
  background: linear-gradient(to bottom, transparent, #0E0E12);
  pointer-events: none;
}
.lp-risk-lock-hint {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 700; letter-spacing: .06em;
  color: var(--t2); text-transform: uppercase;
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
.lp-guarantee-text {
  text-align: center; font-size: 12px; color: #9ca3af; letter-spacing: .01em;
  margin-top: 10px;
}

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
  .lp-header-inner { height: 52px; padding: 0 18px; gap: 12px; justify-content: flex-start; }
  .lp-header-actions { margin-left: 10px; gap: 0; }
  .lp-nav-cta { font-size: 11px; padding: 7px 13px; }
  .lp-nav-login { display: none; }

  /* Hero */
  .lp-hero { padding: 56px 0 48px; min-height: auto; }
  .lp-hero-layout { grid-template-columns: 1fr; gap: 32px; }
  .lp-hero-right { order: -1; }
  .lp-hero-img { height: 420px; }
  .lp-banca-img { height: 360px; }
  .lp-h1 { font-size: 42px; line-height: 1.14; letter-spacing: 0; }
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
  .lp-header-inner { padding: 0 14px; gap: 10px; }
  .lp-nav-login { display: none; }
  .lp-nav-cta { padding: 8px 12px; font-size: 10.5px; }
  .lp-bk-grid { grid-template-columns: 1fr; }
  .lp-risk-metrics { grid-template-columns: 1fr; }
  .lp-h2 { font-size: clamp(24px, 7vw, 34px); }
  .lp-import-section { padding: 60px 0; }
}

/* ── Import / Scanner section ───────────────────────────────────────────────── */
.lp-import-section { padding: 72px 0; }

/* Slip card (reutilizado nos 4 momentos) */
.lp-mock-slip {
  background: #0D0D10; border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px; overflow: hidden;
}
.lp-slip-full { border-radius: 12px; }
.lp-mock-slip-hdr {
  display: flex; align-items: center; gap: 7px;
  padding: 11px 14px; border-bottom: 1px solid rgba(255,255,255,.05);
  background: #111115;
}
.lp-mock-slip-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.13); }
.lp-mock-slip-name {
  font-size: 11px; font-weight: 800; color: var(--t2);
  margin-right: auto; letter-spacing: .02em;
}
.lp-mock-slip-badge {
  font-size: 9px; font-weight: 700; letter-spacing: .1em;
  color: #1FCB7A; background: rgba(31,203,122,.09);
  padding: 2px 7px; border-radius: 9px;
}
.lp-mock-slip-row {
  padding: 9px 14px; border-bottom: 1px solid rgba(255,255,255,.04);
  display: flex; flex-direction: column; gap: 2px;
}
.lp-mock-slip-row:last-of-type { border-bottom: none; }
.lp-mock-slip-match { font-size: 11px; font-weight: 700; color: var(--t1); }
.lp-mock-slip-mkt   { font-size: 10px; color: var(--t2); }
.lp-mock-slip-odd   { font-size: 11px; font-weight: 900; color: #1FCB7A; font-family: monospace; }
.lp-mock-slip-foot  {
  display: flex; justify-content: space-between;
  padding: 9px 14px; background: #111115;
  font-size: 10.5px; color: var(--t2); font-weight: 600;
}
.lp-mock-slip-ret { color: #1FCB7A; }

/* Story moments */
.lp-slip-headline { margin-bottom: 24px; }
.lp-slip-sub {
  font-size: 15px; color: var(--t2); line-height: 1.65; margin-top: 10px;
}
.lp-slip-transition {
  display: flex; align-items: center; gap: 14px; padding: 20px 0;
}
.lp-slip-transition-line { flex: 1; height: 1px; background: #1f1f1f; }
.lp-slip-transition-center {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
.lp-slip-engine {
  font-size: 11px; font-weight: 700; letter-spacing: .1em;
  color: #22c55e; text-transform: uppercase;
}
.lp-slip-result {
  background: #0d0d10; border: 1px solid #1f1f1f;
  border-radius: 12px; padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
}
.lp-slip-result-hdr {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.lp-slip-result-label {
  font-size: 9px; font-weight: 800; letter-spacing: .16em;
  color: var(--t2); text-transform: uppercase;
}
.lp-slip-result-badge {
  font-size: 10px; font-weight: 800; letter-spacing: .06em;
  color: #ef4444; background: rgba(239,68,68,.1);
  border: 1px solid rgba(239,68,68,.25);
  border-radius: 99px; padding: 4px 10px; white-space: nowrap;
}
.lp-slip-metrics {
  display: flex; align-items: stretch; gap: 0;
}
.lp-slip-metric {
  flex: 1; display: flex; flex-direction: column; gap: 6px; padding: 0 16px;
}
.lp-slip-metric:first-child { padding-left: 0; }
.lp-slip-metric:last-child  { padding-right: 0; }
.lp-slip-metric-divider {
  width: 1px; background: #1f1f1f; align-self: stretch; flex-shrink: 0;
}
.lp-slip-metric-lbl {
  font-size: 8.5px; font-weight: 800; letter-spacing: .14em;
  color: var(--t2); text-transform: uppercase;
}
.lp-slip-metric-val {
  font-size: 26px; font-weight: 900; line-height: 1;
  font-family: 'Courier New', monospace; letter-spacing: .02em;
}
.lp-slip-val-red   { color: #ef4444; }
.lp-slip-val-amber { color: #f59e0b; }
.lp-slip-result-desc {
  font-size: 13px; color: #6b7280; line-height: 1.6;
  border-top: 1px solid #1f1f1f; padding-top: 14px; margin: 0;
}
.lp-slip-tagline {
  font-size: 13px; color: var(--t2); line-height: 1.65;
  text-align: center; margin-top: 8px;
}
.lp-slip-cta-wrap { margin-top: 8px; }
`;
