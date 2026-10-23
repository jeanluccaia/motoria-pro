import { NextResponse, type NextRequest } from "next/server";
import {
  DGN_COMPANY_MANAGER_COOKIE,
  verifyManagerCookieValue,
  buildManagerCookieValue,
} from "@/lib/growth/db/corporate-fleet-route";

// GET /empresa/entrar?mgr=<uuid>&t=<hmac>
// Valida o HMAC, seta o cookie e redireciona para /empresa.
// Em caso de link ausente/inválido redireciona para /empresa?err=invalid|missing
// (a página /empresa trata esses states).
export async function GET(request: NextRequest) {
  const mgr = request.nextUrl.searchParams.get("mgr") ?? undefined;
  const t = request.nextUrl.searchParams.get("t") ?? undefined;

  const base = request.nextUrl.origin;

  if (!mgr || !t) {
    return NextResponse.redirect(new URL("/empresa?err=missing", base));
  }

  const verified = verifyManagerCookieValue(`${mgr}.${t}`);
  if (!verified) {
    return NextResponse.redirect(new URL("/empresa?err=invalid", base));
  }

  const response = NextResponse.redirect(new URL("/empresa", base));
  response.cookies.set(DGN_COMPANY_MANAGER_COOKIE, buildManagerCookieValue(verified), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
