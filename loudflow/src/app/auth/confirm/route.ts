import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NEXT_COOKIE, safeNext } from "@/lib/auth/redirect";

// Confirmação do Magic Link no fluxo SSR oficial do Supabase.
//
// Diferente do fluxo antigo com `?code=` + `exchangeCodeForSession(code)`:
//   * NÃO exige `code_verifier` no localStorage do navegador que pediu o
//     link. Isso quebrava no celular: o Mail abre o link em WebView ou
//     em outro browser, sem acesso ao localStorage do pedido, e a troca
//     falhava silenciosamente devolvendo o usuário para /login.
//   * O token_hash chega direto na URL do e-mail (template do Supabase
//     usa `{{ .TokenHash }}`) e é validado pelo servidor via
//     `supabase.auth.verifyOtp`. O cookieStore SSR grava a sessão de
//     imediato — funciona em qualquer navegador ou WebView.
//
// Destino:
//   * `?next=/path` na URL vence.
//   * Fallback: cookie `lf_next` gravado no navegador que pediu o link.
//   * Fallback final: DEFAULT_NEXT.
//
// Erros (link expirado, já usado, hash malformado) redirecionam para
// /login com `?error=link_expirado` — a página de login exibe mensagem
// clara em vez de silenciosamente voltar ao formulário.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "email") as EmailOtpType;
  const nextParam = url.searchParams.get("next");

  const failRedirect = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, url.origin));

  if (!tokenHash) {
    return failRedirect("link_invalido");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    // Erros comuns aqui: link expirado (mais de 1h desde o envio),
    // link já usado (Magic Link é single-use), token adulterado. Não
    // vazamos o motivo específico para o usuário — só a categoria.
    return failRedirect("link_expirado");
  }

  const jar = await cookies();
  const cookieNext = jar.get(NEXT_COOKIE)?.value ?? null;
  const dest = safeNext(nextParam ?? cookieNext);

  const response = NextResponse.redirect(new URL(dest, url.origin));
  // Limpa o cookie de destino — de uso único, como o próprio link.
  response.cookies.set(NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
