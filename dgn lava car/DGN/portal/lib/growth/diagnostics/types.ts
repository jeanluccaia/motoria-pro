// DGN Diagnósticos — Fase 0.5 (preview/mock)
//
// Contratos do diagnóstico em memória. NÃO é schema Postgres — a modelagem
// oficial entra na Entrega 1 depois que Digo/Jean validarem o preview e o
// formulário. Aqui é só o suficiente pra desenhar UI honesta.

import type {
  DgnScoreCriterionKey,
  InspectionAreaKey,
  InspectionCondition,
  ServiceKey,
} from "./catalog";

export interface DiagnosticCustomer {
  id: string;
  name: string;
  phoneMasked: string;
  vehicles: DiagnosticVehicle[];
}

export interface DiagnosticVehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  color: string;
  isPrimary: boolean;
}

export interface DiagnosticPhoto {
  id: string;
  areaKey: InspectionAreaKey | null;
  storagePath: string;   // "mock://" no preview; futuro: bucket real
  caption: string;
  internalOnly: boolean; // true = nunca sai em snapshot público
  order: number;
}

export interface DiagnosticInspectionArea {
  areaKey: InspectionAreaKey;
  condition: InspectionCondition;
  observation: string;
  publicVisible: boolean;
  photos: DiagnosticPhoto[];
}

export interface DiagnosticScoreEntry {
  criterionKey: DgnScoreCriterionKey;
  score: number | null; // null = não avaliado. NUNCA vira 0 na média.
}

export interface DiagnosticRecommendation {
  serviceKey: ServiceKey;
  reason: string;
  priority: "opcional" | "recomendado" | "prioritario";
}

export interface DiagnosticInvestmentItem {
  serviceKey: ServiceKey;
  basePriceCents: number;
  discountPercent: number; // 0..100
  finalPriceCents: number; // derivado; UI força recomputo
  installments: number | null;
  pixEligible: boolean;
  note: string;
}

export type DiagnosticStatus =
  | "draft"
  | "review_ready"
  | "published" // não usado na Fase 0.5, aqui pra alinhar type
  | "archived";

export interface DiagnosticDraft {
  id: string;                        // client-side id (fase 0.5)
  catalogVersion: string;
  status: DiagnosticStatus;
  customer: DiagnosticCustomer;
  selectedVehicleId: string;         // seleção obrigatória se houver >1 veículo
  performedAt: string | null;        // ISO date
  performedBy: string;               // avaliador
  areas: DiagnosticInspectionArea[]; // 9 áreas, sempre completas na estrutura
  scores: DiagnosticScoreEntry[];    // 5 critérios, score:null permitido
  summary: string;                   // parágrafo curto para o cliente
  recommendations: DiagnosticRecommendation[];
  investment: DiagnosticInvestmentItem[];
  publicVisibilityDefaults: {
    showAreas: boolean;
    showScores: boolean;
    showInvestment: boolean;
  };
  draftUpdatedAt: string;            // ISO — timestamp da última alteração
}
