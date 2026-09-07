import "server-only";

import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "../admin-session.ts";
import {
  PortalAccessError,
  disablePortalAccess,
  provisionPortalAccess,
  readPortalAccessStatus,
  resendPortalAccess,
} from "./portal-access-write.ts";

// Payload minúsculo e explícito — o form do admin só entrega { email }.
export interface PortalAccessRequest {
  cookies: { get(name: string): { value: string } | undefined };
  json(): Promise<unknown>;
}

interface RouteDependencies {
  authorize(request: PortalAccessRequest): Promise<boolean>;
  source: string;
}

const defaults: RouteDependencies = {
  authorize: (request) => validateAdminSessionToken(request.cookies.get(DGN_ADMIN_COOKIE)?.value),
  source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
};

function unauthorized() { return Response.json({ error: "unauthorized" }, { status: 401 }); }
function dbOnly() { return Response.json({ error: "A provisão do Portal só está disponível no modo DB." }, { status: 409 }); }
function invalidId() { return Response.json({ error: "Cliente inválido." }, { status: 400 }); }

function toResponse(error: unknown, fallback: string) {
  if (error instanceof PortalAccessError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return Response.json({ error: "JSON inválido." }, { status: 400 });
  console.error("[DGN Growth] Falha no fluxo portal-access", error instanceof Error ? error.message : "erro desconhecido");
  return Response.json({ error: fallback }, { status: 500 });
}

export async function handlePortalAccessGet(request: PortalAccessRequest, customerId: string, deps: RouteDependencies = defaults) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  try {
    const status = await readPortalAccessStatus(customerId);
    return Response.json(status, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível ler o status do Portal.");
  }
}

export async function handlePortalAccessPost(request: PortalAccessRequest, customerId: string, deps: RouteDependencies = defaults) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "payload inválido" }, { status: 400 });
    }
    const email = (body as { email?: unknown }).email;
    const result = await provisionPortalAccess({ customerId, email: email as string, actor: "dgn-admin" });
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível liberar o acesso ao Portal.");
  }
}

export async function handlePortalAccessPatch(request: PortalAccessRequest, customerId: string, deps: RouteDependencies = defaults) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  try {
    const result = await resendPortalAccess(customerId, "dgn-admin");
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível reenviar o acesso.");
  }
}

export async function handlePortalAccessDelete(request: PortalAccessRequest, customerId: string, deps: RouteDependencies = defaults) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  try {
    const result = await disablePortalAccess(customerId, "dgn-admin");
    return Response.json(result, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível desabilitar o Portal.");
  }
}
