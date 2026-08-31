import type { SkillDefinition, SkillMode } from "./types.ts";

// Registry declarativo das skills liberadas.
//
// Fase 1: mode "read_only" — lê fatos, devolve estruturas para a UI.
// Fase 2: mode "prepare_only" — usa fatos autorizados para gerar CONTEÚDO
// (mensagem, brief, plano) para revisão humana. NUNCA escreve, NUNCA envia.
//
// `write` está BANIDO. Se alguém tentar adicionar uma skill com outro mode,
// o TypeScript e o teste da suite reprovam.

export const AGENT_SKILL_REGISTRY: readonly SkillDefinition[] = [
  // -----------------------------------------------------------------
  // READ-ONLY (Fase 1.5)
  // -----------------------------------------------------------------
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
  {
    name: "get_founder_metrics",
    mode: "read_only",
    description: "Retorna o snapshot canônico de métricas Founder: confirmados (001/002/003), convites em aberto, selecionados, conversando, pagamento, convertidos, vagas disponíveis, Nº004 reaberta. Fonte única — nunca recalcule.",
  },

  // -----------------------------------------------------------------
  // PREPARE-ONLY (Fase 2) — geram conteúdo; jamais executam ação.
  // -----------------------------------------------------------------
  {
    name: "prepare_followup_message",
    mode: "prepare_only",
    description: "Prepara mensagem de follow-up para um cliente já engajado (convite visualizado, click sem resposta).",
  },
  {
    name: "prepare_founder_approach",
    mode: "prepare_only",
    description: "Prepara abordagem completa (contexto + argumento + mensagem + objeção provável + próximo passo) para cliente elegível à aquisição Founder. Recusa se inelegível.",
  },
  {
    name: "prepare_renewal_message",
    mode: "prepare_only",
    description: "Prepara mensagem de renovação para assinante com renovação pendente. NUNCA inventa vencimento, preço ou condição.",
  },
  {
    name: "prepare_customer_contact",
    mode: "prepare_only",
    description: "Skill genérica controlada de preparação de contato. Recebe customerId + objetivo e valida coerência antes de gerar (rejeita ex.: aquisição Founder para assinante ativo).",
  },
  {
    name: "prepare_curation_brief",
    mode: "prepare_only",
    description: "Prepara brief pré-atendimento (quem é, por que está aqui, melhor argumento, o que evitar, abordagem sugerida, próxima ação) para um cliente da Curadoria.",
  },
  {
    name: "prepare_daily_attack_plan",
    mode: "prepare_only",
    description: "Combina Daily Briefing + Founder + Curadoria + Assinantes em plano ordenado. Pode preparar rascunhos inline até o hard cap (5 clientes).",
  },
] as const;

// -----------------------------------------------------------------
// Guards
// -----------------------------------------------------------------

const ALLOWED_MODES: readonly SkillMode[] = ["read_only", "prepare_only"] as const;

/** Nenhuma skill pode ter mode fora da lista permitida. `write` é banido. */
export function isNoWriteRegistry(registry: readonly SkillDefinition[] = AGENT_SKILL_REGISTRY): boolean {
  return registry.every((skill) => ALLOWED_MODES.includes(skill.mode));
}

/** Mantido para compat com testes/callers antigos — só passa se tudo é read-only. */
export function isReadOnlyRegistry(registry: readonly SkillDefinition[] = AGENT_SKILL_REGISTRY): boolean {
  return registry.every((skill) => skill.mode === "read_only");
}

export function getSkillsByMode(mode: SkillMode, registry: readonly SkillDefinition[] = AGENT_SKILL_REGISTRY) {
  return registry.filter((s) => s.mode === mode);
}
