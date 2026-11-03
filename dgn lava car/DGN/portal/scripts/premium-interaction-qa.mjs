import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

process.loadEnvFile('.env.development.local');
const base = 'http://localhost:3200';
const out = resolve('artifacts/premium/interactions');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const checks = [];
const blockedWrites = [];
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(120000);
  await page.goto(`${base}/admin/growth/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name=password]').fill(process.env.DGN_ADMIN_PASSWORD);
  await page.locator('button[type=submit]').click();
  await page.waitForURL(url => url.pathname === '/admin/growth');

  // Business mutations are blocked in this browser, even if a control regresses.
  await page.route('**/api/**', async route => {
    const request = route.request();
    if (!['GET', 'HEAD'].includes(request.method()) && !request.url().endsWith('/subscribers/reconcile')) {
      blockedWrites.push(request.url().replace(base, ''));
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });

  for (const width of [1440, 1024, 390]) {
    console.log(`Interações: ${width}px`);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto(`${base}/admin/growth/assinantes/reconciliar`, { waitUntil: 'networkidle' });
    const nav = width < 1024 ? page.getByTestId('admin-shell-drawer') : page.getByTestId('admin-shell-sidebar');
    if (width < 1024) await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
    assert.equal(await nav.getByTestId('admin-shell-nav').getByRole('link', { name: /Reconciliação|Diagnósticos/ }).count(), 0);
    assert.equal(await nav.getByTestId('admin-shell-tools').getByRole('link').count(), 2);
    assert.equal(await nav.getByTestId('admin-shell-tools').getByRole('link', { name: 'Reconciliação', exact: true }).getAttribute('aria-current'), 'page');
    if (width < 1024) {
      await page.keyboard.press('Escape');
      assert.equal(await page.getByTestId('admin-shell-drawer').count(), 0);
    }
    assert.equal(await page.getByRole('heading', { name: 'Reconciliação de assinaturas', exact: true }).count(), 1);
    assert.equal(await page.locator('textarea').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Analisar relatório', exact: true }).isDisabled(), true);
    await page.locator('input[type=file]').setInputFiles({ name: 'somente-cabecalhos.csv', mimeType: 'text/csv', buffer: Buffer.from('nome,telefone,plano,situação,vigência\n') });
    await page.getByText('somente-cabecalhos.csv', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Analisar relatório', exact: true }).isEnabled(), true);
    const responsePromise = page.waitForResponse(r => r.url().endsWith('/subscribers/reconcile') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Analisar relatório', exact: true }).click();
    const response = await responsePromise;
    assert.equal(response.status(), 200);
    assert.equal((await response.json()).totalRows, 0);
    await page.getByRole('button', { name: 'Revisar seleção (0)', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Revisar seleção (0)', exact: true }).isDisabled(), true);
    checks.push({ width, check: 'Navegação, upload real e análise sem alterações', passed: true });

    // Synthetic network fixture ONLY in this test browser. Never reaches the DB.
    // Exercises the existing explicit review and stale-selection guard.
    const fixture = {
      totalRows: 1, dataOrigin: 'db', summary: 'Fixture de teste',
      counts: { ALREADY_CORRECT: 0, PROMOTE_EXISTING: 1, CREATE_NEW: 0, UPDATE_EXISTING_REVIEW: 0, RENEWAL_PENDING: 0, CUSTOMER_NOT_FOUND: 0, POSSIBLE_MATCH: 0, CONFLICT: 0 },
      items: [{ rowIndex: 0, input: { name: 'Fixture de teste', plan: 'Smart', status: 'ativo' }, customer: { customerId: 'fixture-test-only', customerName: 'Fixture de teste', strategy: 'phone', legacyId: null, ambiguousIds: [], reason: 'Fixture de teste' }, classification: 'PROMOTE_EXISTING', reason: 'Assinatura existente para revisão.', applyEnabled: true, facts: { matchedByPhone: true, matchedByPlate: false, matchedByLegacyId: false, matchedByName: false, fuzzyName: false, ambiguousCandidates: 0, subscriptionMatch: null, planReported: 'Smart', planCanonical: 'Smart', cycleEndsAtReported: null, cycleEndsAtCurrent: null, divergingFields: [], missingFields: [] }, proposed: { kind: 'PROMOTE_EXISTING', subscriptionId: 'fixture-sub-test-only', expectedCustomerId: 'fixture-test-only', paymentStatus: 'unknown', paymentEvidenceSource: 'unknown', cycleEndsAtIso: null, sourceReference: 'fixture-test-only', notesAppend: null } }],
    };
    await page.route('**/api/admin/growth/subscribers/reconcile', route => route.fulfill({ status: 200, json: fixture }));
    await page.getByRole('button', { name: 'Colar dados', exact: true }).click();
    await page.getByRole('textbox', { name: 'Dados da planilha', exact: true }).fill('nome,plano\nFixture de teste,Smart');
    await page.getByRole('button', { name: 'Analisar relatório', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Selecionar alteração de Fixture de teste' }).check();
    await page.getByRole('button', { name: 'Revisar seleção (1)', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Confirmar 1 alteração?', exact: true });
    await dialog.waitFor();
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.equal(blockedWrites.length, 0);
    await page.getByRole('button', { name: /Abrir detalhes de Fixture/ }).click();
    assert.equal(await page.getByText('Ativar a assinatura existente', { exact: true }).count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    // Keep fixture captures separate and explicitly labeled; handoff uses live captures.
    await page.screenshot({ path: resolve(out, `test-fixture-reconciliation-${width}.png`), fullPage: true, animations: 'disabled' });
    await page.getByRole('textbox', { name: 'Dados da planilha', exact: true }).fill('nome,plano\nOutro conteúdo,Smart');
    assert.equal(await page.getByRole('checkbox').count(), 0);
    assert.equal(await page.getByText('Resultado da análise', { exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Arquivo', exact: true }).click();
    await page.locator('input[type=file]').setInputFiles({ name: 'vazio.csv', mimeType: 'text/csv', buffer: Buffer.from('') });
    await page.getByRole('alert').filter({ hasText: 'O arquivo está vazio' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Analisar relatório', exact: true }).isDisabled(), true);
    await page.unroute('**/api/admin/growth/subscribers/reconcile');
    checks.push({ width, check: 'Revisão cancelável, detalhes responsivos, troca de dados invalida seleção e arquivo vazio bloqueado (fixture isolada)', passed: true });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/admin/growth/intelligence`, { waitUntil: 'networkidle' });
  const search = page.getByRole('textbox', { name: 'Buscar clientes', exact: true });
  await search.fill('zzzz_sem_correspondencia_qa');
  await page.getByText('Nenhum cliente com estes filtros.', { exact: true }).first().waitFor();
  await search.fill('');
  await page.getByTestId('intel-customer-card').first().click();
  await page.getByTestId('customer-drawer').waitFor();
  await page.getByTestId('drawer-close').click();
  assert.equal(await page.getByTestId('customer-drawer').count(), 0);
  checks.push({ check: 'Busca de clientes e abertura/fechamento da ficha no celular', passed: true });

  await page.goto(`${base}/admin/growth/assinantes-detectados`, { waitUntil: 'networkidle' });
  const customer = page.locator('.dgn-subscriber-table a[href^="/admin/growth/customers/"]').first();
  const customerName = await customer.textContent();
  const customerHref = await customer.getAttribute('href');
  await page.getByRole('searchbox', { name: 'Buscar assinante' }).fill(customerName.trim());
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.waitForURL(url => url.searchParams.has('q'));
  assert.ok(await page.locator('.dgn-subscriber-table tbody tr').count() > 0);
  await page.getByRole('link', { name: 'Ativos', exact: true }).click();
  await page.waitForURL(url => url.searchParams.get('status') === 'ativo');
  assert.equal(new URL(page.url()).searchParams.get('q'), customerName.trim());
  await page.goto(`${base}${customerHref}`, { waitUntil: 'networkidle' });
  await page.getByRole('navigation', { name: 'Seções da ficha do cliente' }).getByRole('link', { name: 'Assinaturas', exact: true }).click();
  assert.equal(new URL(page.url()).hash, '#customer-section-2');
  const offer = page.getByTestId('customer-offer-subscription');
  if (await offer.count()) {
    await offer.click();
    const closeBox = await page.getByRole('dialog').getByRole('button', { name: 'Fechar', exact: true }).boundingBox();
    assert.ok(closeBox && closeBox.y >= 0 && closeBox.y + closeBox.height <= 844);
    await page.screenshot({ path: resolve(out, 'offer-mobile-live.png'), animations: 'disabled' });
    await page.getByRole('dialog').getByRole('button', { name: 'Fechar', exact: true }).click();
  }
  checks.push({ check: 'Busca de assinantes, filtros preservam busca, atalhos 360° e oferta sem gravação', passed: true });
  for (const status of ['pending_review', 'approved', 'executed', 'rejected']) {
    await page.goto(`${base}/admin/growth/intelligence/inbox?status=${status}`, { waitUntil: 'networkidle' });
    assert.equal(await page.getByRole('navigation', { name: 'Etapas das ações comerciais' }).locator('a[aria-current=page]').count(), 1);
  }
  checks.push({ check: 'Etapas de revisão, aprovação, execução registrada e rejeição acessíveis sem gravação', passed: true });
  assert.equal(blockedWrites.length, 0);
  writeFileSync(resolve(out, 'report.json'), JSON.stringify({ checks, blockedWrites, businessWritesSent: 0 }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, businessWritesSent: 0, checks }, null, 2));
} finally { await browser.close(); }
