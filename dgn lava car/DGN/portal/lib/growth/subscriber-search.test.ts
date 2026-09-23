import test from "node:test";
import assert from "node:assert/strict";
import {
  filterCustomersForSubscriberSearch,
  type SubscriberSearchCandidate,
} from "./subscriber-search.ts";

const base: SubscriberSearchCandidate[] = [
  {
    id: "c-jose",
    name: "José Sérgio Bressan Jr",
    phone: "(19) 99123-4567",
    vehicle: "Hyundai HB20",
    plate: "ABC-1D23",
    hasActiveSubscription: true,
    activePlan: "Smart",
  },
  {
    id: "c-ana",
    name: "Ana Paula Souza",
    phone: "(19) 98876-0011",
    vehicle: "Chevrolet Onix",
    plate: "XYZ-9K88",
    hasActiveSubscription: false,
    activePlan: null,
  },
  {
    id: "c-bruno",
    name: "Bruno Rossetti",
    phone: "(11) 91234-9999",
    vehicle: "Sem veículo",
    plate: "",
    hasActiveSubscription: false,
    activePlan: null,
  },
];

test("query < 2 chars devolve vazio", () => {
  assert.deepEqual(filterCustomersForSubscriberSearch(base, ""), []);
  assert.deepEqual(filterCustomersForSubscriberSearch(base, " "), []);
  assert.deepEqual(filterCustomersForSubscriberSearch(base, "A"), []);
});

test("match por nome ignora acento e caixa", () => {
  const hits = filterCustomersForSubscriberSearch(base, "jose sergio");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, "c-jose");
});

test("match parcial por nome (prefixo do primeiro nome)", () => {
  const hits = filterCustomersForSubscriberSearch(base, "bru");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, "c-bruno");
});

test("match por telefone só considera dígitos e exige ao menos 4", () => {
  // 3 dígitos → não deve casar
  assert.deepEqual(filterCustomersForSubscriberSearch(base, "123"), []);
  // Pedaço final único do celular do Bruno (só ele tem 912349999)
  const hits = filterCustomersForSubscriberSearch(base, "912349");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, "c-bruno");
});

test("match por placa normaliza e exige ao menos 3 chars", () => {
  const hits = filterCustomersForSubscriberSearch(base, "abc1d");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, "c-jose");
});

test("hasActiveSubscription é preservado para UI decidir badge", () => {
  const hits = filterCustomersForSubscriberSearch(base, "jose");
  assert.equal(hits[0].hasActiveSubscription, true);
  assert.equal(hits[0].activePlan, "Smart");
});

test("respeita limit", () => {
  const many: SubscriberSearchCandidate[] = Array.from({ length: 50 }, (_, i) => ({
    id: `c-${i}`,
    name: `João Silva ${i}`,
    phone: "",
    vehicle: "",
    plate: "",
    hasActiveSubscription: false,
    activePlan: null,
  }));
  const hits = filterCustomersForSubscriberSearch(many, "joao", 5);
  assert.equal(hits.length, 5);
});

test("nenhum critério bate → lista vazia (não retorna base inteira)", () => {
  const hits = filterCustomersForSubscriberSearch(base, "zzzzzz");
  assert.equal(hits.length, 0);
});
