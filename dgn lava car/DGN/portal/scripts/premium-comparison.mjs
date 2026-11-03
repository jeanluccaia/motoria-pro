import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const out = resolve('artifacts/premium');
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'comparison.html'), `<!doctype html>
<html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Portal DGN · Comparativo visual</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#0b0b0c;color:#e7e7ea;font:14px/1.5 system-ui,sans-serif}header{padding:24px 28px;border-bottom:1px solid #ffffff20;display:flex;align-items:center;flex-wrap:wrap;gap:16px}h1{margin:0;font-size:20px}label{display:flex;gap:8px;align-items:center}select{font:inherit;background:#19191b;color:#ddd;border:1px solid #ffffff30;border-radius:6px;padding:8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:24px}h2{font-size:14px;font-weight:500;margin:0 0 12px;color:#aaa}.frame{height:76vh;overflow:auto;border:1px solid #ffffff20;border-radius:8px;background:#080808}img{display:block;width:100%;height:auto}.note{padding:0 28px 24px;color:#999;font-size:12px}a{color:#d3b565}@media(max-width:700px){.grid{grid-template-columns:1fr;padding:16px}header{padding:20px}.frame{height:65vh}}
</style>
<header><h1>Portal DGN · Antes e depois</h1><label>Tela <select id="screen"><option value="dashboard">Visão geral</option><option value="reconciliacao">Reconciliação</option><option value="clientes">Clientes</option><option value="assinantes">Assinantes</option><option value="cliente-360">Ficha 360°</option><option value="curadoria">Curadoria</option><option value="inbox">Oportunidades</option><option value="assistente">Assistente</option><option value="campanhas">Campanha Founders</option><option value="frotas">Frotas</option><option value="empresa-acesso">Portal corporativo · acesso</option><option value="diagnosticos">Diagnósticos</option></select></label><label>Largura <select id="width"><option>1440</option><option>1024</option><option>390</option></select> px</label></header>
<main class="grid"><section><h2>Antes · referência 7a3973b</h2><div class="frame"><img id="before" alt="Tela original"></div></section><section><h2>Depois · refinamento isolado</h2><div class="frame"><img id="after" alt="Tela refinada"></div></section></main>
<p class="note">Capturas locais com a fonte operacional disponível. Frotas e oportunidades retornaram indisponibilidade. O portal corporativo mostra o estado sem sessão. As capturas de testes com fixtures ficam separadas e não são exibidas neste comparativo. <a id="full" href="after/dashboard-1440-full.png">Abrir captura completa do refinamento</a></p>
<script>
const screen=document.querySelector('#screen'),width=document.querySelector('#width');function update(){let file=screen.value+'-'+width.value;document.querySelector('#before').src='before/'+file+'.png';document.querySelector('#after').src='after/'+file+'.png';document.querySelector('#full').href='after/'+file+'-full.png'}screen.addEventListener('change',update);width.addEventListener('change',update);update();
</script></html>`);
console.log(resolve(out, 'comparison.html'));
