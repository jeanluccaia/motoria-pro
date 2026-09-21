import test from "node:test";
import assert from "node:assert/strict";
import {
  handleSubscriptionsDelete,
  handleSubscriptionsGet,
  handleSubscriptionsPatch,
  handleSubscriptionsPost,
} from "./subscriptions-route.ts";

// Gate administrativo do editor de assinaturas (FASE 1).
// Não exercita o write layer — subscriptions-write.test.ts faz isso.

function makeRequest(body: unknown): {
  cookies: { get(name: string): { value: string } | undefined };
  json(): Promise<unknown>;
} {
  return {
    cookies: { get: () => undefined },
    json: async () => body,
  };
}

test("GET: sem cookie admin → 401", async () => {
  const response = await handleSubscriptionsGet(
    makeRequest({}),
    "cliente-x",
    { authorize: async () => false, source: "db" },
  );
  assert.equal(response.status, 401);
});

test("POST: sem cookie admin → 401", async () => {
  const response = await handleSubscriptionsPost(
    makeRequest({ plan: "Smart", modality: "Mensal", sourceReference: "x" }),
    "cliente-x",
    { authorize: async () => false, source: "db" },
  );
  assert.equal(response.status, 401);
});

test("POST: fonte != db → 409", async () => {
  const response = await handleSubscriptionsPost(
    makeRequest({ plan: "Smart", modality: "Mensal", sourceReference: "x" }),
    "cliente-x",
    { authorize: async () => true, source: "json" },
  );
  assert.equal(response.status, 409);
});

test("POST: plan ausente → 400", async () => {
  const response = await handleSubscriptionsPost(
    makeRequest({ modality: "Mensal", sourceReference: "x" }),
    "cliente-x",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(response.status, 400);
});

test("POST: modality ausente → 400", async () => {
  const response = await handleSubscriptionsPost(
    makeRequest({ plan: "Smart", sourceReference: "x" }),
    "cliente-x",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(response.status, 400);
});

test("POST: sourceReference ausente → 400", async () => {
  const response = await handleSubscriptionsPost(
    makeRequest({ plan: "Smart", modality: "Mensal" }),
    "cliente-x",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(response.status, 400);
});

test("PATCH: sem cookie admin → 401", async () => {
  const response = await handleSubscriptionsPatch(
    makeRequest({ reason: "x" }),
    "cliente-x",
    "sub-1",
    { authorize: async () => false, source: "db" },
  );
  assert.equal(response.status, 401);
});

test("PATCH: reason ausente → 400", async () => {
  const response = await handleSubscriptionsPatch(
    makeRequest({}),
    "cliente-x",
    "sub-1",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(response.status, 400);
});

test("PATCH: subscriptionId ausente → 400", async () => {
  const response = await handleSubscriptionsPatch(
    makeRequest({ reason: "x" }),
    "cliente-x",
    "",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(response.status, 400);
});

test("DELETE: sem cookie admin → 401", async () => {
  const response = await handleSubscriptionsDelete(
    makeRequest({ reason: "x" }),
    "cliente-x",
    "sub-1",
    { authorize: async () => false, source: "db" },
  );
  assert.equal(response.status, 401);
});

test("DELETE: reason ausente → 400", async () => {
  const response = await handleSubscriptionsDelete(
    makeRequest({}),
    "cliente-x",
    "sub-1",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(response.status, 400);
});
