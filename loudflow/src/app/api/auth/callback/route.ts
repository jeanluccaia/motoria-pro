import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { requireEnv } from "@/lib/supabase/env";
import { safeNext } from "@/lib/auth/redirect";
import type { Database } from "@/lib/supabase/types";

// Callback dos links transacionais do Supabase Auth: convite (invite),
// recuperação de senha (recovery), magic link (magiclink) e signup.
//
// O GoTrue anexa `token_hash` + `type` (formato PKCE novo). Trocamos
// pelo par de tokens de sessão com verifyOtp e gravamos cookies sb-*
// na resposta antes de redirecionar. Depois disso o usuário está
// autenticado e pode:
//   * definir senha em /auth/reset-password (recovery/invite)
//   * ou seguir para o `next` (magiclink/signup)
//
// Códigos de erro na URL (`?err=`) são traduzidos para mensagens
// humanas nas páginas /login e /auth/reset-password.

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const nextParam = url.searchParams.get("next");

  // Recovery/invite: destino padrão é /auth/reset-password para o
  // usuário definir a nova senha antes de qualquer outra ação.
  const isReset = type === "recovery" || type === "invite";
  const dest = isReset
    ? "/auth/reset-password"
    : safeNext(nextParam);

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      new URL(`/login?err=link_invalid`, request.url),
    );
  }

  const response = NextResponse.redirect(new URL(dest, request.url));

  const supabase = createServerClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.verifyOtp({
    type: type as
      | "recovery"
      | "invite"
      | "signup"
      | "email"
      | "magiclink"
      | "email_change",
    token_hash: tokenHash,
  });

  if (error) {
    const code = /expired/i.test(error.message)
      ? "link_expired"
      : "link_invalid";
    return NextResponse.redirect(new URL(`/login?err=${code}`, request.url));
  }

  return response;
}
