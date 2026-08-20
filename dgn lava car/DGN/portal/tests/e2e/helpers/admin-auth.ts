import { expect, type BrowserContext, type Page } from "@playwright/test";

const DEFAULT_TEST_PASSWORD = "dgn-mobile-test-2026";

export function testAdminPassword() {
  return process.env.DGN_ADMIN_PASSWORD ?? DEFAULT_TEST_PASSWORD;
}

// Faz login via POST no /admin/growth/session. Depende do dev server rodar
// com DGN_ADMIN_PASSWORD igual a testAdminPassword().
export async function loginAsAdmin(context: BrowserContext) {
  const page = await context.newPage();
  await page.goto("/admin/growth/login");
  await page.locator('input[name="password"]').fill(testAdminPassword());
  await Promise.all([
    page.waitForURL(/\/admin\/growth(\/?|$)/),
    page.locator('button[type="submit"]').click(),
  ]);
  await page.close();
}

export async function skipIfLoginFails(page: Page): Promise<boolean> {
  await page.goto("/admin/growth/curadoria");
  const url = page.url();
  if (url.includes("/admin/growth/login")) {
    return true; // sinaliza para o caller pular
  }
  await expect(page.locator("body")).toBeVisible();
  return false;
}
