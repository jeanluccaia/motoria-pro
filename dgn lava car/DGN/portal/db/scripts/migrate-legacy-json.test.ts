import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  APPROVED_SELECTIVE_IDS,
  SELECTIVE_APPLY_CONFIRMATION,
  assertRemoteIdentity,
  applySelected,
  runDryRun,
  validateApplyGate,
  type ApplyRepository,
  type LegacyCustomer,
} from "./migrate-legacy-json.ts";
import type { CampaignMemberWrite, CustomerRow, CustomerWrite, WriteResult } from "../../lib/growth/db/repositories.ts";
import { normalizePhone } from "../../lib/growth/db/normalizers.ts";

const validArgs = ["--apply", "--select", "selection.json", "--confirm", SELECTIVE_APPLY_CONFIRMATION, "--target", "remote"];

test("gate rejeita apply sem --select", () => {
  assert.throws(() => validateApplyGate(["--apply", "--confirm", SELECTIVE_APPLY_CONFIRMATION, "--target", "remote"], APPROVED_SELECTIVE_IDS), /--select/);
});

test("gate rejeita confirmação inválida", () => {
  assert.throws(() => validateApplyGate(["--apply", "--select", "x", "--confirm", "ERRADO", "--target", "remote"], APPROVED_SELECTIVE_IDS), /confirmação inválida/);
});

test("gate rejeita IDs fora do allowlist", () => {
  assert.throws(() => validateApplyGate(validArgs, new Set([...APPROVED_SELECTIVE_IDS, "outro"])), /exatamente os quatro/);
});

test("identidade remota rejeita URL inválida antes de conectar", async () => {
  await assert.rejects(() => assertRemoteIdentity(process.cwd(), "not-a-url"), /URL inválida/);
});

class MemoryRepository implements ApplyRepository {
  customers = new Map<string, CustomerRow>();
  phones = new Map<string, CustomerRow[]>();
  vehicles = new Map<string, Record<string, unknown>>();
  subscriptions = new Map<string, Record<string, unknown>>();
  campaigns = new Map<string, Record<string, unknown>>();
  audits = 0;
  interactions = 0;
  ambiguousPhone: string | null = null;

  async findCustomerByExternalId(id: string) { return this.customers.get(id) ?? null; }
  async findCustomersByNormalizedPhone(phone: string) {
    if (phone === this.ambiguousPhone) return [{ id: crypto.randomUUID(), legacy_id: "other", name: "Other", normalized_name: "other", normalized_phone: phone } as CustomerRow];
    return this.phones.get(phone) ?? [];
  }
  async createCustomer(input: CustomerWrite) {
    const row = { ...input, id: crypto.randomUUID() } as CustomerRow;
    this.customers.set(input.legacy_id, row);
    if (input.normalized_phone) this.phones.set(input.normalized_phone, [row]);
    return row;
  }
  async updateCustomer(id: string, input: CustomerWrite) {
    const row = { ...input, id } as CustomerRow;
    this.customers.set(input.legacy_id, row);
    return row;
  }
  private upsert(store: Map<string, Record<string, unknown>>, key: string, input: Record<string, unknown>): WriteResult {
    const current = store.get(key);
    if (!current) { const row = { ...input, id: crypto.randomUUID() }; store.set(key, row); return { row, action: "created" }; }
    const same = Object.entries(input).every(([k, v]) => JSON.stringify(current[k] ?? null) === JSON.stringify(v ?? null));
    if (same) return { row: current, action: "noop" };
    const row = { ...current, ...input }; store.set(key, row); return { row, action: "updated" };
  }
  async upsertVehicle(input: Record<string, unknown>) { return this.upsert(this.vehicles, `${input.customer_id}:${input.normalized_plate}`, input); }
  async upsertSubscription(input: Record<string, unknown>) { return this.upsert(this.subscriptions, String(input.customer_id), input); }
  async upsertCampaignMember(input: CampaignMemberWrite) { return this.upsert(this.campaigns, `${input.campaign_id}:${input.customer_id}`, input); }
  async createAuditLog() { this.audits += 1; }
  async createInteraction() { this.interactions += 1; }
}

async function selectedRows(): Promise<LegacyCustomer[]> {
  const rows = JSON.parse(await readFile(new URL("../../lib/growth/dgn-customers.json", import.meta.url), "utf8")) as LegacyCustomer[];
  return rows.filter((row) => APPROVED_SELECTIVE_IDS.has(row.id));
}

test("dry-run preserva Founders 001/002/003 e reabre Iara", async () => {
  const report = runDryRun(await selectedRows());
  assert.equal(report.totalInput, 4);
  assert.deepEqual(report.founderPreservation.map((f) => f.founder_number).sort(), ["001", "002", "003"]);
  assert.deepEqual(report.founderReopened.map((f) => f.legacy_id), ["iara"]);
  assert.equal(report.duplicateCandidates.length, 0);
});

test("apply é idempotente e nunca confirma Iara", async () => {
  const repository = new MemoryRepository();
  const rows = await selectedRows();
  const first = await applySelected(rows, repository);
  const second = await applySelected(rows, repository);
  assert.equal(first.created, 4);
  assert.equal(first.failures.length, 0);
  assert.equal(second.ignored, 4);
  assert.equal(second.audits, 0);
  const campaigns = [...repository.campaigns.values()];
  assert.deepEqual(campaigns.filter((c) => c.founder_status === "confirmado").map((c) => c.founder_number).sort(), ["001", "002", "003"]);
  const iara = repository.customers.get("iara");
  const iaraCampaign = campaigns.find((c) => c.customer_id === iara?.id);
  assert.equal(iaraCampaign?.founder_status, "selecionado");
  assert.equal(iaraCampaign?.founder_number, null);
});

test("apply bloqueia conciliação ambígua por telefone", async () => {
  const rows = await selectedRows();
  const repository = new MemoryRepository();
  repository.ambiguousPhone = normalizePhone(rows[0].phone).digits;
  const report = await applySelected([rows[0]], repository);
  assert.equal(report.conflicts, 1);
  assert.equal(report.failures.length, 1);
  assert.equal(repository.customers.size, 0);
});

test("cliente administrativo mantém marcador server-only", async () => {
  const source = await readFile(new URL("../../lib/growth/db/admin-client.ts", import.meta.url), "utf8");
  assert.match(source, /^import "server-only";/m);
  assert.doesNotMatch(source, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
});
