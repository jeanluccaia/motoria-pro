// Camada de apresentação do CRM de franquias.
//
// Pura e sem efeitos. Recebe o lead + o resultado da inteligência
// (já calculada em [[intelligence.ts]]) e devolve apenas texto, ícones,
// cores e flags prontos para a UI.
//
// REGRAS CRÍTICAS:
//   1. NÃO analisa textos de conversa / notes / activity.
//   2. NÃO recalcula score, tier, ordem ou agrupamento operacional.
//   3. NÃO cria ações novas — a ação principal vem exclusivamente de
//      intelligence.suggestedAction / suggestedActionLabel.
//   4. Agrupa os 8 tiers operacionais nas 4 abas comerciais, mas
//      preserva a ordem produzida por sortByOperationalPriority — a
//      UI não re-ordena.
//
// Qualquer necessidade de "interpretar" dados do lead além do já
// calculado é sinal de que a regra pertence a [[intelligence.ts]],
// não a esta camada.

import type { FranchiseLead } from "@/lib/supabase/types";
import {
  OPERATIONAL_TIER_LABELS,
  waNumberFor,
  type LeadIntelligence,
  type OperationalTier,
  type SuggestedAction,
} from "./intelligence";

// ------------------------------------------------------------------
// Agrupamento 8 → 4
// ------------------------------------------------------------------

export type LeadGroup = "act_now" | "reactivate" | "awaiting" | "history";

export const LEAD_GROUP_LABELS: Record<LeadGroup, string> = {
  act_now: "Agir agora",
  reactivate: "Reativar",
  awaiting: "Aguardando",
  history: "Histórico",
};

export const LEAD_GROUP_ORDER: LeadGroup[] = [
  "act_now",
  "reactivate",
  "awaiting",
  "history",
];

const TIER_TO_GROUP: Record<OperationalTier, LeadGroup> = {
  respond_now: "act_now",
  call_today: "act_now",
  follow_up: "act_now",
  verify_phone: "act_now",
  reactivate: "reactivate",
  awaiting: "awaiting",
  deprioritize: "history",
  terminal: "history",
};

export function groupForTier(tier: OperationalTier): LeadGroup {
  return TIER_TO_GROUP[tier];
}

// ------------------------------------------------------------------
// Ícone + cor por tier (apenas visual)
// ------------------------------------------------------------------

// Nomes de ícones Lucide (string, não componente). O componente é
// resolvido pelo consumidor para evitar bundling de todos os ícones.
export type IconKey =
  | "zap"
  | "phone-call"
  | "calendar-clock"
  | "phone-off"
  | "message-circle-dashed"
  | "pause"
  | "archive"
  | "check-circle";

export const TIER_ICON: Record<OperationalTier, IconKey> = {
  respond_now: "zap",
  call_today: "phone-call",
  follow_up: "calendar-clock",
  verify_phone: "phone-off",
  reactivate: "message-circle-dashed",
  awaiting: "pause",
  deprioritize: "archive",
  terminal: "check-circle",
};

// Tons de cor: usamos tokens Tailwind + variáveis existentes do tema.
// Não introduzimos novos tokens globais.
export type Tone = "critical" | "warn" | "info" | "muted" | "ok";

// Apenas respond_now (vermelho) e call_today (amarelo) comunicam urgência.
// Todo o resto é cinza para não transformar a lista inteira em alerta —
// verify_phone/awaiting/reactivate/follow_up são situações objetivas que
// não devem roubar a atenção do bloco "Recomendação de hoje".
export const TIER_TONE: Record<OperationalTier, Tone> = {
  respond_now: "critical",
  call_today: "warn",
  follow_up: "muted",
  verify_phone: "muted",
  reactivate: "muted",
  awaiting: "muted",
  deprioritize: "muted",
  terminal: "muted",
};

// ------------------------------------------------------------------
// Regras de telefone (sem recalcular — só interpretar o já normalizado)
// ------------------------------------------------------------------

export type PhoneState =
  | "valid"
  | "incomplete" // phone bruto existe, phone_normalized=null
  | "missing"; // phone bruto nulo e sem email útil

export function phoneState(lead: FranchiseLead): PhoneState {
  if (lead.phone_normalized) return "valid";
  if (lead.phone && !lead.phone_normalized) return "incomplete";
  return "missing";
}

// Ações cuja essência JÁ é WhatsApp — nelas, o botão secundário de
// WhatsApp não deve aparecer para não duplicar.
const WA_PRIMARY_ACTIONS: ReadonlySet<SuggestedAction> = new Set([
  "whatsapp_reconnect",
  "send_followup",
  "resend_other_time",
]);

export function isWhatsAppPrimary(action: SuggestedAction): boolean {
  return WA_PRIMARY_ACTIONS.has(action);
}

// CTA curto para o botão primário. Deriva EXCLUSIVAMENTE do tipo de ação
// já determinado por [[intelligence.ts]] — não há nova inteligência aqui.
// A instrução longa (`suggestedActionLabel`, que pode ter sido customizada
// com o `next_action` do lead) continua sendo exibida acima do botão.
export function shortActionLabel(action: SuggestedAction): string {
  switch (action) {
    case "whatsapp_reconnect":
    case "send_followup":
    case "resend_other_time":
    case "answer_new_lead":
      return "Chamar no WhatsApp";
    case "call_now":
      return "Ligar agora";
    case "validate_phone":
      return "Conferir telefone";
    case "record_meeting_outcome":
    case "confirm_meeting":
    case "schedule_meeting":
    case "confirm_visit":
      return "Registrar contato";
    case "forward_to_expansion":
      return "Encaminhar";
    case "wait_until_scheduled":
      return "Aguardar";
    case "history_only":
    default:
      return "Ver detalhes";
  }
}

// ------------------------------------------------------------------
// Tipo principal de apresentação
// ------------------------------------------------------------------

// Como o CTA primário deve se comportar — resolvido na camada de apresentação
// a partir do canal disponível (telefone válido/incompleto/missing + email).
//   "default"   → abre o fluxo canônico (dialog de detalhe / registrar contato)
//   "mailto"    → é um link mailto: para o email cadastrado
//   "open_edit" → leva à edição do cadastro (completar telefone ou contato)
export type ActionIntent = "default" | "mailto" | "open_edit";

export type LeadPresentation = {
  group: LeadGroup;
  groupLabel: string;
  tier: OperationalTier;
  tierLabel: string;

  title: string;
  // Motivo curto, uma frase. Sempre vem de dados estruturados existentes:
  // reasons[0] da inteligência, dueLabel ou status atual já normalizado.
  reason: string;
  // Rótulo de situação com ícone + cor. Igual ao tierLabel por padrão,
  // mas pode incluir a data em `awaiting` (ex.: "Aguardando até 19/10").
  statusLabel: string;
  statusIcon: IconKey;
  statusTone: Tone;

  // Ação principal — vem de intelligence, com override da camada de
  // apresentação quando o canal cadastrado (telefone válido / incompleto /
  // ausente + email) exige outro CTA. Ver resolvePrimaryAction.
  action: {
    kind: SuggestedAction;
    // Instrução LONGA (vinda do operador via lead.next_action ou do label
    // canônico). Deve aparecer como texto ao lado/acima do botão para dar
    // contexto. NUNCA é usada DENTRO do botão (que precisa ser curto).
    label: string;
    // CTA curto do botão primário. Fixo por tipo de ação, sem truncate.
    buttonLabel: string;
    // Mostra ou não um botão de ação principal clicável.
    // Awaiting / deprioritize / terminal não têm ação primária.
    primary: boolean;
    // Como o CTA deve agir (abre dialog, mailto, abre edição).
    intent: ActionIntent;
    // Href para intents "mailto" (null nos demais).
    href: string | null;
  };

  dueLabel: string | null;

  // Regras de contato (todas derivadas de intelligence/phone — sem nova lógica).
  phone: {
    state: PhoneState;
    waHref: string | null;
    // true quando podemos mostrar WhatsApp como SECUNDÁRIO (telefone válido
    // e ação principal não é já de WhatsApp).
    canUseWhatsAppSecondary: boolean;
    // true quando a ação principal já é WhatsApp e o número é utilizável.
    primaryIsWhatsApp: boolean;
  };

  // Informações que a UI pode escolher mostrar.
  // city é null quando não houver dado estruturado. NÃO extraímos de notes/status.
  city: string | null;

  // Para “Não priorizar”, mantemos o selo próprio apesar de o grupo ser Histórico.
  historyBadge: "deprioritize" | "terminal" | null;
};

// ------------------------------------------------------------------
// Função principal
// ------------------------------------------------------------------

export function getLeadPresentation(
  lead: FranchiseLead,
  intel: LeadIntelligence,
): LeadPresentation {
  const group = groupForTier(intel.operationalTier);
  const state = phoneState(lead);
  const wa = state === "valid" ? waNumberFor(lead) : null;
  const waHref = wa ? `https://wa.me/${wa}` : null;
  const primaryIsWhatsApp = isWhatsAppPrimary(intel.suggestedAction) && Boolean(waHref);
  const canUseWhatsAppSecondary = Boolean(waHref) && !isWhatsAppPrimary(intel.suggestedAction);

  const defaultShowPrimary =
    group === "act_now" ||
    (group === "reactivate" && state !== "incomplete" && state !== "missing");

  const resolved = resolvePrimaryAction({
    lead,
    intel,
    group,
    phoneState: state,
    defaultShowPrimary,
  });

  const reason = pickShortReason(intel);
  const statusLabel = buildStatusLabel(intel);
  const historyBadge =
    intel.operationalTier === "deprioritize"
      ? "deprioritize"
      : intel.operationalTier === "terminal"
        ? "terminal"
        : null;

  return {
    group,
    groupLabel: LEAD_GROUP_LABELS[group],
    tier: intel.operationalTier,
    tierLabel: intel.tierLabel,

    title: lead.full_name,
    reason,
    statusLabel,
    statusIcon: TIER_ICON[intel.operationalTier],
    statusTone: TIER_TONE[intel.operationalTier],

    action: resolved,

    dueLabel: intel.dueLabel,

    phone: {
      state,
      waHref,
      canUseWhatsAppSecondary,
      primaryIsWhatsApp,
    },

    // city permanece null até existir coluna estruturada; a UI nunca
    // tenta inferir de texto livre.
    city: null,

    historyBadge,
  };
}

// Resolve o CTA primário em função do canal disponível. Não altera tier,
// score nem ordenação — apenas o rótulo, o intent e a visibilidade do botão.
// Regras (ver especificação de UX):
//   - telefone válido      → mantém a ação sugerida pela inteligência
//   - telefone incompleto  → "Conferir telefone" (abre edição)
//   - sem telefone + email → "Enviar e-mail" (mailto:)
//   - sem telefone + sem email → "Adicionar contato" (abre edição)
// Só aplica override em grupos que operacionalmente têm CTA (act_now, reactivate).
// Em awaiting/history preserva o comportamento atual (sem ação primária).
function resolvePrimaryAction(args: {
  lead: FranchiseLead;
  intel: LeadIntelligence;
  group: LeadGroup;
  phoneState: PhoneState;
  defaultShowPrimary: boolean;
}): LeadPresentation["action"] {
  const { lead, intel, group, phoneState: state, defaultShowPrimary } = args;

  const defaultAction = {
    kind: intel.suggestedAction,
    label: intel.suggestedActionLabel,
    buttonLabel: shortActionLabel(intel.suggestedAction),
    primary: defaultShowPrimary,
    intent: "default" as ActionIntent,
    href: null as string | null,
  };

  const isActionableGroup = group === "act_now" || group === "reactivate";
  if (!isActionableGroup) return defaultAction;

  if (state === "incomplete") {
    return {
      kind: "validate_phone",
      label: "Conferir o telefone antes de qualquer tentativa de contato.",
      buttonLabel: "Conferir telefone",
      primary: true,
      intent: "open_edit",
      href: null,
    };
  }

  if (state === "missing") {
    const email = lead.email?.trim();
    if (email && email.length > 0) {
      return {
        kind: intel.suggestedAction,
        label: `Enviar email para ${email}.`,
        buttonLabel: "Enviar e-mail",
        primary: true,
        intent: "mailto",
        href: `mailto:${email}`,
      };
    }
    return {
      kind: intel.suggestedAction,
      label: "Lead sem telefone e sem email — adicione um contato para seguir.",
      buttonLabel: "Adicionar contato",
      primary: true,
      intent: "open_edit",
      href: null,
    };
  }

  return defaultAction;
}

// Primeiro motivo da inteligência tende a ser a frase mais operacional.
// Caímos para dueLabel/tierLabel quando a lista está vazia.
function pickShortReason(intel: LeadIntelligence): string {
  const first = intel.reasons[0]?.trim();
  if (first && first.length > 0) return first;
  if (intel.dueLabel) return intel.dueLabel;
  return intel.tierLabel;
}

// Em awaiting, o label do tier já embute a data (ex. "Aguardando até 19/10")
// porque [[intelligence.ts]] faz essa composição. Para outros tiers,
// usamos o label canônico.
function buildStatusLabel(intel: LeadIntelligence): string {
  if (intel.operationalTier === "awaiting") return intel.tierLabel;
  return OPERATIONAL_TIER_LABELS[intel.operationalTier];
}

// ------------------------------------------------------------------
// Agrupamento + ordem para as 4 abas
// ------------------------------------------------------------------

export type GroupedLead<T = unknown> = {
  lead: FranchiseLead;
  intel: LeadIntelligence;
  presentation: LeadPresentation;
  // Extensível pelo consumidor para carregar activities etc.
  extra?: T;
};

export type GroupedBuckets = Record<LeadGroup, GroupedLead[]>;

// Recebe os leads JÁ ORDENADOS pelo sortByOperationalPriority. Apenas
// particiona em grupos preservando a ordem relativa.
export function groupOrderedLeads(
  entries: Array<{ lead: FranchiseLead; intel: LeadIntelligence }>,
): GroupedBuckets {
  const buckets: GroupedBuckets = {
    act_now: [],
    reactivate: [],
    awaiting: [],
    history: [],
  };
  for (const e of entries) {
    const presentation = getLeadPresentation(e.lead, e.intel);
    buckets[presentation.group].push({ ...e, presentation });
  }
  return buckets;
}

// Contador operacional usado no topo da tela ("X pessoas precisam de
// ação agora"). SOMENTE conta a aba "Agir agora" — nunca soma KPIs.
export function countsFromBuckets(buckets: GroupedBuckets): Record<LeadGroup, number> {
  return {
    act_now: buckets.act_now.length,
    reactivate: buckets.reactivate.length,
    awaiting: buckets.awaiting.length,
    history: buckets.history.length,
  };
}
