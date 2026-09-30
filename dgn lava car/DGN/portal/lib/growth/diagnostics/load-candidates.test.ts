import test from "node:test";
import assert from "node:assert/strict";

import { buildDiagnosticCandidates } from "./load-candidates.ts";
import type { DgnCustomer } from "../dgn-growth-data.ts";

// Fixtures mínimas — só campos que buildDiagnosticCandidates lê.
function growthCustomer(overrides: {
  id: string;
  name?: string;
  phone?: string;
  activeSubscription?: boolean;
  activePlan?: string | null;
}): DgnCustomer {
  return {
    id: overrides.id,
    name: overrides.name ?? "Cliente Teste",
    phone: overrides.phone ?? "",
    vehicle: "",
    plate: "",
    companyLink: "",
    origin: "4uCar",
    attendanceHistory: [],
    washCount: 0,
    historicalValue: 0,
    customerSince: "",
    lastAttendance: "",
    scoreDgn: 0,
    recommendedPlan: "Smart",
    activePlan: overrides.activePlan ?? null,
    commercialStatus: "Aguardando Curadoria DGN",
    recurrence: "",
    averageVisitIntervalDays: 0,
    dataQualityStatus: "",
    dataQualityNotes: "",
    hasValidPhone: false,
    subscription: overrides.activeSubscription
      ? { nextDueDate: null, paymentMethod: null, paymentMethodLabel: null, status: "ativo", isActive: true }
      : null,
    portalAccess: undefined,
    commercial: {
      owner: "", commercialNotes: "", nextAction: "", nextActionAt: "",
      priority: "normal", updatedAt: "",
    },
    curation: {
      profile: "", originGroup: "", commercialProfile: "", idealSchedule: "",
      founderDecision: "", founderNumber: "", internalNotes: "",
    },
    campaign: {
      currentCampaign: "", founderSelected: false, founderNumber: "",
      founderCondition: "", campaignStatus: "", personalizedPagePath: "",
      paymentLink: "", lastAction: "", nextAction: "", lastContact: "",
      conversationStatus: "", notes: "", kitStatus: "", cardStatus: "",
    },
  } as unknown as DgnCustomer;
}

const UUID_WELLINGTON = "2fc9edee-d3cd-4365-af5a-ac02c1ccb0bb";
const UUID_JOSE = "49407041-2edd-4602-8459-06db1e09abe5";
const UUID_DANIELE = "ffee91f5-75ee-46d8-931f-07996e18cbea";

test("resolve legacy_id → UUID canônico e devolve todos os veículos (caso Wellington)", () => {
  const growth = [growthCustomer({ id: "wellington-felix", name: "Wellington Felix" })];
  const dbCustomers = [{ id: UUID_WELLINGTON, legacy_id: "wellington-felix" }];
  const vehicles = [
    { id: "v-swr", customer_id: UUID_WELLINGTON, plate: "SWR0J66", brand: null, model: "ZR-V", is_primary: true },
    { id: "v-def", customer_id: UUID_WELLINGTON, plate: "DEF8553", brand: null, model: "Golf", is_primary: false },
  ];

  const result = buildDiagnosticCandidates(growth, dbCustomers, vehicles);

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "wellington-felix", "preserva slug pra URL de ficha");
  assert.equal(result[0].vehicles.length, 2);
  assert.deepEqual(
    result[0].vehicles.map((v) => v.plate).sort(),
    ["DEF8553", "SWR0J66"],
  );
});

test("resolve UUID → UUID quando legacy_id=null (caso Jose Sergio / Daniele)", () => {
  const growth = [
    growthCustomer({ id: UUID_JOSE, name: "Jose Sergio Bressan Junior" }),
    growthCustomer({ id: UUID_DANIELE, name: "Daniele Dullius" }),
  ];
  const dbCustomers = [
    { id: UUID_JOSE, legacy_id: null },
    { id: UUID_DANIELE, legacy_id: null },
  ];
  const vehicles = [
    { id: "v-tke", customer_id: UUID_JOSE, plate: "TKE5H15", brand: null, model: "Basalt", is_primary: false },
    { id: "v-uqg-jose", customer_id: UUID_JOSE, plate: "UQG0C00", brand: null, model: "HB20", is_primary: false },
    { id: "v-tkf", customer_id: UUID_DANIELE, plate: "TKF9G75", brand: "Peugeot", model: "2008", is_primary: true },
    { id: "v-uqg-dani", customer_id: UUID_DANIELE, plate: "UQG5F52", brand: "Jeep", model: "Compass", is_primary: false },
  ];

  const result = buildDiagnosticCandidates(growth, dbCustomers, vehicles);

  const jose = result.find((r) => r.id === UUID_JOSE)!;
  const daniele = result.find((r) => r.id === UUID_DANIELE)!;
  assert.equal(jose.vehicles.length, 2);
  assert.equal(daniele.vehicles.length, 2);
  assert.deepEqual(jose.vehicles.map((v) => v.plate).sort(), ["TKE5H15", "UQG0C00"]);
  assert.deepEqual(daniele.vehicles.map((v) => v.plate).sort(), ["TKF9G75", "UQG5F52"]);
});

test("cliente com 1 veículo devolve exatamente 1", () => {
  const growth = [growthCustomer({ id: UUID_JOSE })];
  const dbCustomers = [{ id: UUID_JOSE, legacy_id: null }];
  const vehicles = [
    { id: "v1", customer_id: UUID_JOSE, plate: "ABC1234", brand: null, model: null, is_primary: true },
  ];

  const result = buildDiagnosticCandidates(growth, dbCustomers, vehicles);
  assert.equal(result[0].vehicles.length, 1);
  assert.equal(result[0].vehicles[0].plate, "ABC1234");
});

test("cliente com 0 veículos devolve array vazio (não infere fallback)", () => {
  const growth = [growthCustomer({ id: UUID_JOSE })];
  const dbCustomers = [{ id: UUID_JOSE, legacy_id: null }];

  const result = buildDiagnosticCandidates(growth, dbCustomers, []);
  assert.equal(result[0].vehicles.length, 0);
});

test("dataset com >1000 veículos: todos os customers recebem seus veículos", () => {
  // Regressão do bug: crm_vehicles em prod > 1000 rows. Aqui simulamos 1500
  // vehicles distribuídos entre 5 customers para garantir que a função pura
  // suporta qualquer volume — a paginação real fica no fetcher acima.
  const customers = Array.from({ length: 5 }, (_, i) => `uuid-c${i}`);
  const growth = customers.map((id) => growthCustomer({ id, name: `C${id}` }));
  const dbCustomers = customers.map((id) => ({ id, legacy_id: null }));
  const vehicles = Array.from({ length: 1500 }, (_, i) => ({
    id: `v${i}`,
    customer_id: customers[i % customers.length],
    plate: `P${i}`,
    brand: null,
    model: null,
    is_primary: i < customers.length,
  }));

  const result = buildDiagnosticCandidates(growth, dbCustomers, vehicles);

  assert.equal(result.length, 5);
  for (const c of result) {
    assert.equal(c.vehicles.length, 300, `${c.id} deveria ter 300 veículos`);
  }
});

test("não infere veículo por nome/telefone/placa quando UUID não está mapeado", () => {
  // Cliente wellington-felix no growth, mas o db não tem a linha correspondente
  // (situação de dessincronização). NÃO pode cair em fallback heurístico:
  // vehicles órfãos com nome/telefone/placa parecidos jamais podem ser
  // atribuídos silenciosamente.
  const growth = [growthCustomer({ id: "wellington-felix", name: "Wellington Felix", phone: "19981260520" })];
  const dbCustomers: Array<{ id: string; legacy_id: string | null }> = [];
  const vehicles = [
    // Vehicle órfão com plate real do Wellington — não deve ser inferido
    { id: "v-orphan", customer_id: "outro-uuid-qualquer", plate: "SWR0J66", brand: null, model: "ZR-V", is_primary: true },
  ];

  const result = buildDiagnosticCandidates(growth, dbCustomers, vehicles);
  assert.equal(result[0].vehicles.length, 0);
});

test("legacy_id igual ao próprio UUID não gera colisão nem dupla entrada", () => {
  // Edge case defensivo: se por engano legacy_id=id, o mapa não pode gerar
  // duas rotas de canonical divergentes.
  const growth = [growthCustomer({ id: UUID_JOSE })];
  const dbCustomers = [{ id: UUID_JOSE, legacy_id: UUID_JOSE }];
  const vehicles = [
    { id: "v1", customer_id: UUID_JOSE, plate: "PLT1234", brand: null, model: null, is_primary: false },
  ];

  const result = buildDiagnosticCandidates(growth, dbCustomers, vehicles);
  assert.equal(result[0].vehicles.length, 1);
});

test("cliente growth sem correspondência no db devolve zero veículos (sem fallback silencioso)", () => {
  const growth = [growthCustomer({ id: "id-fantasma" })];
  const dbCustomers = [{ id: UUID_JOSE, legacy_id: null }];
  const vehicles = [
    { id: "v1", customer_id: UUID_JOSE, plate: "AAA0000", brand: null, model: null, is_primary: true },
  ];

  const result = buildDiagnosticCandidates(growth, dbCustomers, vehicles);
  assert.equal(result[0].vehicles.length, 0);
});
