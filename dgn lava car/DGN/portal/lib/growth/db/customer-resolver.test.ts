import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CustomerResolutionError, resolveCustomerId } from "./customer-resolver.ts";

interface Customer {
  id: string;
  legacy_id: string | null;
}

function buildFake(customers: Customer[]): SupabaseClient {
  // Reproduz o comportamento do @supabase/supabase-js: cada .select() a partir
  // do PostgrestQueryBuilder inicia um filtro fresco (não herda .eq() anteriores).
  const startQuery = (rows: Customer[]) => {
    const filters: Array<{ column: keyof Customer; value: unknown }> = [];
    const chain: Record<string, unknown> = {
      eq: (column: string, value: unknown) => {
        filters.push({ column: column as keyof Customer, value });
        return chain;
      },
      maybeSingle: async () => {
        let filtered = rows.slice();
        for (const filter of filters) {
          filtered = filtered.filter((row) => row[filter.column] === filter.value);
        }
        if (filtered.length > 1) return { data: null, error: { message: "multiple", code: "PGRST116" } };
        return { data: (filtered[0] ?? null) as unknown, error: null };
      },
    };
    return chain;
  };

  const fake = {
    from(table: string) {
      if (table !== "crm_customers") throw new Error(`table ${table} n/i`);
      return {
        select: (_cols: string) => startQuery(customers),
      };
    },
  };
  return fake as unknown as SupabaseClient;
}

const UUID_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const UUID_B = "11111111-2222-4333-8444-555555555555";

test("resolveCustomerId: encontra por legacy_id (slug do Profile 360)", async () => {
  const db = buildFake([
    { id: UUID_A, legacy_id: "gustavo-plensack" },
    { id: UUID_B, legacy_id: "outro-cliente" },
  ]);
  const resolved = await resolveCustomerId(db, "gustavo-plensack");
  assert.equal(resolved, UUID_A);
});

test("resolveCustomerId: encontra por UUID puro", async () => {
  const db = buildFake([{ id: UUID_A, legacy_id: null }]);
  const resolved = await resolveCustomerId(db, UUID_A);
  assert.equal(resolved, UUID_A);
});

test("resolveCustomerId: legacy_id vence quando ambos matcheriam", async () => {
  // Cliente cadastrado com legacy_id = UUID string. Deve retornar o id do row
  // encontrado por legacy_id primeiro (comportamento canônico do portal-access).
  const db = buildFake([{ id: UUID_A, legacy_id: UUID_B }]);
  const resolved = await resolveCustomerId(db, UUID_B);
  assert.equal(resolved, UUID_A);
});

test("resolveCustomerId: slug inexistente → 404 humano (não erro de UUID Postgres)", async () => {
  const db = buildFake([{ id: UUID_A, legacy_id: "outro-slug" }]);
  await assert.rejects(
    () => resolveCustomerId(db, "cliente-que-nao-existe"),
    (err: unknown) => {
      assert.ok(err instanceof CustomerResolutionError);
      assert.equal((err as CustomerResolutionError).status, 404);
      assert.doesNotMatch((err as Error).message, /invalid input syntax/);
      return true;
    },
  );
});

test("resolveCustomerId: UUID válido mas inexistente → 404 humano", async () => {
  const db = buildFake([{ id: UUID_A, legacy_id: null }]);
  await assert.rejects(
    () => resolveCustomerId(db, UUID_B),
    (err: unknown) => {
      assert.ok(err instanceof CustomerResolutionError);
      assert.equal((err as CustomerResolutionError).status, 404);
      return true;
    },
  );
});

test("resolveCustomerId: input vazio → 400", async () => {
  const db = buildFake([{ id: UUID_A, legacy_id: null }]);
  await assert.rejects(
    () => resolveCustomerId(db, ""),
    (err: unknown) => {
      assert.ok(err instanceof CustomerResolutionError);
      assert.equal((err as CustomerResolutionError).status, 400);
      return true;
    },
  );
});

test("resolveCustomerId: input maior que 200 chars → 400", async () => {
  const db = buildFake([{ id: UUID_A, legacy_id: null }]);
  await assert.rejects(
    () => resolveCustomerId(db, "x".repeat(201)),
    (err: unknown) => {
      assert.ok(err instanceof CustomerResolutionError);
      assert.equal((err as CustomerResolutionError).status, 400);
      return true;
    },
  );
});
