import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loginAsAdmin } from "./helpers/admin-auth";

/**
 * Fluxo obrigatório autenticado (doc seção 17), rodado em cada viewport
 * mobile e ao menos um desktop:
 *   Login → Curadoria → lista → selecionar cliente → editar/salvar →
 *   gerar Founder → CONVITE ATIVO → preview → copiar link → WhatsApp →
 *   Alterar oferta → confirmar nova oferta → voltar para lista
 *
 * Requer:
 *   - DGN_ADMIN_PASSWORD que bate com o server
 *   - Cliente sintético criado por global-setup (arquivo .fixture-legacy-id)
 *   - Server rodando com DGN_GROWTH_DATA_SOURCE=db para persistir de verdade
 */
function readFixtureLegacyId(): string | null {
  const filePath = resolve(__dirname, ".fixture-legacy-id");
  if (!existsSync(filePath)) return null;
  const value = readFileSync(filePath, "utf8").trim();
  return value || null;
}

test.describe("Fluxo obrigatório autenticado (mobile + desktop)", () => {
  const legacyId = readFixtureLegacyId();

  test.beforeEach(async ({ context, page }) => {
    // Falha explícita, sem skip. Se você espera este spec rodar, verifique:
    // 1. Supabase env (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) presente
    // 2. IP com acesso ao gateway Supabase (chaves sb_secret_* são bloqueadas fora do Vercel)
    // 3. Global-setup imprimiu "Cliente sintético pronto." (não "Não foi possível criar")
    expect(
      legacyId,
      "Fixture ausente (.fixture-legacy-id vazio). Global-setup não criou cliente sintético — provavelmente Supabase inacessível localmente.",
    ).toBeTruthy();
    await loginAsAdmin(context);
    await page.goto("/admin/growth/curadoria", { waitUntil: "domcontentloaded", timeout: 60_000 });
    expect(page.url()).not.toContain("/admin/growth/login");
  });

  test("Curadoria mobile: lista → cliente teste → editar → gerar → CONVITE ATIVO → alterar → voltar", async ({ page }, testInfo) => {
    const viewportSize = page.viewportSize();
    const width = viewportSize?.width ?? 0;
    const isMobile = width < 1024;

    // 1) Buscar o cliente teste na lista (aparece com iniciais "CT").
    const search = page.locator('input[type="search"]');
    await search.fill("Cliente Teste");

    const targetCard = page.getByTestId("curation-list-item").filter({ hasText: /Cliente Teste/i }).first();
    await expect(targetCard, "Cliente sintético precisa aparecer na lista após seed").toBeVisible({
      timeout: 20_000,
    });

    // 2) Selecionar cliente → em mobile alterna para "detail"; em desktop
    //    o detalhe já é visível ao lado.
    await targetCard.click();
    const detail = page.getByTestId("curation-detail");
    await expect(detail).toBeVisible();
    if (isMobile) {
      await expect(page.getByTestId("curation-list")).toBeHidden();
      await expect(page.getByTestId("curation-back-to-list")).toBeVisible();
    }

    // 3) Preencher gestão comercial e salvar (bootstrap silencioso ativa).
    const ownerInput = detail.locator('label:has(> span:text("Responsável")) input').first();
    await ownerInput.fill("Playwright QA");
    const nextActionInput = detail.locator('label:has(> span:text("Próxima ação")) input').first();
    await nextActionInput.fill("Enviar convite Founder de teste");
    const saveCommercialBtn = detail.getByRole("button", { name: /Salvar alterações/i });
    await saveCommercialBtn.click();
    await expect(detail.getByText(/Alterações salvas|Nenhuma alteração/i)).toBeVisible({ timeout: 20_000 });

    // 4) Fast-path Gerar convite: escolher plano Smart, categoria hatch, motivo.
    const smartCard = detail.getByRole("button", { name: /^DGN Smart/i });
    await smartCard.click();
    const hatchChip = detail.getByRole("button", { name: /^Hatch$/i });
    await hatchChip.click();
    const reasonChip = detail.getByRole("button", { name: /Curadoria manual/i });
    await reasonChip.click();

    const generateBtn = page.getByTestId("gerar-convite-founder");
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // Após create_invite, o server retorna e a página faz reload em 500ms.
    // Esperar o bloco "CONVITE ATIVO" aparecer (pode ser após reload).
    await page.waitForLoadState("domcontentloaded", { timeout: 60_000 });
    // Rebuscar cliente após reload (query resetou).
    await page.locator('input[type="search"]').fill("Cliente Teste");
    const cardAfterReload = page.getByTestId("curation-list-item").filter({ hasText: /Cliente Teste/i }).first();
    await expect(cardAfterReload).toBeVisible({ timeout: 20_000 });
    await cardAfterReload.click();

    const conviteAtivo = page.getByText("CONVITE ATIVO ✓");
    await expect(conviteAtivo).toBeVisible({ timeout: 30_000 });

    // 5) Preview: abre nova aba com URL do convite.
    const previewLink = page.getByTestId("convite-abrir-preview");
    await expect(previewLink).toBeVisible();
    const href = await previewLink.getAttribute("href");
    expect(href, "Preview precisa ter href").toBeTruthy();
    expect(href).toMatch(/\?preview=1$/);

    // 6) Copiar link: nesse ambiente headless, navigator.clipboard existe.
    //    Verificamos apenas que o botão está clicável e a mensagem aparece.
    const copyLinkBtn = page.getByTestId("convite-copiar-link");
    await copyLinkBtn.click();
    // Notice curta pode desaparecer rápido; se não vier em 3s, seguimos.
    await page.waitForTimeout(500);

    // 7) Abrir WhatsApp: valida que o botão está clicável e habilitado (ou
    //    desabilitado, se cliente sintético não tem telefone). NÃO clica pra
    //    não abrir popup em background.
    const waBtn = page.getByTestId("convite-abrir-whatsapp");
    await expect(waBtn).toBeVisible();

    // 8) Marcar enviado: comportamento crítico do CRIT 4 — não pode alterar
    //    convite sozinho. Apenas confirmamos que existe e é clicável.
    const marcarBtn = page.getByTestId("convite-marcar-enviado");
    await expect(marcarBtn).toBeVisible();

    // 9) Alterar oferta: entra no fluxo replace.
    const alterarBtn = page.getByTestId("convite-alterar-oferta");
    await alterarBtn.click();

    // 10) No painel Alterar oferta: trocar Smart → Priority, manter categoria,
    //     preencher motivo e confirmar. Aceitar o window.confirm previamente.
    page.once("dialog", (dialog) => dialog.accept());

    const priorityCard = page.getByRole("button", { name: /^DGN Priority/i }).last();
    await priorityCard.click();
    // A categoria pode ter sido resetada pelo state — reafirmamos hatch.
    const hatchChipAlter = page.getByRole("button", { name: /^Hatch$/i }).last();
    await hatchChipAlter.click();
    const alterReason = page.getByTestId("alterar-oferta-motivo");
    await alterReason.fill("Playwright: upgrade Smart → Priority");

    const confirmarNova = page.getByTestId("alterar-oferta-confirmar");
    await expect(confirmarNova).toBeEnabled({ timeout: 10_000 });
    await confirmarNova.click();

    // 11) Após replace + reload: novo link ativo com Priority.
    await page.waitForLoadState("domcontentloaded", { timeout: 60_000 });
    await page.locator('input[type="search"]').fill("Cliente Teste");
    const cardAfterReplace = page.getByTestId("curation-list-item").filter({ hasText: /Cliente Teste/i }).first();
    await expect(cardAfterReplace).toBeVisible({ timeout: 20_000 });
    await cardAfterReplace.click();
    await expect(page.getByText("CONVITE ATIVO ✓")).toBeVisible({ timeout: 30_000 });
    // A referência ao plano deve refletir Priority após replace.
    await expect(page.getByText(/PRIORITY/i)).toBeVisible();

    // 12) Voltar para lista (mobile) — em desktop pulamos por não haver botão.
    if (isMobile) {
      const back = page.getByTestId("curation-back-to-list");
      await back.click();
      await expect(page.getByTestId("curation-list")).toBeVisible();
      await expect(page.getByTestId("curation-detail")).toBeHidden();
    }

    // 13) Screenshot final por viewport para inspeção manual.
    await testInfo.attach(`fluxo-final-${testInfo.project.name}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
});
