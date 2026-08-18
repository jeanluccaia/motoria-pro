import { defineConfig } from "@playwright/test";
import { Module } from "node:module";

// Config alternativo para rodar apenas testes unitários (sem servidor Next).
// Usado por: npx playwright test -c playwright.unit.config.ts

// Stub em runtime: substitui o pacote `server-only` por um objeto vazio.
// Em produção o Next impede uso do módulo em Client Components; em Node
// puro (Playwright) o pacote real sempre throw. A proteção real de
// server-only é `process.env.SECRET` — que não existe em bundle de browser.
type ResolveFn = (request: string, ...rest: unknown[]) => string;
type ModuleWithResolve = { _resolveFilename: ResolveFn };
const modulePriv = Module as unknown as ModuleWithResolve;
const originalResolve = modulePriv._resolveFilename;
modulePriv._resolveFilename = function (request: string, ...rest: unknown[]) {
  if (request === "server-only") {
    return require.resolve("./tests/support/server-only-stub.js");
  }
  return originalResolve.call(this, request, ...rest);
};

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: true,
  workers: 2,
  reporter: [["list"]],
  // Sem webServer: nenhum teste desta suíte precisa de HTTP contra o app.
});
