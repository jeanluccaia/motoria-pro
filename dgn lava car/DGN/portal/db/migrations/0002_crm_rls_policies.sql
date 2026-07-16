-- =========================================================================
-- DGN CRM — RLS defensiva para acesso server-only
-- Migration: 0002_crm_rls_policies
-- Requires: 0001_crm_schema
--
-- Arquitetura vigente:
-- - O portal NAO usa Supabase Auth.
-- - Browser nao acessa tabelas CRM diretamente.
-- - Route handlers/server actions validam a sessao admin propria do Next.
-- - Somente depois da validacao, codigo server-side usa service_role.
-- - service_role tem BYPASSRLS; logo a autorizacao real desta fase acontece
--   antes da consulta ao banco, no servidor.
-- - anon/authenticated nao recebem grants uteis nas tabelas CRM.
-- - Claims como dgn_growth_role ficam para uma arquitetura futura e nao sao
--   usadas por esta migration.
-- =========================================================================

-- -------------------------------------------------------------------------
-- Remover policies de versoes anteriores desta migration, caso existam.
-- Sem Supabase Auth integrado, essas policies seriam inalcançaveis ou
-- ambíguas. A fase atual e server-only.
-- -------------------------------------------------------------------------
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

drop function if exists public.crm_can_write_audit();
drop function if exists public.crm_can_read_audit();
drop function if exists public.crm_can_write_crm();
drop function if exists public.crm_can_read_crm();
drop function if exists public.crm_is_growth_admin();
drop function if exists public.crm_growth_role();

-- -------------------------------------------------------------------------
-- Hardening do audit log: append-only e timestamp controlado pelo banco.
-- O actor deve ser enviado pelo fluxo server-side validado. Se vier vazio,
-- a trigger marca como "server" em vez de confiar em input do browser.
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
      new.actor := 'server';
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

alter table public.crm_customers force row level security;
alter table public.crm_vehicles force row level security;
alter table public.crm_subscriptions force row level security;
alter table public.crm_campaign_members force row level security;
alter table public.crm_interactions force row level security;
alter table public.crm_audit_logs force row level security;
alter table public.crm_score_snapshots force row level security;
alter table public.crm_duplicate_candidates force row level security;

-- -------------------------------------------------------------------------
-- Grants: Data API publica sem acesso direto nesta fase.
-- service_role continua operando server-side por BYPASSRLS.
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
