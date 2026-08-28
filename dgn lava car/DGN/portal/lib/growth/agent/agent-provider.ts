import "server-only";

import type { AgentContext } from "./agent-context.ts";
import type { AgentQuery, AgentResponse } from "./types.ts";
import type { AgentProvider } from "./providers/types.ts";
import { DeterministicAgentProvider } from "./providers/deterministic-provider.ts";
import { LlmAgentProvider, isAnthropicConfigured } from "./providers/llm-provider.ts";

// Re-exports para compatibilidade com quem importava direto deste arquivo
// (código anterior da Fase 1).
export { DeterministicAgentProvider };
export type { AgentProvider };

// -----------------------------------------------------------------------------
// resolveAgentProvider — escolhe LLM se a chave estiver presente, senão cai no
// determinístico. Nenhum efeito colateral no import.
// -----------------------------------------------------------------------------

export function resolveAgentProvider(env: NodeJS.ProcessEnv = process.env): AgentProvider {
  if (isAnthropicConfigured(env)) {
    return new SafeLlmProvider();
  }
  return new DeterministicAgentProvider();
}

/**
 * Retorna qual provider está ativo — usado na resposta e no badge da UI para
 * o operador saber se está em modo IA ou modo básico.
 */
export function detectProviderMode(env: NodeJS.ProcessEnv = process.env): "llm" | "deterministic" {
  return isAnthropicConfigured(env) ? "llm" : "deterministic";
}

// -----------------------------------------------------------------------------
// SafeLlmProvider — wrapper defensivo. Se a chamada ao LLM falhar (rate limit,
// timeout, erro de rede, resposta inválida) DEGRADA automaticamente para o
// determinístico e marca `providerMode: "deterministic-fallback"` — nunca
// quebra a página.
// -----------------------------------------------------------------------------

class SafeLlmProvider implements AgentProvider {
  private readonly llm = new LlmAgentProvider();
  private readonly deterministic = new DeterministicAgentProvider();

  async converse(query: AgentQuery, ctx: AgentContext): Promise<AgentResponse> {
    try {
      return await this.llm.converse(query, ctx);
    } catch (error) {
      logLlmError("converse", error);
      const fallback = await this.deterministic.converse(query, ctx);
      return { ...fallback, providerMode: "deterministic-fallback" };
    }
  }
}

/**
 * Log server-side sanitizado de erro do LLM. Extrai class/name, HTTP status
 * e provider error code quando disponíveis. NUNCA loga API key, headers,
 * prompt ou dados de cliente. Formato single-line JSON para agregação.
 */
export function logLlmError(scope: string, error: unknown): void {
  const info = extractSanitizedErrorInfo(error);
  console.warn(
    "[dgn-agent-llm-error]",
    JSON.stringify({
      ts: new Date().toISOString(),
      scope,
      ...info,
    }),
  );
}

interface SanitizedErrorInfo {
  name: string;
  status: number | null;
  code: string | null;
  message: string;
}

function extractSanitizedErrorInfo(error: unknown): SanitizedErrorInfo {
  const name = (error as { name?: unknown })?.name;
  const rawMessage = (error as { message?: unknown })?.message;
  const message = typeof rawMessage === "string" ? rawMessage.slice(0, 300) : "";

  // Vercel AI SDK errors expõem statusCode / responseBody; Anthropic SDK
  // expõe status/error.type. Cobrimos ambos sem tocar em headers.
  const status = pickNumber([
    (error as { status?: unknown })?.status,
    (error as { statusCode?: unknown })?.statusCode,
    (error as { response?: { status?: unknown } })?.response?.status,
  ]);

  const code = pickString([
    (error as { code?: unknown })?.code,
    (error as { error?: { type?: unknown } })?.error?.type,
    (error as { data?: { error?: { type?: unknown } } })?.data?.error?.type,
    (error as { type?: unknown })?.type,
  ]);

  return {
    name: typeof name === "string" ? name : "UnknownError",
    status,
    code,
    message,
  };
}

function pickNumber(candidates: unknown[]): number | null {
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return c;
  }
  return null;
}

function pickString(candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c.trim().slice(0, 80);
  }
  return null;
}
