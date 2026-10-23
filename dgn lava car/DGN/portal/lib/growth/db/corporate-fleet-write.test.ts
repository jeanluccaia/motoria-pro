import { test } from "node:test";
import assert from "node:assert/strict";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CorporateFleetWriteError,
  createCompany,
  createManager,
  createFleetVehicle,
  createServiceRequest,
  confirmServiceRequest,
  counterProposeServiceRequest,
  acceptCounterServiceRequest,
  cancelServiceRequest,
} from "./corporate-fleet-write.ts";

interface RpcCall {
  fn: string;
  params: Record<string, unknown>;
}
function makeDb(handler: (fn: string, params: Record<string, unknown>) => { data: unknown; error: unknown }) {
  const calls: RpcCall[] = [];
  const db = {
    rpc: async (fn: string, params: Record<string, unknown>) => {
      calls.push({ fn, params });
      return handler(fn, params);
    },
  } as unknown as SupabaseClient;
  return { db, calls };
}

// ---------------------------------------------------------------------------
// Input validation (sem bater na RPC)
// ---------------------------------------------------------------------------

test("createCompany: actor vazio → 400", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  await assert.rejects(
    () => createCompany({ legalName: "A", displayName: "B", actor: "   ", db }),
    (e: unknown) => e instanceof CorporateFleetWriteError && e.status === 400,
  );
});

test("createCompany: legalName obrigatório", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  await assert.rejects(
    () => createCompany({ legalName: "   ", displayName: "B", actor: "x", db }),
    (e: unknown) => e instanceof CorporateFleetWriteError && e.status === 400,
  );
});

test("createCompany: displayName obrigatório", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  await assert.rejects(
    () => createCompany({ legalName: "A", displayName: "   ", actor: "x", db }),
    (e: unknown) => e instanceof CorporateFleetWriteError && e.status === 400,
  );
});

test("createCompany: mapeia params p_* snake_case", async () => {
  const { db, calls } = makeDb(() => ({
    data: [{ result_code: "CREATED", company_id: "co-1" }],
    error: null,
  }));
  const result = await createCompany({
    legalName: "Transportes Alpha",
    displayName: "Alpha",
    cnpj: "12.345.678/0001-99",
    contactEmail: "frotas@alpha.com",
    contactPhone: "+55 19 90000-0000",
    notes: "cliente âncora",
    actor: "jean@dgn",
    db,
  });
  assert.equal(result.resultCode, "CREATED");
  assert.equal(result.companyId, "co-1");
  assert.equal(calls[0]!.fn, "crm_company_create");
  const p = calls[0]!.params;
  assert.equal(p.p_legal_name, "Transportes Alpha");
  assert.equal(p.p_display_name, "Alpha");
  assert.equal(p.p_cnpj, "12.345.678/0001-99");
  assert.equal(p.p_contact_email, "frotas@alpha.com");
  assert.equal(p.p_actor, "jean@dgn");
});

test("createCompany: result_code inesperado → 502", async () => {
  const { db } = makeDb(() => ({ data: [{ result_code: "WUT" }], error: null }));
  await assert.rejects(
    () => createCompany({ legalName: "A", displayName: "B", actor: "x", db }),
    (e: unknown) => e instanceof CorporateFleetWriteError && e.status === 502,
  );
});

// Manager --------------------------------------------------------------------

test("createManager: email obrigatório", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  await assert.rejects(
    () => createManager({ companyId: "co-1", displayName: "n", email: "   ", actor: "x", db }),
    (e: unknown) => e instanceof CorporateFleetWriteError && e.status === 400,
  );
});

test("createManager: COMPANY_NOT_FOUND passa estrutura", async () => {
  const { db } = makeDb(() => ({
    data: [{ result_code: "COMPANY_NOT_FOUND", manager_id: null }],
    error: null,
  }));
  const result = await createManager({
    companyId: "co-?",
    displayName: "x",
    email: "a@b",
    actor: "x",
    db,
  });
  assert.equal(result.resultCode, "COMPANY_NOT_FOUND");
  assert.equal(result.managerId, null);
});

test("createManager: EMAIL_ALREADY_IN_COMPANY passa estrutura", async () => {
  const { db } = makeDb(() => ({
    data: [{ result_code: "EMAIL_ALREADY_IN_COMPANY", manager_id: null }],
    error: null,
  }));
  const result = await createManager({
    companyId: "co-1",
    displayName: "x",
    email: "a@b",
    actor: "x",
    db,
  });
  assert.equal(result.resultCode, "EMAIL_ALREADY_IN_COMPANY");
});

// Fleet vehicle --------------------------------------------------------------

test("createFleetVehicle: plate obrigatória", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  await assert.rejects(
    () => createFleetVehicle({ companyId: "co-1", plate: "   ", actor: "x", db }),
    (e: unknown) => e instanceof CorporateFleetWriteError && e.status === 400,
  );
});

test("createFleetVehicle: PLATE_ALREADY_IN_COMPANY passa estrutura", async () => {
  const { db } = makeDb(() => ({
    data: [{ result_code: "PLATE_ALREADY_IN_COMPANY", vehicle_id: null }],
    error: null,
  }));
  const result = await createFleetVehicle({
    companyId: "co-1",
    plate: "ABC1D23",
    actor: "x",
    db,
  });
  assert.equal(result.resultCode, "PLATE_ALREADY_IN_COMPANY");
});

// Service request ------------------------------------------------------------

test("createServiceRequest: serviceType obrigatório", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  await assert.rejects(
    () =>
      createServiceRequest({
        fleetVehicleId: "fv-1",
        managerId: "mg-1",
        serviceType: "   ",
        preferredDate1: "2026-10-25T10:00:00Z",
        actor: "x",
        db,
      }),
    (e: unknown) => e instanceof CorporateFleetWriteError && e.status === 400,
  );
});

test("createServiceRequest: preferredDate1 obrigatória", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  await assert.rejects(
    () =>
      createServiceRequest({
        fleetVehicleId: "fv-1",
        managerId: "mg-1",
        serviceType: "Lavagem",
        preferredDate1: "",
        actor: "x",
        db,
      }),
    (e: unknown) => e instanceof CorporateFleetWriteError && e.status === 400,
  );
});

test("createServiceRequest: COMPANY_MISMATCH é propagado como enum", async () => {
  const { db } = makeDb(() => ({
    data: [{ result_code: "COMPANY_MISMATCH", request_id: null }],
    error: null,
  }));
  const result = await createServiceRequest({
    fleetVehicleId: "fv-x",
    managerId: "mg-y",
    serviceType: "Lavagem",
    preferredDate1: "2026-10-25T10:00:00Z",
    actor: "x",
    db,
  });
  assert.equal(result.resultCode, "COMPANY_MISMATCH");
});

test("createServiceRequest: CREATED devolve id", async () => {
  const { db, calls } = makeDb(() => ({
    data: [{ result_code: "CREATED", request_id: "req-9" }],
    error: null,
  }));
  const result = await createServiceRequest({
    fleetVehicleId: "fv-1",
    managerId: "mg-1",
    serviceType: "Lavagem",
    preferredDate1: "2026-10-25T10:00:00Z",
    preferredDate2: "2026-10-26T10:00:00Z",
    managerNotes: "manhã",
    actor: "carlos@alpha",
    db,
  });
  assert.equal(result.resultCode, "CREATED");
  assert.equal(result.requestId, "req-9");
  assert.equal(calls[0]!.params.p_preferred_date_2, "2026-10-26T10:00:00Z");
});

// Decisions ------------------------------------------------------------------

test("confirmServiceRequest: UPDATED", async () => {
  const { db } = makeDb(() => ({
    data: [{ result_code: "UPDATED", request_id: "req-1" }],
    error: null,
  }));
  const result = await confirmServiceRequest({
    requestId: "req-1",
    scheduledAt: "2026-10-25T10:00:00Z",
    actor: "jean@dgn",
    db,
  });
  assert.equal(result.resultCode, "UPDATED");
});

test("confirmServiceRequest: ALREADY_CONFIRMED idempotente", async () => {
  const { db } = makeDb(() => ({
    data: [{ result_code: "ALREADY_CONFIRMED", request_id: "req-1" }],
    error: null,
  }));
  const result = await confirmServiceRequest({
    requestId: "req-1",
    scheduledAt: "2026-10-25T10:00:00Z",
    actor: "jean@dgn",
    db,
  });
  assert.equal(result.resultCode, "ALREADY_CONFIRMED");
});

test("confirmServiceRequest: INVALID_STATE_TRANSITION reconhecido", async () => {
  const { db } = makeDb(() => ({
    data: [{ result_code: "INVALID_STATE_TRANSITION", request_id: "req-1" }],
    error: null,
  }));
  const result = await confirmServiceRequest({
    requestId: "req-1",
    scheduledAt: "2026-10-25T10:00:00Z",
    actor: "jean@dgn",
    db,
  });
  assert.equal(result.resultCode, "INVALID_STATE_TRANSITION");
});

test("counterProposeServiceRequest: proposedAt obrigatória", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  await assert.rejects(
    () =>
      counterProposeServiceRequest({
        requestId: "req-1",
        proposedAt: "",
        actor: "x",
        db,
      }),
    (e: unknown) => e instanceof CorporateFleetWriteError && e.status === 400,
  );
});

test("acceptCounterServiceRequest: MANAGER_MISMATCH é código reconhecido", async () => {
  const { db } = makeDb(() => ({
    data: [{ result_code: "MANAGER_MISMATCH", request_id: "req-1" }],
    error: null,
  }));
  const result = await acceptCounterServiceRequest({
    requestId: "req-1",
    managerId: "mg-x",
    actor: "x",
    db,
  });
  assert.equal(result.resultCode, "MANAGER_MISMATCH");
});

test("cancelServiceRequest: reason obrigatório", async () => {
  const { db } = makeDb(() => ({ data: [], error: null }));
  await assert.rejects(
    () => cancelServiceRequest({ requestId: "req-1", reason: "   ", actor: "x", db }),
    (e: unknown) => e instanceof CorporateFleetWriteError && e.status === 400,
  );
});

test("cancelServiceRequest: ALREADY_CANCELLED idempotente", async () => {
  const { db } = makeDb(() => ({
    data: [{ result_code: "ALREADY_CANCELLED", request_id: "req-1" }],
    error: null,
  }));
  const result = await cancelServiceRequest({
    requestId: "req-1",
    reason: "motivo",
    actor: "x",
    db,
  });
  assert.equal(result.resultCode, "ALREADY_CANCELLED");
});

test("decisions: NOT_FOUND reconhecido", async () => {
  const { db } = makeDb(() => ({
    data: [{ result_code: "NOT_FOUND", request_id: null }],
    error: null,
  }));
  const result = await confirmServiceRequest({
    requestId: "x",
    scheduledAt: "2026-10-25T10:00:00Z",
    actor: "x",
    db,
  });
  assert.equal(result.resultCode, "NOT_FOUND");
  assert.equal(result.requestId, null);
});
