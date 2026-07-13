/**
 * Composição de leitura para a visão "Assinantes detectados / validação".
 *
 * - Enquanto DGN_GROWTH_DATA_SOURCE=json: monta a visão a partir do seed
 *   dos 13 assinantes + JSON legado, executando conciliação em memória.
 * - Quando DGN_GROWTH_DATA_SOURCE=db: (TODO) ler diretamente de
 *   crm_subscriptions + crm_customers via `subscriptionsRepo`.
 *
 * A função é síncrona/read-only e não faz nenhuma escrita.
 */

import legacyCustomers from "../dgn-customers.json";
import { SUBSCRIBERS_2026_Q3 } from "../../../db/seeds/subscribers-2026-q3";
import type { NormalizedName } from "./normalizers";
import { normalizeName, normalizePhone, normalizePlate } from "./normalizers";

export interface DetectedSubscriberView {
  seedName: string;
  displayName: string;
  plan: string;
  cycle: string;
  status: "detectado" | "pendente_validacao";
  plates: string[];               // mascaradas
  nextScheduledServiceAt: string | null;
  sourceReference: string;
  requiresManualReview: boolean;
  matchedLegacyId: string | null;
  matchReason: "match_by_phone" | "match_by_plate" | "match_by_name" | "no_match";
  notes: string;
  // sinal claro: se este assinante é um dos Founders confirmados, exibir badge
  preservedFounderNumber?: string;
  isReopenedFounder?: boolean;    // Iara Nº004 reaberta
}

const PRESERVED_FOUNDER_NUMBER: Record<string, string> = {
  "benedito constantino": "001",
  "jose moreira":          "002",
  "rikardo oliveira":      "003",
};

const REOPENED_FOUNDERS: Set<string> = new Set(["iara menezes", "iara"]);

interface LegacyRow {
  id: string;
  name: string;
  phone?: string;
  plate?: string;
}

function findLegacyMatch(
  seedName: NormalizedName,
  aliases: NormalizedName[],
  plates: string[],
  legacy: LegacyRow[],
): { legacy: LegacyRow | null; reason: DetectedSubscriberView["matchReason"] } {
  const plateSet = new Set(plates);
  const nameSet = new Set([seedName.normalized, ...aliases.map((a) => a.normalized)].filter(Boolean));

  const byPlate = plateSet.size > 0
    ? legacy.find((r) => {
        const p = normalizePlate(r.plate);
        return p.classification.startsWith("valida") && plateSet.has(p.compact);
      })
    : undefined;
  if (byPlate) return { legacy: byPlate, reason: "match_by_plate" };

  const byName = legacy.find((r) => {
    const n = normalizeName(r.name);
    if (!n.normalized) return false;
    return nameSet.has(n.normalized);
  });
  if (byName) return { legacy: byName, reason: "match_by_name" };

  return { legacy: null, reason: "no_match" };
}

export function buildDetectedSubscribersView(): DetectedSubscriberView[] {
  const legacy = (legacyCustomers as unknown as LegacyRow[]) ?? [];

  return SUBSCRIBERS_2026_Q3.map((seed) => {
    const seedName = normalizeName(seed.name);
    const aliases = (seed.aliases ?? []).map(normalizeName);
    const plates = seed.plates
      .map(normalizePlate)
      .filter((p) => p.classification.startsWith("valida"))
      .map((p) => p.compact);

    const { legacy: matched, reason } = findLegacyMatch(seedName, aliases, plates, legacy);
    const preservedFounderNumber = PRESERVED_FOUNDER_NUMBER[seedName.normalized];
    const isReopenedFounder = REOPENED_FOUNDERS.has(seedName.normalized);

    return {
      seedName: seed.name,
      displayName: matched?.name ?? seed.name,
      plan: seed.plan,
      cycle: seed.cycle,
      status: seed.status,
      plates: seed.plates.map((p) => normalizePlate(p).masked),
      nextScheduledServiceAt: seed.nextScheduledServiceAt,
      sourceReference: seed.sourceReference,
      requiresManualReview: seed.requiresManualReview ?? seedName.isIncomplete,
      matchedLegacyId: matched?.id ?? null,
      matchReason: reason,
      notes: seed.notes ?? "",
      preservedFounderNumber,
      isReopenedFounder,
    };
  });
}
