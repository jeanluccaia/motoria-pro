/**
 * Camada thin de repositories.
 *
 * Objetivo: isolar todas as chamadas ao Supabase em funções nomeadas. Nenhum
 * componente client, nenhum arquivo fora de `lib/growth/db/` e route handlers,
 * deve importar `client.ts` diretamente.
 *
 * Enquanto o banco não estiver plugado, cada função lança via `assertDbEnabled`
 * dentro de `getSupabaseServerClient` — nunca retorna dados falsos.
 */

/** SERVER-ONLY — importar deste módulo em qualquer bundle client vaza a service_role key. */
import { getSupabaseServerClient } from "./client";

type FromFn = (table: string) => {
  select: (cols?: string) => {
    eq: (col: string, value: unknown) => { single: () => Promise<{ data: unknown; error: unknown }> };
    order: (col: string, opts?: { ascending?: boolean }) => { limit: (n: number) => Promise<{ data: unknown; error: unknown }> };
  };
  insert: (row: unknown) => Promise<{ data: unknown; error: unknown }>;
  update: (patch: unknown) => { eq: (col: string, value: unknown) => Promise<{ data: unknown; error: unknown }> };
};

async function client() {
  return (await getSupabaseServerClient("repositories")) as unknown as { from: FromFn };
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export interface CustomerRow {
  id: string;
  legacy_id: string | null;
  name: string;
  normalized_name: string;
  primary_phone: string | null;
  normalized_phone: string | null;
  email: string | null;
  company_or_link: string | null;
  origin: string | null;
  first_service_at: string | null;
  last_service_at: string | null;
  service_count: number;
  historical_value: number;
  average_ticket: number;
  average_interval_days: number | null;
  data_quality_status: string;
  created_at: string;
  updated_at: string;
}

export const customersRepo = {
  async findById(id: string): Promise<CustomerRow | null> {
    const c = await client();
    const { data, error } = await c.from("crm_customers").select().eq("id", id).single();
    if (error) throw error;
    return (data as CustomerRow | null) ?? null;
  },

  async findByLegacyId(legacyId: string): Promise<CustomerRow | null> {
    const c = await client();
    const { data, error } = await c.from("crm_customers").select().eq("legacy_id", legacyId).single();
    if (error) throw error;
    return (data as CustomerRow | null) ?? null;
  },
};

// ---------------------------------------------------------------------------
// Campaign members
// ---------------------------------------------------------------------------

export interface CampaignMemberRow {
  id: string;
  campaign_id: string;
  customer_id: string;
  founder_status: string;
  commercial_stage: string;
  priority: number | null;
  owner: string | null;
  next_action: string | null;
  next_action_at: string | null;
  recommendation_reason: string | null;
  blockers: string[];
  commercial_notes: string | null;
  founder_number: string | null;
  kit_status: string;
  card_status: string;
  created_at: string;
  updated_at: string;
}

export const campaignMembersRepo = {
  async findById(id: string): Promise<CampaignMemberRow | null> {
    const c = await client();
    const { data, error } = await c.from("crm_campaign_members").select().eq("id", id).single();
    if (error) throw error;
    return (data as CampaignMemberRow | null) ?? null;
  },

  async updateStage(id: string, to: string): Promise<void> {
    const c = await client();
    const { error } = await c.from("crm_campaign_members").update({ commercial_stage: to }).eq("id", id);
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// Interactions (append-only)
// ---------------------------------------------------------------------------

export interface InteractionInput {
  customerId: string;
  campaignId?: string | null;
  interactionType: string;
  channel?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
  actor: string;
  occurredAt?: string;
}

export const interactionsRepo = {
  async append(entry: InteractionInput): Promise<void> {
    const c = await client();
    const { error } = await c.from("crm_interactions").insert({
      customer_id: entry.customerId,
      campaign_id: entry.campaignId ?? null,
      interaction_type: entry.interactionType,
      channel: entry.channel ?? null,
      description: entry.description ?? null,
      metadata: entry.metadata ?? {},
      actor: entry.actor,
      occurred_at: entry.occurredAt ?? new Date().toISOString(),
    });
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export interface SubscriptionRow {
  id: string;
  customer_id: string;
  is_active_subscriber: boolean;
  subscription_plan: string;
  subscription_cycle: string;
  subscription_status: string;
  subscription_source: string;
  subscription_detected_at: string | null;
  subscription_validated_at: string | null;
  subscription_validated_by: string | null;
  next_scheduled_service_at: string | null;
  source_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const subscriptionsRepo = {
  async findById(id: string): Promise<SubscriptionRow | null> {
    const c = await client();
    const { data, error } = await c.from("crm_subscriptions").select().eq("id", id).single();
    if (error) throw error;
    return (data as SubscriptionRow | null) ?? null;
  },

  async validate(id: string, params: { newStatus: string; validatedBy: string }): Promise<void> {
    const c = await client();
    const { error } = await c.from("crm_subscriptions").update({
      subscription_status: params.newStatus,
      subscription_validated_at: new Date().toISOString(),
      subscription_validated_by: params.validatedBy,
      is_active_subscriber: params.newStatus === "ativo",
    }).eq("id", id);
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// Score snapshots
// ---------------------------------------------------------------------------

export const scoreSnapshotsRepo = {
  async saveSnapshot(row: {
    customer_id: string;
    score_version: string;
    total_score: number;
    components: Record<string, number>;
    penalties: unknown[];
    explanation: string[];
  }): Promise<void> {
    const c = await client();
    const { error } = await c.from("crm_score_snapshots").insert({
      customer_id: row.customer_id,
      score_version: row.score_version,
      total_score: row.total_score,
      recurrence_score: row.components.recurrence ?? 0,
      recency_score: row.components.recency ?? 0,
      service_count_score: row.components.serviceCount ?? 0,
      value_score: row.components.value ?? 0,
      plan_fit_score: row.components.planFit ?? 0,
      data_quality_score: row.components.dataQuality ?? 0,
      strategic_link_score: row.components.strategicLink ?? 0,
      relationship_score: row.components.relationship ?? 0,
      penalties: row.penalties,
      explanation: { lines: row.explanation },
    });
    if (error) throw error;
  },
};
