import "server-only";

export const DGN_ADMIN_COOKIE = "dgn_admin_session";
const SALT = ":dgn-growth-admin-v1";

export async function computeAdminSessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(password + SALT);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function validateAdminSessionToken(
  session: string | undefined,
  password: string | undefined = process.env.DGN_ADMIN_PASSWORD,
): Promise<boolean> {
  if (!session || !password) return false;
  return session === await computeAdminSessionToken(password);
}
