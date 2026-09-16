import type { DgnCustomer } from "../../dgn-growth-utils.ts";
import type { AgentContext } from "../agent-context.ts";
import type { AttentionCard, SkillResult } from "../types.ts";
import { customerProfileHref } from "../../customer-links.ts";

// -----------------------------------------------------------------------------
// Skills de acesso ao Portal do Assinante (domain SUBSCRIBER_PORTAL_ACCESS).
//
// FONTE DE VERDADE DA ELEGIBILIDADE = crm_subscriptions.is_active_subscriber
// (exposto como `customer.subscription?.isActive` após mapGrowthSnapshot).
// Nada mais promove um cliente a "pronto para Portal": commercialStatus,
// knownSubscriberStatus, evidência 4uCar, Founder e Curadoria são apenas
// CONTEXTO — quando divergem da fonte canônica, sinalizamos como
// INCONSISTENT_SUBSCRIBER_STATE em vez de tratar como assinatura ativa.
//
//   * `get_subscriber_portal_readiness` responde
//        "quem está pronto para receber convite do Portal hoje e
//         quais dados bloqueiam os demais?"
//   * `get_portal_access_issues` responde
//        "onde o provisionamento está inconsistente?" (diagnóstico)
//
// Nenhuma dessas skills toca Founder/Curadoria. Fontes usadas:
//   * `crm_subscriptions.is_active_subscriber` (fonte canônica da elegibilidade)
//   * `crm_customers.portal_beta_enabled` (gate)
//   * `crm_customers.email` (presença — via `portalAccess.hasEmail`)
//   * `crm_customer_auth` (vínculo existe? — via `portalAccess.hasAuthLink`)
//   * `crm_customers.normalized_phone` (canal do convite WhatsApp — separado)
//   * base viva `KNOWN_SUBSCRIBERS_2026_08_16` + `commercialStatus`: apenas
//     para detectar INCONSISTENT_SUBSCRIBER_STATE, NUNCA para promover a READY.
//
// Nenhum evento de "primeiro login" / "ativou o Portal" existe hoje. Portanto
// NÃO afirmamos ativação — só "acesso provisionado". Ver spec P0 do Jean.
// -----------------------------------------------------------------------------

export type PortalReadinessBlocker =
  | "MISSING_EMAIL"
  | "NO_AUTH_LINK"
  | "PORTAL_GATE_DISABLED"
  | "NO_ACTIVE_SUBSCRIPTION"
  | "MISSING_PHONE_FOR_WHATSAPP"
  | "INCONSISTENT_PORTAL_STATE"
  | "INCONSISTENT_SUBSCRIBER_STATE";

export type PortalReadinessState = "READY" | "BLOCKED";

export type PortalAccessIssueCode =
  | "GATE_ENABLED_WITHOUT_AUTH"
  | "GATE_ENABLED_WITHOUT_EMAIL"
  | "AUTH_LINK_WITHOUT_EMAIL"
  | "ACCESS_ENABLED_WITHOUT_ACTIVE_SUBSCRIPTION"
  | "ACTIVE_SUBSCRIBER_WITHOUT_PORTAL"
  | "INCONSISTENT_SUBSCRIBER_STATE";

export interface PortalReadinessItem {
  customerId: string;
  name: string;
  state: PortalReadinessState;
  /** Acesso ao Portal está pronto (não depende de telefone). */
  portalAccessReady: boolean;
  /** Convite pelo WhatsApp está pronto (portalAccessReady + telefone canônico). */
  whatsappInviteReady: boolean;
  /** Blockers canônicos — pode ter mais de um por customer. */
  blockers: PortalReadinessBlocker[];
  /**
   * Issues canônicas do diagnóstico aplicáveis a este customer — pré-consolidadas
   * aqui para que a LLM não trate `getPortalAccessIssues` como uma "outra lista"
   * de customers a apresentar em grupo separado. Um customer = um caso.
   */
  issues: PortalAccessIssueCode[];
  /** Estado bruto por origem — útil para o LLM justificar sem recalcular. */
  canonicalSubscriptionActive: boolean;
  hasEmail: boolean;
  hasAuthLink: boolean;
  portalBetaEnabled: boolean;
  hasValidPhone: boolean;
  href: string;
}

export interface PortalReadinessSummary {
  /** Universo total (cada customer_id aparece 1x). Invariante: === totalPortalReady + totalBlocked. */
  totalEvaluated: number;
  /** Customers com portalAccessReady=true (cada customer_id 1x). */
  totalPortalReady: number;
  /** Customers com portalAccessReady=false (cada customer_id 1x). */
  totalBlocked: number;
  /** Lista dos READY — cada customer aparece 1x com todos os blockers/issues juntos. */
  ready: PortalReadinessItem[];
  /** Lista dos BLOCKED — cada customer aparece 1x com todos os blockers/issues juntos. */
  blocked: PortalReadinessItem[];
  /**
   * FREQUÊNCIA (não quantidade de clientes). Um customer com N blockers soma N
   * unidades distintas aqui. Portanto a soma pode ser > totalBlocked. Renderize
   * como "frequência dos bloqueios", NUNCA como "quantidade de clientes".
   */
  blockerFrequency: Record<PortalReadinessBlocker, number>;
  /** Instruções de renderização pré-computadas — para o LLM não inventar. */
  presentation: {
    invariants: string[];
    renderingRules: string[];
  };
}

export interface PortalAccessIssue {
  customerId: string;
  name: string;
  /** Motivo canônico da inconsistência — semelhante a blocker mas específico de diagnóstico. */
  issue: PortalAccessIssueCode;
  detail: string;
  href: string;
}

// ---------------------------------------------------------------------------
// Universo: quem entra na resposta do readiness.
//
// A ELEGIBILIDADE em si (portalAccessReady) exige subscription canônica ativa
// — só `crm_subscriptions.is_active_subscriber === true` conta. Ver
// `hasCanonicalActiveSubscription`.
//
// O UNIVERSO da resposta é intencionalmente mais largo: inclui quem tem
// subscription canônica ativa E também quem "aparenta" ser assinante
// (commercialStatus / knownSubscriberStatus) mas não tem subscription
// canônica. Isso permite listar esses casos como BLOCKED com
// NO_ACTIVE_SUBSCRIPTION + INCONSISTENT_SUBSCRIBER_STATE em vez de sumir
// silenciosamente com eles.
//
// Fora do universo: quem não tem nenhum sinal de "poderia ser assinante" —
// esses são leads/curadoria pura e não têm o que responder aqui.
// ---------------------------------------------------------------------------

/**
 * Fonte canônica de elegibilidade para o Portal. Espelha 1:1 a linha ativa
 * em `crm_subscriptions` (populada por mapGrowthSnapshot). Nunca inferir por
 * commercialStatus, knownSubscriberStatus, evidência 4uCar ou Founder.
 */
function hasCanonicalActiveSubscription(customer: DgnCustomer): boolean {
  return customer.subscription?.isActive === true;
}

/**
 * Sinal de que o customer "aparenta" ser assinante segundo fontes NÃO
 * canônicas (commercialStatus, base viva 4uCar). Usado só para detectar
 * INCONSISTENT_SUBSCRIBER_STATE e para manter o customer no universo do
 * readiness (senão o operador não veria o conflito).
 */
function looksLikeSubscriber(customer: DgnCustomer): boolean {
  if (customer.commercialStatus === "Assinante Ativo") return true;
  if (customer.knownSubscriberStatus === "ativo") return true;
  if (customer.knownSubscriberStatus === "renovacao_pendente") return true;
  return false;
}

function isInReadinessUniverse(customer: DgnCustomer): boolean {
  return hasCanonicalActiveSubscription(customer) || looksLikeSubscriber(customer);
}

/**
 * Ponto único de verdade da classificação de um customer para o Portal.
 * Devolve tudo que o item consolidado precisa (booleans brutos, blockers e
 * issues aplicáveis), para que ninguém rode a mesma aritmética duas vezes em
 * lugares diferentes (raiz da inconsistência do smoke A anterior).
 */
function classifyCustomer(customer: DgnCustomer): {
  state: PortalReadinessState;
  portalAccessReady: boolean;
  whatsappInviteReady: boolean;
  blockers: PortalReadinessBlocker[];
  issues: PortalAccessIssueCode[];
  canonicalSubscriptionActive: boolean;
  hasEmail: boolean;
  hasAuthLink: boolean;
  portalBetaEnabled: boolean;
  hasValidPhone: boolean;
} {
  const portal = customer.portalAccess;
  const blockers: PortalReadinessBlocker[] = [];
  const issues: PortalAccessIssueCode[] = [];

  const portalBetaEnabled = portal?.portalBetaEnabled === true;
  const hasEmail = portal?.hasEmail === true;
  const hasAuthLink = portal?.hasAuthLink === true;
  const hasPhone = customer.hasValidPhone === true;

  const hasActiveSubscription = hasCanonicalActiveSubscription(customer);
  const appearsSubscriberByOtherSources = looksLikeSubscriber(customer);

  if (!hasActiveSubscription) blockers.push("NO_ACTIVE_SUBSCRIPTION");
  if (!hasEmail) blockers.push("MISSING_EMAIL");
  if (!hasAuthLink) blockers.push("NO_AUTH_LINK");
  if (!portalBetaEnabled) blockers.push("PORTAL_GATE_DISABLED");

  if (portalBetaEnabled && (!hasAuthLink || !hasEmail)) {
    blockers.push("INCONSISTENT_PORTAL_STATE");
  }

  if (!hasActiveSubscription && appearsSubscriberByOtherSources) {
    blockers.push("INCONSISTENT_SUBSCRIBER_STATE");
  }

  // Issues canônicas — mesmas regras que get_portal_access_issues aplica,
  // consolidadas AQUI para que o item de readiness carregue todos os motivos
  // que o operador precisa sobre o cliente. Não duplicamos com issues loose.
  if (portalBetaEnabled && !hasAuthLink) issues.push("GATE_ENABLED_WITHOUT_AUTH");
  if (portalBetaEnabled && !hasEmail) issues.push("GATE_ENABLED_WITHOUT_EMAIL");
  if (hasAuthLink && !hasEmail) issues.push("AUTH_LINK_WITHOUT_EMAIL");
  if ((portalBetaEnabled || hasAuthLink) && !hasActiveSubscription) {
    issues.push("ACCESS_ENABLED_WITHOUT_ACTIVE_SUBSCRIPTION");
  }
  if (hasActiveSubscription && !portalBetaEnabled && !hasAuthLink) {
    issues.push("ACTIVE_SUBSCRIBER_WITHOUT_PORTAL");
  }
  if (!hasActiveSubscription && appearsSubscriberByOtherSources) {
    issues.push("INCONSISTENT_SUBSCRIBER_STATE");
  }

  const portalAccessReady = hasActiveSubscription && hasEmail && hasAuthLink && portalBetaEnabled;

  if (!hasPhone) blockers.push("MISSING_PHONE_FOR_WHATSAPP");
  const whatsappInviteReady = portalAccessReady && hasPhone;

  return {
    state: portalAccessReady ? "READY" : "BLOCKED",
    portalAccessReady,
    whatsappInviteReady,
    blockers: dedupe(blockers),
    issues: dedupe(issues),
    canonicalSubscriptionActive: hasActiveSubscription,
    hasEmail,
    hasAuthLink,
    portalBetaEnabled,
    hasValidPhone: hasPhone,
  };
}

function dedupe<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function blockerCountersZero(): Record<PortalReadinessBlocker, number> {
  return {
    MISSING_EMAIL: 0,
    NO_AUTH_LINK: 0,
    PORTAL_GATE_DISABLED: 0,
    NO_ACTIVE_SUBSCRIPTION: 0,
    MISSING_PHONE_FOR_WHATSAPP: 0,
    INCONSISTENT_PORTAL_STATE: 0,
    INCONSISTENT_SUBSCRIBER_STATE: 0,
  };
}

// ---------------------------------------------------------------------------
// Skill 1: get_subscriber_portal_readiness
// ---------------------------------------------------------------------------

export function getSubscriberPortalReadiness(ctx: AgentContext): SkillResult<PortalReadinessSummary> {
  // Detecta cenário em que a leitura veio de JSON — nenhum customer terá
  // `portalAccess`. Nesses casos, o Assistente não pode responder com
  // confiança sobre o Portal (a informação Vive apenas no Supabase).
  const hasAnyPortalBlock = ctx.customers.some((c) => c.portalAccess != null);
  if (!hasAnyPortalBlock) {
    return {
      status: "unavailable",
      message:
        "Estado do Portal não está disponível na fonte atual — o Assistente precisa da leitura Supabase (DGN_GROWTH_DATA_SOURCE=db) para responder sobre acesso ao Portal.",
      facts: [`Origem atual: ${ctx.origin}.`],
      inferences: [],
    };
  }

  // Consolidação obrigatória: customer_id é identidade canônica. Se dois
  // registros no ctx tiverem o mesmo id (não deveria acontecer, mas defesa em
  // profundidade contra dedupe upstream falho), o segundo é ignorado — nunca
  // criamos um caso duplicado. Fusão de fontes múltiplas do MESMO id já é
  // resolvida em mapGrowthSnapshot; aqui protegemos a fronteira.
  const byId = new Map<string, PortalReadinessItem>();

  for (const customer of ctx.customers) {
    if (!isInReadinessUniverse(customer)) continue;
    if (byId.has(customer.id)) continue; // dedupe defensiva por customer_id
    const c = classifyCustomer(customer);
    byId.set(customer.id, {
      customerId: customer.id,
      name: customer.name,
      state: c.state,
      portalAccessReady: c.portalAccessReady,
      whatsappInviteReady: c.whatsappInviteReady,
      blockers: c.blockers,
      issues: c.issues,
      canonicalSubscriptionActive: c.canonicalSubscriptionActive,
      hasEmail: c.hasEmail,
      hasAuthLink: c.hasAuthLink,
      portalBetaEnabled: c.portalBetaEnabled,
      hasValidPhone: c.hasValidPhone,
      href: customerProfileHref(customer.id),
    });
  }

  const totalEvaluated = byId.size;

  if (totalEvaluated === 0) {
    return {
      status: "insufficient_data",
      message: "Nenhum assinante elegível na base atual — universo vazio.",
      facts: [],
      inferences: [],
    };
  }

  const ready: PortalReadinessItem[] = [];
  const blocked: PortalReadinessItem[] = [];
  const blockerFrequency = blockerCountersZero();

  for (const item of byId.values()) {
    for (const b of item.blockers) blockerFrequency[b] += 1;
    if (item.state === "READY") ready.push(item);
    else blocked.push(item);
  }

  ready.sort((a, b) => Number(b.whatsappInviteReady) - Number(a.whatsappInviteReady) || a.name.localeCompare(b.name));
  blocked.sort((a, b) => a.name.localeCompare(b.name));

  const totalPortalReady = ready.length;
  const totalBlocked = blocked.length;

  // Invariante crítica: totalEvaluated === totalPortalReady + totalBlocked.
  // Se cair aqui, é bug de consolidação — falha alta para não deixar contagem
  // silenciosamente errada em produção.
  if (totalEvaluated !== totalPortalReady + totalBlocked) {
    throw new Error(
      `[portal-readiness] invariante violada: totalEvaluated=${totalEvaluated} != ready(${totalPortalReady}) + blocked(${totalBlocked})`,
    );
  }

  return {
    status: "ok",
    data: {
      totalEvaluated,
      totalPortalReady,
      totalBlocked,
      ready,
      blocked,
      blockerFrequency,
      presentation: {
        invariants: [
          "cada customer aparece uma única vez (identidade canônica = customer_id)",
          "totalEvaluated = totalPortalReady + totalBlocked",
          "blockerFrequency é FREQUÊNCIA — um customer pode ter múltiplos blockers, portanto a soma pode ser maior que totalBlocked",
        ],
        renderingRules: [
          "use totalEvaluated / totalPortalReady / totalBlocked EXATAMENTE como vieram — não recalcule, não some manualmente",
          "se agrupar bloqueados por motivo, cada customer aparece uma única vez com TODOS os blockers/issues consolidados no mesmo caso; nunca dividir o mesmo customer entre dois grupos",
          "ao mostrar blockerFrequency, rotule como 'frequência dos bloqueios (um cliente pode ter mais de um)'; NUNCA como 'quantidade de clientes'",
          "nunca cite um customer fora da coleção retornada (ready ∪ blocked); nada de observações soltas com nomes",
        ],
      },
    },
    facts: [
      `${totalEvaluated} customer(s) avaliado(s) no universo do Portal (cada customer_id 1x).`,
      `${totalPortalReady} com acesso ao Portal provisionado (subscription canônica + gate + e-mail + vínculo Auth).`,
      `${totalBlocked} bloqueado(s). Invariante: totalEvaluated = totalPortalReady + totalBlocked.`,
    ],
    inferences: [
      "Elegibilidade parte SEMPRE de crm_subscriptions.is_active_subscriber. commercialStatus, knownSubscriberStatus, 4uCar, Founder e Curadoria são contexto — nunca promovem a READY.",
      "'Acesso provisionado' NÃO afirma que o cliente logou/ativou. Não temos evento de primeiro login registrado.",
      "MISSING_PHONE_FOR_WHATSAPP só bloqueia o convite pelo WhatsApp; não bloqueia o acesso por e-mail.",
      "INCONSISTENT_SUBSCRIBER_STATE = fonte não canônica diz 'assinante' mas crm_subscriptions não confirma. Reconciliar antes de liberar Portal.",
      "blockerFrequency é frequência: um customer com 3 blockers soma 3 unidades. NUNCA use como quantidade de clientes.",
    ],
  };
}

// ---------------------------------------------------------------------------
// Skill 2: get_portal_access_issues (diagnóstico)
// ---------------------------------------------------------------------------

export function getPortalAccessIssues(ctx: AgentContext): SkillResult<PortalAccessIssue[]> {
  const hasAnyPortalBlock = ctx.customers.some((c) => c.portalAccess != null);
  if (!hasAnyPortalBlock) {
    return {
      status: "unavailable",
      message:
        "Diagnóstico do Portal exige a leitura Supabase (DGN_GROWTH_DATA_SOURCE=db). Origem atual não expõe portal_beta_enabled / crm_customer_auth.",
      facts: [`Origem atual: ${ctx.origin}.`],
      inferences: [],
    };
  }

  const issues: PortalAccessIssue[] = [];

  for (const customer of ctx.customers) {
    const portal = customer.portalAccess;
    if (!portal) continue;

    const gate = portal.portalBetaEnabled;
    const hasEmail = portal.hasEmail;
    const hasAuthLink = portal.hasAuthLink;
    // Fonte canônica de assinatura. Ver comentário do módulo.
    const hasActiveSubscription = hasCanonicalActiveSubscription(customer);
    const appearsSubscriberByOtherSources = looksLikeSubscriber(customer);

    // 1) Gate ON sem vínculo Auth = portal marcado ativo mas provisionamento
    //    não fecha. UI mostra "Portal ativo" e o cliente não consegue entrar.
    if (gate && !hasAuthLink) {
      issues.push({
        customerId: customer.id,
        name: customer.name,
        issue: "GATE_ENABLED_WITHOUT_AUTH",
        detail: "Gate portal_beta_enabled=true mas sem linha em crm_customer_auth. Refaça 'Liberar acesso'.",
        href: customerProfileHref(customer.id),
      });
    }

    // 2) Gate ON sem email — mesma família, mas fonte diferente.
    if (gate && !hasEmail) {
      issues.push({
        customerId: customer.id,
        name: customer.name,
        issue: "GATE_ENABLED_WITHOUT_EMAIL",
        detail: "Gate portal_beta_enabled=true mas cliente sem e-mail persistido em crm_customers.",
        href: customerProfileHref(customer.id),
      });
    }

    // 3) Vínculo Auth sem email canônico (raro — provisionamento manual antigo).
    if (hasAuthLink && !hasEmail) {
      issues.push({
        customerId: customer.id,
        name: customer.name,
        issue: "AUTH_LINK_WITHOUT_EMAIL",
        detail: "Existe vínculo em crm_customer_auth, mas crm_customers.email está vazio. Recadastre e reenvie o magic link.",
        href: customerProfileHref(customer.id),
      });
    }

    // 4) Gate/acesso habilitado mas sem assinatura vigente = restrição a fechar.
    //    "Assinatura vigente" aqui é SÓ crm_subscriptions canônico — não
    //    aceita commercialStatus ou knownSubscriberStatus como prova.
    if ((gate || hasAuthLink) && !hasActiveSubscription) {
      issues.push({
        customerId: customer.id,
        name: customer.name,
        issue: "ACCESS_ENABLED_WITHOUT_ACTIVE_SUBSCRIPTION",
        detail: "Portal está habilitado mas não há assinatura ativa em crm_subscriptions. Revalidar antes de manter acesso.",
        href: customerProfileHref(customer.id),
      });
    }

    // 5) Assinante ativo (canônico) sem acesso — não é falha, mas é sinal de trabalho.
    if (hasActiveSubscription && !gate && !hasAuthLink) {
      issues.push({
        customerId: customer.id,
        name: customer.name,
        issue: "ACTIVE_SUBSCRIBER_WITHOUT_PORTAL",
        detail: "Assinante canônico sem provisionamento no Portal. Este cliente aguarda 'Liberar acesso'.",
        href: customerProfileHref(customer.id),
      });
    }

    // 6) Fonte NÃO canônica diz "assinante", crm_subscriptions diz que não.
    //    Sinaliza para reconciliar — NUNCA promover automaticamente.
    if (!hasActiveSubscription && appearsSubscriberByOtherSources) {
      const evidence: string[] = [];
      if (customer.commercialStatus === "Assinante Ativo") evidence.push('commercialStatus="Assinante Ativo"');
      if (customer.knownSubscriberStatus === "ativo") evidence.push('base viva 4uCar="ativo"');
      if (customer.knownSubscriberStatus === "renovacao_pendente") evidence.push('base viva 4uCar="renovacao_pendente"');
      issues.push({
        customerId: customer.id,
        name: customer.name,
        issue: "INCONSISTENT_SUBSCRIBER_STATE",
        detail: `Sem linha ativa em crm_subscriptions, mas ${evidence.join(" e ")}. Reconciliar antes de liberar Portal.`,
        href: customerProfileHref(customer.id),
      });
    }
  }

  if (issues.length === 0) {
    return {
      status: "insufficient_data",
      message: "Nenhuma inconsistência detectada no provisionamento do Portal.",
      facts: [],
      inferences: [],
    };
  }

  return {
    status: "ok",
    data: issues,
    facts: [`${issues.length} inconsistência(s) detectada(s).`],
    inferences: ["Este diagnóstico só aponta discrepâncias — não corrige automaticamente."],
  };
}

// ---------------------------------------------------------------------------
// Conversor auxiliar: readiness → attention cards (mesmo shape das outras
// skills). Usado se algum dia o daily-briefing quiser mostrar assinantes
// prontos para convite. Não é chamado hoje — deixado à disposição da UI.
// ---------------------------------------------------------------------------

export function readinessToAttentionCards(summary: PortalReadinessSummary): AttentionCard[] {
  const cards: AttentionCard[] = [];
  for (const item of summary.ready) {
    cards.push({
      id: `portal-ready:${item.customerId}`,
      priority: item.whatsappInviteReady ? "alta" : "media",
      kind: "subscriber",
      title: item.name,
      reason: item.whatsappInviteReady
        ? "Acesso ao Portal provisionado e telefone canônico presente. Pronto para convite pelo WhatsApp."
        : "Acesso ao Portal provisionado (por e-mail). Telefone canônico ausente — o convite pelo WhatsApp exigirá cadastro.",
      nextAction: item.whatsappInviteReady
        ? "Abrir 'Convite do Portal' via WhatsApp na ficha do cliente."
        : "Cadastrar telefone canônico antes de convite via WhatsApp, ou reenviar magic link.",
      href: item.href,
      ctaLabel: "Ver cliente",
      customerId: item.customerId,
    });
  }
  return cards;
}

/**
 * Uma linha textual consolidada para um customer bloqueado — todos os blockers
 * e issues em UM texto. Usado pelo provider determinístico e ideal para a LLM
 * espelhar em vez de agrupar por motivo (o que gera sobreposição).
 */
export function formatBlockedItemReasons(item: PortalReadinessItem): string {
  const parts: string[] = [];
  if (item.blockers.length > 0) parts.push(`Bloqueios: ${item.blockers.join(", ")}`);
  if (item.issues.length > 0) parts.push(`Issues: ${item.issues.join(", ")}`);
  return parts.join(" · ");
}
