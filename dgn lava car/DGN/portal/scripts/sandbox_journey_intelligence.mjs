// Jornada REAL de Inteligência: aprovar oportunidade (Beatriz) + rejeitar alerta (André).
// Captura screenshots antes/depois e deixa evidência em .playwright-mcp/sandbox/.
import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const BASE = "http://localhost:3000";
const OUT = ".playwright-mcp/sandbox";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

async function login() {
  await page.goto(`${BASE}/admin/growth/login`, { waitUntil: "domcontentloaded" });
  await page.fill("input[name=password]", "sandbox-admin");
  await page.click("button[type=submit]");
  await page.waitForURL(/\/admin\/growth(?!\/login)/, { timeout: 10_000 });
}
await login();

// --- INBOX ANTES ---
await page.goto(`${BASE}/admin/growth/intelligence/inbox`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/j1-inbox-antes.png`, fullPage: true });
const beforeIds = await page.$$eval("[data-testid^='agent-action-']", (els) => els.map((e) => e.getAttribute("data-testid")));
console.log("ANTES:", beforeIds);

// --- APROVAR a oportunidade da Beatriz ---
const opportunityCard = page.locator("[data-testid^='agent-action-']").filter({ hasText: "Beatriz pode subir para Priority" });
await opportunityCard.waitFor({ timeout: 5000 });
await opportunityCard.locator("[data-testid='btn-approve']").click();
// Aprovação é otimista — aguarda estado concluir
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/j1-inbox-depois-aprovar.png`, fullPage: true });

// --- REJEITAR o alerta do André com justificativa ---
const alertCard = page.locator("[data-testid^='agent-action-']").filter({ hasText: "André sem agendamento há 45 dias" });
await alertCard.waitFor({ timeout: 5000 });
await alertCard.locator("[data-testid='btn-reject']").click();
// Modal de confirmação com reason
await page.locator("textarea").last().fill("Sandbox demo: rejeitado para prova de fluxo end-to-end.");
await page.locator("[data-testid='confirm-reject']").click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/j1-inbox-depois-rejeitar.png`, fullPage: true });

const afterIds = await page.$$eval("[data-testid^='agent-action-']", (els) => els.map((e) => e.getAttribute("data-testid")));
console.log("DEPOIS:", afterIds);

// --- Volta ao Dashboard para ver reflexo ---
await page.goto(`${BASE}/admin/growth`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/j1-dashboard-pos.png`, fullPage: true });

await browser.close();
console.log("done");
