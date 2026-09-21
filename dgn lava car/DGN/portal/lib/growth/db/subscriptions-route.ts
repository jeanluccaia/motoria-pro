import "server-only";

import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "../admin-session.ts";
import {
  SubscriptionsWriteError,
  cancelSubscription,
  createSubscription,
  editSubscription,
  listSubscriptions,
} from "./subscriptions-write.ts";

export interface SubscriptionsRequest {
  cookies: { get(name: string): { value: string } | undefined };
  json(): Promise<unknown>;
}

interface RouteDependencies {
  authorize(request: SubscriptionsRequest): Promise<boolean>;
  source: string;
}

const defaults: RouteDependencies = {
  authorize: (request) => validateAdminSessionToken(request.cookies.get(DGN_ADMIN_COOKIE)?.value),
  source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
};

function unauthorized() { return Response.json({ error: "unauthorized" }, { status: 401 }); }
function dbOnly() { return Response.json({ error: "Editor de assinaturas só está disponível no modo DB." }, { status: 409 }); }
function invalidId() { return Response.json({ error: "Cliente inválido." }, { status: 400 }); }

function toResponse(error: unknown, fallback: string) {
  if (error instanceof SubscriptionsWriteError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return Response.json({ error: "JSON inválido." }, { status: 400 });
  console.error("[DGN Growth] Falha em subscriptions", error instanceof Error ? error.message : "erro desconhecido");
  return Response.json({ error: fallback }, { status: 500 });
}

// GET  /api/admin/growth/customers/[id]/subscriptions
export async function handleSubscriptionsGet(
  request: { cookies: { get(name: string): { value: string } | undefined } },
  customerId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request as SubscriptionsRequest))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  try {
    const rows = await listSubscriptions(customerId);
    return Response.json({ subscriptions: rows }, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível listar assinaturas.");
  }
}

// POST /api/admin/growth/customers/[id]/subscriptions
export async function handleSubscriptionsPost(
  request: SubscriptionsRequest,
  customerId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "payload inválido" }, { status: 400 });
    }
    const b = body as {
      plan?: unknown; modality?: unknown; vehicleId?: unknown;
      cycleEndsAt?: unknown; paymentStatus?: unknown;
      paymentEvidenceSource?: unknown; sourceReference?: unknown; notes?: unknown;
    };
    if (typeof b.plan !== "string") return Response.json({ error: "plan obrigatório." }, { status: 400 });
    if (typeof b.modality !== "string") return Response.json({ error: "modality obrigatória." }, { status: 400 });
    if (typeof b.sourceReference !== "string" || !b.sourceReference.trim()) {
      return Response.json({ error: "sourceReference obrigatório (motivo humano/curadoria)." }, { status: 400 });
    }
    const result = await createSubscription({
      customerId,
      plan: b.plan,
      modality: b.modality,
      vehicleId: typeof b.vehicleId === "string" && b.vehicleId ? b.vehicleId : null,
      cycleEndsAt: typeof b.cycleEndsAt === "string" && b.cycleEndsAt ? b.cycleEndsAt : null,
      paymentStatus: typeof b.paymentStatus === "string" ? (b.paymentStatus as "confirmed" | "pending" | "failed" | "refunded" | "unknown") : "unknown",
      paymentEvidenceSource: typeof b.paymentEvidenceSource === "string" ? (b.paymentEvidenceSource as "manual" | "legacy" | "unknown") : "manual",
      sourceReference: b.sourceReference,
      notes: typeof b.notes === "string" ? b.notes : null,
      actor: "dgn-admin",
    });
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível criar a assinatura.");
  }
}

// PATCH /api/admin/growth/customers/[id]/subscriptions/[subId]
export async function handleSubscriptionsPatch(
  request: SubscriptionsRequest,
  customerId: string,
  subscriptionId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  if (!subscriptionId) return Response.json({ error: "subscriptionId obrigatório." }, { status: 400 });
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "payload inválido" }, { status: 400 });
    }
    const b = body as Record<string, unknown>;
    if (typeof b.reason !== "string" || !b.reason.trim()) {
      return Response.json({ error: "reason obrigatório (motivo humano)." }, { status: 400 });
    }
    const result = await editSubscription({
      customerId,
      subscriptionId,
      actor: "dgn-admin",
      reason: b.reason,
      plan: typeof b.plan === "string" ? b.plan : null,
      modality: typeof b.modality === "string" ? b.modality : null,
      vehicleId: typeof b.vehicleId === "string" ? b.vehicleId : null,
      clearVehicle: b.clearVehicle === true,
      cycleEndsAt: typeof b.cycleEndsAt === "string" ? b.cycleEndsAt : null,
      clearCycleEndsAt: b.clearCycleEndsAt === true,
      paymentStatus: typeof b.paymentStatus === "string" ? (b.paymentStatus as "confirmed" | "pending" | "failed" | "refunded" | "unknown") : undefined,
      paymentEvidenceSource: typeof b.paymentEvidenceSource === "string" ? (b.paymentEvidenceSource as "manual" | "legacy" | "unknown") : undefined,
      sourceReference: typeof b.sourceReference === "string" ? b.sourceReference : null,
      notes: typeof b.notes === "string" ? b.notes : null,
    });
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível editar a assinatura.");
  }
}

// DELETE /api/admin/growth/customers/[id]/subscriptions/[subId] → cancela
export async function handleSubscriptionsDelete(
  request: SubscriptionsRequest,
  customerId: string,
  subscriptionId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  if (!subscriptionId) return Response.json({ error: "subscriptionId obrigatório." }, { status: 400 });
  try {
    const body = await request.json().catch(() => ({}));
    const b = body as { reason?: unknown };
    if (typeof b.reason !== "string" || !b.reason.trim()) {
      return Response.json({ error: "reason obrigatório (motivo do cancelamento)." }, { status: 400 });
    }
    const result = await cancelSubscription({
      customerId, subscriptionId, reason: b.reason, actor: "dgn-admin",
    });
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível cancelar a assinatura.");
  }
}
