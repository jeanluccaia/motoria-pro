import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdConversionDelivery,
  Database,
  EvoSale,
} from "../supabase/types";
import type { EvoClient, EvoMemberDetails } from "../integrations/evo/types";
import {
  createUtmifyOrdersClient,
  formatUtcDateTime,
  type UtmifyOrderPayload,
  type UtmifyOrderPaymentMethod,
  type UtmifyOrdersClient,
  type UtmifyOrdersResult,
} from "../integrations/utmify/orders";
import {
  isUtmifyOrdersConfigured,
  utmifyOrdersIsTestMode,
} from "../integrations/utmify/env";

// Orquestração do envio de conversão paga para plataformas de mídia.
//
// Hoje há uma única plataforma downstream: 'utmify'. A UTMify recebe a
// venda paga em POST /api-credentials/orders e encaminha internamente
// para Meta CAPI e Google Ads Enhanced Conversions — evita a duplicação
// que ocorreria se o Loud Flow enviasse em paralelo.
//
// Dedup é garantido em três camadas:
//   1) evo_sales tem UNIQUE (id_branch, id_sale) — retries do webhook
//      da EVO não geram vendas novas.
//   2) ad_conversion_deliveries tem UNIQUE (evo_sale_id, platform) —
//      chamadas repetidas do orquestrador não duplicam entrega.
//   3) delivery_key ('evo:{idBranch}:{idSale}:purchase') vai como orderId
//      para a UTMify, permitindo dedup no lado dela também.
//
// Nunca lança. Se algo der errado, marca a delivery como failed/skipped
// e devolve o motivo. O webhook responde 200 mesmo assim (a venda já
// está persistida — retry só do envio de conversão).

type Admin = SupabaseClient<Database>;

const PLATFORM = "utmify" as const;

export type DeliverInput = {
  admin: Admin;
  evoClient: EvoClient;
  utmifyOrdersClient?: UtmifyOrdersClient;
  organizationId: string;
  evoSale: Pick<
    EvoSale,
    | "id"
    | "id_branch"
    | "id_sale"
    | "id_member"
    | "amount_paid_cents"
    | "sale_date"
    | "receiving_date"
    | "payment_type"
    | "processing_status"
  >;
};

export type DeliverOutcome =
  | { skipped: true; reason: string }
  | { sent: true; deliveryId: string; responseSummary: string }
  | { failed: true; deliveryId: string; error: string; attempts: number };

export async function deliverPaidConversion(input: DeliverInput): Promise<DeliverOutcome> {
  const { admin, evoClient, evoSale, organizationId } = input;

  if (evoSale.processing_status !== "paid") {
    return { skipped: true, reason: `not-paid:${evoSale.processing_status}` };
  }

  if (!isUtmifyOrdersConfigured()) {
    return { skipped: true, reason: "utmify-not-configured" };
  }

  const deliveryKey = `evo:${evoSale.id_branch}:${evoSale.id_sale}:purchase`;
  const utmifyClient = input.utmifyOrdersClient ?? createUtmifyOrdersClient();

  // ---- 1. Cria/recupera delivery -----------------------------------
  const upserted = await upsertPendingDelivery(admin, {
    organizationId,
    evoSaleId: evoSale.id,
    deliveryKey,
  });

  if (!upserted.ok) {
    return { skipped: true, reason: `delivery-upsert-failed:${upserted.reason}` };
  }
  const delivery = upserted.delivery;

  if (delivery.status === "sent") {
    return { skipped: true, reason: "already-sent" };
  }

  // ---- 2. Enriquecimento com dados do aluno (best-effort) ----------
  let member: EvoMemberDetails | null = null;
  if (evoSale.id_member) {
    const fetched = await evoClient.fetchMember(evoSale.id_member);
    if (fetched.ok) member = fetched.member;
    // silêncio proposital em caso de falha: cai no bloco de PII abaixo
    // e o delivery pode virar `skipped` se faltarem campos obrigatórios.
  }

  const customer = buildCustomer(member);
  if (!customer) {
    await markDelivery(admin, delivery.id, {
      status: "skipped",
      lastError: "customer-required-missing-name-or-email",
      attempts: delivery.attempts,
    });
    return { skipped: true, reason: "customer-required" };
  }

  const paymentMethod = mapPaymentMethod(evoSale.payment_type);
  if (!paymentMethod) {
    await markDelivery(admin, delivery.id, {
      status: "skipped",
      lastError: `unmapped-payment-method:${evoSale.payment_type ?? "null"}`,
      attempts: delivery.attempts,
    });
    return { skipped: true, reason: "unmapped-payment-method" };
  }

  const amountCents = evoSale.amount_paid_cents ?? 0;
  if (amountCents <= 0) {
    await markDelivery(admin, delivery.id, {
      status: "skipped",
      lastError: "amount-zero",
      attempts: delivery.attempts,
    });
    return { skipped: true, reason: "amount-zero" };
  }

  const createdAt = formatUtcDateTime(evoSale.sale_date) ?? formatUtcDateTime(new Date().toISOString())!;
  const approvedDate = formatUtcDateTime(evoSale.receiving_date) ?? createdAt;

  const payload: UtmifyOrderPayload = {
    orderId: `evo-${evoSale.id_branch}-${evoSale.id_sale}`,
    platform: "LoudFlow",
    paymentMethod,
    status: "paid",
    createdAt,
    approvedDate,
    refundedAt: null,
    customer,
    products: [
      {
        id: `evo-plan-${evoSale.id_branch}`,
        name: "Matrícula Loud Fit",
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: amountCents,
      },
    ],
    trackingParameters: {
      src: null,
      sck: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    },
    commission: {
      totalPriceInCents: amountCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: amountCents,
      currency: "BRL",
    },
    isTest: utmifyOrdersIsTestMode(),
  };

  // ---- 3. Envio ----------------------------------------------------
  const attempts = delivery.attempts + 1;
  const result: UtmifyOrdersResult = await utmifyClient.sendOrder(payload);
  const nowIso = new Date().toISOString();

  if (result.ok) {
    await markDelivery(admin, delivery.id, {
      status: "sent",
      attempts,
      responseSummary: result.responseSummary,
      lastError: null,
      sentAt: delivery.sent_at ?? nowIso,
    });
    return { sent: true, deliveryId: delivery.id, responseSummary: result.responseSummary };
  }

  await markDelivery(admin, delivery.id, {
    status: "failed",
    attempts,
    lastError: `${result.error.code}: ${result.error.message}`,
  });
  return {
    failed: true,
    deliveryId: delivery.id,
    error: `${result.error.code}: ${result.error.message}`,
    attempts,
  };
}

// -------- helpers ----------------------------------------------------

function mapPaymentMethod(evoPaymentType: string | null | undefined): UtmifyOrderPaymentMethod | null {
  if (!evoPaymentType) return null;
  const norm = evoPaymentType
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
  if (norm.includes("pix")) return "pix";
  if (norm.includes("boleto")) return "boleto";
  if (
    norm.includes("credit") ||
    norm.includes("cartao") ||
    norm.includes("card") ||
    norm.includes("cred")
  ) {
    return "credit_card";
  }
  if (norm.includes("paypal")) return "paypal";
  if (norm.includes("gratis") || norm.includes("free") || norm.includes("cortesia")) {
    return "free_price";
  }
  return null;
}

function buildCustomer(member: EvoMemberDetails | null) {
  if (!member) return null;
  const name = normalizeName(member);
  const email = normalizeEmail(member.email);
  if (!name || !email) return null;
  return {
    name,
    email,
    phone: normalizePhone(member.cellphone ?? member.phone ?? null),
    document: normalizeDocument(member.document ?? member.documentId ?? null),
    country: "BR",
    ip: null,
  };
}

function normalizeName(member: EvoMemberDetails): string | null {
  const first = (member.firstName ?? "").trim();
  const last = (member.lastName ?? "").trim();
  const joined = `${first} ${last}`.trim();
  if (joined) return joined;
  const single = (member.name ?? "").trim();
  return single || null;
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  // Filtro simples de plausibilidade (contém '@' e '.') — a validação
  // final é responsabilidade da UTMify.
  if (!trimmed.includes("@") || !trimmed.includes(".")) return null;
  return trimmed;
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D+/g, "");
  return digits.length >= 8 ? digits : null;
}

function normalizeDocument(doc: string | null): string | null {
  if (!doc) return null;
  const digits = doc.replace(/\D+/g, "");
  return digits.length >= 8 ? digits : null;
}

type UpsertPendingInput = {
  organizationId: string;
  evoSaleId: string;
  deliveryKey: string;
};

type UpsertPendingResult =
  | { ok: true; delivery: AdConversionDelivery }
  | { ok: false; reason: string };

async function upsertPendingDelivery(
  admin: Admin,
  input: UpsertPendingInput,
): Promise<UpsertPendingResult> {
  const existing = await admin
    .from("ad_conversion_deliveries")
    .select(
      "id, organization_id, evo_sale_id, platform, delivery_key, status, attempts, last_error, response_summary, last_attempt_at, sent_at, created_at, updated_at",
    )
    .eq("evo_sale_id", input.evoSaleId)
    .eq("platform", PLATFORM)
    .maybeSingle();

  if (existing.error) {
    return { ok: false, reason: existing.error.message };
  }
  if (existing.data) {
    return { ok: true, delivery: existing.data as AdConversionDelivery };
  }

  const insert = await admin
    .from("ad_conversion_deliveries")
    .insert({
      organization_id: input.organizationId,
      evo_sale_id: input.evoSaleId,
      platform: PLATFORM,
      delivery_key: input.deliveryKey,
      status: "pending",
      attempts: 0,
    })
    .select(
      "id, organization_id, evo_sale_id, platform, delivery_key, status, attempts, last_error, response_summary, last_attempt_at, sent_at, created_at, updated_at",
    )
    .single();

  if (insert.error || !insert.data) {
    return { ok: false, reason: insert.error?.message ?? "insert-returned-null" };
  }
  return { ok: true, delivery: insert.data as AdConversionDelivery };
}

type MarkDeliveryInput = {
  status: "sent" | "failed" | "skipped";
  attempts?: number;
  lastError?: string | null;
  responseSummary?: string | null;
  sentAt?: string | null;
};

async function markDelivery(
  admin: Admin,
  deliveryId: string,
  input: MarkDeliveryInput,
): Promise<void> {
  const nowIso = new Date().toISOString();
  const patch: Partial<AdConversionDelivery> = {
    status: input.status,
    last_attempt_at: nowIso,
  };
  if (typeof input.attempts === "number") patch.attempts = input.attempts;
  if (input.lastError !== undefined) patch.last_error = input.lastError;
  if (input.responseSummary !== undefined) patch.response_summary = input.responseSummary;
  if (input.sentAt !== undefined) patch.sent_at = input.sentAt;

  await admin.from("ad_conversion_deliveries").update(patch).eq("id", deliveryId);
}
