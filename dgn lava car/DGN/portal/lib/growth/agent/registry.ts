import type { SkillDefinition } from "./types.ts";

// Registry declarativo das skills liberadas na Fase 1. Todo item aqui é
// `mode: "read_only"` — nenhuma mutação está exposta ao Agent, nem sequer
// como opção. Se alguém tentar adicionar uma skill com outro mode, o
// TypeScript e o teste `read-only-guarantee` reprovam.

export const AGENT_SKILL_REGISTRY: readonly SkillDefinition[] = [
  {
    name: "get_daily_briefing",
    mode: "read_only",
    description: "Consolida as prioridades do dia (Founder + Curadoria + Assinantes) em cards ordenados.",
  },
  {
    name: "get_founder_attention",
    mode: "read_only",
    description: "Lista convites Founder ativos que precisam de acompanhamento (visualizado sem avanço, click WhatsApp sem resposta, convite parado).",
  },
  {
    name: "get_curation_opportunities",
    mode: "read_only",
    description: "Lista clientes elegíveis para Curadoria Founder ordenados por score DGN.",
  },
  {
    name: "get_subscriber_attention",
    mode: "read_only",
    description: "Lista assinantes conhecidos que precisam de atenção (renovação pendente, assinatura detectada sem validação).",
  },
  {
    name: "get_customer_summary",
    mode: "read_only",
    description: "Retorna visão 360 (identidade + comercial + score + Founder + assinatura) para um customerId.",
  },
  {
    name: "suggest_next_action",
    mode: "read_only",
    description: "Sugere a próxima ação para um customerId baseando-se apenas em fatos presentes na base.",
  },
] as const;

export function isReadOnlyRegistry(registry: readonly SkillDefinition[] = AGENT_SKILL_REGISTRY): boolean {
  return registry.every((skill) => skill.mode === "read_only");
}
