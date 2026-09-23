-- ---------------------------------------------------------------------------
-- DGN Diagnósticos — Entrega 1, Migration 01 (RASCUNHO — NÃO APLICAR).
--
-- Versão publicada, IMUTÁVEL de verdade — a trilha crítica que impede
-- correção silenciosa depois que o cliente já viu.
--
-- Regras:
--   * INSERT permitido apenas pela RPC `crm_publish_diagnostic`
--     (que roda SECURITY DEFINER e SET LOCAL "crm.actor").
--   * UPDATE e DELETE bloqueados por trigger. A UI/RPC não têm caminho
--     legítimo pra editar; correção = nova versão.
--   * `public_payload` já vem FILTRADO server-side (sem internal_only).
--     A rota /diagnostico/[slug] lê essa coluna e nada mais — nunca faz
--     JOIN com `crm_diagnostics` na renderização pública.
-- ---------------------------------------------------------------------------

create table if not exists public.crm_diagnostic_versions (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id uuid not null references public.crm_diagnostics (id) on delete restrict,

  version_number integer not null,             -- 1, 2, 3, … por diagnostic_id
  catalog_version text not null,
  published_by   text not null,
  published_at   timestamptz not null default now(),

  -- Snapshot COMPLETO do estado no momento da publicação — inclui tudo que
  -- é interno também (referência para curador/audit).
  full_payload    jsonb not null,

  -- Snapshot FILTRADO — o que a página pública lê. Fotos com internal_only
  -- e áreas com public_visible=false já removidas. Investment items com
  -- final_price_cents recalculado server-side.
  public_payload  jsonb not null,

  -- Publicação origem: qual revisão do rascunho gerou esta versão.
  source_revision integer not null,

  constraint crm_diag_versions_source_revision_nonneg check (source_revision >= 0),
  constraint crm_diag_versions_unique_number         unique (diagnostic_id, version_number)
);

comment on table public.crm_diagnostic_versions is
  'Versões publicadas dos diagnósticos. IMUTÁVEIS por trigger — nova correção = novo INSERT com version_number+1.';

create index if not exists idx_diag_versions_by_diagnostic
  on public.crm_diagnostic_versions (diagnostic_id, version_number desc);

-- Trigger de imutabilidade: bloqueia UPDATE e DELETE no fluxo normal. --------

create or replace function public.crm_diagnostic_versions_forbid_mutation()
returns trigger
language plpgsql
as $fn$
begin
  raise exception 'crm_diagnostic_versions é imutável — correção = nova versão via crm_publish_diagnostic'
    using errcode = 'P0001';
end;
$fn$;

drop trigger if exists trg_diag_versions_forbid_update on public.crm_diagnostic_versions;
create trigger trg_diag_versions_forbid_update
  before update on public.crm_diagnostic_versions
  for each row execute function public.crm_diagnostic_versions_forbid_mutation();

drop trigger if exists trg_diag_versions_forbid_delete on public.crm_diagnostic_versions;
create trigger trg_diag_versions_forbid_delete
  before delete on public.crm_diagnostic_versions
  for each row execute function public.crm_diagnostic_versions_forbid_mutation();

-- Audit de INSERT via mesmo trigger geral --------------------------------

drop trigger if exists trg_diag_versions_audit on public.crm_diagnostic_versions;
create trigger trg_diag_versions_audit
  after insert on public.crm_diagnostic_versions
  for each row execute function public.crm_diagnostics_audit();

-- RLS ---------------------------------------------------------------------

alter table public.crm_diagnostic_versions enable row level security;
alter table public.crm_diagnostic_versions force  row level security;

revoke all on public.crm_diagnostic_versions from public, anon, authenticated;
grant  select, insert on public.crm_diagnostic_versions to service_role;
-- Intencionalmente sem UPDATE/DELETE mesmo pra service_role: o trigger
-- bloqueia de qualquer forma; o grant é redundância documentada.
