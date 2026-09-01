import type {
  CustomerCandidate,
  MatchResult,
  MatchStrategy,
  PagBankSubscriptionInput,
} from "./types.ts";

// -----------------------------------------------------------------------------
// Matching PagBank → CRM.
//
// Prioridade (P0, ordem estrita):
//   1. provider_customer_id já vinculado (via subscriptions.provider_customer_id)
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
  // Se vier com DDI 55, remove. Preserva DDD+número.
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
}

export function buildEmptyMatchInputs(): MatchInputs {
  return {
    byProviderCustomerId: new Map(),
    byCpf: new Map(),
    byPhone: new Map(),
    byLegacyId: new Map(),
    byName: new Map(),
  };
}

export function matchCustomer(
  input: PagBankSubscriptionInput,
  indexes: MatchInputs,
): MatchResult {
  // 1. provider_customer_id — só quando já temos o vínculo.
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

  // 4. Legacy_id (raro, mas se input trouxer explícito).
  //    Aqui usamos o `provider_customer_id` como fallback para legacy_id se
  //    houver colisão intencional (import pré-existente).
  //    Nenhum campo direto de legacy_id no input hoje — pulamos.

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
    reason: `Sem match em nenhuma estratégia. Cliente novo.`,
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
  if (strategy === "provider_id" || strategy === "cpf" || strategy === "phone" || strategy === "internal_id") {
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
