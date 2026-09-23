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
  const body = await res.json();
  assert.equal(body.error.code, "VALIDATION_FAILED");
});

// -----------------------------------------------------------------------------

test("PATCH sem If-Match → 412 PRECONDITION_REQUIRED", async () => {
  const res = await handleDiagnosticPatch(
    mockRequest({ body: {} }),
    "diag-1",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(res.status, 412);
  const body = await res.json();
  assert.equal(body.error.code, "PRECONDITION_REQUIRED");
});

test("PATCH com If-Match não-numérico → 412", async () => {
  const res = await handleDiagnosticPatch(
    mockRequest({ headers: { "If-Match": '"abc"' }, body: {} }),
    "diag-1",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(res.status, 412);
});

test("PATCH com sessão inválida → 401 antes de qualquer validação", async () => {
  const res = await handleDiagnosticPatch(
    mockRequest({ headers: { "If-Match": '"5"' }, body: {} }),
    "diag-1",
    { authorize: async () => false, source: "db" },
  );
  assert.equal(res.status, 401);
});

test("PATCH com payload malformado (score fora de step) → 422 VALIDATION_FAILED", async () => {
  const res = await handleDiagnosticPatch(
    mockRequest({
      headers: { "If-Match": '"1"' },
      body: { scores: [{ criterion_key: "conservacao_pintura", score: 7.3 }] },
    }),
    "diag-1",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.error.code, "VALIDATION_FAILED");
  assert.ok(Array.isArray(body.error.details.issues));
});
