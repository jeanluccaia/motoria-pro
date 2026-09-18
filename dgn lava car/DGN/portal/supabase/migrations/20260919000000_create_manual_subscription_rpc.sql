-- ---------------------------------------------------------------------------
-- P0 RECONCILIADOR (Fase 2 — APPLY) — RASCUNHO. NÃO APLICAR ainda.
--
-- RPC de criação manual de subscription NÃO-PagBank. Complemento à
-- crm_promote_existing_subscription (já em prod). Para casos em que o
-- customer existe mas ainda não há linha em crm_subscriptions.
--
-- Regras homologadas:
--   * SECURITY DEFINER, search_path=public,pg_temp
--   * grant só a service_role
--   * customer real (FK guard implícita via query)
--   * vehicle ownership validado quando p_vehicle_id != NULL
--   * source_reference obrigatório para provenance auditável
--   * recusa card_recurring / evidence=provider (PagBank vai por importer)
--   * provider_customer_id / provider_subscription_id SEMPRE NULL
--   * permite N subs ativas por customer (padrão José Sergio: dois veículos)
--   * dedupe conservador: NÃO duplica; retorna REVIEW_EXISTING_SUBSCRIPTION
--     e NÃO grava se já existe sub equivalente
--   * audit before/after em crm_audit_logs (action=subscription.manual_created)
--   * idempotência via dedupe (mesma chamada exata devolve REVIEW no 2º apply)
-- ---------------------------------------------------------------------------

create or replace function public.crm_create_manual_subscription(
  p_customer_id              uuid,
  p_plan                     public.crm_subscription_plan,
  p_cycle                    public.crm_subscription_cycle,
  p_payment_status           public.crm_payment_status,
  p_payment_evidence_source  public.crm_payment_evidence_source,
  p_source_reference         text,
  p_vehicle_id               uuid,
  p_cycle_ends_at            timestamptz,
  p_notes                    text,
  p_actor                    text
) returns table (result_code text, subscription_id uuid, existing_subscription_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_new_id      uuid;
  v_veh_owner   uuid;
  v_existing_id uuid;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório (fixado pelo endpoint admin)';
  end if;

  if not exists (select 1 from public.crm_customers where id = p_customer_id) then
    raise exception 'customer % inexistente', p_customer_id;
  end if;

  -- Guard: PagBank / provider entra pelo importer, não por essa RPC.
  if p_payment_evidence_source = 'provider' then
    raise exception 'evidence=provider não permitido nesta RPC (use importer PagBank)';
  end if;

  if p_vehicle_id is not null then
    select customer_id into v_veh_owner from public.crm_vehicles where id = p_vehicle_id;
    if v_veh_owner is null then
      raise exception 'vehicle % inexistente', p_vehicle_id;
    end if;
    if v_veh_owner <> p_customer_id then
      raise exception 'vehicle % não pertence a customer %', p_vehicle_id, p_customer_id;
    end if;
  end if;

  if p_source_reference is null or btrim(p_source_reference) = '' then
    raise exception 'source_reference é obrigatório para sub manual';
  end if;

  -- Dedupe conservador. Identidade forte:
  --   (customer_id, vehicle_id, plan) quando vehicle presente;
  --   (customer_id, plan, source_reference) quando vehicle NULL.
  -- Só considera estados não-terminados (evita bloquear em canceladas antigas).
  if p_vehicle_id is not null then
    select id into v_existing_id
    from public.crm_subscriptions
    where customer_id = p_customer_id
      and vehicle_id = p_vehicle_id
      and subscription_plan = p_plan
      and subscription_status in ('ativo','detectado','pendente_validacao','inadimplente')
    order by updated_at desc
    limit 1;
  else
    select id into v_existing_id
    from public.crm_subscriptions
    where customer_id = p_customer_id
      and vehicle_id is null
      and subscription_plan = p_plan
      and subscription_status in ('ativo','detectado','pendente_validacao','inadimplente')
      and source_reference is not distinct from p_source_reference
    order by updated_at desc
    limit 1;
  end if;

  if v_existing_id is not null then
    return query select 'REVIEW_EXISTING_SUBSCRIPTION'::text, null::uuid, v_existing_id;
    return;
  end if;

  insert into public.crm_subscriptions (
    customer_id, subscription_plan, subscription_cycle, subscription_status,
    subscription_source, is_active_subscriber,
    payment_method, payment_status, payment_evidence_source,
    subscription_detected_at, subscription_validated_at, subscription_validated_by,
    source_reference, notes, vehicle_id, cycle_ends_at, last_verified_at
    -- provider_customer_id / provider_subscription_id ficam NULL por default
  ) values (
    p_customer_id, p_plan, p_cycle, 'ativo'::public.crm_subscription_status,
    'Manual'::public.crm_subscription_source, true,
    'manual'::public.crm_payment_method, p_payment_status, p_payment_evidence_source,
    now(), now(), p_actor,
    p_source_reference, p_notes, p_vehicle_id, p_cycle_ends_at, now()
  ) returning id into v_new_id;

  insert into public.crm_audit_logs (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values (
    'subscription', v_new_id, 'subscription.manual_created',
    null,
    to_jsonb((select s from public.crm_subscriptions s where s.id = v_new_id)),
    p_actor,
    p_source_reference
  );

  return query select 'CREATED'::text, v_new_id, null::uuid;
end;
$fn$;

revoke all on function public.crm_create_manual_subscription(
  uuid, public.crm_subscription_plan, public.crm_subscription_cycle,
  public.crm_payment_status, public.crm_payment_evidence_source,
  text, uuid, timestamptz, text, text
) from public;

grant execute on function public.crm_create_manual_subscription(
  uuid, public.crm_subscription_plan, public.crm_subscription_cycle,
  public.crm_payment_status, public.crm_payment_evidence_source,
  text, uuid, timestamptz, text, text
) to service_role;
