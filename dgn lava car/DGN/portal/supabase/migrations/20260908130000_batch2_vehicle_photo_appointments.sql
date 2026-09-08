-- DGN Portal Beta — Batch 2
-- Estende o Portal com:
--   1. Foto do veículo (crm_vehicles.photo_url + photo_storage_path + timestamp)
--      + bucket privado 'vehicle-photos' no Supabase Storage (signed URL).
--   2. Agenda de atendimentos (crm_appointments) — modelo canônico com
--      data/hora, serviço, status, origem e vínculo com contrato/veículo.
--      MVP: create + list + cancel. Reagendamento vira delete+create.
--   3. RPC portal_get_current_subscriber() estendida com photo_url e
--      upcoming_appointments (top-level array, ordenado por scheduled_at asc).
--
-- Forward-only, aditivo, sem impacto na base viva (13 subs ACTIVE / R$1.730 MRR).
-- Enums novos coabitam com os existentes. Bucket privado — nenhum objeto vaza
-- por default; Portal e Admin usam signed URL via server-side.

-- ---------------------------------------------------------------------------
-- 1) Enums de agendamento
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.crm_appointment_status as enum (
    'scheduled',   -- Agendado (default)
    'confirmed',   -- Confirmado com o cliente
    'done',        -- Executado
    'cancelled',   -- Cancelado (por cliente ou operação)
    'no_show'      -- Cliente não compareceu
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_appointment_source as enum (
    'MANUAL_ADMIN', -- Criado pela operação (padrão do MVP)
    'PORTAL',       -- Auto-atendimento pelo próprio cliente (futuro)
    'AUTO'          -- Gerado por regra automática (futuro)
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2) Foto do veículo em crm_vehicles
-- ---------------------------------------------------------------------------
--
-- photo_storage_path: caminho canônico no bucket 'vehicle-photos'
-- (ex.: '<customer_id>/<vehicle_id>/<uuid>.jpg'). É a fonte da verdade.
-- photo_url: signed URL cacheada (opcional; refresh no server). Não é
-- link público — expira. Portal/Admin re-assinam quando servem.

alter table public.crm_vehicles
  add column if not exists photo_storage_path text,
  add column if not exists photo_url text,
  add column if not exists photo_updated_at timestamptz;

comment on column public.crm_vehicles.photo_storage_path is
  'Caminho no bucket privado vehicle-photos. Fonte da verdade da foto. NUNCA público direto.';
comment on column public.crm_vehicles.photo_url is
  'Signed URL cacheada (curta duração). Portal/Admin re-assinam via server. Pode estar expirada.';

-- ---------------------------------------------------------------------------
-- 3) Tabela crm_appointments
-- ---------------------------------------------------------------------------

create table if not exists public.crm_appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.crm_customers (id) on delete cascade,
  subscription_id uuid references public.crm_subscriptions (id) on delete set null,
  vehicle_id uuid references public.crm_vehicles (id) on delete set null,
  scheduled_at timestamptz not null,
  service_type text,
  status public.crm_appointment_status not null default 'scheduled',
  source public.crm_appointment_source not null default 'MANUAL_ADMIN',
  notes text,
  created_by text,
  cancelled_at timestamptz,
  cancelled_by text,
  cancelled_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.crm_appointments is
  'Agenda de atendimentos DGN. MVP: create + list + cancel via Admin. Portal apenas lê próximos.';
comment on column public.crm_appointments.scheduled_at is
  'Data + hora do atendimento. timestamptz — armazenado em UTC, exibido em America/Sao_Paulo.';
comment on column public.crm_appointments.subscription_id is
  'Vínculo opcional com contrato. Null = agendamento avulso (fora de contrato ativo).';
comment on column public.crm_appointments.vehicle_id is
  'Vínculo opcional com veículo. Null = customer só tem 1 veículo ou serviço não específico.';
comment on column public.crm_appointments.source is
  'Origem do agendamento. MANUAL_ADMIN é o único do MVP; PORTAL/AUTO reservados p/ futuro.';

-- Índice principal: buscar próximos por cliente.
create index if not exists idx_crm_appointments_customer_scheduled
  on public.crm_appointments (customer_id, scheduled_at)
  where status in ('scheduled', 'confirmed');

-- Índice secundário: agenda geral (Admin lista futuros).
create index if not exists idx_crm_appointments_scheduled_at
  on public.crm_appointments (scheduled_at)
  where status in ('scheduled', 'confirmed');

-- Índice por subscription (Profile 360 lista por contrato).
create index if not exists idx_crm_appointments_subscription_id
  on public.crm_appointments (subscription_id)
  where subscription_id is not null;

-- Trigger de updated_at (usa função canônica existente).
drop trigger if exists trg_crm_appointments_touch on public.crm_appointments;
create trigger trg_crm_appointments_touch
  before update on public.crm_appointments
  for each row execute function public.crm_touch_updated_at();

-- RLS: mesmo padrão do resto do CRM (service_role bypassa, anon/authenticated bloqueados).
alter table public.crm_appointments enable row level security;
alter table public.crm_appointments force row level security;
revoke all on public.crm_appointments from anon, authenticated;
-- service_role bypassa RLS por BYPASSRLS; nenhum policy é necessário aqui.
-- Portal lê via RPC security definer (portal_get_current_subscriber); Admin lê via service_role.

-- ---------------------------------------------------------------------------
-- 4) Bucket Storage vehicle-photos (privado)
-- ---------------------------------------------------------------------------
--
-- Bucket privado: qualquer leitura requer signed URL. Upload é feito pelo
-- Admin via server action com service_role (bypassa policies). Nenhum policy
-- de anon/authenticated é criado — Portal só recebe signed URL pronta.
--
-- IMPORTANTE: se o bucket já existir (branch/reset), o insert com on conflict
-- preserva a config atual sem sobrescrever.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-photos',
  'vehicle-photos',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 5) RPC portal_get_current_subscriber() — estende com photo_url + appointments
-- ---------------------------------------------------------------------------
--
-- Muda vs. versão P0:
--   - vehicles[].photo_url passa a existir (pode ser null)
--   - novo campo top-level 'upcoming_appointments' (array): próximos com
--     status IN ('scheduled','confirmed'), scheduled_at >= now(), asc.
--
-- Não muda: shape do restante do payload, comportamento de beta_enabled,
-- filtro por auth.uid(), campos de subscription. Loader existente continua
-- funcionando; novo campo é aditivo.

create or replace function public.portal_get_current_subscriber()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_customer public.crm_customers%rowtype;
  v_subs jsonb;
  v_vehicles jsonb;
  v_appointments jsonb;
  v_founder public.crm_campaign_members%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return jsonb_build_object('linked', false, 'reason', 'sem sessão');
  end if;

  select c.* into v_customer
    from public.crm_customer_auth a
    join public.crm_customers c on c.id = a.customer_id
   where a.auth_user_id = v_uid;

  if not found then
    return jsonb_build_object('linked', false, 'reason', 'sem vínculo cadastrado');
  end if;

  if not v_customer.portal_beta_enabled then
    return jsonb_build_object(
      'linked', true,
      'beta_enabled', false,
      'reason', 'Portal em beta fechada — acesso ainda não liberado para este cliente.'
    );
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'plan', s.subscription_plan,
        'cycle', s.subscription_cycle,
        'status', s.subscription_status,
        'billing_status', s.billing_status,
        'billing_due_at', s.billing_due_at,
        'billing_due_source', s.billing_due_source,
        'payment_method_label', s.payment_method_label,
        'payment_method', s.payment_method,
        'payment_status', s.payment_status,
        'payment_evidence_source', s.payment_evidence_source,
        'payment_confidence', s.payment_confidence,
        'payment_verification_status', s.payment_verification_status,
        'last_payment_confirmed_at', s.last_payment_confirmed_at,
        'next_due_date', s.next_due_date,
        'last_verified_at', s.last_verified_at,
        'migration_status', s.migration_status,
        'financial_review_required', s.financial_review_required,
        'financial_review_reason', s.financial_review_reason,
        'cycle_started_at', s.cycle_started_at,
        'cycle_ends_at', s.cycle_ends_at,
        'is_active_subscriber', s.is_active_subscriber,
        'next_scheduled_service_at', s.next_scheduled_service_at,
        'vehicle_id', s.vehicle_id
      )
      order by s.created_at asc
    ),
    '[]'::jsonb
  ) into v_subs
    from public.crm_subscriptions s
   where s.customer_id = v_customer.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', v.id,
        'plate', v.plate,
        'masked_plate', v.masked_plate,
        'brand', v.brand,
        'model', v.model,
        'is_primary', v.is_primary,
        'photo_url', v.photo_url
      )
      order by v.is_primary desc nulls last, v.created_at asc
    ),
    '[]'::jsonb
  ) into v_vehicles
    from public.crm_vehicles v
   where v.customer_id = v_customer.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'scheduled_at', a.scheduled_at,
        'service_type', a.service_type,
        'status', a.status,
        'vehicle_id', a.vehicle_id,
        'subscription_id', a.subscription_id,
        'notes', a.notes
      )
      order by a.scheduled_at asc
    ),
    '[]'::jsonb
  ) into v_appointments
    from public.crm_appointments a
   where a.customer_id = v_customer.id
     and a.status in ('scheduled', 'confirmed')
     and a.scheduled_at >= now();

  select * into v_founder
    from public.crm_campaign_members
   where customer_id = v_customer.id
     and campaign_id = 'founders-2026';

  return jsonb_build_object(
    'linked', true,
    'beta_enabled', true,
    'customer', jsonb_build_object(
      'id', v_customer.id,
      'name', v_customer.name,
      'first_name', split_part(v_customer.name, ' ', 1),
      'masked_phone', case
        when v_customer.normalized_phone is null then null
        else 'DDD ' || substr(v_customer.normalized_phone, 3, 2) || ' ****-'
             || right(v_customer.normalized_phone, 2)
      end,
      'communication_consent', v_customer.communication_consent
    ),
    'subscriptions', v_subs,
    'vehicles', v_vehicles,
    'upcoming_appointments', v_appointments,
    'founder', case when v_founder.id is null then null else jsonb_build_object(
      'status', v_founder.founder_status,
      'number', v_founder.founder_number
    ) end
  );
end;
$$;

revoke all on function public.portal_get_current_subscriber() from public, anon;
grant execute on function public.portal_get_current_subscriber() to authenticated, service_role;

comment on function public.portal_get_current_subscriber() is
  'Batch 2: retorna subscriptions + vehicles (com photo_url) + upcoming_appointments. Respeita portal_beta_enabled. Nunca aceita id vindo do browser.';
