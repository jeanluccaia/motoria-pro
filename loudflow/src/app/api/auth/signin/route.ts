import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { requireEnv } from "@/lib/supabase/env";
import { safeNext } from "@/lib/auth/redirect";
import type { Database } from "@/lib/supabase/types";

// Autenticação por e-mail + senha (fluxo escolhido para o MVP: só 6
// administradores internos, sem cadastro público e sem SMTP). Roda no
// servidor para que os cookies do Supabase (sb-*-auth-token*) sejam
// gravados via `response.cookies.set` e sobrevivam ao redirect que o
// client dispara em cima do ok=true.
//
// Erros do Supabase são traduzidos para um conjunto pequeno de códigos
// estáveis que o formulário mapeia para mensagens humanas — nunca
// vazamos a string crua do GoTrue para não expor detalhes do provider.

type BodyIn = {
  email?: unknown;
  password?: unknown;
  next?: unknown;
};

type ErrorCode = "invalid_credentials" | "rate_limited" | "unknown";

function normalizeError(raw: string): ErrorCode {
  const msg = raw.toLowerCase();
  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid email or password") ||
    msg.includes("user not found") ||
    msg.includes("email not confirmed")
  ) {
    return "invalid_credentials";
  }
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "rate_limited";
  }
  return "unknown";
}

export async function POST(request: NextRequest) {
  let body: BodyIn;
  try {
    body = (await request.json()) as BodyIn;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const nextParam = typeof body.next === "string" ? body.next : null;

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const dest = safeNext(nextParam);
  // A resposta é preparada antes: o supabase.auth.signInWithPassword
  // grava os cookies via `setAll`, que precisa apontar para o mesmo
  // NextResponse que devolvemos ao cliente. Sem isso os cookies caem no
  // ether e o cliente redireciona para `/` sem sessão.
  const response = NextResponse.json({ ok: true, redirect: dest });

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

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const code = normalizeError(error.message ?? "");
    const status = code === "rate_limited" ? 429 : 401;
    return NextResponse.json({ ok: false, error: code }, { status });
  }

  return response;
}
