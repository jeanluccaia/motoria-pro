import "server-only";

import { KNOWN_SUBSCRIBERS_2026_08_16 } from "./known-subscribers.ts";

// -----------------------------------------------------------------------------
// Helpers Founder que dependem da base sensível KNOWN_SUBSCRIBERS_2026_08_16.
// Server-only — nunca deve ser importado por client component (evita vazar
// telefones/placas/aliases dos 25 assinantes conhecidos ao bundle público).
//
// A parte "pura" das métricas (pipeline, historical, isKnownSubscriberCustomer
// lendo o campo enriquecido) vive em `founder-metrics.ts` e é segura para
// client. Contagens que exigem varrer a base (confirmed/legacy/next-available)
// ficam aqui.
// -----------------------------------------------------------------------------

/** Vagas Founder confirmadas na base viva 4uCar 2026-08-16. Sempre 001/002/003. */
export function getConfirmedFounderRecords() {
  return KNOWN_SUBSCRIBERS_2026_08_16.filter((s) => Boolean(s.preservedFounderNumber));
}

/** Count canônico usado no Dashboard, na tela Founders e no Agent. */
export function getConfirmedFoundersCount(): number {
  return getConfirmedFounderRecords().length;
}

/**
 * Próximo número Founder disponível para nova confirmação.
 * Hoje: confirmed=3 (001/002/003) → 4. A Iara Menezes NÃO ocupa Nº004
 * (é assinante Priority, sinalização Founder é histórico legado).
 */
export function getNextAvailableFounderNumber(): number {
  return getConfirmedFoundersCount() + 1;
}

/**
 * Registros que têm `isReopenedFounder=true` na base viva. NÃO significa que
 * ocupam vaga Founder — significa que já foram sinalizados no processo em
 * algum momento e hoje são assinantes conhecidos (retenção). Nº004 continua
 * DISPONÍVEL enquanto nenhum cliente novo for confirmado.
 */
export function getLegacyFounderCandidates() {
  return KNOWN_SUBSCRIBERS_2026_08_16.filter((s) => s.isReopenedFounder === true);
}

/** @deprecated use `getLegacyFounderCandidates()`. Mantido para compat. */
export const getReopenedFounderRecords = getLegacyFounderCandidates;
