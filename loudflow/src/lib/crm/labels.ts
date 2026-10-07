// Rótulos pt-BR e cores de badge para os enums do CRM de leads.
// Único lugar onde traduzimos "pipeline_stage", "priority", "source" para a
// interface. A UI nunca escreve os valores internos.

import type {
  FranchiseLeadStage,
  FranchiseLeadPriority,
  FranchiseLeadSource,
} from "@/lib/supabase/types";

export const STAGE_LABELS: Record<FranchiseLeadStage, string> = {
  new: "Novo lead",
  contact_attempt: "Tentativa de contato",
  in_conversation: "Em conversa",
  qualified: "Qualificado",
  meeting_scheduled: "Reunião agendada",
  cof_sent: "COF enviada",
  negotiating: "Em negociação",
  won: "Convertido",
  no_response: "Sem retorno",
  disqualified: "Desqualificado",
  lost: "Perdido",
};

export const STAGE_ORDER: FranchiseLeadStage[] = [
  "new",
  "contact_attempt",
  "in_conversation",
  "qualified",
  "meeting_scheduled",
  "cof_sent",
  "negotiating",
  "won",
  "no_response",
  "disqualified",
  "lost",
];

export const PRIORITY_LABELS: Record<FranchiseLeadPriority, string> = {
  high: "Alta",
  normal: "Média",
  low: "Baixa",
};

export const PRIORITY_ORDER: FranchiseLeadPriority[] = ["high", "normal", "low"];

export const SOURCE_LABELS: Record<FranchiseLeadSource, string> = {
  meta_instant_form: "Meta — Formulário instantâneo",
  meta_whatsapp: "Meta — Engajamento/WhatsApp",
  manual: "Cadastro manual",
  google_ads: "Google Ads",
  site: "Site",
};

export const SOURCE_ORDER: FranchiseLeadSource[] = [
  "meta_instant_form",
  "meta_whatsapp",
  "manual",
  "google_ads",
  "site",
];

// Classes Tailwind para o badge de etapa. Mantidas discretas; a cor
// só reforça o texto, nunca o substitui.
export function stageBadgeClass(stage: FranchiseLeadStage): string {
  switch (stage) {
    case "meeting_scheduled":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "won":
      return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
    case "qualified":
    case "cof_sent":
    case "negotiating":
      return "bg-amber-500/15 text-amber-200 border-amber-500/30";
    case "in_conversation":
    case "contact_attempt":
      return "bg-sky-500/15 text-sky-200 border-sky-500/30";
    case "no_response":
      return "bg-rose-500/15 text-rose-200 border-rose-500/30";
    case "lost":
    case "disqualified":
      return "bg-neutral-500/15 text-neutral-300 border-neutral-500/40";
    case "new":
    default:
      return "bg-lf-volt/15 text-lf-volt border-lf-volt/40";
  }
}

export function priorityBadgeClass(priority: FranchiseLeadPriority): string {
  switch (priority) {
    case "high":
      return "bg-rose-500/15 text-rose-200 border-rose-500/40";
    case "normal":
      return "bg-amber-500/10 text-amber-200 border-amber-500/30";
    case "low":
    default:
      return "bg-neutral-500/10 text-neutral-300 border-neutral-500/30";
  }
}
