/**
 * Contratos do importador PagBank — usados pelo parser, matcher e orquestrador.
 *
 * Regra P0: o dado real NUNCA entra no git. Este arquivo apenas descreve a
 * SHAPE esperada; nenhum valor real é hardcoded aqui.
 *
 * Os enums UPPERCASE seguem a canonicalização do brief PagBank; o apply
 * downcase para os enums PG (`crm_payment_*`) na hora de persistir.
 */

export type PagBankSubscriptionStatus = "ACTIVE" | "PENDING" | "CANCELLED" | "ENDED";
export type PagBankPaymentMethod = "CARD_RECURRING" | "MANUAL" | "UNKNOWN";
export type PagBankPaymentStatus =
  | "CONFIRMED"
  | "PENDING"
  | "FAILED"
  | "REFUNDED"
  | "UNKNOWN";
export type PagBankPaymentEvidenceSource =
  | "PROVIDER"
  | "MANUAL"
  | "LEGACY"
  | "UNKNOWN";
export type PagBankMigrationStatus = "NOT_NEEDED" | "PENDING" | "COMPLETE";

export interface PagBankSubscriptionInput {
  /** ID canônico do contrato no PagBank. Usado como chave de idempotência. */
  provider_subscription_id: string;
  /** ID do cliente no PagBank. É o ÚNICO identificador confiável de pessoa. */
  provider_customer_id?: string | null;
  /** Nome completo do titular. Nunca usado como identificador de auto-merge. */
  customer_name: string;
  /** Telefone com DDI/DDD. Ex.: "+5519999990001". Aceita variações. */
  customer_phone?: string | null;
  /** CPF só se autorizado. */
  customer_cpf?: string | null;
  /** E-mail (frequentemente mascarado). NUNCA usado como identificador. */
  customer_email?: string | null;
  /** Plano canônico DGN. */
  plan: "Essential" | "Smart" | "Priority";
  /** Ciclo. `mensal` é o único válido no P0. */
  cycle: "mensal" | "semestral" | "anual" | "outro";
  /** Valor mensal em reais (2 casas). */
  amount_monthly: number;
  /** Status canônico da assinatura. */
  status: PagBankSubscriptionStatus;
  /** Meio canônico. `MANUAL` não é cobrança recorrente. */
  payment_method: PagBankPaymentMethod;
  /** Status financeiro canônico. */
  payment_status: PagBankPaymentStatus;
  /** Origem da evidência (PROVIDER = PagBank; sem isso nada é definitivo). */
  payment_evidence_source: PagBankPaymentEvidenceSource;
  /** Estado da migração para cartão recorrente. */
  migration_status: PagBankMigrationStatus;
  /** ID do último pagamento no provedor (auditoria). */
  provider_payment_id?: string | null;
  /** ISO date. */
  started_at?: string | null;
  /** ISO date. */
  next_due_date?: string | null;
  /** ISO date. Renomeado a partir de last_payment_at. */
  last_payment_confirmed_at?: string | null;
  /**
   * Se houver vínculo direto contrato→veículo. Não inventar quando ausente
   * — o snapshot 2026-09-01 não expõe placa.
   */
  vehicle_plate?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  /** Observações opcionais (nunca usadas em lógica automática). */
  note?: string | null;
}

export interface PagBankImportFile {
  meta: {
    generated_at: string;
    source: string;
    expected_total_amount_monthly?: number | null;
    expected_customers?: number | null;
    expected_contracts?: number | null;
  };
  subscriptions: PagBankSubscriptionInput[];
}

// ---------------------------------------------------------------------------
// Matching / outcome
// ---------------------------------------------------------------------------

export type MatchStrategy =
  | "reconciliation"
  | "provider_id"
  | "cpf"
  | "phone"
  | "internal_id"
  | "name"
  | "unmatched";

export interface CustomerCandidate {
  id: string;
  name: string;
  legacy_id?: string | null;
  normalized_phone?: string | null;
  email?: string | null;
  /** Preenchido quando o CRM já vinculou este customer a um provider_customer_id. */
  provider_customer_id?: string | null;
}

export interface MatchResult {
  strategy: MatchStrategy;
  candidate: CustomerCandidate | null;
  confidence: number;
  /** Justificativa auditável ("phone: 5519... == 5519..."). */
  reason: string;
}

export type Outcome =
  | "matched"
  | "review_required"
  | "pending_reconciliation"
  | "duplicate"
  | "new_customer_planned"
  | "error";

export interface ImportRowOutcome {
  input: PagBankSubscriptionInput;
  outcome: Outcome;
  match: MatchResult;
  /** Motivo de review/pending/error quando não é matched. */
  notice?: string;
  /** subscription já existente com esse provider_subscription_id. */
  duplicateOf?: string;
  /** Ações que o `--apply` executaria (dry-run) ou executou. */
  actions: ImportAction[];
}

export type ImportAction =
  | { kind: "link_existing_customer"; customerId: string }
  | { kind: "link_batch_customer"; providerCustomerId: string }
  | {
      kind: "create_customer";
      providerCustomerId: string;
      name: string;
      decisionSource: string;
    }
  | { kind: "create_vehicle"; plate: string | null; brand: string | null; model: string | null }
  | { kind: "link_existing_vehicle"; vehicleId: string; plate: string | null }
  | { kind: "create_subscription"; providerSubscriptionId: string; plan: string }
  | { kind: "update_subscription"; subscriptionId: string; providerSubscriptionId: string }
  | { kind: "flag_financial_review"; reason: string }
  | { kind: "await_reconciliation"; providerCustomerId: string }
  | { kind: "skip"; reason: string };

export interface ImportSummary {
  file: string;
  mode: "dry_run" | "apply";
  totals: {
    input_rows: number;
    matched: number;
    review_required: number;
    pending_reconciliation_rows: number;
    pending_reconciliation_customers: number;
    new_customers_would_create: number;
    duplicates: number;
    errors: number;
    total_amount_monthly: number;
    unique_provider_customers: number;
    unique_customers_touched: number;
    subscriptions_would_create: number;
    subscriptions_would_update: number;
    vehicles_would_create: number;
    financial_reviews_flagged: number;
  };
  rows: ImportRowOutcome[];
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Reconciliação humana (PagBank customer → CRM customer)
// ---------------------------------------------------------------------------

export type ReconciliationDecision = "PENDING" | "APPROVED" | "REJECTED" | "NEW_CUSTOMER";
export type ReconciliationCandidateStatus =
  | "EXACT_CANDIDATE"
  | "MULTIPLE_CANDIDATES"
  | "NO_CANDIDATE";
export type ReconciliationMatchType =
  | "EXACT_NAME"
  | "NORMALIZED_NAME"
  | "CLOSE_NAME";
/**
 * Origem auditável de uma decisão humana. `EXACT_CANDIDATE` = houve match único
 * automático que o Digo aprovou. `HUMAN_DIGO` = decisão manual sem candidato
 * automático. `EXACT_VEHICLE_PLATE` = decisão baseada em placa exata do CRM.
 */
export type ReconciliationDecisionSource =
  | "EXACT_CANDIDATE"
  | "HUMAN_DIGO"
  | "EXACT_VEHICLE_PLATE";
/**
 * Override auditável quando um provider_customer_id tem 2+ contratos.
 * `APPROVED_HUMAN_WITH_OPERATIONAL_EVIDENCE` = plates/veículos vieram de
 * evidência operacional (4uCar). Nunca inferir sem essa marca.
 */
export type MultiContractDecision =
  | "APPROVED_HUMAN"
  | "APPROVED_HUMAN_WITH_OPERATIONAL_EVIDENCE";

/**
 * Override por contrato PagBank — usado quando a evidência operacional
 * (ex.: relatório 4uCar) fornece vínculo confiável entre um contrato
 * específico e um veículo. Aplica-se ANTES do matcher rodar.
 */
export interface ReconciliationSubscriptionOverride {
  provider_subscription_id: string;
  /** Validação: se preenchido, o import CONFIRMA o valor bate com o snapshot. */
  amount_monthly_expected?: number;
  vehicle_plate?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  /** Frase auditável (ex.: "4uCar OS 17/08/2026 Smart Hatch"). Nunca é usada como identidade automática. */
  evidence?: string | null;
}

export interface ReconciliationCandidate {
  crm_customer_id: string;
  match_type: ReconciliationMatchType;
  /** 0..1 — heurística de sobreposição de tokens; nunca é vínculo automático. */
  match_score: number;
  /** Tokens em comum entre PagBank name e CRM name (auditoria). */
  matched_tokens: string[];
  name: string;
  masked_phone: string | null;
  vehicles_count: number;
  subscriptions_count: number;
  historical_value: number;
  last_service_at: string | null;
  plan_signal: string | null;
}

export interface ReconciliationEntry {
  provider_customer_id: string;
  pagbank_name: string;
  subscription_count: number;
  candidates: ReconciliationCandidate[];
  candidate_status: ReconciliationCandidateStatus;
  approved_crm_customer_id: string | null;
  /**
   * Nome canônico do CRM para APPROVED sem candidate automático (HUMAN_DIGO).
   * Só afeta display/logs — o pareamento usa approved_crm_customer_id.
   */
  approved_crm_customer_name?: string | null;
  decision: ReconciliationDecision;
  /** Origem auditável da decisão. Obrigatório quando decision != PENDING. */
  decision_source?: ReconciliationDecisionSource | null;
  /** Nome canônico para criar o customer quando decision=NEW_CUSTOMER. */
  new_customer_name?: string | null;
  /** Override auditável para múltiplos contratos legítimos (ex.: José). */
  multi_contract_decision?: MultiContractDecision | null;
  /** Overrides por contrato (ex.: placa vinda de evidência 4uCar). */
  subscription_overrides?: ReconciliationSubscriptionOverride[];
  /** Nota humana livre (auditoria). Nunca alimenta lógica automática. */
  notes?: string | null;
}

export interface ReconciliationFile {
  meta: {
    generated_at: string;
    source: string;
  };
  entries: ReconciliationEntry[];
}
