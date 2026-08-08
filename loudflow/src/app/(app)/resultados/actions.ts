"use server";

import { requireAdmin } from "@/lib/auth/session";
import { INTEGRATION_UNAVAILABLE_REASON } from "@/lib/integrations/utmify/env";

// Sincronização manual (admin). Nesta versão, o contrato HTTP oficial da
// UTMify para leitura de métricas não está confirmado — a ação sempre
// devolve a explicação clara. Não faz chamada de rede, não muda o banco.
//
// Quando o cliente HTTP real for plugado, esta função voltará a delegar
// para o `runUtmifySync` — a assinatura pública fica a mesma.
export async function syncUtmifyNow(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  return { ok: false, message: INTEGRATION_UNAVAILABLE_REASON };
}
