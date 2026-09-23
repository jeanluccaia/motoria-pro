import test from "node:test";
import assert from "node:assert/strict";
import { isDiagnosticHomologFixtureVisible } from "./fixture-guard.ts";

test("fixture invisível quando env não existe (default de Production)", () => {
  assert.equal(isDiagnosticHomologFixtureVisible({}), false);
});

test("fixture invisível quando env='0'", () => {
  assert.equal(
    isDiagnosticHomologFixtureVisible({ NEXT_PUBLIC_DIAG_HOMOLOG_FIXTURE_VISIBLE: "0" }),
    false,
  );
});

test("fixture invisível quando env='false'", () => {
  assert.equal(
    isDiagnosticHomologFixtureVisible({ NEXT_PUBLIC_DIAG_HOMOLOG_FIXTURE_VISIBLE: "false" }),
    false,
  );
});

test("fixture invisível quando env é string vazia", () => {
  assert.equal(
    isDiagnosticHomologFixtureVisible({ NEXT_PUBLIC_DIAG_HOMOLOG_FIXTURE_VISIBLE: "" }),
    false,
  );
});

test("fixture visível somente com '1'", () => {
  assert.equal(
    isDiagnosticHomologFixtureVisible({ NEXT_PUBLIC_DIAG_HOMOLOG_FIXTURE_VISIBLE: "1" }),
    true,
  );
});

test("fixture visível com 'true' (case-insensitive)", () => {
  assert.equal(
    isDiagnosticHomologFixtureVisible({ NEXT_PUBLIC_DIAG_HOMOLOG_FIXTURE_VISIBLE: "TRUE" }),
    true,
  );
});

test("fixture visível com 'yes'", () => {
  assert.equal(
    isDiagnosticHomologFixtureVisible({ NEXT_PUBLIC_DIAG_HOMOLOG_FIXTURE_VISIBLE: "yes" }),
    true,
  );
});

test("fixture invisível com valores estranhos ('on', 'enabled', 'sim')", () => {
  // Comportamento defensivo — só valores conhecidos ativam. Nada de
  // "acionar por engano" se alguém setar um valor não previsto.
  assert.equal(
    isDiagnosticHomologFixtureVisible({ NEXT_PUBLIC_DIAG_HOMOLOG_FIXTURE_VISIBLE: "on" }),
    false,
  );
  assert.equal(
    isDiagnosticHomologFixtureVisible({ NEXT_PUBLIC_DIAG_HOMOLOG_FIXTURE_VISIBLE: "enabled" }),
    false,
  );
  assert.equal(
    isDiagnosticHomologFixtureVisible({ NEXT_PUBLIC_DIAG_HOMOLOG_FIXTURE_VISIBLE: "sim" }),
    false,
  );
});
