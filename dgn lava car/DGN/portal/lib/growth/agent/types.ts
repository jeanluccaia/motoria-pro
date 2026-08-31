// Contratos compartilhados do DGN Agent — Fase 1 (100% READ-ONLY).
//
// Toda skill devolve `SkillResult` para deixar explícito ao chamador o que é
// FATO (comprovado pelo banco), o que é INFERÊNCIA (calculada) e o que é
// RECOMENDAÇÃO. Isso mata alucinação e vira a base da UI: cards, chat e
// dashboard consomem o mesmo shape.

export type SkillStatus = "ok" | "insufficient_data" | "unavailable";

export type Priority = "critica" | "alta" | "media" | "oportunidade";

export interface SkillResult<T> {
  status: SkillStatus;
  /** Payload da skill quando `status === "ok"`. */
  data?: T;
  /** Mensagem curta para exibir ao operador em `insufficient_data`/`unavailable`. */
  message?: string;
  /** Fatos verificáveis nos dados (ex.: "convite gerado em 2026-08-25"). */
  facts: string[];
  /** Conclusões calculadas a partir dos fatos (ex.: "sem avanço há 3 dias"). */
  inferences: string[];
}

/** Cartão de atenção mostrado no Daily Briefing e nas respostas do chat. */
export interface AttentionCard {
  /** ID estável para dedupe/keys de React. */
  id: string;
  priority: Priority;
  /** Categoria semântica que dita ícone/cor. */
  kind: "founder" | "curation" | "subscriber" | "insight";
  /** Título curto (nome do cliente ou situação). */
  title: string;
  /** Motivo em uma frase — orientada a por que precisa de atenção. */
  reason: string;
  /** Próxima ação sugerida em uma linha. */
  nextAction: string;
  /** Deep-link para a tela correspondente dentro do Admin. */
  href: string;
  /** Rótulo do CTA (ex.: "Ver cliente", "Ver Founder"). */
  ctaLabel: string;
  /** ID do customer quando aplicável (para follow-up via `get_customer_summary`). */
  customerId?: string;
}

/** Resumo agregado do Daily Briefing. */
export interface DailyBriefing {
  greeting: string;
  headline: string;
  cards: AttentionCard[];
  /** Cardinalidades separadas por categoria (mesmo com card único). */
  totals: {
    founder: number;
    curation: number;
    subscriber: number;
  };
  /** Soma total de sinais encontrados nas 3 skills fonte. */
  totalOpportunities: number;
  /** Quantos cards estão sendo efetivamente exibidos (após corte). */
  displayedPriorities: number;
  /** Origem da leitura ("db" | "json" | "json-fallback"). */
  dataOrigin: "db" | "json" | "json-fallback";
}

/** Resumo 360 de um único cliente. */
export interface CustomerSummary {
  customerId: string;
  name: string;
  /** Fatos objetivos: nome, telefone, veículo, placa, atendimentos, valor. */
  identity: Array<{ label: string; value: string }>;
  /** Sinais comerciais/campanha (status, engajamento, curadoria). */
  commercial: Array<{ label: string; value: string }>;
  /** Score DGN quando disponível (número + tier). */
  score?: { total: number; tier: string };
  /** Estado do convite Founder (se houver). */
  founder?: {
    stage: string;
    hasActiveInvite: boolean;
    lastEngagement: string | null;
  };
  /** Assinatura reconhecida (se houver). */
  subscriber?: {
    plan: string;
    status: string;
  };
  /** Deep-link primário para agir sobre o cliente. */
  primaryHref: string;
}

/** Sugestão de próxima ação baseada apenas em fatos disponíveis. */
export interface NextActionSuggestion {
  customerId: string;
  headline: string;
  rationale: string;
  href: string;
}

/**
 * Modos de operação suportados pelo registry.
 *  - `read_only`: skill lê fatos e devolve estruturas para a UI. Sem efeito.
 *  - `prepare_only`: skill usa fatos já autorizados para produzir CONTEÚDO
 *    (mensagem, brief, plano). Nunca escreve no CRM, nunca envia WhatsApp,
 *    nunca chama RPC de mutação. É geração de texto para revisão humana.
 * Nenhum outro modo é permitido — `write` está BANIDO nesta fase.
 */
export type SkillMode = "read_only" | "prepare_only";

export interface SkillDefinition {
  name: string;
  mode: SkillMode;
  description: string;
}

// ---------------------------------------------------------------------------
// Preparação (Fase 2) — CONTEÚDO gerado, nunca ação executada.
// ---------------------------------------------------------------------------

/** Objetivo de contato aceito pelas skills `prepare_only`. */
export type PreparationObjective =
  | "followup"
  | "founder_acquisition"
  | "founder_followup"
  | "renewal"
  | "relationship"
  | "reactivation";

/** Ajuste de tom pedido pelo operador (via chat multi-turn). */
export type PreparationTone =
  | "padrao"
  | "mais_curta"
  | "mais_direta"
  | "mais_consultiva"
  | "mais_pessoal"
  | "menos_comercial";

/** Card renderizado quando uma skill de preparação retorna mensagem pronta. */
export interface PreparedMessage {
  customerId: string;
  customerName: string;
  objective: PreparationObjective;
  channel: "whatsapp";
  /** Uma linha explicando por que estamos entrando em contato agora. */
  context: string;
  /** Ângulo comercial sugerido (baseado em fatos disponíveis). */
  angle: string;
  /** Objeção provável quando há evidência para inferir uma. */
  objection?: string;
  /** Mensagem final pronta para copiar. Fatos verificáveis apenas. */
  draftMessage: string;
  /** Próximo passo recomendado APÓS o operador enviar. */
  nextStep: string;
  /** Tom aplicado nesta versão. */
  tone: PreparationTone;
  /** Deep-link do Perfil 360 do cliente. */
  href: string;
  /** Fatos usados para produzir a mensagem. */
  facts: string[];
  /** Selo governança — SEMPRE presente. */
  disclaimer: "Preparado pela IA · revisar antes de enviar";
}

/** Brief pronto para o operador antes de trabalhar um cliente na Curadoria. */
export interface PreparedCurationBrief {
  customerId: string;
  customerName: string;
  /** Resumo rápido de quem é. */
  who: string;
  /** Fatos que justificaram estar na fila (score, recorrência, atendimentos). */
  whyHere: string;
  /** Melhor argumento com base nos sinais disponíveis. */
  bestArgument: string;
  /** O que evitar dizer/fazer (ex.: tratar assinante como aquisição). */
  avoid: string;
  /** Abordagem sugerida — texto curto. */
  suggestedApproach: string;
  /** Próxima ação recomendada. */
  nextStep: string;
  href: string;
  facts: string[];
  disclaimer: "Preparado pela IA · revisar antes de enviar";
}

/** Segmento do plano diário — Prioridade 1..N. */
export interface AttackPlanPriority {
  label: string;
  description: string;
  cards: AttentionCard[];
}

/** Item da ordem sugerida de execução. */
export interface AttackPlanExecutionItem {
  customerId?: string;
  name: string;
  reason: string;
  /** Skill de preparação sugerida para esse cliente (usado pela UI). */
  suggestedPreparation?: PreparationObjective;
  href?: string;
}

/** Plano comercial do dia combinando as skills de atenção. */
export interface PreparedAttackPlan {
  greeting: string;
  headline: string;
  priorities: AttackPlanPriority[];
  executionOrder: AttackPlanExecutionItem[];
  /** Rascunhos preparados inline (hard cap = BATCH_PREPARATION_CAP). */
  preparedDrafts: PreparedMessage[];
  /** Motivo de não ter preparado se `preparedDrafts` estiver vazio. */
  preparedNotice?: string;
  disclaimer: "Preparado pela IA · revisar antes de enviar";
}

/**
 * Hard cap de preparação em lote — aplicado ao daily_attack_plan e ao
 * acumulador de tool calls por resposta. Motivo: custo + privacidade +
 * qualidade + revisão humana viável.
 */
export const BATCH_PREPARATION_CAP = 5;

// ---------------------------------------------------------------------------
// Chat / Provider
// ---------------------------------------------------------------------------

/** Mensagem do histórico curto trocada com o provider. */
export interface AgentHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

/** Query enviada ao provider (chat abaixo do briefing). */
export interface AgentQuery {
  message: string;
  /** Histórico curto (últimas trocas) — cap aplicado no provider. */
  history?: AgentHistoryMessage[];
}

/** Modo do provider ativo — usado no badge do header. */
export type ProviderMode = "llm" | "deterministic" | "deterministic-fallback";

/** Métricas por resposta — logadas no server, expostas no debug. */
export interface AgentMetrics {
  latencyMs: number;
  toolCalls: number;
  /** Tokens quando disponíveis; undefined em fallback determinístico. */
  tokens?: { input: number; output: number; total: number };
  /** Modelo utilizado (só quando providerMode === "llm"). */
  model?: string;
}

/** Bloco tipado que compõe a resposta do agente na UI. */
export type AgentResponseBlock =
  | { kind: "text"; text: string }
  | { kind: "cards"; cards: AttentionCard[] }
  | { kind: "summary"; summary: CustomerSummary }
  | { kind: "next-action"; action: NextActionSuggestion }
  | { kind: "prepared-message"; prepared: PreparedMessage }
  | { kind: "prepared-brief"; brief: PreparedCurationBrief }
  | { kind: "attack-plan"; plan: PreparedAttackPlan };

export interface AgentResponse {
  /** Intent resolvido pelo provider (para debug/telemetria). */
  intent:
    | "daily-briefing"
    | "founder-attention"
    | "curation-opportunities"
    | "subscriber-attention"
    | "customer-summary"
    | "next-action"
    | "help"
    | "llm-synthesis"
    | "prepared-content"
    | "unknown";
  blocks: AgentResponseBlock[];
  /** Rótulos usados no UI para diferenciar fato/inferência quando houver. */
  disclosures?: { facts: string[]; inferences: string[] };
  /** Fonte da resposta — dita o badge no chat ("IA" ou "modo básico"). */
  providerMode?: ProviderMode;
  /** Métricas anexadas apenas em desenvolvimento/debug (server-side sempre logado). */
  metrics?: AgentMetrics;
}
