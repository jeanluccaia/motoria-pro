import{r as t,j as e}from"./vendor-BnG4zNoI.js";const c=t.createContext({path:"/",navigate:()=>{}});function E({children:a}){const[r,o]=t.useState(window.location.pathname);t.useEffect(()=>{const s=()=>o(window.location.pathname);return window.addEventListener("popstate",s),()=>window.removeEventListener("popstate",s)},[]);function i(s){window.history.pushState({},"",s),o(s),window.scrollTo({top:0,behavior:"instant"})}return e.jsx(c.Provider,{value:{path:r,navigate:i},children:a})}function S(){return t.useContext(c)}function m(){return t.useContext(c).navigate}function n({to:a,children:r,className:o,style:i,onClick:s}){const l=m();function p(d){d.preventDefault(),s&&s(d),l(a)}return e.jsx("a",{href:a,onClick:p,className:o,style:i,children:r})}function C(){return e.jsxs("div",{className:"ly-legal",children:[e.jsx("span",{children:"⚠"}),e.jsxs("span",{children:["Ferramenta educativa de risco. Não é recomendação de aposta. Apostas envolvem risco financeiro real e podem causar prejuízo."," ",e.jsx("strong",{children:"Proibido para menores de 18 anos."})," ",e.jsx("a",{href:"https://www.jogoresponsavel.com.br",target:"_blank",rel:"noopener noreferrer",children:"jogoresponsavel.com.br"})]})]})}function R(){return e.jsxs("header",{className:"ly-header",children:[e.jsxs(n,{to:"/",className:"ly-logo",children:[e.jsx("span",{className:"ly-logo-main",children:"MotorIA Pro"}),e.jsx("span",{className:"ly-logo-tag",children:"· Análise de Risco"})]}),e.jsx(n,{to:"/analisar",className:"ly-cta-btn",children:"Analisar minha aposta"})]})}function F(){return e.jsx("footer",{className:"ly-footer",children:e.jsxs("div",{className:"ly-footer-inner",children:[e.jsx("p",{className:"ly-footer-legal",children:"⚠ Ferramenta educativa. Não é recomendação de aposta. Apostas envolvem risco financeiro real e podem causar prejuízo. Jogue com responsabilidade."}),e.jsxs("p",{className:"ly-footer-links",children:[e.jsx("a",{href:"https://www.jogoresponsavel.com.br",target:"_blank",rel:"noopener noreferrer",children:"jogoresponsavel.com.br"})," · ",e.jsx("a",{href:"tel:188",children:"CVV 188"})," · ","Proibido para menores de 18 anos."]}),e.jsx("p",{className:"ly-footer-copy",children:"© 2026 MotorIA Pro — Análise de Risco. Todos os direitos reservados."})]})})}const L=`
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
`,x=["A odd e quanto você pode ganhar","O lado bom da aposta","O que a casa quer que você veja"],g=["Quantos % de chance você tem de verdade","O quanto a casa já tirou antes de você ganhar","Se a odd realmente tem valor","Quanto custa essa aposta no longo prazo"],h=[{num:"64,3%",color:"#EF4444",label:"Chance de perder nessa aposta",bar:64.3,desc:"Chance de perder nessa aposta"},{num:"67",color:"#F97316",label:"Nota de risco",bar:67,desc:"Nota de risco (0 = tranquilo, 100 = armadilha)"},{num:"5,5%",color:"#F59E0B",label:"Margem da casa",bar:5.5,desc:"A fatia que a casa já tirou antes de você ganhar qualquer coisa"},{num:"−R$14",color:"#EF4444",label:"Perda média por R$100",bar:61,desc:"A cada R$100 apostado nessa odd, você perde R$14 no longo prazo"}],b=[{n:"01",title:"Cole sua odd",desc:"Informe a odd que você tá de olho e o tipo de aposta. 10 segundos."},{n:"02",title:"O MotorIA analisa",desc:"A ferramenta abre os números que a casa esconde — probabilidade real, margem e nota de risco."},{n:"03",title:"Você decide com informação",desc:"Se vale, você aposta com confiança. Se não vale, você economiza. Simples."}],u=[{before:'"Ia entrar em qualquer jogo com odd acima de 2.0"',after:'"Agora filtro pelo que o MotorIA aprova"',attribution:"— Rafael S., Rio de Janeiro"},{before:'"Ia dobrar a aposta pra recuperar"',after:'"Nota de risco estava em 78. Não dobrei."',attribution:"— Marcos V., Belo Horizonte"},{before:'"Vi que tinha 64% de chance de perder. Fechei."',after:'"Economizei R$200 só na primeira semana."',attribution:"— André M., São Paulo"}],f=[{name:"Rafael S.",city:"Rio de Janeiro",context:"Apostador de futebol há 2 anos",text:`Ia entrar pra recuperar o loss.
A análise mostrou risco alto.
Fechei o app.`},{name:"André M.",city:"São Paulo",context:"Apostador há 3 anos",text:`Achava que odd baixa era segura.
Agora olho diferente.`},{name:"Felipe T.",city:"Curitiba",context:"Apostador de fim de semana",text:`Não me prometeu green.
Só me fez pensar antes de clicar.`},{name:"Marcos V.",city:"Belo Horizonte",context:"Apostador recreativo",text:`Eu ia apostar no impulso.
A nota de risco me travou.`}],v=[{text:"20 análises completas (sem mensalidade)",sub:"→ Precisa de mais? Recarregue por R$9,90 a qualquer momento."},{text:"Nota de risco instantânea por aposta"},{text:"Probabilidade real em segundos"},{text:"Margem escondida da casa revelada"},{text:"Controle de Banca: ROI, saldo e sequência de perdas em tempo real"},{text:'Alerta de tilt — avisa antes de você entrar em modo "recuperação"',tilt:!0}],j=["Acompanhe saldo, lucro/prejuízo e ROI em tempo real","Veja quanto da sua banca está em risco por entrada","Identifique sequências de perdas antes de agir no impulso","Registre suas entradas e entenda seus padrões","Receba alertas quando a exposição estiver alta demais"],k=[{q:"Isso me ajuda a ganhar mais?",a:"Depende do que você faz com a informação. O MotorIA não garante lucro — ninguém garante isso de forma honesta. O que ele faz: mostra os números reais por trás de cada aposta. Se a odd tem valor, você vê. Se a casa tá te enganando, você vê também. Apostador que decide com informação toma decisão melhor."},{q:"Como funciona na prática?",a:"Você informa a odd que tá analisando e o tipo de aposta. Em menos de 10 segundos, o MotorIA retorna a probabilidade real, a margem da casa, a nota de risco (0 a 100) e uma análise completa. Tudo no celular, sem precisar baixar nada."},{q:"É palpite ou é análise?",a:"É análise matemática. Não damos palpite, não dizemos em quem apostar, não somos tipster. Mostramos o risco que a odd esconde — chance real de perder, margem da casa, impacto no longo prazo. Somos uma ferramenta educativa independente, sem relação com casas de aposta."},{q:"É assinatura ou pagamento único?",a:"Pagamento único. R$27, uma vez, sem cobrar de novo. Sem mensalidade, sem fidelidade, sem surpresa na fatura."},{q:"Funciona no celular?",a:"Sim. A ferramenta foi feita para o celular — pra usar antes de qualquer decisão, de onde você estiver. Sem baixar app."},{q:"E se eu não gostar?",a:"Garantia de 7 dias sem perguntas. Se não achar útil por qualquer motivo, devolvemos 100% do valor. Basta entrar em contato."}];function N({q:a,a:r}){const[o,i]=t.useState(!1);return e.jsxs("div",{className:`lp-faq-item${o?" lp-faq-open":""}`,onClick:()=>i(!o),children:[e.jsxs("div",{className:"lp-faq-q",children:[e.jsx("span",{children:a}),e.jsx("span",{className:"lp-faq-icon",children:o?"−":"+"})]}),o&&e.jsx("p",{className:"lp-faq-a",children:r})]})}function y(){const[a,r]=t.useState(!1),o=t.useRef(null);t.useEffect(()=>{const s=o.current;if(!s)return;const l=new IntersectionObserver(([p])=>{p.isIntersecting&&(r(!0),l.disconnect())},{threshold:.3});return l.observe(s),()=>l.disconnect()},[]);const i=[{label:"Saldo Atual",val:"R$ 1.247,00",sub:"+R$ 247 desde o início",color:"#22c55e",type:"money"},{label:"Lucro / Prejuízo",val:"+R$ 247,00",sub:"+24,7% sobre a banca inicial",color:"#22c55e",type:"money"},{label:"ROI",val:"+12,4%",sub:"Últimas 30 entradas",color:"#22c55e",type:"roi"},{label:"% da Banca em Risco",val:"3,2%",sub:"Dentro do limite seguro",color:"#22c55e",type:"bar"},{label:"Sequência de Perdas",val:"1",sub:"Sem alerta ativo",color:"#22c55e",type:"streak"},{label:"Total de Entradas",val:"30",sub:"Entradas registradas",color:"#e8e8e6",type:"count"}];return e.jsx("section",{className:"lp-section lp-banca-section",id:"controle-banca",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Controle de Banca"}),e.jsxs("h2",{className:"lp-h2 lp-h2-narrow",children:["Risco também é",e.jsx("br",{}),"tamanho de entrada."]}),e.jsx("p",{className:"lp-banca-sub",children:"Uma análise boa não salva uma banca mal gerida. Mesmo uma entrada com boa leitura pode virar problema quando o valor exposto é alto demais."}),e.jsx("div",{className:"lp-bk-grid",ref:o,children:i.map((s,l)=>e.jsxs("div",{className:"lp-bk-card",children:[e.jsx("div",{className:"lp-bk-label",children:s.label}),e.jsx("div",{className:"lp-bk-val",style:{color:s.color},children:s.val}),s.type==="bar"?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"lp-bk-pct-bar",children:[e.jsx("div",{className:"lp-bk-pct-zone lp-bk-zone-g"}),e.jsx("div",{className:"lp-bk-pct-zone lp-bk-zone-y"}),e.jsx("div",{className:"lp-bk-pct-zone lp-bk-zone-r"}),e.jsx("div",{className:"lp-bk-pct-thumb",style:{left:`${a?3.2:0}%`,transition:a?"left 1.1s cubic-bezier(.4,0,.2,1)":"none"}})]}),e.jsxs("div",{className:"lp-bk-bar-labels",children:[e.jsx("span",{children:"0%"}),e.jsx("span",{children:"5%"}),e.jsx("span",{children:"10%"}),e.jsx("span",{children:"+"})]}),e.jsx("div",{className:"lp-bk-sub",children:s.sub})]}):e.jsx("div",{className:"lp-bk-sub",children:s.sub})]},l))}),e.jsxs("div",{className:"lp-bk-alert",children:[e.jsx("div",{className:"lp-bk-alert-icon","aria-hidden":"true",children:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",children:[e.jsx("path",{d:"M12 2L2 22h20L12 2z",stroke:"#f59e0b",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round"}),e.jsx("path",{d:"M12 9v5M12 17.5v.5",stroke:"#f59e0b",strokeWidth:"1.8",strokeLinecap:"round"})]})}),e.jsxs("p",{className:"lp-bk-alert-text",children:[e.jsx("strong",{children:"Atenção à exposição:"})," Você está na 3ª entrada consecutiva com exposição acima de 5%. Considere reduzir o tamanho da próxima entrada."]})]}),e.jsx("ul",{className:"lp-bk-features",children:j.map((s,l)=>e.jsxs("li",{className:"lp-bk-feature-row",children:[e.jsx("span",{className:"lp-bk-check","aria-hidden":"true",children:"✓"}),e.jsx("span",{children:s})]},l))})]})})}function w(){return e.jsx("div",{className:"lp-stars","aria-label":"5 estrelas",children:[1,2,3,4,5].map(a=>e.jsx("svg",{width:"12",height:"12",viewBox:"0 0 12 12",fill:"#F59E0B","aria-hidden":"true",children:e.jsx("path",{d:"M6 1l1.3 2.7L10 4.1 8 6l.5 2.9L6 7.5 3.5 8.9 4 6 2 4.1l2.7-.4L6 1z"})},a))})}function z(){return t.useEffect(()=>{const a=document.getElementById("sticky-cta"),r=document.querySelector(".lp-hero"),o=document.querySelector("#preco");if(!a)return;function i(){const s=r?r.getBoundingClientRect().bottom:400,l=o?o.getBoundingClientRect().top:99999;s<0&&l>window.innerHeight?a.style.display="block":a.style.display="none"}return window.addEventListener("scroll",i,{passive:!0}),()=>window.removeEventListener("scroll",i)},[]),e.jsxs(e.Fragment,{children:[e.jsx("style",{children:A}),e.jsxs("div",{className:"lp-trust-topbar",children:[e.jsx("span",{children:"✓ Pagamento único"}),e.jsx("span",{className:"lp-trust-sep","aria-hidden":"true",children:"·"}),e.jsx("span",{children:"✓ Garantia de 7 dias"}),e.jsx("span",{className:"lp-trust-sep","aria-hidden":"true",children:"·"}),e.jsx("span",{children:"✓ Funciona no celular"})]}),e.jsx("header",{className:"lp-header",children:e.jsxs("div",{className:"lp-header-inner",children:[e.jsxs("div",{className:"lp-logo",children:[e.jsx("div",{className:"lp-logo-mark",children:e.jsxs("svg",{width:"13",height:"13",viewBox:"0 0 14 14",fill:"none",children:[e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"#050505"}),e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"currentColor",fillOpacity:".9"})]})}),e.jsx("span",{className:"lp-logo-name",children:"MotorIA Pro"})]}),e.jsxs("nav",{className:"lp-nav",children:[e.jsx("a",{href:"#problema",className:"lp-nav-link",children:"O problema"}),e.jsx("a",{href:"#como-funciona",className:"lp-nav-link",children:"Como funciona"}),e.jsx("a",{href:"#preco",className:"lp-nav-link",children:"Preço"})]}),e.jsx(n,{to:"/app",className:"lp-nav-cta",children:"Ver análise grátis →"})]})}),e.jsxs("section",{className:"lp-hero",children:[e.jsx("div",{className:"lp-hero-grid","aria-hidden":"true"}),e.jsxs("div",{className:"lp-container lp-hero-layout",children:[e.jsxs("div",{className:"lp-hero-left",children:[e.jsxs("h1",{className:"lp-h1",children:["O problema não é",e.jsx("br",{}),"só a odd."]}),e.jsx("p",{className:"lp-hero-sub",children:"É quanto da sua banca você expõe nela."}),e.jsx("p",{className:"lp-hero-desc",children:"Analise o risco da entrada, controle sua banca e entenda quando uma aposta aparentemente boa pode comprometer seu saldo."}),e.jsxs("div",{className:"lp-hero-actions",children:[e.jsxs(n,{to:"/app",className:"lp-btn-hero",children:["Ver análise agora",e.jsx("svg",{width:"13",height:"13",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})]}),e.jsx("a",{href:"#controle-banca",className:"lp-btn-ghost",children:"Entender como funciona ↓"})]}),e.jsxs("div",{className:"lp-hero-trust-row",children:["Garantia de 7 dias",e.jsx("span",{className:"lp-meta-sep",children:"·"}),"Sem mensalidade",e.jsx("span",{className:"lp-meta-sep",children:"·"}),"Resultado em segundos"]}),e.jsxs("div",{className:"lp-hero-mock-card",children:[e.jsxs("div",{className:"lp-hmc-status",children:[e.jsx("span",{className:"lp-hmc-icon",children:"✅"}),e.jsx("span",{className:"lp-hmc-label",children:"VALE APOSTAR"})]}),e.jsx("p",{className:"lp-hmc-frase",children:'"Os números favorecem essa entrada."'}),e.jsx("div",{className:"lp-hmc-divider"}),e.jsxs("div",{className:"lp-hmc-details",children:[e.jsx("span",{className:"lp-hmc-row",children:"Chance de ganhar: 58%"}),e.jsx("span",{className:"lp-hmc-row",children:"Odd ideal: 1.72 · +22% de vantagem"})]})]})]}),e.jsx("div",{className:"lp-hero-right",children:e.jsxs("div",{className:"lp-mock",children:[e.jsxs("div",{className:"lp-mock-topbar",children:[e.jsxs("div",{className:"lp-mock-traffic",children:[e.jsx("span",{className:"lp-mock-dot-r"}),e.jsx("span",{className:"lp-mock-dot-y"}),e.jsx("span",{className:"lp-mock-dot-g"})]}),e.jsx("span",{className:"lp-mock-title",children:"MotorIA · Análise de risco"}),e.jsx("span",{className:"lp-mock-live",children:"LIVE"})]}),e.jsxs("div",{className:"lp-mock-body",children:[e.jsxs("div",{className:"lp-mock-session",children:[e.jsx("span",{className:"lp-mock-session-id",children:"ANÁLISE #2847"}),e.jsx("span",{className:"lp-mock-session-ts",children:"hoje · 14:23"})]}),e.jsxs("div",{className:"lp-mock-input-row",children:[e.jsxs("div",{className:"lp-mock-cell",children:[e.jsx("span",{className:"lp-mock-cell-lbl",children:"Jogo"}),e.jsx("span",{className:"lp-mock-cell-val",children:"Flamengo × Palmeiras"}),e.jsx("span",{className:"lp-mock-cell-sub",children:"Vitória do Flamengo"})]}),e.jsxs("div",{className:"lp-mock-cell lp-mock-cell-sm",children:[e.jsx("span",{className:"lp-mock-cell-lbl",children:"Odd"}),e.jsx("span",{className:"lp-mock-cell-val lp-mock-odd",children:"2.80"})]})]}),e.jsxs("div",{className:"lp-mock-prob-split",children:[e.jsx("div",{className:"lp-mock-prob-win"}),e.jsx("div",{className:"lp-mock-prob-lose"})]}),e.jsxs("div",{className:"lp-mock-prob-labels",children:[e.jsx("span",{className:"lp-mock-prob-lbl lp-mock-prob-w",children:"▲ Chance de ganhar 35,7%"}),e.jsx("span",{className:"lp-mock-prob-lbl lp-mock-prob-l",children:"64,3% de perder ▼"})]}),e.jsx("div",{className:"lp-mock-rule"}),e.jsxs("div",{className:"lp-mock-data-grid",children:[e.jsxs("div",{className:"lp-mock-dc",children:[e.jsx("span",{className:"lp-mock-dk",children:"CHANCE DE GANHAR"}),e.jsx("span",{className:"lp-mock-dv lp-mock-dv-g",children:"35,71%"})]}),e.jsxs("div",{className:"lp-mock-dc",children:[e.jsx("span",{className:"lp-mock-dk",children:"MARGEM DA CASA"}),e.jsx("span",{className:"lp-mock-dv lp-mock-dv-a",children:"5,47%"})]}),e.jsxs("div",{className:"lp-mock-dc",children:[e.jsx("span",{className:"lp-mock-dk",children:"CHANCE DE PERDER"}),e.jsx("span",{className:"lp-mock-dv lp-mock-dv-r",children:"64,3%"})]}),e.jsxs("div",{className:"lp-mock-dc",children:[e.jsx("span",{className:"lp-mock-dk",children:"CUSTO POR R$100"}),e.jsx("span",{className:"lp-mock-dv lp-mock-dv-r",children:"−R$14,50"})]})]}),e.jsx("div",{className:"lp-mock-rule"}),e.jsxs("div",{className:"lp-mock-score-wrap",children:[e.jsxs("div",{className:"lp-mock-score-hdr",children:[e.jsx("span",{className:"lp-mock-score-lbl",children:"NOTA DE RISCO"}),e.jsx("span",{className:"lp-mock-risk-tag",children:"ALTO"})]}),e.jsxs("div",{className:"lp-mock-score-row",children:[e.jsxs("div",{className:"lp-mock-score-left",children:[e.jsx("span",{className:"lp-mock-score-num",children:"67"}),e.jsx("span",{className:"lp-mock-score-denom",children:"/100"})]}),e.jsxs("div",{className:"lp-mock-bar-wrap",children:[e.jsxs("div",{className:"lp-mock-bar-track",children:[e.jsx("div",{className:"lp-mock-bar-fill"}),[30,60,80].map(a=>e.jsx("div",{className:"lp-mock-bar-tick",style:{left:`${a}%`}},a))]}),e.jsxs("div",{className:"lp-mock-bar-labels",children:[e.jsx("span",{children:"Baixo"}),e.jsx("span",{children:"Mod."}),e.jsx("span",{children:"Alto"}),e.jsx("span",{children:"Crítico"})]})]})]}),e.jsxs("div",{className:"lp-mock-verdict",children:[e.jsx("span",{className:"lp-mock-verdict-badge lp-mock-verdict-bad",children:"PASSA LONGE"}),e.jsx("span",{className:"lp-mock-verdict-detail",children:"A casa levou vantagem nessa odd"})]})]})]}),e.jsx("div",{className:"lp-mock-footer",children:"Isso é o que você vê em 10 segundos →"})]})})]})]}),e.jsx("section",{className:"lp-problem lp-section-dark",id:"problema",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"O problema"}),e.jsxs("h2",{className:"lp-h2",children:["A odd não te",e.jsx("br",{}),"conta tudo."]}),e.jsxs("p",{className:"lp-problem-text",children:["Quando você vê uma odd de 2.10, parece que tá 50/50.",e.jsx("br",{}),"Mas não tá."]}),e.jsx("p",{className:"lp-problem-text lp-problem-text-em",children:"A casa já embutiu a margem dela. E você não vê isso em lugar nenhum. O MotorIA abre o capô e mostra o que tá escondido."}),e.jsxs("div",{className:"lp-compare",children:[e.jsxs("div",{className:"lp-compare-col lp-compare-show",children:[e.jsxs("div",{className:"lp-compare-hdr",children:[e.jsx("span",{className:"lp-compare-dot lp-compare-dot-dim"}),e.jsx("span",{className:"lp-compare-title",children:"Você só vê"})]}),x.map((a,r)=>e.jsxs("div",{className:"lp-compare-row",children:[e.jsx("span",{className:"lp-compare-icon lp-c-dim",children:"→"}),e.jsx("span",{className:"lp-compare-text",children:a})]},r))]}),e.jsxs("div",{className:"lp-compare-col lp-compare-hide",children:[e.jsxs("div",{className:"lp-compare-hdr",children:[e.jsx("span",{className:"lp-compare-dot lp-compare-dot-green"}),e.jsx("span",{className:"lp-compare-title",children:"O MotorIA mostra o resto"})]}),g.map((a,r)=>e.jsxs("div",{className:"lp-compare-row",children:[e.jsx("span",{className:"lp-compare-icon lp-c-green",children:"✓"}),e.jsx("span",{className:"lp-compare-text",children:a})]},r))]})]})]})}),e.jsx("section",{className:"lp-dash",id:"como-funciona",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"O que você descobre"}),e.jsxs("h2",{className:"lp-h2 lp-h2-narrow",children:["4 números que a odd",e.jsx("br",{}),"não te mostra."]}),e.jsx("div",{className:"lp-dash-grid",children:h.map(a=>e.jsxs("div",{className:"lp-dash-card",children:[e.jsx("div",{className:"lp-dash-card-num",style:{color:a.color},children:a.num}),e.jsx("div",{className:"lp-dash-card-label",children:a.label}),e.jsx("div",{className:"lp-dash-mini-bar",children:e.jsx("div",{className:"lp-dash-mini-fill",style:{width:`${a.bar}%`,background:a.color}})}),e.jsx("div",{className:"lp-dash-card-desc",children:a.desc})]},a.label))}),e.jsx("p",{className:"lp-dash-anchor",children:"Esses números são gerados automaticamente quando você digita sua odd. Leva menos de 10 segundos."})]})}),e.jsx("section",{className:"lp-section lp-section-dark",id:"como-funciona-steps",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Como funciona"}),e.jsx("h2",{className:"lp-h2 lp-h2-narrow",children:"Simples assim."}),e.jsx("div",{className:"lp-steps",children:b.map(a=>e.jsxs("div",{className:"lp-step",children:[e.jsx("div",{className:"lp-step-n",children:a.n}),e.jsx("h3",{className:"lp-step-title",children:a.title}),e.jsx("p",{className:"lp-step-desc",children:a.desc})]},a.n))}),e.jsx("div",{style:{textAlign:"center"},children:e.jsxs(n,{to:"/app",className:"lp-btn-hero",children:["Analisar minha aposta agora",e.jsx("svg",{width:"13",height:"13",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})]})})]})}),e.jsx("section",{className:"lp-section lp-before-after-section",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"O que muda"}),e.jsxs("h2",{className:"lp-h2 lp-h2-narrow",children:["Quem analisa antes",e.jsx("br",{}),"aposta diferente."]}),e.jsx("p",{className:"lp-ba-sub",children:"Não porque parou de apostar. Porque parou de apostar no escuro."}),e.jsx("div",{className:"lp-ba-grid",children:u.map((a,r)=>e.jsxs("div",{className:"lp-ba-card",children:[e.jsxs("div",{className:"lp-ba-block lp-ba-before",children:[e.jsx("span",{className:"lp-ba-tag",children:"Antes"}),e.jsx("p",{className:"lp-ba-text",children:a.before})]}),e.jsx("div",{className:"lp-ba-arrow","aria-hidden":"true",children:"↓"}),e.jsxs("div",{className:"lp-ba-block lp-ba-after",children:[e.jsx("span",{className:"lp-ba-tag lp-ba-tag-after",children:"Depois"}),e.jsx("p",{className:"lp-ba-text",children:a.after}),a.attribution&&e.jsx("span",{className:"antes-depois-attribution",children:a.attribution})]})]},r))})]})}),e.jsx("section",{className:"lp-section lp-section-dark",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Quem usou"}),e.jsx("h2",{className:"lp-h2 lp-h2-narrow",children:"O que disseram."}),e.jsxs("div",{className:"lp-user-count",children:[e.jsx("span",{className:"lp-user-count-num",children:"+847"})," apostadores já analisaram com o MotorIA Pro"]}),e.jsx("div",{className:"lp-testimonials",children:f.map((a,r)=>e.jsxs("div",{className:"lp-testimonial",children:[e.jsx(w,{}),e.jsxs("p",{className:"lp-test-text",style:{whiteSpace:"pre-line"},children:['"',a.text,'"']}),e.jsxs("div",{className:"lp-test-byline",children:[e.jsxs("span",{className:"lp-test-name",children:["— ",a.name,", ",a.city]}),e.jsx("span",{className:"lp-test-context",children:a.context})]})]},r))})]})}),e.jsx(y,{}),e.jsx("section",{className:"lp-section",id:"preco",children:e.jsxs("div",{className:"lp-container",children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Acesso completo"}),e.jsx("h2",{className:"lp-h2 lp-h2-narrow",children:"Custa menos que uma aposta perdida."}),e.jsx("p",{className:"lp-pricing-sub",children:"Por R$27 — menos do que você provavelmente perdeu na última aposta ruim — você nunca mais aposta sem saber o que está fazendo."}),e.jsxs("div",{className:"lp-pricing",children:[e.jsx("ul",{className:"lp-features-list",children:v.map((a,r)=>e.jsxs("li",{className:`lp-feature-item${a.tilt?" lp-feature-tilt":""}`,children:[e.jsx("span",{className:"lp-feature-check",children:a.tilt?"⚡":"✓"}),e.jsxs("span",{children:[a.text,a.sub&&e.jsx("span",{className:"lp-feature-sub",children:a.sub})]})]},r))}),e.jsxs("div",{className:"lp-price-card",children:[e.jsx("div",{className:"lp-price-eyebrow",children:"ACESSO IMEDIATO AO MOTORIA PRO"}),e.jsx("div",{className:"lp-price-includes",children:"Análise de risco + Controle de Banca"}),e.jsxs("div",{className:"lp-price-display",children:[e.jsx("span",{className:"lp-price-old",children:"R$47"}),e.jsxs("div",{className:"lp-price-main",children:[e.jsx("span",{className:"lp-price-curr",children:"R$"}),e.jsx("span",{className:"lp-price-int",children:"27"})]})]}),e.jsx("div",{className:"lp-price-today",children:"Hoje apenas"}),e.jsxs("div",{className:"lp-urgency",children:[e.jsxs("div",{className:"lp-urgency-hdr",children:[e.jsx("span",{className:"lp-urgency-icon",children:"⚡"}),e.jsx("span",{className:"lp-urgency-title",children:"PREÇO DE LANÇAMENTO"})]}),e.jsx("div",{className:"lp-urgency-bar-wrap",children:e.jsx("div",{className:"lp-urgency-bar",style:{width:"84.7%"}})}),e.jsxs("div",{className:"lp-urgency-foot",children:[e.jsx("span",{className:"lp-urgency-count",children:"847 / 1.000 usuários"}),e.jsx("span",{className:"lp-urgency-after",children:"Hoje R$27 → depois R$47"})]})]}),e.jsx("div",{className:"lp-price-payment-note",children:"Pagamento único • Sem mensalidade"}),e.jsx("p",{className:"lp-price-note",children:"Ativação imediata após o pagamento."}),e.jsx(n,{to:"/pagar",className:"lp-btn-buy",children:"Desbloquear agora →"}),e.jsxs("div",{className:"lp-guarantee",children:[e.jsx("div",{className:"lp-guarantee-icon",children:"✓"}),e.jsxs("div",{children:[e.jsx("div",{className:"lp-guarantee-title",children:"Garantia de 7 dias"}),e.jsx("div",{className:"lp-guarantee-sub",children:"Não achou útil? Devolvemos 100% sem perguntas."})]})]})]})]})]})}),e.jsx("section",{className:"lp-section lp-section-dark",children:e.jsxs("div",{className:"lp-container",style:{maxWidth:680},children:[e.jsx("div",{className:"lp-section-eyebrow",children:"Dúvidas"}),e.jsx("h2",{className:"lp-h2 lp-h2-narrow",children:"Perguntas frequentes."}),e.jsx("div",{className:"lp-faq",children:k.map((a,r)=>e.jsx(N,{q:a.q,a:a.a},r))})]})}),e.jsxs("section",{className:"lp-cta-final",children:[e.jsx("div",{className:"lp-cta-grid","aria-hidden":"true"}),e.jsxs("div",{className:"lp-container lp-cta-inner",children:[e.jsxs("h2",{className:"lp-cta-h2",children:["Sua próxima aposta",e.jsx("br",{}),e.jsx("span",{className:"lp-cta-dim",children:"merece mais que um palpite."})]}),e.jsx("p",{className:"lp-cta-sub",children:"Analise antes. Decida melhor."}),e.jsxs("div",{className:"lp-cta-actions",children:[e.jsx(n,{to:"/pagar",className:"lp-btn-buy lp-btn-buy-lg",children:"Garantir acesso por R$27 →"}),e.jsx("p",{className:"cta-guarantee-text",children:"Garantia de 7 dias — não gostou, devolvemos 100%."})]}),e.jsxs("div",{className:"lp-trust-seals",children:[e.jsxs("div",{className:"lp-seal",children:[e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",children:[e.jsx("rect",{x:"1",y:"6",width:"14",height:"9",rx:"2",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M5 6V4a3 3 0 1 1 6 0v2",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"})]}),"Pagamento seguro"]}),e.jsxs("div",{className:"lp-seal",children:[e.jsx("svg",{width:"14",height:"14",viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M3 8l3.5 3.5L13 4",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})}),"Garantia de 7 dias"]}),e.jsxs("div",{className:"lp-seal",children:[e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",children:[e.jsx("circle",{cx:"8",cy:"8",r:"6",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M8 5v3l2 2",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"})]}),"Acesso em segundos"]}),e.jsxs("div",{className:"lp-seal",children:[e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",children:[e.jsx("rect",{x:"3",y:"2",width:"10",height:"12",rx:"2",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M6 6h4M6 9h3",stroke:"currentColor",strokeWidth:"1.2",strokeLinecap:"round"})]}),"Funciona no celular"]})]})]})]}),e.jsx("div",{id:"sticky-cta",className:"sticky-cta-bar",children:e.jsx("a",{href:"#preco",className:"sticky-cta-btn",children:"Garantir acesso por R$27 →"})}),e.jsx("footer",{className:"lp-footer-custom",children:e.jsxs("div",{className:"lp-container",children:[e.jsxs("div",{className:"lp-footer-legal",children:["⚠️ Ferramenta educativa de análise. Não é recomendação de aposta. Apostas envolvem risco financeiro real. Jogue com responsabilidade. Proibido para menores de 18 anos."," ",e.jsx("a",{href:"https://www.jogoresponsavel.com.br",target:"_blank",rel:"noopener noreferrer",children:"jogoresponsavel.com.br"})]}),e.jsxs("div",{className:"lp-footer-links",children:[e.jsx("span",{children:"© 2026 MotorIA Pro"}),e.jsx("span",{className:"lp-footer-sep",children:"·"}),e.jsx("a",{href:"/termos",children:"Termos de Uso"}),e.jsx("span",{className:"lp-footer-sep",children:"·"}),e.jsx("a",{href:"/privacidade",children:"Política de Privacidade"}),e.jsx("span",{className:"lp-footer-sep",children:"·"}),e.jsx("a",{href:"mailto:suporte@motoriaopro.com.br",children:"Contato"})]})]})})]})}const A=`
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
`,M=Object.freeze(Object.defineProperty({__proto__:null,default:z},Symbol.toStringTag,{value:"Module"}));export{F,L as G,R as H,n as L,E as R,m as a,C as b,M as c,S as u};
