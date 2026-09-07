import test from "node:test";
import assert from "node:assert/strict";
import {
  getConfirmedFounderRecords,
  getConfirmedFoundersCount,
  getLegacyFounderCandidates,
  getNextAvailableFounderNumber,
  getReopenedFounderRecords,
} from "./founder-metrics-server.ts";

test("Founder confirmados são exatamente os 3 preservados (001/002/003)", () => {
  const records = getConfirmedFounderRecords();
  assert.equal(records.length, 3);
  const numbers = records.map((r) => r.preservedFounderNumber).sort();
  assert.deepEqual(numbers, ["001", "002", "003"]);
});

test("getConfirmedFoundersCount === 3", () => {
  assert.equal(getConfirmedFoundersCount(), 3);
});

test("getNextAvailableFounderNumber === 4", () => {
  assert.equal(getNextAvailableFounderNumber(), 4);
});

test("getLegacyFounderCandidates contém pelo menos a Iara (Nº004 reaberta)", () => {
  const legacy = getLegacyFounderCandidates();
  assert.ok(legacy.some((r) => r.name.includes("Iara")), "Iara deve estar em legacy candidates");
});

test("getReopenedFounderRecords = alias de getLegacyFounderCandidates", () => {
  assert.equal(getReopenedFounderRecords, getLegacyFounderCandidates);
});
