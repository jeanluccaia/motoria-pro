-- Rollback Corporate Fleet RPCs
drop function if exists public.crm_corporate_request_cancel(uuid, text, text);
drop function if exists public.crm_corporate_request_accept_counter(uuid, uuid, text);
drop function if exists public.crm_corporate_request_counter_propose(uuid, timestamptz, text, text);
drop function if exists public.crm_corporate_request_confirm(uuid, timestamptz, text, text);
drop function if exists public.crm_corporate_request_create(uuid, uuid, text, timestamptz, timestamptz, text, text);
drop function if exists public.crm_fleet_vehicle_create(uuid, text, text, text, int, text, text, text, text, text);
drop function if exists public.crm_company_manager_create(uuid, text, text, text, uuid, text);
drop function if exists public.crm_company_create(text, text, text, text, text, text, text);
