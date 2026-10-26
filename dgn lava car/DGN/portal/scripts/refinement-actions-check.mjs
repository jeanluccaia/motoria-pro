// Exercises the original reconciler UI using its real parser/classifier in memory.
// The browser never sends an apply request to a database.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { parseReconcileInput } from '../lib/growth/reconcile/parser.ts';
import { reconcile } from '../lib/growth/reconcile/reconciler.ts';
process.loadEnvFile('.env.test.local');
const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3200';
const out = '.playwright-mcp/refinement/actions';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext();
await context.request.post(`${base}/admin/growth/session`, { form: { password: process.env.DGN_ADMIN_PASSWORD }, maxRedirects: 0 });
const blockedWrites = [];
await context.route('**/api/**', async route => {
  const request = route.request();
  if (request.method() === 'GET') return route.continue();
  if (new URL(request.url()).pathname === '/api/admin/growth/subscribers/reconcile') {
    const parsed = parseReconcileInput(request.postDataJSON().text);
    const preview = reconcile({ rows: parsed.rows, customers: [{ id: 'test-customer', name: 'Cliente de teste', phone: '11987654321' }], subscriptions: [], vehicles: [], dataOrigin: 'db', now: new Date('2026-10-26T12:00:00Z') });
    return route.fulfill({ json: { ...preview, unknownHeaders: parsed.unknownHeaders } });
  }
  blockedWrites.push(new URL(request.url()).pathname);
  return route.abort('blockedbyclient');
});
const page = await context.newPage();
const report = [];
try {
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/admin/growth/assinantes/reconciliar`, { waitUntil: 'networkidle' });
    assert(await page.getByRole('button', { name: 'Analisar relatório' }).isDisabled());
    await page.getByLabel('Dados do relatório').fill('nome,telefone,plano,situação,vigência\nCliente de teste,11987654321,Smart,ativo,31/12/2026\nCliente não localizado,11988887777,Priority,ativo,31/12/2026');
    await page.getByRole('button', { name: 'Analisar relatório' }).click();
    await page.getByRole('button', { name: 'Revisar alterações (0)' }).waitFor();
    const checkboxes = page.getByRole('checkbox');
    assert.equal(await checkboxes.count(), 2);
    assert(await checkboxes.nth(1).isDisabled(), 'Unsafe row must stay disabled');
    await page.getByRole('button', { name: 'Abrir detalhe' }).first().click();
    await checkboxes.first().check();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${out}/reconciliation-results-${width}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.equal(overflow, 0);
    await page.getByRole('button', { name: 'Revisar alterações (1)' }).click();
    await page.getByRole('dialog', { name: 'Atualizar 1 assinatura?' }).waitFor();
    await page.screenshot({ path: `${out}/reconciliation-confirm-${width}.png` });
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    assert.equal(await page.getByRole('dialog').count(), 0);
    report.push({ width, analyze: true, safeSelection: true, unsafeRowDisabled: true, confirmation: true, cancel: true, overflow });
  }
  await page.goto(`${base}/admin/growth/assinantes-detectados`, { waitUntil: 'networkidle' });
  await page.getByRole('searchbox', { name: 'Buscar assinantes' }).fill('teste de busca');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.waitForURL(url => url.searchParams.get('q') === 'teste de busca');
  await page.getByRole('link', { name: 'Ativos', exact: true }).click();
  await page.waitForURL(url => url.searchParams.get('status') === 'ativo');
  assert.equal(new URL(page.url()).searchParams.get('q'), 'teste de busca');
  await page.getByTestId('admin-shell-menu-button').click();
  await page.getByRole('navigation', { name: 'Ferramentas do sistema' }).getByRole('link', { name: 'Reconciliação' }).click();
  await page.waitForURL('**/admin/growth/assinantes/reconciliar');
  assert.equal(await page.getByTestId('admin-shell-drawer').count(), 0);
  assert.equal(blockedWrites.length, 0, 'No mutation request should be attempted');
  await writeFile(`${out}/report.json`, JSON.stringify({ report, subscriberSearch: true, filterPreservesSearch: true, systemNavigation: true, mutationRequests: blockedWrites }, null, 2));
  console.log('PASS: analysis, row validation, selection, confirmation and cancellation at 1440/1024/390; zero mutation requests.');
} finally { await browser.close(); }
