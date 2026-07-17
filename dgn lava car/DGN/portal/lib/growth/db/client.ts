/** @deprecated Importe `admin-client.ts` apenas em código server-side. */
export { getSupabaseAdminClient as getSupabaseServerClient } from "./admin-client";
export type { SupabaseClient as SupabaseServerClient } from "@supabase/supabase-js";

export function readSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    dataSource: (process.env.DGN_GROWTH_DATA_SOURCE ?? "json") as "json" | "db",
  };
}
