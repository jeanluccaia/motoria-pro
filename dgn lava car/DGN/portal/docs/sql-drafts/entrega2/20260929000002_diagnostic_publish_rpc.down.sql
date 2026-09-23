-- Rollback do 20260929000002_diagnostic_publish_rpc.sql

drop function if exists public.crm_publish_diagnostic(uuid, integer, text);
