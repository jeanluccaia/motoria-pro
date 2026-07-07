"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "dgn_admin_session";
const SALT = ":dgn-growth-admin-v1";

async function computeToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function loginAdmin(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const input = (formData.get("password") as string | null) ?? "";
  const adminPassword = process.env.DGN_ADMIN_PASSWORD;

  if (!adminPassword) {
    return { error: "DGN_ADMIN_PASSWORD não configurado no servidor." };
  }

  if (!input || input !== adminPassword) {
    return { error: "Senha incorreta." };
  }

  const token = await computeToken(adminPassword);
  const jar = await cookies();

  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  const from = formData.get("from") as string | null;
  redirect(from && from.startsWith("/admin/growth") ? from : "/admin/growth/intelligence");
}
