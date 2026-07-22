export const CAMPAIGN_ID = "founders-2026";

export const founderStatuses = [
  "nao_avaliado", "recomendado", "selecionado", "confirmado", "lista_espera", "descartado",
] as const;
export type FounderStatus = (typeof founderStatuses)[number];

export const commercialStages = [
  "aguardando_analise", "pronto_para_contato", "contato_preparado", "contatado",
  "visualizou", "respondeu", "conversando", "pagamento_enviado", "convertido", "descartado",
] as const;
export type CampaignCommercialStage = (typeof commercialStages)[number];

export const kitStatuses = ["nao_aplicavel", "pendente", "em_preparacao", "pronto", "entregue"] as const;
export type KitStatus = (typeof kitStatuses)[number];
export const cardStatuses = ["nao_aplicavel", "pendente", "solicitado", "produzido", "entregue"] as const;
export type CardStatus = (typeof cardStatuses)[number];

export const stageOrder: Record<CampaignCommercialStage, number> = Object.fromEntries(
  commercialStages.map((stage, index) => [stage, index]),
) as Record<CampaignCommercialStage, number>;

const forward: Record<CampaignCommercialStage, CampaignCommercialStage[]> = {
  aguardando_analise: ["pronto_para_contato", "descartado"],
  pronto_para_contato: ["contato_preparado", "descartado"],
  contato_preparado: ["contatado", "descartado"],
  contatado: ["visualizou", "respondeu", "descartado"],
  visualizou: ["respondeu", "descartado"],
  respondeu: ["conversando", "descartado"],
  conversando: ["pagamento_enviado", "descartado"],
  pagamento_enviado: ["convertido", "descartado"],
  convertido: ["descartado"],
  descartado: [],
};

export function validateStageChange(
  from: CampaignCommercialStage,
  to: CampaignCommercialStage,
  options: { confirmBackward?: boolean; reason?: string } = {},
) {
  if (from === to) return { valid: true, backward: false };
  if (forward[from].includes(to)) return { valid: true, backward: false };
  const backward = to !== "descartado" && stageOrder[to] < stageOrder[from];
  if (backward && options.confirmBackward && (options.reason?.trim().length ?? 0) >= 3) {
    return { valid: true, backward: true };
  }
  return { valid: false, backward };
}

export interface PipelineMemberSummary {
  customerId: string;
  founderStatus: FounderStatus;
  commercialStage: CampaignCommercialStage;
  kitStatus: KitStatus;
  nextActionAt?: string | null;
  priority?: number | null;
  updatedAt?: string | null;
  score?: number;
}

export function countUniqueFunnel(rows: PipelineMemberSummary[]) {
  const unique = [...new Map(rows.map((row) => [row.customerId, row])).values()];
  return {
    confirmed: unique.filter((row) => row.founderStatus === "confirmado").length,
    selected: unique.filter((row) => row.founderStatus === "selecionado").length,
    invited: unique.filter((row) => stageOrder[row.commercialStage] >= stageOrder.contatado && row.commercialStage !== "descartado").length,
    talking: unique.filter((row) => row.commercialStage === "conversando").length,
    paymentSent: unique.filter((row) => row.commercialStage === "pagamento_enviado").length,
    converted: unique.filter((row) => row.commercialStage === "convertido").length,
    waitingKit: unique.filter((row) => ["pendente", "em_preparacao", "pronto"].includes(row.kitStatus)).length,
    kitDelivered: unique.filter((row) => row.kitStatus === "entregue").length,
    lost: unique.filter((row) => row.founderStatus === "descartado" || row.commercialStage === "descartado").length,
  };
}

export function rankContactsToday(rows: PipelineMemberSummary[], now = new Date()) {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return rows
    .filter((row) => !["convertido", "descartado"].includes(row.commercialStage))
    .filter((row) => row.founderStatus !== "nao_avaliado" || Boolean(row.nextActionAt))
    .sort((a, b) => {
      const aAt = a.nextActionAt ? new Date(a.nextActionAt).getTime() : Infinity;
      const bAt = b.nextActionAt ? new Date(b.nextActionAt).getTime() : Infinity;
      const bucket = (at: number) => at < start.getTime() ? 0 : at < end.getTime() ? 1 : 2;
      return bucket(aAt) - bucket(bAt)
        || (b.priority ?? 0) - (a.priority ?? 0)
        || new Date(a.updatedAt ?? 0).getTime() - new Date(b.updatedAt ?? 0).getTime()
        || (b.score ?? 0) - (a.score ?? 0);
    });
}
