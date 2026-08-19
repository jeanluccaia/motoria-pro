/* eslint-disable @typescript-eslint/no-explicit-any -- fake Supabase builder é any por conveniência */
import { test, expect } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleEvoReconcile } from "../src/lib/integrations/evo/reconcile";
import type {
  EvoClient,
  EvoListSalesParams,
  EvoListSalesResult,
  EvoSaleDetails,
} from "../src/lib/integrations/evo/types";
import { EVO_ENV_NAMES } from "../src/lib/integrations/evo/env";
import type { Database } from "../src/lib/supabase/types";

// Testes do endpoint /api/cron/reconcile-evo-pending. Cobre:
//  - auth: sem CRON_SECRET → 503; Bearer errado → 401; sem Bearer → 401
//  - EVO listSales retorna paid → deliver.sent chamado 1x
//  - EVO listSales retorna pending → não cria delivery
//  - EVO listSales retorna paid duplicado (mesma venda) → idempotência
//  - EVO listSales HTTP erro → 502 com counters
//  - paginação (2 páginas) → agrega counters

// ---------- fake admin ----------

type Row = Record<string, unknown>;

function makeAdmin(state: { evo_sales: Row[]; deliveries: Row[]; organizations: Row[]; evo_branches: Row[] }): SupabaseClient<Database> {
  function getTable(t: string): Row[] {
    if (t === "organizations") return state.organizations;
    if (t === "evo_branches") return state.evo_branches;
    if (t === "evo_sales") return state.evo_sales;
    if (t === "ad_conversion_deliveries") return state.deliveries;
    return [];
  }
  function from(t: string) {
    const filters: Array<[string, unknown]> = [];
    let pendingInsert: Row | null = null;
    let pendingUpdate: Row | null = null;
    let pendingUpsert: { record: Row; opts?: { onConflict?: string } } | null = null;
    const applyFilters = (): Row[] => getTable(t).filter((r) => filters.every(([c, v]) => r[c] === v));
    const runInsert = (): Row => {
      const now = new Date().toISOString();
      const row: Row = { id: `${t}-${getTable(t).length + 1}`, created_at: now, updated_at: now, ...pendingInsert };
      getTable(t).push(row);
      pendingInsert = null;
      return row;
    };
    const runUpsertEvoSale = (): Row => {
      const cols = (pendingUpsert!.opts?.onConflict ?? "id_branch,id_sale").split(",");
      const idx = state.evo_sales.findIndex((r) => cols.every((c) => (r as Row)[c] === (pendingUpsert!.record as Row)[c]));
      const now = new Date().toISOString();
      let row: Row;
      if (idx >= 0) {
        row = { ...state.evo_sales[idx], ...pendingUpsert!.record, updated_at: now };
        state.evo_sales[idx] = row;
      } else {
        row = { id: `sale-${state.evo_sales.length + 1}`, created_at: now, updated_at: now, ...pendingUpsert!.record };
        state.evo_sales.push(row);
      }
      pendingUpsert = null;
      return row;
    };
    const b: any = {
      select() {
        if (pendingInsert) {
          const row = runInsert();
          return {
            single: async () => ({ data: row, error: null }),
            maybeSingle: async () => ({ data: row, error: null }),
          };
        }
        if (pendingUpsert && t === "evo_sales") {
          const row = runUpsertEvoSale();
          return {
            single: async () => ({ data: row, error: null }),
            maybeSingle: async () => ({ data: row, error: null }),
          };
        }
        if (pendingUpdate) {
          const rows = applyFilters();
          for (const r of rows) Object.assign(r, pendingUpdate);
          pendingUpdate = null;
          return {
            single: async () => ({ data: rows[0] ?? null, error: null }),
            maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
          };
        }
        return b;
      },
      eq(c: string, v: unknown) {
        filters.push([c, v]);
        return b;
      },
      maybeSingle: async () => {
        if (pendingUpdate) {
          const rows = applyFilters();
          for (const r of rows) Object.assign(r, pendingUpdate);
          pendingUpdate = null;
          return { data: null, error: null };
        }
        if (pendingUpsert && t === "evo_sales") {
          const row = runUpsertEvoSale();
          return { data: row, error: null };
        }
        const rows = applyFilters();
        return { data: rows[0] ?? null, error: null };
      },
      single: async () => {
        const rows = applyFilters();
        if (rows.length === 0) return { data: null, error: { message: "not-found" } };
        return { data: rows[0], error: null };
      },
      insert(row: Row) {
        pendingInsert = row;
        return b;
      },
      update(row: Row) {
        pendingUpdate = row;
        return b;
      },
      upsert(record: Row, opts?: { onConflict?: string }) {
        pendingUpsert = { record, opts };
        return b;
      },
      then(res: (v: { data: null; error: null }) => unknown) {
        if (pendingUpdate) {
          const rows = applyFilters();
          for (const r of rows) Object.assign(r, pendingUpdate);
          pendingUpdate = null;
        } else if (pendingUpsert && t === "evo_sales") runUpsertEvoSale();
        else if (pendingInsert) runInsert();
        return Promise.resolve(res({ data: null, error: null }));
      },
    };
    return b;
  }
  return { from } as unknown as SupabaseClient<Database>;
}

// ---------- fake EVO client ----------

function makeEvo(pages: EvoSaleDetails[][]): EvoClient {
  let calls = 0;
  return {
    isConfigured: () => true,
    fetchSale: async () => ({ ok: false, error: { code: "not-found", message: "" } }),
    fetchMember: async () => ({ ok: false, error: { code: "not-found", message: "" } }),
    listSales: async (params: EvoListSalesParams): Promise<EvoListSalesResult> => {
      void params;
      const page = pages[calls] ?? [];
      calls++;
      return { ok: true, sales: page };
    },
  };
}

function makeEvoError(): EvoClient {
  return {
    isConfigured: () => true,
    fetchSale: async () => ({ ok: false, error: { code: "not-found", message: "" } }),
    fetchMember: async () => ({ ok: false, error: { code: "not-found", message: "" } }),
    listSales: async (): Promise<EvoListSalesResult> => ({
      ok: false,
      error: { code: "network", message: "EVO respondeu HTTP 500 (servidor)." },
    }),
  };
}

// ---------- helpers env / request ----------

function withEnv<T>(vars: Record<string, string | undefined>, fn: () => Promise<T> | T): Promise<T> {
  const saved: Record<string, string | undefined> = {};
  for (const k of Object.keys(vars)) {
    saved[k] = process.env[k];
    const v = vars[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return Promise.resolve()
    .then(() => fn())
    .finally(() => {
      for (const k of Object.keys(vars)) {
        if (saved[k] === undefined) delete process.env[k];
        else process.env[k] = saved[k];
      }
    });
}

function withEvoAndCronEnv<T>(fn: () => Promise<T>): Promise<T> {
  const vars: Record<string, string> = { CRON_SECRET: "test-cron-secret" };
  for (const n of EVO_ENV_NAMES) vars[n] = `TEST_${n}`;
  return withEnv(vars, fn);
}

function makeReq(opts: { auth?: string | null; hours?: number; take?: number } = {}): Request {
  const headers: Record<string, string> = {};
  const auth = opts.auth === undefined ? "test-cron-secret" : opts.auth;
  if (auth !== null) headers["authorization"] = `Bearer ${auth}`;
  const url = new URL("https://loudflow.test/api/cron/reconcile-evo-pending");
  if (opts.hours !== undefined) url.searchParams.set("hours", String(opts.hours));
  if (opts.take !== undefined) url.searchParams.set("take", String(opts.take));
  return new Request(url.toString(), { method: "GET", headers });
}

function newState(): { evo_sales: Row[]; deliveries: Row[]; organizations: Row[]; evo_branches: Row[] } {
  return {
    organizations: [{ id: "org-loud-fit", slug: "TEST_EVO_DEFAULT_ORGANIZATION_SLUG" }],
    evo_branches: [],
    evo_sales: [],
    deliveries: [],
  };
}

function paidSale(overrides: Partial<EvoSaleDetails> = {}): EvoSaleDetails {
  return {
    idSale: 12345,
    idBranch: 1,
    idMember: 777,
    saleDate: "2026-08-01T00:00:00",
    removed: null,
    ammountPaid: 129.9,
    receivables: [
      {
        idReceivable: 1,
        ammountPaid: 129.9,
        receivingDate: "2026-08-17T09:55:49",
        paymentType: { id: 7, name: "TransferenciaDeposito" },
        status: { id: 2, name: "received" },
      },
    ],
    member: {
      idMember: 777,
      firstName: "Ana",
      lastName: "Silva",
      contacts: [
        { contactType: "E-mail", description: "ana@example.com" },
        { contactType: "Cellphone", description: "11999998888" },
      ],
    },
    ...overrides,
  };
}

function pendingSale(): EvoSaleDetails {
  return {
    idSale: 999,
    idBranch: 1,
    idMember: 888,
    saleDate: "2026-08-14T10:00:00",
    removed: null,
    receivables: [
      {
        ammountPaid: 149.9,
        receivingDate: null,
        paymentType: { id: 1, name: "Pix" },
        status: { id: 1, name: "Waiting" },
      },
    ],
  };
}

// ---------- Testes ----------

test.describe("handleEvoReconcile", () => {
  test("CRON_SECRET ausente → 503 cron-not-configured", async () => {
    await withEnv({ CRON_SECRET: undefined }, async () => {
      const admin = makeAdmin(newState());
      const res = await handleEvoReconcile(makeReq({ auth: "anything" }), { admin });
      expect(res.status).toBe(503);
    });
  });

  test("Bearer errado → 401", async () => {
    await withEvoAndCronEnv(async () => {
      const admin = makeAdmin(newState());
      const evo = makeEvo([]);
      const res = await handleEvoReconcile(makeReq({ auth: "errado" }), { admin, evoClient: evo });
      expect(res.status).toBe(401);
    });
  });

  test("sem Authorization header → 401", async () => {
    await withEvoAndCronEnv(async () => {
      const admin = makeAdmin(newState());
      const evo = makeEvo([]);
      const res = await handleEvoReconcile(makeReq({ auth: null }), { admin, evoClient: evo });
      expect(res.status).toBe(401);
    });
  });

  test("envs EVO faltando → 503", async () => {
    await withEnv({ CRON_SECRET: "test-cron-secret" }, async () => {
      // Sem envs EVO
      const admin = makeAdmin(newState());
      const evo = makeEvo([]);
      const res = await handleEvoReconcile(makeReq(), { admin, evoClient: evo });
      expect(res.status).toBe(503);
    });
  });

  test("EVO listSales → 1 paid + 1 pending: 1 delivery sent, 0 skipped, evo_sales tem 2 rows", async () => {
    await withEvoAndCronEnv(async () => {
      process.env.UTMIFY_ORDERS_API_TOKEN = "TEST_UTMIFY_ORDERS_API_TOKEN";
      try {
        const state = newState();
        const admin = makeAdmin(state);
        const evo = makeEvo([[paidSale(), pendingSale()]]);
        let sends = 0;
        const utmify = {
          isConfigured: () => true,
          sendOrder: async () => {
            sends++;
            return { ok: true as const, status: 200, responseSummary: "HTTP 200" };
          },
        };
        const res = await handleEvoReconcile(makeReq(), { admin, evoClient: evo, utmifyOrdersClient: utmify });
        expect(res.status).toBe(200);
        const body = (await res.json()) as { counters: any };
        expect(body.counters.fetched).toBe(2);
        expect(body.counters.paid).toBe(1);
        expect(body.counters.pending).toBe(1);
        expect(body.counters.delivery_sent).toBe(1);
        expect(body.counters.delivery_failed).toBe(0);
        expect(body.counters.delivery_skipped).toBe(0);
        expect(state.evo_sales).toHaveLength(2);
        expect(state.deliveries).toHaveLength(1);
        expect(state.deliveries[0]!.status).toBe("sent");
        expect(sends).toBe(1);
      } finally {
        delete process.env.UTMIFY_ORDERS_API_TOKEN;
      }
    });
  });

  test("idempotência: mesma venda paga em 2 execuções → só 1 delivery sent", async () => {
    await withEvoAndCronEnv(async () => {
      process.env.UTMIFY_ORDERS_API_TOKEN = "TEST_UTMIFY_ORDERS_API_TOKEN";
      try {
        const state = newState();
        const admin = makeAdmin(state);
        const evo = makeEvo([[paidSale()], [paidSale()]]);
        let sends = 0;
        const utmify = {
          isConfigured: () => true,
          sendOrder: async () => {
            sends++;
            return { ok: true as const, status: 200, responseSummary: "HTTP 200" };
          },
        };
        await handleEvoReconcile(makeReq(), { admin, evoClient: evo, utmifyOrdersClient: utmify });
        // Segunda execução com fake reset — recria o cliente pra iterar página nova
        const evo2 = makeEvo([[paidSale()]]);
        const res2 = await handleEvoReconcile(makeReq(), { admin, evoClient: evo2, utmifyOrdersClient: utmify });
        const body2 = (await res2.json()) as { counters: any };
        expect(body2.counters.delivery_sent).toBe(0);
        expect(body2.counters.delivery_skipped).toBe(1);
        expect(sends).toBe(1);
        expect(state.evo_sales).toHaveLength(1);
        expect(state.deliveries).toHaveLength(1);
      } finally {
        delete process.env.UTMIFY_ORDERS_API_TOKEN;
      }
    });
  });

  test("EVO list falha → 502 com counters preservados", async () => {
    await withEvoAndCronEnv(async () => {
      const admin = makeAdmin(newState());
      const evo = makeEvoError();
      const res = await handleEvoReconcile(makeReq(), { admin, evoClient: evo });
      expect(res.status).toBe(502);
      const body = (await res.json()) as { error: string; counters: any };
      expect(body.error).toBe("evo-list-failed");
      expect(body.counters.fetched).toBe(0);
    });
  });

  test("paginação: primeira página cheia (=take), segunda vazia → para", async () => {
    await withEvoAndCronEnv(async () => {
      process.env.UTMIFY_ORDERS_API_TOKEN = "TEST_UTMIFY_ORDERS_API_TOKEN";
      try {
        const state = newState();
        const admin = makeAdmin(state);
        // Página 1: 2 paid (mesmo id repetido é dedupado; usar id diferente)
        const s1 = paidSale({ idSale: 111 });
        const s2 = paidSale({ idSale: 222 });
        const evo = makeEvo([[s1, s2], []]);
        const utmify = {
          isConfigured: () => true,
          sendOrder: async () => ({ ok: true as const, status: 200, responseSummary: "" }),
        };
        const res = await handleEvoReconcile(makeReq({ take: 2 }), { admin, evoClient: evo, utmifyOrdersClient: utmify });
        const body = (await res.json()) as { counters: any };
        expect(res.status).toBe(200);
        expect(body.counters.pages).toBeGreaterThanOrEqual(1);
        expect(body.counters.paid).toBe(2);
        expect(state.deliveries).toHaveLength(2);
      } finally {
        delete process.env.UTMIFY_ORDERS_API_TOKEN;
      }
    });
  });

  test("delivery usa member INLINE do listSales (sem fallback fetchMember)", async () => {
    await withEvoAndCronEnv(async () => {
      process.env.UTMIFY_ORDERS_API_TOKEN = "TEST_UTMIFY_ORDERS_API_TOKEN";
      try {
        const state = newState();
        const admin = makeAdmin(state);
        let memberFetchCalls = 0;
        const evo: EvoClient = {
          isConfigured: () => true,
          fetchSale: async () => ({ ok: false, error: { code: "not-found", message: "" } }),
          fetchMember: async () => {
            memberFetchCalls++;
            return { ok: false, error: { code: "not-found", message: "should-not-be-called" } };
          },
          listSales: async () => ({ ok: true, sales: [paidSale()] }),
        };
        let capturedPayload: any = null;
        const utmify = {
          isConfigured: () => true,
          sendOrder: async (p: any) => {
            capturedPayload = p;
            return { ok: true as const, status: 200, responseSummary: "" };
          },
        };
        const res = await handleEvoReconcile(makeReq(), { admin, evoClient: evo, utmifyOrdersClient: utmify });
        expect(res.status).toBe(200);
        expect(memberFetchCalls).toBe(0);
        expect(capturedPayload.customer.email).toBe("ana@example.com");
        expect(capturedPayload.customer.name).toBe("Ana Silva");
        // createdAt / approvedDate vem de receivingDate. EVO envia sem
        // offset (BRT/-03), a converte para UTC → +3h → 12:55:49.
        expect(capturedPayload.createdAt).toBe("2026-08-17 12:55:49");
        expect(capturedPayload.approvedDate).toBe("2026-08-17 12:55:49");
        // paymentMethod: TransferenciaDeposito → boleto (mapeamento novo)
        expect(capturedPayload.paymentMethod).toBe("boleto");
      } finally {
        delete process.env.UTMIFY_ORDERS_API_TOKEN;
      }
    });
  });
});
