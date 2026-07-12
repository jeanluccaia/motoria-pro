import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeName, normalizePhone, normalizePlate } from "./normalizers.ts"; // node:test needs the .ts extension
import { reconcile, type ReconciliationSubject } from "./reconciliation.ts"; // node:test needs the .ts extension

function subject(name: string, phone: string, plates: string[]): ReconciliationSubject {
  return {
    name: normalizeName(name),
    phone: phone ? normalizePhone(phone) : null,
    plates: plates.map((p) => normalizePlate(p)),
  };
}

test("regra 1 — telefone idêntico com nome igual = alta_confianca", () => {
  const a = subject("Rikardo Oliveira", "19999037494", ["QXP9H50"]);
  const b = subject("Rikardo Oliveira", "5519999037494", ["QXP9H50"]);
  const r = reconcile(a, b);
  assert.equal(r.matchType, "telefone_exato");
  assert.equal(r.reviewStatus, "alta_confianca");
  assert.ok(r.confidence >= 0.95);
});

test("regra 2 — placa idêntica com nomes divergentes = precisa_revisar", () => {
  const a = subject("Fulano Silva", "", ["QXP9H50"]);
  const b = subject("Beltrano Souza", "", ["QXP9H50"]);
  const r = reconcile(a, b);
  assert.equal(r.matchType, "placa_exata");
  assert.equal(r.reviewStatus, "precisa_revisar");
});

test("regra 2 — placa idêntica com nomes iguais = alta_confianca", () => {
  const a = subject("Iara Menezes", "", ["FUR8369"]);
  const b = subject("Iara Menezes", "", ["FUR-8369"]);
  const r = reconcile(a, b);
  assert.equal(r.matchType, "placa_exata");
  assert.equal(r.reviewStatus, "alta_confianca");
});

test("regra 5 — apenas nome = bloqueado", () => {
  const a = subject("José Moreira", "", []);
  const b = subject("Jose Moreira", "11987654321", ["ABC1234"]);
  const r = reconcile(a, b);
  assert.equal(r.matchType, "apenas_nome");
  assert.equal(r.reviewStatus, "bloqueado");
});

test("regra 6 — nome incompleto sem evidência complementar = bloqueado", () => {
  const a = subject("Paulo", "", []);
  const b = subject("Paulo", "", []);
  const r = reconcile(a, b);
  assert.equal(r.matchType, "nome_incompleto");
  assert.equal(r.reviewStatus, "bloqueado");
});

test("regra 6 — nome incompleto com placa coincidente = precisa_revisar", () => {
  const a = subject("Paulo", "", ["FMP4C02"]);
  const b = subject("Paulo Santos", "", ["FMP4C02"]);
  const r = reconcile(a, b);
  assert.equal(r.matchType, "nome_incompleto");
  assert.equal(r.reviewStatus, "precisa_revisar");
  assert.ok(r.confidence >= 0.7);
});

test("regra 7 — acentos não geram duplicidade", () => {
  const a = subject("José Moreira", "19998115400", []);
  const b = subject("Jose Moreira", "19998115400", []);
  const r = reconcile(a, b);
  assert.equal(r.matchType, "telefone_exato");
  assert.equal(r.reviewStatus, "alta_confianca");
});

test("regra 8 — prefixo artificial reduz confiança em match só-de-nome", () => {
  const a = subject("1 Paulo Silva", "", []);
  const b = subject("Paulo Silva", "", []);
  const r = reconcile(a, b);
  assert.equal(r.matchType, "apenas_nome");
  assert.ok(r.confidence <= 0.4);
});

test("sem correspondência retorna sem_correspondencia", () => {
  const a = subject("Fulano Silva", "1132345678", ["ABC1234"]);
  const b = subject("Beltrano Souza", "1198765432", ["XYZ9K88"]);
  const r = reconcile(a, b);
  assert.equal(r.matchType, "sem_correspondencia");
  assert.equal(r.confidence, 0);
});

test("telefone inválido não gera match por regra 1", () => {
  const a = subject("Fulano", "0000000", []);
  const b = subject("Fulano Silva", "0000000", []);
  const r = reconcile(a, b);
  // ambos com nomes que compartilham "fulano" mas b tem 2 tokens; a é incompleto
  assert.notEqual(r.matchType, "telefone_exato");
});

test("nome + telefone parcial = precisa_revisar (média confiança)", () => {
  // DDDs diferentes mas últimos 8 dígitos iguais
  const a = subject("Ana Silveira", "1932345678", []);
  const b = subject("Ana Silveira", "1132345678", []);
  const r = reconcile(a, b);
  assert.equal(r.matchType, "nome_telefone_parcial");
  assert.equal(r.reviewStatus, "precisa_revisar");
});
