import{r as b,j as a}from"./vendor-BnG4zNoI.js";import{L as K,H as Q,F as Z}from"./index-hrj7e3xR.js";import{a as aa,L as T}from"./landing-Cm1PcQNd.js";const ea={Bet365:.055,Betano:.06,Sportingbet:.062,KTO:.058,Betfair:.025,Superbet:.06,Pixbet:.07,Novibet:.065,Betnacional:.068,EstrelaBet:.07,"F12.bet":.065,"Mc Games":.068,Parimatch:.06,Bwin:.06,"1xBet":.058};function M(n){return ea[n]??.062}function _(n){return 1/n}function k(n,r){const e=_(n),o=M(r);return e/(1+o)}function na(n){return M(n)}function C(n,r,e){const o=k(n,e);return r*(o*(n-1)-(1-o))}function sa(n,r,e){const o=k(n,e),l=C(n,r,e),i=r*(n-1),c=-r;return Math.sqrt(o*Math.pow(i-l,2)+(1-o)*Math.pow(c-l,2))}function q(n,r,e,o,l){const i=C(n,r,e),c=o/7*l;return i*c}function ra(n,r){const e=k(n,r),o=n-1,l=(e*o-(1-e))/o;return Math.max(0,l)}function oa(n,r,e){const o=k(n,e),l=1-o;return o>=l?.02:Math.min(.97,Math.pow(l/o,20))}function ta(n,r,e,o,l){const i=C(n,r,e),c=M(e),f=o==="tentando_recuperar"||o==="frustrado",x=l>=20,m=n>=3,u=c>=.09;return f||x&&i<0||m||u||i<-r*.1?"VERMELHO":i<0?"AMARELO":"VERDE"}function ia(n,r,e,o){const l=C(n,r,e),i=sa(n,r,e),c=o/7;return Array.from({length:31},(f,x)=>{const m=c*x,u=m*l,A=Math.sqrt(Math.max(m,.001))*i;return{day:x,expected:u,optimistic:u+1.28*A,pessimistic:u-1.28*A}})}function la(n,r,e,o,l){const i=parseFloat(String(n).replace(",",".")),c=parseFloat(String(r).replace(",","."))||0,f=Number(o)||1;return{probImplicita:(_(i)*100).toFixed(1),probReal:(k(i,e)*100).toFixed(1),margem:(na(e)*100).toFixed(1),evReais:C(i,c,e).toFixed(2),resultado30d:q(i,c,e,f,30).toFixed(0),resultado90d:q(i,c,e,f,90).toFixed(0),kelly:(ra(i,e)*100).toFixed(1),riscoRuina:(oa(i,c,e)*100).toFixed(0),semaforo:ta(i,c,e,l,f),simData:ia(i,c,e,f)}}const ca="motoria_access_v1",da=["Futebol","Basquete","Tênis","MMA","eSports","Outro"],pa=["Resultado final","Over / Under","Ambas marcam (BTTS)","Handicap asiático","Handicap europeu","Escanteios","Cartões","Primeiro gol","Múltipla","Chance dupla","Draw No Bet","Outro"],ma=["Bet365","Betano","Sportingbet","KTO","Betfair","Superbet","Pixbet","Novibet","Betnacional","EstrelaBet","F12.bet","Parimatch","Bwin","1xBet","Outra"],xa=["Prefiro não informar","Até R$2.000","R$2.001–R$4.000","R$4.001–R$8.000","R$8.001–R$15.000","Acima de R$15.000"],ua=[{key:"calmo",label:"Calmo",icon:"😌"},{key:"empolgado",label:"Empolgado",icon:"🔥"},{key:"frustrado",label:"Frustrado",icon:"😤"},{key:"tentando_recuperar",label:"Tentando recuperar perdas",icon:"💸"}],V=["Calculando margem da casa...","Estimando probabilidade real...","Projetando 30 e 90 dias...","Analisando fatores de risco...","Comparando com 12 mil apostas similares...","Preparando seu relatório..."];function H(){return localStorage.getItem(ca)==="1"}function G(n,r){const e=n.match(new RegExp(`^${r}:\\s*(.+)`,"m"));return e?e[1].trim():null}function F(n,r){const e=n.match(new RegExp(`^${r}:[^\\n]*\\n([\\s\\S]*?)(?=\\n[A-Z_]{3,}:|$)`,"m"));return e?e[1].trim():G(n,r)}function ha(n){return{nivelRisco:G(n,"NIVEL_RISCO"),cenarioNecessario:F(n,"CENARIO_NECESSARIO"),oQuePodeDarErrado:F(n,"O_QUE_PODE_DAR_ERRADO"),leituraConservadora:F(n,"LEITURA_CONSERVADORA"),alertaComport:F(n,"ALERTA_COMPORTAMENTAL"),alertaFinal:F(n,"ALERTA_FINAL")}}function ba(n){return n==="VERMELHO"?"#FF4D2E":n==="AMARELO"?"#FFB020":"#1FCB7A"}function ga(n){return n==="VERMELHO"?"RISCO ALTO":n==="AMARELO"?"RISCO MODERADO":"RISCO BAIXO"}function fa(n,r,e){return n==="VERMELHO"?`A casa tem ~${(100-Number(r)).toFixed(0)}% de chance de ficar com seu dinheiro nessa aposta.`:n==="AMARELO"?"Essa aposta tem viés desfavorável. Avalie bem antes de avançar.":"Matematicamente, essa odd tem melhor equilíbrio. Mas risco sempre existe."}function va({data:n,valor:r}){const x=n.flatMap(h=>[h.expected,h.optimistic,h.pessimistic]),m=Math.min(0,...x),u=Math.max(0,...x),A=u-m||1,N=h=>36+h/30*248,v=h=>144-(h-m)/A*128,d=(h,g)=>g.map((w,O)=>`${O===0?"M":"L"} ${N(w.day).toFixed(1)} ${v(w[h]).toFixed(1)}`).join(" "),S=v(0),t=n[30]?.expected??0;return a.jsxs("svg",{viewBox:"0 0 320 160",style:{width:"100%",height:"auto",display:"block"},children:[a.jsx("line",{x1:36,y1:S,x2:284,y2:S,stroke:"#2a2a2b",strokeDasharray:"4 3"}),a.jsx("path",{d:d("pessimistic",n),fill:"none",stroke:"#FF4D2E",strokeWidth:"1.5",strokeDasharray:"6 3",opacity:"0.5"}),a.jsx("path",{d:d("expected",n),fill:"none",stroke:"#F2F2F0",strokeWidth:"2"}),a.jsx("path",{d:d("optimistic",n),fill:"none",stroke:"#1FCB7A",strokeWidth:"1.5",strokeDasharray:"6 3",opacity:"0.5"}),a.jsx("circle",{cx:N(30),cy:v(t),r:"4",fill:t>=0?"#1FCB7A":"#FF4D2E"}),a.jsx("text",{x:36,y:158,fontSize:"9",fill:"#444",fontFamily:"Inter,sans-serif",children:"Dia 0"}),a.jsx("text",{x:284,y:158,fontSize:"9",fill:"#444",fontFamily:"Inter,sans-serif",textAnchor:"end",children:"Dia 30"}),a.jsx("text",{x:34,y:20,fontSize:"9",fill:"#444",fontFamily:"Inter,sans-serif",textAnchor:"end",children:u>=0?`+R$${Math.abs(Math.round(u))}`:`-R$${Math.abs(Math.round(u))}`}),a.jsx("text",{x:34,y:148,fontSize:"9",fill:"#444",fontFamily:"Inter,sans-serif",textAnchor:"end",children:`-R$${Math.abs(Math.round(m))}`})]})}function y({label:n,value:r,sub:e,highlight:o}){return a.jsxs("div",{className:"an-ind",style:o?{borderColor:o+"40",background:o+"08"}:{},children:[a.jsx("div",{className:"an-ind-label",children:n}),a.jsx("div",{className:"an-ind-value",style:o?{color:o}:{},children:r}),e&&a.jsx("div",{className:"an-ind-sub",children:e})]})}function Ea(){aa();const[n,r]=b.useState(1),[e,o]=b.useState(null),[l,i]=b.useState(!1),[c,f]=b.useState(0),[x,m]=b.useState(""),[u,A]=b.useState(!1),[N,v]=b.useState(null),[d,S]=b.useState({jogo:"",esporte:"Futebol",tipoAposta:"Resultado final",casa:"Bet365"}),[t,h]=b.useState({odd:"",valor:"",frequencia:5}),[g,w]=b.useState({renda:"Prefiro não informar",gasto30d:"",sentimento:"calmo"}),O=b.useRef(null),I=b.useRef(null);function $(s){return p=>S(j=>({...j,[s]:p.target.value}))}function P(s){return p=>h(j=>({...j,[s]:p.target.value}))}function D(s,p){w(j=>({...j,[s]:p}))}function z(){if(m(""),n===1){if(!d.jogo.trim()){m("Informe o jogo ou evento.");return}r(2)}else if(n===2){const s=parseFloat(t.odd.replace(",","."));if(!t.odd||isNaN(s)||s<=1){m("Informe uma odd válida (maior que 1, ex: 1.80).");return}r(3)}}function U(){let s=0;I.current=setInterval(()=>{s=(s+1)%V.length,f(s)},1600)}function W(){clearInterval(I.current)}async function X(){if(m(""),v(null),!H()){A(!0);return}const s=parseFloat(t.odd.replace(",",".")),p=la(s,t.valor||0,d.casa,t.frequencia,g.sentimento),j=[`Jogo: ${d.jogo}`,`Esporte: ${d.esporte}`,`Tipo de aposta: ${d.tipoAposta}`,`Casa de apostas: ${d.casa}`,`Odd: ${t.odd}`,`Probabilidade implícita: ${p.probImplicita}%`,`Probabilidade real estimada: ${p.probReal}%`,`Margem da casa: ${p.margem}%`,`Valor considerado: ${t.valor?"R$"+t.valor:"não informado"}`,`Frequência: ${t.frequencia}x por semana`,`Sentimento: ${g.sentimento}`,g.gasto30d?`Gasto últimos 30 dias: R$${g.gasto30d}`:""].filter(Boolean).join(`
`);i(!0),U();try{const E=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tool:"analyze",userMessage:j})}),L=await E.json();if(!E.ok)throw new Error(L.error||"Erro ao processar. Tente novamente.");const J=ha(L.content?.[0]?.text||"");o({math:p,ai:J}),setTimeout(()=>{O.current?.scrollIntoView({behavior:"smooth",block:"start"})},300)}catch(E){m(E.message||"Erro de conexão. Verifique sua internet e tente novamente.")}finally{i(!1),W()}}function Y(){o(null),r(1),v(null),m("")}const R=e?ba(e.math.semaforo):"#FFB020",B=(e?.ai.oQuePodeDarErrado||"").split(`
`).filter(s=>s.trim()).map(s=>s.replace(/^[-•*]\s*/,""));return e&&t.valor&&(parseFloat(e.math.kelly)/100*parseFloat(t.valor)/parseFloat(e.math.kelly)*100).toFixed(0),a.jsxs(a.Fragment,{children:[a.jsx("style",{children:ja}),a.jsx(K,{}),a.jsx(Q,{}),u&&a.jsx("div",{className:"an-paywall-overlay",children:a.jsxs("div",{className:"an-paywall-box",children:[a.jsx("div",{className:"an-pw-icon",children:"🔒"}),a.jsx("h2",{className:"an-pw-title",children:"Acesso necessário"}),a.jsx("p",{className:"an-pw-sub",children:"Desbloqueie análises de risco completas por R$27. Pagamento único, sem mensalidade."}),a.jsx(T,{to:"/pagar",className:"an-pw-cta",children:"Garantir acesso vitalício →"}),a.jsx("button",{className:"an-pw-close",onClick:()=>A(!1),children:"Cancelar"})]})}),a.jsx("div",{className:"an-root",children:a.jsxs("div",{className:"an-wrap",children:[!e&&!l&&a.jsxs(a.Fragment,{children:[a.jsx("div",{className:"an-progress-wrap",children:a.jsx("div",{className:"an-step-nums",children:[{n:1,title:"Aposta"},{n:2,title:"Números"},{n:3,title:"Contexto"}].map(({n:s,title:p},j,E)=>a.jsxs("div",{className:"an-step-item",children:[a.jsx("div",{className:`an-step-dot${s<n?" an-step-done":s===n?" an-step-active":""}`,children:s<n?"✓":s}),a.jsx("span",{className:`an-step-title${s===n?" an-step-title-active":""}`,children:p}),j<E.length-1&&a.jsx("div",{className:`an-step-line${s<n?" an-step-line-done":""}`})]},s))})}),n===1&&a.jsxs("div",{className:"an-form",children:[a.jsx("h1",{className:"an-form-title",children:"Sobre a aposta"}),a.jsxs("div",{className:"an-field",children:[a.jsx("label",{className:"an-label",children:"Jogo ou evento"}),a.jsx("input",{className:"an-input",value:d.jogo,onChange:$("jogo"),placeholder:"Ex: Flamengo x Palmeiras, UFC 300..."})]}),a.jsxs("div",{className:"an-field",children:[a.jsx("label",{className:"an-label",children:"Esporte"}),a.jsx("select",{className:"an-input",value:d.esporte,onChange:$("esporte"),children:da.map(s=>a.jsx("option",{children:s},s))})]}),a.jsxs("div",{className:"an-field",children:[a.jsx("label",{className:"an-label",children:"Tipo de aposta"}),a.jsx("select",{className:"an-input",value:d.tipoAposta,onChange:$("tipoAposta"),children:pa.map(s=>a.jsx("option",{children:s},s))})]}),a.jsxs("div",{className:"an-field",children:[a.jsx("label",{className:"an-label",children:"Casa de apostas"}),a.jsx("select",{className:"an-input",value:d.casa,onChange:$("casa"),children:ma.map(s=>a.jsx("option",{children:s},s))})]}),x&&a.jsx("div",{className:"an-err",children:x}),a.jsx("button",{className:"an-next-btn",onClick:z,children:"Próxima etapa →"})]}),n===2&&a.jsxs("div",{className:"an-form",children:[a.jsx("h1",{className:"an-form-title",children:"Os números"}),a.jsxs("div",{className:"an-row",children:[a.jsxs("div",{className:"an-field",children:[a.jsx("label",{className:"an-label",children:"Odd"}),a.jsx("input",{className:"an-input",value:t.odd,onChange:P("odd"),placeholder:"Ex: 1.80",inputMode:"decimal"})]}),a.jsxs("div",{className:"an-field",children:[a.jsxs("label",{className:"an-label",children:["Valor a apostar ",a.jsx("span",{className:"an-opt",children:"(opcional)"})]}),a.jsx("input",{className:"an-input",value:t.valor,onChange:P("valor"),placeholder:"Ex: R$50",inputMode:"decimal"})]})]}),a.jsxs("div",{className:"an-field",children:[a.jsxs("label",{className:"an-label",children:["Frequência — apostas similares por semana:"," ",a.jsxs("strong",{className:"an-freq-num",children:[t.frequencia,"×"]}),a.jsxs("span",{className:"an-opt",children:[" (~",Math.round(t.frequencia*4.33),"/mês)"]})]}),a.jsx("input",{className:"an-slider",type:"range",min:"1",max:"30",value:t.frequencia,onChange:s=>h(p=>({...p,frequencia:Number(s.target.value)}))}),a.jsxs("div",{className:"an-slider-labels",children:[a.jsx("span",{children:"1×"}),a.jsx("span",{children:"30×"})]})]}),x&&a.jsx("div",{className:"an-err",children:x}),a.jsxs("div",{className:"an-btn-row",children:[a.jsx("button",{className:"an-back-btn",onClick:()=>r(1),children:"← Voltar"}),a.jsx("button",{className:"an-next-btn",onClick:z,children:"Próxima etapa →"})]})]}),n===3&&a.jsxs("div",{className:"an-form",children:[a.jsxs("h1",{className:"an-form-title",children:["Contexto pessoal ",a.jsx("span",{className:"an-opt",children:"(opcional)"})]}),a.jsxs("div",{className:"an-local-save",children:[a.jsx("span",{className:"an-local-save-icon",children:"🔒"}),a.jsxs("div",{children:[a.jsx("span",{className:"an-local-save-title",children:"Dados 100% locais"}),a.jsx("span",{className:"an-local-save-sub",children:"Nada é enviado ou salvo fora do seu dispositivo."})]})]}),(g.sentimento==="tentando_recuperar"||g.sentimento==="frustrado")&&a.jsxs("div",{className:"an-tilt-alert",children:[a.jsx("strong",{children:"⚠ Atenção: Sinal de tilt detectado."}),a.jsx("p",{children:"Apostadores tentando recuperar perdas ou frustrados perdem, em média, 3.2× mais. Considere pausar suas apostas antes de continuar."})]}),a.jsxs("div",{className:"an-field",children:[a.jsx("label",{className:"an-label",children:"Como você está se sentindo agora?"}),a.jsx("div",{className:"an-sentiment-grid",children:ua.map(s=>a.jsxs("button",{type:"button",className:`an-sent-btn${g.sentimento===s.key?" an-sent-on":""}`,onClick:()=>D("sentimento",s.key),children:[a.jsx("span",{children:s.icon}),a.jsx("span",{children:s.label})]},s.key))})]}),a.jsxs("div",{className:"an-row",children:[a.jsxs("div",{className:"an-field",children:[a.jsx("label",{className:"an-label",children:"Renda mensal aproximada"}),a.jsx("select",{className:"an-input",value:g.renda,onChange:s=>D("renda",s.target.value),children:xa.map(s=>a.jsx("option",{children:s},s))})]}),a.jsxs("div",{className:"an-field",children:[a.jsx("label",{className:"an-label",children:"Gasto em apostas nos últimos 30 dias"}),a.jsx("input",{className:"an-input",value:g.gasto30d,onChange:s=>D("gasto30d",s.target.value),placeholder:"Ex: R$300",inputMode:"decimal"})]})]}),x&&a.jsx("div",{className:"an-err",children:x}),a.jsxs("div",{className:"an-btn-row",children:[a.jsx("button",{className:"an-back-btn",onClick:()=>r(2),children:"← Voltar"}),a.jsx("button",{className:"an-submit-btn",onClick:X,children:"Gerar análise completa →"})]})]})]}),l&&a.jsxs("div",{className:"an-loading",children:[a.jsx("div",{className:"an-spinner"}),a.jsx("p",{className:"an-load-text",children:V[c]})]}),e&&!l&&a.jsxs("div",{className:"an-result",ref:O,children:[a.jsx("button",{className:"an-reset",onClick:Y,children:"← Nova análise"}),a.jsxs("div",{className:"an-semaforo",style:{borderColor:R+"33",background:R+"08"},children:[a.jsx("div",{className:"an-sem-dot",style:{background:R,boxShadow:`0 0 24px ${R}55`}}),a.jsxs("div",{children:[a.jsx("div",{className:"an-sem-label",style:{color:R},children:ga(e.math.semaforo)}),a.jsx("div",{className:"an-sem-phrase",children:fa(e.math.semaforo,e.math.probReal,d.casa)})]})]}),a.jsxs("div",{className:"an-ind-grid",children:[a.jsx(y,{label:"PROBABILIDADE IMPLÍCITA",value:`${e.math.probImplicita}%`,sub:"de chance segundo a odd"}),a.jsx(y,{label:"PROBABILIDADE REAL ESTIMADA",value:`${e.math.probReal}%`,sub:`ajustada pela margem da ${d.casa}`}),a.jsx(y,{label:"MARGEM DA CASA (VIG)",value:`${e.math.margem}%`,sub:"taxa invisível por aposta",highlight:parseFloat(e.math.margem)>=7?"#FF4D2E":"#FFB020"}),a.jsx(y,{label:"VALOR ESPERADO (EV)",value:`${parseFloat(e.math.evReais)>=0?"+":""}R$${e.math.evReais}`,sub:"por aposta no longo prazo",highlight:parseFloat(e.math.evReais)>=0?"#1FCB7A":"#FF4D2E"}),a.jsx(y,{label:"PROJEÇÃO 30 DIAS",value:`${parseFloat(e.math.resultado30d)>=0?"+":""}R$${e.math.resultado30d}`,sub:`apostando ${t.frequencia}×/sem`,highlight:parseFloat(e.math.resultado30d)>=0?"#1FCB7A":"#FF4D2E"}),a.jsx(y,{label:"PROJEÇÃO 90 DIAS",value:`${parseFloat(e.math.resultado90d)>=0?"+":""}R$${e.math.resultado90d}`,sub:"cenário esperado",highlight:parseFloat(e.math.resultado90d)>=0?"#1FCB7A":"#FF4D2E"}),a.jsx(y,{label:"KELLY CRITERION",value:parseFloat(e.math.kelly)===0?"0% — não apostar":`${e.math.kelly}% da banca`,sub:"fração racional sugerida",highlight:parseFloat(e.math.kelly)===0?"#FF4D2E":void 0}),a.jsx(y,{label:"RISCO DE RUÍNA (20 APOSTAS)",value:`${e.math.riscoRuina}%`,sub:"prob. de zerar essa série",highlight:parseFloat(e.math.riscoRuina)>=50?"#FF4D2E":"#FFB020"})]}),t.valor&&a.jsxs("div",{className:"an-card",children:[a.jsx("div",{className:"an-card-label",children:"SIMULAÇÃO — 30 DIAS"}),a.jsx(va,{data:e.math.simData,valor:parseFloat(t.valor)}),a.jsxs("div",{className:"an-chart-legend",children:[a.jsx("span",{className:"an-leg an-leg-exp",children:"— Cenário esperado"}),a.jsx("span",{className:"an-leg an-leg-opt",children:"-- Otimista (P90)"}),a.jsx("span",{className:"an-leg an-leg-pes",children:"-- Pessimista (P10)"})]}),a.jsxs("p",{className:"an-sim-note",children:["Apostando ",t.frequencia,"×/semana com R$",t.valor," por aposta, em 30 dias o resultado esperado é"," ",a.jsxs("strong",{style:{color:parseFloat(e.math.resultado30d)>=0?"#1FCB7A":"#FF4D2E"},children:[parseFloat(e.math.resultado30d)>=0?"+":"","R$",e.math.resultado30d]}),"."]})]}),a.jsxs("div",{className:"an-card an-card-amber",children:[a.jsx("div",{className:"an-card-label",children:"MARGEM DA CASA DECODIFICADA"}),a.jsxs("p",{className:"an-card-text",children:["A ",a.jsx("strong",{children:d.casa})," cobra uma margem de"," ",a.jsxs("strong",{children:[e.math.margem,"%"]})," nesse mercado. Isso significa que de cada"," ",a.jsx("strong",{children:"R$100 apostados"}),", R$",parseFloat(e.math.margem).toFixed(2)," vão para o lucro da casa ",a.jsx("em",{children:"antes"})," de qualquer resultado. Essa margem torna o EV negativo para a maioria das apostas no longo prazo."]})]}),e.ai.alertaComport&&e.ai.alertaComport.trim()&&a.jsxs("div",{className:"an-card an-card-red",children:[a.jsx("div",{className:"an-card-label",children:"⚠ ALERTA COMPORTAMENTAL"}),a.jsx("p",{className:"an-card-text",children:e.ai.alertaComport})]}),e.ai.cenarioNecessario&&a.jsxs("div",{className:"an-card",children:[a.jsx("div",{className:"an-card-label",children:"O QUE PRECISA ACONTECER PARA DAR CERTO"}),a.jsx("p",{className:"an-card-text",children:e.ai.cenarioNecessario})]}),B.length>0&&a.jsxs("div",{className:"an-card an-card-danger",children:[a.jsx("div",{className:"an-card-label",children:"O QUE PODE DAR ERRADO"}),a.jsx("ul",{className:"an-bullets",children:B.map((s,p)=>a.jsx("li",{className:"an-bullet",children:s},p))})]}),e.ai.leituraConservadora&&a.jsxs("div",{className:"an-card",children:[a.jsx("div",{className:"an-card-label",children:"LEITURA CONSERVADORA"}),a.jsx("p",{className:"an-card-text",children:e.ai.leituraConservadora})]}),a.jsxs("div",{className:"an-card an-card-decision",children:[a.jsx("div",{className:"an-card-label",children:"DECISÃO"}),N?a.jsxs("div",{className:`an-dec-confirm ${N==="evitou"?"an-dec-confirm-green":""}`,children:[N==="evitou"&&"✓ Registrado como aposta evitada. Boa decisão.",N==="reduziu"&&`✓ Registrado. Considere apostar no máximo ${e.math.kelly}% da sua banca nessa odd.`,N==="apostou"&&"Registrado no diário. Acompanhe o resultado depois."]}):a.jsxs("div",{className:"an-dec-btns",children:[a.jsx("button",{className:"an-dec-btn an-dec-avoid",onClick:()=>v("evitou"),children:"Não apostar — registrar como evitada ✓"}),t.valor&&parseFloat(e.math.kelly)>0&&a.jsxs("button",{className:"an-dec-btn an-dec-reduce",onClick:()=>v("reduziu"),children:["Reduzir valor (Kelly sugere ",e.math.kelly,"% da banca)"]}),a.jsx("button",{className:"an-dec-btn an-dec-proceed",onClick:()=>v("apostou"),children:"Apostar mesmo assim — registrar no diário"})]})]}),a.jsxs("div",{className:"an-card an-card-final",children:[a.jsx("div",{className:"an-card-label",children:"⚠ ALERTA FINAL"}),e.ai.alertaFinal&&a.jsx("p",{className:"an-card-text",style:{marginBottom:14},children:e.ai.alertaFinal}),a.jsx("blockquote",{className:"an-quote",children:'"Se você não aceita perder esse valor, a decisão mais segura é não apostar."'})]}),a.jsx("p",{className:"an-disclaimer",children:"Análise gerada por IA com base em cálculo matemático. Não é recomendação de aposta. Todo resultado esportivo é imprevisível. Jogue com responsabilidade."}),!H()&&a.jsxs("div",{className:"an-upgrade-banner",children:[a.jsx("p",{children:"Acesso necessário para análises completas."}),a.jsx(T,{to:"/pagar",className:"an-upgrade-cta",children:"Desbloquear por R$27 — acesso imediato →"})]})]})]})}),a.jsx(Z,{})]})}const ja=`
.an-root {
  min-height: 80vh;
  padding: 0 0 80px;
}
.an-wrap {
  max-width: 560px;
  margin: 0 auto;
  padding: 32px 20px;
}

/* Progress numerado */
.an-progress-wrap { margin-bottom: 32px; }

.an-step-nums {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
}
.an-step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
  flex: 1;
}
.an-step-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px; height: 30px;
  border-radius: 50%;
  font-size: 12px; font-weight: 800;
  color: #2e2e30;
  border: 1.5px solid #222;
  background: #0A0A0B;
  transition: all 0.25s;
  z-index: 1;
}
.an-step-active {
  color: var(--text);
  border-color: var(--text);
  background: rgba(242,242,240,0.07);
  box-shadow: 0 0 0 4px rgba(242,242,240,0.05);
}
.an-step-done {
  color: #1FCB7A;
  border-color: rgba(31,203,122,0.5);
  background: rgba(31,203,122,0.08);
  font-size: 11px;
}
.an-step-title {
  font-size: 10px;
  font-weight: 600;
  color: #2e2e30;
  letter-spacing: 0.03em;
  text-align: center;
  white-space: nowrap;
  transition: color 0.25s;
}
.an-step-title-active { color: var(--muted); }
.an-step-line {
  position: absolute;
  top: 15px;
  left: calc(50% + 18px);
  right: calc(-50% + 18px);
  height: 1px;
  background: #1a1a1b;
  transition: background 0.3s;
}
.an-step-line-done { background: rgba(31,203,122,0.3); }

/* Local save indicator */
.an-local-save {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(31,203,122,0.05);
  border: 1px solid rgba(31,203,122,0.18);
  border-radius: 10px;
  padding: 10px 14px;
  margin-top: -4px;
}
.an-local-save-icon { font-size: 15px; flex-shrink: 0; }
.an-local-save-title {
  font-size: 12px; font-weight: 700;
  color: #1FCB7A; display: block;
}
.an-local-save-sub {
  font-size: 11px; color: #555;
  display: block; line-height: 1.4; margin-top: 1px;
}

/* Form */
.an-form { display: flex; flex-direction: column; gap: 20px; }
.an-form-title {
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
}
.an-field { display: flex; flex-direction: column; gap: 8px; }
.an-label { font-size: 13px; font-weight: 600; color: #aaa; }
.an-opt { font-size: 11px; color: #555; font-weight: 400; }
.an-input {
  background: #111112;
  border: 1px solid #222;
  border-radius: 10px;
  color: var(--text);
  font-size: 15px;
  font-family: inherit;
  padding: 12px 14px;
  outline: none;
  transition: border-color 0.18s;
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
}
.an-input::placeholder { color: #333; }
.an-input:focus { border-color: #444; }

/* Slider */
.an-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: #222;
  border-radius: 99px;
  outline: none;
  cursor: pointer;
}
.an-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--text);
  cursor: pointer;
}
.an-slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #444;
}
.an-freq-num { color: var(--text); }

.an-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* Buttons */
.an-btn-row { display: flex; gap: 10px; }
.an-next-btn, .an-submit-btn {
  flex: 1;
  background: var(--text);
  color: var(--bg);
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  padding: 15px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.an-next-btn:hover, .an-submit-btn:hover { opacity: 0.88; }
.an-back-btn {
  background: none;
  border: 1px solid #222;
  border-radius: 10px;
  color: #555;
  font-size: 14px;
  font-family: inherit;
  padding: 15px 18px;
  cursor: pointer;
  transition: all 0.15s;
}
.an-back-btn:hover { border-color: #444; color: #aaa; }

/* Erro */
.an-err {
  background: rgba(255,77,46,0.08);
  border: 1px solid rgba(255,77,46,0.2);
  border-radius: 10px;
  color: #f87171;
  font-size: 14px;
  padding: 12px 14px;
}

/* Step 3 */
.an-step3-note { font-size: 13px; color: #444; margin-top: -8px; }
.an-tilt-alert {
  background: rgba(255,77,46,0.08);
  border: 1px solid rgba(255,77,46,0.25);
  border-radius: 12px;
  padding: 16px;
  animation: an-pulse 2s infinite;
}
@keyframes an-pulse { 0%,100%{opacity:1} 50%{opacity:0.85} }
.an-tilt-alert strong { color: var(--red); display: block; margin-bottom: 6px; }
.an-tilt-alert p { font-size: 14px; color: #bbb; line-height: 1.6; }

.an-sentiment-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.an-sent-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #111112;
  border: 1px solid #222;
  border-radius: 9px;
  color: #888;
  font-size: 14px;
  font-family: inherit;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}
.an-sent-btn:hover { border-color: #444; color: var(--text); }
.an-sent-on {
  border-color: var(--text);
  color: var(--text);
  background: rgba(242,242,240,0.06);
}

/* Loading */
.an-loading {
  text-align: center;
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.an-spinner {
  width: 44px; height: 44px;
  border: 2px solid #1E1E1F;
  border-top-color: var(--text);
  border-radius: 50%;
  animation: an-spin 0.8s linear infinite;
}
@keyframes an-spin { to { transform: rotate(360deg); } }
.an-load-text { font-size: 14px; color: var(--muted); }

/* Result */
.an-result { display: flex; flex-direction: column; gap: 12px; }
.an-reset {
  background: none; border: 1px solid #1E1E1F; border-radius: 8px;
  color: #444; font-size: 13px; font-family: inherit;
  padding: 9px 14px; cursor: pointer; align-self: flex-start;
  transition: all 0.15s; margin-bottom: 4px;
}
.an-reset:hover { border-color: #444; color: var(--muted); }

/* Semáforo */
.an-semaforo {
  display: flex; align-items: center; gap: 16px;
  border: 1px solid; border-radius: 14px; padding: 20px;
}
.an-sem-dot { width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0; }
.an-sem-label {
  font-family: 'Syne', sans-serif;
  font-size: 20px; font-weight: 800;
}
.an-sem-phrase { font-size: 14px; color: var(--muted); margin-top: 4px; line-height: 1.5; }

/* Indicadores */
.an-ind-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.an-ind {
  background: #111112;
  border: 1px solid #1E1E1F;
  border-radius: 12px;
  padding: 16px;
}
.an-ind-label {
  font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
  color: #444; margin-bottom: 10px; text-transform: uppercase;
}
.an-ind-value {
  font-family: 'Syne', sans-serif;
  font-size: 22px; font-weight: 800;
  color: var(--text); line-height: 1;
  margin-bottom: 6px;
}
.an-ind-sub { font-size: 11px; color: #555; }

/* Cards */
.an-card {
  background: #111112;
  border: 1px solid #1E1E1F;
  border-radius: 12px;
  padding: 18px;
}
.an-card-amber {
  border-color: rgba(255,176,32,0.2);
  background: rgba(255,176,32,0.04);
}
.an-card-red {
  border-color: rgba(255,77,46,0.25);
  background: rgba(255,77,46,0.05);
}
.an-card-danger {
  border-color: rgba(255,77,46,0.15);
  background: rgba(255,77,46,0.03);
}
.an-card-decision {
  border-color: rgba(242,242,240,0.1);
  background: rgba(242,242,240,0.03);
}
.an-card-final {
  border-color: rgba(255,176,32,0.2);
  background: rgba(255,176,32,0.04);
}
.an-card-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
  color: #444; margin-bottom: 14px; text-transform: uppercase;
}
.an-card-text {
  font-size: 14px; color: #bbb; line-height: 1.7; margin: 0;
}

/* Chart */
.an-chart-legend {
  display: flex; gap: 16px; flex-wrap: wrap;
  font-size: 11px; margin: 10px 0 6px;
}
.an-leg { display: flex; align-items: center; gap: 4px; }
.an-leg-exp { color: var(--text); }
.an-leg-opt { color: #1FCB7A; opacity: 0.7; }
.an-leg-pes { color: #FF4D2E; opacity: 0.7; }
.an-sim-note { font-size: 13px; color: #666; margin-top: 8px; }

/* Bullets */
.an-bullets { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.an-bullet {
  font-size: 14px; color: #bbb; padding-left: 20px;
  position: relative; line-height: 1.6;
}
.an-bullet::before {
  content: "—"; position: absolute; left: 0;
  color: var(--red); font-weight: 700;
}

/* Decisão */
.an-dec-btns { display: flex; flex-direction: column; gap: 10px; }
.an-dec-btn {
  background: #111112; border: 1px solid #1E1E1F;
  border-radius: 9px; color: #aaa; font-size: 14px;
  font-family: inherit; padding: 13px 16px; cursor: pointer;
  text-align: left; transition: all 0.15s;
}
.an-dec-avoid { border-color: rgba(31,203,122,0.25); color: #1FCB7A; }
.an-dec-avoid:hover { background: rgba(31,203,122,0.06); }
.an-dec-reduce:hover { background: rgba(255,176,32,0.06); color: #FFB020; border-color: rgba(255,176,32,0.25); }
.an-dec-proceed:hover { background: rgba(255,77,46,0.05); }
.an-dec-confirm {
  font-size: 14px; color: var(--muted); padding: 12px 0;
}
.an-dec-confirm-green { color: #1FCB7A; }

/* Quote */
.an-quote {
  font-size: 14px; font-style: italic; color: var(--amber);
  border-left: 2px solid rgba(255,176,32,0.3);
  padding: 10px 14px; margin: 0;
  border-radius: 0 6px 6px 0;
  background: rgba(255,176,32,0.04);
  line-height: 1.6;
}

/* Upgrade banner */
.an-upgrade-banner {
  background: #111112; border: 1px solid #1E1E1F;
  border-radius: 12px; padding: 20px; text-align: center;
}
.an-upgrade-banner p { font-size: 14px; color: var(--muted); margin-bottom: 14px; }
.an-upgrade-cta {
  display: inline-block; background: var(--text); color: var(--bg);
  font-size: 14px; font-weight: 700; padding: 13px 22px;
  border-radius: 9px; text-decoration: none; transition: opacity 0.15s;
}
.an-upgrade-cta:hover { opacity: 0.88; }

.an-disclaimer {
  font-size: 11px; color: #333; text-align: center; line-height: 1.6;
}

/* Paywall overlay */
.an-paywall-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center;
  z-index: 999; padding: 20px;
}
.an-paywall-box {
  background: #111112; border: 1px solid #222;
  border-radius: 16px; padding: 36px 28px;
  max-width: 400px; width: 100%; text-align: center;
  display: flex; flex-direction: column; gap: 14px;
}
.an-pw-icon { font-size: 36px; }
.an-pw-title {
  font-family: 'Syne', sans-serif;
  font-size: 22px; font-weight: 800; color: #fff;
}
.an-pw-sub { font-size: 15px; color: var(--muted); }
.an-pw-cta {
  display: block; background: var(--text); color: var(--bg);
  font-size: 15px; font-weight: 700; padding: 15px;
  border-radius: 10px; text-decoration: none; margin-top: 4px;
  transition: opacity 0.15s;
}
.an-pw-cta:hover { opacity: 0.88; }
.an-pw-close {
  background: none; border: none; color: #444;
  font-size: 14px; font-family: inherit; cursor: pointer;
}
.an-pw-close:hover { color: var(--muted); }

@media (max-width: 400px) {
  .an-ind-grid { grid-template-columns: 1fr; }
  .an-row { grid-template-columns: 1fr; }
  .an-sentiment-grid { grid-template-columns: 1fr; }
}
`;export{Ea as default};
