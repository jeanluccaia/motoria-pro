import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { handleSlaTick } from "@/lib/crm/sla-tick";

// Vercel Cron (em Produção) chama este endpoint via GET com header
// `Authorization: Bearer $CRON_SECRET`. Cadência definida em `vercel.json`.
// Em Preview a validação é manual — rodar via curl com o mesmo header.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  return handleSlaTick(request, { admin: getSupabaseAdmin() });
}
