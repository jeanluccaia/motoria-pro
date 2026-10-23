-- Seed demonstrativo para o preview sandbox.
-- NÃO é migration — fica fora da schema_migrations tree.
-- Todos os registros têm marca 'SANDBOX_DEMO' em payload/notes/legacy_id.
\set ON_ERROR_STOP on

begin;

-- Limpeza idempotente de execuções anteriores.
delete from public.crm_corporate_service_requests
 where company_id in (select id from public.crm_companies where notes = 'SANDBOX_DEMO');
delete from public.crm_company_fleet_vehicles
 where company_id in (select id from public.crm_companies where notes = 'SANDBOX_DEMO');
delete from public.crm_company_managers
 where company_id in (select id from public.crm_companies where notes = 'SANDBOX_DEMO');
delete from public.crm_companies where notes = 'SANDBOX_DEMO';
delete from public.agent_actions where payload->>'origin' = 'SANDBOX_DEMO';
delete from public.crm_subscriptions where source_reference like 'SANDBOX_DEMO_%';
-- Vehicles e customers: ON DELETE CASCADE a partir de customer.
delete from public.crm_customers where legacy_id like 'demo-%';

-- ----- Clientes DGN demo (populam Painel Receita Recorrente) ----------------
insert into public.crm_customers (legacy_id, name, normalized_name, primary_phone, email, origin)
values
  ('demo-andre',   'André Demo',    'andre demo',    '11955551001', 'andre@sandbox-demo.local',   'SANDBOX_DEMO'),
  ('demo-beatriz', 'Beatriz Demo',  'beatriz demo',  '11955551002', 'beatriz@sandbox-demo.local', 'SANDBOX_DEMO'),
  ('demo-carla',   'Carla Demo',    'carla demo',    '11955551003', 'carla@sandbox-demo.local',   'SANDBOX_DEMO'),
  ('demo-daniel',  'Daniel Demo',   'daniel demo',   '11955551004', 'daniel@sandbox-demo.local',  'SANDBOX_DEMO'),
  ('demo-elena',   'Elena Demo',    'elena demo',    '11955551005', 'elena@sandbox-demo.local',   'SANDBOX_DEMO'),
  ('demo-fabio',   'Fábio Demo',    'fabio demo',    '11955551006', 'fabio@sandbox-demo.local',   'SANDBOX_DEMO'),
  ('demo-gisele',  'Gisele Demo',   'gisele demo',   '11955551007', 'gisele@sandbox-demo.local',  'SANDBOX_DEMO'),
  ('demo-hugo',    'Hugo Demo',     'hugo demo',     '11955551008', 'hugo@sandbox-demo.local',    'SANDBOX_DEMO');

-- Veículos
insert into public.crm_vehicles (customer_id, brand, model, plate, is_primary, source)
select c.id, 'Toyota', 'Corolla', 'DEMO001', true, 'SANDBOX_DEMO'
  from public.crm_customers c where c.legacy_id='demo-andre';
insert into public.crm_vehicles (customer_id, brand, model, plate, is_primary, source)
select c.id, 'Honda', 'Civic', 'DEMO002', true, 'SANDBOX_DEMO'
  from public.crm_customers c where c.legacy_id='demo-beatriz';
insert into public.crm_vehicles (customer_id, brand, model, plate, is_primary, source)
select c.id, 'Volkswagen', 'Nivus', 'DEMO003', true, 'SANDBOX_DEMO'
  from public.crm_customers c where c.legacy_id='demo-carla';
insert into public.crm_vehicles (customer_id, brand, model, plate, is_primary, source)
select c.id, 'Hyundai', 'HB20', 'DEMO004', true, 'SANDBOX_DEMO'
  from public.crm_customers c where c.legacy_id='demo-daniel';

-- Subscriptions ACTIVE para 4 (demo de assinaturas canônicas)
insert into public.crm_subscriptions
  (customer_id, is_active_subscriber, subscription_plan, subscription_status, subscription_source, source_reference)
select c.id, true, 'Smart', 'ativo', 'Manual', 'SANDBOX_DEMO_'||c.legacy_id
  from public.crm_customers c where c.legacy_id in ('demo-andre','demo-beatriz','demo-carla','demo-daniel');

-- ----- Agent actions (Inteligência) -----------------------------------------
insert into public.agent_actions
  (kind, status, target_customer_id, title, reason, recommendation, source_tool, payload, created_at)
select 'opportunity','pending_review', c.id,
       'Beatriz pode subir para Priority',
       'Padrão de uso acima do limite do plano Smart em 2 meses consecutivos.',
       'Oferecer upgrade para Priority com 20% off nos 3 primeiros meses. Mensagem WhatsApp personalizada.',
       'tool.sandbox_demo',
       jsonb_build_object('origin','SANDBOX_DEMO','priority','alta','suggested_plan','Priority'),
       now() - interval '18 hour'
  from public.crm_customers c where c.legacy_id='demo-beatriz';

insert into public.agent_actions
  (kind, status, target_customer_id, title, reason, recommendation, source_tool, payload, created_at)
select 'followup_task','pending_review', c.id,
       'Confirmar presença de Daniel no serviço de amanhã',
       'Agendamento às 10h e cliente ainda não confirmou.',
       'Enviar WhatsApp curto de confirmação até às 18h de hoje.',
       'tool.sandbox_demo',
       jsonb_build_object('origin','SANDBOX_DEMO','priority','normal'),
       now() - interval '6 hour'
  from public.crm_customers c where c.legacy_id='demo-daniel';

insert into public.agent_actions
  (kind, status, target_customer_id, title, reason, recommendation, source_tool, payload, created_at)
select 'alert','pending_review', c.id,
       'André sem agendamento há 45 dias',
       'Último serviço registrado foi há 45 dias — risco de churn silencioso.',
       'Resgate ativo via WhatsApp com oferta de higienização interna.',
       'tool.sandbox_demo',
       jsonb_build_object('origin','SANDBOX_DEMO','priority','alta'),
       now() - interval '2 hour'
  from public.crm_customers c where c.legacy_id='demo-andre';

insert into public.agent_actions
  (kind, status, title, reason, recommendation, source_tool, payload, created_at)
values
  ('campaign_draft','pending_review',
   'Campanha "Volta das férias" para 12 assinantes inativos',
   '12 clientes sem agendamento há 60+ dias — oportunidade de resgate em bloco.',
   'Lista com 12 clientes selecionados. Mensagem WhatsApp curta + reserva de slot preferencial no sábado. Zero envio automático — só aprovação humana libera.',
   'tool.sandbox_demo',
   jsonb_build_object('origin','SANDBOX_DEMO','priority','normal','targetCount',12),
   now() - interval '12 hour');

-- ----- Empresas B2B (Painel Frotas) -----------------------------------------
with a as (select (public.crm_company_create('Alpha Transportes Demo','Alpha Transportes',null,'operacao@alpha-demo.local','11 94444-0001','SANDBOX_DEMO','sandbox-admin')).company_id as id)
select id as alpha_id from a \gset
with b as (select (public.crm_company_create('Beta Logística Demo','Beta Logística',null,'operacao@beta-demo.local','11 94444-0002','SANDBOX_DEMO','sandbox-admin')).company_id as id)
select id as beta_id from b \gset

select (public.crm_company_manager_create(:'alpha_id'::uuid,'Marina Alves (Alpha)','marina@alpha-demo.local','11 93333-0001',null,'sandbox-admin')).manager_id as marina_id \gset
select (public.crm_company_manager_create(:'beta_id'::uuid, 'Rogério Costa (Beta)','rogerio@beta-demo.local','11 93333-0002',null,'sandbox-admin')).manager_id as rogerio_id \gset

select (public.crm_fleet_vehicle_create(:'alpha_id'::uuid,'ALF1A01','Fiat','Toro',2023,'Vermelho','Carlos (motorista)','Picape Alpha 1',null,'sandbox-admin')).vehicle_id as alpha_v1 \gset
select (public.crm_fleet_vehicle_create(:'alpha_id'::uuid,'ALF1A02','Renault','Oroch',2022,'Prata','Daniela (motorista)','Picape Alpha 2',null,'sandbox-admin')).vehicle_id as alpha_v2 \gset
select (public.crm_fleet_vehicle_create(:'beta_id'::uuid,'BTA1B01','Mercedes','Sprinter',2023,'Branco','Eduardo (motorista)','Van Beta 1',null,'sandbox-admin')).vehicle_id as beta_v1 \gset

-- Alpha request PENDING
select (public.crm_corporate_request_create(
  :'alpha_v1'::uuid, :'marina_id'::uuid,
  'detalhamento interno + higienização',
  now() + interval '2 day', now() + interval '3 day',
  'Van Alpha retornou do interior, cliente VIP agenda semana que vem',
  'sandbox-manager-portal'
)).request_id as alpha_req1 \gset

-- Alpha request CONFIRMED
select (public.crm_corporate_request_create(
  :'alpha_v2'::uuid, :'marina_id'::uuid,
  'lavagem premium',
  now() + interval '5 day', null,
  'Carro para visita comercial',
  'sandbox-manager-portal'
)).request_id as alpha_req2 \gset
select public.crm_corporate_request_confirm(:'alpha_req2'::uuid, now() + interval '5 day', 'Confirmado para 09h — foco em parte interna.', 'sandbox-admin');

-- Beta request COUNTER_PROPOSED
select (public.crm_corporate_request_create(
  :'beta_v1'::uuid, :'rogerio_id'::uuid,
  'proteção cerâmica',
  now() + interval '1 day', now() + interval '2 day',
  'Van saindo em rota longa segunda — proteção antes',
  'sandbox-manager-portal'
)).request_id as beta_req1 \gset
select public.crm_corporate_request_counter_propose(:'beta_req1'::uuid, now() + interval '4 day', 'Agenda cheia essa semana — proposta para quinta às 14h.', 'sandbox-admin');

-- Export IDs em NOTICES para o próximo passo (jornada)
\echo '--- SANDBOX_DEMO SEEDED ---'
\echo 'alpha_id =' :alpha_id
\echo 'beta_id  =' :beta_id
\echo 'marina_id=' :marina_id
\echo 'rogerio_id=' :rogerio_id
\echo 'alpha_req1=' :alpha_req1 '(pending)'
\echo 'beta_req1 =' :beta_req1 '(counter_proposed)'

select 'customers_demo'          as metric, count(*) from public.crm_customers where legacy_id like 'demo-%'
union all select 'subscriptions_active', count(*) from public.crm_subscriptions s join public.crm_customers c on c.id=s.customer_id where c.legacy_id like 'demo-%' and s.is_active_subscriber
union all select 'companies',            count(*) from public.crm_companies where notes='SANDBOX_DEMO'
union all select 'managers',             count(*) from public.crm_company_managers m join public.crm_companies co on co.id=m.company_id where co.notes='SANDBOX_DEMO'
union all select 'fleet_vehicles',       count(*) from public.crm_company_fleet_vehicles v join public.crm_companies co on co.id=v.company_id where co.notes='SANDBOX_DEMO'
union all select 'requests_total',       count(*) from public.crm_corporate_service_requests r join public.crm_companies co on co.id=r.company_id where co.notes='SANDBOX_DEMO'
union all select 'requests_pending',     count(*) from public.crm_corporate_service_requests r join public.crm_companies co on co.id=r.company_id where co.notes='SANDBOX_DEMO' and r.status='pending'
union all select 'requests_counter_proposed', count(*) from public.crm_corporate_service_requests r join public.crm_companies co on co.id=r.company_id where co.notes='SANDBOX_DEMO' and r.status='counter_proposed'
union all select 'requests_confirmed',   count(*) from public.crm_corporate_service_requests r join public.crm_companies co on co.id=r.company_id where co.notes='SANDBOX_DEMO' and r.status='confirmed'
union all select 'agent_actions_pending',count(*) from public.agent_actions where status='pending_review' and payload->>'origin'='SANDBOX_DEMO';

commit;
