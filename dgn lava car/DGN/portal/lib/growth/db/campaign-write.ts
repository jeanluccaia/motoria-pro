import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";
import {
  CAMPAIGN_ID, cardStatuses, commercialStages, founderStatuses, kitStatuses,
  type CampaignCommercialStage, type CardStatus, type FounderStatus, type KitStatus,
} from "./campaign-pipeline.ts";

export class CampaignWriteError extends Error {
  readonly status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

const allowed = new Set([
  "campaignId", "founderStatus", "commercialStage", "founderNumber", "selectionReason",
  "lostReason", "kitStatus", "cardStatus", "expectedUpdatedAt", "transitionReason", "confirmBackward",
]);

const optionalEnum = <T extends readonly string[]>(value: unknown, values: T, field: string) => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !values.includes(value)) throw new CampaignWriteError(`${field} inválido`, 400);
  return value as T[number];
};
const optionalText = (value: unknown, field: string, max = 1000) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") throw new CampaignWriteError(`${field} deve ser texto`, 400);
  const clean = value.trim();
  if (clean.length > max) throw new CampaignWriteError(`${field} excede ${max} caracteres`, 400);
  return clean || null;
};

export function validateCampaignPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new CampaignWriteError("payload inválido", 400);
  const raw = payload as Record<string, unknown>;
  const extra = Object.keys(raw).filter((key) => !allowed.has(key));
  if (extra.length) throw new CampaignWriteError(`campos não permitidos: ${extra.join(", ")}`, 400);
  if (raw.campaignId !== CAMPAIGN_ID) throw new CampaignWriteError(`campaignId deve ser ${CAMPAIGN_ID}`, 400);
  if (typeof raw.expectedUpdatedAt !== "string" || Number.isNaN(Date.parse(raw.expectedUpdatedAt))) {
    throw new CampaignWriteError("expectedUpdatedAt inválido", 400);
  }
  const patch = {
    founderStatus: optionalEnum(raw.founderStatus, founderStatuses, "founderStatus") as FounderStatus | undefined,
    commercialStage: optionalEnum(raw.commercialStage, commercialStages, "commercialStage") as CampaignCommercialStage | undefined,
    founderNumber: optionalText(raw.founderNumber, "founderNumber", 3),
    selectionReason: optionalText(raw.selectionReason, "selectionReason", 1000),
    lostReason: optionalText(raw.lostReason, "lostReason", 1000),
    kitStatus: optionalEnum(raw.kitStatus, kitStatuses, "kitStatus") as KitStatus | undefined,
    cardStatus: optionalEnum(raw.cardStatus, cardStatuses, "cardStatus") as CardStatus | undefined,
    transitionReason: optionalText(raw.transitionReason, "transitionReason", 1000),
    confirmBackward: raw.confirmBackward === true,
  };
  if (!Object.values(patch).some((value) => value !== undefined && value !== false)) throw new CampaignWriteError("nenhuma alteração informada", 400);
  return { campaignId: CAMPAIGN_ID, expectedUpdatedAt: new Date(raw.expectedUpdatedAt).toISOString(), patch };
}

export async function updateCampaignPipeline(customerId: string, input: ReturnType<typeof validateCampaignPayload>, db: SupabaseClient = getSupabaseAdminClient("campaign-pipeline.update")) {
  const result = await db.rpc("crm_update_founders_pipeline", {
    p_customer_legacy_id: customerId,
    p_campaign_id: input.campaignId,
    p_patch: input.patch,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_actor: "dgn-admin",
  });
  if (result.error) {
    if (result.error.code === "P0002") throw new CampaignWriteError("Cliente ou campanha inexistente.", 404);
    if (["40001", "23505", "P0001"].includes(result.error.code ?? "")) throw new CampaignWriteError(result.error.message, 409);
    if (result.error.code === "22023") throw new CampaignWriteError(result.error.message, 400);
    throw new CampaignWriteError("Não foi possível atualizar o pipeline.", 502);
  }
  return result.data as { changed: boolean; customerId: string; campaign: Record<string, unknown> };
}
