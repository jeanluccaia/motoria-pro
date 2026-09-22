import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";
import { CustomerResolutionError, resolveCustomerId } from "./customer-resolver.ts";
import {
  DGN_SUBSCRIBER_PLANS,
  DGN_BILLING_MODALITIES,
  type DgnSubscriberPlan,
  type DgnBillingModality,
} from "../dgn-plans.ts";

// -----------------------------------------------------------------------------
// CRUD de crm_subscriptions para o Editor de assinaturas manuais na ficha do
// cliente (Fase 1 do plano do Digo).
//
// Regras invioláveis:
//   * Só toca subscriptions "manuais" (provider_customer_id/subscription_id NULL).
//   * PagBank permanece read-only: contratos com vínculo provider viram um flag
//     `pagBankLocked: true` no GET; e nas RPCs de edit/cancel o Postgres derruba
//     com EXCEPTION. Nunca renova, confirma pagamento nem inventa evidência.
//   * Todos os writes vão pelas RPCs SECURITY DEFINER homologadas — o admin não
//     escreve direto em crm_subscriptions (defesa em profundidade + audit_log).
//   * Cycle: UI envia "Mensal" | "Fidelidade de 6 meses" | "Fidelidade de 12 meses";
//     tradução para o enum interno (mensal | semestral | anual) fica encapsulada
//     aqui para que a interface use termos de negócio.
// -----------------------------------------------------------------------------

export class SubscriptionsWriteError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function resolve(db: SupabaseClient, input: string): Promise<string> {
  try {
    return await resolveCustomerId(db, input);
  } catch (err) {
    if (err instanceof CustomerResolutionError) throw new SubscriptionsWriteError(err.message, err.status);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Mapa modalidade UI ↔ enum crm_subscription_cycle no banco.
// UI só mostra os 3 termos oficiais (dgn-plans.ts). Semestral/Anual/Trimestral
// nunca aparecem na UI, mas semestral/anual são os valores brutos no enum DB.
// -----------------------------------------------------------------------------
type DbCycle = "mensal" | "semestral" | "anual" | "outro" | "não identificado";

const MODALITY_TO_DB_CYCLE: Record<DgnBillingModality, DbCycle> = {
  "Mensal": "mensal",
  "Fidelidade de 6 meses": "semestral",
  "Fidelidade de 12 meses": "anual",
};

const DB_CYCLE_TO_MODALITY: Record<DbCycle, DgnBillingModality | null> = {
  "mensal": "Mensal",
  "semestral": "Fidelidade de 6 meses",
  "anual": "Fidelidade de 12 meses",
  "outro": null,
  "não identificado": null,
};

export function modalityToDbCycle(modality: string | null | undefined): DbCycle {
  if (!modality) return "não identificado";
  const t = modality.trim();
  if ((DGN_BILLING_MODALITIES as readonly string[]).includes(t)) {
    return MODALITY_TO_DB_CYCLE[t as DgnBillingModality];
  }
  throw new SubscriptionsWriteError(
    `Modalidade "${t}" não é oficial. Aceitas: ${DGN_BILLING_MODALITIES.join(", ")}.`,
    400,
  );
}

export function dbCycleToModality(cycle: string | null | undefined): DgnBillingModality | "Outra" {
  if (!cycle) return "Outra";
  const value = cycle as DbCycle;
  const label = DB_CYCLE_TO_MODALITY[value];
  return label ?? "Outra";
}

function ensurePlan(plan: string | null | undefined): DgnSubscriberPlan {
  if (!plan) throw new SubscriptionsWriteError("Plano obrigatório.", 400);
  const t = plan.trim();
  if ((DGN_SUBSCRIBER_PLANS as readonly string[]).includes(t)) return t as DgnSubscriberPlan;
  throw new SubscriptionsWriteError(
    `Plano "${t}" inválido. Aceitos: ${DGN_SUBSCRIBER_PLANS.join(", ")}.`,
    400,
  );
}

function parseCycleEndsAtIso(input: string | null | undefined, opts: { now?: Date } = {}): string | null {
  if (!input || !input.trim()) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) throw new SubscriptionsWriteError("Data de fim de vigência inválida.", 400);
  // Bloqueia data no passado — assinatura que "continuará ativa" não pode
  // terminar antes de hoje. Correção retroativa exige fluxo próprio (fora
  // do editor da ficha). Comparação em UTC pra evitar ambiguidade de fuso.
  const now = opts.now ?? new Date();
  const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (d.getTime() < todayUtcMs) {
    throw new SubscriptionsWriteError(
      "Fim da vigência não pode ser uma data no passado. Correção retroativa exige fluxo específico.",
      400,
    );
  }
  return d.toISOString();
}

// -----------------------------------------------------------------------------
// Tipo devolvido ao browser. Nunca inclui provider_customer_id/subscription_id
// como strings — só o boolean pagBankLocked.
// -----------------------------------------------------------------------------
export interface SubscriptionUsage {
  /** 1/2/4 conforme plano; null quando plano não é Essential/Smart/Priority. */
  includedPerMonth: number | null;
  /** 1/6/12 conforme modalidade oficial; null quando cycle é outro/legado. */
  cycleMonths: number | null;
  /** includedPerMonth × cycleMonths; null quando qualquer um dos dois é null. */
  includedPerCycle: number | null;
  /**
   * Fim do ciclo canônico (usa cycle_ends_at); null quando não definido no CRM
   * — nesse caso NÃO calculamos saldo, para não inventar janela.
   */
  cycleEndsAt: string | null;
  /**
   * Quantos appointments do cliente estão vinculados a ESTE contrato via
   * crm_appointments.subscription_id. Hoje o vínculo raramente é preenchido;
   * quando é 0, o saldo NÃO é calculável com segurança.
   */
  appointmentsLinkedCount: number;
  /** Contagem parcial linked-only, status=done, dentro do ciclo. */
  performedInCycle: number | null;
  /** Contagem parcial linked-only, status ∈ scheduled/confirmed, dentro do ciclo. */
  reservedInCycle: number | null;
  /** Saldo = incluídas − realizadas − reservadas; só quando calculável com segurança. */
  balance: number | null;
  /** True quando saldo foi calculado (linked-only + ciclo + plano válidos). */
  balanceCanCalculate: boolean;
  /** Explicação PT quando saldo não é calculável — nunca exibir 0 como uso real. */
  note: string | null;
}

export interface SubscriptionListRow {
  id: string;
  plan: string;
  modality: DgnBillingModality | "Outra";
  status: string;
  isActive: boolean;
  source: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentEvidenceSource: string;
  paymentVerificationStatus: string;
  paymentMethodLabel: string | null;
  lastPaymentConfirmedAt: string | null;
  lastVerifiedAt: string | null;
  cycleEndsAt: string | null;
  nextDueDate: string | null;
  vehicleId: string | null;
  sourceReference: string | null;
  notes: string | null;
  pagBankLocked: boolean;
  financialReviewRequired: boolean;
  financialReviewReason: string | null;
  usage: SubscriptionUsage;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionRowRaw {
  id: string;
  customer_id: string;
  subscription_plan: string;
  subscription_cycle: string;
  subscription_status: string;
  is_active_subscriber: boolean;
  subscription_source: string;
  payment_method: string;
  payment_status: string;
  payment_evidence_source: string;
  payment_verification_status: string;
  last_payment_confirmed_at: string | null;
  last_verified_at: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  cycle_ends_at: string | null;
  next_due_date: string | null;
  vehicle_id: string | null;
  source_reference: string | null;
  notes: string | null;
  financial_review_required: boolean;
  financial_review_reason: string | null;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Lavagens incluídas por plano. Regra oficial da campanha DGN Founder 2026:
//   Essential = 1/mês · Smart = 2/mês · Priority = 4/mês
// Qualquer outro valor (Não identificado, Corporate Care, legado) → null,
// e a UI NÃO calcula saldo — evita mostrar 0 como se fosse uso real.
// -----------------------------------------------------------------------------
export function includedPerMonthFromPlan(plan: string): number | null {
  switch (plan) {
    case "Essential": return 1;
    case "Smart":     return 2;
    case "Priority":  return 4;
    default:          return null;
  }
}

export function cycleMonthsFromDbCycle(cycle: string): number | null {
  switch (cycle) {
    case "mensal":    return 1;
    case "semestral": return 6;
    case "anual":     return 12;
    default:          return null; // "outro" | "não identificado"
  }
}

interface AppointmentAggregate {
  subscription_id: string;
  status: string;
  scheduled_at: string;
}

/**
 * Calcula usage por contrato SEM inventar dado. Regras:
 *  - includedPerMonth só quando plano é oficial.
 *  - cycleMonths só quando cycle é mensal/semestral/anual.
 *  - Contadores só contam appointments com subscription_id = ID desta sub
 *    (o CRM hoje tem essa coluna quase sempre NULL — nesse caso, saldo NÃO
 *    é calculável e o note explica).
 *  - Ciclo mensal usa janela [cycle_ends_at - 30d, cycle_ends_at]; semestral
 *    -180d, anual -365d. Se cycle_ends_at é NULL, saldo não calculável.
 */
export function computeUsage(
  row: SubscriptionRowRaw,
  linkedAppointments: AppointmentAggregate[],
): SubscriptionUsage {
  const includedPerMonth = includedPerMonthFromPlan(row.subscription_plan);
  const cycleMonths = cycleMonthsFromDbCycle(row.subscription_cycle);
  const includedPerCycle =
    includedPerMonth != null && cycleMonths != null ? includedPerMonth * cycleMonths : null;

  const linkedForThis = linkedAppointments.filter((a) => a.subscription_id === row.id);
  const appointmentsLinkedCount = linkedForThis.length;

  let performedInCycle: number | null = null;
  let reservedInCycle: number | null = null;
  let balance: number | null = null;
  let canCalculate = false;
  let note: string | null = null;

  if (includedPerMonth == null) {
    note = "Plano fora da tabela oficial — lavagens incluídas indeterminadas.";
  } else if (cycleMonths == null) {
    note = "Modalidade legada — ciclo não determinável; saldo não calculável.";
  } else if (!row.cycle_ends_at) {
    note = "Sem fim de vigência definido no CRM — saldo não calculável.";
  } else if (appointmentsLinkedCount === 0) {
    note = "Saldo não calculável — atendimentos ainda não vinculados ao contrato.";
  } else {
    const end = new Date(row.cycle_ends_at);
    const startMs = end.getTime() - cycleMonths * 30 * 24 * 60 * 60 * 1000;
    const inCycle = linkedForThis.filter((a) => {
      const t = new Date(a.scheduled_at).getTime();
      return t >= startMs && t <= end.getTime();
    });
    performedInCycle = inCycle.filter((a) => a.status === "done").length;
    reservedInCycle = inCycle.filter((a) => a.status === "scheduled" || a.status === "confirmed").length;
    balance = (includedPerCycle ?? 0) - performedInCycle - reservedInCycle;
    canCalculate = true;
  }

  return {
    includedPerMonth,
    cycleMonths,
    includedPerCycle,
    cycleEndsAt: row.cycle_ends_at,
    appointmentsLinkedCount,
    performedInCycle,
    reservedInCycle,
    balance,
    balanceCanCalculate: canCalculate,
    note,
  };
}

function mapRow(row: SubscriptionRowRaw, linkedAppointments: AppointmentAggregate[]): SubscriptionListRow {
  return {
    id: row.id,
    plan: row.subscription_plan,
    modality: dbCycleToModality(row.subscription_cycle),
    status: row.subscription_status,
    isActive: row.is_active_subscriber,
    source: row.subscription_source,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    paymentEvidenceSource: row.payment_evidence_source,
    paymentVerificationStatus: row.payment_verification_status,
    paymentMethodLabel: paymentMethodLabel(row.payment_method),
    lastPaymentConfirmedAt: row.last_payment_confirmed_at,
    lastVerifiedAt: row.last_verified_at,
    cycleEndsAt: row.cycle_ends_at,
    nextDueDate: row.next_due_date,
    vehicleId: row.vehicle_id,
    sourceReference: row.source_reference,
    notes: row.notes,
    pagBankLocked: !!(row.provider_customer_id || row.provider_subscription_id),
    financialReviewRequired: !!row.financial_review_required,
    financialReviewReason: row.financial_review_reason,
    usage: computeUsage(row, linkedAppointments),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function paymentMethodLabel(method: string): string {
  switch (method) {
    case "card_recurring": return "Recorrência no cartão (PagBank)";
    case "manual":         return "Cobrança manual";
    case "unknown":        return "Não identificada";
    default:               return method;
  }
}

export async function listSubscriptions(
  customerId: string,
  db: SupabaseClient = getSupabaseAdminClient("subscriptions.list"),
): Promise<SubscriptionListRow[]> {
  const resolvedId = await resolve(db, customerId);
  const { data, error } = await db
    .from("crm_subscriptions")
    .select(
      "id, customer_id, subscription_plan, subscription_cycle, subscription_status, is_active_subscriber, subscription_source, payment_method, payment_status, payment_evidence_source, payment_verification_status, last_payment_confirmed_at, last_verified_at, provider_customer_id, provider_subscription_id, cycle_ends_at, next_due_date, vehicle_id, source_reference, notes, financial_review_required, financial_review_reason, created_at, updated_at",
    )
    .eq("customer_id", resolvedId)
    .order("is_active_subscriber", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new SubscriptionsWriteError(`Falha ao listar assinaturas: ${error.message}`, 502);

  const rows = (data ?? []) as SubscriptionRowRaw[];
  // Busca appointments vinculados a QUALQUER sub deste cliente (só quando há subs)
  // — pequena query extra, evita N+1 por sub. Filtra depois em memória.
  let linked: AppointmentAggregate[] = [];
  if (rows.length > 0) {
    const appt = await db
      .from("crm_appointments")
      .select("subscription_id, status, scheduled_at")
      .eq("customer_id", resolvedId)
      .not("subscription_id", "is", null);
    if (appt.error) throw new SubscriptionsWriteError(`Falha ao consultar agendamentos: ${appt.error.message}`, 502);
    linked = ((appt.data ?? []) as AppointmentAggregate[]).filter((a) => a.subscription_id);
  }
  return rows.map((r) => mapRow(r, linked));
}

// -----------------------------------------------------------------------------
// Create
// -----------------------------------------------------------------------------
export interface CreateSubscriptionInput {
  customerId: string;
  plan: string;              // "Essential" | "Smart" | "Priority"
  modality: string;          // "Mensal" | "Fidelidade de 6 meses" | "Fidelidade de 12 meses"
  vehicleId?: string | null;
  cycleEndsAt?: string | null;
  paymentStatus?: "confirmed" | "pending" | "failed" | "refunded" | "unknown";
  paymentEvidenceSource?: "manual" | "legacy" | "unknown"; // provider bloqueado no server
  sourceReference: string;   // motivo humano/curadoria obrigatório
  notes?: string | null;
  actor: string;
  db?: SupabaseClient;
}

export interface CreateSubscriptionResult {
  resultCode: "CREATED" | "REVIEW_EXISTING_SUBSCRIPTION";
  subscriptionId: string | null;
  existingSubscriptionId: string | null;
}

export async function createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
  const db = input.db ?? getSupabaseAdminClient("subscriptions.create");
  const resolvedCustomerId = await resolve(db, input.customerId);

  const plan = ensurePlan(input.plan);
  const cycle = modalityToDbCycle(input.modality);
  const cycleEndsAtIso = parseCycleEndsAtIso(input.cycleEndsAt);

  if (input.paymentEvidenceSource === "provider" as unknown as string) {
    throw new SubscriptionsWriteError("Evidência 'provider' não é permitida em criação manual.", 400);
  }

  const source = (input.sourceReference ?? "").trim();
  if (!source) throw new SubscriptionsWriteError("Motivo/origem obrigatório (source_reference).", 400);

  if (input.vehicleId) {
    const veh = await db
      .from("crm_vehicles")
      .select("id, customer_id")
      .eq("id", input.vehicleId)
      .maybeSingle();
    if (veh.error && veh.error.code !== "PGRST116") {
      throw new SubscriptionsWriteError(`Falha ao consultar veículo: ${veh.error.message}`, 502);
    }
    if (!veh.data) throw new SubscriptionsWriteError("Veículo não encontrado.", 404);
    if ((veh.data as { customer_id: string }).customer_id !== resolvedCustomerId) {
      throw new SubscriptionsWriteError("Veículo pertence a outro cliente.", 403);
    }
  }

  const rpc = await db.rpc("crm_create_manual_subscription", {
    p_customer_id: resolvedCustomerId,
    p_plan: plan,
    p_cycle: cycle,
    p_payment_status: input.paymentStatus ?? "unknown",
    p_payment_evidence_source: input.paymentEvidenceSource ?? "manual",
    p_source_reference: source,
    p_vehicle_id: input.vehicleId ?? null,
    p_cycle_ends_at: cycleEndsAtIso,
    p_notes: input.notes ?? null,
    p_actor: input.actor || "dgn-admin",
  });
  if (rpc.error) throw new SubscriptionsWriteError(`Falha ao criar assinatura: ${rpc.error.message}`, 502);
  const rows = (rpc.data ?? []) as Array<{ result_code?: string; subscription_id?: string; existing_subscription_id?: string }>;
  const row = rows[0] ?? {};
  const code = row.result_code === "CREATED" || row.result_code === "REVIEW_EXISTING_SUBSCRIPTION"
    ? row.result_code
    : null;
  if (!code) throw new SubscriptionsWriteError("Retorno inesperado da RPC de criação.", 502);
  return {
    resultCode: code,
    subscriptionId: row.subscription_id ?? null,
    existingSubscriptionId: row.existing_subscription_id ?? null,
  };
}

// -----------------------------------------------------------------------------
// Edit
// -----------------------------------------------------------------------------
export interface EditSubscriptionInput {
  customerId: string;
  subscriptionId: string;
  actor: string;
  reason: string;
  plan?: string | null;
  modality?: string | null;
  vehicleId?: string | null;
  clearVehicle?: boolean;
  cycleEndsAt?: string | null;
  clearCycleEndsAt?: boolean;
  paymentStatus?: "confirmed" | "pending" | "failed" | "refunded" | "unknown";
  paymentEvidenceSource?: "manual" | "legacy" | "unknown";
  sourceReference?: string | null;
  notes?: string | null;
  db?: SupabaseClient;
}

export interface EditSubscriptionResult {
  resultCode: "UPDATED" | "NO_CHANGE";
  subscriptionId: string;
}

export async function editSubscription(input: EditSubscriptionInput): Promise<EditSubscriptionResult> {
  const db = input.db ?? getSupabaseAdminClient("subscriptions.edit");
  const resolvedCustomerId = await resolve(db, input.customerId);

  const reason = (input.reason ?? "").trim();
  if (!reason) throw new SubscriptionsWriteError("Motivo da alteração é obrigatório.", 400);

  const p_plan = input.plan != null ? ensurePlan(input.plan) : null;
  const p_cycle = input.modality != null ? modalityToDbCycle(input.modality) : null;
  const p_cycle_ends_at = input.cycleEndsAt != null ? parseCycleEndsAtIso(input.cycleEndsAt) : null;

  if (input.paymentEvidenceSource === "provider" as unknown as string) {
    throw new SubscriptionsWriteError("Evidência 'provider' não permitida em edição manual.", 400);
  }

  if (input.vehicleId && !input.clearVehicle) {
    const veh = await db
      .from("crm_vehicles")
      .select("id, customer_id")
      .eq("id", input.vehicleId)
      .maybeSingle();
    if (veh.error && veh.error.code !== "PGRST116") {
      throw new SubscriptionsWriteError(`Falha ao consultar veículo: ${veh.error.message}`, 502);
    }
    if (!veh.data) throw new SubscriptionsWriteError("Veículo não encontrado.", 404);
    if ((veh.data as { customer_id: string }).customer_id !== resolvedCustomerId) {
      throw new SubscriptionsWriteError("Veículo pertence a outro cliente.", 403);
    }
  }

  const rpc = await db.rpc("crm_edit_manual_subscription", {
    p_subscription_id: input.subscriptionId,
    p_expected_customer_id: resolvedCustomerId,
    p_actor: input.actor || "dgn-admin",
    p_reason: reason,
    p_plan,
    p_cycle,
    p_vehicle_id: input.clearVehicle ? null : input.vehicleId ?? null,
    p_clear_vehicle: !!input.clearVehicle,
    p_cycle_ends_at,
    p_clear_cycle_ends_at: !!input.clearCycleEndsAt,
    p_payment_status: input.paymentStatus ?? null,
    p_payment_evidence_source: input.paymentEvidenceSource ?? null,
    p_source_reference: input.sourceReference ?? null,
    p_notes: input.notes ?? null,
  });
  if (rpc.error) {
    if (/vinculada a provider|edição manual bloqueada/i.test(rpc.error.message)) {
      throw new SubscriptionsWriteError(
        "Este contrato é PagBank recorrente. Alterações são feitas pelo importer, não pelo editor manual.",
        409,
      );
    }
    throw new SubscriptionsWriteError(`Falha ao editar assinatura: ${rpc.error.message}`, 502);
  }
  const rows = (rpc.data ?? []) as Array<{ result_code?: string; subscription_id?: string }>;
  const row = rows[0] ?? {};
  const code = row.result_code === "UPDATED" || row.result_code === "NO_CHANGE" ? row.result_code : null;
  if (!code) throw new SubscriptionsWriteError("Retorno inesperado da RPC de edição.", 502);
  return { resultCode: code, subscriptionId: row.subscription_id ?? input.subscriptionId };
}

// -----------------------------------------------------------------------------
// Cancel
// -----------------------------------------------------------------------------
export interface CancelSubscriptionInput {
  customerId: string;
  subscriptionId: string;
  reason: string;
  actor: string;
  db?: SupabaseClient;
}

export interface CancelSubscriptionResult {
  resultCode: "CANCELLED" | "ALREADY_CANCELLED";
  subscriptionId: string;
}

export async function cancelSubscription(input: CancelSubscriptionInput): Promise<CancelSubscriptionResult> {
  const db = input.db ?? getSupabaseAdminClient("subscriptions.cancel");
  const resolvedCustomerId = await resolve(db, input.customerId);
  const reason = (input.reason ?? "").trim();
  if (!reason) throw new SubscriptionsWriteError("Motivo do cancelamento é obrigatório.", 400);

  const rpc = await db.rpc("crm_cancel_manual_subscription", {
    p_subscription_id: input.subscriptionId,
    p_expected_customer_id: resolvedCustomerId,
    p_actor: input.actor || "dgn-admin",
    p_reason: reason,
  });
  if (rpc.error) {
    if (/vinculada a provider|cancelamento manual bloqueado/i.test(rpc.error.message)) {
      throw new SubscriptionsWriteError(
        "Este contrato é PagBank recorrente. Cancelamento vai pelo importer, não pelo editor manual.",
        409,
      );
    }
    throw new SubscriptionsWriteError(`Falha ao cancelar assinatura: ${rpc.error.message}`, 502);
  }
  const rows = (rpc.data ?? []) as Array<{ result_code?: string; subscription_id?: string }>;
  const row = rows[0] ?? {};
  const code = row.result_code === "CANCELLED" || row.result_code === "ALREADY_CANCELLED"
    ? row.result_code
    : null;
  if (!code) throw new SubscriptionsWriteError("Retorno inesperado da RPC de cancelamento.", 502);
  return { resultCode: code, subscriptionId: row.subscription_id ?? input.subscriptionId };
}
