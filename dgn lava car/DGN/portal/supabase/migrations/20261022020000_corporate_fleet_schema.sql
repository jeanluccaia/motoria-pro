-- ---------------------------------------------------------------------------
-- CORPORATE FLEET — Fase 2 Frotas B2B
--
-- Camada B2B mínima para gestão de frota corporativa com acesso do gestor:
--   * crm_companies            — empresas contratantes
--   * crm_company_managers     — pessoas da empresa com acesso ao portal
--                                (mapeia auth.users.id → company)
--   * crm_company_fleet_vehicles — veículos da frota (dados do veículo + motorista)
--   * crm_corporate_service_requests — solicitação de serviço criada pelo gestor;
--                                vira confirmed quando a unidade aprova.
--
-- Decisões:
--   * RLS FORCE + REVOKE anon/authenticated — acesso só via service_role ou RPC
--   * p_actor_* obrigatório nas RPCs (sem actor derivado do LLM)
--   * Audit em crm_audit_logs (entity_type: 'crm_company' / 'crm_company_manager' /
--     'crm_corporate_fleet_vehicle' / 'crm_corporate_service_request')
--   * Zero acoplamento com appointments/crm_customers — Frotas é B2B separado.
--     Se futuramente convergir (motorista = cliente DGN), ligamos via vehicle_id
--     nullable sem quebrar o schema.
--   * Zero coluna de billing/fatura/plano — fica fora do escopo F2 do sprint.
-- ---------------------------------------------------------------------------

create type public.crm_corporate_request_status as enum (
  'pending',          -- gestor criou, unidade ainda não respondeu
  'confirmed',        -- unidade confirmou data proposta (ou gestor aceitou contraproposta)
  'counter_proposed', -- unidade propôs outra data; aguarda gestor
  'cancelled'         -- cancelado por qualquer lado
);

-- crm_companies -----------------------------------------------------------

create table public.crm_companies (
  id            uuid primary key default gen_random_uuid(),
  legal_name    text not null,
  display_name  text not null,
  cnpj          text null,
  contact_email text null,
  contact_phone text null,
  is_active     boolean not null default true,
  notes         text null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.crm_companies enable row level security;
alter table public.crm_companies force row level security;
revoke all on table public.crm_companies from public;
revoke all on table public.crm_companies from anon;
revoke all on table public.crm_companies from authenticated;

create index crm_companies_by_display_name on public.crm_companies (lower(display_name));
create unique index crm_companies_cnpj_unique on public.crm_companies (cnpj) where cnpj is not null;

-- crm_company_managers ----------------------------------------------------

create table public.crm_company_managers (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.crm_companies(id),
  auth_user_id  uuid null,
  display_name  text not null,
  email         text not null,
  phone         text null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.crm_company_managers enable row level security;
alter table public.crm_company_managers force row level security;
revoke all on table public.crm_company_managers from public;
revoke all on table public.crm_company_managers from anon;
revoke all on table public.crm_company_managers from authenticated;

create index crm_company_managers_by_company on public.crm_company_managers (company_id);
create index crm_company_managers_by_auth_user on public.crm_company_managers (auth_user_id) where auth_user_id is not null;
create unique index crm_company_managers_email_per_company
  on public.crm_company_managers (company_id, lower(email));

-- crm_company_fleet_vehicles ----------------------------------------------

create table public.crm_company_fleet_vehicles (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.crm_companies(id),
  plate         text not null,
  make          text null,
  model         text null,
  year          int null,
  color         text null,
  driver_name   text null,
  nickname      text null,
  notes         text null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.crm_company_fleet_vehicles enable row level security;
alter table public.crm_company_fleet_vehicles force row level security;
revoke all on table public.crm_company_fleet_vehicles from public;
revoke all on table public.crm_company_fleet_vehicles from anon;
revoke all on table public.crm_company_fleet_vehicles from authenticated;

create index crm_company_fleet_vehicles_by_company on public.crm_company_fleet_vehicles (company_id);
create unique index crm_company_fleet_vehicles_plate_per_company
  on public.crm_company_fleet_vehicles (company_id, upper(plate));

-- crm_corporate_service_requests ------------------------------------------

create table public.crm_corporate_service_requests (
  id                     uuid primary key default gen_random_uuid(),
  company_id             uuid not null references public.crm_companies(id),
  fleet_vehicle_id       uuid not null references public.crm_company_fleet_vehicles(id),
  requested_by_manager_id uuid not null references public.crm_company_managers(id),

  status                 public.crm_corporate_request_status not null default 'pending',

  service_type           text not null,
  preferred_date_1       timestamptz not null,
  preferred_date_2       timestamptz null,
  manager_notes          text null,

  -- Resposta da unidade:
  decided_by_actor       text null,
  decided_at             timestamptz null,
  scheduled_at           timestamptz null,
  admin_notes            text null,
  cancel_reason          text null,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.crm_corporate_service_requests enable row level security;
alter table public.crm_corporate_service_requests force row level security;
revoke all on table public.crm_corporate_service_requests from public;
revoke all on table public.crm_corporate_service_requests from anon;
revoke all on table public.crm_corporate_service_requests from authenticated;

create index crm_corporate_requests_by_company_status
  on public.crm_corporate_service_requests (company_id, status, created_at desc);

create index crm_corporate_requests_by_status_created
  on public.crm_corporate_service_requests (status, created_at desc);

create index crm_corporate_requests_by_fleet
  on public.crm_corporate_service_requests (fleet_vehicle_id);

-- updated_at trigger ------------------------------------------------------

create or replace function public.corporate_fleet_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $trg$
begin
  new.updated_at := now();
  return new;
end;
$trg$;

create trigger crm_companies_set_updated_at
  before update on public.crm_companies
  for each row execute function public.corporate_fleet_set_updated_at();

create trigger crm_company_managers_set_updated_at
  before update on public.crm_company_managers
  for each row execute function public.corporate_fleet_set_updated_at();

create trigger crm_company_fleet_vehicles_set_updated_at
  before update on public.crm_company_fleet_vehicles
  for each row execute function public.corporate_fleet_set_updated_at();

create trigger crm_corporate_service_requests_set_updated_at
  before update on public.crm_corporate_service_requests
  for each row execute function public.corporate_fleet_set_updated_at();
