import type { NextRequest } from "next/server";
import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "@/lib/growth/admin-session";
import { loadGrowthData, readGrowthSnapshot } from "@/lib/growth/db/growth-reader";
import { getSupabaseAdminClient } from "@/lib/growth/db/admin-client";
import { parseReconcileInput } from "@/lib/growth/reconcile/parser";
import { reconcile } from "@/lib/growth/reconcile/reconciler";
import {
  buildUuidToDgnIdMap,
  mapSubscriptionsForReconciler,
  mapVehiclesForReconciler,
} from "@/lib/growth/reconcile/snapshot";
import type { ReconcileInputRow } from "@/lib/growth/reconcile/types";

// ---------------------------------------------------------------------------
// POST /api/admin/growth/subscribers/reconcile
// Endpoint READ-ONLY. Nunca escreve. Aceita { text } (para colar CSV/TSV) ou
// { items[] } (JSON estruturado). Devolve preview determinístico.
// APPLY vive num endpoint separado (fase seguinte, não neste PR).
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorize(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get(DGN_ADMIN_COOKIE)?.value;
  return validateAdminSessionToken(session);
}

function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

function isRowObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function coerceInputRow(raw: unknown): ReconcileInputRow | null {
  if (!isRowObject(raw)) return null;
  const row: ReconcileInputRow = {};
  const fields: Array<keyof ReconcileInputRow> = [
    "name", "phone", "plate", "plan", "status", "cycle",
    "paid_until", "payment_method", "notes", "source",
  ];
  for (const f of fields) {
    const v = raw[f];
    if (typeof v === "string" && v.trim().length > 0) row[f] = v.trim();
  }
  return Object.keys(row).length > 0 ? row : null;
}

export async function POST(request: NextRequest) {
  if (!(await authorize(request))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON inválido.");
  }
  if (!isRowObject(body)) return badRequest("payload inválido — esperado objeto");

  let rows: ReconcileInputRow[] = [];
  let unknownHeaders: string[] = [];
  let emptyRowsIgnored = 0;

  const textField = (body as { text?: unknown }).text;
  const itemsField = (body as { items?: unknown }).items;

  if (typeof textField === "string" && textField.trim().length > 0) {
    const parsed = parseReconcileInput(textField);
    rows = parsed.rows;
    unknownHeaders = parsed.unknownHeaders;
    emptyRowsIgnored = parsed.emptyRowsIgnored;
  } else if (Array.isArray(itemsField)) {
    rows = itemsField
      .map(coerceInputRow)
      .filter((r): r is ReconcileInputRow => r !== null);
  } else {
    return badRequest("informe 'text' (string CSV/TSV) ou 'items' (array de objetos).");
  }

  if (rows.length === 0) {
    return Response.json({
      totalRows: 0,
      counts: {
        ALREADY_CORRECT: 0, PROMOTE_EXISTING: 0, UPDATE_EXISTING_REVIEW: 0,
        CREATE_NEW: 0, RENEWAL_PENDING: 0, CUSTOMER_NOT_FOUND: 0,
        POSSIBLE_MATCH: 0, CONFLICT: 0,
      },
      items: [],
      dataOrigin: "db",
      summary: "Nenhuma linha para reconciliar.",
      unknownHeaders,
      emptyRowsIgnored,
    });
  }

  // Fonte canônica: loadGrowthData (customers enriquecidos) + snapshot bruto
  // (customers+subscriptions+vehicles completos para suportar multi-sub por
  // customer). O snapshot bruto também alimenta o remap UUID → DgnCustomer.id,
  // sem o qual subs de customers com legacy_id (padrão dos promovidos no
  // Lote 1) somem para o matcher — bug real observado no smoke 2026-09-17.
  try {
    const data = await loadGrowthData({ logger: console });
    const snapshot = data.origin === "db"
      ? await readGrowthSnapshot(getSupabaseAdminClient("subscriber-reconcile.read"))
      : { customers: [], subscriptions: [], vehicles: [] };

    const uuidToDgnId = buildUuidToDgnIdMap(snapshot.customers ?? []);
    const subscriptions = mapSubscriptionsForReconciler(snapshot.subscriptions ?? [], uuidToDgnId);
    const vehicles = mapVehiclesForReconciler(snapshot.vehicles ?? [], uuidToDgnId);

    const preview = reconcile({
      rows,
      customers: data.customers,
      subscriptions,
      vehicles,
      dataOrigin: data.origin,
    });

    return Response.json({ ...preview, unknownHeaders, emptyRowsIgnored });
  } catch (error) {
    console.error("[reconcile] falha", error instanceof Error ? error.message : "erro");
    return Response.json(
      { error: "Falha ao carregar snapshot canônico para reconciliar." },
      { status: 500 },
    );
  }
}
