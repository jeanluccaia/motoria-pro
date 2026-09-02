import type {
  CustomerCandidate,
  MatchResult,
  MatchStrategy,
  MultiContractDecision,
  PagBankSubscriptionInput,
  ReconciliationDecisionSource,
  ReconciliationSubscriptionOverride,
} from "./types.ts";

export interface PlannedNewCustomer {
  /** Nome canônico (Title Case) para criar o customer. */
  name: string;
  decisionSource: ReconciliationDecisionSource;
  multiContractDecision?: MultiContractDecision | null;
}

// -----------------------------------------------------------------------------
// Matching PagBank → CRM.
//
// Prioridade (P0, ordem estrita):
//   0. reconciliation approvada (mapping humano auditado) — sempre vence
//   1. provider_customer_id já vinculado no CRM
//   2. CPF quando autorizado
//   3. telefone normalizado
//   4. legacy_id (identificador interno do CRM)
//   5. nome — só como sinal AUXILIAR; nome sozinho NUNCA é auto-merge
//
// Retorna sempre 1 MatchResult com strategy explícita. Casos ambíguos (nome
// batendo em >1 candidato) devolvem strategy="name" com confidence baixa,
// deixando a fila humana decidir.
// -----------------------------------------------------------------------------

const NAME_ONLY_MAX_CONFIDENCE = 0.4;

export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) return digits.slice(2);
  if (digits.length === 12 && digits.startsWith("55")) return digits.slice(2);
  return digits;
}

export function normalizeCpf(raw: string | null | undefined): string {
  if (!raw) return "";
  return String(raw).replace(/\D/g, "").padStart(11, "0").slice(-11);
}

export function normalizeName(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface MatchInputs {
  /** Índice: provider_customer_id existente → customerId. */
  byProviderCustomerId: Map<string, CustomerCandidate>;
  /** Índice: CPF normalizado → customerId. */
  byCpf: Map<string, CustomerCandidate>;
  /** Índice: telefone normalizado → customerId. */
  byPhone: Map<string, CustomerCandidate>;
  /** Índice: legacy_id → customerId. */
  byLegacyId: Map<string, CustomerCandidate>;
  /** Índice: normalized_name → CustomerCandidate[]. Pode ter colisão. */
  byName: Map<string, CustomerCandidate[]>;
  /**
   * Mapping humano auditado: provider_customer_id → CustomerCandidate.
   * Só entra aqui quando `decision=APPROVED` no reconciliation JSON.
   * Sempre vence outras estratégias.
   */
  reconciled: Map<string, CustomerCandidate>;
  /**
   * Provider_customer_ids que a curadoria humana marcou como NEW_CUSTOMER.
   * O importer curto-circuita antes do matcher e emite `create_customer`.
   */
  plannedNewCustomers: Map<string, PlannedNewCustomer>;
  /**
   * Overrides por contrato (chave: provider_subscription_id). Aplicados
   * ANTES do importer processar o batch — populam vehicle_plate/brand/model
   * a partir de evidência operacional externa (ex.: 4uCar).
   */
  subscriptionOverrides: Map<string, ReconciliationSubscriptionOverride>;
}

export function buildEmptyMatchInputs(): MatchInputs {
  return {
    byProviderCustomerId: new Map(),
    byCpf: new Map(),
    byPhone: new Map(),
    byLegacyId: new Map(),
    byName: new Map(),
    reconciled: new Map(),
    plannedNewCustomers: new Map(),
    subscriptionOverrides: new Map(),
  };
}

export function matchCustomer(
  input: PagBankSubscriptionInput,
  indexes: MatchInputs,
): MatchResult {
  // 0. Reconciliação humana aprovada — sempre vence.
  if (input.provider_customer_id) {
    const approved = indexes.reconciled.get(input.provider_customer_id);
    if (approved) {
      return {
        strategy: "reconciliation",
        candidate: approved,
        confidence: 1,
        reason: `reconciliation aprovada: provider_customer_id ${input.provider_customer_id} → customer ${approved.id}`,
      };
    }
  }

  // 1. provider_customer_id já vinculado no CRM.
  if (input.provider_customer_id) {
    const hit = indexes.byProviderCustomerId.get(input.provider_customer_id);
    if (hit) {
      return {
        strategy: "provider_id",
        candidate: hit,
        confidence: 1,
        reason: `provider_customer_id ${input.provider_customer_id} == customer ${hit.id}`,
      };
    }
  }

  // 2. CPF quando informado.
  if (input.customer_cpf) {
    const cpf = normalizeCpf(input.customer_cpf);
    if (cpf) {
      const hit = indexes.byCpf.get(cpf);
      if (hit) {
        return {
          strategy: "cpf",
          candidate: hit,
          confidence: 0.98,
          reason: `cpf ${maskCpf(cpf)} == customer ${hit.id}`,
        };
      }
    }
  }

  // 3. Telefone normalizado.
  if (input.customer_phone) {
    const phone = normalizePhone(input.customer_phone);
    if (phone.length >= 10) {
      const hit = indexes.byPhone.get(phone);
      if (hit) {
        return {
          strategy: "phone",
          candidate: hit,
          confidence: 0.9,
          reason: `phone ${maskPhone(phone)} == customer ${hit.id}`,
        };
      }
    }
  }

  // 4. Legacy_id — sem campo direto no input; pulamos.

  // 5. Nome (auxiliar). Só devolve com confidence baixa, sem auto-merge.
  const nameKey = normalizeName(input.customer_name);
  if (nameKey.length >= 3) {
    const hits = indexes.byName.get(nameKey) ?? [];
    if (hits.length === 1) {
      return {
        strategy: "name",
        candidate: hits[0]!,
        confidence: NAME_ONLY_MAX_CONFIDENCE,
        reason: `name "${input.customer_name}" == customer ${hits[0]!.id} (auxiliar; fila humana)`,
      };
    }
    if (hits.length > 1) {
      return {
        strategy: "name",
        candidate: null,
        confidence: 0,
        reason: `name "${input.customer_name}" ambíguo (${hits.length} candidatos) — fila humana`,
      };
    }
  }

  return {
    strategy: "unmatched",
    candidate: null,
    confidence: 0,
    reason: `Sem match em nenhuma estratégia. Requer reconciliação humana.`,
  };
}

// ---------------------------------------------------------------------------
// Regras P0 de decisão de outcome (após match).
// ---------------------------------------------------------------------------

/**
 * Match automático seguro exige confidence >= 0.9. Abaixo disso vai para
 * fila humana. Nome sozinho NUNCA é auto-merge (confidence 0.4).
 */
export function shouldAutoAccept(strategy: MatchStrategy, confidence: number): boolean {
  if (
    strategy === "reconciliation" ||
    strategy === "provider_id" ||
    strategy === "cpf" ||
    strategy === "phone" ||
    strategy === "internal_id"
  ) {
    return confidence >= 0.9;
  }
  return false;
}

function maskCpf(cpf: string): string {
  if (cpf.length < 11) return "***";
  return `${cpf.slice(0, 3)}.***.***-${cpf.slice(-2)}`;
}

function maskPhone(phone: string): string {
  if (phone.length < 10) return "***";
  return `(${phone.slice(0, 2)}) *****-${phone.slice(-4)}`;
}
