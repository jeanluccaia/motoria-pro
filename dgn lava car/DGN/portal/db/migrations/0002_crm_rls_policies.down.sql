-- =========================================================================
-- Rollback da migration 0002_crm_rls_policies
--
-- Remove a camada de RLS/policies defensivas. Usar apenas para rollback
-- controlado; isso reabre as tabelas ao modelo de grants vigente.
-- =========================================================================

drop policy if exists crm_customers_select_admin on public.crm_customers;
drop policy if exists crm_customers_insert_admin on public.crm_customers;
drop policy if exists crm_customers_update_admin on public.crm_customers;

drop policy if exists crm_vehicles_select_admin on public.crm_vehicles;
drop policy if exists crm_vehicles_insert_admin on public.crm_vehicles;
drop policy if exists crm_vehicles_update_admin on public.crm_vehicles;

drop policy if exists crm_subscriptions_select_admin on public.crm_subscriptions;
drop policy if exists crm_subscriptions_insert_admin on public.crm_subscriptions;
drop policy if exists crm_subscriptions_update_admin on public.crm_subscriptions;

drop policy if exists crm_campaign_members_select_admin on public.crm_campaign_members;
drop policy if exists crm_campaign_members_insert_admin on public.crm_campaign_members;
drop policy if exists crm_campaign_members_update_admin on public.crm_campaign_members;

drop policy if exists crm_interactions_select_admin on public.crm_interactions;
drop policy if exists crm_interactions_insert_admin on public.crm_interactions;

drop policy if exists crm_audit_logs_select_admin on public.crm_audit_logs;
drop policy if exists crm_audit_logs_insert_admin on public.crm_audit_logs;

drop policy if exists crm_score_snapshots_select_admin on public.crm_score_snapshots;
drop policy if exists crm_score_snapshots_insert_admin on public.crm_score_snapshots;

drop policy if exists crm_duplicate_candidates_select_admin on public.crm_duplicate_candidates;
drop policy if exists crm_duplicate_candidates_insert_admin on public.crm_duplicate_candidates;
drop policy if exists crm_duplicate_candidates_update_admin on public.crm_duplicate_candidates;

drop trigger if exists trg_crm_audit_logs_guard on public.crm_audit_logs;
drop function if exists public.crm_audit_logs_guard();

alter table if exists public.crm_customers no force row level security;
alter table if exists public.crm_vehicles no force row level security;
alter table if exists public.crm_subscriptions no force row level security;
alter table if exists public.crm_campaign_members no force row level security;
alter table if exists public.crm_interactions no force row level security;
alter table if exists public.crm_audit_logs no force row level security;
alter table if exists public.crm_score_snapshots no force row level security;
alter table if exists public.crm_duplicate_candidates no force row level security;

alter table if exists public.crm_customers disable row level security;
alter table if exists public.crm_vehicles disable row level security;
alter table if exists public.crm_subscriptions disable row level security;
alter table if exists public.crm_campaign_members disable row level security;
alter table if exists public.crm_interactions disable row level security;
alter table if exists public.crm_audit_logs disable row level security;
alter table if exists public.crm_score_snapshots disable row level security;
alter table if exists public.crm_duplicate_candidates disable row level security;

revoke all on table public.crm_customers from authenticated;
revoke all on table public.crm_vehicles from authenticated;
revoke all on table public.crm_subscriptions from authenticated;
revoke all on table public.crm_campaign_members from authenticated;
revoke all on table public.crm_interactions from authenticated;
revoke all on table public.crm_audit_logs from authenticated;
revoke all on table public.crm_score_snapshots from authenticated;
revoke all on table public.crm_duplicate_candidates from authenticated;

drop function if exists public.crm_can_write_audit();
drop function if exists public.crm_can_read_audit();
drop function if exists public.crm_can_write_crm();
drop function if exists public.crm_can_read_crm();
drop function if exists public.crm_is_growth_admin();
drop function if exists public.crm_growth_role();
