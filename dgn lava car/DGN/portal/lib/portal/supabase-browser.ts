/**
 * Cliente Supabase para o browser do Portal.
 *
 * Usa a anon key pública. Nunca a service_role.
 */
"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function browserSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("NEXT_PUBLIC_SUPABASE_* não configuradas");
  cached = createBrowserClient(url, anon);
  return cached;
}
