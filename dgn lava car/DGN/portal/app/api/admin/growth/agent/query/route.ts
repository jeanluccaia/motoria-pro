import "server-only";

import type { NextRequest } from "next/server";
import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "@/lib/growth/admin-session";
import { buildAgentContext } from "@/lib/growth/agent/agent-context";
import { resolveAgentProvider } from "@/lib/growth/agent/agent-provider";

// Endpoint READ-ONLY do chat do Agent. Cookie do Admin obrigatório; nenhum
// campo mutável no payload; provider determinístico servido do próprio server.

export async function POST(request: NextRequest) {
  const session = request.cookies.get(DGN_ADMIN_COOKIE)?.value;
  if (!(await validateAdminSessionToken(session))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const message = typeof (payload as { message?: unknown })?.message === "string"
    ? ((payload as { message: string }).message).slice(0, 500).trim()
    : "";

  if (!message) {
    return Response.json({ error: "missing_message" }, { status: 400 });
  }

  try {
    const ctx = await buildAgentContext();
    const provider = resolveAgentProvider();
    const response = await provider.converse({ message }, ctx);
    return Response.json(response);
  } catch (error) {
    console.error("[DGN Agent] falha ao processar query", error instanceof Error ? error.message : "erro desconhecido");
    return Response.json({
      error: "agent_unavailable",
      message: "Não foi possível carregar a inteligência agora.",
    }, { status: 503 });
  }
}
