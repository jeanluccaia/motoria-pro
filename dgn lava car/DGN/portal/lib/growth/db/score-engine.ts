/**
 * Score DGN — versionado, determinístico, explicável.
 * Nunca seleciona Founder automaticamente. Score gera recomendação.
 * Sempre acompanhado de composição, penalidades e versão.
 */

export const DGN_SCORE_VERSION = "DGN_SCORE_V1" as const;

export type ScoreVersion = typeof DGN_SCORE_VERSION;

export type ScoreTier =
  | "prioridade_maxima" // 85-100
  | "forte_candidato"   // 70-84
  | "precisa_curadoria" // 55-69
  | "baixa_prioridade"; // <55

export interface ScoreInput {
  /** média de intervalo entre visitas em dias — menor = mais recorrente */
  averageIntervalDays: number | null;
  /** dias desde o último atendimento */
  daysSinceLastService: number | null;
  serviceCount: number;
  historicalValue: number;
  averageTicket: number;
  planFit: "smart" | "priority" | "corporate" | "não_identificado";
  dataQualityIssues: DataQualityIssue[];
  strategicLink: boolean;      // origem estratégica (Genebra, Cury, Medley, etc.)
  relationshipStrength: 0 | 1 | 2 | 3; // 0=nenhum, 3=founder ativo
  /** clientes cuja assinatura foi detectada não devem competir na fila de aquisição */
  hasDetectedSubscription: boolean;
}

export type DataQualityIssue =
  | "veiculo_indefinido"
  | "telefone_ausente"
  | "telefone_invalido"
  | "atendimento_antigo"
  | "duplicidade_provavel"
  | "pendencia_nao_resolvida"
  | "nome_com_prefixo"
  | "dados_inconsistentes";

export interface ScorePenalty {
  code: string;
  points: number; // sempre negativo
  reason: string;
}

export interface ScoreBreakdown {
  scoreVersion: ScoreVersion;
  totalScore: number;
  tier: ScoreTier;
  components: {
    recurrence: number;
    recency: number;
    serviceCount: number;
    value: number;
    planFit: number;
    dataQuality: number;
    strategicLink: number;
    relationship: number;
  };
  penalties: ScorePenalty[];
  explanation: string[];
}

const CAPS = {
  recurrence: 25,
  recency: 20,
  serviceCount: 15,
  value: 15,
  planFit: 10,
  dataQuality: 5,
  strategicLink: 5,
  relationship: 5,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ---------------------------------------------------------------------------
// Componentes
// ---------------------------------------------------------------------------

function scoreRecurrence(intervalDays: number | null): number {
  if (intervalDays === null || intervalDays <= 0) return 0;
  // 20 dias ou menos: score cheio. 90+ dias: zero.
  if (intervalDays <= 20) return CAPS.recurrence;
  if (intervalDays >= 90) return 0;
  const ratio = (90 - intervalDays) / (90 - 20);
  return round2(CAPS.recurrence * ratio);
}

function scoreRecency(daysSinceLast: number | null): number {
  if (daysSinceLast === null) return 0;
  if (daysSinceLast <= 30) return CAPS.recency;
  if (daysSinceLast >= 365) return 0;
  const ratio = (365 - daysSinceLast) / (365 - 30);
  return round2(CAPS.recency * ratio);
}

function scoreServiceCount(count: number): number {
  if (count <= 0) return 0;
  if (count >= 40) return CAPS.serviceCount;
  return round2(CAPS.serviceCount * (count / 40));
}

function scoreValue(historicalValue: number, averageTicket: number): number {
  const historicalComponent = historicalValue >= 2000
    ? CAPS.value * 0.7
    : CAPS.value * 0.7 * (historicalValue / 2000);
  const ticketComponent = averageTicket >= 80
    ? CAPS.value * 0.3
    : CAPS.value * 0.3 * (averageTicket / 80);
  return round2(clamp(historicalComponent + ticketComponent, 0, CAPS.value));
}

function scorePlanFit(planFit: ScoreInput["planFit"]): number {
  switch (planFit) {
    case "priority":
    case "corporate":
      return CAPS.planFit;
    case "smart":
      return round2(CAPS.planFit * 0.7);
    case "não_identificado":
    default:
      return 0;
  }
}

function scoreDataQuality(issues: DataQualityIssue[]): number {
  if (issues.length === 0) return CAPS.dataQuality;
  // cada problema tira 1 ponto (até 5)
  return round2(clamp(CAPS.dataQuality - issues.length, 0, CAPS.dataQuality));
}

function scoreStrategicLink(strategic: boolean): number {
  return strategic ? CAPS.strategicLink : 0;
}

function scoreRelationship(strength: ScoreInput["relationshipStrength"]): number {
  return round2((strength / 3) * CAPS.relationship);
}

// ---------------------------------------------------------------------------
// Penalidades
// ---------------------------------------------------------------------------

const PENALTY_TABLE: Record<DataQualityIssue, ScorePenalty> = {
  veiculo_indefinido: { code: "veiculo_indefinido", points: -3, reason: "veículo 'A definir'" },
  telefone_ausente: { code: "telefone_ausente", points: -6, reason: "telefone ausente" },
  telefone_invalido: { code: "telefone_invalido", points: -4, reason: "telefone inválido" },
  atendimento_antigo: { code: "atendimento_antigo", points: -3, reason: "último atendimento antigo" },
  duplicidade_provavel: { code: "duplicidade_provavel", points: -4, reason: "duplicidade provável" },
  pendencia_nao_resolvida: { code: "pendencia_nao_resolvida", points: -3, reason: "pendência/reclamação não resolvida" },
  nome_com_prefixo: { code: "nome_com_prefixo", points: -2, reason: "nome com prefixo artificial" },
  dados_inconsistentes: { code: "dados_inconsistentes", points: -3, reason: "dados inconsistentes" },
};

function buildPenalties(input: ScoreInput): ScorePenalty[] {
  const penalties: ScorePenalty[] = input.dataQualityIssues.map((issue) => PENALTY_TABLE[issue]);
  if (input.hasDetectedSubscription) {
    penalties.push({
      code: "assinatura_detectada_na_fila",
      points: -15,
      reason: "assinatura detectada — não deve competir na fila de aquisição",
    });
  }
  return penalties;
}

function tierOf(total: number): ScoreTier {
  if (total >= 85) return "prioridade_maxima";
  if (total >= 70) return "forte_candidato";
  if (total >= 55) return "precisa_curadoria";
  return "baixa_prioridade";
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export function computeDgnScore(input: ScoreInput): ScoreBreakdown {
  const components = {
    recurrence: scoreRecurrence(input.averageIntervalDays),
    recency: scoreRecency(input.daysSinceLastService),
    serviceCount: scoreServiceCount(input.serviceCount),
    value: scoreValue(input.historicalValue, input.averageTicket),
    planFit: scorePlanFit(input.planFit),
    dataQuality: scoreDataQuality(input.dataQualityIssues),
    strategicLink: scoreStrategicLink(input.strategicLink),
    relationship: scoreRelationship(input.relationshipStrength),
  };

  const rawTotal =
    components.recurrence +
    components.recency +
    components.serviceCount +
    components.value +
    components.planFit +
    components.dataQuality +
    components.strategicLink +
    components.relationship;

  const penalties = buildPenalties(input);
  const penaltyTotal = penalties.reduce((sum, p) => sum + p.points, 0);
  const totalScore = round2(clamp(rawTotal + penaltyTotal, 0, 100));

  const explanation: string[] = [
    `Base bruta: ${round2(rawTotal)} pts (versão ${DGN_SCORE_VERSION}).`,
    `Recorrência ${components.recurrence}/${CAPS.recurrence}, recência ${components.recency}/${CAPS.recency}, atendimentos ${components.serviceCount}/${CAPS.serviceCount}, valor ${components.value}/${CAPS.value}.`,
    `Plano ${components.planFit}/${CAPS.planFit}, qualidade ${components.dataQuality}/${CAPS.dataQuality}, origem ${components.strategicLink}/${CAPS.strategicLink}, relacionamento ${components.relationship}/${CAPS.relationship}.`,
  ];
  if (penalties.length > 0) {
    explanation.push(
      `Penalidades (${penaltyTotal} pts): ${penalties.map((p) => `${p.reason} (${p.points})`).join("; ")}.`,
    );
  }

  return {
    scoreVersion: DGN_SCORE_VERSION,
    totalScore,
    tier: tierOf(totalScore),
    components,
    penalties,
    explanation,
  };
}
