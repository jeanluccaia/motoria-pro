// Visual QA of the original components with isolated in-memory fixtures.
// No server, database, authentication changes or network writes.
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, filename);
const { AgentActionsInbox } = require('../components/growth/AgentActionsInbox.tsx');
const { CompaniesAdmin } = require('../components/growth/CompaniesAdmin.tsx');
const { CompanyDetail } = require('../components/growth/CompanyDetail.tsx');
const { ManagerPortal } = require('../components/portal/ManagerPortal.tsx');
const { NewServiceRequestForm } = require('../components/portal/NewServiceRequestForm.tsx');
const date = '2026-10-26T13:00:00Z';
const company = { id: 'test-company', displayName: 'Empresa de teste', legalName: 'Empresa de teste de apresentação', contactEmail: 'frota@example.test', contactPhone: null, cnpj: null };
const manager = { id: 'test-manager', displayName: 'Gestor de teste', email: 'gestor@example.test', companyId: company.id };
const vehicles = [{ id: 'test-vehicle', companyId: company.id, plate: 'TST0A00', make: 'Veículo', model: 'de teste', year: 2026, driverName: 'Motorista de teste' }];
const request = { id: 'test-request', companyId: company.id, requestedByManagerId: manager.id, fleetVehicleId: vehicles[0].id, serviceType: 'Lavagem completa', preferredDate1: date, preferredDate2: date, createdAt: date, scheduledAt: date, status: 'pending' };
const actions = ['alert', 'opportunity', 'followup_task', 'campaign_draft'].map((kind, i) => ({ id: `test-action-${i}`, kind, title: 'Recomendação de teste para conferência visual', recommendation: 'Revise o cadastro e confirme o próximo atendimento com o cliente.', reason: 'Cenário isolado de teste da interface.', expectedBenefit: 'Organizar o atendimento ao cliente.', nextStep: 'Consultar a ficha antes de decidir.', sourceTool: 'test_fixture', createdAt: date }));
const cases = [
  ['inbox-fixture', AgentActionsInbox, { initialActions: actions }],
  ['companies-fixture', CompaniesAdmin, { companies: [company], pendingByCompany: { [company.id]: 2 } }],
  ['company-fixture', CompanyDetail, { company, managers: [manager], managerLinks: {}, vehicles, requests: [request, { ...request, id: 'test-counter', status: 'counter_proposed' }] }],
  ['manager-fixture', ManagerPortal, { company, manager, vehicles, requests: [request, { ...request, id: 'test-counter', status: 'counter_proposed' }, { ...request, id: 'test-confirmed', status: 'confirmed' }] }],
  ['request-fixture', NewServiceRequestForm, { vehicles }],
];
const out = '.playwright-mcp/refinement/components';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3200';
await page.goto(`${base}/admin/growth/login`, { waitUntil: 'networkidle' });
const styles = await page.locator('link[rel=stylesheet]').evaluateAll(links => links.map(l => l.href));
const css = (await Promise.all(styles.map(url => page.request.get(url).then(r => r.text())))).join('\n') + readFileSync('components/growth/portal-ui.css', 'utf8');
const report = [];
try {
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [slug, Component, props] of cases) {
      const markup = renderToStaticMarkup(React.createElement(Component, props));
      await page.setContent(`<html class="dark" lang="pt-BR"><head><style>${css}</style></head><body style="background:#080808;color:white;font-family:Arial,sans-serif"><main class="dgn-content dgn-manager dgn-page"><p style="color:#999;font-size:12px">VERIFICAÇÃO VISUAL · DADOS ISOLADOS DE TESTE</p><h1>${slug}</h1>${markup}</main></body></html>`);
      await page.screenshot({ path: path.join(out, `${slug}-${width}.png`), fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      report.push({ slug, width, overflow });
      if (overflow > 0) process.exitCode = 1;
      console.log(`${slug} ${width}: overflow ${overflow}px`);
    }
  }
  writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
} finally { await browser.close(); }
