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
  return Response.json({ error: { code: "SESSION_INVALID", message: "unauthorized" } }, { status: 401 });
}
function dbOnly() {
  return Response.json(
    { error: { code: "DB_MODE_REQUIRED", message: "Diagnósticos só estão disponíveis no modo DB." } },
    { status: 409 },
  );
}
function errFrom(err: unknown, fallbackMsg: string) {
  if (err instanceof DiagnosticsError) {
    return Response.json({ error: { code: err.code, message: err.message, details: err.extra } }, { status: err.status });
  }
  if (err instanceof SyntaxError) {
    return Response.json({ error: { code: "BAD_JSON", message: "JSON inválido" } }, { status: 400 });
  }
  console.error("[DGN Diagnósticos] erro inesperado:", err instanceof Error ? err.message : err);
  return Response.json({ error: { code: "INTERNAL", message: fallbackMsg } }, { status: 500 });
}
function requireIfMatch(req: DiagnosticsRequest): number | Response {
  const raw = req.headers.get("If-Match");
  if (!raw) {
    return Response.json(
      { error: { code: "PRECONDITION_REQUIRED", message: "If-Match: <revision> obrigatório." } },
      { status: 412 },
    );
  }
  const clean = raw.replace(/"/g, "").trim();
  const n = Number.parseInt(clean, 10);
  if (!Number.isInteger(n) || n < 0) {
    return Response.json(
      { error: { code: "PRECONDITION_REQUIRED", message: "If-Match precisa ser inteiro >= 0." } },
      { status: 412 },
    );
  }
  return n;
}
function requireIdempotencyKey(req: DiagnosticsRequest): string | Response {
  const raw = req.headers.get("Idempotency-Key");
  if (!raw || raw.trim().length === 0) {
    return Response.json(
      { error: { code: "IDEMPOTENCY_REQUIRED", message: "Idempotency-Key obrigatório." } },
      { status: 400 },
    );
  }
  return raw.trim();
}
function etagResponse(body: unknown, revision: number, status = 200, replayed = false) {
  const headers = new Headers({
    ETag: `"${revision}"`,
    "Content-Type": "application/json; charset=utf-8",
  });
  if (replayed) headers.set("X-Replayed", "true");
  return new Response(JSON.stringify(body), { status, headers });
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
      return Response.json({ error: { code: "BAD_JSON", message: "payload inválido" } }, { status: 400 });
    }
    const b = body as Record<string, unknown>;
    const vehicleId = b.vehicle_id ?? b.vehicleId;
    const catalogVersion = b.catalog_version ?? b.catalogVersion;
    const performedBy = b.performed_by ?? b.performedBy;
    if (typeof vehicleId !== "string" || typeof catalogVersion !== "string" || typeof performedBy !== "string") {
      return Response.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "vehicle_id, catalog_version e performed_by são obrigatórios.",
          },
        },
        { status: 422 },
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
    return etagResponse(
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
    return Response.json({ items, next_cursor: null }, { status: 200 });
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
      return Response.json({ error: { code: "NOT_FOUND", message: "Diagnóstico não encontrado." } }, { status: 404 });
    }
    // Signed URLs para as fotos
    const photos = await Promise.all(
      detail.photos.map(async (p) => {
        const url = await createDiagnosticMediaSignedUrl(p.storagePath);
        return { ...p, signedUrl: url.signedUrl, signedUrlExpiresAt: url.signedUrlExpiresAt };
      }),
    );
    return etagResponse({ ...detail, photos }, detail.revision, 200);
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
  const ifMatch = requireIfMatch(request);
  if (ifMatch instanceof Response) return ifMatch;
  const actor = deriveActorFingerprint(request.cookies.get(DGN_ADMIN_COOKIE)?.value);
  try {
    const body = await request.json();
    const validation = validatePatchPayload(body);
    if (!validation.ok) {
      return Response.json(
        { error: { code: "VALIDATION_FAILED", message: "Payload inválido.", details: { issues: validation.issues } } },
        { status: 422 },
      );
    }
    const patched = await patchDiagnosticDraft({
      diagnosticId,
      expectedRevision: ifMatch,
      patch: validation.value,
      actor,
    });
    return etagResponse({ revision: patched.revision, status: patched.status }, patched.revision, 200);
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
  const ifMatch = requireIfMatch(request);
  if (ifMatch instanceof Response) return ifMatch;
  const idem = requireIdempotencyKey(request);
  if (idem instanceof Response) return idem;
  const actor = deriveActorFingerprint(request.cookies.get(DGN_ADMIN_COOKIE)?.value);

  if (!request.formData) {
    return Response.json({ error: { code: "BAD_REQUEST", message: "multipart/form-data esperado." } }, { status: 400 });
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
      return Response.json({ error: { code: "VALIDATION_FAILED", message: "campo 'file' obrigatório." } }, { status: 422 });
    }
    if (kind === "inspection" && !areaKey) {
      return Response.json(
        { error: { code: "VALIDATION_FAILED", message: "area_key obrigatório para kind=inspection." } },
        { status: 422 },
      );
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return Response.json(
        { error: { code: "VALIDATION_FAILED", message: `MIME não permitido: ${file.type}` } },
        { status: 422 },
      );
    }
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
      return Response.json(
        { error: { code: "VALIDATION_FAILED", message: `size fora do limite (10 MB): ${file.size}` } },
        { status: 422 },
      );
    }

    // Precisamos do customer_id pra montar o storage path canônico
    const detail = await getDiagnosticDetail(diagnosticId);
    if (!detail) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Diagnóstico não encontrado." } }, { status: 404 });
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
        expectedRevision: ifMatch,
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
    return etagResponse(
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
  const ifMatch = requireIfMatch(request);
  if (ifMatch instanceof Response) return ifMatch;
  const actor = deriveActorFingerprint(request.cookies.get(DGN_ADMIN_COOKIE)?.value);
  try {
    const res = await detachDiagnosticPhoto({
      diagnosticId,
      expectedRevision: ifMatch,
      photoId,
      actor,
    });
    if (!res.wasFound) {
      // Idempotente: photo já foi apagada. Devolve 200 + revision atual.
      const cur = await getDiagnosticDetail(diagnosticId);
      const rev = cur?.revision ?? ifMatch;
      return etagResponse({ revision: rev, photo_state: "already_removed" }, rev, 200);
    }
    if (res.storagePath) {
      await removeDiagnosticMedia(res.storagePath);
    }
    return etagResponse({ revision: res.revision as number }, res.revision as number, 200);
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
      return Response.json({ error: { code: "NOT_FOUND", message: "Diagnóstico não encontrado." } }, { status: 404 });
    }
    const photo = detail.photos.find((p) => p.id === photoId);
    if (!photo) {
      return Response.json({ error: { code: "PHOTO_NOT_FOUND", message: "Foto não encontrada." } }, { status: 404 });
    }
    const url = await createDiagnosticMediaSignedUrl(photo.storagePath);
    return Response.json({ signed_url: url.signedUrl, signed_url_expires_at: url.signedUrlExpiresAt }, { status: 200 });
  } catch (err) {
    return errFrom(err, "Falha ao regenerar signed URL.");
  }
}
