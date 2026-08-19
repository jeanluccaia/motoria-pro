/**
 * Regra canônica: quem pode receber convite Founder de AQUISIÇÃO?
 *
 * Curadoria Founder é fila de aquisição. Cliente com assinatura vigente,
 * renovação pendente, Founder confirmado ou descartado NÃO deve aparecer
 * como candidato — mesmo que tenha score alto ou plano sugerido válido.
 *
 * Um único helper server-safe centraliza a decisão. UI e route reutilizam.
 * Nunca use score, plano sugerido ou `commercialStatus === "Selecionado"`
 * como prova de assinatura — só a base real de assinantes ativos vale.
 */

import { isConfirmedFounder, type DgnCustomer } from "./dgn-growth-data.ts";
import { KNOWN_SUBSCRIBERS_2026_08_16, KNOWN_SUBSCRIBER_LEGACY_IDS, type KnownSubscriberRecord } from "./known-subscribers.ts";
import { normalizeName, normalizePhone, normalizePlate } from "./db/normalizers.ts";

export type FounderIneligibleReason =
  | "founder_confirmado"
  | "assinante_ativo"
  | "renovacao_pendente"
  | "descartado"
  | "assinatura_detectada"
  | "sem_dados_minimos";

export interface FounderEligibility {
  eligible: boolean;
  reason?: FounderIneligibleReason;
  /**
   * Mensagem curta e operável, pronta para exibir ao operador. Sem SQL, sem IDs internos.
   * Ex.: "Este cliente já é assinante Priority e não participa da fila de aquisição."
   */
  operatorMessage?: string;
  /** Match resolvido contra `KNOWN_SUBSCRIBERS_2026_08_16` — quando aplicável. */
  subscriberMatch?: KnownSubscriberRecord;
  /** Motivo do match (ajuda debug). */
  subscriberMatchReason?: "phone" | "plate" | "name" | "alias" | "legacy_id" | "preserved_founder";
}

// ---------------------------------------------------------------------------
// Índices normalizados (montados uma vez em memória)
// ---------------------------------------------------------------------------

interface SubscriberIndex {
  byPhone: Map<string, KnownSubscriberRecord>;
  byPlate: Map<string, KnownSubscriberRecord>;
  byName: Map<string, KnownSubscriberRecord>;
}

let cachedIndex: SubscriberIndex | null = null;

function ensureIndex(): SubscriberIndex {
  if (cachedIndex) return cachedIndex;
  const byPhone = new Map<string, KnownSubscriberRecord>();
  const byPlate = new Map<string, KnownSubscriberRecord>();
  const byName = new Map<string, KnownSubscriberRecord>();

  for (const record of KNOWN_SUBSCRIBERS_2026_08_16) {
    for (const raw of record.phones) {
      const norm = normalizePhone(raw);
      if (norm.classification === "valido") byPhone.set(norm.digits, record);
    }
    for (const raw of record.plates) {
      const norm = normalizePlate(raw);
      if (norm.classification.startsWith("valida")) byPlate.set(norm.compact, record);
    }
    for (const rawName of [record.name, ...(record.aliases ?? [])]) {
      const norm = normalizeName(rawName);
      if (norm.normalized) byName.set(norm.normalized, record);
    }
  }

  cachedIndex = { byPhone, byPlate, byName };
  return cachedIndex;
}

// ---------------------------------------------------------------------------
// Reconciliação por customer → KnownSubscriberRecord
// ---------------------------------------------------------------------------

export function matchKnownSubscriber(
  customer: Pick<DgnCustomer, "id" | "name" | "phone" | "plate">,
): { record: KnownSubscriberRecord; reason: FounderEligibility["subscriberMatchReason"] } | null {
  const index = ensureIndex();

  if (KNOWN_SUBSCRIBER_LEGACY_IDS.has(customer.id)) {
    const byName = index.byName.get(normalizeName(customer.name).normalized);
    if (byName) return { record: byName, reason: "legacy_id" };
  }

  const phone = normalizePhone(customer.phone);
  if (phone.classification === "valido") {
    const hit = index.byPhone.get(phone.digits);
    if (hit) return { record: hit, reason: "phone" };
  }

  const plate = normalizePlate(customer.plate);
  if (plate.classification.startsWith("valida")) {
    const hit = index.byPlate.get(plate.compact);
    if (hit) return { record: hit, reason: "plate" };
  }

  const nameKey = normalizeName(customer.name).normalized;
  if (nameKey) {
    const hit = index.byName.get(nameKey);
    if (hit) return { record: hit, reason: nameKey === normalizeName(hit.name).normalized ? "name" : "alias" };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Regra canônica de elegibilidade
// ---------------------------------------------------------------------------

/**
 * Retorna se um cliente pode entrar na fila de Curadoria Founder.
 *
 * Blocking (por ordem de prioridade):
 *  1. Founder confirmado (001/002/003 ou founder_status = 'confirmado').
 *  2. Assinante ativo já reconhecido (base 4uCar 2026-08-16 ou
 *     commercialStatus = "Assinante Ativo").
 *  3. Renovação pendente na base 4uCar.
 *  4. Descartado / bloqueado no pipeline.
 *  5. Assinatura detectada aguardando validação (seed / customer flag).
 *  6. Sem dados mínimos (sem nome, sem telefone válido).
 */
export function isFounderAcquisitionEligible(customer: DgnCustomer): FounderEligibility {
  // 1. Founder confirmado — proteção dura
  if (isConfirmedFounder(customer) || customer.campaign?.founderStatus === "confirmado") {
    return {
      eligible: false,
      reason: "founder_confirmado",
      operatorMessage: "Founder confirmado. Fora da fila de aquisição.",
      subscriberMatchReason: "preserved_founder",
    };
  }

  // 2/3/5. Match contra base real de assinantes
  const match = matchKnownSubscriber(customer);
  if (match) {
    const { record, reason } = match;
    if (record.status === "renovacao_pendente") {
      return {
        eligible: false,
        reason: "renovacao_pendente",
        operatorMessage: `Assinante ${record.plan} com renovação pendente. Fora da fila de aquisição até a renovação ser resolvida.`,
        subscriberMatch: record,
        subscriberMatchReason: reason,
      };
    }
    return {
      eligible: false,
      reason: "assinante_ativo",
      operatorMessage: `Já é assinante DGN ${record.plan}. Fora da fila de aquisição — trate como retenção.`,
      subscriberMatch: record,
      subscriberMatchReason: reason,
    };
  }

  // 2b. Assinante ativo pelo próprio status do customer
  if (customer.commercialStatus === "Assinante Ativo") {
    return {
      eligible: false,
      reason: "assinante_ativo",
      operatorMessage: "Cliente marcado como Assinante Ativo. Fora da fila de aquisição.",
    };
  }

  // 4. Descartado / bloqueado no pipeline
  if (
    customer.campaign?.founderStatus === "descartado" ||
    customer.campaign?.commercialStage === "descartado" ||
    customer.commercialStatus === "Perdido"
  ) {
    return {
      eligible: false,
      reason: "descartado",
      operatorMessage: "Cliente descartado. Reative pela curadoria avançada antes de gerar convite.",
    };
  }

  // 6. Sem dados mínimos
  if (customer.hasValidPhone === false) {
    return {
      eligible: false,
      reason: "sem_dados_minimos",
      operatorMessage: "Telefone não cadastrado. Complete o cadastro antes de convidar como Founder.",
    };
  }
  if (!customer.name?.trim()) {
    return {
      eligible: false,
      reason: "sem_dados_minimos",
      operatorMessage: "Cliente sem nome. Complete o cadastro antes de convidar.",
    };
  }

  return { eligible: true };
}

/**
 * Batch helper para a Curadoria: separa elegíveis, assinantes e demais.
 * Preserva a ordem original em cada bucket.
 */
export function partitionByEligibility(customers: DgnCustomer[]) {
  const eligible: DgnCustomer[] = [];
  const subscribers: Array<{ customer: DgnCustomer; eligibility: FounderEligibility }> = [];
  const other: Array<{ customer: DgnCustomer; eligibility: FounderEligibility }> = [];

  for (const customer of customers) {
    const eligibility = isFounderAcquisitionEligible(customer);
    if (eligibility.eligible) {
      eligible.push(customer);
    } else if (
      eligibility.reason === "assinante_ativo" ||
      eligibility.reason === "renovacao_pendente" ||
      eligibility.reason === "founder_confirmado" ||
      eligibility.reason === "assinatura_detectada"
    ) {
      subscribers.push({ customer, eligibility });
    } else {
      other.push({ customer, eligibility });
    }
  }

  return { eligible, subscribers, other };
}
