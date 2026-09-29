import "server-only";

import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "../admin-session.ts";
import {
  DiagnosticsError,
  attachDiagnosticPhoto,
  createDiagnosticDraft,
  detachDiagnosticPhoto,
  getDiagnosticDetail,
  listDiagnosticsByCustomer,
  patchDiagnosticDraft,
} from "./diagnostics-write.ts";
import {
  buildStoragePath,
  createDiagnosticMediaSignedUrl,
  deriveActorFingerprint,
  removeDiagnosticMedia,
  uploadDiagnosticMedia,
} from "./diagnostics-storage.ts";
import { validatePatchPayload } from "./diagnostics-validate.ts";

// ---------------------------------------------------------------------------
// Handlers testáveis (deps injetáveis). Os arquivos de rota em `app/api/...`
// só fazem `handleX(request, params)` e devolvem o Response.
// ---------------------------------------------------------------------------

export interface DiagnosticsRequest {
  cookies: { get(name: string): { value: string } | undefined };
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
  formData?: () => Promise<FormData>;
  url: string;
}

interface RouteDependencies {
  authorize(request: DiagnosticsRequest): Promise<boolean>;
  source: string;
}

const defaults: RouteDependencies = {
  authorize: (request) => validateAdminSessionToken(request.cookies.get(DGN_ADMIN_COOKIE)?.value),
  source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
};

// ---------------------------------------------------------------------------
// helpers de resposta
// ---------------------------------------------------------------------------

function unauthorized() {
  return jsonNoStore({ error: { code: "SESSION_INVALID", message: "unauthorized" } }, 401);
}
function dbOnly() {
  return jsonNoStore(
    { error: { code: "DB_MODE_REQUIRED", message: "Diagnósticos só estão disponíveis no modo DB." } },
    409,
  );
}
function errFrom(err: unknown, fallbackMsg: string) {
  if (err instanceof DiagnosticsError) {
    return jsonNoStore({ error: { code: err.code, message: err.message, details: err.extra } }, err.status);
  }
  if (err instanceof SyntaxError) {
    return jsonNoStore({ error: { code: "BAD_JSON", message: "JSON inválido" } }, 400);
  }
  console.error("[DGN Diagnósticos] erro inesperado:", err instanceof Error ? err.message : err);
  return jsonNoStore({ error: { code: "INTERNAL", message: fallbackMsg } }, 500);
}
// Contrato de concorrência: header customizado X-Expected-Revision (inteiro,
// sem aspas). NUNCA usar If-Match aqui — o Vercel intercepta If-Match quoted
// como ETag validation e devolve 412 antes do handler rodar, mesmo depois de
// o server já ter aplicado o efeito. Ver [[vercel-ifmatch-intercepta-patch]].
function requireExpectedRevision(req: DiagnosticsRequest): number | Response {
  const raw = req.headers.get("X-Expected-Revision");
  if (raw === null || raw === "") {
    return jsonNoStore(
      { error: { code: "PRECONDITION_REQUIRED", message: "X-Expected-Revision obrigatório." } },
      412,
    );
  }
  const clean = raw.trim();
  const n = Number.parseInt(clean, 10);
  if (!Number.isInteger(n) || n < 0 || String(n) !== clean) {
    return jsonNoStore(
      { error: { code: "PRECONDITION_INVALID", message: "X-Expected-Revision precisa ser inteiro não negativo (sem aspas)." } },
      412,
    );
  }
  return n;
}
function requireIdempotencyKey(req: DiagnosticsRequest): string | Response {
  const raw = req.headers.get("Idempotency-Key");
  if (!raw || raw.trim().length === 0) {
    return jsonNoStore({ error: { code: "IDEMPOTENCY_REQUIRED", message: "Idempotency-Key obrigatório." } }, 400);
  }
  return raw.trim();
}
// Response canônica pra mutação/leitura de diagnóstico:
//   * X-Current-Revision inteiro sem aspas (nunca ETag — ver requireExpectedRevision)
//   * Cache-Control: no-store (rotas admin sensíveis nunca revalidam via CDN)
function revisionResponse(body: unknown, revision: number, status = 200, replayed = false) {
  const headers = new Headers({
    "X-Current-Revision": String(revision),
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  if (replayed) headers.set("X-Replayed", "true");
  return new Response(JSON.stringify(body), { status, headers });
}
function jsonNoStore(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

// ---------------------------------------------------------------------------
// POST /api/admin/growth/customers/[id]/diagnostics
// ---------------------------------------------------------------------------

export async function handleDiagnosticsCreate(
  request: DiagnosticsRequest,
  customerIdInput: string,
  deps: RouteDependencies = defaults,
): Promise<Response> {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  const idem = requireIdempotencyKey(request);
  if (idem instanceof Response) return idem;
  const actor = deriveActorFingerprint(request.cookies.get(DGN_ADMIN_COOKIE)?.value);
  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return jsonNoStore({ error: { code: "BAD_JSON", message: "payload inválido" } }, 400);
    }
    const b = body as Record<string, unknown>;
    const vehicleId = b.vehicle_id ?? b.vehicleId;
    const catalogVersion = b.catalog_version ?? b.catalogVersion;
    const performedBy = b.performed_by ?? b.performedBy;
    if (typeof vehicleId !== "string" || typeof catalogVersion !== "string" || typeof performedBy !== "string") {
      return jsonNoStore(
        { error: { code: "VALIDATION_FAILED", message: "vehicle_id, catalog_version e performed_by são obrigatórios." } },
        422,
      );
    }
    const created = await createDiagnosticDraft({
      customerId: customerIdInput,
      vehicleId,
      catalogVersion,
      performedBy,
      actor,
      idempotencyKey: idem,
    });
    return revisionResponse(
      { diagnostic_id: created.diagnosticId, revision: created.revision, status: created.status },
      created.revision, 201, created.isReplay,
    );
  } catch (err) {
    return errFrom(err, "Falha ao criar diagnóstico.");
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/growth/customers/[id]/diagnostics?vehicle_id=&status=
// ---------------------------------------------------------------------------

export async function handleDiagnosticsList(
  request: DiagnosticsRequest,
  customerIdInput: string,
  deps: RouteDependencies = defaults,
): Promise<Response> {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  try {
    const url = new URL(request.url);
    const vehicleId = url.searchParams.get("vehicle_id") || undefined;
    const status = url.searchParams.get("status");
    const statuses = status === "all"
      ? ["draft", "review_ready", "published", "archived"]
      : status
        ? [status]
        : ["draft", "review_ready"];
    const items = await listDiagnosticsByCustomer(customerIdInput, {
      vehicleId,
      statuses,
      limit: Number.parseInt(url.searchParams.get("limit") ?? "20", 10) || 20,
    });
    return jsonNoStore({ items, next_cursor: null }, 200);
  } catch (err) {
    return errFrom(err, "Falha ao listar diagnósticos.");
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/growth/diagnostics/[id]
// ---------------------------------------------------------------------------

export async function handleDiagnosticGet(
  request: DiagnosticsRequest,
  diagnosticId: string,
  deps: RouteDependencies = defaults,
): Promise<Response> {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  try {
    const detail = await getDiagnosticDetail(diagnosticId);
    if (!detail) {
      return jsonNoStore({ error: { code: "NOT_FOUND", message: "Diagnóstico não encontrado." } }, 404);
    }
    const photos = await Promise.all(
      detail.photos.map(async (p) => {
        const url = await createDiagnosticMediaSignedUrl(p.storagePath);
        return { ...p, signedUrl: url.signedUrl, signedUrlExpiresAt: url.signedUrlExpiresAt };
      }),
    );
    return revisionResponse({ ...detail, photos }, detail.revision, 200);
  } catch (err) {
    return errFrom(err, "Falha ao ler diagnóstico.");
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/growth/diagnostics/[id]
// ---------------------------------------------------------------------------

export async function handleDiagnosticPatch(
  request: DiagnosticsRequest,
  diagnosticId: string,
  deps: RouteDependencies = defaults,
): Promise<Response> {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  const expectedRevision = requireExpectedRevision(request);
  if (expectedRevision instanceof Response) return expectedRevision;
  const actor = deriveActorFingerprint(request.cookies.get(DGN_ADMIN_COOKIE)?.value);
  try {
    const body = await request.json();
    const validation = validatePatchPayload(body);
    if (!validation.ok) {
      return jsonNoStore(
        { error: { code: "VALIDATION_FAILED", message: "Payload inválido.", details: { issues: validation.issues } } },
        422,
      );
    }
    const patched = await patchDiagnosticDraft({
      diagnosticId,
      expectedRevision,
      patch: validation.value,
      actor,
    });
    return revisionResponse({ revision: patched.revision, status: patched.status }, patched.revision, 200);
  } catch (err) {
    return errFrom(err, "Falha ao aplicar patch.");
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/growth/diagnostics/[id]/photos  (multipart/form-data)
// ---------------------------------------------------------------------------

export async function handlePhotoUpload(
  request: DiagnosticsRequest,
  diagnosticId: string,
  deps: RouteDependencies = defaults,
): Promise<Response> {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  const expectedRevision = requireExpectedRevision(request);
  if (expectedRevision instanceof Response) return expectedRevision;
  const idem = requireIdempotencyKey(request);
  if (idem instanceof Response) return idem;
  const actor = deriveActorFingerprint(request.cookies.get(DGN_ADMIN_COOKIE)?.value);

  if (!request.formData) {
    return jsonNoStore({ error: { code: "BAD_REQUEST", message: "multipart/form-data esperado." } }, 400);
  }

  let uploadedPath: string | null = null;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") ?? "inspection") as "inspection" | "hero" | "reference";
    const areaKey = form.get("area_key") ? String(form.get("area_key")) : null;
    const caption = form.get("caption") ? String(form.get("caption")) : null;
    const orderingRaw = form.get("ordering");
    const ordering = orderingRaw !== null ? Number.parseInt(String(orderingRaw), 10) : null;
    const internalOnly = String(form.get("internal_only") ?? "false") === "true";

    if (!(file instanceof Blob)) {
      return jsonNoStore({ error: { code: "VALIDATION_FAILED", message: "campo 'file' obrigatório." } }, 422);
    }
    if (kind === "inspection" && !areaKey) {
      return jsonNoStore(
        { error: { code: "VALIDATION_FAILED", message: "area_key obrigatório para kind=inspection." } },
        422,
      );
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return jsonNoStore({ error: { code: "VALIDATION_FAILED", message: `MIME não permitido: ${file.type}` } }, 422);
    }
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
      return jsonNoStore({ error: { code: "VALIDATION_FAILED", message: `size fora do limite (10 MB): ${file.size}` } }, 422);
    }

    const detail = await getDiagnosticDetail(diagnosticId);
    if (!detail) {
      return jsonNoStore({ error: { code: "NOT_FOUND", message: "Diagnóstico não encontrado." } }, 404);
    }
    uploadedPath = buildStoragePath(detail.customerId, diagnosticId, file.type);
    const bytes = await file.arrayBuffer();

    // 1) sobe pro bucket
    await uploadDiagnosticMedia(uploadedPath, bytes, file.type);
    // 2) chama RPC — se falhar, rollback do objeto
    let attachRes: Awaited<ReturnType<typeof attachDiagnosticPhoto>>;
    try {
      attachRes = await attachDiagnosticPhoto({
        diagnosticId,
        expectedRevision,
        kind,
        areaKey,
        storagePath: uploadedPath,
        mimeType: file.type,
        sizeBytes: file.size,
        caption,
        ordering,
        internalOnly,
        actor,
        idempotencyKey: idem,
      });
    } catch (rpcErr) {
      // rollback imediato
      await removeDiagnosticMedia(uploadedPath);
      throw rpcErr;
    }

    const url = await createDiagnosticMediaSignedUrl(uploadedPath);
    return revisionResponse(
      {
        photo_id: attachRes.photoId,
        storage_path: uploadedPath,
        signed_url: url.signedUrl,
        signed_url_expires_at: url.signedUrlExpiresAt,
        revision: attachRes.revision,
      },
      attachRes.revision, 201, attachRes.isReplay,
    );
  } catch (err) {
    return errFrom(err, "Falha ao anexar foto.");
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/growth/diagnostics/[id]/photos/[photoId]
// ---------------------------------------------------------------------------

export async function handlePhotoDelete(
  request: DiagnosticsRequest,
  diagnosticId: string,
  photoId: string,
  deps: RouteDependencies = defaults,
): Promise<Response> {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  const expectedRevision = requireExpectedRevision(request);
  if (expectedRevision instanceof Response) return expectedRevision;
  const actor = deriveActorFingerprint(request.cookies.get(DGN_ADMIN_COOKIE)?.value);
  try {
    const res = await detachDiagnosticPhoto({
      diagnosticId,
      expectedRevision,
      photoId,
      actor,
    });
    if (!res.wasFound) {
      // Idempotente: photo já foi apagada. Devolve 200 + revision atual.
      const cur = await getDiagnosticDetail(diagnosticId);
      const rev = cur?.revision ?? expectedRevision;
      return revisionResponse({ revision: rev, photo_state: "already_removed" }, rev, 200);
    }
    if (res.storagePath) {
      await removeDiagnosticMedia(res.storagePath);
    }
    return revisionResponse({ revision: res.revision as number }, res.revision as number, 200);
  } catch (err) {
    return errFrom(err, "Falha ao remover foto.");
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/growth/diagnostics/[id]/photos/[photoId]/signed-url
// ---------------------------------------------------------------------------

export async function handlePhotoSignedUrl(
  request: DiagnosticsRequest,
  diagnosticId: string,
  photoId: string,
  deps: RouteDependencies = defaults,
): Promise<Response> {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  try {
    const detail = await getDiagnosticDetail(diagnosticId);
    if (!detail) {
      return jsonNoStore({ error: { code: "NOT_FOUND", message: "Diagnóstico não encontrado." } }, 404);
    }
    const photo = detail.photos.find((p) => p.id === photoId);
    if (!photo) {
      return jsonNoStore({ error: { code: "PHOTO_NOT_FOUND", message: "Foto não encontrada." } }, 404);
    }
    const url = await createDiagnosticMediaSignedUrl(photo.storagePath);
    return jsonNoStore({ signed_url: url.signedUrl, signed_url_expires_at: url.signedUrlExpiresAt }, 200);
  } catch (err) {
    return errFrom(err, "Falha ao regenerar signed URL.");
  }
}
