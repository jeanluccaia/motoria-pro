import type { AgentContext } from "../agent-context.ts";
import type { AgentQuery, AgentResponse } from "../types.ts";

// Interface pública compartilhada pelos providers concretos. Manter fina —
// tudo que muda entre implementações fica dentro do provider (roteamento,
// tool calling, síntese textual).
export interface AgentProvider {
  converse(query: AgentQuery, ctx: AgentContext): Promise<AgentResponse>;
}
