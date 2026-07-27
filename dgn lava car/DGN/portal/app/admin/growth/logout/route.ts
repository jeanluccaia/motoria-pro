import { NextRequest, NextResponse } from "next/server";
import { DGN_ADMIN_COOKIE, DGN_ADMIN_COOKIE_OPTIONS } from "@/lib/growth/admin-session-core";

export function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/growth/login", request.url), 303);
  response.cookies.set(DGN_ADMIN_COOKIE, "", { ...DGN_ADMIN_COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
