import{r as l,j as e}from"./vendor-BnG4zNoI.js";const c=l.createContext({path:"/",navigate:()=>{}});function j({children:i}){const[o,a]=l.useState(window.location.pathname);l.useEffect(()=>{const s=()=>a(window.location.pathname);return window.addEventListener("popstate",s),()=>window.removeEventListener("popstate",s)},[]);function r(s){window.history.pushState({},"",s),a(s),window.scrollTo({top:0,behavior:"instant"})}return e.jsx(c.Provider,{value:{path:o,navigate:r},children:i})}function k(){return l.useContext(c)}function x(){return l.useContext(c).navigate}function m({to:i,children:o,className:a,style:r,onClick:s}){const n=x();function p(d){d.preventDefault(),s&&s(d),n(i)}return e.jsx("a",{href:i,onClick:p,className:a,style:r,children:o})}const t="https://pay.kiwify.com.br/DIVD8zl",g=[{text:"Eu achava que controlava, mas só olhava aposta por aposta.",name:"Carlos R.",detail:"São Paulo · apostador há 2 anos"},{text:"O controle foi o que mais me chamou atenção. Eu nunca sabia quanto tinha perdido no mês.",name:"André M.",detail:"São Paulo · apostador há 3 anos"},{text:"Ver quanto gastei no mês mudou tudo. Antes eu não sabia nem o total.",name:"Felipe T.",detail:"Curitiba · apostador de fim de semana"},{text:"Antes eu só via a odd. Agora vejo o quanto isso pesa na minha grana.",name:"Marcos V.",detail:"Belo Horizonte · apostador recreativo"}],h=[{q:"Isso me ajuda a ganhar mais?",a:"Não prometemos ganhos. Mas você vai parar de perder no escuro. Saber o risco antes de entrar já faz diferença."},{q:"É palpite ou análise?",a:"Não damos palpite. Mostramos o risco da aposta que você já escolheu. A decisão é sempre sua."},{q:"É assinatura ou pagamento único?",a:"Pagamento único de R$27. Não cobra mais nada nunca."},{q:"E se eu não gostar?",a:"Não gostou em 7 dias? Devolvo seu dinheiro. Sem burocracia."}];function f({q:i,a:o}){const[a,r]=l.useState(!1);return e.jsxs("div",{className:`lp-faq-item${a?" lp-faq-open":""}`,onClick:()=>r(!a),children:[e.jsxs("div",{className:"lp-faq-q",children:[e.jsx("span",{children:i}),e.jsx("span",{className:"lp-faq-icon","aria-hidden":"true",children:a?"−":"+"})]}),a&&e.jsx("p",{className:"lp-faq-a",children:o})]})}function u(){const[i,o]=l.useState(!1);return l.useEffect(()=>{const a=document.querySelector(".lp-hero"),r=document.querySelector("#oferta");function s(){const n=a?a.getBoundingClientRect().bottom:400,p=r?r.getBoundingClientRect().top:99999;o(n<0&&p>window.innerHeight)}return window.addEventListener("scroll",s,{passive:!0}),()=>window.removeEventListener("scroll",s)},[]),e.jsxs(e.Fragment,{children:[e.jsx("style",{children:b}),e.jsxs("div",{className:"lp-scarcity",children:[e.jsx("span",{className:"lp-scarcity-dot","aria-hidden":"true"}),e.jsx("span",{children:"+800 usuários ativos"}),e.jsx("span",{className:"lp-scarcity-sep","aria-hidden":"true",children:"·"}),e.jsxs("span",{children:["Valor de lançamento: ",e.jsx("strong",{children:"R$27"})," por tempo limitado"]})]}),e.jsx("header",{className:"lp-header",children:e.jsxs("div",{className:"lp-header-inner",children:[e.jsxs("div",{className:"lp-logo",children:[e.jsx("div",{className:"lp-logo-mark","aria-hidden":"true",children:"M"}),e.jsxs("span",{className:"lp-logo-name",children:["MotorIA",e.jsx("span",{className:"lp-logo-pro",children:" Pro"})]})]}),e.jsxs("nav",{className:"lp-nav","aria-label":"Navegação principal",children:[e.jsx("a",{href:"#como-funciona",className:"lp-nav-link",children:"Como funciona"}),e.jsx("a",{href:"#banca",className:"lp-nav-link",children:"Controle de banca"}),e.jsx("a",{href:"#oferta",className:"lp-nav-link",children:"Preço"})]}),e.jsx("a",{href:t,className:"lp-nav-cta",target:"_blank",rel:"noopener noreferrer",children:"Desbloquear por R$27"})]})}),e.jsxs("section",{className:"lp-hero",id:"topo",children:[e.jsx("div",{className:"lp-hero-glow","aria-hidden":"true"}),e.jsxs("div",{className:"lp-container lp-hero-layout",children:[e.jsxs("div",{className:"lp-hero-left",children:[e.jsx("div",{className:"lp-hero-tag",children:"Análise de risco · Controle de banca"}),e.jsxs("h1",{className:"lp-h1",children:["Vai apostar?",e.jsx("br",{}),e.jsx("span",{className:"lp-h1-accent",children:"Analise o risco"}),e.jsx("br",{}),"antes da entrada."]}),e.jsxs("p",{className:"lp-hero-sub",children:["Antes de entrar em qualquer aposta, veja se vale a pena.",e.jsx("br",{}),"E acompanhe quanto você ganhou ou perdeu no mês."]}),e.jsxs("div",{className:"lp-hero-actions",children:[e.jsxs(m,{to:"/app",className:"lp-btn-hero",children:["Ver análise agora",e.jsx("svg",{width:"13",height:"13",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})]}),e.jsx("a",{href:"#como-funciona",className:"lp-btn-ghost",children:"Entender como funciona ↓"})]}),e.jsx("p",{className:"lp-hero-micro",children:"R$27 uma vez só · acesso imediato · sem mensalidade"})]}),e.jsx("div",{className:"lp-hero-right",children:e.jsx("div",{className:"lp-img-wrap",children:e.jsx("img",{src:"/hero-risk-awareness.png",alt:"Homem analisando aposta no celular antes de entrar",className:"lp-hero-img",loading:"eager"})})})]})]}),e.jsx("section",{className:"lp-section lp-dark",id:"como-funciona",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-eyebrow",children:"Como funciona"}),e.jsxs("h2",{className:"lp-h2",children:["Antes de apostar,",e.jsx("br",{}),"passe por 3 passos."]}),e.jsx("div",{className:"lp-steps",children:[{n:"01",title:"Informe a aposta",desc:"Digite a odd e quanto vai apostar."},{n:"02",title:"Veja o risco",desc:"A ferramenta te avisa se a aposta é arriscada demais."},{n:"03",title:"Decida com clareza",desc:"Você vê tudo antes de confirmar. Sem surpresa depois."}].map((a,r)=>e.jsxs("div",{className:"lp-step",children:[e.jsx("div",{className:"lp-step-n","aria-hidden":"true",children:a.n}),e.jsxs("div",{className:"lp-step-body",children:[e.jsx("h3",{className:"lp-step-title",children:a.title}),e.jsx("p",{className:"lp-step-desc",children:a.desc})]})]},r))})]})}),e.jsx("section",{className:"lp-section",id:"analise",children:e.jsxs("div",{className:"lp-container lp-risk-layout",children:[e.jsxs("div",{className:"lp-risk-left",children:[e.jsx("div",{className:"lp-eyebrow",children:"Análise de risco"}),e.jsx("h2",{className:"lp-h2",children:"Nem toda aposta que parece boa tem risco baixo."}),e.jsx("p",{className:"lp-risk-desc",children:"A ferramenta te mostra o que você normalmente só descobre depois de perder."})]}),e.jsx("div",{className:"lp-risk-right",children:e.jsxs("div",{className:"lp-risk-card",children:[e.jsxs("div",{className:"lp-risk-card-top",children:[e.jsx("span",{className:"lp-risk-card-title",children:"Resultado parcial identificado."}),e.jsx("span",{className:"lp-risk-badge",children:"⚠ CAUTELA"})]}),e.jsx("div",{className:"lp-risk-signals",children:["Exposição elevada detectada","Entrada exige cautela","Impacto relevante na banca","Análise completa bloqueada"].map((a,r)=>e.jsxs("div",{className:"lp-risk-signal",children:[e.jsx("span",{className:"lp-risk-signal-dot","aria-hidden":"true"}),e.jsx("span",{children:a})]},r))}),e.jsxs("div",{className:"lp-risk-metrics",children:[e.jsxs("div",{className:"lp-risk-metric",children:[e.jsx("div",{className:"lp-risk-metric-lbl",children:"RISCO DA APOSTA"}),e.jsx("div",{className:"lp-risk-metric-val",children:"██ / 100"})]}),e.jsxs("div",{className:"lp-risk-metric",children:[e.jsx("div",{className:"lp-risk-metric-lbl",children:"CHANCE ESTIMADA"}),e.jsx("div",{className:"lp-risk-metric-val",children:"██,█%"})]})]}),e.jsxs("div",{className:"lp-risk-leitura",children:[e.jsx("div",{className:"lp-risk-metric-lbl",children:"LEITURA"}),e.jsx("div",{className:"lp-risk-blur",children:"████████████████████████████"})]}),e.jsx("a",{href:t,className:"lp-risk-cta",target:"_blank",rel:"noopener noreferrer",children:"Desbloquear análise completa por R$27"}),e.jsx("p",{className:"lp-risk-micro",children:"Pagamento único · sem mensalidade · acesso imediato"})]})})]})}),e.jsx("section",{className:"lp-section lp-dark",id:"banca",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-eyebrow",children:"Controle de Banca"}),e.jsxs("h2",{className:"lp-h2",children:["Sabe quanto você",e.jsx("br",{}),"perdeu esse mês?"]}),e.jsx("p",{className:"lp-banca-sub",children:"A maioria dos apostadores não sabe. O MotorIA Pro mostra seu saldo, seu lucro e suas perdas — tudo num lugar só."}),e.jsx("div",{className:"lp-bk-grid",children:[{label:"Saldo Atual",val:"R$ 1.247",sub:"+R$247 desde o início",c:"#22c55e"},{label:"Lucro do mês",val:"+R$ 247",sub:"Em 30 entradas registradas",c:"#22c55e"},{label:"Rendimento",val:"+12,4%",sub:"Sobre o valor apostado",c:"#22c55e"},{label:"Entradas registradas",val:"30",sub:"Total no período",c:"#e8e8e6"},{label:"Sequência de perdas",val:"1",sub:"Sem alerta ativo",c:"#22c55e"},{label:"Apostado hoje",val:"R$ 80",sub:"Dentro do limite diário",c:"#22c55e"}].map((a,r)=>e.jsxs("div",{className:"lp-bk-card",children:[e.jsx("div",{className:"lp-bk-label",children:a.label}),e.jsx("div",{className:"lp-bk-val",style:{color:a.c},children:a.val}),e.jsx("div",{className:"lp-bk-sub",children:a.sub})]},r))}),e.jsxs("p",{className:"lp-banca-quote",children:['"A maioria só olha a odd.',e.jsx("br",{}),'Poucos sabem o quanto já perderam esse mês."']}),e.jsx("div",{className:"lp-img-wrap lp-img-wrap-banca",children:e.jsx("img",{src:"/bankroll-control-dashboard.png",alt:"Celular mostrando dashboard de controle de banca com saldo e lucro",className:"lp-banca-img",loading:"lazy"})})]})}),e.jsx("section",{className:"lp-section",id:"padroes",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-eyebrow",children:"O que você passa a ver"}),e.jsxs("h2",{className:"lp-h2",children:["Informação que você",e.jsx("br",{}),"não tinha antes."]}),e.jsx("div",{className:"lp-patterns",children:["Quanto você ganhou esse mês","Quanto você perdeu","Se você está apostando mais do que devia","Quando está no prejuízo e tentando recuperar no impulso"].map((a,r)=>e.jsxs("div",{className:"lp-pattern",children:[e.jsx("span",{className:"lp-pattern-dot","aria-hidden":"true"}),e.jsx("span",{children:a})]},r))})]})}),e.jsx("section",{className:"lp-section lp-dark",id:"feedbacks",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-eyebrow",children:"Quem usou"}),e.jsxs("div",{className:"lp-user-count",children:[e.jsx("span",{className:"lp-user-num",children:"+800"}),e.jsx("span",{className:"lp-user-lbl",children:" apostadores ativos"})]}),e.jsx("div",{className:"lp-testimonials",children:g.map((a,r)=>e.jsxs("div",{className:"lp-test",children:[e.jsxs("p",{className:"lp-test-text",children:['"',a.text,'"']}),e.jsxs("div",{className:"lp-test-by",children:["— ",a.name]}),e.jsx("div",{className:"lp-test-detail",children:a.detail})]},r))})]})}),e.jsx("section",{className:"lp-section",id:"oferta",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-eyebrow",children:"Acesso completo"}),e.jsxs("h2",{className:"lp-h2",children:["Desbloqueie análise de risco",e.jsx("br",{}),"+ controle de banca."]}),e.jsxs("div",{className:"lp-offer-layout",children:[e.jsx("ul",{className:"lp-features","aria-label":"O que está incluído",children:["Análise de risco antes da aposta","Controle de banca completo","Histórico de entradas","Lucro e prejuízo no período","ROI e exposição em tempo real","Pagamento único","Sem mensalidade"].map((a,r)=>e.jsxs("li",{className:"lp-feature",children:[e.jsx("span",{className:"lp-feature-check","aria-hidden":"true",children:"✓"}),e.jsx("span",{children:a})]},r))}),e.jsxs("div",{className:"lp-price-card",children:[e.jsx("div",{className:"lp-price-label",children:"MOTORIA PRO · ACESSO IMEDIATO"}),e.jsxs("div",{className:"lp-price-display",children:[e.jsx("span",{className:"lp-price-old",children:"R$47"}),e.jsxs("div",{className:"lp-price-main",children:[e.jsx("span",{className:"lp-price-curr",children:"R$"}),e.jsx("span",{className:"lp-price-int",children:"27"})]})]}),e.jsxs("div",{className:"lp-urgency",children:[e.jsxs("div",{className:"lp-urgency-top",children:[e.jsx("span",{className:"lp-urgency-dot","aria-hidden":"true"}),e.jsx("span",{className:"lp-urgency-txt",children:"Vagas restantes: 153 de 1.000"})]}),e.jsx("div",{className:"lp-urgency-track",children:e.jsx("div",{className:"lp-urgency-fill"})})]}),e.jsx("a",{href:t,className:"lp-btn-buy",target:"_blank",rel:"noopener noreferrer",children:"Desbloquear por R$27"}),e.jsx("p",{className:"lp-btn-micro",children:"Acesso imediato · pagamento único"}),e.jsxs("div",{className:"lp-guarantee",children:[e.jsx("span",{className:"lp-guarantee-icon","aria-hidden":"true",children:"✓"}),e.jsx("span",{children:"Não gostou em 7 dias? Devolvo seu dinheiro. Sem burocracia."})]})]})]})]})}),e.jsx("section",{className:"lp-section lp-dark",id:"faq",children:e.jsxs("div",{className:"lp-container lp-faq-wrap",children:[e.jsx("div",{className:"lp-eyebrow",children:"Dúvidas"}),e.jsx("h2",{className:"lp-h2",children:"Perguntas frequentes."}),e.jsx("div",{className:"lp-faq",children:h.map((a,r)=>e.jsx(f,{q:a.q,a:a.a},r))})]})}),e.jsxs("section",{className:"lp-cta-final",children:[e.jsx("div",{className:"lp-cta-glow","aria-hidden":"true"}),e.jsxs("div",{className:"lp-container lp-cta-inner",children:[e.jsxs("h2",{className:"lp-cta-h2",children:["Analise antes.",e.jsx("br",{}),e.jsx("span",{className:"lp-cta-dim",children:"Decida melhor."})]}),e.jsx("a",{href:t,className:"lp-btn-buy lp-btn-buy-lg",target:"_blank",rel:"noopener noreferrer",children:"Desbloquear por R$27 →"}),e.jsx("p",{className:"lp-cta-micro",children:"Acesso imediato · pagamento único · garantia de 7 dias"})]})]}),i&&e.jsx("div",{className:"lp-sticky",role:"complementary","aria-label":"Oferta",children:e.jsx("a",{href:t,className:"lp-sticky-btn",target:"_blank",rel:"noopener noreferrer",children:"Desbloquear por R$27 →"})}),e.jsx("footer",{className:"lp-footer",children:e.jsxs("div",{className:"lp-container",children:[e.jsxs("p",{className:"lp-footer-legal",children:["⚠️ Ferramenta educativa de análise. Não é recomendação de aposta. Apostas envolvem risco financeiro real. Jogue com responsabilidade. Proibido para menores de 18 anos."," ",e.jsx("a",{href:"https://www.jogoresponsavel.com.br",target:"_blank",rel:"noopener noreferrer",children:"jogoresponsavel.com.br"})]}),e.jsxs("div",{className:"lp-footer-links",children:[e.jsx("span",{children:"© 2026 MotorIA Pro"}),e.jsx("span",{className:"lp-footer-sep","aria-hidden":"true",children:"·"}),e.jsx("a",{href:"/termos",children:"Termos de Uso"}),e.jsx("span",{className:"lp-footer-sep","aria-hidden":"true",children:"·"}),e.jsx("a",{href:"/privacidade",children:"Privacidade"}),e.jsx("span",{className:"lp-footer-sep","aria-hidden":"true",children:"·"}),e.jsx("a",{href:"mailto:suporte@motoriaopro.com.br",children:"Contato"})]})]})})]})}const b=`
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
`,N=Object.freeze(Object.defineProperty({__proto__:null,default:u},Symbol.toStringTag,{value:"Module"}));export{m as L,j as R,x as a,N as b,k as u};
