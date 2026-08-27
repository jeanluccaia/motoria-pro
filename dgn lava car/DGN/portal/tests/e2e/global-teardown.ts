/**
 * Purga de clientes sintéticos é feita per-test em `afterEach`. Nada global
 * a limpar aqui; mantemos o hook vazio para preservar simetria com globalSetup
 * e evitar quebrar `playwright.config.ts` caso volte a ser necessário.
 */
export default async function globalTeardown() {}
