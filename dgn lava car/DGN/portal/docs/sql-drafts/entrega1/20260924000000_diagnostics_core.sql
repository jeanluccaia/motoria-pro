-- ---------------------------------------------------------------------------
-- DGN Diagnósticos — Entrega 1, Migration 00 (RASCUNHO — NÃO APLICAR).
--
-- Core do módulo: enums, tabela raiz `crm_diagnostics` com JSONB rico,
-- tabela `crm_diagnostic_photos`, triggers de `updated_at`, e trigger de
-- audit em `crm_audit_logs` (mesmo padrão usado por assinaturas).
--
-- Filosofia:
--   * `crm_diagnostics` guarda inspection_areas, scores, recommendations e
--     investment_items como JSONB — nunca são lidos/escritos isolados.
--   * Fotos são tabela separada porque precisam de storage_path, ordering
--     e ownership por foto individual.
--   * `revision INT` habilita optimistic locking (ver RPCs no arquivo 04).
--   * Nenhum acesso direto: RLS forçada, sem policies pra anon/authenticated.
--     Só service_role (usado pelos endpoints admin) enxerga.
-- ---------------------------------------------------------------------------

-- 1) Enums ------------------------------------------------------------------

do $$ begin
  create type public.crm_diagnostic_status as enum (
    'draft',          -- rascunho, editável, autosave ativo
    'review_ready',   -- marcado como pronto pra revisão (não obrigatório)
    'published',      -- há pelo menos 1 versão em crm_diagnostic_versions
    'archived'        -- retirado de listas operacionais; histórico preservado
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_diagnostic_area_condition as enum (
    'not_evaluated',              -- padrão; não conta em severidade
    'good',
    'attention',
    'intervention_recommended'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_diagnostic_recommendation_priority as enum (
    'opcional',
    'recomendado',
    'prioritario'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_diagnostic_photo_kind as enum (
    'inspection',      -- foto de área de inspeção (padrão)
    'hero',            -- foto ilustrativa do carro no hero
    'reference'        -- referência técnica interna
  );
exception when duplicate_object then null; end $$;

-- 2) Tabela raiz `crm_diagnostics` ------------------------------------------

create table if not exists public.crm_diagnostics (
  id uuid primary key default gen_random_uuid(),

  -- Vinculação (sempre obrigatória — Diagnóstico não existe sem cliente+veículo)
  customer_id uuid not null references public.crm_customers (id) on delete restrict,
  vehicle_id  uuid not null references public.crm_vehicles  (id) on delete restrict,

  -- Estado + optimistic locking
  status         public.crm_diagnostic_status not null default 'draft',
  revision       integer not null default 0,     -- incrementa a cada RPC de escrita
  catalog_version text not null,                 -- ex.: "diag-v1-2026-09"

  -- Autor + datas operacionais
  performed_by  text not null,                   -- avaliador (ex.: "Gianluca")
  performed_at  date,                            -- data da avaliação (nullable = ainda não realizada)

  -- Conteúdo denso — JSONB. Estrutura documentada em docs/entrega-1-endpoints.md.
  inspection_areas  jsonb not null default '[]'::jsonb,
  scores            jsonb not null default '[]'::jsonb,  -- {criterion_key, score:null|0-10 step 0.5}
  recommendations   jsonb not null default '[]'::jsonb,
  investment_items  jsonb not null default '[]'::jsonb,  -- final_price_cents recalculado no publish

  -- Texto voltado ao cliente
  summary text not null default '',              -- parágrafo curto

  -- Visibilidade padrão do rascunho para a próxima publicação
  public_visibility_defaults jsonb not null default
    '{"show_areas":true,"show_scores":true,"show_investment":true}'::jsonb,

  -- Timestamps + autoria
  created_by text not null,                      -- actor da criação
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraints defensivas
  constraint crm_diagnostics_status_not_null check (status is not null),
  constraint crm_diagnostics_revision_nonneg  check (revision >= 0),
  constraint crm_diagnostics_catalog_version_nonempty check (btrim(catalog_version) <> '')
);

comment on table public.crm_diagnostics is
  'DGN Diagnósticos — raiz. inspection_areas/scores/recommendations/investment_items são JSONB validados pela RPC. Nunca gravar direto do client — passar por RPC.';

comment on column public.crm_diagnostics.revision is
  'Optimistic locking. Cada RPC de escrita exige p_expected_revision. Se diverge, devolve CONFLICT_REVISION_STALE sem gravar.';

comment on column public.crm_diagnostics.scores is
  'Array [{criterion_key, score}]. score é number OR null. NULL nunca vira 0 na média — a UI e as RPCs devem preservar semântica de ausência.';

create index if not exists idx_diagnostics_customer   on public.crm_diagnostics (customer_id, updated_at desc);
create index if not exists idx_diagnostics_vehicle    on public.crm_diagnostics (vehicle_id,  updated_at desc);
create index if not exists idx_diagnostics_status     on public.crm_diagnostics (status)
  where status in ('draft','review_ready');

-- 3) Tabela `crm_diagnostic_photos` ----------------------------------------

create table if not exists public.crm_diagnostic_photos (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id uuid not null references public.crm_diagnostics (id) on delete cascade,

  kind          public.crm_diagnostic_photo_kind not null default 'inspection',
  area_key      text,                                  -- só faz sentido pra kind='inspection'
  storage_path  text not null,                         -- '<customer_id>/<diagnostic_id>/<uuid>.<ext>'
  mime_type     text not null,
  size_bytes    integer not null,
  caption       text,
  ordering      integer not null default 0,
  internal_only boolean not null default false,        -- true = NUNCA sai em snapshot público

  uploaded_by   text not null,
  uploaded_at   timestamptz not null default now(),

  constraint crm_diag_photos_size_positive check (size_bytes > 0),
  constraint crm_diag_photos_size_max      check (size_bytes <= 10 * 1024 * 1024),   -- 10 MB (igual vehicle-photos)
  constraint crm_diag_photos_mime_allowed  check (mime_type in ('image/jpeg','image/png','image/webp')),
  constraint crm_diag_photos_area_when_inspection check (
    kind <> 'inspection' or area_key is not null
  )
);

comment on table public.crm_diagnostic_photos is
  'Fotos de diagnóstico. internal_only=true jamais entra em snapshot público — filtro é server-side na RPC de publicação.';

create index if not exists idx_diag_photos_diagnostic
  on public.crm_diagnostic_photos (diagnostic_id, ordering, uploaded_at);
create index if not exists idx_diag_photos_area
  on public.crm_diagnostic_photos (diagnostic_id, area_key)
  where area_key is not null;

-- 4) Trigger updated_at ----------------------------------------------------

create or replace function public.crm_diagnostics_touch_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

drop trigger if exists trg_diagnostics_touch_updated_at on public.crm_diagnostics;
create trigger trg_diagnostics_touch_updated_at
  before update on public.crm_diagnostics
  for each row execute function public.crm_diagnostics_touch_updated_at();

-- 5) Trigger de audit em crm_audit_logs -----------------------------------

create or replace function public.crm_diagnostics_audit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_actor text;
begin
  -- actor é injetado por SET LOCAL "crm.actor" pelas RPCs; fallback null pra
  -- writes vindos direto por operador Postgres (nunca deve ocorrer em prod).
  begin
    v_actor := current_setting('crm.actor', true);
  exception when others then
    v_actor := null;
  end;

  insert into public.crm_audit_logs (
    entity_type, entity_id, action, previous_value, new_value, actor
  ) values (
    'diagnostic',
    coalesce(new.id, old.id),
    tg_op,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end,
    coalesce(v_actor, 'system:unknown')
  );
  return coalesce(new, old);
end;
$fn$;

drop trigger if exists trg_diagnostics_audit on public.crm_diagnostics;
create trigger trg_diagnostics_audit
  after insert or update or delete on public.crm_diagnostics
  for each row execute function public.crm_diagnostics_audit();

drop trigger if exists trg_diagnostic_photos_audit on public.crm_diagnostic_photos;
create trigger trg_diagnostic_photos_audit
  after insert or update or delete on public.crm_diagnostic_photos
  for each row execute function public.crm_diagnostics_audit();

-- 6) RLS forçada — sem policies pra anon/authenticated --------------------

alter table public.crm_diagnostics       enable row level security;
alter table public.crm_diagnostics       force row level security;
alter table public.crm_diagnostic_photos enable row level security;
alter table public.crm_diagnostic_photos force row level security;

-- Sem CREATE POLICY: nenhum papel enxerga por default.
-- service_role (usado pelo backend admin) tem BYPASSRLS por convenção Supabase.

revoke all on public.crm_diagnostics       from public, anon, authenticated;
revoke all on public.crm_diagnostic_photos from public, anon, authenticated;

grant select, insert, update, delete on public.crm_diagnostics       to service_role;
grant select, insert, update, delete on public.crm_diagnostic_photos to service_role;
