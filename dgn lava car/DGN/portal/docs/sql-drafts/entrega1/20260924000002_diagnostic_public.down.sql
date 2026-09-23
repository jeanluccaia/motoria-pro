-- Rollback do 20260924000002_diagnostic_public.sql

drop trigger if exists trg_diag_public_events_forbid_delete on public.crm_diagnostic_public_events;
drop trigger if exists trg_diag_public_events_forbid_update on public.crm_diagnostic_public_events;
drop function if exists public.crm_diagnostic_public_events_forbid_mutation();

drop trigger if exists trg_diag_public_links_audit on public.crm_diagnostic_public_links;

drop table if exists public.crm_diagnostic_public_events;
drop table if exists public.crm_diagnostic_public_links;

drop type if exists public.crm_diagnostic_public_event_kind;
