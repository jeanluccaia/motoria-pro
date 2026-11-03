import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Local, read-only QA. Uses the existing login; never submits business forms.
process.loadEnvFile('.env.development.local');
const phase = process.argv[2] ?? 'after';
const base = process.env.PREMIUM_QA_URL ?? 'http://localhost:3200';
const out = resolve('artifacts/premium', phase);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.setDefaultNavigationTimeout(120000);
const failures = [];
page.on('pageerror', e => failures.push(e.message));
await page.goto(`${base}/admin/growth/login`, { waitUntil: 'domcontentloaded' });
console.log('Login carregado');
await page.locator('input[name="password"]').fill(process.env.DGN_ADMIN_PASSWORD);
await page.locator('button[type="submit"]').click();
await page.waitForURL(url => url.pathname === '/admin/growth', { timeout: 120000 });
console.log('Sessão local autenticada');
const routes = [
  ['dashboard', '/admin/growth'],
  ['inbox', '/admin/growth/intelligence/inbox'],
  ['clientes', '/admin/growth/intelligence'],
  ['assinantes', '/admin/growth/assinantes-detectados'],
  ['curadoria', '/admin/growth/curadoria'],
  ['frotas', '/admin/growth/empresas'],
  ['assistente', '/admin/growth/assistente'],
  ['campanhas', '/admin/growth/founders-2026'],
  ['empresa-acesso', '/empresa'],
  ['reconciliacao', '/admin/growth/assinantes/reconciliar'],
  ['diagnosticos', '/admin/growth/diagnosticos'],
];
const report = [];
let customerHref;
let companyHref;
async function capture(name, route) {
    console.log(`${phase}: ${name}`);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const profileRequests = name === 'cliente-360' ? Promise.all(['subscriptions', 'vehicles', 'appointments', 'portal-access'].map(endpoint => page.waitForResponse(r => r.url().includes('/api/admin/growth/customers/') && r.url().endsWith(`/${endpoint}`) && r.request().method() === 'GET', { timeout: 60000 }))) : null;
    const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 120000 });
    if (profileRequests) {
      await profileRequests;
      await page.getByText('Carregando assinaturas…', { exact: true }).waitFor({ state: 'hidden', timeout: 30000 });
    }
    await page.evaluate(() => document.fonts.ready);
    if (name === 'assinantes') customerHref ??= await page.locator('a[href^="/admin/growth/customers/"]').first().getAttribute('href').catch(() => null);
    if (name === 'frotas') companyHref ??= await page.locator('a[href^="/admin/growth/empresas/"]').first().getAttribute('href').catch(() => null);
    for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const state = await page.evaluate(() => ({
      title: document.querySelector('h1')?.textContent,
      overflow: document.documentElement.scrollWidth > innerWidth,
      width: document.documentElement.scrollWidth,
      controlsOutsideViewport: [...document.querySelectorAll('[data-testid="admin-shell-main"] button, [data-testid="admin-shell-main"] a')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.left < -1 || r.right > innerWidth + 1); }).length,
      text: document.querySelector('[data-testid="admin-shell-main"]')?.textContent?.slice(0, 600) ?? document.body.textContent?.slice(0, 400),
    }));
    await page.screenshot({ path: resolve(out, `${name}-${width}-full.png`), fullPage: true, caret: 'initial', animations: 'disabled' });
    await page.screenshot({ path: resolve(out, `${name}-${width}.png`), fullPage: false, caret: 'initial', animations: 'disabled' });
    report.push({ name, viewport: width, status: response?.status(), ...state });
    }
}
for (const [name, route] of routes) await capture(name, route);
for (const [name, route] of [['cliente-360', customerHref], ['empresa-detalhe', companyHref]]) if (route) await capture(name, route);
writeFileSync(resolve(out, 'report.json'), JSON.stringify({ base, phase, failures, report, customerHref, companyHref }, null, 2));
console.log(JSON.stringify({ phase, screenshots: report.length, failures, overflow: report.filter(r => r.overflow), customerAvailable: !!customerHref, companyAvailable: !!companyHref }));
await browser.close();
