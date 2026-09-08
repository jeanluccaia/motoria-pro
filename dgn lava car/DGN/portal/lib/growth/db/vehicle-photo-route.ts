import "server-only";

import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "../admin-session.ts";
import {
  VehiclePhotoError,
  removeVehiclePhoto,
  uploadVehiclePhoto,
} from "./vehicle-photo-write.ts";

export interface VehiclePhotoRequest {
  cookies: { get(name: string): { value: string } | undefined };
  formData(): Promise<FormData>;
  json(): Promise<unknown>;
}

interface RouteDependencies {
  authorize(request: VehiclePhotoRequest): Promise<boolean>;
  source: string;
}

const defaults: RouteDependencies = {
  authorize: (request) => validateAdminSessionToken(request.cookies.get(DGN_ADMIN_COOKIE)?.value),
  source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
};

function unauthorized() { return Response.json({ error: "unauthorized" }, { status: 401 }); }
function dbOnly() { return Response.json({ error: "Upload de foto só está disponível no modo DB." }, { status: 409 }); }
function invalidId() { return Response.json({ error: "Cliente inválido." }, { status: 400 }); }

function toResponse(error: unknown, fallback: string) {
  if (error instanceof VehiclePhotoError) return Response.json({ error: error.message }, { status: error.status });
  console.error("[DGN Growth] Falha no fluxo vehicle-photo", error instanceof Error ? error.message : "erro desconhecido");
  return Response.json({ error: fallback }, { status: 500 });
}

export async function handleVehiclePhotoPost(
  request: VehiclePhotoRequest,
  customerId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  try {
    const form = await request.formData();
    const vehicleId = String(form.get("vehicleId") ?? "").trim();
    const file = form.get("file");
    if (!vehicleId) return Response.json({ error: "vehicleId ausente." }, { status: 400 });
    if (!(file instanceof File)) return Response.json({ error: "arquivo ausente." }, { status: 400 });
    const bytes = await file.arrayBuffer();
    const result = await uploadVehiclePhoto({
      customerId,
      vehicleId,
      fileBytes: bytes,
      fileMime: file.type,
      fileSize: file.size,
      actor: "dgn-admin",
    });
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível enviar a foto.");
  }
}

export async function handleVehiclePhotoDelete(
  request: VehiclePhotoRequest,
  customerId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  try {
    const body = await request.json().catch(() => ({}));
    const vehicleId = String((body as { vehicleId?: unknown }).vehicleId ?? "").trim();
    if (!vehicleId) return Response.json({ error: "vehicleId ausente." }, { status: 400 });
    const result = await removeVehiclePhoto({
      customerId,
      vehicleId,
      actor: "dgn-admin",
    });
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível remover a foto.");
  }
}
