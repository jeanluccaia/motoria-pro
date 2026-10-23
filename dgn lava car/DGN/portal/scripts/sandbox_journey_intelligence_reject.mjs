import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const OUT = ".playwright-mcp/sandbox";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/admin/growth/login`);
await page.fill("input[name=password]", "sandbox-admin");
await page.click("button[type=submit]");
await page.waitForURL(/\/admin\/growth(?!\/login)/);

await page.goto(`${BASE}/admin/growth/intelligence/inbox`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("[data-testid^='agent-action-']", { timeout: 10_000 });

const alertCard = page.locator("[data-testid^='agent-action-']").filter({ hasText: "André sem agendamento há 45 dias" });
await alertCard.locator("[data-testid='btn-reject']").click();
// Modal "confirming-reject" aparece inline no card.
await alertCard.locator("textarea").fill("Sandbox demo: rejeitado para prova de fluxo end-to-end.");
await alertCard.locator("[data-testid='confirm-reject']").click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/j1-inbox-depois-rejeitar.png`, fullPage: true });

await page.goto(`${BASE}/admin/growth`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/j1-dashboard-pos.png`, fullPage: true });

await browser.close();
console.log("done");
