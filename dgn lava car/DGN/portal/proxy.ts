import { NextRequest, NextResponse } from "next/server";
import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "@/lib/growth/admin-session-core";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/admin/growth/login" ||
    pathname === "/admin/growth/session" ||
    pathname === "/admin/growth/logout"
  ) {
    return NextResponse.next();
  }

  // BYPASS LOCAL DEV — Next dev define NODE_ENV=development; Vercel Preview
  // e Production sempre rodam com NODE_ENV=production, então isso NUNCA passa
  // pra fora do desktop do operador. Guarda dupla: env + presença explícita
  // da flag DGN_DEV_BYPASS_AUTH em .env.local. Nada é commitado.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.DGN_DEV_BYPASS_AUTH === "1"
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

export const config = {
  matcher: ["/admin/growth/:path*", "/api/admin/growth/:path*"],
};
