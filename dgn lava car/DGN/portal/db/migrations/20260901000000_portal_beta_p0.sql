-- DGN Portal Beta P0
-- Estende o schema base do Portal (20260817180000_subscriber_portal.sql) para
-- suportar:
--   1. Múltiplos contratos por cliente (José Sergio: 1 customer + 2 vehicles + 2 subscriptions).
--   2. Campos financeiros canônicos exigidos pelo brief (PagBank como fonte oficial).
--   3. Fila humana para casos ambíguos (David Lisboa: financial_review_required).
--   4. Consentimento de comunicação (respeitado pelo Agent).
--   5. Beta gate por customer (portal_beta_enabled).
--   6. RPC atualizada retornando ARRAY de subscriptions com vehicle vinculado.
--
-- Forward-only. Sem impacto no admin/Growth. Sem alteração de RLS existente.
-- Enums existentes (crm_billing_status, crm_payment_verification_status) são
-- preservados; os novos são adicionais e coabitam sem conflito.

-- ---------------------------------------------------------------------------
-- 1) Enums canônicos exigidos pelo P0
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.crm_payment_method as enum (
    'card_recurring',  -- CARD_RECURRING (PagBank recorrente)
    'manual',          -- MANUAL (Pix/dinheiro/transferência avulsa)
    'unknown'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_payment_status as enum (
    'confirmed',  -- CONFIRMED — provedor confirmou (só via evidência)
    'pending',    -- PENDING — cobrança futura ou não verificada
    'failed',     -- FAILED — provedor sinalizou falha (nunca inferido)
    'refunded',   -- REFUNDED — estorno confirmado
    'unknown'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_payment_evidence_source as enum (
    'provider',  -- PROVIDER (PagBank webhook/API)
    'manual',    -- MANUAL (curadoria humana)
    'legacy',    -- LEGACY (import histórico sem verificação atual)
    'unknown'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_migration_status as enum (
    'not_needed',  -- já está em CARD_RECURRING
    'pending',     -- cliente precisa migrar de MANUAL para recorrente
    'complete'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_communication_consent as enum (
    'allowed',   -- pode receber contato comercial
    'blocked',   -- NÃO CONTATAR — Agent nunca prepara comercial
    'unknown'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2) crm_subscriptions — colunas P0
-- ---------------------------------------------------------------------------

alter table public.crm_subscriptions
  add column if not exists payment_method public.crm_payment_method
    not null default 'unknown',
  add column if not exists payment_status public.crm_payment_status
    not null default 'unknown',
  add column if not exists payment_evidence_source public.crm_payment_evidence_source
    not null default 'unknown',
  add column if not exists payment_confidence numeric(3,2)
    not null default 0,
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists last_payment_confirmed_at timestamptz,
  add column if not exists next_due_date date,
  add column if not exists migration_status public.crm_migration_status
    not null default 'not_needed',
  add column if not exists last_verified_at timestamptz,
  add column if not exists financial_review_required boolean
    not null default false,
  add column if not exists financial_review_reason text,
  add column if not exists vehicle_id uuid references public.crm_vehicles (id)
    on delete set null;

-- provider_subscription_id é único (mesmo contrato PagBank nunca duplica).
-- Cria índice único parcial: só quando não-nulo (customers legados não têm).
create unique index if not exists ux_crm_subscriptions_provider_subscription_id
  on public.crm_subscriptions (provider_subscription_id)
  where provider_subscription_id is not null;

create index if not exists idx_crm_subscriptions_vehicle_id
  on public.crm_subscriptions (vehicle_id)
  where vehicle_id is not null;

create index if not exists idx_crm_subscriptions_financial_review
  on public.crm_subscriptions (financial_review_required)
  where financial_review_required = true;

comment on column public.crm_subscriptions.payment_method is
  'Canônico P0: card_recurring | manual | unknown. `manual` NÃO é cobrança recorrente.';
comment on column public.crm_subscriptions.payment_status is
  'Canônico P0: confirmed | pending | failed | refunded | unknown. NUNCA inferir failed sem evidência do provedor.';
comment on column public.crm_subscriptions.payment_evidence_source is
  'Origem da última verificação. `provider` = PagBank; sem isso, nenhum status financeiro é definitivo.';
comment on column public.crm_subscriptions.provider_customer_id is
  'ID do cliente no provedor de pagamento (ex.: PagBank). Nunca expor no browser sem necessidade.';
comment on column public.crm_subscriptions.provider_subscription_id is
  'ID do contrato recorrente no provedor. Único quando presente. Nunca expor no browser sem necessidade.';
comment on column public.crm_subscriptions.financial_review_required is
  'Sinaliza contrato em investigação (ex.: David Lisboa duplicado). Fila humana; nenhuma decisão automática.';
comment on column public.crm_subscriptions.vehicle_id is
  'Vínculo opcional contrato → veículo (José Sergio: 1 contrato por veículo). null = contrato cobre o cliente todo.';

-- ---------------------------------------------------------------------------
-- 3) crm_customers — consent + beta gate
-- ---------------------------------------------------------------------------

alter table public.crm_customers
  add column if not exists communication_consent public.crm_communication_consent
    not null default 'unknown',
  add column if not exists portal_beta_enabled boolean
    not null default false,
  add column if not exists portal_beta_enabled_at timestamptz;

create index if not exists idx_crm_customers_portal_beta_enabled
  on public.crm_customers (portal_beta_enabled)
  where portal_beta_enabled = true;

comment on column public.crm_customers.communication_consent is
  'Preferência de contato comercial. Agent respeita `blocked` mesmo em análises internas.';
comment on column public.crm_customers.portal_beta_enabled is
  'Gate do Portal Beta. Sem essa flag = true, cliente não acessa telas privadas mesmo autenticado.';

-- ---------------------------------------------------------------------------
-- 4) RPC portal_get_current_subscriber() — retorna ARRAY de contratos
-- ---------------------------------------------------------------------------
--
-- Substitui a versão do MVP que retornava 1 subscription apenas. Agora:
--   - retorna todas as subscriptions do customer (múltiplos contratos);
--   - inclui vehicle_id vinculado quando aplicável;
--   - retorna os novos campos financeiros (payment_method, payment_status, ...);
--   - respeita portal_beta_enabled — não retorna dados privados se falso;
--   - respeita RLS via `security definer` + filtro por `auth.uid()`.

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

  -- Beta gate: cliente autenticado mas sem gate não recebe payload do Portal.
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
  'P0: retorna ARRAY de subscriptions do subscriber ligado ao auth.uid(). Respeita portal_beta_enabled. Nunca aceita id vindo do browser.';
