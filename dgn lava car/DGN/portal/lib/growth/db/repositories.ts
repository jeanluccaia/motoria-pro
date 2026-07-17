import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";

export type WriteAction = "created" | "updated" | "noop";
export type WriteResult = { row: Record<string, unknown>; action: WriteAction };

export interface CustomerRow extends Record<string, unknown> {
  id: string;
  legacy_id: string | null;
  name: string;
  normalized_name: string;
  normalized_phone: string | null;
}

export interface CustomerWrite extends Record<string, unknown> {
  legacy_id: string;
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
  data_quality_status: "ok" | "incompleto" | "nome_incompleto" | "telefone_invalido" | "placa_invalida" | "multiplas_pendencias";
  data_quality_notes: string | null;
}

export interface VehicleWrite extends Record<string, unknown> {
  customer_id: string;
  brand: string | null;
  model: string | null;
  normalized_model: string | null;
  plate: string | null;
  masked_plate: string | null;
  normalized_plate: string | null;
  is_primary: boolean;
  source: string;
}

export interface SubscriptionWrite extends Record<string, unknown> {
  customer_id: string;
  is_active_subscriber: boolean;
  subscription_plan: "Essential" | "Smart" | "Priority" | "Não identificado";
  subscription_cycle: "mensal" | "semestral" | "anual" | "outro" | "não identificado";
  subscription_status: "detectado" | "pendente_validacao" | "ativo" | "inadimplente" | "cancelado" | "encerrado";
  subscription_source: "4uCar" | "Portal" | "Manual" | "Importação";
  subscription_detected_at: string | null;
  next_scheduled_service_at: string | null;
  source_reference: string | null;
  notes: string | null;
}

export interface CampaignMemberWrite extends Record<string, unknown> {
  campaign_id: string;
  customer_id: string;
  founder_status: "não_avaliado" | "recomendado" | "selecionado" | "confirmado" | "lista_espera" | "descartado";
  commercial_stage: "aguardando_analise" | "pronto_para_contato" | "contato_preparado" | "contatado" | "visualizou" | "respondeu" | "conversando" | "pagamento_enviado" | "convertido" | "descartado";
  recommendation_reason: string | null;
  commercial_notes: string | null;
  founder_number: string | null;
  kit_status: "não_aplicável" | "pendente" | "em_preparação" | "pronto" | "entregue";
  card_status: "não_aplicável" | "pendente" | "solicitado" | "produzido" | "entregue";
}

export interface InteractionInput extends Record<string, unknown> {
  customer_id: string;
  interaction_type: "importação" | "curadoria" | "status_alterado" | "assinatura_detectada" | "assinatura_validada";
  actor: string;
}

interface CampaignMemberRow extends Record<string, unknown> {
  id: string;
  customer_id: string;
  campaign_id: string;
  commercial_stage: string;
}

interface SubscriptionRow extends Record<string, unknown> {
  id: string;
  customer_id: string;
  subscription_status: string;
  subscription_plan: string;
  subscription_cycle: string;
  is_active_subscriber: boolean;
}

export interface AuditLogInput extends Record<string, unknown> {
  entity_type: string;
  entity_id: string;
  action: string;
  actor: string;
}

function required(value: string, field: string, max = 1000): string {
  const clean = value.trim();
  if (!clean) throw new Error(`${field} obrigatório`);
  if (clean.length > max) throw new Error(`${field} excede ${max} caracteres`);
  return clean;
}

function uuid(value: string, field: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error(`${field} deve ser UUID`);
  return value;
}

function differs(current: Record<string, unknown>, wanted: Record<string, unknown>): boolean {
  return Object.entries(wanted).some(([key, value]) => JSON.stringify(current[key] ?? null) !== JSON.stringify(value ?? null));
}

export class CrmRepository {
  private readonly db: SupabaseClient;

  constructor(db: SupabaseClient = getSupabaseAdminClient("crm.repository")) {
    this.db = db;
  }

  async findCustomerByExternalId(externalId: string): Promise<CustomerRow | null> {
    const result = await this.db.from("crm_customers").select("*").eq("legacy_id", required(externalId, "externalId", 200)).maybeSingle();
    if (result.error) throw new Error(`falha ao buscar cliente por external_id: ${result.error.message}`);
    return result.data as CustomerRow | null;
  }

  async findCustomersByNormalizedPhone(phone: string): Promise<CustomerRow[]> {
    const result = await this.db.from("crm_customers").select("*").eq("normalized_phone", required(phone, "normalizedPhone", 20)).limit(2);
    if (result.error) throw new Error(`falha ao buscar cliente por telefone: ${result.error.message}`);
    return (result.data ?? []) as CustomerRow[];
  }

  async createCustomer(input: CustomerWrite): Promise<CustomerRow> {
    required(input.legacy_id, "legacy_id", 200); required(input.name, "name", 300); required(input.normalized_name, "normalized_name", 300);
    const result = await this.db.from("crm_customers").insert(input).select("*").single();
    if (result.error) throw new Error(`falha ao criar cliente: ${result.error.message}`);
    return result.data as CustomerRow;
  }

  async updateCustomer(id: string, input: CustomerWrite): Promise<CustomerRow> {
    const result = await this.db.from("crm_customers").update(input).eq("id", uuid(id, "customer.id")).select("*").single();
    if (result.error) throw new Error(`falha ao atualizar cliente: ${result.error.message}`);
    return result.data as CustomerRow;
  }

  async upsertVehicle(input: VehicleWrite): Promise<WriteResult> {
    uuid(input.customer_id, "vehicle.customer_id");
    let query = this.db.from("crm_vehicles").select("*").eq("customer_id", input.customer_id);
    query = input.normalized_plate ? query.eq("normalized_plate", input.normalized_plate) : query.is("normalized_plate", null);
    const found = await query.limit(2);
    if (found.error) throw new Error(`falha ao conciliar veículo: ${found.error.message}`);
    if ((found.data?.length ?? 0) > 1) throw new Error("duplicidade ambígua de veículo");
    return this.persistOne("crm_vehicles", found.data?.[0], input);
  }

  async upsertSubscription(input: SubscriptionWrite): Promise<WriteResult> {
    uuid(input.customer_id, "subscription.customer_id");
    const found = await this.db.from("crm_subscriptions").select("*").eq("customer_id", input.customer_id).limit(2);
    if (found.error) throw new Error(`falha ao conciliar assinatura: ${found.error.message}`);
    if ((found.data?.length ?? 0) > 1) throw new Error("duplicidade ambígua de assinatura");
    return this.persistOne("crm_subscriptions", found.data?.[0], input);
  }

  async upsertCampaignMember(input: CampaignMemberWrite): Promise<WriteResult> {
    uuid(input.customer_id, "campaign.customer_id"); required(input.campaign_id, "campaign_id", 200);
    const found = await this.db.from("crm_campaign_members").select("*").eq("campaign_id", input.campaign_id).eq("customer_id", input.customer_id).maybeSingle();
    if (found.error) throw new Error(`falha ao conciliar campaign member: ${found.error.message}`);
    const current = found.data as Record<string, unknown> | null;
    if (current?.founder_status === "confirmado" && input.founder_status !== "confirmado") throw new Error("Founder confirmado não pode ser sobrescrito");
    return this.persistOne("crm_campaign_members", current, input);
  }

  async createInteraction(input: InteractionInput): Promise<void> {
    uuid(input.customer_id, "interaction.customer_id"); required(input.actor, "interaction.actor", 200);
    const result = await this.db.from("crm_interactions").insert({ ...input, metadata: input.metadata ?? {} });
    if (result.error) throw new Error(`falha ao criar interação: ${result.error.message}`);
  }

  async createAuditLog(input: AuditLogInput): Promise<void> {
    uuid(input.entity_id, "audit.entity_id"); required(input.actor, "audit.actor", 200);
    const result = await this.db.from("crm_audit_logs").insert(input);
    if (result.error) throw new Error(`falha ao criar audit log: ${result.error.message}`);
  }

  async findDuplicateCandidates(customerId: string): Promise<Record<string, unknown>[]> {
    uuid(customerId, "duplicate.customer_id");
    const result = await this.db.from("crm_duplicate_candidates").select("*").or(`source_customer_id.eq.${customerId},target_customer_id.eq.${customerId}`);
    if (result.error) throw new Error(`falha ao consultar duplicidade: ${result.error.message}`);
    return (result.data ?? []) as Record<string, unknown>[];
  }

  private async persistOne(table: string, current: Record<string, unknown> | null | undefined, input: Record<string, unknown>): Promise<WriteResult> {
    if (!current) {
      const result = await this.db.from(table).insert(input).select("*").single();
      if (result.error) throw new Error(`falha ao criar em ${table}: ${result.error.message}`);
      return { row: result.data as Record<string, unknown>, action: "created" };
    }
    if (!differs(current, input)) return { row: current, action: "noop" };
    const result = await this.db.from(table).update(input).eq("id", current.id).select("*").single();
    if (result.error) throw new Error(`falha ao atualizar em ${table}: ${result.error.message}`);
    return { row: result.data as Record<string, unknown>, action: "updated" };
  }
}

// APIs legadas mantidas para os services server-side existentes.
export const campaignMembersRepo = {
  async findById(id: string): Promise<CampaignMemberRow | null> {
    const db = getSupabaseAdminClient("campaign.findById");
    const result = await db.from("crm_campaign_members").select("*").eq("id", uuid(id, "campaign.id")).maybeSingle();
    if (result.error) throw result.error;
    return result.data as CampaignMemberRow | null;
  },
  async updateStage(id: string, to: string): Promise<void> {
    const result = await getSupabaseAdminClient("campaign.updateStage").from("crm_campaign_members").update({ commercial_stage: to }).eq("id", uuid(id, "campaign.id"));
    if (result.error) throw result.error;
  },
};

export const interactionsRepo = {
  append(input: { customerId: string; campaignId?: string | null; interactionType: InteractionInput["interaction_type"]; channel?: string | null; description?: string | null; metadata?: Record<string, unknown>; actor: string; occurredAt?: string }) {
    return new CrmRepository().createInteraction({ customer_id: input.customerId, campaign_id: input.campaignId, interaction_type: input.interactionType, channel: input.channel, description: input.description, metadata: input.metadata, actor: input.actor, occurred_at: input.occurredAt });
  },
};

export const subscriptionsRepo = {
  async findById(id: string): Promise<SubscriptionRow | null> {
    const result = await getSupabaseAdminClient("subscription.findById").from("crm_subscriptions").select("*").eq("id", uuid(id, "subscription.id")).maybeSingle();
    if (result.error) throw result.error;
    return result.data as SubscriptionRow | null;
  },
  async validate(id: string, params: { newStatus: string; validatedBy: string }): Promise<void> {
    const result = await getSupabaseAdminClient("subscription.validate").from("crm_subscriptions").update({ subscription_status: params.newStatus, subscription_validated_at: new Date().toISOString(), subscription_validated_by: params.validatedBy, is_active_subscriber: params.newStatus === "ativo" }).eq("id", uuid(id, "subscription.id"));
    if (result.error) throw result.error;
  },
};

export const scoreSnapshotsRepo = {
  async saveSnapshot(row: { customer_id: string; score_version: string; total_score: number; components: Record<string, number>; penalties: unknown[]; explanation: string[] }): Promise<void> {
    const result = await getSupabaseAdminClient("score.save").from("crm_score_snapshots").insert({
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
    if (result.error) throw result.error;
  },
};
