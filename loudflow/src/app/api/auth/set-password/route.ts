import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { requireEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

// Aplica a nova senha usando a sessão de recovery/invite já ativa
// (o /api/auth/callback gravou os cookies sb-* antes de redirecionar
// para /auth/reset-password). Server-side para poder normalizar os
// erros do GoTrue no mesmo formato que /api/auth/signin.

const MIN_LEN = 10;

type BodyIn = { password?: unknown };

function normalizeError(
  raw: string,
):
  | "weak_password"
  | "session_missing"
  | "same_as_old"
  | "unknown" {
  const msg = raw.toLowerCase();
  if (msg.includes("session") || msg.includes("jwt")) return "session_missing";
  if (
    msg.includes("password should be different") ||
    msg.includes("new password should be different")
  ) {
    return "same_as_old";
  }
  if (msg.includes("password") && msg.includes("short")) return "weak_password";
  if (msg.includes("weak") && msg.includes("password")) return "weak_password";
  return "unknown";
}

export async function POST(request: NextRequest) {
  let body: BodyIn;
  try {
    body = (await request.json()) as BodyIn;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }
  if (password.length < MIN_LEN) {
    return NextResponse.json(
      { ok: false, error: "weak_password" },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ ok: true });

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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "session_missing" },
      { status: 401 },
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return NextResponse.json(
      { ok: false, error: normalizeError(error.message ?? "") },
      { status: 400 },
    );
  }

  return response;
}
