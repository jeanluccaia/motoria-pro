import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";

// ---------------------------------------------------------------------------
// Camada de acesso para agent_actions (Agent Core — Etapa 1 Fundação).
//
// Todas as escritas passam pelas RPCs SECURITY DEFINER definidas em
// supabase/migrations/20261022010000_agent_core_rpcs.sql.
//
// agent_actions NUNCA toca crm_* operacional. Agente escreve aqui;
// execução que mexe em crm_* acontece via RPCs crm_* já em prod,
// disparadas por humano após mark_executed.
// ---------------------------------------------------------------------------

export class AgentActionsWriteError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type AgentActionKind =
  | "opportunity"
  | "alert"
  | "followup_task"
  | "campaign_draft";

export type AgentActionStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "executed"
  | "archived";

export interface CreateAgentActionInput {
  kind: AgentActionKind;
  title: string;
  reason: string;
  recommendation: string;
  sourceTool: string;
  actor: string;
  targetCustomerId?: string | null;
  targetCampaignId?: string | null;
  nextStep?: string | null;
  expectedBenefit?: string | null;
  payload?: Record<string, unknown>;
  dedupeKey?: string | null;
  expiresAt?: string | null;
  sourceRunId?: string | null;
  db?: SupabaseClient;
}

export interface CreateAgentActionResult {
  resultCode: "CREATED" | "NO_CHANGE";
  actionId: string | null;
  existingActionId: string | null;
}

export async function createAgentAction(input: CreateAgentActionInput): Promise<CreateAgentActionResult> {
  const db = input.db ?? getSupabaseAdminClient("agent_actions.create");

  const actor = (input.actor ?? "").trim();
  if (!actor) throw new AgentActionsWriteError("Actor é obrigatório.", 400);

  const sourceTool = (input.sourceTool ?? "").trim();
  if (!sourceTool) throw new AgentActionsWriteError("source_tool é obrigatório.", 400);

  const title = (input.title ?? "").trim();
  const reason = (input.reason ?? "").trim();
  const recommendation = (input.recommendation ?? "").trim();
  if (!title) throw new AgentActionsWriteError("Title é obrigatório.", 400);
  if (!reason) throw new AgentActionsWriteError("Reason é obrigatório.", 400);
  if (!recommendation) throw new AgentActionsWriteError("Recommendation é obrigatória.", 400);

  const rpc = await db.rpc("agent_action_create", {
    p_kind: input.kind,
    p_target_customer_id: input.targetCustomerId ?? null,
    p_title: title,
    p_reason: reason,
    p_recommendation: recommendation,
    p_source_tool: sourceTool,
    p_actor: actor,
    p_next_step: input.nextStep ?? null,
    p_expected_benefit: input.expectedBenefit ?? null,
    p_payload: input.payload ?? {},
    p_dedupe_key: input.dedupeKey ?? null,
    p_expires_at: input.expiresAt ?? null,
    p_source_run_id: input.sourceRunId ?? null,
    p_target_campaign_id: input.targetCampaignId ?? null,
  });
  if (rpc.error) throw new AgentActionsWriteError(`Falha ao criar agent_action: ${rpc.error.message}`, 502);

  const rows = (rpc.data ?? []) as Array<{
    result_code?: string;
    action_id?: string | null;
    existing_action_id?: string | null;
  }>;
  const row = rows[0] ?? {};
  const code = row.result_code === "CREATED" || row.result_code === "NO_CHANGE" ? row.result_code : null;
  if (!code) throw new AgentActionsWriteError("Retorno inesperado da RPC agent_action_create.", 502);

  return {
    resultCode: code,
    actionId: row.action_id ?? null,
    existingActionId: row.existing_action_id ?? null,
  };
}

export interface TransitionAgentActionInput {
  actionId: string;
  actor: string;
  reason?: string | null;
  executionRef?: string | null;
  db?: SupabaseClient;
}

export type TransitionResultCode =
  | "UPDATED"
  | "ALREADY_APPROVED"
  | "ALREADY_REJECTED"
  | "ALREADY_EXECUTED"
  | "NOT_FOUND"
  | "INVALID_STATE_TRANSITION";

export interface TransitionAgentActionResult {
  resultCode: TransitionResultCode;
  actionId: string | null;
}

async function callTransition(
  rpcName: "agent_action_approve" | "agent_action_reject" | "agent_action_mark_executed",
  input: TransitionAgentActionInput,
  allowedCodes: readonly TransitionResultCode[],
): Promise<TransitionAgentActionResult> {
  const db = input.db ?? getSupabaseAdminClient(`agent_actions.${rpcName}`);
  const actor = (input.actor ?? "").trim();
  if (!actor) throw new AgentActionsWriteError("Actor é obrigatório.", 400);

  const params: Record<string, unknown> = {
    p_action_id: input.actionId,
    p_actor: actor,
  };

  if (rpcName === "agent_action_mark_executed") {
    params.p_execution_ref = input.executionRef ?? null;
  } else {
    params.p_reason = input.reason ?? null;
  }

  const rpc = await db.rpc(rpcName, params);
  if (rpc.error) throw new AgentActionsWriteError(`Falha em ${rpcName}: ${rpc.error.message}`, 502);

  const rows = (rpc.data ?? []) as Array<{ result_code?: string; action_id?: string | null }>;
  const row = rows[0] ?? {};
  const code = allowedCodes.includes(row.result_code as TransitionResultCode)
    ? (row.result_code as TransitionResultCode)
    : null;
  if (!code) throw new AgentActionsWriteError(`Retorno inesperado de ${rpcName}: ${row.result_code}`, 502);

  return { resultCode: code, actionId: row.action_id ?? null };
}

export function approveAgentAction(input: TransitionAgentActionInput): Promise<TransitionAgentActionResult> {
  return callTransition("agent_action_approve", input, [
    "UPDATED",
    "ALREADY_APPROVED",
    "NOT_FOUND",
    "INVALID_STATE_TRANSITION",
  ]);
}

export function rejectAgentAction(input: TransitionAgentActionInput): Promise<TransitionAgentActionResult> {
  const reason = (input.reason ?? "").trim();
  if (!reason) throw new AgentActionsWriteError("Motivo da rejeição é obrigatório.", 400);
  return callTransition("agent_action_reject", { ...input, reason }, [
    "UPDATED",
    "ALREADY_REJECTED",
    "NOT_FOUND",
    "INVALID_STATE_TRANSITION",
  ]);
}

export function markAgentActionExecuted(input: TransitionAgentActionInput): Promise<TransitionAgentActionResult> {
  return callTransition("agent_action_mark_executed", input, [
    "UPDATED",
    "ALREADY_EXECUTED",
    "NOT_FOUND",
    "INVALID_STATE_TRANSITION",
  ]);
}

// -----------------------------------------------------------------------------
// Read helpers
// -----------------------------------------------------------------------------

export interface AgentActionRow {
  id: string;
  kind: AgentActionKind;
  status: AgentActionStatus;
  targetCustomerId: string | null;
  targetCampaignId: string | null;
  title: string;
  reason: string;
  recommendation: string;
  nextStep: string | null;
  expectedBenefit: string | null;
  payload: Record<string, unknown>;
  sourceTool: string;
  sourceRunId: string | null;
  dedupeKey: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewReason: string | null;
  executedAt: string | null;
  executionRef: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AgentActionRowRaw {
  id: string;
  kind: AgentActionKind;
  status: AgentActionStatus;
  target_customer_id: string | null;
  target_campaign_id: string | null;
  title: string;
  reason: string;
  recommendation: string;
  next_step: string | null;
  expected_benefit: string | null;
  payload: Record<string, unknown> | null;
  source_tool: string;
  source_run_id: string | null;
  dedupe_key: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_reason: string | null;
  executed_at: string | null;
  execution_ref: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: AgentActionRowRaw): AgentActionRow {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    targetCustomerId: row.target_customer_id,
    targetCampaignId: row.target_campaign_id,
    title: row.title,
    reason: row.reason,
    recommendation: row.recommendation,
    nextStep: row.next_step,
    expectedBenefit: row.expected_benefit,
    payload: row.payload ?? {},
    sourceTool: row.source_tool,
    sourceRunId: row.source_run_id,
    dedupeKey: row.dedupe_key,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewReason: row.review_reason,
    executedAt: row.executed_at,
    executionRef: row.execution_ref,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListAgentActionsFilter {
  status?: AgentActionStatus | AgentActionStatus[];
  kind?: AgentActionKind | AgentActionKind[];
  targetCustomerId?: string;
  limit?: number;
  db?: SupabaseClient;
}

export async function listAgentActions(filter: ListAgentActionsFilter = {}): Promise<AgentActionRow[]> {
  const db = filter.db ?? getSupabaseAdminClient("agent_actions.list");

  let q = db
    .from("agent_actions")
    .select(
      "id, kind, status, target_customer_id, target_campaign_id, title, reason, recommendation, next_step, expected_benefit, payload, source_tool, source_run_id, dedupe_key, reviewed_by, reviewed_at, review_reason, executed_at, execution_ref, expires_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(filter.limit ?? 100);

  if (filter.status) {
    if (Array.isArray(filter.status)) q = q.in("status", filter.status);
    else q = q.eq("status", filter.status);
  }
  if (filter.kind) {
    if (Array.isArray(filter.kind)) q = q.in("kind", filter.kind);
    else q = q.eq("kind", filter.kind);
  }
  if (filter.targetCustomerId) q = q.eq("target_customer_id", filter.targetCustomerId);

  const { data, error } = await q;
  if (error) throw new AgentActionsWriteError(`Falha ao listar agent_actions: ${error.message}`, 502);
  return ((data ?? []) as AgentActionRowRaw[]).map(mapRow);
}
