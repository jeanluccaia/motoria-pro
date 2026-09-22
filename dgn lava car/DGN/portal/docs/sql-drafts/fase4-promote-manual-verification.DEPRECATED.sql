-- ===========================================================================
-- STATUS: NÃO APROVADO · DEPRECATED (2026-09-22, revisão financeira do Jean)
--
-- Este rascunho propunha converter automaticamente
--   payment_evidence_source='manual' + payment_status='confirmed'
-- em payment_verification_status='manual_confirmation'.
--
-- FALHA CANÔNICA: confirmação administrativa (dgn-admin/Digo) NÃO é
-- evidência de recebimento financeiro. `manual_confirmation` exige recibo
-- real (PIX/TED/boleto pago), com data, valor, canal, comprovante — não
-- basta o operador atestar que "está pago". Qualquer nova versão deste RPC
-- DEVE receber a evidência de recebimento como parâmetro obrigatório e
-- gravá-la em campo dedicado antes de mover o verification.
--
-- Não executar. Não reaproveitar regras sem nova revisão pelo Jean.
-- Mantido em disco só para rastro histórico.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- [HISTÓRICO — RASCUNHO NÃO APROVADO]
--
-- Objetivo original: quando o operador promove uma sub manual com
--   payment_evidence_source='manual' + payment_status='confirmed'
-- o RPC deve ALSO gravar payment_verification_status='manual_confirmation'.
--
-- Hoje o RPC (versão em prod, migration 20260918000000) só toca em
-- payment_status/evidence e deixa payment_verification_status='not_verified'.
-- Isso é o que faz Benedito/Jose Moreira/Rikardo/Wellington aparecerem hoje
-- como "pago" pelo campo payment_status, mas simultaneamente como "não
-- verificado" pelo verification. O schema é explícito: SÓ provider_confirmed
-- ou manual_confirmation significam pago. A ausência de manual_confirmation
-- é o motivo do backfill Fase 4 marcar essas subs como MANUAL_REGISTERED
-- ("Backfill sem verificação — verificação necessária").
--
-- Fluxo forward (esta migration): garantir semântica correta em novas
-- promoções. NÃO faz backfill sozinho — backfill vai em migration separada
-- (fase4-backfill-founders-verification.sql), passível de autorização
-- individual por cliente.
--
-- Como aplicar (quando autorizado):
--   supabase db push  (via CLI)  OU  mcp apply_migration com este SQL.
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
  v_target_verif public.crm_payment_verification_status;
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

  if v_before.provider_subscription_id is not null
     or v_before.provider_customer_id is not null then
    raise exception
      'subscription % é vinculada a provider (customer=%, sub=%); promoção manual bloqueada',
      p_subscription_id, v_before.provider_customer_id, v_before.provider_subscription_id;
  end if;

  if p_payment_evidence_source = 'provider' then
    raise exception 'evidence=provider não permitido nesta RPC (use importer PagBank)';
  end if;

  -- Novo (Fase 4): garantir que promoção manual coerente (evidence=manual +
  -- status=confirmed) grava verification=manual_confirmation. Sem isso a UI
  -- não pode diferenciar "backfill sem verificação" de "verificado por humano"
  -- e o schema exige verification para tratar como pago.
  v_target_verif := v_before.payment_verification_status;
  if coalesce(p_payment_evidence_source, v_before.payment_evidence_source) = 'manual'
     and coalesce(p_payment_status, v_before.payment_status) = 'confirmed' then
    v_target_verif := 'manual_confirmation'::public.crm_payment_verification_status;
  end if;

  -- Idempotência: NO-OP quando alvo já atingido, incluindo verification.
  v_notes_already_contains := (
    v_append is null
    or (v_before.notes is not null and position(v_append in v_before.notes) > 0)
  );

  if v_before.is_active_subscriber = true
     and v_before.subscription_status = 'ativo'
     and (p_payment_status is null or v_before.payment_status = p_payment_status)
     and (p_payment_evidence_source is null or v_before.payment_evidence_source = p_payment_evidence_source)
     and v_before.payment_verification_status = v_target_verif
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
    is_active_subscriber        = true,
    subscription_status         = 'ativo',
    payment_status              = coalesce(p_payment_status, payment_status),
    payment_evidence_source     = coalesce(p_payment_evidence_source, payment_evidence_source),
    payment_verification_status = v_target_verif,
    cycle_ends_at               = coalesce(p_cycle_ends_at, cycle_ends_at),
    last_verified_at            = v_now,
    subscription_validated_at   = v_now,
    subscription_validated_by   = p_actor,
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

-- Grants permanecem os mesmos (RPC substitui a existente).
revoke all on function public.crm_promote_existing_subscription(
  uuid, uuid, text, text,
  public.crm_payment_status, public.crm_payment_evidence_source, timestamptz, text
) from public;

grant execute on function public.crm_promote_existing_subscription(
  uuid, uuid, text, text,
  public.crm_payment_status, public.crm_payment_evidence_source, timestamptz, text
) to service_role;
