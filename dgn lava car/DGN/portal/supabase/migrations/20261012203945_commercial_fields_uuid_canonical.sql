-- LOTE A — Fase 0 reconciliação 4U×Portal (2026-10-12)
--
-- Causa raiz: a assinatura anterior `crm_update_customer_commercial_fields`
-- filtrava `where legacy_id = p_customer_legacy_id`. Clientes importados do
-- PagBank (ex.: Viviane Tabata Manja 47e85bf5-85de-456f-b90d-753e295ccaf1,
-- José Sergio Bressan Jr, Daniele Dullius, Bruno Rossetti) foram criados com
-- legacy_id = NULL. O mapper `growth-reader.ts` expõe esses clientes com
-- `DgnCustomer.id = UUID`, e a UI mandava esse UUID direto para a RPC. Como
-- não havia linha com legacy_id = UUID-string, a RPC devolvia P0002 →
-- "Cliente ou registro comercial inexistente".
--
-- Correção canônica: ADICIONA uma nova sobrecarga `crm_update_customer_commercial_fields`
-- com `p_customer_id uuid` como parâmetro primário, filtrando por `where id = p_customer_id`.
-- O endpoint resolve slug|UUID → UUID antes de chamar (padrão já usado em
-- appointments-write.ts). A sobrecarga antiga (text) permanece disponível para
-- não quebrar o código em produção durante a janela de deploy — PostgREST
-- roteia por nome de parâmetro.
--
-- Preservado:
--   - security invoker, search_path = public, grants apenas service_role.
--   - Audit log: entity_id = v_customer_id (UUID), action = 'commercial_fields.updated'.
--   - Concorrência otimista (updated_at = p_expected_updated_at ou 40001).
--   - Bootstrap silencioso de crm_campaign_members (defaults inertes).
--   - No-op (nenhuma mudança) não cria audit log.
--
-- Migration é idempotente: `create or replace function` com assinatura nova.
-- Rollback: drop function (assinatura uuid, ...).

create or replace function public.crm_update_customer_commercial_fields(
  p_customer_id uuid,
  p_owner text,
  p_commercial_notes text,
  p_next_action text,
  p_next_action_at timestamptz,
  p_priority integer,
  p_expected_updated_at timestamptz,
  p_actor text,
  p_origin text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_member public.crm_campaign_members%rowtype;
  v_updated public.crm_campaign_members%rowtype;
  v_previous jsonb;
  v_next jsonb;
  v_changed boolean;
  v_bootstrapped boolean := false;
begin
  if p_customer_id is null then
    raise exception using errcode = '22023', message = 'customerId obrigatório';
  end if;
  if p_owner is null or btrim(p_owner) = '' or length(p_owner) > 80 then
    raise exception using errcode = '22023', message = 'responsável inválido';
  end if;
  if p_commercial_notes is not null and length(p_commercial_notes) > 2000 then
    raise exception using errcode = '22023', message = 'observação comercial excede 2000 caracteres';
  end if;
  if p_next_action is not null and length(p_next_action) > 240 then
    raise exception using errcode = '22023', message = 'próxima ação excede 240 caracteres';
  end if;
  if p_priority is null or p_priority not between 1 and 4 then
    raise exception using errcode = '22023', message = 'prioridade inválida';
  end if;
  if p_actor is null or btrim(p_actor) = '' then
    raise exception using errcode = '22023', message = 'ator obrigatório';
  end if;

  select id into v_customer_id
  from public.crm_customers
  where id = p_customer_id;

  if v_customer_id is null then
    raise exception using errcode = 'P0002', message = 'cliente inexistente';
  end if;

  select * into v_member
  from public.crm_campaign_members
  where customer_id = v_customer_id
    and campaign_id = 'founders-2026'
  for update;

  if not found then
    -- Bootstrap silencioso: primeiro save cria o vínculo com defaults inertes.
    -- Não aprova Founder, não ocupa número, não altera status.
    insert into public.crm_campaign_members(campaign_id, customer_id)
      values('founders-2026', v_customer_id)
      returning * into v_member;
    v_bootstrapped := true;
  else
    if p_expected_updated_at is null
      or v_member.updated_at is distinct from p_expected_updated_at then
      raise exception using
        errcode = '40001',
        message = 'registro alterado por outra sessão; recarregue os dados';
    end if;
  end if;

  v_previous := jsonb_build_object(
    'owner', v_member.owner,
    'commercialNotes', v_member.commercial_notes,
    'nextAction', v_member.next_action,
    'nextActionAt', v_member.next_action_at,
    'priority', case v_member.priority
      when 1 then 'baixa' when 2 then 'normal'
      when 3 then 'alta' when 4 then 'urgente' else null end
  );

  v_next := jsonb_build_object(
    'owner', btrim(p_owner),
    'commercialNotes', nullif(p_commercial_notes, ''),
    'nextAction', nullif(btrim(coalesce(p_next_action, '')), ''),
    'nextActionAt', p_next_action_at,
    'priority', case p_priority
      when 1 then 'baixa' when 2 then 'normal'
      when 3 then 'alta' when 4 then 'urgente' end
  );

  v_changed := v_previous is distinct from v_next;

  if not v_changed then
    return jsonb_build_object(
      'changed', false,
      'customerId', v_customer_id,
      'commercial', v_next || jsonb_build_object('updatedAt', v_member.updated_at, 'bootstrapped', v_bootstrapped)
    );
  end if;

  update public.crm_campaign_members
  set owner = btrim(p_owner),
      commercial_notes = nullif(p_commercial_notes, ''),
      next_action = nullif(btrim(coalesce(p_next_action, '')), ''),
      next_action_at = p_next_action_at,
      priority = p_priority
  where id = v_member.id
  returning * into v_updated;

  insert into public.crm_audit_logs (
    entity_type,
    entity_id,
    action,
    previous_value,
    new_value,
    actor,
    reason
  ) values (
    'customer',
    v_customer_id,
    'commercial_fields.updated',
    v_previous,
    v_next,
    btrim(p_actor),
    'origin=' || coalesce(nullif(btrim(p_origin), ''), 'dgn-growth-admin')
      || case when v_bootstrapped then '; bootstrap=true' else '' end
  );

  return jsonb_build_object(
    'changed', true,
    'customerId', v_customer_id,
    'commercial', v_next || jsonb_build_object('updatedAt', v_updated.updated_at, 'bootstrapped', v_bootstrapped)
  );
end;
$$;

revoke all on function public.crm_update_customer_commercial_fields(
  uuid, text, text, text, timestamptz, integer, timestamptz, text, text
) from public, anon, authenticated;

grant execute on function public.crm_update_customer_commercial_fields(
  uuid, text, text, text, timestamptz, integer, timestamptz, text, text
) to service_role;
