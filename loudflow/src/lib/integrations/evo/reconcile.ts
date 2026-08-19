import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EvoSaleProcessingStatus } from "../../supabase/types";
import { createEvoClient } from "./client";
import { evaluatePayment } from "./rules";
import type { EvoClient } from "./types";
import {
  getEvoDefaultOrgSlug,
  getMissingEvoEnvs,
} from "./env";
import { deliverPaidConversion } from "../../conversions/deliver";
import type { UtmifyOrdersClient } from "../utmify/orders";
import { timingSafeEqual } from "node:crypto";

// Handler de reconciliação:
//   * Cron da Vercel (só produção) chama `GET /api/cron/reconcile-evo-pending`
//     com header `Authorization: Bearer $CRON_SECRET` automaticamente
//     injetado pela Vercel quando a env CRON_SECRET está definida.
//   * Em Preview o cron não roda; chamada é manual via curl com o mesmo header.
//
// Isolado da rota Next.js pra permitir testes unitários (mesmo padrão
// de `handleEvoWebhook`).

type Admin = SupabaseClient<Database>;

const DEFAULT_HOURS = 24;
const DEFAULT_TAKE = 100;
const MAX_PAGES = 10; // proteção: até 1000 vendas por execução

export type ReconcileDeps = {
  admin: Admin;
  evoClient?: EvoClient;
  utmifyOrdersClient?: UtmifyOrdersClient;
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
  const idBranch = url.searchParams.get("idBranch") || undefined;

  const now = new Date();
  const start = new Date(Date.now() - hours * 3_600_000);
  const window = {
    start: isoUtc(start),
    end: isoUtc(now),
  };

  // --- 4. Loop paginado ----------------------------------------------
  const evo = deps.evoClient ?? createEvoClient();
  const counters = {
    fetched: 0,
    paid: 0,
    cancelled: 0,
    pending: 0,
    delivery_sent: 0,
    delivery_failed: 0,
    delivery_skipped: 0,
    pages: 0,
    windowStart: window.start,
    windowEnd: window.end,
  };

  for (let page = 0; page < MAX_PAGES; page++) {
    const skip = page * take;
    const listed = await evo.listSales({
      updatedReceivableStartDate: window.start,
      updatedReceivableEndDate: window.end,
      take,
      skip,
      idBranch,
    });
    if (!listed.ok) {
      // Rate limit da EVO: abortar imediatamente com 429. Continuar para
      // a próxima página ou tentar outra branch só piora — TODAS as
      // chamadas restantes bateriam no mesmo limite diário até o reset.
      // Contadores parciais ficam preservados para diagnóstico.
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

    // Resolver unit_id por id_branch (batch simples — pequeno set)
    const branchIds = Array.from(new Set(
      listed.sales.map((s) => coerceId(s.idBranch)).filter((x): x is string => x !== null),
    ));
    const branchMap = await resolveBranchMap(admin, branchIds);

    for (const sale of listed.sales) {
      const idBranchStr = coerceId(sale.idBranch);
      const idSaleStr = coerceId(sale.idSale);
      if (!idBranchStr || !idSaleStr) continue;

      const evaluation = evaluatePayment(sale);
      const processingStatus: EvoSaleProcessingStatus =
        evaluation.status === "paid"
          ? "paid"
          : evaluation.status === "cancelled"
            ? "cancelled"
            : "pending";
      if (processingStatus === "paid") counters.paid++;
      else if (processingStatus === "cancelled") counters.cancelled++;
      else counters.pending++;

      const unitId = branchMap.get(idBranchStr) ?? null;
      const amountPaidCents =
        evaluation.status === "paid" ? evaluation.amountPaidCents : null;
      const saleDate =
        typeof sale.saleDate === "string" && sale.saleDate.length > 0
          ? sale.saleDate
          : null;

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
        lastReason: evaluation.reason,
      });
      if (!upsert.ok || !upsert.evoSaleId) continue;

      if (processingStatus === "paid") {
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
    }
    if (listed.sales.length < take) break;
  }

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

// Upsert idêntico ao de handleEvoWebhook — extraído aqui pra evitar
// import cruzado. Se mudar em um lugar, refletir no outro.
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
