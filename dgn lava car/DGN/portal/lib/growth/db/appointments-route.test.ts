import test from "node:test";
import assert from "node:assert/strict";
import { handleAppointmentsPatch } from "./appointments-route.ts";

// Cobre o gate administrativo do PATCH — regressão do #10 do brief da Fatia 2b.
// Não exercita o write layer (o unit test em appointments-write.test.ts faz isso).

function makeRequest(body: unknown): Parameters<typeof handleAppointmentsPatch>[0] {
  return {
    cookies: { get: () => undefined },
    url: "http://x/api/admin/growth/customers/x/appointments",
    json: async () => body,
  };
}

test("PATCH: sem cookie de admin → 401", async () => {
  const response = await handleAppointmentsPatch(
    makeRequest({ appointmentId: "x", scheduledAt: "2026-09-25T18:00:00.000Z" }),
    "gustavo-plensack",
    { authorize: async () => false, source: "db" },
  );
  assert.equal(response.status, 401);
});

test("PATCH: fonte de dados != db → 409", async () => {
  const response = await handleAppointmentsPatch(
    makeRequest({ appointmentId: "x", scheduledAt: "2026-09-25T18:00:00.000Z" }),
    "gustavo-plensack",
    { authorize: async () => true, source: "json" },
  );
  assert.equal(response.status, 409);
});

test("PATCH: sem appointmentId → 400", async () => {
  const response = await handleAppointmentsPatch(
    makeRequest({ scheduledAt: "2026-09-25T18:00:00.000Z" }),
    "gustavo-plensack",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(response.status, 400);
});

test("PATCH: customerId inválido → 400", async () => {
  const response = await handleAppointmentsPatch(
    makeRequest({ appointmentId: "x", scheduledAt: "2026-09-25T18:00:00.000Z" }),
    "",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(response.status, 400);
});
