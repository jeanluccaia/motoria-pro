import "server-only";

import { tool } from "ai";
import { z } from "zod";

import type { AgentContext } from "./agent-context.ts";
import { AGENT_SKILL_REGISTRY } from "./registry.ts";
import type {
  AttentionCard,
  PreparedAttackPlan,
  PreparedCurationBrief,
  PreparedMessage,
  SkillMode,
  SkillResult,
} from "./types.ts";
import { BATCH_PREPARATION_CAP } from "./types.ts";
import { getDailyBriefing } from "./skills/daily-briefing.ts";
import { getFounderAttention } from "./skills/founder-attention.ts";
import { getCurationOpportunities } from "./skills/curation-opportunities.ts";
import { getSubscriberAttention } from "./skills/subscriber-attention.ts";
import { findCustomerByFuzzyName, getCustomerSummary } from "./skills/customer-summary.ts";
import { suggestNextAction } from "./skills/next-action.ts";
import { getFounderMetrics } from "./skills/founder-metrics-skill.ts";
import { prepareFollowupMessage } from "./skills/prepare-followup-message.ts";
import { prepareFounderApproach } from "./skills/prepare-founder-approach.ts";
import { prepareRenewalMessage } from "./skills/prepare-renewal-message.ts";
import { prepareCustomerContact } from "./skills/prepare-customer-contact.ts";
import { prepareCurationBrief } from "./skills/prepare-curation-brief.ts";
import { prepareDailyAttackPlan } from "./skills/prepare-daily-attack-plan.ts";

// -----------------------------------------------------------------------------
// Tool set exposto ao LLM. Cada tool é um wrapper fino sobre uma skill do
// registry — nenhuma dessas ferramentas aceita SQL, tabela ou parâmetro que
// permita alcance genérico ao banco. Nenhuma escreve. O LLM só pode escolher
// entre elas.
//
// Modos permitidos: "read_only" (Fase 1) e "prepare_only" (Fase 2).
// `write` é BANIDO — assertToolsAreRegistered() reprova qualquer outro modo.
// -----------------------------------------------------------------------------

/** Nome canônico das tools — casa 1:1 com o registry. */
export const AGENT_TOOL_NAMES = [
  // read-only
  "get_daily_briefing",
  "get_founder_attention",
  "get_curation_opportunities",
  "get_subscriber_attention",
  "get_customer_summary",
  "suggest_next_action",
  "get_founder_metrics",
  // prepare-only
  "prepare_followup_message",
  "prepare_founder_approach",
  "prepare_renewal_message",
  "prepare_customer_contact",
  "prepare_curation_brief",
  "prepare_daily_attack_plan",
] as const;

export type AgentToolName = (typeof AGENT_TOOL_NAMES)[number];

/** Acumulador que o provider LLM usa para agregar output das tools. */
export interface ToolInvocationAccumulator {
  cards: AttentionCard[];
  summaries: import("./types.ts").CustomerSummary[];
  actions: import("./types.ts").NextActionSuggestion[];
  prepared: PreparedMessage[];
  briefs: PreparedCurationBrief[];
  attackPlans: PreparedAttackPlan[];
  facts: string[];
  inferences: string[];
  invocations: Array<{ name: AgentToolName; input: Record<string, unknown>; status: SkillResult<unknown>["status"] }>;
  /** Contagem de invocações prepare_* nesta resposta — aplica o hard cap. */
  prepareCalls: number;
}

function pushSkill<T>(acc: ToolInvocationAccumulator, name: AgentToolName, input: Record<string, unknown>, result: SkillResult<T>) {
  acc.invocations.push({ name, input, status: result.status });
  if (result.status === "ok") {
    acc.facts.push(...result.facts);
    acc.inferences.push(...result.inferences);
  }
}

function isPrepareTool(name: AgentToolName): boolean {
  return name.startsWith("prepare_");
}

function checkBatchCap(acc: ToolInvocationAccumulator, name: AgentToolName):
  | { blocked: true; message: string }
  | { blocked: false } {
  if (!isPrepareTool(name)) return { blocked: false };
  if (acc.prepareCalls >= BATCH_PREPARATION_CAP) {
    return {
      blocked: true,
      message: `Limite de preparação em lote atingido (${BATCH_PREPARATION_CAP} rascunhos por resposta). Solicite ao operador para revisar os já preparados antes de continuar.`,
    };
  }
  return { blocked: false };
}

async function resolveCustomerRef(
  ctx: AgentContext,
  acc: ToolInvocationAccumulator,
  toolName: AgentToolName,
  args: { customerId?: string; nameQuery?: string },
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  if (args.customerId) return { ok: true, id: args.customerId };
  if (args.nameQuery) {
    const found = findCustomerByFuzzyName(ctx, args.nameQuery);
    if (!found) {
      pushSkill(acc, toolName, args, { status: "unavailable", facts: [], inferences: [], message: "not_found" });
      return { ok: false, message: `Não encontrei "${args.nameQuery}" na base.` };
    }
    return { ok: true, id: found.id };
  }
  return { ok: false, message: "Informe customerId ou nameQuery." };
}

/** Constrói o objeto tools passado ao `generateText` do AI SDK. */
export function buildAgentTools(ctx: AgentContext, acc: ToolInvocationAccumulator) {
  const toneSchema = z
    .enum(["padrao", "mais_curta", "mais_direta", "mais_consultiva", "mais_pessoal", "menos_comercial"])
    .optional()
    .describe("Tom aplicado à mensagem preparada. Default 'padrao'.");

  const customerRefSchema = z.object({
    customerId: z.string().min(1).optional(),
    nameQuery: z.string().min(2).optional(),
  }).refine((v) => Boolean(v.customerId || v.nameQuery), {
    message: "Informe customerId ou nameQuery.",
  });

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
      inputSchema: customerRefSchema,
      execute: async ({ customerId, nameQuery }) => {
        const ref = await resolveCustomerRef(ctx, acc, "get_customer_summary", { customerId, nameQuery });
        if (!ref.ok) return { status: "unavailable" as const, message: ref.message };
        const result = getCustomerSummary(ctx, ref.id);
        pushSkill(acc, "get_customer_summary", { customerId: ref.id }, result);
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
      inputSchema: customerRefSchema,
      execute: async ({ customerId, nameQuery }) => {
        const ref = await resolveCustomerRef(ctx, acc, "suggest_next_action", { customerId, nameQuery });
        if (!ref.ok) return { status: "unavailable" as const, message: ref.message };
        const result = suggestNextAction(ctx, ref.id);
        pushSkill(acc, "suggest_next_action", { customerId: ref.id }, result);
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

    get_founder_metrics: tool({
      description:
        "Snapshot canônico de métricas Founder: total confirmados (Nº001/002/003), próxima vaga disponível (nextAvailableFounderNumber, hoje 4), convites em aberto, selecionados, conversando, pagamento, convertidos, vagas restantes, histórico total. NUNCA recalcule — use SEMPRE esta tool para responder 'quantos Founders', 'Nº004', 'vagas', 'status da campanha'. Nº004 está DISPONÍVEL; Iara Menezes tem histórico legado mas é assinante Priority e NÃO ocupa vaga.",
      inputSchema: z.object({}),
      execute: async () => {
        const result = getFounderMetrics(ctx);
        pushSkill(acc, "get_founder_metrics", {}, result);
        if (result.status !== "ok" || !result.data) {
          return { status: result.status, message: result.message ?? null };
        }
        const d = result.data;
        return {
          status: "ok" as const,
          goal: d.goal,
          confirmedFounders: d.confirmedFounders,
          nextAvailableFounderNumber: d.nextAvailableFounderNumber,
          nextAvailableFounderLabel: d.nextAvailableFounderLabel,
          openInvites: d.openInvites,
          legacyFounderCandidatesCount: d.legacyFounderCandidatesCount,
          available: d.available,
          pipeline: d.pipeline,
          historical: d.historical,
          legacyFounderNotes: d.legacyFounderNotes,
        };
      },
    }),

    // -------------------------------------------------------------------
    // PREPARE-ONLY (Fase 2)
    // -------------------------------------------------------------------

    prepare_followup_message: tool({
      description:
        "Prepara mensagem de follow-up (WhatsApp) para cliente com convite Founder já engajado. NÃO envia. Retorna rascunho + contexto + ângulo + próximo passo.",
      inputSchema: z.object({
        customerId: z.string().min(1).optional(),
        nameQuery: z.string().min(2).optional(),
        tone: toneSchema,
      }).refine((v) => Boolean(v.customerId || v.nameQuery), { message: "Informe customerId ou nameQuery." }),
      execute: async ({ customerId, nameQuery, tone }) => {
        const cap = checkBatchCap(acc, "prepare_followup_message");
        if (cap.blocked) return { status: "unavailable" as const, message: cap.message };
        const ref = await resolveCustomerRef(ctx, acc, "prepare_followup_message", { customerId, nameQuery });
        if (!ref.ok) return { status: "unavailable" as const, message: ref.message };
        acc.prepareCalls += 1;
        const result = prepareFollowupMessage(ctx, ref.id, { tone });
        pushSkill(acc, "prepare_followup_message", { customerId: ref.id, tone }, result);
        if (result.status !== "ok" || !result.data) return { status: result.status, message: result.message ?? null };
        acc.prepared.push(result.data);
        return preparedToLLM(result.data);
      },
    }),

    prepare_founder_approach: tool({
      description:
        "Prepara abordagem de aquisição Founder para cliente ELEGÍVEL (isFounderAcquisitionEligible=true). Se inelegível RECUSA com motivo canônico e não gera mensagem.",
      inputSchema: z.object({
        customerId: z.string().min(1).optional(),
        nameQuery: z.string().min(2).optional(),
        tone: toneSchema,
      }).refine((v) => Boolean(v.customerId || v.nameQuery), { message: "Informe customerId ou nameQuery." }),
      execute: async ({ customerId, nameQuery, tone }) => {
        const cap = checkBatchCap(acc, "prepare_founder_approach");
        if (cap.blocked) return { status: "unavailable" as const, message: cap.message };
        const ref = await resolveCustomerRef(ctx, acc, "prepare_founder_approach", { customerId, nameQuery });
        if (!ref.ok) return { status: "unavailable" as const, message: ref.message };
        acc.prepareCalls += 1;
        const result = prepareFounderApproach(ctx, ref.id, { tone });
        pushSkill(acc, "prepare_founder_approach", { customerId: ref.id, tone }, result);
        if (result.status !== "ok" || !result.data) return { status: result.status, message: result.message ?? null };
        acc.prepared.push(result.data);
        return preparedToLLM(result.data);
      },
    }),

    prepare_renewal_message: tool({
      description:
        "Prepara mensagem de renovação para assinante com renovação pendente reconhecido. NUNCA menciona vencimento, preço ou condição — apenas confirma interesse antes de qualquer alteração.",
      inputSchema: z.object({
        customerId: z.string().min(1).optional(),
        nameQuery: z.string().min(2).optional(),
        tone: toneSchema,
      }).refine((v) => Boolean(v.customerId || v.nameQuery), { message: "Informe customerId ou nameQuery." }),
      execute: async ({ customerId, nameQuery, tone }) => {
        const cap = checkBatchCap(acc, "prepare_renewal_message");
        if (cap.blocked) return { status: "unavailable" as const, message: cap.message };
        const ref = await resolveCustomerRef(ctx, acc, "prepare_renewal_message", { customerId, nameQuery });
        if (!ref.ok) return { status: "unavailable" as const, message: ref.message };
        acc.prepareCalls += 1;
        const result = prepareRenewalMessage(ctx, ref.id, { tone });
        pushSkill(acc, "prepare_renewal_message", { customerId: ref.id, tone }, result);
        if (result.status !== "ok" || !result.data) return { status: result.status, message: result.message ?? null };
        acc.prepared.push(result.data);
        return preparedToLLM(result.data);
      },
    }),

    prepare_customer_contact: tool({
      description:
        "Skill genérica de preparação. Recebe (customerId, objective). Valida coerência do objetivo ANTES de gerar. Objetivos: followup, founder_acquisition, founder_followup, renewal, relationship, reactivation.",
      inputSchema: z.object({
        customerId: z.string().min(1).optional(),
        nameQuery: z.string().min(2).optional(),
        objective: z.enum(["followup", "founder_acquisition", "founder_followup", "renewal", "relationship", "reactivation"]),
        tone: toneSchema,
      }).refine((v) => Boolean(v.customerId || v.nameQuery), { message: "Informe customerId ou nameQuery." }),
      execute: async ({ customerId, nameQuery, objective, tone }) => {
        const cap = checkBatchCap(acc, "prepare_customer_contact");
        if (cap.blocked) return { status: "unavailable" as const, message: cap.message };
        const ref = await resolveCustomerRef(ctx, acc, "prepare_customer_contact", { customerId, nameQuery });
        if (!ref.ok) return { status: "unavailable" as const, message: ref.message };
        acc.prepareCalls += 1;
        const result = prepareCustomerContact(ctx, ref.id, objective, { tone });
        pushSkill(acc, "prepare_customer_contact", { customerId: ref.id, objective, tone }, result);
        if (result.status !== "ok" || !result.data) return { status: result.status, message: result.message ?? null };
        acc.prepared.push(result.data);
        return preparedToLLM(result.data);
      },
    }),

    prepare_curation_brief: tool({
      description:
        "Prepara brief pré-atendimento (quem é / por que está aqui / melhor argumento / o que evitar / abordagem sugerida / próxima ação) para um cliente. Não gera mensagem — gera roteiro.",
      inputSchema: z.object({
        customerId: z.string().min(1).optional(),
        nameQuery: z.string().min(2).optional(),
      }).refine((v) => Boolean(v.customerId || v.nameQuery), { message: "Informe customerId ou nameQuery." }),
      execute: async ({ customerId, nameQuery }) => {
        const cap = checkBatchCap(acc, "prepare_curation_brief");
        if (cap.blocked) return { status: "unavailable" as const, message: cap.message };
        const ref = await resolveCustomerRef(ctx, acc, "prepare_curation_brief", { customerId, nameQuery });
        if (!ref.ok) return { status: "unavailable" as const, message: ref.message };
        acc.prepareCalls += 1;
        const result = prepareCurationBrief(ctx, ref.id);
        pushSkill(acc, "prepare_curation_brief", { customerId: ref.id }, result);
        if (result.status !== "ok" || !result.data) return { status: result.status, message: result.message ?? null };
        acc.briefs.push(result.data);
        return {
          status: "ok" as const,
          customerId: result.data.customerId,
          customerName: result.data.customerName,
          who: result.data.who,
          whyHere: result.data.whyHere,
          bestArgument: result.data.bestArgument,
          avoid: result.data.avoid,
          suggestedApproach: result.data.suggestedApproach,
          nextStep: result.data.nextStep,
          href: result.data.href,
          disclaimer: result.data.disclaimer,
        };
      },
    }),

    prepare_daily_attack_plan: tool({
      description:
        "Monta plano comercial do dia combinando renovação + Founder + Curadoria. Se prepareDrafts>0 gera rascunhos inline para até o hard cap (5). Nunca envia.",
      inputSchema: z.object({
        prepareDrafts: z.number().int().min(0).max(BATCH_PREPARATION_CAP).optional()
          .describe(`Quantos rascunhos inline gerar. Cap = ${BATCH_PREPARATION_CAP}.`),
        tone: toneSchema,
      }),
      execute: async ({ prepareDrafts, tone }) => {
        const cap = checkBatchCap(acc, "prepare_daily_attack_plan");
        if (cap.blocked) return { status: "unavailable" as const, message: cap.message };
        acc.prepareCalls += 1;
        const result = prepareDailyAttackPlan(ctx, { prepareDrafts, tone });
        pushSkill(acc, "prepare_daily_attack_plan", { prepareDrafts, tone }, result);
        if (result.status !== "ok" || !result.data) return { status: result.status, message: result.message ?? null };
        acc.attackPlans.push(result.data);
        // Cada rascunho inline conta para o cap total desta resposta.
        acc.prepared.push(...result.data.preparedDrafts);
        acc.prepareCalls = Math.min(BATCH_PREPARATION_CAP, acc.prepareCalls + result.data.preparedDrafts.length);
        return {
          status: "ok" as const,
          greeting: result.data.greeting,
          headline: result.data.headline,
          priorities: result.data.priorities.map((p) => ({
            label: p.label,
            description: p.description,
            items: p.cards.map(cardToSummary),
          })),
          executionOrder: result.data.executionOrder,
          preparedDraftsCount: result.data.preparedDrafts.length,
          preparedNotice: result.data.preparedNotice ?? null,
          disclaimer: result.data.disclaimer,
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

function preparedToLLM(prepared: PreparedMessage) {
  return {
    status: "ok" as const,
    customerId: prepared.customerId,
    customerName: prepared.customerName,
    objective: prepared.objective,
    channel: prepared.channel,
    context: prepared.context,
    angle: prepared.angle,
    objection: prepared.objection ?? null,
    draftMessage: prepared.draftMessage,
    nextStep: prepared.nextStep,
    tone: prepared.tone,
    href: prepared.href,
    disclaimer: prepared.disclaimer,
  };
}

/**
 * Sanity: TODA tool exposta tem entrada no registry com modo permitido
 * (read_only ou prepare_only). Nenhuma tool pode ser `write` — nem existe
 * caminho de código para isso. Usado pelo teste.
 */
const ALLOWED_MODES: readonly SkillMode[] = ["read_only", "prepare_only"] as const;

export function assertToolsAreRegistered() {
  for (const name of AGENT_TOOL_NAMES) {
    const skill = AGENT_SKILL_REGISTRY.find((s) => s.name === name);
    if (!skill) throw new Error(`Tool ${name} não está declarada no registry.`);
    if (!ALLOWED_MODES.includes(skill.mode)) {
      throw new Error(`Tool ${name} tem modo não permitido: ${skill.mode}.`);
    }
  }
}

/** Compat: mantido para chamadas antigas — só passa se tudo é read-only. */
export function assertToolsAreRegisteredReadOnly() {
  for (const name of AGENT_TOOL_NAMES) {
    const skill = AGENT_SKILL_REGISTRY.find((s) => s.name === name);
    if (!skill) throw new Error(`Tool ${name} não está declarada no registry.`);
    if (skill.mode !== "read_only") throw new Error(`Tool ${name} não é read_only.`);
  }
}

export function createAccumulator(): ToolInvocationAccumulator {
  return {
    cards: [],
    summaries: [],
    actions: [],
    prepared: [],
    briefs: [],
    attackPlans: [],
    facts: [],
    inferences: [],
    invocations: [],
    prepareCalls: 0,
  };
}
