import { rangeDays } from "@/lib/dates/period";

// Cobertura do período: diferencia claramente
//   * "dia sem sincronização" (missing) — sem dados; NÃO conta como zero
//   * "dia sincronizado com métrica zero" (zeroDay) — houve sync, valor foi 0
//   * "dia com dados" (present)
//
// Semântica: um dia é considerado "sincronizado" se ele aparece em pelo menos
// um snapshot dentro do período — mesmo que todas as métricas sejam zero.

export type Coverage = {
  fromYmd: string;
  toYmd: string;
  totalDays: number;
  presentDays: string[];
  missingDays: string[];
  firstAvailableYmd: string | null;
  fullyCovered: boolean;
  partial: boolean;
  empty: boolean; // nenhum dia do período foi sincronizado
};

export function computeCoverage(input: {
  fromYmd: string;
  toYmd: string;
  snapshotDatesInPeriod: Iterable<string>;
  firstAvailableYmd: string | null;
}): Coverage {
  const days = rangeDays(input.fromYmd, input.toYmd);
  const present = new Set<string>();
  for (const d of input.snapshotDatesInPeriod) {
    if (d >= input.fromYmd && d <= input.toYmd) present.add(d);
  }
  const missing = days.filter((d) => !present.has(d));

  return {
    fromYmd: input.fromYmd,
    toYmd: input.toYmd,
    totalDays: days.length,
    presentDays: [...present].sort(),
    missingDays: missing,
    firstAvailableYmd: input.firstAvailableYmd,
    fullyCovered: missing.length === 0 && days.length > 0,
    partial: missing.length > 0 && present.size > 0,
    empty: present.size === 0,
  };
}
