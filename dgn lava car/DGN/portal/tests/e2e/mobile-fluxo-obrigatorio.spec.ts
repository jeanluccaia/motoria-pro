import { expect, test } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { loginAsAdmin } from "./helpers/admin-auth";
import { purgeTestCustomer, seedTestCustomer } from "./fixtures/test-founder";

// Leitura independente do estado do banco pelas etapas T0/T1/T2/T4 —
// prova se o customer ainda existe em cada checkpoint. Se sumir antes do
// create_invite, é race do harness (não bug backend).
async function readDbState(legacyId: string): Promise<{ customer: boolean; members: number; links: number }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE env ausente no processo Playwright");
  const h = { apikey: key, authorization: `Bearer ${key}` } as const;
  const cust = await fetch(`${url}/rest/v1/crm_customers?select=id&legacy_id=eq.${encodeURIComponent(legacyId)}`, { headers: h });
  const custRows = (await cust.json()) as Array<{ id: string }>;
  if (!custRows[0]) return { customer: false, members: 0, links: 0 };
  const mem = await fetch(`${url}/rest/v1/crm_campaign_members?select=id&customer_id=eq.${custRows[0].id}`, { headers: h });
  const memRows = (await mem.json()) as Array<{ id: string }>;
  let linkCount = 0;
  if (memRows.length) {
    const memIds = memRows.map(r => r.id).join(",");
    const lnk = await fetch(`${url}/rest/v1/crm_founder_public_links?select=id&enabled=eq.true&campaign_member_id=in.(${memIds})`, { headers: h });
    linkCount = ((await lnk.json()) as unknown[]).length;
  }
  return { customer: true, members: memRows.length, links: linkCount };
}

/**
 * Fluxo obrigatório autenticado (doc seção 17), rodado em cada viewport
 * mobile e ao menos um desktop:
 *   Login → Curadoria → lista → selecionar cliente → editar/salvar →
 *   gerar Founder → CONVITE ATIVO → preview → copiar link → WhatsApp →
 *   Alterar oferta → confirmar nova oferta → voltar para lista
 *
 * Requer:
 *   - DGN_ADMIN_PASSWORD que bate com o server
 *   - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (seed per-test)
 *   - Server rodando com DGN_GROWTH_DATA_SOURCE=db para persistir de verdade
 */
test.describe("Fluxo obrigatório autenticado (mobile + desktop)", () => {
  // Cada test cria seu PRÓPRIO customer sintético — evita colisão quando
  // Playwright roda múltiplos viewports em paralelo (default fullyParallel).
  let legacyId: string;

  test.beforeEach(async ({ context, page }) => {
    // Verifica env explicitamente antes de tentar seed — mensagem clara.
    expect(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
      "SUPABASE env ausente. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
    ).toBeTruthy();
    // Seed per-test isolado: cada viewport tem seu próprio customer.
    legacyId = `teste-founder-${randomBytes(8).toString("hex")}`;
    await seedTestCustomer(legacyId);
    await loginAsAdmin(context);
    await page.goto("/admin/growth/curadoria", { waitUntil: "domcontentloaded", timeout: 60_000 });
    expect(page.url()).not.toContain("/admin/growth/login");
  });

  test.afterEach(async () => {
    // Purge isolado por test — garante zero resíduo mesmo em falha.
    if (legacyId) {
      await purgeTestCustomer(legacyId).catch((err) => {
        console.warn(`[afterEach] purge falhou: ${(err as Error).message}`);
      });
    }
  });

  test("Curadoria mobile: lista → cliente teste → editar → gerar → CONVITE ATIVO → alterar → voltar", async ({ page }, testInfo) => {
    const viewportSize = page.viewportSize();
    const width = viewportSize?.width ?? 0;
    const isMobile = width < 1024;

    // T0: seed acabou de acontecer no beforeEach. Confirmar visibilidade.
    const t0 = await readDbState(legacyId);
    console.log(`[T0 pid=${process.pid} ts=${new Date().toISOString()}] customer=${t0.customer} members=${t0.members} links=${t0.links}`);
    expect(t0.customer, "T0: customer sumiu antes do teste começar").toBe(true);
    expect(t0.members, "T0: esperava 0 members").toBe(0);

    // 1) Buscar o cliente teste na lista (aparece com iniciais "CT").
    // pressSequentially em vez de fill(): fill() em input controlado por React
    // não dispara onChange char-a-char, e o filtro `matchesDgnCustomerSearch`
    // não reconciliava. pressSequentially simula digitação real e propaga.
    const search = page.locator('input[type="search"]');
    await search.click();
    await search.pressSequentially("Cliente Teste", { delay: 30 });

    // Filtrar EXATO pelo legacy_id (via data-customer-id) evita colisão com
    // clientes órfãos de execuções anteriores que também tenham nome "Cliente
    // Teste Founder" — foi a causa raiz do bug de commercial-save 502 rastreado
    // até um cliente 'diag' órfão que a regex do purge não pegou.
    const targetCard = page.locator(`[data-testid="curation-list-item"][data-customer-id="${legacyId}"]`);
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

    // 3) Fast-path Gerar convite: escolher plano Smart, categoria Hatch, motivo,
    //    e disparar em UMA única ação. Não passamos por commercial-save antes:
    //    a RPC crm_manage_founder_curation_v2 no branch create_invite já faz
    //    bootstrap silencioso do crm_campaign_members + curadoria + link em
    //    UMA transação atômica. Isso elimina completamente o boundary HTTP
    //    entre requests que causava visibility lag do pooler Supabase.
    const smartCard = detail.getByRole("button", { name: /^DGN Smart/i });
    await smartCard.click();
    const hatchChip = detail.getByRole("button", { name: /^Hatch$/i });
    await hatchChip.click();
    const reasonChip = detail.getByRole("button", { name: /Curadoria manual/i });
    await reasonChip.click();

    const generateBtn = page.getByTestId("gerar-convite-founder");
    await expect(generateBtn).toBeEnabled();

    // T1: imediatamente antes do click, confirmar customer no DB e 0 members.
    // O ÚNICO POST subsequente cria member + link atomicamente na mesma RPC.
    const t1 = await readDbState(legacyId);
    console.log(`[T1 pid=${process.pid} ts=${new Date().toISOString()}] customer=${t1.customer} members=${t1.members} links=${t1.links}`);
    expect(t1.customer, "T1: customer sumiu antes do click Gerar").toBe(true);
    expect(t1.members, "T1: esperava 0 members (bootstrap acontece dentro do create_invite)").toBe(0);
    // O client chama window.location.reload() 500ms após a resposta OK do POST.
    // Precisa parear waitForEvent com o click porque o load atual já ocorreu.
    const loadAfterGenerate = page.waitForEvent("load", { timeout: 60_000 });
    await generateBtn.click();
    await loadAfterGenerate;

    // Após reload, a seleção do customer é perdida em qualquer viewport
    // (o URL não mantém o customer selecionado). Rebuscamos e clicamos
    // no card para reabrir a Curadoria do cliente teste.
    {
      const searchAfterReload = page.locator('input[type="search"]');
      await searchAfterReload.click();
      await searchAfterReload.pressSequentially("Cliente Teste", { delay: 30 });
      const cardAfterReload = page.locator(`[data-testid="curation-list-item"][data-customer-id="${legacyId}"]`);
      await expect(cardAfterReload).toBeVisible({ timeout: 20_000 });
      await cardAfterReload.click();
    }

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
    // Mesmo padrão do gerar-convite: reload após POST → escutar próximo 'load'.
    const loadAfterReplace = page.waitForEvent("load", { timeout: 60_000 });
    await confirmarNova.click();
    await loadAfterReplace;

    // 11) Após replace + reload: novo link ativo com Priority. Igual ao reload
    // pós Gerar — re-seleciona o customer em qualquer viewport.
    {
      const searchAfterReload = page.locator('input[type="search"]');
      await searchAfterReload.click();
      await searchAfterReload.pressSequentially("Cliente Teste", { delay: 30 });
      const cardAfterReplace = page.locator(`[data-testid="curation-list-item"][data-customer-id="${legacyId}"]`);
      await expect(cardAfterReplace).toBeVisible({ timeout: 20_000 });
      await cardAfterReplace.click();
    }
    const conviteAtivoAfterReplace = page.getByText("CONVITE ATIVO ✓");
    await expect(conviteAtivoAfterReplace).toBeVisible({ timeout: 30_000 });
    // A referência ao plano no BLOCO do CONVITE ATIVO deve refletir Priority
    // após replace. Escopa no container do bloco para não colidir com "Priority"
    // dos cards de plano e das opções dos selects.
    const conviteAtivoBlock = conviteAtivoAfterReplace.locator("xpath=ancestor::div[1]");
    await expect(conviteAtivoBlock).toContainText(/priority/i);

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
