import test from "node:test";
import assert from "node:assert/strict";
import {
  handleDiagnosticsCreate,
  handleDiagnosticPatch,
} from "./diagnostics-route.ts";

// Mock request builder ------------------------------------------------------

interface MockRequestOptions {
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
}

function mockRequest(opts: MockRequestOptions = {}) {
  const cookies = new Map(Object.entries(opts.cookies ?? {}));
  const headers = new Map(Object.entries(opts.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    cookies: { get: (name: string) => (cookies.has(name) ? { value: cookies.get(name)! } : undefined) },
    headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
    json: async () => opts.body ?? {},
    formData: async () => new FormData(),
    url: "https://x.test/api",
  };
}

// -----------------------------------------------------------------------------

test("POST sem sessão admin → 401 SESSION_INVALID", async () => {
  const res = await handleDiagnosticsCreate(
    mockRequest({ body: { vehicle_id: "x", catalog_version: "v", performed_by: "y" } }),
    "any",
    { authorize: async () => false, source: "db" },
  );
  assert.equal(res.status, 401);
  assert.equal(res.headers.get("Cache-Control"), "no-store");
  const body = await res.json();
  assert.equal(body.error.code, "SESSION_INVALID");
});

test("POST com source=json → 409 DB_MODE_REQUIRED", async () => {
  const res = await handleDiagnosticsCreate(
    mockRequest({ body: { vehicle_id: "x", catalog_version: "v", performed_by: "y" } }),
    "any",
    { authorize: async () => true, source: "json" },
  );
  assert.equal(res.status, 409);
  assert.equal(res.headers.get("Cache-Control"), "no-store");
  const body = await res.json();
  assert.equal(body.error.code, "DB_MODE_REQUIRED");
});

test("POST sem Idempotency-Key → 400 IDEMPOTENCY_REQUIRED", async () => {
  const res = await handleDiagnosticsCreate(
    mockRequest({ body: { vehicle_id: "x", catalog_version: "v", performed_by: "y" } }),
    "any",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(res.status, 400);
  assert.equal(res.headers.get("Cache-Control"), "no-store");
  const body = await res.json();
  assert.equal(body.error.code, "IDEMPOTENCY_REQUIRED");
});

test("POST sem vehicle_id → 422 VALIDATION_FAILED", async () => {
  const res = await handleDiagnosticsCreate(
    mockRequest({
      headers: { "Idempotency-Key": "k1" },
      body: { catalog_version: "v", performed_by: "y" },
    }),
    "any",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(res.status, 422);
  assert.equal(res.headers.get("Cache-Control"), "no-store");
  const body = await res.json();
  assert.equal(body.error.code, "VALIDATION_FAILED");
});

// -----------------------------------------------------------------------------
// Blocker 1 (2026-09-29): contrato de concorrência agora é X-Expected-Revision
// (inteiro sem aspas). Vercel intercepta If-Match quoted como ETag validation
// e devolve 412 platform antes do handler — usar header custom evita isso.
// Ver [[vercel-ifmatch-intercepta-patch]].

test("PATCH sem X-Expected-Revision → 412 PRECONDITION_REQUIRED", async () => {
  const res = await handleDiagnosticPatch(
    mockRequest({ body: {} }),
    "diag-1",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(res.status, 412);
  assert.equal(res.headers.get("Cache-Control"), "no-store");
  const body = await res.json();
  assert.equal(body.error.code, "PRECONDITION_REQUIRED");
});

test("PATCH com X-Expected-Revision não-numérico → 412 PRECONDITION_INVALID", async () => {
  const res = await handleDiagnosticPatch(
    mockRequest({ headers: { "X-Expected-Revision": "abc" }, body: {} }),
    "diag-1",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(res.status, 412);
  const body = await res.json();
  assert.equal(body.error.code, "PRECONDITION_INVALID");
});

test("PATCH com X-Expected-Revision quoted → 412 PRECONDITION_INVALID (rejeita If-Match legacy)", async () => {
  // Cliente antigo pode mandar '"5"' — a gente REJEITA na origem pra forçar update.
  const res = await handleDiagnosticPatch(
    mockRequest({ headers: { "X-Expected-Revision": '"5"' }, body: {} }),
    "diag-1",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(res.status, 412);
  const body = await res.json();
  assert.equal(body.error.code, "PRECONDITION_INVALID");
});

test("PATCH com X-Expected-Revision negativo → 412 PRECONDITION_INVALID", async () => {
  const res = await handleDiagnosticPatch(
    mockRequest({ headers: { "X-Expected-Revision": "-1" }, body: {} }),
    "diag-1",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(res.status, 412);
  const body = await res.json();
  assert.equal(body.error.code, "PRECONDITION_INVALID");
});

test("PATCH usa If-Match legacy → 412 PRECONDITION_REQUIRED (header não é lido)", async () => {
  // Cliente antigo mandando If-Match e NÃO mandando X-Expected-Revision deve
  // falhar em PRECONDITION_REQUIRED — garante que ninguém acidentalmente aceita
  // o header velho.
  const res = await handleDiagnosticPatch(
    mockRequest({ headers: { "If-Match": '"5"' }, body: {} }),
    "diag-1",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(res.status, 412);
  const body = await res.json();
  assert.equal(body.error.code, "PRECONDITION_REQUIRED");
});

test("PATCH com sessão inválida → 401 antes de qualquer validação", async () => {
  const res = await handleDiagnosticPatch(
    mockRequest({ headers: { "X-Expected-Revision": "5" }, body: {} }),
    "diag-1",
    { authorize: async () => false, source: "db" },
  );
  assert.equal(res.status, 401);
  assert.equal(res.headers.get("Cache-Control"), "no-store");
});

test("PATCH com payload malformado (score fora de step) → 422 VALIDATION_FAILED", async () => {
  const res = await handleDiagnosticPatch(
    mockRequest({
      headers: { "X-Expected-Revision": "1" },
      body: { scores: [{ criterion_key: "conservacao_pintura", score: 7.3 }] },
    }),
    "diag-1",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(res.status, 422);
  assert.equal(res.headers.get("Cache-Control"), "no-store");
  const body = await res.json();
  assert.equal(body.error.code, "VALIDATION_FAILED");
  assert.ok(Array.isArray(body.error.details.issues));
});

// -----------------------------------------------------------------------------
// Contrato de headers: mutação NUNCA devolve ETag, sempre X-Current-Revision.
// (Cobre 412 do PATCH; smoke real cobre PATCH 200 com X-Current-Revision.)

test("PATCH 412 NUNCA devolve ETag", async () => {
  const res = await handleDiagnosticPatch(
    mockRequest({ body: {} }),
    "diag-1",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(res.headers.get("ETag"), null);
});
