import{r as i,j as e}from"./vendor-BnG4zNoI.js";import"./landing-Da8aCnG2.js";const Ne=["Resultado da partida","Mais ou menos gols","Ambos marcam","Handicap","Empate devolve","Chance dupla","Primeiro gol","Escanteios","Cartões","Múltipla"],te={"Resultado da partida":"Análise baseada no vencedor da partida.","Mais ou menos gols":"Análise baseada na quantidade total de gols.","Ambos marcam":"Análise baseada na possibilidade dos dois times marcarem.",Handicap:"Análise com vantagem ou desvantagem aplicada a um dos times.","Empate devolve":"Aposta é devolvida se a partida terminar empatada.","Chance dupla":"Cobre dois dos três resultados possíveis da partida.","Primeiro gol":"Análise baseada em qual time marca o primeiro gol.",Escanteios:"Análise baseada no número total de escanteios da partida.",Cartões:"Análise baseada no número de cartões durante a partida.",Múltipla:"Combinação de múltiplas apostas em um único bilhete."},A=[{label:"Calibrando modelo probabilístico",pct:16},{label:"Calculando probabilidade implícita",pct:32},{label:"Detectando distorção da casa",pct:52},{label:"Estimando valor esperado",pct:70},{label:"Computando MOTORIA RISK INDEX™",pct:86},{label:"Compilando relatório quantitativo",pct:96}],M="motoria_token",oe="motoria_hist_v2",se=8,we="https://pay.kiwify.com.br/DIVD8zl";function H(t){return 1/t*100}function ye(t){return t<=1.4?4:t<=1.7?4.8:t<=2.2?5.5:t<=3?6.5:8}function ke(t,l){return t/100*(l-1)*100-(1-t/100)*100}function ie(t){const l=H(t),o=Math.min(100,Math.round(100-l));let p,n,d;return o<=30?(p="BAIXO",n="#22C55E",d="FAVORÁVEL"):o<=60?(p="MODERADO",n="#F59E0B",d="NEUTRO"):o<=80?(p="ALTO",n="#F97316",d="DESFAVORÁVEL"):(p="CRÍTICO",n="#EF4444",d="DESFAVORÁVEL"),{score:o,label:p,color:n,verdict:d}}function S(t,l){const o=t.match(new RegExp(`^${l}:[^\\n]*\\n([\\s\\S]*?)(?=\\n[A-Z_]{3,}:|$)`,"m")),p=t.match(new RegExp(`^${l}:\\s*(.+)`,"m"));return(o?o[1].trim():null)||(p?p[1].trim():null)}function Ce(t){return{riscoPrincipal:S(t,"RISCO_PRINCIPAL"),cenarioNecessario:S(t,"CENARIO_NECESSARIO"),oQuePodeDarErrado:S(t,"O_QUE_PODE_DAR_ERRADO"),leituraConservadora:S(t,"LEITURA_CONSERVADORA"),alertaFinal:S(t,"ALERTA_FINAL")}}function Ie(){try{return JSON.parse(localStorage.getItem(oe)||"[]")}catch{return[]}}function Ee(t){try{localStorage.setItem(oe,JSON.stringify(t))}catch{}}function Se(t){return t.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}function ze(){return new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}const Oe=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("rect",{x:"1.5",y:"1.5",width:"4.5",height:"4.5",rx:"1.2",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("rect",{x:"8",y:"1.5",width:"4.5",height:"4.5",rx:"1.2",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("rect",{x:"1.5",y:"8",width:"4.5",height:"4.5",rx:"1.2",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("rect",{x:"8",y:"8",width:"4.5",height:"4.5",rx:"1.2",stroke:"currentColor",strokeWidth:"1.3"})]}),Ae=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("path",{d:"M2 11L5 7.5L8 9.5L12 3.5",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round",strokeLinejoin:"round"}),e.jsx("circle",{cx:"5",cy:"7.5",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"8",cy:"9.5",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"12",cy:"3.5",r:"1",fill:"currentColor"})]}),Me=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("path",{d:"M2 10V6M5 10V4M8 10V7M11 10V3",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round"}),e.jsx("path",{d:"M1 12.5h12",stroke:"currentColor",strokeWidth:"1.2",strokeLinecap:"round",opacity:".4"})]}),Le=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("circle",{cx:"7",cy:"7",r:"2",fill:"currentColor",fillOpacity:".9"}),e.jsx("path",{d:"M3.5 3.5a5 5 0 0 0 0 7M10.5 3.5a5 5 0 0 1 0 7",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"})]}),Re=()=>e.jsx("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M7 1.5l1.5 3.2L12 5.3l-2.5 2.4.6 3.4L7 9.5l-3.1 1.6.6-3.4L2 5.3l3.5-.6L7 1.5z",stroke:"currentColor",strokeWidth:"1.3",strokeLinejoin:"round"})}),De=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("circle",{cx:"7",cy:"7",r:"5",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M7 4.5V7L8.8 8.8",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"})]}),Te=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("circle",{cx:"7",cy:"7",r:"2",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M7 1v2M7 11v2M1 7h2M11 7h2M3.22 3.22l1.41 1.41M9.37 9.37l1.41 1.41M3.22 10.78l1.41-1.41M9.37 4.63l1.41-1.41",stroke:"currentColor",strokeWidth:"1.2",strokeLinecap:"round"})]});function N({label:t,value:l,color:o,sub:p,tm:n}){return e.jsxs("div",{className:"ap-metric-card",children:[e.jsx("div",{className:"ap-metric-val",style:{color:o},children:l}),e.jsxs("div",{className:"ap-metric-label",children:[t,n&&e.jsx("span",{className:"ap-tm",children:"™"})]}),p&&e.jsx("div",{className:"ap-metric-sub",children:p})]})}function L({mod:t,title:l,children:o}){return o?e.jsxs("div",{className:"ap-ai-card",children:[e.jsx("div",{className:"ap-ai-card-mod",children:t}),e.jsx("div",{className:"ap-ai-card-title",children:l}),e.jsx("p",{className:"ap-ai-card-text",children:o})]}):null}function W({mod:t,title:l,desc:o}){return e.jsxs("div",{className:"ap-content",children:[e.jsx("div",{className:"ap-panel-hdr",children:e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:t}),e.jsx("div",{className:"ap-panel-title",children:l})]})}),e.jsxs("div",{className:"ap-coming-panel",children:[e.jsx("div",{className:"ap-coming-icon","aria-hidden":"true",children:e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 22 22",fill:"none",children:[e.jsx("rect",{x:"1.5",y:"1.5",width:"19",height:"19",rx:"5",stroke:"rgba(255,255,255,.1)",strokeWidth:"1.5"}),e.jsx("path",{d:"M8 11h6M11 8v6",stroke:"rgba(255,255,255,.15)",strokeWidth:"1.5",strokeLinecap:"round"})]})}),e.jsx("p",{className:"ap-coming-desc",children:o}),e.jsx("div",{className:"ap-coming-tag",children:"Em desenvolvimento · Próxima versão"})]})]})}function Fe({id:t,options:l,value:o,onChange:p}){const[n,d]=i.useState(!1),g=i.useRef(null);return i.useEffect(()=>{if(!n)return;function c(b){b.key==="Escape"&&d(!1)}function f(b){g.current&&!g.current.contains(b.target)&&d(!1)}return document.addEventListener("keydown",c),document.addEventListener("mousedown",f),()=>{document.removeEventListener("keydown",c),document.removeEventListener("mousedown",f)}},[n]),e.jsxs("div",{className:"sel-wrap",ref:g,children:[e.jsxs("button",{id:t,type:"button",className:`sel-trigger${n?" sel-trigger-open":""}`,onClick:()=>d(c=>!c),"aria-haspopup":"listbox","aria-expanded":n,children:[e.jsx("span",{className:"sel-val",children:o}),e.jsx("span",{className:`sel-chev${n?" sel-chev-up":""}`,"aria-hidden":"true",children:e.jsx("svg",{width:"10",height:"10",viewBox:"0 0 12 12",fill:"none",children:e.jsx("path",{d:"M2.5 4.5L6 8L9.5 4.5",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round"})})})]}),n&&e.jsx("ul",{className:"sel-list",role:"listbox","aria-label":"Mercado",children:l.map(c=>e.jsxs("li",{role:"option","aria-selected":c===o,className:`sel-opt${c===o?" sel-opt-on":""}`,onMouseDown:f=>f.preventDefault(),onClick:()=>{p(c),d(!1)},children:[e.jsx("span",{className:"sel-check","aria-hidden":"true",children:c===o&&e.jsx("svg",{width:"9",height:"9",viewBox:"0 0 12 12",fill:"none",children:e.jsx("path",{d:"M2.5 6L5 8.5L9.5 3.5",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round"})})}),e.jsx("span",{className:"sel-opt-text",children:c})]},c))})]})}function Be(){i.useEffect(()=>{const a=document.title;return document.title="MotorIA Risk Engine™",()=>{document.title=a}},[]);const[t,l]=i.useState(new Date);i.useEffect(()=>{const a=setInterval(()=>l(new Date),1e3);return()=>clearInterval(a)},[]);const[o,p]=i.useState(!1);i.useEffect(()=>{try{const a=new URLSearchParams(window.location.search),s=a.get("t")||a.get("token");if(s&&s.length>10){localStorage.setItem(M,s),V(s),p(!0),window.history.replaceState(null,"",window.location.pathname);const u=setTimeout(()=>p(!1),4200);return()=>clearTimeout(u)}}catch{}},[]);const[n,d]=i.useState(!1),[g,c]=i.useState("nova");function f(a){c(a),d(!1)}const[b,U]=i.useState(""),[w,ne]=i.useState("Resultado da partida"),[y,_]=i.useState(""),[Y,le]=i.useState(""),[K,pe]=i.useState(""),[R,z]=i.useState(!1),[k,G]=i.useState(0),[D,T]=i.useState(0),[X,C]=i.useState(""),[r,O]=i.useState(null),[x,de]=i.useState(Ie),[F,V]=i.useState(()=>localStorage.getItem(M)||""),[q,ce]=i.useState(null),[Q,xe]=i.useState(null),m=parseFloat((y||"").replace(",",".")),$=y&&!isNaN(m)&&m>=1.01?ie(m):null,I=x.length?Math.round(x.reduce((a,s)=>a+(s.score||0),0)/x.length):null,J=x[0]||null;async function ge(a){if(a.preventDefault(),!y||isNaN(m)||m<1.01){C("Informe uma odd válida (mínimo 1.01).");return}z(!0),C(""),O(null),G(0),T(A[0].pct);let s=0;const u=setInterval(()=>{s=Math.min(s+1,A.length-1),G(s),T(A[s].pct)},820);try{const P=`Aposta: ${b||"não informado"} | Tipo: ${w} | Odd: ${y} | Valor: R$${Y||"100"} | Obs: ${K||"nenhuma"}`,j=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json",...F?{"x-motoria-token":F}:{}},body:JSON.stringify({tool:"chance_de_perder",userMessage:P})});if(clearInterval(u),j.status===402){window.location.href=we;return}if(!j.ok){const je=await j.json().catch(()=>({}));C(je.error||"Erro ao processar análise."),z(!1);return}const h=await j.json(),E=h.content?.[0]?.text||"";h.credits!==void 0&&ce(h.credits),h.token&&(localStorage.setItem(M,h.token),V(h.token));const v=H(m),ee=ye(m),ue=v/(1-ee/100),ae=Math.min(ue,99),fe=ke(v,m),be=ie(m),ve=Math.min(100,Math.round((100-ae)*1.1)),B={id:Math.floor(Math.random()*8e3)+2e3,ts:ze(),jogo:b||"Aposta",tipo:w,odd:m,impl:v.toFixed(2),justa:ae.toFixed(2),vig:ee.toFixed(2),ev:fe.toFixed(2),perda:(100-v).toFixed(1),exposure:ve,...be,ai:Ce(E)};O(B),xe(B.id);const re=[B,...x].slice(0,se);de(re),Ee(re),T(100),setTimeout(()=>z(!1),280)}catch{clearInterval(u),C("Erro de conexão. Tente novamente."),z(!1)}}function Z(a){O(a),U(a.jogo||""),_(String(a.odd)),c("nova")}function me(){O(null),C("")}const he=[{group:"ANÁLISE",items:[{id:"geral",label:"Visão Geral",Icon:Oe},{id:"nova",label:"Nova Análise",Icon:Ae},{id:"comparador",label:"Comparador",Icon:Me,dim:!0}]},{group:"MERCADOS",items:[{id:"aovivo",label:"Ao Vivo",Icon:Le,live:!0,dim:!0},{id:"favoritos",label:"Favoritos",Icon:Re,dim:!0}]},{group:"ARQUIVO",items:[{id:"historico",label:"Histórico",Icon:De,badge:x.length||null}]},{group:"SISTEMA",items:[{id:"config",label:"Configurações",Icon:Te}]}];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:Ve}),n&&e.jsx("div",{className:"ap-overlay",onClick:()=>d(!1),"aria-hidden":"true"}),o&&e.jsxs("div",{className:"ap-access-banner",role:"status","aria-live":"polite",children:[e.jsx("span",{className:"ap-access-banner-dot","aria-hidden":"true"}),"Acesso ativado — plataforma pronta para uso"]}),e.jsxs("div",{className:"ap-shell",children:[e.jsxs("header",{className:"ap-topbar",children:[e.jsxs("div",{className:"ap-topbar-left",children:[e.jsxs("button",{className:"ap-hamburger",onClick:()=>d(a=>!a),"aria-label":"Menu","aria-expanded":n,children:[e.jsx("span",{}),e.jsx("span",{}),e.jsx("span",{})]}),e.jsxs("div",{className:"ap-topbar-brand",children:[e.jsx("div",{className:"ap-logo-mark","aria-hidden":"true",children:e.jsxs("svg",{width:"10",height:"10",viewBox:"0 0 14 14",fill:"none",children:[e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"#060608"}),e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"currentColor",fillOpacity:".95"})]})}),e.jsx("span",{className:"ap-topbar-name",children:"MotorIA"}),e.jsx("span",{className:"ap-topbar-sep","aria-hidden":"true",children:"·"}),e.jsx("span",{className:"ap-topbar-tag",children:"Risk Engine™"})]})]}),e.jsxs("div",{className:"ap-topbar-center",children:[e.jsx("span",{className:"ap-topbar-clock",children:Se(t)}),Q&&e.jsxs("span",{className:"ap-topbar-aid",children:[" · #",Q]})]}),e.jsxs("div",{className:"ap-topbar-right",children:[q!==null&&e.jsx("div",{className:"ap-credits-wrap",title:"Créditos restantes",children:e.jsx("div",{className:"ap-credits-bar",children:e.jsx("div",{className:"ap-credits-fill",style:{width:`${Math.max(0,q/20*100)}%`}})})}),e.jsxs("div",{className:"ap-engine-live",children:[e.jsx("span",{className:"ap-live-dot","aria-hidden":"true"}),e.jsx("span",{className:"ap-live-lbl",children:"ENGINE ATIVO"})]})]})]}),e.jsxs("div",{className:"ap-body",children:[e.jsxs("nav",{className:`ap-sidebar${n?" ap-sidebar-open":""}`,"aria-label":"Navegação",children:[e.jsxs("div",{className:"ap-sidebar-brand",children:[e.jsx("div",{className:"ap-sidebar-brand-mark","aria-hidden":"true",children:e.jsx("svg",{width:"9",height:"9",viewBox:"0 0 14 14",fill:"none",children:e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"#22C55E"})})}),e.jsx("span",{className:"ap-sidebar-brand-name",children:"MotorIA Pro"})]}),e.jsx("div",{className:"ap-sidebar-divider",role:"separator"}),he.map(({group:a,items:s})=>e.jsxs("div",{className:"ap-sidebar-group",children:[e.jsx("div",{className:"ap-sidebar-group-lbl",children:a}),s.map(({id:u,label:P,Icon:j,badge:h,live:E,dim:v})=>e.jsxs("button",{className:`ap-nav-item${g===u?" ap-nav-active":""}${v?" ap-nav-dim":""}`,onClick:()=>f(u),"aria-current":g===u?"page":void 0,children:[e.jsx("span",{className:"ap-nav-icon",children:e.jsx(j,{})}),e.jsx("span",{className:"ap-nav-label",children:P}),E&&e.jsx("span",{className:"ap-nav-live-dot","aria-label":"ao vivo"}),h>0&&!E&&e.jsx("span",{className:"ap-nav-badge","aria-label":`${h} itens`,children:h}),v&&!E&&e.jsx("span",{className:"ap-nav-soon","aria-label":"em breve",children:e.jsxs("svg",{width:"8",height:"8",viewBox:"0 0 10 10",fill:"none",children:[e.jsx("path",{d:"M5 2v3.5M5 7v.5",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round"}),e.jsx("circle",{cx:"5",cy:"5",r:"4",stroke:"currentColor",strokeWidth:"1.2",opacity:".5"})]})})]},u))]},a)),e.jsxs("div",{className:"ap-sidebar-engine",children:[e.jsx("div",{className:"ap-sidebar-engine-dot","aria-hidden":"true"}),e.jsxs("div",{className:"ap-sidebar-engine-info",children:[e.jsx("span",{className:"ap-sidebar-engine-name",children:"RISK ENGINE v2.4"}),e.jsx("span",{className:"ap-sidebar-engine-status",children:"ONLINE"})]})]})]}),e.jsxs("main",{className:"ap-main",children:[g==="geral"&&e.jsxs("div",{className:"ap-content",children:[e.jsxs("div",{className:"ap-panel-hdr",children:[e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:"MÓDULO I"}),e.jsx("div",{className:"ap-panel-title",children:"Visão Geral"})]}),e.jsxs("div",{className:"ap-panel-online",children:[e.jsx("span",{className:"ap-status-dot","aria-hidden":"true"}),"SISTEMA ONLINE"]})]}),e.jsxs("div",{className:"ap-geral-stats",children:[e.jsxs("div",{className:"ap-geral-stat",children:[e.jsx("div",{className:"ap-geral-stat-val",children:x.length}),e.jsx("div",{className:"ap-geral-stat-lbl",children:"ANÁLISES"})]}),e.jsxs("div",{className:"ap-geral-stat",children:[e.jsx("div",{className:"ap-geral-stat-val",style:{color:I!==null?I>60?"#EF4444":I>40?"#F59E0B":"#22C55E":"var(--t3)"},children:I!==null?I:"—"}),e.jsx("div",{className:"ap-geral-stat-lbl",children:"SCORE MÉDIO"})]}),e.jsxs("div",{className:"ap-geral-stat",children:[e.jsx("div",{className:"ap-geral-stat-val",children:J?J.odd.toFixed(2):"—"}),e.jsx("div",{className:"ap-geral-stat-lbl",children:"ÚLTIMA ODD"})]}),e.jsxs("div",{className:"ap-geral-stat",children:[e.jsx("div",{className:"ap-geral-stat-val ap-geral-stat-val-sm",children:"v2.4"}),e.jsx("div",{className:"ap-geral-stat-lbl",children:"ENGINE"})]})]}),e.jsxs("div",{className:"ap-geral-action",children:[e.jsxs("div",{className:"ap-geral-action-left",children:[e.jsx("div",{className:"ap-geral-action-title",children:"Iniciar nova análise quantitativa"}),e.jsx("div",{className:"ap-geral-action-sub",children:"MOTORIA RISK INDEX™ · Probabilidade · EV · Exposição"})]}),e.jsxs("button",{className:"ap-geral-btn",onClick:()=>f("nova"),children:["Analisar",e.jsx("svg",{width:"11",height:"11",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round"})})]})]}),x.length>0&&e.jsxs("div",{className:"ap-geral-recent",children:[e.jsx("div",{className:"ap-geral-recent-hdr",children:"ANÁLISES RECENTES"}),e.jsx("div",{className:"ap-geral-recent-list",children:x.slice(0,4).map((a,s)=>e.jsxs("button",{className:"ap-geral-recent-row",onClick:()=>Z(a),children:[e.jsxs("span",{className:"ap-geral-recent-id",children:["#",a.id]}),e.jsx("span",{className:"ap-geral-recent-event",children:a.jogo||"Aposta"}),e.jsxs("span",{className:"ap-geral-recent-odd",children:["Odd ",a.odd]}),e.jsx("div",{className:"ap-geral-recent-bar",children:e.jsx("div",{style:{width:`${a.score}%`,background:a.color,height:"100%",borderRadius:99}})}),e.jsx("span",{className:"ap-geral-recent-score",style:{color:a.color},children:a.score}),e.jsx("span",{className:"ap-geral-recent-tag",style:{color:a.color},children:a.label})]},s))})]}),x.length===0&&e.jsxs("div",{className:"ap-geral-empty",children:[e.jsx("p",{children:"Nenhuma análise registrada ainda."}),e.jsx("button",{className:"ap-geral-btn",onClick:()=>f("nova"),children:"Iniciar primeira análise →"})]})]},"geral"),g==="nova"&&e.jsxs("div",{className:"ap-content",children:[!r&&!R&&e.jsxs("section",{className:"ap-input-panel",children:[e.jsxs("div",{className:"ap-panel-hdr",children:[e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:"MÓDULO II"}),e.jsx("div",{className:"ap-panel-title",children:"Parâmetros de entrada"})]}),e.jsxs("div",{className:"ap-panel-online",children:[e.jsx("span",{className:"ap-status-dot","aria-hidden":"true"}),"SISTEMA ONLINE"]})]}),e.jsxs("form",{className:"ap-form",onSubmit:ge,noValidate:!0,children:[e.jsxs("div",{className:"ap-row-2",children:[e.jsxs("div",{className:"ap-field",children:[e.jsx("label",{className:"ap-label",htmlFor:"odd-input",children:"ODD DECIMAL"}),e.jsx("input",{id:"odd-input",className:"ap-input ap-input-odd",type:"text",placeholder:"2.80",value:y,onChange:a=>_(a.target.value),inputMode:"decimal",autoComplete:"off"}),$&&e.jsxs("div",{className:"ap-odd-preview",style:{color:$.color},children:[e.jsx("span",{children:$.label}),e.jsx("span",{className:"ap-odd-preview-sep",children:"·"}),e.jsxs("span",{children:["impl. ",H(m).toFixed(1),"%"]})]})]}),e.jsxs("div",{className:"ap-field",children:[e.jsx("label",{className:"ap-label",htmlFor:"valor-input",children:"EXPOSIÇÃO (R$)"}),e.jsx("input",{id:"valor-input",className:"ap-input",type:"text",placeholder:"100",value:Y,onChange:a=>le(a.target.value),inputMode:"decimal",autoComplete:"off"})]})]}),e.jsxs("div",{className:"ap-field",children:[e.jsx("label",{className:"ap-label",htmlFor:"tipo-input",children:"MERCADO"}),e.jsx(Fe,{id:"tipo-input",options:Ne,value:w,onChange:ne}),te[w]&&e.jsxs("div",{className:"ap-tipo-desc",children:[e.jsx("span",{className:"ap-tipo-desc-dot","aria-hidden":"true"}),te[w]]})]}),e.jsxs("div",{className:"ap-field",children:[e.jsxs("label",{className:"ap-label",htmlFor:"jogo-input",children:["EVENTO ",e.jsx("span",{className:"ap-label-opt",children:"/ opcional"})]}),e.jsx("input",{id:"jogo-input",className:"ap-input",type:"text",placeholder:"Ex: Flamengo × Palmeiras · Brasileirão",value:b,onChange:a=>U(a.target.value),autoComplete:"off"})]}),e.jsxs("div",{className:"ap-field",children:[e.jsxs("label",{className:"ap-label",htmlFor:"obs-input",children:["CONTEXTO ",e.jsx("span",{className:"ap-label-opt",children:"/ opcional"})]}),e.jsx("textarea",{id:"obs-input",className:"ap-input ap-textarea",placeholder:"Desfalques, forma recente, condições do jogo…",value:K,onChange:a=>pe(a.target.value),rows:2})]}),X&&e.jsx("div",{className:"ap-error",role:"alert",children:X}),e.jsxs("button",{className:"ap-submit",type:"submit",children:["INICIAR ANÁLISE",e.jsx("svg",{width:"11",height:"11",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round"})})]})]})]}),R&&e.jsxs("div",{className:"ap-loading",role:"status","aria-live":"polite",children:[e.jsxs("div",{className:"ap-loading-hdr",children:[e.jsxs("div",{children:[e.jsx("div",{className:"ap-loading-engine",children:"RISK ENGINE v2.4"}),e.jsx("div",{className:"ap-loading-sub",children:"Processamento quantitativo em execução"})]}),e.jsx("span",{className:"ap-loading-status",children:"CALCULANDO"})]}),e.jsx("div",{className:"ap-loading-bar-wrap",children:e.jsx("div",{className:"ap-loading-bar",style:{width:`${D}%`}})}),e.jsxs("div",{className:"ap-loading-pct","aria-label":`${D}%`,children:[D,e.jsx("span",{className:"ap-loading-pct-sym",children:"%"})]}),e.jsx("div",{className:"ap-loading-steps",children:A.map((a,s)=>e.jsxs("div",{className:`ap-lstep${s<k?" ap-lstep-done":s===k?" ap-lstep-active":""}`,children:[e.jsx("span",{className:"ap-lstep-icon","aria-hidden":"true",children:s<k?"✓":s===k?"▶":"○"}),e.jsx("span",{className:"ap-lstep-lbl",children:a.label}),s<k&&e.jsx("span",{className:"ap-lstep-done-tag",children:"OK"})]},s))})]}),r&&!R&&e.jsxs("div",{className:"ap-output",children:[e.jsxs("div",{className:"ap-output-topbar",children:[e.jsxs("div",{className:"ap-output-meta",children:[e.jsxs("span",{className:"ap-output-id",children:["#",r.id]}),e.jsx("span",{className:"ap-output-dot","aria-hidden":"true",children:"·"}),e.jsx("span",{className:"ap-output-ts",children:r.ts}),r.jogo&&r.jogo!=="Aposta"&&e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"ap-output-dot","aria-hidden":"true",children:"·"}),e.jsx("span",{className:"ap-output-event",children:r.jogo})]})]}),e.jsx("button",{className:"ap-btn-nova",onClick:me,children:"Nova análise"})]}),e.jsxs("div",{className:"ap-score-hero",children:[e.jsxs("div",{className:"ap-gauge-wrap",children:[e.jsx("div",{className:"ap-gauge",style:{background:`conic-gradient(${r.color} 0% ${r.score}%, rgba(255,255,255,.05) ${r.score}% 100%)`},role:"img","aria-label":`MOTORIA RISK INDEX: ${r.score} de 100`,children:e.jsxs("div",{className:"ap-gauge-inner",children:[e.jsx("span",{className:"ap-gauge-num",children:r.score}),e.jsx("span",{className:"ap-gauge-denom",children:"/100"})]})}),e.jsx("span",{className:"ap-gauge-name",children:"MOTORIA RISK INDEX™"}),e.jsxs("span",{className:"ap-gauge-ci",children:["IC 95% · [",Math.max(0,r.score-6)," — ",Math.min(100,r.score+6),"]"]})]}),e.jsxs("div",{className:"ap-score-side",children:[e.jsx("div",{className:"ap-risk-badge",style:{color:r.color,borderColor:`${r.color}28`,background:`${r.color}0c`},children:r.label}),e.jsx("div",{className:"ap-verdict",style:{color:r.color},children:r.verdict}),e.jsxs("div",{className:"ap-score-data",children:[e.jsxs("div",{className:"ap-score-data-row",children:[e.jsx("span",{className:"ap-score-data-lbl",children:"ODD"}),e.jsx("span",{className:"ap-score-data-val ap-score-data-val-lg",children:r.odd.toFixed(2)})]}),e.jsxs("div",{className:"ap-score-data-row",children:[e.jsx("span",{className:"ap-score-data-lbl",children:"MERCADO"}),e.jsx("span",{className:"ap-score-data-val",children:r.tipo})]}),e.jsxs("div",{className:"ap-score-data-row",children:[e.jsx("span",{className:"ap-score-data-lbl",children:"EXPOSURE LEVEL™"}),e.jsxs("div",{className:"ap-exposure-row",children:[e.jsx("div",{className:"ap-exposure-track",children:e.jsx("div",{className:"ap-exposure-fill",style:{width:`${r.exposure}%`,background:r.color}})}),e.jsx("span",{className:"ap-exposure-val",style:{color:r.color},children:r.exposure})]})]})]})]})]}),e.jsxs("div",{className:"ap-prob-panel",children:[e.jsxs("div",{className:"ap-prob-hdr",children:[e.jsx("span",{className:"ap-prob-title",children:"PROBABILITY DISTORTION™"}),e.jsxs("span",{className:"ap-prob-vig",children:["HOUSE MARGIN ",r.vig,"%"]})]}),e.jsxs("div",{className:"ap-prob-bar",role:"img","aria-label":`Vitória ${r.impl}%, derrota ${r.perda}%`,children:[e.jsx("div",{className:"ap-prob-win",style:{width:`${r.impl}%`}}),e.jsx("div",{className:"ap-prob-lose"})]}),e.jsxs("div",{className:"ap-prob-labels",children:[e.jsxs("span",{className:"ap-prob-w",children:["VITÓRIA · ",r.impl,"%"]}),e.jsxs("span",{className:"ap-prob-l",children:["DERROTA · ",r.perda,"%"]})]})]}),e.jsxs("div",{className:"ap-metrics-grid",children:[e.jsx(N,{label:"PROB. IMPLÍCITA",value:`${r.impl}%`,color:"#22C55E",sub:"Chance atribuída pela casa"}),e.jsx(N,{label:"PROB. JUSTA",value:`${r.justa}%`,color:"rgba(232,232,230,.38)",sub:"Sem margem da casa"}),e.jsx(N,{label:"HOUSE MARGIN",value:`${r.vig}%`,color:"#F59E0B",sub:"Distorção embutida",tm:!0}),e.jsx(N,{label:"EV / R$100",value:`${parseFloat(r.ev)>=0?"+":""}R$${Math.abs(parseFloat(r.ev)).toFixed(2)}`,color:parseFloat(r.ev)>=0?"#22C55E":"#EF4444",sub:"Retorno esperado"}),e.jsx(N,{label:"RISK EXPOSURE",value:`${r.perda}%`,color:"#EF4444",sub:"Probabilidade de derrota",tm:!0}),e.jsx(N,{label:"SIGNAL CONFIDENCE",value:"94,2%",color:"rgba(232,232,230,.22)",sub:"Confiança do modelo",tm:!0})]}),r.ai&&e.jsxs("div",{className:"ap-ai-section",children:[e.jsxs("div",{className:"ap-ai-hdr",children:[e.jsx("span",{className:"ap-ai-hdr-title",children:"ANÁLISE QUALITATIVA"}),e.jsx("span",{className:"ap-ai-hdr-tag",children:"MotorIA Engine™"})]}),e.jsxs("div",{className:"ap-ai-grid",children:[e.jsx(L,{mod:"MOD-01",title:"RISCO PRINCIPAL",children:r.ai.riscoPrincipal}),e.jsx(L,{mod:"MOD-02",title:"CENÁRIO NECESSÁRIO",children:r.ai.cenarioNecessario}),e.jsx(L,{mod:"MOD-03",title:"PONTOS DE FALHA",children:r.ai.oQuePodeDarErrado}),e.jsx(L,{mod:"MOD-04",title:"LEITURA CONSERVADORA",children:r.ai.leituraConservadora})]}),r.ai.alertaFinal&&e.jsxs("div",{className:"ap-alerta",children:[e.jsxs("div",{className:"ap-alerta-hdr",children:[e.jsx("span",{className:"ap-alerta-icon","aria-hidden":"true",children:"▲"}),e.jsx("span",{className:"ap-alerta-tag",children:"RISK SIGNAL™"})]}),e.jsx("p",{className:"ap-alerta-text",children:r.ai.alertaFinal})]})]}),e.jsx("p",{className:"ap-disclaimer",children:"Ferramenta educativa · Não constitui recomendação de aposta · MotorIA Risk Engine™ v2.4"})]})]},"nova"),g==="comparador"&&e.jsx(W,{mod:"MÓDULO III",title:"Comparador de Odds",desc:"Compare múltiplas odds simultaneamente e identifique distorções entre casas de apostas. O Comparador cruza probabilidades implícitas em tempo real."}),g==="aovivo"&&e.jsx(W,{mod:"MERCADOS",title:"Ao Vivo",desc:"Feed de análises em tempo real com atualizações automáticas de probabilidade para eventos em andamento. Integração com dados de mercado ao vivo."}),g==="favoritos"&&e.jsx(W,{mod:"ARQUIVO",title:"Favoritos",desc:"Salve e organize suas análises mais relevantes. Crie coleções por campeonato, mercado ou período para consulta rápida."}),g==="historico"&&e.jsxs("div",{className:"ap-content",children:[e.jsxs("div",{className:"ap-panel-hdr",children:[e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:"ARQUIVO"}),e.jsx("div",{className:"ap-panel-title",children:"Histórico de análises"})]}),e.jsxs("div",{className:"ap-panel-online",children:[e.jsx("span",{className:"ap-status-dot","aria-hidden":"true"}),x.length," REGISTROS"]})]}),x.length===0?e.jsx("div",{className:"ap-empty",children:"Nenhuma análise registrada nesta sessão."}):e.jsx("div",{className:"ap-hist-list",children:x.map((a,s)=>e.jsxs("button",{className:"ap-hist-row",onClick:()=>Z(a),children:[e.jsxs("span",{className:"ap-hist-id",children:["#",a.id||"—"]}),e.jsx("span",{className:"ap-hist-event",children:a.jogo||"Aposta"}),e.jsxs("span",{className:"ap-hist-odd",children:["Odd ",a.odd]}),e.jsx("div",{className:"ap-hist-bar",children:e.jsx("div",{style:{width:`${a.score}%`,background:a.color,height:"100%",borderRadius:99}})}),e.jsx("span",{className:"ap-hist-score",style:{color:a.color},children:a.score}),e.jsx("span",{className:"ap-hist-tag",style:{color:a.color,borderColor:`${a.color}33`},children:a.label}),e.jsx("span",{className:"ap-hist-ts",children:a.ts||""})]},s))})]},"historico"),g==="config"&&e.jsxs("div",{className:"ap-content",children:[e.jsx("div",{className:"ap-panel-hdr",children:e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:"SISTEMA"}),e.jsx("div",{className:"ap-panel-title",children:"Configurações"})]})}),e.jsxs("div",{className:"ap-config-panel",children:[e.jsxs("div",{className:"ap-config-field",children:[e.jsx("label",{className:"ap-label",htmlFor:"token-input",children:"TOKEN DE ACESSO"}),e.jsx("input",{id:"token-input",className:"ap-input ap-input-mono",type:"text",placeholder:"Cole seu token de acesso aqui",value:F,onChange:a=>{V(a.target.value),localStorage.setItem(M,a.target.value)},autoComplete:"off",spellCheck:!1}),e.jsx("p",{className:"ap-config-hint",children:"Token recebido por email após a confirmação de acesso."})]}),e.jsxs("div",{className:"ap-config-info",children:[e.jsxs("div",{className:"ap-config-row",children:[e.jsx("span",{children:"Engine"}),e.jsx("span",{children:"MotorIA Risk Engine™ v2.4"})]}),e.jsxs("div",{className:"ap-config-row",children:[e.jsx("span",{children:"Modelo"}),e.jsx("span",{children:"Quantitative Risk v2"})]}),e.jsxs("div",{className:"ap-config-row",children:[e.jsx("span",{children:"Histórico local"}),e.jsxs("span",{children:[x.length," / ",se]})]}),e.jsxs("div",{className:"ap-config-row",children:[e.jsx("span",{children:"Status"}),e.jsx("span",{className:"ap-config-online",children:"● ONLINE"})]})]})]})]},"config")]})]})]})]})}const Ve=`
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
  display: flex; align-items: center; justify-content: space-between;
  height: 46px; padding: 0 14px; gap: 12px;
  background: var(--bg2); border-bottom: 1px solid var(--border);
  flex-shrink: 0; z-index: 30; position: relative;
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
  width: 22px; height: 22px; border-radius: 5px; background: var(--green); color: #050507;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ap-topbar-name { font-size: 13px; font-weight: 800; color: var(--t1); letter-spacing: -0.03em; }
.ap-topbar-sep  { color: var(--t3); font-size: 13px; }
.ap-topbar-tag  { font-size: 11px; font-weight: 600; color: var(--t3); letter-spacing: .025em; }

.ap-topbar-center { flex: 1; display: flex; align-items: center; justify-content: center; }
.ap-topbar-clock {
  font-size: 11px; font-weight: 700; letter-spacing: .06em; color: var(--t3);
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
  font-size: 9px; font-weight: 800; letter-spacing: .12em; color: var(--t3);
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
  background: rgba(34,197,94,.12);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ap-sidebar-brand-name {
  font-size: 11px; font-weight: 800; color: var(--t2);
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
.ap-main { flex: 1; overflow-y: auto; background: var(--bg); }
.ap-content {
  max-width: 800px; margin: 0 auto; padding: 24px 22px;
  display: flex; flex-direction: column; gap: 11px;
  animation: ap-fade-up .2s ease both;
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
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px 20px;
}
.ap-form { display: flex; flex-direction: column; gap: 12px; margin-top: 15px; }
.ap-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
.ap-field { display: flex; flex-direction: column; gap: 6px; }
.ap-label {
  font-size: 8.5px; font-weight: 800; letter-spacing: .15em;
  color: var(--t3); text-transform: uppercase;
}
.ap-label-opt { font-weight: 500; letter-spacing: 0; text-transform: none; font-size: 8px; opacity: .7; }
.ap-input {
  background: rgba(255,255,255,.02); border: 1px solid var(--border);
  border-radius: 8px; padding: 10px 12px;
  font-size: 14px; font-weight: 500; color: var(--t1);
  outline: none; font-family: inherit; width: 100%;
  transition: border-color .14s, background .14s;
}
.ap-input:focus { border-color: rgba(34,197,94,.26); background: rgba(255,255,255,.026); }
.ap-input::placeholder { color: var(--t3); }
.ap-input-odd {
  font-size: 20px; font-weight: 700; letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums; font-feature-settings: 'tnum';
}
.ap-select { cursor: pointer; }
.ap-textarea { resize: none; line-height: 1.55; font-size: 13px; }
.ap-input-mono { font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: .03em; }

.ap-odd-preview {
  display: flex; align-items: center; gap: 5px;
  font-size: 9px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
}
.ap-odd-preview-sep { color: var(--t3); }
.ap-error {
  font-size: 12px; color: var(--red);
  background: rgba(239,68,68,.06); border: 1px solid rgba(239,68,68,.18);
  border-radius: 8px; padding: 10px 12px;
}
.ap-submit {
  display: flex; align-items: center; justify-content: center; gap: 9px;
  background: var(--t1); color: #060608;
  font-size: 11px; font-weight: 900; letter-spacing: .14em;
  padding: 13px 20px; border-radius: 8px; border: none; cursor: pointer;
  font-family: inherit; margin-top: 3px;
  transition: opacity .14s, transform .1s;
}
.ap-submit:hover { opacity: .87; transform: translateY(-1px); }
.ap-submit:active { transform: translateY(0); opacity: .95; }

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

/* ─ Tipo description ───────────────────────────────────────────────────────── */
@keyframes ap-desc-in {
  from { opacity: 0; transform: translateY(-3px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ap-tipo-desc {
  display: flex; align-items: flex-start; gap: 7px;
  font-size: 11.5px; color: var(--t2); line-height: 1.55;
  padding: 7px 10px 7px 10px;
  background: rgba(34,197,94,.04);
  border: 1px solid rgba(34,197,94,.1);
  border-radius: 7px;
  animation: ap-desc-in .18s ease both;
}
.ap-tipo-desc-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: rgba(34,197,94,.45); flex-shrink: 0;
  margin-top: 4px;
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
  width: 100%; padding: 10px 12px;
  background: rgba(255,255,255,.02); border: 1px solid var(--border);
  border-radius: 8px; cursor: pointer; font-family: inherit;
  font-size: 14px; font-weight: 500; color: var(--t1);
  outline: none; text-align: left;
  transition: border-color .14s, background .14s, box-shadow .14s;
  -webkit-appearance: none; appearance: none;
}
.sel-trigger:hover {
  background: rgba(255,255,255,.028); border-color: rgba(255,255,255,.1);
}
.sel-trigger-open {
  border-color: rgba(34,197,94,.32) !important;
  background: rgba(34,197,94,.025) !important;
  box-shadow: 0 0 0 3px rgba(34,197,94,.06), inset 0 0 18px rgba(34,197,94,.03);
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
  .ap-sidebar {
    position: fixed; top: 46px; left: 0; bottom: 0;
    z-index: 50; transform: translateX(-100%);
    width: 230px; box-shadow: 6px 0 32px rgba(0,0,0,.6);
  }
  .ap-sidebar-open { transform: translateX(0); }
}
@media (max-width: 640px) {
  .ap-content { padding: 14px 13px; }
  .ap-topbar { padding: 0 12px; }
  .ap-live-lbl { display: none; }
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
}
`;export{Be as default};
