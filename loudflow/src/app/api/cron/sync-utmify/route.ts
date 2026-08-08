import { NextResponse } from "next/server";
import { isCronSecretConfigured, INTEGRATION_UNAVAILABLE_REASON } from "@/lib/integrations/utmify/env";

// Endpoint interno do cron diário. Requer `UTMIFY_CRON_SECRET` para
// aceitar qualquer requisição.
//
// Nesta versão a sincronização automática está desativada porque o
// contrato HTTP oficial da UTMify para leitura de métricas ainda não foi
// confirmado. Mesmo autenticado, o endpoint responde 503 informando a
// limitação e não toca no banco.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isCronSecretConfigured()) {
    return NextResponse.json({ ok: false, error: "cron-not-configured" }, { status: 503 });
  }
  const expected = process.env.UTMIFY_CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!expected || token !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      ok: false,
      error: "integration-unavailable",
      message: INTEGRATION_UNAVAILABLE_REASON,
    },
    { status: 503 },
  );
}
