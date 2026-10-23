import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "../admin-session.ts";
import {
  CorporateFleetWriteError,
  createCompany,
  createManager,
  createFleetVehicle,
  createServiceRequest,
  confirmServiceRequest,
  counterProposeServiceRequest,
  acceptCounterServiceRequest,
  cancelServiceRequest,
  findManagerByAuthUserId,
} from "./corporate-fleet-write.ts";

// ---------------------------------------------------------------------------
// Route handlers para Corporate Fleet (Fase 2 Frotas B2B).
//
// Dois gates distintos:
//   * Admin  — cookie DGN_ADMIN_COOKIE (padrão do portal; valida contra
//              DGN_ADMIN_PASSWORD). Usa actor = "dgn-admin".
//   * Gestor — cookie DGN_COMPANY_MANAGER_COOKIE no formato
//              "<manager_id>.<hmac_sha256(manager_id, DGN_MANAGER_SIGNING_SECRET)>".
//              Validado em resolveManagerFromCookie(); usa actor =
//              `manager:<id>`. Fallback DGN_ADMIN_PASSWORD se o secret
//              dedicado não estiver configurado (demo-only).
// ---------------------------------------------------------------------------

export const DGN_COMPANY_MANAGER_COOKIE = "dgn_company_manager";

export interface RouteRequest {
  cookies: { get(name: string): { value: string } | undefined };
  json(): Promise<unknown>;
  nextUrl?: URL;
  url?: string;
}

export interface AdminRouteDependencies {
  authorizeAdmin(request: RouteRequest): Promise<boolean>;
  source: string;
}

const defaultsAdmin: AdminRouteDependencies = {
  authorizeAdmin: (request) => validateAdminSessionToken(request.cookies.get(DGN_ADMIN_COOKIE)?.value),
  source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
};

const ACTOR_ADMIN = "dgn-admin";

// Common response helpers ----------------------------------------------------

function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
function dbOnly() {
  return Response.json({ error: "Frotas B2B só está disponível no modo DB." }, { status: 409 });
}
function invalidPayload(message = "payload inválido") {
  return Response.json({ error: message }, { status: 400 });
}
function toResponse(error: unknown, fallback: string) {
  if (error instanceof CorporateFleetWriteError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof SyntaxError) {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }
  console.error(
    "[DGN Corporate Fleet] falha",
    error instanceof Error ? error.message : "erro desconhecido",
  );
  return Response.json({ error: fallback }, { status: 500 });
}

function statusForResult(code: string): number {
  switch (code) {
    case "CREATED":
      return 201;
    case "UPDATED":
      return 200;
    case "NOT_FOUND":
      return 404;
    case "COMPANY_NOT_FOUND":
    case "MANAGER_NOT_FOUND":
    case "FLEET_VEHICLE_NOT_FOUND":
      return 404;
    case "COMPANY_MISMATCH":
    case "MANAGER_MISMATCH":
    case "MANAGER_INACTIVE":
      return 403;
    case "ALREADY_CONFIRMED":
    case "ALREADY_CANCELLED":
    case "INVALID_STATE_TRANSITION":
    case "PLATE_ALREADY_IN_COMPANY":
    case "EMAIL_ALREADY_IN_COMPANY":
      return 409;
    default:
      return 500;
  }
}

// Manager HMAC token ---------------------------------------------------------

function managerSigningSecret(): string {
  const dedicated = process.env.DGN_MANAGER_SIGNING_SECRET?.trim();
  if (dedicated) return dedicated;
  const fallback = process.env.DGN_ADMIN_PASSWORD?.trim();
  if (!fallback) {
    throw new CorporateFleetWriteError(
      "Nenhum secret configurado para assinatura de token de gestor (DGN_MANAGER_SIGNING_SECRET).",
      500,
    );
  }
  return `manager-sig-${fallback}`;
}

export function signManagerToken(managerId: string, secret: string = managerSigningSecret()): string {
  return createHmac("sha256", secret).update(managerId).digest("hex");
}

export function buildManagerCookieValue(managerId: string): string {
  return `${managerId}.${signManagerToken(managerId)}`;
}

export function verifyManagerCookieValue(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const managerId = value.slice(0, dot);
  const token = value.slice(dot + 1);
  if (!managerId || !/^[0-9a-f-]{8,}$/i.test(managerId)) return null;
  let expected: string;
  try {
    expected = signManagerToken(managerId);
  } catch {
    return null;
  }
  const a = Buffer.from(token, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || a.length === 0) return null;
  return timingSafeEqual(a, b) ? managerId : null;
}

// Legacy "auth_user_id" bridge: para gestores com Supabase Auth plugado,
// resolve pelo auth user. Para demo HMAC, o manager_id já vem do cookie.
export async function resolveManagerIdFromRequest(
  request: RouteRequest,
): Promise<string | null> {
  const direct = verifyManagerCookieValue(request.cookies.get(DGN_COMPANY_MANAGER_COOKIE)?.value);
  if (direct) return direct;

  // Fallback: se um dia o portal plugar auth user, use isso.
  const authUserId = request.cookies.get("dgn_portal_auth_user_id")?.value;
  if (authUserId) {
    try {
      const manager = await findManagerByAuthUserId(authUserId);
      return manager?.id ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Admin handlers
// ---------------------------------------------------------------------------

export async function handleCreateCompany(
  request: RouteRequest,
  deps: AdminRouteDependencies = defaultsAdmin,
) {
  if (!(await deps.authorizeAdmin(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body || typeof body !== "object") return invalidPayload();
    const legalName = typeof body.legalName === "string" ? body.legalName : "";
    const displayName = typeof body.displayName === "string" ? body.displayName : "";
    if (!legalName.trim()) return invalidPayload("legalName obrigatório.");
    if (!displayName.trim()) return invalidPayload("displayName obrigatório.");
    const result = await createCompany({
      legalName,
      displayName,
      cnpj: typeof body.cnpj === "string" ? body.cnpj : null,
      contactEmail: typeof body.contactEmail === "string" ? body.contactEmail : null,
      contactPhone: typeof body.contactPhone === "string" ? body.contactPhone : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      actor: ACTOR_ADMIN,
    });
    return Response.json(result, { status: statusForResult(result.resultCode) });
  } catch (error) {
    return toResponse(error, "Não foi possível criar a empresa.");
  }
}

export async function handleCreateManager(
  request: RouteRequest,
  companyId: string,
  deps: AdminRouteDependencies = defaultsAdmin,
) {
  if (!(await deps.authorizeAdmin(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!companyId) return invalidPayload("Empresa obrigatória.");
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body || typeof body !== "object") return invalidPayload();
    const displayName = typeof body.displayName === "string" ? body.displayName : "";
    const email = typeof body.email === "string" ? body.email : "";
    if (!displayName.trim()) return invalidPayload("displayName obrigatório.");
    if (!email.trim()) return invalidPayload("email obrigatório.");
    const result = await createManager({
      companyId,
      displayName,
      email,
      phone: typeof body.phone === "string" ? body.phone : null,
      authUserId: typeof body.authUserId === "string" ? body.authUserId : null,
      actor: ACTOR_ADMIN,
    });
    return Response.json(result, { status: statusForResult(result.resultCode) });
  } catch (error) {
    return toResponse(error, "Não foi possível criar o gestor.");
  }
}

export async function handleCreateFleetVehicle(
  request: RouteRequest,
  companyId: string,
  deps: AdminRouteDependencies = defaultsAdmin,
) {
  if (!(await deps.authorizeAdmin(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!companyId) return invalidPayload("Empresa obrigatória.");
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body || typeof body !== "object") return invalidPayload();
    const plate = typeof body.plate === "string" ? body.plate : "";
    if (!plate.trim()) return invalidPayload("plate obrigatória.");
    const result = await createFleetVehicle({
      companyId,
      plate,
      make: typeof body.make === "string" ? body.make : null,
      model: typeof body.model === "string" ? body.model : null,
      year: typeof body.year === "number" ? body.year : null,
      color: typeof body.color === "string" ? body.color : null,
      driverName: typeof body.driverName === "string" ? body.driverName : null,
      nickname: typeof body.nickname === "string" ? body.nickname : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      actor: ACTOR_ADMIN,
    });
    return Response.json(result, { status: statusForResult(result.resultCode) });
  } catch (error) {
    return toResponse(error, "Não foi possível criar o veículo da frota.");
  }
}

export async function handleAdminConfirmRequest(
  request: RouteRequest,
  requestId: string,
  deps: AdminRouteDependencies = defaultsAdmin,
) {
  if (!(await deps.authorizeAdmin(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!requestId) return invalidPayload("requestId obrigatório.");
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const scheduledAt = typeof body?.scheduledAt === "string" ? body.scheduledAt : "";
    if (!scheduledAt.trim()) return invalidPayload("scheduledAt obrigatório.");
    const result = await confirmServiceRequest({
      requestId,
      scheduledAt,
      adminNotes: typeof body?.adminNotes === "string" ? body.adminNotes : null,
      actor: ACTOR_ADMIN,
    });
    return Response.json(result, { status: statusForResult(result.resultCode) });
  } catch (error) {
    return toResponse(error, "Não foi possível confirmar a solicitação.");
  }
}

export async function handleAdminCounterPropose(
  request: RouteRequest,
  requestId: string,
  deps: AdminRouteDependencies = defaultsAdmin,
) {
  if (!(await deps.authorizeAdmin(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!requestId) return invalidPayload("requestId obrigatório.");
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const proposedAt = typeof body?.proposedAt === "string" ? body.proposedAt : "";
    if (!proposedAt.trim()) return invalidPayload("proposedAt obrigatório.");
    const result = await counterProposeServiceRequest({
      requestId,
      proposedAt,
      adminNotes: typeof body?.adminNotes === "string" ? body.adminNotes : null,
      actor: ACTOR_ADMIN,
    });
    return Response.json(result, { status: statusForResult(result.resultCode) });
  } catch (error) {
    return toResponse(error, "Não foi possível propor nova data.");
  }
}

export async function handleAdminCancelRequest(
  request: RouteRequest,
  requestId: string,
  deps: AdminRouteDependencies = defaultsAdmin,
) {
  if (!(await deps.authorizeAdmin(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!requestId) return invalidPayload("requestId obrigatório.");
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!reason) return invalidPayload("reason obrigatório.");
    const result = await cancelServiceRequest({
      requestId,
      reason,
      actor: ACTOR_ADMIN,
    });
    return Response.json(result, { status: statusForResult(result.resultCode) });
  } catch (error) {
    return toResponse(error, "Não foi possível cancelar a solicitação.");
  }
}

// ---------------------------------------------------------------------------
// Manager handlers
// ---------------------------------------------------------------------------

export interface ManagerRouteDependencies {
  resolveManagerId(request: RouteRequest): Promise<string | null>;
  source: string;
}

const defaultsManager: ManagerRouteDependencies = {
  resolveManagerId: (request) => resolveManagerIdFromRequest(request),
  source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
};

export async function handleManagerCreateRequest(
  request: RouteRequest,
  deps: ManagerRouteDependencies = defaultsManager,
) {
  const managerId = await deps.resolveManagerId(request);
  if (!managerId) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fleetVehicleId = typeof body?.fleetVehicleId === "string" ? body.fleetVehicleId : "";
    const serviceType = typeof body?.serviceType === "string" ? body.serviceType : "";
    const preferredDate1 = typeof body?.preferredDate1 === "string" ? body.preferredDate1 : "";
    if (!fleetVehicleId) return invalidPayload("fleetVehicleId obrigatório.");
    if (!serviceType.trim()) return invalidPayload("serviceType obrigatório.");
    if (!preferredDate1.trim()) return invalidPayload("preferredDate1 obrigatório.");
    const result = await createServiceRequest({
      fleetVehicleId,
      managerId,
      serviceType,
      preferredDate1,
      preferredDate2: typeof body?.preferredDate2 === "string" ? body.preferredDate2 : null,
      managerNotes: typeof body?.managerNotes === "string" ? body.managerNotes : null,
      actor: `manager:${managerId}`,
    });
    return Response.json(result, { status: statusForResult(result.resultCode) });
  } catch (error) {
    return toResponse(error, "Não foi possível criar a solicitação.");
  }
}

export async function handleManagerAcceptCounter(
  request: RouteRequest,
  requestId: string,
  deps: ManagerRouteDependencies = defaultsManager,
) {
  const managerId = await deps.resolveManagerId(request);
  if (!managerId) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!requestId) return invalidPayload("requestId obrigatório.");
  try {
    const result = await acceptCounterServiceRequest({
      requestId,
      managerId,
      actor: `manager:${managerId}`,
    });
    return Response.json(result, { status: statusForResult(result.resultCode) });
  } catch (error) {
    return toResponse(error, "Não foi possível aceitar a nova data.");
  }
}

export async function handleManagerCancelRequest(
  request: RouteRequest,
  requestId: string,
  deps: ManagerRouteDependencies = defaultsManager,
) {
  const managerId = await deps.resolveManagerId(request);
  if (!managerId) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!requestId) return invalidPayload("requestId obrigatório.");
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!reason) return invalidPayload("reason obrigatório.");
    const result = await cancelServiceRequest({
      requestId,
      reason,
      actor: `manager:${managerId}`,
    });
    return Response.json(result, { status: statusForResult(result.resultCode) });
  } catch (error) {
    return toResponse(error, "Não foi possível cancelar a solicitação.");
  }
}
