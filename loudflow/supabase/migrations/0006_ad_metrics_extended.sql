-- Loud Flow — Fase 3.2A: métricas estendidas da UTMify (MCP)
--
-- Adiciona colunas que não existiam na 0005 mas são fornecidas pelo MCP
-- oficial (nível campanha, Meta). Todas as métricas de contagem novas são
-- NOT NULL default 0 (a UTMify sempre reporta essas contagens), exceto
-- reach_estimated e conversations que podem ser nulas quando derivar não
-- for possível ou quando a fonte não informar.
--
-- Idempotente. Não apaga snapshots existentes: só adiciona colunas com
-- default seguro.

-- ============================================================
-- 1) sync_runs.source — diferencia MCP (dev) de HTTP oficial
--    'utmify_http' é o default por retrocompatibilidade com a bootstrap
--    row já existente. 'utmify_mcp' passa a ser usado pelo script de
--    import controlado desta fase.
-- ============================================================
alter table public.sync_runs
  add column if not exists source text not null default 'utmify_http';

alter table public.sync_runs
  drop constraint if exists sync_runs_source_check;
alter table public.sync_runs
  add constraint sync_runs_source_check
  check (source in ('utmify_http', 'utmify_mcp'));

-- ============================================================
-- 2) campaign_snapshots — métricas estendidas
--    * reach_estimated: derivado como round(impressions / frequency)
--      apenas quando frequency > 0. Nulo caso contrário — explicitamente
--      "não foi possível estimar", não "reach = 0".
--    * conversations: pode ser nulo quando a fonte não informar (mesma
--      semântica de leads/checkouts).
--    * approved/pending/refunded orders: contagens NOT NULL default 0.
--    * revenue_cents (líquido) + gross_revenue_cents (bruto): centavos
--      da moeda da org (BRL). NOT NULL default 0.
-- ============================================================
alter table public.campaign_snapshots
  add column if not exists reach_estimated       int,
  add column if not exists conversations         int,
  add column if not exists approved_orders_count int not null default 0,
  add column if not exists pending_orders_count  int not null default 0,
  add column if not exists refunded_orders_count int not null default 0,
  add column if not exists revenue_cents         int not null default 0,
  add column if not exists gross_revenue_cents   int not null default 0;

-- Reforçar CHECK de não-negatividade para as novas colunas sem apagar o
-- original — cria um segundo check dedicado.
alter table public.campaign_snapshots
  drop constraint if exists campaign_snapshots_extended_non_negative;
alter table public.campaign_snapshots
  add constraint campaign_snapshots_extended_non_negative check (
    coalesce(reach_estimated, 0)       >= 0
    and coalesce(conversations, 0)     >= 0
    and approved_orders_count          >= 0
    and pending_orders_count           >= 0
    and refunded_orders_count          >= 0
    and revenue_cents                  >= 0
    and gross_revenue_cents            >= 0
  );

-- Nenhuma alteração de RLS: as policies em 0005 já cobrem estas colunas
-- (SELECT sobre a tabela inteira por membro da org, com filtro por unidade
-- para unit_manager). Escritas continuam restritas ao service_role.
