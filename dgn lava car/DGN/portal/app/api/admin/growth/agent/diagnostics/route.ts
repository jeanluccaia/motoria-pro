import "server-only";

import type { NextRequest } from "next/server";
import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "@/lib/growth/admin-session";
import { detectProviderMode } from "@/lib/growth/agent/agent-provider";
import { readAnthropicEnv } from "@/lib/growth/agent/providers/anthropic-client";

// Endpoint diagnóstico admin-guarded. Retorna somente booleanos/enums —
// nenhuma parte do valor da chave nem do workspace-id é lida ou devolvida.

export async function GET(request: NextRequest) {
  const session = request.cookies.get(DGN_ADMIN_COOKIE)?.value;
  if (!(await validateAdminSessionToken(session))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const env = readAnthropicEnv();

  return Response.json({
    hasAnthropicKey: env.hasApiKey,
    hasAnthropicWorkspaceId: env.hasWorkspaceId,
    providerModeResolved: detectProviderMode(),
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
}
