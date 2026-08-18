import "server-only";

// Nesta fase (3.1) a API pública da UTMify para *leitura* de métricas de
// campanhas Meta Ads ainda não foi confirmada — a documentação oficial só
// cobre `POST /api-credentials/orders` (envio de pedidos), que passamos a
// usar na Fase 4 (envio de conversão paga vinda do webhook EVO).
//
// * LEITURA de métricas: continua indisponível (`http.ts` é stub 503).
// * ESCRITA de pedidos: cliente HTTP em `orders.ts`, ativa quando
//   `UTMIFY_ORDERS_API_TOKEN` estiver definido.

export const INTEGRATION_UNAVAILABLE_REASON =
  "API pública da UTMify para leitura de métricas ainda não está confirmada. A sincronização automática está indisponível nesta versão.";

export const DEFAULT_UTMIFY_ORDERS_BASE_URL = "https://api.utmify.com.br";
export const DEFAULT_UTMIFY_ORDERS_PATH = "/api-credentials/orders";

// Envs (todas obrigatórias para envio de conversão ativar):
//   * UTMIFY_ORDERS_API_TOKEN  — x-api-token da credencial oficial UTMify
// Opcionais:
//   * UTMIFY_ORDERS_API_BASE_URL — default: https://api.utmify.com.br
export const UTMIFY_ORDERS_ENV_NAMES = ["UTMIFY_ORDERS_API_TOKEN"] as const;

export function isCronSecretConfigured(): boolean {
  return Boolean(process.env.UTMIFY_CRON_SECRET);
}

export function getMissingUtmifyOrdersEnvs(): string[] {
  return UTMIFY_ORDERS_ENV_NAMES.filter((name) => !process.env[name]);
}

export function isUtmifyOrdersConfigured(): boolean {
  return getMissingUtmifyOrdersEnvs().length === 0;
}

export function getUtmifyOrdersBaseUrl(): string {
  return (process.env.UTMIFY_ORDERS_API_BASE_URL ?? DEFAULT_UTMIFY_ORDERS_BASE_URL).replace(
    /\/+$/,
    "",
  );
}

export function getUtmifyOrdersUrl(): string {
  return `${getUtmifyOrdersBaseUrl()}${DEFAULT_UTMIFY_ORDERS_PATH}`;
}

// Modo de teste — envia `isTest: true` no payload para que a UTMify valide
// sem gravar. Preview e desenvolvimento devem sempre ir com isTest=true;
// só Produção envia isTest=false.
//
// VERCEL_ENV é preenchido automaticamente pela Vercel ('production' |
// 'preview' | 'development'). Local dev usa NODE_ENV.
export function utmifyOrdersIsTestMode(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) return vercelEnv !== "production";
  return process.env.NODE_ENV !== "production";
}
