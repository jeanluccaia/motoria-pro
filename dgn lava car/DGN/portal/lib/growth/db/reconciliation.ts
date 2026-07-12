/**
 * Reconciliation engine — regras 1-8 do brief.
 * Puro: recebe dois "cadastros" já normalizados e devolve uma avaliação.
 * Nunca faz merge automático em casos ambíguos.
 */

import type { NormalizedName, NormalizedPhone, NormalizedPlate } from "./normalizers";

export type MatchType =
  | "telefone_exato"
  | "placa_exata"
  | "nome_placa"
  | "nome_telefone_parcial"
  | "apenas_nome"
  | "nome_incompleto"
  | "sem_correspondencia";

export type ReviewStatus =
  | "alta_confianca"       // pode sugerir vínculo automático (ainda com auditoria)
  | "precisa_revisar"      // média confiança — fila humana
  | "bloqueado"            // proibido merge automático
  | "sem_correspondencia";

export interface ReconciliationSubject {
  name: NormalizedName;
  phone: NormalizedPhone | null;
  plates: NormalizedPlate[];
}

export interface ReconciliationOutcome {
  matchType: MatchType;
  confidence: number;    // 0..1
  reviewStatus: ReviewStatus;
  reasons: string[];
}

const NO_MATCH: ReconciliationOutcome = {
  matchType: "sem_correspondencia",
  confidence: 0,
  reviewStatus: "sem_correspondencia",
  reasons: [],
};

function sameNormalizedPhone(a: NormalizedPhone | null, b: NormalizedPhone | null): boolean {
  if (!a || !b) return false;
  if (a.classification !== "valido" || b.classification !== "valido") return false;
  return a.digits === b.digits;
}

function samePlate(a: NormalizedPlate, b: NormalizedPlate): boolean {
  if (a.classification === "vazia" || a.classification === "invalida") return false;
  if (b.classification === "vazia" || b.classification === "invalida") return false;
  return a.compact === b.compact;
}

function anyPlateMatch(a: NormalizedPlate[], b: NormalizedPlate[]): boolean {
  for (const pa of a) {
    for (const pb of b) {
      if (samePlate(pa, pb)) return true;
    }
  }
  return false;
}

function sameName(a: NormalizedName, b: NormalizedName): boolean {
  if (!a.normalized || !b.normalized) return false;
  return a.normalized === b.normalized;
}

/**
 * Comparação parcial de telefone: mesmos últimos 8 dígitos, mas diferentes.
 * Útil quando um cadastro tem número velho e outro tem DDD trocado.
 */
function partialPhoneMatch(a: NormalizedPhone | null, b: NormalizedPhone | null): boolean {
  if (!a || !b) return false;
  if (!a.local || !b.local) return false;
  if (a.local === b.local) return false;
  const tailA = a.local.slice(-8);
  const tailB = b.local.slice(-8);
  return tailA.length === 8 && tailA === tailB;
}

// ---------------------------------------------------------------------------
// Avaliação
// ---------------------------------------------------------------------------

export function reconcile(a: ReconciliationSubject, b: ReconciliationSubject): ReconciliationOutcome {
  // Regra 6: nome incompleto ("Paulo") — sempre conciliação manual.
  if (a.name.isIncomplete || b.name.isIncomplete) {
    // Ainda checamos se há sinal forte (telefone/placa) para elevar prioridade da revisão
    if (sameNormalizedPhone(a.phone, b.phone) || anyPlateMatch(a.plates, b.plates)) {
      return {
        matchType: "nome_incompleto",
        confidence: 0.8,
        reviewStatus: "precisa_revisar",
        reasons: ["nome incompleto — evidência complementar (telefone/placa) requer revisão manual"],
      };
    }
    return {
      matchType: "nome_incompleto",
      confidence: 0.3,
      reviewStatus: "bloqueado",
      reasons: ["nome incompleto sem evidência complementar — não permitir merge"],
    };
  }

  const reasons: string[] = [];

  // Regra 1: telefone normalizado exatamente igual → alta confiança
  if (sameNormalizedPhone(a.phone, b.phone)) {
    reasons.push("telefone normalizado idêntico");
    if (sameName(a.name, b.name)) reasons.push("nomes normalizados coincidem");
    return {
      matchType: "telefone_exato",
      confidence: sameName(a.name, b.name) ? 0.98 : 0.9,
      reviewStatus: "alta_confianca",
      reasons,
    };
  }

  // Regra 2: placa normalizada exatamente igual → alta confiança (mas revisar se nomes muito diferentes)
  if (anyPlateMatch(a.plates, b.plates)) {
    reasons.push("placa normalizada idêntica");
    if (sameName(a.name, b.name)) {
      return {
        matchType: "placa_exata",
        confidence: 0.97,
        reviewStatus: "alta_confianca",
        reasons: [...reasons, "nomes normalizados coincidem"],
      };
    }
    return {
      matchType: "placa_exata",
      confidence: 0.75,
      reviewStatus: "precisa_revisar",
      reasons: [...reasons, "nomes divergentes — pode ser mesmo veículo com condutor diferente"],
    };
  }

  // Regra 3: nome normalizado + placa compatível já foi coberto pelas regras 1/2.
  //          nome + telefone parcial: média confiança
  if (sameName(a.name, b.name) && partialPhoneMatch(a.phone, b.phone)) {
    return {
      matchType: "nome_telefone_parcial",
      confidence: 0.6,
      reviewStatus: "precisa_revisar",
      reasons: ["nome idêntico e telefone com últimos 8 dígitos coincidentes"],
    };
  }

  // Regra 5: apenas nome → nunca mesclar automaticamente
  if (sameName(a.name, b.name)) {
    const hasPrefixSignal = a.name.hasArtificialPrefix || b.name.hasArtificialPrefix;
    return {
      matchType: "apenas_nome",
      confidence: hasPrefixSignal ? 0.35 : 0.5,
      reviewStatus: "bloqueado",
      reasons: hasPrefixSignal
        ? ["apenas nome coincide; prefixo artificial reduz confiança"]
        : ["apenas nome coincide — não permitir merge automático"],
    };
  }

  return NO_MATCH;
}

// ---------------------------------------------------------------------------
// Ranking em lote
// ---------------------------------------------------------------------------

export interface RankedCandidate {
  targetIndex: number;
  outcome: ReconciliationOutcome;
}

/**
 * Compara um sujeito com uma lista de candidatos.
 * Retorna somente os que atingiram alta_confianca ou precisa_revisar,
 * ordenados por confiança desc.
 */
export function rankCandidates(
  subject: ReconciliationSubject,
  candidates: ReconciliationSubject[],
): RankedCandidate[] {
  const ranked: RankedCandidate[] = [];
  candidates.forEach((candidate, index) => {
    const outcome = reconcile(subject, candidate);
    if (outcome.reviewStatus === "sem_correspondencia") return;
    ranked.push({ targetIndex: index, outcome });
  });
  return ranked.sort((a, b) => b.outcome.confidence - a.outcome.confidence);
}
