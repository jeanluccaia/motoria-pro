-- DGN Portal do Assinante — MVP.
-- Adiciona campos financeiros/de ciclo em crm_subscriptions, cria a tabela
-- de vínculo com Supabase Auth (crm_customer_auth) e expõe uma RPC única
-- que autoriza pelo auth.uid() para o Portal.
--
-- Sem impacto no admin do DGN Growth: service_role continua BYPASSRLS.
-- Founders / Curadoria / tracking permanecem intactos.

-- ---------------------------------------------------------------------------
-- 1) Estados financeiros
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.crm_billing_status as enum (
    'active',
    'pending_verification',
    'renewal_pending',
    'paid',
    'overdue',
    'payment_failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_payment_verification_status as enum (
    'not_verified',
    'provider_confirmed',
    'manual_confirmation',
    'failed'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2) Colunas de vencimento/ciclo/verificação em crm_subscriptions
-- ---------------------------------------------------------------------------

alter table public.crm_subscriptions
  add column if not exists billing_due_at timestamptz,
  add column if not exists billing_due_source text,
  add column if not exists billing_status public.crm_billing_status
    not null default 'active',
  add column if not exists payment_method_label text,
  add column if not exists payment_verification_status
    public.crm_payment_verification_status not null default 'not_verified',
  add column if not exists cycle_started_at timestamptz,
  add column if not exists cycle_ends_at timestamptz;

comment on column public.crm_subscriptions.billing_due_at is
  'Vencimento comercial informado pela gestão. NUNCA usar como próxima agenda; para agenda usar next_scheduled_service_at.';
comment on column public.crm_subscriptions.billing_due_source is
  'Origem/planilha que informou o vencimento (ex.: 4uCar:<arquivo>).';
comment on column public.crm_subscriptions.payment_method_label is
  'Descrição segura da forma de pagamento (Pix, Cartão, Recorrência). NUNCA armazenar PAN/CVV/token.';
comment on column public.crm_subscriptions.payment_verification_status is
  'Estado da verificação do pagamento. Somente `provider_confirmed` ou `manual_confirmation` significam pago.';

-- ---------------------------------------------------------------------------
-- 3) Vínculo Supabase Auth <-> CRM
-- ---------------------------------------------------------------------------

create table if not exists public.crm_customer_auth (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  customer_id uuid not null unique references public.crm_customers (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_customer_auth_customer_id
  on public.crm_customer_auth (customer_id);

drop trigger if exists trg_crm_customer_auth_touch on public.crm_customer_auth;
create trigger trg_crm_customer_auth_touch
  before update on public.crm_customer_auth
  for each row execute function public.crm_touch_updated_at();

alter table public.crm_customer_auth enable row level security;
alter table public.crm_customer_auth force row level security;
revoke all on public.crm_customer_auth from anon, authenticated;
-- service_role bypassa RLS por BYPASSRLS; nenhum policy é necessário aqui.

-- ---------------------------------------------------------------------------
-- 4) RPC do Portal — retorna somente o subscriber ligado a auth.uid()
-- ---------------------------------------------------------------------------

create or replace function public.portal_get_current_subscriber()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_customer public.crm_customers%rowtype;
  v_subscription public.crm_subscriptions%rowtype;
  v_vehicles jsonb;
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

  select * into v_subscription
    from public.crm_subscriptions
   where customer_id = v_customer.id
   order by created_at desc
   limit 1;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', v.id,
        'plate', v.plate,
        'masked_plate', v.masked_plate,
        'brand', v.brand,
        'model', v.model,
        'is_primary', v.is_primary
      )
      order by v.is_primary desc nulls last, v.created_at asc
    ),
    '[]'::jsonb
  ) into v_vehicles
    from public.crm_vehicles v
   where v.customer_id = v_customer.id;

  select * into v_founder
    from public.crm_campaign_members
   where customer_id = v_customer.id
     and campaign_id = 'founders-2026';

  return jsonb_build_object(
    'linked', true,
    'customer', jsonb_build_object(
      'id', v_customer.id,
      'name', v_customer.name,
      'first_name', split_part(v_customer.name, ' ', 1),
      'masked_phone', case
        when v_customer.normalized_phone is null then null
        else 'DDD ' || substr(v_customer.normalized_phone, 3, 2) || ' ****-'
             || right(v_customer.normalized_phone, 2)
      end
    ),
    'subscription', case when v_subscription.id is null then null else jsonb_build_object(
      'id', v_subscription.id,
      'plan', v_subscription.subscription_plan,
      'cycle', v_subscription.subscription_cycle,
      'status', v_subscription.subscription_status,
      'billing_status', v_subscription.billing_status,
      'billing_due_at', v_subscription.billing_due_at,
      'billing_due_source', v_subscription.billing_due_source,
      'payment_method_label', v_subscription.payment_method_label,
      'payment_verification_status', v_subscription.payment_verification_status,
      'cycle_started_at', v_subscription.cycle_started_at,
      'cycle_ends_at', v_subscription.cycle_ends_at,
      'is_active_subscriber', v_subscription.is_active_subscriber,
      'next_scheduled_service_at', v_subscription.next_scheduled_service_at
    ) end,
    'vehicles', v_vehicles,
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
  'Retorna o subscriber ligado ao auth.uid() atual. security definer + filtro por vínculo em crm_customer_auth. Retorna { linked:false } se sessão inexistente ou sem vínculo.';
