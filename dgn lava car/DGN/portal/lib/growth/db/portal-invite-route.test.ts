import test from "node:test";
import assert from "node:assert/strict";
import { handlePortalInvitePost } from "./portal-invite-route.ts";

function makeRequest(): Parameters<typeof handlePortalInvitePost>[0] {
  return {
    cookies: { get: () => undefined },
    url: "http://x/api/admin/growth/customers/x/portal-invite",
  };
}

test("POST /portal-invite: sem cookie de admin → 401", async () => {
  const response = await handlePortalInvitePost(
    makeRequest(),
    "bruno-rossetti",
    { authorize: async () => false, source: "db" },
  );
  assert.equal(response.status, 401);
});

test("POST /portal-invite: fonte de dados != db → 409", async () => {
  const response = await handlePortalInvitePost(
    makeRequest(),
    "bruno-rossetti",
    { authorize: async () => true, source: "json" },
  );
  assert.equal(response.status, 409);
});

test("POST /portal-invite: customerId vazio → 400", async () => {
  const response = await handlePortalInvitePost(
    makeRequest(),
    "",
    { authorize: async () => true, source: "db" },
  );
  assert.equal(response.status, 400);
});
