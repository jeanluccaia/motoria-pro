import { expect, type BrowserContext } from "@playwright/test";

// Requer `DGN_ADMIN_PASSWORD` no ambiente do processo Playwright. NÃO tem
// fallback silencioso — se estiver ausente, o helper lança erro imediato para
// que a suite falhe explicitamente em vez de esconder problema de config.
export function testAdminPassword() {
  const password = process.env.DGN_ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "DGN_ADMIN_PASSWORD ausente no ambiente. Rode com DGN_ADMIN_PASSWORD=... npx playwright test",
    );
  }
  return password;
}

export async function loginAsAdmin(context: BrowserContext) {
  const page = await context.newPage();
  await page.goto("/admin/growth/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator('input[name="password"]').fill(testAdminPassword());
  await Promise.all([
    page.waitForURL(/\/admin\/growth(\/?|$)/, { timeout: 30_000 }),
    page.locator('button[type="submit"]').click(),
  ]);
  // Sanity: se login falhou, a URL volta com ?error=invalid — falha aqui é bug,
  // não é motivo para skip.
  expect(page.url(), "Login deveria redirecionar para /admin/growth (fora de /login)").not.toContain("/admin/growth/login");
  await page.close();
}
