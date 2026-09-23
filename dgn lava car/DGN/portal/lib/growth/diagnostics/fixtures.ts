// DGN Diagnósticos — Fixtures da Fase 0.5.
//
// TODO conteúdo é fictício. Usado exclusivamente pra prototipar UI/UX.
// A palavra "DEMO_" no início dos identificadores deixa isso explícito
// pra quem for reler o código em Prod (nunca deve ir pra banco/UI final).
//
// Cenários cobertos (pedido do Digo/Jean):
//   * cliente com 2 veículos → seleção obrigatória
//   * avaliação parcial: um dos 5 critérios com score = null
//   * área com foto pública + área com foto interna (`internalOnly=true`)
//   * hero ilustrativo (mock://) — nunca é foto real do veículo do cliente

import { DIAGNOSTIC_CATALOG_VERSION } from "./catalog";
import type {
  DiagnosticCustomer,
  DiagnosticDraft,
  DiagnosticInspectionArea,
  DiagnosticScoreEntry,
} from "./types";

export const DEMO_CUSTOMER: DiagnosticCustomer = {
  id: "demo-customer-jose",
  name: "José Sérgio Bressan Jr",
  phoneMasked: "(19) 9•••••-4567",
  vehicles: [
    {
      id: "demo-vehicle-hb20",
      brand: "Hyundai",
      model: "HB20 1.0 Comfort",
      plate: "ABC1D23",
      color: "Prata",
      isPrimary: true,
    },
    {
      id: "demo-vehicle-basalt",
      brand: "Chevrolet",
      model: "Basalt Premier",
      plate: "XYZ9K88",
      color: "Preto sólido",
      isPrimary: false,
    },
  ],
};

const DEMO_AREAS: DiagnosticInspectionArea[] = [
  {
    areaKey: "pintura",
    condition: "attention",
    observation: "Micro-riscos concentrados no capô e teto. Textura de laranja discreta nas laterais.",
    publicVisible: true,
    photos: [
      {
        id: "demo-photo-pintura-1",
        areaKey: "pintura",
        storagePath: "mock://demo/pintura-capo.jpg",
        caption: "Capô sob luz raking — micro-riscos evidentes",
        internalOnly: false,
        order: 1,
      },
    ],
  },
  {
    areaKey: "contaminacao",
    condition: "intervention_recommended",
    observation: "Contaminação ferrosa em toda a carroceria; piche no para-choque traseiro.",
    publicVisible: true,
    photos: [
      {
        id: "demo-photo-contaminacao-1",
        areaKey: "contaminacao",
        storagePath: "mock://demo/contaminacao-piche.jpg",
        caption: "Piche impregnado — para-choque traseiro",
        internalOnly: false,
        order: 1,
      },
    ],
  },
  {
    areaKey: "protecao",
    condition: "attention",
    observation: "Cera esgotada. Água já não escorre — 'sheeting' comprometido.",
    publicVisible: true,
    photos: [],
  },
  {
    areaKey: "black_piano",
    condition: "attention",
    observation: "Molduras da coluna com micro-riscos (uso de pano seco).",
    publicVisible: true,
    photos: [],
  },
  {
    areaKey: "plasticos",
    condition: "good",
    observation: "Frisos e para-choques em bom estado, sem desbotamento.",
    publicVisible: true,
    photos: [],
  },
  {
    areaKey: "vidros",
    condition: "good",
    observation: "Sem manchas de água dura. Sem riscos aparentes.",
    publicVisible: true,
    photos: [],
  },
  {
    areaKey: "rodas",
    condition: "not_evaluated",
    observation: "",
    publicVisible: true,
    photos: [],
  },
  {
    areaKey: "interior",
    condition: "attention",
    observation: "Sinal de sujeira orgânica no forro do teto — nota INTERNA para curador.",
    publicVisible: false, // ⇐ observação interna (não sai no snapshot público)
    photos: [
      {
        id: "demo-photo-interior-1",
        areaKey: "interior",
        storagePath: "mock://demo/interior-teto.jpg",
        caption: "Referência interna do curador — foto de teto sob UV",
        internalOnly: true,   // ⇐ foto NUNCA vaza em página pública
        order: 1,
      },
    ],
  },
  {
    areaKey: "couro_tecido",
    condition: "good",
    observation: "Bancos em couro sintético — hidratação recente, sem manchas.",
    publicVisible: true,
    photos: [],
  },
];

// Avaliação parcial: 4 dos 5 critérios avaliados. `ausencia_riscos` fica null
// pra demonstrar visualmente o estado "não avaliado" (diferente de 0).
const DEMO_SCORES: DiagnosticScoreEntry[] = [
  { criterionKey: "conservacao_pintura",     score: 6.5 },
  { criterionKey: "brilho_profundidade",     score: 6 },
  { criterionKey: "ausencia_riscos",         score: null }, // parcial de propósito
  { criterionKey: "limpeza_descontaminacao", score: 5 },
  { criterionKey: "protecao_existente",      score: 5.5 },
];

export const DEMO_DIAGNOSTIC_DRAFT: DiagnosticDraft = {
  id: "demo-diag-001",
  catalogVersion: DIAGNOSTIC_CATALOG_VERSION,
  status: "draft",
  customer: DEMO_CUSTOMER,
  selectedVehicleId: "demo-vehicle-hb20",
  performedAt: "2026-09-23",
  performedBy: "Gianluca (curador DGN)",
  areas: DEMO_AREAS,
  scores: DEMO_SCORES,
  summary:
    "Pintura preserva a cor original mas exige polimento técnico e descontaminação " +
    "ferrosa antes de qualquer proteção nova. Sem urgência crítica — janela ideal " +
    "para intervenção nos próximos 30 dias.",
  recommendations: [
    {
      serviceKey: "descontaminacao_ferrosa",
      reason: "Etapa obrigatória antes do polimento — impede propagação de oxidação.",
      priority: "prioritario",
    },
    {
      serviceKey: "polimento_tecnico",
      reason: "Remove micro-riscos e devolve uniformidade de brilho.",
      priority: "recomendado",
    },
    {
      serviceKey: "cristalizacao_vidros",
      reason: "Complemento estético — facilita manutenção nas chuvas.",
      priority: "opcional",
    },
  ],
  investment: [
    {
      serviceKey: "descontaminacao_ferrosa",
      basePriceCents: 18000,
      discountPercent: 0,
      finalPriceCents: 18000,
      installments: 2,
      pixEligible: true,
      note: "Único procedimento sem cortesia recorrente.",
    },
    {
      serviceKey: "polimento_tecnico",
      basePriceCents: 45000,
      discountPercent: 20,
      finalPriceCents: 36000,
      installments: 3,
      pixEligible: true,
      note: "Assinante Priority — 20% de cortesia aplicada.",
    },
    {
      serviceKey: "cristalizacao_vidros",
      basePriceCents: 22000,
      discountPercent: 0,
      finalPriceCents: 22000,
      installments: 2,
      pixEligible: true,
      note: "Opcional — pode entrar em uma segunda janela.",
    },
  ],
  publicVisibilityDefaults: {
    showAreas: true,
    showScores: true,
    showInvestment: true,
  },
  draftUpdatedAt: "2026-09-23T18:30:00.000Z",
};
