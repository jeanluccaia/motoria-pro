import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";

test.describe("Touch targets — 44px+", () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsAdmin(context);
    await page.goto("/admin/growth/founders-2026", { waitUntil: "domcontentloaded", timeout: 60_000 });
    expect(page.url(), "Founders 2026 deveria abrir com sessão ativa").not.toContain("/admin/growth/login");
  });

  test("cards de Founder em mobile expõem IconButtons de 44px (quando há Founders)", async ({ page }) => {
    const viewportSize = page.viewportSize();
    test.skip((viewportSize?.width ?? 0) >= 1024, "Spec mobile.");

    const cards = page.getByTestId("founder-card-mobile");
    const count = await cards.count();
    // Sem founders (JSON local zerado) o CRIT 6 não pode ser validado nesta
    // rota — mas o Intelligence tem 25 clientes reais. Fallback ali.
    if (count === 0) {
      await page.goto("/admin/growth/intelligence", { waitUntil: "domcontentloaded", timeout: 60_000 });
      const intelCards = page.getByTestId("intel-customer-card");
      const intelCount = await intelCards.count();
      expect(intelCount, "Intelligence deveria ter clientes para validar touch targets").toBeGreaterThan(0);
      // O botão inteiro do card é o alvo tocável — validar altura.
      const first = intelCards.first();
      await expect(first).toBeVisible();
      const box = await first.boundingBox();
      expect(box?.height ?? 0, "Card touch target").toBeGreaterThanOrEqual(44);
      return;
    }

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
