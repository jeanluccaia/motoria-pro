import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { handleEvoWebhook } from "@/lib/integrations/evo/webhook";

// Webhook público-mas-secreto da EVO / W12 (EventType=NewSale).
//
// Toda a lógica vive em `handleEvoWebhook` para permitir teste unitário
// com admin + client injetados. Esta rota só faz o wiring:
//   * escolhe o service_role client (getSupabaseAdmin — `server-only`);
//   * chama o handler;
//   * devolve a Response.
//
// Segurança: EVO_WEBHOOK_SECRET em header customizado, comparação
// timing-safe. Basic Auth para o endpoint /sales/{id} SÓ é usado dentro
// do handler (server-to-server). Ver src/lib/integrations/evo/env.ts.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request): Promise<Response> {
  return handleEvoWebhook(request, { admin: getSupabaseAdmin() });
}
