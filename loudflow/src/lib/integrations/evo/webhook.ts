import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EvoSaleProcessingStatus } from "../../supabase/types";
import { createEvoClient } from "./client";
import { evaluatePayment } from "./rules";
import type { EvoClient, EvoWebhookPayload } from "./types";
import {
  getEvoDefaultOrgSlug,
  getMissingEvoEnvs,
  requestHasValidWebhookSecret,
} from "./env";
import { deliverPaidConversion } from "../../conversions/deliver";
import type { UtmifyOrdersClient } from "../utmify/orders";

// Lógica do webhook NewSale da EVO isolada da rota Next.js para permitir
// testes unitários. A rota apenas repassa `Request` e devolve `Response`.

type Admin = SupabaseClient<Database>;

export type WebhookDeps = {
  admin: Admin;
  evoClient?: EvoClient;
  utmifyOrdersClient?: UtmifyOrdersClient;  // testes injetam; produção usa default
};

export async function handleEvoWebhook(
  request: Request,
  deps: WebhookDeps,
): Promise<Response> {
  // --- 1. Autenticação ------------------------------------------------
  if (!requestHasValidWebhookSecret(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // --- 2. Envs mínimas do lado do servidor ---------------------------
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

  // --- 3. Parse do payload -------------------------------------------
  let payload: EvoWebhookPayload;
  try {
    payload = (await request.json()) as EvoWebhookPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid-payload", message: "JSON inválido" },
      { status: 400 },
    );
  }

  const eventType = typeof payload.EventType === "string" ? payload.EventType : "";
  if (eventType !== "NewSale") {
    return NextResponse.json(
      { ok: true, ignored: "event-type", eventType: eventType || null },
      { status: 202 },
    );
  }

  const idBranch = coerceId(payload.IdBranch);
  const idSale = coerceId(payload.IdRecord);
  const idW12 = coerceId(payload.IdW12);
  if (!idBranch || !idSale) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid-payload",
        message: "IdBranch e IdRecord são obrigatórios.",
      },
      { status: 400 },
    );
  }

  // --- 4. Resolve organização e unidade ------------------------------
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

  const branch = await admin
    .from("evo_branches")
    .select("unit_id")
    .eq("id_branch", idBranch)
    .maybeSingle();
  const unitId = branch.data?.unit_id ?? null;

  // --- 5. Consulta detalhes na EVO -----------------------------------
  const evo = deps.evoClient ?? createEvoClient();
  const fetchResult = await evo.fetchSale(idBranch, idSale);

  if (!fetchResult.ok) {
    await upsertEvoSale(admin, {
      organizationId,
      unitId,
      idW12,
      idBranch,
      idSale,
      idMember: null,
      eventType,
      amountPaidCents: null,
      saleDate: null,
      receivingDate: null,
      paymentType: null,
      receivableStatus: null,
      processingStatus: "error",
      lastReason: `evo-fetch:${fetchResult.error.code}`,
    });
    return NextResponse.json(
      {
        ok: false,
        error: "evo-fetch-failed",
        code: fetchResult.error.code,
        message: fetchResult.error.message,
      },
      { status: 502 },
    );
  }

  const evaluation = evaluatePayment(fetchResult.sale);
  const processingStatus: EvoSaleProcessingStatus =
    evaluation.status === "paid"
      ? "paid"
      : evaluation.status === "cancelled"
        ? "cancelled"
        : "pending";

  const idMember = coerceId(fetchResult.sale.idMember);
  const amountPaidCents =
    evaluation.status === "paid" ? evaluation.amountPaidCents : null;
  const saleDate =
    typeof fetchResult.sale.saleDate === "string" && fetchResult.sale.saleDate.length > 0
      ? fetchResult.sale.saleDate
      : null;

  const upsert = await upsertEvoSale(admin, {
    organizationId,
    unitId,
    idW12,
    idBranch,
    idSale,
    idMember,
    eventType,
    amountPaidCents,
    saleDate,
    receivingDate: evaluation.receivingDate,
    paymentType: evaluation.paymentType,
    receivableStatus: evaluation.receivableStatus,
    processingStatus,
    lastReason: evaluation.reason,
  });

  if (!upsert.ok) {
    return NextResponse.json(
      { ok: false, error: "db-upsert-failed", message: upsert.message },
      { status: 500 },
    );
  }

  // --- 6. Envio de conversão paga (best-effort) ----------------------
  // Só dispara quando a venda é REAL e PAGA. Nunca em pending/cancelled/
  // error. Nunca quebra a resposta 200 para a EVO — se o envio falhar,
  // `ad_conversion_deliveries` fica com status 'failed' e permite retry
  // manual/cron. A UTMify faz o fan-out para Meta CAPI + Google Ads.
  //
  // Não condicionamos por `duplicate`: se uma venda estava pending no
  // primeiro webhook e virou paid no segundo, o segundo webhook precisa
  // disparar o delivery. A idempotência do envio é garantida pela
  // UNIQUE (evo_sale_id, platform) em ad_conversion_deliveries — dentro
  // de deliverPaidConversion, um delivery já 'sent' vira skipped.
  let deliveryStatus: "sent" | "failed" | "skipped" | "not-attempted" = "not-attempted";
  let deliveryReason: string | null = null;
  if (processingStatus === "paid" && upsert.evoSaleId) {
    const outcome = await deliverPaidConversion({
      admin,
      evoClient: evo,
      utmifyOrdersClient: deps.utmifyOrdersClient,
      organizationId,
      evoSale: {
        id: upsert.evoSaleId,
        id_branch: idBranch,
        id_sale: idSale,
        id_member: idMember,
        amount_paid_cents: amountPaidCents,
        sale_date: saleDate,
        receiving_date: evaluation.receivingDate,
        payment_type: evaluation.paymentType,
        processing_status: "paid",
      },
    });
    if ("sent" in outcome) {
      deliveryStatus = "sent";
    } else if ("failed" in outcome) {
      deliveryStatus = "failed";
      deliveryReason = outcome.error;
    } else {
      deliveryStatus = "skipped";
      deliveryReason = outcome.reason;
    }
  }

  return NextResponse.json(
    {
      ok: true,
      idBranch,
      idSale,
      status: processingStatus,
      amountPaidCents:
        evaluation.status === "paid" ? evaluation.amountPaidCents : 0,
      duplicate: upsert.duplicate,
      delivery: { status: deliveryStatus, reason: deliveryReason },
    },
    { status: 200 },
  );
}

// -------- helpers ---------------------------------------------------

function coerceId(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

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

  if (existing.error) {
    return { ok: false, message: existing.error.message };
  }

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

  if (write.error) {
    return { ok: false, message: write.error.message };
  }
  const evoSaleId =
    (write.data?.id as string | undefined) ??
    (existing.data?.id as string | undefined) ??
    null;
  return { ok: true, duplicate: Boolean(existing.data), evoSaleId };
}
