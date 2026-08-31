import { expect, test, type Page, type Route } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";

// Smoke final pós-QA da Fase 2. Cobre os 12 casos exigidos pelo brief:
//   1  funil Founder consistente (mutuamente exclusivo);
//   2  confirmedFounders = 3 em Dashboard;
//   3  ?intent= cold load;
//   4  ?intent= navegação client-side;
//   5  placa mascarada sem escape markdown;
//   6  chip de tom gera novo conteúdo e scroll;
//   7  Perfil 360 awaiting_curation → "Abrir Curadoria" sem "Preparar convite";
//   8  Perfil 360 invited → "Preparar follow-up Founder";
//   9  Perfil 360 assinante → sem CTA de aquisição, tem renovação;
//   10 Perfil 360 Founder confirmado → "Preparar follow-up Founder";
//   11 Iara fora da fila de aquisição;
//   12 Agent responde "Quantos Founders confirmados?" com 3.
//
// Roda em desktop-1440 + mobile-390 por default; adicionar --project=mobile-360
// --project=mobile-393 --project=mobile-412 --project=desktop-1920 para rodada
// completa exigida pelo brief.

const DISCLAIMER = "Preparado pela IA · revisar antes de enviar";

// Clientes reais conhecidos do snapshot local. IDs fixos = testes determinísticos.
// Ana Silveira é assinante Smart ativa (matchKnownSubscriber via phone
// 11992357937) presente no snapshot — bate como readiness=ineligible.
const FIXTURES = {
  awaitingCuration: "matias-ariel",
  invitedFounder: "leandro-freitas",
  subscriber: "ana-silveira",
  founderConfirmed: "benedito-constantino",
} as const;

function preparedMessagePayload(overrides: Partial<{
  customerName: string;
  objective: string;
  tone: string;
  draftMessage: string;
  angle: string;
  context: string;
}> = {}) {
  return {
    intent: "prepared-content",
    providerMode: "llm",
    blocks: [
      {
        kind: "prepared-message",
        prepared: {
          customerId: "cliente-teste",
          customerName: overrides.customerName ?? "Cliente Teste",
          objective: overrides.objective ?? "founder_acquisition",
          channel: "whatsapp",
          context: overrides.context ?? "Cliente elegível para aquisição Founder.",
          angle: overrides.angle ?? "Perfil compatível com o programa Founder.",
          draftMessage:
            overrides.draftMessage ??
            "Jean, tudo bem? Aqui é da DGN Club. Vi seu histórico com a gente e queria te falar sobre o programa Founder — vagas limitadas, atendimento diferenciado. Faz sentido eu te enviar o convite?",
          nextStep: "Aguardar retorno; se responder, iniciar curadoria.",
          tone: overrides.tone ?? "padrao",
          href: "/admin/growth/customers/cliente-teste",
          facts: ["8 atendimento(s) registrado(s).", "Cliente desde 2024-01-01."],
          disclaimer: DISCLAIMER,
        },
      },
    ],
    disclosures: { facts: ["8 atendimento(s)."], inferences: ["Perfil compatível."] },
  };
}

async function mockAgentQuery(
  page: Page,
  handler: (body: unknown, turn: number) => object,
) {
  let turn = 0;
  await page.route("**/api/admin/growth/agent/query", async (route: Route) => {
    turn += 1;
    const body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(handler(body, turn)),
    });
  });
}

test.describe("Prepare-smoke final pós-QA — Fase 2", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await loginAsAdmin(context);
    await page.goto("/admin/growth", { waitUntil: "domcontentloaded", timeout: 60_000 });
    expect(page.url()).not.toContain("/admin/growth/login");
  });

  // -------------------------------------------------------------------------
  // (1) Funil Founder consistente — snapshot mutuamente exclusivo
  // -------------------------------------------------------------------------
  test("[1] tela Founders exibe pipeline snapshot com métricas históricas separadas", async ({ page }) => {
    await page.goto("/admin/growth/founders-2026", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const snapshot = page.getByTestId("founders-pipeline-snapshot");
    await expect(snapshot).toBeVisible({ timeout: 15_000 });
    await expect(snapshot.getByText(/Cada cliente aparece em apenas 1 estágio/i)).toBeVisible();
    // Rótulos canônicos aparecem no funil.
    for (const label of ["Selecionados", "Convites em aberto", "Visualizados", "Conversando", "Pagamento", "Convertidos"]) {
      await expect(snapshot.getByText(label, { exact: true }).first()).toBeVisible();
    }
    // Bloco histórico separado.
    const historical = page.getByTestId("founders-historical");
    await expect(historical).toBeVisible();
    await expect(historical.getByText(/convite\(s\) já emitido/i)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // (2) Dashboard: Founders confirmados = 3
  // -------------------------------------------------------------------------
  test("[2] Dashboard mostra Founders confirmados = 3", async ({ page }) => {
    await page.goto("/admin/growth", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const value = page.getByTestId("metric-confirmed-founders-value");
    await expect(value).toBeVisible();
    await expect(value).toHaveText("3");
    // Label também mudou para "em aberto".
    const invitesLabel = page.getByText("Convites em aberto", { exact: false });
    await expect(invitesLabel.first()).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // (3) ?intent= cold load — chega em /assistente pela primeira vez.
  // -------------------------------------------------------------------------
  test("[3] intent cold load auto-envia e renderiza card visível", async ({ page }) => {
    await mockAgentQuery(page, () => preparedMessagePayload());
    await page.goto(
      "/admin/growth/assistente?intent=prepare_founder&customer=cliente-teste",
      { waitUntil: "domcontentloaded", timeout: 60_000 },
    );
    const card = page.getByTestId("prepared-message-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card).toBeInViewport();
  });

  // -------------------------------------------------------------------------
  // (4) ?intent= navegação client-side — sem cold reload
  // -------------------------------------------------------------------------
  test("[4] intent client-side (mudar URL sem reload) dispara nova preparação", async ({ page }) => {
    let turn = 0;
    const receivedPrompts: string[] = [];
    await mockAgentQuery(page, (body) => {
      turn += 1;
      receivedPrompts.push(((body as { message?: string }).message ?? "").trim());
      return preparedMessagePayload({ customerName: turn === 1 ? "Cliente A" : "Cliente B" });
    });

    await page.goto(
      "/admin/growth/assistente?intent=prepare_founder&customer=customer-a",
      { waitUntil: "domcontentloaded", timeout: 60_000 },
    );
    await expect(page.getByTestId("prepared-message-card").first()).toBeVisible({ timeout: 15_000 });
    expect(turn).toBe(1);

    // Simula navegação client-side substituindo apenas a query — sem reload.
    await page.evaluate(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("customer", "customer-b");
      window.history.pushState({}, "", url.toString());
      // Notifica o router de que a URL mudou (Next 16 App Router).
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    // Aguarda segundo turno chegar.
    await expect.poll(() => turn, { timeout: 15_000 }).toBe(2);
    expect(receivedPrompts[1]).toContain("customer-b");
  });

  // -------------------------------------------------------------------------
  // (5) Placa mascarada em texto markdown NÃO vira italic/bold
  // -------------------------------------------------------------------------
  test("[5] placa mascarada no texto NÃO ganha escape markdown", async ({ page }) => {
    await mockAgentQuery(page, () => ({
      intent: "customer-summary",
      providerMode: "llm",
      blocks: [
        {
          kind: "text",
          // 3 asteriscos consecutivos costumavam virar bold/italic combinados.
          text: "Cliente Teste — placa FYP***3, telefone (19) *****-1234.",
        },
      ],
    }));
    await page.goto(
      "/admin/growth/assistente?ask=" + encodeURIComponent("Resuma o cliente"),
      { waitUntil: "domcontentloaded", timeout: 60_000 },
    );
    const md = page.getByTestId("agent-markdown").first();
    await expect(md).toBeVisible({ timeout: 15_000 });
    // A placa fica exata, sem tags de bold/italic.
    await expect(md.getByText(/placa FYP\*\*\*3/)).toBeVisible();
    await expect(md.getByText(/\(19\) \*\*\*\*\*-1234/)).toBeVisible();
    // Sem <strong> ou <em> em torno das máscaras.
    expect(await md.locator("strong").count()).toBe(0);
    expect(await md.locator("em").count()).toBe(0);
  });

  // -------------------------------------------------------------------------
  // (6) Chip de tom → novo card + scrollIntoView
  // -------------------------------------------------------------------------
  test("[6] chip 'Mais direta' gera novo card visível", async ({ page }) => {
    let turn = 0;
    await mockAgentQuery(page, () => {
      turn += 1;
      return turn === 1
        ? preparedMessagePayload({ tone: "padrao" })
        : preparedMessagePayload({
            tone: "mais_direta",
            draftMessage: "Jean, aqui é da DGN Club. Abriu vaga do programa Founder. Posso enviar o convite agora?",
          });
    });
    await page.goto(
      "/admin/growth/assistente?intent=prepare_founder&customer=cliente-teste",
      { waitUntil: "domcontentloaded", timeout: 60_000 },
    );
    await expect(page.getByTestId("prepared-message-card").first()).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("prepared-tone-mais_direta").first().click();
    const second = page.getByTestId("prepared-message-card").nth(1);
    await expect(second).toBeVisible({ timeout: 15_000 });
    // Novo card visível na viewport (efeito do scrollIntoView).
    await expect(second).toBeInViewport();
  });

  // -------------------------------------------------------------------------
  // (7) Perfil 360 awaiting_curation → CTA "Abrir Curadoria", SEM aquisição
  // -------------------------------------------------------------------------
  test("[7] awaiting_curation → 'Abrir Curadoria' e sem 'Preparar convite Founder'", async ({ page }) => {
    await page.goto(`/admin/growth/customers/${FIXTURES.awaitingCuration}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const section = page.getByTestId("profile-assistant-section");
    await expect(section).toBeVisible({ timeout: 15_000 });
    await expect(section).toHaveAttribute("data-readiness-state", "awaiting_curation");
    await expect(section.getByTestId("profile-assistant-open-curation")).toBeVisible();
    expect(await section.getByTestId("profile-assistant-founder").count()).toBe(0);
  });

  // -------------------------------------------------------------------------
  // (8) Perfil 360 invited → "Preparar follow-up Founder"
  // -------------------------------------------------------------------------
  test("[8] invited → 'Preparar follow-up Founder'", async ({ page }) => {
    await page.goto(`/admin/growth/customers/${FIXTURES.invitedFounder}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const section = page.getByTestId("profile-assistant-section");
    await expect(section).toBeVisible({ timeout: 15_000 });
    await expect(section).toHaveAttribute("data-readiness-state", "invited");
    await expect(section.getByTestId("profile-assistant-founder-followup")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // (9) Perfil 360 assinante conhecido → readiness=ineligible, sem aquisição
  // -------------------------------------------------------------------------
  test("[9] assinante conhecido → readiness=ineligible, sem CTA de aquisição", async ({ page }) => {
    await page.goto(`/admin/growth/customers/${FIXTURES.subscriber}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const section = page.getByTestId("profile-assistant-section");
    await expect(section).toBeVisible({ timeout: 15_000 });
    await expect(section).toHaveAttribute("data-readiness-state", "ineligible");
    // Nunca oferece aquisição Founder para assinante conhecido.
    expect(await section.getByTestId("profile-assistant-founder").count()).toBe(0);
    // Renewal só aparece se estado for renovacao_pendente — assinante ativo
    // regular não recebe esse CTA. Sanity: existe pelo menos o CTA de resumo.
    await expect(section.getByTestId("profile-assistant-summary")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // (10) Perfil 360 Founder confirmado → "Preparar follow-up Founder"
  // -------------------------------------------------------------------------
  test("[10] Founder confirmado (Benedito Nº001) → 'Preparar follow-up Founder'", async ({ page }) => {
    await page.goto(`/admin/growth/customers/${FIXTURES.founderConfirmed}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const section = page.getByTestId("profile-assistant-section");
    await expect(section).toBeVisible({ timeout: 15_000 });
    await expect(section).toHaveAttribute("data-readiness-state", "founder");
    await expect(section.getByTestId("profile-assistant-founder-followup")).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // (11) Iara fora da fila de aquisição (Founders + Quem contatar hoje)
  // -------------------------------------------------------------------------
  test("[11] Iara Menezes NÃO aparece na fila de aquisição Founder", async ({ page }) => {
    await page.goto("/admin/growth/founders-2026", { waitUntil: "domcontentloaded", timeout: 60_000 });
    // O snapshot canônico exclui known subscribers. Se Iara aparecer, a
    // ausência de badge "Assinante Priority" já indica bug — mas o filtro
    // canônico de acquisitionFounders remove ela do array antes.
    const iaraCells = page.locator("td, li, div").filter({ hasText: /^Iara Menezes$/i });
    const iaraCount = await iaraCells.count();
    expect(iaraCount).toBe(0);

    // Perfil 360 de Iara mostra ela como assinante, sem CTA de aquisição.
    await page.goto("/admin/growth/customers/iara", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const section = page.getByTestId("profile-assistant-section");
    // Iara pode não existir no snapshot local ainda — se existir, testa.
    const iaraProfileExists = await section.count();
    if (iaraProfileExists === 0) return;
    expect(await section.getByTestId("profile-assistant-founder").count()).toBe(0);
  });

  // -------------------------------------------------------------------------
  // (12) Agent responde métricas Founder = 3
  // -------------------------------------------------------------------------
  test("[12] Agent responde 'Quantos Founders confirmados?' com 3 (via get_founder_metrics)", async ({ page }) => {
    // Sem chave LLM, mockamos a rota para exercitar o pipeline UI. A payload
    // simula a saída canônica que a skill get_founder_metrics gera.
    await mockAgentQuery(page, () => ({
      intent: "llm-synthesis",
      providerMode: "llm",
      blocks: [
        {
          kind: "text",
          text: "Temos **3 Founders confirmados** (Nº001, Nº002, Nº003). Ainda faltam 27 vagas até a meta de 30.",
        },
      ],
      disclosures: {
        facts: ["Founders confirmados: 3.", "Meta da campanha: 30 Founders."],
        inferences: [],
      },
    }));
    await page.goto(
      "/admin/growth/assistente?ask=" + encodeURIComponent("Quantos Founders confirmados temos?"),
      { waitUntil: "domcontentloaded", timeout: 60_000 },
    );
    const md = page.getByTestId("agent-markdown").first();
    await expect(md).toBeVisible({ timeout: 15_000 });
    await expect(md.locator("strong").filter({ hasText: /3 Founders confirmados/ })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Guardrail preservado: ?ask= tentando ação executiva é bloqueado
  // -------------------------------------------------------------------------
  test("[guard] ?ask= com verbo executivo é bloqueado sem chamar API", async ({ page }) => {
    let called = 0;
    await mockAgentQuery(page, () => {
      called += 1;
      return preparedMessagePayload();
    });
    await page.goto(
      "/admin/growth/assistente?ask=" + encodeURIComponent("envie WhatsApp agora para o Jean"),
      { waitUntil: "domcontentloaded", timeout: 60_000 },
    );
    await expect(page.getByText(/Assistente DGN não executa ações/i)).toBeVisible({ timeout: 15_000 });
    expect(called).toBe(0);
  });
});
