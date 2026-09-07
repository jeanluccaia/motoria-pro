import "server-only";

import type { DgnCustomer } from "./dgn-growth-utils.ts";
import { KNOWN_SUBSCRIBERS_2026_08_16, KNOWN_SUBSCRIBER_LEGACY_IDS, type KnownSubscriberRecord } from "./known-subscribers.ts";
import { normalizeName, normalizePhone, normalizePlate } from "./db/normalizers.ts";
import type { FounderEligibility } from "./founder-eligibility.ts";

// -----------------------------------------------------------------------------
// SERVER-ONLY. Único ponto que instala índices normalizados sobre
// KNOWN_SUBSCRIBERS_2026_08_16. Toda a base sensível (telefone/placa/aliases
// dos 25 assinantes) vive neste módulo — client jamais importa daqui.
//
// O client não faz matching. Ele lê `customer.knownSubscriberPlan/Status`,
// enriquecido no server via enrich-known-subscriber.ts antes do payload
// cruzar a fronteira.
// -----------------------------------------------------------------------------

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
