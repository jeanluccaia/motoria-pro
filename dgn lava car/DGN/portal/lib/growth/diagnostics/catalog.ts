// DGN Diagnósticos — Fase 0.5 (preview/mock)
//
// Duas listas SEPARADAS, decisão explícita do Jean/Digo:
//   * INSPECTION_AREAS[]      — checklist técnica visual (9 áreas), condição
//                                por área + observação + fotos + flag pública.
//   * DGN_SCORE_CRITERIA[]    — os 5 critérios de nota do DGN (0..10, step 0.5)
//                                que compõem a "Avaliação DGN". Nota nula NUNCA
//                                vira zero — é ausência de avaliação, tratada
//                                como parcial.
//
// Preços em SERVICES[] são de referência pra prototipar UI — o Digo ainda
// vai validar valores definitivos. Nada aqui é fonte comercial.

export const DIAGNOSTIC_CATALOG_VERSION = "diag-v1-2026-09" as const;

// ---------------------------------------------------------------------------
// Áreas de inspeção
// ---------------------------------------------------------------------------

export type InspectionAreaKey =
  | "pintura"
  | "contaminacao"
  | "protecao"
  | "black_piano"
  | "plasticos"
  | "vidros"
  | "rodas"
  | "interior"
  | "couro_tecido";

export type InspectionCondition =
  | "not_evaluated"
  | "good"
  | "attention"
  | "intervention_recommended";

export interface InspectionAreaDef {
  key: InspectionAreaKey;
  label: string;
  hint: string;
}

export const INSPECTION_AREAS: readonly InspectionAreaDef[] = [
  { key: "pintura",        label: "Pintura",              hint: "Uniformidade, brilho, riscos, marcas visíveis" },
  { key: "contaminacao",   label: "Contaminação",         hint: "Piche, ferrugem ferrosa, resina, insetos, sujidade impregnada" },
  { key: "protecao",       label: "Proteção",             hint: "Ceras, coating, película — presença e vida útil percebida" },
  { key: "black_piano",    label: "Black Piano",          hint: "Molduras/apliques em preto brilhante — micro-riscos, opacidade" },
  { key: "plasticos",      label: "Plásticos",            hint: "Externos (frisos, para-choques) — desbotamento, ressecamento" },
  { key: "vidros",         label: "Vidros",               hint: "Cristalização, manchas de água dura, arranhões visíveis" },
  { key: "rodas",          label: "Rodas",                hint: "Pó de freio, corrosão, pintura, pneus (ressecamento, brilho)" },
  { key: "interior",       label: "Interior",             hint: "Painéis, plásticos internos, tetos, tapetes, odor" },
  { key: "couro_tecido",   label: "Couro / Tecido",       hint: "Bancos e revestimentos — manchas, ressecamento, hidratação" },
] as const;

export interface InspectionConditionOption {
  value: InspectionCondition;
  label: string;
  publicLabel: string;
  tone: "neutral" | "good" | "attention" | "danger";
}

export const INSPECTION_CONDITION_OPTIONS: readonly InspectionConditionOption[] = [
  { value: "not_evaluated",              label: "Não avaliada",              publicLabel: "Sem observação",              tone: "neutral"   },
  { value: "good",                       label: "Boa",                       publicLabel: "Boa",                          tone: "good"      },
  { value: "attention",                  label: "Atenção",                   publicLabel: "Precisa de atenção",           tone: "attention" },
  { value: "intervention_recommended",   label: "Intervenção recomendada",   publicLabel: "Intervenção recomendada",      tone: "danger"    },
] as const;

export function getInspectionAreaDef(key: InspectionAreaKey): InspectionAreaDef {
  const found = INSPECTION_AREAS.find((a) => a.key === key);
  if (!found) throw new Error(`Área de inspeção desconhecida: ${key}`);
  return found;
}

export function getInspectionConditionOption(
  value: InspectionCondition,
): InspectionConditionOption {
  const found = INSPECTION_CONDITION_OPTIONS.find((o) => o.value === value);
  if (!found) throw new Error(`Condição desconhecida: ${value}`);
  return found;
}

// ---------------------------------------------------------------------------
// 5 critérios da Avaliação DGN (score 0..10, step 0.5, null = não avaliado)
// ---------------------------------------------------------------------------

export type DgnScoreCriterionKey =
  | "conservacao_pintura"
  | "brilho_profundidade"
  | "ausencia_riscos"
  | "limpeza_descontaminacao"
  | "protecao_existente";

export interface DgnScoreCriterionDef {
  key: DgnScoreCriterionKey;
  label: string;
  hint: string;
}

export const DGN_SCORE_CRITERIA: readonly DgnScoreCriterionDef[] = [
  { key: "conservacao_pintura",       label: "Conservação da pintura",     hint: "Estado geral, uniformidade, ausência de oxidação" },
  { key: "brilho_profundidade",       label: "Brilho e profundidade",       hint: "Reflexo, profundidade da cor, sensação premium" },
  { key: "ausencia_riscos",           label: "Ausência de riscos e marcas", hint: "Micro-riscos, marcas de lavagem, swirl marks" },
  { key: "limpeza_descontaminacao",   label: "Limpeza e descontaminação",   hint: "Livre de contaminantes ferrosos, piche, resinas" },
  { key: "protecao_existente",        label: "Proteção existente",           hint: "Camada de proteção aplicada e sua vida útil percebida" },
] as const;

export function getDgnScoreCriterionDef(key: DgnScoreCriterionKey): DgnScoreCriterionDef {
  const found = DGN_SCORE_CRITERIA.find((c) => c.key === key);
  if (!found) throw new Error(`Critério DGN desconhecido: ${key}`);
  return found;
}

export const DGN_SCORE_MIN = 0;
export const DGN_SCORE_MAX = 10;
export const DGN_SCORE_STEP = 0.5;

// ---------------------------------------------------------------------------
// Serviços — TS versionado (Fase 0.5)
// Preços aqui são de REFERÊNCIA para prototipar a UI; o Digo valida antes
// de qualquer publicação real. Snapshot dispara na publicação (Entrega 2).
// ---------------------------------------------------------------------------

export type ServiceKey =
  | "polimento_tecnico"
  | "polimento_premium"
  | "cristalizacao_vidros"
  | "hidratacao_couro"
  | "descontaminacao_ferrosa"
  | "protecao_ceramica_1a"
  | "revitalizacao_plasticos"
  | "higienizacao_interna_completa";

export interface ServiceDef {
  key: ServiceKey;
  label: string;
  shortDescription: string;
  referencePriceCents: number | null;
  subscriberBenefitNote: string | null;
}

export const SERVICES: readonly ServiceDef[] = [
  {
    key: "polimento_tecnico",
    label: "Polimento técnico",
    shortDescription: "Remoção de micro-riscos e recuperação de brilho em etapa única.",
    referencePriceCents: 45000,
    subscriberBenefitNote: "Assinante Priority — 20% de cortesia",
  },
  {
    key: "polimento_premium",
    label: "Polimento premium (2 etapas)",
    shortDescription: "Correção profunda + refinamento. Devolve profundidade da cor.",
    referencePriceCents: 75000,
    subscriberBenefitNote: "Assinante Smart/Priority — 15% de cortesia",
  },
  {
    key: "cristalizacao_vidros",
    label: "Cristalização de vidros",
    shortDescription: "Repelência à água + facilidade de limpeza por até 6 meses.",
    referencePriceCents: 22000,
    subscriberBenefitNote: null,
  },
  {
    key: "hidratacao_couro",
    label: "Hidratação de couro",
    shortDescription: "Nutrição + proteção UV nos revestimentos em couro.",
    referencePriceCents: 28000,
    subscriberBenefitNote: null,
  },
  {
    key: "descontaminacao_ferrosa",
    label: "Descontaminação ferrosa",
    shortDescription: "Remove partículas metálicas impregnadas antes do polimento.",
    referencePriceCents: 18000,
    subscriberBenefitNote: null,
  },
  {
    key: "protecao_ceramica_1a",
    label: "Proteção cerâmica (1 ano)",
    shortDescription: "Camada de proteção duradoura sobre pintura corrigida.",
    referencePriceCents: 120000,
    subscriberBenefitNote: "Assinante Priority — condição comercial exclusiva",
  },
  {
    key: "revitalizacao_plasticos",
    label: "Revitalização de plásticos externos",
    shortDescription: "Devolve cor e proteção UV a frisos e para-choques.",
    referencePriceCents: 15000,
    subscriberBenefitNote: null,
  },
  {
    key: "higienizacao_interna_completa",
    label: "Higienização interna completa",
    shortDescription: "Bancos, teto, tapetes, painéis — limpeza profunda e desodorização.",
    referencePriceCents: 55000,
    subscriberBenefitNote: null,
  },
] as const;

export function getServiceDef(key: ServiceKey): ServiceDef {
  const found = SERVICES.find((s) => s.key === key);
  if (!found) throw new Error(`Serviço desconhecido: ${key}`);
  return found;
}
