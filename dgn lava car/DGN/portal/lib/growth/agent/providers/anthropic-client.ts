import "server-only";

import { createAnthropic, type AnthropicProvider } from "@ai-sdk/anthropic";

// -----------------------------------------------------------------------------
// Fábrica única do provider Anthropic para o DGN Agent. Configura os headers
// exigidos por identity-linked API keys (workspace-id) em UM lugar só, para
// que health check + LlmAgentProvider + tool calling usem exatamente a mesma
// configuração. Nunca loga chave ou header.
// -----------------------------------------------------------------------------

export interface AnthropicRuntimeEnv {
  hasApiKey: boolean;
  hasWorkspaceId: boolean;
  fullyConfigured: boolean;
}

export function readAnthropicEnv(env: NodeJS.ProcessEnv = process.env): AnthropicRuntimeEnv {
  const hasApiKey = (env.ANTHROPIC_API_KEY ?? "").trim().length > 0;
  const hasWorkspaceId = (env.ANTHROPIC_WORKSPACE_ID ?? "").trim().length > 0;
  return {
    hasApiKey,
    hasWorkspaceId,
    fullyConfigured: hasApiKey && hasWorkspaceId,
  };
}

/**
 * Cria uma instância `AnthropicProvider` com os headers exigidos por chaves
 * identity-linked (organization + workspace). Retorna `null` se algum env
 * obrigatório estiver ausente — chamador deve cair no fallback determinístico.
 *
 * A chave é passada implicitamente via `ANTHROPIC_API_KEY` (default do SDK);
 * nunca lida direto neste módulo, para reduzir superfície de exposição.
 */
export function createConfiguredAnthropicProvider(
  env: NodeJS.ProcessEnv = process.env,
): AnthropicProvider | null {
  const runtime = readAnthropicEnv(env);
  if (!runtime.fullyConfigured) return null;

  const workspaceId = (env.ANTHROPIC_WORKSPACE_ID ?? "").trim();
  return createAnthropic({
    headers: {
      "anthropic-workspace-id": workspaceId,
    },
  });
}
