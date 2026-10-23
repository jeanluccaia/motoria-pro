-- Reverte GRANTs do sprint comercial. Volta ao estado "revoked" das migrations
-- originais (agent_core_schema, corporate_fleet_schema).
revoke select, insert, update, delete on table public.agent_actions from service_role;
revoke select, insert, update, delete on table public.agent_campaigns from service_role;
revoke select, insert, update, delete on table public.crm_companies from service_role;
revoke select, insert, update, delete on table public.crm_company_managers from service_role;
revoke select, insert, update, delete on table public.crm_company_fleet_vehicles from service_role;
revoke select, insert, update, delete on table public.crm_corporate_service_requests from service_role;
