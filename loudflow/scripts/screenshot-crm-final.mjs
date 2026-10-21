// Captura final do /crm/franquias no estado "Loud Flow só CRM da Franqueadora".
// Loga via POST /api/auth/quick (read-only). Produz todos os prints exigidos
// na checklist + um contact sheet HTML para revisão lado a lado.

import { chromium } from "@playwright/test";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("screenshots-crm-final");
await mkdir(OUT, { recursive: true });

const BASE = process.env.BASE_URL || "http://127.0.0.1:3101";
const QUICK_EMAIL = process.env.QUICK_EMAIL || "jean.lucca@icloud.com";
const STORAGE_FILE = path.join(OUT, ".storage.json");

async function shot(page, name, opts = {}) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage: Boolean(opts.full) });
  console.log(`[shot${opts.full ? "-full" : ""}] ${name}`);
}

async function section(page, locator, name) {
  if ((await locator.count()) === 0) {
    console.log(`[warn] seção ausente: ${name}`);
    return;
  }
  await locator.scrollIntoViewIfNeeded();
  await locator.screenshot({ path: path.join(OUT, name) });
  console.log(`[shot-section] ${name}`);
}

async function quickLogin(context, page) {
  await page.goto(`${BASE}/entrar`, { waitUntil: "domcontentloaded" });
  const res = await context.request.post(`${BASE}/api/auth/quick`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ email: QUICK_EMAIL }),
  });
  if (!res.ok()) {
    throw new Error(`POST /api/auth/quick falhou: ${res.status()} ${await res.text()}`);
  }
}

const browser = await chromium.launch({ headless: true });
// Capturar erros de console pra debugar o dialog
const _consoleErrors = [];
try {
  // ============ DESKTOP ============
  const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const d = await dctx.newPage();
  d.on("pageerror", (err) => { _consoleErrors.push(String(err)); console.log(`[pageerror] ${err.message}`); });
  d.on("console", (msg) => {
    if (msg.type() === "error") { _consoleErrors.push(msg.text()); console.log(`[console-error] ${msg.text()}`); }
  });
  await quickLogin(dctx, d);
  await dctx.storageState({ path: STORAGE_FILE });

  // --- Redirect / → /crm/franquias
  // Esperamos o redirect server-side resolver e a lista carregar.
  await d.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await d.waitForURL((u) => new URL(u).pathname.startsWith("/crm"), { timeout: 20_000 });
  await d.waitForLoadState("networkidle");
  await d.waitForTimeout(400);
  console.log(`[redirect] / → ${d.url()}`);
  await shot(d, "01_desktop_redirect_home.png");

  // --- Sidebar simplificada (desktop, canto superior)
  await shot(d, "02_desktop_sidebar.png");
  await section(d, d.locator("aside").first(), "02b_desktop_sidebar_only.png");

  // --- Página 1 (desktop full)
  await shot(d, "03_desktop_page1_full.png", { full: true });

  // --- Página 2: ir para o fim e clicar "Próxima"
  const nextBtn = d.getByRole("button", { name: /Próxima/i }).first();
  if (await nextBtn.count()) {
    await nextBtn.scrollIntoViewIfNeeded();
    const nextEnabled = !(await nextBtn.isDisabled());
    if (nextEnabled) {
      await nextBtn.click();
      await d.waitForTimeout(500);
      await shot(d, "04_desktop_page2.png");
      await shot(d, "04b_desktop_page2_full.png", { full: true });
      const prevBtn = d.getByRole("button", { name: /Anterior/i }).first();
      if ((await prevBtn.count()) && !(await prevBtn.isDisabled())) {
        await prevBtn.click();
        await d.waitForTimeout(300);
      }
    } else {
      console.log("[warn] Próxima está desabilitada (só 1 página)");
    }
  } else {
    console.log("[warn] botão Próxima não encontrado");
  }

  // --- Filtro "Precisam de ação"
  const chipPrecisam = d.getByRole("tab", { name: /Precisam de ação/i }).first();
  if (await chipPrecisam.count()) {
    await chipPrecisam.scrollIntoViewIfNeeded();
    await chipPrecisam.click();
    await d.waitForTimeout(400);
    await shot(d, "05_desktop_filter_precisam.png");
    // Voltar pra Todos
    const chipTodos = d.getByRole("tab", { name: /^Todos\b/i }).first();
    if (await chipTodos.count()) {
      await chipTodos.click();
      await d.waitForTimeout(300);
    }
  }

  // --- Troca de filtro estando na página 2 → deve voltar pra página 1
  if (await nextBtn.count()) {
    await nextBtn.scrollIntoViewIfNeeded();
    if (!(await nextBtn.isDisabled())) {
      await nextBtn.click();
      await d.waitForTimeout(400);
      const chipReativar = d.getByRole("tab", { name: /^Reativar\b/i }).first();
      if (await chipReativar.count()) {
        await chipReativar.click();
        await d.waitForTimeout(400);
        await shot(d, "06_desktop_filter_change_from_p2.png");
        const pageLabel = await d.locator("text=/Página\\s+\\d+\\s+de\\s+\\d+/").first().innerText().catch(() => "");
        console.log(`[verify] após troca de filtro na p2, pagelabel="${pageLabel}"`);
      }
    }
  }

  // --- Reset: Todos
  const chipTodos2 = d.getByRole("tab", { name: /^Todos\b/i }).first();
  if (await chipTodos2.count()) {
    await chipTodos2.click();
    await d.waitForTimeout(300);
  }

  // --- Busca por "Vanessa"
  const search = d.getByLabel(/Buscar leads/i).first();
  if (await search.count()) {
    await search.fill("Vanessa");
    await d.waitForTimeout(500);
    await shot(d, "07_desktop_search_vanessa.png");
    await search.fill("");
    await d.waitForTimeout(300);
  }

  // --- Detalhe de um lead
  // Hidratação: aguarda ter botão interativo "Enviar e-mail" ou "Ligar agora"
  // na tabela — isso só aparece após hidratação completa.
  await d.waitForFunction(() => {
    const rows = document.querySelectorAll("tr[role='button'][aria-label^='Abrir lead']");
    return rows.length > 0;
  }, { timeout: 15_000 });
  await d.waitForTimeout(1200);

  // Em vez de clicar na linha (onde o click pode cair em filhos que não
  // propagam), disparamos o onOpen diretamente via botão "Ver detalhes"
  // do card de recomendação.
  const verDetalhes = d.getByRole("button", { name: /^Ver detalhes$/ }).first();
  await verDetalhes.scrollIntoViewIfNeeded();
  await verDetalhes.click();
  await d.waitForTimeout(1500);
  const anyRoleDialog = await d.locator('[role="dialog"]').count();
  console.log(`[detail] role=dialog após 'Ver detalhes'=${anyRoleDialog}`);
  await shot(d, "08_desktop_lead_detail.png", { full: true });
  await d.keyboard.press("Escape");
  await d.waitForTimeout(500);

  // --- Recomendação de hoje (zoom)
  const rec = d.locator("section", { hasText: /Recomendação de hoje/i }).first();
  await section(d, rec, "09_desktop_recommendation.png");

  // --- Indicadores (zoom)
  const ind = d.locator("section[aria-label='Indicadores']").first();
  await section(d, ind, "10_desktop_indicators.png");

  await dctx.close();

  // ============ MOBILE 390x844 ============
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    storageState: STORAGE_FILE,
  });
  const m = await mctx.newPage();

  await m.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await m.waitForURL((u) => new URL(u).pathname.startsWith("/crm"), { timeout: 20_000 });
  await m.waitForLoadState("networkidle");
  await m.waitForTimeout(500);
  console.log(`[mobile-redirect] / → ${m.url()}`);
  await shot(m, "20_mobile_top.png");
  await shot(m, "21_mobile_full.png", { full: true });

  // Scroll pra página de leads
  await m.evaluate(() => window.scrollBy(0, 600));
  await m.waitForTimeout(300);
  await shot(m, "22_mobile_mid.png");

  await m.evaluate(() => window.scrollBy(0, 800));
  await m.waitForTimeout(300);
  await shot(m, "23_mobile_list.png");

  // Bottom nav mobile
  await m.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await m.waitForTimeout(300);
  await shot(m, "24_mobile_bottom_nav.png");

  // Página 2 mobile
  const nextBtnM = m.getByRole("button", { name: /Próxima/i }).first();
  if (await nextBtnM.count()) {
    await nextBtnM.scrollIntoViewIfNeeded();
    await nextBtnM.click();
    await m.waitForTimeout(500);
    await shot(m, "25_mobile_page2.png", { full: true });
  }

  // Detalhe mobile — card no mobile é um botão interno do article
  await m.goto(`${BASE}/crm/franquias`, { waitUntil: "networkidle" });
  await m.waitForTimeout(800);
  const firstCardBtn = m.locator("ul.md\\:hidden li article button").first();
  if (await firstCardBtn.count()) {
    await firstCardBtn.scrollIntoViewIfNeeded();
    await firstCardBtn.click({ force: true });
    await m.waitForTimeout(1500);
    await shot(m, "26_mobile_lead_detail.png", { full: true });
    await m.keyboard.press("Escape");
  }

  await mctx.close();

  // ============ CONTACT SHEET HTML ============
  const files = [
    { file: "01_desktop_redirect_home.png", caption: "Desktop · / redireciona pra /crm/franquias" },
    { file: "02b_desktop_sidebar_only.png", caption: "Sidebar desktop simplificada (CRM + Configurações)" },
    { file: "03_desktop_page1_full.png", caption: "Página 1 desktop (10 leads)" },
    { file: "04b_desktop_page2_full.png", caption: "Página 2 desktop (10+ seguintes)" },
    { file: "05_desktop_filter_precisam.png", caption: "Filtro 'Precisam de ação'" },
    { file: "06_desktop_filter_change_from_p2.png", caption: "Troca de filtro estando na p.2 → volta p.1" },
    { file: "07_desktop_search_vanessa.png", caption: "Busca por 'Vanessa'" },
    { file: "08_desktop_lead_detail.png", caption: "Detalhe de um lead (sem badge de prioridade)" },
    { file: "09_desktop_recommendation.png", caption: "Recomendação de hoje (máx 3)" },
    { file: "10_desktop_indicators.png", caption: "5 indicadores objetivos" },
    { file: "21_mobile_full.png", caption: "Mobile 390×844 (visão completa)" },
    { file: "23_mobile_list.png", caption: "Mobile · lista de leads" },
    { file: "24_mobile_bottom_nav.png", caption: "Mobile · bottom nav (CRM + Config)" },
    { file: "25_mobile_page2.png", caption: "Mobile · página 2" },
    { file: "26_mobile_lead_detail.png", caption: "Mobile · detalhe do lead" },
  ];

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Contact sheet — Loud Flow CRM Franquias</title>
<style>
  body { font-family: -apple-system,Segoe UI,Roboto,sans-serif; background:#0e0e10; color:#e5e5e5; margin:0; padding:28px; }
  h1 { font-size:20px; margin:0 0 24px; }
  .sheet { display:grid; grid-template-columns:repeat(auto-fill,minmax(360px,1fr)); gap:20px; }
  .card { background:#17171a; border:1px solid #2a2a2e; border-radius:10px; overflow:hidden; display:flex; flex-direction:column; }
  .card img { display:block; width:100%; height:auto; background:#000; border-bottom:1px solid #2a2a2e; }
  .caption { padding:10px 12px; font-size:12px; color:#c7c7cc; }
  .file { color:#8a8a8f; font-size:10px; font-family:ui-monospace,monospace; }
</style>
</head>
<body>
  <h1>Contact sheet — CRM Franquias (${new Date().toISOString().slice(0,10)})</h1>
  <div class="sheet">
    ${files.map(({ file, caption }) => `
      <figure class="card">
        <img src="${file}" alt="${caption}">
        <figcaption class="caption">
          ${caption}
          <div class="file">${file}</div>
        </figcaption>
      </figure>
    `).join("\n")}
  </div>
</body>
</html>`;

  await writeFile(path.join(OUT, "contact-sheet.html"), html, "utf8");
  console.log(`\n✓ contact sheet: ${path.join(OUT, "contact-sheet.html")}`);
  console.log(`✓ screenshots em ${OUT}`);
} catch (err) {
  console.error("FAIL:", err);
  process.exitCode = 2;
} finally {
  await browser.close();
  try { await rm(STORAGE_FILE, { force: true }); } catch {}
}
