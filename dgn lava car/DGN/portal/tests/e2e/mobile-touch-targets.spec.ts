import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";

// Verifica que os principais botões operacionais têm altura >= 44px em mobile.
test.describe("Touch targets — 44px+", () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsAdmin(context);
    await page.goto("/admin/growth/founders-2026");
    if (page.url().includes("/admin/growth/login")) {
      test.skip(true, "DGN_ADMIN_PASSWORD não bate — spec ignorado.");
    }
  });

  test("cards de Founder em mobile expõem IconButtons de 44px", async ({ page }) => {
    const viewportSize = page.viewportSize();
    const isMobile = (viewportSize?.width ?? 0) < 1024;
    if (!isMobile) test.skip(true, "Spec mobile.");

    const cards = page.getByTestId("founder-card-mobile");
    const count = await cards.count();
    if (count === 0) test.skip(true, "Sem Founders para validar.");

    const first = cards.first();
    await expect(first).toBeVisible();
    const btns = first.getByRole("button", { name: /Abrir perfil|Abrir WhatsApp|Copiar mensagem|Copiar link/i });
    const btnCount = await btns.count();
    for (let index = 0; index < btnCount; index += 1) {
      const box = await btns.nth(index).boundingBox();
      expect(box?.height ?? 0, `botão índice ${index} altura`).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0, `botão índice ${index} largura`).toBeGreaterThanOrEqual(44);
    }
  });
});
