import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { requireEnv } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getQuickAccessEmails } from "@/lib/auth/quick-access";
import type { Database } from "@/lib/supabase/types";

// Auto-login sem senha para sócios cadastrados em
// LOUDFLOW_QUICK_ACCESS_EMAILS. Fluxo:
//   1. Front chama POST /api/auth/quick com { email }.
//   2. Validamos o e-mail contra a allowlist da env.
//   3. Chamamos admin.generateLink({ type: 'magiclink' }) — o Supabase
//      devolve um token_hash consumível uma vez.
//   4. Consumimos o token com verifyOtp no server, o SSR grava os
//      cookies sb-* na NextResponse.
//   5. Front faz window.location.assign(redirect) e a próxima request
//      já chega autenticada.
//
// Não usamos signInWithPassword porque não temos senha — e não queremos
// forçar reset. O magic link fica interno (nunca vai pro navegador do
// usuário), então evita SMTP e não expira em uso porque é consumido
// no mesmo request.

type BodyIn = { email?: unknown };

export async function POST(request: NextRequest) {
  let body: BodyIn;
  try {
    body = (await request.json()) as BodyIn;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const allowed = getQuickAccessEmails();
  if (!email || !allowed.includes(email)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  const origin = new URL(request.url).origin;
  const linkRes = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${origin}/` },
  });
  const tokenHash = linkRes.data?.properties?.hashed_token;
  if (linkRes.error || !tokenHash) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, redirect: "/" });

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
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return response;
}
