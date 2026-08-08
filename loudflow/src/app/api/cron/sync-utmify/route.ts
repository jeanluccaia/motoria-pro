import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { readUtmifyEnv, isCronSecretConfigured } from "@/lib/integrations/utmify/env";
import { createUtmifyHttpClient } from "@/lib/integrations/utmify/http";
import { runUtmifySync } from "@/lib/integrations/utmify/sync";
import { yesterdayYmd } from "@/lib/dates/period";

// Endpoint interno do cron diário (03:00 America/Sao_Paulo).
// Regras:
//   * Só responde se UTMIFY_CRON_SECRET estiver configurado.
//   * Rejeita qualquer requisição sem Authorization: Bearer <secret>.
//   * Sincroniza APENAS o dia anterior fechado (fronteira em SP).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isCronSecretConfigured()) {
    return jsonError(503, "cron-not-configured");
  }
  const expected = process.env.UTMIFY_CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!expected || token !== expected) {
    return jsonError(401, "unauthorized");
  }

  const utm = readUtmifyEnv();
  if (!utm.baseUrl || !utm.token || !utm.dashboardId) {
    return jsonError(503, "utmify-not-configured");
  }

  const admin = getSupabaseAdmin();
  const { data: orgs, error } = await admin.from("organizations").select("id");
  if (error) return jsonError(500, "org-list-failed");

  const client = createUtmifyHttpClient();
  const yday = yesterdayYmd();
  const results: Array<{ organizationId: string; status: string; rowsUpserted: number }> = [];

  for (const org of orgs ?? []) {
    try {
      const outcome = await runUtmifySync(admin, client, {
        organizationId: org.id,
        fromYmd: yday,
        toYmd: yday,
        triggeredBy: "cron",
      });
      results.push({
        organizationId: org.id,
        status: outcome.status,
        rowsUpserted: outcome.rowsUpserted,
      });
    } catch {
      results.push({ organizationId: org.id, status: "error", rowsUpserted: 0 });
    }
  }

  return NextResponse.json({ ok: true, day: yday, results });
}

function jsonError(status: number, code: string) {
  return NextResponse.json({ ok: false, error: code }, { status });
}
