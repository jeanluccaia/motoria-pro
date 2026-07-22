import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseSecretKeyFetch } from "./secret-key-fetch.ts";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(operation = "crm.persistence"): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      `Supabase administrativo não configurado para "${operation}": ` +
      "defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente server-side.",
    );
  }

  if (!cachedClient) {
    cachedClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { "X-Client-Info": "dgn-growth-server" }, fetch: supabaseSecretKeyFetch },
    });
  }

  return cachedClient;
}
