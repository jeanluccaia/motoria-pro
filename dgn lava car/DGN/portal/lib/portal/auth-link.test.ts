import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyPortalAuthLink } from "./auth-link.ts";

// Fake mínimo: só implementa .from().select().eq().maybeSingle() em memória.
// Nunca deve executar em cliente com RLS aplicada — o helper existe justamente
// para forçar leitura server-side com service_role.
function fakeDb(
  rows: Array<{ auth_user_id: string; customer_id: string }>,
  failWith?: { message: string },
): SupabaseClient {
  return {
    from() {
      let filterValue: string | null = null;
      const chain: Record<string, unknown> = {
        select() {
          return chain;
        },
        eq(_col: string, value: unknown) {
          filterValue = value as string;
          return chain;
        },
        async maybeSingle() {
          if (failWith) return { data: null, error: failWith };
          const found = rows.find((r) => r.auth_user_id === filterValue);
          return { data: found ?? null, error: null };
        },
      };
      return chain;
    },
  } as unknown as SupabaseClient;
}

test("vínculo válido → retorna customerId (impede regressão do bug do Gustavo)", async () => {
  const db = fakeDb([
    { auth_user_id: "auth-gustavo", customer_id: "customer-gustavo" },
  ]);
  const result = await verifyPortalAuthLink("auth-gustavo", db);
  assert.deepEqual(result, { ok: true, customerId: "customer-gustavo" });
});

test("auth_user_id sem vínculo → not_linked (bloqueia login sem assinatura)", async () => {
  const db = fakeDb([
    { auth_user_id: "auth-outro", customer_id: "customer-outro" },
  ]);
  const result = await verifyPortalAuthLink("auth-sem-vinculo", db);
  assert.deepEqual(result, { ok: false, reason: "not_linked" });
});

test("authUserId vazio → not_linked sem consultar db", async () => {
  const db = {
    from() {
      throw new Error("nunca deve consultar db para input vazio");
    },
  } as unknown as SupabaseClient;
  assert.deepEqual(await verifyPortalAuthLink("", db), {
    ok: false,
    reason: "not_linked",
  });
  assert.deepEqual(await verifyPortalAuthLink("   ", db), {
    ok: false,
    reason: "not_linked",
  });
});

test("erro do banco (RLS/permissão) → db_error preserva mensagem para log", async () => {
  const db = fakeDb([], {
    message: "permission denied for table crm_customer_auth",
  });
  const result = await verifyPortalAuthLink("auth-qualquer", db);
  assert.equal(result.ok, false);
  if (result.ok === false) {
    assert.equal(result.reason, "db_error");
    if (result.reason === "db_error") {
      assert.match(result.message, /permission denied/);
    }
  }
});

test("não vaza vínculo entre auth_user_ids diferentes", async () => {
  const db = fakeDb([
    { auth_user_id: "auth-a", customer_id: "customer-a" },
    { auth_user_id: "auth-b", customer_id: "customer-b" },
  ]);
  assert.deepEqual(await verifyPortalAuthLink("auth-a", db), {
    ok: true,
    customerId: "customer-a",
  });
  assert.deepEqual(await verifyPortalAuthLink("auth-b", db), {
    ok: true,
    customerId: "customer-b",
  });
  assert.deepEqual(await verifyPortalAuthLink("auth-c", db), {
    ok: false,
    reason: "not_linked",
  });
});
