// Smoke visual via Playwright node contra o túnel público.
// Prova: basic auth + login admin + Dashboard + Inbox + Empresas + Portal gestor pelo URL remoto.
import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const REMOTE = process.env.DGN_SANDBOX_REMOTE_URL;
const USER = process.env.DGN_SANDBOX_BASIC_USER;
const PASS = process.env.DGN_SANDBOX_BASIC_PASS;
const ADMIN_PASS = process.env.DGN_SANDBOX_ADMIN_PASS;
const MARINA_TOKEN = process.env.DGN_SANDBOX_MARINA_TOKEN;

if (!REMOTE || !USER || !PASS || !ADMIN_PASS || !MARINA_TOKEN) {
  console.error("Faltam envs: DGN_SANDBOX_REMOTE_URL, _BASIC_USER, _BASIC_PASS, _ADMIN_PASS, _MARINA_TOKEN");
  process.exit(1);
}

const MARINA_ID = "4bb017c2-a739-4228-a770-f008a6f4da68";
const OUT = ".playwright-mcp/remote";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  httpCredentials: { username: USER, password: PASS },
});
const page = await ctx.newPage();

// Login admin
await page.goto(`${REMOTE}/admin/growth/login`, { waitUntil: "domcontentloaded" });
await page.fill("input[name=password]", ADMIN_PASS);
await page.click("button[type=submit]");
await page.waitForURL(/\/admin\/growth(?!\/login)/, { timeout: 15_000 });

for (const [slug, path] of [
  ["01-dashboard", "/admin/growth"],
  ["02-inbox", "/admin/growth/intelligence/inbox"],
  ["03-empresas", "/admin/growth/empresas"],
]) {
  await page.goto(`${REMOTE}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${slug}.png`, fullPage: true });
  console.log(`captured ${slug}`);
}

// Manager portal (novo context sem cookie admin pra isolar)
const mgrCtx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  httpCredentials: { username: USER, password: PASS },
});
const mgrPage = await mgrCtx.newPage();
await mgrPage.goto(`${REMOTE}/empresa/entrar?mgr=${MARINA_ID}&t=${MARINA_TOKEN}`, { waitUntil: "domcontentloaded" });
await mgrPage.waitForURL(/\/empresa$/, { timeout: 15_000 });
await mgrPage.waitForTimeout(1500);
await mgrPage.screenshot({ path: `${OUT}/04-portal-marina.png`, fullPage: true });
console.log("captured 04-portal-marina");

await browser.close();
console.log("done");
