import type {
  ImportAction,
  ImportRowOutcome,
  ImportSummary,
  PagBankImportFile,
  PagBankSubscriptionInput,
} from "./types.ts";
import {
  buildEmptyMatchInputs,
  matchCustomer,
  normalizeName,
  normalizePhone,
  shouldAutoAccept,
  type MatchInputs,
} from "./matcher.ts";
import type { CustomerCandidate } from "./types.ts";

// -----------------------------------------------------------------------------
// Orquestrador do import PagBank — puro (sem I/O de banco).
//
// Recebe:
//   - lista de subscriptions parseadas (input)
//   - índices atuais do CRM (candidatos existentes)
//   - índice de subscriptions já persistidas (para idempotência)
//
// Devolve:
//   - ImportSummary com totals + rows detalhados
//
// Regras P0 aplicadas:
//   - Nunca auto-merge por nome sozinho.
//   - Idempotência: subscription com provider_subscription_id existente = update.
//   - David-like (múltiplos contratos ativos duplicados) → financial_review_required.
//   - José-like (múltiplos contratos legítimos com veículos diferentes) → OK.
// -----------------------------------------------------------------------------

export interface ExistingSubscription {
  id: string;
  customer_id: string;
  provider_subscription_id: string | null;
  plan: string | null;
  is_active_subscriber: boolean;
}

export interface RunImportOptions {
  /** Arquivo já parseado. */
  file: PagBankImportFile;
  /** Índices do CRM atual. Vazio quando primeiro import. */
  indexes?: MatchInputs;
  /** Subscriptions existentes agrupadas por provider_subscription_id. */
  existingSubscriptionsByProviderId?: Map<string, ExistingSubscription>;
  /** Subscriptions existentes por customer_id (para detectar duplicidade tipo David). */
  existingSubscriptionsByCustomerId?: Map<string, ExistingSubscription[]>;
  /** dry_run (default) só produz preview; apply persistiria. */
  mode?: "dry_run" | "apply";
  /** Path/rótulo do arquivo original — para relatório. */
  sourceLabel?: string;
}

export function runPagBankImport(options: RunImportOptions): ImportSummary {
  const {
    file,
    indexes = buildEmptyMatchInputs(),
    existingSubscriptionsByProviderId = new Map(),
    existingSubscriptionsByCustomerId = new Map(),
    mode = "dry_run",
    sourceLabel = "unknown",
  } = options;

  const rows: ImportRowOutcome[] = [];
  const totals = {
    input_rows: 0,
    matched: 0,
    review_required: 0,
    unmatched: 0,
    duplicates: 0,
    errors: 0,
    total_amount_monthly: 0,
    unique_customers_touched: 0,
    subscriptions_would_create: 0,
    subscriptions_would_update: 0,
    vehicles_would_create: 0,
    customers_would_create: 0,
    financial_reviews_flagged: 0,
  };

  const touchedCustomerIds = new Set<string>();

  // Agrupa inputs por identidade (mesmo nome/telefone/cpf → mesma pessoa, ainda
  // que sem match no CRM). Isso permite detectar padrões como José Sergio
  // aparecendo em 2 linhas.
  const inputGroups = groupInputsByIdentity(file.subscriptions);

  for (const input of file.subscriptions) {
    totals.input_rows += 1;
    totals.total_amount_monthly += input.amount_monthly;

    // 1. Idempotência: provider_subscription_id já persistido?
    const existing = existingSubscriptionsByProviderId.get(input.provider_subscription_id);
    if (existing) {
      totals.duplicates += 1;
      totals.subscriptions_would_update += 1;
      touchedCustomerIds.add(existing.customer_id);
      rows.push({
        input,
        outcome: "duplicate",
        match: {
          strategy: "provider_id",
          candidate: { id: existing.customer_id, name: input.customer_name },
          confidence: 1,
          reason: `provider_subscription_id ${input.provider_subscription_id} já persistido.`,
        },
        duplicateOf: existing.id,
        actions: [
          { kind: "update_subscription", subscriptionId: existing.id, providerSubscriptionId: input.provider_subscription_id },
        ],
      });
      continue;
    }

    // 2. Match do cliente.
    const match = matchCustomer(input, indexes);

    // 3. Decide outcome com base em match + regras P0 (duplicidade financeira,
    //    nome divergente, sem dados etc.).
    let outcome: ImportRowOutcome["outcome"];
    const actions: ImportAction[] = [];
    let notice: string | undefined;

    if (match.strategy === "unmatched") {
      outcome = "unmatched";
      actions.push({ kind: "create_customer", name: input.customer_name });
      totals.customers_would_create += 1;
      totals.unmatched += 1;
    } else if (!shouldAutoAccept(match.strategy, match.confidence)) {
      // Ex.: nome sozinho ou nome ambíguo → fila humana.
      outcome = "review_required";
      totals.review_required += 1;
      notice =
        match.candidate === null
          ? `Match por nome AMBÍGUO ou insuficiente. Necessário revisar.`
          : `Match por ${match.strategy} com confiança ${match.confidence.toFixed(2)}. Fila humana.`;
      if (match.candidate) touchedCustomerIds.add(match.candidate.id);
    } else {
      outcome = "matched";
      totals.matched += 1;
      const candidate = match.candidate!;
      touchedCustomerIds.add(candidate.id);
      actions.push({ kind: "link_existing_customer", customerId: candidate.id });

      // Detecta David-like: cliente já tem 1+ subscriptions ativas E este
      // input é OUTRO contrato (mesmo cliente, outro provider_subscription_id).
      const existingSubs = existingSubscriptionsByCustomerId.get(candidate.id) ?? [];
      const activeSubs = existingSubs.filter((s: ExistingSubscription) => s.is_active_subscriber);
      const sameCustomerInputCount = inputGroups.get(identityKey(input)) ?? 1;

      if (activeSubs.length >= 1 && !input.vehicle_plate) {
        // Duplicidade financeira SEM sinal de veículo distinto → fila humana.
        outcome = "review_required";
        totals.review_required += 1;
        totals.matched -= 1; // rebalance
        totals.financial_reviews_flagged += 1;
        actions.push({
          kind: "flag_financial_review",
          reason: `Cliente ${candidate.id} já tem ${activeSubs.length} contrato(s) ativo(s). Novo contrato sem veículo distinto — investigar duplicidade.`,
        });
        notice = `Duplicidade financeira em investigação (David-like). Nenhuma decisão automática.`;
      } else if (sameCustomerInputCount > 1 && input.vehicle_plate) {
        // José-like: múltiplos contratos legítimos, cada um com veículo próprio.
        // Segue como matched, mas registra vínculo veículo→contrato.
        actions.push({
          kind: "create_vehicle",
          plate: input.vehicle_plate,
          brand: input.vehicle_brand ?? null,
          model: input.vehicle_model ?? null,
        });
        totals.vehicles_would_create += 1;
      }
    }

    // Ação de criar subscription (para todos exceto duplicate).
    actions.push({
      kind: "create_subscription",
      providerSubscriptionId: input.provider_subscription_id,
      plan: input.plan,
    });
    totals.subscriptions_would_create += 1;

    rows.push({
      input,
      outcome,
      match,
      notice,
      actions,
    });
  }

  totals.unique_customers_touched = touchedCustomerIds.size;

  return {
    file: sourceLabel,
    mode,
    totals,
    rows,
    generated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

function identityKey(input: PagBankSubscriptionInput): string {
  const phone = normalizePhone(input.customer_phone);
  if (phone.length >= 10) return `phone:${phone}`;
  return `name:${normalizeName(input.customer_name)}`;
}

function groupInputsByIdentity(rows: PagBankSubscriptionInput[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = identityKey(r);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Helper: monta os índices do matcher a partir de uma lista simples de
// candidatos. Útil para testes e para o loader do CRM.
// ---------------------------------------------------------------------------

export function buildMatchIndexes(candidates: CustomerCandidate[]): MatchInputs {
  const idx = buildEmptyMatchInputs();
  for (const c of candidates) {
    if (c.legacy_id) idx.byLegacyId.set(c.legacy_id, c);
    if (c.normalized_phone) idx.byPhone.set(c.normalized_phone, c);
    const nk = normalizeName(c.name);
    if (nk.length >= 3) {
      const list = idx.byName.get(nk) ?? [];
      list.push(c);
      idx.byName.set(nk, list);
    }
  }
  return idx;
}
