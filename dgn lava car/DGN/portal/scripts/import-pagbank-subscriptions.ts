#!/usr/bin/env node
/**
 * CLI: importa contratos PagBank para o CRM.
 *
 * Uso:
 *   node --experimental-strip-types scripts/import-pagbank-subscriptions.ts \
 *     --file=.data/pagbank/subscriptions.json [--apply]
 *
 * Padrão: dry-run. Nunca modifica o banco sem --apply.
 * O arquivo real do PagBank DEVE viver em .data/ (gitignored).
 * A fixture sintética em lib/portal/pagbank-import/fixtures/synthetic-batch.json
 * é apenas para dry-run demonstrativo — nenhum dado real.
 */
import { loadPagBankFile } from "../lib/portal/pagbank-import/parser.ts";
import {
  runPagBankImport,
  buildMatchIndexes,
  type ExistingSubscription,
} from "../lib/portal/pagbank-import/importer.ts";
import { normalizePhone } from "../lib/portal/pagbank-import/matcher.ts";
import type { CustomerCandidate, ImportSummary } from "../lib/portal/pagbank-import/types.ts";
import { getSupabaseAdminClient } from "../lib/growth/db/admin-client.ts";

interface Args {
  file: string;
  apply: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let file = "";
  let apply = false;
  for (const arg of argv) {
    if (arg.startsWith("--file=")) file = arg.slice("--file=".length);
    else if (arg === "--apply") apply = true;
    else if (arg === "--dry-run") apply = false;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  if (!file) {
    console.error("Erro: --file=<path> obrigatório.");
    printHelp();
    process.exit(2);
  }
  return { file, apply };
}

function printHelp(): void {
  console.log(`
Uso:
  scripts/import-pagbank-subscriptions.ts --file=<path> [--apply]

Flags:
  --file=<path>   Caminho para o arquivo JSON/CSV com contratos PagBank.
  --apply         Persiste no banco (Supabase). Sem essa flag, roda em dry-run.
  --dry-run       Explicita dry-run (default).
  --help          Este ajuda.

Regras:
  - Arquivo real NUNCA no git. Use .data/pagbank/... (gitignored).
  - Idempotência via provider_subscription_id.
  - Matching: provider_id > cpf > telefone > interno > nome (nome nunca auto-merge).
  - David-like (2 subs sem veículo distinto): financial_review_required.
  - José-like (2 subs, veículos distintos): matched normalmente.
`);
}

async function main(): Promise<void> {
  const args = parseArgs();
  const file = loadPagBankFile(args.file);

  console.log(`\n=== Importador PagBank ===`);
  console.log(`Arquivo:   ${args.file}`);
  console.log(`Origem:    ${file.meta.source}`);
  console.log(`Modo:      ${args.apply ? "APPLY (persiste no banco)" : "DRY-RUN (sem escrita)"}`);
  console.log(`Contratos: ${file.subscriptions.length}`);
  if (file.meta.expected_customers) {
    console.log(`Esperado:  ${file.meta.expected_customers} customers · ${file.meta.expected_contracts ?? "?"} contratos · R$ ${file.meta.expected_total_amount_monthly ?? "?"}/mês`);
  }
  console.log("");

  // Carrega índices atuais do CRM (só quando --apply ou quando quisermos
  // relatório contra a base real; dry-run também vai contra o Supabase para
  // dar preview realista).
  const { indexes, existingByProviderId, existingByCustomer } = await loadCrmIndexes();

  const summary = runPagBankImport({
    file,
    indexes,
    existingSubscriptionsByProviderId: existingByProviderId,
    existingSubscriptionsByCustomerId: existingByCustomer,
    mode: args.apply ? "apply" : "dry_run",
    sourceLabel: args.file,
  });

  printSummary(summary);

  if (!args.apply) {
    console.log("\n[dry-run] Nenhuma escrita foi feita. Rode com --apply para persistir.\n");
    return;
  }

  await applyChanges(summary);
  console.log("\n[apply] Persistência concluída.\n");
}

async function loadCrmIndexes(): Promise<{
  indexes: ReturnType<typeof buildMatchIndexes>;
  existingByProviderId: Map<string, ExistingSubscription>;
  existingByCustomer: Map<string, ExistingSubscription[]>;
}> {
  try {
    const supabase = getSupabaseAdminClient("pagbank.import");

    const { data: customers, error: cErr } = await supabase
      .from("crm_customers")
      .select("id, legacy_id, name, normalized_phone, email");
    if (cErr) throw cErr;

    const { data: subs, error: sErr } = await supabase
      .from("crm_subscriptions")
      .select("id, customer_id, provider_subscription_id, subscription_plan, is_active_subscriber");
    if (sErr) throw sErr;

    const candidates: CustomerCandidate[] = (customers ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      legacy_id: c.legacy_id,
      normalized_phone: c.normalized_phone,
      email: c.email,
    }));
    const indexes = buildMatchIndexes(candidates);

    const existingByProviderId = new Map<string, ExistingSubscription>();
    const existingByCustomer = new Map<string, ExistingSubscription[]>();
    for (const s of subs ?? []) {
      const row: ExistingSubscription = {
        id: s.id,
        customer_id: s.customer_id,
        provider_subscription_id: s.provider_subscription_id,
        plan: s.subscription_plan,
        is_active_subscriber: !!s.is_active_subscriber,
      };
      if (row.provider_subscription_id) {
        existingByProviderId.set(row.provider_subscription_id, row);
      }
      const list = existingByCustomer.get(row.customer_id) ?? [];
      list.push(row);
      existingByCustomer.set(row.customer_id, list);
    }
    return { indexes, existingByProviderId, existingByCustomer };
  } catch (error) {
    console.warn(`[pagbank.import] falha ao carregar CRM (roda offline): ${(error as Error).message}`);
    return {
      indexes: buildMatchIndexes([]),
      existingByProviderId: new Map(),
      existingByCustomer: new Map(),
    };
  }
}

function printSummary(summary: ImportSummary): void {
  const t = summary.totals;
  console.log("--- RESUMO ---");
  console.log(`Rows lidas:              ${t.input_rows}`);
  console.log(`Matched:                 ${t.matched}`);
  console.log(`Review required:         ${t.review_required}`);
  console.log(`Unmatched (novos):       ${t.unmatched}`);
  console.log(`Duplicates (idempot.):   ${t.duplicates}`);
  console.log(`Erros:                   ${t.errors}`);
  console.log(`Total mensal bruto:      R$ ${t.total_amount_monthly.toFixed(2).replace(".", ",")}`);
  console.log(`Customers únicos:        ${t.unique_customers_touched}`);
  console.log(`Would create customers:  ${t.customers_would_create}`);
  console.log(`Would create vehicles:   ${t.vehicles_would_create}`);
  console.log(`Would create subs:       ${t.subscriptions_would_create}`);
  console.log(`Would update subs:       ${t.subscriptions_would_update}`);
  console.log(`Financial reviews:       ${t.financial_reviews_flagged}`);
  console.log("");

  // Detalha os que exigem atenção.
  const attention = summary.rows.filter(
    (r) => r.outcome === "review_required" || r.outcome === "error",
  );
  if (attention.length > 0) {
    console.log("--- ATENÇÃO (review / erro) ---");
    for (const r of attention) {
      console.log(`• ${r.input.customer_name} [${r.outcome}] — ${r.notice ?? r.match.reason}`);
    }
    console.log("");
  }

  // Amostra dos unmatched.
  const unmatched = summary.rows.filter((r) => r.outcome === "unmatched");
  if (unmatched.length > 0 && unmatched.length <= 20) {
    console.log("--- UNMATCHED (novos customers) ---");
    for (const r of unmatched) {
      const phone = r.input.customer_phone ? `phone ${normalizePhone(r.input.customer_phone)}` : "sem phone";
      console.log(`• ${r.input.customer_name} · ${r.input.plan} · ${phone}`);
    }
    console.log("");
  } else if (unmatched.length > 20) {
    console.log(`--- UNMATCHED: ${unmatched.length} novos customers (lista omitida) ---\n`);
  }
}

async function applyChanges(_summary: ImportSummary): Promise<void> {
  // TODO (bloqueado por aprovação): persistência real ainda não implementada.
  // Nesta primeira execução P0, o --apply devolve erro para forçar revisão do
  // dry-run antes. Quando o brief autorizar, o apply chama getSupabaseAdminClient()
  // e executa create_customer / create_vehicle / create_subscription conforme
  // ImportRowOutcome.actions.
  throw new Error(
    "[--apply] Persistência bloqueada nesta primeira rodada. Aprovar dry-run antes.",
  );
}

main().catch((error) => {
  console.error(`\n[erro] ${(error as Error).message}\n`);
  process.exit(1);
});
