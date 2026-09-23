import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";
import { CustomerResolutionError, resolveCustomerId } from "./customer-resolver.ts";

// ---------------------------------------------------------------------------
// Camada de escrita para DGN Diagnósticos — Entrega 1.
//
// Regras invioláveis (também garantidas server-side nas RPCs):
//   * TODA escrita passa pelas 4 RPCs canônicas (create/patch/attach/detach).
//     Nunca INSERT/UPDATE/DELETE direto — o grant não permite mesmo que a
//     gente errasse a chamada aqui.
//   * Idempotency-Key obrigatório em create/attach — o header do endpoint
//     é repassado 1:1 pra RPC. Duas chamadas com a mesma chave devolvem
//     `is_replay=true` e o mesmo id.
//   * Optimistic locking via `p_expected_revision`. Se stale, a RPC devolve
//     `CONFLICT_REVISION_STALE`; aqui traduzimos pra DiagnosticsError(409).
// ---------------------------------------------------------------------------

export class DiagnosticsError extends Error {
  readonly status: number;
  readonly code: string;
  readonly extra: Record<string, unknown>;
  constructor(code: string, message: string, status: number, extra: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

async function resolve(db: SupabaseClient, input: string): Promise<string> {
  try {
    return await resolveCustomerId(db, input);
  } catch (err) {
    if (err instanceof CustomerResolutionError) {
      throw new DiagnosticsError(
        err.status === 404 ? "CUSTOMER_NOT_FOUND" : "VALIDATION_FAILED",
        err.message,
        err.status,
      );
    }
    throw err;
  }
}

function db(): SupabaseClient {
  return getSupabaseAdminClient("crm.diagnostics");
}

// ---------------------------------------------------------------------------
// create draft
// ---------------------------------------------------------------------------

export interface CreateDraftInput {
  customerId: string;
  vehicleId: string;
  catalogVersion: string;
  performedBy: string;
  actor: string;
  idempotencyKey: string;
}

export interface CreateDraftResult {
  diagnosticId: string;
  revision: number;
  status: "draft";
  isReplay: boolean;
}

export async function createDiagnosticDraft(input: CreateDraftInput): Promise<CreateDraftResult> {
  const supabase = db();
  const customerUuid = await resolve(supabase, input.customerId);
  const { data, error } = await supabase.rpc("crm_create_diagnostic_draft", {
    p_customer_id: customerUuid,
    p_vehicle_id: input.vehicleId,
    p_catalog_version: input.catalogVersion,
    p_performed_by: input.performedBy,
    p_actor: input.actor,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw mapRpcError(error, "Falha ao criar rascunho de diagnóstico.");
  const row = (data as { result_code: string; diagnostic_id: string; is_replay: boolean }[])[0];
  if (!row) throw new DiagnosticsError("RPC_EMPTY", "RPC create_diagnostic_draft não devolveu linha.", 500);
  return {
    diagnosticId: row.diagnostic_id,
    revision: 0, // acabou de nascer; próximo GET pode devolver real (replay preserva 0..N)
    status: "draft",
    isReplay: row.is_replay === true,
  };
}

// ---------------------------------------------------------------------------
// patch draft (autosave)
// ---------------------------------------------------------------------------

export interface PatchDraftInput {
  diagnosticId: string;
  expectedRevision: number;
  patch: Record<string, unknown>;
  actor: string;
}

export interface PatchDraftResult {
  revision: number;
  status: string;
}

export async function patchDiagnosticDraft(input: PatchDraftInput): Promise<PatchDraftResult> {
  const supabase = db();
  const { data, error } = await supabase.rpc("crm_patch_diagnostic_draft", {
    p_diagnostic_id: input.diagnosticId,
    p_expected_revision: input.expectedRevision,
    p_patch: input.patch,
    p_actor: input.actor,
  });
  if (error) throw mapRpcError(error, "Falha ao salvar rascunho.");
  const row = (data as { result_code: string; new_revision: number; current_revision: number }[])[0];
  if (!row) throw new DiagnosticsError("RPC_EMPTY", "RPC patch_diagnostic_draft não devolveu linha.", 500);
  if (row.result_code === "NOT_FOUND") {
    throw new DiagnosticsError("NOT_FOUND", "Diagnóstico não encontrado.", 404);
  }
  if (row.result_code === "STATUS_NOT_EDITABLE") {
    throw new DiagnosticsError("STATUS_NOT_EDITABLE", "Diagnóstico não é mais editável.", 409, {
      current_revision: row.current_revision,
    });
  }
  if (row.result_code === "CONFLICT_REVISION_STALE") {
    throw new DiagnosticsError(
      "CONFLICT_REVISION_STALE",
      "Este diagnóstico foi alterado em outra sessão.",
      409,
      { current_revision: row.current_revision },
    );
  }
  // Buscar status atual pra devolver junto (endpoint costuma exibir)
  const { data: statusRow } = await supabase
    .from("crm_diagnostics")
    .select("status")
    .eq("id", input.diagnosticId)
    .maybeSingle();
  return {
    revision: row.new_revision,
    status: (statusRow?.status as string) ?? "draft",
  };
}

// ---------------------------------------------------------------------------
// attach photo (só grava metadata; upload físico é responsabilidade do storage)
// ---------------------------------------------------------------------------

export interface AttachPhotoInput {
  diagnosticId: string;
  expectedRevision: number;
  kind: "inspection" | "hero" | "reference";
  areaKey: string | null;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  caption: string | null;
  ordering: number | null;
  internalOnly: boolean;
  actor: string;
  idempotencyKey: string;
}

export interface AttachPhotoResult {
  photoId: string;
  revision: number;
  isReplay: boolean;
}

export async function attachDiagnosticPhoto(input: AttachPhotoInput): Promise<AttachPhotoResult> {
  const supabase = db();
  const { data, error } = await supabase.rpc("crm_attach_diagnostic_photo", {
    p_diagnostic_id: input.diagnosticId,
    p_expected_revision: input.expectedRevision,
    p_kind: input.kind,
    p_area_key: input.areaKey,
    p_storage_path: input.storagePath,
    p_mime_type: input.mimeType,
    p_size_bytes: input.sizeBytes,
    p_caption: input.caption,
    p_ordering: input.ordering,
    p_internal_only: input.internalOnly,
    p_actor: input.actor,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw mapRpcError(error, "Falha ao anexar foto.");
  const row = (data as {
    result_code: string; photo_id: string | null; new_revision: number | null; is_replay: boolean;
  }[])[0];
  if (!row) throw new DiagnosticsError("RPC_EMPTY", "RPC attach_diagnostic_photo não devolveu linha.", 500);
  if (row.result_code === "NOT_FOUND") {
    throw new DiagnosticsError("NOT_FOUND", "Diagnóstico não encontrado.", 404);
  }
  if (row.result_code === "CONFLICT_REVISION_STALE") {
    throw new DiagnosticsError(
      "CONFLICT_REVISION_STALE",
      "Este diagnóstico foi alterado em outra sessão.",
      409,
      { current_revision: row.new_revision },
    );
  }
  return {
    photoId: row.photo_id as string,
    revision: row.new_revision as number,
    isReplay: row.is_replay === true,
  };
}

// ---------------------------------------------------------------------------
// detach photo — devolve storage_path pro endpoint remover do bucket
// ---------------------------------------------------------------------------

export interface DetachPhotoInput {
  diagnosticId: string;
  expectedRevision: number;
  photoId: string;
  actor: string;
}

export interface DetachPhotoResult {
  storagePath: string | null;   // null quando PHOTO_NOT_FOUND (retry idempotente)
  revision: number | null;
  wasFound: boolean;
}

export async function detachDiagnosticPhoto(input: DetachPhotoInput): Promise<DetachPhotoResult> {
  const supabase = db();
  const { data, error } = await supabase.rpc("crm_detach_diagnostic_photo", {
    p_diagnostic_id: input.diagnosticId,
    p_expected_revision: input.expectedRevision,
    p_photo_id: input.photoId,
    p_actor: input.actor,
  });
  if (error) throw mapRpcError(error, "Falha ao remover foto.");
  const row = (data as { result_code: string; storage_path: string | null; new_revision: number | null }[])[0];
  if (!row) throw new DiagnosticsError("RPC_EMPTY", "RPC detach_diagnostic_photo não devolveu linha.", 500);
  if (row.result_code === "NOT_FOUND") {
    throw new DiagnosticsError("NOT_FOUND", "Diagnóstico não encontrado.", 404);
  }
  if (row.result_code === "CONFLICT_REVISION_STALE") {
    throw new DiagnosticsError(
      "CONFLICT_REVISION_STALE",
      "Este diagnóstico foi alterado em outra sessão.",
      409,
      { current_revision: row.new_revision },
    );
  }
  if (row.result_code === "PHOTO_NOT_FOUND") {
    // Idempotente pra retries — não é erro fatal.
    return { storagePath: null, revision: null, wasFound: false };
  }
  return {
    storagePath: row.storage_path,
    revision: row.new_revision,
    wasFound: true,
  };
}

// ---------------------------------------------------------------------------
// leituras
// ---------------------------------------------------------------------------

export interface DiagnosticListRow {
  id: string;
  vehicleId: string;
  vehicleLabel: string;
  status: string;
  revision: number;
  catalogVersion: string;
  performedBy: string;
  performedAt: string | null;
  updatedAt: string;
  photoCount: number;
}

export async function listDiagnosticsByCustomer(
  customerIdInput: string,
  options: { vehicleId?: string; statuses?: string[]; limit?: number } = {},
): Promise<DiagnosticListRow[]> {
  const supabase = db();
  const customerId = await resolve(supabase, customerIdInput);
  const statuses = options.statuses && options.statuses.length > 0
    ? options.statuses
    : ["draft", "review_ready"];

  let query = supabase
    .from("crm_diagnostics")
    .select("id, vehicle_id, status, revision, catalog_version, performed_by, performed_at, updated_at")
    .eq("customer_id", customerId)
    .in("status", statuses)
    .order("updated_at", { ascending: false })
    .limit(options.limit ?? 20);
  if (options.vehicleId) query = query.eq("vehicle_id", options.vehicleId);

  const { data: diags, error } = await query;
  if (error) throw new DiagnosticsError("DB_READ", `Falha ao listar diagnósticos: ${error.message}`, 500);
  const rows = (diags ?? []) as Array<{
    id: string; vehicle_id: string; status: string; revision: number;
    catalog_version: string; performed_by: string; performed_at: string | null; updated_at: string;
  }>;
  if (rows.length === 0) return [];

  // Enriquecimento: veículo (label) + count de fotos por diagnóstico
  const vehicleIds = Array.from(new Set(rows.map((r) => r.vehicle_id)));
  const diagIds = rows.map((r) => r.id);
  const [{ data: vehicles }, { data: photoCounts }] = await Promise.all([
    supabase.from("crm_vehicles").select("id, brand, model, plate").in("id", vehicleIds),
    supabase.from("crm_diagnostic_photos").select("diagnostic_id").in("diagnostic_id", diagIds),
  ]);
  const vehicleMap = new Map<string, string>();
  for (const v of vehicles ?? []) {
    const label = [
      (v as { brand?: string }).brand,
      (v as { model?: string }).model,
      (v as { plate?: string }).plate,
    ].filter(Boolean).join(" · ");
    vehicleMap.set((v as { id: string }).id, label || "Veículo sem descrição");
  }
  const countMap = new Map<string, number>();
  for (const p of photoCounts ?? []) {
    const id = (p as { diagnostic_id: string }).diagnostic_id;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  return rows.map((r) => ({
    id: r.id,
    vehicleId: r.vehicle_id,
    vehicleLabel: vehicleMap.get(r.vehicle_id) ?? "—",
    status: r.status,
    revision: r.revision,
    catalogVersion: r.catalog_version,
    performedBy: r.performed_by,
    performedAt: r.performed_at,
    updatedAt: r.updated_at,
    photoCount: countMap.get(r.id) ?? 0,
  }));
}

export interface DiagnosticDetail {
  id: string;
  customerId: string;
  vehicleId: string;
  status: string;
  revision: number;
  catalogVersion: string;
  performedBy: string;
  performedAt: string | null;
  inspectionAreas: unknown[];
  scores: unknown[];
  recommendations: unknown[];
  investmentItems: unknown[];
  summary: string;
  publicVisibilityDefaults: Record<string, unknown>;
  updatedAt: string;
  photos: Array<{
    id: string;
    kind: string;
    areaKey: string | null;
    caption: string | null;
    ordering: number;
    internalOnly: boolean;
    storagePath: string;
  }>;
}

export async function getDiagnosticDetail(diagnosticId: string): Promise<DiagnosticDetail | null> {
  const supabase = db();
  const { data: row, error } = await supabase
    .from("crm_diagnostics")
    .select(
      "id, customer_id, vehicle_id, status, revision, catalog_version, performed_by, performed_at, inspection_areas, scores, recommendations, investment_items, summary, public_visibility_defaults, updated_at",
    )
    .eq("id", diagnosticId)
    .maybeSingle();
  if (error) throw new DiagnosticsError("DB_READ", `Falha ao ler diagnóstico: ${error.message}`, 500);
  if (!row) return null;
  const { data: photos, error: photosErr } = await supabase
    .from("crm_diagnostic_photos")
    .select("id, kind, area_key, caption, ordering, internal_only, storage_path")
    .eq("diagnostic_id", diagnosticId)
    .order("ordering", { ascending: true })
    .order("uploaded_at", { ascending: true });
  if (photosErr) throw new DiagnosticsError("DB_READ", `Falha ao ler fotos: ${photosErr.message}`, 500);

  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    customerId: r.customer_id as string,
    vehicleId: r.vehicle_id as string,
    status: r.status as string,
    revision: r.revision as number,
    catalogVersion: r.catalog_version as string,
    performedBy: r.performed_by as string,
    performedAt: (r.performed_at as string | null) ?? null,
    inspectionAreas: (r.inspection_areas as unknown[]) ?? [],
    scores: (r.scores as unknown[]) ?? [],
    recommendations: (r.recommendations as unknown[]) ?? [],
    investmentItems: (r.investment_items as unknown[]) ?? [],
    summary: (r.summary as string) ?? "",
    publicVisibilityDefaults: (r.public_visibility_defaults as Record<string, unknown>) ?? {},
    updatedAt: r.updated_at as string,
    photos: (photos ?? []).map((p) => ({
      id: (p as { id: string }).id,
      kind: (p as { kind: string }).kind,
      areaKey: (p as { area_key: string | null }).area_key,
      caption: (p as { caption: string | null }).caption,
      ordering: (p as { ordering: number }).ordering,
      internalOnly: (p as { internal_only: boolean }).internal_only,
      storagePath: (p as { storage_path: string }).storage_path,
    })),
  };
}

// ---------------------------------------------------------------------------
// mapRpcError — Postgres erros comuns → DiagnosticsError semântico.
// ---------------------------------------------------------------------------

function mapRpcError(err: { message: string; code?: string }, fallback: string): DiagnosticsError {
  const msg = err.message || fallback;
  // 23505 = unique_violation → tratamos como "replay" (não deveria acontecer
  // porque a RPC já checa antes; mas o UNIQUE constraint é a última defesa).
  if (err.code === "23505") return new DiagnosticsError("DUPLICATE", msg, 409);
  // 23514 = check_violation
  if (err.code === "23514") return new DiagnosticsError("VALIDATION_FAILED", msg, 422);
  return new DiagnosticsError("DB_WRITE", msg, 500);
}
