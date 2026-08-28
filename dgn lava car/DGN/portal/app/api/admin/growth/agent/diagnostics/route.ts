import "server-only";

import type { NextRequest } from "next/server";
import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "@/lib/growth/admin-session";
import { detectProviderMode } from "@/lib/growth/agent/agent-provider";
import { isAnthropicConfigured } from "@/lib/growth/agent/providers/llm-provider";

// Endpoint diagnóstico admin-guarded. Retorna somente booleanos/enums —
// nenhuma parte do valor da chave é lida ou devolvida.

export async function GET(request: NextRequest) {
  const session = request.cookies.get(DGN_ADMIN_COOKIE)?.value;
  if (!(await validateAdminSessionToken(session))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  return Response.json({
    hasAnthropicKey: isAnthropicConfigured(),
    providerModeResolved: detectProviderMode(),
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
}
