import { test } from "node:test";
import assert from "node:assert/strict";

import { formatDatePtBr, formatDateTimePtBr } from "./date-format.ts";

test("formatDatePtBr: yyyy-mm-dd → dd/mm/yyyy", () => {
  assert.equal(formatDatePtBr("2026-08-31"), "31/08/2026");
  assert.equal(formatDatePtBr("2024-01-01"), "01/01/2024");
});

test("formatDatePtBr: ISO com hora perde a hora", () => {
  assert.equal(formatDatePtBr("2026-08-31T09:42:00Z"), "31/08/2026");
});

test("formatDateTimePtBr: ISO com hora → dd/mm/yyyy às HH:MM", () => {
  const out = formatDateTimePtBr("2026-08-31T09:42:00Z");
  assert.match(out, /^31\/08\/2026 às \d{2}:\d{2}$/);
});

test("formatDatePtBr: fallback quando entrada é inválida ou vazia", () => {
  assert.equal(formatDatePtBr(""), "—");
  assert.equal(formatDatePtBr(null), "—");
  assert.equal(formatDatePtBr("A definir"), "—");
  assert.equal(formatDatePtBr("nope"), "—");
});

test("formatDatePtBr: fallback custom", () => {
  assert.equal(formatDatePtBr("", "Sem data"), "Sem data");
});
