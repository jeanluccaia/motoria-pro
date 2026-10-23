-- Rollback Corporate Fleet schema (Fase 2 Frotas B2B)
drop trigger if exists crm_corporate_service_requests_set_updated_at on public.crm_corporate_service_requests;
drop trigger if exists crm_company_fleet_vehicles_set_updated_at on public.crm_company_fleet_vehicles;
drop trigger if exists crm_company_managers_set_updated_at on public.crm_company_managers;
drop trigger if exists crm_companies_set_updated_at on public.crm_companies;
drop function if exists public.corporate_fleet_set_updated_at();

drop table if exists public.crm_corporate_service_requests;
drop table if exists public.crm_company_fleet_vehicles;
drop table if exists public.crm_company_managers;
drop table if exists public.crm_companies;

drop type if exists public.crm_corporate_request_status;
