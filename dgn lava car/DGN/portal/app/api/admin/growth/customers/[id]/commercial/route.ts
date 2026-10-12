import type { NextRequest } from "next/server";
import { handleCommercialPatch } from "@/lib/growth/db/commercial-route";

/** Preview-only (VERCEL_ENV=preview). Em prod, timeout=0 → sem armadilha. */
const RPC_TIMEOUT_MS_PREVIEW = 8_000;

function isPreviewRuntime(): boolean {
  return process.env.VERCEL_ENV === "preview" || process.env.DGN_COMMERCIAL_DEBUG === "true";
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const t0 = Date.now();

  if (isPreviewRuntime()) {
    const vercelId = request.headers.get("x-vercel-id") ?? null;
    console.log(
      `[commercial] ${JSON.stringify({
        stage: "handler:start",
        requestId,
        customerId: id,
        vercelId,
        method: "PATCH",
        startedAtIso: new Date(t0).toISOString(),
      })}`,
    );
  }

  const rpcTimeoutMs = isPreviewRuntime() ? RPC_TIMEOUT_MS_PREVIEW : 0;

  try {
    const response = await handleCommercialPatch(request, id, undefined, { requestId, rpcTimeoutMs });
    if (isPreviewRuntime()) {
      console.log(
        `[commercial] ${JSON.stringify({
          stage: "handler:done",
          requestId,
          status: response.status,
          elapsedMs: Date.now() - t0,
        })}`,
      );
    }
    return response;
  } catch (error) {
    if (isPreviewRuntime()) {
      console.error(
        `[commercial] ${JSON.stringify({
          stage: "handler:unhandled",
          requestId,
          elapsedMs: Date.now() - t0,
          message: error instanceof Error ? error.message : String(error),
        })}`,
      );
    }
    throw error;
  }
}
