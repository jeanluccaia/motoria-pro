import "server-only";

import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "../admin-session.ts";
import { FounderCurationWriteError, validateFounderCurationPayload, writeFounderCuration } from "./founder-curation-write.ts";

interface CurationRequest { cookies: { get(name: string): { value: string } | undefined }; json(): Promise<unknown> }

export async function handleFounderCurationPost(request: CurationRequest, customerId: string, dependencies = {
  authorize: (candidate: CurationRequest) => validateAdminSessionToken(candidate.cookies.get(DGN_ADMIN_COOKIE)?.value),
  write: writeFounderCuration, source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
}) {
  if (!(await dependencies.authorize(request))) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (dependencies.source !== "db") return Response.json({ error: "Curadoria disponível somente no modo DB." }, { status: 409 });
  if (!customerId || customerId.length > 200) return Response.json({ error: "Cliente inválido." }, { status: 400 });
  try {
    return Response.json(await dependencies.write(customerId, validateFounderCurationPayload(await request.json())));
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "JSON inválido." }, { status: 400 });
    if (error instanceof FounderCurationWriteError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[DGN Growth] Falha controlada na curadoria", error instanceof Error ? error.message : "erro desconhecido");
    return Response.json({ error: "Não foi possível atualizar a curadoria." }, { status: 500 });
  }
}
