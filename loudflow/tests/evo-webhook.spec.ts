import { test, expect } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleEvoWebhook } from "../src/lib/integrations/evo/webhook";
import type {
  EvoClient,
  EvoFetchResult,
  EvoMemberFetchResult,
  EvoSaleDetails,
} from "../src/lib/integrations/evo/types";
import { EVO_ENV_NAMES } from "../src/lib/integrations/evo/env";
import type { Database } from "../src/lib/supabase/types";

// Testes de ponta-a-ponta da lógica do webhook, com admin (Supabase) e
// cliente EVO mockados. Cobre os 8 cenários da spec:
//   * venda paga → paid + amount + receiving_date
//   * Pix ainda pendente → pending
//   * venda cancelada (removed=true) → cancelled
//   * webhook duplicado → idempotente (unique branch+sale)
//   * segredo inválido → 401
//   * payload inválido → 400
//   * falha temporária da EVO → 502 + registro pending/error
//   * unidades diferentes com o mesmo idSale → duas linhas distintas

// ---------- fake admin (Supabase-like) ----------

type EvoBranchRow = {
  id_branch: string;
  organization_id: string;
  unit_id: string | null;
};

type EvoSaleRow = {
  id: string;
  organization_id: string;
  unit_id: string | null;
  id_w12: string | null;
  id_branch: string;
  id_sale: string;
  id_member: string | null;
  event_type: string;
  amount_paid_cents: number | null;
  sale_date: string | null;
  receiving_date: string | null;
  payment_type: string | null;
  receivable_status: string | null;
  processing_status: string;
  last_reason: string | null;
  created_at: string;
  updated_at: string;
};

type AdConvDeliveryRow = {
  id: string;
  organization_id: string;
  evo_sale_id: string;
  platform: string;
  delivery_key: string;
  status: string;
  attempts: number;
  last_error: string | null;
  response_summary: string | null;
  last_attempt_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

type FakeState = {
  organizations: Array<{ id: string; slug: string }>;
  evo_branches: EvoBranchRow[];
  evo_sales: EvoSaleRow[];
  ad_conversion_deliveries: AdConvDeliveryRow[];
};

function makeFakeAdmin(state: FakeState): SupabaseClient<Database> {
  function getRows(t: string): Array<Record<string, unknown>> {
    if (t === "organizations") return state.organizations as Array<Record<string, unknown>>;
    if (t === "evo_branches") return state.evo_branches as Array<Record<string, unknown>>;
    if (t === "evo_sales") return state.evo_sales as Array<Record<string, unknown>>;
    if (t === "ad_conversion_deliveries")
      return state.ad_conversion_deliveries as Array<Record<string, unknown>>;
    return [];
  }

  function upsertEvoSale(record: Record<string, unknown>, opts?: { onConflict?: string }) {
    const conflictCols = (opts?.onConflict ?? "id_branch,id_sale").split(",");
    const idx = state.evo_sales.findIndex((r) =>
      conflictCols.every((c) => (r as Record<string, unknown>)[c] === record[c]),
    );
    const now = new Date().toISOString();
    let row: EvoSaleRow;
    if (idx >= 0) {
      row = {
        ...state.evo_sales[idx],
        ...(record as Partial<EvoSaleRow>),
        updated_at: now,
      } as EvoSaleRow;
      state.evo_sales[idx] = row;
    } else {
      row = {
        id: `sale-${state.evo_sales.length + 1}`,
        created_at: now,
        updated_at: now,
        ...(record as Omit<EvoSaleRow, "id" | "created_at" | "updated_at">),
      } as EvoSaleRow;
      state.evo_sales.push(row);
    }
    return row;
  }

  function from(table: string) {
    const filters: Array<[string, unknown]> = [];
    let pendingInsert: Record<string, unknown> | null = null;
    let pendingUpdate: Record<string, unknown> | null = null;
    let pendingUpsert: {
      record: Record<string, unknown>;
      opts?: { onConflict?: string };
    } | null = null;

    const applyFilters = (): Array<Record<string, unknown>> =>
      getRows(table).filter((r) => filters.every(([c, v]) => r[c] === v));

    const finalize = (rows: Array<Record<string, unknown>>) => ({
      maybeSingle: async () => {
        if (rows.length === 0) return { data: null, error: null };
        return { data: rows[0], error: null };
      },
      single: async () => {
        if (rows.length === 0) return { data: null, error: { message: "not-found" } };
        return { data: rows[0], error: null };
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {
      select(_cols?: string) {
        void _cols;
        // Se veio depois de insert/update/upsert, resolve com a linha afetada.
        if (pendingInsert) {
          const now = new Date().toISOString();
          const row: Record<string, unknown> = {
            id: `${table}-${(getRows(table).length + 1).toString()}`,
            created_at: now,
            updated_at: now,
            ...pendingInsert,
          };
          getRows(table).push(row);
          pendingInsert = null;
          return finalize([row]);
        }
        if (pendingUpsert && table === "evo_sales") {
          const row = upsertEvoSale(pendingUpsert.record, pendingUpsert.opts);
          pendingUpsert = null;
          return finalize([row as unknown as Record<string, unknown>]);
        }
        if (pendingUpdate) {
          const rows = applyFilters();
          for (const r of rows) Object.assign(r, pendingUpdate);
          pendingUpdate = null;
          return finalize(rows);
        }
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push([col, val]);
        return builder;
      },
      maybeSingle: async () => {
        // Se veio depois de update sem select, aplica o update primeiro.
        if (pendingUpdate) {
          const rows = applyFilters();
          for (const r of rows) Object.assign(r, pendingUpdate);
          pendingUpdate = null;
          return { data: null, error: null };
        }
        // Se veio depois de upsert sem select, aplica e resolve com a linha
        if (pendingUpsert && table === "evo_sales") {
          const row = upsertEvoSale(pendingUpsert.record, pendingUpsert.opts);
          pendingUpsert = null;
          return { data: row, error: null };
        }
        const rows = applyFilters();
        if (rows.length === 0) return { data: null, error: null };
        return { data: rows[0], error: null };
      },
      single: async () => {
        if (pendingInsert) {
          const now = new Date().toISOString();
          const row: Record<string, unknown> = {
            id: `${table}-${(getRows(table).length + 1).toString()}`,
            created_at: now,
            updated_at: now,
            ...pendingInsert,
          };
          getRows(table).push(row);
          pendingInsert = null;
          return { data: row, error: null };
        }
        const rows = applyFilters();
        if (rows.length === 0) return { data: null, error: { message: "not-found" } };
        return { data: rows[0], error: null };
      },
      insert(record: Record<string, unknown>) {
        pendingInsert = record;
        return builder;
      },
      update(record: Record<string, unknown>) {
        pendingUpdate = record;
        return builder;
      },
      upsert(record: Record<string, unknown>, opts?: { onConflict?: string }) {
        if (table === "evo_sales") {
          pendingUpsert = { record, opts };
          return builder;
        }
        return builder;
      },
      // Thenable: quando o código faz `await admin.from(t).update(x).eq(y,z)`
      // sem .select(), o builder resolve aqui aplicando a operação pending.
      then(resolve: (v: { data: null; error: null }) => unknown) {
        if (pendingUpdate) {
          const rows = applyFilters();
          for (const r of rows) Object.assign(r, pendingUpdate);
          pendingUpdate = null;
        } else if (pendingUpsert && table === "evo_sales") {
          upsertEvoSale(pendingUpsert.record, pendingUpsert.opts);
          pendingUpsert = null;
        } else if (pendingInsert) {
          const now = new Date().toISOString();
          const row: Record<string, unknown> = {
            id: `${table}-${(getRows(table).length + 1).toString()}`,
            created_at: now,
            updated_at: now,
            ...pendingInsert,
          };
          getRows(table).push(row);
          pendingInsert = null;
        }
        return Promise.resolve(resolve({ data: null, error: null }));
      },
    };
    return builder;
  }
  return { from } as unknown as SupabaseClient<Database>;
}

// ---------- fake EVO client ----------

function makeFakeEvoClient(
  handler: (idBranch: string, idSale: string) => EvoFetchResult,
  memberHandler?: (idMember: string) => EvoMemberFetchResult,
): EvoClient {
  return {
    isConfigured: () => true,
    fetchSale: async (b, s) => handler(b, s),
    fetchMember: async (idMember: string) =>
      memberHandler
        ? memberHandler(idMember)
        : { ok: false, error: { code: "not-found", message: "not stubbed" } },
  };
}

// ---------- helpers de env / request ----------

function withEvoEnv<T>(fn: () => Promise<T> | T): Promise<T> {
  const saved: Record<string, string | undefined> = {};
  for (const name of EVO_ENV_NAMES) {
    saved[name] = process.env[name];
    process.env[name] = `TEST_${name}`;
  }
  return Promise.resolve()
    .then(() => fn())
    .finally(() => {
      for (const name of EVO_ENV_NAMES) {
        if (saved[name] === undefined) delete process.env[name];
        else process.env[name] = saved[name];
      }
    });
}

function newSaleRequest(body: unknown, opts: { secret?: string | null; badJson?: boolean } = {}): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const s = opts.secret === undefined ? "TEST_EVO_WEBHOOK_SECRET" : opts.secret;
  if (s !== null) headers["x-evo-webhook-secret"] = s;
  return new Request("https://loudflow.test/api/webhooks/evo/sales", {
    method: "POST",
    headers,
    body: opts.badJson ? "{not json" : JSON.stringify(body),
  });
}

function newFixtureState(overrides: Partial<FakeState> = {}): FakeState {
  return {
    organizations: [{ id: "org-loud-fit", slug: "TEST_EVO_DEFAULT_ORGANIZATION_SLUG" }],
    evo_branches: [],
    evo_sales: [],
    ad_conversion_deliveries: [],
    ...overrides,
  };
}

function paidSale(): EvoSaleDetails {
  return {
    idSale: 12345,
    idBranch: 10,
    saleDate: "2026-08-14T10:00:00-03:00",
    removed: false,
    ammountPaid: 149.9,
    receivables: [
      {
        idReceivable: 1,
        ammountPaid: 149.9,
        receivingDate: "2026-08-14T10:05:00-03:00",
        paymentType: "Pix",
        status: "Recebido",
      },
    ],
  };
}

function pendingPixSale(): EvoSaleDetails {
  return {
    idSale: 999,
    idBranch: 10,
    saleDate: "2026-08-14T10:00:00-03:00",
    removed: false,
    ammountPaid: 149.9,
    receivables: [
      {
        idReceivable: 2,
        ammountPaid: 149.9,
        receivingDate: null,
        paymentType: "Pix",
        status: "Aguardando pagamento",
      },
    ],
  };
}

function cancelledSale(): EvoSaleDetails {
  return {
    idSale: 42,
    idBranch: 10,
    removed: true,
    ammountPaid: 300,
    receivables: [],
  };
}

// ---------- Testes ----------

test.describe("handleEvoWebhook", () => {
  test("segredo inválido → 401", async () => {
    await withEvoEnv(async () => {
      const state = newFixtureState();
      const admin = makeFakeAdmin(state);
      const evoClient = makeFakeEvoClient(() => ({ ok: true, sale: paidSale() }));
      const req = newSaleRequest(
        { IdW12: "w1", IdBranch: "10", IdRecord: "12345", EventType: "NewSale" },
        { secret: "errado" },
      );
      const res = await handleEvoWebhook(req, { admin, evoClient });
      expect(res.status).toBe(401);
      expect(state.evo_sales).toHaveLength(0);
    });
  });

  test("payload inválido (JSON quebrado) → 400", async () => {
    await withEvoEnv(async () => {
      const state = newFixtureState();
      const admin = makeFakeAdmin(state);
      const evoClient = makeFakeEvoClient(() => ({ ok: true, sale: paidSale() }));
      const req = newSaleRequest({}, { badJson: true });
      const res = await handleEvoWebhook(req, { admin, evoClient });
      expect(res.status).toBe(400);
    });
  });

  test("EventType diferente de NewSale → 202 ignored (sem registro)", async () => {
    await withEvoEnv(async () => {
      const state = newFixtureState();
      const admin = makeFakeAdmin(state);
      const evoClient = makeFakeEvoClient(() => ({ ok: true, sale: paidSale() }));
      const req = newSaleRequest({ EventType: "SaleUpdated", IdBranch: "10", IdRecord: "1" });
      const res = await handleEvoWebhook(req, { admin, evoClient });
      expect(res.status).toBe(202);
      expect(state.evo_sales).toHaveLength(0);
    });
  });

  test("payload sem IdBranch/IdRecord → 400", async () => {
    await withEvoEnv(async () => {
      const state = newFixtureState();
      const admin = makeFakeAdmin(state);
      const evoClient = makeFakeEvoClient(() => ({ ok: true, sale: paidSale() }));
      const req = newSaleRequest({ EventType: "NewSale" });
      const res = await handleEvoWebhook(req, { admin, evoClient });
      expect(res.status).toBe(400);
    });
  });

  test("venda paga (Pix confirmado) → paid + amount_paid_cents + receiving_date", async () => {
    await withEvoEnv(async () => {
      const state = newFixtureState();
      const admin = makeFakeAdmin(state);
      const evoClient = makeFakeEvoClient(() => ({ ok: true, sale: paidSale() }));
      const req = newSaleRequest({
        IdW12: "w1",
        IdBranch: "10",
        IdRecord: "12345",
        EventType: "NewSale",
      });
      const res = await handleEvoWebhook(req, { admin, evoClient });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { status: string; amountPaidCents: number };
      expect(body.status).toBe("paid");
      expect(body.amountPaidCents).toBe(14990);
      expect(state.evo_sales).toHaveLength(1);
      const row = state.evo_sales[0]!;
      expect(row.processing_status).toBe("paid");
      expect(row.amount_paid_cents).toBe(14990);
      expect(row.payment_type).toBe("Pix");
      expect(row.receiving_date).toBe("2026-08-14T10:05:00-03:00");
      expect(row.id_branch).toBe("10");
      expect(row.id_sale).toBe("12345");
      expect(row.organization_id).toBe("org-loud-fit");
    });
  });

  test("Pix gerado ainda pendente → pending (não contabiliza)", async () => {
    await withEvoEnv(async () => {
      const state = newFixtureState();
      const admin = makeFakeAdmin(state);
      const evoClient = makeFakeEvoClient(() => ({ ok: true, sale: pendingPixSale() }));
      const req = newSaleRequest({
        IdW12: "w1",
        IdBranch: "10",
        IdRecord: "999",
        EventType: "NewSale",
      });
      const res = await handleEvoWebhook(req, { admin, evoClient });
      expect(res.status).toBe(200);
      const row = state.evo_sales[0]!;
      expect(row.processing_status).toBe("pending");
      expect(row.amount_paid_cents).toBeNull();
      expect(row.receiving_date).toBeNull();
      expect(row.payment_type).toBe("Pix");
    });
  });

  test("venda cancelada (removed=true) → cancelled (não contabiliza)", async () => {
    await withEvoEnv(async () => {
      const state = newFixtureState();
      const admin = makeFakeAdmin(state);
      const evoClient = makeFakeEvoClient(() => ({ ok: true, sale: cancelledSale() }));
      const req = newSaleRequest({
        IdBranch: "10",
        IdRecord: "42",
        EventType: "NewSale",
      });
      const res = await handleEvoWebhook(req, { admin, evoClient });
      expect(res.status).toBe(200);
      const row = state.evo_sales[0]!;
      expect(row.processing_status).toBe("cancelled");
      expect(row.amount_paid_cents).toBeNull();
    });
  });

  test("webhook duplicado (retry EVO) → idempotente: uma linha só", async () => {
    await withEvoEnv(async () => {
      const state = newFixtureState();
      const admin = makeFakeAdmin(state);
      const evoClient = makeFakeEvoClient(() => ({ ok: true, sale: paidSale() }));
      const payload = {
        IdW12: "w1",
        IdBranch: "10",
        IdRecord: "12345",
        EventType: "NewSale",
      };
      const r1 = await handleEvoWebhook(newSaleRequest(payload), { admin, evoClient });
      const r2 = await handleEvoWebhook(newSaleRequest(payload), { admin, evoClient });
      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      const b2 = (await r2.json()) as { duplicate: boolean };
      expect(b2.duplicate).toBe(true);
      expect(state.evo_sales).toHaveLength(1);
    });
  });

  test("mesmo idSale em branches diferentes → duas linhas independentes", async () => {
    await withEvoEnv(async () => {
      const state = newFixtureState();
      const admin = makeFakeAdmin(state);
      const evoClient = makeFakeEvoClient((branch) => ({
        ok: true,
        sale: {
          ...paidSale(),
          idBranch: Number(branch),
        },
      }));
      const base = { IdW12: "w1", IdRecord: "12345", EventType: "NewSale" };
      await handleEvoWebhook(newSaleRequest({ ...base, IdBranch: "10" }), { admin, evoClient });
      await handleEvoWebhook(newSaleRequest({ ...base, IdBranch: "20" }), { admin, evoClient });
      expect(state.evo_sales).toHaveLength(2);
      const branches = state.evo_sales.map((r) => r.id_branch).sort();
      expect(branches).toEqual(["10", "20"]);
    });
  });

  test("falha temporária da EVO (network) → 502 + registro 'error' com reason", async () => {
    await withEvoEnv(async () => {
      const state = newFixtureState();
      const admin = makeFakeAdmin(state);
      const evoClient = makeFakeEvoClient(() => ({
        ok: false,
        error: { code: "network", message: "EVO respondeu HTTP 502 (servidor)." },
      }));
      const req = newSaleRequest({
        IdBranch: "10",
        IdRecord: "12345",
        EventType: "NewSale",
      });
      const res = await handleEvoWebhook(req, { admin, evoClient });
      expect(res.status).toBe(502);
      // Registrou como 'error' pra permitir reprocesso pela retentativa
      // subsequente da EVO (que virá exatamente com o mesmo par branch+sale).
      expect(state.evo_sales).toHaveLength(1);
      const row = state.evo_sales[0]!;
      expect(row.processing_status).toBe("error");
      expect(row.last_reason).toContain("evo-fetch:network");
      expect(row.amount_paid_cents).toBeNull();
    });
  });

  test("EVO respondendo 401 (credencial inválida) → 502 + registro error", async () => {
    await withEvoEnv(async () => {
      const state = newFixtureState();
      const admin = makeFakeAdmin(state);
      const evoClient = makeFakeEvoClient(() => ({
        ok: false,
        error: { code: "unauthorized", message: "EVO recusou o Basic Auth (HTTP 401)." },
      }));
      const req = newSaleRequest({
        IdBranch: "10",
        IdRecord: "12345",
        EventType: "NewSale",
      });
      const res = await handleEvoWebhook(req, { admin, evoClient });
      expect(res.status).toBe(502);
      expect(state.evo_sales[0]!.processing_status).toBe("error");
      expect(state.evo_sales[0]!.last_reason).toContain("unauthorized");
    });
  });

  test("envs EVO faltando → 503 sem chamar a EVO", async () => {
    const saved: Record<string, string | undefined> = {};
    for (const name of EVO_ENV_NAMES) {
      saved[name] = process.env[name];
      delete process.env[name];
    }
    // Set apenas o segredo, para passar da primeira verificação.
    process.env.EVO_WEBHOOK_SECRET = "s";
    try {
      const state = newFixtureState();
      const admin = makeFakeAdmin(state);
      let called = false;
      const evoClient = makeFakeEvoClient(() => {
        called = true;
        return { ok: true, sale: paidSale() };
      });
      const req = newSaleRequest(
        { IdBranch: "10", IdRecord: "1", EventType: "NewSale" },
        { secret: "s" },
      );
      const res = await handleEvoWebhook(req, { admin, evoClient });
      expect(res.status).toBe(503);
      const body = (await res.json()) as { missing: string[] };
      expect(body.missing.length).toBeGreaterThan(0);
      expect(called).toBe(false);
    } finally {
      for (const name of EVO_ENV_NAMES) {
        if (saved[name] === undefined) delete process.env[name];
        else process.env[name] = saved[name];
      }
    }
  });

  test("organização inexistente → 500 org-not-found", async () => {
    await withEvoEnv(async () => {
      const state = newFixtureState({ organizations: [] });
      const admin = makeFakeAdmin(state);
      const evoClient = makeFakeEvoClient(() => ({ ok: true, sale: paidSale() }));
      const req = newSaleRequest({
        IdBranch: "10",
        IdRecord: "1",
        EventType: "NewSale",
      });
      const res = await handleEvoWebhook(req, { admin, evoClient });
      expect(res.status).toBe(500);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe("org-not-found");
    });
  });

  test("branch mapeado em evo_branches → registro carrega unit_id", async () => {
    await withEvoEnv(async () => {
      const state = newFixtureState({
        evo_branches: [
          { id_branch: "10", organization_id: "org-loud-fit", unit_id: "unit-ipiranga" },
        ],
      });
      const admin = makeFakeAdmin(state);
      const evoClient = makeFakeEvoClient(() => ({ ok: true, sale: paidSale() }));
      const req = newSaleRequest({
        IdBranch: "10",
        IdRecord: "12345",
        EventType: "NewSale",
      });
      await handleEvoWebhook(req, { admin, evoClient });
      expect(state.evo_sales[0]!.unit_id).toBe("unit-ipiranga");
    });
  });

  // ---------- Envio de conversão paga → UTMify (Fase 4) ----------

  test("venda paga + UTMify não configurada → delivery skipped, resposta 200", async () => {
    await withEvoEnv(async () => {
      const state = newFixtureState();
      const admin = makeFakeAdmin(state);
      const evoClient = makeFakeEvoClient(() => ({ ok: true, sale: paidSale() }));
      // NÃO injeta utmifyOrdersClient; env não tem UTMIFY_ORDERS_API_TOKEN.
      const req = newSaleRequest({
        IdW12: "w1",
        IdBranch: "10",
        IdRecord: "12345",
        EventType: "NewSale",
      });
      const res = await handleEvoWebhook(req, { admin, evoClient });
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        status: string;
        delivery: { status: string; reason: string | null };
      };
      expect(body.status).toBe("paid");
      expect(body.delivery.status).toBe("skipped");
      expect(body.delivery.reason).toBe("utmify-not-configured");
      // Nenhuma delivery deve ter sido criada (upsertPendingDelivery só roda quando configurado).
      expect(state.ad_conversion_deliveries).toHaveLength(0);
    });
  });

  test("venda paga + UTMify OK + member OK → envia 1x e persiste delivery 'sent'", async () => {
    await withEvoEnv(async () => {
      process.env.UTMIFY_ORDERS_API_TOKEN = "TEST_UTMIFY_ORDERS_API_TOKEN";
      try {
        const state = newFixtureState();
        const admin = makeFakeAdmin(state);
        const evoClient = makeFakeEvoClient(
          () => ({ ok: true, sale: { ...paidSale(), idMember: 777 } }),
          () => ({
            ok: true,
            member: {
              firstName: "Ana",
              lastName: "Silva",
              email: "ana@example.com",
              cellphone: "11999998888",
            },
          }),
        );
        const sentOrders: Array<{ orderId: string; status: string }> = [];
        const utmifyOrdersClient = {
          isConfigured: () => true,
          sendOrder: async (payload: { orderId: string; status: string }) => {
            sentOrders.push({ orderId: payload.orderId, status: payload.status });
            return {
              ok: true as const,
              status: 200,
              responseSummary: "HTTP 200 :: ok",
            };
          },
        };
        const req = newSaleRequest({
          IdW12: "w1",
          IdBranch: "10",
          IdRecord: "12345",
          EventType: "NewSale",
        });
        const res = await handleEvoWebhook(req, {
          admin,
          evoClient,
          utmifyOrdersClient,
        });
        expect(res.status).toBe(200);
        const body = (await res.json()) as {
          delivery: { status: string; reason: string | null };
        };
        expect(body.delivery.status).toBe("sent");
        expect(sentOrders).toHaveLength(1);
        expect(sentOrders[0]!.orderId).toBe("evo-10-12345");
        expect(sentOrders[0]!.status).toBe("paid");
        expect(state.ad_conversion_deliveries).toHaveLength(1);
        expect(state.ad_conversion_deliveries[0]!.status).toBe("sent");
        expect(state.ad_conversion_deliveries[0]!.platform).toBe("utmify");
        expect(state.ad_conversion_deliveries[0]!.delivery_key).toBe(
          "evo:10:12345:purchase",
        );
        expect(state.ad_conversion_deliveries[0]!.attempts).toBe(1);
      } finally {
        delete process.env.UTMIFY_ORDERS_API_TOKEN;
      }
    });
  });

  test("venda paga + member sem email → delivery skipped:customer-required (sem enviar)", async () => {
    await withEvoEnv(async () => {
      process.env.UTMIFY_ORDERS_API_TOKEN = "TEST_UTMIFY_ORDERS_API_TOKEN";
      try {
        const state = newFixtureState();
        const admin = makeFakeAdmin(state);
        const evoClient = makeFakeEvoClient(
          () => ({ ok: true, sale: { ...paidSale(), idMember: 777 } }),
          () => ({
            ok: true,
            member: { firstName: "Ana", lastName: "Silva", email: null },
          }),
        );
        let calls = 0;
        const utmifyOrdersClient = {
          isConfigured: () => true,
          sendOrder: async () => {
            calls++;
            return { ok: true as const, status: 200, responseSummary: "unused" };
          },
        };
        const req = newSaleRequest({
          IdBranch: "10",
          IdRecord: "12345",
          EventType: "NewSale",
        });
        const res = await handleEvoWebhook(req, {
          admin,
          evoClient,
          utmifyOrdersClient,
        });
        expect(res.status).toBe(200);
        const body = (await res.json()) as {
          delivery: { status: string; reason: string | null };
        };
        expect(body.delivery.status).toBe("skipped");
        expect(body.delivery.reason).toBe("customer-required");
        expect(calls).toBe(0);
        expect(state.ad_conversion_deliveries).toHaveLength(1);
        expect(state.ad_conversion_deliveries[0]!.status).toBe("skipped");
      } finally {
        delete process.env.UTMIFY_ORDERS_API_TOKEN;
      }
    });
  });

  test("UTMify responde 500 → delivery 'failed' com erro sanitizado, resposta 200", async () => {
    await withEvoEnv(async () => {
      process.env.UTMIFY_ORDERS_API_TOKEN = "TEST_UTMIFY_ORDERS_API_TOKEN";
      try {
        const state = newFixtureState();
        const admin = makeFakeAdmin(state);
        const evoClient = makeFakeEvoClient(
          () => ({ ok: true, sale: { ...paidSale(), idMember: 777 } }),
          () => ({
            ok: true,
            member: {
              firstName: "Ana",
              lastName: "Silva",
              email: "ana@example.com",
            },
          }),
        );
        const utmifyOrdersClient = {
          isConfigured: () => true,
          sendOrder: async () => ({
            ok: false as const,
            error: {
              code: "server-rejected" as const,
              message: "UTMify respondeu HTTP 500 :: internal error",
              httpStatus: 500,
            },
          }),
        };
        const req = newSaleRequest({
          IdBranch: "10",
          IdRecord: "12345",
          EventType: "NewSale",
        });
        const res = await handleEvoWebhook(req, {
          admin,
          evoClient,
          utmifyOrdersClient,
        });
        expect(res.status).toBe(200); // webhook OK — retry só do envio
        const body = (await res.json()) as {
          delivery: { status: string; reason: string | null };
        };
        expect(body.delivery.status).toBe("failed");
        expect(state.ad_conversion_deliveries[0]!.status).toBe("failed");
        expect(state.ad_conversion_deliveries[0]!.attempts).toBe(1);
        expect(state.ad_conversion_deliveries[0]!.last_error).toContain("server-rejected");
      } finally {
        delete process.env.UTMIFY_ORDERS_API_TOKEN;
      }
    });
  });

  test("webhook duplicado após 'sent' → não envia de novo (idempotência de delivery)", async () => {
    await withEvoEnv(async () => {
      process.env.UTMIFY_ORDERS_API_TOKEN = "TEST_UTMIFY_ORDERS_API_TOKEN";
      try {
        const state = newFixtureState();
        const admin = makeFakeAdmin(state);
        const evoClient = makeFakeEvoClient(
          () => ({ ok: true, sale: { ...paidSale(), idMember: 777 } }),
          () => ({
            ok: true,
            member: {
              firstName: "Ana",
              lastName: "Silva",
              email: "ana@example.com",
            },
          }),
        );
        let sends = 0;
        const utmifyOrdersClient = {
          isConfigured: () => true,
          sendOrder: async () => {
            sends++;
            return { ok: true as const, status: 200, responseSummary: "HTTP 200" };
          },
        };
        const payload = {
          IdBranch: "10",
          IdRecord: "12345",
          EventType: "NewSale",
        };
        await handleEvoWebhook(newSaleRequest(payload), {
          admin,
          evoClient,
          utmifyOrdersClient,
        });
        const res2 = await handleEvoWebhook(newSaleRequest(payload), {
          admin,
          evoClient,
          utmifyOrdersClient,
        });
        const body2 = (await res2.json()) as {
          delivery: { status: string; reason: string | null };
        };
        expect(sends).toBe(1);
        expect(body2.delivery.status).toBe("skipped");
        expect(body2.delivery.reason).toBe("already-sent");
        expect(state.ad_conversion_deliveries).toHaveLength(1);
      } finally {
        delete process.env.UTMIFY_ORDERS_API_TOKEN;
      }
    });
  });

  test("venda pending → NÃO cria delivery e não envia", async () => {
    await withEvoEnv(async () => {
      process.env.UTMIFY_ORDERS_API_TOKEN = "TEST_UTMIFY_ORDERS_API_TOKEN";
      try {
        const state = newFixtureState();
        const admin = makeFakeAdmin(state);
        const evoClient = makeFakeEvoClient(() => ({ ok: true, sale: pendingPixSale() }));
        let sends = 0;
        const utmifyOrdersClient = {
          isConfigured: () => true,
          sendOrder: async () => {
            sends++;
            return { ok: true as const, status: 200, responseSummary: "unused" };
          },
        };
        const req = newSaleRequest({
          IdBranch: "10",
          IdRecord: "999",
          EventType: "NewSale",
        });
        const res = await handleEvoWebhook(req, {
          admin,
          evoClient,
          utmifyOrdersClient,
        });
        const body = (await res.json()) as {
          status: string;
          delivery: { status: string; reason: string | null };
        };
        expect(body.status).toBe("pending");
        expect(body.delivery.status).toBe("not-attempted");
        expect(sends).toBe(0);
        expect(state.ad_conversion_deliveries).toHaveLength(0);
      } finally {
        delete process.env.UTMIFY_ORDERS_API_TOKEN;
      }
    });
  });
});
