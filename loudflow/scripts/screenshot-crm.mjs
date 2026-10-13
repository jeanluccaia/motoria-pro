// Captura 5 screenshots da UI do CRM de franquias:
//   01_desktop_overview.png     — visão geral desktop (/crm/franquias)
//   02_desktop_call_queue.png   — detalhe da seção "Quem chamar agora"
//   03_desktop_detail.png       — lead detail com Recomendação do sistema
//   04_mobile_list.png          — lista mobile (viewport 390x844)
//   05_mobile_detail.png        — detail mobile
//
// Pré-requisito: Supabase local + dev server (npm run dev) + seed aplicado
// + admin@crm.test criado (via supabase/seed/_create_admin_crm_test.mjs).
//
// Uso: node scripts/screenshot-crm.mjs

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.resolve("screenshots-crm");
await mkdir(OUT_DIR, { recursive: true });

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const EMAIL = "admin@crm.test";

const browser = await chromium.launch();
try {
  // ---- DESKTOP ----
  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const desktop = await desktopCtx.newPage();

  await desktop.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
  await desktop.getByRole("button", { name: /admin crm/i }).click();
  // Aguarda a navegação disparada pelo window.location.assign("/").
  await desktop.waitForURL((u) => new URL(u).pathname === "/", {
    timeout: 15_000,
  });

  await desktop.goto(`${BASE}/crm/franquias`, { waitUntil: "networkidle" });
  // Garante que o grid de KPIs renderizou.
  await desktop.waitForSelector("text=Total de leads", { timeout: 10_000 });

  await desktop.screenshot({
    path: path.join(OUT_DIR, "01_desktop_overview.png"),
    fullPage: false,
  });
  console.log("[shot] 01_desktop_overview");

  // Call queue section — screenshot do bloco "Quem chamar agora".
  const queueSection = desktop.locator("section", { hasText: "Quem chamar agora" });
  if (await queueSection.count()) {
    await queueSection.first().screenshot({
      path: path.join(OUT_DIR, "02_desktop_call_queue.png"),
    });
    console.log("[shot] 02_desktop_call_queue");
  } else {
    console.log("[warn] call queue vazia — screenshot pulado");
  }

  // Abre o detalhe do primeiro lead da fila (ou da tabela).
  const detailTrigger =
    (await queueSection.locator("button", { hasText: /Agir agora/i }).count())
      ? queueSection.locator("button", { hasText: /Agir agora/i }).first()
      : desktop.locator("table tbody tr").first();
  await detailTrigger.click();
  await desktop.waitForSelector("text=Recomendação do sistema", { timeout: 10_000 });
  await desktop.screenshot({
    path: path.join(OUT_DIR, "03_desktop_detail.png"),
    fullPage: false,
  });
  console.log("[shot] 03_desktop_detail");

  await desktopCtx.close();

  // ---- MOBILE ----
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const mobile = await mobileCtx.newPage();

  await mobile.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
  await mobile.getByRole("button", { name: /admin crm/i }).click();
  await mobile.waitForURL((u) => new URL(u).pathname === "/", {
    timeout: 15_000,
  });

  await mobile.goto(`${BASE}/crm/franquias`, { waitUntil: "networkidle" });
  await mobile.waitForSelector("text=Total de leads", { timeout: 10_000 });

  // Scroll para a lista de cards.
  await mobile.evaluate(() => window.scrollBy(0, 600));
  await mobile.waitForTimeout(500);
  await mobile.screenshot({
    path: path.join(OUT_DIR, "04_mobile_list.png"),
    fullPage: false,
  });
  console.log("[shot] 04_mobile_list");

  // Abre o detalhe do primeiro card mobile.
  const mobileCard = mobile.locator("article button").first();
  await mobileCard.click();
  await mobile.waitForSelector("text=Recomendação do sistema", { timeout: 10_000 });
  await mobile.screenshot({
    path: path.join(OUT_DIR, "05_mobile_detail.png"),
    fullPage: false,
  });
  console.log("[shot] 05_mobile_detail");

  await mobileCtx.close();
  console.log(`Arquivos em ${OUT_DIR}`);
} finally {
  await browser.close();
}
