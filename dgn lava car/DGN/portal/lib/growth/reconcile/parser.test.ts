import test from "node:test";
import assert from "node:assert/strict";
import { parseReconcileInput } from "./parser.ts";

test("parser: CSV com vírgula e cabeçalho conhecido", () => {
  const text = `name,phone,plan,status,paid_until
Benedito Constantino,19981723362,Priority,ativo,31/12/2026
Ana Silveira,11992357937,Smart,renovacao_pendente,`;
  const r = parseReconcileInput(text);
  assert.equal(r.rows.length, 2);
  assert.equal(r.rows[0]!.name, "Benedito Constantino");
  assert.equal(r.rows[0]!.plan, "Priority");
  assert.equal(r.rows[0]!.paid_until, "31/12/2026");
  assert.equal(r.rows[1]!.status, "renovacao_pendente");
  assert.equal(r.rows[1]!.paid_until, undefined);
});

test("parser: TSV (colar de Excel)", () => {
  const text = "nome\ttelefone\tplano\nDébora\t19991704872\tSmart";
  const r = parseReconcileInput(text);
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0]!.name, "Débora");
  assert.equal(r.rows[0]!.plan, "Smart");
});

test("parser: aliases PT-BR de cabeçalho", () => {
  const text = "nome,situação,vigência\nX,pendente,10/10/2026";
  const r = parseReconcileInput(text);
  assert.equal(r.rows[0]!.status, "pendente");
  assert.equal(r.rows[0]!.paid_until, "10/10/2026");
});

test("parser: linhas totalmente vazias são ignoradas", () => {
  const text = "name,plan\n\n\nBenedito,Priority\n\n";
  const r = parseReconcileInput(text);
  assert.equal(r.rows.length, 1);
  // 2 vazias antes + 2 vazias depois de Benedito = 4
  assert.equal(r.emptyRowsIgnored, 4);
});

test("parser: cabeçalho desconhecido é reportado (sem crash)", () => {
  const text = "name,invalid_column,plan\nX,foo,Smart";
  const r = parseReconcileInput(text);
  assert.equal(r.rows[0]!.name, "X");
  assert.equal(r.rows[0]!.plan, "Smart");
  assert.deepEqual(r.unknownHeaders, ["invalid_column"]);
});

test("parser: texto vazio devolve zero linhas sem erro", () => {
  const r = parseReconcileInput("");
  assert.equal(r.rows.length, 0);
  assert.equal(r.headers.length, 0);
});

test("parser: aspas em campos CSV", () => {
  const text = `name,notes
"Rodmich, Equipamentos","obs, com vírgula"`;
  const r = parseReconcileInput(text);
  assert.equal(r.rows[0]!.name, "Rodmich, Equipamentos");
  assert.equal(r.rows[0]!.notes, "obs, com vírgula");
});
