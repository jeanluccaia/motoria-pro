-- =========================================================================
-- DGN CRM — RLS e políticas defensivas
-- Migration: 0002_crm_rls_policies
-- Requires: 0001_crm_schema
--
-- Arquitetura atual:
-- - Browser não acessa tabelas CRM diretamente.
-- - Fluxos administrativos passam por route handlers/server actions.
-- - SUPABASE_SERVICE_ROLE_KEY fica apenas no servidor.
-- - RLS abaixo protege anon/authenticated caso alguma tabela seja exposta por
--   engano e prepara uma rota futura com Supabase Auth + claims administrativas.
-- =========================================================================

-- -------------------------------------------------------------------------
-- Helpers de autorização
-- -------------------------------------------------------------------------
create or replace function public.crm_growth_role()
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  raw_claims text;
  claims jsonb := '{}'::jsonb;
begin
  raw_claims := current_setting('request.jwt.claims', true);

  if raw_claims is not null and btrim(raw_claims) <> '' then
    begin
      claims := raw_claims::jsonb;
    exception when others then
      claims := '{}'::jsonb;
    end;
  end if;

  return coalesce(
    nullif(claims #>> '{app_metadata,dgn_growth_role}', ''),
    nullif(claims #>> '{user_metadata,dgn_growth_role}', ''),
    nullif(claims ->> 'dgn_growth_role', ''),
    ''
  );
end;
$$;

create or replace function public.crm_is_growth_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.crm_growth_role() in ('admin', 'operator', 'auditor');
$$;

create or replace function public.crm_can_read_crm()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.crm_growth_role() in ('admin', 'operator', 'auditor');
$$;

create or replace function public.crm_can_write_crm()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.crm_growth_role() in ('admin', 'operator');
$$;

create or replace function public.crm_can_read_audit()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.crm_growth_role() in ('admin', 'auditor');
$$;

create or replace function public.crm_can_write_audit()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.crm_growth_role() in ('admin', 'operator');
$$;

-- -------------------------------------------------------------------------
-- Hardening do audit log: append-only e timestamp controlado pelo banco
-- -------------------------------------------------------------------------
create or replace function public.crm_audit_logs_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();

    if new.actor is null or btrim(new.actor) = '' then
      new.actor := coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        nullif(public.crm_growth_role(), ''),
        'server'
      );
    end if;

    return new;
  end if;

  raise exception 'crm_audit_logs is append-only (% blocked)', tg_op;
end;
$$;

drop trigger if exists trg_crm_audit_logs_guard on public.crm_audit_logs;
create trigger trg_crm_audit_logs_guard
  before insert or update or delete on public.crm_audit_logs
  for each row execute function public.crm_audit_logs_guard();

-- -------------------------------------------------------------------------
-- RLS em todas as tabelas CRM
-- -------------------------------------------------------------------------
alter table public.crm_customers enable row level security;
alter table public.crm_vehicles enable row level security;
alter table public.crm_subscriptions enable row level security;
alter table public.crm_campaign_members enable row level security;
alter table public.crm_interactions enable row level security;
alter table public.crm_audit_logs enable row level security;
alter table public.crm_score_snapshots enable row level security;
alter table public.crm_duplicate_candidates enable row level security;

-- O service_role do Supabase tem BYPASSRLS; force RLS protege owners comuns
-- e mantém a regra explícita para acessos não-service_role.
alter table public.crm_customers force row level security;
alter table public.crm_vehicles force row level security;
alter table public.crm_subscriptions force row level security;
alter table public.crm_campaign_members force row level security;
alter table public.crm_interactions force row level security;
alter table public.crm_audit_logs force row level security;
alter table public.crm_score_snapshots force row level security;
alter table public.crm_duplicate_candidates force row level security;

-- -------------------------------------------------------------------------
-- Grants: anon sem acesso; authenticated só via policies abaixo
-- -------------------------------------------------------------------------
revoke all on table public.crm_customers from anon;
revoke all on table public.crm_vehicles from anon;
revoke all on table public.crm_subscriptions from anon;
revoke all on table public.crm_campaign_members from anon;
revoke all on table public.crm_interactions from anon;
revoke all on table public.crm_audit_logs from anon;
revoke all on table public.crm_score_snapshots from anon;
revoke all on table public.crm_duplicate_candidates from anon;

revoke all on table public.crm_customers from authenticated;
revoke all on table public.crm_vehicles from authenticated;
revoke all on table public.crm_subscriptions from authenticated;
revoke all on table public.crm_campaign_members from authenticated;
revoke all on table public.crm_interactions from authenticated;
revoke all on table public.crm_audit_logs from authenticated;
revoke all on table public.crm_score_snapshots from authenticated;
revoke all on table public.crm_duplicate_candidates from authenticated;

grant select, insert, update on table public.crm_customers to authenticated;
grant select, insert, update on table public.crm_vehicles to authenticated;
grant select, insert, update on table public.crm_subscriptions to authenticated;
grant select, insert, update on table public.crm_campaign_members to authenticated;
grant select, insert on table public.crm_interactions to authenticated;
grant select, insert on table public.crm_audit_logs to authenticated;
grant select, insert on table public.crm_score_snapshots to authenticated;
grant select, insert, update on table public.crm_duplicate_candidates to authenticated;

-- -------------------------------------------------------------------------
-- Policies: CRM operacional
-- -------------------------------------------------------------------------
drop policy if exists crm_customers_select_admin on public.crm_customers;
create policy crm_customers_select_admin on public.crm_customers
  for select to authenticated using (public.crm_can_read_crm());

drop policy if exists crm_customers_insert_admin on public.crm_customers;
create policy crm_customers_insert_admin on public.crm_customers
  for insert to authenticated with check (public.crm_can_write_crm());

drop policy if exists crm_customers_update_admin on public.crm_customers;
create policy crm_customers_update_admin on public.crm_customers
  for update to authenticated using (public.crm_can_write_crm()) with check (public.crm_can_write_crm());

drop policy if exists crm_vehicles_select_admin on public.crm_vehicles;
create policy crm_vehicles_select_admin on public.crm_vehicles
  for select to authenticated using (public.crm_can_read_crm());

drop policy if exists crm_vehicles_insert_admin on public.crm_vehicles;
create policy crm_vehicles_insert_admin on public.crm_vehicles
  for insert to authenticated with check (public.crm_can_write_crm());

drop policy if exists crm_vehicles_update_admin on public.crm_vehicles;
create policy crm_vehicles_update_admin on public.crm_vehicles
  for update to authenticated using (public.crm_can_write_crm()) with check (public.crm_can_write_crm());

drop policy if exists crm_subscriptions_select_admin on public.crm_subscriptions;
create policy crm_subscriptions_select_admin on public.crm_subscriptions
  for select to authenticated using (public.crm_can_read_crm());

drop policy if exists crm_subscriptions_insert_admin on public.crm_subscriptions;
create policy crm_subscriptions_insert_admin on public.crm_subscriptions
  for insert to authenticated with check (public.crm_can_write_crm());

drop policy if exists crm_subscriptions_update_admin on public.crm_subscriptions;
create policy crm_subscriptions_update_admin on public.crm_subscriptions
  for update to authenticated using (public.crm_can_write_crm()) with check (public.crm_can_write_crm());

drop policy if exists crm_campaign_members_select_admin on public.crm_campaign_members;
create policy crm_campaign_members_select_admin on public.crm_campaign_members
  for select to authenticated using (public.crm_can_read_crm());

drop policy if exists crm_campaign_members_insert_admin on public.crm_campaign_members;
create policy crm_campaign_members_insert_admin on public.crm_campaign_members
  for insert to authenticated with check (public.crm_can_write_crm());

drop policy if exists crm_campaign_members_update_admin on public.crm_campaign_members;
create policy crm_campaign_members_update_admin on public.crm_campaign_members
  for update to authenticated using (public.crm_can_write_crm()) with check (public.crm_can_write_crm());

drop policy if exists crm_interactions_select_admin on public.crm_interactions;
create policy crm_interactions_select_admin on public.crm_interactions
  for select to authenticated using (public.crm_can_read_crm());

drop policy if exists crm_interactions_insert_admin on public.crm_interactions;
create policy crm_interactions_insert_admin on public.crm_interactions
  for insert to authenticated with check (public.crm_can_write_crm());

drop policy if exists crm_score_snapshots_select_admin on public.crm_score_snapshots;
create policy crm_score_snapshots_select_admin on public.crm_score_snapshots
  for select to authenticated using (public.crm_can_read_crm());

drop policy if exists crm_score_snapshots_insert_admin on public.crm_score_snapshots;
create policy crm_score_snapshots_insert_admin on public.crm_score_snapshots
  for insert to authenticated with check (public.crm_can_write_crm());

drop policy if exists crm_duplicate_candidates_select_admin on public.crm_duplicate_candidates;
create policy crm_duplicate_candidates_select_admin on public.crm_duplicate_candidates
  for select to authenticated using (public.crm_can_read_crm());

drop policy if exists crm_duplicate_candidates_insert_admin on public.crm_duplicate_candidates;
create policy crm_duplicate_candidates_insert_admin on public.crm_duplicate_candidates
  for insert to authenticated with check (public.crm_can_write_crm());

drop policy if exists crm_duplicate_candidates_update_admin on public.crm_duplicate_candidates;
create policy crm_duplicate_candidates_update_admin on public.crm_duplicate_candidates
  for update to authenticated using (public.crm_can_write_crm()) with check (public.crm_can_write_crm());

-- -------------------------------------------------------------------------
-- Policies: audit log protegido
-- -------------------------------------------------------------------------
drop policy if exists crm_audit_logs_select_admin on public.crm_audit_logs;
create policy crm_audit_logs_select_admin on public.crm_audit_logs
  for select to authenticated using (public.crm_can_read_audit());

drop policy if exists crm_audit_logs_insert_admin on public.crm_audit_logs;
create policy crm_audit_logs_insert_admin on public.crm_audit_logs
  for insert to authenticated with check (public.crm_can_write_audit());
