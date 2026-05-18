import{r as o,j as e}from"./vendor-BnG4zNoI.js";import{L as ue}from"./landing-Co7Nkrz0.js";const be=["Resultado final (1X2)","Over / Under gols","Ambas marcam (BTTS)","Handicap asiático","Handicap europeu","Chance dupla","Draw No Bet","Primeiro gol","Escanteios","Cartões","Múltipla","Outro"],b=[{label:"Calculando a chance real de ganhar…",pct:18},{label:"Detectando o corte da casa…",pct:36},{label:"Medindo o nível de perigo da aposta…",pct:56},{label:"Encontrando o que a plataforma esconde…",pct:76},{label:"Preparando sua análise completa…",pct:92}],v="motoria_token",le="motoria_hist_v2",ve=8,V="https://pay.kiwify.com.br/DIVD8zl";function ie(r){return 1/r*100}function je(r){return r<=1.4?4:r<=1.7?4.8:r<=2.2?5.5:r<=3?6.5:8}function we(r,n){return r/100*(n-1)*100-(1-r/100)*100}function ye(r){return r>60?{label:"ALTA",color:"#FF4D2E"}:r>42?{label:"MÉDIA",color:"#FFB020"}:{label:"BAIXA",color:"#1FCB7A"}}function re(r){const n=Math.min(100,Math.round(100-ie(r)));let i,x;return n<=30?(i="BAIXO",x="#1FCB7A"):n<=60?(i="MODERADO",x="#FFB020"):n<=80?(i="ALTO",x="#FF6B2E"):(i="CRÍTICO",x="#FF4D2E"),{score:n,label:i,color:x}}function Ne(r,n){const i=r.match(new RegExp(`^${n}:\\s*(.+)`,"m"));return i?i[1].trim():null}function N(r,n){const i=r.match(new RegExp(`^${n}:[^\\n]*\\n([\\s\\S]*?)(?=\\n[A-Z_]{3,}:|$)`,"m"));return i?i[1].trim():Ne(r,n)}function ke(r){return{riscoPrincipal:N(r,"RISCO_PRINCIPAL"),cenarioNecessario:N(r,"CENARIO_NECESSARIO"),oQuePodeDarErrado:N(r,"O_QUE_PODE_DAR_ERRADO"),leituraConservadora:N(r,"LEITURA_CONSERVADORA"),alertaFinal:N(r,"ALERTA_FINAL")}}function ae(){return new Date().toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}).replace(",","")}function ze(){try{return JSON.parse(localStorage.getItem(le)||"[]")}catch{return[]}}function oe(r){try{localStorage.setItem(le,JSON.stringify(r))}catch{}}function Ee(){const[r,n]=o.useState(""),[i,x]=o.useState("Resultado final (1X2)"),[k,$]=o.useState(""),[S,q]=o.useState(""),[I,H]=o.useState(""),[c,z]=o.useState(!1),[O,X]=o.useState(0),[L,F]=o.useState(0),[W,j]=o.useState(""),[a,D]=o.useState(null),[Y,Q]=o.useState(ze),[R,A]=o.useState(()=>localStorage.getItem(v)||""),[g,w]=o.useState(null),[d,y]=o.useState(null),[U,se]=o.useState(""),[T,J]=o.useState(!1),[_,f]=o.useState(""),K=o.useRef(null),Z=o.useRef(null);o.useRef(null),o.useEffect(()=>{const t=localStorage.getItem(v);t&&G(t,!1)},[]);async function G(t,l=!0){try{const p=await fetch("/api/validate-token",{headers:{Authorization:`Bearer ${t}`}}),m=await p.json();if(p.ok&&m.valid)return A(t),w(m.credits),localStorage.setItem(v,t),y(null),f(""),!0;{const u=m.code==="TOKEN_EXPIRED"?"Seu token expirou. Adquira um novo pacote para continuar.":"Token inválido ou não encontrado.";return l&&f(u),localStorage.removeItem(v),A(""),!1}}catch{return l&&f("Erro de conexão ao validar token."),!1}}async function ne(t){t.preventDefault();const l=U.trim();if(!l){f("Digite seu código de acesso.");return}J(!0),f("");const p=await G(l,!0);J(!1),!p&&!_&&f("Token inválido ou não encontrado.")}function de(){localStorage.removeItem(v),A(""),w(null),y(null)}function ce(){let t=0;X(0),F(b[0].pct),Z.current=setInterval(()=>{t=Math.min(t+1,b.length-1),X(t),F(b[t].pct)},1300)}function P(){clearInterval(Z.current),F(100)}async function pe(t){if(t.preventDefault(),j(""),D(null),!r.trim()){j("Informe o jogo ou evento.");return}const l=parseFloat(k.replace(",","."));if(!k.trim()||isNaN(l)||l<=1){j("Informe uma odd válida — número maior que 1 (ex: 1.80).");return}const p=ie(l),m=[`Jogo: ${r.trim()}`,`Tipo de aposta: ${i}`,`Odd: ${k.trim()}`,`Probabilidade implícita: ${p.toFixed(1)}%`];S.trim()&&m.push(`Valor pretendido: R$ ${S.trim()}`),I.trim()&&m.push(`Contexto adicional: ${I.trim()}`),z(!0),ce();try{const u={"Content-Type":"application/json"};R&&(u.Authorization=`Bearer ${R}`);const E=await fetch("/api/chat",{method:"POST",headers:u,body:JSON.stringify({tool:"chance_de_perder",userMessage:m.join(`
`)})}),h=await E.json();if(h.locked){P(),y("no_access"),z(!1);return}if(E.status===402){h.code==="NO_CREDITS"?(w(0),y("no_credits")):y("no_access"),P(),z(!1);return}if(E.status===401){localStorage.removeItem(v),A(""),w(null);const B=h.code==="TOKEN_EXPIRED"?"Seu token expirou. Adquira um novo pacote.":"Sessão inválida. Insira seu token novamente.";throw new Error(B)}if(!E.ok)throw new Error(h.error||"Erro ao processar. Tente novamente.");h.credits!=null&&w(h.credits);const ge=h.content?.[0]?.text||"",me=je(l),he=we(p,l),fe={ai:ke(ge),oddN:l,prob:p,vig:me,ev:he};D(fe);const M=re(l);Q(B=>{const te=[{id:Date.now(),jogo:r.trim(),tipo:i,odd:l,score:M.score,label:M.label,color:M.color,date:ae()},...B].slice(0,ve);return oe(te),te}),setTimeout(()=>K.current?.scrollIntoView({behavior:"smooth",block:"start"}),200)}catch(u){j(u.message||"Erro de conexão. Verifique sua internet.")}finally{P(),z(!1)}}function xe(){D(null),j(""),$(""),H(""),q(""),window.scrollTo({top:0,behavior:"smooth"})}const C=a?ye(100-a.prob):null,s=a?re(a.oddN):null,ee=(a?.ai.oQuePodeDarErrado||"").split(`
`).filter(t=>t.trim()).map(t=>t.replace(/^[-•*]\s*/,""));return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:Re}),e.jsxs("header",{className:"tl-header",children:[e.jsx("div",{className:"tl-header-left",children:e.jsxs("div",{className:"tl-logo",children:[e.jsx("div",{className:"tl-logo-mark",children:e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",children:[e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"#050505"}),e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"currentColor",fillOpacity:".9"})]})}),e.jsxs("div",{className:"tl-logo-group",children:[e.jsx("span",{className:"tl-logo-name",children:"MotorIA Pro"}),e.jsx("span",{className:"tl-logo-status",children:"Ferramenta educativa"})]})]})}),e.jsxs("div",{className:"tl-header-right",children:[R&&g!==null?e.jsxs("div",{className:"tl-credits-pill tl-credits-paid",children:[e.jsx("span",{className:"tl-credits-dot"}),e.jsx("span",{className:"tl-credits-count",children:g}),e.jsxs("span",{className:"tl-credits-label",children:["análise",g!==1?"s":""]})]}):null,(g!==null&&g<=3||d)&&e.jsx("a",{href:V,className:"tl-header-buy",target:"_blank",rel:"noopener noreferrer",children:"+ créditos"}),e.jsx(ue,{to:"/",className:"tl-header-back",children:"← Início"}),R&&e.jsx("button",{className:"tl-nav-logout",onClick:de,children:"Sair"})]})]}),e.jsx("main",{className:"tl-main",children:e.jsxs("div",{className:"tl-wrap",children:[!a&&!c&&e.jsxs("div",{className:"tl-hero",children:[e.jsx("div",{className:"tl-hero-glow","aria-hidden":"true"}),e.jsx("div",{className:"tl-hero-eyebrow",children:"MotorIA Pro · Ferramenta educativa"}),e.jsxs("h1",{className:"tl-hero-title",children:["Veja o risco ",e.jsx("em",{className:"tl-hero-em",children:"REAL"}),e.jsx("br",{}),e.jsx("span",{className:"tl-hero-dim",children:"antes de apostar."})]}),e.jsx("p",{className:"tl-hero-sub",children:"A ferramenta mostra o que a plataforma não mostra: chance de perda, nível de perigo e o que você tende a perder no longo prazo."}),e.jsx("div",{className:"tl-trust-row",children:["Ferramenta educativa","Não vende previsões","Não promete lucro","+18"].map(t=>e.jsx("span",{className:"tl-trust-pill",children:t},t))})]}),d&&e.jsxs("div",{className:"tl-gate",children:[e.jsx("div",{className:"tl-gate-glow","aria-hidden":"true"}),e.jsx("div",{className:"tl-gate-icon","aria-hidden":"true",children:d==="no_credits"?e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 22 22",fill:"none",children:[e.jsx("circle",{cx:"11",cy:"11",r:"9",stroke:"currentColor",strokeWidth:"1.5"}),e.jsx("path",{d:"M11 7v5M11 15h.01",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round"})]}):d==="no_access"?e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 22 22",fill:"none",children:[e.jsx("rect",{x:"3",y:"10",width:"16",height:"10",rx:"2",stroke:"currentColor",strokeWidth:"1.5"}),e.jsx("path",{d:"M7 10V7a4 4 0 0 1 8 0v3",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round"}),e.jsx("circle",{cx:"11",cy:"15",r:"1.3",fill:"currentColor"})]}):e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 22 22",fill:"none",children:[e.jsx("path",{d:"M11 3L19 7V15L11 19L3 15V7L11 3Z",stroke:"currentColor",strokeWidth:"1.5",strokeLinejoin:"round"}),e.jsx("path",{d:"M11 8v4M11 15h.01",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round"})]})}),e.jsxs("div",{className:"tl-gate-body",children:[e.jsx("h2",{className:"tl-gate-title",children:d==="no_credits"?"Suas análises acabaram.":d==="no_access"?"Resultado completo disponível.":"Você usou as 2 análises gratuitas."}),e.jsx("p",{className:"tl-gate-sub",children:d==="no_credits"?"Recarregue 20 novas análises por R$27 e continue vendo o risco real antes de apostar.":d==="no_access"?"Desbloqueie a análise completa, controle de banca e histórico. Pagamento único — sem mensalidade.":"Para continuar vendo o risco real das suas apostas, desbloqueie o acesso completo — 20 análises por R$27."}),d==="no_access"&&e.jsxs("div",{className:"tl-gate-price",children:[e.jsx("span",{className:"tl-gate-price-old",children:"R$47"}),e.jsx("span",{className:"tl-gate-price-real",children:"R$27"})]}),e.jsx("a",{href:V,className:"tl-gate-btn",target:"_blank",rel:"noopener noreferrer",children:d==="no_access"?"Desbloquear agora →":"Comprar 20 análises — R$27 →"}),d==="no_access"&&e.jsx("p",{className:"tl-gate-payment-note",children:"Pagamento único · Sem mensalidade · Acesso imediato"}),e.jsx("ul",{className:"tl-gate-feats",children:(d==="no_access"?["Análise de risco completa por aposta","Controle de Banca: ROI, saldo e sequência","Alertas de exposição alta","20 análises incluídas · Pagamento único"]:["20 análises incluídas","Nível de risco por aposta","O que pode dar errado em cada uma","Recarregável quando precisar"]).map(t=>e.jsxs("li",{children:[e.jsx("span",{className:"tl-gate-check",children:"✓"})," ",t]},t))})]}),e.jsx("div",{className:"tl-gate-divider",children:e.jsx("span",{children:"Já tem um código de acesso?"})}),e.jsxs("form",{onSubmit:ne,className:"tl-token-form",children:[e.jsx("input",{className:"tl-input tl-token-input",placeholder:"Cole seu código de acesso aqui",value:U,onChange:t=>se(t.target.value),disabled:T,autoComplete:"off",spellCheck:!1}),_&&e.jsx("p",{className:"tl-token-err",children:_}),e.jsx("button",{className:"tl-token-btn",type:"submit",disabled:T,children:T?"Validando…":"Ativar acesso"})]})]}),!d&&!c&&!a&&e.jsxs("form",{className:"tl-form-card",onSubmit:pe,noValidate:!0,children:[e.jsxs("div",{className:"tl-form-header",children:[e.jsxs("div",{className:"tl-form-header-left",children:[e.jsx("div",{className:"tl-form-icon","aria-hidden":"true",children:e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",children:[e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"currentColor",fillOpacity:".5"}),e.jsx("circle",{cx:"7",cy:"7",r:"2",fill:"currentColor"})]})}),e.jsx("span",{className:"tl-form-title",children:"Analisar minha aposta"})]}),e.jsx("span",{className:"tl-form-badge",children:"engine v2"})]}),e.jsxs("div",{className:"tl-field",children:[e.jsx("label",{className:"tl-label",children:"Jogo ou evento"}),e.jsx("input",{className:"tl-input",value:r,onChange:t=>n(t.target.value),placeholder:"Ex: Flamengo × Palmeiras, UFC 310, Djokovic × Alcaraz…",disabled:c})]}),e.jsxs("div",{className:"tl-field",children:[e.jsx("label",{className:"tl-label",children:"Tipo de aposta"}),e.jsx("select",{className:"tl-input tl-select",value:i,onChange:t=>x(t.target.value),disabled:c,children:be.map(t=>e.jsx("option",{children:t},t))})]}),e.jsxs("div",{className:"tl-row-2",children:[e.jsxs("div",{className:"tl-field",children:[e.jsxs("label",{className:"tl-label",children:["Odd",e.jsxs("span",{className:"tl-tooltip-wrap",tabIndex:"0","aria-label":"O que é odd?",children:[e.jsx("span",{className:"tl-info-icon",children:"?"}),e.jsx("span",{className:"tl-tooltip",role:"tooltip",children:"A odd é o multiplicador pago pela casa se você ganhar. Odd 2.00 = casa estima 50% de chance. Quanto maior a odd, menor essa chance — e maior o risco real."})]})]}),e.jsx("input",{className:"tl-input",value:k,onChange:t=>$(t.target.value),placeholder:"Ex: 1.80",inputMode:"decimal",disabled:c})]}),e.jsxs("div",{className:"tl-field",children:[e.jsxs("label",{className:"tl-label",children:["Valor pretendido ",e.jsx("span",{className:"tl-opt",children:"(opcional)"})]}),e.jsx("input",{className:"tl-input",value:S,onChange:t=>q(t.target.value),placeholder:"R$ 0,00",inputMode:"decimal",disabled:c})]})]}),e.jsxs("div",{className:"tl-field",children:[e.jsxs("label",{className:"tl-label",children:["Contexto adicional ",e.jsx("span",{className:"tl-opt",children:"(opcional)"})]}),e.jsx("textarea",{className:"tl-input tl-textarea",value:I,onChange:t=>H(t.target.value),placeholder:"Fase da competição, time fora de casa, lesões, momento da temporada, outros fatores relevantes…",disabled:c,rows:3})]}),e.jsx("p",{className:"tl-microcopy",children:"Quanto mais informação você der, mais precisa será a análise."}),W&&e.jsx("div",{className:"tl-err",children:W}),e.jsxs("button",{className:"tl-btn",type:"submit",disabled:c,children:["Ver o risco dessa aposta",e.jsx("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})]})]}),c&&e.jsxs("div",{className:"tl-loading-panel",children:[e.jsx("div",{className:"tl-loading-glow","aria-hidden":"true"}),e.jsxs("div",{className:"tl-loading-top",children:[e.jsxs("div",{className:"tl-loading-ring","aria-hidden":"true",children:[e.jsxs("svg",{viewBox:"0 0 36 36",fill:"none",children:[e.jsx("circle",{cx:"18",cy:"18",r:"15",stroke:"rgba(31,203,122,0.12)",strokeWidth:"2.5"}),e.jsx("circle",{cx:"18",cy:"18",r:"15",stroke:"#1FCB7A",strokeWidth:"2.5",strokeDasharray:`${L*.942} 94.2`,strokeDashoffset:"23.55",strokeLinecap:"round",style:{transition:"stroke-dasharray .8s cubic-bezier(.4,0,.2,1)"}})]}),e.jsxs("span",{className:"tl-loading-pct",children:[L,"%"]})]}),e.jsxs("div",{className:"tl-loading-text",children:[e.jsx("div",{className:"tl-loading-step",children:b[O].label}),e.jsxs("div",{className:"tl-loading-sub",children:["Etapa ",O+1," de ",b.length]})]})]}),e.jsx("div",{className:"tl-prog-track",children:e.jsx("div",{className:"tl-prog-fill",style:{width:`${L}%`,transition:"width .8s cubic-bezier(.4,0,.2,1)"}})}),e.jsx("div",{className:"tl-prog-steps",children:b.map((t,l)=>e.jsxs("div",{className:`tl-prog-step${l<=O?" tl-prog-done":""}`,children:[e.jsx("span",{className:"tl-prog-dot"}),e.jsx("span",{className:"tl-prog-label",children:t.label})]},l))})]}),a&&!c&&e.jsxs("div",{className:"tl-result",ref:K,children:[e.jsxs("div",{className:"tl-report-hdr",children:[e.jsxs("div",{className:"tl-report-hdr-left",children:[e.jsx("span",{className:"tl-report-label",children:"RELATÓRIO DE RISCO"}),e.jsxs("span",{className:"tl-report-meta",children:[r||"Análise"," · odd ",a.oddN.toFixed(2)," · ",i]})]}),e.jsxs("div",{className:"tl-report-badges",children:[e.jsx("span",{className:"tl-report-badge",children:"MotorIA™"}),e.jsx("span",{className:"tl-report-ts",children:ae()})]})]}),e.jsxs("div",{className:"tl-card tl-card-score",style:{borderColor:s.color+"30",background:s.color+"07"},children:[e.jsx("div",{className:"tl-card-tag",style:{color:s.color+"80"},children:"NÍVEL DE RISCO · MOTORIA™"}),e.jsxs("div",{className:"tl-score-risk-banner",style:{color:s.color},children:["RISCO ",s.label]}),e.jsxs("div",{className:"tl-score-row",children:[e.jsx("div",{className:"tl-score-num",style:{color:s.color},children:s.score}),e.jsxs("div",{className:"tl-score-right",children:[e.jsx("span",{className:"tl-score-badge",style:{background:s.color+"18",color:s.color,border:`1px solid ${s.color}40`},children:s.score<=30?"Risco baixo — mais segura":s.score<=60?"Risco moderado — atenção":s.score<=80?"Risco alto — cuidado":"Risco crítico — perigo real"}),e.jsxs("div",{className:"tl-score-bar-wrap",children:[e.jsxs("div",{className:"tl-score-bar-track",children:[e.jsx("div",{className:"tl-score-bar-fill",style:{width:`${s.score}%`,background:s.color}}),[30,60,80].map(t=>e.jsx("div",{className:"tl-score-tick",style:{left:`${t}%`}},t))]}),e.jsxs("div",{className:"tl-score-bar-labels",children:[e.jsx("span",{children:"Baixo"}),e.jsx("span",{children:"Moderado"}),e.jsx("span",{children:"Alto"}),e.jsx("span",{children:"Crítico"})]})]})]})]}),e.jsx("p",{className:"tl-score-note",children:"Calculado a partir da odd e do contexto fornecido. Não recomenda nenhuma entrada — apenas mostra o nível de perigo dessa aposta."})]}),e.jsxs("div",{className:"tl-metrics-grid",children:[e.jsxs("div",{className:"tl-metric-card",children:[e.jsx("div",{className:"tl-metric-label",children:"Chance que a casa dá pra você ganhar"}),e.jsxs("div",{className:"tl-metric-val",style:{color:"#1FCB7A"},children:[a.prob.toFixed(1),"%"]}),e.jsx("div",{className:"tl-metric-hint",children:"o mínimo pra aposta valer a pena"})]}),e.jsxs("div",{className:"tl-metric-card",children:[e.jsx("div",{className:"tl-metric-label",children:"Chance de perder"}),e.jsxs("div",{className:"tl-metric-val",style:{color:C.color},children:["~",(100-a.prob).toFixed(1),"%",e.jsx("span",{className:"tl-metric-badge",style:{background:C.color+"18",color:C.color},children:C.label})]}),e.jsx("div",{className:"tl-metric-hint",children:"estimativa conservadora"})]}),e.jsxs("div",{className:"tl-metric-card",children:[e.jsx("div",{className:"tl-metric-label",children:"O que a casa retém de cada aposta"}),e.jsxs("div",{className:"tl-metric-val",style:{color:"#FFB020"},children:["~",a.vig.toFixed(1),"%"]}),e.jsx("div",{className:"tl-metric-hint",children:"antes mesmo do resultado"})]}),e.jsxs("div",{className:"tl-metric-card",children:[e.jsx("div",{className:"tl-metric-label",children:"O que você tende a perder por R$100"}),e.jsxs("div",{className:"tl-metric-val",style:{color:a.ev>=0?"#1FCB7A":"#FF4D2E"},children:[a.ev>=0?"+R$":"-R$",Math.abs(a.ev).toFixed(2)]}),e.jsx("div",{className:"tl-metric-hint",children:a.ev<-10?"perda esperada alta no longo prazo":a.ev<0?"desfavorável no longo prazo":"dentro da variância normal"})]})]}),a.ai.riscoPrincipal&&e.jsxs("div",{className:"tl-card tl-card-risk",children:[e.jsx("div",{className:"tl-card-tag",children:"① O PRINCIPAL RISCO DESSA APOSTA"}),e.jsx("p",{className:"tl-card-text",children:a.ai.riscoPrincipal})]}),a.ai.cenarioNecessario&&e.jsxs("div",{className:"tl-card tl-card-scenario",children:[e.jsx("div",{className:"tl-card-tag",children:"② O QUE PRECISA ACONTECER PRA VOCÊ GANHAR"}),e.jsx("p",{className:"tl-card-text",children:a.ai.cenarioNecessario})]}),ee.length>0&&e.jsxs("div",{className:"tl-card tl-card-blind",children:[e.jsx("div",{className:"tl-card-tag",children:"③ O QUE PODE DAR ERRADO"}),e.jsx("ul",{className:"tl-bullets",children:ee.map((t,l)=>e.jsx("li",{className:"tl-bullet",children:t},l))})]}),(a.ai.leituraConservadora||a.ai.alertaFinal)&&e.jsxs("div",{className:"tl-card tl-card-final",children:[e.jsx("div",{className:"tl-card-tag",children:"④ O QUE VOCÊ DEVERIA CONSIDERAR ANTES DE APOSTAR"}),a.ai.leituraConservadora&&e.jsx("p",{className:"tl-card-text",children:a.ai.leituraConservadora}),a.ai.alertaFinal&&e.jsx("blockquote",{className:"tl-quote",children:a.ai.alertaFinal}),e.jsx("p",{className:"tl-final-note",children:"Esta análise tem finalidade exclusivamente educativa. Não é recomendação de aposta. Apostas envolvem risco financeiro real."})]}),e.jsxs("div",{className:"tl-result-actions",children:[e.jsx("button",{className:"tl-new-btn",onClick:xe,children:"← Nova análise"}),g!==null&&g<=5&&e.jsx("a",{href:V,className:"tl-recharge-btn",target:"_blank",rel:"noopener noreferrer",children:"+ 20 análises — R$27"})]})]}),Y.length>0&&!c&&e.jsxs("div",{className:"tl-history",children:[e.jsxs("div",{className:"tl-history-hdr",children:[e.jsx("span",{className:"tl-history-title",children:"Últimas análises"}),e.jsx("button",{className:"tl-history-clear",onClick:()=>{Q([]),oe([])},children:"Limpar"})]}),Y.map(t=>e.jsxs("div",{className:"tl-history-row",children:[e.jsx("div",{className:"tl-history-score",style:{color:t.color},children:t.score}),e.jsxs("div",{className:"tl-history-info",children:[e.jsx("div",{className:"tl-history-jogo",children:t.jogo}),e.jsxs("div",{className:"tl-history-meta",children:[t.tipo," · odd ",t.odd.toFixed(2)]})]}),e.jsx("div",{className:"tl-history-label",style:{color:t.color},children:t.label}),e.jsx("div",{className:"tl-history-date",children:t.date})]},t.id))]})]})}),e.jsxs("footer",{className:"tl-footer",children:[e.jsx("p",{className:"tl-footer-text",children:"Ferramenta educativa. Não é recomendação de aposta. Apostas envolvem risco financeiro real. Proibido para menores de 18 anos."}),e.jsxs("div",{className:"tl-footer-links",children:[e.jsx("a",{href:"https://www.jogoresponsavel.com.br",target:"_blank",rel:"noopener noreferrer",children:"jogoresponsavel.com.br"}),e.jsx("span",{children:"·"}),e.jsx("span",{children:"CVV 188"}),e.jsx("span",{children:"·"}),e.jsx("span",{children:"+18"})]})]})]})}const Re=`
/* ── Reset / Tokens ─────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
:root {
  --bg:    #050505;
  --bg2:   #08080a;
  --t1:    #EBEBEB;
  --t2:    #8A8A8A;
  --t3:    #525252;
  --green: #1FCB7A;
  --amber: #FFB020;
  --red:   #FF4D2E;
  --border: rgba(255,255,255,0.07);
  --bmd:    rgba(255,255,255,0.11);
}

/* ── Keyframes ──────────────────────────────────────────────────────────────── */
@keyframes tl-spin { to { transform: rotate(360deg); } }
@keyframes tl-glow {
  0%, 100% { opacity: .5; }
  50%       { opacity: 1; }
}
@keyframes tl-fadein {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes tl-prog-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(31,203,122,0); }
  50%       { box-shadow: 0 0 0 4px rgba(31,203,122,0.12); }
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.tl-header {
  position: sticky; top: 0; z-index: 200;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; height: 56px;
  background: rgba(5,5,5,.94);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--border);
  gap: 12px;
}
.tl-header-left { display: flex; align-items: center; flex-shrink: 0; }
.tl-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; }

.tl-logo { display: flex; align-items: center; gap: 10px; }
.tl-logo-mark {
  width: 26px; height: 26px; border-radius: 7px;
  background: var(--green); color: #050505;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.tl-logo-group { display: flex; flex-direction: column; gap: 1px; }
.tl-logo-name {
  font-size: 14px; font-weight: 800; color: var(--t1);
  letter-spacing: -0.025em; line-height: 1;
}
.tl-logo-status {
  font-size: 9px; font-weight: 600; letter-spacing: .1em;
  text-transform: uppercase; color: var(--t3); line-height: 1;
}

/* Credits pill */
.tl-credits-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 11px; border-radius: 99px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
}
.tl-credits-paid {
  background: rgba(31,203,122,0.07);
  border: 1px solid rgba(31,203,122,0.18);
}
.tl-credits-locked {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  color: var(--t3);
}
.tl-credits-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--green); box-shadow: 0 0 6px rgba(31,203,122,.6);
  flex-shrink: 0;
}
.tl-credits-count {
  font-size: 13px; font-weight: 800; color: var(--green); line-height: 1;
  font-variant-numeric: tabular-nums;
}
.tl-credits-label { color: var(--t3); font-size: 11px; }

/* Header actions */
.tl-header-buy {
  font-size: 11px; font-weight: 700;
  color: var(--green); text-decoration: none;
  border: 1px solid rgba(31,203,122,0.25);
  background: rgba(31,203,122,0.06);
  padding: 5px 11px; border-radius: 7px;
  transition: all .15s; white-space: nowrap;
}
.tl-header-buy:hover { background: rgba(31,203,122,0.12); border-color: rgba(31,203,122,.4); }
.tl-header-back {
  font-size: 12px; color: var(--t3); text-decoration: none;
  transition: color .15s; white-space: nowrap;
}
.tl-header-back:hover { color: var(--t2); }
.tl-nav-logout {
  font-size: 11px; color: var(--t3); background: none; border: none;
  cursor: pointer; text-decoration: underline; text-underline-offset: 3px;
  transition: color .15s; padding: 0; white-space: nowrap;
}
.tl-nav-logout:hover { color: var(--t2); }

/* ── Layout ─────────────────────────────────────────────────────────────────── */
.tl-main  { min-height: 80vh; background: var(--bg); }
.tl-wrap  { max-width: 600px; margin: 0 auto; padding: 0 20px 80px; }

/* ── Hero ───────────────────────────────────────────────────────────────────── */
.tl-hero {
  position: relative; overflow: hidden;
  padding: 56px 0 40px; text-align: center;
}
.tl-hero-glow {
  position: absolute; top: 40%; left: 50%;
  transform: translate(-50%, -50%);
  width: 480px; height: 280px;
  background: radial-gradient(ellipse,
    rgba(255,77,46,0.07) 0%,
    rgba(31,203,122,0.05) 50%,
    transparent 70%);
  pointer-events: none;
  animation: tl-glow 6s ease-in-out infinite;
}
.tl-hero-eyebrow {
  position: relative; z-index: 1;
  display: inline-block;
  font-size: 10px; font-weight: 700; letter-spacing: .16em;
  text-transform: uppercase; color: var(--green);
  border: 1px solid rgba(31,203,122,.22);
  background: rgba(31,203,122,.05);
  padding: 5px 14px; border-radius: 99px;
  margin-bottom: 22px;
}
.tl-hero-title {
  position: relative; z-index: 1;
  font-size: clamp(28px, 6vw, 46px); font-weight: 900;
  color: var(--t1); line-height: 1.1; letter-spacing: -0.04em;
  margin: 0 0 16px;
}
.tl-hero-dim { color: rgba(235,235,235,.35); }
.tl-hero-em {
  font-style: normal;
  color: #FF4D2E;
  text-shadow: 0 0 40px rgba(255,77,46,.35);
}
.tl-hero-sub {
  position: relative; z-index: 1;
  font-size: 15px; color: var(--t2); line-height: 1.72;
  max-width: 460px; margin: 0 auto 28px;
}
.tl-trust-row {
  position: relative; z-index: 1;
  display: flex; flex-wrap: wrap; gap: 7px; justify-content: center;
}
.tl-trust-pill {
  font-size: 11px; color: var(--t3);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 99px; padding: 4px 11px;
  background: rgba(255,255,255,.025); white-space: nowrap;
}

/* ── Form card ──────────────────────────────────────────────────────────────── */
.tl-form-card {
  background: rgba(255,255,255,.025);
  border: 1px solid var(--border);
  border-radius: 20px; padding: 0;
  display: flex; flex-direction: column;
  overflow: hidden;
  animation: tl-fadein .3s ease;
}
.tl-form-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px 16px;
  border-bottom: 1px solid var(--border);
  background: rgba(255,255,255,.015);
}
.tl-form-header-left { display: flex; align-items: center; gap: 10px; }
.tl-form-icon {
  width: 26px; height: 26px; border-radius: 7px;
  background: rgba(31,203,122,.1); border: 1px solid rgba(31,203,122,.2);
  color: var(--green); display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.tl-form-title {
  font-size: 13px; font-weight: 700; color: var(--t1);
  letter-spacing: -0.01em;
}
.tl-form-badge {
  font-size: 9px; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: var(--t3);
  border: 1px solid rgba(255,255,255,.07); border-radius: 5px;
  padding: 3px 8px;
}

.tl-form-card .tl-field:first-of-type { margin-top: 0; }
.tl-form-card > .tl-field,
.tl-form-card > .tl-row-2,
.tl-form-card > .tl-microcopy,
.tl-form-card > .tl-err,
.tl-form-card > .tl-btn { padding-left: 24px; padding-right: 24px; }
.tl-form-card > .tl-field { padding-top: 0; margin-top: 18px; }
.tl-form-card > .tl-row-2 { margin-top: 18px; }
.tl-form-card > .tl-microcopy { margin-top: 12px; }
.tl-form-card > .tl-err { margin-top: 12px; }
.tl-form-card > .tl-btn { margin: 20px 24px 24px; width: calc(100% - 48px); padding-left: 20px; padding-right: 20px; }

.tl-field { display: flex; flex-direction: column; gap: 7px; }
.tl-label {
  font-size: 11px; font-weight: 700; color: var(--t3);
  letter-spacing: .04em; text-transform: uppercase;
}
.tl-opt { font-weight: 400; color: rgba(255,255,255,.15); text-transform: none; letter-spacing: 0; }

.tl-input {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 10px; color: var(--t1);
  font-size: 15px; font-family: inherit;
  padding: 13px 15px; outline: none; width: 100%;
  transition: border-color .18s, background .18s;
  -webkit-appearance: none; appearance: none;
}
.tl-input::placeholder { color: rgba(255,255,255,.12); }
.tl-input:focus {
  border-color: rgba(31,203,122,.35);
  background: rgba(31,203,122,.025);
}
.tl-input:disabled { opacity: .4; cursor: default; }
.tl-select { cursor: pointer; }
option { background: #111; color: var(--t1); }
.tl-textarea { resize: vertical; min-height: 84px; line-height: 1.6; }
.tl-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.tl-microcopy {
  font-size: 12px; color: var(--t3); font-style: italic; line-height: 1.5;
}

/* Error */
.tl-err {
  background: rgba(255,77,46,.07); border: 1px solid rgba(255,77,46,.2);
  border-radius: 10px; color: #f87171; font-size: 13px;
  padding: 11px 15px; line-height: 1.5;
}

/* Submit button */
.tl-btn {
  display: flex; align-items: center; justify-content: center; gap: 9px;
  background: var(--t1); color: #050505;
  border: none; border-radius: 11px;
  font-size: 14px; font-weight: 700; font-family: inherit;
  padding: 15px 20px; cursor: pointer;
  transition: opacity .15s, transform .12s;
  box-shadow: 0 1px 0 rgba(255,255,255,.15) inset;
}
.tl-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
.tl-btn:disabled { opacity: .5; cursor: default; }

/* ── Loading panel ──────────────────────────────────────────────────────────── */
.tl-loading-panel {
  position: relative; overflow: hidden;
  background: rgba(255,255,255,.02);
  border: 1px solid var(--border);
  border-radius: 20px; padding: 36px 28px 28px;
  display: flex; flex-direction: column; gap: 28px;
  animation: tl-fadein .3s ease;
}
.tl-loading-glow {
  position: absolute; top: -40px; left: 50%; transform: translateX(-50%);
  width: 320px; height: 200px;
  background: radial-gradient(ellipse, rgba(31,203,122,.1) 0%, transparent 70%);
  pointer-events: none;
  animation: tl-glow 3s ease-in-out infinite;
}
.tl-loading-top {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 20px;
}
.tl-loading-ring {
  position: relative; flex-shrink: 0;
  width: 56px; height: 56px;
}
.tl-loading-ring svg {
  width: 100%; height: 100%;
  transform: rotate(-90deg);
  animation: none;
}
.tl-loading-pct {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px; font-weight: 800; color: var(--green);
  font-variant-numeric: tabular-nums;
}
.tl-loading-step {
  font-size: 14px; font-weight: 600; color: var(--t1);
  line-height: 1.4; letter-spacing: -0.01em;
}
.tl-loading-sub { font-size: 11px; color: var(--t3); margin-top: 4px; }

/* Progress bar */
.tl-prog-track {
  height: 3px; background: rgba(255,255,255,.06); border-radius: 99px;
  overflow: hidden;
}
.tl-prog-fill {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, rgba(31,203,122,.6) 0%, var(--green) 100%);
  box-shadow: 0 0 8px rgba(31,203,122,.4);
}

/* Progress steps list */
.tl-prog-steps {
  display: flex; flex-direction: column; gap: 10px;
}
.tl-prog-step {
  display: flex; align-items: center; gap: 10px;
  transition: opacity .3s;
}
.tl-prog-step:not(.tl-prog-done) { opacity: .22; }
.tl-prog-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
  background: rgba(255,255,255,.2); transition: background .3s;
}
.tl-prog-done .tl-prog-dot {
  background: var(--green);
  box-shadow: 0 0 6px rgba(31,203,122,.5);
  animation: tl-prog-pulse 2s ease infinite;
}
.tl-prog-label { font-size: 12px; color: var(--t2); }
.tl-prog-done .tl-prog-label { color: var(--t1); }

/* ── Result ─────────────────────────────────────────────────────────────────── */
.tl-result {
  display: flex; flex-direction: column; gap: 10px;
  margin-top: 8px;
  animation: tl-fadein .4s ease;
}

/* Report header */
.tl-report-hdr {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 0 2px 14px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px; gap: 12px; flex-wrap: wrap;
}
.tl-report-hdr-left { display: flex; flex-direction: column; gap: 4px; }
.tl-report-label {
  font-size: 10px; font-weight: 700; letter-spacing: .14em;
  text-transform: uppercase; color: var(--t3);
}
.tl-report-meta { font-size: 12px; color: var(--t3); line-height: 1.4; }
.tl-report-badges { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.tl-report-badge {
  font-size: 9px; font-weight: 800; letter-spacing: .1em;
  color: var(--green); background: rgba(31,203,122,.08);
  border: 1px solid rgba(31,203,122,.2);
  padding: 3px 9px; border-radius: 5px;
}
.tl-report-ts { font-size: 11px; color: var(--t3); font-variant-numeric: tabular-nums; }

/* Base card */
.tl-card {
  background: rgba(255,255,255,.025);
  border: 1px solid var(--border);
  border-radius: 14px; padding: 20px;
}
.tl-card-tag {
  font-size: 9px; font-weight: 700; letter-spacing: .12em;
  color: var(--t3); text-transform: uppercase; margin-bottom: 14px;
}

/* Score card */
.tl-card-score {}
.tl-score-risk-banner {
  font-size: clamp(28px, 6vw, 40px);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 18px;
  text-shadow: 0 0 32px currentColor;
  opacity: 0.92;
}
.tl-score-row {
  display: flex; align-items: flex-start; gap: 20px;
  margin-bottom: 14px; flex-wrap: wrap;
}
.tl-score-num {
  font-size: 72px; font-weight: 900;
  line-height: 1; letter-spacing: -0.04em;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.tl-score-right {
  flex: 1; display: flex; flex-direction: column; gap: 12px; padding-top: 6px;
}
.tl-score-badge {
  font-size: 12px; font-weight: 800; letter-spacing: .08em;
  padding: 5px 14px; border-radius: 7px; align-self: flex-start;
}
.tl-score-bar-wrap { display: flex; flex-direction: column; gap: 6px; }
.tl-score-bar-track {
  position: relative; height: 5px;
  background: rgba(255,255,255,.06); border-radius: 99px; overflow: visible;
}
.tl-score-bar-fill {
  height: 100%; border-radius: 99px;
  transition: width .8s cubic-bezier(.4,0,.2,1);
}
.tl-score-tick {
  position: absolute; top: -3px;
  width: 1px; height: 11px;
  background: rgba(255,255,255,.1);
  transform: translateX(-50%);
}
.tl-score-bar-labels {
  display: flex; justify-content: space-between;
  font-size: 9px; color: rgba(255,255,255,.15);
  font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
}
.tl-score-note {
  font-size: 11px; color: var(--t3); font-style: italic;
  line-height: 1.6; margin: 0;
  border-top: 1px solid rgba(255,255,255,.04); padding-top: 12px;
}

/* Metrics grid */
.tl-metrics-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.tl-metric-card {
  background: rgba(255,255,255,.02);
  border: 1px solid var(--border);
  border-radius: 12px; padding: 16px;
  display: flex; flex-direction: column; gap: 6px;
  transition: border-color .18s;
}
.tl-metric-card:hover { border-color: var(--bmd); }
.tl-metric-label {
  font-size: 10px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--t3);
}
.tl-metric-val {
  font-size: 26px; font-weight: 900; line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.tl-metric-badge {
  font-size: 10px; font-weight: 800; letter-spacing: .06em;
  padding: 3px 8px; border-radius: 5px;
}
.tl-metric-hint {
  font-size: 11px; color: var(--t3); line-height: 1.4;
}

/* Analysis cards */
.tl-card-risk {
  border-color: rgba(255,77,46,.15);
  background: rgba(255,77,46,.025);
}
.tl-card-risk .tl-card-tag { color: rgba(255,77,46,.45); }

.tl-card-scenario {
  border-color: rgba(255,255,255,.07);
}
.tl-card-scenario .tl-card-tag { color: var(--t3); }

.tl-card-blind {
  border-color: rgba(255,176,32,.15);
  background: rgba(255,176,32,.02);
}
.tl-card-blind .tl-card-tag { color: rgba(255,176,32,.45); }

.tl-card-final {
  border-color: rgba(255,176,32,.12);
  background: rgba(255,176,32,.02);
  display: flex; flex-direction: column; gap: 14px;
}
.tl-card-final .tl-card-tag { color: rgba(255,176,32,.4); }

.tl-card-text {
  font-size: 14px; color: var(--t2); line-height: 1.75; margin: 0;
}

.tl-bullets {
  list-style: none; display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0;
}
.tl-bullet {
  font-size: 14px; color: var(--t2);
  padding-left: 22px; position: relative; line-height: 1.65;
}
.tl-bullet::before {
  content: "—"; position: absolute; left: 0;
  color: var(--amber); font-weight: 700;
}

.tl-quote {
  font-size: 13px; font-style: italic; color: var(--amber);
  border-left: 2px solid rgba(255,176,32,.35);
  padding: 10px 14px; margin: 0;
  background: rgba(255,176,32,.04); border-radius: 0 8px 8px 0;
  line-height: 1.65;
}

.tl-final-note {
  font-size: 11px; color: var(--t3); font-style: italic; line-height: 1.6;
  border-top: 1px solid rgba(255,255,255,.04); padding-top: 14px; margin: 0;
}

/* Result actions */
.tl-result-actions {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding-top: 4px;
}
.tl-new-btn {
  background: transparent; border: 1px solid var(--border);
  border-radius: 10px; color: var(--t3);
  font-size: 13px; font-family: inherit;
  padding: 11px 18px; cursor: pointer; transition: all .15s;
}
.tl-new-btn:hover { border-color: var(--bmd); color: var(--t2); }
.tl-recharge-btn {
  font-size: 12px; font-weight: 700; color: var(--green);
  text-decoration: none; border: 1px solid rgba(31,203,122,.25);
  background: rgba(31,203,122,.06);
  padding: 10px 16px; border-radius: 10px;
  transition: all .15s;
}
.tl-recharge-btn:hover { background: rgba(31,203,122,.12); }

/* ── Tooltip ────────────────────────────────────────────────────────────────── */
.tl-tooltip-wrap {
  position: relative; display: inline-flex; align-items: center;
  margin-left: 6px; cursor: pointer; vertical-align: middle; outline: none;
}
.tl-info-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; border-radius: 50%;
  border: 1px solid #444; font-size: 9px; color: #555;
  font-weight: 700; line-height: 1;
  transition: border-color .15s, color .15s;
}
.tl-tooltip-wrap:hover .tl-info-icon,
.tl-tooltip-wrap:focus .tl-info-icon { border-color: #888; color: #aaa; }
.tl-tooltip {
  display: none; position: absolute;
  bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
  background: #1a1a1c; border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px; padding: 10px 12px;
  font-size: 12px; color: #aaa; line-height: 1.6; width: 240px;
  z-index: 300; font-weight: 400; pointer-events: none;
  box-shadow: 0 8px 24px rgba(0,0,0,.5);
  letter-spacing: 0; text-transform: none;
}
.tl-tooltip::after {
  content: ""; position: absolute; top: 100%; left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent; border-top-color: rgba(255,255,255,.1);
}
.tl-tooltip-wrap:hover .tl-tooltip,
.tl-tooltip-wrap:focus .tl-tooltip { display: block; }

/* ── Gate (paywall) ─────────────────────────────────────────────────────────── */
.tl-gate {
  position: relative; overflow: hidden;
  background: rgba(255,255,255,.02);
  border: 1px solid var(--border);
  border-radius: 20px; padding: 36px 28px 28px;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 0;
  animation: tl-fadein .3s ease;
}
.tl-gate-glow {
  position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
  width: 300px; height: 200px;
  background: radial-gradient(ellipse, rgba(31,203,122,.09) 0%, transparent 70%);
  pointer-events: none;
}
.tl-gate-icon {
  position: relative; z-index: 1;
  width: 52px; height: 52px; border-radius: 14px;
  background: rgba(31,203,122,.08); border: 1px solid rgba(31,203,122,.2);
  color: var(--green);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.tl-gate-body { position: relative; z-index: 1; }
.tl-gate-title {
  font-size: 22px; font-weight: 800; color: var(--t1);
  letter-spacing: -0.025em; margin: 0 0 10px;
}
.tl-gate-sub {
  font-size: 14px; color: var(--t2); line-height: 1.65;
  max-width: 360px; margin: 0 auto 20px;
}
.tl-gate-btn {
  display: inline-block; position: relative; z-index: 1;
  background: var(--t1); color: #050505;
  font-size: 14px; font-weight: 700; padding: 14px 26px;
  border-radius: 11px; text-decoration: none;
  transition: opacity .15s, transform .12s;
  box-shadow: 0 1px 0 rgba(255,255,255,.15) inset;
  margin-bottom: 20px;
}
.tl-gate-btn:hover { opacity: .88; transform: translateY(-1px); }
.tl-gate-feats {
  list-style: none; display: flex; flex-direction: column;
  gap: 8px; padding: 0; margin: 0 auto 20px;
  text-align: left; max-width: 240px;
}
.tl-gate-feats li { font-size: 13px; color: var(--t2); }
.tl-gate-check { color: var(--green); font-weight: 700; margin-right: 6px; }
.tl-gate-price {
  display: flex; align-items: baseline; gap: 10px;
  justify-content: center; margin-bottom: 10px;
}
.tl-gate-price-old {
  font-size: 14px; color: var(--t3);
  text-decoration: line-through; font-weight: 600;
}
.tl-gate-price-real {
  font-size: 28px; font-weight: 900; color: var(--t1); letter-spacing: -.03em;
}
.tl-gate-payment-note {
  font-size: 11px; color: var(--t3); margin: 4px 0 0; text-align: center;
}
.tl-gate-divider {
  display: flex; align-items: center; gap: 12px;
  width: 100%; margin: 8px 0 16px;
}
.tl-gate-divider::before,
.tl-gate-divider::after { content: ""; flex: 1; height: 1px; background: rgba(255,255,255,.06); }
.tl-gate-divider span { font-size: 12px; color: var(--t3); white-space: nowrap; }
.tl-token-form { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.tl-token-input { font-size: 13px; text-align: center; letter-spacing: .02em; }
.tl-token-err   { font-size: 12px; color: #ef4444; margin: 0; }
.tl-token-btn {
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px; color: #9ca3af;
  font-size: 13px; font-weight: 600; font-family: inherit;
  padding: 11px; cursor: pointer; transition: all .15s;
}
.tl-token-btn:hover:not(:disabled) {
  background: rgba(255,255,255,.08); color: var(--t1);
  border-color: rgba(255,255,255,.14);
}
.tl-token-btn:disabled { opacity: .5; cursor: default; }

/* ── History ────────────────────────────────────────────────────────────────── */
.tl-history {
  margin-top: 32px;
  border: 1px solid var(--border); border-radius: 16px;
  overflow: hidden;
}
.tl-history-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  background: rgba(255,255,255,.015);
  border-bottom: 1px solid var(--border);
}
.tl-history-title {
  font-size: 11px; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: var(--t3);
}
.tl-history-clear {
  font-size: 11px; color: var(--t3); background: none; border: none;
  cursor: pointer; text-decoration: underline; text-underline-offset: 3px;
  transition: color .15s; padding: 0;
}
.tl-history-clear:hover { color: var(--t2); }
.tl-history-row {
  display: grid;
  grid-template-columns: 44px 1fr auto auto;
  gap: 12px; align-items: center;
  padding: 13px 18px;
  border-bottom: 1px solid var(--border);
  transition: background .15s;
}
.tl-history-row:last-child { border-bottom: none; }
.tl-history-row:hover { background: rgba(255,255,255,.015); }
.tl-history-score {
  font-size: 22px; font-weight: 900; line-height: 1;
  letter-spacing: -0.03em; font-variant-numeric: tabular-nums;
}
.tl-history-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.tl-history-jogo {
  font-size: 13px; font-weight: 600; color: var(--t1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tl-history-meta { font-size: 11px; color: var(--t3); }
.tl-history-label {
  font-size: 10px; font-weight: 800; letter-spacing: .06em;
  text-align: right; white-space: nowrap;
}
.tl-history-date { font-size: 10px; color: var(--t3); white-space: nowrap; }

/* ── Footer compacto ────────────────────────────────────────────────────────── */
.tl-footer {
  background: var(--bg2); border-top: 1px solid var(--border);
  padding: 20px 24px; text-align: center;
}
.tl-footer-text {
  font-size: 11px; color: var(--t3); line-height: 1.65; margin: 0 0 8px;
  max-width: 520px; margin-left: auto; margin-right: auto;
}
.tl-footer-links {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; flex-wrap: wrap;
  font-size: 11px; color: var(--t3);
}
.tl-footer-links a { color: var(--t3); text-decoration: underline; text-underline-offset: 3px; }
.tl-footer-links a:hover { color: var(--t2); }

/* ── Mobile ─────────────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .tl-header { padding: 0 16px; height: 52px; }
  .tl-logo-status { display: none; }
  .tl-header-back { display: none; }

  .tl-wrap { padding: 0 16px 60px; }

  .tl-hero { padding: 40px 0 28px; }
  .tl-hero-title { font-size: clamp(26px, 8vw, 36px); }

  .tl-form-header { padding: 15px 18px 13px; }
  .tl-form-card > .tl-field  { padding-left: 18px; padding-right: 18px; margin-top: 16px; }
  .tl-form-card > .tl-row-2  { padding-left: 18px; padding-right: 18px; margin-top: 16px; }
  .tl-form-card > .tl-microcopy { padding-left: 18px; padding-right: 18px; margin-top: 10px; }
  .tl-form-card > .tl-err   { padding-left: 18px; padding-right: 18px; margin-top: 10px; }
  .tl-form-card > .tl-btn   { margin: 18px 18px 20px; width: calc(100% - 36px); }

  .tl-row-2 { grid-template-columns: 1fr; gap: 16px; }

  .tl-metrics-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
  .tl-metric-val   { font-size: 22px; }
  .tl-metric-card  { padding: 13px; }

  .tl-score-num { font-size: 56px; }
  .tl-score-risk-banner { font-size: 26px; margin-bottom: 14px; }
  .tl-card { padding: 16px; }

  .tl-gate { padding: 28px 20px 22px; }

  .tl-loading-panel { padding: 28px 20px 22px; }

  .tl-history-row {
    grid-template-columns: 38px 1fr auto;
    grid-template-rows: auto auto;
  }
  .tl-history-score { grid-row: 1 / 3; font-size: 20px; }
  .tl-history-date  { grid-column: 3; font-size: 9px; }
  .tl-history-label { grid-column: 3; grid-row: 2; font-size: 9px; }

  .tl-trust-pill { font-size: 10px; padding: 3px 8px; }
  .tl-trust-row  { gap: 6px; }

  .tl-result-actions { gap: 8px; }
  .tl-new-btn { font-size: 12px; padding: 10px 14px; }
}

@media (max-width: 400px) {
  .tl-credits-pill .tl-credits-label { display: none; }
  .tl-metrics-grid { grid-template-columns: 1fr; }
  .tl-history-row { grid-template-columns: 38px 1fr; }
  .tl-history-date, .tl-history-label { display: none; }
}
`;export{Ee as default};
