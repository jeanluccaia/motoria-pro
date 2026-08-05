import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createFounderPlanSnapshot,
  getFounderOffer,
  isCombinationValidatedForPublication,
  isFounderContractingMode,
  isFounderPlanCode,
  isFounderVehicleCategory,
  type FounderContractingMode,
  type FounderPlanCode,
  type FounderPlanSnapshot,
  type FounderVehicleCategory,
} from "../../founder-offer-catalog.ts";
import { getSupabaseAdminClient } from "./admin-client.ts";
import type { FounderCurationAction } from "./founder-curation.ts";

export class FounderCurationWriteError extends Error {
  readonly status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

const actions = new Set<FounderCurationAction>(["save", "approve", "create_page", "revoke", "replace", "mark_sent"]);
const allowed = new Set([
  "action",
  "campaignId",
  "recommendedPlanCode",
  "recommendedContractingMode",
  "recommendedVehicleCategory",
  "recommendationReasonInternal",
  "recommendationMessagePublic",
  "expectedUpdatedAt",
]);
const forbiddenModalityWords = ["semestral", "anual", "trimestral", "annual", "biannual"];

function optionalText(value: unknown, field: string, max: number) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new FounderCurationWriteError(`${field} deve ser texto.`, 400);
  const clean = value.trim();
  if (clean.length > max) throw new FounderCurationWriteError(`${field} excede ${max} caracteres.`, 400);
  return clean;
}

function rejectDurationInPlanCode(planCode: string) {
  const lower = planCode.toLowerCase();
  for (const word of forbiddenModalityWords) {
    if (lower.includes(word)) {
      throw new FounderCurationWriteError("Plano não pode conter modalidade ou duração no nome.", 400);
    }
  }
}

export interface FounderCurationInput {
  action: FounderCurationAction;
  campaignId: "founders-2026";
  expectedUpdatedAt: string;
  planCode: FounderPlanCode | "";
  contractingMode: FounderContractingMode | "";
  category: FounderVehicleCategory | "";
  reason: string;
  message: string;
  snapshot: FounderPlanSnapshot | null;
}

export function validateFounderCurationPayload(payload: unknown): FounderCurationInput {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new FounderCurationWriteError("Payload inválido.", 400);
  }
  const raw = payload as Record<string, unknown>;
  const extra = Object.keys(raw).filter((key) => !allowed.has(key));
  if (extra.length) throw new FounderCurationWriteError(`Campos não permitidos: ${extra.join(", ")}.`, 400);
  if (raw.campaignId !== "founders-2026") throw new FounderCurationWriteError("Campanha inválida.", 400);
  if (typeof raw.action !== "string" || !actions.has(raw.action as FounderCurationAction)) {
    throw new FounderCurationWriteError("Ação inválida.", 400);
  }
  if (typeof raw.expectedUpdatedAt !== "string" || Number.isNaN(Date.parse(raw.expectedUpdatedAt))) {
    throw new FounderCurationWriteError("expectedUpdatedAt inválido.", 400);
  }

  const planCodeRaw = optionalText(raw.recommendedPlanCode, "recommendedPlanCode", 40);
  if (planCodeRaw) rejectDurationInPlanCode(planCodeRaw);
  const planCode: FounderPlanCode | "" = planCodeRaw
    ? (isFounderPlanCode(planCodeRaw) ? planCodeRaw : "__invalid__" as never)
    : "";
  if (planCodeRaw && planCode === ("__invalid__" as never)) {
    throw new FounderCurationWriteError("Plano fora do catálogo oficial.", 400);
  }

  const contractingModeRaw = optionalText(raw.recommendedContractingMode, "recommendedContractingMode", 20);
  const contractingMode: FounderContractingMode | "" = contractingModeRaw
    ? (isFounderContractingMode(contractingModeRaw) ? contractingModeRaw : "__invalid__" as never)
    : "";
  if (contractingModeRaw && contractingMode === ("__invalid__" as never)) {
    throw new FounderCurationWriteError("Modalidade de contratação inválida.", 400);
  }

  const categoryRaw = optionalText(raw.recommendedVehicleCategory, "recommendedVehicleCategory", 20).toLowerCase();
  const category: FounderVehicleCategory | "" = categoryRaw
    ? (isFounderVehicleCategory(categoryRaw) ? categoryRaw : "__invalid__" as never)
    : "";
  if (categoryRaw && category === ("__invalid__" as never)) {
    throw new FounderCurationWriteError("Categoria de veículo inválida.", 400);
  }

  const offer = planCode && contractingMode
    ? getFounderOffer(planCode, contractingMode, category || null)
    : null;
  const reason = optionalText(raw.recommendationReasonInternal, "recommendationReasonInternal", 2000);
  const message = optionalText(raw.recommendationMessagePublic, "recommendationMessagePublic", 1000);
  const action = raw.action as FounderCurationAction;

  if (["approve", "create_page", "replace"].includes(action)) {
    if (!offer) throw new FounderCurationWriteError("Plano oficial e modalidade são obrigatórios.", 400);
    if (reason.length < 3) throw new FounderCurationWriteError("Motivo interno obrigatório.", 400);
    if (contractingMode === "monthly" && !category) {
      throw new FounderCurationWriteError("Categoria do veículo obrigatória para modalidade Mensal.", 400);
    }
    if (!isCombinationValidatedForPublication(offer)) {
      throw new FounderCurationWriteError("Esta modalidade ainda não possui condição comercial validada.", 400);
    }
  }

  const snapshot = offer
    ? createFounderPlanSnapshot(planCode as FounderPlanCode, contractingMode as FounderContractingMode, category || null)
    : null;

  return {
    action,
    campaignId: "founders-2026",
    expectedUpdatedAt: new Date(raw.expectedUpdatedAt as string).toISOString(),
    planCode,
    contractingMode,
    category,
    reason,
    message,
    snapshot,
  };
}

export async function writeFounderCuration(
  customerId: string,
  input: ReturnType<typeof validateFounderCurationPayload>,
  db: SupabaseClient = getSupabaseAdminClient("founder-curation.write"),
) {
  const result = await db.rpc("crm_manage_founder_curation_v2", {
    p_customer_legacy_id: customerId,
    p_campaign_id: input.campaignId,
    p_action: input.action,
    p_plan_code: input.planCode || null,
    p_contracting_mode: input.contractingMode || null,
    p_vehicle_category: input.category || null,
    p_reason_internal: input.reason || null,
    p_message_public: input.message || null,
    p_plan_snapshot: input.snapshot,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_actor: "dgn-admin",
  });
  if (result.error) {
    if (result.error.code === "P0002") throw new FounderCurationWriteError("Cliente ou campanha inexistente.", 404);
    if (["40001", "23505"].includes(result.error.code ?? "")) throw new FounderCurationWriteError(result.error.message, 409);
    if (result.error.code === "22023") throw new FounderCurationWriteError(result.error.message, 400);
    throw new FounderCurationWriteError("Não foi possível atualizar a curadoria.", 502);
  }
  return result.data as Record<string, unknown>;
}
