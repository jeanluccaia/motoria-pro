import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import Module from 'node:module';
import { resolve } from 'node:path';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Isolated component rendering; no network and no operational data.
const path = resolve('components/growth/AgentActionsInbox.tsx');
const compiled = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const component = new Module(path);
component.filename = path;
component.paths = Module._nodeModulePaths(resolve('components/growth'));
component.require = createRequire(path);
component._compile(compiled.outputText, path);
const { AgentActionsInbox } = component.exports;
for (const status of ['pending_review', 'approved', 'executed', 'rejected', 'archived']) {
  const html = renderToStaticMarkup(React.createElement(AgentActionsInbox, { initialActions: [{ id: 'test-only', title: 'Fixture de teste', recommendation: 'Fixture de teste', reason: 'Fixture de teste', kind: 'campaign_draft', status, createdAt: '2026-01-01T00:00:00Z' }] }));
  assert.equal(html.includes('data-testid="btn-approve"'), status === 'pending_review');
  assert.equal(html.includes('data-testid="btn-reject"'), status === 'pending_review');
  assert.equal(html.includes('data-testid="btn-execute"'), ['pending_review', 'approved'].includes(status));
  if (status === 'approved') assert.ok(html.includes('execução não registrada'));
  if (status === 'executed') assert.ok(html.includes('Execução registrada'));
}
console.log('5 estados comerciais: controles e histórico verificados, sem rede.');
