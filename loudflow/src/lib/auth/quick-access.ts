// Allowlist de e-mails que podem entrar sem senha via /entrar.
// Fonte: env LOUDFLOW_QUICK_ACCESS_EMAILS (separado por vírgula).
// Se a env estiver vazia, o picker de /entrar não renderiza nenhum
// nome e o POST /api/auth/quick sempre rejeita — o app volta a exigir
// senha via /login normalmente.

export function getQuickAccessEmails(): string[] {
  const raw = process.env.LOUDFLOW_QUICK_ACCESS_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
