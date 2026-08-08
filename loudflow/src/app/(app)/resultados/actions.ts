"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createUtmifyHttpClient } from "@/lib/integrations/utmify/http";
import { runUtmifySync } from "@/lib/integrations/utmify/sync";
import { yesterdayYmd } from "@/lib/dates/period";

// Sincronização manual (admin). Sempre sincroniza o dia anterior fechado,
// mesmo comportamento do cron — evita mexer em dados que ainda podem mudar
// durante o dia corrente.
export async function syncUtmifyNow(): Promise<{ ok: boolean; message: string }> {
  const session = await requireAdmin();
  const admin = getSupabaseAdmin();
  const client = createUtmifyHttpClient();

  if (!client.isConfigured()) {
    return {
      ok: false,
      message:
        "UTMify ainda não está configurada. Preencha UTMIFY_API_BASE_URL, UTMIFY_API_TOKEN e UTMIFY_DASHBOARD_ID no ambiente.",
    };
  }

  const yday = yesterdayYmd();
  try {
    const outcome = await runUtmifySync(admin, client, {
      organizationId: session.organizationId,
      fromYmd: yday,
      toYmd: yday,
      triggeredBy: "manual",
    });
    revalidatePath("/resultados");
    if (outcome.status === "success") {
      return {
        ok: true,
        message: `Atualizado. ${outcome.rowsUpserted} campanhas sincronizadas para ${yday}.`,
      };
    }
    if (outcome.status === "partial") {
      return {
        ok: false,
        message: `Sincronização parcial. Verifique o histórico em Configurações.`,
      };
    }
    return {
      ok: false,
      message:
        outcome.errors[0]?.error.message ?? "Não foi possível concluir a sincronização.",
    };
  } catch {
    return {
      ok: false,
      message: "Erro inesperado ao sincronizar. Tente novamente em alguns instantes.",
    };
  }
}
