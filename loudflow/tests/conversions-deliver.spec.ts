/* eslint-disable @typescript-eslint/no-explicit-any -- fake Supabase builder + payload capture usa any por conveniência de teste */
import { test, expect } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deliverPaidConversion } from "../src/lib/conversions/deliver";
import type {
  EvoClient,
  EvoFetchResult,
  EvoMemberFetchResult,
} from "../src/lib/integrations/evo/types";
import type { Database } from "../src/lib/supabase/types";

// Testes focados do orquestrador deliverPaidConversion isolados do webhook.
// Cobre mapeamento de payment_type, montagem do payload UTMify e
// idempotência via ad_conversion_deliveries.

type Row = Record<string, unknown>;

function makeAdmin(state: { deliveries: Row[] }): SupabaseClient<Database> {
  function from(_table: string) {
    void _table;
    const filters: Array<[string, unknown]> = [];
    let pendingInsert: Row | null = null;
    let pendingUpdate: Row | null = null;
    const applyFilters = () => state.deliveries.filter((r) => filters.every(([c, v]) => r[c] === v));
    const runInsert = (): Row => {
      const now = new Date().toISOString();
      const row: Row = {
        id: `d-${state.deliveries.length + 1}`,
        created_at: now,
        updated_at: now,
        ...pendingInsert,
      };
      state.deliveries.push(row);
      pendingInsert = null;
      return row;
    };
    const runUpdate = () => {
      const rows = applyFilters();
      for (const r of rows) Object.assign(r, pendingUpdate);
      pendingUpdate = null;
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
        return b;
      },
      eq(c: string, v: unknown) {
        filters.push([c, v]);
        return b;
      },
      maybeSingle: async () => {
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
      then(res: (v: { data: null; error: null }) => unknown) {
        if (pendingUpdate) runUpdate();
        else if (pendingInsert) runInsert();
        return Promise.resolve(res({ data: null, error: null }));
      },
    };
    return b;
  }
  return { from } as unknown as SupabaseClient<Database>;
}

function makeEvo(memberResult: EvoMemberFetchResult): EvoClient {
  return {
    isConfigured: () => true,
    fetchSale: async () => ({ ok: false, error: { code: "not-found", message: "" } }) as EvoFetchResult,
    fetchMember: async () => memberResult,
    listSales: async () => ({ ok: true, sales: [] }),
  };
}

function paidSaleRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "sale-1",
    id_branch: "10",
    id_sale: "12345",
    id_member: "777",
    amount_paid_cents: 14990,
    sale_date: "2026-08-14T10:00:00-03:00",
    receiving_date: "2026-08-14T10:05:00-03:00",
    payment_type: "Pix",
    processing_status: "paid" as const,
    ...overrides,
  };
}

test.describe("deliverPaidConversion", () => {
  test("processing_status !== 'paid' → skipped:not-paid:<status>", async () => {
    process.env.UTMIFY_ORDERS_API_TOKEN = "t";
    try {
      const admin = makeAdmin({ deliveries: [] });
      const evo = makeEvo({ ok: true, member: { firstName: "A", email: "a@b.co" } });
      const utmify = { isConfigured: () => true, sendOrder: async () => ({ ok: true as const, status: 200, responseSummary: "" }) };
      const outcome = await deliverPaidConversion({
        admin,
        evoClient: evo,
        utmifyOrdersClient: utmify,
        organizationId: "org",
        evoSale: paidSaleRow({ processing_status: "pending" }) as any,
      });
      expect("skipped" in outcome && outcome.skipped).toBe(true);
      if ("skipped" in outcome) expect(outcome.reason).toBe("not-paid:pending");
    } finally {
      delete process.env.UTMIFY_ORDERS_API_TOKEN;
    }
  });

  test("payment_type 'Boleto' → paymentMethod:'boleto'", async () => {
    process.env.UTMIFY_ORDERS_API_TOKEN = "t";
    try {
      const admin = makeAdmin({ deliveries: [] });
      const evo = makeEvo({ ok: true, member: { firstName: "A", email: "a@b.co" } });
      let payload: any = null;
      const utmify = {
        isConfigured: () => true,
        sendOrder: async (p: any) => {
          payload = p;
          return { ok: true as const, status: 200, responseSummary: "" };
        },
      };
      await deliverPaidConversion({
        admin,
        evoClient: evo,
        utmifyOrdersClient: utmify,
        organizationId: "org",
        evoSale: paidSaleRow({ payment_type: "Boleto" }) as any,
      });
      expect(payload.paymentMethod).toBe("boleto");
    } finally {
      delete process.env.UTMIFY_ORDERS_API_TOKEN;
    }
  });

  test("payment_type 'Credit Card' → paymentMethod:'credit_card'", async () => {
    process.env.UTMIFY_ORDERS_API_TOKEN = "t";
    try {
      const admin = makeAdmin({ deliveries: [] });
      const evo = makeEvo({ ok: true, member: { firstName: "A", email: "a@b.co" } });
      let payload: any = null;
      const utmify = {
        isConfigured: () => true,
        sendOrder: async (p: any) => {
          payload = p;
          return { ok: true as const, status: 200, responseSummary: "" };
        },
      };
      await deliverPaidConversion({
        admin,
        evoClient: evo,
        utmifyOrdersClient: utmify,
        organizationId: "org",
        evoSale: paidSaleRow({ payment_type: "Credit Card" }) as any,
      });
      expect(payload.paymentMethod).toBe("credit_card");
    } finally {
      delete process.env.UTMIFY_ORDERS_API_TOKEN;
    }
  });

  test("payment_type desconhecido → delivery skipped:unmapped-payment-method", async () => {
    process.env.UTMIFY_ORDERS_API_TOKEN = "t";
    try {
      const admin = makeAdmin({ deliveries: [] });
      const evo = makeEvo({ ok: true, member: { firstName: "A", email: "a@b.co" } });
      const utmify = { isConfigured: () => true, sendOrder: async () => ({ ok: true as const, status: 200, responseSummary: "" }) };
      const outcome = await deliverPaidConversion({
        admin,
        evoClient: evo,
        utmifyOrdersClient: utmify,
        organizationId: "org",
        evoSale: paidSaleRow({ payment_type: "Cheque" }) as any,
      });
      expect("skipped" in outcome && outcome.skipped).toBe(true);
    } finally {
      delete process.env.UTMIFY_ORDERS_API_TOKEN;
    }
  });

  test("amount_paid_cents <= 0 → delivery skipped:amount-zero", async () => {
    process.env.UTMIFY_ORDERS_API_TOKEN = "t";
    try {
      const admin = makeAdmin({ deliveries: [] });
      const evo = makeEvo({ ok: true, member: { firstName: "A", email: "a@b.co" } });
      const utmify = { isConfigured: () => true, sendOrder: async () => ({ ok: true as const, status: 200, responseSummary: "" }) };
      const outcome = await deliverPaidConversion({
        admin,
        evoClient: evo,
        utmifyOrdersClient: utmify,
        organizationId: "org",
        evoSale: paidSaleRow({ amount_paid_cents: 0 }) as any,
      });
      expect("skipped" in outcome && outcome.skipped).toBe(true);
      if ("skipped" in outcome) expect(outcome.reason).toBe("amount-zero");
    } finally {
      delete process.env.UTMIFY_ORDERS_API_TOKEN;
    }
  });

  test("member sem idMember (id_member null) → skipped:customer-required", async () => {
    process.env.UTMIFY_ORDERS_API_TOKEN = "t";
    try {
      const admin = makeAdmin({ deliveries: [] });
      const evo = makeEvo({ ok: false, error: { code: "not-found", message: "" } });
      const utmify = { isConfigured: () => true, sendOrder: async () => ({ ok: true as const, status: 200, responseSummary: "" }) };
      const outcome = await deliverPaidConversion({
        admin,
        evoClient: evo,
        utmifyOrdersClient: utmify,
        organizationId: "org",
        evoSale: paidSaleRow({ id_member: null }) as any,
      });
      expect("skipped" in outcome && outcome.skipped).toBe(true);
      if ("skipped" in outcome) expect(outcome.reason).toBe("customer-required");
    } finally {
      delete process.env.UTMIFY_ORDERS_API_TOKEN;
    }
  });

  test("name a partir de 'name' único (sem firstName/lastName)", async () => {
    process.env.UTMIFY_ORDERS_API_TOKEN = "t";
    try {
      const admin = makeAdmin({ deliveries: [] });
      const evo = makeEvo({ ok: true, member: { name: "Ana Silva", email: "ANA@Example.COM" } });
      let payload: any = null;
      const utmify = {
        isConfigured: () => true,
        sendOrder: async (p: any) => {
          payload = p;
          return { ok: true as const, status: 200, responseSummary: "" };
        },
      };
      await deliverPaidConversion({
        admin,
        evoClient: evo,
        utmifyOrdersClient: utmify,
        organizationId: "org",
        evoSale: paidSaleRow() as any,
      });
      expect(payload.customer.name).toBe("Ana Silva");
      expect(payload.customer.email).toBe("ana@example.com"); // lowercased
    } finally {
      delete process.env.UTMIFY_ORDERS_API_TOKEN;
    }
  });

  test("delivery já 'sent' → skipped:already-sent (não chama UTMify)", async () => {
    process.env.UTMIFY_ORDERS_API_TOKEN = "t";
    try {
      const state = {
        deliveries: [
          {
            id: "d-existing",
            organization_id: "org",
            evo_sale_id: "sale-1",
            platform: "utmify",
            delivery_key: "evo:10:12345:purchase",
            status: "sent",
            attempts: 1,
            last_error: null,
            response_summary: "HTTP 200",
            last_attempt_at: "2026-08-14T10:00:00Z",
            sent_at: "2026-08-14T10:00:00Z",
            created_at: "2026-08-14T10:00:00Z",
            updated_at: "2026-08-14T10:00:00Z",
          },
        ],
      };
      const admin = makeAdmin(state);
      const evo = makeEvo({ ok: true, member: { firstName: "A", email: "a@b.co" } });
      let sends = 0;
      const utmify = {
        isConfigured: () => true,
        sendOrder: async () => {
          sends++;
          return { ok: true as const, status: 200, responseSummary: "" };
        },
      };
      const outcome = await deliverPaidConversion({
        admin,
        evoClient: evo,
        utmifyOrdersClient: utmify,
        organizationId: "org",
        evoSale: paidSaleRow() as any,
      });
      expect(sends).toBe(0);
      expect("skipped" in outcome && outcome.skipped).toBe(true);
      if ("skipped" in outcome) expect(outcome.reason).toBe("already-sent");
    } finally {
      delete process.env.UTMIFY_ORDERS_API_TOKEN;
    }
  });

  test("UTMify não configurada (sem env) → skipped:utmify-not-configured (não cria delivery)", async () => {
    delete process.env.UTMIFY_ORDERS_API_TOKEN;
    const state = { deliveries: [] };
    const admin = makeAdmin(state);
    const evo = makeEvo({ ok: true, member: { firstName: "A", email: "a@b.co" } });
    const utmify = {
      isConfigured: () => false,
      sendOrder: async () => ({
        ok: false as const,
        error: { code: "not-configured" as const, message: "" },
      }),
    };
    const outcome = await deliverPaidConversion({
      admin,
      evoClient: evo,
      utmifyOrdersClient: utmify,
      organizationId: "org",
      evoSale: paidSaleRow() as any,
    });
    expect("skipped" in outcome && outcome.skipped).toBe(true);
    if ("skipped" in outcome) expect(outcome.reason).toBe("utmify-not-configured");
    expect(state.deliveries).toHaveLength(0);
  });

  test("delivery_key gerado como 'evo:{idBranch}:{idSale}:purchase' e orderId 'evo-{b}-{s}'", async () => {
    process.env.UTMIFY_ORDERS_API_TOKEN = "t";
    try {
      const state: { deliveries: Row[] } = { deliveries: [] };
      const admin = makeAdmin(state);
      const evo = makeEvo({ ok: true, member: { firstName: "A", email: "a@b.co" } });
      let payload: any = null;
      const utmify = {
        isConfigured: () => true,
        sendOrder: async (p: any) => {
          payload = p;
          return { ok: true as const, status: 200, responseSummary: "" };
        },
      };
      await deliverPaidConversion({
        admin,
        evoClient: evo,
        utmifyOrdersClient: utmify,
        organizationId: "org",
        evoSale: paidSaleRow({ id_branch: "42", id_sale: "abc-999" }) as any,
      });
      expect(payload.orderId).toBe("evo-42-abc-999");
      expect(state.deliveries[0]!.delivery_key).toBe("evo:42:abc-999:purchase");
    } finally {
      delete process.env.UTMIFY_ORDERS_API_TOKEN;
    }
  });
});
