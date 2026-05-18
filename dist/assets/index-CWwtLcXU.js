const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/landing-CKh_h38c.js","assets/vendor-BnG4zNoI.js","assets/tool-CS-lRIqP.js","assets/AppDashboard-DjH2PpTy.js","assets/Analisar-CnlK99en.js","assets/Obrigado-BpR6-jKn.js","assets/AppMembro-BcZLYeN5.js"])))=>i.map(i=>d[i]);
import{j as e,r as l,c as b}from"./vendor-BnG4zNoI.js";import{L as u,R as v,u as j}from"./landing-CKh_h38c.js";(function(){const d=document.createElement("link").relList;if(d&&d.supports&&d.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))m(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const n of o.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&m(n)}).observe(document,{childList:!0,subtree:!0});function p(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function m(r){if(r.ep)return;r.ep=!0;const o=p(r);fetch(r.href,o)}})();const _="modulepreload",E=function(t){return"/"+t},g={},c=function(d,p,m){let r=Promise.resolve();if(p&&p.length>0){document.getElementsByTagName("link");const n=document.querySelector("meta[property=csp-nonce]"),s=n?.nonce||n?.getAttribute("nonce");r=Promise.allSettled(p.map(a=>{if(a=E(a),a in g)return;g[a]=!0;const f=a.endsWith(".css"),x=f?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${a}"]${x}`))return;const i=document.createElement("link");if(i.rel=f?"stylesheet":_,f||(i.as="script"),i.crossOrigin="",i.href=a,s&&i.setAttribute("nonce",s),document.head.appendChild(i),f)return new Promise((y,h)=>{i.addEventListener("load",y),i.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${a}`)))})}))}function o(n){const s=new Event("vite:preloadError",{cancelable:!0});if(s.payload=n,window.dispatchEvent(s),!s.defaultPrevented)throw n}return r.then(n=>{for(const s of n||[])s.status==="rejected"&&o(s.reason);return d().catch(o)})};function O(){return e.jsxs("div",{className:"ly-legal",children:[e.jsx("span",{children:"⚠"}),e.jsxs("span",{children:["Ferramenta educativa de risco. Não é recomendação de aposta. Apostas envolvem risco financeiro real e podem causar prejuízo."," ",e.jsx("strong",{children:"Proibido para menores de 18 anos."})," ",e.jsx("a",{href:"https://www.jogoresponsavel.com.br",target:"_blank",rel:"noopener noreferrer",children:"jogoresponsavel.com.br"})]})]})}function R(){return e.jsxs("header",{className:"ly-header",children:[e.jsxs(u,{to:"/",className:"ly-logo",children:[e.jsx("span",{className:"ly-logo-main",children:"MotorIA Pro"}),e.jsx("span",{className:"ly-logo-tag",children:"· Análise de Risco"})]}),e.jsx(u,{to:"/analisar",className:"ly-cta-btn",children:"Analisar minha aposta"})]})}function D(){return e.jsx("footer",{className:"ly-footer",children:e.jsxs("div",{className:"ly-footer-inner",children:[e.jsx("p",{className:"ly-footer-legal",children:"⚠ Ferramenta educativa. Não é recomendação de aposta. Apostas envolvem risco financeiro real e podem causar prejuízo. Jogue com responsabilidade."}),e.jsxs("p",{className:"ly-footer-links",children:[e.jsx("a",{href:"https://www.jogoresponsavel.com.br",target:"_blank",rel:"noopener noreferrer",children:"jogoresponsavel.com.br"})," · ",e.jsx("a",{href:"tel:188",children:"CVV 188"})," · ","Proibido para menores de 18 anos."]}),e.jsx("p",{className:"ly-footer-copy",children:"© 2026 MotorIA Pro — Análise de Risco. Todos os direitos reservados."})]})})}const w=`
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
`,A=l.lazy(()=>c(()=>import("./landing-CKh_h38c.js").then(t=>t.b),__vite__mapDeps([0,1]))),L=l.lazy(()=>c(()=>import("./tool-CS-lRIqP.js"),__vite__mapDeps([2,1,0]))),P=l.lazy(()=>c(()=>import("./AppDashboard-DjH2PpTy.js"),__vite__mapDeps([3,1,0]))),k=l.lazy(()=>c(()=>import("./Analisar-CnlK99en.js"),__vite__mapDeps([4,1,0]))),z=l.lazy(()=>c(()=>import("./Obrigado-BpR6-jKn.js"),__vite__mapDeps([5,1,0]))),N=l.lazy(()=>c(()=>import("./AppMembro-BcZLYeN5.js"),__vite__mapDeps([6,1,0])));function F(){const{path:t}=j();return t==="/ferramenta"?e.jsx(L,{}):t==="/app"?e.jsx(P,{}):t==="/analisar"?e.jsx(k,{}):t==="/obrigado"?e.jsx(z,{}):t==="/membro"?e.jsx(N,{}):t==="/pagar"?(window.location.replace("https://pay.kiwify.com.br/DIVD8zl"),null):e.jsx(A,{})}b(document.getElementById("root")).render(e.jsxs(l.Suspense,{fallback:e.jsx("div",{style:{minHeight:"100vh",background:"#050505"}}),children:[e.jsx("style",{children:w}),e.jsx(v,{children:e.jsx(F,{})})]}));export{D as F,R as H,O as L};
