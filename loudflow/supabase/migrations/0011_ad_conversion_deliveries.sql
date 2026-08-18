-- Loud Flow — Envio de conversões pagas (EVO → UTMify → Meta/Google)
--
-- Cada venda paga notificada pelo webhook NewSale da EVO gera UMA entrega
-- por plataforma downstream. Hoje a plataforma alvo é 'utmify' (UTMify
-- encaminha internamente para Meta CAPI e Google Ads Enhanced Conversions);
-- a coluna platform já suporta 'meta' e 'google' para o caso de a UTMify
-- deixar de oferecer o encaminhamento no futuro.
--
-- Dedup / idempotência:
--   * UNIQUE (evo_sale_id, platform) — impede envio duplicado ainda que
--     o handler seja chamado várias vezes para a mesma venda.
--   * delivery_key é a mesma para todas as plataformas de uma venda
--     ('evo:{idBranch}:{idSale}:purchase') e vai como event_id/orderId
--     externo — permite às plataformas deduplicarem com Pixel client-side
--     no futuro (Fase B, quando o site LoudFit for instrumentado).
--
-- Sem dados pessoais na tabela. attempts e last_error viabilizam retry
-- manual/cron. response_summary guarda um trecho da resposta da plataforma
-- (sanitizado) para diagnóstico — nunca tokens ou PII.

-- ============================================================
-- 1) Enum de status de entrega
-- ============================================================
do $$ begin
  create type public.ad_conversion_delivery_status as enum (
    'pending',  -- criada, ainda não enviada
    'sent',     -- plataforma aceitou (HTTP 2xx)
    'failed',   -- último envio falhou; permite retry via attempts
    'skipped'   -- não enviável (ex.: customer.email obrigatório ausente)
  );
exception when duplicate_object then null; end $$;

-- ============================================================
-- 2) Enum de plataforma downstream
-- ============================================================
do $$ begin
  create type public.ad_conversion_platform as enum (
    'utmify',  -- transportadora principal (encaminha para Meta/Google)
    'meta',    -- reservado para envio direto ao Meta CAPI (Fase B)
    'google'   -- reservado para envio direto ao Google Ads (Fase B)
  );
exception when duplicate_object then null; end $$;

-- ============================================================
-- 3) ad_conversion_deliveries
-- ============================================================
create table if not exists public.ad_conversion_deliveries (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  evo_sale_id         uuid not null references public.evo_sales(id) on delete cascade,
  platform            public.ad_conversion_platform not null,

  -- chave estável de dedup (ex.: 'evo:10:12345:purchase'). Vai como
  -- orderId (UTMify) e no futuro como event_id (Meta CAPI) / order_id
  -- (Google Ads). Uma venda tem a MESMA delivery_key para todas as
  -- plataformas (permite dedup cross-plataforma).
  delivery_key        text not null,

  status              public.ad_conversion_delivery_status not null default 'pending',
  attempts            int not null default 0,
  last_error          text,                                -- sanitizado, sem tokens
  response_summary    text,                                -- trecho sanitizado da resposta
  last_attempt_at     timestamptz,
  sent_at             timestamptz,                         -- timestamp do primeiro 'sent'
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint ad_conv_deliveries_unique unique (evo_sale_id, platform),
  constraint ad_conv_deliveries_attempts_non_negative check (attempts >= 0)
);

create index if not exists ad_conv_deliveries_org_idx
  on public.ad_conversion_deliveries(organization_id);
create index if not exists ad_conv_deliveries_status_idx
  on public.ad_conversion_deliveries(status);
create index if not exists ad_conv_deliveries_org_status_created_idx
  on public.ad_conversion_deliveries(organization_id, status, created_at desc);

drop trigger if exists set_ad_conv_deliveries_updated_at on public.ad_conversion_deliveries;
create trigger set_ad_conv_deliveries_updated_at
  before update on public.ad_conversion_deliveries
  for each row execute function internal.set_updated_at();

-- ============================================================
-- 4) RLS — leitura para admin/marketing; escrita só service_role
-- ============================================================
alter table public.ad_conversion_deliveries enable row level security;

drop policy if exists "ad_conversion_deliveries: org read" on public.ad_conversion_deliveries;
create policy "ad_conversion_deliveries: org read" on public.ad_conversion_deliveries
  for select using (
    organization_id in (select internal.current_user_org_ids())
    and internal.current_user_role(organization_id) in ('admin', 'marketing')
  );

-- Sem policies de INSERT/UPDATE/DELETE: escrita apenas via service_role
-- (webhook e cron de retry). unit_manager e partner não veem entregas —
-- é dado de operação de mídia, não de operação de unidade.
