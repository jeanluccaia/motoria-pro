import "server-only";

import { tool } from "ai";
import { z } from "zod";

import type { AgentContext } from "./agent-context.ts";
import { AGENT_SKILL_REGISTRY } from "./registry.ts";
import type { AttentionCard, SkillResult } from "./types.ts";
import { getDailyBriefing } from "./skills/daily-briefing.ts";
import { getFounderAttention } from "./skills/founder-attention.ts";
import { getCurationOpportunities } from "./skills/curation-opportunities.ts";
import { getSubscriberAttention } from "./skills/subscriber-attention.ts";
import { findCustomerByFuzzyName, getCustomerSummary } from "./skills/customer-summary.ts";
import { suggestNextAction } from "./skills/next-action.ts";

// -----------------------------------------------------------------------------
// Tool set exposto ao LLM. Cada tool é um wrapper fino sobre uma skill do
// registry — nenhuma dessas ferramentas aceita SQL, tabela ou parâmetro que
// permita alcance genérico ao banco. O LLM só pode escolher entre elas.
//
// Contrato de retorno: sempre um objeto com { status, message?, ... payload }.
// O provider LLM captura o array `cards` de cada resposta para hidratar a UI
// com deep-links sem pedir ao modelo que reconstrua a estrutura.
// -----------------------------------------------------------------------------

/** Nome canônico das tools — casa 1:1 com o registry. */
export const AGENT_TOOL_NAMES = [
  "get_daily_briefing",
  "get_founder_attention",
  "get_curation_opportunities",
  "get_subscriber_attention",
  "get_customer_summary",
  "suggest_next_action",
] as const;

export type AgentToolName = (typeof AGENT_TOOL_NAMES)[number];

/** Acumulador que o provider LLM usa para agregar cards emitidos pelas tools. */
export interface ToolInvocationAccumulator {
  cards: AttentionCard[];
  summaries: import("./types.ts").CustomerSummary[];
  actions: import("./types.ts").NextActionSuggestion[];
  facts: string[];
  inferences: string[];
  invocations: Array<{ name: AgentToolName; input: Record<string, unknown>; status: SkillResult<unknown>["status"] }>;
}

function pushSkill<T>(acc: ToolInvocationAccumulator, name: AgentToolName, input: Record<string, unknown>, result: SkillResult<T>) {
  acc.invocations.push({ name, input, status: result.status });
  if (result.status === "ok") {
    acc.facts.push(...result.facts);
    acc.inferences.push(...result.inferences);
  }
}

/** Constrói o objeto tools passado ao `generateText` do AI SDK. */
export function buildAgentTools(ctx: AgentContext, acc: ToolInvocationAccumulator) {
  return {
    get_daily_briefing: tool({
      description:
        "Retorna as 5 prioridades do dia (mix de Founder, Curadoria e Assinantes). Sem parâmetros. Use quando o operador pedir panorama, briefing, quem chamar hoje.",
      inputSchema: z.object({}),
      execute: async () => {
        const result = getDailyBriefing(ctx);
        pushSkill(acc, "get_daily_briefing", {}, result);
        if (result.status !== "ok" || !result.data) {
          return { status: result.status, message: result.message ?? null };
        }
        acc.cards.push(...result.data.cards);
        return {
          status: "ok" as const,
          greeting: result.data.greeting,
          headline: result.data.headline,
          totals: result.data.totals,
          items: result.data.cards.map(cardToSummary),
        };
      },
    }),

    get_founder_attention: tool({
      description:
        "Convites Founder ativos que precisam de acompanhamento (click WhatsApp sem resposta, visualizado sem avanço, convite parado). Retorna cards com deep-link para /admin/growth/founders-2026.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).optional().describe("Máximo de cards. Default retorna todos até o hard cap 20."),
      }),
      execute: async ({ limit }) => {
        const result = getFounderAttention(ctx, { limit });
        pushSkill(acc, "get_founder_attention", { limit }, result);
        if (result.status !== "ok" || !result.data) {
          return { status: result.status, message: result.message ?? null };
        }
        acc.cards.push(...result.data);
        return { status: "ok" as const, items: result.data.map(cardToSummary) };
      },
    }),

    get_curation_opportunities: tool({
      description:
        "Clientes elegíveis para aquisição Founder ordenados por score DGN. Reusa isFounderAcquisitionEligible — assinantes conhecidos NUNCA aparecem. Retorna cards com deep-link para /admin/growth/curadoria.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).optional().describe("Máximo de cards. Default 8 (paginação da tela); pode subir até 20."),
      }),
      execute: async ({ limit }) => {
        const result = getCurationOpportunities(ctx, { limit });
        pushSkill(acc, "get_curation_opportunities", { limit }, result);
        if (result.status !== "ok" || !result.data) {
          return { status: result.status, message: result.message ?? null };
        }
        acc.cards.push(...result.data);
        return { status: "ok" as const, items: result.data.map(cardToSummary) };
      },
    }),

    get_subscriber_attention: tool({
      description:
        "Assinantes que precisam de atenção (renovação pendente na base 4uCar, ou 'Assinante Ativo' sem correspondência na base viva). NUNCA inventa data de vencimento.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).optional(),
      }),
      execute: async ({ limit }) => {
        const result = getSubscriberAttention(ctx, { limit });
        pushSkill(acc, "get_subscriber_attention", { limit }, result);
        if (result.status !== "ok" || !result.data) {
          return { status: result.status, message: result.message ?? null };
        }
        acc.cards.push(...result.data);
        return { status: "ok" as const, items: result.data.map(cardToSummary) };
      },
    }),

    get_customer_summary: tool({
      description:
        "Visão 360 de UM cliente (identidade + comercial + score + Founder + assinatura). Aceita customerId (legacy_id) OU nameQuery (busca fuzzy por parte do nome).",
      inputSchema: z.object({
        customerId: z.string().min(1).optional(),
        nameQuery: z.string().min(2).optional(),
      }).refine((v) => Boolean(v.customerId || v.nameQuery), {
        message: "Informe customerId ou nameQuery.",
      }),
      execute: async ({ customerId, nameQuery }) => {
        let resolvedId = customerId ?? "";
        if (!resolvedId && nameQuery) {
          const found = findCustomerByFuzzyName(ctx, nameQuery);
          if (!found) {
            pushSkill(acc, "get_customer_summary", { customerId, nameQuery }, {
              status: "unavailable", facts: [], inferences: [], message: "not_found",
            });
            return { status: "unavailable" as const, message: `Não encontrei "${nameQuery}" na base.` };
          }
          resolvedId = found.id;
        }
        const result = getCustomerSummary(ctx, resolvedId);
        pushSkill(acc, "get_customer_summary", { customerId: resolvedId }, result);
        if (result.status !== "ok" || !result.data) {
          return { status: result.status, message: result.message ?? null };
        }
        acc.summaries.push(result.data);
        return {
          status: "ok" as const,
          customerId: result.data.customerId,
          name: result.data.name,
          score: result.data.score ?? null,
          identity: result.data.identity,
          commercial: result.data.commercial,
          founder: result.data.founder ?? null,
          subscriber: result.data.subscriber ?? null,
          primaryHref: result.data.primaryHref,
          facts: result.facts,
          inferences: result.inferences,
        };
      },
    }),

    suggest_next_action: tool({
      description:
        "Sugere a próxima ação para UM cliente (com base em fatos do snapshot). Aceita customerId OU nameQuery. Devolve headline + rationale + href.",
      inputSchema: z.object({
        customerId: z.string().min(1).optional(),
        nameQuery: z.string().min(2).optional(),
      }).refine((v) => Boolean(v.customerId || v.nameQuery), {
        message: "Informe customerId ou nameQuery.",
      }),
      execute: async ({ customerId, nameQuery }) => {
        let resolvedId = customerId ?? "";
        if (!resolvedId && nameQuery) {
          const found = findCustomerByFuzzyName(ctx, nameQuery);
          if (!found) {
            pushSkill(acc, "suggest_next_action", { customerId, nameQuery }, {
              status: "unavailable", facts: [], inferences: [], message: "not_found",
            });
            return { status: "unavailable" as const, message: `Não encontrei "${nameQuery}" na base.` };
          }
          resolvedId = found.id;
        }
        const result = suggestNextAction(ctx, resolvedId);
        pushSkill(acc, "suggest_next_action", { customerId: resolvedId }, result);
        if (result.status !== "ok" || !result.data) {
          return { status: result.status, message: result.message ?? null };
        }
        acc.actions.push(result.data);
        return {
          status: "ok" as const,
          customerId: result.data.customerId,
          headline: result.data.headline,
          rationale: result.data.rationale,
          href: result.data.href,
        };
      },
    }),
  };
}

function cardToSummary(card: AttentionCard) {
  return {
    id: card.id,
    priority: card.priority,
    kind: card.kind,
    title: card.title,
    reason: card.reason,
    nextAction: card.nextAction,
    href: card.href,
    customerId: card.customerId,
  };
}

/**
 * Sanity: garante que TODA tool aqui exposta tenha um registro read_only
 * correspondente. Se alguém adicionar uma tool sem passar pelo registry,
 * este check reprova em desenvolvimento (usado pelo teste).
 */
export function assertToolsAreRegisteredReadOnly() {
  for (const name of AGENT_TOOL_NAMES) {
    const skill = AGENT_SKILL_REGISTRY.find((s) => s.name === name);
    if (!skill) throw new Error(`Tool ${name} não está declarada no registry.`);
    if (skill.mode !== "read_only") throw new Error(`Tool ${name} não é read_only.`);
  }
}

export function createAccumulator(): ToolInvocationAccumulator {
  return { cards: [], summaries: [], actions: [], facts: [], inferences: [], invocations: [] };
}
