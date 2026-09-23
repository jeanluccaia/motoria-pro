import test from "node:test";
import assert from "node:assert/strict";
import {
  filterCustomersForDiagnosticSearch,
  checkVehicleOwnership,
  selectVehicleForNewDiagnostic,
  type DiagnosticCustomerCandidate,
} from "./customer-search.ts";

const base: DiagnosticCustomerCandidate[] = [
  {
    id: "cust-jose", name: "José Sérgio", phone: "(19) 99123-4567",
    vehicles: [
      { id: "veh-hb20", brand: "Hyundai", model: "HB20", plate: "ABC1D23", isPrimary: true },
      { id: "veh-basalt", brand: "Chevrolet", model: "Basalt", plate: "XYZ9K88", isPrimary: false },
    ],
    hasActiveSubscription: true, activePlan: "Smart",
  },
  {
    id: "cust-ana", name: "Ana Paula", phone: "(19) 98876-0011",
    vehicles: [{ id: "veh-onix", brand: "Chevrolet", model: "Onix", plate: "DEF2E44", isPrimary: true }],
    hasActiveSubscription: false, activePlan: null,
  },
  {
    id: "cust-bruno", name: "Bruno Rossetti", phone: "",
    vehicles: [], // sem veículo — pra teste do CTA de cadastro
    hasActiveSubscription: false, activePlan: null,
  },
];

test("busca preserva lista completa de veículos", () => {
  const hits = filterCustomersForDiagnosticSearch(base, "jose");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].vehicles.length, 2, "não pode perder veículos secundários");
});

test("busca por nome sem acento funciona", () => {
  const hits = filterCustomersForDiagnosticSearch(base, "sergio");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, "cust-jose");
});

test("busca por placa do veículo primário", () => {
  const hits = filterCustomersForDiagnosticSearch(base, "def2e");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, "cust-ana");
});

test("cliente sem veículos aparece na busca (para CTA de cadastro)", () => {
  const hits = filterCustomersForDiagnosticSearch(base, "bruno");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].vehicles.length, 0);
});

// ---------------------------------------------------------------------------

test("checkVehicleOwnership: OK quando veículo pertence", () => {
  const r = checkVehicleOwnership(base, "cust-jose", "veh-hb20");
  assert.equal(r.ok, true);
});

test("checkVehicleOwnership: veículo de outro dono", () => {
  const r = checkVehicleOwnership(base, "cust-ana", "veh-hb20"); // hb20 é do José
  assert.equal(r.ok, false);
  assert.equal(r.reason, "vehicle_wrong_owner");
});

test("checkVehicleOwnership: veículo inexistente", () => {
  const r = checkVehicleOwnership(base, "cust-jose", "veh-fantasma");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "vehicle_missing");
});

test("checkVehicleOwnership: customer inexistente", () => {
  const r = checkVehicleOwnership(base, "cust-fake", "veh-hb20");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "customer_missing");
});

// ---------------------------------------------------------------------------

test("selectVehicleForNewDiagnostic: 1 veículo → aceita sem escolha", () => {
  const r = selectVehicleForNewDiagnostic(base[1].vehicles, null);
  assert.equal(r.kind, "ok");
  if (r.kind === "ok") assert.equal(r.vehicleId, "veh-onix");
});

test("selectVehicleForNewDiagnostic: >1 veículos sem preferência → must_choose (não assume o primeiro)", () => {
  const r = selectVehicleForNewDiagnostic(base[0].vehicles, null);
  assert.equal(r.kind, "must_choose");
});

test("selectVehicleForNewDiagnostic: >1 veículos com preferência válida → ok", () => {
  const r = selectVehicleForNewDiagnostic(base[0].vehicles, "veh-basalt");
  assert.equal(r.kind, "ok");
  if (r.kind === "ok") assert.equal(r.vehicleId, "veh-basalt");
});

test("selectVehicleForNewDiagnostic: preferência não corresponde a nenhum veículo → must_choose", () => {
  const r = selectVehicleForNewDiagnostic(base[0].vehicles, "veh-fantasma");
  assert.equal(r.kind, "must_choose");
});

test("selectVehicleForNewDiagnostic: 0 veículos → no_vehicles (CTA cadastro)", () => {
  const r = selectVehicleForNewDiagnostic([], null);
  assert.equal(r.kind, "no_vehicles");
});
