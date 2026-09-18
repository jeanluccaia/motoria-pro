/**
 * Regras de classificação por linha do relatório vs base canônica.
 * Nenhum I/O, nenhum write — só decide.
 */

import type {
  CustomerMatch,
  ProposedAction,
  ReconcileClassification,
  ReconcileFacts,
  ReconcileInputRow,
  ReconcilePreviewItem,
  ReconcileSubscriptionRow,
  ReconcileVehicleRow,
  SubscriptionMatch,
} from "./types.ts";
import { normalizePlate } from "../db/normalizers.ts";

const CANONICAL_PLANS = new Set(["Essential", "Smart", "Priority"]);

function canonicalizePlan(raw: string | undefined): "Essential" | "Smart" | "Priority" | null {
  if (!raw) return null;
  const t = raw.trim();
  if (CANONICAL_PLANS.has(t)) return t as "Essential" | "Smart" | "Priority";
  const lower = t.toLowerCase();
  if (lower === "essential") return "Essential";
  if (lower === "smart") return "Smart";
  if (lower === "priority") return "Priority";
  return null;
}

const CANONICAL_CYCLES = new Set(["mensal", "semestral", "anual", "outro", "não identificado"]);

function canonicalizeCycle(raw: string | undefined): "mensal" | "semestral" | "anual" | "outro" | "não identificado" {
  if (!raw) return "não identificado";
  const lower = raw.trim().toLowerCase();
  if (CANONICAL_CYCLES.has(lower)) return lower as "mensal" | "semestral" | "anual" | "outro" | "não identificado";
  if (lower.includes("mensal")) return "mensal";
  if (lower.includes("semestr") || lower.includes("fidelidade de 6")) return "semestral";
  if (lower.includes("anual") || lower.includes("fidelidade de 12")) return "anual";
  return "não identificado";
}

/**
 * Converte "DD/MM/YYYY" ou "YYYY-MM-DD" para ISO âncora "00:00 America/Sao_Paulo"
 * (= "<data>T03:00:00+00:00" UTC), convenção homologada. `null` se inválido.
 */
export function parsePaidUntilToCycleEndsAt(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const mBr = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const mIso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  let y: number, mo: number, d: number;
  if (mBr) { d = +mBr[1]!; mo = +mBr[2]!; y = +mBr[3]!; }
  else if (mIso) { y = +mIso[1]!; mo = +mIso[2]!; d = +mIso[3]!; }
  else return null;
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null;
  // BRT = UTC-03 (não considera DST — descontinuada em 2019)
  const iso = `${y.toString().padStart(4, "0")}-${mo.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}T03:00:00+00:00`;
  return iso;
}

function isRenewalPending(status: string | undefined): boolean {
  if (!status) return false;
  const lower = status.trim().toLowerCase();
  return lower === "renovacao_pendente" || lower === "renovação pendente" || lower.startsWith("renov");
}

function isActiveStatus(status: string | undefined): boolean {
  if (!status) return false;
  const lower = status.trim().toLowerCase();
  return lower === "ativo" || lower === "active" || lower === "pago";
}

function isPaymentConfirmed(row: ReconcileInputRow): boolean {
  if (isActiveStatus(row.status) && (row.payment_method || "").toLowerCase().includes("pag")) return true;
  const notes = (row.notes ?? "").toLowerCase();
  if (notes.includes("pago") || notes.includes("pagamento confirmado")) return true;
  // Se status="pago" explícito, também confirma.
  return row.status?.toLowerCase().trim() === "pago";
}

interface ClassifyContext {
  row: ReconcileInputRow;
  rowIndex: number;
  customer: CustomerMatch;
  subscription: SubscriptionMatch;
  subscriptions: ReconcileSubscriptionRow[];
  vehicles: ReconcileVehicleRow[];
  now: Date;
}

export function classifyRow(ctx: ClassifyContext): ReconcilePreviewItem {
  const { row, rowIndex, customer, subscription } = ctx;
  const facts: ReconcileFacts = {
    matchedByPhone: customer.strategy === "phone",
    matchedByPlate: customer.strategy === "plate",
    matchedByLegacyId: customer.strategy === "legacy_id",
    matchedByName: customer.strategy === "name",
    fuzzyName: customer.strategy === "fuzzy_name",
    ambiguousCandidates: customer.ambiguousIds.length,
    subscriptionMatch: subscription.strategy !== "none" ? subscription : null,
    planReported: row.plan ?? null,
    planCanonical: subscription.currentPlan,
    cycleEndsAtReported: parsePaidUntilToCycleEndsAt(row.paid_until),
    cycleEndsAtCurrent: null,
    divergingFields: [],
    missingFields: [],
  };

  // Enriquece cycle_ends_at atual se subscription encontrada
  if (subscription.subscriptionId) {
    const s = ctx.subscriptions.find((x) => x.id === subscription.subscriptionId);
    if (s) facts.cycleEndsAtCurrent = s.cycle_ends_at;
  }

  // 1) Sem customer? Fim
  if (!customer.customerId) {
    return finalize(rowIndex, row, customer, "CUSTOMER_NOT_FOUND",
      "Nenhum customer localizado por telefone/placa/legacy_id/nome exato.",
      facts, null, false);
  }

  // 2) Ambíguo (mesma estratégia bateu N customers) ou fuzzy → POSSIBLE_MATCH
  if (customer.ambiguousIds.length > 0 || customer.strategy === "fuzzy_name") {
    return finalize(rowIndex, row, customer, "POSSIBLE_MATCH",
      `Match ambíguo (${customer.strategy}, ${customer.ambiguousIds.length + 1} candidatos). Escolha manual obrigatória.`,
      facts, null, false);
  }

  const planReq = canonicalizePlan(row.plan);
  const renewal = isRenewalPending(row.status);
  const activeReq = isActiveStatus(row.status);

  // 3) RENEWAL_PENDING (relatório diz renovação pendente) — nunca ativar
  if (renewal) {
    return finalize(rowIndex, row, customer, "RENEWAL_PENDING",
      "Relatório indica renovação pendente. Não ativar como assinante canônico até renovação confirmada.",
      facts, null, false);
  }

  const hasCanonicalRef = subscription.subscriptionId != null;

  // 4) Nenhuma subscription existe para o customer
  if (!hasCanonicalRef) {
    if (!planReq) {
      facts.missingFields.push("plan");
      return finalize(rowIndex, row, customer, "CONFLICT",
        "Customer resolvido, sem subscription — plano do relatório ausente ou não canônico. Sem apply.",
        facts, null, false);
    }
    if (!activeReq) {
      return finalize(rowIndex, row, customer, "RENEWAL_PENDING",
        "Sem subscription no CRM e relatório não confirma ativo hoje. Sem write.",
        facts, null, false);
    }
    const cycle = canonicalizeCycle(row.cycle);
    const paidConfirmed = isPaymentConfirmed(row);
    const proposed: ProposedAction = {
      kind: "CREATE_NEW",
      customerId: customer.customerId,
      plan: planReq,
      cycle,
      paymentStatus: paidConfirmed ? "confirmed" : "unknown",
      paymentEvidenceSource: paidConfirmed ? "manual" : "unknown",
      cycleEndsAtIso: parsePaidUntilToCycleEndsAt(row.paid_until),
      sourceReference: row.source ?? `Reconciliador ${ctx.now.toISOString().slice(0, 10)}`,
      notes: row.notes ?? null,
      vehicleId: findVehicleId(ctx, customer.customerId),
    };
    return finalize(rowIndex, row, customer, "CREATE_NEW",
      "Customer resolvido, sem subscription canônica; plano e status explícitos no relatório permitem criação segura.",
      facts, proposed, true);
  }

  const currentSub = ctx.subscriptions.find((s) => s.id === subscription.subscriptionId)!;

  // 5) Múltiplas subscriptions sem discriminador → review (antes de qualquer
  //    decisão específica por sub, senão o classifier acaba escolhendo uma
  //    das candidatas silenciosamente — bug do padrão José Sergio/David).
  if (subscription.strategy === "multiple_review") {
    return finalize(rowIndex, row, customer, "UPDATE_EXISTING_REVIEW",
      `Customer possui ${subscription.candidatesCount} subscriptions; relatório não permite escolher alvo (sem placa correspondente). Revisão humana.`,
      facts, null, false);
  }

  // 6) Provider-linked (PagBank) — nunca alterar por caminho manual
  if (subscription.providerLinked) {
    if (planReq && planReq !== currentSub.subscription_plan) {
      facts.divergingFields.push("plan");
      return finalize(rowIndex, row, customer, "CONFLICT",
        `Subscription PagBank já registra plano ${currentSub.subscription_plan}; relatório diz ${planReq}. Reconciliar antes; não alterar pelo reconciliador manual.`,
        facts, null, false);
    }
    return finalize(rowIndex, row, customer, "ALREADY_CORRECT",
      `Subscription PagBank ativa (plano ${currentSub.subscription_plan}). Nada a fazer pelo reconciliador manual.`,
      facts, null, false);
  }

  // 7) Já ativo/correto (subs manual)
  const planMatches = !planReq || planReq === currentSub.subscription_plan;
  const alreadyActive = currentSub.is_active_subscriber && currentSub.subscription_status === "ativo";
  if (alreadyActive && planMatches) {
    // Se relatório trouxe paid_until diferente do atual, marca UPDATE_EXISTING_REVIEW
    const cerReported = parsePaidUntilToCycleEndsAt(row.paid_until);
    if (cerReported && currentSub.cycle_ends_at && cerReported !== isoNormalize(currentSub.cycle_ends_at)) {
      facts.divergingFields.push("cycle_ends_at");
      return finalize(rowIndex, row, customer, "UPDATE_EXISTING_REVIEW",
        `Subscription já ativa; relatório traz nova vigência (${row.paid_until}) diferente do CRM. Revisão humana antes de sobrescrever.`,
        facts, null, false);
    }
    return finalize(rowIndex, row, customer, "ALREADY_CORRECT",
      "Subscription já reflete plano e estado ativo canônicos.",
      facts, null, false);
  }

  // 8) Plano diverge em sub manual → CONFLICT
  if (planReq && !planMatches) {
    facts.divergingFields.push("plan");
    return finalize(rowIndex, row, customer, "CONFLICT",
      `Plano CRM (${currentSub.subscription_plan}) diverge do relatório (${planReq}). Revisão humana.`,
      facts, null, false);
  }

  // 9) Não ativa (detectado/pendente_validacao) + relatório confirma ativo → PROMOTE
  if (!currentSub.is_active_subscriber && activeReq) {
    const paidConfirmed = isPaymentConfirmed(row);
    const notesAppend = notesAppendFor(row, ctx.now);
    const proposed: ProposedAction = {
      kind: "PROMOTE_EXISTING",
      subscriptionId: currentSub.id,
      expectedCustomerId: customer.customerId,
      paymentStatus: paidConfirmed ? "confirmed" : "unknown",
      paymentEvidenceSource: paidConfirmed ? "manual" : "unknown",
      cycleEndsAtIso: parsePaidUntilToCycleEndsAt(row.paid_until),
      sourceReference: row.source ?? `Reconciliador ${ctx.now.toISOString().slice(0, 10)}`,
      notesAppend,
    };
    return finalize(rowIndex, row, customer, "PROMOTE_EXISTING",
      `Subscription existente em '${currentSub.subscription_status}' e o relatório confirma ativa. Promoção candidata.`,
      facts, proposed, true);
  }

  return finalize(rowIndex, row, customer, "UPDATE_EXISTING_REVIEW",
    "Estado atual não bate com o relatório de forma inequívoca. Revisão humana.",
    facts, null, false);
}

function isoNormalize(raw: string): string {
  // Postgres devolve "2026-12-31 03:00:00+00" (sem 'T'); ISO usa 'T'.
  const s = raw.trim().replace(" ", "T");
  return s.endsWith("+00") ? s.replace("+00", "+00:00") : s;
}

function notesAppendFor(row: ReconcileInputRow, now: Date): string | null {
  const parts: string[] = [];
  const dateStr = now.toISOString().slice(0, 10);
  const activeBit = isActiveStatus(row.status) ? "ativo" : row.status ?? "confirmado";
  const paidBit = isPaymentConfirmed(row) ? ", pago" : "";
  const validBit = row.paid_until ? `, vigente até ${row.paid_until}` : "";
  parts.push(`Reconciliador ${dateStr}: ${activeBit}${paidBit}${validBit}`);
  return parts.join("\n");
}

function findVehicleId(ctx: ClassifyContext, customerId: string): string | null {
  if (!ctx.row.plate) return null;
  const pl = normalizePlate(ctx.row.plate);
  if (!pl.classification.startsWith("valida")) return null;
  const veh = ctx.vehicles.find((v) => v.customer_id === customerId && normalizePlate(v.plate).compact === pl.compact);
  return veh?.id ?? null;
}

function finalize(
  rowIndex: number,
  input: ReconcileInputRow,
  customer: CustomerMatch,
  classification: ReconcileClassification,
  reason: string,
  facts: ReconcileFacts,
  proposed: ProposedAction | null,
  applyEnabled: boolean,
): ReconcilePreviewItem {
  return { rowIndex, input, customer, classification, reason, facts, proposed, applyEnabled };
}
