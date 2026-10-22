import type { SkillDefinition, SkillMode } from "./types.ts";

// Registry declarativo das skills liberadas.
//
// Fase 1:    mode "read_only"    — lê fatos, devolve estruturas para a UI.
// Fase 2:    mode "prepare_only" — usa fatos autorizados para gerar CONTEÚDO
//                                  (mensagem, brief, plano) para revisão humana.
//                                  NUNCA escreve, NUNCA envia.
// Fundação:  mode "record_only"  — registra RECOMENDAÇÃO em agent_actions /
//                                  agent_campaigns via RPCs SECURITY DEFINER
//                                  (p_actor fixado como "dgn-agent"). Sempre
//                                  cria em `pending_review`/`draft`. Zero
//                                  mutação em crm_*, zero envio.
//
// `write` continua BANIDO. Se alguém tentar adicionar uma skill com outro mode,
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
  {
    name: "get_subscriber_portal_readiness",
    mode: "read_only",
    description: "Domínio SUBSCRIBER_PORTAL_ACCESS. Responde 'quem está pronto para receber convite do Portal hoje e quais dados bloqueiam os demais?'. Lê SOMENTE crm_customers (portal_beta_enabled, email, telefone), crm_customer_auth (vínculo Auth) e crm_subscriptions. NUNCA usa Founder/Curadoria como fonte.",
  },
  {
    name: "get_portal_access_issues",
    mode: "read_only",
    description: "Domínio SUBSCRIBER_PORTAL_ACCESS. Diagnóstico de inconsistências no provisionamento do Portal (gate ativo sem Auth, Auth sem e-mail, acesso habilitado sem assinatura ativa, assinante ativo sem Portal). Nunca corrige — só aponta.",
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

  // -----------------------------------------------------------------
  // RECORD-ONLY (Fundação Agent Core) — grava recomendação em
  // agent_actions / agent_campaigns. Nunca executa, nunca envia.
  // Actor fixado como "dgn-agent"; promoção para approved/executed
  // depende de endpoint autenticado (fora da fundação).
  // -----------------------------------------------------------------
  {
    name: "record_opportunity",
    mode: "record_only",
    description: "Registra oportunidade comercial detectada pelo agente (upgrade/reativação/conversão). Grava em agent_actions.kind='opportunity' com status='pending_review'. Zero envio.",
  },
  {
    name: "record_alert",
    mode: "record_only",
    description: "Registra alerta operacional detectado pelo agente (renovação próxima, convite sem resposta, dado faltando). Grava em agent_actions.kind='alert' com status='pending_review'. Zero envio.",
  },
  {
    name: "record_campaign_draft",
    mode: "record_only",
    description: "Registra rascunho de campanha (nome, objetivo, audience_rules, draftMessage) em agent_campaigns.status='draft'. Para refinar um draft existente, informe campaignId. Zero envio.",
  },
] as const;

// -----------------------------------------------------------------
// Guards
// -----------------------------------------------------------------

const ALLOWED_MODES: readonly SkillMode[] = ["read_only", "prepare_only", "record_only"] as const;

/**
 * Nenhuma skill pode ter mode fora da lista permitida. `write` é banido.
 *
 * `record_only` é o único modo que chama RPC de mutação, e por contrato só
 * grava em agent_actions/agent_campaigns (tabelas de governança, status
 * `pending_review`/`draft`). Zero efeito operacional em crm_*. Toda promoção
 * para approved/executed vive em RPC separada, acionada por endpoint
 * autenticado — fora da superfície do agente.
 */
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
