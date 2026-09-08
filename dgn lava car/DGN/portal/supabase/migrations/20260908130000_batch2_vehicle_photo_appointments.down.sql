-- Rollback Batch 2. Restaura schema pré-Batch 2. Só use se PRECISAR remover.
-- Não apaga fotos já enviadas ao bucket; delete manual se necessário.

-- 1) RPC volta pra versão P0 (sem photo_url e sem upcoming_appointments).
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

-- 2) Drop tabela crm_appointments (índices e trigger caem junto).
drop table if exists public.crm_appointments;

-- 3) Drop colunas de foto em crm_vehicles.
alter table public.crm_vehicles
  drop column if exists photo_updated_at,
  drop column if exists photo_url,
  drop column if exists photo_storage_path;

-- 4) Drop enums.
drop type if exists public.crm_appointment_source;
drop type if exists public.crm_appointment_status;

-- 5) Bucket NÃO é removido — objetos podem ainda ser úteis. Delete manual.
