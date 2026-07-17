import "server-only";

import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "../admin-session.ts";
import { CommercialWriteError, updateCommercialFields, validateCommercialPayload } from "./commercial-write.ts";

export interface CommercialRequest {
  cookies: { get(name: string): { value: string } | undefined };
  json(): Promise<unknown>;
}

interface RouteDependencies {
  authorize(request: CommercialRequest): Promise<boolean>;
  write: typeof updateCommercialFields;
  source: string;
}

const defaults: RouteDependencies = {
  authorize: (request) => validateAdminSessionToken(request.cookies.get(DGN_ADMIN_COOKIE)?.value),
  write: updateCommercialFields,
  source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
};

export async function handleCommercialPatch(
  request: CommercialRequest,
  customerId: string,
  dependencies: RouteDependencies = defaults,
) {
  if (!(await dependencies.authorize(request))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (dependencies.source !== "db") {
    return Response.json({ error: "A persistência comercial só está disponível no modo DB." }, { status: 409 });
  }
  if (!customerId || customerId.length > 200) {
    return Response.json({ error: "Cliente inválido." }, { status: 400 });
  }
  try {
    const input = validateCommercialPayload(await request.json());
    const saved = await dependencies.write(customerId, input);
    return Response.json(saved, { status: 200 });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "JSON inválido." }, { status: 400 });
    if (error instanceof CommercialWriteError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[DGN Growth] Falha controlada na escrita comercial", error instanceof Error ? error.message : "erro desconhecido");
    return Response.json({ error: "Não foi possível salvar os campos comerciais." }, { status: 500 });
  }
}
