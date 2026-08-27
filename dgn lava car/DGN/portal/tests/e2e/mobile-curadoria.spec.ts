import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";

test.describe("Curadoria mobile — lista → detalhe → voltar", () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsAdmin(context);
    await page.goto("/admin/growth/curadoria", { waitUntil: "domcontentloaded", timeout: 60_000 });
    // Se o middleware redirecionar para login com senha correta, é bug —
    // não faz sentido skip aqui.
    expect(page.url(), "Curadoria deveria abrir com sessão ativa").not.toContain("/admin/growth/login");
  });

  test("mostra apenas a lista ao entrar (em mobile)", async ({ page }) => {
    const viewportSize = page.viewportSize();
    test.skip((viewportSize?.width ?? 0) >= 1024, "Spec mobile — pulado em desktop.");
    const list = page.getByTestId("curation-list");
    const detail = page.getByTestId("curation-detail");
    await expect(list).toBeVisible();
    await expect(detail).toBeHidden();
  });

  test("desktop mostra lista + detalhe lado a lado", async ({ page }) => {
    const viewportSize = page.viewportSize();
    test.skip((viewportSize?.width ?? 0) < 1024, "Spec desktop — pulado em mobile.");
    await expect(page.getByTestId("curation-list")).toBeVisible();
    await expect(page.getByTestId("curation-detail")).toBeVisible();
  });

  test("toque em cliente vai pra tela detalhe; botão voltar retorna à lista (mobile)", async ({ page }) => {
    const viewportSize = page.viewportSize();
    test.skip((viewportSize?.width ?? 0) >= 1024, "Spec mobile.");
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
