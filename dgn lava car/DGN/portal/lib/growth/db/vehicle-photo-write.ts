import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";

// -----------------------------------------------------------------------------
// Fotos de veículo (bucket privado vehicle-photos).
//
// Design:
//   - Bucket privado (10 MB, jpeg/png/webp) criado na migration 20260908130000.
//   - Upload sempre via service_role no server; browser não fala com Storage.
//   - photo_storage_path é a fonte da verdade; photo_url é signed URL cacheada.
//   - Portal recebe a signed URL via RPC — re-assinar quando expirar é
//     responsabilidade do server (esse módulo).
//   - Signed URL vive 7 dias (604800s). É gerada em cada refresh; nunca é
//     mostrada ao anon.
//
// Regras:
//   - Só aceita jpeg/png/webp e até 10 MB (validação server-side; migration
//     também bloqueia). Retorna 400 em violação.
//   - Cada upload substitui a foto anterior no bucket (delete do path antigo)
//     — não guardamos histórico.
// -----------------------------------------------------------------------------

export class VehiclePhotoError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const VEHICLE_PHOTOS_BUCKET = "vehicle-photos";
export const VEHICLE_PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const VEHICLE_PHOTO_ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export const VEHICLE_PHOTO_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

async function auditInline(
  db: SupabaseClient,
  entry: {
    entityType: "vehicle";
    entityId: string;
    action: string;
    previousValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
    actor: string;
    reason?: string | null;
  },
) {
  const { error } = await db.from("crm_audit_logs").insert({
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    previous_value: entry.previousValue ?? null,
    new_value: entry.newValue ?? null,
    actor: entry.actor,
    reason: entry.reason ?? null,
  });
  if (error) throw new VehiclePhotoError(`Falha ao gravar audit_log: ${error.message}`, 502);
}

interface VehicleRow {
  id: string;
  customer_id: string;
  photo_storage_path: string | null;
  photo_url: string | null;
  photo_updated_at: string | null;
}

async function loadVehicle(db: SupabaseClient, vehicleId: string, customerId: string): Promise<VehicleRow> {
  const { data, error } = await db
    .from("crm_vehicles")
    .select("id, customer_id, photo_storage_path, photo_url, photo_updated_at")
    .eq("id", vehicleId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw new VehiclePhotoError(`Falha ao consultar veículo: ${error.message}`, 502);
  if (!data) throw new VehiclePhotoError("Veículo não encontrado.", 404);
  if (data.customer_id !== customerId) throw new VehiclePhotoError("Veículo pertence a outro cliente.", 403);
  return data as VehicleRow;
}

function extForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

async function createSignedUrl(db: SupabaseClient, path: string): Promise<string> {
  const { data, error } = await db.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .createSignedUrl(path, VEHICLE_PHOTO_SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    throw new VehiclePhotoError(`Falha ao gerar signed URL: ${error?.message ?? "sem detalhe"}`, 502);
  }
  return data.signedUrl;
}

export interface UploadVehiclePhotoInput {
  customerId: string;
  vehicleId: string;
  fileBytes: ArrayBuffer;
  fileMime: string;
  fileSize: number;
  actor: string;
  db?: SupabaseClient;
}

export interface UploadVehiclePhotoResult {
  vehicleId: string;
  photoStoragePath: string;
  photoUrl: string;
  photoUpdatedAt: string;
}

export async function uploadVehiclePhoto(
  input: UploadVehiclePhotoInput,
): Promise<UploadVehiclePhotoResult> {
  const db = input.db ?? getSupabaseAdminClient("vehicle-photo.upload");

  if (!VEHICLE_PHOTO_ALLOWED_MIMES.includes(input.fileMime as typeof VEHICLE_PHOTO_ALLOWED_MIMES[number])) {
    throw new VehiclePhotoError("Formato inválido. Aceitos: JPEG, PNG, WEBP.", 400);
  }
  if (input.fileSize > VEHICLE_PHOTO_MAX_BYTES) {
    throw new VehiclePhotoError("Arquivo maior que 10 MB.", 400);
  }
  if (input.fileSize <= 0) {
    throw new VehiclePhotoError("Arquivo vazio.", 400);
  }

  const vehicle = await loadVehicle(db, input.vehicleId, input.customerId);

  const path = `${vehicle.customer_id}/${vehicle.id}/${crypto.randomUUID()}.${extForMime(input.fileMime)}`;

  const upload = await db.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .upload(path, new Uint8Array(input.fileBytes), {
      contentType: input.fileMime,
      cacheControl: "3600",
      upsert: false,
    });
  if (upload.error) throw new VehiclePhotoError(`Falha no upload: ${upload.error.message}`, 502);

  const signedUrl = await createSignedUrl(db, path);
  const now = new Date().toISOString();

  const update = await db
    .from("crm_vehicles")
    .update({
      photo_storage_path: path,
      photo_url: signedUrl,
      photo_updated_at: now,
    })
    .eq("id", vehicle.id)
    .select("photo_storage_path, photo_url, photo_updated_at")
    .single();
  if (update.error) {
    // Best-effort cleanup — objeto ficou órfão no bucket.
    await db.storage.from(VEHICLE_PHOTOS_BUCKET).remove([path]).catch(() => {});
    throw new VehiclePhotoError(`Falha ao gravar foto no cadastro: ${update.error.message}`, 502);
  }

  // Best-effort: remove foto anterior do bucket (não bloqueia sucesso).
  if (vehicle.photo_storage_path && vehicle.photo_storage_path !== path) {
    await db.storage
      .from(VEHICLE_PHOTOS_BUCKET)
      .remove([vehicle.photo_storage_path])
      .catch((err) => {
        console.warn("[vehicle-photo] falha ao remover foto anterior", err);
      });
  }

  await auditInline(db, {
    entityType: "vehicle",
    entityId: vehicle.id,
    action: "vehicle_photo.uploaded",
    previousValue: { had_photo: Boolean(vehicle.photo_storage_path) },
    newValue: { mime: input.fileMime, size_bytes: input.fileSize },
    actor: input.actor || "dgn-admin",
  });

  return {
    vehicleId: vehicle.id,
    photoStoragePath: path,
    photoUrl: signedUrl,
    photoUpdatedAt: now,
  };
}

export interface RemoveVehiclePhotoInput {
  customerId: string;
  vehicleId: string;
  actor: string;
  db?: SupabaseClient;
}

export async function removeVehiclePhoto(input: RemoveVehiclePhotoInput): Promise<{ vehicleId: string }> {
  const db = input.db ?? getSupabaseAdminClient("vehicle-photo.remove");
  const vehicle = await loadVehicle(db, input.vehicleId, input.customerId);
  if (!vehicle.photo_storage_path) {
    return { vehicleId: vehicle.id };
  }

  await db.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .remove([vehicle.photo_storage_path])
    .catch((err) => {
      console.warn("[vehicle-photo] falha ao remover objeto do bucket", err);
    });

  const update = await db
    .from("crm_vehicles")
    .update({
      photo_storage_path: null,
      photo_url: null,
      photo_updated_at: null,
    })
    .eq("id", vehicle.id);
  if (update.error) throw new VehiclePhotoError(`Falha ao limpar foto: ${update.error.message}`, 502);

  await auditInline(db, {
    entityType: "vehicle",
    entityId: vehicle.id,
    action: "vehicle_photo.removed",
    previousValue: { had_photo: true },
    newValue: null,
    actor: input.actor || "dgn-admin",
  });

  return { vehicleId: vehicle.id };
}
