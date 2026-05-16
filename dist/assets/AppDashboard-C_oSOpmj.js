import{r as s,j as e}from"./vendor-BnG4zNoI.js";import"./landing-BVTIqeJr.js";const $e=["Resultado da partida","Mais ou menos gols","Ambos marcam","Handicap","Empate devolve","Chance dupla","Primeiro gol","Escanteios","Cartões","Múltipla"],Be=["Brasileirão","Libertadores","Champions","Premier League","La Liga","Copa do Brasil","Série B"],Z={"Resultado da partida":"1.85","Mais ou menos gols":"1.90","Ambos marcam":"1.95",Handicap:"2.10","Empate devolve":"1.65","Chance dupla":"1.40","Primeiro gol":"3.50",Escanteios:"1.90",Cartões:"1.85",Múltipla:"4.00"},P=[{label:"Analisando odd informada",pct:16},{label:"Calculando chance estimada",pct:32},{label:"Medindo exposição da banca",pct:52},{label:"Avaliando retorno esperado",pct:70},{label:"Gerando leitura da IA",pct:86},{label:"Compilando painel de análise",pct:96}],W="motoria_token",je="motoria_hist_v2",ue=8,Pe="https://pay.kiwify.com.br/DIVD8zl";function ae(t){return 1/t*100}function We(t){return t<=1.4?4:t<=1.7?4.8:t<=2.2?5.5:t<=3?6.5:8}function Ye(t,o){return t/100*(o-1)*100-(1-t/100)*100}function fe(t){const o=ae(t),l=Math.min(100,Math.round(100-o));let h,x,g;return l<=30?(h="BAIXO",x="#22C55E",g="FAVORÁVEL"):l<=60?(h="MODERADO",x="#F59E0B",g="NEUTRO"):l<=80?(h="ALTO",x="#F97316",g="DESFAVORÁVEL"):(h="CRÍTICO",x="#EF4444",g="DESFAVORÁVEL"),{score:l,label:h,color:x,verdict:g}}function M(t,o){const l=t.match(new RegExp(`^${o}:[^\\n]*\\n([\\s\\S]*?)(?=\\n[A-Z_]{3,}:|$)`,"m")),h=t.match(new RegExp(`^${o}:\\s*(.+)`,"m"));return(l?l[1].trim():null)||(h?h[1].trim():null)}function He(t){return{riscoPrincipal:M(t,"RISCO_PRINCIPAL"),cenarioNecessario:M(t,"CENARIO_NECESSARIO"),oQuePodeDarErrado:M(t,"O_QUE_PODE_DAR_ERRADO"),leituraConservadora:M(t,"LEITURA_CONSERVADORA"),alertaFinal:M(t,"ALERTA_FINAL")}}function _e(){try{return JSON.parse(localStorage.getItem(je)||"[]")}catch{return[]}}function Ue(t){try{localStorage.setItem(je,JSON.stringify(t))}catch{}}function Ge(t){return t.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}function Je(){return new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}function Y(t){const o=(t||"").toLowerCase();return o.includes("serie b")||o.includes("série b")?"Série B":o.includes("brasileir")||o.includes("brazil")&&o.includes("serie a")?"Brasileirão":o.includes("libertad")?"Libertadores":o.includes("champions")?"Champions":o.includes("premier league")?"Premier League":o.includes("la liga")||o.includes("laliga")||o.includes("primera division")?"La Liga":o.includes("copa do brasil")?"Copa do Brasil":o.includes("bundesliga")?"Bundesliga":o.includes("ligue 1")?"Ligue 1":""}const Ke=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("rect",{x:"1.5",y:"1.5",width:"4.5",height:"4.5",rx:"1.2",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("rect",{x:"8",y:"1.5",width:"4.5",height:"4.5",rx:"1.2",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("rect",{x:"1.5",y:"8",width:"4.5",height:"4.5",rx:"1.2",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("rect",{x:"8",y:"8",width:"4.5",height:"4.5",rx:"1.2",stroke:"currentColor",strokeWidth:"1.3"})]}),Qe=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("path",{d:"M2 11L5 7.5L8 9.5L12 3.5",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round",strokeLinejoin:"round"}),e.jsx("circle",{cx:"5",cy:"7.5",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"8",cy:"9.5",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"12",cy:"3.5",r:"1",fill:"currentColor"})]}),qe=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("path",{d:"M2 10V6M5 10V4M8 10V7M11 10V3",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round"}),e.jsx("path",{d:"M1 12.5h12",stroke:"currentColor",strokeWidth:"1.2",strokeLinecap:"round",opacity:".4"})]}),Xe=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("circle",{cx:"7",cy:"7",r:"2",fill:"currentColor",fillOpacity:".9"}),e.jsx("path",{d:"M3.5 3.5a5 5 0 0 0 0 7M10.5 3.5a5 5 0 0 1 0 7",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"})]}),Ze=()=>e.jsx("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M7 1.5l1.5 3.2L12 5.3l-2.5 2.4.6 3.4L7 9.5l-3.1 1.6.6-3.4L2 5.3l3.5-.6L7 1.5z",stroke:"currentColor",strokeWidth:"1.3",strokeLinejoin:"round"})}),ea=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("circle",{cx:"7",cy:"7",r:"5",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M7 4.5V7L8.8 8.8",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"})]}),aa=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("circle",{cx:"7",cy:"7",r:"2",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M7 1v2M7 11v2M1 7h2M11 7h2M3.22 3.22l1.41 1.41M9.37 9.37l1.41 1.41M3.22 10.78l1.41-1.41M9.37 4.63l1.41-1.41",stroke:"currentColor",strokeWidth:"1.2",strokeLinecap:"round"})]}),ra=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("rect",{x:"1.5",y:"3",width:"11",height:"9.5",rx:"1.5",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M1.5 6h11",stroke:"currentColor",strokeWidth:"1.2"}),e.jsx("path",{d:"M4.5 1.5V4M9.5 1.5V4",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round"}),e.jsx("circle",{cx:"4.5",cy:"9",r:".9",fill:"currentColor",opacity:".55"}),e.jsx("circle",{cx:"7",cy:"9",r:".9",fill:"currentColor",opacity:".55"}),e.jsx("circle",{cx:"9.5",cy:"9",r:".9",fill:"currentColor",opacity:".55"})]});function ee({mod:t,title:o,desc:l}){return e.jsxs("div",{className:"ap-content",children:[e.jsx("div",{className:"ap-panel-hdr",children:e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:t}),e.jsx("div",{className:"ap-panel-title",children:o})]})}),e.jsxs("div",{className:"ap-coming-panel",children:[e.jsx("div",{className:"ap-coming-icon","aria-hidden":"true",children:e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 22 22",fill:"none",children:[e.jsx("rect",{x:"1.5",y:"1.5",width:"19",height:"19",rx:"5",stroke:"rgba(255,255,255,.1)",strokeWidth:"1.5"}),e.jsx("path",{d:"M8 11h6M11 8v6",stroke:"rgba(255,255,255,.15)",strokeWidth:"1.5",strokeLinecap:"round"})]})}),e.jsx("p",{className:"ap-coming-desc",children:l}),e.jsx("div",{className:"ap-coming-tag",children:"Em desenvolvimento · Próxima versão"})]})]})}function ta(t){return t<=30?"Exposição dentro do esperado.":t<=55?"Cenário exige atenção. Revise antes de confirmar.":t<=75?"Risco acima do ideal. Melhor rever o valor.":"Exposição muito alta. Cautela recomendada."}function ia(t){return t<=30?{text:"Cenário equilibrado",color:"#22C55E",sub:"Exposição dentro do esperado para o perfil."}:t<=55?{text:"Ok com cautela",color:"#F59E0B",sub:"Revise o valor apostado antes de confirmar."}:t<=75?{text:"Risco elevado",color:"#F97316",sub:"Cenário menos favorável. Exposição acima do ideal."}:{text:"Exposição agressiva",color:"#EF4444",sub:"Risco alto. Melhor revisar banca e odd."}}function ve({id:t,options:o,value:l,onChange:h,placeholder:x}){const[g,d]=s.useState(!1),C=s.useRef(null);return s.useEffect(()=>{if(!g)return;function p(v){v.key==="Escape"&&d(!1)}function j(v){C.current&&!C.current.contains(v.target)&&d(!1)}return document.addEventListener("keydown",p),document.addEventListener("mousedown",j),()=>{document.removeEventListener("keydown",p),document.removeEventListener("mousedown",j)}},[g]),e.jsxs("div",{className:"sel-wrap",ref:C,children:[e.jsxs("button",{id:t,type:"button",className:`sel-trigger${g?" sel-trigger-open":""}`,onClick:()=>d(p=>!p),"aria-haspopup":"listbox","aria-expanded":g,children:[e.jsx("span",{className:`sel-val${x&&!o.includes(l)?" sel-placeholder":""}`,children:x&&!o.includes(l)?x:l}),e.jsx("span",{className:`sel-chev${g?" sel-chev-up":""}`,"aria-hidden":"true",children:e.jsx("svg",{width:"10",height:"10",viewBox:"0 0 12 12",fill:"none",children:e.jsx("path",{d:"M2.5 4.5L6 8L9.5 4.5",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round"})})})]}),g&&e.jsxs("ul",{className:"sel-list",role:"listbox","aria-label":x||"Opções",children:[x&&e.jsxs("li",{role:"option","aria-selected":!o.includes(l),className:`sel-opt${o.includes(l)?"":" sel-opt-on"}`,onMouseDown:p=>p.preventDefault(),onClick:()=>{h(""),d(!1)},children:[e.jsx("span",{className:"sel-check","aria-hidden":"true",children:!o.includes(l)&&e.jsx("svg",{width:"9",height:"9",viewBox:"0 0 12 12",fill:"none",children:e.jsx("path",{d:"M2.5 6L5 8.5L9.5 3.5",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round"})})}),e.jsx("span",{className:"sel-opt-text sel-opt-dim",children:x})]}),o.map(p=>e.jsxs("li",{role:"option","aria-selected":p===l,className:`sel-opt${p===l?" sel-opt-on":""}`,onMouseDown:j=>j.preventDefault(),onClick:()=>{h(p),d(!1)},children:[e.jsx("span",{className:"sel-check","aria-hidden":"true",children:p===l&&e.jsx("svg",{width:"9",height:"9",viewBox:"0 0 12 12",fill:"none",children:e.jsx("path",{d:"M2.5 6L5 8.5L9.5 3.5",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round"})})}),e.jsx("span",{className:"sel-opt-text",children:p})]},p))]})]})}function la(){s.useEffect(()=>{const a=document.title;return document.title="MotorIA Risk Engine™",()=>{document.title=a}},[]);const[t,o]=s.useState(new Date);s.useEffect(()=>{const a=setInterval(()=>o(new Date),1e3);return()=>clearInterval(a)},[]);const[l,h]=s.useState(!1);s.useEffect(()=>{try{const a=new URLSearchParams(window.location.search),i=a.get("t")||a.get("token");if(i&&i.length>10){localStorage.setItem(W,i),G(i),h(!0),window.history.replaceState(null,"",window.location.pathname);const c=setTimeout(()=>h(!1),4200);return()=>clearTimeout(c)}}catch{}},[]);const[x,g]=s.useState(!1),[d,C]=s.useState("nova");function p(a){C(a),g(!1)}const[j,v]=s.useState(""),[re,O]=s.useState(""),[N,we]=s.useState("Resultado da partida"),[E,R]=s.useState(""),[H,te]=s.useState(""),[ye,Ne]=s.useState(""),[D,F]=s.useState(!1),[S,ie]=s.useState(0),[T,_]=s.useState(0),[oe,A]=s.useState(""),[n,V]=s.useState(null),[b,ke]=s.useState(_e),[U,G]=s.useState(()=>localStorage.getItem(W)||""),[se,ze]=s.useState(null),[ne,Ce]=s.useState(null),[w,Ee]=s.useState([]),[L,J]=s.useState(!1),[$,le]=s.useState(""),[pe,Se]=s.useState(null),[m,K]=s.useState(null),[B,Ae]=s.useState("todos");function Q(){J(!0),le(""),fetch("/api/matches").then(a=>a.json()).then(a=>{Ee(a.matches||[]),Se(a.updatedAt?new Date(a.updatedAt):new Date),J(!1)}).catch(()=>{le("Não foi possível carregar as partidas. Verifique sua conexão."),J(!1)})}s.useEffect(()=>{d==="jogos"&&(w.length>0&&!$||Q())},[d]);const f=parseFloat((E||"").replace(",",".")),q=E&&!isNaN(f)&&f>=1.01?fe(f):null,I=b.length?Math.round(b.reduce((a,i)=>a+(i.score||0),0)/b.length):null,de=b[0]||null;async function Le(a){if(a.preventDefault(),!E||isNaN(f)||f<1.01){A("Informe uma odd válida (mínimo 1.01).");return}F(!0),A(""),V(null),ie(0),_(P[0].pct);let i=0;const c=setInterval(()=>{i=Math.min(i+1,P.length-1),ie(i),_(P[i].pct)},820);try{const k=`Aposta: ${j||"não informado"} | Campeonato: ${re||"não informado"} | Tipo: ${N} | Odd: ${E} | Valor: R$${H||"100"} | Obs: ${ye||"nenhuma"}`,r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json",...U?{"x-motoria-token":U}:{}},body:JSON.stringify({tool:"chance_de_perder",userMessage:k})});if(clearInterval(c),r.status===402){window.location.href=Pe;return}if(!r.ok){const Ve=await r.json().catch(()=>({}));A(Ve.error||"Erro ao processar análise."),F(!1);return}const u=await r.json(),z=u.content?.[0]?.text||"";u.credits!==void 0&&ze(u.credits),u.token&&(localStorage.setItem(W,u.token),G(u.token));const y=ae(f),ge=We(f),Re=y/(1-ge/100),me=Math.min(Re,99),De=Ye(y,f),Fe=fe(f),Te=Math.min(100,Math.round((100-me)*1.1)),he=parseFloat(H)||100,X={id:Math.floor(Math.random()*8e3)+2e3,ts:Je(),jogo:j||"Aposta",tipo:N,odd:f,impl:y.toFixed(2),justa:me.toFixed(2),vig:ge.toFixed(2),ev:De.toFixed(2),perda:(100-y).toFixed(1),exposure:Te,valorAposta:he,valorRisco:(he*(100-y)/100).toFixed(2),...Fe,ai:He(z)};V(X),Ce(X.id);const be=[X,...b].slice(0,ue);ke(be),Ue(be),_(100),setTimeout(()=>F(!1),280)}catch{clearInterval(c),A("Erro de conexão. Tente novamente."),F(!1)}}function ce(a){V(a),v(a.jogo||""),R(String(a.odd)),C("nova")}function xe(){V(null),A(""),v(""),R(""),te(""),Ne(""),O(""),K(null)}function Ie(a){const i=Y(a.league);v(`${a.home} × ${a.away}`),O(i),K({...a,campeonato:i}),p("nova")}function Me(a){const i=a.label==="CRÍTICO"?"MUITO ALTO":a.label,c=a.ai?.alertaFinal||a.ai?.leituraConservadora||"",k=[`MotorIA Pro · Análise #${a.id}`,`${a.jogo} | ${a.tipo} | Odd ${a.odd.toFixed(2)}`,"",`Risco da Aposta: ${a.score}/100 · ${i}`,`Chance Estimada: ${a.impl}%`,a.valorRisco?`Valor em Risco: R$ ${a.valorRisco}`:null,c?`Leitura da IA: "${c}"`:null,"","Análise educativa. Não representa garantia de resultado."].filter(Boolean).join(`
`);navigator.clipboard.writeText(k).catch(()=>{})}const Oe=[{group:"ANÁLISE",items:[{id:"jogos",label:"Jogos de Hoje",Icon:ra},{id:"nova",label:"Nova Análise",Icon:Qe},{id:"geral",label:"Visão Geral",Icon:Ke},{id:"comparador",label:"Comparador",Icon:qe,dim:!0}]},{group:"MERCADOS",items:[{id:"aovivo",label:"Ao Vivo",Icon:Xe,live:!0,dim:!0},{id:"favoritos",label:"Favoritos",Icon:Ze,dim:!0}]},{group:"ARQUIVO",items:[{id:"historico",label:"Histórico",Icon:ea,badge:b.length||null}]},{group:"SISTEMA",items:[{id:"config",label:"Configurações",Icon:aa}]}];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:oa}),x&&e.jsx("div",{className:"ap-overlay",onClick:()=>g(!1),"aria-hidden":"true"}),l&&e.jsxs("div",{className:"ap-access-banner",role:"status","aria-live":"polite",children:[e.jsx("span",{className:"ap-access-banner-dot","aria-hidden":"true"}),"Acesso ativado — plataforma pronta para uso"]}),e.jsxs("div",{className:"ap-shell",children:[e.jsx("header",{className:"ap-topbar",children:e.jsxs("div",{className:"ap-topbar-row",children:[e.jsxs("div",{className:"ap-topbar-left",children:[e.jsxs("button",{className:"ap-hamburger",onClick:()=>g(a=>!a),"aria-label":"Menu","aria-expanded":x,children:[e.jsx("span",{}),e.jsx("span",{}),e.jsx("span",{})]}),e.jsxs("div",{className:"ap-topbar-brand",children:[e.jsx("div",{className:"ap-logo-mark","aria-hidden":"true",children:e.jsxs("svg",{width:"10",height:"10",viewBox:"0 0 14 14",fill:"none",children:[e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"#060608"}),e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"currentColor",fillOpacity:".95"})]})}),e.jsx("span",{className:"ap-topbar-name",children:"MotorIA"}),e.jsx("span",{className:"ap-topbar-sep","aria-hidden":"true",children:"·"}),e.jsx("span",{className:"ap-topbar-tag",children:"Risk Engine™"})]})]}),e.jsxs("div",{className:"ap-topbar-center",children:[e.jsx("span",{className:"ap-topbar-clock",children:Ge(t)}),ne&&e.jsxs("span",{className:"ap-topbar-aid",children:[" · #",ne]})]}),e.jsxs("div",{className:"ap-topbar-right",children:[se!==null&&e.jsx("div",{className:"ap-credits-wrap",title:"Créditos restantes",children:e.jsx("div",{className:"ap-credits-bar",children:e.jsx("div",{className:"ap-credits-fill",style:{width:`${Math.max(0,se/20*100)}%`}})})}),e.jsxs("div",{className:"ap-engine-live",children:[e.jsx("span",{className:"ap-live-dot","aria-hidden":"true"}),e.jsx("span",{className:"ap-live-lbl",children:"IA ONLINE"})]})]})]})}),e.jsxs("div",{className:"ap-body",children:[e.jsxs("nav",{className:`ap-sidebar${x?" ap-sidebar-open":""}`,"aria-label":"Navegação",children:[e.jsxs("div",{className:"ap-sidebar-brand",children:[e.jsx("div",{className:"ap-sidebar-brand-mark","aria-hidden":"true",children:e.jsx("svg",{width:"9",height:"9",viewBox:"0 0 14 14",fill:"none",children:e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"#22C55E"})})}),e.jsx("span",{className:"ap-sidebar-brand-name",children:"MotorIA Pro"})]}),e.jsx("div",{className:"ap-sidebar-divider",role:"separator"}),Oe.map(({group:a,items:i})=>e.jsxs("div",{className:"ap-sidebar-group",children:[e.jsx("div",{className:"ap-sidebar-group-lbl",children:a}),i.map(({id:c,label:k,Icon:r,badge:u,live:z,dim:y})=>e.jsxs("button",{className:`ap-nav-item${d===c?" ap-nav-active":""}${y?" ap-nav-dim":""}`,onClick:()=>p(c),"aria-current":d===c?"page":void 0,children:[e.jsx("span",{className:"ap-nav-icon",children:e.jsx(r,{})}),e.jsx("span",{className:"ap-nav-label",children:k}),z&&e.jsx("span",{className:"ap-nav-live-dot","aria-label":"ao vivo"}),u>0&&!z&&e.jsx("span",{className:"ap-nav-badge","aria-label":`${u} itens`,children:u}),y&&!z&&e.jsx("span",{className:"ap-nav-soon","aria-label":"em breve",children:e.jsxs("svg",{width:"8",height:"8",viewBox:"0 0 10 10",fill:"none",children:[e.jsx("path",{d:"M5 2v3.5M5 7v.5",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round"}),e.jsx("circle",{cx:"5",cy:"5",r:"4",stroke:"currentColor",strokeWidth:"1.2",opacity:".5"})]})})]},c))]},a)),e.jsxs("div",{className:"ap-sidebar-engine",children:[e.jsx("div",{className:"ap-sidebar-engine-dot","aria-hidden":"true"}),e.jsxs("div",{className:"ap-sidebar-engine-info",children:[e.jsx("span",{className:"ap-sidebar-engine-name",children:"RISK ENGINE v2.4"}),e.jsx("span",{className:"ap-sidebar-engine-status",children:"ONLINE"})]})]})]}),e.jsxs("main",{className:"ap-main",children:[d==="geral"&&e.jsxs("div",{className:"ap-content",children:[e.jsxs("div",{className:"ap-panel-hdr",children:[e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:"MÓDULO I"}),e.jsx("div",{className:"ap-panel-title",children:"Visão Geral"})]}),e.jsxs("div",{className:"ap-panel-online",children:[e.jsx("span",{className:"ap-status-dot","aria-hidden":"true"}),"SISTEMA ONLINE"]})]}),e.jsxs("div",{className:"ap-geral-stats",children:[e.jsxs("div",{className:"ap-geral-stat",children:[e.jsx("div",{className:"ap-geral-stat-val",children:b.length}),e.jsx("div",{className:"ap-geral-stat-lbl",children:"ANÁLISES"})]}),e.jsxs("div",{className:"ap-geral-stat",children:[e.jsx("div",{className:"ap-geral-stat-val",style:{color:I!==null?I>60?"#EF4444":I>40?"#F59E0B":"#22C55E":"var(--t3)"},children:I!==null?I:"—"}),e.jsx("div",{className:"ap-geral-stat-lbl",children:"SCORE MÉDIO"})]}),e.jsxs("div",{className:"ap-geral-stat",children:[e.jsx("div",{className:"ap-geral-stat-val",children:de?de.odd.toFixed(2):"—"}),e.jsx("div",{className:"ap-geral-stat-lbl",children:"ÚLTIMA ODD"})]}),e.jsxs("div",{className:"ap-geral-stat",children:[e.jsx("div",{className:"ap-geral-stat-val ap-geral-stat-val-sm",children:"v2.4"}),e.jsx("div",{className:"ap-geral-stat-lbl",children:"ENGINE"})]})]}),e.jsxs("div",{className:"ap-geral-action",children:[e.jsxs("div",{className:"ap-geral-action-left",children:[e.jsx("div",{className:"ap-geral-action-title",children:"Iniciar nova análise quantitativa"}),e.jsx("div",{className:"ap-geral-action-sub",children:"MOTORIA RISK INDEX™ · Probabilidade · EV · Exposição"})]}),e.jsxs("button",{className:"ap-geral-btn",onClick:()=>p("nova"),children:["Analisar",e.jsx("svg",{width:"11",height:"11",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round"})})]})]}),b.length>0&&e.jsxs("div",{className:"ap-geral-recent",children:[e.jsx("div",{className:"ap-geral-recent-hdr",children:"ANÁLISES RECENTES"}),e.jsx("div",{className:"ap-geral-recent-list",children:b.slice(0,4).map((a,i)=>e.jsxs("button",{className:"ap-geral-recent-row",onClick:()=>ce(a),children:[e.jsxs("span",{className:"ap-geral-recent-id",children:["#",a.id]}),e.jsx("span",{className:"ap-geral-recent-event",children:a.jogo||"Aposta"}),e.jsxs("span",{className:"ap-geral-recent-odd",children:["Odd ",a.odd]}),e.jsx("div",{className:"ap-geral-recent-bar",children:e.jsx("div",{style:{width:`${a.score}%`,background:a.color,height:"100%",borderRadius:99}})}),e.jsx("span",{className:"ap-geral-recent-score",style:{color:a.color},children:a.score}),e.jsx("span",{className:"ap-geral-recent-tag",style:{color:a.color},children:a.label})]},i))})]}),b.length===0&&e.jsxs("div",{className:"ap-geral-empty",children:[e.jsx("p",{children:"Nenhuma análise registrada ainda."}),e.jsx("button",{className:"ap-geral-btn",onClick:()=>p("nova"),children:"Iniciar primeira análise →"})]})]},"geral"),d==="nova"&&e.jsxs("div",{className:"ap-content ap-content-nova",children:[m&&!n&&!D&&e.jsxs("div",{className:`ap-game-strip${m.status==="live"?" ap-game-strip-live":""}`,children:[e.jsx("span",{className:`ap-game-strip-dot${m.status==="live"?" ap-gsd-live":""}`,"aria-hidden":"true"}),e.jsxs("span",{className:"ap-game-strip-text",children:[m.home," × ",m.away]}),m.campeonato&&e.jsx("span",{className:"ap-game-strip-league",children:m.campeonato}),m.status==="live"?e.jsxs("span",{className:"ap-gsd-live-badge",children:["AO VIVO",m.elapsed?` · ${m.elapsed}'`:""]}):m.time?e.jsx("span",{className:"ap-game-strip-time",children:m.time}):null,e.jsx("button",{className:"ap-game-strip-clear",onClick:()=>{K(null),v(""),O("")},"aria-label":"Remover jogo selecionado",type:"button",children:"×"})]}),!n&&!D&&e.jsx("section",{className:"ap-input-panel",children:e.jsxs("form",{className:"ap-form",onSubmit:Le,noValidate:!0,children:[e.jsxs("div",{className:"ap-row-2",children:[e.jsxs("div",{className:"ap-field",children:[e.jsx("label",{className:"ap-label",htmlFor:"odd-input",children:"ODD"}),e.jsx("input",{id:"odd-input",className:"ap-input ap-input-odd",type:"text",placeholder:"2.80",value:E,onChange:a=>R(a.target.value),inputMode:"decimal",autoComplete:"off"}),q&&e.jsxs("div",{className:"ap-odd-preview",style:{color:q.color},children:[e.jsx("span",{children:q.label}),e.jsx("span",{className:"ap-odd-preview-sep",children:"·"}),e.jsxs("span",{children:["chance ",ae(f).toFixed(0),"%"]})]})]}),e.jsxs("div",{className:"ap-field",children:[e.jsx("label",{className:"ap-label",htmlFor:"valor-input",children:"QUANTO VAI APOSTAR?"}),e.jsx("input",{id:"valor-input",className:"ap-input",type:"text",placeholder:"R$ 100",value:H,onChange:a=>te(a.target.value),inputMode:"decimal",autoComplete:"off"})]})]}),e.jsxs("div",{className:"ap-field",children:[e.jsx("label",{className:"ap-label",htmlFor:"tipo-input",children:"TIPO DE APOSTA"}),e.jsx(ve,{id:"tipo-input",options:$e,value:N,onChange:we})]}),m&&Z[N]&&!E&&e.jsxs("div",{className:"ap-odd-sug",children:[e.jsx("span",{className:"ap-odd-sug-icon","aria-hidden":"true",children:"💡"}),e.jsxs("span",{className:"ap-odd-sug-text",children:["Odd referência para ",e.jsx("em",{children:N}),":"," ",e.jsx("strong",{children:Z[N]})]}),e.jsx("button",{type:"button",className:"ap-odd-sug-btn",onClick:()=>R(Z[N]),children:"Usar"})]}),e.jsxs("div",{className:"ap-row-2 ap-row-secondary",children:[e.jsxs("div",{className:"ap-field",children:[e.jsx("label",{className:"ap-label ap-label-dim",htmlFor:"camp-input",children:"CAMPEONATO"}),e.jsx(ve,{id:"camp-input",options:Be,value:re,onChange:O,placeholder:"Selecionar"})]}),e.jsxs("div",{className:"ap-field",children:[e.jsx("label",{className:"ap-label ap-label-dim",htmlFor:"jogo-input",children:"PARTIDA"}),e.jsx("input",{id:"jogo-input",className:"ap-input",type:"text",placeholder:"Ex: Flamengo × Palmeiras",value:j,onChange:a=>v(a.target.value),autoComplete:"off"})]})]}),oe&&e.jsx("div",{className:"ap-error",role:"alert",children:oe}),e.jsx("button",{className:"ap-submit",type:"submit",children:"INICIAR ANÁLISE →"})]})}),D&&e.jsxs("div",{className:"ap-loading",role:"status","aria-live":"polite",children:[e.jsxs("div",{className:"ap-loading-hdr",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"ap-loading-engine",children:["RISK ENGINE v2.4",e.jsx("span",{className:"ap-loading-engine-dot","aria-hidden":"true"})]}),m?e.jsxs("div",{className:"ap-loading-sub ap-loading-sub-game",children:[m.home," × ",m.away]}):e.jsx("div",{className:"ap-loading-sub",children:"Processamento quantitativo em execução"})]}),e.jsx("span",{className:"ap-loading-status",children:"CALCULANDO"})]}),e.jsxs("div",{className:"ap-loading-bar-wrap",children:[e.jsx("div",{className:"ap-loading-bar",style:{width:`${T}%`}}),e.jsx("div",{className:"ap-loading-bar-glow",style:{left:`${T}%`}})]}),e.jsxs("div",{className:"ap-loading-pct","aria-label":`${T}%`,children:[T,e.jsx("span",{className:"ap-loading-pct-sym",children:"%"})]}),e.jsx("div",{className:"ap-loading-steps",children:P.map((a,i)=>e.jsxs("div",{className:`ap-lstep${i<S?" ap-lstep-done":i===S?" ap-lstep-active":""}`,children:[e.jsx("span",{className:"ap-lstep-icon","aria-hidden":"true",children:i<S?"✓":i===S?"▶":"○"}),e.jsx("span",{className:"ap-lstep-lbl",children:a.label}),i===S&&e.jsx("span",{className:"ap-lstep-cursor","aria-hidden":"true",children:"_"}),i<S&&e.jsx("span",{className:"ap-lstep-done-tag",children:"OK"})]},i))})]}),n&&!D&&(()=>{const a=ia(n.score),i=n.label==="CRÍTICO"?"MUITO ALTO":n.label,c=n.ai?.alertaFinal||n.ai?.leituraConservadora||a.sub;return e.jsxs("div",{className:"db-output",role:"region","aria-label":"Resultado da análise",children:[e.jsxs("div",{className:"db-topbar",children:[e.jsxs("div",{className:"db-topbar-meta",children:[e.jsxs("span",{className:"db-id",children:["#",n.id]}),e.jsx("span",{className:"db-sep","aria-hidden":"true",children:"·"}),e.jsx("span",{className:"db-ts",children:n.ts}),e.jsx("span",{className:"db-sep","aria-hidden":"true",children:"·"}),e.jsxs("span",{className:"db-ai-badge",children:[e.jsx("span",{className:"db-ai-dot","aria-hidden":"true"}),"IA ativa"]})]}),e.jsx("button",{className:"db-btn-ghost",onClick:xe,"aria-label":"Nova análise",children:"Nova análise →"})]}),e.jsxs("div",{className:"db-result-card",children:[e.jsxs("div",{className:"db-rc-header",children:[e.jsx("div",{className:"db-rc-event",children:n.jogo!=="Aposta"?n.jogo:n.tipo}),e.jsxs("div",{className:"db-rc-meta",children:[n.jogo!=="Aposta"&&e.jsx("span",{className:"db-rc-badge",children:n.tipo}),e.jsxs("span",{className:"db-rc-odd",children:["Odd ",n.odd.toFixed(2)]}),n.valorAposta&&e.jsxs("span",{className:"db-rc-valor",children:["R$ ",n.valorAposta.toFixed(0)]})]})]}),e.jsx("div",{className:"db-rc-divider"}),e.jsxs("div",{className:"db-rc-risk",children:[e.jsxs("div",{className:"db-rc-risk-top",children:[e.jsx("span",{className:"db-rc-label",children:"Risco da Aposta"}),e.jsx("span",{className:"db-rc-level",style:{color:n.color},children:i})]}),e.jsxs("div",{className:"db-rc-score",style:{color:n.color},children:[n.score,e.jsx("span",{className:"db-rc-score-denom",children:"/100"})]}),e.jsx("div",{className:"db-rbar-wrap",role:"img","aria-label":`Risco ${n.score} de 100`,children:e.jsxs("div",{className:"db-rbar-track",children:[e.jsx("div",{className:"db-rbar-zone db-rbar-z1"}),e.jsx("div",{className:"db-rbar-zone db-rbar-z2"}),e.jsx("div",{className:"db-rbar-zone db-rbar-z3"}),e.jsx("div",{className:"db-rbar-zone db-rbar-z4"}),e.jsx("div",{className:"db-rbar-marker",style:{left:`calc(${Math.min(n.score,98)}% - 5px)`}})]})}),e.jsx("div",{className:"db-rc-phrase",children:ta(n.score)})]}),e.jsx("div",{className:"db-rc-divider"}),e.jsxs("div",{className:"db-rc-data",children:[e.jsxs("div",{className:"db-rc-data-item",children:[e.jsx("span",{className:"db-rc-label",children:"Chance estimada"}),e.jsxs("span",{className:"db-rc-big db-rc-big-green",children:[n.impl,e.jsx("span",{className:"db-rc-sym",children:"%"})]}),e.jsxs("span",{className:"db-rc-sub",children:[n.perda,"% de não converter"]})]}),e.jsx("div",{className:"db-rc-data-sep"}),e.jsxs("div",{className:"db-rc-data-item",children:[e.jsx("span",{className:"db-rc-label",children:"Valor em risco"}),e.jsxs("span",{className:"db-rc-big",style:{color:n.color},children:["R$",e.jsx("span",{children:n.valorRisco||"—"})]}),e.jsxs("span",{className:"db-rc-sub",children:["de R$ ",n.valorAposta?.toFixed(0)||"—"," apostados"]})]})]}),e.jsx("div",{className:"db-rc-divider"}),e.jsxs("div",{className:"db-rc-ai",children:[e.jsx("span",{className:"db-rc-label",children:"Leitura da IA"}),e.jsxs("div",{className:"db-rc-ai-verdict",style:{color:a.color},children:[e.jsx("span",{className:"db-rc-ai-dot",style:{background:a.color},"aria-hidden":"true"}),a.text]}),c&&e.jsxs("p",{className:"db-rc-ai-sentence",children:['"',c,'"']})]})]}),e.jsxs("div",{className:"db-actions",children:[e.jsxs("button",{className:"db-btn-primary",onClick:xe,children:[e.jsx("svg",{width:"11",height:"11",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round"})}),"Nova análise"]}),e.jsxs("button",{className:"db-btn-copy",onClick:()=>Me(n),title:"Copiar resumo",children:[e.jsxs("svg",{width:"11",height:"11",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("rect",{x:"5",y:"5",width:"8",height:"8",rx:"1.5",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M9 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5a1 1 0 001 1h2",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"})]}),"Copiar"]})]}),e.jsx("p",{className:"db-disclaimer",children:"Análise educativa. Não representa garantia de resultado. A decisão é sua."})]})})()]},"nova"),d==="comparador"&&e.jsx(ee,{mod:"MÓDULO III",title:"Comparador de Odds",desc:"Compare múltiplas odds simultaneamente e identifique distorções entre casas de apostas. O Comparador cruza probabilidades implícitas em tempo real."}),d==="aovivo"&&e.jsx(ee,{mod:"MERCADOS",title:"Ao Vivo",desc:"Feed de análises em tempo real com atualizações automáticas de probabilidade para eventos em andamento. Integração com dados de mercado ao vivo."}),d==="favoritos"&&e.jsx(ee,{mod:"ARQUIVO",title:"Favoritos",desc:"Salve e organize suas análises mais relevantes. Crie coleções por campeonato, mercado ou período para consulta rápida."}),d==="jogos"&&e.jsxs("div",{className:"ap-content",children:[e.jsxs("div",{className:"ap-panel-hdr",children:[e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:"ANÁLISE ESPORTIVA"}),e.jsx("div",{className:"ap-panel-title",children:"Jogos de Hoje"})]}),e.jsxs("div",{className:"jg-hdr-right",children:[e.jsxs("div",{className:"jg-data-badge",title:"Dados obtidos de fontes esportivas em tempo real",children:[e.jsx("span",{className:"jg-data-dot","aria-hidden":"true"}),"DADOS ESPORTIVOS"]}),pe&&e.jsx("span",{className:"jg-updated",children:pe.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}),e.jsx("button",{className:"jg-refresh-btn",onClick:Q,disabled:L,title:"Atualizar partidas",type:"button","aria-label":"Atualizar lista de partidas",children:e.jsx("svg",{width:"12",height:"12",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M12 7A5 5 0 1 1 7 2M12 7V2.5M12 2.5H8",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})})]})]}),L&&e.jsxs("div",{className:"jg-loading",children:[e.jsx("span",{className:"jg-dot"}),e.jsx("span",{className:"jg-dot"}),e.jsx("span",{className:"jg-dot"}),e.jsx("span",{className:"jg-loading-lbl",children:"Buscando partidas de hoje..."})]}),$&&!L&&e.jsxs("div",{className:"ap-error",role:"alert",children:[$,e.jsx("button",{className:"jg-retry-btn",onClick:Q,type:"button",children:"Tentar novamente"})]}),!L&&w.length===0&&!$&&e.jsxs("div",{className:"ap-geral-empty",children:[e.jsx("p",{children:"Nenhuma partida encontrada para hoje."}),e.jsx("button",{className:"ap-geral-btn",onClick:()=>p("nova"),children:"Análise manual →"})]}),!L&&w.length>0&&(()=>{const a=w.filter(r=>r.status==="live").length,i=[...new Set(w.map(r=>Y(r.league)).filter(Boolean))],c=["todos",...a>0?["live"]:[],...i],k=B==="todos"?w:B==="live"?w.filter(r=>r.status==="live"):w.filter(r=>Y(r.league)===B);return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"jg-filters",children:c.map(r=>e.jsx("button",{className:["jg-pill",B===r?"jg-pill-on":"",r==="live"?"jg-pill-live":""].join(" ").trim(),onClick:()=>Ae(r),type:"button",children:r==="todos"?"Todos":r==="live"?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"jg-pill-dot","aria-hidden":"true"}),"Ao Vivo (",a,")"]}):r},r))}),e.jsx("div",{className:"jg-grid",children:k.map((r,u)=>{const z=r.scoreHome!==null&&r.scoreAway!==null;return e.jsxs("button",{className:`jg-card jg-card-${r.status}`,onClick:()=>Ie(r),type:"button",style:{animationDelay:`${Math.min(u,6)*40}ms`},children:[e.jsxs("div",{className:"jg-card-header",children:[e.jsx("span",{className:"jg-league",children:Y(r.league)||r.league}),r.status==="upcoming"&&r.time&&e.jsx("span",{className:"jg-time",children:r.time})]}),r.status==="live"&&e.jsxs("div",{className:"jg-status-row",children:[e.jsx("span",{className:"jg-live-dot","aria-hidden":"true"}),e.jsx("span",{className:"jg-status-live-text",children:"AO VIVO"}),r.elapsed!=null&&e.jsxs("span",{className:"jg-elapsed",children:[r.elapsed,"'"]})]}),r.status==="ended"&&e.jsx("div",{className:"jg-status-row",children:e.jsx("span",{className:"jg-status-ended-text",children:"ENCERRADO"})}),e.jsxs("div",{className:"jg-matchup",children:[e.jsx("span",{className:"jg-team-name",children:r.home}),e.jsx("div",{className:"jg-score-center",children:z?e.jsxs("span",{className:"jg-score-pair",children:[e.jsx("span",{className:"jg-score-num",children:r.scoreHome}),e.jsx("span",{className:"jg-score-dash",children:"—"}),e.jsx("span",{className:"jg-score-num",children:r.scoreAway})]}):e.jsx("span",{className:"jg-vs",children:"×"})}),e.jsx("span",{className:"jg-team-name jg-team-right",children:r.away})]}),e.jsx("div",{className:"jg-card-footer",children:e.jsx("span",{className:"jg-cta",children:"Analisar →"})})]},r.id||u)})}),e.jsxs("div",{className:"jg-disclaimer",role:"note",children:[e.jsxs("svg",{width:"10",height:"10",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("circle",{cx:"7",cy:"7",r:"5.5",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M7 6.5v3.5M7 4.5v.5",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round"})]}),"Ferramenta educativa. Os dados de partidas fornecem contexto para análise de risco. Não representa recomendação de aposta."]})]})})()]},"jogos"),d==="historico"&&e.jsxs("div",{className:"ap-content",children:[e.jsxs("div",{className:"ap-panel-hdr",children:[e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:"ARQUIVO"}),e.jsx("div",{className:"ap-panel-title",children:"Histórico de análises"})]}),e.jsxs("div",{className:"ap-panel-online",children:[e.jsx("span",{className:"ap-status-dot","aria-hidden":"true"}),b.length," REGISTROS"]})]}),b.length===0?e.jsx("div",{className:"ap-empty",children:"Nenhuma análise registrada nesta sessão."}):e.jsx("div",{className:"ap-hist-list",children:b.map((a,i)=>e.jsxs("button",{className:"ap-hist-row",onClick:()=>ce(a),children:[e.jsxs("span",{className:"ap-hist-id",children:["#",a.id||"—"]}),e.jsx("span",{className:"ap-hist-event",children:a.jogo||"Aposta"}),e.jsxs("span",{className:"ap-hist-odd",children:["Odd ",a.odd]}),e.jsx("div",{className:"ap-hist-bar",children:e.jsx("div",{style:{width:`${a.score}%`,background:a.color,height:"100%",borderRadius:99}})}),e.jsx("span",{className:"ap-hist-score",style:{color:a.color},children:a.score}),e.jsx("span",{className:"ap-hist-tag",style:{color:a.color,borderColor:`${a.color}33`},children:a.label}),e.jsx("span",{className:"ap-hist-ts",children:a.ts||""})]},i))})]},"historico"),d==="config"&&e.jsxs("div",{className:"ap-content",children:[e.jsx("div",{className:"ap-panel-hdr",children:e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:"SISTEMA"}),e.jsx("div",{className:"ap-panel-title",children:"Configurações"})]})}),e.jsxs("div",{className:"ap-config-panel",children:[e.jsxs("div",{className:"ap-config-field",children:[e.jsx("label",{className:"ap-label",htmlFor:"token-input",children:"TOKEN DE ACESSO"}),e.jsx("input",{id:"token-input",className:"ap-input ap-input-mono",type:"text",placeholder:"Cole seu token de acesso aqui",value:U,onChange:a=>{G(a.target.value),localStorage.setItem(W,a.target.value)},autoComplete:"off",spellCheck:!1}),e.jsx("p",{className:"ap-config-hint",children:"Token recebido por email após a confirmação de acesso."})]}),e.jsxs("div",{className:"ap-config-info",children:[e.jsxs("div",{className:"ap-config-row",children:[e.jsx("span",{children:"Engine"}),e.jsx("span",{children:"MotorIA Risk Engine™ v2.4"})]}),e.jsxs("div",{className:"ap-config-row",children:[e.jsx("span",{children:"Modelo"}),e.jsx("span",{children:"Quantitative Risk v2"})]}),e.jsxs("div",{className:"ap-config-row",children:[e.jsx("span",{children:"Histórico local"}),e.jsxs("span",{children:[b.length," / ",ue]})]}),e.jsxs("div",{className:"ap-config-row",children:[e.jsx("span",{children:"Status"}),e.jsx("span",{className:"ap-config-online",children:"● ONLINE"})]})]})]})]},"config")]})]})]})]})}const oa=`
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:     #060608;
  --bg2:    #07070A;
  --panel:  #0B0B0F;
  --border: rgba(255,255,255,0.065);
  --bmd:    rgba(255,255,255,0.11);
  --t1: #DDDDE0;
  --t2: #6E6E76;
  --t3: #36363C;
  --green:  #22C55E;
  --amber:  #F59E0B;
  --red:    #EF4444;
  --orange: #F97316;
}

body { overflow: hidden; }

@keyframes ap-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .4; transform: scale(1.55); }
}
@keyframes ap-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: .18; }
}
@keyframes ap-bar-in {
  from { width: 0; }
}
@keyframes ap-fade-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ap-banner-in {
  from { opacity: 0; transform: translateY(-100%); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ─ Shell ──────────────────────────────────────────────────────────────────── */
.ap-shell {
  display: flex; flex-direction: column;
  height: 100dvh; min-height: 100vh;
  background: var(--bg); color: var(--t1);
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif;
  overflow: hidden; font-size: 14px;
}

/* ─ Overlay ────────────────────────────────────────────────────────────────── */
.ap-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.65);
  z-index: 40; backdrop-filter: blur(3px);
}

/* ─ Access banner ──────────────────────────────────────────────────────────── */
.ap-access-banner {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: var(--green); color: #050507;
  font-size: 11px; font-weight: 800; letter-spacing: .1em;
  padding: 10px 20px;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  animation: ap-banner-in .3s ease both;
}
.ap-access-banner-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #050507; opacity: .55;
  animation: ap-pulse 1.5s ease-in-out infinite;
}

/* ─ Topbar ─────────────────────────────────────────────────────────────────── */
.ap-topbar {
  background: var(--bg2);
  border-bottom: 1px solid rgba(255,255,255,.08);
  flex-shrink: 0; z-index: 30; position: relative;
  /* Push content below iOS status bar / Dynamic Island */
  padding-top: env(safe-area-inset-top);
}
.ap-topbar-row {
  display: flex; align-items: center; justify-content: space-between;
  height: 46px; padding: 0 16px; gap: 12px;
}
.ap-topbar-left  { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.ap-topbar-right { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }

.ap-hamburger {
  display: none; flex-direction: column; gap: 4.5px;
  background: none; border: none; cursor: pointer; padding: 4px 3px; flex-shrink: 0;
}
.ap-hamburger span {
  display: block; width: 16px; height: 1.5px;
  background: var(--t2); border-radius: 99px; transition: opacity .15s;
}
.ap-hamburger:hover span { background: var(--t1); }

.ap-topbar-brand { display: flex; align-items: center; gap: 7px; }
.ap-logo-mark {
  width: 22px; height: 22px; border-radius: 5px;
  background: #16a34a; color: #f0fdf4;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 0 12px rgba(22,163,74,.28), 0 2px 6px rgba(0,0,0,.4);
}
.ap-topbar-name { font-size: 13px; font-weight: 800; color: #E8E8E6; letter-spacing: -0.03em; }
.ap-topbar-sep  { color: var(--t3); font-size: 13px; }
.ap-topbar-tag  { font-size: 10.5px; font-weight: 600; color: rgba(255,255,255,.28); letter-spacing: .04em; }

.ap-topbar-center { flex: 1; display: flex; align-items: center; justify-content: center; }
.ap-topbar-clock {
  font-size: 11px; font-weight: 700; letter-spacing: .06em; color: rgba(255,255,255,.3);
  font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace;
}
.ap-topbar-aid {
  font-size: 10px; font-weight: 700; letter-spacing: .1em;
  color: rgba(34,197,94,.45); font-family: 'Courier New', monospace;
}

.ap-credits-wrap { display: flex; align-items: center; }
.ap-credits-bar {
  width: 56px; height: 2px;
  background: rgba(255,255,255,.07); border-radius: 99px; overflow: hidden;
}
.ap-credits-fill { height: 100%; border-radius: 99px; background: var(--green); transition: width .4s ease; }

.ap-engine-live {
  display: flex; align-items: center; gap: 6px;
  font-size: 9px; font-weight: 800; letter-spacing: .12em; color: rgba(255,255,255,.28);
}
.ap-live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--green); flex-shrink: 0;
  animation: ap-pulse 2.4s ease-in-out infinite;
}
.ap-live-lbl { letter-spacing: .1em; }

/* ─ Body ───────────────────────────────────────────────────────────────────── */
.ap-body { display: flex; flex: 1; overflow: hidden; }

/* ─ Sidebar ────────────────────────────────────────────────────────────────── */
.ap-sidebar {
  width: 210px; flex-shrink: 0;
  background: var(--bg2);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  padding: 0 0 12px; overflow-y: auto;
  transition: transform .22s ease;
}

/* Sidebar brand mark */
.ap-sidebar-brand {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid var(--border);
}
.ap-sidebar-brand-mark {
  width: 20px; height: 20px; border-radius: 5px;
  background: rgba(22,163,74,.14);
  border: 1px solid rgba(22,163,74,.2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ap-sidebar-brand-name {
  font-size: 11px; font-weight: 800; color: rgba(255,255,255,.45);
  letter-spacing: -0.01em;
}

.ap-sidebar-divider { height: 1px; background: var(--border); }

/* Sidebar groups */
.ap-sidebar-group {
  display: flex; flex-direction: column; gap: 1px;
  padding: 10px 8px 4px;
}
.ap-sidebar-group-lbl {
  font-size: 8px; font-weight: 800; letter-spacing: .2em;
  color: var(--t3); padding: 0 6px 5px; text-transform: uppercase;
}

/* Nav items */
.ap-nav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 7.5px 10px; border-radius: 7px;
  border: none; background: transparent; cursor: pointer;
  width: 100%; text-align: left; color: var(--t2);
  transition: background .12s, color .12s; font-family: inherit;
  position: relative;
}
.ap-nav-item:hover:not(.ap-nav-dim) {
  background: rgba(255,255,255,.045); color: var(--t1);
}
.ap-nav-active {
  background: rgba(255,255,255,.06) !important;
  color: var(--t1) !important;
}
.ap-nav-active::before {
  content: '';
  position: absolute; left: 0; top: 22%; bottom: 22%;
  width: 2px; border-radius: 99px; background: var(--green);
}

.ap-nav-dim { opacity: .42; cursor: default; }
.ap-nav-dim:hover { background: transparent !important; color: var(--t2) !important; }

.ap-nav-icon {
  display: flex; align-items: center; justify-content: center;
  width: 16px; flex-shrink: 0; opacity: .7; color: inherit;
}
.ap-nav-active .ap-nav-icon { opacity: 1; }

.ap-nav-label { font-size: 12px; font-weight: 600; letter-spacing: -0.01em; flex: 1; }

.ap-nav-badge {
  font-size: 9px; font-weight: 700; color: var(--t3);
  background: rgba(255,255,255,.055); border-radius: 99px;
  padding: 1px 6px; min-width: 18px; text-align: center;
}
.ap-nav-live-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--green); flex-shrink: 0;
  animation: ap-pulse 2s ease-in-out infinite;
}
.ap-nav-soon {
  color: var(--t3); display: flex; align-items: center;
  opacity: .6;
}

/* Sidebar engine block */
.ap-sidebar-engine {
  margin-top: auto; padding: 14px 14px 4px;
  border-top: 1px solid var(--border);
  display: flex; align-items: center; gap: 9px;
}
.ap-sidebar-engine-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--green); flex-shrink: 0;
  animation: ap-pulse 3s ease-in-out infinite;
}
.ap-sidebar-engine-info { display: flex; flex-direction: column; gap: 2px; }
.ap-sidebar-engine-name {
  font-size: 8px; font-weight: 800; letter-spacing: .1em;
  color: var(--t3); font-family: 'Courier New', monospace;
}
.ap-sidebar-engine-status {
  font-size: 8px; font-weight: 700; letter-spacing: .08em; color: rgba(34,197,94,.5);
}

/* ─ Main ───────────────────────────────────────────────────────────────────── */
.ap-main {
  flex: 1; overflow-y: auto; background: var(--bg);
  /* Bottom safe area keeps content above iPhone home indicator */
  padding-bottom: env(safe-area-inset-bottom);
}
.ap-content {
  max-width: 800px; margin: 0 auto; padding: 24px 22px;
  display: flex; flex-direction: column; gap: 11px;
  animation: ap-fade-up .2s ease both;
}

/* ─ Nova analysis: constrained width gives form intentional presence ────────── */
.ap-content-nova {
  max-width: 500px;
  padding-top: 28px;
}
@media (max-width: 640px) {
  .ap-content-nova { padding-top: 12px; }
}

/* ─ Panel header ───────────────────────────────────────────────────────────── */
.ap-panel-hdr {
  display: flex; justify-content: space-between; align-items: flex-end;
  padding-bottom: 13px; border-bottom: 1px solid var(--border); margin-bottom: 4px;
}
.ap-panel-hdr-left { display: flex; flex-direction: column; gap: 2px; }
.ap-panel-mod {
  font-size: 8px; font-weight: 800; letter-spacing: .2em;
  color: var(--t3); font-family: 'Courier New', monospace;
}
.ap-panel-title { font-size: 16px; font-weight: 700; color: var(--t1); letter-spacing: -0.03em; }
.ap-panel-online {
  display: flex; align-items: center; gap: 6px;
  font-size: 8px; font-weight: 800; letter-spacing: .14em; color: var(--t3);
}
.ap-status-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--green);
  animation: ap-pulse 2.8s ease-in-out infinite;
}

/* ─ Visão Geral ────────────────────────────────────────────────────────────── */
.ap-geral-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}
.ap-geral-stat {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 14px 12px;
  display: flex; flex-direction: column; gap: 6px;
}
.ap-geral-stat-val {
  font-size: 26px; font-weight: 900; color: var(--t1);
  letter-spacing: -0.05em; line-height: 1;
  font-variant-numeric: tabular-nums;
}
.ap-geral-stat-val-sm { font-size: 18px; }
.ap-geral-stat-lbl {
  font-size: 8px; font-weight: 800; letter-spacing: .14em;
  color: var(--t3); text-transform: uppercase;
}

.ap-geral-action {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 16px 18px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.ap-geral-action-left { display: flex; flex-direction: column; gap: 4px; }
.ap-geral-action-title { font-size: 13px; font-weight: 700; color: var(--t1); letter-spacing: -0.02em; }
.ap-geral-action-sub { font-size: 10px; color: var(--t3); letter-spacing: .02em; }
.ap-geral-btn {
  display: flex; align-items: center; gap: 7px;
  background: var(--t1); color: #060608;
  font-size: 11px; font-weight: 900; letter-spacing: .12em;
  padding: 9px 18px; border-radius: 7px; border: none; cursor: pointer;
  font-family: inherit; white-space: nowrap; flex-shrink: 0;
  transition: opacity .14s;
}
.ap-geral-btn:hover { opacity: .88; }

.ap-geral-recent {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 10px;
}
.ap-geral-recent-hdr {
  font-size: 8px; font-weight: 800; letter-spacing: .16em; color: var(--t3);
}
.ap-geral-recent-list { display: flex; flex-direction: column; gap: 3px; }
.ap-geral-recent-row {
  display: grid; grid-template-columns: 52px 1fr 56px 64px 28px 60px;
  align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 7px;
  background: transparent; border: none; cursor: pointer;
  width: 100%; text-align: left; font-family: inherit; color: inherit;
  transition: background .1s;
}
.ap-geral-recent-row:hover { background: rgba(255,255,255,.035); }
.ap-geral-recent-id    { font-family: 'Courier New', monospace; font-size: 9px; color: var(--t3); }
.ap-geral-recent-event { font-size: 11px; color: var(--t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ap-geral-recent-odd   { font-size: 10px; color: var(--t3); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ap-geral-recent-bar   { height: 3px; background: rgba(255,255,255,.05); border-radius: 99px; overflow: hidden; }
.ap-geral-recent-score { font-size: 12px; font-weight: 800; text-align: right; font-variant-numeric: tabular-nums; }
.ap-geral-recent-tag   { font-size: 8px; font-weight: 800; letter-spacing: .04em; }

.ap-geral-empty {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 32px 20px;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  text-align: center;
}
.ap-geral-empty p { font-size: 13px; color: var(--t3); }

/* ─ Coming soon ────────────────────────────────────────────────────────────── */
.ap-coming-panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 40px 32px;
  display: flex; flex-direction: column; align-items: flex-start; gap: 14px;
  margin-top: 6px;
}
.ap-coming-icon { opacity: .6; margin-bottom: 4px; }
.ap-coming-desc { font-size: 13px; color: var(--t2); line-height: 1.75; max-width: 440px; }
.ap-coming-tag {
  font-size: 9px; font-weight: 800; letter-spacing: .12em;
  color: var(--t3); font-family: 'Courier New', monospace;
  border: 1px solid var(--border); border-radius: 5px; padding: 5px 10px;
}

/* ─ Input panel ────────────────────────────────────────────────────────────── */
.ap-input-panel {
  background: #0C0C11;
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 14px; padding: 22px 22px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,.4), 0 12px 40px rgba(0,0,0,.35);
}

/* Form header */
.ap-form-hdr {
  border-bottom-color: rgba(255,255,255,.06);
  padding-bottom: 16px; margin-bottom: 6px;
}
.ap-nova-title {
  font-size: 18px; font-weight: 800; color: #DDDDE0;
  letter-spacing: -0.035em; line-height: 1;
}
.ap-nova-sub {
  font-size: 11.5px; color: rgba(255,255,255,.32); margin-top: 5px; line-height: 1.55;
}
.ap-ia-online {
  display: flex; align-items: center; gap: 6px;
  font-size: 8px; font-weight: 800; letter-spacing: .14em; color: rgba(34,197,94,.5);
  flex-shrink: 0;
}

/* Form anchor strip */
.ap-form-anchor {
  display: inline-flex; align-items: center; gap: 7px;
  align-self: flex-start;
  padding: 5px 11px;
  background: rgba(22,163,74,.05);
  border: 1px solid rgba(22,163,74,.13);
  border-radius: 99px;
  font-size: 9px; font-weight: 700; color: rgba(34,197,94,.6);
  letter-spacing: .04em;
}

.ap-form { display: flex; flex-direction: column; gap: 14px; margin-top: 0; }
.ap-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ap-field { display: flex; flex-direction: column; gap: 6px; }

/* Dim label for secondary fields */
.ap-label-dim { opacity: .62; }
/* Secondary row: slightly visually recessed */
.ap-row-secondary { margin-top: -2px; }

.ap-label {
  font-size: 9px; font-weight: 700; letter-spacing: .1em;
  color: rgba(255,255,255,.5); text-transform: uppercase;
}
.ap-label-opt { font-weight: 500; letter-spacing: 0; text-transform: none; font-size: 8px; opacity: .7; }

.ap-input {
  background: rgba(255,255,255,.048);
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 8px; padding: 11px 13px;
  font-size: 14px; font-weight: 500; color: #E8E8E6;
  outline: none; font-family: inherit; width: 100%;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04), inset 0 -1px 0 rgba(0,0,0,.15);
  transition: border-color .18s ease-out, background .18s ease-out, box-shadow .18s ease-out;
}
.ap-input:focus {
  border-color: rgba(34,197,94,.38);
  background: rgba(22,163,74,.03);
  box-shadow: 0 0 0 3px rgba(22,163,74,.08), inset 0 1px 0 rgba(255,255,255,.04);
}
.ap-input::placeholder { color: rgba(255,255,255,.42); }
.ap-input-odd {
  font-size: 22px; font-weight: 700; letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums; font-feature-settings: 'tnum';
}
.ap-select { cursor: pointer; }
.ap-textarea { resize: none; line-height: 1.55; font-size: 13px; }
.ap-input-mono { font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: .03em; }

.ap-odd-preview {
  display: flex; align-items: center; gap: 5px;
  font-size: 9px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  opacity: .85;
}
.ap-odd-preview-sep { color: var(--t3); }
.ap-error {
  font-size: 12px; color: var(--red);
  background: rgba(239,68,68,.06); border: 1px solid rgba(239,68,68,.18);
  border-radius: 8px; padding: 10px 12px;
}

.ap-submit {
  display: flex; align-items: center; justify-content: center; gap: 9px;
  background: #15803d; color: #dcfce7;
  font-size: 11.5px; font-weight: 700; letter-spacing: .08em;
  padding: 14px 20px; border-radius: 9px; border: none; cursor: pointer;
  font-family: inherit; margin-top: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,.35);
  transition: background .15s ease-out, transform .1s ease-out;
}
.ap-submit:hover {
  background: #166534;
  transform: translateY(-1px);
}
.ap-submit:active { transform: translateY(0); }

/* ─ Loading ────────────────────────────────────────────────────────────────── */
.ap-loading {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 26px 22px;
  display: flex; flex-direction: column; gap: 20px;
}
.ap-loading-hdr { display: flex; justify-content: space-between; align-items: flex-start; }
.ap-loading-engine { font-size: 10px; font-weight: 800; letter-spacing: .16em; color: var(--t2); font-family: 'Courier New', monospace; }
.ap-loading-sub { font-size: 11px; color: var(--t3); margin-top: 3px; }
.ap-loading-status { font-size: 9px; font-weight: 800; letter-spacing: .12em; color: var(--green); animation: ap-blink 1.3s ease-in-out infinite; }
.ap-loading-bar-wrap { height: 2px; background: rgba(255,255,255,.06); border-radius: 99px; overflow: hidden; }
.ap-loading-bar {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, var(--green) 0%, var(--amber) 55%, var(--red) 100%);
  transition: width .8s ease;
}
.ap-loading-pct {
  font-size: 56px; font-weight: 900; color: var(--t1);
  line-height: 1; letter-spacing: -0.06em;
  font-variant-numeric: tabular-nums; font-feature-settings: 'tnum';
}
.ap-loading-pct-sym { font-size: 26px; color: var(--t3); }
.ap-loading-steps { display: flex; flex-direction: column; gap: 9px; }
.ap-lstep { display: flex; align-items: center; gap: 10px; font-size: 11.5px; color: var(--t3); transition: color .3s; }
.ap-lstep-done   { color: var(--t3); }
.ap-lstep-active { color: var(--t1); }
.ap-lstep-icon { font-size: 9px; width: 14px; flex-shrink: 0; font-family: 'Courier New', monospace; color: inherit; }
.ap-lstep-active .ap-lstep-icon { animation: ap-blink .7s ease-in-out infinite; }
.ap-lstep-done-tag { margin-left: auto; font-size: 8px; font-weight: 800; letter-spacing: .08em; color: rgba(34,197,94,.4); font-family: 'Courier New', monospace; }
.ap-lstep-cursor {
  font-family: 'Courier New', monospace; font-size: 11px; color: var(--green);
  animation: ap-blink .6s step-start infinite; margin-left: 1px;
}
.ap-loading-engine-dot {
  display: inline-block; width: 5px; height: 5px; border-radius: 50%;
  background: var(--green); margin-left: 7px; vertical-align: middle;
  animation: ap-pulse 1.8s ease-in-out infinite;
}
.ap-loading-sub-game {
  color: var(--t1) !important; font-weight: 600; font-size: 12px;
}
.ap-loading-bar-wrap { position: relative; height: 2px; background: rgba(255,255,255,.06); border-radius: 99px; overflow: visible; }
.ap-loading-bar-glow {
  position: absolute; top: 50%; transform: translate(-50%, -50%);
  width: 20px; height: 6px;
  background: radial-gradient(ellipse, rgba(34,197,94,.45) 0%, transparent 70%);
  pointer-events: none; transition: left .8s ease;
}

/* ─ Output ─────────────────────────────────────────────────────────────────── */
.ap-output { display: flex; flex-direction: column; gap: 10px; animation: ap-fade-up .25s ease both; }
.ap-output-topbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.ap-output-meta { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.ap-output-id   { font-size: 9px; font-weight: 800; letter-spacing: .14em; color: rgba(34,197,94,.5); font-family: 'Courier New', monospace; }
.ap-output-dot  { color: var(--t3); font-size: 10px; }
.ap-output-ts   { font-size: 10px; color: var(--t3); font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace; }
.ap-output-event { font-size: 11px; color: var(--t2); }
.ap-btn-nova {
  font-size: 10px; font-weight: 700; color: var(--t2);
  background: rgba(255,255,255,.04); border: 1px solid var(--border);
  border-radius: 6px; padding: 5px 13px; cursor: pointer;
  transition: all .14s; font-family: inherit; letter-spacing: .04em;
}
.ap-btn-nova:hover { color: var(--t1); border-color: var(--bmd); }

/* Score hero */
.ap-score-hero {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 22px 22px;
  display: flex; align-items: center; gap: 32px;
}
.ap-gauge-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0; }
.ap-gauge {
  width: 120px; height: 120px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: background .7s ease;
}
.ap-gauge-inner {
  width: 88px; height: 88px; border-radius: 50%;
  background: var(--panel); border: 1px solid var(--border);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
}
.ap-gauge-num   { font-size: 30px; font-weight: 900; color: var(--t1); line-height: 1; letter-spacing: -0.05em; font-variant-numeric: tabular-nums; }
.ap-gauge-denom { font-size: 11px; font-weight: 600; color: var(--t3); }
.ap-gauge-name  { font-size: 7.5px; font-weight: 800; letter-spacing: .1em; color: var(--t3); text-transform: uppercase; text-align: center; max-width: 110px; }
.ap-gauge-ci    { font-size: 8px; color: rgba(255,255,255,.14); letter-spacing: .04em; font-variant-numeric: tabular-nums; text-align: center; }

.ap-score-side { display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0; }
.ap-risk-badge {
  display: inline-flex; align-items: center;
  font-size: 10px; font-weight: 800; letter-spacing: .1em;
  padding: 4px 11px; border-radius: 5px; border: 1px solid; align-self: flex-start;
}
.ap-verdict { font-size: 26px; font-weight: 900; line-height: 1; letter-spacing: -0.04em; }
.ap-score-data { display: flex; flex-direction: column; gap: 8px; margin-top: 2px; }
.ap-score-data-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ap-score-data-lbl { font-size: 8px; font-weight: 800; letter-spacing: .12em; color: var(--t3); text-transform: uppercase; min-width: 88px; flex-shrink: 0; }
.ap-score-data-val { font-size: 12px; font-weight: 700; color: var(--t2); font-variant-numeric: tabular-nums; }
.ap-score-data-val-lg { font-size: 18px; font-weight: 800; color: var(--t1); letter-spacing: -0.03em; }
.ap-exposure-row { display: flex; align-items: center; gap: 8px; flex: 1; }
.ap-exposure-track { flex: 1; height: 3px; background: rgba(255,255,255,.07); border-radius: 99px; overflow: hidden; max-width: 100px; }
.ap-exposure-fill { height: 100%; border-radius: 99px; transition: width .6s ease; animation: ap-bar-in .6s ease both; }
.ap-exposure-val { font-size: 11px; font-weight: 800; font-variant-numeric: tabular-nums; }

/* Probability Distortion */
.ap-prob-panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.ap-prob-hdr { display: flex; justify-content: space-between; align-items: center; }
.ap-prob-title { font-size: 8px; font-weight: 800; letter-spacing: .14em; color: var(--t3); text-transform: uppercase; }
.ap-prob-vig   { font-size: 8px; font-weight: 700; letter-spacing: .06em; color: rgba(245,158,11,.5); font-family: 'Courier New', monospace; }
.ap-prob-bar   { display: flex; height: 5px; border-radius: 99px; overflow: hidden; gap: 2px; }
.ap-prob-win   { background: var(--green); border-radius: 99px 0 0 99px; animation: ap-bar-in .65s ease-out both; }
.ap-prob-lose  { flex: 1; background: var(--red); border-radius: 0 99px 99px 0; }
.ap-prob-labels { display: flex; justify-content: space-between; }
.ap-prob-w { font-size: 9px; font-weight: 800; color: var(--green); letter-spacing: .05em; }
.ap-prob-l { font-size: 9px; font-weight: 800; color: var(--red);   letter-spacing: .05em; }

/* Metrics grid */
.ap-metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
.ap-metric-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 13px 12px;
  display: flex; flex-direction: column; gap: 5px;
  transition: border-color .14s;
}
.ap-metric-card:hover { border-color: var(--bmd); }
.ap-metric-val   { font-size: clamp(16px, 2.2vw, 21px); font-weight: 900; line-height: 1; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }
.ap-metric-label { font-size: 7.5px; font-weight: 800; letter-spacing: .12em; color: var(--t3); text-transform: uppercase; }
.ap-tm           { font-size: 7px; vertical-align: super; opacity: .7; }
.ap-metric-sub   { font-size: 10px; color: var(--t3); line-height: 1.4; }

/* AI Modules */
.ap-ai-section { display: flex; flex-direction: column; gap: 9px; }
.ap-ai-hdr {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 9px; border-bottom: 1px solid var(--border);
}
.ap-ai-hdr-title { font-size: 8px; font-weight: 800; letter-spacing: .18em; color: var(--t3); }
.ap-ai-hdr-tag   { font-size: 8px; font-weight: 700; letter-spacing: .06em; color: rgba(34,197,94,.38); }
.ap-ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.ap-ai-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 13px 14px;
  display: flex; flex-direction: column; gap: 5px;
  transition: border-color .14s;
}
.ap-ai-card:hover { border-color: var(--bmd); }
.ap-ai-card-mod   { font-size: 7.5px; font-weight: 800; letter-spacing: .12em; color: rgba(34,197,94,.42); font-family: 'Courier New', monospace; }
.ap-ai-card-title { font-size: 9px; font-weight: 800; letter-spacing: .1em; color: var(--t3); text-transform: uppercase; margin-bottom: 2px; }
.ap-ai-card-text  { font-size: 12px; color: var(--t2); line-height: 1.8; }

.ap-alerta {
  display: flex; flex-direction: column; gap: 8px;
  background: rgba(239,68,68,.04); border: 1px solid rgba(239,68,68,.16);
  border-radius: 10px; padding: 14px 16px;
}
.ap-alerta-hdr  { display: flex; align-items: center; gap: 8px; }
.ap-alerta-icon { font-size: 9px; color: var(--red); }
.ap-alerta-tag  { font-size: 8px; font-weight: 800; letter-spacing: .12em; color: var(--red); opacity: .7; }
.ap-alerta-text { font-size: 12px; color: var(--t2); line-height: 1.8; }

.ap-disclaimer {
  font-size: 10px; color: var(--t3); text-align: center;
  padding-top: 8px; border-top: 1px solid var(--border); line-height: 1.6;
}

/* ─ History ────────────────────────────────────────────────────────────────── */
.ap-hist-list { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
.ap-hist-row {
  display: grid; grid-template-columns: 52px 1fr 58px 70px 30px 64px 46px;
  align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 9px;
  background: var(--panel); border: 1px solid var(--border);
  cursor: pointer; width: 100%; text-align: left; font-family: inherit; color: inherit;
  transition: border-color .12s;
}
.ap-hist-row:hover { border-color: var(--bmd); }
.ap-hist-id    { font-family: 'Courier New', monospace; font-size: 9px; color: var(--t3); }
.ap-hist-event { font-size: 11px; color: var(--t2); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ap-hist-odd   { font-size: 10px; color: var(--t3); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ap-hist-bar   { height: 3px; background: rgba(255,255,255,.05); border-radius: 99px; overflow: hidden; }
.ap-hist-score { font-size: 12px; font-weight: 800; text-align: right; font-variant-numeric: tabular-nums; }
.ap-hist-tag   { font-size: 8px; font-weight: 800; letter-spacing: .05em; padding: 2px 6px; border-radius: 4px; border: 1px solid; }
.ap-hist-ts    { font-size: 9px; color: var(--t3); white-space: nowrap; font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace; }

/* ─ Config ─────────────────────────────────────────────────────────────────── */
.ap-empty { font-size: 13px; color: var(--t3); text-align: center; padding: 52px 0; }
.ap-config-panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px 20px; margin-top: 10px;
  display: flex; flex-direction: column; gap: 16px;
}
.ap-config-field { display: flex; flex-direction: column; gap: 8px; }
.ap-config-hint  { font-size: 11px; color: var(--t3); line-height: 1.65; }
.ap-config-info  { display: flex; flex-direction: column; border-top: 1px solid var(--border); padding-top: 14px; }
.ap-config-row {
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--t2); padding: 9px 0;
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.ap-config-row span:last-child { color: var(--t3); font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace; font-size: 11px; }
.ap-config-online { color: rgba(34,197,94,.6) !important; }

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD DE RESULTADO — componentes db-*
   ═══════════════════════════════════════════════════════════════════════════ */

@keyframes db-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes db-card-in {
  from { opacity: 0; transform: translateY(6px) scale(.99); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}
@keyframes db-bar-in {
  from { width: 0; }
}

/* ── Wrapper ──────────────────────────────────────────────────────────────── */
.db-output {
  display: flex; flex-direction: column; gap: 10px;
  animation: db-in .25s ease both;
}

/* ── Topbar ───────────────────────────────────────────────────────────────── */
.db-topbar {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 8px;
}
.db-topbar-meta  { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.db-id   { font-size: 9px; font-weight: 800; letter-spacing: .14em; color: rgba(34,197,94,.5); font-family: 'Courier New', monospace; }
.db-ts   { font-size: 10px; color: var(--t3); font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace; }
.db-sep  { color: var(--t3); font-size: 10px; }
.db-ai-badge {
  display: flex; align-items: center; gap: 5px;
  font-size: 9px; font-weight: 700; letter-spacing: .05em; color: var(--t3);
}
.db-ai-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--green);
  animation: ap-pulse 2.5s ease-in-out infinite;
}
.db-btn-ghost {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 700; color: var(--t2);
  background: rgba(255,255,255,.04); border: 1px solid var(--border);
  border-radius: 6px; padding: 5px 13px; cursor: pointer;
  transition: all .14s; font-family: inherit; letter-spacing: .04em;
}
.db-btn-ghost:hover { color: var(--t1); border-color: var(--bmd); }

/* ── Event strip ──────────────────────────────────────────────────────────── */
.db-event-strip {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 11px 16px;
}
.db-strip-sep {
  width: 1px; height: 12px; background: var(--border); flex-shrink: 0;
}
.db-event-name  { font-size: 13px; font-weight: 700; color: var(--t1); letter-spacing: -0.02em; }
.db-event-tag   { font-size: 11px; font-weight: 600; color: var(--t2); }
.db-event-odd   { font-size: 11px; color: var(--t3); font-variant-numeric: tabular-nums; }
.db-event-odd strong { color: var(--t1); font-weight: 700; }
.db-event-valor { font-size: 11px; color: var(--t3); font-variant-numeric: tabular-nums; }

/* ── Cards grid ───────────────────────────────────────────────────────────── */
.db-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 8px;
}
.db-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 18px 18px;
  display: flex; flex-direction: column; gap: 10px;
  animation: db-card-in .28s ease both;
  transition: border-color .14s;
}
.db-card:hover { border-color: var(--bmd); }

.db-card-label {
  font-size: 8.5px; font-weight: 800; letter-spacing: .18em;
  color: var(--t3); text-transform: uppercase;
}

/* ── Card 1: Risco ────────────────────────────────────────────────────────── */
.db-card-risco { grid-column: 1 / -1; } /* full width */

.db-risco-score {
  font-size: 72px; font-weight: 900; line-height: 1;
  letter-spacing: -0.06em; font-variant-numeric: tabular-nums;
  transition: color .4s;
}
.db-risco-denom { font-size: 26px; font-weight: 600; color: var(--t3); letter-spacing: 0; }

.db-rbar-wrap { display: flex; flex-direction: column; gap: 6px; }
.db-rbar-track {
  position: relative; height: 8px; border-radius: 99px; overflow: visible;
  display: flex; gap: 2px;
}
.db-rbar-zone {
  flex: 1; height: 8px; border-radius: 99px;
}
.db-rbar-z1 { background: rgba(34,197,94,.25); }
.db-rbar-z2 { background: rgba(245,158,11,.25); }
.db-rbar-z3 { background: rgba(249,115,22,.25); }
.db-rbar-z4 { background: rgba(239,68,68,.25); }
.db-rbar-marker {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--t1); border: 2px solid var(--panel);
  box-shadow: 0 0 0 3px rgba(255,255,255,.18);
  transition: left .6s cubic-bezier(.22,.68,0,1.2);
  z-index: 2;
}
.db-rbar-labels {
  display: flex; justify-content: space-between;
  font-size: 7.5px; font-weight: 700; letter-spacing: .06em; color: var(--t3);
}

.db-card-level {
  font-size: 13px; font-weight: 800; letter-spacing: .1em;
  text-transform: uppercase; transition: color .4s;
}
.db-card-sub {
  font-size: 12px; color: var(--t3); line-height: 1.55;
}

/* ── Cards 2–4 shared ─────────────────────────────────────────────────────── */
.db-big-num {
  font-size: 42px; font-weight: 900; line-height: 1;
  letter-spacing: -0.05em; font-variant-numeric: tabular-nums;
}
.db-big-sym { font-size: 22px; font-weight: 600; color: var(--t3); }
.db-big-green { color: #22C55E; }
.db-big-red   { color: #EF4444; font-size: 32px; }

.db-mini-table { display: flex; flex-direction: column; gap: 5px; margin-top: 2px; }
.db-mini-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; color: var(--t3); gap: 8px;
}
.db-mini-row span:last-child {
  font-weight: 700; font-variant-numeric: tabular-nums; text-align: right;
  color: var(--t2);
}
.db-green  { color: #22C55E !important; }
.db-amber  { color: #F59E0B !important; }
.db-red    { color: #EF4444 !important; }
.db-muted  { color: var(--t3) !important; font-weight: 500 !important; }

/* ── Card 4: Leitura IA ───────────────────────────────────────────────────── */
.db-leitura-status {
  display: flex; align-items: center; gap: 9px;
  font-size: 18px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2;
  transition: color .3s;
}
.db-leitura-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  animation: ap-pulse 2.8s ease-in-out infinite;
}
.db-leitura-detail {
  display: flex; flex-direction: column; gap: 4px;
  background: rgba(255,255,255,.025); border: 1px solid var(--border);
  border-radius: 8px; padding: 10px 12px; margin-top: 2px;
}
.db-leitura-detail-lbl {
  font-size: 8px; font-weight: 800; letter-spacing: .12em; color: var(--t3); text-transform: uppercase;
}
.db-leitura-detail-txt { font-size: 11.5px; color: var(--t2); line-height: 1.65; }

/* ── Summary ──────────────────────────────────────────────────────────────── */
.db-summary {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 12px;
}
.db-summary-hdr {
  display: flex; justify-content: space-between; align-items: center;
}
.db-summary-title {
  font-size: 8.5px; font-weight: 800; letter-spacing: .16em; color: var(--t3); text-transform: uppercase;
}
.db-summary-tag {
  font-size: 8px; font-weight: 700; letter-spacing: .06em; color: rgba(34,197,94,.38);
}
.db-bullets { display: flex; flex-direction: column; gap: 8px; list-style: none; }
.db-bullet {
  display: flex; align-items: flex-start; gap: 9px;
  font-size: 12.5px; color: var(--t2); line-height: 1.7;
}
.db-bullet-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: rgba(34,197,94,.4); flex-shrink: 0; margin-top: 6px;
}

/* ── Actions ──────────────────────────────────────────────────────────────── */
.db-actions {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.db-btn-primary {
  display: flex; align-items: center; gap: 7px;
  background: var(--t1); color: #060608;
  font-size: 11px; font-weight: 900; letter-spacing: .12em;
  padding: 12px 22px; border-radius: 8px; border: none; cursor: pointer;
  font-family: inherit; transition: opacity .14s, transform .1s;
}
.db-btn-primary:hover  { opacity: .88; transform: translateY(-1px); }
.db-btn-primary:active { transform: translateY(0); opacity: .95; }
.db-btn-copy {
  display: flex; align-items: center; gap: 7px;
  background: transparent; color: var(--t2);
  font-size: 11px; font-weight: 700; letter-spacing: .08em;
  padding: 11px 18px; border-radius: 8px;
  border: 1px solid var(--border); cursor: pointer;
  font-family: inherit; transition: all .14s;
}
.db-btn-copy:hover { color: var(--t1); border-color: var(--bmd); background: rgba(255,255,255,.03); }

/* ── Disclaimer ───────────────────────────────────────────────────────────── */
.db-disclaimer {
  font-size: 10px; color: var(--t3); text-align: center;
  padding-top: 6px; border-top: 1px solid var(--border); line-height: 1.6;
}

/* ─ Tipo description ───────────────────────────────────────────────────────── */
@keyframes ap-desc-in {
  from { opacity: 0; transform: translateY(-3px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ap-tipo-desc {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 11.5px; color: rgba(255,255,255,.55); line-height: 1.6;
  padding: 9px 12px;
  background: rgba(34,197,94,.06);
  border: 1px solid rgba(34,197,94,.14);
  border-radius: 8px;
  animation: ap-desc-in .18s ease both;
}
.ap-tipo-desc-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--green); flex-shrink: 0;
  margin-top: 5px; opacity: .75;
  animation: ap-pulse 2.4s ease-in-out infinite;
}

/* ─ Custom Select ──────────────────────────────────────────────────────────── */
@keyframes sel-open {
  from { opacity: 0; transform: translateY(-5px) scaleY(.96); }
  to   { opacity: 1; transform: translateY(0)    scaleY(1); }
}

.sel-wrap {
  position: relative; width: 100%;
}

.sel-trigger {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  width: 100%; padding: 11px 13px;
  background: rgba(255,255,255,.048); border: 1px solid rgba(255,255,255,.13);
  border-radius: 8px; cursor: pointer; font-family: inherit;
  font-size: 14px; font-weight: 500; color: #E8E8E6;
  outline: none; text-align: left;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04), inset 0 -1px 0 rgba(0,0,0,.15);
  transition: border-color .18s ease-out, background .18s ease-out, box-shadow .18s ease-out;
  -webkit-appearance: none; appearance: none;
}
.sel-trigger:hover {
  background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.18);
}
.sel-trigger-open {
  border-color: rgba(34,197,94,.38) !important;
  background: rgba(22,163,74,.03) !important;
  box-shadow: 0 0 0 3px rgba(22,163,74,.08), inset 0 1px 0 rgba(255,255,255,.04);
}

.sel-val {
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 14px; font-weight: 500; color: var(--t1);
}

.sel-chev {
  display: flex; align-items: center; justify-content: center;
  color: var(--t3); flex-shrink: 0;
  transition: transform .18s ease, color .14s;
}
.sel-chev-up { transform: rotate(180deg); color: rgba(34,197,94,.6); }

.sel-list {
  position: absolute; top: calc(100% + 5px); left: 0; right: 0; z-index: 200;
  background: #0D0D12; border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px; padding: 5px;
  max-height: 228px; overflow-y: auto;
  list-style: none;
  box-shadow: 0 16px 48px rgba(0,0,0,.7), 0 2px 12px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.04);
  animation: sel-open .16s cubic-bezier(.22,.68,0,1.2) both;
  transform-origin: top center;

  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.08) transparent;
}
.sel-list::-webkit-scrollbar { width: 4px; }
.sel-list::-webkit-scrollbar-track { background: transparent; }
.sel-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 99px; }
.sel-list::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.14); }

.sel-opt {
  display: flex; align-items: center; gap: 9px;
  padding: 8.5px 10px; border-radius: 7px; cursor: pointer;
  font-size: 13px; font-weight: 500; color: var(--t2);
  transition: background .1s, color .1s;
  user-select: none;
}
.sel-opt:hover {
  background: rgba(255,255,255,.055); color: var(--t1);
}
.sel-opt-on {
  background: rgba(34,197,94,.08) !important;
  color: #22C55E !important;
}
.sel-opt-on:hover { background: rgba(34,197,94,.12) !important; }

.sel-check {
  width: 16px; height: 16px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #22C55E;
}

.sel-opt-text { flex: 1; }

/* ─ Mobile ─────────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .ap-hamburger { display: flex; }
  /* Extra 8px of vertical breathing room for logo and menu */
  .ap-topbar-row { height: 54px; }
  .ap-sidebar {
    position: fixed;
    /* Sidebar anchors below taller mobile topbar + safe area */
    top: calc(54px + env(safe-area-inset-top));
    left: 0; bottom: 0;
    z-index: 50; transform: translateX(-100%);
    width: 230px; box-shadow: 6px 0 32px rgba(0,0,0,.6);
  }
  .ap-sidebar-open { transform: translateX(0); }
}
@media (max-width: 640px) {
  .ap-content { padding: 12px 12px; }
  .ap-topbar-row { padding: 0 12px; }
  /* Mobile status: show text label, hide the pulsing dot (no floating dot bug) */
  .ap-live-dot { display: none; }
  .ap-engine-live { font-size: 8px; letter-spacing: .06em; gap: 0; }
  .ap-topbar-tag { display: none; }
  .ap-topbar-aid { display: none; }
  .ap-geral-stats { grid-template-columns: 1fr 1fr; }
  .ap-geral-action { flex-direction: column; align-items: flex-start; }
  .ap-geral-recent-row { grid-template-columns: 1fr 36px 28px 50px; }
  .ap-geral-recent-id, .ap-geral-recent-odd, .ap-geral-recent-bar { display: none; }
  .ap-metrics-grid { grid-template-columns: 1fr 1fr; }
  .ap-ai-grid { grid-template-columns: 1fr; }
  .ap-row-2 { grid-template-columns: 1fr; }
  .ap-score-hero { flex-direction: column; align-items: flex-start; gap: 18px; padding: 18px 16px; }
  .ap-score-data-lbl { min-width: 80px; }
  .ap-hist-row { grid-template-columns: 1fr 36px 28px 52px; }
  .ap-hist-id, .ap-hist-odd, .ap-hist-bar, .ap-hist-ts { display: none; }
  .ap-loading-pct { font-size: 44px; }

  /* Form mobile — compact for first-fold visibility */
  .ap-input-panel { padding: 16px 14px 18px; border-radius: 12px; }
  .ap-form { gap: 11px; }
  .ap-field { gap: 5px; }
  .ap-input { padding: 9px 11px; font-size: 13.5px; }
  .ap-input-odd { font-size: 20px; }
  .ap-submit { padding: 14px 20px; font-size: 11.5px; margin-top: 4px; }

  /* Dashboard mobile */
  .db-cards { grid-template-columns: 1fr; }
  .db-card-risco { grid-column: 1; }
  .db-risco-score { font-size: 56px; }
  .db-big-num { font-size: 36px; }
  .db-big-red { font-size: 28px; }
  .db-leitura-status { font-size: 16px; }
  .db-card { padding: 16px 15px; }
  .db-event-strip { gap: 7px; padding: 10px 13px; }
  .db-actions { flex-direction: column; align-items: stretch; }
  .db-btn-primary, .db-btn-copy { justify-content: center; padding: 14px 20px; }
  .db-rbar-labels { font-size: 7px; }

  /* Result card mobile */
  .db-rc-header { padding: 14px 16px 12px; }
  .db-rc-event  { font-size: 15px; }
  .db-rc-risk   { padding: 14px 16px; }
  .db-rc-score  { font-size: 48px; }
  .db-rc-data   { padding: 14px 16px; flex-direction: column; gap: 16px; }
  .db-rc-data-sep { width: 100%; height: 1px; align-self: auto; margin: 0; }
  .db-rc-big    { font-size: 28px; }
  .db-rc-ai     { padding: 14px 16px; }
  .db-rc-ai-verdict { font-size: 15px; }
}

/* ─ Form separator (optional section) ─────────────────────────────────────── */
.ap-form-sep {
  display: flex; align-items: center; gap: 12px;
  padding: 4px 0;
}
.ap-form-sep::before,
.ap-form-sep::after {
  content: ''; flex: 1; height: 1px; background: rgba(255,255,255,.06);
}
.ap-form-sep-lbl {
  font-size: 8px; font-weight: 700; letter-spacing: .16em;
  color: var(--t3); text-transform: uppercase; flex-shrink: 0;
}

/* ─ Select placeholder state ───────────────────────────────────────────────── */
.sel-placeholder { color: rgba(255,255,255,.32) !important; }
.sel-opt-dim { color: var(--t3) !important; font-style: italic; }

/* ─ Result Card — db-rc-* ──────────────────────────────────────────────────── */
.db-result-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  animation: db-card-in .28s ease both;
  transition: border-color .14s;
}
.db-result-card:hover { border-color: var(--bmd); }

/* Header */
.db-rc-header {
  padding: 16px 20px 14px;
  display: flex; flex-direction: column; gap: 8px;
}
.db-rc-event {
  font-size: 18px; font-weight: 800;
  color: var(--t1); letter-spacing: -0.03em; line-height: 1.15;
}
.db-rc-meta {
  display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
}
.db-rc-badge {
  padding: 3px 9px; border-radius: 5px;
  background: rgba(255,255,255,.06); border: 1px solid var(--border);
  font-size: 9.5px; font-weight: 700; letter-spacing: .05em;
  color: var(--t3); text-transform: uppercase;
}
.db-rc-odd {
  font-size: 11px; font-weight: 700;
  color: var(--t2); font-variant-numeric: tabular-nums;
}
.db-rc-valor {
  font-size: 11px; color: var(--t3);
  font-variant-numeric: tabular-nums;
}

/* Divider */
.db-rc-divider { height: 1px; background: var(--border); }

/* Shared section label */
.db-rc-label {
  font-size: 8px; font-weight: 800; letter-spacing: .18em;
  color: var(--t3); text-transform: uppercase; display: block;
}

/* Risk section */
.db-rc-risk {
  padding: 16px 20px; display: flex; flex-direction: column; gap: 10px;
}
.db-rc-risk-top {
  display: flex; justify-content: space-between; align-items: center;
}
.db-rc-level {
  font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase;
}
.db-rc-score {
  font-size: 60px; font-weight: 900; line-height: 1;
  letter-spacing: -0.06em; font-variant-numeric: tabular-nums;
  transition: color .4s;
}
.db-rc-score-denom {
  font-size: 22px; font-weight: 600; color: var(--t3); letter-spacing: 0;
}
.db-rc-phrase {
  font-size: 12px; color: var(--t3); line-height: 1.55; margin-top: -2px;
}

/* Data section */
.db-rc-data {
  padding: 16px 20px;
  display: flex; align-items: flex-start; gap: 0;
}
.db-rc-data-item {
  flex: 1; display: flex; flex-direction: column; gap: 5px;
}
.db-rc-data-sep {
  width: 1px; background: var(--border); flex-shrink: 0;
  align-self: stretch; margin: 0 20px;
}
.db-rc-big {
  font-size: 34px; font-weight: 900; line-height: 1;
  letter-spacing: -0.05em; font-variant-numeric: tabular-nums;
  color: var(--t1);
}
.db-rc-big-green { color: #22C55E; }
.db-rc-sym {
  font-size: 18px; font-weight: 600; color: var(--t3); letter-spacing: 0;
}
.db-rc-sub {
  font-size: 11px; color: var(--t3); line-height: 1.5;
}

/* AI section */
.db-rc-ai {
  padding: 16px 20px; display: flex; flex-direction: column; gap: 8px;
}
.db-rc-ai-verdict {
  display: flex; align-items: center; gap: 8px;
  font-size: 18px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2;
  transition: color .3s;
}
.db-rc-ai-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  animation: ap-pulse 2.8s ease-in-out infinite;
}
.db-rc-ai-sentence {
  font-size: 12.5px; color: var(--t2); line-height: 1.7;
  font-style: italic;
  background: rgba(255,255,255,.025); border: 1px solid var(--border);
  border-radius: 8px; padding: 10px 12px; margin-top: 2px;
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOGOS DE HOJE — jg-* components
   ═══════════════════════════════════════════════════════════════════════════ */

@keyframes jg-card-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes jg-dot-bounce {
  0%, 80%, 100% { transform: scale(0.4); opacity: .3; }
  40%           { transform: scale(1);   opacity: 1; }
}

/* Loading state */
.jg-loading {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 48px 0;
}
.jg-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--t3);
  animation: jg-dot-bounce 1.4s ease-in-out infinite;
}
.jg-dot:nth-child(2) { animation-delay: .18s; }
.jg-dot:nth-child(3) { animation-delay: .36s; }
.jg-loading-lbl {
  font-size: 11px; color: var(--t3); margin-left: 8px; letter-spacing: .03em;
}

/* League filter pills */
.jg-filters {
  display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 2px;
}
.jg-pill {
  padding: 5px 13px; border-radius: 99px;
  background: rgba(255,255,255,.04); border: 1px solid var(--border);
  font-size: 10px; font-weight: 700; letter-spacing: .04em; color: var(--t2);
  cursor: pointer; font-family: inherit; transition: all .13s;
  white-space: nowrap;
}
.jg-pill:hover { color: var(--t1); border-color: var(--bmd); background: rgba(255,255,255,.07); }
.jg-pill-on {
  background: rgba(34,197,94,.1) !important;
  border-color: rgba(34,197,94,.3) !important;
  color: var(--green) !important;
}

/* Match cards grid */
.jg-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}

.jg-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 13px;
  cursor: pointer; font-family: inherit; text-align: left;
  width: 100%; color: inherit;
  transition: border-color .15s, transform .13s, background .15s, box-shadow .15s;
  animation: jg-card-in .24s ease both;
}
.jg-card:hover {
  border-color: rgba(34,197,94,.26);
  background: rgba(34,197,94,.03);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0,0,0,.3), 0 0 0 1px rgba(34,197,94,.06) inset;
}
.jg-card:active { transform: translateY(0); }

.jg-card-header {
  display: flex; justify-content: space-between; align-items: center; gap: 6px;
}
.jg-league {
  font-size: 8px; font-weight: 800; letter-spacing: .14em;
  color: var(--t3); text-transform: uppercase;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.jg-time {
  font-size: 10px; font-weight: 700; color: var(--t2);
  font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.jg-teams {
  display: flex; align-items: center; gap: 8px;
}
.jg-team {
  font-size: 13px; font-weight: 700; color: var(--t1);
  letter-spacing: -0.02em; line-height: 1.25; flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.jg-team-away { text-align: right; }
.jg-vs {
  font-size: 10px; font-weight: 700; color: var(--t3); flex-shrink: 0;
}

.jg-card-footer { display: flex; justify-content: flex-end; }
.jg-cta {
  font-size: 9.5px; font-weight: 800; letter-spacing: .06em;
  color: rgba(34,197,94,.4); transition: color .13s; text-transform: uppercase;
}
.jg-card:hover .jg-cta { color: var(--green); }

/* Hint text */
.jg-hint {
  font-size: 10.5px; color: var(--t3); text-align: center;
  padding: 4px 0 6px; line-height: 1.6; opacity: .7;
}

/* ─ Selected game strip ─────────────────────────────────────────────────────── */
.ap-game-strip {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  background: rgba(34,197,94,.06);
  border: 1px solid rgba(34,197,94,.2);
  border-radius: 10px; padding: 10px 14px;
  animation: ap-fade-up .18s ease both;
}
.ap-game-strip-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--green);
  flex-shrink: 0; animation: ap-pulse 2.4s ease-in-out infinite;
}
.ap-game-strip-text {
  font-size: 13px; font-weight: 700; color: var(--t1);
  letter-spacing: -0.02em; flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ap-game-strip-league {
  font-size: 9px; font-weight: 800; letter-spacing: .1em;
  color: rgba(34,197,94,.7); text-transform: uppercase; flex-shrink: 0;
}
.ap-game-strip-time {
  font-size: 10px; color: var(--t3); font-variant-numeric: tabular-nums;
  font-family: 'Courier New', monospace; flex-shrink: 0;
}
.ap-game-strip-clear {
  background: none; border: none; cursor: pointer;
  font-size: 16px; color: var(--t3); line-height: 1;
  padding: 0 2px; display: flex; align-items: center; justify-content: center;
  transition: color .12s; flex-shrink: 0; width: 20px; height: 20px;
}
.ap-game-strip-clear:hover { color: var(--t1); }

/* Mobile responsive */
@media (max-width: 640px) {
  .jg-grid { grid-template-columns: 1fr; }
  .jg-card { padding: 14px 15px; gap: 11px; }
  .jg-team { font-size: 12.5px; }
  .ap-game-strip { padding: 9px 12px; }
  .ap-game-strip-text { font-size: 12px; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOGOS v2 — premium match cards + live status
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Panel header right block ──────────────────────────────────────────────── */
.jg-hdr-right {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
.jg-data-badge {
  display: flex; align-items: center; gap: 5px;
  font-size: 7.5px; font-weight: 800; letter-spacing: .13em;
  color: rgba(34,197,94,.6);
  background: rgba(34,197,94,.06); border: 1px solid rgba(34,197,94,.16);
  border-radius: 99px; padding: 4px 9px; white-space: nowrap;
}
.jg-data-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--green); flex-shrink: 0;
  animation: ap-pulse 2.2s ease-in-out infinite;
}
.jg-updated {
  font-size: 8.5px; color: var(--t3); font-variant-numeric: tabular-nums;
  font-family: 'Courier New', monospace; letter-spacing: .03em; flex-shrink: 0;
}
.jg-refresh-btn {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
  background: rgba(255,255,255,.04); border: 1px solid var(--border);
  color: var(--t2); cursor: pointer; transition: all .13s; flex-shrink: 0;
}
.jg-refresh-btn:hover:not(:disabled) { color: var(--t1); border-color: var(--bmd); background: rgba(255,255,255,.07); }
.jg-refresh-btn:disabled { opacity: .35; cursor: not-allowed; }

/* ── Status rows ───────────────────────────────────────────────────────────── */
.jg-status-row {
  display: flex; align-items: center; gap: 5px; min-height: 14px;
}
.jg-live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #EF4444; flex-shrink: 0;
  animation: ap-pulse 1.4s ease-in-out infinite;
}
.jg-status-live-text {
  font-size: 7.5px; font-weight: 800; letter-spacing: .14em; color: #EF4444; text-transform: uppercase;
}
.jg-elapsed {
  font-size: 10px; font-weight: 700; color: rgba(239,68,68,.65);
  font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace;
}
.jg-status-ended-text {
  font-size: 7.5px; font-weight: 800; letter-spacing: .12em; color: var(--t3); text-transform: uppercase;
}

/* ── Match layout ──────────────────────────────────────────────────────────── */
.jg-matchup {
  display: flex; align-items: center; gap: 8px; min-width: 0;
}
.jg-team-name {
  font-size: 13px; font-weight: 700; color: var(--t1);
  letter-spacing: -0.02em; flex: 1; line-height: 1.2;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.jg-team-right { text-align: right; }
.jg-score-center { flex-shrink: 0; }
.jg-score-pair { display: flex; align-items: center; gap: 2px; }
.jg-score-num {
  font-size: 20px; font-weight: 900; line-height: 1;
  font-variant-numeric: tabular-nums; color: var(--t1); min-width: 16px; text-align: center;
}
.jg-score-dash { font-size: 11px; color: var(--t3); font-weight: 700; margin: 0 1px; }

/* ── Card state variants ───────────────────────────────────────────────────── */

/* Live: red-tinted border, pulsing glow */
@keyframes jg-live-pulse {
  0%, 100% { border-color: rgba(239,68,68,.18); }
  50%       { border-color: rgba(239,68,68,.38); box-shadow: 0 0 18px rgba(239,68,68,.07); }
}
.jg-card-live {
  border-color: rgba(239,68,68,.2);
  animation: jg-card-in .24s ease both, jg-live-pulse 2.4s ease-in-out infinite;
}
.jg-card-live:hover {
  animation: none !important;
  border-color: rgba(239,68,68,.45) !important;
  background: rgba(239,68,68,.03) !important;
  transform: translateY(-2px);
}
.jg-card-live .jg-team-name { color: var(--t1); }

/* Ended: dimmed */
.jg-card-ended { opacity: .55; }
.jg-card-ended:hover {
  opacity: .78; transform: translateY(-1px) !important;
  border-color: var(--bmd) !important; background: rgba(255,255,255,.02) !important;
  box-shadow: none !important;
}
.jg-card-ended .jg-team-name { color: var(--t2); }
.jg-card-ended .jg-score-num { color: var(--t2); }
.jg-card-ended .jg-cta { color: rgba(255,255,255,.16); }

/* ── Filter pill live variant ──────────────────────────────────────────────── */
.jg-pill-live { color: rgba(239,68,68,.65) !important; }
.jg-pill-live.jg-pill-on {
  background: rgba(239,68,68,.1) !important;
  border-color: rgba(239,68,68,.28) !important;
  color: #EF4444 !important;
}
.jg-pill-dot {
  display: inline-block; width: 5px; height: 5px; border-radius: 50%;
  background: currentColor; margin-right: 4px; vertical-align: middle;
  animation: ap-pulse 1.4s ease-in-out infinite;
}

/* ── Error retry button ────────────────────────────────────────────────────── */
.jg-retry-btn {
  display: inline-block; margin-left: 10px;
  font-size: 11px; font-weight: 700; color: var(--red); cursor: pointer;
  background: none; border: none; font-family: inherit;
  text-decoration: underline; padding: 0;
}

/* ── Disclaimer ────────────────────────────────────────────────────────────── */
.jg-disclaimer {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 10.5px; color: var(--t3); line-height: 1.65;
  padding: 11px 14px;
  background: rgba(255,255,255,.02); border: 1px solid var(--border);
  border-radius: 9px;
}
.jg-disclaimer svg { flex-shrink: 0; margin-top: 2px; opacity: .45; }

/* ── Selected game strip — live variant ────────────────────────────────────── */
.ap-game-strip-live {
  background: rgba(239,68,68,.05) !important;
  border-color: rgba(239,68,68,.22) !important;
}
.ap-gsd-live { background: #EF4444 !important; }
.ap-gsd-live-badge {
  font-size: 8.5px; font-weight: 800; letter-spacing: .1em;
  color: rgba(239,68,68,.75); text-transform: uppercase; flex-shrink: 0;
  animation: ap-blink 1.6s ease-in-out infinite;
}

/* ── Odd sugestiva ─────────────────────────────────────────────────────────── */
.ap-odd-sug {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 9px 13px;
  background: rgba(34,197,94,.04); border: 1px solid rgba(34,197,94,.14);
  border-radius: 8px; animation: ap-fade-up .17s ease both;
}
.ap-odd-sug-icon { font-size: 12px; flex-shrink: 0; line-height: 1; }
.ap-odd-sug-text {
  font-size: 11.5px; color: var(--t2); flex: 1; min-width: 0; line-height: 1.4;
}
.ap-odd-sug-text em  { font-style: normal; color: var(--t1); font-weight: 600; }
.ap-odd-sug-text strong { color: var(--green); font-weight: 800; }
.ap-odd-sug-btn {
  padding: 5px 13px; border-radius: 6px; flex-shrink: 0;
  background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.22);
  color: var(--green); font-size: 10px; font-weight: 800; letter-spacing: .06em;
  cursor: pointer; font-family: inherit; white-space: nowrap;
  transition: background .12s, border-color .12s;
}
.ap-odd-sug-btn:hover { background: rgba(34,197,94,.18); border-color: rgba(34,197,94,.38); }

/* ── Jogos v2 mobile ───────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .jg-data-badge { display: none; }  /* too wide on narrow screens */
  .jg-hdr-right { gap: 6px; }
  .jg-team-name { font-size: 12px; }
  .jg-score-num { font-size: 18px; }
  .jg-disclaimer { font-size: 10px; }
  .ap-odd-sug { padding: 8px 11px; }
  .ap-odd-sug-text { font-size: 11px; }
}
`;export{la as default};
