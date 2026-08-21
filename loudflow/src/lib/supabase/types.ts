export type Role = "admin" | "marketing" | "partner" | "unit_manager";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  created_at: string;
};

export type Unit = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  archived_at: string | null;
  created_at: string;
};

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type UserOrganization = {
  user_id: string;
  organization_id: string;
  role: Role;
  created_at: string;
};

export type UserUnit = {
  user_id: string;
  unit_id: string;
  created_at: string;
};

export type AuditLog = {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type TaskStatus = "pending" | "completed";
export type TaskPriority = "low" | "normal" | "high";

export type Task = {
  id: string;
  organization_id: string;
  unit_id: string | null;
  title: string;
  description: string | null;
  assigned_to: string;
  created_by: string;
  priority: TaskPriority;
  due_at: string | null;
  status: TaskStatus;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AdProvider = "meta" | "google";
export type CampaignUnitSource = "auto" | "manual" | "unresolved";
export type SyncStatus = "running" | "success" | "partial" | "error";
export type SyncSource = "utmify_http" | "utmify_mcp";

export type SyncRun = {
  id: string;
  organization_id: string;
  provider: AdProvider;
  status: SyncStatus;
  triggered_by: string;
  source: SyncSource;
  period_from: string;
  period_to: string;
  rows_upserted: number;
  campaigns_seen: number;
  started_at: string;
  finished_at: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
};

export type Campaign = {
  id: string;
  organization_id: string;
  provider: AdProvider;
  external_account_id: string;
  external_account_name: string | null;
  external_id: string;
  name: string;
  status: string | null;
  unit_id: string | null;
  unit_source: CampaignUnitSource;
  first_seen_at: string;
  last_seen_at: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignSnapshot = {
  id: string;
  organization_id: string;
  campaign_id: string;
  provider: AdProvider;
  snapshot_date: string;
  spend_cents: number;
  impressions: number;
  clicks: number;
  landing_page_views: number | null;
  initiate_checkouts: number | null;
  leads: number | null;
  frequency: number | null;
  reach_estimated: number | null;
  conversations: number | null;
  approved_orders_count: number;
  pending_orders_count: number;
  refunded_orders_count: number;
  revenue_cents: number;
  gross_revenue_cents: number;
  synced_at: string;
};

export type CampaignUnitAlias = {
  id: string;
  organization_id: string;
  alias: string;
  unit_id: string;
  created_at: string;
};

export type EvoSaleProcessingStatus = "pending" | "paid" | "cancelled" | "error";

export type EvoBranch = {
  id_branch: string;
  organization_id: string;
  unit_id: string | null;
  label: string | null;
  created_at: string;
  updated_at: string;
};

export type EvoSale = {
  id: string;
  organization_id: string;
  unit_id: string | null;
  id_w12: string | null;
  id_branch: string;
  id_sale: string;
  id_member: string | null;
  event_type: string;
  amount_paid_cents: number | null;
  sale_date: string | null;
  receiving_date: string | null;
  payment_type: string | null;
  receivable_status: string | null;
  processing_status: EvoSaleProcessingStatus;
  last_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type AdConversionPlatform = "utmify" | "meta" | "google";
export type AdConversionDeliveryStatus = "pending" | "sent" | "failed" | "skipped";

export type AdConversionDelivery = {
  id: string;
  organization_id: string;
  evo_sale_id: string;
  platform: AdConversionPlatform;
  delivery_key: string;
  status: AdConversionDeliveryStatus;
  attempts: number;
  last_error: string | null;
  response_summary: string | null;
  last_attempt_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EvoReconcileState = {
  organization_id: string;
  id_branch: string | null;
  last_run_at: string;
  last_window_end: string;
  last_window_start: string | null;
  last_fetched: number | null;
  last_paid: number | null;
  last_eligible: number | null;
  last_dry_run: boolean;
  created_at: string;
  updated_at: string;
};

type TableDef<Row extends Record<string, unknown>, InsertKeys extends keyof Row = keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, InsertKeys>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      organizations: TableDef<Organization, "name" | "slug">;
      units: TableDef<Unit, "organization_id" | "name" | "slug">;
      users: TableDef<AppUser, "id" | "email">;
      user_organizations: TableDef<UserOrganization, "user_id" | "organization_id" | "role">;
      user_units: TableDef<UserUnit, "user_id" | "unit_id">;
      audit_log: TableDef<AuditLog, "organization_id" | "action" | "target_type">;
      tasks: TableDef<Task, "organization_id" | "title" | "assigned_to" | "created_by">;
      sync_runs: TableDef<
        SyncRun,
        "organization_id" | "provider" | "status" | "triggered_by" | "period_from" | "period_to"
      >;
      campaigns: TableDef<
        Campaign,
        "organization_id" | "provider" | "external_account_id" | "external_id" | "name"
      >;
      campaign_snapshots: TableDef<
        CampaignSnapshot,
        "organization_id" | "campaign_id" | "provider" | "snapshot_date"
      >;
      campaign_unit_aliases: TableDef<CampaignUnitAlias, "organization_id" | "alias" | "unit_id">;
      evo_branches: TableDef<EvoBranch, "id_branch" | "organization_id">;
      evo_sales: TableDef<
        EvoSale,
        "organization_id" | "id_branch" | "id_sale" | "event_type"
      >;
      ad_conversion_deliveries: TableDef<
        AdConversionDelivery,
        "organization_id" | "evo_sale_id" | "platform" | "delivery_key"
      >;
      evo_reconcile_state: TableDef<
        EvoReconcileState,
        "organization_id" | "last_run_at" | "last_window_end"
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: Role;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      ad_provider: AdProvider;
      campaign_unit_source: CampaignUnitSource;
      sync_status: SyncStatus;
      evo_sale_processing_status: EvoSaleProcessingStatus;
      ad_conversion_platform: AdConversionPlatform;
      ad_conversion_delivery_status: AdConversionDeliveryStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
