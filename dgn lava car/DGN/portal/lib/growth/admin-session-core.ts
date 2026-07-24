export const DGN_ADMIN_COOKIE = "dgn_admin_session";
export const DGN_ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

const SALT = ":dgn-growth-admin-v1";

export const DGN_ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: DGN_ADMIN_SESSION_MAX_AGE,
  path: "/",
};

export async function computeAdminSessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(password + SALT);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function validateAdminSessionToken(session: string | undefined, password: string | undefined) {
  if (!session || !password) return false;
  return session === await computeAdminSessionToken(password);
}
