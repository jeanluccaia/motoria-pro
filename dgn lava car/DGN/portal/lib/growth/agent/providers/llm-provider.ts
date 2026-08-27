import "server-only";

import { generateText, stepCountIs, type LanguageModel } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

import type { AgentContext } from "../agent-context.ts";
import type { AgentProvider } from "./types.ts";
import type { AgentQuery, AgentResponse, AgentResponseBlock } from "../types.ts";
import { buildAgentTools, createAccumulator } from "../tools.ts";
import { SYSTEM_PROMPT, SYSTEM_PROMPT_VERSION } from "../system-prompt.ts";

// -----------------------------------------------------------------------------
// LlmAgentProvider — orquestra tool calling multi-step usando Vercel AI SDK.
// O LLM SÓ pode chamar as tools em `buildAgentTools()` (todas read-only). Ele
// nunca recebe SQL, service role ou acesso genérico a Supabase. A resposta
// final vira um bloco de texto + os cards/summaries/actions coletados durante
// as tool calls (o LLM não reconstrói estrutura — só sintetiza texto).
// -----------------------------------------------------------------------------

const HISTORY_HARD_CAP = 6; // últimas trocas — cap server-side
const MAX_STEPS = 5; // até 5 iterações de tool calling por turno
const DEFAULT_MODEL_ID = "claude-sonnet-4-6";

export interface LlmAgentProviderOptions {
  /** Sobrescreve o model id. Default: claude-sonnet-4-6. */
  modelId?: string;
  /** Injeção de modelo (para testes com mock). Se passado, ignora modelId. */
  model?: LanguageModel;
}

export function isAnthropicConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const key = env.ANTHROPIC_API_KEY?.trim();
  return typeof key === "string" && key.length > 0;
}

export class LlmAgentProvider implements AgentProvider {
  private readonly model: LanguageModel;
  private readonly modelId: string;

  constructor(options: LlmAgentProviderOptions = {}) {
    this.modelId = options.modelId ?? DEFAULT_MODEL_ID;
    this.model = options.model ?? anthropic(this.modelId);
  }

  async converse(query: AgentQuery, ctx: AgentContext): Promise<AgentResponse> {
    const startedAt = performance.now();
    const acc = createAccumulator();
    const tools = buildAgentTools(ctx, acc);

    const messages = clampHistory(query.history ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    messages.push({ role: "user" as const, content: query.message });

    const result = await generateText({
      model: this.model,
      system: SYSTEM_PROMPT,
      messages,
      tools,
      stopWhen: stepCountIs(MAX_STEPS),
      temperature: 0.2,
    });

    const text = extractText(result);
    const blocks: AgentResponseBlock[] = [];
    if (text.trim().length > 0) {
      blocks.push({ kind: "text", text });
    }
    if (acc.cards.length > 0) {
      blocks.push({ kind: "cards", cards: dedupeCards(acc.cards) });
    }
    for (const summary of acc.summaries) {
      blocks.push({ kind: "summary", summary });
    }
    for (const action of acc.actions) {
      blocks.push({ kind: "next-action", action });
    }
    if (blocks.length === 0) {
      // Caso extremo: LLM não produziu texto nem chamou tool. Devolve fallback textual.
      blocks.push({
        kind: "text",
        text: "Não consegui montar uma resposta com os dados atuais. Tente reformular a pergunta.",
      });
    }

    const usage = ("usage" in result ? result.usage : undefined) as
      | { inputTokens?: number; outputTokens?: number; totalTokens?: number }
      | undefined;

    return {
      intent: "llm-synthesis",
      blocks,
      disclosures: acc.facts.length > 0 || acc.inferences.length > 0
        ? { facts: dedupe(acc.facts), inferences: dedupe(acc.inferences) }
        : undefined,
      providerMode: "llm",
      metrics: {
        latencyMs: Math.round(performance.now() - startedAt),
        toolCalls: acc.invocations.length,
        tokens: usage
          ? {
              input: usage.inputTokens ?? 0,
              output: usage.outputTokens ?? 0,
              total: usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
            }
          : undefined,
        model: this.modelId,
      },
    };
  }
}

function clampHistory(history: AgentQuery["history"] = []) {
  if (history.length <= HISTORY_HARD_CAP) return history;
  return history.slice(history.length - HISTORY_HARD_CAP);
}

function extractText(result: { text?: string; steps?: Array<{ text?: string }> }): string {
  // AI SDK v7: `text` é a saída textual final; se veio vazio, tenta concatenar
  // segmentos de text nas etapas.
  const primary = (result.text ?? "").trim();
  if (primary) return primary;
  const steps = result.steps ?? [];
  return steps.map((s) => s.text ?? "").join("\n").trim();
}

function dedupeCards<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

// Metadados úteis para telemetria/log estruturado.
export const LLM_AGENT_METADATA = {
  systemPromptVersion: SYSTEM_PROMPT_VERSION,
  defaultModelId: DEFAULT_MODEL_ID,
  historyCap: HISTORY_HARD_CAP,
  maxSteps: MAX_STEPS,
};
