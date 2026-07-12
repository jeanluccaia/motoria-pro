import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeName, normalizePhone, normalizePlate } from "./normalizers.ts"; // node:test needs the .ts extension

// ---------------------------------------------------------------------------
// Telefone
// ---------------------------------------------------------------------------

test("normalizePhone aceita celular com máscara", () => {
  const p = normalizePhone("(19) 99903-7494");
  assert.equal(p.classification, "valido");
  assert.equal(p.digits, "5519999037494");
  assert.equal(p.local, "19999037494");
  assert.equal(p.ddd, "19");
});

test("normalizePhone aceita celular sem máscara", () => {
  const p = normalizePhone("19999037494");
  assert.equal(p.classification, "valido");
  assert.equal(p.digits, "5519999037494");
});

test("normalizePhone aceita fixo de 10 dígitos", () => {
  const p = normalizePhone("1932345678");
  assert.equal(p.classification, "valido");
  assert.equal(p.digits, "551932345678");
  assert.equal(p.local, "1932345678");
});

test("normalizePhone não duplica prefixo 55", () => {
  const p = normalizePhone("5519999037494");
  assert.equal(p.classification, "valido");
  assert.equal(p.digits, "5519999037494");
  assert.equal(p.local, "19999037494");
});

test("normalizePhone remove +55 no início", () => {
  const p = normalizePhone("+55 (19) 99903-7494");
  assert.equal(p.classification, "valido");
  assert.equal(p.digits, "5519999037494");
});

test("normalizePhone marca DDD inválido", () => {
  const p = normalizePhone("2099037494"); // DDD 20 não existe
  assert.equal(p.classification, "invalido");
  assert.match(p.reason ?? "", /DDD/);
});

test("normalizePhone marca celular sem 9 após DDD como inválido", () => {
  const p = normalizePhone("19199037494"); // 11 dígitos, celular sem 9
  assert.equal(p.classification, "invalido");
  assert.match(p.reason ?? "", /9 após DDD/);
});

test("normalizePhone marca telefone vazio", () => {
  assert.equal(normalizePhone("").classification, "vazio");
  assert.equal(normalizePhone(null).classification, "vazio");
  assert.equal(normalizePhone(undefined).classification, "vazio");
});

test("normalizePhone preserva o original", () => {
  const raw = "(19) 9 9903-7494";
  assert.equal(normalizePhone(raw).original, raw);
});

// ---------------------------------------------------------------------------
// Placa
// ---------------------------------------------------------------------------

test("normalizePlate aceita padrão antigo com hífen", () => {
  const p = normalizePlate("FUR-8369");
  assert.equal(p.classification, "valida_antiga");
  assert.equal(p.compact, "FUR8369");
  assert.equal(p.masked, "FUR***9");
});

test("normalizePlate aceita padrão Mercosul", () => {
  const p = normalizePlate("qxp9h50");
  assert.equal(p.classification, "valida_mercosul");
  assert.equal(p.compact, "QXP9H50");
  assert.equal(p.masked, "QXP***0");
});

test("normalizePlate marca placa inválida", () => {
  const p = normalizePlate("XY123");
  assert.equal(p.classification, "invalida");
});

test("normalizePlate marca vazia", () => {
  assert.equal(normalizePlate("").classification, "vazia");
  assert.equal(normalizePlate(null).classification, "vazia");
});

// ---------------------------------------------------------------------------
// Nome
// ---------------------------------------------------------------------------

test("normalizeName reduz espaços duplos", () => {
  const n = normalizeName("  José    Moreira  ");
  assert.equal(n.display, "José Moreira");
  assert.equal(n.normalized, "jose moreira");
});

test("normalizeName é accent-insensitive", () => {
  assert.equal(normalizeName("José").normalized, normalizeName("Jose").normalized);
  assert.equal(normalizeName("Iára").normalized, normalizeName("Iara").normalized);
});

test("normalizeName marca nome incompleto (1 token)", () => {
  assert.equal(normalizeName("Paulo").isIncomplete, true);
  assert.equal(normalizeName("Rikardo Oliveira").isIncomplete, false);
});

test("normalizeName detecta prefixo artificial numérico", () => {
  const n = normalizeName("1 Paulo");
  assert.equal(n.hasArtificialPrefix, true);
  assert.equal(n.prefixRemoved, "1");
  assert.equal(n.normalized, "paulo");
});

test("normalizeName detecta prefixo Q/D/PC/RDA", () => {
  assert.equal(normalizeName("Q Silva").prefixRemoved, "Q");
  assert.equal(normalizeName("PC Ferraz").prefixRemoved, "PC");
  assert.equal(normalizeName("RDA João da Silva").prefixRemoved, "RDA");
});

test("normalizeName preserva original para exibição", () => {
  const n = normalizeName("José Moreira");
  assert.equal(n.original, "José Moreira");
  assert.equal(n.display, "José Moreira");
});
