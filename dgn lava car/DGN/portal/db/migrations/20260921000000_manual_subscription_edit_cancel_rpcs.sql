-- ---------------------------------------------------------------------------
-- FASE 1 — Editor manual de assinaturas na ficha do cliente.
--
-- Complemento a crm_promote_existing_subscription e crm_create_manual_subscription
-- (já em prod). Introduz:
--   * crm_edit_manual_subscription  — altera plano/ciclo/vehicle_id/cycle_ends_at/
--                                     notes/source_reference/payment_status/
--                                     payment_evidence_source em subs manuais.
--   * crm_cancel_manual_subscription — encerra sub manual (status=cancelado,
--                                      is_active_subscriber=false) com motivo.
--
-- Regras homologadas (as mesmas de promote/create):
--   * SECURITY DEFINER, search_path=public,pg_temp; grant só a service_role.
--   * Recusam qualquer subscription com provider_customer_id OR
--     provider_subscription_id != null (PagBank vai pelo importer).
--   * Recusam evidence=provider (nunca forjar evidência do provedor por caminho manual).
--   * Vehicle guard: se p_vehicle_id != null, precisa pertencer ao mesmo customer.
--   * Idempotência: edit compara antes/depois e é no-op quando nada muda; cancel
--     é no-op quando já está cancelado.
--   * Audit before/after em crm_audit_logs
--     (action=subscription.manual_edited | subscription.manual_cancelled).
--   * p_actor obrigatório (fixado pelo endpoint admin, nunca vem do browser).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- crm_edit_manual_subscription
-- ---------------------------------------------------------------------------
create or replace function public.crm_edit_manual_subscription(
  p_subscription_id          uuid,
  p_expected_customer_id     uuid,
  p_actor                    text,
  p_reason                   text,
  p_plan                     public.crm_subscription_plan       default null,
  p_cycle                    public.crm_subscription_cycle      default null,
  p_vehicle_id               uuid                               default null,
  p_clear_vehicle            boolean                            default false,
  p_cycle_ends_at            timestamptz                        default null,
  p_clear_cycle_ends_at      boolean                            default false,
  p_payment_status           public.crm_payment_status          default null,
  p_payment_evidence_source  public.crm_payment_evidence_source default null,
  p_source_reference         text                               default null,
  p_notes                    text                               default null
) returns table (result_code text, subscription_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_before public.crm_subscriptions%rowtype;
  v_after  public.crm_subscriptions%rowtype;
  v_veh_owner uuid;
  v_now timestamptz := now();
  v_new_plan            public.crm_subscription_plan;
  v_new_cycle           public.crm_subscription_cycle;
  v_new_vehicle_id      uuid;
  v_new_cycle_ends_at   timestamptz;
  v_new_payment_status  public.crm_payment_status;
  v_new_payment_source  public.crm_payment_evidence_source;
  v_new_source_ref      text;
  v_new_notes           text;
  v_changed             boolean := false;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório (fixado pelo endpoint admin)';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'p_reason obrigatório (motivo humano exigido no audit log)';
  end if;

  select * into v_before from public.crm_subscriptions where id = p_subscription_id for update;
  if not found then
    raise exception 'subscription % inexistente', p_subscription_id;
  end if;

  if v_before.customer_id <> p_expected_customer_id then
    raise exception 'subscription % pertence a customer %, esperado %',
      p_subscription_id, v_before.customer_id, p_expected_customer_id;
  end if;

  -- Guard PagBank: qualquer sub com vínculo provider fica read-only nesta RPC.
  if v_before.provider_subscription_id is not null
     or v_before.provider_customer_id is not null then
    raise exception
      'subscription % é vinculada a provider (customer=%, sub=%); edição manual bloqueada',
      p_subscription_id, v_before.provider_customer_id, v_before.provider_subscription_id;
  end if;

  -- Guard: nunca forjar evidence=provider por caminho manual.
  if p_payment_evidence_source = 'provider' then
    raise exception 'evidence=provider não permitido nesta RPC (use importer PagBank)';
  end if;

  -- Vehicle guard: se p_clear_vehicle=true, seta NULL. Caso contrário,
  -- se p_vehicle_id passado, exige pertencer ao mesmo customer.
  if p_clear_vehicle then
    v_new_vehicle_id := null;
  elsif p_vehicle_id is not null then
    select customer_id into v_veh_owner from public.crm_vehicles where id = p_vehicle_id;
    if v_veh_owner is null then
      raise exception 'vehicle % inexistente', p_vehicle_id;
    end if;
    if v_veh_owner <> v_before.customer_id then
      raise exception 'vehicle % não pertence a customer %', p_vehicle_id, v_before.customer_id;
    end if;
    v_new_vehicle_id := p_vehicle_id;
  else
    v_new_vehicle_id := v_before.vehicle_id;
  end if;

  v_new_plan           := coalesce(p_plan, v_before.subscription_plan);
  v_new_cycle          := coalesce(p_cycle, v_before.subscription_cycle);
  v_new_cycle_ends_at  := case
                            when p_clear_cycle_ends_at then null
                            when p_cycle_ends_at is not null then p_cycle_ends_at
                            else v_before.cycle_ends_at
                          end;
  v_new_payment_status := coalesce(p_payment_status, v_before.payment_status);
  v_new_payment_source := coalesce(p_payment_evidence_source, v_before.payment_evidence_source);
  v_new_source_ref     := coalesce(nullif(btrim(p_source_reference), ''), v_before.source_reference);
  v_new_notes          := case
                            when p_notes is null then v_before.notes
                            else p_notes
                          end;

  -- Detecta mudança real (idempotência).
  v_changed :=
       v_before.subscription_plan   is distinct from v_new_plan
    or v_before.subscription_cycle  is distinct from v_new_cycle
    or v_before.vehicle_id          is distinct from v_new_vehicle_id
    or v_before.cycle_ends_at       is distinct from v_new_cycle_ends_at
    or v_before.payment_status      is distinct from v_new_payment_status
    or v_before.payment_evidence_source is distinct from v_new_payment_source
    or v_before.source_reference    is distinct from v_new_source_ref
    or v_before.notes               is distinct from v_new_notes;

  if not v_changed then
    return query select 'NO_CHANGE'::text, p_subscription_id;
    return;
  end if;

  update public.crm_subscriptions set
    subscription_plan       = v_new_plan,
    subscription_cycle      = v_new_cycle,
    vehicle_id              = v_new_vehicle_id,
    cycle_ends_at           = v_new_cycle_ends_at,
    payment_status          = v_new_payment_status,
    payment_evidence_source = v_new_payment_source,
    source_reference        = v_new_source_ref,
    notes                   = v_new_notes,
    last_verified_at        = v_now,
    updated_at              = v_now
  where id = p_subscription_id
  returning * into v_after;

  insert into public.crm_audit_logs (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values ('subscription', p_subscription_id, 'subscription.manual_edited',
          to_jsonb(v_before), to_jsonb(v_after), p_actor, p_reason);

  return query select 'UPDATED'::text, p_subscription_id;
end;
$fn$;

revoke all on function public.crm_edit_manual_subscription(
  uuid, uuid, text, text,
  public.crm_subscription_plan, public.crm_subscription_cycle,
  uuid, boolean,
  timestamptz, boolean,
  public.crm_payment_status, public.crm_payment_evidence_source,
  text, text
) from public;

grant execute on function public.crm_edit_manual_subscription(
  uuid, uuid, text, text,
  public.crm_subscription_plan, public.crm_subscription_cycle,
  uuid, boolean,
  timestamptz, boolean,
  public.crm_payment_status, public.crm_payment_evidence_source,
  text, text
) to service_role;

-- ---------------------------------------------------------------------------
-- crm_cancel_manual_subscription
-- ---------------------------------------------------------------------------
create or replace function public.crm_cancel_manual_subscription(
  p_subscription_id      uuid,
  p_expected_customer_id uuid,
  p_actor                text,
  p_reason               text
) returns table (result_code text, subscription_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_before public.crm_subscriptions%rowtype;
  v_after  public.crm_subscriptions%rowtype;
  v_now timestamptz := now();
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório (fixado pelo endpoint admin)';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'p_reason obrigatório (motivo humano exigido para cancelamento)';
  end if;

  select * into v_before from public.crm_subscriptions where id = p_subscription_id for update;
  if not found then
    raise exception 'subscription % inexistente', p_subscription_id;
  end if;

  if v_before.customer_id <> p_expected_customer_id then
    raise exception 'subscription % pertence a customer %, esperado %',
      p_subscription_id, v_before.customer_id, p_expected_customer_id;
  end if;

  if v_before.provider_subscription_id is not null
     or v_before.provider_customer_id is not null then
    raise exception
      'subscription % é vinculada a provider (customer=%, sub=%); cancelamento manual bloqueado',
      p_subscription_id, v_before.provider_customer_id, v_before.provider_subscription_id;
  end if;

  -- Idempotência.
  if v_before.subscription_status = 'cancelado' and v_before.is_active_subscriber = false then
    return query select 'ALREADY_CANCELLED'::text, p_subscription_id;
    return;
  end if;

  update public.crm_subscriptions set
    subscription_status  = 'cancelado',
    is_active_subscriber = false,
    last_verified_at     = v_now,
    updated_at           = v_now
  where id = p_subscription_id
  returning * into v_after;

  insert into public.crm_audit_logs (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values ('subscription', p_subscription_id, 'subscription.manual_cancelled',
          to_jsonb(v_before), to_jsonb(v_after), p_actor, p_reason);

  return query select 'CANCELLED'::text, p_subscription_id;
end;
$fn$;

revoke all on function public.crm_cancel_manual_subscription(uuid, uuid, text, text) from public;
grant execute on function public.crm_cancel_manual_subscription(uuid, uuid, text, text) to service_role;
