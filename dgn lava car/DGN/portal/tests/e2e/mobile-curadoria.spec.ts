import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";

// Requer o dev server rodar com DGN_ADMIN_PASSWORD=<algo> conhecido.
// Se não houver senha, skipa para não travar CI em ambientes sem env.
test.describe("Curadoria mobile — lista → detalhe → voltar", () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsAdmin(context);
    // Vai direto pra Curadoria após autenticar.
    await page.goto("/admin/growth/curadoria");
    if (page.url().includes("/admin/growth/login")) {
      test.skip(true, "DGN_ADMIN_PASSWORD não bate com o dev server — spec ignorado.");
    }
  });

  test("mostra apenas a lista ao entrar (em mobile)", async ({ page }) => {
    const viewportSize = page.viewportSize();
    const isMobile = (viewportSize?.width ?? 0) < 1024;
    if (!isMobile) {
      test.skip(true, "Spec mobile — pulado em desktop.");
    }
    const list = page.getByTestId("curation-list");
    const detail = page.getByTestId("curation-detail");
    await expect(list).toBeVisible();
    await expect(detail).toBeHidden();
  });

  test("desktop mostra lista + detalhe lado a lado", async ({ page }) => {
    const viewportSize = page.viewportSize();
    const isDesktop = (viewportSize?.width ?? 0) >= 1024;
    if (!isDesktop) {
      test.skip(true, "Spec desktop — pulado em mobile.");
    }
    await expect(page.getByTestId("curation-list")).toBeVisible();
    await expect(page.getByTestId("curation-detail")).toBeVisible();
  });

  test("toque em cliente vai pra tela detalhe; botão voltar retorna à lista", async ({ page }) => {
    const viewportSize = page.viewportSize();
    const isMobile = (viewportSize?.width ?? 0) < 1024;
    if (!isMobile) {
      test.skip(true, "Spec mobile.");
    }
    const firstCard = page.getByTestId("curation-list-item").first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    const detail = page.getByTestId("curation-detail");
    await expect(detail).toBeVisible();
    await expect(page.getByTestId("curation-list")).toBeHidden();

    const back = page.getByTestId("curation-back-to-list");
    await expect(back).toBeVisible();
    const box = await back.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    await back.click();

    await expect(page.getByTestId("curation-list")).toBeVisible();
    await expect(detail).toBeHidden();
  });
});
