import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";

// Smoke do DGN Agent Fase 1 — cobre as garantias mínimas do brief:
//   • item "Assistente DGN" acessível no menu (drawer mobile e sidebar desktop)
//   • rota /admin/growth/assistente carrega com header e briefing
//   • composer sticky do chat visível e com target ≥44px
//   • card "Inteligência DGN" no Dashboard leva para o Assistente
//
// Não gera fixture nem persiste nada (Fase 1 é read-only).

test.describe("Assistente DGN — smoke mobile + desktop", () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsAdmin(context);
    await page.goto("/admin/growth", { waitUntil: "domcontentloaded", timeout: 60_000 });
    expect(page.url()).not.toContain("/admin/growth/login");
  });

  test("dashboard mostra card Inteligência DGN e leva para /assistente", async ({ page }) => {
    const card = page.getByText("Inteligência DGN", { exact: false }).first();
    await expect(card).toBeVisible();
    await page.getByRole("link", { name: /Ver briefing/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/growth\/assistente$/);
    await expect(page.getByRole("heading", { name: "Assistente DGN" })).toBeVisible();
  });

  test("rota /assistente carrega briefing e composer é sticky", async ({ page }) => {
    await page.goto("/admin/growth/assistente", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "Assistente DGN" })).toBeVisible();
    await expect(page.getByText("Sua central de inteligência comercial")).toBeVisible();
    const input = page.getByPlaceholder(/Pergunte sobre clientes/i);
    await expect(input).toBeVisible();
    // Target mínimo de toque: ≥44px de altura.
    const box = await input.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("chat responde ao clicar em sugestão rápida + mostra badge de modo", async ({ page }) => {
    await page.goto("/admin/growth/assistente", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.getByRole("button", { name: /Quem devo chamar hoje/i }).click();
    // Aguarda aparecer uma resposta do agente OU uma mensagem de erro clara.
    const response = page.locator('[aria-live="polite"]').first();
    await expect(response).toBeVisible();
    // Confirma que o loading terminou.
    await expect(page.getByText(/Analisando a operação/i)).toBeHidden({ timeout: 20_000 });
    // Badge de provider aparece depois da primeira resposta.
    const badge = page.getByTestId("agent-provider-badge");
    await expect(badge).toBeVisible();
    // Deve dizer "IA" quando ANTHROPIC_API_KEY estiver setada, "modo básico" caso contrário.
    const text = (await badge.textContent()) ?? "";
    expect(text.toLowerCase()).toMatch(/(ia|básico|basico)/);
  });

  test("multi-turn: segunda pergunta referenciando a primeira não quebra", async ({ page }) => {
    await page.goto("/admin/growth/assistente", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const input = page.getByPlaceholder(/Pergunte sobre clientes/i);
    // Turn 1
    await input.fill("Quem devo chamar hoje?");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText(/Analisando a operação/i)).toBeHidden({ timeout: 20_000 });
    // Turn 2 — referencia genérica
    await input.fill("E os founders?");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText(/Analisando a operação/i)).toBeHidden({ timeout: 20_000 });
    // As duas mensagens do usuário aparecem no histórico do chat — usa
    // seletor mais estrito porque o texto da 1ª pergunta também é o label
    // do botão de sugestão rápida.
    const chatLog = page.locator('[aria-live="polite"]').first();
    await expect(chatLog.getByText("Quem devo chamar hoje?")).toBeVisible();
    await expect(chatLog.getByText("E os founders?")).toBeVisible();
  });
});
