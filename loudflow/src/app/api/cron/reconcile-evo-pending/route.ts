import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { handleEvoReconcile } from "@/lib/integrations/evo/reconcile";

// Vercel Cron (em Produção) chama este endpoint via GET com header
// `Authorization: Bearer $CRON_SECRET` injetado automaticamente quando
// a env `CRON_SECRET` está definida. Cadência definida em `vercel.ts`
// será ativada apenas em produção (Vercel Cron não roda em Preview).
//
// Em Preview a validação é manual — chamar via curl com o mesmo header.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  return handleEvoReconcile(request, { admin: getSupabaseAdmin() });
}
