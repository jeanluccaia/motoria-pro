/** Validação read-only posterior ao apply DGN_SCORE_V1. */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolve } from "node:path";
import { supabaseSecretKeyFetch } from "../../lib/growth/db/secret-key-fetch.ts";

const VERSION = "DGN_SCORE_V1";
const SCORE_ACTOR = "migration:dgn_score_v1_2025_plus";
const PROTECTED = ["benedito-constantino", "jose-moreira", "rikardo-oliveira", "iara"];
type Row = Record<string, unknown> & { id: string };
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number(value);
const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(`validação falhou: ${message}`);
};
async function all(db: SupabaseClient, table: string): Promise<Row[]> {
  const output: Row[] = [];
  for (let from = 0; ; from += 500) {
    const result = await db.from(table).select("*").range(from, from + 499);
    if (result.error) throw new Error(`${table}: ${result.error.message}`);
    const page = (result.data ?? []) as unknown as Row[];
    output.push(...page);
    if (page.length < 500) return output;
  }
}

const root = resolve(import.meta.dirname, "../..");
try { process.loadEnvFile(resolve(root, ".env.local")); } catch { /* checked below */ }
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("credenciais server-side ausentes");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: supabaseSecretKeyFetch } });
const [customers, vehicles, snapshots, members, subscriptions, audits] = await Promise.all([
  all(db, "crm_customers"), all(db, "crm_vehicles"), all(db, "crm_score_snapshots"),
  all(db, "crm_campaign_members"), all(db, "crm_subscriptions"), all(db, "crm_audit_logs"),
]);
const scores = snapshots.filter((row) => row.score_version === VERSION);
const customerById = new Map(customers.map((row) => [row.id, row]));
const scoreByCustomer = new Map(scores.map((row) => [text(row.customer_id), row]));
assert(customers.length === 1152, `clientes=${customers.length}`);
assert(scores.length === 1152, `snapshots=${scores.length}`);
assert(scoreByCustomer.size === 1152, `clientes únicos com score=${scoreByCustomer.size}`);
assert(scores.every((row) => row.calculated_at && row.penalties && row.explanation), "snapshot sem data/penalidade/explicação");
assert(scores.every((row) => ["recurrence_score", "recency_score", "service_count_score", "value_score", "plan_fit_score", "data_quality_score", "strategic_link_score", "relationship_score"].every((field) => row[field] != null)), "composição incompleta");
const distribution = {
  prioridade_maxima: scores.filter((row) => number(row.total_score) >= 85).length,
  forte_candidato: scores.filter((row) => number(row.total_score) >= 70 && number(row.total_score) < 85).length,
  precisa_curadoria: scores.filter((row) => number(row.total_score) >= 55 && number(row.total_score) < 70).length,
  baixa_prioridade: scores.filter((row) => number(row.total_score) < 55).length,
};
assert(JSON.stringify(distribution) === JSON.stringify({ prioridade_maxima: 0, forte_candidato: 13, precisa_curadoria: 44, baixa_prioridade: 1095 }), `distribuição=${JSON.stringify(distribution)}`);
const strong = scores.filter((row) => number(row.total_score) >= 70 && number(row.total_score) < 85);
assert(strong.length === 13 && strong.every((row) => customerById.has(text(row.customer_id))), "13 fortes candidatos");
const penaltyHas = (row: Row, code: string) => Array.isArray(row.penalties) && row.penalties.some((item) => item && typeof item === "object" && (item as Record<string, unknown>).code === code);
const sampleZero = scores.find((row) => number(row.total_score) === 0);
const sampleUndefinedVehicle = scores.find((row) => penaltyHas(row, "veiculo_indefinido"));
const sampleOld = scores.find((row) => penaltyHas(row, "atendimento_antigo"));
const sampleInvalidPhone = scores.find((row) => penaltyHas(row, "telefone_invalido"));
assert(sampleZero && sampleUndefinedVehicle && sampleOld && sampleInvalidPhone, "amostras de score/penalidade");
for (const sample of [sampleZero, sampleUndefinedVehicle, sampleOld, sampleInvalidPhone]) assert(customerById.has(text(sample.customer_id)), "amostra sem cliente");
assert(vehicles.length === 1152, "clientes de score continuam com veículos");

const protectedCustomers = customers.filter((row) => PROTECTED.includes(text(row.legacy_id)));
assert(protectedCustomers.length === 4, "quatro protegidos");
const protectedIds = new Set(protectedCustomers.map((row) => row.id));
const protectedMembers = members.filter((row) => protectedIds.has(text(row.customer_id)));
const protectedSubscriptions = subscriptions.filter((row) => protectedIds.has(text(row.customer_id)));
for (const [legacyId, numberExpected] of [["benedito-constantino", "001"], ["jose-moreira", "002"], ["rikardo-oliveira", "003"]] as const) {
  const customer = protectedCustomers.find((row) => row.legacy_id === legacyId)!;
  const member = protectedMembers.find((row) => row.customer_id === customer.id);
  assert(member?.founder_status === "confirmado" && member.founder_number === numberExpected, `Founder ${numberExpected}`);
}
const iara = protectedCustomers.find((row) => row.legacy_id === "iara")!;
const iaraMember = protectedMembers.find((row) => row.customer_id === iara.id);
assert(iaraMember?.founder_status === "selecionado" && !iaraMember.founder_number, "Iara/vaga 004");
assert(iaraMember.owner === "Rodrigo" && number(iaraMember.priority) === 3, "responsável/prioridade Iara");
assert(iaraMember.commercial_notes === "Contato comercial validado" && iaraMember.next_action === "Aguardar retorno da Iara", "campos comerciais Iara");
assert(["2026-08-04T18:00:00+00:00", "2026-08-04T18:00:00Z"].includes(text(iaraMember.next_action_at)), "data Iara");
assert(protectedSubscriptions.length === 4, `assinaturas protegidas=${protectedSubscriptions.length}`);
assert(audits.filter((row) => row.actor === SCORE_ACTOR).length === 0, "auditorias desnecessárias do score");
console.log(JSON.stringify({
  snapshots: scores.length,
  uniqueCustomers: scoreByCustomer.size,
  distribution,
  strongCandidatesValidated: strong.length,
  samples: { scoreZero: true, vehicleUndefined: true, oldAttendance: true, invalidPhone: true, benedito: true, jose: true, rikardo: true, iara: true },
  protectedCommercialPreserved: true,
  protectedSubscriptions: protectedSubscriptions.length,
  scoreAudits: 0,
  customersStillAvailable: customers.length,
}, null, 2));
