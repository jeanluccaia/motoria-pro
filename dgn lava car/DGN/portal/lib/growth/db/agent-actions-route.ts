import "server-only";

import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "../admin-session.ts";
import {
  AgentActionsWriteError,
  approveAgentAction,
  rejectAgentAction,
  markAgentActionExecuted,
  listAgentActions,
  type AgentActionRow,
  type AgentActionStatus,
} from "./agent-actions-write.ts";

// ---------------------------------------------------------------------------
// Route handlers para /api/admin/growth/agent-actions.
//
// Padrão homologado:
// - validateAdminSessionToken no cookie DGN_ADMIN_COOKIE (gated pela proxy)
// - source DGN_GROWTH_DATA_SOURCE deve ser "db"
// - actor derivado do cookie admin (sempre "dgn-admin"; LLM nunca escreve aqui)
// - result_code textual da RPC vira status HTTP coerente:
//     UPDATED            → 200
//     ALREADY_*          → 409
//     NOT_FOUND          → 404
//     INVALID_STATE_*    → 409
// ---------------------------------------------------------------------------

export interface AgentActionsRequest {
  cookies: { get(name: string): { value: string } | undefined };
  json(): Promise<unknown>;
  nextUrl?: URL;
  url?: string;
}

interface RouteDependencies {
  authorize(request: AgentActionsRequest): Promise<boolean>;
  source: string;
}

const defaults: RouteDependencies = {
  authorize: (request) => validateAdminSessionToken(request.cookies.get(DGN_ADMIN_COOKIE)?.value),
  source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
};

const ACTOR = "dgn-admin";

function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
function dbOnly() {
  return Response.json({ error: "Agent Actions só está disponível no modo DB." }, { status: 409 });
}
function invalidId() {
  return Response.json({ error: "Ação inválida." }, { status: 400 });
}

function toResponse(error: unknown, fallback: string) {
  if (error instanceof AgentActionsWriteError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof SyntaxError) {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }
  console.error(
    "[DGN Growth] Falha em agent-actions",
    error instanceof Error ? error.message : "erro desconhecido",
  );
  return Response.json({ error: fallback }, { status: 500 });
}

function transitionStatus(code: string): number {
  switch (code) {
    case "UPDATED":
      return 200;
    case "NOT_FOUND":
      return 404;
    case "ALREADY_APPROVED":
    case "ALREADY_REJECTED":
    case "ALREADY_EXECUTED":
    case "INVALID_STATE_TRANSITION":
      return 409;
    default:
      return 500;
  }
}

function parseStatusFilter(raw: string | null): AgentActionStatus[] | null {
  if (!raw) return null;
  const allowed: AgentActionStatus[] = [
    "pending_review",
    "approved",
    "rejected",
    "executed",
    "archived",
  ];
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p): p is AgentActionStatus => allowed.includes(p as AgentActionStatus));
  return parts.length > 0 ? parts : null;
}

// GET /api/admin/growth/agent-actions?status=pending_review&limit=50
export async function handleAgentActionsList(
  request: AgentActionsRequest,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  try {
    const url = request.nextUrl ?? (request.url ? new URL(request.url) : null);
    const statusParam = url?.searchParams.get("status") ?? "pending_review";
    const limitRaw = url?.searchParams.get("limit");
    const limit = limitRaw ? Math.min(Math.max(parseInt(limitRaw, 10) || 50, 1), 200) : 50;
    const status = parseStatusFilter(statusParam);
    const rows: AgentActionRow[] = await listAgentActions({
      status: status ?? "pending_review",
      limit,
    });
    return Response.json({ actions: rows }, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível listar agent_actions.");
  }
}

interface TransitionBody {
  reason?: unknown;
  executionRef?: unknown;
}

export async function handleAgentActionApprove(
  request: AgentActionsRequest,
  actionId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!actionId || actionId.length > 100) return invalidId();
  try {
    const body = (await request.json().catch(() => ({}))) as TransitionBody;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : null;
    const result = await approveAgentAction({
      actionId,
      actor: ACTOR,
      reason: reason || null,
    });
    return Response.json(result, { status: transitionStatus(result.resultCode) });
  } catch (error) {
    return toResponse(error, "Não foi possível aprovar a ação.");
  }
}

export async function handleAgentActionReject(
  request: AgentActionsRequest,
  actionId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!actionId || actionId.length > 100) return invalidId();
  try {
    const body = (await request.json().catch(() => ({}))) as TransitionBody;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!reason) {
      return Response.json({ error: "Motivo da rejeição é obrigatório." }, { status: 400 });
    }
    const result = await rejectAgentAction({
      actionId,
      actor: ACTOR,
      reason,
    });
    return Response.json(result, { status: transitionStatus(result.resultCode) });
  } catch (error) {
    return toResponse(error, "Não foi possível rejeitar a ação.");
  }
}

export async function handleAgentActionExecute(
  request: AgentActionsRequest,
  actionId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!actionId || actionId.length > 100) return invalidId();
  try {
    const body = (await request.json().catch(() => ({}))) as TransitionBody;
    const executionRef =
      typeof body?.executionRef === "string" && body.executionRef.trim()
        ? body.executionRef.trim()
        : null;
    const result = await markAgentActionExecuted({
      actionId,
      actor: ACTOR,
      executionRef,
    });
    return Response.json(result, { status: transitionStatus(result.resultCode) });
  } catch (error) {
    return toResponse(error, "Não foi possível marcar a ação como executada.");
  }
}
