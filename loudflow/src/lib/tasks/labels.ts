import type { TaskPriority, TaskStatus } from "@/lib/supabase/types";

export function priorityLabel(p: TaskPriority): string {
  switch (p) {
    case "low":
      return "Baixa";
    case "normal":
      return "Normal";
    case "high":
      return "Alta";
  }
}

export function statusLabel(s: TaskStatus): string {
  switch (s) {
    case "pending":
      return "Pendente";
    case "completed":
      return "Concluída";
  }
}

export const FILTERS = ["today", "overdue", "upcoming", "completed"] as const;
export type FilterKey = (typeof FILTERS)[number];

export function filterLabel(f: FilterKey): string {
  switch (f) {
    case "today":
      return "Hoje";
    case "overdue":
      return "Atrasadas";
    case "upcoming":
      return "Próximas";
    case "completed":
      return "Concluídas";
  }
}
