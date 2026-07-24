import "server-only";

export { DGN_ADMIN_COOKIE, computeAdminSessionToken } from "./admin-session-core.ts";
import { validateAdminSessionToken as validateToken } from "./admin-session-core.ts";

export function validateAdminSessionToken(session: string | undefined, password = process.env.DGN_ADMIN_PASSWORD) {
  return validateToken(session, password);
}
