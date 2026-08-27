import { expect, test } from "@playwright/test";

// Página de login admin — pura client-side, não depende de Supabase/DB.
// Serve como smoke visual e de touch targets para o app inteiro em mobile.
// Rotas /founders/[slug] dependem de crm_founder_public_links populado no DB —
// não são adequadas para testes locais sem seed. Rode manualmente em preview.
test.describe("Página pública admin login — smoke mobile", () => {
  test("sem overflow horizontal", async ({ page }) => {
    await page.goto("/admin/growth/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = page.viewportSize()?.width ?? scrollWidth;
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("input de senha tocável (>=44px altura)", async ({ page }) => {
    await page.goto("/admin/growth/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const input = page.locator('input[name="password"]');
    await expect(input).toBeVisible();
    const box = await input.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
  });

  test("botão Entrar tocável (>=44px altura)", async ({ page }) => {
    await page.goto("/admin/growth/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const submit = page.locator('button[type="submit"]');
    await expect(submit).toBeVisible();
    const box = await submit.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
  });
});
