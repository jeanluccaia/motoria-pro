/**
 * Helper único de derivação do estado de acesso ao Portal para exibição
 * (badges, chips, CTAs). Espelha 1:1 o critério canônico do agent em
 * `lib/growth/agent/skills/portal-readiness.ts` — não introduz definição
 * paralela.
 *
 * Reserva de linguagem:
 *   - "ACCESS_PROVISIONED"  → tudo pronto: subscription canônica ativa +
 *                             e-mail + vínculo Auth + gate.
 *   - "ACCESS_INCOMPLETE"   → subscription ativa mas provisionamento parcial
 *                             (algum item entre email/auth/gate está ausente).
 *   - "NOT_PROVISIONED"     → nenhum item de provisionamento presente.
 *   - "INCONSISTENT"        → provisão parcial (gate ou vínculo) SEM
 *                             subscription canônica ativa — reconciliação
 *                             humana obrigatória.
 *
 * "Ativado" é reservado para o dia em que houver evento de primeiro login.
 * Hoje só afirmamos "acesso liberado" / "acesso incompleto" / "inconsistente".
 */

export type PortalAccessStatusCode =
  | "ACCESS_PROVISIONED"
  | "ACCESS_INCOMPLETE"
  | "NOT_PROVISIONED"
  | "INCONSISTENT";

export type PortalAccessBlocker =
  | "MISSING_ACTIVE_SUBSCRIPTION"
  | "MISSING_EMAIL"
  | "MISSING_AUTH_LINK"
  | "PORTAL_GATE_DISABLED";

export interface PortalAccessStatusInput {
  canonicalSubscriptionActive: boolean;
  hasEmail: boolean;
  hasAuthLink: boolean;
  portalBetaEnabled: boolean;
}

export interface PortalAccessStatusResult {
  status: PortalAccessStatusCode;
  label: string;
  blockers: PortalAccessBlocker[];
}

export function derivePortalAccessStatus(input: PortalAccessStatusInput): PortalAccessStatusResult {
  const sub = input.canonicalSubscriptionActive === true;
  const hasEmail = input.hasEmail === true;
  const hasAuthLink = input.hasAuthLink === true;
  const gate = input.portalBetaEnabled === true;

  const blockers: PortalAccessBlocker[] = [];
  if (!sub) blockers.push("MISSING_ACTIVE_SUBSCRIPTION");
  if (!hasEmail) blockers.push("MISSING_EMAIL");
  if (!hasAuthLink) blockers.push("MISSING_AUTH_LINK");
  if (!gate) blockers.push("PORTAL_GATE_DISABLED");

  if (sub && hasEmail && hasAuthLink && gate) {
    return { status: "ACCESS_PROVISIONED", label: "Acesso liberado", blockers: [] };
  }

  // Provisão parcial (gate/auth) SEM subscription canônica → inconsistente.
  if (!sub && (gate || hasAuthLink)) {
    return { status: "INCONSISTENT", label: "Inconsistente", blockers };
  }

  // Subscription canônica ativa mas algum item de provisionamento falta.
  if (sub && (gate || hasEmail || hasAuthLink)) {
    return { status: "ACCESS_INCOMPLETE", label: "Acesso incompleto", blockers };
  }

  return { status: "NOT_PROVISIONED", label: "Não liberado", blockers };
}
