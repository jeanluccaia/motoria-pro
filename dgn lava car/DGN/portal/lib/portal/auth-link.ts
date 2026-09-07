import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../growth/db/admin-client.ts";

// -----------------------------------------------------------------------------
// Verificação server-side do vínculo Auth ↔ Assinante do Portal.
//
// A tabela `crm_customer_auth` roda com RLS enabled + forced e sem policies
// de SELECT (tabela puramente administrativa). Ler ela com o cliente
// autenticado do usuário (@supabase/ssr + anon key) retorna sempre `null`
// mesmo quando o vínculo existe — foi o que quebrou o login real do primeiro
// assinante em 2026-09-07. A leitura precisa acontecer via service_role,
// restrita ao próprio `authUserId` recém-validado pela sessão.
//
// Nunca abra a tabela via policy pública — se um dia precisar expor no
// cliente, use RPC SECURITY DEFINER filtrando por `auth.uid()`.
// -----------------------------------------------------------------------------

export type VerifyAuthLinkResult =
  | { ok: true; customerId: string }
  | { ok: false; reason: "not_linked" }
  | { ok: false; reason: "db_error"; message: string };

export async function verifyPortalAuthLink(
  authUserId: string,
  db: SupabaseClient = getSupabaseAdminClient("portal.auth.callback.verify-link"),
): Promise<VerifyAuthLinkResult> {
  if (typeof authUserId !== "string" || authUserId.trim().length === 0) {
    return { ok: false, reason: "not_linked" };
  }

  const { data, error } = await db
    .from("crm_customer_auth")
    .select("customer_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    return { ok: false, reason: "db_error", message: error.message };
  }
  if (!data) {
    return { ok: false, reason: "not_linked" };
  }
  return { ok: true, customerId: (data as { customer_id: string }).customer_id };
}
