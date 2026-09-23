-- Rollback do 20260924000004_diagnostics_rpcs.sql

drop function if exists public.crm_publish_diagnostic(uuid, integer, text);
drop function if exists public.crm_detach_diagnostic_photo(uuid, integer, uuid, text);
drop function if exists public.crm_attach_diagnostic_photo(uuid, integer, public.crm_diagnostic_photo_kind, text, text, text, integer, text, integer, boolean, text);
drop function if exists public.crm_patch_diagnostic_draft(uuid, integer, jsonb, text);
drop function if exists public.crm_create_diagnostic_draft(uuid, uuid, text, text, text);
