import { NextRequest, NextResponse } from "next/server";
import {
  computeAdminSessionToken,
  DGN_ADMIN_COOKIE,
  DGN_ADMIN_COOKIE_OPTIONS,
} from "@/lib/growth/admin-session-core";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const input = String(formData.get("password") ?? "");
  const password = process.env.DGN_ADMIN_PASSWORD;

  if (!password || !input || input !== password) {
    return NextResponse.redirect(new URL("/admin/growth/login?error=invalid", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/admin/growth", request.url), 303);
  response.cookies.set(DGN_ADMIN_COOKIE, await computeAdminSessionToken(password), DGN_ADMIN_COOKIE_OPTIONS);
  return response;
}
