import{r as n,j as e}from"./vendor-BnG4zNoI.js";const p=n.createContext({path:"/",navigate:()=>{}});function S({children:a}){const[o,r]=n.useState(window.location.pathname);n.useEffect(()=>{const s=()=>r(window.location.pathname);return window.addEventListener("popstate",s),()=>window.removeEventListener("popstate",s)},[]);function l(s){window.history.pushState({},"",s),r(s),window.scrollTo({top:0,behavior:"instant"})}return e.jsx(p.Provider,{value:{path:o,navigate:l},children:a})}function C(){return n.useContext(p)}function h(){return n.useContext(p).navigate}function i({to:a,children:o,className:r,style:l,onClick:s}){const x=h();function g(c){c.preventDefault(),s&&s(c),x(a)}return e.jsx("a",{href:a,onClick:g,className:r,style:l,children:o})}function b(){return e.jsxs("div",{className:"ly-legal",children:[e.jsx("span",{children:"⚠"}),e.jsxs("span",{children:["Ferramenta educativa de risco. Não é recomendação de aposta. Apostas envolvem risco financeiro real e podem causar prejuízo."," ",e.jsx("strong",{children:"Proibido para menores de 18 anos."})," ",e.jsx("a",{href:"https://www.jogoresponsavel.com.br",target:"_blank",rel:"noopener noreferrer",children:"jogoresponsavel.com.br"})]})]})}function F(){return e.jsxs("header",{className:"ly-header",children:[e.jsxs(i,{to:"/",className:"ly-logo",children:[e.jsx("span",{className:"ly-logo-main",children:"MotorIA Pro"}),e.jsx("span",{className:"ly-logo-tag",children:"· Análise de Risco"})]}),e.jsx(i,{to:"/analisar",className:"ly-cta-btn",children:"Analisar minha aposta"})]})}function f(){return e.jsx("footer",{className:"ly-footer",children:e.jsxs("div",{className:"ly-footer-inner",children:[e.jsx("p",{className:"ly-footer-legal",children:"⚠ Ferramenta educativa. Não é recomendação de aposta. Apostas envolvem risco financeiro real e podem causar prejuízo. Jogue com responsabilidade."}),e.jsxs("p",{className:"ly-footer-links",children:[e.jsx("a",{href:"https://www.jogoresponsavel.com.br",target:"_blank",rel:"noopener noreferrer",children:"jogoresponsavel.com.br"})," · ",e.jsx("a",{href:"tel:188",children:"CVV 188"})," · ","Proibido para menores de 18 anos."]}),e.jsx("p",{className:"ly-footer-copy",children:"© 2026 MotorIA Pro — Análise de Risco. Todos os direitos reservados."})]})})}const R=`
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
`,u=["Odd: 2.80","Retorno se ganhar: +R$280","Lucro possível: R$180"],v=["Probabilidade implícita: 35,7%","Margem embutida (vig): 5,5%","Chance real de perda: 64,3%","Valor esperado negativo: −R$14,50"],j=[{num:"35,7%",color:"#22C55E",label:"Probabilidade implícita",bar:35.7,desc:"Chance mínima de ganho para o mercado equilibrar. Odd 2.80 = casa estima 35,7%."},{num:"5,5%",color:"#F59E0B",label:"Margem da casa (vig)",bar:5.5,desc:"Taxa invisível embutida em toda odd. Você nunca vê — mas sempre paga."},{num:"64,3%",color:"#EF4444",label:"Chance de perda",bar:64.3,desc:"Probabilidade estimada de perder essa aposta. Calculada direto da odd fornecida."},{num:"−R$14",color:"#EF4444",label:"Valor esperado / R$100",bar:61,desc:"No longo prazo, quanto você tende a perder por cada R$100 apostado nesse perfil."}],k=[{n:"01",title:"Informe o evento e a odd",desc:"Jogo, tipo de aposta, odd e valor pretendido. Quanto mais contexto, mais precisa a análise.",tags:["Evento","Odd","Tipo","Valor"]},{n:"02",title:"O motor calcula os riscos",desc:"Probabilidade implícita, margem da casa, valor esperado e score de risco — calculados automaticamente.",tags:["Score 0–100","Probabilidade","EV","Margem"]},{n:"03",title:"Receba a leitura de risco",desc:"Relatório com cenário necessário, pontos cegos e leitura conservadora antes de qualquer decisão.",tags:["Pontos cegos","Chance de perda","Análise final"]}],t=[{name:"Ricardo M.",age:34,city:"São Paulo",text:"Tomei um susto quando vi o número. Achava que só precisava acertar o jogo, mas a casa já come uma parte antes mesmo de começar."},{name:"Ana C.",age:28,city:"Belo Horizonte",text:"Fiz a análise de uma aposta que achava certeira, odd 1.50. Deu 66% de chance de perder e eu travei. Não apostei. Perdi mesmo."},{name:"Felipe S.",age:41,city:"Rio de Janeiro",text:"Tava em dia horrível, 3 perdas seguidas. Fui analisar uma 'recuperação' e o sistema sinalizou risco alto. Parei. Isso vale mais que qualquer dica."},{name:"Mariana T.",age:25,city:"Curitiba",text:"Não é mágica, não promete nada. É uma lupa em cima do que você vai fazer. Simples assim — uso antes de qualquer decisão agora."},{name:"Gustavo R.",age:37,city:"Porto Alegre",text:"Coloquei meu padrão de aposta no simulador. Projeção de 30 dias: negativo. Óbvio quando você vê na tela. Impossível de ver sozinho."},{name:"Cássia F.",age:44,city:"Salvador",text:"Mostrei ao meu marido a projeção com o que ele apostava por semana. Ele fechou o computador, ficou quieto. Semana seguinte havia parado."}],N=["20 análises incluídas no pacote inicial","MotorIA Risk Index™ (0–100) por análise","Probabilidade implícita calculada na hora","Margem da casa (vig) decodificada por mercado","Simulador de bankroll — projeção 30 e 90 dias","Detector de tilt — alerta comportamental de risco","8 indicadores matemáticos por análise completa","Relatório com pontos cegos e leitura conservadora","Acesso à engine de análise quantitativa completa"],w=[{q:"Funciona para qualquer esporte?",a:"Sim. A análise se baseia na matemática da odd, que é universal — futebol, basquete, tênis, MMA, eSports e qualquer mercado com odds."},{q:"Vocês são uma casa de aposta?",a:"Não. Somos uma ferramenta educativa independente. Não fazemos apostas, não vendemos odds e não temos nenhuma relação com casas de aposta."},{q:"É assinatura mensal?",a:"Não. É um acesso único por R$27. Sem renovação automática, sem mensalidade."},{q:"Vocês dão palpites ou previsões?",a:"Nunca. Mostramos riscos, probabilidades matemáticas e impacto financeiro. A decisão é sempre sua."},{q:"Como recebo o acesso após o pagamento?",a:"Imediatamente. Após o pagamento confirmado, você recebe o link de acesso no email de confirmação."},{q:"Funciona no celular?",a:"Sim. A ferramenta é 100% mobile-first, feita para usar antes de qualquer decisão, de onde você estiver."},{q:"E se eu já tenho problemas com jogo?",a:"Procure ajuda imediatamente. Acesse jogoresponsavel.com.br ou ligue para o CVV: 188. Problema com jogo é sério e tem tratamento."},{q:"Como funciona a garantia?",a:"7 dias corridos a partir da compra. Não achou útil? Basta enviar um email e devolvemos 100% sem perguntas."}],y=[{id:2847,event:"Flamengo × Palmeiras",odd:"2.80",score:67,tag:"ALTO",tc:"#F97316",ago:"2 min"},{id:2844,event:"Corinthians × Santos",odd:"1.45",score:82,tag:"CRÍTICO",tc:"#EF4444",ago:"8 min"},{id:2841,event:"Manchester City · Vencer",odd:"1.25",score:91,tag:"CRÍTICO",tc:"#EF4444",ago:"15 min"},{id:2838,event:"Djokovic × Alcaraz · Set 1",odd:"3.20",score:41,tag:"MODERADO",tc:"#F59E0B",ago:"23 min"}],d=[{bg:"rgba(34,197,94,0.1)",border:"rgba(34,197,94,0.25)",color:"#22c55e"},{bg:"rgba(99,102,241,0.1)",border:"rgba(99,102,241,0.25)",color:"#818cf8"},{bg:"rgba(245,158,11,0.1)",border:"rgba(245,158,11,0.25)",color:"#f59e0b"},{bg:"rgba(244,114,182,0.1)",border:"rgba(244,114,182,0.25)",color:"#f472b6"},{bg:"rgba(45,212,191,0.1)",border:"rgba(45,212,191,0.25)",color:"#2dd4bf"},{bg:"rgba(251,146,60,0.1)",border:"rgba(251,146,60,0.25)",color:"#fb923c"}];function m({name:a,index:o}){const r=d[o%d.length],l=(a[0]+(a.split(" ")[1]?.[0]??"")).toUpperCase();return e.jsx("div",{className:"lp-avatar",style:{background:r.bg,border:`1px solid ${r.border}`,color:r.color},children:l})}function z({q:a,a:o}){const[r,l]=n.useState(!1);return e.jsxs("div",{className:`lp-faq-item${r?" lp-faq-open":""}`,onClick:()=>l(!r),children:[e.jsxs("div",{className:"lp-faq-q",children:[e.jsx("span",{children:a}),e.jsx("span",{className:"lp-faq-icon",children:r?"−":"+"})]}),r&&e.jsx("p",{className:"lp-faq-a",children:o})]})}function A(){return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:q}),e.jsx(b,{}),e.jsx("header",{className:"lp-header",children:e.jsxs("div",{className:"lp-header-inner",children:[e.jsxs("div",{className:"lp-logo",children:[e.jsx("div",{className:"lp-logo-mark",children:e.jsxs("svg",{width:"13",height:"13",viewBox:"0 0 14 14",fill:"none",children:[e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"#050505"}),e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"currentColor",fillOpacity:".9"})]})}),e.jsx("span",{className:"lp-logo-name",children:"MotorIA Pro"}),e.jsx("span",{className:"lp-logo-sep",children:"·"}),e.jsx("span",{className:"lp-logo-tag",children:"Análise de Risco"})]}),e.jsxs("nav",{className:"lp-nav",children:[e.jsx("a",{href:"#problema",className:"lp-nav-link",children:"O problema"}),e.jsx("a",{href:"#como-funciona",className:"lp-nav-link",children:"Como funciona"}),e.jsx("a",{href:"#preco",className:"lp-nav-link",children:"Preço"})]}),e.jsx(i,{to:"/pagar",className:"lp-nav-cta",children:"Garantir acesso →"})]})}),e.jsxs("section",{className:"lp-hero",children:[e.jsx("div",{className:"lp-hero-grid","aria-hidden":"true"}),e.jsxs("div",{className:"lp-container lp-hero-layout",children:[e.jsxs("div",{className:"lp-hero-left",children:[e.jsxs("div",{className:"lp-tag-pill",children:[e.jsx("span",{className:"lp-tag-dot","aria-hidden":"true"}),"Ferramenta matemática · Análise de odds"]}),e.jsxs("h1",{className:"lp-h1",children:["Análise matemática",e.jsx("br",{}),"de risco em odds."]}),e.jsxs("div",{className:"lp-hero-insight",children:["A maioria aposta olhando retorno.",e.jsx("br",{}),"Poucos entendem probabilidade."]}),e.jsx("div",{className:"lp-hero-pills",children:["P(ganho) implícita","VIG embutida","MRI™ 0–100","EV / R$100"].map(a=>e.jsx("span",{className:"lp-hero-pill",children:a},a))}),e.jsxs("div",{className:"lp-hero-actions",children:[e.jsxs(i,{to:"/pagar",className:"lp-btn-hero",children:["Garantir acesso — R$27",e.jsx("svg",{width:"13",height:"13",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})]}),e.jsx("a",{href:"#problema",className:"lp-btn-ghost",children:"Ver como funciona"})]}),e.jsxs("div",{className:"lp-hero-meta",children:[e.jsx("span",{children:"Acesso por R$27"}),e.jsx("span",{className:"lp-meta-sep",children:"·"}),e.jsx("span",{children:"Sem cadastro"}),e.jsx("span",{className:"lp-meta-sep",children:"·"}),e.jsx("span",{children:"Garantia 7 dias"})]})]}),e.jsx("div",{className:"lp-hero-right",children:e.jsxs("div",{className:"lp-mock",children:[e.jsxs("div",{className:"lp-mock-topbar",children:[e.jsxs("div",{className:"lp-mock-traffic",children:[e.jsx("span",{className:"lp-mock-dot-r"}),e.jsx("span",{className:"lp-mock-dot-y"}),e.jsx("span",{className:"lp-mock-dot-g"})]}),e.jsx("span",{className:"lp-mock-title",children:"MotorIA™ · Análise de Risco"}),e.jsx("span",{className:"lp-mock-version",children:"v2.4"}),e.jsx("span",{className:"lp-mock-live",children:"LIVE"})]}),e.jsxs("div",{className:"lp-mock-body",children:[e.jsxs("div",{className:"lp-mock-session",children:[e.jsx("span",{className:"lp-mock-session-id",children:"ANÁLISE #2847"}),e.jsx("span",{className:"lp-mock-session-ts",children:"15/05 · 14:23:07"})]}),e.jsxs("div",{className:"lp-mock-input-row",children:[e.jsxs("div",{className:"lp-mock-cell",children:[e.jsx("span",{className:"lp-mock-cell-lbl",children:"Evento · Mercado"}),e.jsx("span",{className:"lp-mock-cell-val",children:"Flamengo × Palmeiras"}),e.jsx("span",{className:"lp-mock-cell-sub",children:"Resultado Final — Flamengo"})]}),e.jsxs("div",{className:"lp-mock-cell lp-mock-cell-sm",children:[e.jsx("span",{className:"lp-mock-cell-lbl",children:"Odd"}),e.jsx("span",{className:"lp-mock-cell-val lp-mock-odd",children:"2.80"})]})]}),e.jsxs("div",{className:"lp-mock-prob-split",children:[e.jsx("div",{className:"lp-mock-prob-win"}),e.jsx("div",{className:"lp-mock-prob-lose"})]}),e.jsxs("div",{className:"lp-mock-prob-labels",children:[e.jsx("span",{className:"lp-mock-prob-lbl lp-mock-prob-w",children:"▲ Vitória 35,7%"}),e.jsx("span",{className:"lp-mock-prob-lbl lp-mock-prob-l",children:"Derrota 64,3% ▼"})]}),e.jsx("div",{className:"lp-mock-rule"}),e.jsxs("div",{className:"lp-mock-data-grid",children:[e.jsxs("div",{className:"lp-mock-dc",children:[e.jsx("span",{className:"lp-mock-dk",children:"PROB. IMPL."}),e.jsx("span",{className:"lp-mock-dv lp-mock-dv-g",children:"35,71%"})]}),e.jsxs("div",{className:"lp-mock-dc",children:[e.jsx("span",{className:"lp-mock-dk",children:"PROB. JUSTA ↗"}),e.jsx("span",{className:"lp-mock-dv lp-mock-dv-d",children:"37,83%"})]}),e.jsxs("div",{className:"lp-mock-dc",children:[e.jsx("span",{className:"lp-mock-dk",children:"VIG EMBUTIDA"}),e.jsx("span",{className:"lp-mock-dv lp-mock-dv-a",children:"5,47%"})]}),e.jsxs("div",{className:"lp-mock-dc",children:[e.jsx("span",{className:"lp-mock-dk",children:"EV / R$100"}),e.jsx("span",{className:"lp-mock-dv lp-mock-dv-r",children:"−R$14,50"})]}),e.jsxs("div",{className:"lp-mock-dc",children:[e.jsx("span",{className:"lp-mock-dk",children:"CHANCE PERDA"}),e.jsx("span",{className:"lp-mock-dv lp-mock-dv-r",children:"64,3%"})]}),e.jsxs("div",{className:"lp-mock-dc",children:[e.jsx("span",{className:"lp-mock-dk",children:"PRECISÃO ENG."}),e.jsx("span",{className:"lp-mock-dv lp-mock-dv-d",children:"94,2%"})]})]}),e.jsx("div",{className:"lp-mock-rule"}),e.jsxs("div",{className:"lp-mock-score-wrap",children:[e.jsxs("div",{className:"lp-mock-score-hdr",children:[e.jsx("span",{className:"lp-mock-score-lbl",children:"MOTORIA RISK INDEX™"}),e.jsx("span",{className:"lp-mock-risk-tag",children:"ALTO"})]}),e.jsxs("div",{className:"lp-mock-score-row",children:[e.jsxs("div",{className:"lp-mock-score-left",children:[e.jsx("span",{className:"lp-mock-score-num",children:"67"}),e.jsx("span",{className:"lp-mock-score-denom",children:"/100"})]}),e.jsxs("div",{className:"lp-mock-bar-wrap",children:[e.jsxs("div",{className:"lp-mock-bar-track",children:[e.jsx("div",{className:"lp-mock-bar-fill"}),[30,60,80].map(a=>e.jsx("div",{className:"lp-mock-bar-tick",style:{left:`${a}%`}},a))]}),e.jsxs("div",{className:"lp-mock-bar-labels",children:[e.jsx("span",{children:"Baixo"}),e.jsx("span",{children:"Mod."}),e.jsx("span",{children:"Alto"}),e.jsx("span",{children:"Crítico"})]})]})]}),e.jsx("div",{className:"lp-mock-score-ci",children:"IC 95% · [61 — 73]"}),e.jsxs("div",{className:"lp-mock-verdict",children:[e.jsx("span",{className:"lp-mock-verdict-badge",children:"DESFAVORÁVEL"}),e.jsx("span",{className:"lp-mock-verdict-detail",children:"3 alertas críticos identificados"})]})]})]}),e.jsx("div",{className:"lp-mock-footer",children:"Ferramenta educativa · Não constitui recomendação de aposta"})]})})]})]}),e.jsx("section",{className:"lp-expose",id:"problema",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"O problema"}),e.jsxs("h2",{className:"lp-h2",children:["Você vê a odd.",e.jsx("br",{}),"A casa vê a matemática."]}),e.jsx("p",{className:"lp-expose-sub",children:"As plataformas mostram o que te motiva a apostar. Escondem o que te faria reconsiderar."}),e.jsxs("div",{className:"lp-expose-grid",children:[e.jsxs("div",{className:"lp-expose-col lp-expose-col-show",children:[e.jsxs("div",{className:"lp-expose-col-hdr",children:[e.jsx("span",{className:"lp-expose-dot lp-expose-dot-green"}),e.jsx("span",{className:"lp-expose-col-title",children:"Plataformas mostram"})]}),u.map((a,o)=>e.jsxs("div",{className:"lp-expose-row",children:[e.jsx("span",{className:"lp-expose-icon lp-c-green",children:"✓"}),e.jsx("span",{className:"lp-expose-row-text",children:a})]},o))]}),e.jsx("div",{className:"lp-expose-vs-col","aria-hidden":"true",children:e.jsx("div",{className:"lp-expose-vs",children:"VS"})}),e.jsxs("div",{className:"lp-expose-col lp-expose-col-hide",children:[e.jsxs("div",{className:"lp-expose-col-hdr",children:[e.jsx("span",{className:"lp-expose-dot lp-expose-dot-red"}),e.jsx("span",{className:"lp-expose-col-title",children:"O que elas escondem"})]}),v.map((a,o)=>e.jsxs("div",{className:"lp-expose-row",children:[e.jsx("span",{className:"lp-expose-icon lp-c-red",children:"✗"}),e.jsx("span",{className:"lp-expose-row-text",children:a})]},o))]})]}),e.jsxs("div",{className:"lp-expose-callout",children:[e.jsx("span",{className:"lp-expose-callout-strong",children:"O MotorIA Pro"})," calcula tudo isso automaticamente — antes de qualquer decisão."]})]})}),e.jsx("section",{className:"lp-dash lp-section-dark",id:"como-funciona",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"O que você recebe"}),e.jsxs("h2",{className:"lp-h2 lp-h2-narrow",children:["8 indicadores.",e.jsx("br",{}),"Menos de 60 segundos."]}),e.jsx("div",{className:"lp-dash-grid",children:j.map(a=>e.jsxs("div",{className:"lp-dash-card",children:[e.jsx("div",{className:"lp-dash-card-num",style:{color:a.color},children:a.num}),e.jsx("div",{className:"lp-dash-card-label",children:a.label}),e.jsx("div",{className:"lp-dash-mini-bar",children:e.jsx("div",{className:"lp-dash-mini-fill",style:{width:`${a.bar}%`,background:a.color}})}),e.jsx("div",{className:"lp-dash-card-desc",children:a.desc})]},a.label))}),e.jsxs("div",{className:"lp-score-scale",children:[e.jsx("div",{className:"lp-score-scale-label",children:"MotorIA Risk Index™ · escala de classificação"}),e.jsx("div",{className:"lp-score-scale-bar",children:[{range:"0–30",label:"BAIXO",cls:"lp-seg-green"},{range:"31–60",label:"MODERADO",cls:"lp-seg-amber"},{range:"61–80",label:"ALTO",cls:"lp-seg-orange"},{range:"81–100",label:"CRÍTICO",cls:"lp-seg-red"}].map(a=>e.jsxs("div",{className:`lp-score-seg ${a.cls}`,children:[e.jsx("span",{className:"lp-score-seg-range",children:a.range}),e.jsx("span",{className:"lp-score-seg-label",children:a.label})]},a.label))})]}),e.jsxs("div",{className:"lp-recent",children:[e.jsxs("div",{className:"lp-recent-hdr",children:[e.jsx("span",{className:"lp-recent-title",children:"ANÁLISES RECENTES"}),e.jsx("span",{className:"lp-recent-live",children:"● AO VIVO"})]}),e.jsx("div",{className:"lp-recent-list",children:y.map(a=>e.jsxs("div",{className:"lp-recent-row",children:[e.jsxs("span",{className:"lp-recent-id",children:["#",a.id]}),e.jsx("span",{className:"lp-recent-event",children:a.event}),e.jsxs("span",{className:"lp-recent-odd",children:["Odd ",a.odd]}),e.jsx("div",{className:"lp-recent-bar",children:e.jsx("div",{style:{width:`${a.score}%`,background:a.tc,height:"100%",borderRadius:99}})}),e.jsx("span",{className:"lp-recent-num",style:{color:a.tc},children:a.score}),e.jsx("span",{className:"lp-recent-tag",style:{color:a.tc,borderColor:`${a.tc}44`},children:a.tag}),e.jsx("span",{className:"lp-recent-ago",children:a.ago})]},a.id))})]})]})}),e.jsx("section",{className:"lp-section",id:"como-funciona-steps",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Como funciona"}),e.jsxs("h2",{className:"lp-h2 lp-h2-narrow",children:["3 etapas.",e.jsx("br",{}),"Menos de um minuto."]}),e.jsx("div",{className:"lp-steps",children:k.map(a=>e.jsxs("div",{className:"lp-step",children:[e.jsx("div",{className:"lp-step-n",children:a.n}),e.jsx("h3",{className:"lp-step-title",children:a.title}),e.jsx("p",{className:"lp-step-desc",children:a.desc}),e.jsx("div",{className:"lp-step-tags",children:a.tags.map(o=>e.jsx("span",{className:"lp-step-tag",children:o},o))})]},a.n))}),e.jsx("div",{style:{textAlign:"center"},children:e.jsxs(i,{to:"/pagar",className:"lp-btn-hero",children:["Entender o risco antes de decidir",e.jsx("svg",{width:"13",height:"13",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})]})})]})}),e.jsx("section",{className:"lp-founder",children:e.jsx("div",{className:"lp-container",children:e.jsxs("div",{className:"lp-founder-layout",children:[e.jsxs("div",{className:"lp-founder-photo-wrap",children:[e.jsxs("picture",{children:[e.jsx("source",{type:"image/avif",srcSet:"/jean-analise-960.avif"}),e.jsx("source",{type:"image/webp",srcSet:"/jean-analise-960.webp"}),e.jsx("img",{src:"/jean-analise.png",alt:"Jean Lucca — criador do MotorIA Pro",className:"lp-founder-img",loading:"lazy",decoding:"async",height:"auto"})]}),e.jsxs("div",{className:"lp-founder-caption",children:[e.jsx("span",{className:"lp-founder-caption-name",children:"Jean Lucca"}),e.jsx("span",{className:"lp-founder-caption-role",children:"Criador do MotorIA Pro"})]})]}),e.jsxs("div",{className:"lp-founder-text",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Por que isso foi criado"}),e.jsxs("div",{className:"lp-founder-copy",children:[e.jsx("p",{className:"lp-founder-p",children:"As plataformas mostram retorno."}),e.jsx("p",{className:"lp-founder-p",children:"Mas quase ninguém explica o risco matemático por trás das odds."}),e.jsx("p",{className:"lp-founder-p",children:"Foi exatamente por isso que comecei a desenvolver o MotorIA Pro."}),e.jsx("p",{className:"lp-founder-p",children:"A proposta nunca foi prometer lucro."}),e.jsx("p",{className:"lp-founder-p",children:"Muito menos incentivar apostas."}),e.jsx("p",{className:"lp-founder-p lp-founder-p-lead",children:"A ideia é simples:"}),e.jsxs("p",{className:"lp-founder-punchline",children:["Entender o risco",e.jsx("br",{}),"antes da decisão."]})]})]})]})})}),e.jsx("section",{className:"lp-position lp-section-dark",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Nossa posição"}),e.jsxs("div",{className:"lp-position-layout",children:[e.jsxs("div",{className:"lp-position-left",children:[e.jsxs("h2",{className:"lp-h2",children:["Não prometemos lucro.",e.jsx("br",{}),e.jsx("span",{className:"lp-h2-dim",children:"Nunca prometemos."})]}),e.jsx("div",{className:"lp-position-points",children:[{title:"Não somos casa de aposta",desc:"Ferramenta educativa independente. Sem relação com plataformas ou odds."},{title:"Não vendemos previsões",desc:"Não existe como prever resultados. Mostramos probabilidade e risco matemático."},{title:"Não incentivamos apostas",desc:"Nosso objetivo é deixar a decisão mais consciente — não mais frequente."}].map((a,o)=>e.jsxs("div",{className:"lp-position-pt",children:[e.jsx("span",{className:"lp-position-pt-icon","aria-hidden":"true",children:"○"}),e.jsxs("div",{children:[e.jsx("div",{className:"lp-position-pt-title",children:a.title}),e.jsx("div",{className:"lp-position-pt-desc",children:a.desc})]})]},o))})]}),e.jsx("div",{className:"lp-position-right",children:e.jsxs("blockquote",{className:"lp-position-quote",children:[e.jsxs("p",{className:"lp-position-quote-text",children:['"O problema nunca foi a odd.',e.jsx("br",{}),'Foi não entender o risco por trás dela."']}),e.jsxs("footer",{className:"lp-position-author",children:[e.jsx("strong",{children:"Jean Lucca"}),e.jsx("span",{children:"Criador do MotorIA Pro"})]})]})})]})]})}),e.jsx("section",{className:"lp-section",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Usuários"}),e.jsx("h2",{className:"lp-h2 lp-h2-narrow",children:"Decisões mais conscientes."}),e.jsxs("div",{className:"lp-test-featured",children:[e.jsxs("div",{className:"lp-test-featured-quote",children:['"',t[4].text,'"']}),e.jsxs("div",{className:"lp-test-featured-author",children:[e.jsx(m,{name:t[4].name,index:4}),e.jsxs("div",{children:[e.jsxs("div",{className:"lp-test-featured-name",children:[t[4].name,", ",t[4].age," anos"]}),e.jsx("div",{className:"lp-test-featured-city",children:t[4].city})]})]})]}),e.jsx("div",{className:"lp-testimonials",children:t.filter((a,o)=>o!==4).map((a,o)=>e.jsxs("div",{className:"lp-testimonial",children:[e.jsx("div",{className:"lp-test-stars",children:"★★★★★"}),e.jsxs("p",{className:"lp-test-text",children:['"',a.text,'"']}),e.jsxs("div",{className:"lp-test-author",children:[e.jsx(m,{name:a.name,index:o}),e.jsxs("div",{children:[e.jsxs("div",{className:"lp-test-name-row",children:[e.jsx("strong",{children:a.name}),", ",a.age," anos",e.jsx("span",{className:"lp-test-verified",children:"✓ verificado"})]}),e.jsx("span",{className:"lp-test-city",children:a.city})]})]})]},o))})]})}),e.jsx("section",{className:"lp-section lp-section-dark",id:"preco",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Acesso completo"}),e.jsx("h2",{className:"lp-h2 lp-h2-narrow",children:"Menos do que uma aposta perdida."}),e.jsx("p",{className:"lp-pricing-sub",children:"Uma análise que custa R$27 pode te fazer entender por que você perde muito mais do que isso toda semana."}),e.jsxs("div",{className:"lp-pricing",children:[e.jsx("ul",{className:"lp-features-list",children:N.map((a,o)=>e.jsxs("li",{className:"lp-feature-item",children:[e.jsx("span",{className:"lp-feature-check",children:"✓"}),e.jsx("span",{children:a})]},o))}),e.jsxs("div",{className:"lp-price-card",children:[e.jsx("div",{className:"lp-price-eyebrow",children:"Acesso ao sistema"}),e.jsxs("div",{className:"lp-price-display",children:[e.jsx("span",{className:"lp-price-curr",children:"R$"}),e.jsx("span",{className:"lp-price-int",children:"27"})]}),e.jsx("p",{className:"lp-price-note",children:"Acesso completo à plataforma. Ativação imediata após o pagamento."}),e.jsx(i,{to:"/pagar",className:"lp-btn-buy",children:"Garantir acesso imediato →"}),e.jsxs("div",{className:"lp-guarantee",children:[e.jsx("div",{className:"lp-guarantee-icon",children:"✓"}),e.jsxs("div",{children:[e.jsx("div",{className:"lp-guarantee-title",children:"Garantia de 7 dias"}),e.jsx("div",{className:"lp-guarantee-sub",children:"Não achou útil? Devolvemos 100% sem perguntas."})]})]})]})]})]})}),e.jsx("section",{className:"lp-section",children:e.jsxs("div",{className:"lp-container",style:{maxWidth:680},children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Dúvidas"}),e.jsx("h2",{className:"lp-h2 lp-h2-narrow",children:"Perguntas frequentes."}),e.jsx("div",{className:"lp-faq",children:w.map((a,o)=>e.jsx(z,{q:a.q,a:a.a},o))})]})}),e.jsxs("section",{className:"lp-cta-final",children:[e.jsx("div",{className:"lp-cta-grid","aria-hidden":"true"}),e.jsxs("div",{className:"lp-container lp-cta-inner",children:[e.jsxs("div",{className:"lp-tag-pill",style:{marginBottom:28},children:[e.jsx("span",{className:"lp-tag-dot","aria-hidden":"true"}),"Ferramenta educativa · +18"]}),e.jsxs("h2",{className:"lp-cta-h2",children:["Análise matemática",e.jsx("br",{}),e.jsx("span",{className:"lp-cta-dim",children:"antes de decidir."})]}),e.jsx("p",{className:"lp-cta-sub",children:"Acesso imediato ao MotorIA Risk Engine™ por R$27."}),e.jsx(i,{to:"/pagar",className:"lp-btn-buy lp-btn-buy-lg",children:"Garantir acesso por R$27 →"}),e.jsxs("div",{className:"lp-cta-trust",children:[e.jsx("span",{children:"Sem cadastro"}),e.jsx("span",{className:"lp-meta-sep",children:"·"}),e.jsx("span",{children:"Garantia de 7 dias"}),e.jsx("span",{className:"lp-meta-sep",children:"·"}),e.jsx("span",{children:"Não é casa de aposta"})]}),e.jsx("p",{className:"lp-cta-disclaimer",children:"Ferramenta educativa. Não garante resultados. Não incentiva apostas. Uso recomendado apenas para maiores de 18 anos."})]})]}),e.jsx(f,{})]})}const q=`
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
.lp-c-red   { color: var(--red);   }
.lp-c-amber { color: var(--amber); }

/* tabular nums on all data */
.lp-mock-odd, .lp-mock-metric-val, .lp-mock-score-num, .lp-mock-score-denom,
.lp-dash-card-num, .lp-price-int {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

/* ── Layout ─────────────────────────────────────────────────────────────────── */
.lp-container  { max-width: 1080px; margin: 0 auto; padding: 0 28px; }
.lp-section    { padding: 104px 0; }
.lp-section-dark { background: var(--bg2); }

.lp-section-eyebrow {
  font-size: 10px; font-weight: 700;
  letter-spacing: .18em; text-transform: uppercase;
  color: var(--green); margin-bottom: 16px;
}
.lp-h2 {
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 900; color: var(--t1);
  line-height: 1.1; letter-spacing: -0.035em; margin-bottom: 16px;
}
.lp-h2-narrow { max-width: 480px; margin-bottom: 48px; }
.lp-h2-dim    { color: rgba(232,232,230,.25); }

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
.lp-logo-sep  { color: var(--t3); font-size: 13px; }
.lp-logo-tag  { font-size: 12px; color: var(--t3); font-weight: 500; }
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

/* ── Hero insight (tension line) ────────────────────────────────────────────── */
.lp-hero-insight {
  font-size: 15px;
  color: var(--t2);
  line-height: 1.75;
  letter-spacing: -0.01em;
  padding-left: 13px;
  border-left: 2px solid rgba(34,197,94,.32);
  margin-bottom: 28px;
}

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

.lp-tag-pill {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 9px; font-weight: 700; letter-spacing: .17em; text-transform: uppercase;
  color: rgba(34,197,94,.7); border: 1px solid rgba(34,197,94,.15);
  background: rgba(34,197,94,.04); padding: 5px 12px; border-radius: 99px;
  margin-bottom: 28px; align-self: flex-start;
}
.lp-tag-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--green);
  animation: lp-blink 2.4s ease-in-out infinite; flex-shrink: 0;
}

.lp-h1 {
  font-size: clamp(36px, 5.2vw, 68px);
  font-weight: 900; color: var(--t1);
  line-height: 1.04; letter-spacing: -0.04em; margin-bottom: 20px;
}
.lp-hero-sub {
  font-size: 16px; color: var(--t2); line-height: 1.7;
  max-width: 420px; margin-bottom: 28px;
}
.lp-hero-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 36px; }
.lp-hero-pill {
  font-size: 11px; color: var(--t3); font-weight: 500;
  border: 1px solid var(--border); border-radius: 4px;
  padding: 4px 10px; background: rgba(255,255,255,.02);
}
.lp-hero-actions {
  display: flex; align-items: center; gap: 14px;
  margin-bottom: 24px; flex-wrap: wrap;
}
.lp-btn-hero {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--t1); color: #070709;
  font-size: 13px; font-weight: 700;
  padding: 12px 20px; border-radius: 8px;
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
.lp-mock-odd { font-size: 24px; font-weight: 900; letter-spacing: -0.03em; }
.lp-mock-rule { height: 1px; background: rgba(255,255,255,.06); margin: 10px 0; }
.lp-mock-metrics { display: flex; flex-direction: column; }
.lp-mock-metric-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,.04);
}
.lp-mock-metric-row:last-child { border-bottom: none; }
.lp-mock-metric-lbl { font-size: 12px; color: var(--t3); }
.lp-mock-metric-val { font-size: 13px; font-weight: 800; letter-spacing: -0.01em; }
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
  color: var(--red); background: rgba(239,68,68,.1);
  border: 1px solid rgba(239,68,68,.25); padding: 3px 9px; border-radius: 4px;
}
.lp-mock-score-row { display: flex; align-items: center; gap: 14px; }
.lp-mock-score-num {
  font-size: 52px; font-weight: 900; color: var(--red);
  line-height: 1; letter-spacing: -0.04em; flex-shrink: 0;
}
.lp-mock-bar-wrap { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.lp-mock-bar-track {
  position: relative; height: 5px;
  background: rgba(255,255,255,.07); border-radius: 99px; overflow: visible;
}
.lp-mock-bar-fill {
  height: 100%; width: 67%; border-radius: 99px;
  background: linear-gradient(90deg, var(--amber) 0%, var(--red) 100%);
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
/* session header (analysis ID + timestamp) */
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
  font-variant-numeric: tabular-nums; font-feature-settings: 'tnum';
}

/* 2-column data grid */
.lp-mock-data-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 1px; background: rgba(255,255,255,.06);
  border-radius: 6px; overflow: hidden;
}
.lp-mock-dc {
  display: flex; flex-direction: column; gap: 3px;
  padding: 9px 10px; background: #0B0B0E;
}
.lp-mock-dk {
  font-size: 8px; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: var(--t3);
}
.lp-mock-dv {
  font-size: 14px; font-weight: 800; letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums; font-feature-settings: 'tnum';
}
.lp-mock-dv-g { color: #22C55E; }
.lp-mock-dv-a { color: #F59E0B; }
.lp-mock-dv-r { color: #EF4444; }
.lp-mock-dv-d { color: rgba(232,232,230,.45); }

/* version badge in topbar */
.lp-mock-version {
  font-size: 9px; font-weight: 700; letter-spacing: .08em;
  color: var(--t3); background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08); padding: 2px 6px; border-radius: 4px;
}

/* probability split bar */
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

/* score left — num + denom */
.lp-mock-score-left {
  display: flex; align-items: flex-end; gap: 2px; flex-shrink: 0;
}
.lp-mock-score-denom {
  font-size: 16px; font-weight: 700; color: var(--t3);
  line-height: 1; margin-bottom: 10px; letter-spacing: -0.02em;
}

/* verdict row */
.lp-mock-verdict {
  display: flex; align-items: center; gap: 8px;
  margin-top: 10px; padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,.05);
}
.lp-mock-verdict-badge {
  font-size: 8px; font-weight: 800; letter-spacing: .12em;
  color: var(--red); background: rgba(239,68,68,.08);
  border: 1px solid rgba(239,68,68,.22); padding: 3px 8px; border-radius: 4px;
}
.lp-mock-verdict-detail {
  font-size: 10px; color: var(--t3);
}

/* market subtext in input cell */
.lp-mock-cell-sub {
  font-size: 9px; color: var(--t3); margin-top: 1px; letter-spacing: .01em;
}

/* IC 95% confidence interval */
.lp-mock-score-ci {
  font-size: 9px; color: rgba(255,255,255,.22); letter-spacing: .06em;
  margin-top: 5px; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum';
}

.lp-mock-footer {
  padding: 8px 16px; font-size: 10px; color: var(--t3); text-align: center;
  background: rgba(255,255,255,.015); border-top: 1px solid rgba(255,255,255,.05);
}

/* ── Expose ─────────────────────────────────────────────────────────────────── */
.lp-expose { background: var(--bg2); padding: 104px 0; }
.lp-expose-sub {
  font-size: 15px; color: var(--t2); line-height: 1.7;
  max-width: 480px; margin-bottom: 48px;
}
.lp-expose-grid {
  display: grid; grid-template-columns: 1fr 56px 1fr;
  border: 1px solid var(--border); border-radius: 14px; overflow: hidden;
  margin-bottom: 28px;
}
.lp-expose-col { padding: 28px 24px; display: flex; flex-direction: column; }
.lp-expose-col-show { background: rgba(34,197,94,.02); }
.lp-expose-col-hide { background: rgba(239,68,68,.02); }
.lp-expose-col-hdr {
  display: flex; align-items: center; gap: 9px;
  padding-bottom: 14px; border-bottom: 1px solid var(--border); margin-bottom: 14px;
}
.lp-expose-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.lp-expose-dot-green { background: var(--green); box-shadow: 0 0 7px rgba(34,197,94,.5); }
.lp-expose-dot-red   { background: var(--red);   box-shadow: 0 0 7px rgba(239,68,68,.5); }
.lp-expose-col-title { font-size: 12px; font-weight: 700; color: var(--t1); }
.lp-expose-row {
  display: flex; align-items: baseline; gap: 10px;
  padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.04);
}
.lp-expose-row:last-child { border-bottom: none; }
.lp-expose-icon { font-size: 12px; font-weight: 700; flex-shrink: 0; }
.lp-expose-row-text { font-size: 13px; color: var(--t2); line-height: 1.5; }
.lp-expose-vs-col {
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.02);
  border-left: 1px solid var(--border); border-right: 1px solid var(--border);
}
.lp-expose-vs {
  font-size: 9px; font-weight: 800; letter-spacing: .1em;
  color: var(--t3); writing-mode: vertical-rl; text-transform: uppercase;
}
.lp-expose-callout {
  background: rgba(255,255,255,.025); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 20px;
  font-size: 14px; color: var(--t2); line-height: 1.6;
}
.lp-expose-callout-strong { color: var(--t1); font-weight: 700; }

/* ── Dashboard ──────────────────────────────────────────────────────────────── */
.lp-dash { padding: 104px 0; }
.lp-dash-grid {
  display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 24px;
}
.lp-dash-card {
  background: rgba(255,255,255,.02); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px 16px;
  display: flex; flex-direction: column; gap: 8px; transition: border-color .18s;
}
.lp-dash-card:hover { border-color: var(--bmd); }
.lp-dash-card-num {
  font-size: clamp(22px, 3vw, 30px); font-weight: 900; line-height: 1; letter-spacing: -0.04em;
}
.lp-dash-card-label {
  font-size: 10px; font-weight: 700; color: var(--t3);
  letter-spacing: .06em; text-transform: uppercase; line-height: 1.3;
}
.lp-dash-mini-bar {
  height: 3px; background: rgba(255,255,255,.06);
  border-radius: 99px; overflow: hidden;
}
.lp-dash-mini-fill {
  height: 100%; border-radius: 99px; opacity: 0.7;
  transition: width .3s ease;
}
.lp-dash-card-desc { font-size: 12px; color: var(--t3); line-height: 1.65; }
.lp-score-scale {
  border: 1px solid var(--border); border-radius: 12px; padding: 18px 22px;
}
.lp-score-scale-label {
  font-size: 10px; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: var(--t3); margin-bottom: 12px;
}
.lp-score-scale-bar {
  display: grid; grid-template-columns: repeat(4,1fr);
  height: 38px; border-radius: 8px; overflow: hidden;
}
.lp-score-seg {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 2px;
}
.lp-score-seg-range { font-size: 8px; font-weight: 600; opacity: .5; }
.lp-score-seg-label { font-size: 9px; font-weight: 800; letter-spacing: .05em; }
.lp-seg-green  { background: rgba(34,197,94,.1);  color: var(--green); }
.lp-seg-amber  { background: rgba(245,158,11,.09); color: var(--amber); }
.lp-seg-orange { background: rgba(249,115,22,.09); color: var(--orange); }
.lp-seg-red    { background: rgba(239,68,68,.09);  color: var(--red); }

/* ── Recent analyses feed ───────────────────────────────────────────────────── */
.lp-recent {
  border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
  margin-top: 20px;
}
.lp-recent-hdr {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px;
  background: rgba(255,255,255,.018);
  border-bottom: 1px solid var(--border);
}
.lp-recent-title {
  font-size: 9px; font-weight: 800; letter-spacing: .18em;
  text-transform: uppercase; color: var(--t3);
}
.lp-recent-live {
  font-size: 9px; font-weight: 700; color: var(--green);
  animation: lp-blink 2s ease-in-out infinite;
}
.lp-recent-list { display: flex; flex-direction: column; }
.lp-recent-row {
  display: grid;
  grid-template-columns: 52px 1fr 60px 70px 28px 62px 38px;
  align-items: center; gap: 10px;
  padding: 9px 16px;
  border-bottom: 1px solid rgba(255,255,255,.04);
  transition: background .12s;
}
.lp-recent-row:last-child { border-bottom: none; }
.lp-recent-row:hover { background: rgba(255,255,255,.015); }
.lp-recent-id   { font-family: monospace; font-size: 10px; color: var(--t3); }
.lp-recent-event { font-size: 11px; color: var(--t2); font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lp-recent-odd  { font-size: 10px; color: var(--t3); white-space: nowrap;
  font-variant-numeric: tabular-nums; }
.lp-recent-bar  { height: 3px; background: rgba(255,255,255,.06); border-radius: 99px; overflow: hidden; }
.lp-recent-num  { font-size: 12px; font-weight: 800; text-align: right;
  font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }
.lp-recent-tag  {
  font-size: 8px; font-weight: 800; letter-spacing: .07em;
  padding: 2px 6px; border-radius: 3px;
  border: 1px solid; text-align: center; white-space: nowrap;
  background: transparent;
}
.lp-recent-ago {
  font-size: 9px; color: var(--t3); text-align: right; white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* ── Steps ──────────────────────────────────────────────────────────────────── */
.lp-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 48px; }
.lp-step {
  background: rgba(255,255,255,.02); border: 1px solid var(--border);
  border-radius: 12px; padding: 24px 20px;
  display: flex; flex-direction: column; gap: 10px; transition: border-color .18s;
}
.lp-step:hover { border-color: rgba(34,197,94,.2); }
.lp-step-n { font-size: 11px; font-weight: 900; color: rgba(34,197,94,.4); letter-spacing: .06em; font-family: 'Courier New', Courier, monospace; }
.lp-step-title { font-size: 15px; font-weight: 800; color: var(--t1); line-height: 1.3; letter-spacing: -0.02em; }
.lp-step-desc { font-size: 13px; color: var(--t2); line-height: 1.7; }
.lp-step-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px; }
.lp-step-tag {
  font-size: 10px; font-weight: 600; color: var(--t3);
  border: 1px solid rgba(255,255,255,.06); border-radius: 4px;
  padding: 3px 8px; background: rgba(255,255,255,.02);
}

/* ── Positioning ────────────────────────────────────────────────────────────── */
.lp-position { padding: 104px 0; }
.lp-position-layout {
  display: grid; grid-template-columns: 1fr 360px; gap: 64px; align-items: start;
}
.lp-position-points { display: flex; flex-direction: column; gap: 20px; margin-top: 32px; }
.lp-position-pt { display: flex; gap: 14px; align-items: flex-start; }
.lp-position-pt-icon { font-size: 16px; color: rgba(34,197,94,.35); flex-shrink: 0; margin-top: 2px; }
.lp-position-pt-title { font-size: 14px; font-weight: 700; color: var(--t1); margin-bottom: 4px; }
.lp-position-pt-desc  { font-size: 13px; color: var(--t2); line-height: 1.65; }
.lp-position-quote {
  background: rgba(255,255,255,.025); border: 1px solid var(--border);
  border-left: 3px solid rgba(34,197,94,.3);
  border-radius: 0 12px 12px 0;
  padding: 28px 26px 24px; margin: 0;
  display: flex; flex-direction: column; gap: 20px;
}
.lp-position-quote-text {
  font-size: clamp(15px, 2.2vw, 19px); font-style: italic;
  color: var(--t1); line-height: 1.65; letter-spacing: -0.01em; margin: 0;
}
.lp-position-author { display: flex; flex-direction: column; gap: 3px; }
.lp-position-author strong { font-size: 13px; color: var(--t1); display: block; }
.lp-position-author span   { font-size: 11px; color: var(--t3); }

/* ── Testimonials ───────────────────────────────────────────────────────────── */
.lp-test-featured {
  background: rgba(255,255,255,.02); border: 1px solid var(--bmd);
  border-radius: 12px; padding: 28px 32px; margin-bottom: 14px;
}
.lp-test-featured-quote {
  font-size: clamp(15px, 2.2vw, 19px); font-weight: 500; font-style: italic;
  color: var(--t1); line-height: 1.65; margin-bottom: 20px; letter-spacing: -0.01em;
}
.lp-test-featured-author { display: flex; align-items: center; gap: 12px; }
.lp-test-featured-name { font-size: 13px; font-weight: 700; color: var(--t1); }
.lp-test-featured-city { font-size: 11px; color: var(--t3); }
.lp-testimonials {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap: 10px;
}
.lp-testimonial {
  background: rgba(255,255,255,.018); border: 1px solid var(--border);
  border-radius: 10px; padding: 20px;
  display: flex; flex-direction: column; gap: 12px; transition: border-color .18s;
}
.lp-testimonial:hover { border-color: var(--bmd); }
.lp-test-stars  { font-size: 11px; color: var(--amber); letter-spacing: 2px; }
.lp-test-text   { font-size: 13px; color: var(--t2); line-height: 1.7; font-style: italic; margin: 0; }
.lp-test-author { display: flex; align-items: center; gap: 10px; }
.lp-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; flex-shrink: 0;
}
.lp-test-name-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.lp-test-name-row strong { font-size: 12px; color: var(--t1); }
.lp-test-verified {
  font-size: 9px; font-weight: 700; color: var(--green);
  background: rgba(34,197,94,.07); border: 1px solid rgba(34,197,94,.18);
  padding: 1px 6px; border-radius: 99px;
}
.lp-test-city { font-size: 11px; color: var(--t3); }

/* ── Pricing ────────────────────────────────────────────────────────────────── */
.lp-pricing-sub {
  font-size: 15px; color: var(--t2); line-height: 1.75; max-width: 480px; margin-bottom: 48px;
}
.lp-pricing { display: grid; grid-template-columns: 1fr 300px; gap: 64px; align-items: start; }
.lp-features-list {
  list-style: none; display: flex; flex-direction: column; gap: 14px; padding: 0; margin: 0;
}
.lp-feature-item {
  display: flex; gap: 12px; font-size: 14px; color: var(--t2); align-items: baseline;
  padding: 5px 8px; border-radius: 7px; margin: 0 -8px; transition: background .15s;
}
.lp-feature-item:hover { background: rgba(255,255,255,.02); color: var(--t1); }
.lp-feature-check { color: var(--green); font-weight: 700; flex-shrink: 0; }
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
  background: var(--bg); padding: 112px 0;
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
.lp-cta-dim  { color: rgba(232,232,230,.25); }
.lp-cta-sub  { font-size: 14px; color: var(--t2); }
.lp-cta-trust {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  justify-content: center; font-size: 12px; color: var(--t3);
}
.lp-cta-disclaimer {
  font-size: 11px; color: var(--t3); line-height: 1.65;
  border-top: 1px solid var(--border); padding-top: 20px; max-width: 420px;
}

/* ── Founder ────────────────────────────────────────────────────────────────── */
.lp-founder { padding: 112px 0; background: var(--bg); }
.lp-founder-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 88px;
  align-items: center;
}

/* Photo */
.lp-founder-photo-wrap { display: flex; flex-direction: column; gap: 0; position: relative; }
.lp-founder-photo-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right, transparent 58%, var(--bg) 96%),
    linear-gradient(to bottom, transparent 72%, var(--bg) 100%);
  pointer-events: none;
  z-index: 1;
}
.lp-founder-img {
  width: 100%;
  height: auto;
  display: block;
  aspect-ratio: 3/4;
  object-fit: cover;
  object-position: top center;
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
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--border);
  position: relative;
  z-index: 2;
}
.lp-founder-caption-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--t1);
  letter-spacing: -0.01em;
}
.lp-founder-caption-role {
  font-size: 11px;
  color: var(--t3);
  letter-spacing: 0.02em;
}

/* Text */
.lp-founder-text {
  display: flex;
  flex-direction: column;
  gap: 36px;
}
.lp-founder-copy {
  display: flex;
  flex-direction: column;
}
.lp-founder-p {
  font-size: clamp(15px, 1.9vw, 19px);
  color: var(--t2);
  line-height: 1.75;
  letter-spacing: -0.01em;
  margin: 0;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255,255,255,.042);
}
.lp-founder-p:first-child { padding-top: 0; }
.lp-founder-p-lead {
  color: var(--t1) !important;
  font-weight: 500;
}
.lp-founder-punchline {
  font-size: clamp(26px, 3.8vw, 44px);
  font-weight: 900;
  color: var(--t1);
  line-height: 1.1;
  letter-spacing: -0.04em;
  margin: 0;
  padding-top: 28px;
}

/* ── Mobile ─────────────────────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .lp-hero-layout { grid-template-columns: 1fr; gap: 48px; padding-top: 60px; padding-bottom: 60px; }
  .lp-hero-left { align-items: center; text-align: center; }
  .lp-tag-pill { align-self: center; }
  .lp-hero-sub { max-width: none; }
  .lp-hero-pills { justify-content: center; }
  .lp-hero-actions { justify-content: center; }
  .lp-hero-meta { justify-content: center; }
  .lp-hero-right { max-width: 460px; width: 100%; margin: 0 auto; }
  .lp-dash-grid { grid-template-columns: repeat(2, 1fr); }
  .lp-founder-layout { grid-template-columns: 1fr; gap: 48px; }
  .lp-founder-photo-wrap { max-width: 280px; }
  .lp-position-layout { grid-template-columns: 1fr; gap: 40px; }
  .lp-pricing { grid-template-columns: 1fr; gap: 40px; }
  .lp-price-card { position: static; }
}
@media (max-width: 768px) {
  .lp-section, .lp-expose, .lp-dash, .lp-position, .lp-founder { padding: 72px 0; }
  .lp-container { padding: 0 20px; }
  .lp-nav { display: none; }
  .lp-hero { min-height: unset; }
  .lp-steps { grid-template-columns: 1fr; }
  .lp-expose-grid { grid-template-columns: 1fr; }
  .lp-expose-vs-col { display: none; }
  .lp-expose-col-show { border-bottom: 1px solid var(--border); }
  .lp-testimonials { grid-template-columns: 1fr; }
  .lp-cta-final { padding: 80px 0; }
}
@media (max-width: 480px) {
  .lp-h1 { font-size: clamp(30px, 9vw, 48px); }
  .lp-dash-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
  .lp-dash-card { padding: 14px 12px; }
  .lp-dash-card-num { font-size: 22px; }
  .lp-expose-col { padding: 20px 16px; }
  .lp-mock-input-row { grid-template-columns: 1fr; }
  .lp-hero-actions { flex-direction: column; align-items: stretch; }
  .lp-btn-hero { justify-content: center; }
  .lp-test-featured { padding: 20px 16px; }
  .lp-pricing-sub { margin-bottom: 28px; }
}
`,M=Object.freeze(Object.defineProperty({__proto__:null,default:A},Symbol.toStringTag,{value:"Module"}));export{f as F,R as G,F as H,i as L,S as R,h as a,b,M as c,C as u};
