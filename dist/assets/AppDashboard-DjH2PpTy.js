import{r as o,j as e}from"./vendor-BnG4zNoI.js";import"./landing-CKh_h38c.js";const _a=["Resultado da partida","Mais ou menos gols","Ambos marcam","Handicap","Empate devolve","Chance dupla","Primeiro gol","Escanteios","Cartões","Múltipla"],Ha=["Brasileirão","Libertadores","Champions","Premier League","La Liga","Copa do Brasil","Série B"],oa=[{tipo:"Resultado da partida",ref:"1.85"},{tipo:"Mais ou menos gols",ref:"1.90"},{tipo:"Ambos marcam",ref:"1.95"},{tipo:"Handicap",ref:"2.10"},{tipo:"Empate devolve",ref:"1.65"},{tipo:"Chance dupla",ref:"1.40"}],Oe={"Resultado da partida":"1.85","Mais ou menos gols":"1.90","Ambos marcam":"1.95",Handicap:"2.10","Empate devolve":"1.65","Chance dupla":"1.40","Primeiro gol":"3.50",Escanteios:"1.90",Cartões:"1.85",Múltipla:"4.00"},te=[{label:"Analisando odd informada",pct:16},{label:"Calculando chance estimada",pct:32},{label:"Medindo exposição da banca",pct:52},{label:"Avaliando retorno esperado",pct:70},{label:"Gerando leitura da IA",pct:86},{label:"Compilando painel de análise",pct:96}],be="motoria_token",ua="motoria_hist_v2",na=8,la="https://pay.kiwify.com.br/DIVD8zl",fa="motoria_bankroll_entries",va="motoria_bankroll_cfg",Ya=["Resultado da partida","Mais ou menos gols","Ambos marcam","Handicap","Empate devolve","Chance dupla","Primeiro gol","Escanteios","Cartões","Múltipla"];function Me(s){return 1/s*100}function Ga(s){return s<=1.4?4:s<=1.7?4.8:s<=2.2?5.5:s<=3?6.5:8}function Ua(s,i){return s/100*(i-1)*100-(1-s/100)*100}function da(s){const i=Me(s),n=Math.min(100,Math.round(100-i));let m,c,x;return n<=30?(m="BAIXO",c="#22C55E",x="FAVORÁVEL"):n<=60?(m="MODERADO",c="#F59E0B",x="NEUTRO"):n<=80?(m="ALTO",c="#F97316",x="DESFAVORÁVEL"):(m="CRÍTICO",c="#EF4444",x="DESFAVORÁVEL"),{score:n,label:m,color:c,verdict:x}}function ie(s,i){const n=s.match(new RegExp(`^${i}:[^\\n]*\\n([\\s\\S]*?)(?=\\n[A-Z_]{3,}:|$)`,"m")),m=s.match(new RegExp(`^${i}:\\s*(.+)`,"m"));return(n?n[1].trim():null)||(m?m[1].trim():null)}function Ja(s){return{riscoPrincipal:ie(s,"RISCO_PRINCIPAL"),cenarioNecessario:ie(s,"CENARIO_NECESSARIO"),oQuePodeDarErrado:ie(s,"O_QUE_PODE_DAR_ERRADO"),leituraConservadora:ie(s,"LEITURA_CONSERVADORA"),alertaFinal:ie(s,"ALERTA_FINAL")}}function Ka(s){try{const i=s.match(/\{[\s\S]*\}/);if(i)return JSON.parse(i[0])}catch{}return null}function he(s,i){if(!i?.teams||!s)return null;if(i.teams[s])return i.teams[s];const n=s.toLowerCase(),m=Object.keys(i.teams).find(c=>n.includes(c.toLowerCase())||c.toLowerCase().includes(n));return m?i.teams[m]:null}function pa(s,i,n){return n?.h2h&&(n.h2h[`${s}-${i}`]||n.h2h[`${i}-${s}`])||null}function qa(){try{return JSON.parse(localStorage.getItem(ua)||"[]")}catch{return[]}}function Qa(s){try{localStorage.setItem(ua,JSON.stringify(s))}catch{}}function Za(s){return s.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}function Xa(){return new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}function ue(s){const i=(s||"").toLowerCase();return i.includes("serie b")||i.includes("série b")?"Série B":i.includes("brasileir")||i.includes("brazil")&&i.includes("serie a")?"Brasileirão":i.includes("libertad")?"Libertadores":i.includes("champions")?"Champions":i.includes("premier league")?"Premier League":i.includes("la liga")||i.includes("laliga")||i.includes("primera division")?"La Liga":i.includes("copa do brasil")?"Copa do Brasil":i.includes("bundesliga")?"Bundesliga":i.includes("ligue 1")?"Ligue 1":""}function er(){try{return JSON.parse(localStorage.getItem(fa)||"[]")}catch{return[]}}function Ie(s){try{localStorage.setItem(fa,JSON.stringify(s))}catch{}}function ar(){try{return JSON.parse(localStorage.getItem(va)||"{}")}catch{return{}}}function ca(s){try{localStorage.setItem(va,JSON.stringify(s))}catch{}}function ja(s,i){if(!i||i<=0)return null;let n=i,m=0,c=0,x=0,g=0,F=0,v=0,b=0,w=0;const U=[...s].sort((y,W)=>y.ts-W.ts);for(const y of U)if(y.resultado!=="Anulada"){if(w++,y.resultado==="Ganhou"){const W=parseFloat(y.valor)*(parseFloat(y.odd)-1);n+=W,m+=W,x++,b=b>0?b+1:1}else n-=parseFloat(y.valor),c+=parseFloat(y.valor),g++,b=b<0?b-1:-1;b<0&&Math.abs(b)>v&&(v=Math.abs(b)),F=b}const B=m-c,J=w>0?B/(c+m)*100:0,_=w>0?x/w*100:0;return{saldo:n,lucroTotal:B,roi:J,acerto:_,wins:x,losses:g,totalApos:w,streak:F,maxStreak:v}}function rr(s,i){const n=[];if(!i||i<=0||s.length===0)return n;const m=s[0],c=parseFloat(m?.valor||0)/i*100;c>10?n.push({type:"danger",msg:`Última entrada: ${c.toFixed(1)}% da banca — exposição acima do recomendado.`}):c>=5&&n.push({type:"warn",msg:`Última entrada: ${c.toFixed(1)}% da banca — atenção à gestão.`});const x=ja(s,i);return x&&(x.streak<=-3&&n.push({type:"danger",msg:`Sequência de ${Math.abs(x.streak)} derrotas seguidas — revise a estratégia.`}),x.lucroTotal<0&&n.push({type:"warn",msg:`Resultado acumulado negativo: R$ ${Math.abs(x.lucroTotal).toFixed(2)} abaixo do investido.`})),n}const tr=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("rect",{x:"1.5",y:"1.5",width:"4.5",height:"4.5",rx:"1.2",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("rect",{x:"8",y:"1.5",width:"4.5",height:"4.5",rx:"1.2",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("rect",{x:"1.5",y:"8",width:"4.5",height:"4.5",rx:"1.2",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("rect",{x:"8",y:"8",width:"4.5",height:"4.5",rx:"1.2",stroke:"currentColor",strokeWidth:"1.3"})]}),xa=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("path",{d:"M2 11L5 7.5L8 9.5L12 3.5",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round",strokeLinejoin:"round"}),e.jsx("circle",{cx:"5",cy:"7.5",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"8",cy:"9.5",r:"1",fill:"currentColor"}),e.jsx("circle",{cx:"12",cy:"3.5",r:"1",fill:"currentColor"})]}),ir=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("path",{d:"M2 10V6M5 10V4M8 10V7M11 10V3",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round"}),e.jsx("path",{d:"M1 12.5h12",stroke:"currentColor",strokeWidth:"1.2",strokeLinecap:"round",opacity:".4"})]}),sr=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("circle",{cx:"7",cy:"7",r:"2",fill:"currentColor",fillOpacity:".9"}),e.jsx("path",{d:"M3.5 3.5a5 5 0 0 0 0 7M10.5 3.5a5 5 0 0 1 0 7",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"})]}),or=()=>e.jsx("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M7 1.5l1.5 3.2L12 5.3l-2.5 2.4.6 3.4L7 9.5l-3.1 1.6.6-3.4L2 5.3l3.5-.6L7 1.5z",stroke:"currentColor",strokeWidth:"1.3",strokeLinejoin:"round"})}),nr=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("circle",{cx:"7",cy:"7",r:"5",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M7 4.5V7L8.8 8.8",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"})]}),ga=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("circle",{cx:"7",cy:"7",r:"2",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M7 1v2M7 11v2M1 7h2M11 7h2M3.22 3.22l1.41 1.41M9.37 9.37l1.41 1.41M3.22 10.78l1.41-1.41M9.37 4.63l1.41-1.41",stroke:"currentColor",strokeWidth:"1.2",strokeLinecap:"round"})]}),ma=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("rect",{x:"1.5",y:"3",width:"11",height:"9.5",rx:"1.5",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M1.5 6h11",stroke:"currentColor",strokeWidth:"1.2"}),e.jsx("path",{d:"M4.5 1.5V4M9.5 1.5V4",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round"}),e.jsx("circle",{cx:"4.5",cy:"9",r:".9",fill:"currentColor",opacity:".55"}),e.jsx("circle",{cx:"7",cy:"9",r:".9",fill:"currentColor",opacity:".55"}),e.jsx("circle",{cx:"9.5",cy:"9",r:".9",fill:"currentColor",opacity:".55"})]}),ba=()=>e.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("rect",{x:"1.5",y:"5",width:"11",height:"8",rx:"1.4",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M4 5V3.5a3 3 0 0 1 6 0V5",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"}),e.jsx("circle",{cx:"7",cy:"9",r:"1.2",fill:"currentColor",opacity:".7"})]});function Le({mod:s,title:i,desc:n}){return e.jsxs("div",{className:"ap-content",children:[e.jsx("div",{className:"ap-panel-hdr",children:e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:s}),e.jsx("div",{className:"ap-panel-title",children:i})]})}),e.jsxs("div",{className:"ap-coming-panel",children:[e.jsx("div",{className:"ap-coming-icon","aria-hidden":"true",children:e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 22 22",fill:"none",children:[e.jsx("rect",{x:"1.5",y:"1.5",width:"19",height:"19",rx:"5",stroke:"rgba(255,255,255,.1)",strokeWidth:"1.5"}),e.jsx("path",{d:"M8 11h6M11 8v6",stroke:"rgba(255,255,255,.15)",strokeWidth:"1.5",strokeLinecap:"round"})]})}),e.jsx("p",{className:"ap-coming-desc",children:n}),e.jsx("div",{className:"ap-coming-tag",children:"Em desenvolvimento · Próxima versão"})]})]})}function ha({id:s,options:i,value:n,onChange:m,placeholder:c}){const[x,g]=o.useState(!1),F=o.useRef(null);return o.useEffect(()=>{if(!x)return;function v(w){w.key==="Escape"&&g(!1)}function b(w){F.current&&!F.current.contains(w.target)&&g(!1)}return document.addEventListener("keydown",v),document.addEventListener("mousedown",b),()=>{document.removeEventListener("keydown",v),document.removeEventListener("mousedown",b)}},[x]),e.jsxs("div",{className:"sel-wrap",ref:F,children:[e.jsxs("button",{id:s,type:"button",className:`sel-trigger${x?" sel-trigger-open":""}`,onClick:()=>g(v=>!v),"aria-haspopup":"listbox","aria-expanded":x,children:[e.jsx("span",{className:`sel-val${c&&!i.includes(n)?" sel-placeholder":""}`,children:c&&!i.includes(n)?c:n}),e.jsx("span",{className:`sel-chev${x?" sel-chev-up":""}`,"aria-hidden":"true",children:e.jsx("svg",{width:"10",height:"10",viewBox:"0 0 12 12",fill:"none",children:e.jsx("path",{d:"M2.5 4.5L6 8L9.5 4.5",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round"})})})]}),x&&e.jsxs("ul",{className:"sel-list",role:"listbox","aria-label":c||"Opções",children:[c&&e.jsxs("li",{role:"option","aria-selected":!i.includes(n),className:`sel-opt${i.includes(n)?"":" sel-opt-on"}`,onMouseDown:v=>v.preventDefault(),onClick:()=>{m(""),g(!1)},children:[e.jsx("span",{className:"sel-check","aria-hidden":"true",children:!i.includes(n)&&e.jsx("svg",{width:"9",height:"9",viewBox:"0 0 12 12",fill:"none",children:e.jsx("path",{d:"M2.5 6L5 8.5L9.5 3.5",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round"})})}),e.jsx("span",{className:"sel-opt-text sel-opt-dim",children:c})]}),i.map(v=>e.jsxs("li",{role:"option","aria-selected":v===n,className:`sel-opt${v===n?" sel-opt-on":""}`,onMouseDown:b=>b.preventDefault(),onClick:()=>{m(v),g(!1)},children:[e.jsx("span",{className:"sel-check","aria-hidden":"true",children:v===n&&e.jsx("svg",{width:"9",height:"9",viewBox:"0 0 12 12",fill:"none",children:e.jsx("path",{d:"M2.5 6L5 8.5L9.5 3.5",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round"})})}),e.jsx("span",{className:"sel-opt-text",children:v})]},v))]})]})}function gr(){o.useEffect(()=>{const a=document.title;return document.title="MotorIA Risk Engine™",()=>{document.title=a}},[]);const[s,i]=o.useState(new Date);o.useEffect(()=>{const a=setInterval(()=>i(new Date),1e3);return()=>clearInterval(a)},[]);const[n,m]=o.useState(!1);o.useEffect(()=>{try{const a=new URLSearchParams(window.location.search),r=a.get("t")||a.get("token");if(r&&r.length>10){localStorage.setItem(be,r),ve(r),m(!0),window.history.replaceState(null,"",window.location.pathname);const d=setTimeout(()=>m(!1),4200);return()=>clearTimeout(d)}}catch{}},[]);const[c,x]=o.useState(!1),[g,F]=o.useState("jogos"),[v,b]=o.useState("lista");function w(a){F(a),x(!1),a==="jogos"&&(b("lista"),L(null),I(""))}const[U,B]=o.useState(""),[J,_]=o.useState(""),[y,W]=o.useState("Resultado da partida"),[$,K]=o.useState(""),[fe,Fe]=o.useState(""),[dr,ka]=o.useState(""),[R,H]=o.useState(!1),[C,Re]=o.useState(0),[T,Y]=o.useState(0),[se,I]=o.useState(""),[h,L]=o.useState(null),[z,wa]=o.useState(qa),[q,ve]=o.useState(()=>localStorage.getItem(be)||""),[De,ya]=o.useState(null),[Be,Na]=o.useState(null),[za,$e]=o.useState(null),[V,Te]=o.useState([]),[Q,je]=o.useState(!1),[ke,Ve]=o.useState(""),[pr,Ca]=o.useState(null),[Pe,Aa]=o.useState(null),[l,Z]=o.useState(null),[oe,Sa]=o.useState("todos"),[M,we]=o.useState(er),[We,_e]=o.useState(ar),[He,Ye]=o.useState(!1),[Ge,Ue]=o.useState(!1),[Ea,ye]=o.useState(!1),[A,G]=o.useState({valor:"",odd:"",resultado:"Ganhou",mercado:"Resultado da partida",obs:""}),[Je,Ke]=o.useState(""),[D,Oa]=o.useState(null),[Ia,Ne]=o.useState(null),[qe,ne]=o.useState(""),[le,de]=o.useState("");o.useEffect(()=>{fetch("/jogos-data.json").then(a=>a.json()).then(Oa).catch(()=>{})},[]);function ze(){je(!0),Ve(""),Te([]),fetch("/api/matches").then(a=>{if(!a.ok)throw new Error(`HTTP ${a.status}`);return a.json()}).then(a=>{const r=Array.isArray(a.matches)?a.matches:[],d=a.source||"unknown";console.log("[MotorIA] API games:",r),r.length===0&&console.log("[MotorIA] No real games returned — source:",d),Te(r),Ca(d),Aa(a.updatedAt?new Date(a.updatedAt):new Date),je(!1)}).catch(a=>{console.log("[MotorIA] API failed —",a.message||a),Ve("network"),je(!1)})}o.useEffect(()=>{g==="jogos"&&(V.length>0&&!ke||ze())},[g]);const pe=parseFloat(($||"").replace(",",".")),Ce=$&&!isNaN(pe)&&pe>=1.01?da(pe):null,X=z.length?Math.round(z.reduce((a,r)=>a+(r.score||0),0)/z.length):null,Qe=z[0]||null;async function Ze({jogoVal:a,campVal:r,tipoVal:d,oddVal:u,valorVal:t}){const p=parseFloat(String(u).replace(",","."));H(!0),I(""),L(null),Re(0),Y(te[0].pct);let k=0;const S=setInterval(()=>{k=Math.min(k+1,te.length-1),Re(k),Y(te[k].pct)},820);try{let j="";if(D&&a&&a!=="Aposta"){const O=a.split(" × ");if(O.length===2){const ge=he(O[0].trim(),D),me=he(O[1].trim(),D);ge&&(j+=` | ${O[0].trim()} forma: ${ge.forma.join("-")} GM:${ge.gm} GS:${ge.gs}`),me&&(j+=` | ${O[1].trim()} forma: ${me.forma.join("-")} GM:${me.gm} GS:${me.gs}`);const re=pa(O[0].trim(),O[1].trim(),D);re&&(j+=` | H2H: H${re.h} D${re.d} A${re.a} méd.${re.mediaGols}gols`)}}const E=`Jogo: ${a||"não informado"} | Campeonato: ${r||"não informado"} | Mercado: ${d} | Odd: ${u}${t?` | Valor: R$${t}`:""}${j}`,f=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json",...q?{"x-motoria-token":q}:{}},body:JSON.stringify({tool:"aposta",userMessage:E})});if(clearInterval(S),f.status===402){L({locked:!0,signals:[]}),Y(100),setTimeout(()=>H(!1),280);return}if(!f.ok){const O=await f.json().catch(()=>({}));I(O.error||"Erro ao processar análise."),H(!1);return}const N=await f.json();if(N.credits!==void 0&&ya(N.credits),N.token&&(localStorage.setItem(be,N.token),ve(N.token)),N.locked){Y(75),await new Promise(O=>setTimeout(O,1500)),L({locked:!0,signals:N.preview?.signals||[]}),Y(100),setTimeout(()=>H(!1),280);return}const ee=N.content?.[0]?.text||"",Ae=Ka(ee),P=Me(p),ae=Ga(p),ce=P/(1-ae/100),xe=Math.min(ce,99),Se=Ua(P,p),Pa=da(p),Wa=Math.min(100,Math.round((100-xe)*1.1)),ia=parseFloat(t)||100,Ee={id:Math.floor(Math.random()*8e3)+2e3,ts:Xa(),jogo:a||"Aposta",tipo:d,odd:p,impl:P.toFixed(2),justa:xe.toFixed(2),vig:ae.toFixed(2),ev:Se.toFixed(2),perda:(100-P).toFixed(1),exposure:Wa,valorAposta:ia,valorRisco:(ia*(100-P)/100).toFixed(2),...Pa,ai:Ja(ee),aiResult:Ae};L(Ee),Na(Ee.id);const sa=[Ee,...z].slice(0,na);wa(sa),Qa(sa),Y(100),setTimeout(()=>H(!1),280)}catch{clearInterval(S),I("Erro de conexão. Tente novamente."),H(!1)}}function La(a){a.preventDefault();const r=parseFloat(($||"").replace(",","."));if(!$||isNaN(r)||r<1.01){I("Informe uma odd válida (mínimo 1.01).");return}Ze({jogoVal:U,campVal:J,tipoVal:y,oddVal:$,valorVal:fe})}function Xe(a,r,d){if(!a||!r)return;const u=l?`${l.home} × ${l.away}`:U,t=l?.campeonato||J;W(a),K(String(r)),b("resultado"),Ze({jogoVal:u,campVal:t,tipoVal:a,oddVal:String(r),valorVal:d||fe||"100"})}function ea(a){L(a),B(a.jogo||""),K(String(a.odd)),F("nova")}function Ma(){L(null),I(""),B(""),K(""),Fe(""),ka(""),_(""),Z(null),Ne(null),ne(""),de(""),b("lista")}function Fa(a){const r=ue(a.league);B(`${a.home} × ${a.away}`),_(r),Z({...a,campeonato:r}),b("mercado")}function aa(){const a=parseFloat(Je.replace(",","."));if(!a||a<=0)return;const r={bancaInicial:a};_e(r),ca(r),Ke("")}function Ra(){const a=parseFloat(A.valor.replace(",",".")),r=parseFloat(A.odd.replace(",","."));if(!a||a<=0||!r||r<1.01)return;const u=[{id:Math.random().toString(36).slice(2),ts:Date.now(),valor:a,odd:r,resultado:A.resultado,mercado:A.mercado,obs:A.obs.trim()},...M];we(u),Ie(u),G({valor:"",odd:"",resultado:"Ganhou",mercado:"Resultado da partida",obs:""}),Ye(!1)}function Da(a){const r=M.filter(d=>d.id!==a);we(r),Ie(r)}function Ba(){we([]),Ie([]),ye(!1)}function ra(a){const r=a.aiResult,d={"BOA ENTRADA":{color:"#1DB954",icon:"✅"},"BOA, MAS COM CUIDADO":{color:"#8BC34A",icon:"⚠️"},CUIDADO:{color:"#F0B429",icon:"⚠️"},"ENTRADA FRACA":{color:"#FF8C00",icon:"⚠️"},DESFAVORÁVEL:{color:"#E8641A",icon:"❌"},"RISCO ALTO":{color:"#E53E3E",icon:"❌"},"NÃO COMPENSA":{color:"#C0392B",icon:"❌"}},u=r?.status||"CUIDADO",t=d[u]||{color:"#FF8C00",icon:"⚠️"},p=r?.frase||"",k=r?.chance_ganhar!=null?`${Number(r.chance_ganhar).toFixed(0)}%`:`${a.impl}%`,S=r?.odd_ideal!=null?Number(r.odd_ideal).toFixed(2):a.justa,j=r?.vantagem!=null?Number(r.vantagem):null;let E=null,f="#999",N="";j!=null&&(j>5?(E="SIM",f="#1DB954",N="mercado favorável"):j>=-5?(E="TALVEZ",f="#F0B429",N="mercado neutro"):(E="NÃO",f="#E53E3E",N="mercado desfavorável"));const ee=r?.valor_em_risco!=null&&Number(r.valor_em_risco)>0?Number(r.valor_em_risco):parseFloat(a.valorRisco)||null,Ae=ee?`R$ ${ee.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—",P=r?.bullets||[],ae=r?.alerta||a.ai?.alertaFinal||a.ai?.riscoPrincipal||"",ce=za===a.id;return e.jsxs("div",{className:"db-result-card",children:[e.jsxs("div",{className:"db-rc-header",children:[e.jsx("div",{className:"db-rc-event",children:a.jogo!=="Aposta"?a.jogo:a.tipo}),e.jsxs("div",{className:"db-rc-meta",children:[a.jogo!=="Aposta"&&e.jsx("span",{className:"db-rc-badge",children:a.tipo}),e.jsxs("span",{className:"db-rc-odd",children:["Odd ",a.odd.toFixed(2)]})]})]}),e.jsx("div",{className:"db-rc-divider"}),e.jsxs("div",{className:"db-status-badge",style:{background:`${t.color}1A`,borderLeftColor:t.color},children:[e.jsx("span",{className:"db-status-icon","aria-hidden":"true",children:t.icon}),e.jsx("span",{className:"db-status-text",style:{color:t.color},children:u})]}),p&&e.jsxs("div",{className:"db-frase",children:['"',p,'"']}),e.jsxs("div",{className:"db-ind-grid",children:[e.jsxs("div",{className:"db-ind-card",children:[e.jsx("div",{className:"db-ind-label",children:"CHANCE DE GANHAR"}),e.jsx("div",{className:"db-ind-value",children:k})]}),e.jsxs("div",{className:"db-ind-card",children:[e.jsx("div",{className:"db-ind-label",children:"ODD IDEAL"}),e.jsx("div",{className:"db-ind-value",children:S}),e.jsx("div",{className:"db-ind-micro",children:"a odd que faria essa aposta equilibrada"})]}),e.jsxs("div",{className:"db-ind-card",children:[e.jsx("div",{className:"db-ind-label",children:"VALE A PENA?"}),E?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"db-ind-value",style:{color:f},children:E}),e.jsx("div",{className:"db-ind-micro",children:N}),j!=null&&e.jsx("div",{className:"db-ind-pct",children:j>=0?`+${j}%`:`${j}%`})]}):e.jsx("div",{className:"db-ind-value",style:{color:"var(--t3)"},children:"—"})]}),e.jsxs("div",{className:"db-ind-card",children:[e.jsx("div",{className:"db-ind-label",children:"VALOR EM RISCO"}),e.jsx("div",{className:"db-ind-value",style:{color:"#FF8C00"},children:Ae}),e.jsx("div",{className:"db-ind-micro",children:"com base no valor que você informou"})]})]}),P.length>0&&e.jsxs("div",{className:"db-bullets-block",children:[e.jsx("div",{className:"db-bullets-title",children:"POR QUE ESSE CENÁRIO"}),P.map((xe,Se)=>e.jsxs("div",{className:"db-bullet-item",children:[e.jsx("span",{className:"db-bullet-dot","aria-hidden":"true",children:"•"}),e.jsx("span",{className:"db-bullet-text",children:xe})]},Se))]}),ae&&e.jsxs("div",{className:"db-alerta-block",role:"alert",children:[e.jsx("span",{className:"db-alerta-icon","aria-hidden":"true",children:"⚠️"}),e.jsx("p",{className:"db-alerta-text",children:ae})]}),e.jsx("div",{className:"db-rc-footer-divider"}),e.jsxs("div",{className:"db-rc-footer-row",children:[e.jsx("span",{className:"db-rc-footer-note",children:"Análise com odd de referência. Use a odd real da sua casa de apostas."}),e.jsx("button",{className:`db-copy-btn${ce?" db-copy-btn-done":""}`,onClick:()=>$a(a),type:"button",children:ce?"✓ Copiado!":"📋 Copiar análise"})]})]})}function ta(a=[]){return e.jsxs("div",{className:"lk-wrap",children:[e.jsxs("div",{className:"lk-preview-card",children:[e.jsxs("div",{className:"lk-header",children:[e.jsx("div",{className:"lk-header-event",children:"█████████ × █████████"}),e.jsxs("div",{className:"lk-header-meta",children:[e.jsx("span",{className:"lk-badge-blur",children:"████████"}),e.jsx("span",{className:"lk-odd-blur",children:"Odd █.██"})]})]}),e.jsx("div",{className:"lk-divider"}),e.jsxs("div",{className:"lk-risk-row",children:[e.jsxs("div",{children:[e.jsx("span",{className:"lk-section-label",children:"RISCO DA APOSTA"}),e.jsxs("div",{className:"lk-score-blur",children:["██",e.jsx("span",{className:"lk-score-denom",children:"/100"})]})]}),e.jsx("div",{className:"lk-level-blur",children:"███████"})]}),e.jsx("div",{className:"lk-bar-wrap",children:e.jsx("div",{className:"lk-bar-track",children:e.jsx("div",{className:"lk-bar-fill"})})}),e.jsx("div",{className:"lk-divider"}),e.jsxs("div",{className:"lk-signals",children:[e.jsx("span",{className:"lk-section-label",children:"SINAIS DETECTADOS"}),a.map((r,d)=>e.jsxs("div",{className:"lk-signal",children:[e.jsx("span",{className:"lk-signal-dot","aria-hidden":"true"}),e.jsx("span",{children:r})]},d))]}),e.jsx("div",{className:"lk-divider"}),e.jsxs("div",{className:"lk-ai-row",children:[e.jsx("span",{className:"lk-section-label",children:"LEITURA DA IA"}),e.jsxs("div",{className:"lk-ai-blur",children:[e.jsx("span",{className:"lk-ai-dot","aria-hidden":"true"}),e.jsx("span",{children:"██████████████████"})]}),e.jsx("div",{className:"lk-ai-text-blur",children:"████████████████████████████████████"})]}),e.jsxs("div",{className:"lk-overlay",children:[e.jsx("div",{className:"lk-lock-icon","aria-hidden":"true",children:e.jsxs("svg",{width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",children:[e.jsx("rect",{x:"3",y:"11",width:"18",height:"11",rx:"2",stroke:"currentColor",strokeWidth:"1.5"}),e.jsx("path",{d:"M7 11V7a5 5 0 0 1 10 0v4",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round"}),e.jsx("circle",{cx:"12",cy:"16",r:"1.5",fill:"currentColor"})]})}),e.jsx("div",{className:"lk-lock-title",children:"Análise completa disponível com acesso"}),e.jsx("div",{className:"lk-lock-sub",children:"Score real · Chance estimada · Leitura completa da IA"}),e.jsx("a",{href:la,className:"lk-cta-btn",target:"_blank",rel:"noopener noreferrer",children:"Desbloquear análise completa"}),e.jsx("div",{className:"lk-price-note",children:"Pagamento único · sem mensalidade · acesso imediato · R$ 27"})]})]}),e.jsx("button",{className:"lk-back",onClick:()=>{L(null),I("")},type:"button",children:"← Tentar outra análise"})]})}function $a(a){const r=a.aiResult,d=r?.status||"—",u=r?.frase||"",t=r?.chance_ganhar!=null?`${Number(r.chance_ganhar).toFixed(0)}%`:`${a.impl}%`,p=r?.odd_ideal!=null?Number(r.odd_ideal).toFixed(2):a.justa,k=r?.vantagem!=null?Number(r.vantagem):null,S=k!=null?k>5?"SIM":k>=-5?"TALVEZ":"NÃO":"—",j=r?.alerta||a.ai?.alertaFinal||"",E=["🔍 MotorIA Pro — Análise de Aposta","",a.jogo!=="Aposta"?a.jogo:a.tipo,`Mercado: ${a.tipo}`,`Odd analisada: ${a.odd.toFixed(2)}`,"",`Status: ${d}`,u,"","📊 Números:",`• Chance de ganhar: ${t}`,`• Odd ideal: ${p}`,`• Vale a pena? ${S}`,j?"":null,j?`⚠️ ${j}`:null,"","—","Análise gerada pelo MotorIA Pro","motoriaopro.com.br"].filter(f=>f!==null).join(`
`);navigator.clipboard.writeText(E).catch(()=>{}),$e(a.id),setTimeout(()=>$e(f=>f===a.id?null:f),2e3)}const Ta=!!(q&&q.length>10),Va=[{group:"ANÁLISE",items:[{id:"jogos",label:"Jogos de Hoje",Icon:ma},{id:"nova",label:"Análise Manual",Icon:xa,manual:!0},{id:"geral",label:"Visão Geral",Icon:tr},{id:"banca",label:"Controle de Banca",Icon:ba},{id:"comparador",label:"Comparador",Icon:ir,dim:!0}]},{group:"MERCADOS",items:[{id:"aovivo",label:"Ao Vivo",Icon:sr,live:!0,dim:!0},{id:"favoritos",label:"Favoritos",Icon:or,dim:!0}]},{group:"ARQUIVO",items:[{id:"historico",label:"Histórico",Icon:nr,badge:z.length||null}]},{group:"SISTEMA",items:[{id:"config",label:"Configurações",Icon:ga}]}];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:lr}),c&&e.jsx("div",{className:"ap-overlay",onClick:()=>x(!1),"aria-hidden":"true"}),n&&e.jsxs("div",{className:"ap-access-banner",role:"status","aria-live":"polite",children:[e.jsx("span",{className:"ap-access-banner-dot","aria-hidden":"true"}),"Acesso ativado — plataforma pronta para uso"]}),e.jsxs("div",{className:"ap-shell",children:[e.jsx("header",{className:"ap-topbar",children:e.jsxs("div",{className:"ap-topbar-row",children:[e.jsxs("div",{className:"ap-topbar-left",children:[e.jsxs("button",{className:"ap-hamburger",onClick:()=>x(a=>!a),"aria-label":"Menu","aria-expanded":c,children:[e.jsx("span",{}),e.jsx("span",{}),e.jsx("span",{})]}),e.jsxs("div",{className:"ap-topbar-brand",children:[e.jsx("div",{className:"ap-logo-mark","aria-hidden":"true",children:e.jsxs("svg",{width:"10",height:"10",viewBox:"0 0 14 14",fill:"none",children:[e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"#060608"}),e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"currentColor",fillOpacity:".95"})]})}),e.jsx("span",{className:"ap-topbar-name",children:"MotorIA"}),e.jsx("span",{className:"ap-topbar-sep","aria-hidden":"true",children:"·"}),e.jsx("span",{className:"ap-topbar-tag",children:"Risk Engine™"})]})]}),e.jsxs("div",{className:"ap-topbar-center",children:[e.jsx("span",{className:"ap-topbar-clock",children:Za(s)}),Be&&e.jsxs("span",{className:"ap-topbar-aid",children:[" · #",Be]})]}),e.jsxs("div",{className:"ap-topbar-right",children:[De!==null&&e.jsx("div",{className:"ap-credits-wrap",title:"Créditos restantes",children:e.jsx("div",{className:"ap-credits-bar",children:e.jsx("div",{className:"ap-credits-fill",style:{width:`${Math.max(0,De/20*100)}%`}})})}),e.jsxs("div",{className:"ap-engine-live",children:[e.jsx("span",{className:"ap-live-dot","aria-hidden":"true"}),e.jsx("span",{className:"ap-live-lbl",children:"IA ONLINE"})]})]})]})}),e.jsxs("div",{className:"ap-body",children:[e.jsxs("nav",{className:`ap-sidebar${c?" ap-sidebar-open":""}`,"aria-label":"Navegação",children:[e.jsxs("div",{className:"ap-sidebar-brand",children:[e.jsx("div",{className:"ap-sidebar-brand-mark","aria-hidden":"true",children:e.jsx("svg",{width:"9",height:"9",viewBox:"0 0 14 14",fill:"none",children:e.jsx("path",{d:"M7 1L13 4V10L7 13L1 10V4L7 1Z",fill:"#22C55E"})})}),e.jsx("span",{className:"ap-sidebar-brand-name",children:"MotorIA Pro"})]}),e.jsx("div",{className:"ap-sidebar-divider",role:"separator"}),Va.map(({group:a,items:r})=>e.jsxs("div",{className:"ap-sidebar-group",children:[e.jsx("div",{className:"ap-sidebar-group-lbl",children:a}),r.map(({id:d,label:u,Icon:t,badge:p,live:k,dim:S,manual:j})=>e.jsxs("button",{className:`ap-nav-item${g===d?" ap-nav-active":""}${S?" ap-nav-dim":""}${j?" ap-nav-manual":""}`,onClick:()=>w(d),"aria-current":g===d?"page":void 0,children:[e.jsx("span",{className:"ap-nav-icon",children:e.jsx(t,{})}),e.jsx("span",{className:"ap-nav-label",children:u}),k&&e.jsx("span",{className:"ap-nav-live-dot","aria-label":"ao vivo"}),p>0&&!k&&e.jsx("span",{className:"ap-nav-badge","aria-label":`${p} itens`,children:p}),S&&!k&&e.jsx("span",{className:"ap-nav-soon","aria-label":"em breve",children:e.jsxs("svg",{width:"8",height:"8",viewBox:"0 0 10 10",fill:"none",children:[e.jsx("path",{d:"M5 2v3.5M5 7v.5",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round"}),e.jsx("circle",{cx:"5",cy:"5",r:"4",stroke:"currentColor",strokeWidth:"1.2",opacity:".5"})]})})]},d))]},a)),e.jsxs("div",{className:"ap-sidebar-engine",children:[e.jsx("div",{className:"ap-sidebar-engine-dot","aria-hidden":"true"}),e.jsxs("div",{className:"ap-sidebar-engine-info",children:[e.jsx("span",{className:"ap-sidebar-engine-name",children:"RISK ENGINE v2.4"}),e.jsx("span",{className:"ap-sidebar-engine-status",children:"ONLINE"})]})]})]}),e.jsxs("main",{className:"ap-main",children:[g==="geral"&&e.jsxs("div",{className:"ap-content",children:[e.jsxs("div",{className:"ap-panel-hdr",children:[e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:"MÓDULO I"}),e.jsx("div",{className:"ap-panel-title",children:"Visão Geral"})]}),e.jsxs("div",{className:"ap-panel-online",children:[e.jsx("span",{className:"ap-status-dot","aria-hidden":"true"}),"SISTEMA ONLINE"]})]}),e.jsxs("div",{className:"ap-geral-stats",children:[e.jsxs("div",{className:"ap-geral-stat",children:[e.jsx("div",{className:"ap-geral-stat-val",children:z.length}),e.jsx("div",{className:"ap-geral-stat-lbl",children:"ANÁLISES"})]}),e.jsxs("div",{className:"ap-geral-stat",children:[e.jsx("div",{className:"ap-geral-stat-val",style:{color:X!==null?X>60?"#EF4444":X>40?"#F59E0B":"#22C55E":"var(--t3)"},children:X!==null?X:"—"}),e.jsx("div",{className:"ap-geral-stat-lbl",children:"SCORE MÉDIO"})]}),e.jsxs("div",{className:"ap-geral-stat",children:[e.jsx("div",{className:"ap-geral-stat-val",children:Qe?Qe.odd.toFixed(2):"—"}),e.jsx("div",{className:"ap-geral-stat-lbl",children:"ÚLTIMA ODD"})]}),e.jsxs("div",{className:"ap-geral-stat",children:[e.jsx("div",{className:"ap-geral-stat-val ap-geral-stat-val-sm",children:"v2.4"}),e.jsx("div",{className:"ap-geral-stat-lbl",children:"ENGINE"})]})]}),e.jsxs("div",{className:"ap-geral-action",children:[e.jsxs("div",{className:"ap-geral-action-left",children:[e.jsx("div",{className:"ap-geral-action-title",children:"Iniciar nova análise quantitativa"}),e.jsx("div",{className:"ap-geral-action-sub",children:"MOTORIA RISK INDEX™ · Probabilidade · EV · Exposição"})]}),e.jsxs("button",{className:"ap-geral-btn",onClick:()=>w("nova"),children:["Analisar",e.jsx("svg",{width:"11",height:"11",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round"})})]})]}),z.length>0&&e.jsxs("div",{className:"ap-geral-recent",children:[e.jsx("div",{className:"ap-geral-recent-hdr",children:"ANÁLISES RECENTES"}),e.jsx("div",{className:"ap-geral-recent-list",children:z.slice(0,4).map((a,r)=>e.jsxs("button",{className:"ap-geral-recent-row",onClick:()=>ea(a),children:[e.jsxs("span",{className:"ap-geral-recent-id",children:["#",a.id]}),e.jsx("span",{className:"ap-geral-recent-event",children:a.jogo||"Aposta"}),e.jsxs("span",{className:"ap-geral-recent-odd",children:["Odd ",a.odd]}),e.jsx("div",{className:"ap-geral-recent-bar",children:e.jsx("div",{style:{width:`${a.score}%`,background:a.color,height:"100%",borderRadius:99}})}),e.jsx("span",{className:"ap-geral-recent-score",style:{color:a.color},children:a.score}),e.jsx("span",{className:"ap-geral-recent-tag",style:{color:a.color},children:a.label})]},r))})]}),z.length===0&&e.jsxs("div",{className:"ap-geral-empty",children:[e.jsx("p",{children:"Nenhuma análise registrada ainda."}),e.jsx("button",{className:"ap-geral-btn",onClick:()=>w("nova"),children:"Iniciar primeira análise →"})]})]},"geral"),g==="nova"&&e.jsxs("div",{className:"ap-content ap-content-nova",children:[l&&!h&&!R&&e.jsxs("div",{className:`ap-game-strip${l.status==="live"?" ap-game-strip-live":""}`,children:[e.jsx("span",{className:`ap-game-strip-dot${l.status==="live"?" ap-gsd-live":""}`,"aria-hidden":"true"}),e.jsxs("span",{className:"ap-game-strip-text",children:[l.home," × ",l.away]}),l.campeonato&&e.jsx("span",{className:"ap-game-strip-league",children:l.campeonato}),l.status==="live"?e.jsxs("span",{className:"ap-gsd-live-badge",children:["AO VIVO",l.elapsed?` · ${l.elapsed}'`:""]}):l.time?e.jsx("span",{className:"ap-game-strip-time",children:l.time}):null,e.jsx("button",{className:"ap-game-strip-clear",onClick:()=>{Z(null),B(""),_("")},"aria-label":"Remover jogo selecionado",type:"button",children:"×"})]}),!h&&!R&&e.jsx("section",{className:"ap-input-panel",children:e.jsxs("form",{className:"ap-form",onSubmit:La,noValidate:!0,children:[e.jsxs("div",{className:"ap-row-2",children:[e.jsxs("div",{className:"ap-field",children:[e.jsx("label",{className:"ap-label",htmlFor:"odd-input",children:"ODD"}),e.jsx("input",{id:"odd-input",className:"ap-input ap-input-odd",type:"text",placeholder:"2.80",value:$,onChange:a=>K(a.target.value),inputMode:"decimal",autoComplete:"off"}),Ce&&e.jsxs("div",{className:"ap-odd-preview",style:{color:Ce.color},children:[e.jsx("span",{children:Ce.label}),e.jsx("span",{className:"ap-odd-preview-sep",children:"·"}),e.jsxs("span",{children:["chance ",Me(pe).toFixed(0),"%"]})]})]}),e.jsxs("div",{className:"ap-field",children:[e.jsx("label",{className:"ap-label",htmlFor:"valor-input",children:"QUANTO VAI APOSTAR?"}),e.jsx("input",{id:"valor-input",className:"ap-input",type:"text",placeholder:"R$ 100",value:fe,onChange:a=>Fe(a.target.value),inputMode:"decimal",autoComplete:"off"})]})]}),e.jsxs("div",{className:"ap-field",children:[e.jsx("label",{className:"ap-label",htmlFor:"tipo-input",children:"TIPO DE APOSTA"}),e.jsx(ha,{id:"tipo-input",options:_a,value:y,onChange:W})]}),l&&Oe[y]&&!$&&e.jsxs("div",{className:"ap-odd-sug",children:[e.jsx("span",{className:"ap-odd-sug-icon","aria-hidden":"true",children:"💡"}),e.jsxs("span",{className:"ap-odd-sug-text",children:["Odd referência para ",e.jsx("em",{children:y}),":"," ",e.jsx("strong",{children:Oe[y]})]}),e.jsx("button",{type:"button",className:"ap-odd-sug-btn",onClick:()=>K(Oe[y]),children:"Usar"})]}),e.jsxs("div",{className:"ap-row-2 ap-row-secondary",children:[e.jsxs("div",{className:"ap-field",children:[e.jsx("label",{className:"ap-label ap-label-dim",htmlFor:"camp-input",children:"CAMPEONATO"}),e.jsx(ha,{id:"camp-input",options:Ha,value:J,onChange:_,placeholder:"Selecionar"})]}),e.jsxs("div",{className:"ap-field",children:[e.jsx("label",{className:"ap-label ap-label-dim",htmlFor:"jogo-input",children:"PARTIDA"}),e.jsx("input",{id:"jogo-input",className:"ap-input",type:"text",placeholder:"Ex: Flamengo × Palmeiras",value:U,onChange:a=>B(a.target.value),autoComplete:"off"})]})]}),se&&e.jsx("div",{className:"ap-error",role:"alert",children:se}),e.jsx("button",{className:"ap-submit",type:"submit",children:"INICIAR ANÁLISE →"})]})}),R&&e.jsxs("div",{className:"ap-loading",role:"status","aria-live":"polite",children:[e.jsxs("div",{className:"ap-loading-hdr",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"ap-loading-engine",children:["RISK ENGINE v2.4",e.jsx("span",{className:"ap-loading-engine-dot","aria-hidden":"true"})]}),l?e.jsxs("div",{className:"ap-loading-sub ap-loading-sub-game",children:[l.home," × ",l.away]}):e.jsx("div",{className:"ap-loading-sub",children:"Processamento quantitativo em execução"})]}),e.jsx("span",{className:"ap-loading-status",children:"CALCULANDO"})]}),e.jsxs("div",{className:"ap-loading-bar-wrap",children:[e.jsx("div",{className:"ap-loading-bar",style:{width:`${T}%`}}),e.jsx("div",{className:"ap-loading-bar-glow",style:{left:`${T}%`}})]}),e.jsxs("div",{className:"ap-loading-pct","aria-label":`${T}%`,children:[T,e.jsx("span",{className:"ap-loading-pct-sym",children:"%"})]}),e.jsx("div",{className:"ap-loading-steps",children:te.map((a,r)=>e.jsxs("div",{className:`ap-lstep${r<C?" ap-lstep-done":r===C?" ap-lstep-active":""}`,children:[e.jsx("span",{className:"ap-lstep-icon","aria-hidden":"true",children:r<C?"✓":r===C?"▶":"○"}),e.jsx("span",{className:"ap-lstep-lbl",children:a.label}),r===C&&e.jsx("span",{className:"ap-lstep-cursor","aria-hidden":"true",children:"_"}),r<C&&e.jsx("span",{className:"ap-lstep-done-tag",children:"OK"})]},r))})]}),h&&!R&&h.locked&&ta(h.signals||[]),h&&!R&&!h.locked&&e.jsxs("div",{className:"db-output",role:"region","aria-label":"Resultado da análise",children:[e.jsxs("div",{className:"db-topbar",children:[e.jsxs("div",{className:"db-topbar-meta",children:[e.jsxs("span",{className:"db-id",children:["#",h.id]}),e.jsx("span",{className:"db-sep","aria-hidden":"true",children:"·"}),e.jsx("span",{className:"db-ts",children:h.ts}),e.jsx("span",{className:"db-sep","aria-hidden":"true",children:"·"}),e.jsxs("span",{className:"db-ai-badge",children:[e.jsx("span",{className:"db-ai-dot","aria-hidden":"true"}),"IA ativa"]})]}),e.jsx("button",{className:"db-btn-ghost",onClick:Ma,"aria-label":"Nova análise",children:"Nova análise →"})]}),ra(h),e.jsx("p",{className:"db-disclaimer",children:"Análise educativa. Não representa garantia de resultado. A decisão é sua."})]})]},"nova"),g==="comparador"&&e.jsx(Le,{mod:"MÓDULO III",title:"Comparador de Odds",desc:"Compare múltiplas odds simultaneamente e identifique distorções entre casas de apostas. O Comparador cruza probabilidades implícitas em tempo real."}),g==="aovivo"&&e.jsx(Le,{mod:"MERCADOS",title:"Ao Vivo",desc:"Feed de análises em tempo real com atualizações automáticas de probabilidade para eventos em andamento. Integração com dados de mercado ao vivo."}),g==="favoritos"&&e.jsx(Le,{mod:"ARQUIVO",title:"Favoritos",desc:"Salve e organize suas análises mais relevantes. Crie coleções por campeonato, mercado ou período para consulta rápida."}),g==="jogos"&&e.jsxs("div",{className:"ap-content ap-content-flow",children:[v==="lista"&&e.jsxs("div",{className:"fl-step",children:[e.jsxs("div",{className:"ap-panel-hdr",children:[e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:"ANÁLISE ESPORTIVA"}),e.jsx("div",{className:"ap-panel-title",children:"Jogos de Hoje"})]}),e.jsxs("div",{className:"jg-hdr-right",children:[e.jsxs("div",{className:"jg-data-badge",children:[e.jsx("span",{className:"jg-data-dot","aria-hidden":"true"}),"DADOS ESPORTIVOS"]}),Pe&&e.jsx("span",{className:"jg-updated",children:Pe.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}),e.jsx("button",{className:"jg-refresh-btn",onClick:ze,disabled:Q,title:"Atualizar",type:"button","aria-label":"Atualizar partidas",children:e.jsx("svg",{width:"12",height:"12",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M12 7A5 5 0 1 1 7 2M12 7V2.5M12 2.5H8",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})})]})]}),Q&&e.jsxs("div",{className:"jg-loading",children:[e.jsx("span",{className:"jg-dot"}),e.jsx("span",{className:"jg-dot"}),e.jsx("span",{className:"jg-dot"}),e.jsx("span",{className:"jg-loading-lbl",children:"Atualizando jogos reais…"})]}),ke&&!Q&&e.jsxs("div",{className:"ap-geral-empty",role:"alert",children:[e.jsx("div",{className:"jg-empty-icon","aria-hidden":"true",children:e.jsxs("svg",{width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",children:[e.jsx("circle",{cx:"12",cy:"12",r:"9.5",stroke:"currentColor",strokeWidth:"1.4"}),e.jsx("path",{d:"M12 7v5.5M12 15.5v.5",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round"})]})}),e.jsx("p",{className:"jg-empty-title",children:"Não conseguimos atualizar os jogos."}),e.jsx("p",{className:"jg-empty-sub",children:"Você pode tentar novamente ou fazer uma análise manual."}),e.jsxs("div",{className:"jg-empty-actions",children:[e.jsx("button",{className:"jg-retry-btn",onClick:ze,type:"button",children:"Tentar novamente"}),e.jsx("button",{className:"ap-geral-btn",onClick:()=>w("nova"),type:"button",children:"Analisar manualmente"})]})]}),!Q&&V.length===0&&!ke&&e.jsxs("div",{className:"ap-geral-empty",children:[e.jsx("div",{className:"jg-empty-icon","aria-hidden":"true",children:e.jsxs("svg",{width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",children:[e.jsx("rect",{x:"3",y:"4",width:"18",height:"17",rx:"2.5",stroke:"currentColor",strokeWidth:"1.4"}),e.jsx("path",{d:"M3 9h18M8 2v4M16 2v4",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round"}),e.jsx("path",{d:"M7.5 14h9M7.5 17.5h5.5",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"})]})}),e.jsx("p",{className:"jg-empty-title",children:"Nenhum jogo real encontrado agora."}),e.jsx("p",{className:"jg-empty-sub",children:"Os jogos aparecem aqui quando a API retorna partidas disponíveis para hoje."}),e.jsx("button",{className:"ap-geral-btn",onClick:()=>w("nova"),type:"button",children:"Analisar manualmente →"})]}),!Q&&V.length>0&&(()=>{const a=V.filter(t=>t.status==="live").length,r=[...new Set(V.map(t=>ue(t.league)).filter(Boolean))],d=["todos",...a>0?["live"]:[],...r],u=oe==="todos"?V:oe==="live"?V.filter(t=>t.status==="live"):V.filter(t=>ue(t.league)===oe);return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"jg-filters",children:d.map(t=>e.jsx("button",{className:["jg-pill",oe===t?"jg-pill-on":"",t==="live"?"jg-pill-live":""].join(" ").trim(),onClick:()=>Sa(t),type:"button",children:t==="todos"?"Todos":t==="live"?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"jg-pill-dot","aria-hidden":"true"}),"Ao Vivo (",a,")"]}):t},t))}),e.jsx("div",{className:"jg-grid",children:u.map((t,p)=>{const k=t.scoreHome!==null&&t.scoreAway!==null;return e.jsxs("button",{className:`jg-card jg-card-${t.status}`,onClick:()=>Fa(t),type:"button",style:{animationDelay:`${Math.min(p,6)*40}ms`},children:[e.jsxs("div",{className:"jg-card-header",children:[e.jsx("span",{className:"jg-league",children:ue(t.league)||t.league}),t.status==="upcoming"&&t.time&&e.jsx("span",{className:"jg-time",children:t.time})]}),t.status==="live"&&e.jsxs("div",{className:"jg-status-row",children:[e.jsx("span",{className:"jg-live-dot","aria-hidden":"true"}),e.jsx("span",{className:"jg-status-live-text",children:"AO VIVO"}),t.elapsed!=null&&e.jsxs("span",{className:"jg-elapsed",children:[t.elapsed,"'"]})]}),t.status==="ended"&&e.jsx("div",{className:"jg-status-row",children:e.jsx("span",{className:"jg-status-ended-text",children:"ENCERRADO"})}),e.jsxs("div",{className:"jg-matchup",children:[e.jsx("span",{className:"jg-team-name",children:t.home}),e.jsx("div",{className:"jg-score-center",children:k?e.jsxs("span",{className:"jg-score-pair",children:[e.jsx("span",{className:"jg-score-num",children:t.scoreHome}),e.jsx("span",{className:"jg-score-dash",children:"—"}),e.jsx("span",{className:"jg-score-num",children:t.scoreAway})]}):e.jsx("span",{className:"jg-vs",children:"×"})}),e.jsx("span",{className:"jg-team-name jg-team-right",children:t.away})]}),D&&(()=>{const S=he(t.home,D),j=he(t.away,D);if(!S&&!j)return null;const E=f=>f==="W"?"#22C55E":f==="D"?"#F59E0B":"#EF4444";return e.jsxs("div",{className:"jg-forma-row",children:[e.jsx("div",{className:"jg-forma-side",children:(S?.forma||[]).map((f,N)=>e.jsx("span",{className:"jg-forma-dot",style:{background:E(f)},title:f},N))}),e.jsx("div",{className:"jg-forma-mid"}),e.jsx("div",{className:"jg-forma-side jg-forma-side-r",children:(j?.forma||[]).map((f,N)=>e.jsx("span",{className:"jg-forma-dot",style:{background:E(f)},title:f},N))})]})})(),e.jsx("div",{className:"jg-card-footer",children:e.jsx("span",{className:"jg-cta",children:"Vale apostar? →"})})]},t.id||p)})}),e.jsxs("div",{className:"jg-disclaimer",role:"note",children:[e.jsxs("svg",{width:"10",height:"10",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:[e.jsx("circle",{cx:"7",cy:"7",r:"5.5",stroke:"currentColor",strokeWidth:"1.3"}),e.jsx("path",{d:"M7 6.5v3.5M7 4.5v.5",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round"})]}),"Ferramenta educativa. Dados de partidas para contexto de análise de risco. Não é recomendação de aposta."]})]})})()]}),v==="mercado"&&l&&e.jsxs("div",{className:"fl-step",children:[e.jsxs("button",{className:"fl-back-btn",onClick:()=>{Z(null),b("lista")},type:"button",children:[e.jsx("svg",{width:"10",height:"10",viewBox:"0 0 12 12",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M8 2L4 6L8 10",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round"})}),"Mudar partida"]}),e.jsxs("div",{className:`fl-game-hero${l.status==="live"?" fl-game-hero-live":""}`,children:[e.jsxs("div",{className:"fl-hero-meta",children:[e.jsx("span",{className:"fl-hero-league",children:l.campeonato}),l.status==="live"?e.jsxs("div",{className:"fl-hero-status-live",children:[e.jsx("span",{className:"fl-hero-live-dot","aria-hidden":"true"}),"AO VIVO",l.elapsed?` · ${l.elapsed}'`:""]}):l.time?e.jsx("span",{className:"fl-hero-time",children:l.time}):null]}),e.jsxs("div",{className:"fl-teams",children:[e.jsx("span",{className:"fl-team",children:l.home}),e.jsx("span",{className:"fl-vs",children:"×"}),e.jsx("span",{className:"fl-team fl-team-right",children:l.away})]})]}),e.jsx("div",{className:"fl-section-hdr",children:"ESCOLHA O MERCADO"}),e.jsx("div",{className:"fl-market-list",children:oa.map(a=>{const r=Ia?.tipo===a.tipo;return e.jsxs("div",{className:`fl-mcard${r?" fl-mcard-open":""}`,children:[e.jsxs("button",{className:"fl-mcard-hdr",onClick:()=>{r?(Ne(null),ne(""),de("")):(Ne(a),ne(a.ref),de(""))},type:"button",children:[e.jsx("span",{className:"fl-mcard-name",children:a.tipo}),e.jsxs("span",{className:"fl-mcard-ref",children:["Ref. ",a.ref]}),e.jsx("svg",{className:"fl-mcard-chev",width:"10",height:"10",viewBox:"0 0 12 12",fill:"none",style:{transform:r?"rotate(180deg)":"none"},children:e.jsx("path",{d:"M2.5 4.5L6 8L9.5 4.5",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round"})})]}),r&&(()=>{const d=parseFloat(We?.bancaInicial)||0,u=parseFloat(le),t=d>0&&u>0?(u/d*100).toFixed(1):null;return e.jsxs("div",{className:"fl-mcard-body",children:[e.jsxs("div",{className:"fl-mcard-fields",children:[e.jsxs("div",{className:"fl-mcard-field-wrap",children:[e.jsx("span",{className:"fl-mcard-odd-lbl",children:"Odd"}),e.jsx("input",{className:"fl-mcard-odd-input",type:"text",value:qe,onChange:p=>ne(p.target.value),placeholder:a.ref,inputMode:"decimal",autoComplete:"off",autoFocus:!0,"aria-label":"Informe a odd"})]}),e.jsxs("div",{className:"fl-mcard-field-wrap",children:[e.jsx("span",{className:"fl-mcard-odd-lbl",children:"Valor R$"}),e.jsx("input",{className:"fl-mcard-odd-input",type:"number",min:"0.01",step:"0.01",value:le,onChange:p=>de(p.target.value),placeholder:d>0?(d*.05).toFixed(0):"50",inputMode:"decimal",autoComplete:"off","aria-label":"Valor apostado"})]})]}),t!==null&&e.jsxs("div",{className:"fl-mcard-banca-hint",children:[t,"% da banca · ",parseFloat(le).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})]}),d===0&&e.jsx("div",{className:"fl-mcard-banca-hint fl-mcard-banca-setup",children:"Configure sua banca em Controle de Banca para ver a exposição"}),e.jsx("button",{className:"fl-mcard-confirm",onClick:()=>Xe(a.tipo,qe||a.ref,le),type:"button",children:"Analisar →"})]})})()]},a.tipo)})}),e.jsx("button",{className:"fl-manual-link",onClick:()=>w("nova"),type:"button",children:"Abrir análise manual completa →"})]}),v==="resultado"&&e.jsxs("div",{className:"fl-step",children:[l&&e.jsxs("div",{className:`fl-ctx-strip${l.status==="live"?" fl-ctx-live":""}`,children:[e.jsx("span",{className:"fl-ctx-dot","aria-hidden":"true"}),e.jsxs("span",{className:"fl-ctx-match",children:[l.home," × ",l.away]}),e.jsx("span",{className:"fl-ctx-sep","aria-hidden":"true",children:"·"}),e.jsx("span",{className:"fl-ctx-tipo",children:y}),l.status==="live"&&e.jsx("span",{className:"fl-ctx-live-badge",children:"AO VIVO"})]}),R&&e.jsxs("div",{className:"ap-loading",role:"status","aria-live":"polite",children:[e.jsxs("div",{className:"ap-loading-hdr",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"ap-loading-engine",children:["RISK ENGINE v2.4",e.jsx("span",{className:"ap-loading-engine-dot","aria-hidden":"true"})]}),e.jsx("div",{className:"ap-loading-sub ap-loading-sub-game",children:l?`${l.home} × ${l.away}`:"Processando análise"})]}),e.jsx("span",{className:"ap-loading-status",children:"CALCULANDO"})]}),e.jsxs("div",{className:"ap-loading-bar-wrap",children:[e.jsx("div",{className:"ap-loading-bar",style:{width:`${T}%`}}),e.jsx("div",{className:"ap-loading-bar-glow",style:{left:`${T}%`}})]}),e.jsxs("div",{className:"ap-loading-pct","aria-label":`${T}%`,children:[T,e.jsx("span",{className:"ap-loading-pct-sym",children:"%"})]}),e.jsx("div",{className:"ap-loading-steps",children:te.map((a,r)=>e.jsxs("div",{className:`ap-lstep${r<C?" ap-lstep-done":r===C?" ap-lstep-active":""}`,children:[e.jsx("span",{className:"ap-lstep-icon","aria-hidden":"true",children:r<C?"✓":r===C?"▶":"○"}),e.jsx("span",{className:"ap-lstep-lbl",children:a.label}),r===C&&e.jsx("span",{className:"ap-lstep-cursor","aria-hidden":"true",children:"_"}),r<C&&e.jsx("span",{className:"ap-lstep-done-tag",children:"OK"})]},r))})]}),se&&!R&&e.jsxs("div",{className:"ap-error",role:"alert",children:[se,e.jsx("button",{className:"fl-retry",onClick:()=>{I(""),Xe(y,$)},type:"button",children:"Tentar novamente"})]}),h&&!R&&h.locked&&ta(h.signals||[]),h&&!R&&!h.locked&&e.jsxs("div",{className:"db-output",role:"region","aria-label":"Resultado da análise",children:[e.jsxs("div",{className:"db-topbar",children:[e.jsxs("div",{className:"db-topbar-meta",children:[e.jsxs("span",{className:"db-id",children:["#",h.id]}),e.jsx("span",{className:"db-sep","aria-hidden":"true",children:"·"}),e.jsx("span",{className:"db-ts",children:h.ts}),e.jsx("span",{className:"db-sep","aria-hidden":"true",children:"·"}),e.jsxs("span",{className:"db-ai-badge",children:[e.jsx("span",{className:"db-ai-dot","aria-hidden":"true"}),"IA ativa"]})]}),e.jsx("div",{className:"fl-result-nav",children:e.jsx("button",{className:"db-btn-ghost",onClick:()=>{L(null),I(""),b("mercado")},type:"button",children:"← Outro mercado"})})]}),ra(h),D&&h.jogo&&h.jogo!=="Aposta"&&(()=>{const a=h.jogo.split(" × ");if(a.length!==2)return null;const r=pa(a[0].trim(),a[1].trim(),D);if(!r)return null;const d=r.h+r.d+r.a,u=a[0].trim().split(" ")[0],t=a[1].trim().split(" ")[0];return e.jsxs("div",{className:"db-h2h",children:[e.jsxs("div",{className:"db-h2h-title",children:["H2H · Últimos ",d," jogos"]}),e.jsxs("div",{className:"db-h2h-row",children:[e.jsxs("div",{className:"db-h2h-item",children:[e.jsx("span",{className:"db-h2h-val",style:{color:"#22C55E"},children:r.h}),e.jsx("span",{className:"db-h2h-lbl",children:u})]}),e.jsxs("div",{className:"db-h2h-item",children:[e.jsx("span",{className:"db-h2h-val",children:r.d}),e.jsx("span",{className:"db-h2h-lbl",children:"Empate"})]}),e.jsxs("div",{className:"db-h2h-item",children:[e.jsx("span",{className:"db-h2h-val",style:{color:"#EF4444"},children:r.a}),e.jsx("span",{className:"db-h2h-lbl",children:t})]}),e.jsxs("div",{className:"db-h2h-item",children:[e.jsx("span",{className:"db-h2h-val",style:{color:"#F59E0B"},children:r.mediaGols}),e.jsx("span",{className:"db-h2h-lbl",children:"Méd. gols"})]})]})]})})(),oa.some(a=>a.ref===h.odd.toFixed(2))&&e.jsxs("div",{className:"fl-ref-note",children:["Análise com odd de referência (",h.odd.toFixed(2),"). Use a odd real da sua casa para maior precisão."]}),e.jsx("div",{className:"db-actions",children:e.jsxs("button",{className:"db-btn-primary",onClick:()=>{L(null),I(""),Z(null),b("lista")},type:"button",children:[e.jsx("svg",{width:"11",height:"11",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round",strokeLinejoin:"round"})}),"Nova partida"]})}),e.jsx("p",{className:"db-disclaimer",children:"Análise educativa. Não representa garantia de resultado. A decisão é sempre sua."})]})]})]},`jogos-${v}`),g==="banca"&&(()=>{const a=parseFloat(We?.bancaInicial)||0,r=a>0?ja(M,a):null,d=a>0?rr(M,a):[],u=r?(r.saldo/a*100).toFixed(1):null;return e.jsxs("div",{className:"ap-content",children:[e.jsxs("div",{className:"ap-panel-hdr",children:[e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:"GESTÃO"}),e.jsx("div",{className:"ap-panel-title",children:"Controle de Banca"})]}),e.jsxs("div",{className:"ap-panel-online",children:[e.jsx("span",{className:"ap-status-dot","aria-hidden":"true"}),M.length," ENTRADAS"]})]}),Ta?e.jsxs(e.Fragment,{children:[!a&&e.jsxs("div",{className:"bk-setup-panel",children:[e.jsx("div",{className:"bk-setup-title",children:"Configure sua banca inicial"}),e.jsx("div",{className:"bk-setup-sub",children:"Informe o valor total que você dedica às apostas para calcular métricas precisas."}),e.jsxs("div",{className:"bk-setup-row",children:[e.jsxs("div",{className:"bk-setup-input-wrap",children:[e.jsx("span",{className:"bk-currency",children:"R$"}),e.jsx("input",{className:"ap-input bk-setup-input",type:"number",min:"1",step:"0.01",placeholder:"Ex: 500.00",value:Je,onChange:t=>Ke(t.target.value),onKeyDown:t=>t.key==="Enter"&&aa()})]}),e.jsx("button",{className:"bk-setup-btn",onClick:aa,children:"Confirmar"})]})]}),d.length>0&&e.jsx("div",{className:"bk-alerts",children:d.map((t,p)=>e.jsxs("div",{className:`bk-alert bk-alert-${t.type}`,children:[e.jsx("span",{className:"bk-alert-icon",children:t.type==="danger"?"⚠":"●"}),t.msg]},p))}),a>0&&M.length===0&&e.jsxs("div",{className:"bk-empty-state",children:[e.jsx("div",{className:"bk-empty-icon",children:"📊"}),e.jsx("div",{className:"bk-empty-title",children:"Nenhuma entrada ainda"}),e.jsx("div",{className:"bk-empty-sub",children:"Registre sua primeira aposta para começar a acompanhar sua banca."})]}),a>0&&M.length>0&&r&&e.jsxs("div",{className:"bk-cards",children:[e.jsxs("div",{className:"bk-card",children:[e.jsx("div",{className:"bk-card-label",children:"SALDO ATUAL"}),e.jsxs("div",{className:"bk-card-val",style:{color:r.saldo>=a?"var(--green)":"var(--red)"},children:["R$ ",r.saldo.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})]}),e.jsxs("div",{className:"bk-card-sub",children:[u,"% da banca inicial"]})]}),e.jsxs("div",{className:"bk-card",children:[e.jsx("div",{className:"bk-card-label",children:"LUCRO / PREJUÍZO"}),e.jsxs("div",{className:"bk-card-val",style:{color:r.lucroTotal>=0?"var(--green)":"var(--red)"},children:[r.lucroTotal>=0?"+":"","R$ ",Math.abs(r.lucroTotal).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})]}),e.jsxs("div",{className:"bk-card-sub",children:[r.wins,"G · ",r.losses,"P de ",r.totalApos," apostas"]})]}),e.jsxs("div",{className:"bk-card",children:[e.jsx("div",{className:"bk-card-label",children:"ROI"}),e.jsxs("div",{className:"bk-card-val",style:{color:r.roi>=0?"var(--green)":"var(--red)"},children:[r.roi>=0?"+":"",r.roi.toFixed(1),"%"]}),e.jsx("div",{className:"bk-card-sub",children:"Retorno sobre investido"})]}),e.jsxs("div",{className:"bk-card",children:[e.jsx("div",{className:"bk-card-label",children:"TAXA DE ACERTO"}),e.jsxs("div",{className:"bk-card-val",style:{color:r.acerto>=55?"var(--green)":r.acerto>=45?"var(--amber)":"var(--red)"},children:[r.acerto.toFixed(1),"%"]}),e.jsxs("div",{className:"bk-card-sub",children:[r.wins," vitórias"]})]}),e.jsxs("div",{className:"bk-card",children:[e.jsx("div",{className:"bk-card-label",children:"SEQUÊNCIA ATUAL"}),e.jsx("div",{className:"bk-card-val",style:{color:r.streak>0?"var(--green)":r.streak<0?"var(--red)":"var(--t2)"},children:r.streak>0?`+${r.streak}`:r.streak===0?"—":r.streak}),e.jsxs("div",{className:"bk-card-sub",children:["Pior sequência: ",r.maxStreak," derrotas"]})]}),e.jsxs("div",{className:"bk-card",children:[e.jsx("div",{className:"bk-card-label",children:"BANCA INICIAL"}),e.jsxs("div",{className:"bk-card-val",style:{color:"var(--t1)"},children:["R$ ",a.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})]}),e.jsx("div",{className:"bk-card-sub bk-reset-link",onClick:()=>{_e({}),ca({})},children:"redefinir"})]})]}),e.jsxs("div",{className:"bk-actions",children:[e.jsx("button",{className:"bk-add-btn",onClick:()=>{Ye(t=>!t),Ue(!1)},children:He?"Cancelar":"+ Registrar entrada"}),M.length>0&&(Ea?e.jsxs("div",{className:"bk-clear-confirm",children:[e.jsx("span",{children:"Apagar tudo?"}),e.jsx("button",{className:"bk-clear-yes",onClick:Ba,children:"Sim, apagar"}),e.jsx("button",{className:"bk-clear-no",onClick:()=>ye(!1),children:"Cancelar"})]}):e.jsx("button",{className:"bk-clear-btn",onClick:()=>ye(!0),children:"Limpar histórico"}))]}),He&&e.jsxs("div",{className:"bk-form",children:[e.jsx("p",{className:"bk-form-intro",children:"Registre o resultado da sua aposta para atualizar sua banca."}),e.jsxs("div",{className:"bk-form-row",children:[e.jsxs("div",{className:"bk-form-field",children:[e.jsx("label",{className:"ap-label",children:"VALOR (R$)"}),e.jsx("input",{className:"ap-input",type:"number",min:"0.01",step:"0.01",placeholder:"Ex: 25.00",value:A.valor,onChange:t=>G(p=>({...p,valor:t.target.value}))})]}),e.jsxs("div",{className:"bk-form-field",children:[e.jsx("label",{className:"ap-label",children:"ODD"}),e.jsx("input",{className:"ap-input",type:"number",min:"1.01",step:"0.01",placeholder:"Ex: 1.85",value:A.odd,onChange:t=>G(p=>({...p,odd:t.target.value}))})]})]}),e.jsxs("div",{className:"bk-form-field",children:[e.jsx("label",{className:"ap-label",children:"RESULTADO"}),e.jsxs("select",{className:"ap-input",value:A.resultado,onChange:t=>G(p=>({...p,resultado:t.target.value})),children:[e.jsx("option",{children:"Ganhou"}),e.jsx("option",{children:"Perdeu"}),e.jsx("option",{children:"Anulada"})]})]}),e.jsx("button",{className:"bk-form-more",type:"button",onClick:()=>Ue(t=>!t),children:Ge?"− Menos opções":"+ Mercado e observação"}),Ge&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"bk-form-field",children:[e.jsx("label",{className:"ap-label",children:"MERCADO"}),e.jsx("select",{className:"ap-input",value:A.mercado,onChange:t=>G(p=>({...p,mercado:t.target.value})),children:Ya.map(t=>e.jsx("option",{children:t},t))})]}),e.jsxs("div",{className:"bk-form-field",children:[e.jsx("label",{className:"ap-label",children:"OBSERVAÇÃO"}),e.jsx("input",{className:"ap-input",type:"text",maxLength:120,placeholder:"Ex: Flamengo × Palmeiras — aposta no empate",value:A.obs,onChange:t=>G(p=>({...p,obs:t.target.value}))})]})]}),e.jsx("button",{className:"bk-submit-btn",onClick:Ra,disabled:!A.valor||!A.odd,children:"Salvar entrada"})]}),M.length>0?e.jsxs("div",{className:"bk-hist",children:[e.jsxs("div",{className:"bk-hist-hdr",children:[e.jsx("span",{children:"Data"}),e.jsx("span",{children:"Mercado"}),e.jsx("span",{children:"Odd"}),e.jsx("span",{children:"Valor"}),e.jsx("span",{children:"Resultado"}),e.jsx("span",{})]}),M.map(t=>{const p=t.resultado==="Ganhou"?"var(--green)":t.resultado==="Perdeu"?"var(--red)":"var(--t2)",k=t.resultado==="Ganhou"?`+R$ ${(t.valor*(t.odd-1)).toFixed(2)}`:t.resultado==="Perdeu"?`-R$ ${parseFloat(t.valor).toFixed(2)}`:"—";return e.jsxs("div",{className:"bk-hist-row",children:[e.jsx("span",{className:"bk-hist-date",children:new Date(t.ts).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}),e.jsx("span",{className:"bk-hist-mercado",children:t.mercado}),e.jsx("span",{className:"bk-hist-odd",children:parseFloat(t.odd).toFixed(2)}),e.jsxs("span",{className:"bk-hist-valor",children:["R$ ",parseFloat(t.valor).toFixed(2)]}),e.jsx("span",{className:"bk-hist-res",style:{color:p},children:k}),e.jsx("button",{className:"bk-hist-del",onClick:()=>Da(t.id),"aria-label":"Remover",children:"×"})]},t.id)})]}):a>0?e.jsx("div",{className:"ap-empty",children:"Nenhuma entrada registrada. Use o botão acima para adicionar."}):null,e.jsxs("div",{className:"bk-edu",children:[e.jsx("p",{children:"A gestão de banca é o único fator que você controla totalmente em apostas. Defina um limite, respeite-o."}),e.jsx("p",{children:"Recomenda-se arriscar entre 1% e 3% da banca por entrada para preservar o capital a longo prazo."})]}),e.jsx("p",{className:"db-disclaimer",children:"Ferramenta educativa. Não representa orientação financeira. A responsabilidade pelas decisões é inteiramente sua."})]}):e.jsx("div",{className:"lk-wrap",style:{marginTop:12},children:e.jsxs("div",{className:"lk-preview-card",style:{minHeight:340},children:[e.jsxs("div",{className:"lk-header",children:[e.jsx("div",{className:"lk-header-event",children:"Controle de Banca"}),e.jsx("div",{className:"lk-header-meta",children:e.jsx("span",{className:"lk-badge-blur",children:"████████"})})]}),e.jsx("div",{className:"lk-divider"}),e.jsx("div",{className:"bk-stats-blur-row",children:["Saldo atual","ROI","Acerto","Perda máx."].map(t=>e.jsxs("div",{className:"bk-stat-blur-card",children:[e.jsx("div",{className:"bk-stat-blur-val",children:"██.█"}),e.jsx("div",{className:"bk-stat-blur-label",children:t})]},t))}),e.jsxs("div",{className:"lk-overlay",children:[e.jsx("div",{className:"lk-lock-icon",children:e.jsxs("svg",{width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",children:[e.jsx("rect",{x:"3",y:"11",width:"18",height:"11",rx:"3",stroke:"rgba(255,255,255,.25)",strokeWidth:"1.5"}),e.jsx("path",{d:"M7 11V7a5 5 0 0 1 10 0v4",stroke:"rgba(255,255,255,.25)",strokeWidth:"1.5",strokeLinecap:"round"}),e.jsx("circle",{cx:"12",cy:"16",r:"1.5",fill:"rgba(255,255,255,.25)"})]})}),e.jsx("div",{className:"lk-lock-title",children:"Controle de banca disponível com acesso"}),e.jsx("div",{className:"lk-lock-sub",children:"Registre entradas · acompanhe ROI · gerencie sua banca"}),e.jsx("a",{href:la,className:"lk-cta-btn",children:"Desbloquear acesso completo"}),e.jsx("div",{className:"lk-price-note",children:"Pagamento único · sem mensalidade · acesso imediato · R$ 27"})]})]})})]},"banca")})(),g==="historico"&&e.jsxs("div",{className:"ap-content",children:[e.jsxs("div",{className:"ap-panel-hdr",children:[e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:"ARQUIVO"}),e.jsx("div",{className:"ap-panel-title",children:"Histórico de análises"})]}),e.jsxs("div",{className:"ap-panel-online",children:[e.jsx("span",{className:"ap-status-dot","aria-hidden":"true"}),z.length," REGISTROS"]})]}),z.length===0?e.jsx("div",{className:"ap-empty",children:"Nenhuma análise registrada nesta sessão."}):e.jsx("div",{className:"ap-hist-list",children:z.map((a,r)=>e.jsxs("button",{className:"ap-hist-row",onClick:()=>ea(a),children:[e.jsxs("span",{className:"ap-hist-id",children:["#",a.id||"—"]}),e.jsx("span",{className:"ap-hist-event",children:a.jogo||"Aposta"}),e.jsxs("span",{className:"ap-hist-odd",children:["Odd ",a.odd]}),e.jsx("div",{className:"ap-hist-bar",children:e.jsx("div",{style:{width:`${a.score}%`,background:a.color,height:"100%",borderRadius:99}})}),e.jsx("span",{className:"ap-hist-score",style:{color:a.color},children:a.score}),e.jsx("span",{className:"ap-hist-tag",style:{color:a.color,borderColor:`${a.color}33`},children:a.label}),e.jsx("span",{className:"ap-hist-ts",children:a.ts||""})]},r))})]},"historico"),g==="config"&&e.jsxs("div",{className:"ap-content",children:[e.jsx("div",{className:"ap-panel-hdr",children:e.jsxs("div",{className:"ap-panel-hdr-left",children:[e.jsx("div",{className:"ap-panel-mod",children:"SISTEMA"}),e.jsx("div",{className:"ap-panel-title",children:"Configurações"})]})}),e.jsxs("div",{className:"ap-config-panel",children:[e.jsxs("div",{className:"ap-config-field",children:[e.jsx("label",{className:"ap-label",htmlFor:"token-input",children:"TOKEN DE ACESSO"}),e.jsx("input",{id:"token-input",className:"ap-input ap-input-mono",type:"text",placeholder:"Cole seu token de acesso aqui",value:q,onChange:a=>{ve(a.target.value),localStorage.setItem(be,a.target.value)},autoComplete:"off",spellCheck:!1}),e.jsx("p",{className:"ap-config-hint",children:"Token recebido por email após a confirmação de acesso."})]}),e.jsxs("div",{className:"ap-config-info",children:[e.jsxs("div",{className:"ap-config-row",children:[e.jsx("span",{children:"Engine"}),e.jsx("span",{children:"MotorIA Risk Engine™ v2.4"})]}),e.jsxs("div",{className:"ap-config-row",children:[e.jsx("span",{children:"Modelo"}),e.jsx("span",{children:"Quantitative Risk v2"})]}),e.jsxs("div",{className:"ap-config-row",children:[e.jsx("span",{children:"Histórico local"}),e.jsxs("span",{children:[z.length," / ",na]})]}),e.jsxs("div",{className:"ap-config-row",children:[e.jsx("span",{children:"Status"}),e.jsx("span",{className:"ap-config-online",children:"● ONLINE"})]})]})]})]},"config")]})]}),e.jsx("nav",{className:"ap-tab-bar","aria-label":"Navegação principal",children:[{id:"jogos",label:"Jogos",Icon:ma},{id:"nova",label:"Análise",Icon:xa},{id:"banca",label:"Banca",Icon:ba},{id:"config",label:"Config",Icon:ga}].map(({id:a,label:r,Icon:d})=>e.jsxs("button",{className:`ap-tab-item${g===a?" ap-tab-active":""}`,onClick:()=>w(a),"aria-current":g===a?"page":void 0,type:"button",children:[e.jsx(d,{}),e.jsx("span",{className:"ap-tab-label",children:r})]},a))})]})]})}const lr=`
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

html, body { overflow-x: hidden; max-width: 100%; }
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
  overflow: hidden; min-width: 0;
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

.ap-topbar-center { flex: 1; display: flex; align-items: center; justify-content: center; min-width: 0; overflow: hidden; }
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
  flex: 1; overflow-y: auto; overflow-x: hidden; background: var(--bg);
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
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px;
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
  border-radius: 10px; padding: 36px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  text-align: center;
}
.ap-geral-empty p { font-size: 13px; color: var(--t3); }
.jg-empty-icon { color: var(--t3); opacity: .5; margin-bottom: 2px; }
.jg-empty-title { font-size: 14px !important; font-weight: 600; color: var(--t1) !important; margin: 0; }
.jg-empty-sub   { font-size: 12px !important; color: var(--t3) !important; line-height: 1.6; max-width: 280px; margin: 0; }
.jg-empty-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }

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
.ap-row-2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; }
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
.ap-metrics-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
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
.ap-ai-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 7px; }
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
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
  .ap-geral-stats { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .ap-geral-action { flex-direction: column; align-items: flex-start; }
  .ap-geral-recent-row { grid-template-columns: 1fr 36px 28px 50px; }
  .ap-geral-recent-id, .ap-geral-recent-odd, .ap-geral-recent-bar { display: none; }
  .ap-metrics-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .ap-ai-grid { grid-template-columns: minmax(0, 1fr); }
  .ap-row-2 { grid-template-columns: minmax(0, 1fr); }
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
  .db-cards { grid-template-columns: minmax(0, 1fr); }
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
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px;
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
  .jg-grid { grid-template-columns: minmax(0, 1fr); }
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
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: var(--t1); cursor: pointer;
  background: var(--bg); border: 1px solid var(--border); font-family: inherit;
  border-radius: 8px; padding: 8px 16px; transition: border-color .18s;
}
.jg-retry-btn:hover { border-color: var(--t3); }

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

/* ═══════════════════════════════════════════════════════════════════════════
   FLOW — 3-step primary flow (fl-* components)
   JOGOS → MERCADO → RESULTADO: zero-friction analysis in <15 seconds
   ═══════════════════════════════════════════════════════════════════════════ */

@keyframes fl-step-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Content wrapper (flow variant) ───────────────────────────────────────── */
.ap-content-flow {
  max-width: 600px;
  padding-top: 20px;
}

/* ── Step wrapper ─────────────────────────────────────────────────────────── */
.fl-step {
  display: flex; flex-direction: column; gap: 14px;
  animation: fl-step-in .2s ease both;
}

/* ── Back button ──────────────────────────────────────────────────────────── */
.fl-back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  font-size: 11.5px; font-weight: 700; color: var(--t2);
  font-family: inherit; padding: 0; letter-spacing: .02em;
  align-self: flex-start; transition: color .13s;
}
.fl-back-btn:hover { color: var(--t1); }

/* ── Game hero card (large match display in mercado step) ─────────────────── */
.fl-game-hero {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 14px; padding: 20px 22px;
  display: flex; flex-direction: column; gap: 14px;
}
.fl-game-hero-live {
  border-color: rgba(239,68,68,.25);
  background: rgba(239,68,68,.025);
}

.fl-hero-meta {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.fl-hero-league {
  font-size: 9px; font-weight: 800; letter-spacing: .16em;
  color: var(--t3); text-transform: uppercase;
}
.fl-hero-time {
  font-size: 12px; font-weight: 700; color: var(--t2);
  font-variant-numeric: tabular-nums; font-family: 'Courier New', monospace;
}
.fl-hero-status-live {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 800; letter-spacing: .1em; color: #EF4444;
}
.fl-hero-live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #EF4444; flex-shrink: 0;
  animation: ap-pulse 1.4s ease-in-out infinite;
}

/* Teams row — prominent match display */
.fl-teams {
  display: flex; align-items: center; gap: 12px;
}
.fl-team {
  font-size: 22px; font-weight: 900; color: var(--t1);
  letter-spacing: -0.04em; flex: 1; line-height: 1.1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.fl-team-right { text-align: right; }
.fl-vs {
  font-size: 14px; font-weight: 700; color: var(--t3); flex-shrink: 0;
}

/* ── Section header ───────────────────────────────────────────────────────── */
.fl-section-hdr {
  font-size: 8px; font-weight: 800; letter-spacing: .2em;
  color: var(--t3); text-transform: uppercase;
  margin-top: 2px; margin-bottom: -2px;
}

/* ── Market grid (2 × 3 = 6 buttons) ─────────────────────────────────────── */
.fl-market-grid {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;
}

.fl-market-btn {
  display: flex; flex-direction: column; gap: 5px;
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 13px 14px;
  cursor: pointer; font-family: inherit; text-align: left;
  transition: border-color .14s, background .14s, transform .12s;
}
.fl-market-btn:hover {
  border-color: rgba(34,197,94,.32);
  background: rgba(34,197,94,.04);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,.25);
}
.fl-market-btn:active { transform: translateY(0); }

.fl-market-name {
  font-size: 11.5px; font-weight: 700; color: var(--t1);
  letter-spacing: -0.01em; line-height: 1.3;
}
.fl-market-ref {
  font-size: 9px; font-weight: 700; letter-spacing: .04em;
  color: rgba(34,197,94,.6); font-family: 'Courier New', monospace;
}

/* ── Separator ────────────────────────────────────────────────────────────── */
.fl-sep {
  display: flex; align-items: center; gap: 10px; margin: 2px 0;
}
.fl-sep-line {
  flex: 1; height: 1px; background: rgba(255,255,255,.06);
}
.fl-sep-lbl {
  font-size: 9px; font-weight: 700; letter-spacing: .1em;
  color: var(--t3); text-transform: uppercase; flex-shrink: 0;
}

/* ── Custom odd row ───────────────────────────────────────────────────────── */
.fl-custom-row {
  display: grid; grid-template-columns: 1fr 88px auto; gap: 8px; align-items: end;
}
.fl-custom-tipo { min-width: 0; }
.fl-custom-odd {
  font-size: 18px !important; font-weight: 800 !important;
  letter-spacing: -0.03em !important; padding: 11px 10px !important;
  text-align: center;
}
.fl-custom-submit {
  display: flex; align-items: center; justify-content: center;
  background: #15803d; color: #dcfce7;
  font-size: 10px; font-weight: 900; letter-spacing: .1em;
  padding: 0 16px; border-radius: 8px; border: none; cursor: pointer;
  font-family: inherit; white-space: nowrap; flex-shrink: 0;
  height: 44px; min-width: 80px;
  transition: background .15s, transform .12s;
}
.fl-custom-submit:hover:not(:disabled) {
  background: #166534; transform: translateY(-1px);
}
.fl-custom-submit:active { transform: translateY(0); }
.fl-custom-submit:disabled { opacity: .4; cursor: not-allowed; }

/* ── Manual analysis link (secondary action) ──────────────────────────────── */
.fl-manual-link {
  display: block; text-align: center;
  font-size: 10.5px; font-weight: 700; color: var(--t3);
  background: none; border: none; cursor: pointer; font-family: inherit;
  letter-spacing: .03em; padding: 4px 0;
  transition: color .13s; align-self: center;
}
.fl-manual-link:hover { color: var(--t2); }

/* ── Context strip (resultado step — shows selected game + market) ─────────── */
.fl-ctx-strip {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  background: rgba(34,197,94,.05);
  border: 1px solid rgba(34,197,94,.16);
  border-radius: 10px; padding: 9px 14px;
  animation: ap-fade-up .18s ease both;
}
.fl-ctx-live {
  background: rgba(239,68,68,.04) !important;
  border-color: rgba(239,68,68,.2) !important;
}
.fl-ctx-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--green);
  flex-shrink: 0; animation: ap-pulse 2.4s ease-in-out infinite;
}
.fl-ctx-live .fl-ctx-dot { background: #EF4444; animation-duration: 1.4s; }
.fl-ctx-match {
  font-size: 12px; font-weight: 700; color: var(--t1); letter-spacing: -0.02em;
}
.fl-ctx-sep { color: var(--t3); font-size: 10px; }
.fl-ctx-tipo { font-size: 11px; color: var(--t2); }
.fl-ctx-live-badge {
  font-size: 8px; font-weight: 800; letter-spacing: .1em;
  color: rgba(239,68,68,.8); text-transform: uppercase; flex-shrink: 0;
  animation: ap-blink 1.6s ease-in-out infinite;
}

/* ── Result nav row (← Outro mercado button) ──────────────────────────────── */
.fl-result-nav {
  display: flex; align-items: center;
}

/* ── Retry button (inside error block) ───────────────────────────────────── */
.fl-retry {
  display: inline-block; margin-left: 10px;
  font-size: 11px; font-weight: 700; color: var(--red);
  background: none; border: none; cursor: pointer; font-family: inherit;
  text-decoration: underline; padding: 0;
}

/* ── Reference odd note ───────────────────────────────────────────────────── */
.fl-ref-note {
  font-size: 10px; color: var(--t3); line-height: 1.55;
  padding: 8px 12px;
  background: rgba(255,255,255,.02); border: 1px solid var(--border);
  border-radius: 7px;
}

/* ── Secondary nav item style (Análise Manual) ────────────────────────────── */
.ap-nav-manual { opacity: .72; }
.ap-nav-manual:hover:not(.ap-nav-dim) { opacity: 1; }
.ap-nav-manual.ap-nav-active { opacity: 1; }

/* ── Flow mobile ──────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .ap-content-flow { padding-top: 12px; }
  .fl-game-hero { padding: 16px 16px; }
  .fl-team { font-size: 17px; }
  .fl-market-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .fl-market-btn { padding: 11px 12px; }
  .fl-market-name { font-size: 11px; }
  /* Custom row: tipo spans full width, then odd + submit on row 2 */
  .fl-custom-row {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
  }
  .fl-custom-tipo { grid-column: 1 / -1; }
  .fl-custom-odd { width: auto; text-align: left; }
}

/* ── Status badge (01) ─────────────────────────────────────────────────────── */
.db-status-badge {
  margin: 16px 20px 0;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.06);
  border-left-width: 3px;
  border-left-style: solid;
  padding: 16px 20px;
  display: flex; align-items: center; gap: 12px;
  animation: ap-fade-up .22s ease both;
}
.db-status-icon { font-size: 20px; line-height: 1; flex-shrink: 0; }
.db-status-text {
  font-size: 20px; font-weight: 900;
  letter-spacing: .02em; text-transform: uppercase; line-height: 1.1;
}

/* ── Frase humana (02) ─────────────────────────────────────────────────────── */
.db-frase {
  margin: 14px 20px 0;
  font-size: 17px; font-weight: 400; color: #FFFFFF;
  line-height: 1.5; font-style: italic;
}

/* ── Grid 2×2 de indicadores (03) ─────────────────────────────────────────── */
.db-ind-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  padding: 16px 20px;
}
.db-ind-card {
  background: #111111; border-radius: 10px; padding: 14px;
  display: flex; flex-direction: column; gap: 4px;
}
.db-ind-label {
  font-size: 9px; font-weight: 800; letter-spacing: .14em;
  color: var(--t3); text-transform: uppercase;
}
.db-ind-value {
  font-size: 22px; font-weight: 900; color: #FFFFFF;
  letter-spacing: -0.04em; line-height: 1;
  font-variant-numeric: tabular-nums;
}
.db-ind-micro { font-size: 10px; color: var(--t2); line-height: 1.4; }
.db-ind-pct   { font-size: 10px; color: var(--t3); font-variant-numeric: tabular-nums; }

/* ── Bullets (04) ──────────────────────────────────────────────────────────── */
.db-bullets-block {
  padding: 0 20px 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.db-bullets-title {
  font-size: 9px; font-weight: 800; letter-spacing: .18em;
  color: var(--t3); text-transform: uppercase; margin-bottom: 2px;
}
.db-bullet-item { display: flex; align-items: flex-start; gap: 8px; }
.db-bullet-dot  { color: #1DB954; font-size: 16px; line-height: 1.3; flex-shrink: 0; }
.db-bullet-text {
  font-size: 14px; color: var(--t1); line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}

/* ── Alerta block (05) ─────────────────────────────────────────────────────── */
.db-alerta-block {
  margin: 0 20px 16px;
  background: #1a1200; border: 1px solid rgba(240,180,41,.4);
  border-radius: 10px; padding: 16px;
  display: flex; align-items: flex-start; gap: 10px;
}
.db-alerta-icon { font-size: 16px; color: #F0B429; flex-shrink: 0; line-height: 1.3; }
.db-alerta-text { font-size: 13px; color: var(--t2); line-height: 1.6; margin: 0; }

/* ── Rodapé do card (06) ───────────────────────────────────────────────────── */
.db-rc-footer-divider { height: 1px; background: #222; }
.db-rc-footer-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; gap: 12px;
}
.db-rc-footer-note { font-size: 11px; color: var(--t3); line-height: 1.4; flex: 1; }
.db-copy-btn {
  background: transparent; border: 1px solid #333; color: #999;
  border-radius: 6px; padding: 6px 12px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  font-family: inherit; white-space: nowrap; flex-shrink: 0;
  transition: border-color .12s, color .12s;
}
.db-copy-btn:hover { border-color: #555; color: #CCC; }
.db-copy-btn-done { border-color: rgba(29,185,84,.4) !important; color: #1DB954 !important; }

/* ── Mobile (< 480px) ──────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .db-status-badge { margin: 14px 16px 0; padding: 14px 16px; }
  .db-status-text  { font-size: 18px; }
  .db-frase        { margin: 12px 16px 0; font-size: 15px; }
  .db-ind-grid     { padding: 12px 16px; gap: 6px; }
  .db-ind-card     { padding: 12px; }
  .db-ind-label    { font-size: 10px; }
  .db-ind-value    { font-size: 18px; }
  .db-bullets-block { padding: 0 16px 12px; }
  .db-bullet-text  { font-size: 13px; }
  .db-alerta-block { margin: 0 16px 12px; padding: 12px; }
  .db-alerta-text  { font-size: 13px; }
  .db-rc-footer-row { flex-direction: column; align-items: stretch; gap: 8px; padding: 12px 16px; }
  .db-copy-btn     { width: 100%; text-align: center; padding: 10px 12px; }
}

/* ── H2H block ─────────────────────────────────────────────────────────────── */
.db-h2h {
  background: rgba(255,255,255,.025); border: 1px solid var(--border);
  border-radius: 10px; padding: 12px 14px;
  display: flex; flex-direction: column; gap: 10px;
  animation: ap-fade-up .2s ease both;
}
.db-h2h-title {
  font-size: 9px; font-weight: 800; letter-spacing: .1em; color: var(--t2); text-transform: uppercase;
}
.db-h2h-row {
  display: flex; gap: 0;
}
.db-h2h-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
}
.db-h2h-val {
  font-size: 18px; font-weight: 800; color: var(--t1); letter-spacing: -0.02em;
}
.db-h2h-lbl {
  font-size: 9px; font-weight: 700; color: var(--t2); letter-spacing: .04em;
}

/* ── Forma dots on game cards ──────────────────────────────────────────────── */
.jg-forma-row {
  display: flex; align-items: center; gap: 6px; padding: 4px 0 2px;
}
.jg-forma-side { display: flex; gap: 3px; flex: 1; }
.jg-forma-side-r { justify-content: flex-end; }
.jg-forma-mid { width: 16px; flex-shrink: 0; }
.jg-forma-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
}

/* ── Inline market cards (P4) ──────────────────────────────────────────────── */
.fl-market-list {
  display: flex; flex-direction: column; gap: 6px;
}
.fl-mcard {
  border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
  background: rgba(255,255,255,.02);
  transition: border-color .15s;
}
.fl-mcard-open {
  border-color: rgba(34,197,94,.35);
}
.fl-mcard-hdr {
  display: flex; align-items: center; gap: 10px; padding: 12px 14px;
  background: none; border: none; cursor: pointer; width: 100%;
  font-family: inherit; text-align: left;
  transition: background .12s;
}
.fl-mcard-hdr:hover { background: rgba(255,255,255,.03); }
.fl-mcard-name {
  flex: 1; font-size: 13px; font-weight: 700; color: var(--t1);
}
.fl-mcard-ref {
  font-size: 11px; color: var(--t2); font-weight: 600;
}
.fl-mcard-chev {
  color: var(--t3); flex-shrink: 0; transition: transform .15s;
}
.fl-mcard-body {
  display: flex; flex-direction: column; gap: 8px;
  padding: 10px 12px 12px; border-top: 1px solid var(--border);
}
.fl-mcard-fields {
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px;
}
.fl-mcard-field-wrap { display: flex; flex-direction: column; gap: 4px; }
.fl-mcard-odd-lbl {
  font-size: 10px; font-weight: 700; color: var(--t2); letter-spacing: .05em; white-space: nowrap; text-transform: uppercase;
}
.fl-mcard-odd-input {
  background: rgba(255,255,255,.05); border: 1px solid rgba(34,197,94,.3);
  border-radius: 7px; color: var(--t1); font-family: inherit;
  font-size: 16px; font-weight: 800; letter-spacing: -0.02em;
  padding: 8px 10px; outline: none; min-width: 0; width: 100%;
}
.fl-mcard-odd-input:focus { border-color: rgba(34,197,94,.6); }
.fl-mcard-banca-hint {
  font-size: 10.5px; font-weight: 600; color: var(--green);
  letter-spacing: .02em;
}
.fl-mcard-banca-setup { color: var(--t3); }
.fl-mcard-confirm {
  background: #15803d; color: #dcfce7;
  font-size: 11px; font-weight: 900; letter-spacing: .06em;
  padding: 11px 16px; border-radius: 7px; border: none; cursor: pointer;
  font-family: inherit; width: 100%;
  transition: background .13s;
}
.fl-mcard-confirm:hover { background: #166534; }

/* ═══════════════════════════════════════════════════════════════════════════
   LOCKED STATE — lk-* components
   Card premium exibido quando o usuário não tem token válido.
   SEGURANÇA: a análise real NUNCA foi gerada — API retornou apenas sinais
   parciais sem chamar Anthropic. Score/chance/AI nunca chegam ao DOM.
   ═══════════════════════════════════════════════════════════════════════════ */

@keyframes lk-glow {
  0%, 100% { box-shadow: 0 0 32px rgba(34,197,94,.06), 0 0 0 1px rgba(34,197,94,.1) inset; }
  50%       { box-shadow: 0 0 56px rgba(34,197,94,.12), 0 0 0 1px rgba(34,197,94,.18) inset; }
}

.lk-wrap {
  display: flex; flex-direction: column; gap: 12px;
  animation: db-in .25s ease both;
}

.lk-preview-card {
  position: relative;
  background: var(--panel); border: 1px solid rgba(34,197,94,.14);
  border-radius: 14px; overflow: hidden;
  animation: lk-glow 3.2s ease-in-out infinite;
}

/* Blurred header */
.lk-header {
  padding: 16px 20px 14px;
  display: flex; flex-direction: column; gap: 8px;
}
.lk-header-event {
  font-size: 18px; font-weight: 800;
  color: rgba(255,255,255,.1); letter-spacing: -0.03em;
  filter: blur(4px); user-select: none; pointer-events: none;
}
.lk-header-meta { display: flex; align-items: center; gap: 7px; }
.lk-badge-blur, .lk-odd-blur {
  font-size: 10px; color: rgba(255,255,255,.08);
  filter: blur(3px); user-select: none; pointer-events: none;
  padding: 3px 8px; border-radius: 4px;
  background: rgba(255,255,255,.03);
}

.lk-divider { height: 1px; background: var(--border); }

/* Section label */
.lk-section-label {
  display: block;
  font-size: 8px; font-weight: 800; letter-spacing: .18em;
  color: var(--t3); text-transform: uppercase; margin-bottom: 8px;
}

/* Blurred score */
.lk-risk-row {
  padding: 16px 20px 10px;
  display: flex; align-items: flex-start; justify-content: space-between;
}
.lk-score-blur {
  font-size: 60px; font-weight: 900; line-height: 1;
  letter-spacing: -0.06em; font-variant-numeric: tabular-nums;
  color: rgba(255,255,255,.1); filter: blur(6px);
  user-select: none; pointer-events: none;
}
.lk-score-denom {
  font-size: 22px; font-weight: 600; color: rgba(255,255,255,.06); letter-spacing: 0;
}
.lk-level-blur {
  font-size: 10px; font-weight: 800; letter-spacing: .12em;
  color: rgba(255,255,255,.1); filter: blur(4px);
  user-select: none; pointer-events: none; margin-top: 4px;
}

/* Fake progress bar */
.lk-bar-wrap { padding: 0 20px 14px; }
.lk-bar-track {
  height: 8px; border-radius: 99px;
  background: rgba(255,255,255,.04); overflow: hidden;
}
.lk-bar-fill {
  width: 58%; height: 100%; border-radius: 99px;
  background: rgba(255,255,255,.07); filter: blur(2px);
}

/* Signals — único conteúdo real visível */
.lk-signals {
  padding: 14px 20px 18px;
  display: flex; flex-direction: column; gap: 10px;
}
.lk-signal {
  display: flex; align-items: flex-start; gap: 9px;
  font-size: 12.5px; color: var(--t2); line-height: 1.6;
}
.lk-signal-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: rgba(34,197,94,.55); flex-shrink: 0; margin-top: 5px;
}

/* Blurred AI */
.lk-ai-row {
  padding: 12px 20px 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.lk-ai-blur {
  display: flex; align-items: center; gap: 8px;
  font-size: 18px; font-weight: 800;
  color: rgba(255,255,255,.08); filter: blur(5px);
  user-select: none; pointer-events: none;
}
.lk-ai-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: rgba(34,197,94,.25); flex-shrink: 0;
}
.lk-ai-text-blur {
  font-size: 12px; color: rgba(255,255,255,.05);
  filter: blur(4px); user-select: none; pointer-events: none;
}

/* Lock overlay — gradient + CTA */
.lk-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(6,6,8,0)    0%,
    rgba(6,6,8,.55) 22%,
    rgba(6,6,8,.95) 52%,
    rgba(6,6,8,.99) 100%
  );
  display: flex; flex-direction: column;
  align-items: center; justify-content: flex-end;
  padding: 20px 24px 28px; gap: 9px; text-align: center;
}
.lk-lock-icon { color: rgba(34,197,94,.65); margin-bottom: 4px; }
.lk-lock-title {
  font-size: 15px; font-weight: 800; color: var(--t1); letter-spacing: -0.02em;
}
.lk-lock-sub {
  font-size: 11.5px; color: var(--t2); line-height: 1.55; max-width: 300px;
}
.lk-cta-btn {
  display: flex; align-items: center; justify-content: center;
  background: #16a34a; color: #dcfce7;
  font-size: 12px; font-weight: 900; letter-spacing: .07em;
  padding: 14px 32px; border-radius: 9px;
  text-decoration: none; margin-top: 4px; width: 100%;
  box-shadow: 0 4px 22px rgba(22,163,74,.4), 0 1px 3px rgba(0,0,0,.4);
  transition: background .15s, transform .12s;
}
.lk-cta-btn:hover { background: #15803d; transform: translateY(-1px); }
.lk-cta-btn:active { transform: translateY(0); }
.lk-price-note {
  font-size: 10px; color: rgba(255,255,255,.3); letter-spacing: .03em;
}

.lk-back {
  display: block; text-align: center;
  font-size: 10.5px; font-weight: 700; color: var(--t3);
  background: none; border: none; cursor: pointer; font-family: inherit;
  padding: 4px 0; transition: color .13s;
}
.lk-back:hover { color: var(--t2); }

@media (max-width: 640px) {
  .lk-overlay { padding: 18px 18px 24px; gap: 8px; }
  .lk-lock-title { font-size: 14px; }
  .lk-lock-sub { font-size: 11px; }
  .lk-score-blur { font-size: 48px; }
}

/* ─ Controle de Banca ──────────────────────────────────────────────────────── */

/* Setup */
.bk-setup-panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 24px 22px; margin-bottom: 16px;
  display: flex; flex-direction: column; gap: 12px;
}
.bk-setup-title { font-size: 13px; font-weight: 800; color: var(--t1); }
.bk-setup-sub   { font-size: 11.5px; color: var(--t2); line-height: 1.5; }
.bk-setup-row   { display: flex; flex-direction: column; gap: 8px; }
.bk-setup-input-wrap { display: flex; align-items: center; gap: 8px; }
.bk-currency    { font-size: 13px; font-weight: 700; color: var(--t2); flex-shrink: 0; }
.bk-setup-input { flex: 1; min-width: 0; }
.bk-setup-btn {
  background: #16a34a; color: #dcfce7;
  font-size: 11.5px; font-weight: 800; letter-spacing: .05em;
  width: 100%;
  border: none; border-radius: 8px; padding: 10px 18px;
  cursor: pointer; font-family: inherit; white-space: nowrap;
  transition: background .15s;
}
.bk-setup-btn:hover { background: #15803d; }

/* Alerts */
.bk-alerts { display: flex; flex-direction: column; gap: 7px; margin-bottom: 14px; }
.bk-alert {
  display: flex; align-items: flex-start; gap: 8px;
  border-radius: 8px; padding: 10px 13px; font-size: 11.5px; line-height: 1.5;
  border: 1px solid transparent;
}
.bk-alert-danger { background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.2); color: #fca5a5; }
.bk-alert-warn   { background: rgba(245,158,11,.08); border-color: rgba(245,158,11,.18); color: #fcd34d; }
.bk-alert-icon   { font-size: 13px; flex-shrink: 0; margin-top: 1px; }

/* Dashboard cards */
.bk-cards {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;
  margin-bottom: 14px;
}
.bk-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 14px 12px;
  display: flex; flex-direction: column; gap: 4px;
}
.bk-card-label { font-size: 9px; font-weight: 800; letter-spacing: .1em; color: var(--t2); }
.bk-card-val   { font-size: 18px; font-weight: 900; line-height: 1.1; }
.bk-card-sub   { font-size: 10px; color: var(--t2); }
.bk-reset-link { cursor: pointer; color: var(--t3); transition: color .12s; }
.bk-reset-link:hover { color: var(--t2); }

/* Actions row */
.bk-actions { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.bk-add-btn {
  background: #16a34a; color: #dcfce7;
  font-size: 11.5px; font-weight: 800; letter-spacing: .05em;
  border: none; border-radius: 8px; padding: 10px 20px;
  cursor: pointer; font-family: inherit;
  transition: background .15s, transform .12s;
}
.bk-add-btn:hover { background: #15803d; transform: translateY(-1px); }
.bk-clear-btn {
  background: transparent; border: 1px solid var(--border);
  color: var(--t2); font-size: 11px; font-weight: 700; letter-spacing: .04em;
  border-radius: 7px; padding: 9px 14px; cursor: pointer; font-family: inherit;
  transition: border-color .13s, color .13s;
}
.bk-clear-btn:hover { border-color: rgba(239,68,68,.3); color: #fca5a5; }
.bk-clear-confirm { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: var(--t2); }
.bk-clear-yes {
  background: rgba(239,68,68,.15); color: #fca5a5; border: 1px solid rgba(239,68,68,.25);
  font-size: 11px; font-weight: 700; border-radius: 6px;
  padding: 6px 12px; cursor: pointer; font-family: inherit;
}
.bk-clear-no {
  background: transparent; color: var(--t2); border: 1px solid var(--border);
  font-size: 11px; font-weight: 700; border-radius: 6px;
  padding: 6px 12px; cursor: pointer; font-family: inherit;
}

/* Form */
.bk-form {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 18px; margin-bottom: 14px;
  display: flex; flex-direction: column; gap: 12px;
  animation: ap-fade-up .18s ease both;
}
.bk-form-row   { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; }
.bk-form-field { display: flex; flex-direction: column; gap: 5px; }
.bk-submit-btn {
  background: #16a34a; color: #dcfce7;
  font-size: 12px; font-weight: 900; letter-spacing: .07em;
  border: none; border-radius: 9px; padding: 13px;
  cursor: pointer; font-family: inherit;
  transition: background .15s; margin-top: 2px;
}
.bk-submit-btn:hover:not(:disabled) { background: #15803d; }
.bk-submit-btn:disabled { opacity: .45; cursor: not-allowed; }
.bk-form-intro {
  font-size: 11.5px; color: var(--t2); margin: 0 0 4px; line-height: 1.5;
}
.bk-form-more {
  background: none; border: none; cursor: pointer; font-family: inherit;
  font-size: 11px; font-weight: 700; color: var(--t3); letter-spacing: .04em;
  padding: 2px 0; text-align: left; transition: color .12s;
}
.bk-form-more:hover { color: var(--t2); }
.bk-empty-state {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 32px 22px;
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; text-align: center; margin-bottom: 14px;
}
.bk-empty-icon  { font-size: 28px; }
.bk-empty-title { font-size: 13px; font-weight: 800; color: var(--t1); }
.bk-empty-sub   { font-size: 11.5px; color: var(--t2); line-height: 1.5; max-width: 260px; }

/* History table */
.bk-hist { margin-bottom: 18px; }
.bk-hist-hdr {
  display: grid; grid-template-columns: 56px 1fr 60px 80px 100px 28px;
  gap: 8px; padding: 6px 8px;
  font-size: 9px; font-weight: 800; letter-spacing: .1em; color: var(--t2);
  border-bottom: 1px solid var(--border);
}
.bk-hist-row {
  display: grid; grid-template-columns: 56px 1fr 60px 80px 100px 28px;
  gap: 8px; padding: 9px 8px;
  font-size: 11.5px; color: var(--t1);
  border-bottom: 1px solid rgba(255,255,255,.04);
  align-items: center;
  transition: background .1s;
}
.bk-hist-row:hover { background: rgba(255,255,255,.02); border-radius: 6px; }
.bk-hist-date    { color: var(--t2); font-size: 10.5px; }
.bk-hist-mercado { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }
.bk-hist-odd     { font-weight: 700; }
.bk-hist-valor   { }
.bk-hist-res     { font-weight: 800; font-size: 11.5px; }
.bk-hist-del {
  background: none; border: none; color: var(--t3);
  cursor: pointer; font-size: 15px; line-height: 1;
  padding: 2px 4px; border-radius: 4px;
  transition: color .12s, background .12s;
}
.bk-hist-del:hover { color: #fca5a5; background: rgba(239,68,68,.1); }

/* Blurred stats (paywall preview) */
.bk-stats-blur-row {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; padding: 12px 0 36px;
}
.bk-stat-blur-card {
  background: rgba(255,255,255,.03); border-radius: 8px;
  padding: 12px 10px; display: flex; flex-direction: column; gap: 5px;
  user-select: none; pointer-events: none;
}
.bk-stat-blur-val   { font-size: 20px; font-weight: 900; filter: blur(7px); color: var(--t2); }
.bk-stat-blur-label { font-size: 9px; font-weight: 800; letter-spacing: .1em; color: var(--t3); }

/* Educational */
.bk-edu {
  display: flex; flex-direction: column; gap: 7px;
  background: rgba(255,255,255,.02); border: 1px solid var(--border);
  border-radius: 9px; padding: 14px 16px; margin-bottom: 12px;
}
.bk-edu p { font-size: 11px; color: var(--t2); line-height: 1.6; }

@media (max-width: 640px) {
  .bk-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bk-hist-hdr,
  .bk-hist-row { grid-template-columns: 48px 1fr 52px 70px 28px; }
  .bk-hist-mercado { display: none; }
  .bk-stats-blur-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bk-form-row { grid-template-columns: minmax(0, 1fr); }
}

/* ─ Locked card entrance animation ─────────────────────────────────────────── */
@keyframes lk-reveal {
  from { opacity: 0; filter: blur(8px); transform: translateY(6px); }
  to   { opacity: 1; filter: blur(0px); transform: translateY(0); }
}
.lk-wrap {
  animation: lk-reveal .8s cubic-bezier(.4,0,.2,1) both;
}

/* ─ Mobile bottom tab bar ───────────────────────────────────────────────────── */
.ap-tab-bar { display: none; }

@media (max-width: 640px) {
  /* Show tab bar */
  .ap-tab-bar {
    display: flex;
    position: fixed; bottom: 0; left: 0; right: 0;
    background: var(--bg2);
    border-top: 1px solid var(--border);
    padding-bottom: max(env(safe-area-inset-bottom), 8px);
    z-index: 45;
    /* keep above main content, below sidebar overlay */
  }

  .ap-tab-item {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 3px; padding: 9px 4px 4px;
    background: none; border: none;
    cursor: pointer; font-family: inherit;
    color: var(--t2); transition: color .12s;
    -webkit-tap-highlight-color: transparent;
  }
  .ap-tab-item:active { background: rgba(255,255,255,.03); }
  .ap-tab-label {
    font-size: 9px; font-weight: 700; letter-spacing: .05em;
    line-height: 1;
  }
  .ap-tab-active { color: var(--green); }

  /* Push main content up above tab bar (~60px bar + safe area) */
  .ap-main {
    padding-bottom: calc(60px + max(env(safe-area-inset-bottom), 8px));
  }

  /* Sidebar bottom safe area (home indicator below last nav item) */
  .ap-sidebar {
    padding-bottom: max(env(safe-area-inset-bottom), 16px);
  }
}
`;export{gr as default};
