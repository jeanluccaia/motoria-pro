import "server-only";

import type { NextRequest } from "next/server";
import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "@/lib/growth/admin-session";
import { detectProviderMode } from "@/lib/growth/agent/agent-provider";
import { isAnthropicConfigured } from "@/lib/growth/agent/providers/llm-provider";

// Endpoint diagnóstico read-only para provar server-side qual provider está
// ativo sem expor a chave. Booleanos + comprimento apenas. Requer cookie admin.

export async function GET(request: NextRequest) {
  const session = request.cookies.get(DGN_ADMIN_COOKIE)?.value;
  if (!(await validateAdminSessionToken(session))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const rawLen = (process.env.ANTHROPIC_API_KEY ?? "").length;
  const trimmedLen = (process.env.ANTHROPIC_API_KEY ?? "").trim().length;

  return Response.json({
    hasAnthropicKey: isAnthropicConfigured(),
    keyLengthRaw: rawLen,
    keyLengthTrimmed: trimmedLen,
    providerMode: detectProviderMode(),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    vercelGitCommitRef: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    vercelGitCommitSha: (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7),
  });
}
