import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EvoSaleProcessingStatus } from "../../supabase/types";
import { createEvoClient } from "./client";
import { classifySale, evaluatePayment } from "./rules";
import type {
  EvoClient,
  EvoEnumLike,
  EvoMemberDetails,
  EvoSaleDetails,
  EvoSaleItem,
  EvoWebhookPayload,
} from "./types";
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
      registrationKind: null,
      document: null,
      idMembership: null,
      idMembershipRenewed: null,
      valueNextMonthCents: null,
      isNewMembership: false,
      exclusionReason: null,
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

  const sale = fetchResult.sale;
  const evaluation = evaluatePayment(sale);
  const processingStatus: EvoSaleProcessingStatus =
    evaluation.status === "paid"
      ? "paid"
      : evaluation.status === "cancelled"
        ? "cancelled"
        : "pending";

  const idMember = coerceId(sale.idMember);
  const amountPaidCents =
    evaluation.status === "paid" ? evaluation.amountPaidCents : null;
  const saleDate =
    typeof sale.saleDate === "string" && sale.saleDate.length > 0
      ? sale.saleDate
      : null;

  // --- 5b. Extração de campos de classificação ------------------------
  const registrationKind = extractRegistrationKindRaw(sale);
  const membershipItem = pickMembershipItem(sale);
  const idMembership = membershipItem
    ? coerceId(membershipItem.idMembership) ?? coerceId(membershipItem.idMemberMembership)
    : null;
  const idMembershipRenewed = pickRenewedMembershipId(sale);
  const valueNextMonthCents = pickValueNextMonthCents(sale);
  const document = normalizeDocumentDigits(pickDocument(sale.member));

  // --- 5c. Classificação de "matrícula nova" -------------------------
  // Se um webhook anterior JÁ marcou esta mesma (id_branch, id_sale)
  // como is_new_membership=true, preserva. Sem isso, a query de dedup
  // encontraria o próprio registro e derrubaria a flag em retries.
  const priorRow = await admin
    .from("evo_sales")
    .select("id, is_new_membership")
    .eq("id_branch", idBranch)
    .eq("id_sale", idSale)
    .maybeSingle();
  const previouslyMarkedNew = priorRow.data?.is_new_membership === true;

  // classifySale cobre cancelled/not-paid/re-enrollment/renewal/
  // product-only/service-only/no-membership. A dedup por CPF (regra
  // Jean 2026-08-24: só CPF nunca visto antes) é aplicada em cima.
  const classification = classifySale(sale);
  let isNewMembership = false;
  let exclusionReason: string | null = null;
  if (previouslyMarkedNew) {
    isNewMembership = true;
    exclusionReason = null;
  } else if (!classification.eligible) {
    exclusionReason = classification.reason;
  } else if (!document) {
    // Sem CPF não dá pra garantir "primeira vez". Regra conservadora:
    // não conta como aquisição. Vai ficar rastreado para revisão manual.
    exclusionReason = "no-document";
  } else {
    const seen = await hasPriorNewMembershipForDocument(admin, {
      organizationId,
      document,
    });
    if (seen) {
      exclusionReason = "duplicate-cpf";
    } else {
      isNewMembership = true;
      exclusionReason = null;
    }
  }

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
    registrationKind,
    document,
    idMembership,
    idMembershipRenewed,
    valueNextMonthCents,
    isNewMembership,
    exclusionReason,
  });

  if (!upsert.ok) {
    return NextResponse.json(
      { ok: false, error: "db-upsert-failed", message: upsert.message },
      { status: 500 },
    );
  }

  // --- 6. Envio de conversão paga (best-effort) ----------------------
  // Só dispara quando a venda é REAL, PAGA E É MATRÍCULA NOVA (CPF
  // nunca visto antes). Renovação / re-matrícula / produto avulso /
  // segunda venda do mesmo CPF ficam persistidos mas NÃO viram
  // conversão de mídia.
  //
  // Passamos `sale.member` como memberOverride: os endpoints /members/{id}
  // devolvem 403 nas credenciais atuais (2026-08-24), mas o mesmo dado
  // vem inline dentro de /api/v2/sales/{id}?showReceivables=true — que
  // já buscamos aqui. Evita depender do fetchMember quebrado.
  let deliveryStatus: "sent" | "failed" | "skipped" | "not-attempted" = "not-attempted";
  let deliveryReason: string | null = null;
  if (isNewMembership && upsert.evoSaleId) {
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
      memberOverride: sale.member ?? null,
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
      isNewMembership,
      exclusionReason,
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

// ---- extração de campos de classificação da EvoSaleDetails ---------

function extractRegistrationKindRaw(sale: EvoSaleDetails): string | null {
  const raw = sale.registrationKind ?? sale.registrationType ?? null;
  if (typeof raw === "string") return raw.length > 0 ? raw : null;
  if (raw && typeof raw === "object") {
    const enumLike = raw as EvoEnumLike;
    if (typeof enumLike.name === "string" && enumLike.name.length > 0) {
      return enumLike.name;
    }
  }
  return null;
}

function extractItems(sale: EvoSaleDetails): EvoSaleItem[] {
  if (Array.isArray(sale.saleItens)) return sale.saleItens;
  if (Array.isArray(sale.saleItems)) return sale.saleItems;
  if (Array.isArray(sale.items)) return sale.items;
  return [];
}

function hasNonEmptyId(v: number | string | null | undefined): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "number") return Number.isFinite(v) && v > 0;
  return v.trim().length > 0;
}

function pickMembershipItem(sale: EvoSaleDetails): EvoSaleItem | null {
  const items = extractItems(sale);
  for (const it of items) {
    if (hasNonEmptyId(it.idMembership) || hasNonEmptyId(it.idMemberMembership)) {
      return it;
    }
  }
  return null;
}

function pickRenewedMembershipId(sale: EvoSaleDetails): string | null {
  const items = extractItems(sale);
  for (const it of items) {
    if (hasNonEmptyId(it.idMembershipRenewed)) {
      return coerceId(it.idMembershipRenewed);
    }
  }
  return null;
}

function pickValueNextMonthCents(sale: EvoSaleDetails): number | null {
  const items = extractItems(sale);
  for (const it of items) {
    const raw = (it as { valueNextMonth?: number | null }).valueNextMonth;
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
      return Math.round(raw * 100);
    }
  }
  return null;
}

function pickDocument(member: EvoMemberDetails | null | undefined): string | null {
  if (!member) return null;
  return member.document ?? member.documentId ?? null;
}

function normalizeDocumentDigits(doc: string | null | undefined): string | null {
  if (!doc) return null;
  const digits = doc.replace(/\D+/g, "");
  return digits.length >= 8 ? digits : null;
}

// Consulta de dedup por CPF: existe alguma evo_sales na mesma org que
// já virou is_new_membership=true para este mesmo document? Se sim, a
// venda atual é reativação (não deve virar conversão).
async function hasPriorNewMembershipForDocument(
  admin: Admin,
  input: { organizationId: string; document: string },
): Promise<boolean> {
  const q = await admin
    .from("evo_sales")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("document", input.document)
    .eq("is_new_membership", true)
    .maybeSingle();
  return Boolean(q.data);
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
  registrationKind: string | null;
  document: string | null;
  idMembership: string | null;
  idMembershipRenewed: string | null;
  valueNextMonthCents: number | null;
  isNewMembership: boolean;
  exclusionReason: string | null;
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
    registration_kind: input.registrationKind,
    document: input.document,
    id_membership: input.idMembership,
    id_membership_renewed: input.idMembershipRenewed,
    value_next_month_cents: input.valueNextMonthCents,
    is_new_membership: input.isNewMembership,
    exclusion_reason: input.exclusionReason,
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
