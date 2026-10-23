import test from "node:test";
import assert from "node:assert/strict";
import {
  handleAgentActionApprove,
  handleAgentActionReject,
  handleAgentActionExecute,
  handleAgentActionsList,
} from "./agent-actions-route.ts";

// Testes de gate (auth / source / payload). O DB write layer já é coberto
// por agent-actions-write.test.ts; aqui só blindamos o handler público.

function makeRequest(body: unknown, overrides: { url?: string } = {}): {
  cookies: { get(name: string): { value: string } | undefined };
  json(): Promise<unknown>;
  url: string;
} {
  return {
    cookies: { get: () => undefined },
    json: async () => body,
    url: overrides.url ?? "http://localhost/api/admin/growth/agent-actions",
  };
}

// ---------------------------------------------------------------------------
// Auth gates
// ---------------------------------------------------------------------------

test("GET list: sem cookie admin → 401", async () => {
  const response = await handleAgentActionsList(makeRequest({}), {
    authorize: async () => false,
    source: "db",
  });
  assert.equal(response.status, 401);
});

test("POST approve: sem cookie admin → 401", async () => {
  const response = await handleAgentActionApprove(makeRequest({}), "action-x", {
    authorize: async () => false,
    source: "db",
  });
  assert.equal(response.status, 401);
});

test("POST reject: sem cookie admin → 401", async () => {
  const response = await handleAgentActionReject(makeRequest({ reason: "x" }), "action-x", {
    authorize: async () => false,
    source: "db",
  });
  assert.equal(response.status, 401);
});

test("POST execute: sem cookie admin → 401", async () => {
  const response = await handleAgentActionExecute(makeRequest({}), "action-x", {
    authorize: async () => false,
    source: "db",
  });
  assert.equal(response.status, 401);
});

// ---------------------------------------------------------------------------
// Source gate
// ---------------------------------------------------------------------------

test("GET list: fonte != db → 409", async () => {
  const response = await handleAgentActionsList(makeRequest({}), {
    authorize: async () => true,
    source: "json",
  });
  assert.equal(response.status, 409);
});

test("POST approve: fonte != db → 409", async () => {
  const response = await handleAgentActionApprove(makeRequest({}), "action-x", {
    authorize: async () => true,
    source: "json",
  });
  assert.equal(response.status, 409);
});

test("POST reject: fonte != db → 409", async () => {
  const response = await handleAgentActionReject(makeRequest({ reason: "x" }), "action-x", {
    authorize: async () => true,
    source: "json",
  });
  assert.equal(response.status, 409);
});

test("POST execute: fonte != db → 409", async () => {
  const response = await handleAgentActionExecute(makeRequest({}), "action-x", {
    authorize: async () => true,
    source: "json",
  });
  assert.equal(response.status, 409);
});

// ---------------------------------------------------------------------------
// Payload validation
// ---------------------------------------------------------------------------

test("POST reject: reason vazio → 400", async () => {
  const response = await handleAgentActionReject(makeRequest({ reason: "   " }), "action-x", {
    authorize: async () => true,
    source: "db",
  });
  assert.equal(response.status, 400);
  const body = (await response.json()) as { error: string };
  assert.match(body.error, /motivo/i);
});

test("POST reject: reason ausente → 400", async () => {
  const response = await handleAgentActionReject(makeRequest({}), "action-x", {
    authorize: async () => true,
    source: "db",
  });
  assert.equal(response.status, 400);
});

test("POST approve: actionId vazio → 400", async () => {
  const response = await handleAgentActionApprove(makeRequest({}), "", {
    authorize: async () => true,
    source: "db",
  });
  assert.equal(response.status, 400);
});

test("POST approve: actionId exagerado → 400", async () => {
  const response = await handleAgentActionApprove(makeRequest({}), "x".repeat(201), {
    authorize: async () => true,
    source: "db",
  });
  assert.equal(response.status, 400);
});

test("POST reject: actionId vazio → 400", async () => {
  const response = await handleAgentActionReject(makeRequest({ reason: "x" }), "", {
    authorize: async () => true,
    source: "db",
  });
  assert.equal(response.status, 400);
});

test("POST execute: actionId vazio → 400", async () => {
  const response = await handleAgentActionExecute(makeRequest({}), "", {
    authorize: async () => true,
    source: "db",
  });
  assert.equal(response.status, 400);
});
