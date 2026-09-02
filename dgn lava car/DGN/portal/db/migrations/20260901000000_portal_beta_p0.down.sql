-- Rollback DGN Portal Beta P0. Só use se PRECISAR remover a extensão.
-- Preserva o schema base do MVP (20260817180000).

-- 1) Restaura RPC para a versão do MVP.
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
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', v.id, 'plate', v.plate, 'masked_plate', v.masked_plate,
    'brand', v.brand, 'model', v.model, 'is_primary', v.is_primary
  ) order by v.is_primary desc nulls last, v.created_at asc), '[]'::jsonb) into v_vehicles
    from public.crm_vehicles v where v.customer_id = v_customer.id;
  select * into v_founder from public.crm_campaign_members
   where customer_id = v_customer.id and campaign_id = 'founders-2026';
  return jsonb_build_object(
    'linked', true,
    'customer', jsonb_build_object(
      'id', v_customer.id, 'name', v_customer.name,
      'first_name', split_part(v_customer.name, ' ', 1),
      'masked_phone', case when v_customer.normalized_phone is null then null
        else 'DDD ' || substr(v_customer.normalized_phone, 3, 2) || ' ****-' || right(v_customer.normalized_phone, 2) end
    ),
    'subscription', case when v_subscription.id is null then null else jsonb_build_object(
      'id', v_subscription.id, 'plan', v_subscription.subscription_plan,
      'cycle', v_subscription.subscription_cycle, 'status', v_subscription.subscription_status,
      'billing_status', v_subscription.billing_status, 'billing_due_at', v_subscription.billing_due_at,
      'billing_due_source', v_subscription.billing_due_source, 'payment_method_label', v_subscription.payment_method_label,
      'payment_verification_status', v_subscription.payment_verification_status,
      'cycle_started_at', v_subscription.cycle_started_at, 'cycle_ends_at', v_subscription.cycle_ends_at,
      'is_active_subscriber', v_subscription.is_active_subscriber,
      'next_scheduled_service_at', v_subscription.next_scheduled_service_at
    ) end,
    'vehicles', v_vehicles,
    'founder', case when v_founder.id is null then null else jsonb_build_object(
      'status', v_founder.founder_status, 'number', v_founder.founder_number
    ) end
  );
end;
$$;

-- 2) Drop índices e colunas novas.
drop index if exists public.ux_crm_subscriptions_provider_subscription_id;
drop index if exists public.idx_crm_subscriptions_vehicle_id;
drop index if exists public.idx_crm_subscriptions_financial_review;
drop index if exists public.idx_crm_customers_portal_beta_enabled;

alter table public.crm_subscriptions
  drop column if exists vehicle_id,
  drop column if exists financial_review_reason,
  drop column if exists financial_review_required,
  drop column if exists last_verified_at,
  drop column if exists migration_status,
  drop column if exists next_due_date,
  drop column if exists last_payment_confirmed_at,
  drop column if exists provider_subscription_id,
  drop column if exists provider_customer_id,
  drop column if exists payment_confidence,
  drop column if exists payment_evidence_source,
  drop column if exists payment_status,
  drop column if exists payment_method;

alter table public.crm_customers
  drop column if exists portal_beta_enabled_at,
  drop column if exists portal_beta_enabled,
  drop column if exists communication_consent;

-- 3) Drop enums (ordem: drops que dependem primeiro).
drop type if exists public.crm_communication_consent;
drop type if exists public.crm_migration_status;
drop type if exists public.crm_payment_evidence_source;
drop type if exists public.crm_payment_status;
drop type if exists public.crm_payment_method;
