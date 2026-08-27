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

/** Modos de operação suportados pelo registry. Fase 1 é `read_only`. */
export type SkillMode = "read_only";

export interface SkillDefinition {
  name: string;
  mode: SkillMode;
  description: string;
}

// ---------------------------------------------------------------------------
// Chat / Provider
// ---------------------------------------------------------------------------

/** Query enviada ao provider (chat abaixo do briefing). */
export interface AgentQuery {
  message: string;
}

/** Bloco tipado que compõe a resposta do agente na UI. */
export type AgentResponseBlock =
  | { kind: "text"; text: string }
  | { kind: "cards"; cards: AttentionCard[] }
  | { kind: "summary"; summary: CustomerSummary }
  | { kind: "next-action"; action: NextActionSuggestion };

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
    | "unknown";
  blocks: AgentResponseBlock[];
  /** Rótulos usados no UI para diferenciar fato/inferência quando houver. */
  disclosures?: { facts: string[]; inferences: string[] };
}
