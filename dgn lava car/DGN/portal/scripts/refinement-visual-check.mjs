// Read-only visual review of the original portal. No fixture setup or database writes.
import { chromium } from 'playwright';
import nextEnv from '@next/env';
import { mkdir, writeFile } from 'node:fs/promises';

process.loadEnvFile('.env.test.local');
nextEnv.loadEnvConfig(process.cwd(), true);
const phase = process.argv[2] ?? 'after';
const routeFilter = process.argv[3]?.split(',');
const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3200';
const out = `.playwright-mcp/refinement/${phase}`;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
await context.route('**/api/**', route => {
  if (['GET', 'HEAD'].includes(route.request().method())) return route.continue();
  if (new URL(route.request().url()).pathname === '/api/admin/growth/subscribers/reconcile') return route.continue();
  return route.abort('blockedbyclient');
});
const login = await context.request.post(`${base}/admin/growth/session`, {
  form: { password: process.env.DGN_ADMIN_PASSWORD ?? '' }, maxRedirects: 0,
});
if (![302, 303, 307].includes(login.status()) || !login.headers()['set-cookie']) throw new Error(`Admin login failed (${login.status()})`);
const page = await context.newPage();
await page.addInitScript(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.__reviewCopiedLink = text; } }, configurable: true });
});
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const routes = [
  ['dashboard', '/admin/growth'],
  ['reconciliation', '/admin/growth/assinantes/reconciliar'],
  ['inbox', '/admin/growth/intelligence/inbox'],
  ['subscribers', '/admin/growth/assinantes-detectados'],
  ['curation', '/admin/growth/curadoria'],
  ['customers', '/admin/growth/intelligence'],
  ['companies', '/admin/growth/empresas'],
  ['manager', '/empresa'],
];
const report = [];
try {
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [slug, route] of routes) {
      if (routeFilter && !routeFilter.includes(slug)) continue;
      const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 120000 });
      await page.screenshot({ path: `${out}/${slug}-${width}.png`, fullPage: true });
      if (slug !== 'manager' && page.url().includes('/login')) throw new Error(`Unexpected login redirect: ${slug}`);
      const layout = await page.evaluate(() => ({
        width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        heading: document.querySelector('h1')?.textContent?.trim(),
      }));
      report.push({ slug, width, status: response.status(), ...layout });
      console.log(`${phase}: ${slug} ${width} · HTTP ${response.status()} · overflow ${layout.scrollWidth - width}px`);
      if (width === 1440 && slug === 'subscribers') {
        const customer = await page.locator('a[href*="/customers/"]').first().getAttribute('href').catch(() => null);
        if (customer && !routes.some(([s]) => s === 'customer')) routes.push(['customer', customer]);
      }
      if (width === 1440 && slug === 'curation') {
        const customerId = await page.getByTestId('curation-list-item').first().getAttribute('data-customer-id').catch(() => null);
        if (customerId && !routes.some(([s]) => s === 'customer')) routes.push(['customer', `/admin/growth/customers/${encodeURIComponent(customerId)}`]);
      }
      if (width === 1440 && slug === 'companies') {
        const company = await page.locator('a[href*="/empresas/"]').first().getAttribute('href').catch(() => null);
        if (company && !routes.some(([s]) => s === 'company')) routes.push(['company', company]);
      }
      if (width === 1440 && slug === 'company' && await page.getByTestId('btn-copy-manager-link').count()) {
        await page.getByTestId('btn-copy-manager-link').first().click();
        const managerLink = await page.evaluate(() => window.__reviewCopiedLink);
        if (managerLink) {
          await page.goto(managerLink, { waitUntil: 'networkidle' });
          routes.push(['manager-auth', '/empresa'], ['manager-request', '/empresa/solicitar']);
        }
      }
    }
  }
  await writeFile(`${out}/${routeFilter ? 'report-copy-review' : 'report'}.json`, JSON.stringify({ report, errors }, null, 2));
  if (errors.length || report.some(r => r.status >= 400 || r.scrollWidth > r.width)) process.exitCode = 1;
} finally {
  await browser.close();
}
