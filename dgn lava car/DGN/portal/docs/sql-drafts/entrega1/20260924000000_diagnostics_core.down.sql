-- Rollback do 20260924000000_diagnostics_core.sql
-- Não aplicar sem confirmação de zero rows em prod.

drop trigger if exists trg_diagnostic_photos_audit on public.crm_diagnostic_photos;
drop trigger if exists trg_diagnostics_audit       on public.crm_diagnostics;
drop trigger if exists trg_diagnostics_touch_updated_at on public.crm_diagnostics;

drop function if exists public.crm_diagnostics_audit();
drop function if exists public.crm_diagnostics_touch_updated_at();

drop table if exists public.crm_diagnostic_photos;
drop table if exists public.crm_diagnostics;

drop type if exists public.crm_diagnostic_photo_kind;
drop type if exists public.crm_diagnostic_recommendation_priority;
drop type if exists public.crm_diagnostic_area_condition;
drop type if exists public.crm_diagnostic_status;
