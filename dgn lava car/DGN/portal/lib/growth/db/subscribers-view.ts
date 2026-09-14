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

import legacyCustomers from "../dgn-customers.json" with { type: "json" };
import { SUBSCRIBERS_2026_Q3 } from "../../../db/seeds/subscribers-2026-q3.ts";
import type { DgnCustomer } from "../dgn-growth-utils.ts";
import { maskPlate } from "../dgn-growth-utils.ts";
import type { NormalizedName } from "./normalizers.ts";
import { normalizeName, normalizePhone, normalizePlate } from "./normalizers.ts";

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

// ---------------------------------------------------------------------------
// Central operacional de assinantes (Fase 1 read-only).
// Unifica assinantes ativos + detectados + pendentes + inadimplentes numa
// única listagem clicável para a aba /admin/growth/assinantes-detectados.
// Cada linha aponta para /admin/growth/customers/[id] onde vive o Profile 360
// com os 5 editores canônicos do Batch 2. NÃO cria segunda fonte de dados:
// consome DgnCustomer[] já enriquecido por loadGrowthData().
// ---------------------------------------------------------------------------

export type SubscribersCentralRowStatus = "ativo" | "detectado" | "pendente_validacao" | "inadimplente";

export interface SubscribersCentralRow {
  id: string;                                    // legacy_id ou UUID — safe pra Link href
  displayName: string;
  planLabel: string;                             // activePlan canônico ou "—"
  nextDueDate: string | null;                    // YYYY-MM-DD ou null
  paymentMethodLabel: string;                    // já resolvido para exibição
  vehicleLabel: string;                          // marca + modelo
  maskedPlate: string;                           // placa mascarada
  status: SubscribersCentralRowStatus;
  statusLabel: string;                           // rótulo humano do status
  hasActiveSubscription: boolean;
  preservedFounderNumber?: string;               // Nº001/002/003
  isReopenedFounder?: boolean;                   // Iara Nº004
}

function paymentMethodDisplay(
  method: NonNullable<DgnCustomer["subscription"]>["paymentMethod"],
  label: string | null,
): string {
  if (label && label.trim()) return label.trim();
  switch (method) {
    case "card_recurring": return "Recorrência no cartão";
    case "manual":         return "Cobrança manual";
    case "not_needed":     return "—";
    case "unknown":        return "Não identificada";
    default:               return "Não identificada";
  }
}

function normalizeStatus(raw: string | null | undefined, isActive: boolean): SubscribersCentralRowStatus | null {
  if (isActive) return "ativo";
  const value = (raw ?? "").toLowerCase();
  if (value === "ativo") return "ativo";
  if (value === "detectado") return "detectado";
  if (value === "pendente_validacao") return "pendente_validacao";
  if (value === "inadimplente") return "inadimplente";
  return null;
}

function statusLabel(status: SubscribersCentralRowStatus): string {
  switch (status) {
    case "ativo":                return "Ativo";
    case "detectado":            return "Detectado";
    case "pendente_validacao":   return "Pendente validação";
    case "inadimplente":         return "Inadimplente";
  }
}

const STATUS_ORDER: Record<SubscribersCentralRowStatus, number> = {
  ativo: 0,
  detectado: 1,
  pendente_validacao: 2,
  inadimplente: 3,
};

/**
 * Recebe a lista completa vinda de `loadGrowthData()` já enriquecida
 * (subscription block populado por mapGrowthSnapshot). Retorna apenas
 * quem tem contrato relevante para a central operacional.
 */
export function buildSubscribersCentralView(customers: DgnCustomer[]): SubscribersCentralRow[] {
  const rows: SubscribersCentralRow[] = [];
  for (const customer of customers) {
    const sub = customer.subscription;
    if (!sub) continue;
    const status = normalizeStatus(sub.status, sub.isActive);
    if (!status) continue;

    const normalized = normalizeName(customer.name);
    rows.push({
      id: customer.id,
      displayName: customer.name || "Sem nome",
      planLabel: (customer.activePlan && customer.activePlan.trim()) || "—",
      nextDueDate: sub.nextDueDate,
      paymentMethodLabel: paymentMethodDisplay(sub.paymentMethod, sub.paymentMethodLabel),
      vehicleLabel: customer.vehicle || "A definir",
      maskedPlate: maskPlate(customer.plate) || "—",
      status,
      statusLabel: statusLabel(status),
      hasActiveSubscription: sub.isActive,
      preservedFounderNumber: PRESERVED_FOUNDER_NUMBER[normalized.normalized],
      isReopenedFounder: REOPENED_FOUNDERS.has(normalized.normalized),
    });
  }

  rows.sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    return a.displayName.localeCompare(b.displayName, "pt-BR", { sensitivity: "base" });
  });

  return rows;
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
