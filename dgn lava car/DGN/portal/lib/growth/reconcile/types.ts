/**
 * Tipos do reconciliador de assinantes (read-only).
 * Sem I/O — todo o módulo aceita snapshots já carregados e retorna preview
 * determinístico. Nada escreve em DB.
 */

/**
 * Shape mínimo de crm_subscriptions consumido pelo reconciler. O endpoint que
 * chama `reconcile()` é responsável por popular a partir de `readGrowthSnapshot`.
 * Um customer pode ter N linhas (padrão José Sergio).
 */
export interface ReconcileSubscriptionRow {
  id: string;
  customer_id: string;
  subscription_plan: string;
  subscription_cycle: string;
  subscription_status: string;
  is_active_subscriber: boolean;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  vehicle_id: string | null;
  cycle_ends_at: string | null;
  billing_due_at: string | null;
  source_reference: string | null;
  payment_status: string | null;
  payment_evidence_source: string | null;
}

/** Shape mínimo de crm_vehicles consumido pelo matcher por placa. */
export interface ReconcileVehicleRow {
  id: string;
  customer_id: string;
  plate: string | null;
  brand: string | null;
  model: string | null;
}

export interface ReconcileInputRow {
  name?: string;
  phone?: string;
  plate?: string;
  plan?: string;
  status?: string;
  cycle?: string;
  paid_until?: string;
  payment_method?: string;
  notes?: string;
  source?: string;
}

export type CustomerMatchStrategy =
  | "customer_id"
  | "phone"
  | "plate"
  | "legacy_id"
  | "name"
  | "fuzzy_name"
  | null;

export interface CustomerMatch {
  strategy: CustomerMatchStrategy;
  customerId: string | null;
  legacyId: string | null;
  customerName: string | null;
  /** Outros customer_ids que também bateram na mesma estratégia — ambíguo se > 0. */
  ambiguousIds: string[];
  reason: string;
}

export type SubscriptionMatchStrategy =
  | "exact_vehicle"
  | "single_only"
  | "multiple_review"
  | "none";

export interface SubscriptionMatch {
  strategy: SubscriptionMatchStrategy;
  subscriptionId: string | null;
  currentPlan: string | null;
  currentCycle: string | null;
  currentStatus: string | null;
  currentIsActive: boolean;
  providerLinked: boolean;
  candidatesCount: number;
}

export type ReconcileClassification =
  | "ALREADY_CORRECT"
  | "PROMOTE_EXISTING"
  | "UPDATE_EXISTING_REVIEW"
  | "CREATE_NEW"
  | "RENEWAL_PENDING"
  | "CUSTOMER_NOT_FOUND"
  | "POSSIBLE_MATCH"
  | "CONFLICT";

/**
 * Ação server-side proposta, se o operador aprovar a linha. Só populada quando
 * classification é PROMOTE_EXISTING ou CREATE_NEW. Para outras classificações,
 * `proposed` é `null` (nunca aplicável em background).
 */
export type ProposedAction =
  | {
      kind: "PROMOTE_EXISTING";
      subscriptionId: string;
      expectedCustomerId: string;
      paymentStatus: "confirmed" | "unknown";
      paymentEvidenceSource: "manual" | "legacy" | "unknown";
      cycleEndsAtIso: string | null;
      sourceReference: string;
      notesAppend: string | null;
    }
  | {
      kind: "CREATE_NEW";
      customerId: string;
      plan: "Essential" | "Smart" | "Priority";
      cycle: "mensal" | "semestral" | "anual" | "outro" | "não identificado";
      paymentStatus: "confirmed" | "unknown";
      paymentEvidenceSource: "manual" | "legacy" | "unknown";
      cycleEndsAtIso: string | null;
      sourceReference: string;
      notes: string | null;
      vehicleId: string | null;
    };

export interface ReconcileFacts {
  matchedByPhone: boolean;
  matchedByPlate: boolean;
  matchedByLegacyId: boolean;
  matchedByName: boolean;
  fuzzyName: boolean;
  ambiguousCandidates: number;
  subscriptionMatch: SubscriptionMatch | null;
  planReported: string | null;
  planCanonical: string | null;
  cycleEndsAtReported: string | null;
  cycleEndsAtCurrent: string | null;
  divergingFields: string[];
  missingFields: string[];
}

export interface ReconcilePreviewItem {
  rowIndex: number;
  input: ReconcileInputRow;
  customer: CustomerMatch;
  classification: ReconcileClassification;
  reason: string;
  facts: ReconcileFacts;
  proposed: ProposedAction | null;
  /** Só true quando classification é PROMOTE_EXISTING seguro ou CREATE_NEW seguro. */
  applyEnabled: boolean;
}

export interface ReconcilePreview {
  totalRows: number;
  counts: Record<ReconcileClassification, number>;
  items: ReconcilePreviewItem[];
  /** Instantâneo da origem dos dados (db/json/json-fallback). */
  dataOrigin: "db" | "json" | "json-fallback";
  /** Frase pronta para o modal de confirmação. Não escreve nada — só resume. */
  summary: string;
}
