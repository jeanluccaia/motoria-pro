import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/redirect";

// Callback do Magic Link. Recebe `?code=...&next=...` de volta do Supabase,
// troca o code por sessão (grava cookies) e redireciona.
//
// Segurança:
//   * `next` passa por `safeNext` — nunca redirecionamos para host externo.
//   * Sem `code` ou com falha na troca → `/login?error=...` (não vaza next).
//   * Origem do redirect final é sempre `url.origin` (a URL onde o callback
//     foi realmente atendido), garantindo que Preview volta para Preview,
//     produção para produção e local para local. Nada de env fixa.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing-code", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=exchange-failed", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
