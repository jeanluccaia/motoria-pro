import "server-only";

import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "../admin-session.ts";
import { FounderCurationWriteError, validateFounderCurationPayload, writeFounderCuration } from "./founder-curation-write.ts";
import { KNOWN_SUBSCRIBERS_2026_08_16, KNOWN_SUBSCRIBER_LEGACY_IDS } from "../known-subscribers.ts";
import { normalizeName } from "./normalizers.ts";

interface CurationRequest { cookies: { get(name: string): { value: string } | undefined }; json(): Promise<unknown> }

// Guarda server-side por legacy_id. UI já filtra elegibilidade, mas alguém
// pode disparar o POST direto — precisamos negar em duas camadas.
function findSubscriberByLegacyId(customerId: string) {
  if (KNOWN_SUBSCRIBER_LEGACY_IDS.has(customerId)) {
    const nameKey = normalizeName(customerId.replace(/-/g, " ")).normalized;
    return KNOWN_SUBSCRIBERS_2026_08_16.find((s) => normalizeName(s.name).normalized === nameKey);
  }
  const idKey = normalizeName(customerId.replace(/-/g, " ")).normalized;
  return KNOWN_SUBSCRIBERS_2026_08_16.find((s) => {
    if (normalizeName(s.name).normalized === idKey) return true;
    return (s.aliases ?? []).some((alias) => normalizeName(alias).normalized === idKey);
  });
}

export async function handleFounderCurationPost(request: CurationRequest, customerId: string, dependencies = {
  authorize: (candidate: CurationRequest) => validateAdminSessionToken(candidate.cookies.get(DGN_ADMIN_COOKIE)?.value),
  write: writeFounderCuration, source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
}) {
  if (!(await dependencies.authorize(request))) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (dependencies.source !== "db") {
    return Response.json({
      error: "Ambiente ainda está lendo do JSON local (DGN_GROWTH_DATA_SOURCE=json). Convite Founder não é persistido nesse modo — ajuste a variável na Vercel para 'db' e recarregue.",
    }, { status: 409 });
  }
  if (!customerId || customerId.length > 200) return Response.json({ error: "Cliente inválido." }, { status: 400 });
  const subscriber = findSubscriberByLegacyId(customerId);
  if (subscriber) {
    const isRenewal = subscriber.status === "renovacao_pendente";
    return Response.json({
      error: isRenewal
        ? `${subscriber.name} está com renovação pendente. Fora da fila de aquisição Founder até a renovação ser resolvida.`
        : `${subscriber.name} já é assinante DGN ${subscriber.plan}. Fora da fila de aquisição Founder.`,
    }, { status: 409 });
  }
  try {
    return Response.json(await dependencies.write(customerId, validateFounderCurationPayload(await request.json())));
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "JSON inválido." }, { status: 400 });
    if (error instanceof FounderCurationWriteError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[DGN Growth] Falha controlada na curadoria", error instanceof Error ? error.message : "erro desconhecido");
    return Response.json({ error: "Não foi possível atualizar a curadoria." }, { status: 500 });
  }
}
