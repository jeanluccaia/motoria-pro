import "server-only";

// Nesta fase (3.1) a API pública da UTMify para *leitura* de métricas de
// campanhas Meta Ads ainda não foi confirmada — a documentação oficial só
// cobre `POST /api-credentials/orders` (envio de pedidos), não leitura.
// Portanto, sincronização automática está indisponível e o botão manual
// reporta a limitação de forma clara.
//
// Quando o contrato oficial for confirmado, este arquivo passa a expor as
// envs `UTMIFY_API_BASE_URL`/`_TOKEN`/`_DASHBOARD_ID`, e o `UtmifyHttpClient`
// implementa o cliente real.

export const INTEGRATION_UNAVAILABLE_REASON =
  "API pública da UTMify para leitura de métricas ainda não está confirmada. A sincronização automática está indisponível nesta versão.";

export function isCronSecretConfigured(): boolean {
  return Boolean(process.env.UTMIFY_CRON_SECRET);
}
