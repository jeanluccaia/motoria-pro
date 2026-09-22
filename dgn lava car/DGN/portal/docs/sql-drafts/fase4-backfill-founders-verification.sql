-- ---------------------------------------------------------------------------
-- FASE 4 — RASCUNHO. NÃO APLICAR sem autorização explícita do Jean.
--
-- Backfill: alinhar payment_verification_status das 4 subscriptions promovidas
-- manualmente em 2026-09-17 pelo Digo, para que elas apareçam corretamente
-- como MANUAL_VERIFIED (assinado por humano) no bloco Financeiro da Fase 4.
--
-- Estado atual (2026-09-22, snapshot Supabase):
--   * Benedito Constantino (1f798eab-...) — Founder Nº001
--   * Jose Moreira        (9e11fe00-...) — Founder Nº002
--   * Rikardo Oliveira    (b8a27123-...) — Founder Nº003
--   * Wellington Felix    (7101dc2a-...)
-- Todas com:
--   payment_status='confirmed'
--   payment_evidence_source='manual'
--   payment_verification_status='not_verified'   ← incoerente com o intent
--
-- O Digo assinou humanamente as 4 no audit_log (subscription.promoted).
-- Este backfill grava manual_confirmation SÓ para essas 4 assinaturas
-- específicas, listadas pelo UUID. Nenhuma outra sub é tocada.
--
-- Rollback: preservado o valor anterior via crm_audit_logs (action=
-- 'subscription.verification_backfilled_fase4'). Recuperação via SQL:
--   UPDATE crm_subscriptions SET payment_verification_status = 'not_verified'
--   WHERE id IN (<lista>);
--
-- Auditoria: cada linha atualizada gera 1 audit_log com actor='fase4-backfill'
-- e reason narrando "backfill verification alinha manual_confirmation com
-- promoção humana já auditada em 2026-09-18".
--
-- COMO APLICAR (quando autorizado):
--   Este SQL deve rodar DEPOIS de fase4-promote-manual-verification.sql
--   (senão futuras promoções continuam gravando not_verified). Idempotente:
--   pode rodar múltiplas vezes; se já for manual_confirmation não muda nada.
-- ---------------------------------------------------------------------------

do $$
declare
  v_ids uuid[] := array[
    '1f798eab-d2d2-4295-900e-857d60a1c454'::uuid, -- Benedito Nº001
    '9e11fe00-b9d5-4c60-ad01-f80fb401b20a'::uuid, -- Jose Moreira Nº002
    'b8a27123-2dba-46f3-9856-3c08ca314d5b'::uuid, -- Rikardo Nº003
    '7101dc2a-ed66-436d-859f-26649332ac6c'::uuid  -- Wellington Felix
  ];
  v_id uuid;
  v_before public.crm_subscriptions%rowtype;
  v_after  public.crm_subscriptions%rowtype;
begin
  foreach v_id in array v_ids loop
    select * into v_before from public.crm_subscriptions where id = v_id;
    if not found then
      raise notice 'Subscription % não encontrada — pulando.', v_id;
      continue;
    end if;

    -- Guarda: só backfill se (a) evidence=manual (b) status=confirmed
    -- (c) verification ainda é not_verified. Se qualquer condição não bate,
    -- pula (evita sobrescrever estado que operador já ajustou).
    if v_before.payment_evidence_source <> 'manual'
       or v_before.payment_status <> 'confirmed'
       or v_before.payment_verification_status = 'manual_confirmation' then
      raise notice 'Subscription % não elegível ou já ajustada — pulando.', v_id;
      continue;
    end if;

    update public.crm_subscriptions
    set payment_verification_status = 'manual_confirmation',
        updated_at = now()
    where id = v_id
    returning * into v_after;

    insert into public.crm_audit_logs
      (entity_type, entity_id, action, previous_value, new_value, actor, reason)
    values (
      'subscription', v_id, 'subscription.verification_backfilled_fase4',
      to_jsonb(v_before),
      to_jsonb(v_after),
      'fase4-backfill',
      'Fase 4 backfill: alinha verification=manual_confirmation com promoção humana já auditada em 2026-09-18 (Digo confirmou Founder/manual).'
    );
  end loop;
end$$;

-- Verificação pós-backfill:
--   select id, name, payment_status, payment_evidence_source,
--          payment_verification_status
--   from public.crm_subscriptions s
--   join public.crm_customers c on c.id = s.customer_id
--   where s.id in (
--     '1f798eab-d2d2-4295-900e-857d60a1c454',
--     '9e11fe00-b9d5-4c60-ad01-f80fb401b20a',
--     'b8a27123-2dba-46f3-9856-3c08ca314d5b',
--     '7101dc2a-ed66-436d-859f-26649332ac6c'
--   );
-- Esperado: todas com payment_verification_status='manual_confirmation'.
