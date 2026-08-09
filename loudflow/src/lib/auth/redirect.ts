// Sanitização de destino pós-login. Único objetivo aqui é impedir
// open-redirect: a query string `next` do /login nunca pode virar uma
// URL externa. Só aceitamos paths internos absolutos (começam com "/")
// e rejeitamos padrões que o navegador interpretaria como URL externa
// mesmo depois de encaixar em uma base.

// Rota autenticada default pós-login. Escolhida por ser a página
// inicial útil do app (painel de resultados).
export const DEFAULT_NEXT = "/resultados";

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
