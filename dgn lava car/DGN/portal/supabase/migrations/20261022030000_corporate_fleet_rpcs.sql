-- ---------------------------------------------------------------------------
-- CORPORATE FLEET — RPCs (Fase 2 Frotas B2B)
--
-- Padrão homologado:
--   * search_path = public, pg_temp
--   * grant execute só a service_role (sem anon/authenticated)
--   * p_actor_* obrigatório (fixado server-side antes do call)
--   * audit em crm_audit_logs (entity_type: crm_company, crm_company_manager,
--     crm_corporate_fleet_vehicle, crm_corporate_service_request)
--   * result_code textual estável
--
-- Isolamento: RPC verifica DENTRO que o manager_id tem a mesma company_id do
-- fleet_vehicle_id — se divergir, retorna COMPANY_MISMATCH (nunca cria pedido
-- em frota alheia). Zero RLS auth-based nesta fase; isolamento é 100% via
-- service_role + validação na RPC + validação no server (manager resolvido do
-- JWT antes do call).
-- ---------------------------------------------------------------------------

-- 1) company_create -------------------------------------------------------

create or replace function public.crm_company_create(
  p_legal_name    text,
  p_display_name  text,
  p_cnpj          text,
  p_contact_email text,
  p_contact_phone text,
  p_notes         text,
  p_actor         text
) returns table (
  result_code text,
  company_id  uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_actor      text := nullif(trim(p_actor), '');
  v_legal      text := nullif(trim(p_legal_name), '');
  v_display    text := nullif(trim(p_display_name), '');
  v_cnpj       text := nullif(trim(p_cnpj), '');
  v_email      text := nullif(trim(p_contact_email), '');
  v_phone      text := nullif(trim(p_contact_phone), '');
  v_notes      text := nullif(trim(p_notes), '');
  v_id         uuid;
begin
  if v_actor is null then
    raise exception 'p_actor obrigatório (fixado pelo endpoint admin)';
  end if;
  if v_legal is null then
    raise exception 'p_legal_name obrigatório';
  end if;
  if v_display is null then
    raise exception 'p_display_name obrigatório';
  end if;

  insert into public.crm_companies
    (legal_name, display_name, cnpj, contact_email, contact_phone, notes)
  values
    (v_legal, v_display, v_cnpj, v_email, v_phone, v_notes)
  returning id into v_id;

  insert into public.crm_audit_logs
    (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values
    ('crm_company', v_id, 'crm_company.created', null,
     jsonb_build_object('legal_name', v_legal, 'display_name', v_display, 'cnpj', v_cnpj),
     v_actor, 'company_create');

  return query select 'CREATED'::text, v_id;
end;
$fn$;

revoke all on function public.crm_company_create(text, text, text, text, text, text, text) from public;
grant execute on function public.crm_company_create(text, text, text, text, text, text, text) to service_role;

-- 2) company_manager_create ------------------------------------------------

create or replace function public.crm_company_manager_create(
  p_company_id    uuid,
  p_display_name  text,
  p_email         text,
  p_phone         text,
  p_auth_user_id  uuid,
  p_actor         text
) returns table (
  result_code text,
  manager_id  uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_actor   text := nullif(trim(p_actor), '');
  v_name    text := nullif(trim(p_display_name), '');
  v_email   text := nullif(trim(p_email), '');
  v_phone   text := nullif(trim(p_phone), '');
  v_id      uuid;
begin
  if v_actor is null then raise exception 'p_actor obrigatório (fixado pelo endpoint admin)'; end if;
  if v_name is null then raise exception 'p_display_name obrigatório'; end if;
  if v_email is null then raise exception 'p_email obrigatório'; end if;
  if p_company_id is null then raise exception 'p_company_id obrigatório'; end if;

  -- Pre-check de existência da company (FK devolveria 23503 que vira menos legível).
  if not exists (select 1 from public.crm_companies where id = p_company_id) then
    return query select 'COMPANY_NOT_FOUND'::text, null::uuid;
    return;
  end if;

  begin
    insert into public.crm_company_managers
      (company_id, auth_user_id, display_name, email, phone)
    values
      (p_company_id, p_auth_user_id, v_name, lower(v_email), v_phone)
    returning id into v_id;
  exception
    when unique_violation then
      return query select 'EMAIL_ALREADY_IN_COMPANY'::text, null::uuid;
      return;
  end;

  insert into public.crm_audit_logs
    (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values
    ('crm_company_manager', v_id, 'crm_company_manager.created', null,
     jsonb_build_object('company_id', p_company_id, 'email', lower(v_email), 'auth_user_id', p_auth_user_id),
     v_actor, 'manager_create');

  return query select 'CREATED'::text, v_id;
end;
$fn$;

revoke all on function public.crm_company_manager_create(uuid, text, text, text, uuid, text) from public;
grant execute on function public.crm_company_manager_create(uuid, text, text, text, uuid, text) to service_role;

-- 3) fleet_vehicle_create -------------------------------------------------

create or replace function public.crm_fleet_vehicle_create(
  p_company_id    uuid,
  p_plate         text,
  p_make          text,
  p_model         text,
  p_year          int,
  p_color         text,
  p_driver_name   text,
  p_nickname      text,
  p_notes         text,
  p_actor         text
) returns table (
  result_code text,
  vehicle_id  uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_actor  text := nullif(trim(p_actor), '');
  v_plate  text := nullif(trim(p_plate), '');
  v_make   text := nullif(trim(p_make), '');
  v_model  text := nullif(trim(p_model), '');
  v_color  text := nullif(trim(p_color), '');
  v_driver text := nullif(trim(p_driver_name), '');
  v_nick   text := nullif(trim(p_nickname), '');
  v_notes  text := nullif(trim(p_notes), '');
  v_id     uuid;
begin
  if v_actor is null then raise exception 'p_actor obrigatório'; end if;
  if p_company_id is null then raise exception 'p_company_id obrigatório'; end if;
  if v_plate is null then raise exception 'p_plate obrigatório'; end if;

  if not exists (select 1 from public.crm_companies where id = p_company_id) then
    return query select 'COMPANY_NOT_FOUND'::text, null::uuid;
    return;
  end if;

  begin
    insert into public.crm_company_fleet_vehicles
      (company_id, plate, make, model, year, color, driver_name, nickname, notes)
    values
      (p_company_id, upper(v_plate), v_make, v_model, p_year, v_color, v_driver, v_nick, v_notes)
    returning id into v_id;
  exception
    when unique_violation then
      return query select 'PLATE_ALREADY_IN_COMPANY'::text, null::uuid;
      return;
  end;

  insert into public.crm_audit_logs
    (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values
    ('crm_corporate_fleet_vehicle', v_id, 'crm_corporate_fleet_vehicle.created', null,
     jsonb_build_object('company_id', p_company_id, 'plate', upper(v_plate), 'driver_name', v_driver),
     v_actor, 'fleet_vehicle_create');

  return query select 'CREATED'::text, v_id;
end;
$fn$;

revoke all on function public.crm_fleet_vehicle_create(uuid, text, text, text, int, text, text, text, text, text) from public;
grant execute on function public.crm_fleet_vehicle_create(uuid, text, text, text, int, text, text, text, text, text) to service_role;

-- 4) corporate_request_create (manager → unit) ----------------------------

create or replace function public.crm_corporate_request_create(
  p_fleet_vehicle_id uuid,
  p_manager_id       uuid,
  p_service_type     text,
  p_preferred_date_1 timestamptz,
  p_preferred_date_2 timestamptz,
  p_manager_notes    text,
  p_actor            text
) returns table (
  result_code text,
  request_id  uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_actor       text := nullif(trim(p_actor), '');
  v_service     text := nullif(trim(p_service_type), '');
  v_notes       text := nullif(trim(p_manager_notes), '');
  v_company_fv  uuid;
  v_company_mgr uuid;
  v_mgr_active  boolean;
  v_id          uuid;
begin
  if v_actor is null then raise exception 'p_actor obrigatório'; end if;
  if v_service is null then raise exception 'p_service_type obrigatório'; end if;
  if p_fleet_vehicle_id is null then raise exception 'p_fleet_vehicle_id obrigatório'; end if;
  if p_manager_id is null then raise exception 'p_manager_id obrigatório'; end if;
  if p_preferred_date_1 is null then raise exception 'p_preferred_date_1 obrigatório'; end if;

  select company_id into v_company_fv
    from public.crm_company_fleet_vehicles where id = p_fleet_vehicle_id;
  if v_company_fv is null then
    return query select 'FLEET_VEHICLE_NOT_FOUND'::text, null::uuid;
    return;
  end if;

  select company_id, is_active into v_company_mgr, v_mgr_active
    from public.crm_company_managers where id = p_manager_id;
  if v_company_mgr is null then
    return query select 'MANAGER_NOT_FOUND'::text, null::uuid;
    return;
  end if;
  if not coalesce(v_mgr_active, false) then
    return query select 'MANAGER_INACTIVE'::text, null::uuid;
    return;
  end if;
  if v_company_fv <> v_company_mgr then
    return query select 'COMPANY_MISMATCH'::text, null::uuid;
    return;
  end if;

  insert into public.crm_corporate_service_requests
    (company_id, fleet_vehicle_id, requested_by_manager_id,
     service_type, preferred_date_1, preferred_date_2, manager_notes)
  values
    (v_company_fv, p_fleet_vehicle_id, p_manager_id,
     v_service, p_preferred_date_1, p_preferred_date_2, v_notes)
  returning id into v_id;

  insert into public.crm_audit_logs
    (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values
    ('crm_corporate_service_request', v_id, 'crm_corporate_service_request.created',
     null,
     jsonb_build_object('company_id', v_company_fv, 'fleet_vehicle_id', p_fleet_vehicle_id,
                        'service_type', v_service, 'preferred_date_1', p_preferred_date_1),
     v_actor, 'manager_request_create');

  return query select 'CREATED'::text, v_id;
end;
$fn$;

revoke all on function public.crm_corporate_request_create(uuid, uuid, text, timestamptz, timestamptz, text, text) from public;
grant execute on function public.crm_corporate_request_create(uuid, uuid, text, timestamptz, timestamptz, text, text) to service_role;

-- 5) corporate_request_confirm (unit → manager) ---------------------------

create or replace function public.crm_corporate_request_confirm(
  p_request_id   uuid,
  p_scheduled_at timestamptz,
  p_admin_notes  text,
  p_actor        text
) returns table (
  result_code text,
  request_id  uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_actor    text := nullif(trim(p_actor), '');
  v_notes    text := nullif(trim(p_admin_notes), '');
  v_status   public.crm_corporate_request_status;
  v_prev     jsonb;
begin
  if v_actor is null then raise exception 'p_actor obrigatório'; end if;
  if p_request_id is null then raise exception 'p_request_id obrigatório'; end if;
  if p_scheduled_at is null then raise exception 'p_scheduled_at obrigatório'; end if;

  select status, jsonb_build_object('status', status, 'scheduled_at', scheduled_at)
    into v_status, v_prev
    from public.crm_corporate_service_requests
   where id = p_request_id
   for update;

  if v_status is null then
    return query select 'NOT_FOUND'::text, null::uuid;
    return;
  end if;

  if v_status = 'confirmed' then
    return query select 'ALREADY_CONFIRMED'::text, p_request_id;
    return;
  end if;

  if v_status = 'cancelled' then
    return query select 'INVALID_STATE_TRANSITION'::text, p_request_id;
    return;
  end if;

  update public.crm_corporate_service_requests
     set status = 'confirmed',
         scheduled_at = p_scheduled_at,
         admin_notes = coalesce(v_notes, admin_notes),
         decided_by_actor = v_actor,
         decided_at = now()
   where id = p_request_id;

  insert into public.crm_audit_logs
    (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values
    ('crm_corporate_service_request', p_request_id,
     'crm_corporate_service_request.confirmed',
     v_prev,
     jsonb_build_object('status', 'confirmed', 'scheduled_at', p_scheduled_at),
     v_actor, 'admin_request_confirm');

  return query select 'UPDATED'::text, p_request_id;
end;
$fn$;

revoke all on function public.crm_corporate_request_confirm(uuid, timestamptz, text, text) from public;
grant execute on function public.crm_corporate_request_confirm(uuid, timestamptz, text, text) to service_role;

-- 6) corporate_request_counter_propose (unit → manager) -------------------

create or replace function public.crm_corporate_request_counter_propose(
  p_request_id   uuid,
  p_proposed_at  timestamptz,
  p_admin_notes  text,
  p_actor        text
) returns table (
  result_code text,
  request_id  uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_actor  text := nullif(trim(p_actor), '');
  v_notes  text := nullif(trim(p_admin_notes), '');
  v_status public.crm_corporate_request_status;
  v_prev   jsonb;
begin
  if v_actor is null then raise exception 'p_actor obrigatório'; end if;
  if p_request_id is null then raise exception 'p_request_id obrigatório'; end if;
  if p_proposed_at is null then raise exception 'p_proposed_at obrigatório'; end if;

  select status, jsonb_build_object('status', status, 'scheduled_at', scheduled_at)
    into v_status, v_prev
    from public.crm_corporate_service_requests
   where id = p_request_id
   for update;

  if v_status is null then
    return query select 'NOT_FOUND'::text, null::uuid;
    return;
  end if;

  if v_status in ('confirmed', 'cancelled') then
    return query select 'INVALID_STATE_TRANSITION'::text, p_request_id;
    return;
  end if;

  update public.crm_corporate_service_requests
     set status = 'counter_proposed',
         scheduled_at = p_proposed_at,
         admin_notes = coalesce(v_notes, admin_notes),
         decided_by_actor = v_actor,
         decided_at = now()
   where id = p_request_id;

  insert into public.crm_audit_logs
    (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values
    ('crm_corporate_service_request', p_request_id,
     'crm_corporate_service_request.counter_proposed',
     v_prev,
     jsonb_build_object('status', 'counter_proposed', 'scheduled_at', p_proposed_at),
     v_actor, 'admin_counter_propose');

  return query select 'UPDATED'::text, p_request_id;
end;
$fn$;

revoke all on function public.crm_corporate_request_counter_propose(uuid, timestamptz, text, text) from public;
grant execute on function public.crm_corporate_request_counter_propose(uuid, timestamptz, text, text) to service_role;

-- 7) corporate_request_accept_counter (manager → unit) -------------------

create or replace function public.crm_corporate_request_accept_counter(
  p_request_id uuid,
  p_manager_id uuid,
  p_actor      text
) returns table (
  result_code text,
  request_id  uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_actor    text := nullif(trim(p_actor), '');
  v_status   public.crm_corporate_request_status;
  v_prev     jsonb;
  v_req_mgr  uuid;
begin
  if v_actor is null then raise exception 'p_actor obrigatório'; end if;
  if p_request_id is null then raise exception 'p_request_id obrigatório'; end if;
  if p_manager_id is null then raise exception 'p_manager_id obrigatório'; end if;

  select status, requested_by_manager_id,
         jsonb_build_object('status', status, 'scheduled_at', scheduled_at)
    into v_status, v_req_mgr, v_prev
    from public.crm_corporate_service_requests
   where id = p_request_id
   for update;

  if v_status is null then
    return query select 'NOT_FOUND'::text, null::uuid;
    return;
  end if;

  if v_req_mgr <> p_manager_id then
    return query select 'MANAGER_MISMATCH'::text, p_request_id;
    return;
  end if;

  if v_status <> 'counter_proposed' then
    return query select 'INVALID_STATE_TRANSITION'::text, p_request_id;
    return;
  end if;

  update public.crm_corporate_service_requests
     set status = 'confirmed',
         decided_by_actor = v_actor,
         decided_at = now()
   where id = p_request_id;

  insert into public.crm_audit_logs
    (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values
    ('crm_corporate_service_request', p_request_id,
     'crm_corporate_service_request.counter_accepted',
     v_prev,
     jsonb_build_object('status', 'confirmed'),
     v_actor, 'manager_accept_counter');

  return query select 'UPDATED'::text, p_request_id;
end;
$fn$;

revoke all on function public.crm_corporate_request_accept_counter(uuid, uuid, text) from public;
grant execute on function public.crm_corporate_request_accept_counter(uuid, uuid, text) to service_role;

-- 8) corporate_request_cancel (manager or unit) ---------------------------

create or replace function public.crm_corporate_request_cancel(
  p_request_id uuid,
  p_reason     text,
  p_actor      text
) returns table (
  result_code text,
  request_id  uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_actor  text := nullif(trim(p_actor), '');
  v_reason text := nullif(trim(p_reason), '');
  v_status public.crm_corporate_request_status;
  v_prev   jsonb;
begin
  if v_actor is null then raise exception 'p_actor obrigatório'; end if;
  if v_reason is null then raise exception 'p_reason obrigatório'; end if;
  if p_request_id is null then raise exception 'p_request_id obrigatório'; end if;

  select status, jsonb_build_object('status', status, 'cancel_reason', cancel_reason)
    into v_status, v_prev
    from public.crm_corporate_service_requests
   where id = p_request_id
   for update;

  if v_status is null then
    return query select 'NOT_FOUND'::text, null::uuid;
    return;
  end if;

  if v_status = 'cancelled' then
    return query select 'ALREADY_CANCELLED'::text, p_request_id;
    return;
  end if;

  update public.crm_corporate_service_requests
     set status = 'cancelled',
         cancel_reason = v_reason,
         decided_by_actor = v_actor,
         decided_at = now()
   where id = p_request_id;

  insert into public.crm_audit_logs
    (entity_type, entity_id, action, previous_value, new_value, actor, reason)
  values
    ('crm_corporate_service_request', p_request_id,
     'crm_corporate_service_request.cancelled',
     v_prev,
     jsonb_build_object('status', 'cancelled', 'cancel_reason', v_reason),
     v_actor, 'request_cancel');

  return query select 'UPDATED'::text, p_request_id;
end;
$fn$;

revoke all on function public.crm_corporate_request_cancel(uuid, text, text) from public;
grant execute on function public.crm_corporate_request_cancel(uuid, text, text) to service_role;
