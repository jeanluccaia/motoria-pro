import "server-only";

import type { NextRequest } from "next/server";
import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "@/lib/growth/admin-session";
import { buildAgentContext } from "@/lib/growth/agent/agent-context";
import { detectProviderMode, resolveAgentProvider } from "@/lib/growth/agent/agent-provider";
import type { AgentHistoryMessage, AgentQuery } from "@/lib/growth/agent/types";

// Endpoint READ-ONLY do chat do Agent. Cookie do Admin obrigatório; payload
// mínimo (message + history). Provider LLM se ANTHROPIC_API_KEY estiver
// presente; fallback determinístico em caso de erro ou ausência de chave.

const MESSAGE_MAX_LEN = 500;
const HISTORY_MAX_LEN = 6;
const HISTORY_ITEM_MAX_LEN = 800;

interface RawPayload {
  message?: unknown;
  history?: unknown;
}

function parseHistory(raw: unknown): AgentHistoryMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: AgentHistoryMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const trimmed = content.trim();
    if (!trimmed) continue;
    out.push({ role, content: trimmed.slice(0, HISTORY_ITEM_MAX_LEN) });
  }
  return out.slice(Math.max(0, out.length - HISTORY_MAX_LEN));
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get(DGN_ADMIN_COOKIE)?.value;
  if (!(await validateAdminSessionToken(session))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: RawPayload;
  try {
    payload = (await request.json()) as RawPayload;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const message = typeof payload.message === "string"
    ? payload.message.slice(0, MESSAGE_MAX_LEN).trim()
    : "";
  if (!message) {
    return Response.json({ error: "missing_message" }, { status: 400 });
  }

  const query: AgentQuery = {
    message,
    history: parseHistory(payload.history),
  };

  const providerMode = detectProviderMode();
  const startedAt = performance.now();

  try {
    const ctx = await buildAgentContext();
    const provider = resolveAgentProvider();
    const response = await provider.converse(query, ctx);

    // Log estruturado para inspeção de custo/latência antes de escalar.
    logMetrics({
      providerMode: response.providerMode ?? providerMode,
      intent: response.intent,
      latencyMs: response.metrics?.latencyMs ?? Math.round(performance.now() - startedAt),
      toolCalls: response.metrics?.toolCalls ?? 0,
      tokens: response.metrics?.tokens,
      model: response.metrics?.model,
      messageLength: message.length,
      historyLength: query.history?.length ?? 0,
    });

    return Response.json(response);
  } catch (error) {
    console.error(
      "[DGN Agent] falha ao processar query",
      error instanceof Error ? error.message.slice(0, 200) : "erro desconhecido",
    );
    return Response.json(
      {
        error: "agent_unavailable",
        message: "Não consegui fazer a análise completa agora. Tente daqui a pouco.",
      },
      { status: 503 },
    );
  }
}

interface MetricEvent {
  providerMode: string;
  intent: string;
  latencyMs: number;
  toolCalls: number;
  tokens?: { input: number; output: number; total: number };
  model?: string;
  messageLength: number;
  historyLength: number;
}

function logMetrics(event: MetricEvent) {
  // Single-line JSON — fácil de agregar em logs Vercel/Datadog depois.
  console.log(
    "[dgn-agent-metrics]",
    JSON.stringify({
      ts: new Date().toISOString(),
      ...event,
    }),
  );
}
