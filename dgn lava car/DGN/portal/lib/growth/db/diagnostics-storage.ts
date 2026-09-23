import "server-only";

import { randomUUID, createHash } from "node:crypto";
import { getSupabaseAdminClient } from "./admin-client.ts";
import { DiagnosticsError } from "./diagnostics-write.ts";

// ---------------------------------------------------------------------------
// Storage helpers — bucket `diagnostic-media`.
//
// Regras:
//   * Path canônico: `<customer_id>/<diagnostic_id>/<uuid>.<ext>` — fixado
//     aqui, nunca aceito do client.
//   * Signed URL: 15 min por default. Endpoint regenera quando expira.
//   * Upload rollback: se algo depois do upload falhar (RPC etc.), o
//     endpoint chama `removeDiagnosticMedia` pra apagar o objeto.
// ---------------------------------------------------------------------------

const BUCKET = "diagnostic-media";
const SIGNED_URL_TTL_SECONDS = 15 * 60;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function buildStoragePath(customerId: string, diagnosticId: string, mimeType: string): string {
  const ext = MIME_TO_EXT[mimeType];
  if (!ext) {
    throw new DiagnosticsError("VALIDATION_FAILED", `MIME não suportado: ${mimeType}`, 422);
  }
  return `${customerId}/${diagnosticId}/${randomUUID()}.${ext}`;
}

export async function uploadDiagnosticMedia(
  storagePath: string,
  fileBytes: ArrayBuffer,
  mimeType: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient("crm.diagnostic-media");
  const { error } = await supabase.storage.from(BUCKET).upload(
    storagePath,
    new Uint8Array(fileBytes),
    { contentType: mimeType, upsert: false },
  );
  if (error) {
    throw new DiagnosticsError("UPLOAD_FAILED", `Upload rejeitado: ${error.message}`, 502);
  }
}

/**
 * Remove um objeto do bucket. Idempotente: se o objeto não existir mais,
 * NÃO lança — só loga. Usado em (a) DELETE photo depois da RPC, e
 * (b) rollback quando a RPC attach falha logo após o upload.
 */
export async function removeDiagnosticMedia(storagePath: string): Promise<void> {
  const supabase = getSupabaseAdminClient("crm.diagnostic-media");
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) {
    console.warn(
      "[DGN Diagnósticos] cleanup do bucket falhou em %s: %s",
      storagePath, error.message,
    );
  }
}

export interface SignedUrlPair {
  signedUrl: string;
  signedUrlExpiresAt: string;
}

export async function createDiagnosticMediaSignedUrl(storagePath: string): Promise<SignedUrlPair> {
  const supabase = getSupabaseAdminClient("crm.diagnostic-media");
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(
    storagePath, SIGNED_URL_TTL_SECONDS,
  );
  if (error || !data) {
    throw new DiagnosticsError("SIGN_URL_FAILED", `Falha ao assinar URL: ${error?.message ?? "?"}`, 500);
  }
  return {
    signedUrl: data.signedUrl,
    signedUrlExpiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// actorFingerprint — hash SHA-256 do cookie de sessão. NUNCA log do cookie.
// Usado como p_actor nas RPCs, formato "admin:<fingerprint-12>".
// ---------------------------------------------------------------------------

export function deriveActorFingerprint(cookieValue: string | null | undefined): string {
  if (!cookieValue) return "admin:anonymous";
  const digest = createHash("sha256").update(cookieValue).digest("hex").slice(0, 12);
  return `admin:${digest}`;
}
