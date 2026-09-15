import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AppointmentError,
  cancelAppointment,
  updateAppointment,
} from "./appointments-write.ts";

// -----------------------------------------------------------------------------
// Fake mínimo do SupabaseClient para exercitar updateAppointment sem Postgres
// real. Mesma abordagem de portal-access-write.test.ts: apenas o subset de
// operações consumido pelo write layer.
//
// Cobre o que a Fatia 2b precisa provar:
//   1. Edita data/hora
//   2. Edita serviço
//   3. Troca veículo válido do mesmo customer
//   4. Rejeita veículo de outro customer
//   5. Preserva id
//   6. Preserva created_at
//   7. Preserva external_ref / import_source / imported_at (import traceability)
//   8. Cancel continua funcionando (regressão)
//   9. Slug (gustavo-plensack) continua resolvendo antes do UPDATE
//  10. (route level, em appointments-route.test.ts) unauthorized bloqueia
//  11. Audit log 'appointment.updated' criado com changed_fields
//  12. Update usa UPDATE (não delete+create) — assertível via chamada
// -----------------------------------------------------------------------------

interface AppointmentRow {
  id: string;
  customer_id: string;
  subscription_id: string | null;
  vehicle_id: string | null;
  scheduled_at: string;
  service_type: string | null;
  status: "scheduled" | "confirmed" | "done" | "cancelled" | "no_show";
  source: string;
  notes: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancelled_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  external_ref: string | null;
  import_source: string | null;
  imported_at: string | null;
}

interface VehicleRow { id: string; customer_id: string }
interface SubscriptionRow { id: string; customer_id: string }
interface CustomerRow { id: string; legacy_id: string | null }

interface State {
  customers: CustomerRow[];
  appointments: AppointmentRow[];
  vehicles: VehicleRow[];
  subscriptions: SubscriptionRow[];
  audit: Array<Record<string, unknown>>;
  inserts: number; // deve permanecer em 0 durante updateAppointment
  deletes: number; // idem
}

function buildFake(state: State): SupabaseClient {
  // Cada chamada a .select()/.update()/.insert()/.delete() cria um builder
  // NOVO, com filtros próprios — replica a semântica do
  // PostgrestFilterBuilder do supabase-js: o customer-resolver reutiliza a
  // mesma referência de .from("crm_customers") para 2 queries encadeadas
  // (legacy_id e id) e cada .select() precisa começar sem filtros herdados.
  const makeBuilder = <T>(rows: T[], op: "select" | "update", patch: Record<string, unknown>) => {
    const filters: Array<{ column: string; value: unknown }> = [];
    let wantSingle = false;
    let wantMaybe = false;

    const runSelect = () => {
      let filtered = rows.slice();
      for (const f of filters) filtered = filtered.filter((r) => (r as Record<string, unknown>)[f.column] === f.value);
      if (wantMaybe) return { data: (filtered[0] ?? null) as unknown, error: null };
      if (wantSingle) {
        if (filtered.length !== 1) return { data: null, error: { message: "not single", code: "PGRST116" } };
        return { data: filtered[0] as unknown, error: null };
      }
      return { data: filtered as unknown, error: null };
    };

    const runUpdate = () => {
      let target: T | undefined;
      for (const row of rows) {
        if (filters.every((f) => (row as Record<string, unknown>)[f.column] === f.value)) {
          Object.assign(row as Record<string, unknown>, patch);
          target = row;
        }
      }
      if (target) (target as Record<string, unknown>).updated_at = "2026-09-14T20:00:00.000Z";
      if (wantSingle) return { data: target ?? null, error: target ? null : { message: "no rows", code: "PGRST116" } };
      return { data: target ? [target] : [], error: null };
    };

    const finish = () => Promise.resolve(op === "update" ? runUpdate() : runSelect());

    const chain: Record<string, unknown> = {
      select() { return chain; },
      eq(column: string, value: unknown) { filters.push({ column, value }); return chain; },
      maybeSingle() { wantMaybe = true; return finish(); },
      single() { wantSingle = true; return finish(); },
      then(resolve: (v: unknown) => unknown) { return finish().then(resolve); },
    };
    return chain;
  };

  const executor = <T>(rows: T[]) => ({
    select(_cols?: string) { return makeBuilder(rows, "select", {}); },
    update(next: Record<string, unknown>) { return makeBuilder(rows, "update", next); },
    insert(_row: unknown) { state.inserts += 1; return makeBuilder(rows, "select", {}); },
    delete() { state.deletes += 1; return makeBuilder(rows, "select", {}); },
  });

  const client = {
    from(table: string) {
      if (table === "crm_customers") return executor(state.customers);
      if (table === "crm_appointments") return executor(state.appointments);
      if (table === "crm_vehicles") return executor(state.vehicles);
      if (table === "crm_subscriptions") return executor(state.subscriptions);
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
      { id: "cust-1", legacy_id: "gustavo-plensack" },
      { id: "cust-2", legacy_id: "outro" },
    ],
    appointments: [
      {
        id: "appt-1",
        customer_id: "cust-1",
        subscription_id: "sub-1",
        vehicle_id: "veh-1",
        scheduled_at: "2026-09-20T15:00:00.000Z",
        service_type: "Lavagem completa",
        status: "scheduled",
        source: "MANUAL_ADMIN",
        notes: null,
        cancelled_at: null,
        cancelled_by: null,
        cancelled_reason: null,
        created_by: "digo",
        created_at: "2026-09-10T12:00:00.000Z",
        updated_at: "2026-09-10T12:00:00.000Z",
        external_ref: null,
        import_source: null,
        imported_at: null,
      },
      {
        id: "appt-2-imported",
        customer_id: "cust-1",
        subscription_id: null,
        vehicle_id: null,
        scheduled_at: "2026-09-22T10:00:00.000Z",
        service_type: "OS 4UCAR",
        status: "scheduled",
        source: "AUTO",
        notes: null,
        cancelled_at: null,
        cancelled_by: null,
        cancelled_reason: null,
        created_by: "importer-4ucar",
        created_at: "2026-09-05T08:00:00.000Z",
        updated_at: "2026-09-05T08:00:00.000Z",
        external_ref: "OS-018125",
        import_source: "4UCAR",
        imported_at: "2026-09-05T08:00:00.000Z",
      },
      {
        id: "appt-3-done",
        customer_id: "cust-1",
        subscription_id: null,
        vehicle_id: null,
        scheduled_at: "2026-08-01T15:00:00.000Z",
        service_type: "Lavagem",
        status: "done",
        source: "MANUAL_ADMIN",
        notes: null,
        cancelled_at: null,
        cancelled_by: null,
        cancelled_reason: null,
        created_by: "digo",
        created_at: "2026-07-25T10:00:00.000Z",
        updated_at: "2026-08-01T15:30:00.000Z",
        external_ref: null,
        import_source: null,
        imported_at: null,
      },
    ],
    vehicles: [
      { id: "veh-1", customer_id: "cust-1" },
      { id: "veh-2", customer_id: "cust-1" },
      { id: "veh-of-other", customer_id: "cust-2" },
    ],
    subscriptions: [
      { id: "sub-1", customer_id: "cust-1" },
      { id: "sub-of-other", customer_id: "cust-2" },
    ],
    audit: [],
    inserts: 0,
    deletes: 0,
  };
}

// 1 + 5 + 6 + 7 + 11 + 12: edita data/hora, preserva id/created_at/traceability, audita, sem INSERT/DELETE
test("update: edita data/hora, preserva imutáveis, cria audit, sem delete+create", async () => {
  const state = baseState();
  const db = buildFake(state);
  const updated = await updateAppointment({
    customerId: "gustavo-plensack",
    appointmentId: "appt-1",
    scheduledAt: "2026-09-25T18:30:00.000Z",
    actor: "digo",
    db,
  });
  assert.equal(updated.id, "appt-1"); // preserva id
  assert.equal(updated.customer_id, "cust-1");
  assert.equal(updated.scheduled_at, "2026-09-25T18:30:00.000Z");
  const persisted = state.appointments.find((a) => a.id === "appt-1")!;
  assert.equal(persisted.created_at, "2026-09-10T12:00:00.000Z"); // created_at intocado
  assert.equal(persisted.created_by, "digo"); // created_by intocado
  assert.equal(state.inserts, 0);
  assert.equal(state.deletes, 0);
  const audit = state.audit.at(-1)!;
  assert.equal(audit.action, "appointment.updated");
  const before = audit.previous_value as { changed_fields: string[]; scheduled_at: string };
  assert.deepEqual(before.changed_fields, ["scheduled_at"]);
  assert.equal(before.scheduled_at, "2026-09-20T15:00:00.000Z");
});

// 2: edita serviço
test("update: edita service_type", async () => {
  const state = baseState();
  const db = buildFake(state);
  const updated = await updateAppointment({
    customerId: "gustavo-plensack",
    appointmentId: "appt-1",
    serviceType: "Higienização interna",
    actor: "digo",
    db,
  });
  assert.equal(updated.service_type, "Higienização interna");
  const audit = state.audit.at(-1) as { previous_value: { changed_fields: string[] } };
  assert.deepEqual(audit.previous_value.changed_fields, ["service_type"]);
});

// 3: troca veículo válido do mesmo customer
test("update: troca veículo válido do mesmo customer", async () => {
  const state = baseState();
  const db = buildFake(state);
  const updated = await updateAppointment({
    customerId: "gustavo-plensack",
    appointmentId: "appt-1",
    vehicleId: "veh-2",
    actor: "digo",
    db,
  });
  assert.equal(updated.vehicle_id, "veh-2");
});

// 4: rejeita veículo de outro customer
test("update: rejeita veículo de outro customer", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => updateAppointment({
      customerId: "gustavo-plensack",
      appointmentId: "appt-1",
      vehicleId: "veh-of-other",
      actor: "digo",
      db,
    }),
    (err: unknown) => err instanceof AppointmentError && err.status === 403 && /outro cliente/i.test(err.message),
  );
  // Nenhum audit gravado, appointment intocado
  assert.equal(state.audit.length, 0);
  const untouched = state.appointments.find((a) => a.id === "appt-1")!;
  assert.equal(untouched.vehicle_id, "veh-1");
});

// 4b: rejeita subscription de outro customer
test("update: rejeita subscription de outro customer", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => updateAppointment({
      customerId: "gustavo-plensack",
      appointmentId: "appt-1",
      subscriptionId: "sub-of-other",
      actor: "digo",
      db,
    }),
    (err: unknown) => err instanceof AppointmentError && err.status === 403 && /outro cliente/i.test(err.message),
  );
});

// 7: preserva external_ref / import_source / imported_at ao editar linha importada
test("update: linha importada 4UCAR — edita data mas preserva rastreabilidade", async () => {
  const state = baseState();
  const db = buildFake(state);
  await updateAppointment({
    customerId: "gustavo-plensack",
    appointmentId: "appt-2-imported",
    scheduledAt: "2026-09-30T14:00:00.000Z",
    actor: "digo",
    db,
  });
  const persisted = state.appointments.find((a) => a.id === "appt-2-imported")!;
  assert.equal(persisted.external_ref, "OS-018125");
  assert.equal(persisted.import_source, "4UCAR");
  assert.equal(persisted.imported_at, "2026-09-05T08:00:00.000Z");
  assert.equal(persisted.scheduled_at, "2026-09-30T14:00:00.000Z");
});

// 5b (guard): appointment de outro cliente → 403 (ownership check antes de qualquer UPDATE)
test("update: appointment de outro cliente → 403", async () => {
  const state = baseState();
  state.appointments.push({
    ...state.appointments[0]!,
    id: "appt-other-owner",
    customer_id: "cust-2",
  });
  const db = buildFake(state);
  await assert.rejects(
    () => updateAppointment({
      customerId: "gustavo-plensack",
      appointmentId: "appt-other-owner",
      scheduledAt: "2026-10-01T10:00:00.000Z",
      actor: "digo",
      db,
    }),
    (err: unknown) => err instanceof AppointmentError && err.status === 403,
  );
});

// Status guard: done não pode ser editado (evita reabertura silenciosa)
test("update: done não pode ser editado (guard)", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => updateAppointment({
      customerId: "gustavo-plensack",
      appointmentId: "appt-3-done",
      scheduledAt: "2026-10-01T10:00:00.000Z",
      actor: "digo",
      db,
    }),
    (err: unknown) => err instanceof AppointmentError && err.status === 409 && /executado/i.test(err.message),
  );
  assert.equal(state.audit.length, 0);
});

// Status guard: cancelled não pode ser editado
test("update: cancelled não pode ser editado", async () => {
  const state = baseState();
  state.appointments[0]!.status = "cancelled";
  const db = buildFake(state);
  await assert.rejects(
    () => updateAppointment({
      customerId: "gustavo-plensack",
      appointmentId: "appt-1",
      scheduledAt: "2026-10-01T10:00:00.000Z",
      actor: "digo",
      db,
    }),
    (err: unknown) => err instanceof AppointmentError && err.status === 409 && /cancelado/i.test(err.message),
  );
});

// No-op: patch vazio não gera audit, não muda updated_at
test("update: no-op quando nada muda", async () => {
  const state = baseState();
  const db = buildFake(state);
  const result = await updateAppointment({
    customerId: "gustavo-plensack",
    appointmentId: "appt-1",
    scheduledAt: "2026-09-20T15:00:00.000Z", // igual ao atual
    serviceType: "Lavagem completa",         // igual ao atual
    actor: "digo",
    db,
  });
  assert.equal(result.id, "appt-1");
  assert.equal(state.audit.length, 0);
});

// 8: cancel continua funcionando (regressão)
test("cancel: continua funcionando após introdução de update", async () => {
  const state = baseState();
  const db = buildFake(state);
  const cancelled = await cancelAppointment({
    customerId: "gustavo-plensack",
    appointmentId: "appt-1",
    reason: "cliente pediu",
    actor: "digo",
    db,
  });
  assert.equal(cancelled.status, "cancelled");
  assert.equal(state.audit.at(-1)?.action, "appointment.cancelled");
});

// 9: slug resolve (todos os testes acima usam "gustavo-plensack") — este cobre o UUID
test("update: aceita UUID direto além do slug", async () => {
  const state = baseState();
  const uuid = "11111111-1111-1111-1111-111111111111";
  state.customers[0]!.id = uuid;
  state.appointments[0]!.customer_id = uuid;
  const db = buildFake(state);
  const updated = await updateAppointment({
    customerId: uuid,
    appointmentId: "appt-1",
    notes: "Trocar cera",
    actor: "digo",
    db,
  });
  assert.equal(updated.notes, "Trocar cera");
});

// Erro claro quando appointmentId inexistente
test("update: appointment inexistente → 404", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => updateAppointment({
      customerId: "gustavo-plensack",
      appointmentId: "00000000-0000-0000-0000-000000000000",
      scheduledAt: "2026-10-01T10:00:00.000Z",
      actor: "digo",
      db,
    }),
    (err: unknown) => err instanceof AppointmentError && err.status === 404,
  );
});
