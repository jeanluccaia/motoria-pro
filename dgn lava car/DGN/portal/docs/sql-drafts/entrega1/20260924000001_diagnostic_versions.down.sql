-- Rollback do 20260924000001_diagnostic_versions.sql

drop trigger if exists trg_diag_versions_audit          on public.crm_diagnostic_versions;
drop trigger if exists trg_diag_versions_forbid_delete  on public.crm_diagnostic_versions;
drop trigger if exists trg_diag_versions_forbid_update  on public.crm_diagnostic_versions;

drop function if exists public.crm_diagnostic_versions_forbid_mutation();

drop table if exists public.crm_diagnostic_versions;
