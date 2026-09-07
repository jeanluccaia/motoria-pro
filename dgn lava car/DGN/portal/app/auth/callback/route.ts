import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifyPortalAuthLink } from "@/lib/portal/auth-link";

export const dynamic = "force-dynamic";

/**
 * Callback do fluxo magic link.
 *
 * Aceita `?code=` (PKCE, gerado pelo `signInWithOtp` do browser em /entrar)
 * ou `?token_hash=` + `?type=magiclink` (fluxo REST usado pelo provisionamento
 * server-side, sem PKCE verifier disponível no browser). Ambos derivam da
 * mesma sessão no Supabase e criam o mesmo cookie.
 *
 * Após criar a sessão, verifica que `auth.users.id` tem vínculo em
 * `crm_customer_auth`. Essa leitura precisa acontecer via service_role: a
 * tabela roda com RLS forçada e sem policies (auditoria), então o cliente
 * autenticado do usuário retornaria sempre `null` e negaria o acesso mesmo
 * com vínculo válido — regressão do login real do primeiro assinante em
 * 2026-09-07.
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/entrar?error=invalid_link", request.url));
  }

  const verification = await verifyPortalAuthLink(user.id);
  if (!verification.ok) {
    await supabase.auth.signOut();
    if (verification.reason === "db_error") {
      console.error(
        "[auth-callback] falha ao verificar vínculo Auth:",
        verification.message,
      );
      return NextResponse.redirect(new URL("/entrar?error=callback_failed", request.url));
    }
    return NextResponse.redirect(new URL("/entrar?error=not_linked", request.url));
  }

  return response;
}
