import "server-only";
import type { UtmifyClient, UtmifyFetchResult } from "./types";
import { INTEGRATION_UNAVAILABLE_REASON } from "./env";

// Stub de produção. Enquanto o contrato HTTP oficial da UTMify para leitura
// de métricas não estiver confirmado, este cliente sempre reporta
// `{ ok: false, code: 'not-configured' }`. Nenhuma chamada de rede é feita
// contra endpoints especulativos.
//
// Quando o contrato for confirmado, esta implementação será substituída por
// um cliente real. O `UtmifyFakeClient` continua servindo aos testes
// automatizados.
export function createUtmifyHttpClient(): UtmifyClient {
  return {
    isConfigured: () => false,
    async fetchDay(date: string): Promise<UtmifyFetchResult> {
      // Parâmetro `date` mantido no contrato para preservar compatibilidade
      // com o cliente real quando o contrato oficial for confirmado.
      void date;
      return {
        ok: false,
        error: { code: "not-configured", message: INTEGRATION_UNAVAILABLE_REASON },
      };
    },
  };
}
