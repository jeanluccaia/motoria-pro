import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allDgnCustomers,
  dgnCustomers,
  DGN_OPERATIONAL_CUTOFF,
  getCustomerById,
  hasOperationalLastAttendance,
  isConfirmedFounder,
  isOperationalDgnCustomer,
  maskPhone,
  matchesDgnCustomerSearch,
  searchDgnCustomers,
  type DgnCustomer,
} from "./dgn-growth-data.ts";

function byId(id: string) {
  const customer = allDgnCustomers.find((row) => row.id === id);
  assert.ok(customer, `Cliente esperado ausente: ${id}`);
  return customer;
}

test("base historica permanece completa com 2354 registros", () => {
  assert.equal(allDgnCustomers.length, 2354);
});

test("base operacional usa clientes com atendimento desde 2025", () => {
  assert.equal(DGN_OPERATIONAL_CUTOFF, "2025-01-01");
  assert.equal(dgnCustomers.length, 1152);
});

test("1202 registros anteriores a 2025 ficam fora da operacao", () => {
  const excluded = allDgnCustomers.filter((customer) => !dgnCustomers.includes(customer));
  assert.equal(excluded.length, 1202);
  assert.equal(
    excluded.every((customer) => !hasOperationalLastAttendance(customer)),
    true
  );
});

test("data limite 2025-01-01 entra e 2024-12-31 fica fora", () => {
  assert.equal(hasOperationalLastAttendance({ lastAttendance: "2025-01-01" }), true);
  assert.equal(hasOperationalLastAttendance({ lastAttendance: "2024-12-31" }), false);
});

test("datas ausentes, invalidas ou inesperadas nao entram silenciosamente", () => {
  assert.equal(hasOperationalLastAttendance({ lastAttendance: "" }), false);
  assert.equal(hasOperationalLastAttendance({ lastAttendance: "2025/01/01" }), false);
  assert.equal(hasOperationalLastAttendance({ lastAttendance: "2025-02-30" }), false);

  const invalidCustomer: DgnCustomer = {
    ...dgnCustomers[0],
    id: "invalid-date",
    lastAttendance: "sem-data",
    commercialStatus: "Aguardando Curadoria DGN",
    curation: {
      ...dgnCustomers[0].curation,
      founderDecision: "",
      founderNumber: "",
    },
    campaign: {
      ...dgnCustomers[0].campaign,
      founderSelected: false,
      founderNumber: "",
      campaignStatus: "",
    },
  };

  assert.equal(isOperationalDgnCustomer(invalidCustomer), false);
});

test("Founders confirmados permanecem na base operacional", () => {
  for (const id of ["benedito-constantino", "jose-moreira", "rikardo-oliveira"]) {
    const customer = byId(id);
    assert.equal(isConfirmedFounder(customer), true);
    assert.ok(dgnCustomers.some((row) => row.id === id));
    assert.ok(getCustomerById(id));
  }
});

test("Iara permanece sem confirmacao automatica", () => {
  const iara = byId("iara");
  assert.equal(iara.campaign.founderSelected, true);
  assert.equal(iara.campaign.founderNumber, "004");
  assert.equal(isConfirmedFounder(iara), false);
  assert.notEqual(iara.commercialStatus, "Assinante Ativo");
});

test("busca padrao usa apenas a base operacional", () => {
  const historicalOnly = allDgnCustomers.find(
    (customer) =>
      !dgnCustomers.includes(customer) &&
      customer.phone &&
      !dgnCustomers.some((operational) => operational.phone === customer.phone)
  );

  assert.ok(historicalOnly, "Esperava encontrar cliente historico fora da operacao");
  assert.equal(searchDgnCustomers(historicalOnly.phone).length, 0);
});

test("busca aceita acentos e placa, e telefone exibido fica mascarado", () => {
  const customer = { ...dgnCustomers[0], name: "Jose Moreira", plate: "ABC1D23", phone: "(19) 99999-1234" };
  assert.equal(matchesDgnCustomerSearch(customer, "José Moreira"), true);
  assert.equal(matchesDgnCustomerSearch(customer, "abc1d23"), true);
  assert.equal(maskPhone(customer.phone), "(19) *****-1234");
});

test("Curadoria recebe a fonte operacional, nao os 2354 historicos", () => {
  assert.notEqual(dgnCustomers.length, allDgnCustomers.length);
  assert.equal(dgnCustomers.length, 1152);
});
