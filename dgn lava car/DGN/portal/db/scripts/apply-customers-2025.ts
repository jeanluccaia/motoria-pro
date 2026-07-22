/** Apply idempotente do lote operacional 2025+. Não toca campanhas/assinaturas. */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { DGN_OPERATIONAL_CUTOFF, maskPlate, parseDgnDateAsUtcTimestamp } from "../../lib/growth/dgn-growth-data.ts";
import { normalizeName, normalizePhone, normalizePlate } from "../../lib/growth/db/normalizers.ts";
import type { LegacyCustomer } from "./migrate-legacy-json.ts";
import { IMPORT_ACTOR, IMPORT_SOURCE } from "./diagnose-customers-2025.ts";

const APPROVED_TOTAL = 1152;
const APPROVED_EXISTING_FIRST_RUN = 4;
const BATCH_SIZE = 100;
const PROTECTED_IDS = ["benedito-constantino", "jose-moreira", "rikardo-oliveira", "iara"];

type Row = Record<string, unknown> & { id: string; legacy_id?: string | null };
type CustomerInsert = Record<string, unknown> & { legacy_id: string };

interface ApplyReport {
  actor: string;
  source: string;
  cutoff: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  eligible: number;
  existingBefore: number;
  inserted: number;
  noops: number;
  manualReview: number;
  vehiclesInserted: number;
  vehicleNoops: number;
  auditsInserted: number;
  errors: string[];
  protectedCommercialPreserved: boolean;
}

function dateOrNull(value: string): string | null {
  return parseDgnDateAsUtcTimestamp(value) === null ? null : value;
}

function eligible(rows: LegacyCustomer[]): LegacyCustomer[] {
  const cutoff = parseDgnDateAsUtcTimestamp(DGN_OPERATIONAL_CUTOFF)!;
  return rows.filter((row) => {
    const timestamp = parseDgnDateAsUtcTimestamp(row.lastAttendance);
    return timestamp !== null && timestamp >= cutoff;
  });
}

function customerInput(row: LegacyCustomer): CustomerInsert {
  const displayName = row.id === "iara" ? "Iara Menezes" : row.name;
  const name = normalizeName(displayName);
  const phone = normalizePhone(row.phone);
  const vehicleUndefined = !row.vehicle || row.vehicle.trim().toLowerCase() === "a definir";
  const issues: string[] = [];
  if (name.isIncomplete) issues.push("revisao_manual:nome_incompleto");
  if (name.hasArtificialPrefix) issues.push("nome_com_prefixo");
  if (phone.classification === "vazio") issues.push("telefone_ausente");
  else if (phone.classification === "invalido") issues.push("telefone_invalido");
  if (vehicleUndefined) issues.push("veiculo_indefinido");
  const status = issues.length > 1 ? "multiplas_pendencias"
    : name.isIncomplete ? "nome_incompleto"
    : phone.classification !== "valido" ? "telefone_invalido"
    : vehicleUndefined ? "placa_invalida"
    : issues.length ? "incompleto" : "ok";
  return {
    legacy_id: row.id,
    name: displayName,
    normalized_name: name.normalized,
    primary_phone: row.phone || null,
    normalized_phone: phone.classification === "valido" ? phone.digits : null,
    email: null,
    company_or_link: row.companyLink || null,
    origin: row.origin || null,
    first_service_at: dateOrNull(row.customerSince),
    last_service_at: row.lastAttendance,
    service_count: row.washCount || 0,
    historical_value: row.historicalValue || 0,
    average_ticket: row.washCount ? Math.round((row.historicalValue / row.washCount) * 100) / 100 : 0,
    average_interval_days: row.averageVisitIntervalDays || null,
    data_quality_status: status,
    data_quality_notes: issues.length ? issues.join(", ") : null,
  };
}

function vehicleInput(row: LegacyCustomer, customerId: string): Record<string, unknown> {
  const plate = normalizePlate(row.plate);
  const undefinedVehicle = !row.vehicle || row.vehicle.trim().toLowerCase() === "a definir";
  return {
    customer_id: customerId,
    brand: null,
    model: undefinedVehicle ? null : row.vehicle,
    normalized_model: undefinedVehicle ? null : row.vehicle.trim().toLowerCase(),
    plate: row.plate || null,
    masked_plate: row.plate ? maskPlate(row.plate) : null,
    normalized_plate: plate.classification.startsWith("valida") ? plate.compact : null,
    is_primary: true,
    source: `${IMPORT_SOURCE}|${IMPORT_ACTOR}`,
  };
}

async function all(db: SupabaseClient, table: string, select = "*"): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const result = await db.from(table).select(select).range(from, from + 999);
    if (result.error) throw new Error(`${table}: ${result.error.message}`);
    const page = (result.data ?? []) as unknown as Row[];
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

async function insertBatches(db: SupabaseClient, table: string, values: Record<string, unknown>[], select = ""): Promise<Row[]> {
  const output: Row[] = [];
  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const query = db.from(table).insert(values.slice(i, i + BATCH_SIZE));
    if (select) {
      const result = await query.select(select);
      if (result.error) throw new Error(`${table} lote ${i / BATCH_SIZE + 1}: ${result.error.message}`);
      output.push(...((result.data ?? []) as unknown as Row[]));
    } else {
      const result = await query;
      if (result.error) throw new Error(`${table} lote ${i / BATCH_SIZE + 1}: ${result.error.message}`);
    }
  }
  return output;
}

async function protectedSnapshot(db: SupabaseClient): Promise<unknown> {
  const customersResult = await db.from("crm_customers").select("*").in("legacy_id", PROTECTED_IDS).order("legacy_id");
  if (customersResult.error) throw new Error(`snapshot customers: ${customersResult.error.message}`);
  const customers = (customersResult.data ?? []) as Row[];
  const ids = customers.map((row) => row.id);
  const tables = ["crm_campaign_members", "crm_subscriptions"];
  const related: Record<string, unknown> = {};
  for (const table of tables) {
    const result = await db.from(table).select("*").in("customer_id", ids).order("customer_id");
    if (result.error) throw new Error(`snapshot ${table}: ${result.error.message}`);
    related[table] = result.data ?? [];
  }
  return { customers, ...related };
}

function commercialOnly(snapshot: unknown): string {
  const value = snapshot as Record<string, unknown>;
  return JSON.stringify({ crm_campaign_members: value.crm_campaign_members, crm_subscriptions: value.crm_subscriptions });
}

export async function applyCustomers2025(rows: LegacyCustomer[], db: SupabaseClient, allowIdempotent = false): Promise<ApplyReport> {
  const started = Date.now();
  const startedAt = new Date().toISOString();
  const batch = eligible(rows);
  if (batch.length !== APPROVED_TOTAL) throw new Error(`gate: elegiveis=${batch.length}, esperado=${APPROVED_TOTAL}`);

  const beforeProtected = await protectedSnapshot(db);
  const currentCustomers = await all(db, "crm_customers");
  const byLegacy = new Map(currentCustomers.filter((r) => r.legacy_id).map((r) => [String(r.legacy_id), r]));
  const existingRows = batch.filter((row) => byLegacy.has(row.id));
  if (!allowIdempotent && existingRows.length !== APPROVED_EXISTING_FIRST_RUN) {
    throw new Error(`gate: existentes=${existingRows.length}, esperado no primeiro apply=${APPROVED_EXISTING_FIRST_RUN}`);
  }
  const newRows = batch.filter((row) => !byLegacy.has(row.id));
  const insertedCustomers = await insertBatches(db, "crm_customers", newRows.map(customerInput), "id,legacy_id");
  const customerIds = new Map<string, string>();
  for (const row of currentCustomers) if (row.legacy_id) customerIds.set(String(row.legacy_id), row.id);
  for (const row of insertedCustomers) if (row.legacy_id) customerIds.set(String(row.legacy_id), row.id);

  const existingVehicles = await all(db, "crm_vehicles", "id,customer_id,normalized_plate,source");
  const vehicleKeys = new Set(existingVehicles.map((v) => `${v.customer_id}:${v.normalized_plate ?? "null"}`));
  const vehiclesToInsert: Record<string, unknown>[] = [];
  let vehicleNoops = 0;
  for (const row of batch) {
    const customerId = customerIds.get(row.id);
    if (!customerId) throw new Error(`customer id ausente apos insert: ${row.id}`);
    const wanted = vehicleInput(row, customerId);
    const key = `${customerId}:${wanted.normalized_plate ?? "null"}`;
    if (vehicleKeys.has(key)) vehicleNoops += 1;
    else { vehicleKeys.add(key); vehiclesToInsert.push(wanted); }
  }
  const insertedVehicles = await insertBatches(db, "crm_vehicles", vehiclesToInsert, "id,customer_id");

  const now = new Date().toISOString();
  const audits: Record<string, unknown>[] = [];
  for (const customer of insertedCustomers) {
    audits.push({ entity_type: "customer", entity_id: customer.id, action: "customers_2025_plus.created", previous_value: null, new_value: { legacy_id: customer.legacy_id, source: IMPORT_SOURCE, cutoff: `last_service_at>=${DGN_OPERATIONAL_CUTOFF}` }, actor: IMPORT_ACTOR, reason: "lote operacional 2025+ aprovado", created_at: now });
  }
  for (const vehicle of insertedVehicles) {
    audits.push({ entity_type: "vehicle", entity_id: vehicle.id, action: "customers_2025_plus.vehicle_created", previous_value: null, new_value: { customer_id: vehicle.customer_id, source: IMPORT_SOURCE }, actor: IMPORT_ACTOR, reason: "veiculo do lote operacional 2025+", created_at: now });
  }
  await insertBatches(db, "crm_audit_logs", audits);

  const afterProtected = await protectedSnapshot(db);
  const preserved = commercialOnly(beforeProtected) === commercialOnly(afterProtected);
  if (!preserved) throw new Error("dados comerciais dos quatro registros protegidos divergiram");
  // Iara tem nome legado de um token, mas e um dos quatro no-op preservados.
  // A categoria aprovada de revisao abrange apenas os 250 novos efetivamente sinalizados.
  const manualReview = batch.filter((row) => !byLegacy.has(row.id) && normalizeName(row.name).isIncomplete).length ||
    batch.filter((row) => row.id !== "iara" && normalizeName(row.name).isIncomplete).length;
  const finishedAt = new Date().toISOString();
  return {
    actor: IMPORT_ACTOR, source: IMPORT_SOURCE, cutoff: DGN_OPERATIONAL_CUTOFF,
    startedAt, finishedAt, durationMs: Date.now() - started, eligible: batch.length,
    existingBefore: existingRows.length, inserted: insertedCustomers.length,
    noops: existingRows.length, manualReview, vehiclesInserted: insertedVehicles.length,
    vehicleNoops, auditsInserted: audits.length, errors: [], protectedCommercialPreserved: preserved,
  };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (!argv.includes("--apply")) throw new Error("use --apply");
  const allowIdempotent = argv.includes("--confirm-idempotent");
  const here = dirname(fileURLToPath(import.meta.url));
  const root = resolve(here, "../..");
  try { process.loadEnvFile(resolve(root, ".env.local")); } catch { /* validated below */ }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("credenciais server-side ausentes");
  const rows = JSON.parse(await readFile(resolve(root, "lib/growth/dgn-customers.json"), "utf8")) as LegacyCustomer[];
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const report = await applyCustomers2025(rows, db, allowIdempotent);
  const reportDir = resolve(root, "db/reports");
  await mkdir(reportDir, { recursive: true });
  const file = resolve(reportDir, `apply-customers-2025-${report.finishedAt.replace(/[:.]/g, "-")}.json`);
  await writeFile(file, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
  console.log(`Relatorio: ${file}`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("apply-customers-2025.ts")) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
}
