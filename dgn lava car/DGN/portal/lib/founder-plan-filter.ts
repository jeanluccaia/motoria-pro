import type { FounderPlanCode } from "./founder-offer-catalog";

// Normaliza códigos de plano para os filtros da Curadoria. Aceita códigos
// oficiais (essential/smart/priority) e códigos legados de snapshots antigos
// (smart-founder-semestral, priority-founder-semestral) reduzindo-os ao plano
// correspondente. Qualquer outro valor retorna "" (não filtra).
export function normalizePlanCodeForFilter(value: string | null | undefined): FounderPlanCode | "" {
  if (value === "essential" || value === "smart" || value === "priority") return value;
  if (value === "smart-founder-semestral") return "smart";
  if (value === "priority-founder-semestral") return "priority";
  return "";
}
