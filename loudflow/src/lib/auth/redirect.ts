// Helpers de redirect para o fluxo de login. Objetivo:
//   1. Impedir open-redirect — `next` nunca pode virar URL externa.
//   2. Manter a origem do e-mail alinhada ao deployment de onde o pedido
//      partiu (Preview volta para Preview, produção para produção, local
//      para local). Nada de env fixa em código de produção.

// Rota autenticada default pós-login. Escolhida por ser a página inicial
// útil do app (painel de resultados). Se um dia mudar, é o único ponto
// de troca.
export const DEFAULT_NEXT = "/resultados";

// Nome do cookie usado para preservar o destino do Magic Link entre o
// pedido no navegador A e a validação em /auth/confirm no navegador B.
// Se o link abre em outro device o cookie não existe — cai no DEFAULT_NEXT
// (sessão continua sendo criada, só o destino é o padrão).
export const NEXT_COOKIE = "lf_next";

// Sanitiza o candidato a `next`. Retorna o fallback quando o valor é
// vazio, ausente, ou pode ser interpretado como URL externa.
//
// Aceita:  "/", "/resultados", "/config/campanhas?p=1"
// Rejeita: "", null, "//evil.com/x" (protocol-relative),
//          "/\\evil.com" (browsers normalizam para "//..."),
//          "https://evil.com", "javascript:alert(1)", "mailto:x"
export function safeNext(
  candidate: string | null | undefined,
  fallback: string = DEFAULT_NEXT,
): string {
  if (candidate == null) return fallback;
  const s = String(candidate).trim();
  if (s.length === 0) return fallback;
  if (!s.startsWith("/")) return fallback;
  // Protocol-relative (//host/x) e a variante com backslash que o
  // navegador normaliza para "//".
  if (s.startsWith("//") || s.startsWith("/\\")) return fallback;
  // Qualquer esquema de URL absoluta explícito (http:, https:, javascript:, etc.)
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(s)) return fallback;
  return s;
}

// Origem que vai em `emailRedirectTo` do Magic Link. Retorna somente a
// origem bare (sem path), porque o template do Supabase é responsável
// por concatenar `/auth/confirm?token_hash={{ .TokenHash }}&type=email`
// via `{{ .RedirectTo }}`. Duplicar `/auth/confirm` aqui geraria um path
// quebrado (`.../resultados/auth/confirm?token_hash=...`).
//
// O `next` NÃO viaja mais na querystring: um cookie `lf_next` é gravado
// no navegador que pede o link. Se o e-mail for aberto no mesmo device,
// o cookie está lá; se abrir em outro, o destino cai no DEFAULT_NEXT.
export function buildEmailRedirectTo(origin: string): string {
  return origin;
}
