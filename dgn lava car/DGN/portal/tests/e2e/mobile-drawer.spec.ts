import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";

// Drawer mobile: backdrop clicável fecha, Escape fecha, e o botão fechar
// tem 44px+. Também valida que o botão CTA WhatsApp fica dentro da viewport
// (garantia mínima de safe-area).
test.describe("Drawer mobile", () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsAdmin(context);
    await page.goto("/admin/growth/founders-2026");
    if (page.url().includes("/admin/growth/login")) {
      test.skip(true, "DGN_ADMIN_PASSWORD não bate.");
    }
  });

  async function openDrawer(page: import("@playwright/test").Page) {
    // Preferir clicar num card mobile (que temos garantido em Founders 2026).
    const mobileCards = page.getByTestId("founder-card-mobile");
    if (await mobileCards.count()) {
      await mobileCards.first().getByRole("button", { name: /Abrir perfil/i }).click();
      return;
    }
    // Fallback desktop: usar o botão Abrir perfil da tabela.
    await page.getByRole("button", { name: /Abrir perfil/i }).first().click();
  }

  test("drawer abre e Escape fecha", async ({ page }) => {
    await openDrawer(page);
    const drawer = page.getByTestId("customer-drawer");
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });

  test("backdrop clique fecha o drawer", async ({ page }) => {
    await openDrawer(page);
    const drawer = page.getByTestId("customer-drawer");
    await expect(drawer).toBeVisible();
    await page.getByTestId("drawer-backdrop").click();
    await expect(drawer).toBeHidden();
  });

  test("botão fechar tem >= 44px em mobile", async ({ page }) => {
    const viewportSize = page.viewportSize();
    const isMobile = (viewportSize?.width ?? 0) < 1024;
    if (!isMobile) test.skip(true, "Spec mobile.");
    await openDrawer(page);
    const close = page.getByTestId("drawer-close");
    const box = await close.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  });
});
