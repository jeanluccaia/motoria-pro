import { test, expect } from "@playwright/test";
import {
  createUtmifyOrdersClient,
  formatUtcDateTime,
  type UtmifyOrderPayload,
} from "../src/lib/integrations/utmify/orders";

// Testes do cliente UTMify /api-credentials/orders. Cobre:
//  - envia POST com header x-api-token e content-type JSON
//  - formata data para "YYYY-MM-DD HH:MM:SS" em UTC
//  - retorna 'not-configured' quando UTMIFY_ORDERS_API_TOKEN ausente
//  - classifica 401/429/500 corretamente
//  - sanitiza e-mail/telefone e token no resumo de erro

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

function buildValidPayload(): UtmifyOrderPayload {
  return {
    orderId: "evo-10-999",
    platform: "LoudFlow",
    paymentMethod: "pix",
    status: "paid",
    createdAt: "2026-08-14 13:00:00",
    approvedDate: "2026-08-14 13:05:00",
    refundedAt: null,
    customer: {
      name: "Ana Silva",
      email: "ana@example.com",
      phone: "11999998888",
      document: null,
      country: "BR",
      ip: null,
    },
    products: [
      {
        id: "evo-plan-10",
        name: "Matrícula Loud Fit",
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: 14990,
      },
    ],
    trackingParameters: {
      src: null,
      sck: null,
      utm_source: null,
      utm_campaign: null,
      utm_medium: null,
      utm_content: null,
      utm_term: null,
    },
    commission: {
      totalPriceInCents: 14990,
      gatewayFeeInCents: 0,
      userCommissionInCents: 14990,
      currency: "BRL",
    },
    isTest: true,
  };
}

test.describe("createUtmifyOrdersClient", () => {
  test("sem UTMIFY_ORDERS_API_TOKEN → not-configured (não chama rede)", async () => {
    await withEnv({ UTMIFY_ORDERS_API_TOKEN: undefined }, async () => {
      let called = false;
      const client = createUtmifyOrdersClient({
        fetchImpl: async () => {
          called = true;
          return new Response("");
        },
      });
      const r = await client.sendOrder(buildValidPayload());
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("not-configured");
      expect(called).toBe(false);
    });
  });

  test("envia POST com x-api-token e content-type JSON no body correto", async () => {
    await withEnv({ UTMIFY_ORDERS_API_TOKEN: "tok_test" }, async () => {
      const seen: { url?: string; method?: string; headers?: Record<string, string>; body?: string } = {};
      const client = createUtmifyOrdersClient({
        baseUrl: "https://utmify.test",
        fetchImpl: async (url, init) => {
          seen.url = String(url);
          seen.method = init?.method;
          const h = new Headers(init?.headers);
          seen.headers = Object.fromEntries(h.entries());
          seen.body = typeof init?.body === "string" ? init.body : "";
          return new Response('{"ok":true}', { status: 200 });
        },
      });
      const payload = buildValidPayload();
      const r = await client.sendOrder(payload);
      expect(r.ok).toBe(true);
      expect(seen.url).toBe("https://utmify.test/api-credentials/orders");
      expect(seen.method).toBe("POST");
      expect(seen.headers!["x-api-token"]).toBe("tok_test");
      expect(seen.headers!["content-type"]).toContain("application/json");
      const parsed = JSON.parse(seen.body!);
      expect(parsed.orderId).toBe("evo-10-999");
      expect(parsed.status).toBe("paid");
      expect(parsed.commission.currency).toBe("BRL");
      expect(parsed.isTest).toBe(true);
    });
  });

  test("HTTP 401 → error.code=unauthorized", async () => {
    await withEnv({ UTMIFY_ORDERS_API_TOKEN: "tok" }, async () => {
      const client = createUtmifyOrdersClient({
        fetchImpl: async () => new Response("bad token", { status: 401 }),
      });
      const r = await client.sendOrder(buildValidPayload());
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.code).toBe("unauthorized");
        expect(r.error.httpStatus).toBe(401);
      }
    });
  });

  test("HTTP 429 → error.code=rate-limited", async () => {
    await withEnv({ UTMIFY_ORDERS_API_TOKEN: "tok" }, async () => {
      const client = createUtmifyOrdersClient({
        fetchImpl: async () => new Response("", { status: 429 }),
      });
      const r = await client.sendOrder(buildValidPayload());
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("rate-limited");
    });
  });

  test("HTTP 500 → server-rejected + resposta sanitizada (sem e-mail nem telefone)", async () => {
    await withEnv({ UTMIFY_ORDERS_API_TOKEN: "tok" }, async () => {
      const client = createUtmifyOrdersClient({
        fetchImpl: async () =>
          new Response("erro para ana@example.com telefone +55 11 99999-8888", {
            status: 500,
          }),
      });
      const r = await client.sendOrder(buildValidPayload());
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.code).toBe("server-rejected");
        expect(r.error.message).not.toContain("ana@example.com");
        expect(r.error.message).not.toContain("11 99999-8888");
        expect(r.error.message).toContain("***@***");
      }
    });
  });

  test("HTTP 400 → invalid-response", async () => {
    await withEnv({ UTMIFY_ORDERS_API_TOKEN: "tok" }, async () => {
      const client = createUtmifyOrdersClient({
        fetchImpl: async () => new Response('{"error":"bad payload"}', { status: 400 }),
      });
      const r = await client.sendOrder(buildValidPayload());
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("invalid-response");
    });
  });

  test("responseSummary não contém token nem e-mail", async () => {
    await withEnv({ UTMIFY_ORDERS_API_TOKEN: "SECRETO_TOK" }, async () => {
      const client = createUtmifyOrdersClient({
        fetchImpl: async () =>
          new Response('{"customer":{"email":"ana@example.com"}}', { status: 200 }),
      });
      const r = await client.sendOrder(buildValidPayload());
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.responseSummary).not.toContain("ana@example.com");
        expect(r.responseSummary).not.toContain("SECRETO_TOK");
        expect(r.responseSummary).toContain("HTTP 200");
      }
    });
  });
});

test.describe("formatUtcDateTime", () => {
  test("ISO com offset → converte para UTC 'YYYY-MM-DD HH:MM:SS'", () => {
    expect(formatUtcDateTime("2026-08-14T10:05:00-03:00")).toBe("2026-08-14 13:05:00");
  });
  test("null / vazio / inválido → null", () => {
    expect(formatUtcDateTime(null)).toBeNull();
    expect(formatUtcDateTime(undefined)).toBeNull();
    expect(formatUtcDateTime("")).toBeNull();
    expect(formatUtcDateTime("nope")).toBeNull();
  });
});
