import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";

export const commercialPriorities = ["baixa", "normal", "alta", "urgente"] as const;
export type CommercialPriority = (typeof commercialPriorities)[number];

export interface CommercialFields {
  owner: string;
  commercialNotes: string;
  nextAction: string;
  nextActionAt: string;
  priority: CommercialPriority;
  updatedAt: string;
}

export interface CommercialWriteInput extends CommercialFields {
  customerId: string;
}

export class CommercialWriteError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const allowedKeys = new Set([
  "owner", "commercialNotes", "nextAction", "nextActionAt", "priority", "expectedUpdatedAt",
]);

function normalizedShort(value: unknown, field: string, max: number, allowEmpty: boolean) {
  if (typeof value !== "string") throw new CommercialWriteError(`${field} deve ser texto`, 400);
  const clean = value.trim().replace(/\s+/g, " ");
  if (!allowEmpty && !clean) throw new CommercialWriteError(`${field} é obrigatório`, 400);
  if (clean.length > max) throw new CommercialWriteError(`${field} excede ${max} caracteres`, 400);
  return clean;
}

function normalizedNotes(value: unknown) {
  if (typeof value !== "string") throw new CommercialWriteError("commercialNotes deve ser texto", 400);
  const clean = value.replace(/\r\n?/g, "\n").trim();
  if (clean.length > 2000) throw new CommercialWriteError("commercialNotes excede 2000 caracteres", 400);
  if (/<\/?[a-z][^>]*>/i.test(clean)) throw new CommercialWriteError("commercialNotes não aceita HTML", 400);
  return clean;
}

function normalizedDate(value: unknown, field: string, allowEmpty: boolean) {
  if (allowEmpty && (value === "" || value === null)) return "";
  if (typeof value !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new CommercialWriteError(`${field} deve conter data/hora ISO com fuso`, 400);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new CommercialWriteError(`${field} inválida`, 400);
  return parsed.toISOString();
}

export function validateCommercialPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new CommercialWriteError("payload inválido", 400);
  }
  const input = payload as Record<string, unknown>;
  const extra = Object.keys(input).filter((key) => !allowedKeys.has(key));
  if (extra.length) throw new CommercialWriteError(`campos não permitidos: ${extra.join(", ")}`, 400);
  const missing = [...allowedKeys].filter((key) => !(key in input));
  if (missing.length) throw new CommercialWriteError(`campos obrigatórios ausentes: ${missing.join(", ")}`, 400);
  if (!commercialPriorities.includes(input.priority as CommercialPriority)) {
    throw new CommercialWriteError("priority deve ser baixa, normal, alta ou urgente", 400);
  }
  return {
    owner: normalizedShort(input.owner, "owner", 80, false),
    commercialNotes: normalizedNotes(input.commercialNotes),
    nextAction: normalizedShort(input.nextAction, "nextAction", 240, true),
    nextActionAt: normalizedDate(input.nextActionAt, "nextActionAt", true),
    priority: input.priority as CommercialPriority,
    expectedUpdatedAt: normalizedDate(input.expectedUpdatedAt, "expectedUpdatedAt", false),
  };
}

const priorityNumber: Record<CommercialPriority, number> = { baixa: 1, normal: 2, alta: 3, urgente: 4 };

export async function updateCommercialFields(
  customerId: string,
  input: ReturnType<typeof validateCommercialPayload>,
  db: SupabaseClient = getSupabaseAdminClient("commercial-fields.update"),
) {
  const result = await db.rpc("crm_update_customer_commercial_fields", {
    p_customer_legacy_id: customerId,
    p_owner: input.owner,
    p_commercial_notes: input.commercialNotes || null,
    p_next_action: input.nextAction || null,
    p_next_action_at: input.nextActionAt || null,
    p_priority: priorityNumber[input.priority],
    p_expected_updated_at: input.expectedUpdatedAt,
    p_actor: "dgn-admin",
    p_origin: "dgn-growth-admin",
  });

  if (result.error) {
    const code = result.error.code;
    if (code === "P0002") throw new CommercialWriteError("Cliente ou registro comercial inexistente.", 404);
    if (code === "40001") throw new CommercialWriteError("Os dados foram alterados em outra sessão. Recarregue a página.", 409);
    if (code === "22023") throw new CommercialWriteError(result.error.message, 400);
    throw new CommercialWriteError("Não foi possível salvar os campos comerciais.", 502);
  }

  const data = result.data as { changed: boolean; customerId: string; commercial: CommercialFields } | null;
  if (!data?.commercial) throw new CommercialWriteError("Resposta inválida do banco.", 502);
  return data;
}
