/** Validacao read-only posterior ao apply do lote 2025+. */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DGN_OPERATIONAL_CUTOFF, parseDgnDateAsUtcTimestamp } from "../../lib/growth/dgn-growth-data.ts";
import { normalizeName, normalizePhone } from "../../lib/growth/db/normalizers.ts";
import type { LegacyCustomer } from "./migrate-legacy-json.ts";
import { IMPORT_ACTOR } from "./diagnose-customers-2025.ts";

type DbRow = Record<string, unknown> & { id: string; legacy_id?: string | null };
const PROTECTED = ["benedito-constantino", "jose-moreira", "rikardo-oliveira", "iara"];

async function pages(db: SupabaseClient, table: string, select = "*"): Promise<DbRow[]> {
  const output: DbRow[] = [];
  for (let from = 0; ; from += 1000) {
    const result = await db.from(table).select(select).range(from, from + 999);
    if (result.error) throw new Error(`${table}: ${result.error.message}`);
    const page = (result.data ?? []) as unknown as DbRow[];
    output.push(...page);
    if (page.length < 1000) return output;
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`validacao falhou: ${message}`);
}

async function main(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = resolve(here, "../..");
  try { process.loadEnvFile(resolve(root, ".env.local")); } catch { /* checked below */ }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("credenciais server-side ausentes");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const legacy = JSON.parse(await readFile(resolve(root, "lib/growth/dgn-customers.json"), "utf8")) as LegacyCustomer[];
  const cutoff = parseDgnDateAsUtcTimestamp(DGN_OPERATIONAL_CUTOFF)!;
  const batch = legacy.filter((row) => (parseDgnDateAsUtcTimestamp(row.lastAttendance) ?? -1) >= cutoff);
  const ids = new Set(batch.map((row) => row.id));

  const [customers, vehicles, allAudits] = await Promise.all([
    pages(db, "crm_customers"),
    pages(db, "crm_vehicles"),
    pages(db, "crm_audit_logs", "id,entity_type,entity_id,action,actor"),
  ]);
  const audits = allAudits.filter((row) => row.actor === IMPORT_ACTOR);
  const batchCustomers = customers.filter((row) => row.legacy_id && ids.has(String(row.legacy_id)));
  const customerIdSet = new Set(batchCustomers.map((row) => row.id));
  const batchVehicles = vehicles.filter((row) => customerIdSet.has(String(row.customer_id)));
  const review = batchCustomers.filter((row) => String(row.data_quality_notes ?? "").includes("revisao_manual:nome_incompleto"));
  const newCustomerIds = batchCustomers.filter((row) => !PROTECTED.includes(String(row.legacy_id))).map((row) => row.id);
  const newCustomerIdSet = new Set(newCustomerIds);
  const [allCampaigns, allSubscriptions] = await Promise.all([
    pages(db, "crm_campaign_members", "id,customer_id"),
    pages(db, "crm_subscriptions", "id,customer_id"),
  ]);
  const newCampaigns = allCampaigns.filter((row) => newCustomerIdSet.has(String(row.customer_id)));
  const newSubscriptions = allSubscriptions.filter((row) => newCustomerIdSet.has(String(row.customer_id)));

  assert(batch.length === 1152, "fonte deixou de ter 1152 elegiveis");
  assert(batchCustomers.length === 1152, `clientes no banco=${batchCustomers.length}`);
  assert(new Set(batchCustomers.map((row) => row.legacy_id)).size === 1152, "legacy_id duplicado");
  assert(batchVehicles.length === 1152, `veiculos do lote=${batchVehicles.length}`);
  assert(review.length === 250, `revisao manual=${review.length}`);
  assert(audits.length === 2296, `auditorias do actor=${audits.length}`);
  assert(newCampaigns.length === 0, "campanha criada para cliente novo");
  assert(newSubscriptions.length === 0, "assinatura criada para cliente novo");

  const byLegacy = new Map(batchCustomers.map((row) => [String(row.legacy_id), row]));
  const fullNew = batch.find((row) => !PROTECTED.includes(row.id) && !normalizeName(row.name).isIncomplete && normalizePhone(row.phone).classification === "valido" && row.vehicle.toLowerCase() !== "a definir");
  const incomplete = batch.find((row) => !PROTECTED.includes(row.id) && normalizeName(row.name).isIncomplete);
  const invalidPhone = batch.find((row) => normalizePhone(row.phone).classification !== "valido");
  const undefinedVehicle = batch.find((row) => row.vehicle.toLowerCase() === "a definir");
  assert(fullNew && byLegacy.has(fullNew.id), "amostra cliente novo completo");
  assert(incomplete && String(byLegacy.get(incomplete.id)?.data_quality_notes).includes("revisao_manual"), "amostra nome incompleto");
  assert(invalidPhone && ["telefone_invalido", "multiplas_pendencias"].includes(String(byLegacy.get(invalidPhone.id)?.data_quality_status)), "amostra telefone invalido");
  assert(undefinedVehicle && ["placa_invalida", "multiplas_pendencias"].includes(String(byLegacy.get(undefinedVehicle.id)?.data_quality_status)), "amostra veiculo A definir");
  for (const id of PROTECTED) assert(byLegacy.has(id), `protegido ausente: ${id}`);

  console.log(JSON.stringify({
    totalLote: batchCustomers.length,
    veiculos: batchVehicles.length,
    revisaoManual: review.length,
    auditorias: audits.length,
    campanhasNovos: newCampaigns.length,
    assinaturasNovos: newSubscriptions.length,
    duplicacoesLegacyId: batchCustomers.length - new Set(batchCustomers.map((row) => row.legacy_id)).size,
    amostras: { benedito: true, jose: true, rikardo: true, iara: true, novoCompleto: true, nomeIncompleto: true, telefoneInvalido: true, veiculoADefinir: true },
  }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
