import test from "node:test";
import assert from "node:assert/strict";
import { validatePatchPayload } from "./diagnostics-validate.ts";

test("payload não-objeto → issue no root", () => {
  const r = validatePatchPayload("nope");
  assert.equal(r.ok, false);
});

test("scores ausente → não emite valor", () => {
  const r = validatePatchPayload({});
  assert.equal(r.ok, true);
  if (r.ok) assert.equal("scores" in r.value, false);
});

test("scores=null → preservado (chave presente como null)", () => {
  const r = validatePatchPayload({ scores: null });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value.scores, null);
});

test("scores válidos", () => {
  const r = validatePatchPayload({
    scores: [
      { criterion_key: "conservacao_pintura", score: 8 },
      { criterion_key: "ausencia_riscos", score: null },
      { criterion_key: "brilho_profundidade", score: 6.5 },
    ],
  });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal((r.value.scores as unknown[]).length, 3);
});

test("score fora de [0,10] → issue", () => {
  const r = validatePatchPayload({ scores: [{ criterion_key: "conservacao_pintura", score: 11 }] });
  assert.equal(r.ok, false);
});

test("score em passo != 0.5 → issue", () => {
  const r = validatePatchPayload({ scores: [{ criterion_key: "conservacao_pintura", score: 7.3 }] });
  assert.equal(r.ok, false);
});

test("criterion_key fora do enum → issue", () => {
  const r = validatePatchPayload({ scores: [{ criterion_key: "nao_existe", score: 5 }] });
  assert.equal(r.ok, false);
});

test("condition inválida → issue", () => {
  const r = validatePatchPayload({
    inspection_areas: [{ area_key: "pintura", condition: "otimo", public_visible: true }],
  });
  assert.equal(r.ok, false);
});

test("inspection_area válida preserva internal_notes e public_notes", () => {
  const r = validatePatchPayload({
    inspection_areas: [{
      area_key: "pintura",
      condition: "attention",
      public_visible: true,
      internal_notes: "interna",
      public_notes: "publica",
    }],
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    const area = (r.value.inspection_areas as Array<Record<string, unknown>>)[0];
    assert.equal(area.internal_notes, "interna");
    assert.equal(area.public_notes, "publica");
    assert.equal(area.public_visible, true);
  }
});

test("investment_item sem divergência de preço → override_reason opcional", () => {
  const r = validatePatchPayload({
    investment_items: [{
      service_key: "polimento_tecnico",
      catalog_version: "diag-v1-2026-09",
      catalog_reference_price_cents: 45000,
      base_price_cents: 45000,
      discount_percent: 0,
    }],
  });
  assert.equal(r.ok, true);
});

test("investment_item com base != catalog E sem override_reason → OVERRIDE_REASON_REQUIRED", () => {
  const r = validatePatchPayload({
    investment_items: [{
      service_key: "polimento_tecnico",
      catalog_version: "diag-v1-2026-09",
      catalog_reference_price_cents: 45000,
      base_price_cents: 40000,           // diverge
      discount_percent: 0,
      // sem override_reason
    }],
  });
  assert.equal(r.ok, false);
  if (!r.ok) {
    const issue = r.issues.find((x) => x.code === "OVERRIDE_REASON_REQUIRED");
    assert.ok(issue, "OVERRIDE_REASON_REQUIRED deve estar nas issues");
  }
});

test("investment_item com base != catalog E override_reason preenchido → OK", () => {
  const r = validatePatchPayload({
    investment_items: [{
      service_key: "polimento_tecnico",
      catalog_version: "diag-v1-2026-09",
      catalog_reference_price_cents: 45000,
      base_price_cents: 40000,
      discount_percent: 0,
      override_reason: "cortesia frota — aprovado Digo",
    }],
  });
  assert.equal(r.ok, true);
});

test("final_price_cents no client é IGNORADO (não persistido)", () => {
  const r = validatePatchPayload({
    investment_items: [{
      service_key: "polimento_tecnico",
      catalog_version: "diag-v1-2026-09",
      catalog_reference_price_cents: 45000,
      base_price_cents: 45000,
      discount_percent: 50,
      final_price_cents: 1,   // tentativa de trapaça
    }],
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    const it = (r.value.investment_items as Array<Record<string, unknown>>)[0];
    assert.equal("final_price_cents" in it, false);
  }
});

test("status válido (draft) aceito; published rejeitado nesta entrega", () => {
  const ok = validatePatchPayload({ status: "draft" });
  assert.equal(ok.ok, true);
  const bad = validatePatchPayload({ status: "published" });
  assert.equal(bad.ok, false);
});

test("discount fora [0,100] → issue", () => {
  const r = validatePatchPayload({
    investment_items: [{
      service_key: "polimento_tecnico",
      catalog_version: "diag-v1-2026-09",
      catalog_reference_price_cents: 100,
      base_price_cents: 100,
      discount_percent: 150,
    }],
  });
  assert.equal(r.ok, false);
});
