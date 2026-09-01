/**
 * Contratos do importador PagBank — usados pelo parser, matcher e orquestrador.
 *
 * Regra P0: o dado real NUNCA entra no git. Este arquivo apenas descreve a
 * SHAPE esperada; nenhum valor real é hardcoded aqui.
 */

export interface PagBankSubscriptionInput {
  /** ID canônico do contrato no PagBank. Usado como chave de idempotência. */
  provider_subscription_id: string;
  /** ID do cliente no PagBank. */
  provider_customer_id?: string | null;
  /** Nome completo do titular. */
  customer_name: string;
  /** Telefone com DDI/DDD. Ex.: "+5519999990001". Aceita variações; será normalizado. */
  customer_phone?: string | null;
  /** CPF só se autorizado no consentimento. */
  customer_cpf?: string | null;
  customer_email?: string | null;
  /** Plano canônico DGN. */
  plan: "Essential" | "Smart" | "Priority";
  /** Ciclo. `mensal` é o único válido no P0. */
  cycle: "mensal" | "semestral" | "anual" | "outro";
  /** Valor mensal em reais (2 casas). Não persistido — só para relatório. */
  amount_monthly: number;
  /** ACTIVE / PENDING / CANCELLED / ENDED. Mapeado para crm_subscription_status. */
  status: "ACTIVE" | "PENDING" | "CANCELLED" | "ENDED";
  payment_method: "card_recurring" | "manual" | "unknown";
  started_at?: string | null;
  next_due_date?: string | null;
  last_payment_at?: string | null;
  /** Se houver vínculo direto contrato→veículo (ex.: José Sergio: 1 contrato por carro). */
  vehicle_plate?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
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
}

export interface MatchResult {
  strategy: MatchStrategy;
  candidate: CustomerCandidate | null;
  confidence: number;
  /** Justificativa auditável ("phone: 5519... == 5519..."). */
  reason: string;
}

export type Outcome = "matched" | "review_required" | "unmatched" | "duplicate" | "error";

export interface ImportRowOutcome {
  input: PagBankSubscriptionInput;
  outcome: Outcome;
  match: MatchResult;
  /** Motivo de review/error quando não é matched. */
  notice?: string;
  /** subscription já existente com esse provider_subscription_id. */
  duplicateOf?: string;
  /** Ações que o `--apply` executaria (dry-run) ou executou. */
  actions: ImportAction[];
}

export type ImportAction =
  | { kind: "create_customer"; name: string }
  | { kind: "link_existing_customer"; customerId: string }
  | { kind: "create_vehicle"; plate: string | null; brand: string | null; model: string | null }
  | { kind: "link_existing_vehicle"; vehicleId: string; plate: string | null }
  | { kind: "create_subscription"; providerSubscriptionId: string; plan: string }
  | { kind: "update_subscription"; subscriptionId: string; providerSubscriptionId: string }
  | { kind: "flag_financial_review"; reason: string }
  | { kind: "skip"; reason: string };

export interface ImportSummary {
  file: string;
  mode: "dry_run" | "apply";
  totals: {
    input_rows: number;
    matched: number;
    review_required: number;
    unmatched: number;
    duplicates: number;
    errors: number;
    total_amount_monthly: number;
    unique_customers_touched: number;
    subscriptions_would_create: number;
    subscriptions_would_update: number;
    vehicles_would_create: number;
    customers_would_create: number;
    financial_reviews_flagged: number;
  };
  rows: ImportRowOutcome[];
  generated_at: string;
}
