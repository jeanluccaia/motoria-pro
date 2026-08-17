/**
 * Cliente Supabase server-side para o Portal do Assinante.
 *
 * Usa a `NEXT_PUBLIC_SUPABASE_ANON_KEY` combinada com a sessão do
 * usuário (via cookies gerenciadas por @supabase/ssr). Isso faz o
 * `auth.uid()` popular corretamente dentro das RPCs (`security
 * definer`), sem precisar de service_role no client.
 *
 * Cliente admin (com service_role) fica em `lib/growth/*` e não deve
 * ser confundido com este.
 */
import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`env ${name} não configurada para o Portal`);
  return value;
}

/**
 * Cliente autenticado ligado à sessão do Portal.
 * Só use em Server Components, Server Actions ou Route Handlers.
 */
export async function createPortalClient(): Promise<SupabaseClient> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const store = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(list) {
        try {
          for (const { name, value, options } of list) {
            store.set(name, value, options as CookieOptions);
          }
        } catch {
          // Server Components não podem setar cookies; ignorar aqui —
          // o refresh de sessão acontece no middleware/route handler.
        }
      },
    },
  });
}
