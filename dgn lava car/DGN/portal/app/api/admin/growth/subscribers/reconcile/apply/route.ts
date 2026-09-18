import type { NextRequest } from "next/server";
import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "@/lib/growth/admin-session";
import { loadGrowthData, readGrowthSnapshot } from "@/lib/growth/db/growth-reader";
import { getSupabaseAdminClient } from "@/lib/growth/db/admin-client";
import { parseReconcileInput } from "@/lib/growth/reconcile/parser";
import { reconcile } from "@/lib/growth/reconcile/reconciler";
import {
  buildDgnIdToUuidMap,
  buildUuidToDgnIdMap,
  mapSubscriptionsForReconciler,
  mapVehiclesForReconciler,
} from "@/lib/growth/reconcile/snapshot";
import {
  isAllowedForApply,
  planApplyDecision,
  toResultCode,
  type ApplyExpectedClassification,
  type ApplyResultCode,
} from "@/lib/growth/reconcile/apply";
import type { ReconcileInputRow } from "@/lib/growth/reconcile/types";

// ---------------------------------------------------------------------------
// POST /api/admin/growth/subscribers/reconcile/apply
//
// Recebe { text, selections: [{ rowIndex, expectedClassification,
//   expectedSubscriptionId?, expectedCustomerId? }] }. NÃO recebe
// proposedAction — o server rereparse, rereconcilia contra snapshot fresh
// e só então executa PROMOTE ou CREATE via RPCs homologadas em prod. O
// browser não decide nenhum write.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTOR = "dgn-admin";

async function authorize(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get(DGN_ADMIN_COOKIE)?.value;
  return validateAdminSessionToken(session);
}

function badRequest(message: string) { return Response.json({ error: message }, { status: 400 }); }
function isObject(v: unknown): v is Record<string, unknown> { return typeof v === "object" && v !== null && !Array.isArray(v); }

interface RawSelection {
  rowIndex: number;
  expectedClassification: ApplyExpectedClassification;
  expectedSubscriptionId?: string;
  expectedCustomerId?: string;
}

function coerceSelection(raw: unknown): RawSelection | null {
  if (!isObject(raw)) return null;
  const rowIndex = raw.rowIndex;
  const cls = raw.expectedClassification;
  if (typeof rowIndex !== "number" || !Number.isInteger(rowIndex) || rowIndex < 0) return null;
  if (cls !== "PROMOTE_EXISTING" && cls !== "CREATE_NEW") return null;
  return {
    rowIndex,
    expectedClassification: cls,
    expectedSubscriptionId: typeof raw.expectedSubscriptionId === "string" ? raw.expectedSubscriptionId : undefined,
    expectedCustomerId: typeof raw.expectedCustomerId === "string" ? raw.expectedCustomerId : undefined,
  };
}

interface ItemResult {
  rowIndex: number;
  input: ReconcileInputRow;
  customerId: string | null;
  classificationBeforeApply: string;
  action: "PROMOTE_EXISTING" | "CREATE_NEW" | "NONE";
  resultCode: ApplyResultCode;
  subscriptionId: string | null;
  existingSubscriptionId?: string | null;
  reason?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  if (!(await authorize(request))) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("JSON inválido."); }
  if (!isObject(body)) return badRequest("payload inválido");

  const text = typeof body.text === "string" ? body.text : "";
  const rawSelections = Array.isArray(body.selections) ? body.selections : null;
  if (!text.trim() || !rawSelections || rawSelections.length === 0) {
    return badRequest("informe 'text' (relatório) e 'selections' (não vazio).");
  }

  const selections = rawSelections.map(coerceSelection).filter((s): s is RawSelection => s !== null);
  if (selections.length === 0) return badRequest("nenhuma seleção válida (classification precisa ser PROMOTE_EXISTING ou CREATE_NEW).");

  const parsed = parseReconcileInput(text);
  if (parsed.rows.length === 0) return badRequest("relatório sem linhas parseáveis.");

  // Validar índices ANTES de carregar snapshot
  for (const s of selections) {
    if (s.rowIndex >= parsed.rows.length) {
      return badRequest(`rowIndex ${s.rowIndex} fora do relatório (${parsed.rows.length} linhas).`);
    }
  }

  // Snapshot fresh + rereconcile
  let data: Awaited<ReturnType<typeof loadGrowthData>>;
  let uuidToDgn: Map<string, string>;
  let dgnToUuid: Map<string, string>;
  let preview: ReturnType<typeof reconcile>;
  try {
    data = await loadGrowthData({ logger: console });
    const snapshot = data.origin === "db"
      ? await readGrowthSnapshot(getSupabaseAdminClient("subscriber-reconcile.apply"))
      : { customers: [], subscriptions: [], vehicles: [] };
    uuidToDgn = buildUuidToDgnIdMap(snapshot.customers ?? []);
    dgnToUuid = buildDgnIdToUuidMap(snapshot.customers ?? []);
    preview = reconcile({
      rows: parsed.rows,
      customers: data.customers,
      subscriptions: mapSubscriptionsForReconciler(snapshot.subscriptions ?? [], uuidToDgn),
      vehicles: mapVehiclesForReconciler(snapshot.vehicles ?? [], uuidToDgn),
      dataOrigin: data.origin,
    });
  } catch (error) {
    console.error("[reconcile.apply] snapshot fresh falhou", error);
    return Response.json({ error: "Falha ao revalidar snapshot canônico." }, { status: 500 });
  }

  const supabase = getSupabaseAdminClient("subscriber-reconcile.apply.write");
  const results: ItemResult[] = [];

  for (const selection of selections) {
    const freshItem = preview.items[selection.rowIndex]!;
    const decision = planApplyDecision(selection, freshItem);

    if (decision.outcome !== "PROCEED") {
      results.push({
        rowIndex: selection.rowIndex,
        input: freshItem.input,
        customerId: freshItem.customer.customerId,
        classificationBeforeApply: freshItem.classification,
        action: "NONE",
        resultCode: toResultCode(decision.outcome),
        subscriptionId: null,
        reason: decision.reason,
      });
      continue;
    }

    if (!isAllowedForApply(freshItem.classification)) {
      // Redundante (planApplyDecision já protege), mas defesa em profundidade.
      results.push({
        rowIndex: selection.rowIndex, input: freshItem.input, customerId: freshItem.customer.customerId,
        classificationBeforeApply: freshItem.classification, action: "NONE",
        resultCode: "STALE_PREVIEW_REVIEW_REQUIRED", subscriptionId: null,
        reason: "Classificação não é PROMOTE_EXISTING/CREATE_NEW após revalidação.",
      });
      continue;
    }

    const action = decision.action!;
    try {
      if (action.kind === "PROMOTE_EXISTING") {
        const expectedUuid = dgnToUuid.get(action.expectedCustomerId) ?? action.expectedCustomerId;
        const rpc = await supabase.rpc("crm_promote_existing_subscription", {
          p_subscription_id: action.subscriptionId,
          p_expected_customer_id: expectedUuid,
          p_actor: ACTOR,
          p_reason: `Reconciliador (Digo) ${new Date().toISOString().slice(0, 10)}: promoção seletiva confirmada humanamente.`,
          p_payment_status: action.paymentStatus,
          p_payment_evidence_source: action.paymentEvidenceSource,
          p_cycle_ends_at: action.cycleEndsAtIso,
          p_notes_append: action.notesAppend,
        });
        if (rpc.error) throw new Error(rpc.error.message);
        results.push({
          rowIndex: selection.rowIndex, input: freshItem.input, customerId: freshItem.customer.customerId,
          classificationBeforeApply: freshItem.classification, action: "PROMOTE_EXISTING",
          resultCode: "PROMOTED", subscriptionId: action.subscriptionId,
          reason: "Subscription promovida via crm_promote_existing_subscription.",
        });
      } else {
        const customerUuid = dgnToUuid.get(action.customerId) ?? action.customerId;
        const rpc = await supabase.rpc("crm_create_manual_subscription", {
          p_customer_id: customerUuid,
          p_plan: action.plan,
          p_cycle: action.cycle,
          p_payment_status: action.paymentStatus,
          p_payment_evidence_source: action.paymentEvidenceSource,
          p_source_reference: action.sourceReference,
          p_vehicle_id: action.vehicleId,
          p_cycle_ends_at: action.cycleEndsAtIso,
          p_notes: action.notes,
          p_actor: ACTOR,
        });
        if (rpc.error) throw new Error(rpc.error.message);
        const rows = (rpc.data ?? []) as Array<{ result_code?: string; subscription_id?: string; existing_subscription_id?: string }>;
        const row = rows[0] ?? {};
        const code = row.result_code;
        const resultCode = toResultCode("PROCEED", { code });
        results.push({
          rowIndex: selection.rowIndex, input: freshItem.input, customerId: freshItem.customer.customerId,
          classificationBeforeApply: freshItem.classification, action: "CREATE_NEW",
          resultCode, subscriptionId: row.subscription_id ?? null,
          existingSubscriptionId: row.existing_subscription_id ?? null,
          reason: resultCode === "CREATED"
            ? "Subscription manual criada via crm_create_manual_subscription."
            : resultCode === "REVIEW_EXISTING_SUBSCRIPTION"
              ? "Já existe subscription equivalente. Revisar antes de duplicar."
              : "Retorno inesperado da RPC.",
        });
      }
    } catch (error) {
      results.push({
        rowIndex: selection.rowIndex, input: freshItem.input, customerId: freshItem.customer.customerId,
        classificationBeforeApply: freshItem.classification,
        action: action.kind === "PROMOTE_EXISTING" ? "PROMOTE_EXISTING" : "CREATE_NEW",
        resultCode: "FAILED", subscriptionId: null,
        error: error instanceof Error ? error.message : "erro desconhecido",
      });
    }
  }

  const counts = {
    proceed: results.filter((r) => r.resultCode === "PROMOTED" || r.resultCode === "CREATED").length,
    stale: results.filter((r) => r.resultCode === "STALE_PREVIEW_REVIEW_REQUIRED").length,
    alreadyCorrect: results.filter((r) => r.resultCode === "ALREADY_CORRECT").length,
    reviewExisting: results.filter((r) => r.resultCode === "REVIEW_EXISTING_SUBSCRIPTION").length,
    failed: results.filter((r) => r.resultCode === "FAILED").length,
  };

  return Response.json({
    processed: results.length,
    counts,
    results,
    note: "Nenhuma cobrança PagBank foi alterada. Provisão em provider_customer_id/provider_subscription_id preservada.",
  });
}
