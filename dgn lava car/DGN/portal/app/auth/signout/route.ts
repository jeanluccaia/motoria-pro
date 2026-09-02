import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

async function signOut(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const redirectResponse = NextResponse.redirect(new URL("/entrar", request.url));
  if (!url || !anon) return redirectResponse;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        for (const { name, value, options } of list) {
          redirectResponse.cookies.set({ name, value, ...options });
        }
      },
    },
  });
  await supabase.auth.signOut();
  return redirectResponse;
}

export const POST = signOut;
export const GET = signOut;
