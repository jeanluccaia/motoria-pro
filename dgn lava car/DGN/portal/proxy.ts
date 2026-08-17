import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "@/lib/growth/admin-session-core";

const PORTAL_PROTECTED = [
  "/dashboard",
  "/perfil",
  "/plano",
  "/veiculos",
  "/historico",
  "/agendar",
  "/beneficios",
  "/cadastro",
];

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin/growth/") || pathname.startsWith("/api/admin/growth/");
}

function isPortalProtected(pathname: string): boolean {
  return PORTAL_PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

async function guardAdmin(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  if (
    pathname === "/admin/growth/login" ||
    pathname === "/admin/growth/session" ||
    pathname === "/admin/growth/logout"
  ) {
    return NextResponse.next();
  }
  const password = process.env.DGN_ADMIN_PASSWORD;
  if (!password) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "admin session unavailable" }, { status: 503 });
    }
    return NextResponse.redirect(new URL("/admin/growth/login", request.url));
  }
  const session = request.cookies.get(DGN_ADMIN_COOKIE)?.value;
  if (!(await validateAdminSessionToken(session, password))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/growth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

async function guardPortal(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return response;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        for (const { name, value, options } of list) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isPortalProtected(pathname) && !user) {
    const signInUrl = new URL("/entrar", request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }
  if (pathname === "/entrar" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isAdminRoute(pathname)) {
    const admin = await guardAdmin(request);
    if (admin) return admin;
  }
  return guardPortal(request);
}

export const config = {
  matcher: [
    "/admin/growth/:path*",
    "/api/admin/growth/:path*",
    "/dashboard/:path*",
    "/perfil/:path*",
    "/plano/:path*",
    "/veiculos/:path*",
    "/historico/:path*",
    "/agendar/:path*",
    "/beneficios/:path*",
    "/cadastro/:path*",
    "/entrar",
  ],
};
