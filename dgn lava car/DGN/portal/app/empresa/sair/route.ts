import { NextResponse } from "next/server";
import { DGN_COMPANY_MANAGER_COOKIE } from "@/lib/growth/db/corporate-fleet-route";

// POST-only (GET seria prefetchado pelo Link do Next e derrubaria sessão).
export async function POST() {
  const response = NextResponse.redirect(new URL("/empresa", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
  response.cookies.set(DGN_COMPANY_MANAGER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
