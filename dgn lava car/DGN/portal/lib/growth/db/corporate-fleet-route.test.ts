import test from "node:test";
import assert from "node:assert/strict";
import {
  handleCreateCompany,
  handleCreateManager,
  handleCreateFleetVehicle,
  handleAdminConfirmRequest,
  handleAdminCounterPropose,
  handleAdminCancelRequest,
  handleManagerCreateRequest,
  handleManagerAcceptCounter,
  handleManagerCancelRequest,
  signManagerToken,
  verifyManagerCookieValue,
  buildManagerCookieValue,
} from "./corporate-fleet-route.ts";

function makeRequest(body: unknown): {
  cookies: { get(name: string): { value: string } | undefined };
  json(): Promise<unknown>;
} {
  return {
    cookies: { get: () => undefined },
    json: async () => body,
  };
}

// ---------------------------------------------------------------------------
// Admin gates
// ---------------------------------------------------------------------------

test("admin: createCompany sem cookie admin → 401", async () => {
  const r = await handleCreateCompany(makeRequest({ legalName: "a", displayName: "b" }), {
    authorizeAdmin: async () => false,
    source: "db",
  });
  assert.equal(r.status, 401);
});

test("admin: createCompany source != db → 409", async () => {
  const r = await handleCreateCompany(makeRequest({ legalName: "a", displayName: "b" }), {
    authorizeAdmin: async () => true,
    source: "json",
  });
  assert.equal(r.status, 409);
});

test("admin: createCompany legalName ausente → 400", async () => {
  const r = await handleCreateCompany(makeRequest({ displayName: "b" }), {
    authorizeAdmin: async () => true,
    source: "db",
  });
  assert.equal(r.status, 400);
});

test("admin: createCompany displayName ausente → 400", async () => {
  const r = await handleCreateCompany(makeRequest({ legalName: "a" }), {
    authorizeAdmin: async () => true,
    source: "db",
  });
  assert.equal(r.status, 400);
});

test("admin: createManager sem companyId → 400", async () => {
  const r = await handleCreateManager(makeRequest({ displayName: "n", email: "e@f" }), "", {
    authorizeAdmin: async () => true,
    source: "db",
  });
  assert.equal(r.status, 400);
});

test("admin: createManager email ausente → 400", async () => {
  const r = await handleCreateManager(makeRequest({ displayName: "n" }), "co-1", {
    authorizeAdmin: async () => true,
    source: "db",
  });
  assert.equal(r.status, 400);
});

test("admin: createFleetVehicle plate ausente → 400", async () => {
  const r = await handleCreateFleetVehicle(makeRequest({}), "co-1", {
    authorizeAdmin: async () => true,
    source: "db",
  });
  assert.equal(r.status, 400);
});

test("admin: confirmRequest scheduledAt ausente → 400", async () => {
  const r = await handleAdminConfirmRequest(makeRequest({}), "req-1", {
    authorizeAdmin: async () => true,
    source: "db",
  });
  assert.equal(r.status, 400);
});

test("admin: counterPropose proposedAt ausente → 400", async () => {
  const r = await handleAdminCounterPropose(makeRequest({}), "req-1", {
    authorizeAdmin: async () => true,
    source: "db",
  });
  assert.equal(r.status, 400);
});

test("admin: cancel reason ausente → 400", async () => {
  const r = await handleAdminCancelRequest(makeRequest({}), "req-1", {
    authorizeAdmin: async () => true,
    source: "db",
  });
  assert.equal(r.status, 400);
});

test("admin: cancel sem cookie admin → 401", async () => {
  const r = await handleAdminCancelRequest(makeRequest({ reason: "x" }), "req-1", {
    authorizeAdmin: async () => false,
    source: "db",
  });
  assert.equal(r.status, 401);
});

// ---------------------------------------------------------------------------
// Manager gates
// ---------------------------------------------------------------------------

test("manager: createRequest sem cookie manager → 401", async () => {
  const r = await handleManagerCreateRequest(
    makeRequest({ fleetVehicleId: "fv-1", serviceType: "Lavagem", preferredDate1: "2026-10-25" }),
    { resolveManagerId: async () => null, source: "db" },
  );
  assert.equal(r.status, 401);
});

test("manager: createRequest source != db → 409", async () => {
  const r = await handleManagerCreateRequest(
    makeRequest({ fleetVehicleId: "fv-1", serviceType: "Lavagem", preferredDate1: "2026-10-25" }),
    { resolveManagerId: async () => "mg-1", source: "json" },
  );
  assert.equal(r.status, 409);
});

test("manager: createRequest fleetVehicleId ausente → 400", async () => {
  const r = await handleManagerCreateRequest(makeRequest({ serviceType: "x", preferredDate1: "2026" }), {
    resolveManagerId: async () => "mg-1",
    source: "db",
  });
  assert.equal(r.status, 400);
});

test("manager: createRequest serviceType ausente → 400", async () => {
  const r = await handleManagerCreateRequest(
    makeRequest({ fleetVehicleId: "fv-1", preferredDate1: "2026-10-25" }),
    { resolveManagerId: async () => "mg-1", source: "db" },
  );
  assert.equal(r.status, 400);
});

test("manager: acceptCounter sem cookie manager → 401", async () => {
  const r = await handleManagerAcceptCounter(makeRequest({}), "req-1", {
    resolveManagerId: async () => null,
    source: "db",
  });
  assert.equal(r.status, 401);
});

test("manager: cancel reason ausente → 400", async () => {
  const r = await handleManagerCancelRequest(makeRequest({}), "req-1", {
    resolveManagerId: async () => "mg-1",
    source: "db",
  });
  assert.equal(r.status, 400);
});

// ---------------------------------------------------------------------------
// HMAC manager token
// ---------------------------------------------------------------------------

test("signManagerToken: determinístico pelo id + secret", () => {
  const t1 = signManagerToken("mg-1", "sec");
  const t2 = signManagerToken("mg-1", "sec");
  const t3 = signManagerToken("mg-2", "sec");
  assert.equal(t1, t2);
  assert.notEqual(t1, t3);
  assert.match(t1, /^[0-9a-f]{64}$/);
});

test("signManagerToken: muda com secret diferente", () => {
  assert.notEqual(signManagerToken("mg-1", "a"), signManagerToken("mg-1", "b"));
});

test("verifyManagerCookieValue: cookie correto valida", () => {
  process.env.DGN_MANAGER_SIGNING_SECRET = "test-secret-value";
  const uuid = "11111111-1111-4111-8111-111111111111";
  const cookie = buildManagerCookieValue(uuid);
  assert.equal(verifyManagerCookieValue(cookie), uuid);
});

test("verifyManagerCookieValue: cookie adulterado é rejeitado", () => {
  process.env.DGN_MANAGER_SIGNING_SECRET = "test-secret-value";
  const uuid = "11111111-1111-4111-8111-111111111111";
  const cookie = buildManagerCookieValue(uuid);
  const [id] = cookie.split(".");
  // Reaproveita token mas em outro id — não bate.
  const forged = `22222222-2222-4222-8222-222222222222.${cookie.split(".")[1]}`;
  assert.equal(verifyManagerCookieValue(forged), null);
  assert.equal(id, uuid);
});

test("verifyManagerCookieValue: undefined/mal formado → null", () => {
  process.env.DGN_MANAGER_SIGNING_SECRET = "test-secret-value";
  assert.equal(verifyManagerCookieValue(undefined), null);
  assert.equal(verifyManagerCookieValue(""), null);
  assert.equal(verifyManagerCookieValue("sem-ponto"), null);
  assert.equal(verifyManagerCookieValue(".sem-id"), null);
  assert.equal(verifyManagerCookieValue("id-sem-token."), null);
});
