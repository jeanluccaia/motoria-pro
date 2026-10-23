\set ON_ERROR_STOP on

begin;

-- Limpa TODO resíduo de sandbox anteriores.
delete from public.crm_corporate_service_requests
 where company_id in (select id from public.crm_companies where notes = 'sandbox-run' or legal_name like 'Sandbox LTDA%');
delete from public.crm_company_fleet_vehicles
 where company_id in (select id from public.crm_companies where notes = 'sandbox-run' or legal_name like 'Sandbox LTDA%');
delete from public.crm_company_managers
 where company_id in (select id from public.crm_companies where notes = 'sandbox-run' or legal_name like 'Sandbox LTDA%');
delete from public.crm_companies where notes = 'sandbox-run' or legal_name like 'Sandbox LTDA%';

-- SETUP com notes='sandbox-run' pra marcar.
select 'SETUP company A' as step, * from public.crm_company_create(
  'Sandbox LTDA A','Sandbox A',null,'alfa@sandbox.local','11 99999-0001','sandbox-run','sandbox-admin'
) \gset
select 'SETUP company B' as step, * from public.crm_company_create(
  'Sandbox LTDA B','Sandbox B',null,'bravo@sandbox.local','11 99999-0002','sandbox-run','sandbox-admin'
) \gset

-- Captura IDs em psql vars.
select id as company_a_id from public.crm_companies where legal_name='Sandbox LTDA A' and notes='sandbox-run' \gset
select id as company_b_id from public.crm_companies where legal_name='Sandbox LTDA B' and notes='sandbox-run' \gset
\echo COMPANY_A_ID = :company_a_id
\echo COMPANY_B_ID = :company_b_id

-- Managers
select 'SETUP manager A' as step, * from public.crm_company_manager_create(
  :'company_a_id'::uuid,'Alice (A)','alice@sandbox.local','11 90000-0001',null,'sandbox-admin'
);
select 'SETUP manager B' as step, * from public.crm_company_manager_create(
  :'company_b_id'::uuid,'Bob (B)','bob@sandbox.local','11 90000-0002',null,'sandbox-admin'
);
select id as manager_a_id from public.crm_company_managers where email='alice@sandbox.local' \gset
select id as manager_b_id from public.crm_company_managers where email='bob@sandbox.local' \gset

-- Veículos
select 'SETUP vehicle A' as step, * from public.crm_fleet_vehicle_create(
  :'company_a_id'::uuid,'AAA1A01','Toyota','Corolla',2022,'Preto','Motorista A','Carro Alice',null,'sandbox-admin'
);
select 'SETUP vehicle B' as step, * from public.crm_fleet_vehicle_create(
  :'company_b_id'::uuid,'BBB1B01','Volkswagen','Nivus',2024,'Branco','Motorista B','Carro Bob',null,'sandbox-admin'
);
select id as vehicle_a_id from public.crm_company_fleet_vehicles where plate='AAA1A01' \gset
select id as vehicle_b_id from public.crm_company_fleet_vehicles where plate='BBB1B01' \gset

-- HAPPY: Alice solicita atendimento próprio
select 'HAPPY A→A' as case, * from public.crm_corporate_request_create(
  :'vehicle_a_id'::uuid, :'manager_a_id'::uuid,
  'detalhamento interno', now() + interval '2 day', now() + interval '3 day',
  'Alice pedindo veículo próprio', 'sandbox-manager-portal'
);

-- ATTACK: Bob → A
select 'ATTACK B→A' as case, * from public.crm_corporate_request_create(
  :'vehicle_a_id'::uuid, :'manager_b_id'::uuid,
  'tentativa cross-tenant', now() + interval '2 day', null,
  'Bob tentando mexer na frota da Empresa A', 'sandbox-manager-portal'
);

-- ATTACK: Alice → B
select 'ATTACK A→B' as case, * from public.crm_corporate_request_create(
  :'vehicle_b_id'::uuid, :'manager_a_id'::uuid,
  'tentativa cross-tenant 2', now() + interval '2 day', null,
  'Alice tentando mexer na frota da Empresa B', 'sandbox-manager-portal'
);

-- Email duplicado na MESMA empresa
select 'DUP email A' as case, * from public.crm_company_manager_create(
  :'company_a_id'::uuid,'Alice2','alice@sandbox.local','11 90000-9999',null,'sandbox-admin'
);

-- Contagens isoladas
select 'TENANT COUNT A' as case, count(*) from public.crm_corporate_service_requests
 where company_id = :'company_a_id'::uuid;
select 'TENANT COUNT B' as case, count(*) from public.crm_corporate_service_requests
 where company_id = :'company_b_id'::uuid;

-- GRANTS
select routine_name, string_agg(grantee, ',' order by grantee) as grantees
  from information_schema.routine_privileges
 where routine_schema='public'
   and routine_name in (
     'crm_company_create','crm_company_manager_create','crm_fleet_vehicle_create',
     'crm_corporate_request_create','crm_corporate_request_confirm',
     'crm_corporate_request_counter_propose','crm_corporate_request_accept_counter',
     'crm_corporate_request_cancel'
   )
 group by routine_name
 order by routine_name;

-- RLS forçada: olha via pg_class (forcerowsecurity não está em pg_tables).
select c.relname, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public'
   and c.relname in ('crm_companies','crm_company_managers','crm_company_fleet_vehicles','crm_corporate_service_requests','agent_actions','agent_campaigns')
 order by c.relname;

commit;
