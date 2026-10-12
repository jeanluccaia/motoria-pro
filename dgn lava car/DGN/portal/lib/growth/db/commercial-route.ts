import "server-only";

import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "../admin-session.ts";
import { CommercialWriteError, updateCommercialFields, validateCommercialPayload } from "./commercial-write.ts";

export interface CommercialRequest {
  cookies: { get(name: string): { value: string } | undefined };
  json(): Promise<unknown>;
  headers?: { get(name: string): string | null };
}

interface RouteDependencies {
  authorize(request: CommercialRequest): Promise<boolean>;
  write: typeof updateCommercialFields;
  source: string;
}

interface InstrumentationContext {
  requestId?: string;
  rpcTimeoutMs?: number;
}

const defaults: RouteDependencies = {
  authorize: (request) => validateAdminSessionToken(request.cookies.get(DGN_ADMIN_COOKIE)?.value),
  write: updateCommercialFields,
  source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
};

/** Preview-only. Mantém a prod silenciosa. */
function isPreviewRuntime(): boolean {
  return process.env.VERCEL_ENV === "preview" || process.env.DGN_COMMERCIAL_DEBUG === "true";
}

function logStage(requestId: string | undefined, stage: string, extra?: Record<string, unknown>) {
  if (!isPreviewRuntime()) return;
  const payload = { stage, requestId: requestId ?? "unknown", ...(extra ?? {}) };
  console.log(`[commercial] ${JSON.stringify(payload)}`);
}

export async function handleCommercialPatch(
  request: CommercialRequest,
  customerId: string,
  dependencies: RouteDependencies = defaults,
  instrumentation: InstrumentationContext = {},
) {
  const { requestId, rpcTimeoutMs } = instrumentation;

  logStage(requestId, "auth:check");
  if (!(await dependencies.authorize(request))) {
    logStage(requestId, "auth:denied");
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  logStage(requestId, "auth:ok");

  if (dependencies.source !== "db") {
    logStage(requestId, "source:not-db", { source: dependencies.source });
    return Response.json({ error: "A persistência comercial só está disponível no modo DB." }, { status: 409 });
  }
  if (!customerId || customerId.length > 200) {
    logStage(requestId, "customerId:invalid");
    return Response.json({ error: "Cliente inválido." }, { status: 400 });
  }
  try {
    logStage(requestId, "body:parsing");
    const raw = await request.json();
    logStage(requestId, "body:parsed");
    const input = validateCommercialPayload(raw);
    logStage(requestId, "validate:ok");
    logStage(requestId, "write:start", { customerId });
    const saved = await dependencies.write(customerId, input, undefined, { requestId, rpcTimeoutMs });
    logStage(requestId, "write:ok", { changed: saved.changed });
    const response = Response.json(saved, { status: 200 });
    logStage(requestId, "response:sent", { status: 200 });
    return response;
  } catch (error) {
    if (error instanceof SyntaxError) {
      logStage(requestId, "body:syntax-error");
      return Response.json({ error: "JSON inválido." }, { status: 400 });
    }
    if (error instanceof CommercialWriteError) {
      logStage(requestId, "write:controlled-error", { status: error.status, message: error.message });
      return Response.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "erro desconhecido";
    logStage(requestId, "write:unexpected", { message });
    console.error("[DGN Growth] Falha controlada na escrita comercial", message);
    return Response.json({ error: "Não foi possível salvar os campos comerciais." }, { status: 500 });
  }
}
