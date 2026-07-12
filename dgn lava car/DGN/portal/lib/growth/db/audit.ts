/**
 * Audit service — registra alterações relevantes em crm_audit_logs.
 * Retorna a promise da inserção; o chamador decide se falha silenciosamente
 * ou propaga (default: propaga).
 */

/** SERVER-ONLY — importar deste módulo em qualquer bundle client vaza a service_role key. */
import { getSupabaseServerClient } from "./client";

export type AuditableEntity =
  | "customer"
  | "subscription"
  | "campaign_member"
  | "score_snapshot"
  | "duplicate_candidate";

export interface AuditEntry {
  entityType: AuditableEntity;
  entityId: string;
  action: string;                       // ex.: "subscription.validated", "founder.selected"
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  actor: string;
  reason?: string;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  const client = await getSupabaseServerClient("audit.record");
  const insertable = {
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    previous_value: entry.previousValue ?? null,
    new_value: entry.newValue ?? null,
    actor: entry.actor,
    reason: entry.reason ?? null,
  };
  // O tipo genérico de client evita acoplamento com @supabase/supabase-js aqui.
  const table = (client as unknown as { from(t: string): { insert(x: unknown): Promise<{ error: unknown }> } }).from("crm_audit_logs");
  const { error } = await table.insert(insertable);
  if (error) throw new Error(`falha ao gravar audit_log: ${JSON.stringify(error)}`);
}
