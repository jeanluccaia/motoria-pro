import "server-only";

import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "../admin-session.ts";
import {
  ProfileEditorError,
  listCustomerVehicles,
  updateCustomerPhone,
  updateVehicleFields,
} from "./profile-editor-write.ts";

export interface ProfileEditorRequest {
  cookies: { get(name: string): { value: string } | undefined };
  json(): Promise<unknown>;
}

export interface VehiclesGetRequest {
  cookies: { get(name: string): { value: string } | undefined };
}

interface RouteDependencies {
  authorize(request: ProfileEditorRequest): Promise<boolean>;
  source: string;
}

const defaults: RouteDependencies = {
  authorize: (request) => validateAdminSessionToken(request.cookies.get(DGN_ADMIN_COOKIE)?.value),
  source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
};

function unauthorized() { return Response.json({ error: "unauthorized" }, { status: 401 }); }
function dbOnly() { return Response.json({ error: "Edição só está disponível no modo DB." }, { status: 409 }); }
function invalidId() { return Response.json({ error: "Cliente inválido." }, { status: 400 }); }

function toResponse(error: unknown, fallback: string) {
  if (error instanceof ProfileEditorError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return Response.json({ error: "JSON inválido." }, { status: 400 });
  console.error("[DGN Growth] Falha em profile-editor", error instanceof Error ? error.message : "erro desconhecido");
  return Response.json({ error: fallback }, { status: 500 });
}

export async function handleVehiclesGet(
  request: VehiclesGetRequest,
  customerId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request as ProfileEditorRequest))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  try {
    const rows = await listCustomerVehicles(customerId);
    return Response.json({ vehicles: rows }, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível listar veículos.");
  }
}

/**
 * PATCH /api/admin/growth/customers/[id]/profile-editor
 * Body: { kind: "phone", phone } | { kind: "vehicle", vehicleId, brand?, model?, plate? }
 */
export async function handleProfileEditorPatch(
  request: ProfileEditorRequest,
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
      kind?: unknown;
      phone?: unknown;
      vehicleId?: unknown;
      brand?: unknown;
      model?: unknown;
      plate?: unknown;
    };
    if (b.kind === "phone") {
      if (typeof b.phone !== "string") return Response.json({ error: "phone obrigatório." }, { status: 400 });
      const result = await updateCustomerPhone({
        customerId,
        phone: b.phone,
        actor: "dgn-admin",
      });
      return Response.json(result, { status: 200 });
    }
    if (b.kind === "vehicle") {
      if (typeof b.vehicleId !== "string" || !b.vehicleId) {
        return Response.json({ error: "vehicleId obrigatório." }, { status: 400 });
      }
      const result = await updateVehicleFields({
        customerId,
        vehicleId: b.vehicleId,
        brand: typeof b.brand === "string" || b.brand === null ? (b.brand as string | null) : undefined,
        model: typeof b.model === "string" || b.model === null ? (b.model as string | null) : undefined,
        plate: typeof b.plate === "string" || b.plate === null ? (b.plate as string | null) : undefined,
        actor: "dgn-admin",
      });
      return Response.json(result, { status: 200 });
    }
    return Response.json({ error: "kind inválido (esperado 'phone' ou 'vehicle')." }, { status: 400 });
  } catch (error) {
    return toResponse(error, "Não foi possível atualizar.");
  }
}
