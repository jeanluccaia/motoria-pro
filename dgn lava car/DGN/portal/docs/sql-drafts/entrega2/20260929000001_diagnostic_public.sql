-- ---------------------------------------------------------------------------
-- DGN Diagnósticos — Entrega 1, Migration 02 (RASCUNHO — NÃO APLICAR).
--
-- Schema pra link privado + tracking. O SCHEMA vai nesta migration para
-- consolidar o desenho, mas a ROTA pública (/diagnostico/[slug]) e o
-- endpoint de eventos são construídos apenas na Entrega 2 — com token,
-- expiração, revogação e rate limit iguais aos do Founder.
--
-- Espelha `crm_founder_public_links` e `crm_founder_public_events`.
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.crm_diagnostic_public_event_kind as enum (
    'page_view',
    'interest_click',
    'whatsapp_click',
    'decline_click'
  );
exception when duplicate_object then null; end $$;

-- Link opaco --------------------------------------------------------------

create table if not exists public.crm_diagnostic_public_links (
  id uuid primary key default gen_random_uuid(),

  -- Aponta pra versão IMUTÁVEL (nunca pra crm_diagnostics diretamente).
  version_id uuid not null references public.crm_diagnostic_versions (id) on delete restrict,

  -- Slug opaco: nanoid FIXO em 22 chars, base [a-z0-9] (regra do checkpoint).
  -- Não vaza cliente/veículo. Não enumerável.
  slug text not null,

  enabled     boolean     not null default true,
  is_test     boolean     not null default false,
  expires_at  timestamptz,                        -- NULL = sem expiração (aceita, mas UI avisa)
  revoked_at  timestamptz,
  revoked_by  text,
  revoked_reason text,

  created_by  text not null,
  created_at  timestamptz not null default now(),

  constraint crm_diag_public_links_slug_format
    check (slug ~ '^[a-z0-9]{22}$'),
  constraint crm_diag_public_links_slug_unique
    unique (slug),
  constraint crm_diag_public_links_revoke_pair
    check ((revoked_at is null and revoked_by is null) or (revoked_at is not null and revoked_by is not null))
);

comment on table public.crm_diagnostic_public_links is
  'Link privado do diagnóstico. Aponta pra versão imutável — nunca pra draft. Slug opaco não enumerável.';

create index if not exists idx_diag_public_links_version
  on public.crm_diagnostic_public_links (version_id);
create index if not exists idx_diag_public_links_active
  on public.crm_diagnostic_public_links (slug)
  where enabled = true and revoked_at is null;

alter table public.crm_diagnostic_public_links enable row level security;
alter table public.crm_diagnostic_public_links force  row level security;
revoke all on public.crm_diagnostic_public_links from public, anon, authenticated;
grant select, insert, update on public.crm_diagnostic_public_links to service_role;
-- DELETE proibido — revogação é UPDATE (revoked_at/by/reason), preserva histórico.

drop trigger if exists trg_diag_public_links_audit on public.crm_diagnostic_public_links;
create trigger trg_diag_public_links_audit
  after insert or update on public.crm_diagnostic_public_links
  for each row execute function public.crm_diagnostics_audit();

-- Eventos (append-only) --------------------------------------------------

create table if not exists public.crm_diagnostic_public_events (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.crm_diagnostic_public_links (id) on delete restrict,

  event_kind          public.crm_diagnostic_public_event_kind not null,
  anonymous_visitor_id uuid,                     -- cookie no client, opaco
  dedupe_key           text not null,            -- visitor:slug:kind:janela-30min
  occurred_at          timestamptz not null default now(),
  created_at           timestamptz not null default now(),

  constraint crm_diag_public_events_dedupe_unique
    unique (dedupe_key)
);

comment on table public.crm_diagnostic_public_events is
  'Eventos da página pública. Append-only. dedupe_key = visitor+link+kind+bucket-30min. NUNCA UPDATE/DELETE via app.';

create index if not exists idx_diag_public_events_by_link
  on public.crm_diagnostic_public_events (link_id, occurred_at desc);

alter table public.crm_diagnostic_public_events enable row level security;
alter table public.crm_diagnostic_public_events force  row level security;
revoke all on public.crm_diagnostic_public_events from public, anon, authenticated;
grant select, insert on public.crm_diagnostic_public_events to service_role;
-- Sem UPDATE/DELETE mesmo pra service_role.

-- Trigger que bloqueia UPDATE/DELETE fisicamente
create or replace function public.crm_diagnostic_public_events_forbid_mutation()
returns trigger
language plpgsql
as $fn$
begin
  raise exception 'crm_diagnostic_public_events é append-only';
end;
$fn$;

drop trigger if exists trg_diag_public_events_forbid_update on public.crm_diagnostic_public_events;
create trigger trg_diag_public_events_forbid_update
  before update on public.crm_diagnostic_public_events
  for each row execute function public.crm_diagnostic_public_events_forbid_mutation();

drop trigger if exists trg_diag_public_events_forbid_delete on public.crm_diagnostic_public_events;
create trigger trg_diag_public_events_forbid_delete
  before delete on public.crm_diagnostic_public_events
  for each row execute function public.crm_diagnostic_public_events_forbid_mutation();
