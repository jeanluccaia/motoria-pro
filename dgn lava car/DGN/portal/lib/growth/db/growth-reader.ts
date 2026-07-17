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

async function selectAll(db: SupabaseClient, table: string): Promise<Row[]> {
  const result = await db.from(table).select("*");
  if (result.error) throw new Error(`${table}: ${result.error.message}`);
  return (result.data ?? []) as Row[];
}

export async function readGrowthSnapshot(db: SupabaseClient): Promise<GrowthDbSnapshot> {
  const [customers, vehicles, subscriptions, campaignMembers, interactions, scores] = await Promise.all([
    selectAll(db, "crm_customers"),
    selectAll(db, "crm_vehicles"),
    selectAll(db, "crm_subscriptions"),
    selectAll(db, "crm_campaign_members"),
    selectAll(db, "crm_interactions"),
    selectAll(db, "crm_score_snapshots"),
  ]);
  return { customers, vehicles, subscriptions, campaignMembers, interactions, scores };
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
      curation: { profile: "", originGroup: "", commercialProfile: "", idealSchedule: "",
        founderDecision: founderSelected ? "Sim" : "", founderNumber: text(member?.founder_number),
        internalNotes: text(member?.commercial_notes) },
      campaign: { currentCampaign: member ? "Founders 2026" : "", founderSelected,
        founderNumber: text(member?.founder_number), founderCondition: text(member?.recommendation_reason),
        campaignStatus, personalizedPagePath: "", paymentLink: "", lastAction: text(interactions[0]?.description),
        nextAction: text(member?.next_action), lastContact: date(interactions[0]?.occurred_at),
        conversationStatus: campaignStatus || "Sem contato recente", notes: text(member?.commercial_notes),
        kitStatus: text(member?.kit_status) === "entregue" ? "Entregue" : text(member?.kit_status) === "pronto" ? "Separado" : founderSelected ? "Pendente" : "",
        cardStatus: text(member?.card_status) === "entregue" ? "Enviado" : ["solicitado", "produzido"].includes(text(member?.card_status)) ? "Gerado" : founderSelected ? "Pendente" : "" },
    } as DgnCustomer;
  });
}

export async function loadGrowthData(options: { env?: GrowthEnv; db?: SupabaseClient; logger?: Pick<Console, "error"> } = {}): Promise<GrowthDataResult> {
  const config = readGrowthDataConfig(options.env);
  if (config.source === "json") return { customers: dgnCustomers, origin: "json", readOnly: false };
  try {
    const snapshot = await readGrowthSnapshot(options.db ?? getSupabaseAdminClient("growth.read"));
    return { customers: mapGrowthSnapshot(snapshot), origin: "db", readOnly: true };
  } catch (error) {
    options.logger?.error("[DGN Growth] Falha na leitura do Supabase", error instanceof Error ? error.message : "erro desconhecido");
    if (config.allowJsonFallback) return { customers: dgnCustomers, origin: "json-fallback", readOnly: true };
    throw new Error("Não foi possível carregar os dados do Supabase. O fallback local está desativado.", { cause: error });
  }
}
