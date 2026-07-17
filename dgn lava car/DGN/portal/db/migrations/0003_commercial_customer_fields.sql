-- DGN Growth: primeira persistência comercial controlada.
-- Mantém os campos no vínculo comercial existente (crm_campaign_members),
-- sem duplicá-los em crm_customers.

alter table public.crm_campaign_members
  alter column next_action_at type timestamptz
  using (
    case
      when next_action_at is null then null
      else next_action_at::timestamp at time zone 'UTC'
    end
  );

alter table public.crm_campaign_members
  drop constraint if exists crm_campaign_members_priority_range;

alter table public.crm_campaign_members
  add constraint crm_campaign_members_priority_range
  check (priority is null or priority between 1 and 4);

create index if not exists idx_crm_campaign_members_priority
  on public.crm_campaign_members (priority, next_action_at)
  where priority is not null;

create or replace function public.crm_update_customer_commercial_fields(
  p_customer_legacy_id text,
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
begin
  if p_customer_legacy_id is null or btrim(p_customer_legacy_id) = '' then
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
  where legacy_id = btrim(p_customer_legacy_id);

  if v_customer_id is null then
    raise exception using errcode = 'P0002', message = 'cliente inexistente';
  end if;

  select * into v_member
  from public.crm_campaign_members
  where customer_id = v_customer_id
    and campaign_id = 'founders-2026';

  if not found then
    raise exception using errcode = 'P0002', message = 'registro comercial inexistente';
  end if;

  if p_expected_updated_at is null
    or v_member.updated_at is distinct from p_expected_updated_at then
    raise exception using
      errcode = '40001',
      message = 'registro alterado por outra sessão; recarregue os dados';
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
      'customerId', p_customer_legacy_id,
      'commercial', v_next || jsonb_build_object('updatedAt', v_member.updated_at)
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
  );

  return jsonb_build_object(
    'changed', true,
    'customerId', p_customer_legacy_id,
    'commercial', v_next || jsonb_build_object('updatedAt', v_updated.updated_at)
  );
end;
$$;

revoke all on function public.crm_update_customer_commercial_fields(
  text, text, text, text, timestamptz, integer, timestamptz, text, text
) from public, anon, authenticated;

grant execute on function public.crm_update_customer_commercial_fields(
  text, text, text, text, timestamptz, integer, timestamptz, text, text
) to service_role;
