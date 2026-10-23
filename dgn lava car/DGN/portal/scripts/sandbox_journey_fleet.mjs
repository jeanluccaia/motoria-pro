// Jornada REAL de Frotas: gestor Marina (Alpha) autentica via HMAC,
// vê suas requests, cria nova, admin confirma, gestor atualiza e vê novo status.
import { chromium } from "playwright";
import { createHmac } from "crypto";
import { mkdir } from "fs/promises";

const BASE = "http://localhost:3000";
const OUT = ".playwright-mcp/sandbox";
await mkdir(OUT, { recursive: true });

const MARINA_ID = "4bb017c2-a739-4228-a770-f008a6f4da68";
const SECRET = "sandbox-manager-hmac-secret-not-prod";
const marinaToken = createHmac("sha256", SECRET).update(MARINA_ID).digest("hex");
const marinaUrl = `${BASE}/empresa/entrar?mgr=${MARINA_ID}&t=${marinaToken}`;

const browser = await chromium.launch({ headless: true });

// Browser Marina (gestora Alpha)
const managerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const managerPage = await managerCtx.newPage();
await managerPage.goto(marinaUrl, { waitUntil: "domcontentloaded" });
await managerPage.waitForURL(/\/empresa$/, { timeout: 10_000 });
await managerPage.waitForTimeout(800);
await managerPage.screenshot({ path: `${OUT}/j2-manager-01-portal-inicial.png`, fullPage: true });
console.log("manager portal inicial capturado");

// Browser admin (nova sessão de login admin)
const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const adminPage = await adminCtx.newPage();
await adminPage.goto(`${BASE}/admin/growth/login`, { waitUntil: "domcontentloaded" });
await adminPage.fill("input[name=password]", "sandbox-admin");
await adminPage.click("button[type=submit]");
await adminPage.waitForURL(/\/admin\/growth(?!\/login)/);

// Admin lista empresas
await adminPage.goto(`${BASE}/admin/growth/empresas`, { waitUntil: "domcontentloaded" });
await adminPage.waitForTimeout(500);
await adminPage.screenshot({ path: `${OUT}/j2-admin-01-empresas.png`, fullPage: true });

// Admin abre Alpha (card "Alpha Transportes")
await adminPage.locator("a").filter({ hasText: "Alpha Transportes" }).first().click();
await adminPage.waitForURL(/\/empresas\//);
await adminPage.waitForTimeout(800);
await adminPage.screenshot({ path: `${OUT}/j2-admin-02-alpha-detalhe-antes.png`, fullPage: true });
console.log("admin Alpha detalhe capturado");

// ---- Admin CONFIRMA a request pending da Alpha via API (equivale ao botão) ----
// Pega o cookie admin para poder bater na API via fetch no mesmo browser.
const alphaReqId = "08528482-e267-40be-a89e-09d06c558d93"; // alpha_req1 pending do seed
const confirmResp = await adminPage.request.post(
  `${BASE}/api/admin/growth/empresas/requests/${alphaReqId}/confirm`,
  {
    data: {
      scheduledAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      adminNotes: "Sandbox demo: confirmação simulada por admin via API da UI (equivalente ao botão Confirmar).",
    },
    headers: { "Content-Type": "application/json" },
  },
);
console.log("admin confirm status:", confirmResp.status(), await confirmResp.text());

// Admin recarrega
await adminPage.reload({ waitUntil: "domcontentloaded" });
await adminPage.waitForTimeout(800);
await adminPage.screenshot({ path: `${OUT}/j2-admin-03-alpha-detalhe-depois.png`, fullPage: true });

// ---- Manager Marina recarrega e vê a confirmação ----
await managerPage.reload({ waitUntil: "domcontentloaded" });
await managerPage.waitForTimeout(1000);
await managerPage.screenshot({ path: `${OUT}/j2-manager-02-portal-depois-confirm.png`, fullPage: true });
console.log("manager portal depois capturado");

await browser.close();
console.log("done");
