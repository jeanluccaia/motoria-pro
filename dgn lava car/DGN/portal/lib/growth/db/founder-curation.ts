export type FounderCurationAction = "save" | "approve" | "create_page" | "revoke" | "replace" | "mark_sent";

export interface FounderCuration {
  recommendedPlanCode: string;
  recommendedPlanName: string;
  recommendedPlanVersion: string;
  recommendedContractingMode: string;
  recommendedContractingModeLabel: string;
  recommendedCommitmentMonths: number | null;
  recommendedMonthlyPrice: number | null;
  recommendedBillingRule: string;
  recommendedVehicleCategory: string;
  recommendationReasonInternal: string;
  recommendationMessagePublic: string;
  curatedBy: string;
  curatedAt: string;
  approvedAt: string;
  planSnapshot: Record<string, unknown> | null;
  publicLink: { slug: string; enabled: boolean; version: number; createdAt: string } | null;
  inviteSentAt: string;
}

export function curationDisplayState(input: {
  founderStatus?: string; commercialStage?: string; recommendedPlanCode?: string;
  publicLink?: { enabled: boolean } | null; inviteSentAt?: string; viewedAt?: string;
}) {
  if (input.viewedAt) return "visualizou";
  if (input.inviteSentAt) return "convite enviado";
  if (input.publicLink?.enabled) return "página criada";
  if (input.founderStatus === "selecionado") return "selecionado";
  if (input.founderStatus === "recomendado") return "recomendado";
  if (input.recommendedPlanCode) return "recomendação em rascunho";
  return "não avaliado";
}
