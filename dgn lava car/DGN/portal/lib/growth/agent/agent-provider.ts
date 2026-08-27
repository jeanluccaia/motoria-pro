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
      // Log server-side sanitizado — sem expor stack/secret ao browser.
      console.warn(
        "[DGN Agent] LLM indisponível, degradando para modo básico",
        error instanceof Error ? error.message.slice(0, 200) : "erro desconhecido",
      );
      const fallback = await this.deterministic.converse(query, ctx);
      return { ...fallback, providerMode: "deterministic-fallback" };
    }
  }
}
