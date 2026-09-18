-- ---------------------------------------------------------------------------
-- P0 BACKFILL — RPC de promoção manual de subscription existente.
--
-- Contexto: o import PagBank cobriu 11 assinantes recorrentes. Assinantes
-- confirmados operacionalmente (Founders, casos legados) ficaram como
-- `detectado / is_active_subscriber=false` em crm_subscriptions, e por isso
-- o Portal/Agent os classificam como "sem assinatura canônica". Esta RPC
-- promove uma linha existente para o estado canônico ativo com confirmação
-- humana, sem inventar dados financeiros e sem tocar em subs vinculadas a
-- provider.
--
-- Alteração mínima: is_active + status + validated_at/by + last_verified_at;
-- opcionalmente payment_status/evidence/cycle_ends_at + notes_append.
-- provider_customer_id/provider_subscription_id NUNCA são tocados — subs
-- provider-linked são bloqueadas na entrada.
--
-- Ver diagnóstico e testes (transaction ROLLBACK em prod) no PR do Lote 1.
-- ---------------------------------------------------------------------------

create or replace function public.crm_promote_existing_subscription(
  p_subscription_id             uuid,
  p_expected_customer_id        uuid,
  p_actor                       text,
  p_reason                      text,
  p_payment_status              public.crm_payment_status          default null,
  p_payment_evidence_source     public.crm_payment_evidence_source default null,
  p_cycle_ends_at               timestamptz                        default null,
  p_notes_append                text                               default null
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_before public.crm_subscriptions%rowtype;
  v_after  public.crm_subscriptions%rowtype;
  v_now    timestamptz := now();
  v_append text := nullif(btrim(p_notes_append), '');
  v_notes_already_contains boolean;
  v_would_change_notes boolean;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório (fixado pelo endpoint admin)';
  end if;

  select * into v_before from public.crm_subscriptions where id = p_subscription_id for update;
  if not found then
    raise exception 'subscription % inexistente', p_subscription_id;
  end if;

  if v_before.customer_id <> p_expected_customer_id then
    raise exception 'subscription % pertence a customer %, esperado %',
      p_subscription_id, v_before.customer_id, p_expected_customer_id;
  end if;

  -- Guard: bloqueia qualquer promoção manual em sub vinculada a provider.
  -- PagBank permanece no fluxo próprio; nada aqui altera provider data.
  if v_before.provider_subscription_id is not null
     or v_before.provider_customer_id is not null then
    raise exception
      'subscription % é vinculada a provider (customer=%, sub=%); promoção manual bloqueada',
      p_subscription_id, v_before.provider_customer_id, v_before.provider_subscription_id;
  end if;

  -- Guard: nunca forjar evidence=provider por caminho manual.
  if p_payment_evidence_source = 'provider' then
    raise exception 'evidence=provider não permitido nesta RPC (use importer PagBank)';
  end if;

  -- Idempotência REAL: NO-OP quando alvo já atingido, incluindo append já presente
  -- no campo notes (evita retry re-concatenar a mesma linha).
  v_notes_already_contains := (
    v_append is null
    or (v_before.notes is not null and position(v_append in v_before.notes) > 0)
  );

  if v_before.is_active_subscriber = true
     and v_before.subscription_status = 'ativo'
     and (p_payment_status is null or v_before.payment_status = p_payment_status)
     and (p_payment_evidence_source is null or v_before.payment_evidence_source = p_payment_evidence_source)
     and (p_cycle_ends_at is null or v_before.cycle_ends_at is not distinct from p_cycle_ends_at)
     and v_notes_already_contains
  then
    return p_subscription_id;
  end if;

  v_would_change_notes := (
    v_append is not null
    and (v_before.notes is null or position(v_append in v_before.notes) = 0)
  );

  update public.crm_subscriptions set
    is_active_subscriber      = true,
    subscription_status       = 'ativo',
    payment_status            = coalesce(p_payment_status, payment_status),
    payment_evidence_source   = coalesce(p_payment_evidence_source, payment_evidence_source),
    cycle_ends_at             = coalesce(p_cycle_ends_at, cycle_ends_at),
    last_verified_at          = v_now,
    subscription_validated_at = v_now,
    subscription_validated_by = p_actor,
    notes = case
              when not v_would_change_notes then notes
              when notes is null or btrim(notes) = '' then v_append
              else notes || E'\n' || v_append
            end,
    updated_at = v_now
  where id = p_subscription_id
  returning * into v_after;

  insert into public.crm_audit_logs (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values ('subscription', p_subscription_id, 'subscription.promoted',
          to_jsonb(v_before), to_jsonb(v_after), p_actor, p_reason);

  return p_subscription_id;
end;
$fn$;

revoke all on function public.crm_promote_existing_subscription(
  uuid, uuid, text, text,
  public.crm_payment_status, public.crm_payment_evidence_source, timestamptz, text
) from public;

grant execute on function public.crm_promote_existing_subscription(
  uuid, uuid, text, text,
  public.crm_payment_status, public.crm_payment_evidence_source, timestamptz, text
) to service_role;
