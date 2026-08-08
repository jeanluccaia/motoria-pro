-- Loud Flow — Fase 3: painel de resultados (UTMify)
--
-- Modelagem enxuta, idempotente, alinhada ao contrato real observado no MCP
-- da UTMify (nível campanha, Meta Ads). Nenhuma alteração das migrations
-- 0001–0004; nenhum dado pessoal é armazenado — só métricas agregadas de
-- mídia por campanha e por dia.
--
-- Provider hoje: 'meta'. Deixamos 'google' como valor possível para quando o
-- pagamento da conta LOUD FIT no Google Ads for reativado; até lá o adapter
-- simplesmente não escreve nada de Google.
--
-- Escrita: apenas via service_role (server actions e cron). Nenhuma policy
-- de INSERT/UPDATE/DELETE para authenticated — o painel é 100% leitura.

-- ============================================================
-- 1) Enums
-- ============================================================
do $$ begin
  create type public.ad_provider as enum ('meta', 'google');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.campaign_unit_source as enum ('auto', 'manual', 'unresolved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sync_status as enum ('running', 'success', 'partial', 'error');
exception when duplicate_object then null; end $$;

-- ============================================================
-- 2) sync_runs — histórico de sincronizações
-- ============================================================
create table if not exists public.sync_runs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  provider         public.ad_provider not null,
  status           public.sync_status not null,
  triggered_by     text not null,                       -- 'manual' | 'cron' | 'bootstrap'
  period_from      date not null,
  period_to        date not null,                       -- inclusivo
  rows_upserted    int not null default 0,
  campaigns_seen   int not null default 0,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  error_code       text,
  error_message    text,                                -- sempre sanitizada, sem tokens
  created_at       timestamptz not null default now()
);

create index if not exists sync_runs_org_started_idx
  on public.sync_runs(organization_id, started_at desc);

-- ============================================================
-- 3) campaigns — dimensão de campanha e mapeamento por unidade
--    A "chave estável" é (organization_id, provider, external_id).
-- ============================================================
create table if not exists public.campaigns (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  provider              public.ad_provider not null,
  external_account_id   text not null,                  -- ex: "889708106782924"
  external_account_name text,
  external_id           text not null,                  -- id estável da campanha
  name                  text not null,                  -- nome mais recente visto
  status                text,                           -- ACTIVE | PAUSED | ...
  unit_id               uuid references public.units(id) on delete set null,
  unit_source           public.campaign_unit_source not null default 'unresolved',
  first_seen_at         timestamptz not null default now(),
  last_seen_at          timestamptz not null default now(),
  archived_at           timestamptz,                    -- desapareceu da fonte
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint campaigns_external_unique
    unique (organization_id, provider, external_id)
);

create index if not exists campaigns_org_provider_idx
  on public.campaigns(organization_id, provider);
create index if not exists campaigns_org_unit_idx
  on public.campaigns(organization_id, unit_id);
create index if not exists campaigns_org_source_idx
  on public.campaigns(organization_id, unit_source);

drop trigger if exists set_campaigns_updated_at on public.campaigns;
create trigger set_campaigns_updated_at
  before update on public.campaigns
  for each row execute function internal.set_updated_at();

-- ============================================================
-- 4) campaign_snapshots — métricas diárias agregadas por campanha
--    Todos os valores monetários em CENTAVOS (int), moeda da organização.
--    Colunas anuláveis representam "métrica não fornecida pela fonte" —
--    diferente de 0 (que significa "fonte informou zero").
-- ============================================================
create table if not exists public.campaign_snapshots (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  campaign_id           uuid not null references public.campaigns(id) on delete cascade,
  provider              public.ad_provider not null,
  snapshot_date         date not null,                  -- dia no fuso da organização
  spend_cents           int not null default 0,
  impressions           int not null default 0,
  clicks                int not null default 0,         -- inline link clicks
  landing_page_views    int,                            -- nullable
  initiate_checkouts    int,                            -- nullable
  leads                 int,                            -- nullable
  frequency             numeric(8,3),                   -- nullable
  synced_at             timestamptz not null default now(),

  constraint campaign_snapshots_daily_unique
    unique (campaign_id, snapshot_date),

  constraint campaign_snapshots_non_negative check (
    spend_cents >= 0
    and impressions >= 0
    and clicks >= 0
    and coalesce(landing_page_views, 0) >= 0
    and coalesce(initiate_checkouts, 0) >= 0
    and coalesce(leads, 0) >= 0
  )
);

create index if not exists campaign_snapshots_org_date_idx
  on public.campaign_snapshots(organization_id, snapshot_date desc);
create index if not exists campaign_snapshots_org_provider_date_idx
  on public.campaign_snapshots(organization_id, provider, snapshot_date desc);
create index if not exists campaign_snapshots_campaign_date_idx
  on public.campaign_snapshots(campaign_id, snapshot_date desc);

-- ============================================================
-- 5) campaign_unit_aliases — normalização "texto → unidade"
--    O parser normaliza o nome da campanha e procura tokens que batem
--    com um alias. O alias é armazenado já normalizado (upper, sem
--    acento, espaços colapsados).
-- ============================================================
create table if not exists public.campaign_unit_aliases (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  alias            text not null,
  unit_id          uuid not null references public.units(id) on delete cascade,
  created_at       timestamptz not null default now(),

  constraint campaign_unit_aliases_unique unique (organization_id, alias),
  constraint campaign_unit_aliases_alias_not_blank check (length(btrim(alias)) > 0)
);

create index if not exists campaign_unit_aliases_org_idx
  on public.campaign_unit_aliases(organization_id);

-- ============================================================
-- 6) Seed dos aliases oficiais para a organização Loud Fit
--    Anchieta permanece propositalmente fora — a unidade está arquivada
--    e não deve aparecer em filtros/atribuições novas.
-- ============================================================
insert into public.campaign_unit_aliases (organization_id, alias, unit_id)
select u.organization_id, alias.alias, u.id
from (
  values
    ('IPIRANGA',           'ipiranga'),
    ('TOUR IPIRANGA',      'ipiranga'),
    ('AMOREIRAS',          'amoreiras'),
    ('MOGI MIRIM',         'mogi-mirim'),
    ('MOGI',               'mogi-mirim'),
    ('VILA INDUSTRIAL',    'vila-industrial'),
    ('VILA',               'vila-industrial'),
    ('CARREFOUR VALINHOS', 'carrefour-valinhos'),
    ('CARREFOUR',          'carrefour-valinhos')
) as alias(alias, unit_slug)
join public.units u on u.slug = alias.unit_slug
where u.archived_at is null
on conflict (organization_id, alias) do nothing;

-- ============================================================
-- 7) RLS — leitura por membro da org, com filtro extra para unit_manager
--    Escrita: apenas service_role (server actions). Sem policies de write.
-- ============================================================
alter table public.sync_runs             enable row level security;
alter table public.campaigns             enable row level security;
alter table public.campaign_snapshots    enable row level security;
alter table public.campaign_unit_aliases enable row level security;

-- sync_runs: só admin lê (informação técnica)
drop policy if exists "sync_runs: admin read" on public.sync_runs;
create policy "sync_runs: admin read" on public.sync_runs
  for select
  using (internal.current_user_role(organization_id) = 'admin');

-- campaigns: admin/marketing/partner leem tudo da org; unit_manager
-- só vê as suas unidades E as ainda não mapeadas (unit_id null) ficam
-- ocultas para unit_manager (não é dado dele).
drop policy if exists "campaigns: org read" on public.campaigns;
create policy "campaigns: org read" on public.campaigns
  for select
  using (
    organization_id in (select internal.current_user_org_ids())
    and (
      internal.current_user_role(organization_id) <> 'unit_manager'
      or (
        unit_id is not null
        and unit_id in (select internal.current_user_unit_ids())
      )
    )
  );

-- campaign_snapshots: mesma regra por campanha via join lógico em unit_id.
drop policy if exists "campaign_snapshots: org read" on public.campaign_snapshots;
create policy "campaign_snapshots: org read" on public.campaign_snapshots
  for select
  using (
    organization_id in (select internal.current_user_org_ids())
    and (
      internal.current_user_role(organization_id) <> 'unit_manager'
      or exists (
        select 1 from public.campaigns c
        where c.id = campaign_snapshots.campaign_id
          and c.unit_id is not null
          and c.unit_id in (select internal.current_user_unit_ids())
      )
    )
  );

-- campaign_unit_aliases: leitura para membros da org; escrita apenas admin
-- (o server action normalmente usa service_role, mas deixamos a policy para
-- que RLS proteja o dado se um dia formos escrever direto).
drop policy if exists "campaign_aliases: org read" on public.campaign_unit_aliases;
create policy "campaign_aliases: org read" on public.campaign_unit_aliases
  for select
  using (organization_id in (select internal.current_user_org_ids()));

drop policy if exists "campaign_aliases: admin write" on public.campaign_unit_aliases;
create policy "campaign_aliases: admin write" on public.campaign_unit_aliases
  for all
  using (internal.current_user_role(organization_id) = 'admin')
  with check (internal.current_user_role(organization_id) = 'admin');
