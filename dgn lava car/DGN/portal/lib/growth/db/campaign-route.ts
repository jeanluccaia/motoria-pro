import "server-only";

import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "../admin-session.ts";
import { CampaignWriteError, updateCampaignPipeline, validateCampaignPayload } from "./campaign-write.ts";

interface CampaignRequest { cookies: { get(name: string): { value: string } | undefined }; json(): Promise<unknown> }
interface Dependencies { authorize(request: CampaignRequest): Promise<boolean>; write: typeof updateCampaignPipeline; source: string }
const defaults: Dependencies = {
  authorize: (request) => validateAdminSessionToken(request.cookies.get(DGN_ADMIN_COOKIE)?.value),
  write: updateCampaignPipeline,
  source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
};

export async function handleCampaignPatch(request: CampaignRequest, customerId: string, dependencies: Dependencies = defaults) {
  if (!(await dependencies.authorize(request))) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (dependencies.source !== "db") return Response.json({ error: "Pipeline disponível somente no modo DB." }, { status: 409 });
  if (!customerId || customerId.length > 200) return Response.json({ error: "Cliente inválido." }, { status: 400 });
  try {
    const saved = await dependencies.write(customerId, validateCampaignPayload(await request.json()));
    return Response.json(saved);
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "JSON inválido." }, { status: 400 });
    if (error instanceof CampaignWriteError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[DGN Growth] Falha controlada no pipeline", error instanceof Error ? error.message : "erro desconhecido");
    return Response.json({ error: "Não foi possível atualizar o pipeline." }, { status: 500 });
  }
}
