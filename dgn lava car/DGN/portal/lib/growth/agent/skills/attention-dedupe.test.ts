import test from "node:test";
import assert from "node:assert/strict";
import type { AttentionCard } from "../types.ts";
import { countUniqueCases, dedupeAttentionCards } from "./attention-dedupe.ts";

function mk(
  id: string,
  kind: AttentionCard["kind"],
  priority: AttentionCard["priority"],
  customerId?: string,
  title = "Cliente Fixture",
): AttentionCard {
  return {
    id,
    kind,
    priority,
    title,
    reason: "fixture",
    nextAction: "fixture",
    href: "/x",
    ctaLabel: "Ver",
    customerId,
  };
}

test("1 — mesmo customer com 2 sinais (founder + curation) vira 1 card com secondaryKinds", () => {
  const cards = [
    mk("founder:c1", "founder", "alta", "c1", "Roberta"),
    mk("curation:c1", "curation", "alta", "c1", "Roberta"),
  ];
  const out = dedupeAttentionCards(cards);
  assert.equal(out.length, 1);
  assert.equal(out[0]?.customerId, "c1");
  assert.equal(out[0]?.kind, "founder"); // primeiro na ordem estável
  assert.deepEqual(out[0]?.secondaryKinds, ["curation"]);
});

test("2 — mesmo customer com 3 sinais (founder + curation + subscriber) vira 1 card com 2 secondaryKinds", () => {
  const cards = [
    mk("founder:c1", "founder", "alta", "c1"),
    mk("curation:c1", "curation", "media", "c1"),
    mk("subscriber-review:c1", "subscriber", "media", "c1"),
  ];
  const out = dedupeAttentionCards(cards);
  assert.equal(out.length, 1);
  assert.equal(out[0]?.kind, "founder"); // alta > media
  assert.deepEqual(out[0]?.secondaryKinds?.slice().sort(), ["curation", "subscriber"]);
});

test("3 — 2 customers diferentes com MESMO NOME → 2 cards separados (dedupe por customer_id, não título)", () => {
  const cards = [
    mk("curation:c1", "curation", "alta", "c1", "Roberta"),
    mk("curation:c2", "curation", "alta", "c2", "Roberta"),
  ];
  const out = dedupeAttentionCards(cards);
  assert.equal(out.length, 2);
  const ids = out.map((c) => c.customerId).sort();
  assert.deepEqual(ids, ["c1", "c2"]);
});

test("4 — countUniqueCases = customer_ids distintos + passthrough sem customerId", () => {
  const cards = [
    mk("founder:c1", "founder", "alta", "c1"),
    mk("curation:c1", "curation", "media", "c1"),
    mk("curation:c2", "curation", "alta", "c2"),
    mk("subscriber-renewal:nome", "subscriber", "alta", undefined, "Renovacao sem match"),
  ];
  // 2 unique customer_ids (c1, c2) + 1 passthrough = 3 casos
  assert.equal(countUniqueCases(cards), 3);
});

test("5 — Roberta real-like: founder alta + curation alta → 1 card founder com secondary curation, prioridade preservada", () => {
  const cards = [
    mk("curation:roberta", "curation", "alta", "roberta", "Roberta Utida"),
    mk("founder:roberta", "founder", "alta", "roberta", "Roberta Utida"),
  ];
  const out = dedupeAttentionCards(cards);
  assert.equal(out.length, 1);
  assert.equal(out[0]?.priority, "alta");
  assert.equal(out[0]?.title, "Roberta Utida");
  assert.equal(out[0]?.customerId, "roberta");
  // secondaryKinds inclui o kind que não venceu (curation ou founder, dependendo do sort estável)
  assert.ok(out[0]?.secondaryKinds && out[0].secondaryKinds.length === 1);
  assert.ok(
    (out[0].kind === "founder" && out[0].secondaryKinds?.[0] === "curation")
      || (out[0].kind === "curation" && out[0].secondaryKinds?.[0] === "founder"),
    "kinds foram alternados corretamente",
  );
});

test("6 — cards sem customerId (subscriber-renewal fallback) nunca deduzem — 3 renewals → 3 cards", () => {
  const cards = [
    mk("subscriber-renewal:X", "subscriber", "alta", undefined, "X"),
    mk("subscriber-renewal:Y", "subscriber", "alta", undefined, "Y"),
    mk("subscriber-renewal:Y", "subscriber", "media", undefined, "Y"),
  ];
  const out = dedupeAttentionCards(cards);
  assert.equal(out.length, 3);
});

test("7 — nenhum customer_id aparece 2× no output final (invariante da spec)", () => {
  const cards = [
    mk("founder:c1", "founder", "alta", "c1"),
    mk("curation:c1", "curation", "media", "c1"),
    mk("subscriber-review:c1", "subscriber", "oportunidade", "c1"),
    mk("curation:c2", "curation", "alta", "c2"),
    mk("founder:c2", "founder", "media", "c2"),
    mk("curation:c3", "curation", "media", "c3"),
    mk("subscriber-renewal:n", "subscriber", "alta", undefined, "Nome"),
  ];
  const out = dedupeAttentionCards(cards);
  const withId = out.filter((c) => c.customerId).map((c) => c.customerId!);
  assert.equal(new Set(withId).size, withId.length, "customer_ids devem ser únicos no output");
  // 3 únicos (c1, c2, c3) + 1 sem id = 4 cards
  assert.equal(out.length, 4);
});

test("prioridade preservada: alta vence média (customer com sinais em ambos)", () => {
  const cards = [
    mk("curation:c1", "curation", "media", "c1"),
    mk("founder:c1", "founder", "alta", "c1"),
  ];
  const out = dedupeAttentionCards(cards);
  assert.equal(out.length, 1);
  assert.equal(out[0]?.priority, "alta");
  assert.equal(out[0]?.kind, "founder");
  assert.deepEqual(out[0]?.secondaryKinds, ["curation"]);
});

test("mesmo kind duplicado não vira secondaryKinds (evita ruído)", () => {
  const cards = [
    mk("curation:c1", "curation", "alta", "c1"),
    mk("curation:c1-alt", "curation", "media", "c1"),
  ];
  const out = dedupeAttentionCards(cards);
  assert.equal(out.length, 1);
  assert.equal(out[0]?.kind, "curation");
  // secondaryKinds NÃO deve incluir "curation" (mesmo kind do vencedor)
  assert.equal(out[0]?.secondaryKinds, undefined);
});

test("secondaryKinds nunca tem duplicatas mesmo se skill emitir 2 sinais do mesmo kind não-vencedor", () => {
  const cards = [
    mk("founder:c1", "founder", "alta", "c1"),
    mk("curation:c1", "curation", "media", "c1"),
    mk("curation:c1-alt", "curation", "oportunidade", "c1"),
  ];
  const out = dedupeAttentionCards(cards);
  assert.equal(out.length, 1);
  assert.deepEqual(out[0]?.secondaryKinds, ["curation"]);
});
