/** Diagnóstico read-only de estabilidade do JWT, sem imprimir credenciais. */
import { createClient } from "@supabase/supabase-js";
import { resolve } from "node:path";
import { supabaseSecretKeyFetch } from "../../lib/growth/db/secret-key-fetch.ts";

const root = resolve(import.meta.dirname, "../..");
try { process.loadEnvFile(resolve(root, ".env.local")); } catch { /* checked below */ }
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("credenciais server-side ausentes");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: supabaseSecretKeyFetch } });
const attempts: Array<{ attempt: number; ok: boolean; count: number | null; durationMs: number; error: string | null }> = [];
for (let attempt = 1; attempt <= 10; attempt += 1) {
  const started = performance.now();
  const result = await db.from("crm_customers").select("id", { count: "exact", head: true });
  attempts.push({
    attempt,
    ok: !result.error,
    count: result.count,
    durationMs: Math.round((performance.now() - started) * 100) / 100,
    error: result.error?.message ?? null,
  });
}
console.log(JSON.stringify({
  nodeUtc: new Date().toISOString(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  totalAttempts: attempts.length,
  successes: attempts.filter((item) => item.ok).length,
  failures: attempts.filter((item) => !item.ok).length,
  attempts,
}, null, 2));
if (attempts.some((item) => !item.ok)) process.exitCode = 2;
