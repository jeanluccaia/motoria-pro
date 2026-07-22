/**
 * Diagnostico read-only do lote operacional DGN Growth (atendimento 2025+).
 *
 * Uso:
 *   node db/scripts/diagnose-customers-2025.ts --dry-run
 *
 * Este comando nunca grava no Supabase. O apply continua sendo uma etapa
 * separada e depende de aprovacao expressa depois da revisao deste relatorio.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { DGN_OPERATIONAL_CUTOFF, parseDgnDateAsUtcTimestamp } from "../../lib/growth/dgn-growth-data.ts";
import { normalizeName, normalizePhone, normalizePlate } from "../../lib/growth/db/normalizers.ts";
import type { LegacyCustomer } from "./migrate-legacy-json.ts";

export const IMPORT_ACTOR = "migration:customers_2025_plus";
export const IMPORT_SOURCE = "legacy-json:4ucar-export";

type DbCustomer = Record<string, unknown> & {
  id: string;
  legacy_id: string | null;
  name: string;
  normalized_name: string;
  normalized_phone: string | null;
};

type DbVehicle = Record<string, unknown> & {
  customer_id: string;
  normalized_plate: string | null;
};

export interface DiagnosticReport {
  mode: "dry-run";
  generatedAt: string;
  source: { kind: string; path: string; total: number };
  cutoff: { field: "lastAttendance"; rule: string; expected: number };
  dates: { eligible: number; beforeCutoff: number; missing: number; invalid: number; differenceFromExpected: number };
  database: { connected: boolean; customersRead: number; vehiclesRead: number; error: string | null };
  reconciliation: {
    existing: number;
    inserts: number;
    updates: number;
    noops: number;
    duplicates: number;
    manualReview: number;
    rejected: number;
  };
  matchReasons: Record<string, number>;
  fieldsEligibleForUpdate: string[];
  preservedFields: string[];
  protectedRecords: Array<{ legacyId: string; role: string; presentInBatch: boolean; presentInDatabase: boolean }>;
  quality: { invalidPhone: number; vehicleUndefined: number; incompleteName: number };
  rollback: { actor: string; source: string; strategy: string };
  durationMs: number;
}

const EXPECTED = 1152;
const CUSTOMER_FIELDS = [
  "legacy_id", "name", "normalized_name", "primary_phone", "normalized_phone", "email",
  "company_or_link", "origin", "first_service_at", "last_service_at", "service_count",
  "historical_value", "average_ticket", "average_interval_days", "data_quality_status", "data_quality_notes",
];
const PRESERVED_FIELDS = [
  "crm_campaign_members.founder_status", "crm_campaign_members.founder_number",
  "crm_campaign_members.owner", "crm_campaign_members.priority", "crm_campaign_members.commercial_notes",
  "crm_campaign_members.next_action", "crm_campaign_members.next_action_at", "crm_subscriptions",
];
const PROTECTED = [
  { legacyId: "benedito-constantino", role: "Founder 001" },
  { legacyId: "jose-moreira", role: "Founder 002" },
  { legacyId: "rikardo-oliveira", role: "Founder 003" },
  { legacyId: "iara", role: "situacao comercial preservada / vaga 004" },
];

function validDate(value: unknown): number | null {
  return typeof value === "string" ? parseDgnDateAsUtcTimestamp(value) : null;
}

function comparableCustomer(row: LegacyCustomer): Record<string, unknown> {
  const name = row.id === "iara" ? "Iara Menezes" : row.name;
  const phone = normalizePhone(row.phone);
  const nameInfo = normalizeName(name);
  const vehicleUndefined = !row.vehicle || row.vehicle.trim().toLowerCase() === "a definir";
  const issues = [
    ...(phone.classification === "valido" ? [] : [phone.classification === "vazio" ? "telefone_ausente" : "telefone_invalido"]),
    ...(vehicleUndefined ? ["veiculo_indefinido"] : []),
    ...(nameInfo.isIncomplete ? ["nome_incompleto"] : []),
    ...(nameInfo.hasArtificialPrefix ? ["nome_com_prefixo"] : []),
  ];
  const status = issues.length > 1 ? "multiplas_pendencias"
    : issues[0] === "telefone_invalido" || issues[0] === "telefone_ausente" ? "telefone_invalido"
    : issues[0] === "veiculo_indefinido" ? "placa_invalida"
    : issues[0] === "nome_incompleto" ? "nome_incompleto"
    : issues.length ? "incompleto" : "ok";
  return {
    legacy_id: row.id,
    name,
    normalized_name: nameInfo.normalized,
    primary_phone: row.phone || null,
    normalized_phone: phone.classification === "valido" ? phone.digits : null,
    email: null,
    company_or_link: row.companyLink || null,
    origin: row.origin || null,
    first_service_at: validDate(row.customerSince) === null ? null : row.customerSince,
    last_service_at: row.lastAttendance,
    service_count: row.washCount || 0,
    historical_value: row.historicalValue || 0,
    average_ticket: row.washCount ? Math.round((row.historicalValue / row.washCount) * 100) / 100 : 0,
    average_interval_days: row.averageVisitIntervalDays || null,
    data_quality_status: status,
    data_quality_notes: issues.length ? issues.join(", ") : null,
  };
}

function sameValue(a: unknown, b: unknown): boolean {
  if (typeof a === "number" || typeof b === "number") return Number(a ?? 0) === Number(b ?? 0);
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function customerIsNoop(current: DbCustomer, wanted: Record<string, unknown>): boolean {
  return CUSTOMER_FIELDS.every((field) => sameValue(current[field], wanted[field]));
}

async function readAll(db: SupabaseClient, table: string, select = "*"): Promise<Record<string, unknown>[]> {
  const output: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    const result = await db.from(table).select(select).range(from, from + 999);
    if (result.error) throw new Error(`${table}: ${result.error.message}`);
    const page = (result.data ?? []) as unknown as Record<string, unknown>[];
    output.push(...page);
    if ((result.data?.length ?? 0) < 1000) return output;
  }
}

function loadEnvironment(projectRoot: string): void {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try { process.loadEnvFile(resolve(projectRoot, ".env.local")); } catch { /* reported safely below */ }
}

export async function diagnose(rows: LegacyCustomer[], db?: SupabaseClient): Promise<DiagnosticReport> {
  const started = Date.now();
  const cutoff = validDate(DGN_OPERATIONAL_CUTOFF)!;
  let missing = 0;
  let invalid = 0;
  let beforeCutoff = 0;
  const eligible: LegacyCustomer[] = [];
  for (const row of rows) {
    const raw = row.lastAttendance;
    if (!raw || raw.trim() === "" || raw.trim().toLowerCase() === "a definir") { missing += 1; continue; }
    const timestamp = validDate(raw);
    if (timestamp === null) { invalid += 1; continue; }
    if (timestamp < cutoff) beforeCutoff += 1;
    else eligible.push(row);
  }

  let customers: DbCustomer[] = [];
  let vehicles: DbVehicle[] = [];
  let dbError: string | null = null;
  if (db) {
    try {
      [customers, vehicles] = await Promise.all([
        readAll(db, "crm_customers"),
        readAll(db, "crm_vehicles", "customer_id,normalized_plate"),
      ]) as [DbCustomer[], DbVehicle[]];
    } catch (error) {
      dbError = error instanceof Error ? error.message : "falha desconhecida na leitura";
    }
  } else dbError = "credenciais server-side ausentes; comparacao com banco nao executada";

  const byLegacy = new Map(customers.filter((c) => c.legacy_id).map((c) => [c.legacy_id!, c]));
  const byPhone = new Map<string, DbCustomer[]>();
  for (const c of customers) if (c.normalized_phone) byPhone.set(c.normalized_phone, [...(byPhone.get(c.normalized_phone) ?? []), c]);
  const vehicleOwners = new Map<string, string[]>();
  for (const v of vehicles) if (v.normalized_plate) vehicleOwners.set(v.normalized_plate, [...(vehicleOwners.get(v.normalized_plate) ?? []), v.customer_id]);
  const customerById = new Map(customers.map((c) => [c.id, c]));

  let inserts = 0, updates = 0, noops = 0, duplicates = 0, manualReview = 0, rejected = 0, existing = 0;
  const matchReasons: Record<string, number> = {};
  const bump = (key: string) => { matchReasons[key] = (matchReasons[key] ?? 0) + 1; };

  for (const row of eligible) {
    const wanted = comparableCustomer(row);
    const exactLegacy = byLegacy.get(row.id);
    if (exactLegacy) {
      existing += 1; bump("legacy_id");
      if (customerIsNoop(exactLegacy, wanted)) noops += 1; else updates += 1;
      continue;
    }
    const phone = normalizePhone(row.phone);
    const phoneMatches = phone.classification === "valido" ? byPhone.get(phone.digits) ?? [] : [];
    if (phoneMatches.length === 1) {
      existing += 1; bump("telefone_exato");
      const target = phoneMatches[0];
      if (target.legacy_id && target.legacy_id !== row.id) { duplicates += 1; manualReview += 1; continue; }
      if (customerIsNoop(target, wanted)) noops += 1; else updates += 1;
      continue;
    }
    if (phoneMatches.length > 1) { duplicates += 1; manualReview += 1; bump("telefone_ambiguo"); continue; }
    const plate = normalizePlate(row.plate);
    const ownerIds = plate.classification.startsWith("valida") ? vehicleOwners.get(plate.compact) ?? [] : [];
    if (ownerIds.length === 1) {
      const target = customerById.get(ownerIds[0]);
      if (!target) { rejected += 1; continue; }
      existing += 1;
      if (target.normalized_name !== wanted.normalized_name) { duplicates += 1; manualReview += 1; bump("placa_com_nome_divergente"); continue; }
      bump("nome_placa");
      if (customerIsNoop(target, wanted)) noops += 1; else updates += 1;
      continue;
    }
    if (ownerIds.length > 1) { duplicates += 1; manualReview += 1; bump("placa_ambigua"); continue; }
    if (normalizeName(row.name).isIncomplete) { manualReview += 1; bump("nome_incompleto_novo"); continue; }
    inserts += 1;
  }

  const invalidPhone = eligible.filter((r) => normalizePhone(r.phone).classification !== "valido").length;
  const vehicleUndefined = eligible.filter((r) => !r.vehicle || r.vehicle.trim().toLowerCase() === "a definir").length;
  const incompleteName = eligible.filter((r) => normalizeName(r.name).isIncomplete).length;
  return {
    mode: "dry-run",
    generatedAt: new Date().toISOString(),
    source: { kind: IMPORT_SOURCE, path: "lib/growth/dgn-customers.json", total: rows.length },
    cutoff: { field: "lastAttendance", rule: `>= ${DGN_OPERATIONAL_CUTOFF}`, expected: EXPECTED },
    dates: { eligible: eligible.length, beforeCutoff, missing, invalid, differenceFromExpected: eligible.length - EXPECTED },
    database: { connected: Boolean(db) && !dbError, customersRead: customers.length, vehiclesRead: vehicles.length, error: dbError },
    reconciliation: { existing, inserts, updates, noops, duplicates, manualReview, rejected },
    matchReasons,
    fieldsEligibleForUpdate: CUSTOMER_FIELDS,
    preservedFields: PRESERVED_FIELDS,
    protectedRecords: PROTECTED.map((p) => ({ ...p, presentInBatch: eligible.some((r) => r.id === p.legacyId), presentInDatabase: byLegacy.has(p.legacyId) })),
    quality: { invalidPhone, vehicleUndefined, incompleteName },
    rollback: { actor: IMPORT_ACTOR, source: IMPORT_SOURCE, strategy: "remover apenas registros criados pelo lote identificado por actor/source/import timestamp; nunca TRUNCATE" },
    durationMs: Date.now() - started,
  };
}

function printReport(r: DiagnosticReport): void {
  console.log("\nDGN Growth — diagnostico clientes 2025+ (somente leitura)");
  console.log(`Fonte: ${r.source.path} (${r.source.total} registros)`);
  console.log(`Elegiveis: ${r.dates.eligible}; esperado: ${r.cutoff.expected}; diferenca: ${r.dates.differenceFromExpected}`);
  console.log(`Sem data: ${r.dates.missing}; data invalida: ${r.dates.invalid}; anteriores ao corte: ${r.dates.beforeCutoff}`);
  console.log(`Banco: ${r.database.connected ? "conectado" : "nao comparado"}; clientes lidos: ${r.database.customersRead}; veiculos lidos: ${r.database.vehiclesRead}`);
  if (r.database.error) console.log(`Aviso banco: ${r.database.error}`);
  console.log(`Existentes: ${r.reconciliation.existing}; novos: ${r.reconciliation.inserts}; atualizacoes: ${r.reconciliation.updates}; no-op: ${r.reconciliation.noops}`);
  console.log(`Duplicidades: ${r.reconciliation.duplicates}; revisao manual: ${r.reconciliation.manualReview}; rejeitados: ${r.reconciliation.rejected}`);
  console.log(`Qualidade — telefone invalido/ausente: ${r.quality.invalidPhone}; veiculo A definir: ${r.quality.vehicleUndefined}; nome incompleto: ${r.quality.incompleteName}`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("--apply")) throw new Error("apply bloqueado nesta etapa: execute o dry-run e obtenha aprovacao expressa");
  if (!argv.includes("--dry-run")) throw new Error("use --dry-run; este diagnostico nao aceita escrita");
  const here = dirname(fileURLToPath(import.meta.url));
  const projectRoot = resolve(here, "../..");
  const rows = JSON.parse(await readFile(resolve(projectRoot, "lib/growth/dgn-customers.json"), "utf8")) as LegacyCustomer[];
  loadEnvironment(projectRoot);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const db = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : undefined;
  const report = await diagnose(rows, db);
  printReport(report);
  const outDir = resolve(projectRoot, "db/reports");
  await mkdir(outDir, { recursive: true });
  const stamp = report.generatedAt.replace(/[:.]/g, "-");
  const file = resolve(outDir, `dry-run-customers-2025-${stamp}.json`);
  await writeFile(file, JSON.stringify(report, null, 2), "utf8");
  console.log(`Relatorio local (ignorado pelo Git): ${file}\n`);
  if (!report.database.connected) process.exitCode = 2;
}

const direct = process.argv[1]?.replace(/\\/g, "/").endsWith("diagnose-customers-2025.ts");
if (direct) main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
