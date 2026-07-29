import assert from "node:assert/strict";
import test from "node:test";
import { createFounderPlanSnapshot, founderOfferCatalog, getFounderOffer } from "./founder-offer-catalog.ts";

test("catálogo Founder expõe somente ofertas oficiais completas", () => {
  assert.deepEqual(founderOfferCatalog.map((offer) => offer.code), ["smart-founder-semestral", "priority-founder-semestral"]);
  for (const offer of founderOfferCatalog) assert.ok(offer.name && offer.version && offer.frequency && offer.displayedValue && offer.billingCondition && offer.benefits.length);
  assert.equal(getFounderOffer("Corporate Care"), null);
});

test("snapshot é uma cópia isolada da oferta aprovada", () => {
  const snapshot = createFounderPlanSnapshot("smart-founder-semestral");
  assert.ok(snapshot);
  assert.notEqual(snapshot, founderOfferCatalog[0]);
  assert.deepEqual(snapshot, founderOfferCatalog[0]);
});
