import { test, expect } from "@playwright/test";
import { createEvoClient } from "../src/lib/integrations/evo/client";
import { EVO_ENV_NAMES } from "../src/lib/integrations/evo/env";

// Testes do classifier de HTTP 401 no cliente EVO.
//
// A EVO devolve HTTP 401 em dois cenários distintos:
//  (a) credencial ruim   → code=unauthorized
//  (b) rate limit diário → code=rate-limited
// A distinção é lida do body: {"status":401,"error":"Daily request limit reached. ..."}.
// Sem essa distinção, evo_sales.last_reason mostra 'unauthorized' em
// ambos e leva à falsa suspeita de credencial rotacionada.

function withEvoEnv<T>(fn: () => Promise<T> | T): Promise<T> {
  const saved: Record<string, string | undefined> = {};
  for (const n of EVO_ENV_NAMES) {
    saved[n] = process.env[n];
    process.env[n] = `TEST_${n}`;
  }
  return Promise.resolve()
    .then(() => fn())
    .finally(() => {
      for (const n of EVO_ENV_NAMES) {
        if (saved[n] === undefined) delete process.env[n];
        else process.env[n] = saved[n];
      }
    });
}

test.describe("EvoClient — classify 401", () => {
  test("HTTP 401 com body 'Daily request limit reached' → rate-limited", async () => {
    await withEvoEnv(async () => {
      const client = createEvoClient({
        fetchImpl: async () =>
          new Response(
            '{"status":401,"error":"Daily request limit reached. Upgrade to API Pro to get unlimited requests."}',
            { status: 401 },
          ),
      });
      const r = await client.listSales({
        updatedReceivableStartDate: "2026-08-18T00:00:00Z",
        updatedReceivableEndDate: "2026-08-19T00:00:00Z",
      });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.code).toBe("rate-limited");
        expect(r.error.message).toContain("rate limit");
      }
    });
  });

  test("HTTP 401 com body genérico → unauthorized", async () => {
    await withEvoEnv(async () => {
      const client = createEvoClient({
        fetchImpl: async () =>
          new Response('{"error":"invalid credentials"}', { status: 401 }),
      });
      const r = await client.fetchSale("1", "999");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("unauthorized");
    });
  });

  test("HTTP 401 sem body → unauthorized (fallback)", async () => {
    await withEvoEnv(async () => {
      const client = createEvoClient({
        fetchImpl: async () => new Response("", { status: 401 }),
      });
      const r = await client.fetchMember("777");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("unauthorized");
    });
  });

  test("HTTP 401 case-insensitive: 'DAILY REQUEST LIMIT REACHED' → rate-limited", async () => {
    await withEvoEnv(async () => {
      const client = createEvoClient({
        fetchImpl: async () =>
          new Response("Error: DAILY REQUEST LIMIT REACHED", { status: 401 }),
      });
      const r = await client.fetchSale("1", "999");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("rate-limited");
    });
  });

  test("HTTP 403 com body 'Daily request limit reached' → rate-limited (defensivo)", async () => {
    // A EVO usa 401 hoje, mas se um dia migrar para 403 na mesma resposta,
    // a lógica ainda captura pelo body.
    await withEvoEnv(async () => {
      const client = createEvoClient({
        fetchImpl: async () =>
          new Response(
            '{"error":"Daily request limit reached."}',
            { status: 403 },
          ),
      });
      const r = await client.listSales({
        updatedReceivableStartDate: "2026-08-18T00:00:00Z",
        updatedReceivableEndDate: "2026-08-19T00:00:00Z",
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("rate-limited");
    });
  });

  test("HTTP 429 nativo → rate-limited (path clássico preservado)", async () => {
    await withEvoEnv(async () => {
      const client = createEvoClient({
        fetchImpl: async () => new Response("", { status: 429 }),
      });
      const r = await client.fetchSale("1", "999");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("rate-limited");
    });
  });

  test("HTTP 404 → not-found (não afetado pelo fix)", async () => {
    await withEvoEnv(async () => {
      const client = createEvoClient({
        fetchImpl: async () => new Response("", { status: 404 }),
      });
      const r = await client.fetchSale("1", "999");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("not-found");
    });
  });

  test("HTTP 500 → network (não afetado pelo fix)", async () => {
    await withEvoEnv(async () => {
      const client = createEvoClient({
        fetchImpl: async () => new Response("boom", { status: 500 }),
      });
      const r = await client.fetchSale("1", "999");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("network");
    });
  });
});
