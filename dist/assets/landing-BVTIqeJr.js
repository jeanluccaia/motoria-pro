import{r as i,j as e}from"./vendor-BnG4zNoI.js";const n=i.createContext({path:"/",navigate:()=>{}});function A({children:a}){const[o,r]=i.useState(window.location.pathname);i.useEffect(()=>{const l=()=>r(window.location.pathname);return window.addEventListener("popstate",l),()=>window.removeEventListener("popstate",l)},[]);function t(l){window.history.pushState({},"",l),r(l),window.scrollTo({top:0,behavior:"instant"})}return e.jsx(n.Provider,{value:{path:o,navigate:t},children:a})}function q(){return i.useContext(n)}function m(){return i.useContext(n).navigate}function s({to:a,children:o,className:r,style:t,onClick:l}){const c=m();function d(p){p.preventDefault(),l&&l(p),c(a)}return e.jsx("a",{href:a,onClick:d,className:r,style:t,children:o})}function x(){return e.jsxs("div",{className:"ly-legal",children:[e.jsx("span",{children:"⚠"}),e.jsxs("span",{children:["Ferramenta educativa de risco. Não é recomendação de aposta. Apostas envolvem risco financeiro real e podem causar prejuízo."," ",e.jsx("strong",{children:"Proibido para menores de 18 anos."})," ",e.jsx("a",{href:"https://www.jogoresponsavel.com.br",target:"_blank",rel:"noopener noreferrer",children:"jogoresponsavel.com.br"})]})]})}function E(){return e.jsxs("header",{className:"ly-header",children:[e.jsxs(s,{to:"/",className:"ly-logo",children:[e.jsx("span",{className:"ly-logo-main",children:"MotorIA Pro"}),e.jsx("span",{className:"ly-logo-tag",children:"· Análise de Risco"})]}),e.jsx(s,{to:"/analisar",className:"ly-cta-btn",children:"Analisar minha aposta"})]})}function g(){return e.jsx("footer",{className:"ly-footer",children:e.jsxs("div",{className:"ly-footer-inner",children:[e.jsx("p",{className:"ly-footer-legal",children:"⚠ Ferramenta educativa. Não é recomendação de aposta. Apostas envolvem risco financeiro real e podem causar prejuízo. Jogue com responsabilidade."}),e.jsxs("p",{className:"ly-footer-links",children:[e.jsx("a",{href:"https://www.jogoresponsavel.com.br",target:"_blank",rel:"noopener noreferrer",children:"jogoresponsavel.com.br"})," · ",e.jsx("a",{href:"tel:188",children:"CVV 188"})," · ","Proibido para menores de 18 anos."]}),e.jsx("p",{className:"ly-footer-copy",children:"© 2026 MotorIA Pro — Análise de Risco. Todos os direitos reservados."})]})})}const F=`
/* @import removed — fonts are loaded as non-blocking <link> in index.html. */

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:    #0A0A0B;
  --text:  #F2F2F0;
  --muted: #6B7280;
  --red:   #FF4D2E;
  --amber: #FFB020;
  --green: #1FCB7A;
  --border: #1E1E1F;
  --card:  #111112;
}

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text);
  /*
    System-font stack renders instantly (zero CLS before Inter arrives).
    Inter/Syne declared first — browser swaps in silently once loaded.
  */
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system,
               BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  line-height: 1.6;
}

a { color: inherit; }

/* ── Legal bar ───────────────────────────────────────── */
.ly-legal {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 9px 20px;
  background: rgba(255,176,32,0.07);
  border-bottom: 1px solid rgba(255,176,32,0.15);
  font-size: 12px;
  color: rgba(255,176,32,0.8);
  line-height: 1.5;
}
.ly-legal a { color: rgba(255,176,32,0.8); text-decoration: underline; }

/* ── Header ──────────────────────────────────────────── */
.ly-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: rgba(10,10,11,0.95);
  backdrop-filter: blur(8px);
  z-index: 100;
}

.ly-logo {
  text-decoration: none;
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.ly-logo-main {
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 900;
  color: var(--text);
  letter-spacing: -0.02em;
}
.ly-logo-tag {
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
}

.ly-cta-btn {
  background: var(--text);
  color: var(--bg);
  font-size: 13px;
  font-weight: 700;
  padding: 9px 18px;
  border-radius: 8px;
  text-decoration: none;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.ly-cta-btn:hover { opacity: 0.85; }

/* ── Footer ──────────────────────────────────────────── */
.ly-footer {
  border-top: 1px solid var(--border);
  padding: 40px 24px;
}
.ly-footer-inner {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ly-footer-legal {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
}
.ly-footer-links {
  font-size: 12px;
  color: #444;
}
.ly-footer-links a { color: #444; text-decoration: underline; }
.ly-footer-copy {
  font-size: 11px;
  color: #333;
}
`,h=["A odd e o retorno possível","Quanto você pode ganhar","O lado positivo da aposta"],b=["Chance real de perder","Margem escondida da casa","Nota de risco 0 a 100","Custo médio por R$100 apostado"],f=[{num:"64,3%",color:"#EF4444",label:"Chance de perder",bar:64.3,desc:"O risco real dessa entrada."},{num:"67",color:"#F97316",label:"Nota de risco",bar:67,desc:"Quanto maior, mais arriscada."},{num:"5,5%",color:"#F59E0B",label:"Margem da casa",bar:5.5,desc:"O quanto a casa ganha em cima."},{num:"−R$14",color:"#EF4444",label:"Perda média por R$100",bar:61,desc:"O impacto dessa odd no longo prazo."}],u=[{n:"01",title:"Informe a odd",desc:"Coloque a odd, o valor e o tipo de aposta. Leva menos de 30 segundos."},{n:"02",title:"O MotorIA calcula o risco",desc:"Ele transforma a odd em uma leitura simples — chance de perda, nota de risco e custo estimado."},{n:"03",title:"Decida com consciência",desc:"Você vê se a aposta parece segura ou se exige cautela. A decisão é sempre sua."}],v=[{name:"R.",text:`Ia entrar pra recuperar o loss.
A análise mostrou risco alto.
Fechei o app.`},{name:"A.",text:`Achava que odd baixa era segura.
Agora olho diferente.`},{name:"F.",text:`Não me prometeu green.
Só me fez pensar antes de clicar.`},{name:"M.",text:`Eu ia apostar no impulso.
A nota de risco me travou.`}],j=[{text:"20 análises para usar quando quiser"},{text:"Nota de risco de 0 a 100 por aposta"},{text:"Chance de perder em segundos"},{text:"Margem da casa revelada por tipo de aposta"},{text:"Simulador de banca — impacto em 30 dias"},{text:"Alerta de tilt — avisa quando você está no limite",tilt:!0}],k=[{q:"Isso garante lucro?",a:"Não. Não existe ferramenta que garanta ganhos em apostas. O MotorIA te mostra o risco antes de decidir — não como vencer."},{q:"Vocês dão palpites?",a:"Nunca. Mostramos probabilidade e risco matemático. A decisão é sempre sua."},{q:"Vocês são uma casa de aposta?",a:"Não. Somos uma ferramenta educativa independente. Sem relação nenhuma com plataformas ou casas de aposta."},{q:"É assinatura mensal?",a:"Não. É um acesso único por R$27. Sem mensalidade, sem renovação automática, sem surpresa no cartão."},{q:"Funciona no celular?",a:"Sim. A ferramenta foi feita para o celular — pra usar antes de qualquer decisão, de onde você estiver."},{q:"E se eu já tenho problema com jogo?",a:"Se apostar está te causando prejuízo, ansiedade ou perda de controle, a recomendação é procurar ajuda especializada — não usar a ferramenta para apostar. Acesse jogoresponsavel.com.br ou ligue 188 (CVV)."}];function N({q:a,a:o}){const[r,t]=i.useState(!1);return e.jsxs("div",{className:`lp-faq-item${r?" lp-faq-open":""}`,onClick:()=>t(!r),children:[e.jsxs("div",{className:"lp-faq-q",children:[e.jsx("span",{children:a}),e.jsx("span",{className:"lp-faq-icon",children:r?"−":"+"})]}),r&&e.jsx("p",{className:"lp-faq-a",children:o})]})}function y(){return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:w}),e.jsx(x,{}),e.jsx("header",{className:"lp-header",children:e.jsxs("div",{className:"lp-header-inner",children:[e.jsxs("div",{className:"lp-logo",children:[e.jsx("div",{className:"lp-logo-mark",children:e.jsxs("svg",{width:"13",height:"13",viewBox:"0 0 14 14",fill:"none",children:[e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"#050505"}),e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"currentColor",fillOpacity:".9"})]})}),e.jsx("span",{className:"lp-logo-name",children:"MotorIA Pro"})]}),e.jsxs("nav",{className:"lp-nav",children:[e.jsx("a",{href:"#problema",className:"lp-nav-link",children:"O problema"}),e.jsx("a",{href:"#como-funciona",className:"lp-nav-link",children:"Como funciona"}),e.jsx("a",{href:"#preco",className:"lp-nav-link",children:"Preço"})]}),e.jsx(s,{to:"/pagar",className:"lp-nav-cta",children:"Garantir acesso →"})]})}),e.jsxs("section",{className:"lp-hero",children:[e.jsx("div",{className:"lp-hero-grid","aria-hidden":"true"}),e.jsxs("div",{className:"lp-container lp-hero-layout",children:[e.jsxs("div",{className:"lp-hero-left",children:[e.jsxs("h1",{className:"lp-h1",children:["Essa odd",e.jsx("br",{}),"parecia boa."]}),e.jsx("p",{className:"lp-hero-sub",children:"Até o MotorIA mostrar o risco."}),e.jsx("p",{className:"lp-hero-desc",children:"Veja o risco antes de apostar."}),e.jsxs("div",{className:"lp-hero-actions",children:[e.jsxs(s,{to:"/app",className:"lp-btn-hero",children:["Analisar uma aposta",e.jsx("svg",{width:"13",height:"13",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})]}),e.jsx(s,{to:"/pagar",className:"lp-btn-ghost",children:"Acesso completo por R$27"})]}),e.jsxs("div",{className:"lp-hero-meta",children:["Ferramenta educativa",e.jsx("span",{className:"lp-meta-sep",children:"·"}),"+18",e.jsx("span",{className:"lp-meta-sep",children:"·"}),"Não promete lucro"]})]}),e.jsx("div",{className:"lp-hero-right",children:e.jsxs("div",{className:"lp-mock",children:[e.jsxs("div",{className:"lp-mock-topbar",children:[e.jsxs("div",{className:"lp-mock-traffic",children:[e.jsx("span",{className:"lp-mock-dot-r"}),e.jsx("span",{className:"lp-mock-dot-y"}),e.jsx("span",{className:"lp-mock-dot-g"})]}),e.jsx("span",{className:"lp-mock-title",children:"MotorIA · Leitura de risco"}),e.jsx("span",{className:"lp-mock-live",children:"LIVE"})]}),e.jsxs("div",{className:"lp-mock-body",children:[e.jsxs("div",{className:"lp-mock-session",children:[e.jsx("span",{className:"lp-mock-session-id",children:"ANÁLISE #2847"}),e.jsx("span",{className:"lp-mock-session-ts",children:"hoje · 14:23"})]}),e.jsxs("div",{className:"lp-mock-input-row",children:[e.jsxs("div",{className:"lp-mock-cell",children:[e.jsx("span",{className:"lp-mock-cell-lbl",children:"Jogo"}),e.jsx("span",{className:"lp-mock-cell-val",children:"Flamengo × Palmeiras"}),e.jsx("span",{className:"lp-mock-cell-sub",children:"Vitória do Flamengo"})]}),e.jsxs("div",{className:"lp-mock-cell lp-mock-cell-sm",children:[e.jsx("span",{className:"lp-mock-cell-lbl",children:"Odd"}),e.jsx("span",{className:"lp-mock-cell-val lp-mock-odd",children:"2.80"})]})]}),e.jsxs("div",{className:"lp-mock-prob-split",children:[e.jsx("div",{className:"lp-mock-prob-win"}),e.jsx("div",{className:"lp-mock-prob-lose"})]}),e.jsxs("div",{className:"lp-mock-prob-labels",children:[e.jsx("span",{className:"lp-mock-prob-lbl lp-mock-prob-w",children:"▲ Chance de ganhar 35,7%"}),e.jsx("span",{className:"lp-mock-prob-lbl lp-mock-prob-l",children:"64,3% de perder ▼"})]}),e.jsx("div",{className:"lp-mock-rule"}),e.jsxs("div",{className:"lp-mock-data-grid",children:[e.jsxs("div",{className:"lp-mock-dc",children:[e.jsx("span",{className:"lp-mock-dk",children:"CHANCE DE GANHAR"}),e.jsx("span",{className:"lp-mock-dv lp-mock-dv-g",children:"35,71%"})]}),e.jsxs("div",{className:"lp-mock-dc",children:[e.jsx("span",{className:"lp-mock-dk",children:"MARGEM DA CASA"}),e.jsx("span",{className:"lp-mock-dv lp-mock-dv-a",children:"5,47%"})]}),e.jsxs("div",{className:"lp-mock-dc",children:[e.jsx("span",{className:"lp-mock-dk",children:"CHANCE DE PERDER"}),e.jsx("span",{className:"lp-mock-dv lp-mock-dv-r",children:"64,3%"})]}),e.jsxs("div",{className:"lp-mock-dc",children:[e.jsx("span",{className:"lp-mock-dk",children:"CUSTO POR R$100"}),e.jsx("span",{className:"lp-mock-dv lp-mock-dv-r",children:"−R$14,50"})]})]}),e.jsx("div",{className:"lp-mock-rule"}),e.jsxs("div",{className:"lp-mock-score-wrap",children:[e.jsxs("div",{className:"lp-mock-score-hdr",children:[e.jsx("span",{className:"lp-mock-score-lbl",children:"NOTA DE RISCO"}),e.jsx("span",{className:"lp-mock-risk-tag",children:"ALTO"})]}),e.jsxs("div",{className:"lp-mock-score-row",children:[e.jsxs("div",{className:"lp-mock-score-left",children:[e.jsx("span",{className:"lp-mock-score-num",children:"67"}),e.jsx("span",{className:"lp-mock-score-denom",children:"/100"})]}),e.jsxs("div",{className:"lp-mock-bar-wrap",children:[e.jsxs("div",{className:"lp-mock-bar-track",children:[e.jsx("div",{className:"lp-mock-bar-fill"}),[30,60,80].map(a=>e.jsx("div",{className:"lp-mock-bar-tick",style:{left:`${a}%`}},a))]}),e.jsxs("div",{className:"lp-mock-bar-labels",children:[e.jsx("span",{children:"Baixo"}),e.jsx("span",{children:"Mod."}),e.jsx("span",{children:"Alto"}),e.jsx("span",{children:"Crítico"})]})]})]}),e.jsxs("div",{className:"lp-mock-verdict",children:[e.jsx("span",{className:"lp-mock-verdict-badge",children:"DESFAVORÁVEL"}),e.jsx("span",{className:"lp-mock-verdict-detail",children:"Verifique antes de decidir"})]})]})]}),e.jsx("div",{className:"lp-mock-footer",children:"Ferramenta educativa · Não é recomendação de aposta"})]})})]})]}),e.jsx("section",{className:"lp-problem lp-section-dark",id:"problema",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"O problema"}),e.jsxs("h2",{className:"lp-h2",children:["Nem toda aposta ruim",e.jsx("br",{}),"parece arriscada."]}),e.jsx("p",{className:"lp-problem-text",children:"Às vezes a odd parece boa. O jogo parece fácil. A vontade de recuperar fala mais alto."}),e.jsx("p",{className:"lp-problem-text lp-problem-text-em",children:"O MotorIA entra antes disso — mostrando o risco que você talvez não esteja vendo."}),e.jsxs("div",{className:"lp-compare",children:[e.jsxs("div",{className:"lp-compare-col lp-compare-show",children:[e.jsxs("div",{className:"lp-compare-hdr",children:[e.jsx("span",{className:"lp-compare-dot lp-compare-dot-dim"}),e.jsx("span",{className:"lp-compare-title",children:"Você normalmente vê"})]}),h.map((a,o)=>e.jsxs("div",{className:"lp-compare-row",children:[e.jsx("span",{className:"lp-compare-icon lp-c-dim",children:"→"}),e.jsx("span",{className:"lp-compare-text",children:a})]},o))]}),e.jsxs("div",{className:"lp-compare-col lp-compare-hide",children:[e.jsxs("div",{className:"lp-compare-hdr",children:[e.jsx("span",{className:"lp-compare-dot lp-compare-dot-green"}),e.jsx("span",{className:"lp-compare-title",children:"O MotorIA mostra"})]}),b.map((a,o)=>e.jsxs("div",{className:"lp-compare-row",children:[e.jsx("span",{className:"lp-compare-icon lp-c-green",children:"✓"}),e.jsx("span",{className:"lp-compare-text",children:a})]},o))]})]})]})}),e.jsx("section",{className:"lp-dash",id:"como-funciona",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"O que você descobre"}),e.jsxs("h2",{className:"lp-h2 lp-h2-narrow",children:["4 números que a odd",e.jsx("br",{}),"não te mostra."]}),e.jsx("div",{className:"lp-dash-grid",children:f.map(a=>e.jsxs("div",{className:"lp-dash-card",children:[e.jsx("div",{className:"lp-dash-card-num",style:{color:a.color},children:a.num}),e.jsx("div",{className:"lp-dash-card-label",children:a.label}),e.jsx("div",{className:"lp-dash-mini-bar",children:e.jsx("div",{className:"lp-dash-mini-fill",style:{width:`${a.bar}%`,background:a.color}})}),e.jsx("div",{className:"lp-dash-card-desc",children:a.desc})]},a.label))})]})}),e.jsx("section",{className:"lp-section lp-section-dark",id:"como-funciona-steps",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Como funciona"}),e.jsx("h2",{className:"lp-h2 lp-h2-narrow",children:"Simples assim."}),e.jsx("div",{className:"lp-steps",children:u.map(a=>e.jsxs("div",{className:"lp-step",children:[e.jsx("div",{className:"lp-step-n",children:a.n}),e.jsx("h3",{className:"lp-step-title",children:a.title}),e.jsx("p",{className:"lp-step-desc",children:a.desc})]},a.n))}),e.jsx("div",{style:{textAlign:"center"},children:e.jsxs(s,{to:"/app",className:"lp-btn-hero",children:["Analisar uma aposta",e.jsx("svg",{width:"13",height:"13",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})]})})]})}),e.jsx("section",{className:"lp-position",children:e.jsx("div",{className:"lp-container",children:e.jsxs("div",{className:"lp-position-layout",children:[e.jsxs("div",{className:"lp-position-left",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Nossa posição"}),e.jsxs("h2",{className:"lp-h2",children:["Não prometemos lucro.",e.jsx("br",{}),e.jsx("span",{className:"lp-h2-dim",children:"Nunca prometemos."})]}),e.jsx("div",{className:"lp-position-points",children:["Não somos casa de aposta","Não vendemos palpite","Não garantimos resultado","Não incentivamos apostar mais"].map((a,o)=>e.jsxs("div",{className:"lp-position-pt",children:[e.jsx("span",{className:"lp-position-pt-icon","aria-hidden":"true",children:"○"}),e.jsx("span",{className:"lp-position-pt-title",children:a})]},o))}),e.jsx("p",{className:"lp-position-bottom",children:"O objetivo é simples: te mostrar o risco antes da decisão."})]}),e.jsxs("div",{className:"lp-position-right",children:[e.jsxs("div",{className:"lp-founder-photo-wrap",children:[e.jsxs("picture",{children:[e.jsx("source",{type:"image/avif",srcSet:"/jean-analise-960.avif"}),e.jsx("source",{type:"image/webp",srcSet:"/jean-analise-960.webp"}),e.jsx("img",{src:"/jean-analise.png",alt:"Jean Lucca — criador do MotorIA Pro",className:"lp-founder-img",loading:"lazy",decoding:"async",height:"auto"})]}),e.jsxs("div",{className:"lp-founder-caption",children:[e.jsx("span",{className:"lp-founder-caption-name",children:"Jean Lucca"}),e.jsx("span",{className:"lp-founder-caption-role",children:"Criador do MotorIA Pro"})]})]}),e.jsx("blockquote",{className:"lp-position-quote",children:e.jsx("p",{className:"lp-position-quote-text",children:'"O problema nunca foi a odd. Foi não entender o risco por trás dela."'})})]})]})})}),e.jsx("section",{className:"lp-section lp-section-dark",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Quem usou"}),e.jsx("h2",{className:"lp-h2 lp-h2-narrow",children:"O que disseram."}),e.jsx("div",{className:"lp-testimonials",children:v.map((a,o)=>e.jsxs("div",{className:"lp-testimonial",children:[e.jsxs("p",{className:"lp-test-text",style:{whiteSpace:"pre-line"},children:['"',a.text,'"']}),e.jsxs("div",{className:"lp-test-name",children:["— ",a.name]})]},o))})]})}),e.jsx("section",{className:"lp-section",id:"preco",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Acesso completo"}),e.jsx("h2",{className:"lp-h2 lp-h2-narrow",children:"Custa menos que uma aposta perdida."}),e.jsx("p",{className:"lp-pricing-sub",children:"Por R$27, você acessa uma ferramenta para entender o risco antes de decidir."}),e.jsxs("div",{className:"lp-pricing",children:[e.jsx("ul",{className:"lp-features-list",children:j.map((a,o)=>e.jsxs("li",{className:`lp-feature-item${a.tilt?" lp-feature-tilt":""}`,children:[e.jsx("span",{className:"lp-feature-check",children:a.tilt?"⚡":"✓"}),e.jsx("span",{children:a.text})]},o))}),e.jsxs("div",{className:"lp-price-card",children:[e.jsx("div",{className:"lp-price-eyebrow",children:"Acesso único"}),e.jsxs("div",{className:"lp-price-display",children:[e.jsx("span",{className:"lp-price-curr",children:"R$"}),e.jsx("span",{className:"lp-price-int",children:"27"})]}),e.jsx("p",{className:"lp-price-note",children:"Sem mensalidade. Ativação imediata após o pagamento."}),e.jsx(s,{to:"/pagar",className:"lp-btn-buy",children:"Garantir acesso por R$27 →"}),e.jsxs("div",{className:"lp-guarantee",children:[e.jsx("div",{className:"lp-guarantee-icon",children:"✓"}),e.jsxs("div",{children:[e.jsx("div",{className:"lp-guarantee-title",children:"Garantia de 7 dias"}),e.jsx("div",{className:"lp-guarantee-sub",children:"Não achou útil? Devolvemos 100% sem perguntas."})]})]})]})]})]})}),e.jsx("section",{className:"lp-section lp-section-dark",children:e.jsxs("div",{className:"lp-container",style:{maxWidth:680},children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Dúvidas"}),e.jsx("h2",{className:"lp-h2 lp-h2-narrow",children:"Perguntas frequentes."}),e.jsx("div",{className:"lp-faq",children:k.map((a,o)=>e.jsx(N,{q:a.q,a:a.a},o))})]})}),e.jsxs("section",{className:"lp-cta-final",children:[e.jsx("div",{className:"lp-cta-grid","aria-hidden":"true"}),e.jsxs("div",{className:"lp-container lp-cta-inner",children:[e.jsxs("h2",{className:"lp-cta-h2",children:["Antes de apostar,",e.jsx("br",{}),e.jsx("span",{className:"lp-cta-dim",children:"veja o risco."})]}),e.jsx("p",{className:"lp-cta-sub",children:"O risco que a odd esconde."}),e.jsxs("div",{className:"lp-cta-actions",children:[e.jsx(s,{to:"/app",className:"lp-btn-buy lp-btn-buy-lg",children:"Analisar uma aposta →"}),e.jsx(s,{to:"/pagar",className:"lp-cta-alt-link",children:"Ou garanta acesso completo por R$27"})]}),e.jsxs("div",{className:"lp-cta-trust",children:[e.jsx("span",{children:"Ferramenta educativa"}),e.jsx("span",{className:"lp-meta-sep",children:"·"}),e.jsx("span",{children:"Garantia de 7 dias"}),e.jsx("span",{className:"lp-meta-sep",children:"·"}),e.jsx("span",{children:"Não é casa de aposta"})]}),e.jsx("p",{className:"lp-cta-disclaimer",children:"Não garante resultados. Não incentiva apostas. Uso recomendado apenas para maiores de 18 anos."})]})]}),e.jsx(g,{})]})}const w=`
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
`,S=Object.freeze(Object.defineProperty({__proto__:null,default:y},Symbol.toStringTag,{value:"Module"}));export{g as F,F as G,E as H,s as L,A as R,m as a,x as b,S as c,q as u};
