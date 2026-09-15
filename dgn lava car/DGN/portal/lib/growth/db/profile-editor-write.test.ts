import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ProfileEditorError,
  createCustomerVehicle,
} from "./profile-editor-write.ts";

// -----------------------------------------------------------------------------
// Fake do SupabaseClient para exercitar createCustomerVehicle sem Postgres real.
// Cobre os 11 cenários do brief do hotfix.
// -----------------------------------------------------------------------------

interface CustomerRow { id: string; legacy_id: string | null }
interface VehicleRow {
  id: string;
  customer_id: string;
  brand: string | null;
  model: string | null;
  normalized_model: string | null;
  plate: string | null;
  normalized_plate: string | null;
  masked_plate: string | null;
  is_primary: boolean;
  source: string | null;
  created_at: string;
  updated_at: string;
}

interface State {
  customers: CustomerRow[];
  vehicles: VehicleRow[];
  audit: Array<Record<string, unknown>>;
  vehicleAutoId: number;
}

function buildFake(state: State): SupabaseClient {
  const makeBuilder = <T>(rows: T[], op: "select" | "update" | "insert", patch: Record<string, unknown> | null, insertRow: Record<string, unknown> | null) => {
    const filters: Array<{ column: string; value: unknown }> = [];
    let wantSingle = false;
    let wantMaybe = false;
    let wantCount = false;
    let wantHead = false;
    let wantLimit: number | null = null;

    const applyFilters = (source: T[]) => {
      let out = source.slice();
      for (const f of filters) out = out.filter((r) => (r as Record<string, unknown>)[f.column] === f.value);
      return out;
    };

    const runSelect = () => {
      const filtered = applyFilters(rows);
      if (wantHead && wantCount) return { data: null, error: null, count: filtered.length };
      if (wantMaybe) return { data: (filtered[0] ?? null) as unknown, error: null };
      if (wantSingle) {
        if (filtered.length !== 1) return { data: null, error: { message: "not single", code: "PGRST116" } };
        return { data: filtered[0] as unknown, error: null };
      }
      const sliced = wantLimit !== null ? filtered.slice(0, wantLimit) : filtered;
      return { data: sliced as unknown, error: null };
    };

    const runUpdate = () => {
      const targets = applyFilters(rows);
      for (const t of targets) Object.assign(t as Record<string, unknown>, patch ?? {}, { updated_at: "2026-09-15T03:00:00.000Z" });
      if (wantSingle) return { data: targets[0] ?? null, error: targets.length ? null : { message: "no rows", code: "PGRST116" } };
      return { data: targets, error: null };
    };

    const runInsert = () => {
      const row = insertRow!;
      // Vehicle-specific: simulate defaults + generated id + audit.
      const now = "2026-09-15T03:00:00.000Z";
      const filled = { id: `veh-${++state.vehicleAutoId}`, created_at: now, updated_at: now, ...row };
      (rows as unknown as Record<string, unknown>[]).push(filled);
      if (wantSingle) return { data: filled, error: null };
      return { data: filled, error: null };
    };

    const finish = () => {
      if (op === "update") return Promise.resolve(runUpdate());
      if (op === "insert") return Promise.resolve(runInsert());
      return Promise.resolve(runSelect());
    };

    const chain: Record<string, unknown> = {
      select(_cols?: string, options?: { count?: "exact"; head?: boolean }) {
        if (options?.count === "exact") wantCount = true;
        if (options?.head) wantHead = true;
        return chain;
      },
      eq(column: string, value: unknown) { filters.push({ column, value }); return chain; },
      limit(n: number) { wantLimit = n; return chain; },
      maybeSingle() { wantMaybe = true; return finish(); },
      single() { wantSingle = true; return finish(); },
      then(resolve: (v: unknown) => unknown) { return finish().then(resolve); },
    };
    return chain;
  };

  const executor = <T>(rows: T[]) => ({
    select(cols?: string, options?: { count?: "exact"; head?: boolean }) {
      const b = makeBuilder(rows, "select", null, null) as Record<string, unknown>;
      if (options?.count === "exact" || options?.head) (b.select as (c?: string, o?: unknown) => unknown)(cols, options);
      return b;
    },
    update(patch: Record<string, unknown>) { return makeBuilder(rows, "update", patch, null); },
    insert(row: Record<string, unknown>) { return makeBuilder(rows, "insert", null, row); },
  });

  const client = {
    from(table: string) {
      if (table === "crm_customers") return executor(state.customers);
      if (table === "crm_vehicles") return executor(state.vehicles);
      if (table === "crm_audit_logs") {
        return {
          insert: async (row: Record<string, unknown>) => { state.audit.push(row); return { error: null }; },
        } as unknown as ReturnType<typeof executor>;
      }
      throw new Error(`fake: tabela ${table} n/i`);
    },
  } as unknown as SupabaseClient;

  return client;
}

function baseState(): State {
  return {
    customers: [
      { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", legacy_id: "bruno-rossetti" },
      { id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", legacy_id: "outro-cliente" },
    ],
    vehicles: [],
    audit: [],
    vehicleAutoId: 0,
  };
}

// 1. customer com 0 veículos → cria primeiro
// 2. primeiro veículo recebe is_primary=true (implícito, sem passar isPrimary)
// 9. audit vehicle.created criado
// 10. veículo aparece na listagem (state.vehicles ganha entrada)
test("cria primeiro veículo → is_primary=true, source=MANUAL_ADMIN, audit gravado", async () => {
  const state = baseState();
  const db = buildFake(state);
  const result = await createCustomerVehicle({
    customerId: "bruno-rossetti",
    plate: "abc-1234",
    brand: "Honda",
    model: "Civic",
    actor: "digo",
    db,
  });
  assert.equal(result.isPrimary, true, "primeiro veículo deve virar primary");
  assert.equal(result.normalizedPlate, "ABC1234", "placa normalizada");
  assert.equal(state.vehicles.length, 1);
  const veh = state.vehicles[0]!;
  assert.equal(veh.customer_id, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  assert.equal(veh.normalized_plate, "ABC1234");
  assert.equal(veh.masked_plate, "ABC·34");
  assert.equal(veh.source, "MANUAL_ADMIN");
  assert.equal(veh.is_primary, true);
  assert.equal(state.audit.length, 1);
  assert.equal(state.audit[0]!.action, "vehicle.created");
});

// 3. customer com veículo existente adiciona segundo → não vira primary por default
test("segundo veículo entra como is_primary=false por default", async () => {
  const state = baseState();
  state.vehicles.push({
    id: "veh-existing",
    customer_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    brand: null, model: null, normalized_model: null,
    plate: "XYZ0000", normalized_plate: "XYZ0000", masked_plate: "XYZ·00",
    is_primary: true, source: "MANUAL_ADMIN",
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  });
  const db = buildFake(state);
  const result = await createCustomerVehicle({
    customerId: "bruno-rossetti",
    plate: "DEF-5678",
    actor: "digo",
    db,
  });
  assert.equal(result.isPrimary, false);
  const existing = state.vehicles.find((v) => v.id === "veh-existing")!;
  assert.equal(existing.is_primary, true, "veículo primário original preservado");
});

// Marcar como principal migra flag (single-primary)
test("marcar isPrimary=true rebaixa o primário anterior", async () => {
  const state = baseState();
  state.vehicles.push({
    id: "veh-old-primary",
    customer_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    brand: null, model: null, normalized_model: null,
    plate: "XYZ0000", normalized_plate: "XYZ0000", masked_plate: "XYZ·00",
    is_primary: true, source: "MANUAL_ADMIN",
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  });
  const db = buildFake(state);
  const result = await createCustomerVehicle({
    customerId: "bruno-rossetti",
    plate: "DEF-5678",
    isPrimary: true,
    actor: "digo",
    db,
  });
  assert.equal(result.isPrimary, true);
  const old = state.vehicles.find((v) => v.id === "veh-old-primary")!;
  assert.equal(old.is_primary, false, "veículo antigo deve ser rebaixado");
});

// 4. placa duplicada em outro customer bloqueia
test("placa duplicada em outro customer → 409 com mensagem clara", async () => {
  const state = baseState();
  state.vehicles.push({
    id: "veh-of-other",
    customer_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    brand: null, model: null, normalized_model: null,
    plate: "ABC1234", normalized_plate: "ABC1234", masked_plate: "ABC·34",
    is_primary: true, source: "MANUAL_ADMIN",
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  });
  const db = buildFake(state);
  await assert.rejects(
    () => createCustomerVehicle({
      customerId: "bruno-rossetti",
      plate: "ABC-1234",
      actor: "digo",
      db,
    }),
    (err: unknown) => err instanceof ProfileEditorError
      && err.status === 409
      && /outro cliente/i.test(err.message),
  );
  assert.equal(state.vehicles.length, 1, "nenhum novo veículo criado");
  assert.equal(state.audit.length, 0);
});

// 4b. placa duplicada no MESMO customer também bloqueia
test("placa duplicada no mesmo customer → 409", async () => {
  const state = baseState();
  state.vehicles.push({
    id: "veh-same",
    customer_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    brand: null, model: null, normalized_model: null,
    plate: "ABC1234", normalized_plate: "ABC1234", masked_plate: "ABC·34",
    is_primary: true, source: "MANUAL_ADMIN",
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  });
  const db = buildFake(state);
  await assert.rejects(
    () => createCustomerVehicle({
      customerId: "bruno-rossetti",
      plate: "ABC1234",
      actor: "digo",
      db,
    }),
    (err: unknown) => err instanceof ProfileEditorError && err.status === 409,
  );
});

// 5. placa normalizada evita duplicação por lowercase/hífen/espaço
test("normalização evita duplicação por lowercase, hífen, espaço", async () => {
  const state = baseState();
  state.vehicles.push({
    id: "veh-existing",
    customer_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    brand: null, model: null, normalized_model: null,
    plate: "ABC1234", normalized_plate: "ABC1234", masked_plate: "ABC·34",
    is_primary: true, source: "MANUAL_ADMIN",
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  });
  const db = buildFake(state);
  await assert.rejects(
    () => createCustomerVehicle({
      customerId: "bruno-rossetti",
      plate: " abc-1234 ", // lowercase + espaços + hífen — todos normalizados para ABC1234
      actor: "digo",
      db,
    }),
    (err: unknown) => err instanceof ProfileEditorError && err.status === 409,
  );
});

// 6. slug resolve
test("aceita slug (legacy_id) e resolve para UUID interno", async () => {
  const state = baseState();
  const db = buildFake(state);
  const result = await createCustomerVehicle({
    customerId: "bruno-rossetti",
    plate: "AAA1B23",
    actor: "digo",
    db,
  });
  assert.equal(state.vehicles[0]!.customer_id, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  assert.ok(result.vehicleId.startsWith("veh-"));
});

// 7. UUID resolve
test("aceita UUID direto além do slug", async () => {
  const state = baseState();
  const db = buildFake(state);
  const result = await createCustomerVehicle({
    customerId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    plate: "AAA1B23",
    actor: "digo",
    db,
  });
  assert.ok(result.vehicleId.startsWith("veh-"));
});

// Placa inválida → 400
test("placa inválida (fora do padrão 7-8) → 400", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => createCustomerVehicle({
      customerId: "bruno-rossetti",
      plate: "AB",
      actor: "digo",
      db,
    }),
    (err: unknown) => err instanceof ProfileEditorError && err.status === 400,
  );
});

// customer inexistente → 404
test("customer inexistente → 404", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => createCustomerVehicle({
      customerId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      plate: "ABC1234",
      actor: "digo",
      db,
    }),
    (err: unknown) => err instanceof ProfileEditorError && err.status === 404,
  );
});
