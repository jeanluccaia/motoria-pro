import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";

// ---------------------------------------------------------------------------
// Camada de acesso para agent_campaigns.
//
// Rascunho de campanha produzido pelo agente ou pelo operador. Status
// terminal (approved/paused/archived) é imutável por upsert — só a RPC
// agent_campaign_approve avança de 'draft'.
// ---------------------------------------------------------------------------

export class AgentCampaignsWriteError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type AgentCampaignStatus = "draft" | "approved" | "paused" | "archived";

export interface UpsertAgentCampaignInput {
  campaignId?: string | null;
  name: string;
  objective: string;
  audienceRules?: Record<string, unknown>;
  estimatedAudience?: number | null;
  draftMessage?: string | null;
  suggestedChannel?: string | null;
  sourceTool: string;
  actor: string;
  db?: SupabaseClient;
}

export type UpsertCampaignResultCode =
  | "CREATED"
  | "UPDATED"
  | "NO_CHANGE"
  | "NOT_FOUND"
  | "INVALID_STATE_TRANSITION";

export interface UpsertAgentCampaignResult {
  resultCode: UpsertCampaignResultCode;
  campaignId: string | null;
}

export async function upsertAgentCampaignDraft(
  input: UpsertAgentCampaignInput,
): Promise<UpsertAgentCampaignResult> {
  const db = input.db ?? getSupabaseAdminClient("agent_campaigns.upsert_draft");

  const actor = (input.actor ?? "").trim();
  if (!actor) throw new AgentCampaignsWriteError("Actor é obrigatório.", 400);

  const sourceTool = (input.sourceTool ?? "").trim();
  if (!sourceTool) throw new AgentCampaignsWriteError("source_tool é obrigatório.", 400);

  const name = (input.name ?? "").trim();
  const objective = (input.objective ?? "").trim();
  if (!name) throw new AgentCampaignsWriteError("Name é obrigatório.", 400);
  if (!objective) throw new AgentCampaignsWriteError("Objective é obrigatório.", 400);

  const rpc = await db.rpc("agent_campaign_upsert_draft", {
    p_campaign_id: input.campaignId ?? null,
    p_name: name,
    p_objective: objective,
    p_audience_rules: input.audienceRules ?? {},
    p_estimated_audience: input.estimatedAudience ?? null,
    p_draft_message: input.draftMessage ?? null,
    p_suggested_channel: input.suggestedChannel ?? null,
    p_source_tool: sourceTool,
    p_actor: actor,
  });
  if (rpc.error) throw new AgentCampaignsWriteError(`Falha em upsert_draft: ${rpc.error.message}`, 502);

  const rows = (rpc.data ?? []) as Array<{ result_code?: string; campaign_id?: string | null }>;
  const row = rows[0] ?? {};
  const allowed: UpsertCampaignResultCode[] = [
    "CREATED",
    "UPDATED",
    "NO_CHANGE",
    "NOT_FOUND",
    "INVALID_STATE_TRANSITION",
  ];
  const code = allowed.includes(row.result_code as UpsertCampaignResultCode)
    ? (row.result_code as UpsertCampaignResultCode)
    : null;
  if (!code) throw new AgentCampaignsWriteError(`Retorno inesperado: ${row.result_code}`, 502);

  return { resultCode: code, campaignId: row.campaign_id ?? null };
}

export interface ApproveAgentCampaignInput {
  campaignId: string;
  actor: string;
  db?: SupabaseClient;
}

export type ApproveCampaignResultCode =
  | "UPDATED"
  | "ALREADY_APPROVED"
  | "NOT_FOUND"
  | "INVALID_STATE_TRANSITION";

export interface ApproveAgentCampaignResult {
  resultCode: ApproveCampaignResultCode;
  campaignId: string | null;
}

export async function approveAgentCampaign(
  input: ApproveAgentCampaignInput,
): Promise<ApproveAgentCampaignResult> {
  const db = input.db ?? getSupabaseAdminClient("agent_campaigns.approve");

  const actor = (input.actor ?? "").trim();
  if (!actor) throw new AgentCampaignsWriteError("Actor é obrigatório.", 400);

  const rpc = await db.rpc("agent_campaign_approve", {
    p_campaign_id: input.campaignId,
    p_actor: actor,
  });
  if (rpc.error) throw new AgentCampaignsWriteError(`Falha em approve: ${rpc.error.message}`, 502);

  const rows = (rpc.data ?? []) as Array<{ result_code?: string; campaign_id?: string | null }>;
  const row = rows[0] ?? {};
  const allowed: ApproveCampaignResultCode[] = [
    "UPDATED",
    "ALREADY_APPROVED",
    "NOT_FOUND",
    "INVALID_STATE_TRANSITION",
  ];
  const code = allowed.includes(row.result_code as ApproveCampaignResultCode)
    ? (row.result_code as ApproveCampaignResultCode)
    : null;
  if (!code) throw new AgentCampaignsWriteError(`Retorno inesperado: ${row.result_code}`, 502);

  return { resultCode: code, campaignId: row.campaign_id ?? null };
}

// -----------------------------------------------------------------------------
// Read helpers
// -----------------------------------------------------------------------------

export interface AgentCampaignRow {
  id: string;
  status: AgentCampaignStatus;
  name: string;
  objective: string;
  audienceRules: Record<string, unknown>;
  estimatedAudience: number | null;
  draftMessage: string | null;
  suggestedChannel: string | null;
  sourceTool: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AgentCampaignRowRaw {
  id: string;
  status: AgentCampaignStatus;
  name: string;
  objective: string;
  audience_rules: Record<string, unknown> | null;
  estimated_audience: number | null;
  draft_message: string | null;
  suggested_channel: string | null;
  source_tool: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapCampaignRow(row: AgentCampaignRowRaw): AgentCampaignRow {
  return {
    id: row.id,
    status: row.status,
    name: row.name,
    objective: row.objective,
    audienceRules: row.audience_rules ?? {},
    estimatedAudience: row.estimated_audience,
    draftMessage: row.draft_message,
    suggestedChannel: row.suggested_channel,
    sourceTool: row.source_tool,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListAgentCampaignsFilter {
  status?: AgentCampaignStatus | AgentCampaignStatus[];
  limit?: number;
  db?: SupabaseClient;
}

export async function listAgentCampaigns(
  filter: ListAgentCampaignsFilter = {},
): Promise<AgentCampaignRow[]> {
  const db = filter.db ?? getSupabaseAdminClient("agent_campaigns.list");

  let q = db
    .from("agent_campaigns")
    .select(
      "id, status, name, objective, audience_rules, estimated_audience, draft_message, suggested_channel, source_tool, approved_by, approved_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(filter.limit ?? 100);

  if (filter.status) {
    if (Array.isArray(filter.status)) q = q.in("status", filter.status);
    else q = q.eq("status", filter.status);
  }

  const { data, error } = await q;
  if (error) throw new AgentCampaignsWriteError(`Falha ao listar campanhas: ${error.message}`, 502);
  return ((data ?? []) as AgentCampaignRowRaw[]).map(mapCampaignRow);
}
