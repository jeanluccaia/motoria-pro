import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

/**
 * Callback do fluxo magic link.
 * Supabase envia GET com `code` (PKCE) que trocamos por uma sessão de
 * usuário. Também aceita fallback com `token_hash` + `type=magiclink`.
 * Após o login, valida se o auth.users.id tem vínculo em
 * crm_customer_auth. Se não tiver, faz signOut e redireciona com erro.
 */
export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.redirect(new URL("/entrar?error=callback_failed", request.url));
  }

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const next = params.get("next") || "/dashboard";

  const response = NextResponse.redirect(new URL(next, request.url));
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        for (const { name, value, options } of list) {
          response.cookies.set({ name, value, ...options });
        }
      },
    },
  });

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "magiclink" | "email",
      });
      if (error) throw error;
    } else {
      return NextResponse.redirect(new URL("/entrar?error=invalid_link", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/entrar?error=invalid_link", request.url));
  }

  // Verifica vínculo obrigatório com assinante antes de liberar o Portal.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/entrar?error=invalid_link", request.url));
  }

  const { data: link } = await supabase
    .from("crm_customer_auth")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!link) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/entrar?error=not_linked", request.url));
  }

  return response;
}
