import test from "node:test";
import assert from "node:assert/strict";
import { handleVehiclesPost } from "./profile-editor-route.ts";

function makeRequest(body: unknown): Parameters<typeof handleVehiclesPost>[0] {
  return {
    cookies: { get: () => undefined },
    json: async () => body,
  };
}

test("POST /vehicles: sem cookie de admin → 401", async () => {
  const response = await handleVehiclesPost(
    makeRequest({ plate: "ABC1234" }),
    "bruno-rossetti",
    { authorize: async () => false, source: "db" },
  );
  assert.equal(response.status, 401);
});

test("POST /vehicles: fonte != db → 409", async () => {
  const response = await handleVehiclesPost(
    makeRequest({ plate: "ABC1234" }),
    "bruno-rossetti",
    { authorize: async () => true, source: "json" },
  );
  assert.equal(response.status, 409);
});

test("POST /vehicles: sem placa no body → 400", async () => {
  const response = await handleVehiclesPost(
    makeRequest({ brand: "Honda" }),
    "bruno-rossetti",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(response.status, 400);
});

test("POST /vehicles: customerId vazio → 400", async () => {
  const response = await handleVehiclesPost(
    makeRequest({ plate: "ABC1234" }),
    "",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(response.status, 400);
});
