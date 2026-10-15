import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";
import { CustomerResolutionError, resolveCustomerId } from "./customer-resolver.ts";

export const commercialPriorities = ["baixa", "normal", "alta", "urgente"] as const;
export type CommercialPriority = (typeof commercialPriorities)[number];

export interface CommercialFields {
  owner: string;
  commercialNotes: string;
  nextAction: string;
  nextActionAt: string;
  priority: CommercialPriority;
  updatedAt: string;
  version: number;
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
  "owner", "commercialNotes", "nextAction", "nextActionAt", "priority", "expectedVersion",
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
  if (allowEmpty && (value === "" || value === null || value === undefined)) return "";
  if (typeof value !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new CommercialWriteError(`${field} deve conter data/hora ISO com fuso`, 400);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new CommercialWriteError(`${field} inválida`, 400);
  return parsed.toISOString();
}

function normalizedVersion(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new CommercialWriteError("expectedVersion deve ser inteiro ≥ 0 ou null", 400);
  }
  return value;
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
    // null = "cliente ainda não tem crm_campaign_members"; a RPC faz bootstrap silencioso.
    expectedVersion: normalizedVersion(input.expectedVersion),
  };
}

const priorityNumber: Record<CommercialPriority, number> = { baixa: 1, normal: 2, alta: 3, urgente: 4 };

export interface UpdateCommercialOptions {
  /** Correlation id gerado no browser; só usado pra log no server. */
  requestId?: string;
  /** Em ms. >0 arma AbortSignal para a RPC. Preview-only; prod passa 0. */
  rpcTimeoutMs?: number;
}

/** Preview-only: evita emitir ruído em prod. VERCEL_ENV=preview em deploys preview. */
function isPreviewRuntime(): boolean {
  return process.env.VERCEL_ENV === "preview" || process.env.DGN_COMMERCIAL_DEBUG === "true";
}

function logStage(requestId: string | undefined, stage: string, extra?: Record<string, unknown>) {
  if (!isPreviewRuntime()) return;
  // Linha única plain-text para ficar fácil de filtrar nos Runtime Logs.
  const payload = { stage, requestId: requestId ?? "unknown", ...(extra ?? {}) };
  console.log(`[commercial] ${JSON.stringify(payload)}`);
}

export async function updateCommercialFields(
  customerId: string,
  input: ReturnType<typeof validateCommercialPayload>,
  db: SupabaseClient = getSupabaseAdminClient("commercial-fields.update"),
  options: UpdateCommercialOptions = {},
) {
  const requestId = options.requestId;
  const rpcTimeoutMs = options.rpcTimeoutMs ?? 0;

  // Resolve slug|UUID → crm_customers.id canônico antes de qualquer join.
  // Clientes PagBank (ex.: Viviane Tabata Manja) chegam aqui com DgnCustomer.id = UUID
  // porque legacy_id é NULL; sem este passo, a RPC filtra por legacy_id e devolve P0002.
  logStage(requestId, "resolver:start", { customerId });
  const resolverStartedAt = Date.now();
  let resolvedCustomerId: string;
  try {
    resolvedCustomerId = await resolveCustomerId(db, customerId);
  } catch (error) {
    logStage(requestId, "resolver:error", {
      elapsedMs: Date.now() - resolverStartedAt,
      message: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof CustomerResolutionError) {
      if (error.status === 404) {
        throw new CommercialWriteError("Cliente ou registro comercial inexistente.", 404);
      }
      throw new CommercialWriteError(error.message, error.status);
    }
    throw error;
  }
  logStage(requestId, "resolver:ok", {
    elapsedMs: Date.now() - resolverStartedAt,
    resolvedCustomerId,
  });

  const rpcArgs = {
    p_customer_id: resolvedCustomerId,
    p_owner: input.owner,
    p_commercial_notes: input.commercialNotes || null,
    p_next_action: input.nextAction || null,
    p_next_action_at: input.nextActionAt || null,
    p_priority: priorityNumber[input.priority],
    p_expected_version: input.expectedVersion,
    p_actor: "dgn-admin",
    p_origin: "dgn-growth-admin",
  };

  logStage(requestId, "rpc:start", { rpcTimeoutMs: rpcTimeoutMs || null });
  const rpcStartedAt = Date.now();
  let result: Awaited<ReturnType<typeof db.rpc>>;
  let controller: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    if (rpcTimeoutMs > 0) {
      controller = new AbortController();
      timer = setTimeout(() => controller!.abort(), rpcTimeoutMs);
      result = await db
        .rpc("crm_update_customer_commercial_fields", rpcArgs)
        .abortSignal(controller.signal);
    } else {
      result = await db.rpc("crm_update_customer_commercial_fields", rpcArgs);
    }
  } catch (error) {
    const aborted = controller?.signal.aborted ?? false;
    logStage(requestId, aborted ? "rpc:timeout" : "rpc:threw", {
      elapsedMs: Date.now() - rpcStartedAt,
      aborted,
      message: error instanceof Error ? error.message : String(error),
    });
    if (aborted) {
      throw new CommercialWriteError(
        "Timeout de diagnóstico: a RPC comercial não respondeu em tempo (Preview).",
        504,
      );
    }
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
  logStage(requestId, "rpc:returned", {
    elapsedMs: Date.now() - rpcStartedAt,
    hadError: Boolean(result.error),
    errorCode: result.error?.code,
  });

  if (result.error) {
    const code = result.error.code;
    const hint = (result.error as { hint?: string | null }).hint ?? "";
    if (code === "P0002") throw new CommercialWriteError("Cliente ou registro comercial inexistente.", 404);
    // Conflito monotônico: errcode='P0001' com HINT 'commercial.version.conflict'
    // (marcador estável aplicado pela RPC). O HINT evita que outros P0001
    // genéricos virem 409 silenciosamente. errcode 40001 fica como fallback
    // compatibilidade; PostgREST faz retry nele, então não deve chegar aqui
    // na prática — mas mantemos o mapper caso a RPC seja revertida.
    if (code === "P0001" && hint === "commercial.version.conflict") {
      throw new CommercialWriteError("Os dados foram alterados em outra sessão. Recarregue a página.", 409);
    }
    if (code === "40001") throw new CommercialWriteError("Os dados foram alterados em outra sessão. Recarregue a página.", 409);
    if (code === "22023") throw new CommercialWriteError(result.error.message, 400);
    throw new CommercialWriteError("Não foi possível salvar os campos comerciais.", 502);
  }

  const data = result.data as { changed: boolean; customerId: string; commercial: CommercialFields } | null;
  if (!data?.commercial) throw new CommercialWriteError("Resposta inválida do banco.", 502);
  logStage(requestId, "response:building", { changed: data.changed });
  return data;
}
