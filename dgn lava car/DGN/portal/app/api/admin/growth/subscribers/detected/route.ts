import { NextResponse } from "next/server";
import { buildDetectedSubscribersView } from "@/lib/growth/db/subscribers-view";
import { readSupabaseEnv } from "@/lib/growth/db/client";

/**
 * GET /api/admin/growth/subscribers/detected
 *
 * Retorna os 13 assinantes detectados/pendentes, com conciliação contra o
 * JSON legado ou (quando DGN_GROWTH_DATA_SOURCE=db) contra o banco.
 *
 * Read-only. Protegido pelo mesmo proxy do /admin/growth/**.
 */
export async function GET() {
  const env = readSupabaseEnv();
  const rows = buildDetectedSubscribersView();

  return NextResponse.json({
    dataSource: env.dataSource,
    dbConfigured: Boolean(env.url && env.serviceRoleKey),
    count: rows.length,
    subscribers: rows,
  });
}
