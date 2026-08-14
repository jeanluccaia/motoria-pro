import { test, expect } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleEvoWebhook } from "../src/lib/integrations/evo/webhook";
import type {
  EvoClient,
  EvoFetchResult,
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

type FakeState = {
  organizations: Array<{ id: string; slug: string }>;
  evo_branches: EvoBranchRow[];
  evo_sales: EvoSaleRow[];
};

function makeFakeAdmin(state: FakeState): SupabaseClient<Database> {
  function from(table: string) {
    const filters: Array<[string, unknown]> = [];
    const builder = {
      select(_cols?: string) {
        void _cols;
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push([col, val]);
        return builder;
      },
      maybeSingle: async () => {
        const rows = getRows(table).filter((r: Record<string, unknown>) =>
          filters.every(([c, v]) => r[c] === v),
        );
        if (rows.length === 0) return { data: null, error: null };
        return { data: rows[0], error: null };
      },
      upsert: async (record: Record<string, unknown>, opts?: { onConflict?: string }) => {
        if (table === "evo_sales") {
          const conflictCols = (opts?.onConflict ?? "id_branch,id_sale").split(",");
          const idx = state.evo_sales.findIndex((r) =>
            conflictCols.every((c) => (r as Record<string, unknown>)[c] === record[c]),
          );
          const now = new Date().toISOString();
          if (idx >= 0) {
            state.evo_sales[idx] = {
              ...state.evo_sales[idx],
              ...(record as Partial<EvoSaleRow>),
              updated_at: now,
            } as EvoSaleRow;
          } else {
            state.evo_sales.push({
              id: `sale-${state.evo_sales.length + 1}`,
              created_at: now,
              updated_at: now,
              ...(record as Omit<EvoSaleRow, "id" | "created_at" | "updated_at">),
            } as EvoSaleRow);
          }
          return { data: null, error: null };
        }
        return { data: null, error: null };
      },
    };
    function getRows(t: string): Array<Record<string, unknown>> {
      if (t === "organizations") return state.organizations as Array<Record<string, unknown>>;
      if (t === "evo_branches") return state.evo_branches as Array<Record<string, unknown>>;
      if (t === "evo_sales") return state.evo_sales as Array<Record<string, unknown>>;
      return [];
    }
    return builder;
  }
  return { from } as unknown as SupabaseClient<Database>;
}

// ---------- fake EVO client ----------

function makeFakeEvoClient(handler: (idBranch: string, idSale: string) => EvoFetchResult): EvoClient {
  return {
    isConfigured: () => true,
    fetchSale: async (b, s) => handler(b, s),
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
});
