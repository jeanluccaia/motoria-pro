#!/usr/bin/env node
/**
 * CLI READ-ONLY: gera relatório de candidatos CRM para reconciliação humana
 * dos customers PagBank do snapshot atual.
 *
 * Uso:
 *   node --env-file=.env.local --conditions=react-server --experimental-strip-types \
 *     scripts/build-pagbank-reconciliation-report.ts \
 *     --file=.data/pagbank/subscriptions-2026-09-01.json \
 *     --out=.data/pagbank/customer-reconciliation-2026-09-01.json
 *
 * ZERO writes no banco. Só leitura em crm_customers/vehicles/subscriptions.
 * O arquivo emitido é `.data/` (gitignored).
 *
 * Estratégias de candidato (todas requerem aprovação humana):
 *  - EXACT_NAME       — string idêntica (raro; nomes CRM são Title Case)
 *  - NORMALIZED_NAME  — normalizeName idêntico após lowercase/sem-acento
 *  - CLOSE_NAME       — sobreposição de tokens (score ≥ 0.6) ou tokens do
 *                       CRM candidate totalmente contidos no nome PagBank
 *                       (ou vice-versa)
 * Todas as candidaturas exigem revisão humana. NENHUMA é auto-aprovada.
 */
import { writeFileSync } from "node:fs";
import { loadPagBankFile } from "../lib/portal/pagbank-import/parser.ts";
import { normalizeName } from "../lib/portal/pagbank-import/matcher.ts";
import type {
  PagBankSubscriptionInput,
  ReconciliationCandidate,
  ReconciliationCandidateStatus,
  ReconciliationEntry,
  ReconciliationFile,
  ReconciliationMatchType,
} from "../lib/portal/pagbank-import/types.ts";
import { getSupabaseAdminClient } from "../lib/growth/db/admin-client.ts";

interface Args {
  file: string;
  out: string;
  minScore: number;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let file = "";
  let out = "";
  let minScore = 0.6;
  for (const arg of argv) {
    if (arg.startsWith("--file=")) file = arg.slice("--file=".length);
    else if (arg.startsWith("--out=")) out = arg.slice("--out=".length);
    else if (arg.startsWith("--min-score=")) minScore = Number(arg.slice("--min-score=".length));
    else if (arg === "--help" || arg === "-h") {
      console.log(
        "uso: --file=<subscriptions.json> --out=<reconciliation.json> [--min-score=0.6]",
      );
      process.exit(0);
    }
  }
  if (!file || !out) {
    console.error("Erro: --file e --out obrigatórios.");
    process.exit(2);
  }
  return { file, out, minScore };
}

interface CrmCustomerRow {
  id: string;
  name: string;
  normalized_name: string;
  normalized_phone: string | null;
  service_count: number | null;
  historical_value: number | null;
  last_service_at: string | null;
}

function tokenize(s: string): string[] {
  return normalizeName(s)
    .split(" ")
    .filter((t) => t.length >= 3);
}

function scoreCandidate(
  pagbankName: string,
  crmName: string,
): { matchType: ReconciliationMatchType | null; score: number; matchedTokens: string[] } {
  if (pagbankName === crmName) {
    return { matchType: "EXACT_NAME", score: 1, matchedTokens: tokenize(pagbankName) };
  }
  const pTokens = new Set(tokenize(pagbankName));
  const cTokens = new Set(tokenize(crmName));
  if (pTokens.size === 0 || cTokens.size === 0) return { matchType: null, score: 0, matchedTokens: [] };

  if (normalizeName(pagbankName) === normalizeName(crmName)) {
    return {
      matchType: "NORMALIZED_NAME",
      score: 1,
      matchedTokens: [...pTokens],
    };
  }

  const intersection = [...pTokens].filter((t) => cTokens.has(t));
  const union = new Set([...pTokens, ...cTokens]);
  const jaccard = union.size === 0 ? 0 : intersection.length / union.size;
  const containment = Math.min(
    intersection.length / pTokens.size,
    intersection.length / cTokens.size,
  );
  const score = Math.max(jaccard, containment);

  return {
    matchType: "CLOSE_NAME",
    score,
    matchedTokens: intersection,
  };
}

function maskPhone(normalized: string | null): string | null {
  if (!normalized) return null;
  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 4) return null;
  const ddd = digits.slice(0, 2);
  const tail = digits.slice(-2);
  return `DDD ${ddd} ****-${tail}`;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const file = loadPagBankFile(args.file);

  const uniqueByPcid = new Map<string, PagBankSubscriptionInput[]>();
  for (const s of file.subscriptions) {
    if (!s.provider_customer_id) continue;
    const list = uniqueByPcid.get(s.provider_customer_id) ?? [];
    list.push(s);
    uniqueByPcid.set(s.provider_customer_id, list);
  }

  console.log(`\n=== Reconciliation report ===`);
  console.log(`Snapshot:   ${args.file}`);
  console.log(`Customers:  ${uniqueByPcid.size} PagBank únicos`);
  console.log(`Min-score:  ${args.minScore} (CLOSE_NAME)`);

  const supabase = getSupabaseAdminClient("pagbank.reconciliation");

  // Carrega todos os customers CRM (paginação por range — supera o default 1000).
  const allCustomers: CrmCustomerRow[] = [];
  const pageSize = 1000;
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase
      .from("crm_customers")
      .select(
        "id, name, normalized_name, normalized_phone, service_count, historical_value, last_service_at",
      )
      .range(start, start + pageSize - 1);
    if (error) throw new Error(`Supabase crm_customers falhou: ${error.message}`);
    const page = (data ?? []) as CrmCustomerRow[];
    allCustomers.push(...page);
    if (page.length < pageSize) break;
  }
  console.log(`CRM base:   ${allCustomers.length} customers carregados\n`);

  const entries: ReconciliationEntry[] = [];

  for (const [pcid, subs] of uniqueByPcid) {
    const pagbankName = subs[0]!.customer_name;

    const scored = allCustomers
      .map((c) => {
        const s = scoreCandidate(pagbankName, c.name);
        return { row: c, ...s };
      })
      .filter((x) => {
        if (x.matchType === null) return false;
        if (x.matchType === "EXACT_NAME" || x.matchType === "NORMALIZED_NAME") return true;
        return x.score >= args.minScore;
      })
      .sort((a, b) => b.score - a.score);

    const enriched: ReconciliationCandidate[] = [];
    for (const s of scored) {
      const ctx = await loadCrmContext(supabase, s.row.id);
      enriched.push({
        crm_customer_id: s.row.id,
        match_type: s.matchType!,
        match_score: Number(s.score.toFixed(3)),
        matched_tokens: s.matchedTokens,
        name: s.row.name,
        masked_phone: maskPhone(s.row.normalized_phone),
        vehicles_count: ctx.vehiclesCount,
        subscriptions_count: ctx.subscriptionsCount,
        historical_value: Number(s.row.historical_value ?? 0),
        last_service_at: s.row.last_service_at,
        plan_signal: ctx.planSignal,
      });
    }

    let candidateStatus: ReconciliationCandidateStatus;
    if (enriched.length === 0) candidateStatus = "NO_CANDIDATE";
    else if (enriched.length === 1) candidateStatus = "EXACT_CANDIDATE";
    else candidateStatus = "MULTIPLE_CANDIDATES";

    entries.push({
      provider_customer_id: pcid,
      pagbank_name: pagbankName,
      subscription_count: subs.length,
      candidates: enriched,
      candidate_status: candidateStatus,
      approved_crm_customer_id: null,
      decision: "PENDING",
    });
  }

  const out: ReconciliationFile = {
    meta: {
      generated_at: new Date().toISOString(),
      source: args.file,
    },
    entries,
  };

  writeFileSync(args.out, JSON.stringify(out, null, 2));

  const counts = { EXACT_CANDIDATE: 0, MULTIPLE_CANDIDATES: 0, NO_CANDIDATE: 0 };
  for (const e of entries) counts[e.candidate_status] += 1;
  console.log(`EXACT_CANDIDATE:     ${counts.EXACT_CANDIDATE}`);
  console.log(`MULTIPLE_CANDIDATES: ${counts.MULTIPLE_CANDIDATES}`);
  console.log(`NO_CANDIDATE:        ${counts.NO_CANDIDATE}`);
  console.log("");
  console.log("--- POR CUSTOMER PAGBANK ---");
  for (const e of entries) {
    const desc = e.candidates
      .map((c) => `${c.name} [${c.match_type} ${c.match_score.toFixed(2)}]`)
      .join(" | ");
    console.log(
      `• ${e.pagbank_name} · ${e.provider_customer_id} · ${e.subscription_count} contrato(s) → ${e.candidate_status}${desc ? ": " + desc : ""}`,
    );
  }
  console.log("");
  console.log(`Escrito em: ${args.out}`);
  console.log(`Ação humana: revisar cada entry, preencher approved_crm_customer_id + decision.`);
  console.log("");
}

async function loadCrmContext(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  customerId: string,
): Promise<{ vehiclesCount: number; subscriptionsCount: number; planSignal: string | null }> {
  const [{ count: vehiclesCount }, subsResult] = await Promise.all([
    supabase
      .from("crm_vehicles")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId),
    supabase
      .from("crm_subscriptions")
      .select("subscription_plan, is_active_subscriber")
      .eq("customer_id", customerId),
  ]);

  const subs = (subsResult.data ?? []) as {
    subscription_plan: string | null;
    is_active_subscriber: boolean;
  }[];
  const activePlans = subs
    .filter((s) => s.is_active_subscriber)
    .map((s) => s.subscription_plan)
    .filter(Boolean) as string[];
  const planSignal = activePlans.length > 0 ? [...new Set(activePlans)].join("+") : null;

  return {
    vehiclesCount: vehiclesCount ?? 0,
    subscriptionsCount: subs.length,
    planSignal,
  };
}

main().catch((error) => {
  console.error(`\n[erro] ${(error as Error).message}\n`);
  process.exit(1);
});
