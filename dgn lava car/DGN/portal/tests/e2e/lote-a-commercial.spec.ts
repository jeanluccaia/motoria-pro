import { expect, test, type APIRequestContext, type BrowserContext } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";

// LOTE A — Homologação do hotfix comercial (versionamento monotônico).
//
// Encadeia os 13 passos do protocolo em ordem serial. Login via UI
// (cookie); PATCH comercial validado via API autenticada (contrato real
// do endpoint).
//
// Requer:
//   • PLAYWRIGHT_BASE_URL apontando ao Vercel homolog
//   • DGN_ADMIN_PASSWORD no env
//   • VERCEL_AUTOMATION_BYPASS_SECRET se o preview estiver protegido
//   • Fixture TEST IARA no estado inicial: owner=Rodrigo, priority=3,
//     next_action="Confirmar interesse via WhatsApp", version=0.

const TEST_IARA_CUSTOMER_ID = "6a5584c8-552d-4d38-bf1a-82f77afe7f8b";
const COMMERCIAL_ENDPOINT = `/api/admin/growth/customers/${TEST_IARA_CUSTOMER_ID}/commercial`;

const INITIAL_PAYLOAD = {
  owner: "Rodrigo",
  commercialNotes: "Cliente qualificado — aguardando retorno",
  nextAction: "Confirmar interesse via WhatsApp",
  nextActionAt: "2026-10-16T15:00:00.000Z",
  priority: "alta" as const,
};

let authedContext: BrowserContext;
let api: APIRequestContext;

const versionAfterInitial = 0;
let versionAfterRealUpdate = 1;
const noOpDurationsMs: number[] = [];

test.describe.serial("Lote A — Hotfix comercial homolog", () => {
  test.beforeAll(async ({ browser }) => {
    authedContext = await browser.newContext();
    await loginAsAdmin(authedContext);
    api = authedContext.request;
  });

  test.afterAll(async () => {
    await authedContext?.close();
  });

  // 01 login admin
  test("01 login admin → /admin/growth acessível", async () => {
    const page = await authedContext.newPage();
    await page.goto("/admin/growth", { waitUntil: "domcontentloaded", timeout: 60_000 });
    expect(page.url(), "login deveria ter deixado fora de /login").not.toContain("/admin/growth/login");
    await page.close();
  });

  // 02 ficha comercial da TEST IARA (via API — fonte da verdade do commercial)
  // 03 leitura dos valores iniciais
  test("02-03 PATCH no-op retorna estado inicial esperado (owner=Rodrigo, version=0)", async () => {
    const response = await api.patch(COMMERCIAL_ENDPOINT, {
      data: { ...INITIAL_PAYLOAD, expectedVersion: versionAfterInitial },
    });
    expect(response.status(), `status esperado 200, body=${await response.text()}`).toBe(200);
    const body = await response.json();
    expect(body.changed).toBe(false);
    expect(body.commercial?.owner).toBe("Rodrigo");
    expect(body.commercial?.priority).toBe("alta");
    expect(body.commercial?.nextAction).toBe("Confirmar interesse via WhatsApp");
    expect(body.commercial?.version).toBe(versionAfterInitial);
  });

  // 04 PATCH no-op → 200 changed=false
  test("04 PATCH no-op idêntico retorna 200 com changed=false", async () => {
    const response = await api.patch(COMMERCIAL_ENDPOINT, {
      data: { ...INITIAL_PAYLOAD, expectedVersion: versionAfterInitial },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.changed).toBe(false);
    expect(body.commercial?.version).toBe(versionAfterInitial);
  });

  // 05 tempo de resposta curto
  test("05 PATCH no-op responde em < 10.000ms (preview cap)", async () => {
    const t0 = Date.now();
    const response = await api.patch(COMMERCIAL_ENDPOINT, {
      data: { ...INITIAL_PAYLOAD, expectedVersion: versionAfterInitial },
    });
    const elapsed = Date.now() - t0;
    noOpDurationsMs.push(elapsed);
    expect(response.status()).toBe(200);
    expect(elapsed, `duração observada ${elapsed}ms`).toBeLessThan(10_000);
  });

  // 06 feedback de no-op pelo backend (mensagem "nada a auditar" é renderizada
  //    quando body.changed=false; verificamos semanticamente o changed).
  test("06 no-op retorna changed=false (base para a mensagem 'Nenhuma alteração' na UI)", async () => {
    const response = await api.patch(COMMERCIAL_ENDPOINT, {
      data: { ...INITIAL_PAYLOAD, expectedVersion: versionAfterInitial },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.changed).toBe(false);
  });

  // 07 reload: dados preservados após no-op (chamando o PATCH no-op de novo,
  //    o estado retornado tem que ser idêntico ao INITIAL_PAYLOAD)
  test("07 reload: owner/priority/nextAction/nextActionAt preservados após no-op", async () => {
    const response = await api.patch(COMMERCIAL_ENDPOINT, {
      data: { ...INITIAL_PAYLOAD, expectedVersion: versionAfterInitial },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.commercial?.owner).toBe(INITIAL_PAYLOAD.owner);
    expect(body.commercial?.priority).toBe(INITIAL_PAYLOAD.priority);
    expect(body.commercial?.nextAction).toBe(INITIAL_PAYLOAD.nextAction);
    // Timestamp pode voltar em formato Postgres (`+00:00`) ou JS ISO (`.000Z`);
    // normalizamos pelo instante absoluto, não pela string literal.
    expect(new Date(body.commercial?.nextActionAt).toISOString()).toBe(
      new Date(INITIAL_PAYLOAD.nextActionAt).toISOString(),
    );
  });

  // 08 version NÃO muda após sequência de no-ops
  test("08 version continua 0 após 4 no-ops (nenhum audit incremental)", async () => {
    const response = await api.patch(COMMERCIAL_ENDPOINT, {
      data: { ...INITIAL_PAYLOAD, expectedVersion: versionAfterInitial },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.commercial?.version).toBe(versionAfterInitial);
  });

  // 09 repetição do no-op 3x
  test("09 PATCH no-op repetido 3x: todos retornam changed=false com mesma version", async () => {
    for (let i = 0; i < 3; i += 1) {
      const t0 = Date.now();
      const response = await api.patch(COMMERCIAL_ENDPOINT, {
        data: { ...INITIAL_PAYLOAD, expectedVersion: versionAfterInitial },
      });
      const elapsed = Date.now() - t0;
      noOpDurationsMs.push(elapsed);
      expect(response.status(), `iteração ${i + 1}`).toBe(200);
      const body = await response.json();
      expect(body.changed, `iteração ${i + 1}`).toBe(false);
      expect(body.commercial?.version, `iteração ${i + 1}`).toBe(versionAfterInitial);
    }
  });

  // 10 UPDATE REAL + 11 concorrência (2 sessões) → 409
  test("10-11 UPDATE REAL incrementa versão; segunda sessão com versão antiga → 409", async () => {
    const sessionA = await api.patch(COMMERCIAL_ENDPOINT, {
      data: { ...INITIAL_PAYLOAD, owner: "Giovanna", expectedVersion: versionAfterInitial },
    });
    expect(sessionA.status()).toBe(200);
    const bodyA = await sessionA.json();
    expect(bodyA.changed).toBe(true);
    expect(bodyA.commercial?.owner).toBe("Giovanna");
    expect(bodyA.commercial?.version).toBe(versionAfterInitial + 1);
    versionAfterRealUpdate = bodyA.commercial.version;

    const sessionB = await api.patch(COMMERCIAL_ENDPOINT, {
      data: { ...INITIAL_PAYLOAD, owner: "Fernanda", expectedVersion: versionAfterInitial },
    });
    expect(sessionB.status(), `esperado 409, body=${await sessionB.text()}`).toBe(409);
    const bodyB = await sessionB.json();
    expect(bodyB.error).toMatch(/outra sessão|concorr/i);
  });

  // 12 preservação dos dados após 409 — owner continua Giovanna
  test("12 após 409, dados do UPDATE REAL preservados (owner=Giovanna, version mantida)", async () => {
    const response = await api.patch(COMMERCIAL_ENDPOINT, {
      data: { ...INITIAL_PAYLOAD, owner: "Giovanna", expectedVersion: versionAfterRealUpdate },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.changed).toBe(false);
    expect(body.commercial?.owner).toBe("Giovanna");
    expect(body.commercial?.version).toBe(versionAfterRealUpdate);
  });

  // 13 timeout da interface — o fetch em DgnGrowthWorkspace tem AbortController
  // de 10s. Validamos equivalente: resposta normal é < 10s + endpoint devolve
  // 400 (payload inválido) sem travar.
  test("13 UI timeout: endpoint responde em tempo hábil (sem hang) mesmo com payload inválido", async () => {
    const t0 = Date.now();
    const response = await api.patch(COMMERCIAL_ENDPOINT, {
      data: { ...INITIAL_PAYLOAD, expectedVersion: 99 }, // versão errada → 409 imediato
    });
    const elapsed = Date.now() - t0;
    noOpDurationsMs.push(elapsed);
    expect(response.status()).toBe(409);
    // Garante que nenhum request fica travado: todas < 10s (cap do AbortController)
    const maxDuration = Math.max(...noOpDurationsMs);
    expect(maxDuration, `pior duração = ${maxDuration}ms`).toBeLessThan(10_000);
  });

  test("ZZ relatório — durações observadas", async () => {
    // Teste final meramente informativo: expõe durações no reporter list.
    const summary = {
      amostras: noOpDurationsMs.length,
      maxMs: Math.max(...noOpDurationsMs),
      minMs: Math.min(...noOpDurationsMs),
      medianaMs: [...noOpDurationsMs].sort((a, b) => a - b)[Math.floor(noOpDurationsMs.length / 2)],
    };
    console.log("[LOTE A homolog] durações PATCH:", JSON.stringify(summary));
    expect(summary.amostras).toBeGreaterThan(0);
  });
});
