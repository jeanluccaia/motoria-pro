#!/usr/bin/env node
/**
 * CLI: importa contratos PagBank para o CRM (idempotente, auditável).
 *
 * Uso:
 *   node --env-file=.env.local --conditions=react-server --experimental-strip-types \
 *     scripts/import-pagbank-subscriptions.ts \
 *     --file=.data/pagbank/subscriptions.json \
 *     [--reconciliation=.data/pagbank/customer-reconciliation-2026-09-01.json] \
 *     [--apply]
 *
 * Padrão: dry-run. Nunca modifica o banco sem --apply.
 * O arquivo real do PagBank DEVE viver em .data/ (gitignored).
 * O arquivo de reconciliação também é local, gitignored, e alimenta:
 *   - APPROVED     → mapping provider_customer_id → CRM customer existente
 *   - NEW_CUSTOMER → planned create com nome canônico
 *   - subscription_overrides → placa/veículo por contrato (evidência 4uCar)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPagBankFile } from "../lib/portal/pagbank-import/parser.ts";
import {
  runPagBankImport,
  buildMatchIndexes,
  applyReconciledMappings,
  type ExistingSubscription,
  type ReconciledMapping,
} from "../lib/portal/pagbank-import/importer.ts";
import type {
  CustomerCandidate,
  ImportAction,
  ImportRowOutcome,
  ImportSummary,
  ReconciliationFile,
  ReconciliationSubscriptionOverride,
} from "../lib/portal/pagbank-import/types.ts";
import type { PlannedNewCustomer } from "../lib/portal/pagbank-import/matcher.ts";
import { getSupabaseAdminClient } from "../lib/growth/db/admin-client.ts";
import { normalizeName, normalizePlate } from "../lib/growth/db/normalizers.ts";

const IMPORT_ACTOR = "importer:pagbank-p0";
const IMPORT_SOURCE = "pagbank:snapshot-2026-09-01";

interface Args {
  file: string;
  reconciliation?: string;
  apply: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let file = "";
  let reconciliation: string | undefined;
  let apply = false;
  for (const arg of argv) {
    if (arg.startsWith("--file=")) file = arg.slice("--file=".length);
    else if (arg.startsWith("--reconciliation=")) reconciliation = arg.slice("--reconciliation=".length);
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
  return { file, reconciliation, apply };
}

function printHelp(): void {
  console.log(`
Uso:
  scripts/import-pagbank-subscriptions.ts --file=<path> [--reconciliation=<path>] [--apply]

Flags:
  --file=<path>              Arquivo JSON/CSV com contratos PagBank.
  --reconciliation=<path>    Arquivo de reconciliação humana (opcional mas exigido em --apply).
                             Suporta decision APPROVED e NEW_CUSTOMER + subscription_overrides.
  --apply                    Persiste no banco (Supabase). Default: dry-run.
  --dry-run                  Explicita dry-run (default).
  --help                     Este ajuda.

Gate de segurança para --apply (bloqueia se qualquer condição falhar):
  - todos os provider_customer_ids resolvidos (0 pending_reconciliation);
  - 0 errors;
  - todos os row outcomes ∈ { matched, new_customer_planned, duplicate }.

Regras P0:
  - Arquivo real NUNCA no git. Use .data/pagbank/... (gitignored).
  - Idempotência via provider_subscription_id.
  - Prioridade de match: reconciliation > provider_id > cpf > telefone > nome.
  - Nome sozinho NUNCA auto-merge. UNMATCHED nunca auto-cria customer.
  - David-like (2+ subs sem placa distinta) → financial_review_required=true.
  - José-like: multi_contract_decision=APPROVED_HUMAN_WITH_OPERATIONAL_EVIDENCE
    + subscription_overrides por contrato → cria 2 vehicles e vincula.
`);
}

interface LoadedReconciliation {
  approvedMappings: ReconciledMapping[];
  plannedNewCustomers: Map<string, PlannedNewCustomer>;
  subscriptionOverrides: Map<string, ReconciliationSubscriptionOverride>;
}

function loadReconciliation(path: string): LoadedReconciliation {
  const raw = JSON.parse(readFileSync(path, "utf8")) as ReconciliationFile;
  const approvedMappings: ReconciledMapping[] = [];
  const plannedNewCustomers = new Map<string, PlannedNewCustomer>();
  const subscriptionOverrides = new Map<string, ReconciliationSubscriptionOverride>();

  for (const entry of raw.entries ?? []) {
    if (entry.decision === "APPROVED") {
      if (!entry.approved_crm_customer_id) {
        throw new Error(
          `Reconciliação ${entry.provider_customer_id} tem decision=APPROVED mas approved_crm_customer_id=null.`,
        );
      }
      if (!entry.decision_source) {
        throw new Error(
          `Reconciliação ${entry.provider_customer_id} APPROVED sem decision_source.`,
        );
      }
      const cand = (entry.candidates ?? []).find(
        (c) => c.crm_customer_id === entry.approved_crm_customer_id,
      );
      approvedMappings.push({
        provider_customer_id: entry.provider_customer_id,
        crm_customer_id: entry.approved_crm_customer_id,
        crm_customer_name:
          cand?.name ?? entry.approved_crm_customer_name ?? entry.pagbank_name,
      });
      continue;
    }
    if (entry.decision === "NEW_CUSTOMER") {
      if (!entry.decision_source) {
        throw new Error(
          `Reconciliação ${entry.provider_customer_id} NEW_CUSTOMER sem decision_source.`,
        );
      }
      const canonical = entry.new_customer_name?.trim() || toTitleCase(entry.pagbank_name);
      plannedNewCustomers.set(entry.provider_customer_id, {
        name: canonical,
        decisionSource: entry.decision_source,
        multiContractDecision: entry.multi_contract_decision ?? null,
      });
      for (const ov of entry.subscription_overrides ?? []) {
        subscriptionOverrides.set(ov.provider_subscription_id, ov);
      }
      continue;
    }
    // PENDING / REJECTED → ignorado silenciosamente.
  }
  return { approvedMappings, plannedNewCustomers, subscriptionOverrides };
}

function toTitleCase(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/(^|\s)(\p{L})/gu, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
}

async function main(): Promise<void> {
  const args = parseArgs();
  const file = loadPagBankFile(args.file);

  console.log(`\n=== Importador PagBank ===`);
  console.log(`Arquivo:         ${args.file}`);
  console.log(`Origem:          ${file.meta.source}`);
  console.log(`Reconciliação:   ${args.reconciliation ?? "(nenhuma)"}`);
  console.log(`Modo:            ${args.apply ? "APPLY (persiste no banco)" : "DRY-RUN (sem escrita)"}`);
  console.log(`Contratos:       ${file.subscriptions.length}`);
  if (file.meta.expected_customers) {
    console.log(
      `Esperado:        ${file.meta.expected_customers} customers · ${file.meta.expected_contracts ?? "?"} contratos · R$ ${file.meta.expected_total_amount_monthly ?? "?"}/mês`,
    );
  }
  console.log("");

  const { indexes, existingByProviderId, existingByCustomer, offline } = await loadCrmIndexes();

  if (args.reconciliation) {
    const rec = loadReconciliation(args.reconciliation);
    applyReconciledMappings(indexes, rec.approvedMappings);
    for (const [pcid, planned] of rec.plannedNewCustomers) {
      indexes.plannedNewCustomers.set(pcid, planned);
    }
    for (const [psid, ov] of rec.subscriptionOverrides) {
      indexes.subscriptionOverrides.set(psid, ov);
    }
    console.log(
      `[reconciliation] APPROVED=${rec.approvedMappings.length} · NEW_CUSTOMER=${rec.plannedNewCustomers.size} · overrides=${rec.subscriptionOverrides.size}\n`,
    );
  }

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

  if (offline) {
    throw new Error(
      "[--apply] Banco indisponível — dry-run rodou offline. Corrija credenciais Supabase e tente novamente.",
    );
  }

  enforceApplyGates(summary);

  await applyChanges(summary);
  console.log("\n[apply] Persistência concluída.\n");
}

async function loadCrmIndexes(): Promise<{
  indexes: ReturnType<typeof buildMatchIndexes>;
  existingByProviderId: Map<string, ExistingSubscription>;
  existingByCustomer: Map<string, ExistingSubscription[]>;
  offline: boolean;
}> {
  try {
    const supabase = getSupabaseAdminClient("pagbank.import");

    const customers = await fetchAll<{
      id: string;
      legacy_id: string | null;
      name: string;
      normalized_phone: string | null;
      email: string | null;
    }>(supabase, "crm_customers", "id, legacy_id, name, normalized_phone, email");

    const subs = await fetchAll<{
      id: string;
      customer_id: string;
      provider_customer_id: string | null;
      provider_subscription_id: string | null;
      subscription_plan: string | null;
      is_active_subscriber: boolean;
    }>(
      supabase,
      "crm_subscriptions",
      "id, customer_id, provider_customer_id, provider_subscription_id, subscription_plan, is_active_subscriber",
    );

    const providerCustomerByCustomerId = new Map<string, string>();
    for (const s of subs) {
      if (s.provider_customer_id && !providerCustomerByCustomerId.has(s.customer_id)) {
        providerCustomerByCustomerId.set(s.customer_id, s.provider_customer_id);
      }
    }

    const candidates: CustomerCandidate[] = customers.map((c) => ({
      id: c.id,
      name: c.name,
      legacy_id: c.legacy_id,
      normalized_phone: c.normalized_phone,
      email: c.email,
      provider_customer_id: providerCustomerByCustomerId.get(c.id) ?? null,
    }));
    const indexes = buildMatchIndexes(candidates);

    const existingByProviderId = new Map<string, ExistingSubscription>();
    const existingByCustomer = new Map<string, ExistingSubscription[]>();
    for (const s of subs) {
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
    return { indexes, existingByProviderId, existingByCustomer, offline: false };
  } catch (error) {
    console.warn(`[pagbank.import] falha ao carregar CRM (roda offline): ${(error as Error).message}`);
    return {
      indexes: buildMatchIndexes([]),
      existingByProviderId: new Map(),
      existingByCustomer: new Map(),
      offline: true,
    };
  }
}

async function fetchAll<T>(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  table: string,
  select: string,
): Promise<T[]> {
  const out: T[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const rows = (data ?? []) as unknown as T[];
    out.push(...rows);
    if (rows.length < pageSize) return out;
  }
}

function printSummary(summary: ImportSummary): void {
  const t = summary.totals;
  console.log("--- RESUMO ---");
  console.log(`Rows lidas:                    ${t.input_rows}`);
  console.log(`Provider customers únicos:     ${t.unique_provider_customers}`);
  console.log(`Matched:                       ${t.matched}`);
  console.log(`New customer planned:          ${t.new_customers_would_create}`);
  console.log(`Review required:               ${t.review_required}`);
  console.log(`Pending reconciliation (rows): ${t.pending_reconciliation_rows}`);
  console.log(`Pending reconciliation (cust): ${t.pending_reconciliation_customers}`);
  console.log(`Duplicates (idempot.):         ${t.duplicates}`);
  console.log(`Erros:                         ${t.errors}`);
  console.log(`Total mensal bruto:            R$ ${t.total_amount_monthly.toFixed(2).replace(".", ",")}`);
  console.log(`Customers CRM tocados:         ${t.unique_customers_touched}`);
  console.log(`Would create vehicles:         ${t.vehicles_would_create}`);
  console.log(`Would create subs:             ${t.subscriptions_would_create}`);
  console.log(`Would update subs:             ${t.subscriptions_would_update}`);
  console.log(`Financial reviews (customers): ${t.financial_reviews_flagged}`);
  console.log("");

  const attention = summary.rows.filter(
    (r) => r.outcome === "review_required" || r.outcome === "error",
  );
  if (attention.length > 0) {
    console.log("--- REVIEW / ERRO ---");
    for (const r of attention) {
      console.log(`• ${r.input.customer_name} · ${r.input.provider_subscription_id} [${r.outcome}] — ${r.notice ?? r.match.reason}`);
    }
    console.log("");
  }

  const financialReview = summary.rows.filter((r) =>
    r.actions.some((a) => a.kind === "flag_financial_review"),
  );
  if (financialReview.length > 0) {
    console.log("--- FINANCIAL REVIEW REQUIRED ---");
    const seen = new Set<string>();
    for (const r of financialReview) {
      const pcid = r.input.provider_customer_id ?? "(sem pcid)";
      if (seen.has(pcid)) continue;
      seen.add(pcid);
      const flag = r.actions.find((a): a is Extract<ImportAction, { kind: "flag_financial_review" }> => a.kind === "flag_financial_review");
      console.log(`• ${r.input.customer_name} · ${pcid} — ${flag?.reason ?? ""}`);
    }
    console.log("");
  }

  const pending = summary.rows.filter((r) => r.outcome === "pending_reconciliation");
  if (pending.length > 0 && pending.length <= 30) {
    console.log("--- PENDING RECONCILIATION ---");
    const grouped = new Map<string, typeof pending>();
    for (const r of pending) {
      const key = r.input.provider_customer_id ?? "(sem pcid)";
      const list = grouped.get(key) ?? [];
      list.push(r);
      grouped.set(key, list);
    }
    for (const [pcid, subs] of grouped) {
      const first = subs[0]!.input;
      console.log(
        `• ${first.customer_name} · ${pcid} · ${subs.length} contrato(s) · plano(s): ${subs.map((s) => s.input.plan).join("+")}`,
      );
    }
    console.log("");
  } else if (pending.length > 30) {
    console.log(`--- PENDING RECONCILIATION: ${pending.length} rows (lista omitida) ---\n`);
  }

  const newCustomers = summary.rows.filter((r) => r.outcome === "new_customer_planned");
  if (newCustomers.length > 0) {
    console.log("--- NEW_CUSTOMER (planned create) ---");
    const seen = new Set<string>();
    for (const r of newCustomers) {
      const pcid = r.input.provider_customer_id ?? "(sem pcid)";
      if (seen.has(pcid)) continue;
      seen.add(pcid);
      const create = r.actions.find((a): a is Extract<ImportAction, { kind: "create_customer" }> => a.kind === "create_customer");
      console.log(`• ${create?.name ?? r.input.customer_name} · ${pcid} · source=${create?.decisionSource ?? "?"}`);
    }
    console.log("");
  }
}

function enforceApplyGates(summary: ImportSummary): void {
  const t = summary.totals;
  const problems: string[] = [];
  if (t.errors > 0) problems.push(`errors=${t.errors}`);
  if (t.pending_reconciliation_customers > 0)
    problems.push(`pending_reconciliation_customers=${t.pending_reconciliation_customers}`);
  if (t.pending_reconciliation_rows > 0)
    problems.push(`pending_reconciliation_rows=${t.pending_reconciliation_rows}`);

  for (const r of summary.rows) {
    if (!isRowApplyable(r)) {
      problems.push(
        `row ${r.input.provider_subscription_id} outcome=${r.outcome} não é aplicável (sem link + create/update de sub)`,
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `[--apply] Gate de segurança falhou:\n  - ${problems.join("\n  - ")}`,
    );
  }
}

function isRowApplyable(r: ImportRowOutcome): boolean {
  const hasLink = r.actions.some(
    (a) => a.kind === "link_existing_customer" || a.kind === "create_customer",
  );
  const hasCreateSub = r.actions.some((a) => a.kind === "create_subscription");
  const hasUpdateSub = r.actions.some((a) => a.kind === "update_subscription");
  const hasFinancialReview = r.actions.some((a) => a.kind === "flag_financial_review");
  const hasAwaitReconciliation = r.actions.some((a) => a.kind === "await_reconciliation");
  if (hasAwaitReconciliation) return false;
  if (r.outcome === "duplicate") return hasUpdateSub;
  if (r.outcome === "matched" || r.outcome === "new_customer_planned")
    return hasLink && hasCreateSub;
  // review_required só é aplicável quando a demoção veio de match confiável +
  // financial_review (David-like). Nunca aplicar sem link + flag explícita.
  if (r.outcome === "review_required")
    return hasLink && hasCreateSub && hasFinancialReview;
  return false;
}

// ---------------------------------------------------------------------------
// Persistência (--apply). Idempotente por (provider_subscription_id) em subs,
// (provider_customer_id) em customer criado por PagBank, e (customer_id,
// normalized_plate) em veículos.
// ---------------------------------------------------------------------------

interface ApplyReport {
  startedAt: string;
  finishedAt: string;
  customersCreated: number;
  customersLinked: number;
  vehiclesCreated: number;
  vehiclesReused: number;
  subscriptionsCreated: number;
  subscriptionsUpdated: number;
  financialReviewsFlagged: number;
  rows: Array<{
    provider_subscription_id: string;
    outcome: string;
    customer_id: string | null;
    vehicle_id: string | null;
    subscription_id: string | null;
    financial_review_required: boolean;
  }>;
  errors: string[];
}

async function applyChanges(summary: ImportSummary): Promise<void> {
  const supabase = getSupabaseAdminClient("pagbank.apply");
  const report: ApplyReport = {
    startedAt: new Date().toISOString(),
    finishedAt: "",
    customersCreated: 0,
    customersLinked: 0,
    vehiclesCreated: 0,
    vehiclesReused: 0,
    subscriptionsCreated: 0,
    subscriptionsUpdated: 0,
    financialReviewsFlagged: 0,
    rows: [],
    errors: [],
  };

  const plannedCustomerIdByPcid = new Map<string, string>();

  for (const row of summary.rows) {
    try {
      const result = await applyRow(supabase, row, plannedCustomerIdByPcid);
      report.rows.push({
        provider_subscription_id: row.input.provider_subscription_id,
        outcome: row.outcome,
        customer_id: result.customerId,
        vehicle_id: result.vehicleId,
        subscription_id: result.subscriptionId,
        financial_review_required: result.financialReviewRequired,
      });
      report.customersCreated += result.customerCreated ? 1 : 0;
      report.customersLinked += result.customerCreated ? 0 : result.customerId ? 1 : 0;
      report.vehiclesCreated += result.vehicleCreated ? 1 : 0;
      report.vehiclesReused += result.vehicleId && !result.vehicleCreated ? 1 : 0;
      report.subscriptionsCreated += result.subscriptionAction === "created" ? 1 : 0;
      report.subscriptionsUpdated += result.subscriptionAction === "updated" ? 1 : 0;
      if (result.financialReviewRequired) report.financialReviewsFlagged += 1;
    } catch (error) {
      const msg = `row ${row.input.provider_subscription_id}: ${(error as Error).message}`;
      report.errors.push(msg);
      console.error(`[apply] ${msg}`);
      throw error; // Aborta em qualquer erro — preserva idempotência.
    }
  }

  report.finishedAt = new Date().toISOString();

  const reportDir = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../.data/pagbank/reports",
  );
  await mkdir(reportDir, { recursive: true });
  const reportPath = resolve(
    reportDir,
    `apply-${report.finishedAt.replace(/[:.]/g, "-")}.json`,
  );
  await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log("\n--- APPLY REPORT ---");
  console.log(`Customers criados:            ${report.customersCreated}`);
  console.log(`Customers linkados:           ${report.customersLinked}`);
  console.log(`Vehicles criados:             ${report.vehiclesCreated}`);
  console.log(`Vehicles reutilizados:        ${report.vehiclesReused}`);
  console.log(`Subscriptions criadas:        ${report.subscriptionsCreated}`);
  console.log(`Subscriptions atualizadas:    ${report.subscriptionsUpdated}`);
  console.log(`Financial reviews flagged:    ${report.financialReviewsFlagged}`);
  console.log(`Relatório:                    ${reportPath}`);
}

interface ApplyRowResult {
  customerId: string | null;
  customerCreated: boolean;
  vehicleId: string | null;
  vehicleCreated: boolean;
  subscriptionId: string | null;
  subscriptionAction: "created" | "updated" | "none";
  financialReviewRequired: boolean;
}

async function applyRow(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  row: ImportRowOutcome,
  plannedCustomerIdByPcid: Map<string, string>,
): Promise<ApplyRowResult> {
  const input = row.input;

  // 1. Duplicate → só atualiza a subscription existente com campos PagBank.
  if (row.outcome === "duplicate") {
    const updateAction = row.actions.find((a): a is Extract<ImportAction, { kind: "update_subscription" }> => a.kind === "update_subscription");
    if (!updateAction) {
      throw new Error(`duplicate sem update_subscription action`);
    }
    const financialReview = extractFinancialReview(row);
    const { data: existing, error: fetchErr } = await supabase
      .from("crm_subscriptions")
      .select("id, customer_id, vehicle_id")
      .eq("id", updateAction.subscriptionId)
      .maybeSingle();
    if (fetchErr) throw new Error(`fetch existing sub: ${fetchErr.message}`);
    if (!existing) throw new Error(`subscription ${updateAction.subscriptionId} não existe`);
    // Se snapshot fornece placa e sub ainda não tem vehicle_id, tenta ligar.
    let vehicleId = existing.vehicle_id as string | null;
    let vehicleCreated = false;
    if (!vehicleId && input.vehicle_plate) {
      const v = await upsertVehicle(supabase, existing.customer_id, input);
      vehicleId = v.id;
      vehicleCreated = v.created;
    }
    const patch = buildSubscriptionRow(input, existing.customer_id, vehicleId, financialReview, input.provider_customer_id ?? null);
    const { error: updErr } = await supabase.from("crm_subscriptions").update(patch).eq("id", existing.id);
    if (updErr) throw new Error(`update sub: ${updErr.message}`);
    await auditLog(supabase, "subscription", existing.id, "pagbank.subscription.updated", { source: IMPORT_SOURCE, provider_subscription_id: input.provider_subscription_id });
    return {
      customerId: existing.customer_id,
      customerCreated: false,
      vehicleId,
      vehicleCreated,
      subscriptionId: existing.id,
      subscriptionAction: "updated",
      financialReviewRequired: financialReview.required,
    };
  }

  // 2. Determina customer_id via actions (link existente ou create planned).
  let customerId: string | null = null;
  let customerCreated = false;

  const linkAction = row.actions.find((a): a is Extract<ImportAction, { kind: "link_existing_customer" }> => a.kind === "link_existing_customer");
  const createAction = row.actions.find((a): a is Extract<ImportAction, { kind: "create_customer" }> => a.kind === "create_customer");

  if (linkAction) {
    customerId = linkAction.customerId;
  } else if (createAction) {
    const pcid = input.provider_customer_id;
    if (!pcid) throw new Error(`create_customer sem provider_customer_id`);
    if (plannedCustomerIdByPcid.has(pcid)) {
      customerId = plannedCustomerIdByPcid.get(pcid)!;
    } else {
      // Idempotência entre execuções: se já existe customer com este pcid em
      // alguma subscription persistida, reutiliza.
      const { data: existingLink, error: linkErr } = await supabase
        .from("crm_subscriptions")
        .select("customer_id")
        .eq("provider_customer_id", pcid)
        .limit(1)
        .maybeSingle();
      if (linkErr) throw new Error(`lookup existing pcid: ${linkErr.message}`);
      if (existingLink?.customer_id) {
        customerId = existingLink.customer_id as string;
      } else {
        customerId = await createCustomer(supabase, createAction.name, createAction.decisionSource);
        customerCreated = true;
      }
      plannedCustomerIdByPcid.set(pcid, customerId);
    }
  } else {
    throw new Error(`outcome ${row.outcome} sem link_existing_customer nem create_customer (gate deveria ter barrado)`);
  }

  // 3. Vehicle: só cria se snapshot trouxer placa (override 4uCar do José).
  let vehicleId: string | null = null;
  let vehicleCreated = false;
  if (input.vehicle_plate) {
    const v = await upsertVehicle(supabase, customerId, input);
    vehicleId = v.id;
    vehicleCreated = v.created;
  }

  // 4. Subscription (upsert por provider_subscription_id).
  const financialReview = extractFinancialReview(row);
  const subRow = buildSubscriptionRow(input, customerId, vehicleId, financialReview, input.provider_customer_id ?? null);

  const { data: existingSub, error: existingErr } = await supabase
    .from("crm_subscriptions")
    .select("id")
    .eq("provider_subscription_id", input.provider_subscription_id)
    .limit(1)
    .maybeSingle();
  if (existingErr) throw new Error(`lookup existing sub: ${existingErr.message}`);

  let subscriptionId: string;
  let subscriptionAction: "created" | "updated";
  if (existingSub) {
    const { error: updErr } = await supabase.from("crm_subscriptions").update(subRow).eq("id", existingSub.id);
    if (updErr) throw new Error(`update sub: ${updErr.message}`);
    subscriptionId = existingSub.id;
    subscriptionAction = "updated";
    await auditLog(supabase, "subscription", subscriptionId, "pagbank.subscription.updated", { source: IMPORT_SOURCE, provider_subscription_id: input.provider_subscription_id });
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from("crm_subscriptions")
      .insert(subRow)
      .select("id")
      .single();
    if (insErr) throw new Error(`insert sub: ${insErr.message}`);
    subscriptionId = inserted.id;
    subscriptionAction = "created";
    await auditLog(supabase, "subscription", subscriptionId, "pagbank.subscription.created", {
      source: IMPORT_SOURCE,
      provider_subscription_id: input.provider_subscription_id,
      customer_id: customerId,
      vehicle_id: vehicleId,
      financial_review_required: financialReview.required,
    });
  }

  return {
    customerId,
    customerCreated,
    vehicleId,
    vehicleCreated,
    subscriptionId,
    subscriptionAction,
    financialReviewRequired: financialReview.required,
  };
}

async function createCustomer(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  name: string,
  decisionSource: string,
): Promise<string> {
  const nameObj = normalizeName(name);
  const { data, error } = await supabase
    .from("crm_customers")
    .insert({
      name,
      normalized_name: nameObj.normalized,
      origin: IMPORT_SOURCE,
      data_quality_status: nameObj.isIncomplete ? "nome_incompleto" : "incompleto",
      data_quality_notes: `pagbank-import:decision_source=${decisionSource}; sem telefone/email do provedor`,
    })
    .select("id")
    .single();
  if (error) throw new Error(`insert customer: ${error.message}`);
  await auditLog(supabase, "customer", data.id, "pagbank.customer.created", {
    source: IMPORT_SOURCE,
    decision_source: decisionSource,
    name,
  });
  return data.id;
}

async function upsertVehicle(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  customerId: string,
  input: { vehicle_plate?: string | null; vehicle_brand?: string | null; vehicle_model?: string | null },
): Promise<{ id: string; created: boolean }> {
  const plate = input.vehicle_plate!;
  const p = normalizePlate(plate);
  const normalizedPlate = p.classification.startsWith("valida") ? p.compact : null;

  if (normalizedPlate) {
    const { data: existing, error: exErr } = await supabase
      .from("crm_vehicles")
      .select("id")
      .eq("customer_id", customerId)
      .eq("normalized_plate", normalizedPlate)
      .limit(1)
      .maybeSingle();
    if (exErr) throw new Error(`lookup vehicle: ${exErr.message}`);
    if (existing) return { id: existing.id, created: false };
  }

  const { data, error } = await supabase
    .from("crm_vehicles")
    .insert({
      customer_id: customerId,
      brand: input.vehicle_brand ?? null,
      model: input.vehicle_model ?? null,
      normalized_model: input.vehicle_model ? input.vehicle_model.trim().toLowerCase() : null,
      plate,
      masked_plate: p.masked,
      normalized_plate: normalizedPlate,
      is_primary: false,
      source: IMPORT_SOURCE,
    })
    .select("id")
    .single();
  if (error) throw new Error(`insert vehicle: ${error.message}`);
  await auditLog(supabase, "vehicle", data.id, "pagbank.vehicle.created", {
    source: IMPORT_SOURCE,
    customer_id: customerId,
    plate,
    model: input.vehicle_model ?? null,
  });
  return { id: data.id, created: true };
}

interface FinancialReviewSignal {
  required: boolean;
  reason: string | null;
}

function extractFinancialReview(row: ImportRowOutcome): FinancialReviewSignal {
  const flag = row.actions.find((a): a is Extract<ImportAction, { kind: "flag_financial_review" }> => a.kind === "flag_financial_review");
  if (!flag) return { required: false, reason: null };
  return { required: true, reason: flag.reason };
}

const SUBSCRIPTION_STATUS_MAP: Record<string, string> = {
  ACTIVE: "ativo",
  PENDING: "pendente_validacao",
  CANCELLED: "cancelado",
  ENDED: "encerrado",
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  CARD_RECURRING: "card_recurring",
  MANUAL: "manual",
  UNKNOWN: "unknown",
};

const PAYMENT_STATUS_MAP: Record<string, string> = {
  CONFIRMED: "confirmed",
  PENDING: "pending",
  FAILED: "failed",
  REFUNDED: "refunded",
  UNKNOWN: "unknown",
};

const PAYMENT_EVIDENCE_SOURCE_MAP: Record<string, string> = {
  PROVIDER: "provider",
  MANUAL: "manual",
  LEGACY: "legacy",
  UNKNOWN: "unknown",
};

const MIGRATION_STATUS_MAP: Record<string, string> = {
  NOT_NEEDED: "not_needed",
  PENDING: "pending",
  COMPLETE: "complete",
};

function buildSubscriptionRow(
  input: ImportRowOutcome["input"],
  customerId: string,
  vehicleId: string | null,
  financialReview: FinancialReviewSignal,
  providerCustomerId: string | null,
): Record<string, unknown> {
  const paymentMethodLabel =
    input.payment_method === "CARD_RECURRING"
      ? "Cartão recorrente (PagBank)"
      : input.payment_method === "MANUAL"
        ? "Manual"
        : "Desconhecido";
  const paymentVerification =
    input.payment_evidence_source === "PROVIDER" && input.payment_status === "CONFIRMED"
      ? "provider_confirmed"
      : "not_verified";
  return {
    customer_id: customerId,
    subscription_plan: input.plan,
    subscription_cycle: input.cycle,
    subscription_status: SUBSCRIPTION_STATUS_MAP[input.status] ?? "detectado",
    subscription_source: "Importação",
    subscription_detected_at: new Date().toISOString(),
    billing_status: "active",
    billing_due_at: input.next_due_date ? new Date(input.next_due_date).toISOString() : null,
    billing_due_source: IMPORT_SOURCE,
    payment_method_label: paymentMethodLabel,
    payment_verification_status: paymentVerification,
    payment_method: PAYMENT_METHOD_MAP[input.payment_method] ?? "unknown",
    payment_status: PAYMENT_STATUS_MAP[input.payment_status] ?? "unknown",
    payment_evidence_source: PAYMENT_EVIDENCE_SOURCE_MAP[input.payment_evidence_source] ?? "unknown",
    payment_confidence: input.payment_status === "CONFIRMED" && input.payment_evidence_source === "PROVIDER" ? 1 : 0,
    provider_customer_id: providerCustomerId,
    provider_subscription_id: input.provider_subscription_id,
    last_payment_confirmed_at: input.last_payment_confirmed_at ? new Date(input.last_payment_confirmed_at).toISOString() : null,
    next_due_date: input.next_due_date ?? null,
    migration_status: MIGRATION_STATUS_MAP[input.migration_status] ?? "not_needed",
    last_verified_at: new Date().toISOString(),
    financial_review_required: financialReview.required,
    financial_review_reason: financialReview.reason,
    vehicle_id: vehicleId,
    is_active_subscriber: input.status === "ACTIVE",
    notes: input.note ?? null,
  };
}

async function auditLog(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  entityType: "customer" | "vehicle" | "subscription",
  entityId: string,
  action: string,
  newValue: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from("crm_audit_logs").insert({
    entity_type: entityType,
    entity_id: entityId,
    action,
    previous_value: null,
    new_value: newValue,
    actor: IMPORT_ACTOR,
    reason: "PagBank Portal Beta P0 import",
  });
  if (error) {
    console.warn(`[audit] falha ao gravar log ${action} ${entityId}: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(`\n[erro] ${(error as Error).message}\n`);
  process.exit(1);
});
