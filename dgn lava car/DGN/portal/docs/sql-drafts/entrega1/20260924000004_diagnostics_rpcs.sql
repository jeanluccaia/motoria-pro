-- ---------------------------------------------------------------------------
-- DGN Diagnósticos — Entrega 1, Migration 04 (RASCUNHO — NÃO APLICAR).
--
-- RPCs de escrita. Toda mutação relevante passa por aqui — nenhum endpoint
-- deve fazer INSERT/UPDATE direto nas tabelas.
--
-- Padrão geral:
--   * SECURITY DEFINER, search_path = public, pg_temp
--   * GRANT só a service_role (fluxo admin no server-side)
--   * p_actor obrigatório (fixado pelo endpoint depois de validar admin session)
--   * SET LOCAL "crm.actor" = p_actor para que o trigger de audit registre autor
--   * Optimistic locking em crm_diagnostics via p_expected_revision
--   * Retorno estruturado com result_code (nunca lançar exception por
--     conflito esperado — só por bug ou input inválido)
-- ---------------------------------------------------------------------------

-- 1) create_diagnostic_draft ------------------------------------------------

create or replace function public.crm_create_diagnostic_draft(
  p_customer_id     uuid,
  p_vehicle_id      uuid,
  p_catalog_version text,
  p_performed_by    text,
  p_actor           text
) returns table (result_code text, diagnostic_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_vehicle_owner uuid;
  v_new_id        uuid;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório';
  end if;
  perform set_config('crm.actor', p_actor, true);

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
    created_by, status, revision
  ) values (
    p_customer_id, p_vehicle_id, p_catalog_version, p_performed_by,
    p_actor, 'draft', 0
  ) returning id into v_new_id;

  result_code   := 'CREATED';
  diagnostic_id := v_new_id;
  return next;
end;
$fn$;

revoke all on function public.crm_create_diagnostic_draft(uuid, uuid, text, text, text) from public;
grant execute on function public.crm_create_diagnostic_draft(uuid, uuid, text, text, text) to service_role;

-- 2) patch_diagnostic_draft — optimistic locking --------------------------

create or replace function public.crm_patch_diagnostic_draft(
  p_diagnostic_id     uuid,
  p_expected_revision integer,
  p_patch             jsonb,       -- só chaves presentes viajam; ver docs
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
    result_code       := 'NOT_FOUND';
    new_revision      := null;
    current_revision  := null;
    return next; return;
  end if;

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

  -- Aplica só as chaves que vieram no patch. Validação semântica pesada
  -- (ex.: score 0..10 step 0.5) deve rodar antes de chamar a RPC (na camada
  -- de endpoint). Aqui só garantimos os shapes básicos.
  update public.crm_diagnostics
     set inspection_areas = coalesce(p_patch->'inspection_areas', inspection_areas),
         scores           = coalesce(p_patch->'scores',           scores),
         recommendations  = coalesce(p_patch->'recommendations',  recommendations),
         investment_items = coalesce(p_patch->'investment_items', investment_items),
         summary          = coalesce(p_patch->>'summary',         summary),
         public_visibility_defaults = coalesce(p_patch->'public_visibility_defaults', public_visibility_defaults),
         performed_by     = coalesce(p_patch->>'performed_by',    performed_by),
         performed_at     = coalesce((p_patch->>'performed_at')::date, performed_at),
         status           = coalesce((p_patch->>'status')::public.crm_diagnostic_status, status),
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
  p_actor             text
) returns table (result_code text, photo_id uuid, new_revision integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_current_revision integer;
  v_new_photo_id     uuid;
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
    result_code   := 'CONFLICT_REVISION_STALE';
    new_revision  := v_current_revision;
    return next; return;
  end if;

  insert into public.crm_diagnostic_photos (
    diagnostic_id, kind, area_key, storage_path, mime_type,
    size_bytes, caption, ordering, internal_only, uploaded_by
  ) values (
    p_diagnostic_id, p_kind, p_area_key, p_storage_path, p_mime_type,
    p_size_bytes, p_caption, coalesce(p_ordering, 0), coalesce(p_internal_only, false), p_actor
  ) returning id into v_new_photo_id;

  update public.crm_diagnostics set revision = revision + 1 where id = p_diagnostic_id;
  select revision into v_current_revision
    from public.crm_diagnostics where id = p_diagnostic_id;

  result_code  := 'OK';
  photo_id     := v_new_photo_id;
  new_revision := v_current_revision;
  return next;
end;
$fn$;

revoke all on function public.crm_attach_diagnostic_photo(uuid, integer, public.crm_diagnostic_photo_kind, text, text, text, integer, text, integer, boolean, text) from public;
grant execute on function public.crm_attach_diagnostic_photo(uuid, integer, public.crm_diagnostic_photo_kind, text, text, text, integer, text, integer, boolean, text) to service_role;

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

  select storage_path into v_storage_path
    from public.crm_diagnostic_photos
    where id = p_photo_id and diagnostic_id = p_diagnostic_id;
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

-- 5) publish_diagnostic — snapshot server-side ---------------------------
--
-- Aqui:
--   * Recalcula final_price_cents pra cada investment item.
--   * Monta full_payload (tudo) e public_payload (filtrado):
--       - Área com public_visible=false → removida do public.
--       - Foto com internal_only=true → removida do public.
--       - inspection_areas mantém apenas campos seguros (sem observação
--         quando NÃO pública).
--   * Insere nova versão com version_number = max+1.
--   * Marca crm_diagnostics.status = 'published' se ainda estava em draft.
--
-- Preço:
--   final = round(base * (1 - clamp(discount_percent, 0, 100)/100))
--
-- Se algum item vier sem base_price_cents, RPC lança exception.

create or replace function public.crm_publish_diagnostic(
  p_diagnostic_id     uuid,
  p_expected_revision integer,
  p_actor             text
) returns table (result_code text, version_id uuid, version_number integer, new_revision integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_current_revision integer;
  v_current_status   public.crm_diagnostic_status;
  v_diag             record;
  v_new_version_no   integer;
  v_new_version_id   uuid;
  v_full             jsonb;
  v_public           jsonb;
  v_areas_full       jsonb;
  v_areas_public     jsonb;
  v_photos_full      jsonb;
  v_photos_public    jsonb;
  v_scores_full      jsonb;
  v_recos_full       jsonb;
  v_invest_recalced  jsonb;
  v_invest_total     bigint := 0;
begin
  if p_actor is null or btrim(p_actor) = '' then
    raise exception 'p_actor obrigatório';
  end if;
  perform set_config('crm.actor', p_actor, true);

  select * into v_diag
    from public.crm_diagnostics where id = p_diagnostic_id
    for update;
  if not found then
    result_code := 'NOT_FOUND'; return next; return;
  end if;
  if v_diag.revision <> p_expected_revision then
    result_code  := 'CONFLICT_REVISION_STALE';
    new_revision := v_diag.revision;
    return next; return;
  end if;

  -- Fotos completas + fotos públicas (filtro server-side de internal_only)
  select coalesce(jsonb_agg(to_jsonb(p) order by p.ordering, p.uploaded_at), '[]'::jsonb)
    into v_photos_full
    from public.crm_diagnostic_photos p
    where p.diagnostic_id = p_diagnostic_id;

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'id', p.id,
             'kind', p.kind,
             'area_key', p.area_key,
             'storage_path', p.storage_path,
             'caption', p.caption,
             'ordering', p.ordering
           ) order by p.ordering, p.uploaded_at
         ), '[]'::jsonb)
    into v_photos_public
    from public.crm_diagnostic_photos p
    where p.diagnostic_id = p_diagnostic_id
      and p.internal_only = false;

  -- Áreas: preserva tudo em v_areas_full; em v_areas_public filtra
  -- public_visible=false e remove observação interna quando marcada.
  v_areas_full := v_diag.inspection_areas;

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'area_key', area->>'area_key',
             'condition', area->>'condition',
             'observation', case
               when (area->>'public_visible')::boolean is true then area->>'observation'
               else null
             end
           )
         ), '[]'::jsonb)
    into v_areas_public
    from jsonb_array_elements(v_diag.inspection_areas) as area
    where coalesce((area->>'public_visible')::boolean, false) = true
      and coalesce(area->>'condition', 'not_evaluated') <> 'not_evaluated';

  -- Scores: preserva. Média não é recalculada aqui — a UI faz.
  v_scores_full := v_diag.scores;

  -- Recomendações
  v_recos_full := v_diag.recommendations;

  -- Investimento: recalcula final_price_cents server-side.
  select coalesce(jsonb_agg(
           jsonb_build_object(
             'service_key',        item->>'service_key',
             'base_price_cents',   (item->>'base_price_cents')::bigint,
             'discount_percent',   least(100, greatest(0, coalesce((item->>'discount_percent')::int, 0))),
             'final_price_cents',
               round(
                 (item->>'base_price_cents')::bigint
                 * (100 - least(100, greatest(0, coalesce((item->>'discount_percent')::int, 0))))
                 / 100.0
               )::bigint,
             'installments', (item->>'installments')::int,
             'pix_eligible', coalesce((item->>'pix_eligible')::boolean, false),
             'note',         item->>'note'
           )
         ), '[]'::jsonb)
    into v_invest_recalced
    from jsonb_array_elements(v_diag.investment_items) as item;

  -- Total (só pra registrar no snapshot público)
  select coalesce(sum((it->>'final_price_cents')::bigint), 0)
    into v_invest_total
    from jsonb_array_elements(v_invest_recalced) as it;

  -- Monta payloads
  v_full := jsonb_build_object(
    'diagnostic_id', v_diag.id,
    'customer_id',   v_diag.customer_id,
    'vehicle_id',    v_diag.vehicle_id,
    'catalog_version', v_diag.catalog_version,
    'performed_by',  v_diag.performed_by,
    'performed_at',  v_diag.performed_at,
    'summary',       v_diag.summary,
    'inspection_areas', v_areas_full,
    'scores',           v_scores_full,
    'recommendations',  v_recos_full,
    'investment_items', v_invest_recalced,
    'photos',           v_photos_full,
    'public_visibility_defaults', v_diag.public_visibility_defaults
  );

  v_public := jsonb_build_object(
    'catalog_version', v_diag.catalog_version,
    'performed_at',    v_diag.performed_at,
    'summary',         v_diag.summary,
    'inspection_areas',
      case when (v_diag.public_visibility_defaults->>'show_areas')::boolean
             is not false then v_areas_public else '[]'::jsonb end,
    'scores',
      case when (v_diag.public_visibility_defaults->>'show_scores')::boolean
             is not false then v_scores_full else '[]'::jsonb end,
    'recommendations', v_recos_full,
    'investment_items',
      case when (v_diag.public_visibility_defaults->>'show_investment')::boolean
             is not false then v_invest_recalced else '[]'::jsonb end,
    'investment_total_cents', v_invest_total,
    'photos', v_photos_public
  );

  -- Determina próximo version_number
  select coalesce(max(version_number), 0) + 1
    into v_new_version_no
    from public.crm_diagnostic_versions
    where diagnostic_id = p_diagnostic_id;

  insert into public.crm_diagnostic_versions (
    diagnostic_id, version_number, catalog_version, published_by,
    full_payload, public_payload, source_revision
  ) values (
    p_diagnostic_id, v_new_version_no, v_diag.catalog_version, p_actor,
    v_full, v_public, v_diag.revision
  ) returning id into v_new_version_id;

  update public.crm_diagnostics
     set status = 'published',
         revision = revision + 1
   where id = p_diagnostic_id;

  select revision into v_current_revision from public.crm_diagnostics where id = p_diagnostic_id;

  result_code    := 'PUBLISHED';
  version_id     := v_new_version_id;
  version_number := v_new_version_no;
  new_revision   := v_current_revision;
  return next;
end;
$fn$;

revoke all on function public.crm_publish_diagnostic(uuid, integer, text) from public;
grant execute on function public.crm_publish_diagnostic(uuid, integer, text) to service_role;
