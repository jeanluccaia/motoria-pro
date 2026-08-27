import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";

test.describe("Drawer mobile + desktop", () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsAdmin(context);
    // Intelligence sempre tem cards (JSON ou DB), enquanto Founders 2026 pode
    // ter 0 em ambientes sem seed. Drawer aparece do onOpenProfile igual em ambas.
    await page.goto("/admin/growth/intelligence", { waitUntil: "domcontentloaded", timeout: 60_000 });
    expect(page.url(), "Intelligence deveria abrir com sessão ativa").not.toContain("/admin/growth/login");
  });

  async function openDrawer(page: import("@playwright/test").Page) {
    // Mobile (<lg): cards verticais visíveis; Desktop (>=lg): tabela com botão "Abrir".
    await page.waitForLoadState("networkidle").catch(() => undefined);
    const mobileCard = page.getByTestId("intel-customer-card").first();
    const visible = await mobileCard.isVisible().catch(() => false);
    if (visible) {
      await mobileCard.click();
    } else {
      await page.getByRole("button", { name: /^Abrir$/ }).first().click();
    }
    // Garantir que drawer subiu antes de retornar.
    await page.getByTestId("customer-drawer").waitFor({ state: "visible", timeout: 20_000 });
  }

  test("drawer abre e Escape fecha", async ({ page }) => {
    await openDrawer(page);
    const drawer = page.getByTestId("customer-drawer");
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });

  test("botão fechar tem >= 44px em mobile", async ({ page }) => {
    const viewportSize = page.viewportSize();
    test.skip((viewportSize?.width ?? 0) >= 1024, "Spec mobile.");
    await openDrawer(page);
    const close = page.getByTestId("drawer-close");
    const box = await close.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("backdrop clique fecha o drawer (desktop)", async ({ page }) => {
    const viewportSize = page.viewportSize();
    // Em mobile o drawer é `w-full` (ocupa a tela toda) — o backdrop fica atrás
    // dele sem área visível para clicar. Comportamento intencional: mobile fecha
    // pelo botão X ou Escape. Este teste vale só em breakpoints com backdrop
    // visível (>= sm, mas mantemos >= 1024 para simplicidade).
    test.skip((viewportSize?.width ?? 0) < 1024, "Backdrop clique só em desktop.");
    await openDrawer(page);
    const drawer = page.getByTestId("customer-drawer");
    await expect(drawer).toBeVisible();
    // Clicar fora do drawer — usar coordenadas em x=100 (à esquerda do drawer).
    await page.mouse.click(100, 100);
    await expect(drawer).toBeHidden();
  });
});
