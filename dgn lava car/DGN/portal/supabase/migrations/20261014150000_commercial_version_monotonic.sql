-- LOTE A — Fase 1 versionamento monotônico (2026-10-14)
--
-- Troca a concorrência otimista baseada em `updated_at` (precisão timestamp,
-- sujeita a round-trip JS Date → ms) por uma coluna `version bigint`
-- incrementada a cada UPDATE. Zero ambiguidade de tempo.
--
-- Convive com as duas sobrecargas anteriores:
--   crm_update_customer_commercial_fields(text, ..., timestamptz, ...)  -- 20260717180000
--   crm_update_customer_commercial_fields(uuid, ..., timestamptz, ...)  -- 20261012203945
--
-- Esta migration ADICIONA uma terceira sobrecarga:
--   crm_update_customer_commercial_fields(uuid, ..., bigint, ...)  -- este arquivo
--
-- PostgREST roteia por nome de parâmetro: o endpoint que passar
-- `p_expected_version` cai na nova; o que ainda passar `p_expected_updated_at`
-- cai na antiga. Zero quebra durante a janela de deploy.
--
-- Comportamento preservado:
--   security invoker; search_path = public; grants apenas service_role.
--   Audit log em UPDATE real; no-op não cria audit.
--   Bootstrap silencioso de crm_campaign_members (defaults inertes).
--
-- Rollback: drop function (uuid, ..., bigint, ...) + alter table drop column version.

-- 1. Coluna de versão monotônica.
alter table public.crm_campaign_members
  add column if not exists version bigint not null default 0;

-- 2. Trigger de incremento. Em BEFORE UPDATE, após trg_crm_campaign_members_touch
--    (ordem alfabética do nome: trg_crm_campaign_members_touch < trg_crm_campaign_members_version),
--    o Postgres garante que ambos rodam antes do UPDATE efetivar. Operações no mesmo
--    row dentro da mesma transação ainda compartilham now() mas versões crescem.
create or replace function public.crm_campaign_members_bump_version() returns trigger
language plpgsql
as $$
begin
  new.version := coalesce(old.version, 0) + 1;
  return new;
end;
$$;

drop trigger if exists trg_crm_campaign_members_version on public.crm_campaign_members;
create trigger trg_crm_campaign_members_version
  before update on public.crm_campaign_members
  for each row execute function public.crm_campaign_members_bump_version();

-- 3. Nova sobrecarga RPC com p_expected_version bigint.
create or replace function public.crm_update_customer_commercial_fields(
  p_customer_id uuid,
  p_owner text,
  p_commercial_notes text,
  p_next_action text,
  p_next_action_at timestamptz,
  p_priority integer,
  p_expected_version bigint,
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
    -- Bootstrap silencioso: primeiro save cria o vínculo com defaults inertes
    -- e version=0. Não aprova Founder, não ocupa número, não altera status.
    insert into public.crm_campaign_members(campaign_id, customer_id)
      values('founders-2026', v_customer_id)
      returning * into v_member;
    v_bootstrapped := true;
  else
    -- Concorrência monotônica: p_expected_version precisa bater com o atual.
    -- Primeira UI leitura carrega version=N; se outra sessão escreveu entre a
    -- leitura e o save, v_member.version virou N+1 (ou mais) → conflito.
    if p_expected_version is null
      or v_member.version is distinct from p_expected_version then
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
      'commercial', v_next || jsonb_build_object(
        'updatedAt', v_member.updated_at,
        'version', v_member.version,
        'bootstrapped', v_bootstrapped
      )
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
    'commercial', v_next || jsonb_build_object(
      'updatedAt', v_updated.updated_at,
      'version', v_updated.version,
      'bootstrapped', v_bootstrapped
    )
  );
end;
$$;

revoke all on function public.crm_update_customer_commercial_fields(
  uuid, text, text, text, timestamptz, integer, bigint, text, text
) from public, anon, authenticated;

grant execute on function public.crm_update_customer_commercial_fields(
  uuid, text, text, text, timestamptz, integer, bigint, text, text
) to service_role;
