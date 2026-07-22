import assert from "node:assert/strict";
import test from "node:test";
import { prepareScores, scoreRow } from "./score-customers-2025.ts";

const customer = {
  id: "customer-1", legacy_id: "legacy-1", name: "Cliente Teste", normalized_name: "cliente teste",
  primary_phone: "(19) 99999-9999", normalized_phone: "19999999999", origin: "4uCar",
  company_or_link: "", first_service_at: "2025-01-01", last_service_at: "2026-07-01",
  service_count: 10, historical_value: 1000, average_ticket: 100, average_interval_days: 30,
};
const vehicle = { id: "vehicle-1", customer_id: "customer-1", model: "Civic" };

function mockDb(snapshotRows: Record<string, unknown>[] = []) {
  const tables: Record<string, Record<string, unknown>[]> = {
    crm_customers: [customer], crm_vehicles: [vehicle], crm_subscriptions: [],
    crm_campaign_members: [], crm_score_snapshots: snapshotRows, crm_duplicate_candidates: [],
  };
  return {
    from: (table: string) => ({
      select: () => ({
        range: async (from: number, to: number) => ({ data: tables[table].slice(from, to + 1), error: null }),
      }),
    }),
  } as never;
}

test("score prepara composição determinística sem inventar plano", async () => {
  const [prepared] = await prepareScores(mockDb());
  assert.equal(prepared.score.scoreVersion, "DGN_SCORE_V1");
  assert.equal(prepared.score.components.planFit, 0);
  assert.equal(prepared.identical, false);
  assert.equal(scoreRow(prepared).customer_id, customer.id);
});

test("snapshot idêntico é reconhecido como no-op", async () => {
  const [first] = await prepareScores(mockDb());
  const snapshot = { id: "snapshot-1", ...scoreRow(first), calculated_at: new Date().toISOString() };
  const [second] = await prepareScores(mockDb([snapshot]));
  assert.equal(second.identical, true);
});
