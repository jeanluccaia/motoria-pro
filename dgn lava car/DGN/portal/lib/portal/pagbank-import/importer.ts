import type {
  CustomerCandidate,
  ImportAction,
  ImportRowOutcome,
  ImportSummary,
  MultiContractDecision,
  Outcome,
  PagBankImportFile,
  PagBankSubscriptionInput,
  ReconciliationDecisionSource,
  ReconciliationFile,
  ReconciliationSubscriptionOverride,
} from "./types.ts";
import {
  buildEmptyMatchInputs,
  matchCustomer,
  normalizeName,
  shouldAutoAccept,
  type MatchInputs,
  type PlannedNewCustomer,
} from "./matcher.ts";

// -----------------------------------------------------------------------------
// Orquestrador do import PagBank — puro (sem I/O de banco).
//
// Regras P0 aplicadas:
//   - Nunca auto-merge por nome sozinho.
//   - Nunca auto-cria customer no path unmatched — vira pending_reconciliation.
//   - Dedupe por provider_customer_id dentro do BATCH (1 pcid = 1 customer).
//   - David-like (múltiplos contratos sem vehicle_plate distinto) →
//     financial_review_required, mesmo sem estado prévio no CRM.
//   - José-like (múltiplos contratos com vehicle_plate distinto) → matched,
//     mas placa NUNCA é inventada quando ausente no snapshot.
//   - Reconciliação humana aprovada tem prioridade máxima.
// -----------------------------------------------------------------------------

export interface ExistingSubscription {
  id: string;
  customer_id: string;
  provider_subscription_id: string | null;
  plan: string | null;
  is_active_subscriber: boolean;
}

export interface RunImportOptions {
  file: PagBankImportFile;
  indexes?: MatchInputs;
  existingSubscriptionsByProviderId?: Map<string, ExistingSubscription>;
  existingSubscriptionsByCustomerId?: Map<string, ExistingSubscription[]>;
  mode?: "dry_run" | "apply";
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
    pending_reconciliation_rows: 0,
    pending_reconciliation_customers: 0,
    new_customers_would_create: 0,
    duplicates: 0,
    errors: 0,
    total_amount_monthly: 0,
    unique_provider_customers: 0,
    unique_customers_touched: 0,
    subscriptions_would_create: 0,
    subscriptions_would_update: 0,
    vehicles_would_create: 0,
    financial_reviews_flagged: 0,
  };

  const touchedCustomerIds = new Set<string>();
  const providerCustomerIds = new Set<string>();
  const pendingProviderCustomerIds = new Set<string>();
  const flaggedProviderCustomerIds = new Set<string>();
  const plannedPcidsSeen = new Set<string>();

  // Aplica overrides de reconciliação (ex.: placa/veículo do José) SEM mutar
  // o snapshot original — os overrides só existem no batch efêmero.
  const effectiveInputs = applySubscriptionOverridesToBatch(
    file.subscriptions,
    indexes.subscriptionOverrides,
  );

  const batchGroups = groupInputsByProviderCustomerId(effectiveInputs);

  for (const input of effectiveInputs) {
    totals.input_rows += 1;
    totals.total_amount_monthly += input.amount_monthly;
    if (input.provider_customer_id) providerCustomerIds.add(input.provider_customer_id);

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
          {
            kind: "update_subscription",
            subscriptionId: existing.id,
            providerSubscriptionId: input.provider_subscription_id,
          },
        ],
      });
      continue;
    }

    // 2. NEW_CUSTOMER planejado (decisão humana explícita) —
    //    curto-circuita o matcher e emite create_customer + create_subscription
    //    idempotente. Múltiplos contratos do mesmo pcid ⇒ 1 customer + N subs.
    const planned = input.provider_customer_id
      ? indexes.plannedNewCustomers.get(input.provider_customer_id)
      : undefined;
    const groupSize = input.provider_customer_id
      ? batchGroups.get(input.provider_customer_id) ?? 1
      : 1;

    if (planned && input.provider_customer_id) {
      const actions: ImportAction[] = [];
      const isFirstOfPcid = !plannedPcidsSeen.has(input.provider_customer_id);
      if (isFirstOfPcid) {
        plannedPcidsSeen.add(input.provider_customer_id);
        totals.new_customers_would_create += 1;
      }
      actions.push({
        kind: "create_customer",
        providerCustomerId: input.provider_customer_id,
        name: planned.name,
        decisionSource: planned.decisionSource,
      });
      if (input.vehicle_plate) {
        actions.push({
          kind: "create_vehicle",
          plate: input.vehicle_plate,
          brand: input.vehicle_brand ?? null,
          model: input.vehicle_model ?? null,
        });
        totals.vehicles_would_create += 1;
      }
      // Financial review batch-aware: mesmo em NEW_CUSTOMER, se houver 2+ subs
      // no batch SEM placa distinta e SEM override multi_contract humano
      // ⇒ flag (nunca inferir contratos legítimos sem evidência).
      if (groupSize > 1) {
        const distinctPlates = allGroupRowsHaveDistinctPlates(
          input.provider_customer_id,
          effectiveInputs,
        );
        const humanApprovedMulti =
          planned.multiContractDecision === "APPROVED_HUMAN" ||
          planned.multiContractDecision === "APPROVED_HUMAN_WITH_OPERATIONAL_EVIDENCE";
        if (!distinctPlates && !humanApprovedMulti) {
          actions.push({
            kind: "flag_financial_review",
            reason: `NEW_CUSTOMER ${input.provider_customer_id} tem ${groupSize} contratos sem placa distinta E sem override humano. Fila humana.`,
          });
          if (!flaggedProviderCustomerIds.has(input.provider_customer_id)) {
            flaggedProviderCustomerIds.add(input.provider_customer_id);
            totals.financial_reviews_flagged += 1;
          }
        }
      }
      actions.push({
        kind: "create_subscription",
        providerSubscriptionId: input.provider_subscription_id,
        plan: input.plan,
      });
      totals.subscriptions_would_create += 1;
      rows.push({
        input,
        outcome: "new_customer_planned",
        match: {
          strategy: "reconciliation",
          candidate: null,
          confidence: 1,
          reason: `NEW_CUSTOMER aprovado (${planned.decisionSource}) — criar customer "${planned.name}"`,
        },
        actions,
      });
      continue;
    }

    // 3. Match do cliente.
    const match = matchCustomer(input, indexes);

    // 4. Decide outcome.
    let outcome: Outcome;
    const actions: ImportAction[] = [];
    let notice: string | undefined;

    if (match.strategy === "unmatched" || !shouldAutoAccept(match.strategy, match.confidence)) {
      // Sem identidade confiável ou match auxiliar (nome) → fila humana.
      // NUNCA auto-cria customer no P0.
      if (match.strategy === "name" && match.candidate) {
        outcome = "review_required";
        totals.review_required += 1;
        notice = `Match por nome com confiança ${match.confidence.toFixed(
          2,
        )} — não é suficiente. Necessário reconciliação humana.`;
        touchedCustomerIds.add(match.candidate.id);
        if (input.provider_customer_id) {
          actions.push({
            kind: "await_reconciliation",
            providerCustomerId: input.provider_customer_id,
          });
        }
      } else if (match.strategy === "name" && !match.candidate) {
        // Nome ambíguo.
        outcome = "review_required";
        totals.review_required += 1;
        notice = `Match por nome AMBÍGUO — múltiplos candidatos no CRM. Reconciliação humana.`;
        if (input.provider_customer_id) {
          actions.push({
            kind: "await_reconciliation",
            providerCustomerId: input.provider_customer_id,
          });
        }
      } else {
        outcome = "pending_reconciliation";
        totals.pending_reconciliation_rows += 1;
        if (input.provider_customer_id) {
          pendingProviderCustomerIds.add(input.provider_customer_id);
          actions.push({
            kind: "await_reconciliation",
            providerCustomerId: input.provider_customer_id,
          });
        }
        notice = `Sem identificador confiável no snapshot (só nome). Aguardando reconciliação humana.`;
      }
    } else {
      // Match confiável (reconciliation, provider_id, cpf, phone).
      outcome = "matched";
      totals.matched += 1;
      const candidate = match.candidate!;
      touchedCustomerIds.add(candidate.id);
      actions.push({ kind: "link_existing_customer", customerId: candidate.id });

      if (groupSize > 1 && input.vehicle_plate) {
        // José-like: múltiplos contratos legítimos, cada um com veículo próprio.
        actions.push({
          kind: "create_vehicle",
          plate: input.vehicle_plate,
          brand: input.vehicle_brand ?? null,
          model: input.vehicle_model ?? null,
        });
        totals.vehicles_would_create += 1;
      }
    }

    // 5. Financial review batch-aware.
    //    Aplicável a QUALQUER outcome (matched, review, pending_reconciliation)
    //    quando o mesmo provider_customer_id tem 2+ subs neste batch OU já tem
    //    subs ativas no CRM E o snapshot não fornece placa distinta para
    //    diferenciar contratos.
    if (input.provider_customer_id) {
      const activeSubsInCrm =
        match.candidate && shouldAutoAccept(match.strategy, match.confidence)
          ? (existingSubscriptionsByCustomerId.get(match.candidate.id) ?? []).filter(
              (s: ExistingSubscription) => s.is_active_subscriber,
            ).length
          : 0;

      const totalSubsForProviderCustomer = groupSize + activeSubsInCrm;
      const groupHasDistinctPlates = allGroupRowsHaveDistinctPlates(
        input.provider_customer_id,
        effectiveInputs,
      );

      if (totalSubsForProviderCustomer > 1 && !groupHasDistinctPlates) {
        const reason =
          activeSubsInCrm > 0
            ? `Cliente ${match.candidate?.id} já tem ${activeSubsInCrm} contrato(s) ativo(s) no CRM E snapshot adiciona ${groupSize}. Sem placa distinta para diferenciar. Fila humana.`
            : `provider_customer_id ${input.provider_customer_id} tem ${groupSize} contratos neste batch sem placa distinta para diferenciar. Fila humana.`;

        actions.push({ kind: "flag_financial_review", reason });

        if (!flaggedProviderCustomerIds.has(input.provider_customer_id)) {
          flaggedProviderCustomerIds.add(input.provider_customer_id);
          totals.financial_reviews_flagged += 1;
        }

        if (outcome === "matched") {
          totals.matched -= 1;
          outcome = "review_required";
          totals.review_required += 1;
          notice =
            notice ??
            `Duplicidade financeira em investigação (múltiplos contratos, sem veículo distinto).`;
        } else if (outcome === "pending_reconciliation") {
          notice =
            notice ??
            `Sem identificador confiável + múltiplos contratos: duplo bloqueio. Reconciliação humana + revisão financeira.`;
        }
      }
    }

    // 6. Ação de criar subscription (para todos exceto duplicate).
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

  totals.unique_provider_customers = providerCustomerIds.size;
  totals.unique_customers_touched = touchedCustomerIds.size;
  totals.pending_reconciliation_customers = pendingProviderCustomerIds.size;

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

/**
 * Aplica overrides por contrato (vehicle_plate/brand/model vindos de
 * evidência operacional) SEM mutar o array/entradas originais. Também
 * valida `amount_monthly_expected` — divergência é fatal (evita bug de
 * associação plate↔contrato quando alguém edita a reconciliation à mão).
 */
export function applySubscriptionOverridesToBatch(
  inputs: PagBankSubscriptionInput[],
  overrides: Map<string, ReconciliationSubscriptionOverride>,
): PagBankSubscriptionInput[] {
  if (overrides.size === 0) return inputs;
  return inputs.map((row) => {
    const ov = overrides.get(row.provider_subscription_id);
    if (!ov) return row;
    if (
      typeof ov.amount_monthly_expected === "number" &&
      Number(ov.amount_monthly_expected) !== Number(row.amount_monthly)
    ) {
      throw new Error(
        `Reconciliation override para ${row.provider_subscription_id} espera R$${ov.amount_monthly_expected} mas snapshot tem R$${row.amount_monthly}. Bloqueando import.`,
      );
    }
    return {
      ...row,
      vehicle_plate: ov.vehicle_plate ?? row.vehicle_plate ?? null,
      vehicle_brand: ov.vehicle_brand ?? row.vehicle_brand ?? null,
      vehicle_model: ov.vehicle_model ?? row.vehicle_model ?? null,
    };
  });
}

function groupInputsByProviderCustomerId(
  rows: PagBankSubscriptionInput[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (!r.provider_customer_id) continue;
    map.set(r.provider_customer_id, (map.get(r.provider_customer_id) ?? 0) + 1);
  }
  return map;
}

function allGroupRowsHaveDistinctPlates(
  providerCustomerId: string,
  rows: PagBankSubscriptionInput[],
): boolean {
  const groupRows = rows.filter((r) => r.provider_customer_id === providerCustomerId);
  if (groupRows.length <= 1) return true;
  const plates = groupRows.map((r) => (r.vehicle_plate ?? "").trim()).filter((p) => p.length > 0);
  if (plates.length !== groupRows.length) return false;
  const unique = new Set(plates.map((p) => p.toUpperCase()));
  return unique.size === groupRows.length;
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
    if (c.provider_customer_id) idx.byProviderCustomerId.set(c.provider_customer_id, c);
    const nk = normalizeName(c.name);
    if (nk.length >= 3) {
      const list = idx.byName.get(nk) ?? [];
      list.push(c);
      idx.byName.set(nk, list);
    }
  }
  return idx;
}

// ---------------------------------------------------------------------------
// Reconciliation mapping helpers
// ---------------------------------------------------------------------------

export interface ReconciledMapping {
  provider_customer_id: string;
  crm_customer_id: string;
  crm_customer_name: string;
}

/**
 * Injeta um mapping aprovado (provider_customer_id → CRM customer) no índice.
 * Chame ANTES de rodar o importador. Só passe entries com decision=APPROVED.
 */
export function applyReconciledMappings(
  indexes: MatchInputs,
  mappings: ReconciledMapping[],
): void {
  for (const m of mappings) {
    indexes.reconciled.set(m.provider_customer_id, {
      id: m.crm_customer_id,
      name: m.crm_customer_name,
      provider_customer_id: m.provider_customer_id,
    });
  }
}
