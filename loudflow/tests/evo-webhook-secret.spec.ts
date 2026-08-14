import { test, expect } from "@playwright/test";
import { requestHasValidWebhookSecret } from "../src/lib/integrations/evo/env";

// Segurança do webhook EVO: EXCLUSIVAMENTE header customizado
// `x-evo-webhook-secret`, comparação timing-safe. Sem query, sem body,
// sem Bearer.

function withSecret<T>(secret: string, fn: () => T | Promise<T>): Promise<T> {
  const saved = process.env.EVO_WEBHOOK_SECRET;
  process.env.EVO_WEBHOOK_SECRET = secret;
  return Promise.resolve()
    .then(() => fn())
    .finally(() => {
      if (saved === undefined) delete process.env.EVO_WEBHOOK_SECRET;
      else process.env.EVO_WEBHOOK_SECRET = saved;
    });
}

function req(headers: Record<string, string> = {}, url = "https://loudflow.test/api/webhooks/evo/sales"): Request {
  return new Request(url, { method: "POST", headers });
}

test.describe("requestHasValidWebhookSecret", () => {
  test("header correto → true", async () => {
    await withSecret("evo-abc-123", () => {
      const request = req({ "x-evo-webhook-secret": "evo-abc-123" });
      expect(requestHasValidWebhookSecret(request)).toBe(true);
    });
  });

  test("header com valor errado → false", async () => {
    await withSecret("evo-abc-123", () => {
      const request = req({ "x-evo-webhook-secret": "outra-coisa" });
      expect(requestHasValidWebhookSecret(request)).toBe(false);
    });
  });

  test("header ausente → false", async () => {
    await withSecret("evo-abc-123", () => {
      expect(requestHasValidWebhookSecret(req({}))).toBe(false);
    });
  });

  test("header vazio → false", async () => {
    await withSecret("evo-abc-123", () => {
      const request = req({ "x-evo-webhook-secret": "" });
      expect(requestHasValidWebhookSecret(request)).toBe(false);
    });
  });

  test("segredo em ?secret= sem header → false (query não autentica)", async () => {
    await withSecret("evo-abc-123", () => {
      const request = req({}, "https://loudflow.test/api/webhooks/evo/sales?secret=evo-abc-123");
      expect(requestHasValidWebhookSecret(request)).toBe(false);
    });
  });

  test("Bearer no Authorization sem header customizado → false", async () => {
    await withSecret("evo-abc-123", () => {
      const request = req({ authorization: "Bearer evo-abc-123" });
      expect(requestHasValidWebhookSecret(request)).toBe(false);
    });
  });

  test("sem EVO_WEBHOOK_SECRET no servidor → sempre false", async () => {
    const saved = process.env.EVO_WEBHOOK_SECRET;
    delete process.env.EVO_WEBHOOK_SECRET;
    try {
      const request = req({ "x-evo-webhook-secret": "qualquer" });
      expect(requestHasValidWebhookSecret(request)).toBe(false);
    } finally {
      if (saved !== undefined) process.env.EVO_WEBHOOK_SECRET = saved;
    }
  });

  test("segredo com tamanho diferente → false (evita curto-circuito por len)", async () => {
    await withSecret("evo-segredo-longo-e-forte", () => {
      const request = req({ "x-evo-webhook-secret": "evo" });
      expect(requestHasValidWebhookSecret(request)).toBe(false);
    });
  });
});
