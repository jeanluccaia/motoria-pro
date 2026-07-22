/** Dry-run/apply idempotente de DGN_SCORE_V1. O apply exige confirmação explícita. */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { computeDgnScore, DGN_SCORE_VERSION, type DataQualityIssue, type ScoreInput } from "../../lib/growth/db/score-engine.ts";
import { normalizeName, normalizePhone } from "../../lib/growth/db/normalizers.ts";
import { supabaseSecretKeyFetch } from "../../lib/growth/db/secret-key-fetch.ts";

const ACTOR = "migration:dgn_score_v1_2025_plus";
const APPLY_CONFIRMATION = "APPLY_DGN_SCORE_V1_2025_PLUS";
const PAGE_SIZE = 500;
type Row = Record<string, unknown> & { id: string };
type Prepared = { customer: Row; score: ReturnType<typeof computeDgnScore>; insufficient: boolean; identical: boolean };

async function all(db: SupabaseClient, table: string, select = "*"): Promise<Row[]> {
  const output: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const result = await db.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    if (result.error) throw new Error(`${table}: ${result.error.message}`);
    const page = (result.data ?? []) as unknown as Row[];
    output.push(...page);
    if (page.length < PAGE_SIZE) return output;
  }
}

const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const dateDaysAgo = (value: unknown, now: number): number | null => {
  const parsed = Date.parse(text(value));
  return Number.isNaN(parsed) ? null : Math.max(0, Math.floor((now - parsed) / 86_400_000));
};
const planFit = (value: unknown): ScoreInput["planFit"] => {
  const normalized = text(value).toLowerCase();
  if (normalized === "priority") return "priority";
  if (normalized === "smart") return "smart";
  if (normalized.includes("corporate")) return "corporate";
  return "não_identificado";
};
const strategicOrigins = new Set(["genebra", "costa e silva", "cury", "monsoes", "monsões", "taquaral", "lumini", "avalon", "praca capital", "praça capital", "medley", "merse", "radial"]);
const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  }
  return value;
};
const stable = (value: unknown) => JSON.stringify(canonical(value));

export function scoreRow(prepared: Prepared): Record<string, unknown> {
  const score = prepared.score;
  return {
    customer_id: prepared.customer.id,
    score_version: score.scoreVersion,
    total_score: score.totalScore,
    recurrence_score: score.components.recurrence,
    recency_score: score.components.recency,
    service_count_score: score.components.serviceCount,
    value_score: score.components.value,
    plan_fit_score: score.components.planFit,
    data_quality_score: score.components.dataQuality,
    strategic_link_score: score.components.strategicLink,
    relationship_score: score.components.relationship,
    penalties: score.penalties,
    explanation: { lines: score.explanation, actor: ACTOR },
  };
}

function sameSnapshot(current: Row | undefined, wanted: Record<string, unknown>): boolean {
  if (!current) return false;
  return Object.entries(wanted).every(([key, value]) => key === "customer_id" || stable(current[key]) === stable(value));
}

export async function prepareScores(db: SupabaseClient): Promise<Prepared[]> {
  const [customers, vehicles, subscriptions, members, snapshots, duplicates] = await Promise.all([
    all(db, "crm_customers"), all(db, "crm_vehicles"), all(db, "crm_subscriptions"),
    all(db, "crm_campaign_members"), all(db, "crm_score_snapshots"), all(db, "crm_duplicate_candidates"),
  ]);
  const vehiclesByCustomer = new Map(vehicles.map((row) => [text(row.customer_id), row]));
  const subscriptionsByCustomer = new Map(subscriptions.map((row) => [text(row.customer_id), row]));
  const membersByCustomer = new Map(members.map((row) => [text(row.customer_id), row]));
  const duplicateIds = new Set(duplicates.flatMap((row) => [text(row.source_customer_id), text(row.target_customer_id)]));
  const latest = new Map<string, Row>();
  for (const row of snapshots.filter((item) => item.score_version === DGN_SCORE_VERSION).sort((a, b) => text(b.calculated_at).localeCompare(text(a.calculated_at)))) {
    if (!latest.has(text(row.customer_id))) latest.set(text(row.customer_id), row);
  }
  const now = Date.now();
  return customers.map((customer) => {
    const id = customer.id;
    const vehicle = vehiclesByCustomer.get(id);
    const subscription = subscriptionsByCustomer.get(id);
    const member = membersByCustomer.get(id);
    const phone = normalizePhone(text(customer.primary_phone));
    const name = normalizeName(text(customer.name));
    const issues: DataQualityIssue[] = [];
    if (!vehicle?.model) issues.push("veiculo_indefinido");
    if (phone.classification === "vazio") issues.push("telefone_ausente");
    else if (phone.classification === "invalido") issues.push("telefone_invalido");
    const daysSinceLastService = dateDaysAgo(customer.last_service_at, now);
    if (daysSinceLastService !== null && daysSinceLastService > 240) issues.push("atendimento_antigo");
    if (name.hasArtificialPrefix) issues.push("nome_com_prefixo");
    if (duplicateIds.has(id)) issues.push("duplicidade_provavel");
    const serviceCount = number(customer.service_count);
    const historicalValue = number(customer.historical_value);
    const averageTicket = number(customer.average_ticket);
    const founderStatus = text(member?.founder_status);
    const relationshipStrength: ScoreInput["relationshipStrength"] = founderStatus === "confirmado" ? 3 : founderStatus === "selecionado" ? 2 : founderStatus === "recomendado" ? 1 : 0;
    const input: ScoreInput = {
      averageIntervalDays: customer.average_interval_days == null ? null : number(customer.average_interval_days),
      daysSinceLastService,
      serviceCount, historicalValue, averageTicket,
      planFit: planFit(subscription?.subscription_plan),
      dataQualityIssues: issues,
      strategicLink: strategicOrigins.has(text(customer.origin).toLowerCase()) || strategicOrigins.has(text(customer.company_or_link).toLowerCase()),
      relationshipStrength,
      hasDetectedSubscription: Boolean(subscription),
    };
    const score = computeDgnScore(input);
    const insufficient = daysSinceLastService === null || serviceCount === 0 || (!historicalValue && !averageTicket);
    const prepared = { customer, score, insufficient, identical: false };
    prepared.identical = sameSnapshot(latest.get(id), scoreRow(prepared));
    return prepared;
  });
}

function report(prepared: Prepared[]) {
  const scores = prepared.map((item) => item.score.totalScore);
  const penaltyCounts = new Map<string, number>();
  for (const item of prepared) for (const penalty of item.score.penalties) penaltyCounts.set(penalty.code, (penaltyCounts.get(penalty.code) ?? 0) + 1);
  return {
    version: DGN_SCORE_VERSION,
    eligible: prepared.length,
    calculated: prepared.length,
    distribution: {
      prioridade_maxima: prepared.filter((item) => item.score.tier === "prioridade_maxima").length,
      forte_candidato: prepared.filter((item) => item.score.tier === "forte_candidato").length,
      precisa_curadoria: prepared.filter((item) => item.score.tier === "precisa_curadoria").length,
      baixa_prioridade: prepared.filter((item) => item.score.tier === "baixa_prioridade").length,
    },
    average: Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length * 100) / 100,
    minimum: Math.min(...scores),
    maximum: Math.max(...scores),
    commonPenalties: [...penaltyCounts].sort((a, b) => b[1] - a[1]).map(([code, count]) => ({ code, count })),
    insufficientData: prepared.filter((item) => item.insufficient).length,
    existingSnapshots: prepared.filter((item) => item.identical).length,
    insertsOrUpdates: prepared.filter((item) => !item.identical).length,
    noops: prepared.filter((item) => item.identical).length,
    errors: 0,
  };
}

async function insertBatches(db: SupabaseClient, rows: Record<string, unknown>[]) {
  for (let index = 0; index < rows.length; index += 100) {
    const result = await db.from("crm_score_snapshots").insert(rows.slice(index, index + 100));
    if (result.error) throw new Error(`crm_score_snapshots lote ${index / 100 + 1}: ${result.error.message}`);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const apply = argv.includes("--apply");
  if (dryRun === apply) throw new Error("use exatamente --dry-run ou --apply");
  if (apply && (!argv.includes("--confirm") || argv[argv.indexOf("--confirm") + 1] !== APPLY_CONFIRMATION)) {
    throw new Error(`apply bloqueado: use --confirm ${APPLY_CONFIRMATION}`);
  }
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  try { process.loadEnvFile(resolve(root, ".env.local")); } catch { /* checked below */ }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("credenciais server-side ausentes");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: supabaseSecretKeyFetch } });
  const started = performance.now();
  const prepared = await prepareScores(db);
  const summary = { mode: dryRun ? "dry-run" : "apply", ...report(prepared), durationMs: Math.round((performance.now() - started) * 100) / 100 };
  if (apply) await insertBatches(db, prepared.filter((item) => !item.identical).map(scoreRow));
  const outDir = resolve(root, "db/reports");
  await mkdir(outDir, { recursive: true });
  const file = resolve(outDir, `${dryRun ? "dry-run" : "apply"}-dgn-score-v1-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await writeFile(file, JSON.stringify(summary, null, 2), "utf8");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Relatório: ${file}`);
}
if (process.argv[1]?.replace(/\\/g, "/").endsWith("score-customers-2025.ts")) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
}
