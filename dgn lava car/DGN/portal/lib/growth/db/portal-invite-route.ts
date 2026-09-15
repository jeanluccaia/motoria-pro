import "server-only";

import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "../admin-session.ts";
import { PortalInviteError, prepareWhatsAppInvite } from "./portal-invite-write.ts";

export interface PortalInviteRequest {
  cookies: { get(name: string): { value: string } | undefined };
  json?(): Promise<unknown>;
  url: string;
}

interface RouteDependencies {
  authorize(request: PortalInviteRequest): Promise<boolean>;
  source: string;
}

const defaults: RouteDependencies = {
  authorize: (request) => validateAdminSessionToken(request.cookies.get(DGN_ADMIN_COOKIE)?.value),
  source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
};

function unauthorized() { return Response.json({ error: "unauthorized" }, { status: 401 }); }
function dbOnly() { return Response.json({ error: "Convite pelo WhatsApp só está disponível no modo DB." }, { status: 409 }); }
function invalidId() { return Response.json({ error: "Cliente inválido." }, { status: 400 }); }

function toResponse(error: unknown, fallback: string) {
  if (error instanceof PortalInviteError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status });
  }
  console.error("[DGN Growth] Falha no fluxo portal-invite", error instanceof Error ? error.message : "erro desconhecido");
  return Response.json({ error: fallback }, { status: 500 });
}

export async function handlePortalInvitePost(
  request: PortalInviteRequest,
  customerId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();

  try {
    const invite = await prepareWhatsAppInvite({ customerId, actor: "dgn-admin" });
    // Nunca ecoamos o customerId original (o resolver pode ter recebido slug);
    // devolvemos só o que o UI precisa para abrir o wa.me e mostrar preview.
    return Response.json({
      url: invite.url,
      message: invite.message,
      phoneE164: invite.phoneE164,
      destinationLast4: invite.destinationLast4,
      portalLoginUrl: invite.portalLoginUrl,
      templateVersion: invite.templateVersion,
      firstName: invite.firstName,
    }, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível preparar o convite.");
  }
}
