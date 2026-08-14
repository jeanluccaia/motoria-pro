// Envs da integração EVO / W12 — webhook NewSale + endpoint de detalhes.
//
// Este módulo só lê nomes/booleanos (`process.env.X`) — nunca expõe
// valores em resposta pública, log ou UI. As credenciais são usadas
// EXCLUSIVAMENTE em Basic Auth server-to-server; qualquer vazamento
// permite ler dados de aluno da EVO.
//
// Envs (todas obrigatórias para a integração ativar):
//   * EVO_WEBHOOK_SECRET             segredo compartilhado (header custom)
//   * EVO_API_USERNAME               usuário Basic Auth do endpoint /sales/{id}
//   * EVO_API_PASSWORD               senha Basic Auth
//   * EVO_DEFAULT_ORGANIZATION_SLUG  slug da org que recebe as vendas
//                                    (MVP: uma org — 'loud-fit')
// Opcionais:
//   * EVO_API_BASE_URL               default: https://evo-integracao-api.w12app.com.br
//   * EVO_WEBHOOK_SECRET_HEADER      default: 'x-evo-webhook-secret'

import { timingSafeEqual } from "node:crypto";

export const EVO_ENV_NAMES = [
  "EVO_WEBHOOK_SECRET",
  "EVO_API_USERNAME",
  "EVO_API_PASSWORD",
  "EVO_DEFAULT_ORGANIZATION_SLUG",
] as const;

export const DEFAULT_EVO_API_BASE_URL = "https://evo-integracao-api.w12app.com.br";
export const DEFAULT_EVO_SECRET_HEADER = "x-evo-webhook-secret";

export function getMissingEvoEnvs(): string[] {
  return EVO_ENV_NAMES.filter((name) => !process.env[name]);
}

export function isEvoConfigured(): boolean {
  return getMissingEvoEnvs().length === 0;
}

export function evoUnavailableReason(): string {
  const missing = getMissingEvoEnvs();
  if (missing.length === 0) {
    return "Integração EVO configurada.";
  }
  return `Integração EVO indisponível: defina ${missing.join(", ")} no ambiente do servidor.`;
}

export function getEvoApiBaseUrl(): string {
  return (process.env.EVO_API_BASE_URL ?? DEFAULT_EVO_API_BASE_URL).replace(/\/+$/, "");
}

export function getEvoSecretHeaderName(): string {
  return (process.env.EVO_WEBHOOK_SECRET_HEADER ?? DEFAULT_EVO_SECRET_HEADER).toLowerCase();
}

export function getEvoDefaultOrgSlug(): string | null {
  return process.env.EVO_DEFAULT_ORGANIZATION_SLUG ?? null;
}

// Comparação constante-tempo. Só compara quando os comprimentos batem —
// timingSafeEqual exige buffers de tamanho igual.
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Verifica se o webhook carrega o segredo EVO_WEBHOOK_SECRET correto.
//
// EXCLUSIVO: header customizado (default `x-evo-webhook-secret`).
// NÃO aceita:
//   * `?secret=...` na query (aparece em logs de proxy / histórico shell)
//   * segredo no body (payload da EVO é fixo, não tem campo custom)
//   * Bearer ou Basic no Authorization (a EVO já não envia esses)
//
// Retorna false quando não há segredo configurado no servidor, o header
// não veio, veio vazio, ou o valor não bate. O route handler devolve 401.
export function requestHasValidWebhookSecret(request: Request): boolean {
  const secret = process.env.EVO_WEBHOOK_SECRET;
  if (!secret) return false;
  const headerName = getEvoSecretHeaderName();
  const provided = request.headers.get(headerName) ?? "";
  if (provided.length === 0) return false;
  return safeEqual(provided, secret);
}
