-- ---------------------------------------------------------------------------
-- DGN Diagnósticos — Entrega 1, Migration 02 (RASCUNHO — NÃO APLICAR).
--
-- RPCs de escrita da Entrega 1. `crm_publish_diagnostic` NÃO faz parte
-- desta entrega — está adiada para a Entrega 2 junto com `crm_diagnostic_versions`,
-- `crm_diagnostic_public_links`, `crm_diagnostic_public_events` e a rota
-- pública `/diagnostico/[slug]`.
--
-- Padrão geral (mesmo de assinaturas):
--   * SECURITY DEFINER, search_path = public, pg_temp
--   * Dono = postgres (herança do apply_migration MCP). Como service_role só
--     tem SELECT nas tabelas, TODA escrita passa por estas RPCs — elas
--     rodam como postgres (BYPASSRLS + INSERT/UPDATE/DELETE herdados).
--   * GRANT EXECUTE só pra service_role (fluxo admin no server-side).
--   * p_actor obrigatório (fixado pelo endpoint depois de validar admin session)
--   * SET LOCAL "crm.actor" pra o trigger de audit registrar autor
--   * Optimistic locking em crm_diagnostics via p_expected_revision
--   * Retorno estruturado com result_code (nunca lançar exception por
--     conflito esperado — só por bug ou input inválido)
--
-- Idempotência (regra do checkpoint):
--   * crm_diagnostics.idempotency_key existe pra suportar Idempotency-Key
--     nos endpoints POST. Colisão é resolvida por unique parcial no schema.
--   * crm_diagnostic_photos.idempotency_key idem.
--
-- Autoridade de preço (regra do checkpoint):
--   * final_price_cents NUNCA é autoridade do client. UI mostra hint
--     calculado, mas o server descarta e recalcula em Entrega 2.
--   * base_price_cents só pode divergir de catalog_reference_price_cents
--     se override_reason não-vazio vier junto. Endpoint valida ANTES de
--     chamar patch_draft; RPC apenas persiste o array como veio (o audit
--     do trigger registra qualquer divergência).
-- ---------------------------------------------------------------------------

-- 1) create_diagnostic_draft ------------------------------------------------

create or replace function public.crm_create_diagnostic_draft(
  p_customer_id     uuid,
  p_vehicle_id      uuid,
  p_catalog_version text,
  p_performed_by    text,
  p_actor           text,
  p_idempotency_key text
) returns table (result_code text, diagnostic_id uuid, is_replay boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_vehicle_owner uuid;
  v_new_id        uuid;
  v_existing_id   uuid;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório';
  end if;
  perform set_config('crm.actor', p_actor, true);

  if p_idempotency_key is null or btrim(p_idempotency_key) = '' then
    raise exception 'p_idempotency_key obrigatório';
  end if;

  -- Replay do mesmo POST (mesma actor + mesma chave) devolve o rascunho já
  -- criado, sem gravar nada novo.
  select id into v_existing_id
    from public.crm_diagnostics
    where idempotency_key = p_idempotency_key
      and created_by = p_actor;
  if v_existing_id is not null then
    result_code   := 'REPLAY';
    diagnostic_id := v_existing_id;
    is_replay     := true;
    return next; return;
  end if;

  if not exists (select 1 from public.crm_customers where id = p_customer_id) then
    raise exception 'customer % inexistente', p_customer_id;
  end if;

  select customer_id into v_vehicle_owner
    from public.crm_vehicles where id = p_vehicle_id;
  if v_vehicle_owner is null then
    raise exception 'vehicle % inexistente', p_vehicle_id;
  end if;
  if v_vehicle_owner <> p_customer_id then
    raise exception 'vehicle % não pertence ao customer %', p_vehicle_id, p_customer_id;
  end if;

  insert into public.crm_diagnostics (
    customer_id, vehicle_id, catalog_version, performed_by,
    created_by, status, revision, idempotency_key
  ) values (
    p_customer_id, p_vehicle_id, p_catalog_version, p_performed_by,
    p_actor, 'draft', 0, p_idempotency_key
  ) returning id into v_new_id;

  result_code   := 'CREATED';
  diagnostic_id := v_new_id;
  is_replay     := false;
  return next;
end;
$fn$;

revoke all on function public.crm_create_diagnostic_draft(uuid, uuid, text, text, text, text) from public;
grant execute on function public.crm_create_diagnostic_draft(uuid, uuid, text, text, text, text) to service_role;

-- 2) patch_diagnostic_draft — optimistic locking --------------------------

create or replace function public.crm_patch_diagnostic_draft(
  p_diagnostic_id     uuid,
  p_expected_revision integer,
  p_patch             jsonb,       -- só chaves presentes viajam
  p_actor             text
) returns table (result_code text, new_revision integer, current_revision integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_current_revision integer;
  v_current_status   public.crm_diagnostic_status;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório';
  end if;
  perform set_config('crm.actor', p_actor, true);

  select revision, status
    into v_current_revision, v_current_status
    from public.crm_diagnostics where id = p_diagnostic_id
    for update;

  if v_current_revision is null then
    result_code := 'NOT_FOUND';
    return next; return;
  end if;

  -- Na Entrega 1 só 'draft' e 'review_ready' são editáveis. 'published' e
  -- 'archived' ficam pra Entrega 2 (com regras próprias).
  if v_current_status not in ('draft', 'review_ready') then
    result_code      := 'STATUS_NOT_EDITABLE';
    new_revision     := v_current_revision;
    current_revision := v_current_revision;
    return next; return;
  end if;

  if v_current_revision <> p_expected_revision then
    result_code      := 'CONFLICT_REVISION_STALE';
    new_revision     := v_current_revision;
    current_revision := v_current_revision;
    return next; return;
  end if;

  -- Semântica final (validada pelos testes da branch):
  --   * chave AUSENTE     → preserva atual
  --   * chave PRESENTE=null → preserva atual (idem)
  --   * chave PRESENTE=valor → substitui pelo valor
  -- IMPORTANTE: `coalesce(p_patch->'k', col)` era um BUG — quando o cliente
  -- passa {"k": null}, o operador `->` retorna JSONB null (não SQL NULL) e
  -- o coalesce NÃO substitui, corrompendo a coluna. Aqui usamos `?` +
  -- `jsonb_typeof <> 'null'` para tratar os dois casos.
  update public.crm_diagnostics
     set inspection_areas = case
           when p_patch ? 'inspection_areas' and jsonb_typeof(p_patch->'inspection_areas') <> 'null'
             then p_patch->'inspection_areas' else inspection_areas end,
         scores = case
           when p_patch ? 'scores' and jsonb_typeof(p_patch->'scores') <> 'null'
             then p_patch->'scores' else scores end,
         recommendations = case
           when p_patch ? 'recommendations' and jsonb_typeof(p_patch->'recommendations') <> 'null'
             then p_patch->'recommendations' else recommendations end,
         investment_items = case
           when p_patch ? 'investment_items' and jsonb_typeof(p_patch->'investment_items') <> 'null'
             then p_patch->'investment_items' else investment_items end,
         public_visibility_defaults = case
           when p_patch ? 'public_visibility_defaults' and jsonb_typeof(p_patch->'public_visibility_defaults') <> 'null'
             then p_patch->'public_visibility_defaults' else public_visibility_defaults end,
         summary          = case
           when p_patch ? 'summary' and jsonb_typeof(p_patch->'summary') <> 'null'
             then p_patch->>'summary' else summary end,
         performed_by     = case
           when p_patch ? 'performed_by' and jsonb_typeof(p_patch->'performed_by') <> 'null'
             then p_patch->>'performed_by' else performed_by end,
         performed_at     = case
           when p_patch ? 'performed_at' and jsonb_typeof(p_patch->'performed_at') <> 'null'
             then (p_patch->>'performed_at')::date else performed_at end,
         status           = case
           when p_patch ? 'status' and jsonb_typeof(p_patch->'status') <> 'null'
             then (p_patch->>'status')::public.crm_diagnostic_status else status end,
         revision         = revision + 1
   where id = p_diagnostic_id;

  select revision into v_current_revision
    from public.crm_diagnostics where id = p_diagnostic_id;

  result_code      := 'OK';
  new_revision     := v_current_revision;
  current_revision := v_current_revision;
  return next;
end;
$fn$;

revoke all on function public.crm_patch_diagnostic_draft(uuid, integer, jsonb, text) from public;
grant execute on function public.crm_patch_diagnostic_draft(uuid, integer, jsonb, text) to service_role;

-- 3) attach_diagnostic_photo ---------------------------------------------

create or replace function public.crm_attach_diagnostic_photo(
  p_diagnostic_id     uuid,
  p_expected_revision integer,
  p_kind              public.crm_diagnostic_photo_kind,
  p_area_key          text,               -- NULL se kind <> 'inspection'
  p_storage_path      text,
  p_mime_type         text,
  p_size_bytes        integer,
  p_caption           text,
  p_ordering          integer,
  p_internal_only     boolean,
  p_actor             text,
  p_idempotency_key   text
) returns table (result_code text, photo_id uuid, new_revision integer, is_replay boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_current_revision integer;
  v_new_photo_id     uuid;
  v_existing_photo   uuid;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório';
  end if;
  perform set_config('crm.actor', p_actor, true);

  if p_idempotency_key is null or btrim(p_idempotency_key) = '' then
    raise exception 'p_idempotency_key obrigatório';
  end if;

  -- Replay (mesma actor + mesma chave + mesmo diagnostic).
  select id into v_existing_photo
    from public.crm_diagnostic_photos
    where diagnostic_id = p_diagnostic_id
      and idempotency_key = p_idempotency_key
      and uploaded_by = p_actor;
  if v_existing_photo is not null then
    select revision into v_current_revision
      from public.crm_diagnostics where id = p_diagnostic_id;
    result_code  := 'REPLAY';
    photo_id     := v_existing_photo;
    new_revision := v_current_revision;
    is_replay    := true;
    return next; return;
  end if;

  select revision into v_current_revision
    from public.crm_diagnostics where id = p_diagnostic_id
    for update;
  if v_current_revision is null then
    result_code := 'NOT_FOUND'; is_replay := false;
    return next; return;
  end if;
  if v_current_revision <> p_expected_revision then
    result_code   := 'CONFLICT_REVISION_STALE';
    new_revision  := v_current_revision;
    is_replay     := false;
    return next; return;
  end if;

  insert into public.crm_diagnostic_photos (
    diagnostic_id, kind, area_key, storage_path, mime_type,
    size_bytes, caption, ordering, internal_only, uploaded_by, idempotency_key
  ) values (
    p_diagnostic_id, p_kind, p_area_key, p_storage_path, p_mime_type,
    p_size_bytes, p_caption, coalesce(p_ordering, 0), coalesce(p_internal_only, false),
    p_actor, p_idempotency_key
  ) returning id into v_new_photo_id;

  update public.crm_diagnostics set revision = revision + 1 where id = p_diagnostic_id;
  select revision into v_current_revision
    from public.crm_diagnostics where id = p_diagnostic_id;

  result_code  := 'OK';
  photo_id     := v_new_photo_id;
  new_revision := v_current_revision;
  is_replay    := false;
  return next;
end;
$fn$;

revoke all on function public.crm_attach_diagnostic_photo(uuid, integer, public.crm_diagnostic_photo_kind, text, text, text, integer, text, integer, boolean, text, text) from public;
grant execute on function public.crm_attach_diagnostic_photo(uuid, integer, public.crm_diagnostic_photo_kind, text, text, text, integer, text, integer, boolean, text, text) to service_role;

-- 4) detach_diagnostic_photo ---------------------------------------------

create or replace function public.crm_detach_diagnostic_photo(
  p_diagnostic_id     uuid,
  p_expected_revision integer,
  p_photo_id          uuid,
  p_actor             text
) returns table (result_code text, storage_path text, new_revision integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_current_revision integer;
  v_storage_path     text;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório';
  end if;
  perform set_config('crm.actor', p_actor, true);

  select revision into v_current_revision
    from public.crm_diagnostics where id = p_diagnostic_id
    for update;
  if v_current_revision is null then
    result_code := 'NOT_FOUND'; return next; return;
  end if;
  if v_current_revision <> p_expected_revision then
    result_code  := 'CONFLICT_REVISION_STALE';
    new_revision := v_current_revision;
    return next; return;
  end if;

  -- Alias explícito (p.storage_path) — evita ambiguidade com a coluna
  -- output "storage_path" declarada em RETURNS TABLE. Bug real capturado
  -- pelos testes da branch.
  select p.storage_path into v_storage_path
    from public.crm_diagnostic_photos p
    where p.id = p_photo_id and p.diagnostic_id = p_diagnostic_id;
  if v_storage_path is null then
    result_code := 'PHOTO_NOT_FOUND'; return next; return;
  end if;

  delete from public.crm_diagnostic_photos where id = p_photo_id;
  update public.crm_diagnostics set revision = revision + 1 where id = p_diagnostic_id;
  select revision into v_current_revision from public.crm_diagnostics where id = p_diagnostic_id;

  result_code  := 'OK';
  storage_path := v_storage_path;   -- endpoint remove do bucket após confirmação
  new_revision := v_current_revision;
  return next;
end;
$fn$;

revoke all on function public.crm_detach_diagnostic_photo(uuid, integer, uuid, text) from public;
grant execute on function public.crm_detach_diagnostic_photo(uuid, integer, uuid, text) to service_role;

-- crm_publish_diagnostic → docs/sql-drafts/entrega2/20260929000002_diagnostic_publish_rpc.sql
