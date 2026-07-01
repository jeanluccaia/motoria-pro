#!/usr/bin/env node
// Valida todas as URLs de imagem no index.html antes do deploy.
// Uso: node scripts/check-images.js [--http]
// --http: também faz HEAD request para cada imagem (requer produção acessível)

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const HTML_FILE = path.join(__dirname, '..', 'index.html');
const CHECK_HTTP = process.argv.includes('--http');
const BASE_URL = 'https://pattamansa.com.br';

const BROKEN_PATTERNS = [
  /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ]/,
  / /,
];

function extractImgSrcs(html) {
  const srcs = new Set();
  const re = /src=["']([^"']+\.(?:webp|jpg|jpeg|png|gif|svg))["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) srcs.add(m[1]);
  return [...srcs];
}

function isBroken(src) {
  if (src.startsWith('http://') || src.startsWith('https://')) return null;
  for (const pat of BROKEN_PATTERNS) {
    if (pat.test(src)) return `padrão proibido: ${pat}`;
  }
  return null;
}

function httpHead(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
      resolve({ status: res.statusCode, url });
    });
    req.on('error', (e) => resolve({ status: 0, url, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, url, error: 'timeout' }); });
    req.end();
  });
}

async function main() {
  if (!fs.existsSync(HTML_FILE)) {
    console.error('ERRO: index.html não encontrado em', HTML_FILE);
    process.exit(1);
  }

  const html = fs.readFileSync(HTML_FILE, 'utf8');
  const srcs = extractImgSrcs(html);

  console.log(`\n=== check-images ===`);
  console.log(`Arquivo: ${HTML_FILE}`);
  console.log(`Imagens encontradas: ${srcs.length}\n`);

  let errors = 0;

  // 1. Verificação de padrões proibidos (local, sem rede)
  console.log('── Verificando paths (acento/espaço) ──');
  for (const src of srcs) {
    const reason = isBroken(src);
    if (reason) {
      console.error(`  ✗ QUEBRADO  ${src}  [${reason}]`);
      errors++;
    } else {
      console.log(`  ✓  ${src}`);
    }
  }

  // 2. Verificação HTTP (opcional, requer --http)
  if (CHECK_HTTP) {
    console.log('\n── Verificando HTTP (HEAD requests) ──');
    const checks = srcs.map((src) => {
      const url = src.startsWith('http') ? src : `${BASE_URL}/${src}`;
      return httpHead(url);
    });
    const results = await Promise.all(checks);
    for (const r of results) {
      if (r.status === 200) {
        console.log(`  ✓ 200  ${r.url}`);
      } else {
        console.error(`  ✗ ${r.status || 'ERR'}  ${r.url}${r.error ? '  (' + r.error + ')' : ''}`);
        errors++;
      }
    }
  }

  console.log(`\n${'─'.repeat(40)}`);
  if (errors === 0) {
    console.log(`✅  Todas as imagens OK${CHECK_HTTP ? ' (path + HTTP)' : ' (path)'}\n`);
    process.exit(0);
  } else {
    console.error(`❌  ${errors} imagem(ns) com problema. Corrija antes do deploy.\n`);
    process.exit(1);
  }
}

main();
