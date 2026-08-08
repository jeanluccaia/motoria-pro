import "server-only";

// Variáveis dedicadas à integração UTMify. Nenhuma delas pode ser
// prefixada com NEXT_PUBLIC_ — o painel só faz leitura do banco.
export function readUtmifyEnv() {
  return {
    baseUrl: process.env.UTMIFY_API_BASE_URL ?? null,
    token: process.env.UTMIFY_API_TOKEN ?? null,
    dashboardId: process.env.UTMIFY_DASHBOARD_ID ?? null,
    cronSecret: process.env.UTMIFY_CRON_SECRET ?? null,
  };
}

export function isUtmifyConfigured(): boolean {
  const { baseUrl, token, dashboardId } = readUtmifyEnv();
  return Boolean(baseUrl && token && dashboardId);
}

export function isCronSecretConfigured(): boolean {
  return Boolean(process.env.UTMIFY_CRON_SECRET);
}
