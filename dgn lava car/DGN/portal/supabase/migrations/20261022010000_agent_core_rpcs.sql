-- ---------------------------------------------------------------------------
-- AGENT CORE — RPCs (Etapa 1 Fundação)
--
-- Seis RPCs SECURITY DEFINER para o Agent Core. Padrão homologado:
--   * search_path = public, pg_temp
--   * grant execute só a service_role
--   * p_actor obrigatório (fixado pelo endpoint admin server-side)
--   * before/after em crm_audit_logs com entity_type='agent_action'|'agent_campaign'
--   * result_code textual estável — nunca lançar exception pra fluxo normal
--     (exception reservada para violação de contrato: FK, actor vazio, etc.)
--   * SQLSTATE P0001 + HINT quando precisar sinalizar conflito intencional
--     (PostgREST faz retry em 40001; ver feedback_postgrest_retry_40001)
--
-- Result codes:
--   CREATED, UPDATED, NO_CHANGE,
--   ALREADY_APPROVED, ALREADY_REJECTED, ALREADY_EXECUTED,
--   NOT_FOUND, INVALID_STATE_TRANSITION
-- ---------------------------------------------------------------------------

-- 1) agent_action_create ----------------------------------------------------

create or replace function public.agent_action_create(
  p_kind               public.agent_action_kind,
  p_target_customer_id uuid,
  p_title              text,
  p_reason             text,
  p_recommendation     text,
  p_source_tool        text,
  p_actor              text,
  p_next_step          text,
  p_expected_benefit   text,
  p_payload            jsonb,
  p_dedupe_key         text,
  p_expires_at         timestamptz,
  p_source_run_id      text,
  p_target_campaign_id uuid
) returns table (result_code text, action_id uuid, existing_action_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_new_id      uuid;
  v_existing_id uuid;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório (fixado pelo endpoint admin)';
  end if;
  if p_source_tool is null or btrim(p_source_tool) = '' then
    raise exception 'p_source_tool obrigatório';
  end if;
  if p_title is null or btrim(p_title) = '' then
    raise exception 'p_title obrigatório';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'p_reason obrigatório';
  end if;
  if p_recommendation is null or btrim(p_recommendation) = '' then
    raise exception 'p_recommendation obrigatório';
  end if;

  if p_target_customer_id is not null
     and not exists (select 1 from public.crm_customers where id = p_target_customer_id) then
    raise exception 'customer % inexistente', p_target_customer_id;
  end if;

  if p_target_campaign_id is not null
     and not exists (select 1 from public.agent_campaigns where id = p_target_campaign_id) then
    raise exception 'campaign % inexistente', p_target_campaign_id;
  end if;

  -- Dedupe conservador: só impede ações vivas (pending_review | approved).
  if p_dedupe_key is not null and p_target_customer_id is not null then
    select id into v_existing_id
    from public.agent_actions
    where kind = p_kind
      and target_customer_id = p_target_customer_id
      and dedupe_key = p_dedupe_key
      and status in ('pending_review', 'approved')
    order by created_at desc
    limit 1;

    if v_existing_id is not null then
      return query select 'NO_CHANGE'::text, null::uuid, v_existing_id;
      return;
    end if;
  end if;

  insert into public.agent_actions (
    kind, status, target_customer_id, target_campaign_id,
    title, reason, recommendation, next_step, expected_benefit,
    payload, source_tool, source_run_id, created_by_agent,
    dedupe_key, expires_at
  ) values (
    p_kind, 'pending_review'::public.agent_action_status,
    p_target_customer_id, p_target_campaign_id,
    p_title, p_reason, p_recommendation, p_next_step, p_expected_benefit,
    coalesce(p_payload, '{}'::jsonb), p_source_tool, p_source_run_id, true,
    p_dedupe_key, p_expires_at
  ) returning id into v_new_id;

  insert into public.crm_audit_logs (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values (
    'agent_action', v_new_id, 'agent_action.created',
    null,
    to_jsonb((select a from public.agent_actions a where a.id = v_new_id)),
    p_actor,
    p_source_tool
  );

  return query select 'CREATED'::text, v_new_id, null::uuid;
end;
$fn$;

revoke all on function public.agent_action_create(
  public.agent_action_kind, uuid, text, text, text, text, text,
  text, text, jsonb, text, timestamptz, text, uuid
) from public;
grant execute on function public.agent_action_create(
  public.agent_action_kind, uuid, text, text, text, text, text,
  text, text, jsonb, text, timestamptz, text, uuid
) to service_role;


-- 2) agent_action_approve ---------------------------------------------------

create or replace function public.agent_action_approve(
  p_action_id uuid,
  p_actor     text,
  p_reason    text
) returns table (result_code text, action_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_before public.agent_actions;
  v_after  public.agent_actions;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório';
  end if;

  select * into v_before from public.agent_actions where id = p_action_id;
  if not found then
    return query select 'NOT_FOUND'::text, null::uuid;
    return;
  end if;

  if v_before.status = 'approved' then
    return query select 'ALREADY_APPROVED'::text, v_before.id;
    return;
  end if;

  if v_before.status <> 'pending_review' then
    return query select 'INVALID_STATE_TRANSITION'::text, v_before.id;
    return;
  end if;

  update public.agent_actions
     set status = 'approved',
         reviewed_by = p_actor,
         reviewed_at = now(),
         review_reason = p_reason
   where id = p_action_id
   returning * into v_after;

  insert into public.crm_audit_logs (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values (
    'agent_action', v_after.id, 'agent_action.approved',
    to_jsonb(v_before), to_jsonb(v_after),
    p_actor, p_reason
  );

  return query select 'UPDATED'::text, v_after.id;
end;
$fn$;

revoke all on function public.agent_action_approve(uuid, text, text) from public;
grant execute on function public.agent_action_approve(uuid, text, text) to service_role;


-- 3) agent_action_reject ----------------------------------------------------

create or replace function public.agent_action_reject(
  p_action_id uuid,
  p_actor     text,
  p_reason    text
) returns table (result_code text, action_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_before public.agent_actions;
  v_after  public.agent_actions;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'p_reason obrigatório na rejeição';
  end if;

  select * into v_before from public.agent_actions where id = p_action_id;
  if not found then
    return query select 'NOT_FOUND'::text, null::uuid;
    return;
  end if;

  if v_before.status = 'rejected' then
    return query select 'ALREADY_REJECTED'::text, v_before.id;
    return;
  end if;

  if v_before.status not in ('pending_review', 'approved') then
    return query select 'INVALID_STATE_TRANSITION'::text, v_before.id;
    return;
  end if;

  update public.agent_actions
     set status = 'rejected',
         reviewed_by = p_actor,
         reviewed_at = now(),
         review_reason = p_reason
   where id = p_action_id
   returning * into v_after;

  insert into public.crm_audit_logs (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values (
    'agent_action', v_after.id, 'agent_action.rejected',
    to_jsonb(v_before), to_jsonb(v_after),
    p_actor, p_reason
  );

  return query select 'UPDATED'::text, v_after.id;
end;
$fn$;

revoke all on function public.agent_action_reject(uuid, text, text) from public;
grant execute on function public.agent_action_reject(uuid, text, text) to service_role;


-- 4) agent_action_mark_executed --------------------------------------------

create or replace function public.agent_action_mark_executed(
  p_action_id     uuid,
  p_actor         text,
  p_execution_ref text
) returns table (result_code text, action_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_before public.agent_actions;
  v_after  public.agent_actions;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório';
  end if;

  select * into v_before from public.agent_actions where id = p_action_id;
  if not found then
    return query select 'NOT_FOUND'::text, null::uuid;
    return;
  end if;

  if v_before.status = 'executed' then
    return query select 'ALREADY_EXECUTED'::text, v_before.id;
    return;
  end if;

  -- Só executa a partir de approved; se ainda pending_review precisa aprovar antes.
  if v_before.status <> 'approved' then
    return query select 'INVALID_STATE_TRANSITION'::text, v_before.id;
    return;
  end if;

  update public.agent_actions
     set status = 'executed',
         executed_at = now(),
         execution_ref = p_execution_ref
   where id = p_action_id
   returning * into v_after;

  insert into public.crm_audit_logs (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values (
    'agent_action', v_after.id, 'agent_action.executed',
    to_jsonb(v_before), to_jsonb(v_after),
    p_actor, coalesce(p_execution_ref, '')
  );

  return query select 'UPDATED'::text, v_after.id;
end;
$fn$;

revoke all on function public.agent_action_mark_executed(uuid, text, text) from public;
grant execute on function public.agent_action_mark_executed(uuid, text, text) to service_role;


-- 5) agent_campaign_upsert_draft -------------------------------------------
-- Upsert conservador: se p_campaign_id for null → cria; se não null e status='draft'
-- → atualiza. Status terminal (approved/paused/archived) é imutável por esta RPC.

create or replace function public.agent_campaign_upsert_draft(
  p_campaign_id        uuid,
  p_name               text,
  p_objective          text,
  p_audience_rules     jsonb,
  p_estimated_audience int,
  p_draft_message      text,
  p_suggested_channel  text,
  p_source_tool        text,
  p_actor              text
) returns table (result_code text, campaign_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_new_id uuid;
  v_before public.agent_campaigns;
  v_after  public.agent_campaigns;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório';
  end if;
  if p_source_tool is null or btrim(p_source_tool) = '' then
    raise exception 'p_source_tool obrigatório';
  end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception 'p_name obrigatório';
  end if;
  if p_objective is null or btrim(p_objective) = '' then
    raise exception 'p_objective obrigatório';
  end if;

  if p_campaign_id is null then
    insert into public.agent_campaigns (
      name, objective, audience_rules, estimated_audience,
      draft_message, suggested_channel, source_tool, created_by_agent
    ) values (
      p_name, p_objective, coalesce(p_audience_rules, '{}'::jsonb), p_estimated_audience,
      p_draft_message, p_suggested_channel, p_source_tool, true
    ) returning id into v_new_id;

    insert into public.crm_audit_logs (entity_type, entity_id, action, previous_value, new_value, actor, reason)
    values (
      'agent_campaign', v_new_id, 'agent_campaign.draft_created',
      null,
      to_jsonb((select c from public.agent_campaigns c where c.id = v_new_id)),
      p_actor,
      p_source_tool
    );

    return query select 'CREATED'::text, v_new_id;
    return;
  end if;

  select * into v_before from public.agent_campaigns where id = p_campaign_id;
  if not found then
    return query select 'NOT_FOUND'::text, null::uuid;
    return;
  end if;

  if v_before.status <> 'draft' then
    return query select 'INVALID_STATE_TRANSITION'::text, v_before.id;
    return;
  end if;

  update public.agent_campaigns
     set name = p_name,
         objective = p_objective,
         audience_rules = coalesce(p_audience_rules, v_before.audience_rules),
         estimated_audience = p_estimated_audience,
         draft_message = p_draft_message,
         suggested_channel = p_suggested_channel
   where id = p_campaign_id
   returning * into v_after;

  -- NO_CHANGE: comparação total ignorando updated_at/created_at.
  if row(v_before.name, v_before.objective, v_before.audience_rules,
         v_before.estimated_audience, v_before.draft_message, v_before.suggested_channel)
     is not distinct from
     row(v_after.name, v_after.objective, v_after.audience_rules,
         v_after.estimated_audience, v_after.draft_message, v_after.suggested_channel) then
    return query select 'NO_CHANGE'::text, v_after.id;
    return;
  end if;

  insert into public.crm_audit_logs (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values (
    'agent_campaign', v_after.id, 'agent_campaign.draft_updated',
    to_jsonb(v_before), to_jsonb(v_after),
    p_actor, p_source_tool
  );

  return query select 'UPDATED'::text, v_after.id;
end;
$fn$;

revoke all on function public.agent_campaign_upsert_draft(
  uuid, text, text, jsonb, int, text, text, text, text
) from public;
grant execute on function public.agent_campaign_upsert_draft(
  uuid, text, text, jsonb, int, text, text, text, text
) to service_role;


-- 6) agent_campaign_approve ------------------------------------------------

create or replace function public.agent_campaign_approve(
  p_campaign_id uuid,
  p_actor       text
) returns table (result_code text, campaign_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_before public.agent_campaigns;
  v_after  public.agent_campaigns;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório';
  end if;

  select * into v_before from public.agent_campaigns where id = p_campaign_id;
  if not found then
    return query select 'NOT_FOUND'::text, null::uuid;
    return;
  end if;

  if v_before.status = 'approved' then
    return query select 'ALREADY_APPROVED'::text, v_before.id;
    return;
  end if;

  if v_before.status <> 'draft' then
    return query select 'INVALID_STATE_TRANSITION'::text, v_before.id;
    return;
  end if;

  update public.agent_campaigns
     set status = 'approved',
         approved_by = p_actor,
         approved_at = now()
   where id = p_campaign_id
   returning * into v_after;

  insert into public.crm_audit_logs (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values (
    'agent_campaign', v_after.id, 'agent_campaign.approved',
    to_jsonb(v_before), to_jsonb(v_after),
    p_actor, 'approved by human reviewer'
  );

  return query select 'UPDATED'::text, v_after.id;
end;
$fn$;

revoke all on function public.agent_campaign_approve(uuid, text) from public;
grant execute on function public.agent_campaign_approve(uuid, text) to service_role;
