-- ---------------------------------------------------------------------------
-- DGN Diagnósticos — Entrega 2, Migration 02 (RASCUNHO — NÃO APLICAR).
--
-- crm_publish_diagnostic: recebe o rascunho corrente, monta os payloads
-- full/public server-side, cria nova versão IMUTÁVEL (constraint física via
-- trigger em crm_diagnostic_versions).
--
-- Regras invioláveis (fixadas no checkpoint):
--   * internal_notes NUNCA entra em public_payload — filtrado aqui.
--   * public_notes só entra quando public_visible=true na área.
--   * public_visible=false remove a área inteira do public_payload.
--   * final_price_cents é RECALCULADO no server a partir de base_price_cents
--     e discount_percent, ignorando qualquer valor do client.
--   * Se base_price_cents diverge de catalog_reference_price_cents, exige
--     override_reason não-vazio no item; RPC lança se estiver vazio (a UI
--     e o endpoint já validam antes, mas essa é a última linha de defesa).
--   * Optimistic locking preservado — p_expected_revision obrigatório.
-- ---------------------------------------------------------------------------

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
  v_diag             record;
  v_new_version_no   integer;
  v_new_version_id   uuid;
  v_full             jsonb;
  v_public           jsonb;
  v_areas_public     jsonb;
  v_photos_full      jsonb;
  v_photos_public    jsonb;
  v_invest_recalced  jsonb;
  v_invest_total     bigint := 0;
  v_bad_override     text;
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

  -- Última linha de defesa: se algum item de investimento tem base divergente
  -- do catálogo sem override_reason, aborta.
  select item->>'service_key' into v_bad_override
    from jsonb_array_elements(v_diag.investment_items) as item
    where coalesce((item->>'base_price_cents')::bigint, 0)
       <> coalesce((item->>'catalog_reference_price_cents')::bigint, 0)
      and coalesce(btrim(item->>'override_reason'), '') = ''
    limit 1;
  if v_bad_override is not null then
    raise exception 'investment_item %: base_price_cents diverge do catálogo sem override_reason', v_bad_override;
  end if;

  -- Fotos completas + filtro server-side de internal_only pra pública.
  select coalesce(jsonb_agg(to_jsonb(p) order by p.ordering, p.uploaded_at), '[]'::jsonb)
    into v_photos_full
    from public.crm_diagnostic_photos p
    where p.diagnostic_id = p_diagnostic_id;

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'id',           p.id,
             'kind',         p.kind,
             'area_key',     p.area_key,
             'storage_path', p.storage_path,
             'caption',      p.caption,
             'ordering',     p.ordering
           ) order by p.ordering, p.uploaded_at
         ), '[]'::jsonb)
    into v_photos_public
    from public.crm_diagnostic_photos p
    where p.diagnostic_id = p_diagnostic_id
      and p.internal_only = false;

  -- Áreas públicas: só as com public_visible=true E condition <> not_evaluated.
  -- internal_notes NUNCA sai. public_notes só se public_visible.
  select coalesce(jsonb_agg(
           jsonb_build_object(
             'area_key',     area->>'area_key',
             'condition',    area->>'condition',
             'public_notes', case
               when coalesce((area->>'public_visible')::boolean, false)
               then area->>'public_notes'
               else null
             end
           )
         ), '[]'::jsonb)
    into v_areas_public
    from jsonb_array_elements(v_diag.inspection_areas) as area
    where coalesce((area->>'public_visible')::boolean, false) = true
      and coalesce(area->>'condition', 'not_evaluated') <> 'not_evaluated';

  -- Recalcula final_price_cents server-side (client hint é ignorado).
  select coalesce(jsonb_agg(
           jsonb_build_object(
             'service_key',                    item->>'service_key',
             'catalog_version',                item->>'catalog_version',
             'catalog_reference_price_cents',  (item->>'catalog_reference_price_cents')::bigint,
             'base_price_cents',               (item->>'base_price_cents')::bigint,
             'discount_percent',
               least(100, greatest(0, coalesce((item->>'discount_percent')::int, 0))),
             'final_price_cents',
               round(
                 (item->>'base_price_cents')::bigint
                 * (100 - least(100, greatest(0, coalesce((item->>'discount_percent')::int, 0))))
                 / 100.0
               )::bigint,
             'installments', (item->>'installments')::int,
             'pix_eligible', coalesce((item->>'pix_eligible')::boolean, false),
             'note',            item->>'note',
             'override_reason', item->>'override_reason'
           )
         ), '[]'::jsonb)
    into v_invest_recalced
    from jsonb_array_elements(v_diag.investment_items) as item;

  select coalesce(sum((it->>'final_price_cents')::bigint), 0)
    into v_invest_total
    from jsonb_array_elements(v_invest_recalced) as it;

  -- full_payload preserva TODOS os campos internos (auditoria/curador).
  v_full := jsonb_build_object(
    'diagnostic_id',    v_diag.id,
    'customer_id',      v_diag.customer_id,
    'vehicle_id',       v_diag.vehicle_id,
    'catalog_version',  v_diag.catalog_version,
    'performed_by',     v_diag.performed_by,
    'performed_at',     v_diag.performed_at,
    'summary',          v_diag.summary,
    'inspection_areas', v_diag.inspection_areas,   -- inclui internal_notes
    'scores',           v_diag.scores,
    'recommendations',  v_diag.recommendations,
    'investment_items', v_invest_recalced,
    'photos',           v_photos_full,             -- inclui internal_only=true
    'public_visibility_defaults', v_diag.public_visibility_defaults
  );

  -- public_payload: filtrado. É o ÚNICO que a rota /diagnostico/[slug] lê.
  v_public := jsonb_build_object(
    'catalog_version', v_diag.catalog_version,
    'performed_at',    v_diag.performed_at,
    'summary',         v_diag.summary,
    'inspection_areas',
      case when (v_diag.public_visibility_defaults->>'show_areas')::boolean
             is not false then v_areas_public else '[]'::jsonb end,
    'scores',
      case when (v_diag.public_visibility_defaults->>'show_scores')::boolean
             is not false then v_diag.scores else '[]'::jsonb end,
    'recommendations', v_diag.recommendations,
    'investment_items',
      case when (v_diag.public_visibility_defaults->>'show_investment')::boolean
             is not false then v_invest_recalced else '[]'::jsonb end,
    'investment_total_cents', v_invest_total,
    'photos', v_photos_public
  );

  -- version_number sequencial por diagnostic_id.
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
     set status   = 'published',
         revision = revision + 1
   where id = p_diagnostic_id;

  select revision into v_current_revision
    from public.crm_diagnostics where id = p_diagnostic_id;

  result_code    := 'PUBLISHED';
  version_id     := v_new_version_id;
  version_number := v_new_version_no;
  new_revision   := v_current_revision;
  return next;
end;
$fn$;

revoke all on function public.crm_publish_diagnostic(uuid, integer, text) from public;
grant execute on function public.crm_publish_diagnostic(uuid, integer, text) to service_role;
