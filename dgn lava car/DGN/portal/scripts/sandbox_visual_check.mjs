// Verificação visual do sandbox local via Playwright node (sem MCP).
// Loga como admin e captura screenshots em 1440x900.
// Uso: node scripts/sandbox_visual_check.mjs
import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const BASE = "http://localhost:3000";
const OUT = ".playwright-mcp/sandbox";
await mkdir(OUT, { recursive: true });

const routes = [
  { path: "/admin/growth", slug: "01-dashboard" },
  { path: "/admin/growth/intelligence/inbox", slug: "02-inbox" },
  { path: "/admin/growth/empresas", slug: "03-empresas" },
  { path: "/admin/growth/assistente", slug: "04-assistente" },
  { path: "/admin/growth/curadoria", slug: "05-curadoria" },
  { path: "/admin/growth/assinantes-detectados", slug: "06-assinantes" },
  { path: "/empresa", slug: "07-portal-gestor-sem-token" },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Login admin
await page.goto(`${BASE}/admin/growth/login`, { waitUntil: "domcontentloaded" });
await page.fill("input[name=password]", "sandbox-admin");
await page.click("button[type=submit]");
await page.waitForURL(/\/admin\/growth(?!\/login)/, { timeout: 10_000 });

for (const r of routes) {
  await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(400);
  const file = `${OUT}/${r.slug}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(`captured ${file}`);
}

await browser.close();
console.log("done");
