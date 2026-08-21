import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  EvoReconcileState,
  EvoSaleProcessingStatus,
} from "../../supabase/types";
import { createEvoClient } from "./client";
import { classifySale, evaluatePayment } from "./rules";
import type { EvoClient } from "./types";
import {
  getEvoDefaultOrgSlug,
  getMissingEvoEnvs,
} from "./env";
import { deliverPaidConversion } from "../../conversions/deliver";
import type { UtmifyOrdersClient } from "../utmify/orders";
import { timingSafeEqual } from "node:crypto";

// Reconciliação de vendas EVO — chamada pelo cron da Vercel em produção
// (`GET /api/cron/reconcile-evo-pending`) com Bearer $CRON_SECRET.
//
// Contrato:
//   * `?hours=N`         janela em horas (default 24, max 168)
//   * `?take=N`          page size (default 100, max 200)
//   * `?idBranch=X`      filtra por branch (opcional)
//   * `?dryRun=1`        (default) NÃO chama UTMify — só simula e devolve
//                        counters. Envie `?dryRun=0` para efetivar.
//   * `?force=1`         ignora cooldown de 1h (uso operacional; NÃO usar
//                        no cron periódico)
//
// Rate limit interno: cada (org, id_branch) só pode ser reconciliado uma
// vez por hora. Estado persistido em `evo_reconcile_state`. Sobreposição
// de 10 min entre janelas garante que nenhum recebível confirmado entre
// execuções seja perdido.
//
// Filtro `onlyMembership=true` na EVO reduz o volume às vendas de
// matrícula (ainda passa pelo classifySale para descartar renovações).
// Cancelamento de rate-limited devolve HTTP 429 imediatamente — todas as
// próximas páginas/branches bateriam no mesmo limite diário.

type Admin = SupabaseClient<Database>;

const DEFAULT_HOURS = 24;
const DEFAULT_TAKE = 100;
const MAX_PAGES = 10; // proteção: até 1000 vendas por execução
const COOLDOWN_MS = 60 * 60 * 1_000; // 1h por (org, branch)
const WINDOW_OVERLAP_MS = 10 * 60 * 1_000; // 10 min de sobreposição

export type ReconcileDeps = {
  admin: Admin;
  evoClient?: EvoClient;
  utmifyOrdersClient?: UtmifyOrdersClient;
  // Injetável para teste — em produção `Date.now()`.
  nowMs?: () => number;
};

type Counters = {
  fetched: number;
  paid: number;
  cancelled: number;
  pending: number;
  eligible: number;
  excluded_renewal: number;
  excluded_product: number;
  excluded_service: number;
  excluded_no_membership: number;
  excluded_cancelled: number;
  excluded_not_paid: number;
  delivery_sent: number;
  delivery_failed: number;
  delivery_skipped: number;
  delivery_would_send: number;
  pages: number;
  windowStart: string;
  windowEnd: string;
  dryRun: boolean;
  cooldownActive: boolean;
};

export async function handleEvoReconcile(
  request: Request,
  deps: ReconcileDeps,
): Promise<Response> {
  // --- 1. Auth (Bearer CRON_SECRET) ----------------------------------
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "cron-not-configured", missing: ["CRON_SECRET"] },
      { status: 503 },
    );
  }
  const authHeader = request.headers.get("authorization") ?? "";
  const providedToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!providedToken || !safeEqual(providedToken, secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // --- 2. Envs EVO e org ---------------------------------------------
  const missing = getMissingEvoEnvs();
  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, error: "not-configured", missing },
      { status: 503 },
    );
  }
  const orgSlug = getEvoDefaultOrgSlug();
  if (!orgSlug) {
    return NextResponse.json(
      { ok: false, error: "not-configured", missing: ["EVO_DEFAULT_ORGANIZATION_SLUG"] },
      { status: 503 },
    );
  }

  const admin = deps.admin;
  const org = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (org.error || !org.data) {
    return NextResponse.json(
      { ok: false, error: "org-not-found", slug: orgSlug },
      { status: 500 },
    );
  }
  const organizationId = org.data.id;

  // --- 3. Parâmetros da janela ---------------------------------------
  const url = new URL(request.url);
  const hoursParam = Number(url.searchParams.get("hours") ?? "");
  const hours = Number.isFinite(hoursParam) && hoursParam > 0 && hoursParam <= 168
    ? hoursParam
    : DEFAULT_HOURS;
  const takeParam = Number(url.searchParams.get("take") ?? "");
  const take = Number.isFinite(takeParam) && takeParam > 0 && takeParam <= 200
    ? takeParam
    : DEFAULT_TAKE;
  const idBranch = url.searchParams.get("idBranch") || null;
  // dryRun default true. Só executa envio se explicitamente passar dryRun=0.
  const dryRunParam = url.searchParams.get("dryRun");
  const dryRun = dryRunParam !== "0" && dryRunParam !== "false";
  const force = url.searchParams.get("force") === "1";

  const nowMs = deps.nowMs ? deps.nowMs() : Date.now();
  const now = new Date(nowMs);

  // --- 4. Cooldown + cursor persistente ------------------------------
  const stateRow = await readReconcileState(admin, organizationId, idBranch);

  if (!force && stateRow && nowMs - Date.parse(stateRow.last_run_at) < COOLDOWN_MS) {
    const secondsLeft = Math.round(
      (COOLDOWN_MS - (nowMs - Date.parse(stateRow.last_run_at))) / 1000,
    );
    return NextResponse.json(
      {
        ok: true,
        skipped: "cooldown-active",
        idBranch,
        lastRunAt: stateRow.last_run_at,
        secondsUntilNextRun: secondsLeft,
      },
      { status: 200 },
    );
  }

  // Início: janela vem do cursor (com sobreposição) OU do `hours`
  // — o que for maior/mais recente.
  const start = pickWindowStart(nowMs, hours, stateRow);
  const windowStart = isoUtc(start);
  const windowEnd = isoUtc(now);

  // --- 5. Loop paginado ----------------------------------------------
  const evo = deps.evoClient ?? createEvoClient();
  const counters: Counters = {
    fetched: 0,
    paid: 0,
    cancelled: 0,
    pending: 0,
    eligible: 0,
    excluded_renewal: 0,
    excluded_product: 0,
    excluded_service: 0,
    excluded_no_membership: 0,
    excluded_cancelled: 0,
    excluded_not_paid: 0,
    delivery_sent: 0,
    delivery_failed: 0,
    delivery_skipped: 0,
    delivery_would_send: 0,
    pages: 0,
    windowStart,
    windowEnd,
    dryRun,
    cooldownActive: false,
  };

  for (let page = 0; page < MAX_PAGES; page++) {
    const skip = page * take;
    const listed = await evo.listSales({
      updatedReceivableStartDate: windowStart,
      updatedReceivableEndDate: windowEnd,
      take,
      skip,
      idBranch: idBranch ?? undefined,
      onlyMembership: true,
    });
    if (!listed.ok) {
      if (listed.error.code === "rate-limited") {
        return NextResponse.json(
          {
            ok: false,
            error: "evo-rate-limited",
            code: listed.error.code,
            message: listed.error.message,
            counters,
          },
          { status: 429 },
        );
      }
      return NextResponse.json(
        {
          ok: false,
          error: "evo-list-failed",
          code: listed.error.code,
          message: listed.error.message,
          counters,
        },
        { status: 502 },
      );
    }
    if (listed.sales.length === 0) break;
    counters.pages++;
    counters.fetched += listed.sales.length;

    const branchIds = Array.from(new Set(
      listed.sales.map((s) => coerceId(s.idBranch)).filter((x): x is string => x !== null),
    ));
    const branchMap = await resolveBranchMap(admin, branchIds);

    for (const sale of listed.sales) {
      const idBranchStr = coerceId(sale.idBranch);
      const idSaleStr = coerceId(sale.idSale);
      if (!idBranchStr || !idSaleStr) continue;

      const evaluation = evaluatePayment(sale);
      const classification = classifySale(sale);
      const processingStatus: EvoSaleProcessingStatus =
        evaluation.status === "paid"
          ? "paid"
          : evaluation.status === "cancelled"
            ? "cancelled"
            : "pending";
      if (processingStatus === "paid") counters.paid++;
      else if (processingStatus === "cancelled") counters.cancelled++;
      else counters.pending++;

      if (classification.eligible) {
        counters.eligible++;
      } else {
        switch (classification.reason) {
          case "renewal": counters.excluded_renewal++; break;
          case "product-only": counters.excluded_product++; break;
          case "service-only": counters.excluded_service++; break;
          case "no-membership": counters.excluded_no_membership++; break;
          case "cancelled": counters.excluded_cancelled++; break;
          case "not-paid": counters.excluded_not_paid++; break;
        }
      }

      const unitId = branchMap.get(idBranchStr) ?? null;
      const amountPaidCents =
        evaluation.status === "paid" ? evaluation.amountPaidCents : null;
      const saleDate =
        typeof sale.saleDate === "string" && sale.saleDate.length > 0
          ? sale.saleDate
          : null;
      const combinedReason = combineReason(evaluation.reason, classification);

      const upsert = await upsertEvoSale(admin, {
        organizationId,
        unitId,
        idW12: null,
        idBranch: idBranchStr,
        idSale: idSaleStr,
        idMember: coerceId(sale.idMember),
        eventType: "Reconcile",
        amountPaidCents,
        saleDate,
        receivingDate: evaluation.receivingDate,
        paymentType: evaluation.paymentType,
        receivableStatus: evaluation.receivableStatus,
        processingStatus,
        lastReason: combinedReason,
      });
      if (!upsert.ok || !upsert.evoSaleId) continue;

      // Regra de conversão elegível: SÓ envia (ou simula) se paid E
      // classificada como elegível. Idempotência é dupla:
      //   * evo_sales.UNIQUE(id_branch,id_sale) já garantiu 1 row.
      //   * ad_conversion_deliveries.UNIQUE(evo_sale_id, platform) → nunca
      //     enviamos 2x pra mesma (venda, plataforma).
      // Em dry-run NUNCA chamamos deliverPaidConversion — apenas contamos
      // quais conversões SERIAM enviadas.
      if (processingStatus !== "paid" || !classification.eligible) continue;

      if (dryRun) {
        counters.delivery_would_send++;
        continue;
      }

      const outcome = await deliverPaidConversion({
        admin,
        evoClient: evo,
        utmifyOrdersClient: deps.utmifyOrdersClient,
        organizationId,
        memberOverride: sale.member ?? null,
        evoSale: {
          id: upsert.evoSaleId,
          id_branch: idBranchStr,
          id_sale: idSaleStr,
          id_member: coerceId(sale.idMember),
          amount_paid_cents: amountPaidCents,
          sale_date: saleDate,
          receiving_date: evaluation.receivingDate,
          payment_type: evaluation.paymentType,
          processing_status: "paid",
        },
      });
      if ("sent" in outcome) counters.delivery_sent++;
      else if ("failed" in outcome) counters.delivery_failed++;
      else counters.delivery_skipped++;
    }
    if (listed.sales.length < take) break;
  }

  // --- 6. Persiste cursor para próxima execução ----------------------
  await writeReconcileState(admin, {
    organizationId,
    idBranch,
    lastRunAtIso: isoUtc(now),
    windowStartIso: windowStart,
    windowEndIso: windowEnd,
    fetched: counters.fetched,
    paid: counters.paid,
    eligible: counters.eligible,
    dryRun,
  });

  return NextResponse.json({ ok: true, counters }, { status: 200 });
}

// -------- helpers -------------------------------------------------

function isoUtc(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`
  );
}

function coerceId(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function pickWindowStart(
  nowMs: number,
  hours: number,
  state: EvoReconcileState | null,
): Date {
  const defaultStart = new Date(nowMs - hours * 3_600_000);
  if (!state) return defaultStart;
  const cursorMs = Date.parse(state.last_window_end) - WINDOW_OVERLAP_MS;
  if (!Number.isFinite(cursorMs)) return defaultStart;
  // Escolhe o mais RECENTE entre (defaultStart) e (cursor com sobreposição).
  // Se o cursor for muito antigo (ex.: primeira execução após pausa longa),
  // o defaultStart limita a janela ao `hours` requisitado.
  return new Date(Math.max(cursorMs, defaultStart.getTime()));
}

function combineReason(
  paymentReason: string | null,
  classification: ReturnType<typeof classifySale>,
): string | null {
  if (classification.eligible) return paymentReason;
  const parts: string[] = [`excluded:${classification.reason}`];
  if (paymentReason) parts.push(paymentReason);
  return parts.join(" | ");
}

async function resolveBranchMap(admin: Admin, branchIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (branchIds.length === 0) return out;
  for (const id of branchIds) {
    const q = await admin
      .from("evo_branches")
      .select("id_branch, unit_id")
      .eq("id_branch", id)
      .maybeSingle();
    if (q.data && q.data.unit_id) {
      out.set(String(q.data.id_branch), String(q.data.unit_id));
    }
  }
  return out;
}

async function readReconcileState(
  admin: Admin,
  organizationId: string,
  idBranch: string | null,
): Promise<EvoReconcileState | null> {
  // Buscamos pela combinação (org, id_branch). Como id_branch pode ser
  // NULL (varredura global), montamos a query com `.is(...)` nesse caso.
  let query = admin
    .from("evo_reconcile_state")
    .select(
      "organization_id, id_branch, last_run_at, last_window_end, last_window_start, last_fetched, last_paid, last_eligible, last_dry_run, created_at, updated_at",
    )
    .eq("organization_id", organizationId);
  if (idBranch === null) {
    // .is() garante `id_branch is null` no SQL — comparar com null via
    // .eq quebra silenciosamente no PostgREST.
    const anyQ = query as unknown as { is(col: string, val: unknown): typeof query };
    query = anyQ.is("id_branch", null);
  } else {
    query = query.eq("id_branch", idBranch);
  }
  const res = await query.maybeSingle();
  if (res.error || !res.data) return null;
  return res.data as EvoReconcileState;
}

type WriteStateInput = {
  organizationId: string;
  idBranch: string | null;
  lastRunAtIso: string;
  windowStartIso: string;
  windowEndIso: string;
  fetched: number;
  paid: number;
  eligible: number;
  dryRun: boolean;
};

async function writeReconcileState(admin: Admin, input: WriteStateInput): Promise<void> {
  // Upsert manual (id_branch NULL não é chave estável no upsert padrão).
  const existing = await readReconcileState(admin, input.organizationId, input.idBranch);
  const record = {
    organization_id: input.organizationId,
    id_branch: input.idBranch,
    last_run_at: input.lastRunAtIso,
    last_window_end: input.windowEndIso,
    last_window_start: input.windowStartIso,
    last_fetched: input.fetched,
    last_paid: input.paid,
    last_eligible: input.eligible,
    last_dry_run: input.dryRun,
  };
  if (existing) {
    let updateQ = admin
      .from("evo_reconcile_state")
      .update(record)
      .eq("organization_id", input.organizationId);
    if (input.idBranch === null) {
      const anyQ = updateQ as unknown as { is(col: string, val: unknown): typeof updateQ };
      updateQ = anyQ.is("id_branch", null);
    } else {
      updateQ = updateQ.eq("id_branch", input.idBranch);
    }
    await updateQ;
    return;
  }
  await admin.from("evo_reconcile_state").insert(record);
}

// Upsert de evo_sales — idêntico ao do webhook.
type UpsertInput = {
  organizationId: string;
  unitId: string | null;
  idW12: string | null;
  idBranch: string;
  idSale: string;
  idMember: string | null;
  eventType: string;
  amountPaidCents: number | null;
  saleDate: string | null;
  receivingDate: string | null;
  paymentType: string | null;
  receivableStatus: string | null;
  processingStatus: EvoSaleProcessingStatus;
  lastReason: string | null;
};

type UpsertOutcome =
  | { ok: true; duplicate: boolean; evoSaleId: string | null }
  | { ok: false; message: string };

async function upsertEvoSale(admin: Admin, input: UpsertInput): Promise<UpsertOutcome> {
  const existing = await admin
    .from("evo_sales")
    .select("id, processing_status")
    .eq("id_branch", input.idBranch)
    .eq("id_sale", input.idSale)
    .maybeSingle();
  if (existing.error) return { ok: false, message: existing.error.message };

  const record = {
    organization_id: input.organizationId,
    unit_id: input.unitId,
    id_w12: input.idW12,
    id_branch: input.idBranch,
    id_sale: input.idSale,
    id_member: input.idMember,
    event_type: input.eventType,
    amount_paid_cents: input.amountPaidCents,
    sale_date: input.saleDate,
    receiving_date: input.receivingDate,
    payment_type: input.paymentType,
    receivable_status: input.receivableStatus,
    processing_status: input.processingStatus,
    last_reason: input.lastReason,
  };

  const write = await admin
    .from("evo_sales")
    .upsert(record, { onConflict: "id_branch,id_sale" })
    .select("id")
    .maybeSingle();
  if (write.error) return { ok: false, message: write.error.message };
  const evoSaleId =
    (write.data?.id as string | undefined) ??
    (existing.data?.id as string | undefined) ??
    null;
  return { ok: true, duplicate: Boolean(existing.data), evoSaleId };
}

