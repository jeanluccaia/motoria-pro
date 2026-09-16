import type { DgnCustomer } from "../../dgn-growth-utils.ts";
import type { AgentContext } from "../agent-context.ts";
import type { AttentionCard, SkillResult } from "../types.ts";
import { customerProfileHref } from "../../customer-links.ts";

// -----------------------------------------------------------------------------
// Skills de acesso ao Portal do Assinante (domain SUBSCRIBER_PORTAL_ACCESS).
//
// Contexto do bug que motivou o P0: a palavra "convite" sozinha vinha
// caindo em rotas Founder (aquisição). Aqui separamos:
//
//   * `get_subscriber_portal_readiness` responde
//        "quem está pronto para receber convite do Portal hoje e
//         quais dados bloqueiam os demais?"
//   * `get_portal_access_issues` responde
//        "onde o provisionamento está inconsistente?" (diagnóstico)
//
// Nenhuma dessas skills toca Founder/Curadoria — o universo é o assinante que
// existe operacionalmente no CRM. Fontes usadas:
//   * `crm_customers.portal_beta_enabled` (gate)
//   * `crm_customers.email` (presença)
//   * `crm_customer_auth` (vínculo existe?)
//   * `crm_customers.normalized_phone` (canal do convite WhatsApp)
//   * `crm_subscriptions.is_active_subscriber` / `subscription.status`
//   * base viva `KNOWN_SUBSCRIBERS_2026_08_16` (para reconhecer quem é
//     assinante mesmo antes de o registro do CRM sinalizar)
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
  | "INCONSISTENT_PORTAL_STATE";

export type PortalReadinessState = "READY" | "BLOCKED";

export interface PortalReadinessItem {
  customerId: string;
  name: string;
  state: PortalReadinessState;
  /** Acesso ao Portal está pronto (não depende de telefone). */
  portalAccessReady: boolean;
  /** Convite pelo WhatsApp está pronto (portalAccessReady + telefone canônico). */
  whatsappInviteReady: boolean;
  blockers: PortalReadinessBlocker[];
  href: string;
}

export interface PortalReadinessSummary {
  ready: PortalReadinessItem[];
  blocked: PortalReadinessItem[];
  /** Contagem por blocker canônico — bom para o operador entender onde intervir. */
  blockerCounts: Record<PortalReadinessBlocker, number>;
  /** Universo considerado (assinantes elegíveis, ativos ou reconhecidos). */
  totalSubscribersConsidered: number;
}

export interface PortalAccessIssue {
  customerId: string;
  name: string;
  /** Motivo canônico da inconsistência — semelhante a blocker mas específico de diagnóstico. */
  issue:
    | "GATE_ENABLED_WITHOUT_AUTH"
    | "GATE_ENABLED_WITHOUT_EMAIL"
    | "AUTH_LINK_WITHOUT_EMAIL"
    | "ACCESS_ENABLED_WITHOUT_ACTIVE_SUBSCRIPTION"
    | "ACTIVE_SUBSCRIBER_WITHOUT_PORTAL";
  detail: string;
  href: string;
}

// ---------------------------------------------------------------------------
// Universo: quem é considerado assinante para efeito de convite do Portal.
// Fontes canônicas — igual à lógica que a Central de Assinantes já usa (assinantes-detectados).
// ---------------------------------------------------------------------------

function isEligibleSubscriber(customer: DgnCustomer): boolean {
  if (customer.subscription?.isActive === true) return true;
  if (customer.commercialStatus === "Assinante Ativo") return true;
  // knownSubscriberStatus é enriquecido pelo enrichKnownSubscribers antes do
  // context chegar até aqui. Cobre casos onde o CRM ainda não migrou o cliente
  // para "Assinante Ativo" mas ele já figura na base viva 4uCar.
  if (customer.knownSubscriberStatus === "ativo") return true;
  if (customer.knownSubscriberStatus === "renovacao_pendente") return true;
  return false;
}

function classifyCustomer(customer: DgnCustomer): {
  state: PortalReadinessState;
  portalAccessReady: boolean;
  whatsappInviteReady: boolean;
  blockers: PortalReadinessBlocker[];
} {
  const portal = customer.portalAccess;
  const blockers: PortalReadinessBlocker[] = [];

  // Sem bloco = leitura em JSON mode ou dado ausente. Tratamos como
  // NO_AUTH_LINK/MISSING_EMAIL/PORTAL_GATE_DISABLED por segurança (nada READY
  // sem evidência). O caller decide se essa lista faz sentido para exibir.
  const portalBetaEnabled = portal?.portalBetaEnabled === true;
  const hasEmail = portal?.hasEmail === true;
  const hasAuthLink = portal?.hasAuthLink === true;
  const hasPhone = customer.hasValidPhone === true;

  const subscriptionElegible =
    customer.subscription?.isActive === true ||
    customer.commercialStatus === "Assinante Ativo" ||
    customer.knownSubscriberStatus === "ativo" ||
    customer.knownSubscriberStatus === "renovacao_pendente";

  if (!subscriptionElegible) blockers.push("NO_ACTIVE_SUBSCRIPTION");
  if (!hasEmail) blockers.push("MISSING_EMAIL");
  if (!hasAuthLink) blockers.push("NO_AUTH_LINK");
  if (!portalBetaEnabled) blockers.push("PORTAL_GATE_DISABLED");

  // Sinaliza estado inconsistente quando o gate está ON mas o provisionamento
  // não fecha (sem Auth ou sem email). Isso é diferente de "gate está OFF" —
  // aqui o operador ligou algo que não deveria estar ligado.
  if (portalBetaEnabled && (!hasAuthLink || !hasEmail)) {
    blockers.push("INCONSISTENT_PORTAL_STATE");
  }

  const portalAccessReady = subscriptionElegible && hasEmail && hasAuthLink && portalBetaEnabled;

  if (!hasPhone) blockers.push("MISSING_PHONE_FOR_WHATSAPP");
  const whatsappInviteReady = portalAccessReady && hasPhone;

  return {
    state: portalAccessReady ? "READY" : "BLOCKED",
    portalAccessReady,
    whatsappInviteReady,
    blockers: dedupeBlockers(blockers),
  };
}

function dedupeBlockers(blockers: PortalReadinessBlocker[]): PortalReadinessBlocker[] {
  return Array.from(new Set(blockers));
}

function blockerCountersZero(): Record<PortalReadinessBlocker, number> {
  return {
    MISSING_EMAIL: 0,
    NO_AUTH_LINK: 0,
    PORTAL_GATE_DISABLED: 0,
    NO_ACTIVE_SUBSCRIPTION: 0,
    MISSING_PHONE_FOR_WHATSAPP: 0,
    INCONSISTENT_PORTAL_STATE: 0,
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

  const universe = ctx.customers.filter(isEligibleSubscriber);
  const ready: PortalReadinessItem[] = [];
  const blocked: PortalReadinessItem[] = [];
  const blockerCounts = blockerCountersZero();

  for (const customer of universe) {
    const classification = classifyCustomer(customer);
    const item: PortalReadinessItem = {
      customerId: customer.id,
      name: customer.name,
      state: classification.state,
      portalAccessReady: classification.portalAccessReady,
      whatsappInviteReady: classification.whatsappInviteReady,
      blockers: classification.blockers,
      href: customerProfileHref(customer.id),
    };
    for (const b of classification.blockers) blockerCounts[b] += 1;
    if (classification.state === "READY") ready.push(item);
    else blocked.push(item);
  }

  // Ordenação estável: primeiro pelos com WhatsApp pronto, depois nome.
  ready.sort((a, b) => Number(b.whatsappInviteReady) - Number(a.whatsappInviteReady) || a.name.localeCompare(b.name));
  blocked.sort((a, b) => a.name.localeCompare(b.name));

  if (universe.length === 0) {
    return {
      status: "insufficient_data",
      message: "Nenhum assinante elegível na base atual — universo vazio.",
      facts: [],
      inferences: [],
    };
  }

  return {
    status: "ok",
    data: {
      ready,
      blocked,
      blockerCounts,
      totalSubscribersConsidered: universe.length,
    },
    facts: [
      `${universe.length} assinante(s) considerados (base viva + CRM).`,
      `${ready.length} com acesso ao Portal provisionado (gate + e-mail + vínculo Auth).`,
      `${blocked.length} bloqueados.`,
    ],
    inferences: [
      "'Acesso provisionado' NÃO afirma que o cliente logou/ativou. Não temos evento de primeiro login registrado.",
      "MISSING_PHONE_FOR_WHATSAPP só bloqueia o convite pelo WhatsApp; não bloqueia o acesso por e-mail.",
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
    const subscriptionElegible =
      customer.subscription?.isActive === true ||
      customer.commercialStatus === "Assinante Ativo" ||
      customer.knownSubscriberStatus === "ativo" ||
      customer.knownSubscriberStatus === "renovacao_pendente";

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
    if ((gate || hasAuthLink) && !subscriptionElegible) {
      issues.push({
        customerId: customer.id,
        name: customer.name,
        issue: "ACCESS_ENABLED_WITHOUT_ACTIVE_SUBSCRIPTION",
        detail: "Portal está habilitado mas o cliente não figura como assinante ativo hoje. Revalidar antes de manter acesso.",
        href: customerProfileHref(customer.id),
      });
    }

    // 5) Assinante ativo sem acesso — não é falha, mas é sinal de trabalho.
    if (subscriptionElegible && !gate && !hasAuthLink) {
      issues.push({
        customerId: customer.id,
        name: customer.name,
        issue: "ACTIVE_SUBSCRIBER_WITHOUT_PORTAL",
        detail: "Assinante reconhecido sem provisionamento no Portal. Este cliente aguarda 'Liberar acesso'.",
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
