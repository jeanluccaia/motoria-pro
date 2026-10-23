-- ---------------------------------------------------------------------------
-- SPRINT COMERCIAL — grants explícitos de service_role nas 6 tabelas do sprint.
--
-- Motivo: as migrations 20261022*_agent_core_schema.sql e
-- 20261022*_corporate_fleet_schema.sql revogam permissões de public/anon/
-- authenticated mas NÃO concedem explicitamente a service_role. Isso faz os
-- READs server-side via Supabase JS (admin-client + getSupabaseAdminClient)
-- devolverem "permission denied for table ...". Essas tabelas são lidas por:
--   * lib/growth/db/agent-actions-write.ts (listAgentActions, revisão, Inbox)
--   * lib/growth/db/pulse-summary.ts (via listAgentActions)
--   * lib/growth/db/corporate-fleet-write.ts (listServiceRequests, listCompanies,
--     listManagersByCompany, listFleetVehiclesByCompany, findManagerByAuthUserId)
--   * app/admin/growth/empresas/page.tsx (admin de Frotas)
--   * app/admin/growth/page.tsx (bloco Gestão de Frotas)
--
-- RLS continua forced; service_role bypassa — padrão alinhado com crm_customers
-- e demais tabelas CRM já em prod.
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on table public.agent_actions to service_role;
grant select, insert, update, delete on table public.agent_campaigns to service_role;

grant select, insert, update, delete on table public.crm_companies to service_role;
grant select, insert, update, delete on table public.crm_company_managers to service_role;
grant select, insert, update, delete on table public.crm_company_fleet_vehicles to service_role;
grant select, insert, update, delete on table public.crm_corporate_service_requests to service_role;
