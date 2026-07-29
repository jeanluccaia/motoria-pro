import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { dgnCustomers } from "../dgn-growth-data.ts";
import type { CommercialStatus, DgnCustomer, FoundersPipelineStatus, RecommendedPlan } from "../dgn-growth-data.ts";
import { getSupabaseAdminClient } from "./admin-client.ts";

export type GrowthDataSource = "json" | "db";
export type GrowthDataOrigin = "json" | "db" | "json-fallback";

export interface GrowthDataResult {
  customers: DgnCustomer[];
  origin: GrowthDataOrigin;
  readOnly: boolean;
}

type Row = Record<string, unknown>;
export interface GrowthDbSnapshot {
  customers: Row[];
  vehicles: Row[];
  subscriptions: Row[];
  campaignMembers: Row[];
  interactions: Row[];
  scores: Row[];
  founderLinks?: Row[];
}

type GrowthEnv = Record<string, string | undefined>;

export function readGrowthDataConfig(env: GrowthEnv = process.env) {
  const raw = (env.DGN_GROWTH_DATA_SOURCE ?? "json").trim().toLowerCase();
  if (raw !== "json" && raw !== "db") {
    throw new Error(`DGN_GROWTH_DATA_SOURCE inválida: "${raw}". Use "json" ou "db".`);
  }
  return {
    source: raw as GrowthDataSource,
    allowJsonFallback: env.DGN_GROWTH_ALLOW_JSON_FALLBACK?.trim().toLowerCase() === "true",
  };
}

const DB_PAGE_SIZE = 500;

async function selectAll(db: SupabaseClient, table: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += DB_PAGE_SIZE) {
    const result = await db.from(table).select("*").range(from, from + DB_PAGE_SIZE - 1);
    if (result.error) throw new Error(`${table}: ${result.error.message}`);
    const page = (result.data ?? []) as Row[];
    rows.push(...page);
    if (page.length < DB_PAGE_SIZE) return rows;
  }
}

async function selectAllOptional(db: SupabaseClient, table: string): Promise<Row[]> {
  try { return await selectAll(db, table); } catch { return []; }
}

export async function readGrowthSnapshot(db: SupabaseClient): Promise<GrowthDbSnapshot> {
  const [customers, vehicles, subscriptions, campaignMembers, interactions, scores, founderLinks] = await Promise.all([
    selectAll(db, "crm_customers"),
    selectAll(db, "crm_vehicles"),
    selectAll(db, "crm_subscriptions"),
    selectAll(db, "crm_campaign_members"),
    selectAll(db, "crm_interactions"),
    selectAll(db, "crm_score_snapshots"),
    selectAllOptional(db, "crm_founder_public_links"),
  ]);
  return { customers, vehicles, subscriptions, campaignMembers, interactions, scores, founderLinks };
}

const commercialStage: Record<string, FoundersPipelineStatus | ""> = {
  aguardando_analise: "Selecionado", pronto_para_contato: "Selecionado",
  contato_preparado: "Convite criado", contatado: "Mensagem enviada", visualizou: "Visualizou",
  respondeu: "Conversando", conversando: "Conversando", pagamento_enviado: "Pagamento enviado",
  convertido: "Assinante ativo", descartado: "Perdido",
};

const commercialStatus: Record<string, CommercialStatus> = {
  Selecionado: "Selecionado Founder", "Convite criado": "Convite Criado",
  "Mensagem enviada": "Convite Enviado", Visualizou: "Visualizou", Conversando: "Conversando",
  "Pagamento enviado": "Pagamento Enviado", "Assinante ativo": "Assinante Ativo", Perdido: "Perdido",
};

const plan = (value: unknown): RecommendedPlan => value === "Priority" ? "Priority" : value === "Corporate Care" ? "Corporate Care" : "Smart";
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const date = (value: unknown) => text(value).slice(0, 10) || "A definir";
const priority = (value: unknown): "baixa" | "normal" | "alta" | "urgente" => {
  if (Number(value) === 1) return "baixa";
  if (Number(value) === 3) return "alta";
  if (Number(value) === 4) return "urgente";
  return "normal";
};

export function mapGrowthSnapshot(snapshot: GrowthDbSnapshot): DgnCustomer[] {
  return snapshot.customers.map((customer) => {
    const customerId = text(customer.id);
    const vehicle = snapshot.vehicles.find((row) => row.customer_id === customerId && row.is_primary)
      ?? snapshot.vehicles.find((row) => row.customer_id === customerId);
    const subscription = snapshot.subscriptions.find((row) => row.customer_id === customerId);
    const member = snapshot.campaignMembers.find((row) => row.customer_id === customerId);
    const score = snapshot.scores.filter((row) => row.customer_id === customerId)
      .sort((a, b) => text(b.calculated_at).localeCompare(text(a.calculated_at)))[0];
    const interactions = snapshot.interactions.filter((row) => row.customer_id === customerId)
      .sort((a, b) => text(b.occurred_at).localeCompare(text(a.occurred_at)));
    const publicLink = (snapshot.founderLinks ?? []).filter((row) => row.campaign_member_id === member?.id && row.enabled === true)
      .sort((a, b) => number(b.version) - number(a.version))[0];
    const campaignStatus = commercialStage[text(member?.commercial_stage)] ?? "";
    const founderSelected = ["selecionado", "confirmado"].includes(text(member?.founder_status));
    const active = subscription?.is_active_subscriber === true || text(subscription?.subscription_status) === "ativo";
    const recommendedPlan = plan(subscription?.subscription_plan);

    return {
      id: text(customer.legacy_id) || customerId,
      name: text(customer.name), phone: text(customer.primary_phone),
      vehicle: [text(vehicle?.brand), text(vehicle?.model)].filter(Boolean).join(" ") || "A definir",
      plate: text(vehicle?.plate), companyLink: text(customer.company_or_link), origin: text(customer.origin),
      attendanceHistory: interactions.map((row) => text(row.description) || text(row.interaction_type)).filter(Boolean),
      washCount: number(customer.service_count), historicalValue: number(customer.historical_value),
      customerSince: date(customer.first_service_at), lastAttendance: date(customer.last_service_at),
      scoreDgn: number(score?.total_score), recommendedPlan,
      commercialStatus: active ? "Assinante Ativo" : (commercialStatus[campaignStatus] ?? "Aguardando Curadoria DGN"),
      recurrence: text(subscription?.subscription_cycle) || "A validar na curadoria",
      averageVisitIntervalDays: number(customer.average_interval_days),
      dataQualityStatus: text(customer.data_quality_status),
      dataQualityNotes: text(customer.data_quality_notes),
      hasValidPhone: Boolean(text(customer.normalized_phone)),
      commercial: { owner: text(member?.owner), commercialNotes: text(member?.commercial_notes),
        nextAction: text(member?.next_action), nextActionAt: text(member?.next_action_at),
        priority: priority(member?.priority), updatedAt: text(member?.updated_at) },
      curation: { profile: "", originGroup: "", commercialProfile: "", idealSchedule: "",
        founderDecision: founderSelected ? "Sim" : "", founderNumber: text(member?.founder_number),
        internalNotes: text(member?.commercial_notes) },
      campaign: { currentCampaign: member ? "Founders 2026" : "", founderSelected,
        founderNumber: text(member?.founder_number), founderCondition: text(member?.recommendation_reason),
        campaignStatus, personalizedPagePath: publicLink ? `/founders/${text(publicLink.slug)}` : "", paymentLink: "", lastAction: text(interactions[0]?.description),
        nextAction: text(member?.next_action), lastContact: date(interactions[0]?.occurred_at),
        conversationStatus: campaignStatus || "Sem contato recente", notes: text(member?.commercial_notes),
        kitStatus: text(member?.kit_status) === "entregue" ? "Entregue" : text(member?.kit_status) === "pronto" ? "Separado" : founderSelected ? "Pendente" : "",
        cardStatus: text(member?.card_status) === "entregue" ? "Enviado" : ["solicitado", "produzido"].includes(text(member?.card_status)) ? "Gerado" : founderSelected ? "Pendente" : "",
        founderStatus: text(member?.founder_status).replace("não_avaliado", "nao_avaliado") || "nao_avaliado",
        commercialStage: text(member?.commercial_stage) || "aguardando_analise",
        selectionReason: text(member?.selection_reason), lostReason: text(member?.lost_reason),
        kitStatusRaw: text(member?.kit_status).replace("não_aplicável", "nao_aplicavel") || "nao_aplicavel",
        cardStatusRaw: text(member?.card_status).replace("não_aplicável", "nao_aplicavel") || "nao_aplicavel",
        dates: { inviteCreatedAt: text(member?.invite_created_at), inviteSentAt: text(member?.invite_sent_at), viewedAt: text(member?.viewed_at), respondedAt: text(member?.responded_at), conversationStartedAt: text(member?.conversation_started_at), paymentSentAt: text(member?.payment_sent_at), convertedAt: text(member?.converted_at), lostAt: text(member?.lost_at), kitUpdatedAt: text(member?.kit_updated_at), cardUpdatedAt: text(member?.card_updated_at) },
        history: interactions.filter((row) => row.campaign_id === member?.campaign_id).map((row) => ({ type: text(row.interaction_type), description: text(row.description), occurredAt: text(row.occurred_at), actor: text(row.actor) })),
        engagement: { viewedAt: text(member?.viewed_at), lastViewedAt: text(member?.last_viewed_at), viewCount: number(member?.view_count),
          confirmClickedAt: text(member?.confirm_whatsapp_clicked_at), confirmClickCount: number(member?.confirm_whatsapp_click_count),
          vipClickedAt: text(member?.vip_whatsapp_clicked_at), vipClickCount: number(member?.vip_whatsapp_click_count) },
        curation: { recommendedPlanCode: text(member?.recommended_plan_code), recommendedPlanName: text(member?.recommended_plan_name),
          recommendedPlanVersion: text(member?.recommended_plan_version), recommendedVehicleCategory: text(member?.recommended_vehicle_category),
          recommendationReasonInternal: text(member?.recommendation_reason_internal), recommendationMessagePublic: text(member?.recommendation_message_public),
          curatedBy: text(member?.curated_by), curatedAt: text(member?.curated_at), approvedAt: text(member?.approved_at),
          planSnapshot: member?.plan_snapshot && typeof member.plan_snapshot === "object" ? member.plan_snapshot as Record<string, unknown> : null,
          publicLink: publicLink ? { slug: text(publicLink.slug), enabled: publicLink.enabled === true, version: number(publicLink.version), createdAt: text(publicLink.created_at) } : null,
          inviteSentAt: text(member?.invite_sent_at) },
        updatedAt: text(member?.updated_at) },
    } as DgnCustomer;
  });
}

export async function loadGrowthData(options: { env?: GrowthEnv; db?: SupabaseClient; logger?: Partial<Pick<Console, "error" | "info">> } = {}): Promise<GrowthDataResult> {
  const config = readGrowthDataConfig(options.env);
  if (config.source === "json") return { customers: dgnCustomers, origin: "json", readOnly: true };
  try {
    const started = performance.now();
    const snapshot = await readGrowthSnapshot(options.db ?? getSupabaseAdminClient("growth.read"));
    const customers = mapGrowthSnapshot(snapshot);
    options.logger?.info?.(`[DGN Growth] data source: db | total: ${customers.length} | query: ${Math.round(performance.now() - started)}ms`);
    return { customers, origin: "db", readOnly: true };
  } catch (error) {
    options.logger?.error?.("[DGN Growth] Falha na leitura do Supabase", error instanceof Error ? error.message : "erro desconhecido");
    if (config.allowJsonFallback) return { customers: dgnCustomers, origin: "json-fallback", readOnly: true };
    throw new Error("Não foi possível carregar os dados do Supabase. O fallback local está desativado.", { cause: error });
  }
}
