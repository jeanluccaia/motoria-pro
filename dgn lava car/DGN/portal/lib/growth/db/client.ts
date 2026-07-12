/**
 * Cliente Supabase — SERVER-ONLY.
 *
 * Importar este arquivo de qualquer componente client (ou de qualquer módulo
 * carregado pelo bundle do browser) vaza a service_role key. Use apenas em:
 *   - route handlers (app/api/**)
 *   - server actions
 *   - scripts de migração / seed
 *
 * Enquanto DGN_GROWTH_DATA_SOURCE=json, este módulo lança em runtime se for
 * chamado — evita "sucesso falso" silencioso.
 */

/** SERVER-ONLY — importar deste módulo em qualquer bundle client vaza a service_role key. */

export type SupabaseServerClient = {
  from: (table: string) => unknown;
};

export interface SupabaseEnv {
  url: string;
  serviceRoleKey: string;
  dataSource: "json" | "db";
}

let cached: SupabaseServerClient | null = null;

export function readSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const dataSource = (process.env.DGN_GROWTH_DATA_SOURCE ?? "json") as "json" | "db";
  return { url, serviceRoleKey, dataSource };
}

export function assertDbEnabled(operation: string): void {
  const env = readSupabaseEnv();
  if (env.dataSource !== "db") {
    throw new Error(
      `DGN_GROWTH_DATA_SOURCE=${env.dataSource} — operação "${operation}" bloqueada. ` +
      `Habilite DGN_GROWTH_DATA_SOURCE=db somente após dry-run aprovado e migrations aplicadas.`,
    );
  }
  if (!env.url || !env.serviceRoleKey) {
    throw new Error(
      `Supabase não configurado — faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY. ` +
      `Operação "${operation}" bloqueada.`,
    );
  }
}

/**
 * Retorna um client Supabase configurado com service_role.
 * Lança se as vars não estiverem definidas ou DGN_GROWTH_DATA_SOURCE != 'db'.
 * A implementação usa dynamic import para permitir que este arquivo compile
 * sem a dep `@supabase/supabase-js` ainda instalada.
 */
export async function getSupabaseServerClient(operation = "supabase.query"): Promise<SupabaseServerClient> {
  assertDbEnabled(operation);
  if (cached) return cached;

  const env = readSupabaseEnv();
  try {
    const mod = await import("@supabase/supabase-js");
    cached = mod.createClient(env.url, env.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }) as unknown as SupabaseServerClient;
    return cached;
  } catch (err) {
    throw new Error(
      `@supabase/supabase-js não está instalado ainda. ` +
      `Rodar \`pnpm add @supabase/supabase-js\` antes de habilitar DGN_GROWTH_DATA_SOURCE=db. ` +
      `Erro original: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
