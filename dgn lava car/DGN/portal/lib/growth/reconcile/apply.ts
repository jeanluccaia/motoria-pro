/**
 * Decisão do que fazer para cada linha selecionada pelo operador — puro,
 * sem I/O. Compara a seleção recebida do browser com o preview REVALIDADO
 * server-side (snapshot fresh). Se algo mudou, devolve STALE_*. A execução
 * real das RPCs vive no endpoint (server), não aqui.
 */

import type {
  ProposedAction,
  ReconcileClassification,
  ReconcilePreviewItem,
} from "./types.ts";

export type ApplyExpectedClassification = "PROMOTE_EXISTING" | "CREATE_NEW";

export interface ApplySelection {
  rowIndex: number;
  expectedClassification: ApplyExpectedClassification;
  /** Opcional — quando o operador viu um subscription_id específico no preview. */
  expectedSubscriptionId?: string;
  /** Opcional — customer_id (formato DgnCustomer.id) visto no preview. */
  expectedCustomerId?: string;
}

export type ApplyResultCode =
  | "PROMOTED"
  | "CREATED"
  | "ALREADY_CORRECT"
  | "REVIEW_EXISTING_SUBSCRIPTION"
  | "REVIEW_REQUIRED"
  | "STALE_PREVIEW_REVIEW_REQUIRED"
  | "NOT_APPLICABLE"
  | "FAILED";

export interface ApplyDecision {
  outcome: "PROCEED" | "STALE" | "NOT_APPLICABLE";
  reason: string;
  action: ProposedAction | null;
  freshItem: ReconcilePreviewItem;
}

/**
 * Decide o que fazer com uma seleção comparando-a ao item revalidado.
 * Nunca executa. Nunca depende de dado enviado pelo browser além do índice
 * e da classificação esperada.
 */
export function planApplyDecision(
  selection: ApplySelection,
  freshItem: ReconcilePreviewItem,
): ApplyDecision {
  // Item deixou de ser aplicável (ex.: alguém já promoveu; virou ALREADY_CORRECT)
  if (!freshItem.applyEnabled || !freshItem.proposed) {
    if (freshItem.classification === "ALREADY_CORRECT") {
      return {
        outcome: "NOT_APPLICABLE", reason: "Item já está correto após revalidação.",
        action: null, freshItem,
      };
    }
    return {
      outcome: "STALE",
      reason: `Item deixou de ser aplicável (classificação atual: ${freshItem.classification}).`,
      action: null, freshItem,
    };
  }

  // Classificação divergente entre preview e apply → NUNCA aplicar
  if (freshItem.classification !== selection.expectedClassification) {
    return {
      outcome: "STALE",
      reason: `Classificação mudou de ${selection.expectedClassification} para ${freshItem.classification} desde o preview.`,
      action: null, freshItem,
    };
  }

  // Customer diferente do esperado → STALE (evita apply em outro cliente)
  if (selection.expectedCustomerId && freshItem.customer.customerId !== selection.expectedCustomerId) {
    return {
      outcome: "STALE",
      reason: `Customer alvo mudou entre preview e apply (esperado ${selection.expectedCustomerId}, atual ${freshItem.customer.customerId}).`,
      action: null, freshItem,
    };
  }

  // Sanity check subscription_id no PROMOTE
  if (
    selection.expectedClassification === "PROMOTE_EXISTING"
    && freshItem.proposed.kind === "PROMOTE_EXISTING"
    && selection.expectedSubscriptionId
    && freshItem.proposed.subscriptionId !== selection.expectedSubscriptionId
  ) {
    return {
      outcome: "STALE",
      reason: `subscription_id alvo mudou entre preview e apply.`,
      action: null, freshItem,
    };
  }

  return { outcome: "PROCEED", reason: "ok", action: freshItem.proposed, freshItem };
}

/**
 * Converte outcome + resultado da RPC em ApplyResultCode canônico.
 */
export function toResultCode(
  outcome: ApplyDecision["outcome"],
  rpcResult?: { code?: string; error?: unknown },
): ApplyResultCode {
  if (outcome === "STALE") return "STALE_PREVIEW_REVIEW_REQUIRED";
  if (outcome === "NOT_APPLICABLE") return "ALREADY_CORRECT";
  if (!rpcResult) return "FAILED";
  if (rpcResult.error) return "FAILED";
  if (rpcResult.code === "CREATED") return "CREATED";
  if (rpcResult.code === "PROMOTED") return "PROMOTED";
  if (rpcResult.code === "REVIEW_EXISTING_SUBSCRIPTION") return "REVIEW_EXISTING_SUBSCRIPTION";
  return "FAILED";
}

/**
 * Sumário textual pronto para o modal e para a UI de resultado — usado tanto
 * antes (previsão) quanto depois (resultado real). Sempre inclui a garantia
 * de que nenhuma cobrança PagBank foi/será alterada.
 */
export function summarizeApplyPlan(input: {
  proceedCount: number; staleCount: number; alreadyCorrect: number; failed: number;
}): string {
  const parts: string[] = [];
  parts.push(`${input.proceedCount} subscription(s) serão alteradas/criadas`);
  if (input.staleCount > 0) parts.push(`${input.staleCount} requer(em) nova revisão (preview stale)`);
  if (input.alreadyCorrect > 0) parts.push(`${input.alreadyCorrect} já estava(m) correta(s)`);
  if (input.failed > 0) parts.push(`${input.failed} falha(s)`);
  parts.push("nenhuma cobrança PagBank será alterada");
  return parts.join(" · ");
}

/**
 * Filtro server-side: só entram no APPLY seleções com classification aceita.
 * O client pode até tentar enviar POSSIBLE_MATCH — o server descarta.
 */
export function isAllowedForApply(classification: ReconcileClassification): boolean {
  return classification === "PROMOTE_EXISTING" || classification === "CREATE_NEW";
}
