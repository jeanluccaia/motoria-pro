/**
 * Catálogo dos planos oficiais DGN Club.
 *
 * Somente `Essential`, `Smart`, `Priority` são planos válidos. Rótulos
 * legados como `Elite`, `Premium`, `Daily` não devem aparecer em
 * lugar nenhum do Portal.
 */

export type PlanCode = "Essential" | "Smart" | "Priority";

export interface PlanInfo {
  code: PlanCode;
  fullLabel: string;      // "DGN Priority"
  shortLabel: string;     // "Priority"
  frequencyPerMonth: number;
  frequencyLabel: string; // "1 lavagem/mês"
  colorClass: string;
}

export const PLANS: Record<PlanCode, PlanInfo> = {
  Essential: {
    code: "Essential",
    fullLabel: "DGN Essential",
    shortLabel: "Essential",
    frequencyPerMonth: 1,
    frequencyLabel: "1 lavagem/mês",
    colorClass: "text-emerald-300",
  },
  Smart: {
    code: "Smart",
    fullLabel: "DGN Smart",
    shortLabel: "Smart",
    frequencyPerMonth: 2,
    frequencyLabel: "2 lavagens/mês",
    colorClass: "text-cyan-300",
  },
  Priority: {
    code: "Priority",
    fullLabel: "DGN Priority",
    shortLabel: "Priority",
    frequencyPerMonth: 4,
    frequencyLabel: "4 lavagens/mês",
    colorClass: "text-amber-300",
  },
};

export function planFor(plan: string | null | undefined): PlanInfo | null {
  if (!plan) return null;
  return PLANS[plan as PlanCode] ?? null;
}
