import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadGrowthData, mapGrowthSnapshot, readGrowthDataConfig, type GrowthDbSnapshot } from "./growth-reader.ts";
import { supabaseSecretKeyFetch } from "./secret-key-fetch.ts";

const customer = (id: string, legacy_id: string, name: string) => ({ id, legacy_id, name, primary_phone: "19999999999", company_or_link: "", origin: "4uCar", first_service_at: "2025-01-01", last_service_at: "2026-07-01", service_count: 4, historical_value: 400, average_interval_days: 30 });

function snapshot(): GrowthDbSnapshot {
  const ids = ["1", "2", "3", "4"];
  return {
    customers: [customer("1", "benedito-constantino", "Benedito Constantino"), customer("2", "jose-moreira", "José Moreira"), customer("3", "rikardo-oliveira", "Rikardo Oliveira"), customer("4", "iara-menezes", "Iara Menezes")],
    vehicles: ids.map((customer_id) => ({ customer_id, is_primary: true, brand: "VW", model: "T-Cross", plate: `ABC${customer_id}` })),
    subscriptions: ids.map((customer_id) => ({ customer_id, subscription_plan: "Smart", subscription_cycle: "mensal", subscription_status: "detectado", is_active_subscriber: false })),
    campaignMembers: [
      ...ids.slice(0, 3).map((customer_id, index) => ({ customer_id, campaign_id: "founders-2026", founder_status: "confirmado", founder_number: String(index + 1).padStart(3, "0"), commercial_stage: "convertido", kit_status: "pendente", card_status: "pendente" })),
      { customer_id: "4", campaign_id: "founders-2026", founder_status: "selecionado", founder_number: null, commercial_stage: "aguardando_analise" },
    ], interactions: [], scores: [],
  };
}

function mockDb(data: GrowthDbSnapshot, fail = false) {
  const tables: Record<string, unknown[]> = { crm_customers: data.customers, crm_vehicles: data.vehicles, crm_subscriptions: data.subscriptions, crm_campaign_members: data.campaignMembers, crm_interactions: data.interactions, crm_score_snapshots: data.scores };
  return { from: (table: string) => ({ select: () => ({ range: async (from: number, to: number) => fail ? { data: null, error: { message: "offline" } } : { data: tables[table].slice(from, to + 1), error: null } }) }) } as never;
}

test("json é a fonte segura padrão e variável inválida falha claramente", () => {
  assert.equal(readGrowthDataConfig({}).source, "json");
  assert.throws(() => readGrowthDataConfig({ DGN_GROWTH_DATA_SOURCE: "auto" }), /Use "json" ou "db"/);
});

test("modo JSON mantém os 1.152 clientes operacionais", async () => {
  const result = await loadGrowthData({ env: { DGN_GROWTH_DATA_SOURCE: "json" } });
  assert.equal(result.origin, "json"); assert.equal(result.customers.length, 1152);
});

test("mapper preserva quatro clientes, Founders 001-003 e Iara selecionada sem confirmação", () => {
  const mapped = mapGrowthSnapshot(snapshot());
  assert.equal(mapped.length, 4);
  assert.deepEqual(mapped.slice(0, 3).map((row) => row.campaign.founderNumber), ["001", "002", "003"]);
  const iara = mapped.find((row) => row.id === "iara-menezes")!;
  assert.equal(iara.campaign.founderSelected, true); assert.equal(iara.campaign.founderNumber, "");
  assert.equal(mapped[0].vehicle, "VW T-Cross"); assert.equal(mapped[0].recommendedPlan, "Smart");
});

test("modo DB é estável entre leituras e retorna somente quatro registros", async () => {
  const db = mockDb(snapshot()); const env = { DGN_GROWTH_DATA_SOURCE: "db" };
  const first = await loadGrowthData({ env, db }); const reload = await loadGrowthData({ env, db });
  assert.equal(first.origin, "db"); assert.equal(first.readOnly, true); assert.equal(first.customers.length, 4);
  assert.deepEqual(reload.customers, first.customers);
});

test("banco indisponível falha sem fallback e usa JSON apenas quando explicitamente habilitado", async () => {
  const db = mockDb(snapshot(), true); const logger = { error() {} };
  await assert.rejects(loadGrowthData({ env: { DGN_GROWTH_DATA_SOURCE: "db" }, db, logger }), /fallback local está desativado/);
  const result = await loadGrowthData({ env: { DGN_GROWTH_DATA_SOURCE: "db", DGN_GROWTH_ALLOW_JSON_FALLBACK: "true" }, db, logger });
  assert.equal(result.origin, "json-fallback"); assert.equal(result.customers.length, 1152); assert.equal(result.readOnly, true);
});

test("modo DB pagina sem perder registros acima do limite do Supabase", async () => {
  const data = snapshot();
  data.customers = Array.from({ length: 1152 }, (_, index) => customer(String(index + 1), `legacy-${index + 1}`, `Cliente ${index + 1}`));
  const result = await loadGrowthData({ env: { DGN_GROWTH_DATA_SOURCE: "db" }, db: mockDb(data) });
  assert.equal(result.customers.length, 1152);
});

test("service role não é referenciada pelo componente client", async () => {
  const source = await readFile(new URL("../../../components/growth/DgnGrowthWorkspace.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|getSupabaseAdminClient|growth-reader/);
});

test("chave sb_secret permanece em apikey e não é enviada como Bearer JWT", async () => {
  const originalFetch = globalThis.fetch;
  let capturedApiKey: string | null = null;
  let capturedAuthorization: string | null = null;
  globalThis.fetch = (async (_input, init) => {
    const headers = new Headers(init?.headers);
    capturedApiKey = headers.get("apikey");
    capturedAuthorization = headers.get("authorization");
    return new Response("[]", { status: 200 });
  }) as typeof fetch;
  try {
    const request = new Request("https://example.test", { headers: { apikey: "sb_secret_example", authorization: "Bearer sb_secret_example" } });
    await supabaseSecretKeyFetch(request);
    assert.equal(capturedApiKey, "sb_secret_example");
    assert.equal(capturedAuthorization, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("selectAll faz retry em 'JWT issued at future' e devolve a página na tentativa seguinte", async () => {
  const data = snapshot();
  const flakyCounters: Record<string, number> = {};
  const flakyDb = {
    from: (table: string) => ({
      select: () => ({
        range: async (from: number, to: number) => {
          flakyCounters[table] = (flakyCounters[table] ?? 0) + 1;
          if (table === "crm_score_snapshots" && flakyCounters[table] === 1) {
            return { data: null, error: { message: "JWT issued at future" } };
          }
          if (table === "crm_interactions" && flakyCounters[table] === 1) {
            return { data: null, error: { message: "JWT issued at future" } };
          }
          const tables: Record<string, unknown[]> = {
            crm_customers: data.customers, crm_vehicles: data.vehicles, crm_subscriptions: data.subscriptions,
            crm_campaign_members: data.campaignMembers, crm_interactions: data.interactions, crm_score_snapshots: data.scores,
          };
          return { data: tables[table]?.slice(from, to + 1) ?? [], error: null };
        },
      }),
    }),
  } as never;
  const result = await loadGrowthData({ env: { DGN_GROWTH_DATA_SOURCE: "db" }, db: flakyDb, logger: { info() {}, error() {} } });
  assert.equal(result.origin, "db"); assert.equal(result.customers.length, 4);
  assert.equal(flakyCounters.crm_score_snapshots, 2, "crm_score_snapshots deve ter feito 2 tentativas (1 falha JWT + 1 sucesso)");
  assert.equal(flakyCounters.crm_interactions, 2, "crm_interactions deve ter feito 2 tentativas (1 falha JWT + 1 sucesso)");
});

test("selectAll NÃO faz retry em erros não-transientes (protege contra hammer)", async () => {
  const attemptsByTable: Record<string, number> = {};
  const db = {
    from: (table: string) => ({
      select: () => ({
        range: async () => {
          attemptsByTable[table] = (attemptsByTable[table] ?? 0) + 1;
          return { data: null, error: { message: "relation does not exist" } };
        },
      }),
    }),
  } as never;
  await assert.rejects(loadGrowthData({ env: { DGN_GROWTH_DATA_SOURCE: "db" }, db, logger: { error() {} } }), /fallback local está desativado/);
  for (const [table, count] of Object.entries(attemptsByTable)) {
    assert.equal(count, 1, `${table}: erros não-JWT devem falhar na primeira tentativa (sem retry), foram ${count}`);
  }
});

test("selectAll desiste após 3 tentativas se o erro JWT persistir", async () => {
  // Testamos uma única tabela (isolada de Promise.all/short-circuit em readGrowthSnapshot)
  // pra provar que 3 falhas consecutivas terminam com throw — sem loop infinito.
  const { readGrowthSnapshot } = await import("./growth-reader.ts");
  let attempts = 0;
  const failingDb = {
    from: () => ({
      select: () => ({
        range: async () => {
          attempts += 1;
          return { data: null, error: { message: "JWT issued at future" } };
        },
      }),
    }),
  } as never;
  await assert.rejects(readGrowthSnapshot(failingDb), /JWT issued at future/);
  // 3 tentativas na primeira tabela que falhou. Outras tabelas em Promise.all
  // podem ter iniciado retries; short-circuit não é determinístico entre elas.
  assert.ok(attempts >= 3, `esperava ao menos 3 tentativas (3 na primeira tabela), foram ${attempts}`);
});

test("rotas administrativas continuam negadas sem sessão válida", async () => {
  const source = await readFile(new URL("../../../proxy.ts", import.meta.url), "utf8");
  assert.match(source, /DGN_ADMIN_COOKIE/);
  assert.match(source, /validateAdminSessionToken/);
  assert.match(source, /\/admin\/growth\/login/);
  assert.match(source, /\/admin\/growth\/:path\*/);
});
