-- =========================================================================
-- DGN CRM — schema persistente inicial
-- Migration: 0001_crm_schema
-- Requires: Supabase Postgres (pgcrypto para gen_random_uuid)
-- =========================================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- Enums
-- -------------------------------------------------------------------------
do $$ begin
  create type crm_subscription_plan as enum (
    'Essential', 'Smart', 'Priority', 'Não identificado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm_subscription_cycle as enum (
    'mensal', 'semestral', 'anual', 'outro', 'não identificado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm_subscription_status as enum (
    'detectado', 'pendente_validacao', 'ativo', 'inadimplente', 'cancelado', 'encerrado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm_subscription_source as enum (
    '4uCar', 'Portal', 'Manual', 'Importação'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm_founder_status as enum (
    'não_avaliado', 'recomendado', 'selecionado', 'confirmado', 'lista_espera', 'descartado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm_commercial_stage as enum (
    'aguardando_analise', 'pronto_para_contato', 'contato_preparado', 'contatado',
    'visualizou', 'respondeu', 'conversando', 'pagamento_enviado', 'convertido', 'descartado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm_kit_status as enum (
    'não_aplicável', 'pendente', 'em_preparação', 'pronto', 'entregue'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm_card_status as enum (
    'não_aplicável', 'pendente', 'solicitado', 'produzido', 'entregue'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm_data_quality_status as enum (
    'ok', 'incompleto', 'nome_incompleto', 'telefone_invalido', 'placa_invalida', 'multiplas_pendencias'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm_interaction_type as enum (
    'importação', 'curadoria', 'status_alterado', 'convite_criado', 'mensagem_copiada',
    'whatsapp_aberto', 'visualização', 'resposta', 'observação', 'pagamento', 'conversão',
    'kit', 'cartão', 'assinatura_detectada', 'assinatura_validada'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm_duplicate_review_status as enum (
    'pendente', 'alta_confianca', 'precisa_revisar', 'bloqueado', 'conciliado', 'ignorado'
  );
exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------------------
-- 1. crm_customers
-- -------------------------------------------------------------------------
create table if not exists crm_customers (
  id                    uuid primary key default gen_random_uuid(),
  legacy_id             text unique,
  name                  text not null,
  normalized_name       text not null,
  primary_phone         text,
  normalized_phone      text,
  email                 text,
  company_or_link       text,
  origin                text,
  first_service_at      date,
  last_service_at       date,
  service_count         integer not null default 0,
  historical_value      numeric(12,2) not null default 0,
  average_ticket        numeric(12,2) not null default 0,
  average_interval_days numeric(8,2),
  data_quality_status   crm_data_quality_status not null default 'ok',
  data_quality_notes    text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_crm_customers_normalized_phone on crm_customers (normalized_phone) where normalized_phone is not null;
create index if not exists idx_crm_customers_normalized_name  on crm_customers (normalized_name);
create index if not exists idx_crm_customers_last_service     on crm_customers (last_service_at desc nulls last);

-- -------------------------------------------------------------------------
-- 2. crm_vehicles
-- -------------------------------------------------------------------------
create table if not exists crm_vehicles (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references crm_customers(id) on delete cascade,
  brand             text,
  model             text,
  normalized_model  text,
  plate             text,
  masked_plate      text,
  normalized_plate  text,
  is_primary        boolean not null default false,
  source            text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists uq_crm_vehicles_customer_plate
  on crm_vehicles (customer_id, normalized_plate)
  where normalized_plate is not null;

create index if not exists idx_crm_vehicles_customer on crm_vehicles (customer_id);
create index if not exists idx_crm_vehicles_norm_plate on crm_vehicles (normalized_plate) where normalized_plate is not null;

-- -------------------------------------------------------------------------
-- 3. crm_subscriptions
-- -------------------------------------------------------------------------
create table if not exists crm_subscriptions (
  id                          uuid primary key default gen_random_uuid(),
  customer_id                 uuid not null references crm_customers(id) on delete cascade,
  is_active_subscriber        boolean not null default false,
  subscription_plan           crm_subscription_plan not null default 'Não identificado',
  subscription_cycle          crm_subscription_cycle not null default 'não identificado',
  subscription_status         crm_subscription_status not null default 'detectado',
  subscription_source         crm_subscription_source not null default 'Importação',
  subscription_detected_at    timestamptz,
  subscription_validated_at   timestamptz,
  subscription_validated_by   text,
  next_scheduled_service_at   date,
  source_reference            text,
  notes                       text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_crm_subscriptions_customer on crm_subscriptions (customer_id);
create index if not exists idx_crm_subscriptions_status on crm_subscriptions (subscription_status);
create index if not exists idx_crm_subscriptions_next_service on crm_subscriptions (next_scheduled_service_at) where next_scheduled_service_at is not null;

-- -------------------------------------------------------------------------
-- 4. crm_campaign_members
-- -------------------------------------------------------------------------
create table if not exists crm_campaign_members (
  id                        uuid primary key default gen_random_uuid(),
  campaign_id               text not null,
  customer_id               uuid not null references crm_customers(id) on delete cascade,
  founder_status            crm_founder_status not null default 'não_avaliado',
  commercial_stage          crm_commercial_stage not null default 'aguardando_analise',
  priority                  integer,
  owner                     text,
  next_action               text,
  next_action_at            date,
  recommendation_reason     text,
  blockers                  text[] not null default '{}',
  commercial_notes          text,
  founder_number            text,
  invite_created_at         timestamptz,
  invite_sent_at            timestamptz,
  viewed_at                 timestamptz,
  responded_at              timestamptz,
  conversation_started_at   timestamptz,
  payment_sent_at           timestamptz,
  converted_at              timestamptz,
  lost_at                   timestamptz,
  lost_reason               text,
  kit_status                crm_kit_status not null default 'não_aplicável',
  kit_updated_at            timestamptz,
  card_status               crm_card_status not null default 'não_aplicável',
  card_updated_at           timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create unique index if not exists uq_crm_campaign_members_campaign_customer
  on crm_campaign_members (campaign_id, customer_id);

create unique index if not exists uq_crm_campaign_members_founder_number
  on crm_campaign_members (campaign_id, founder_number)
  where founder_number is not null and founder_status = 'confirmado';

create index if not exists idx_crm_campaign_members_stage on crm_campaign_members (campaign_id, commercial_stage);
create index if not exists idx_crm_campaign_members_next_action on crm_campaign_members (next_action_at) where next_action_at is not null;
create index if not exists idx_crm_campaign_members_owner on crm_campaign_members (owner) where owner is not null;

-- -------------------------------------------------------------------------
-- 5. crm_interactions (imutável)
-- -------------------------------------------------------------------------
create table if not exists crm_interactions (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references crm_customers(id) on delete cascade,
  campaign_id       text,
  interaction_type  crm_interaction_type not null,
  channel           text,
  description       text,
  metadata          jsonb not null default '{}'::jsonb,
  actor             text,
  occurred_at       timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists idx_crm_interactions_customer_occurred
  on crm_interactions (customer_id, occurred_at desc);

create index if not exists idx_crm_interactions_campaign
  on crm_interactions (campaign_id, occurred_at desc)
  where campaign_id is not null;

-- Bloqueio de update/delete (histórico imutável)
create or replace function crm_interactions_readonly() returns trigger as $$
begin
  raise exception 'crm_interactions is append-only (%: %)', tg_op, tg_argv[0];
end;
$$ language plpgsql;

drop trigger if exists trg_crm_interactions_no_update on crm_interactions;
create trigger trg_crm_interactions_no_update
  before update or delete on crm_interactions
  for each row execute function crm_interactions_readonly();

-- -------------------------------------------------------------------------
-- 6. crm_audit_logs
-- -------------------------------------------------------------------------
create table if not exists crm_audit_logs (
  id              uuid primary key default gen_random_uuid(),
  entity_type     text not null,
  entity_id       uuid not null,
  action          text not null,
  previous_value  jsonb,
  new_value       jsonb,
  actor           text,
  reason          text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_crm_audit_logs_entity on crm_audit_logs (entity_type, entity_id, created_at desc);
create index if not exists idx_crm_audit_logs_actor on crm_audit_logs (actor, created_at desc) where actor is not null;

-- -------------------------------------------------------------------------
-- 7. crm_score_snapshots
-- -------------------------------------------------------------------------
create table if not exists crm_score_snapshots (
  id                    uuid primary key default gen_random_uuid(),
  customer_id           uuid not null references crm_customers(id) on delete cascade,
  score_version         text not null,
  total_score           numeric(6,2) not null,
  recurrence_score      numeric(6,2) not null default 0,
  recency_score         numeric(6,2) not null default 0,
  service_count_score   numeric(6,2) not null default 0,
  value_score           numeric(6,2) not null default 0,
  plan_fit_score        numeric(6,2) not null default 0,
  data_quality_score    numeric(6,2) not null default 0,
  strategic_link_score  numeric(6,2) not null default 0,
  relationship_score    numeric(6,2) not null default 0,
  penalties             jsonb not null default '[]'::jsonb,
  explanation           jsonb not null default '{}'::jsonb,
  calculated_at         timestamptz not null default now()
);

create index if not exists idx_crm_score_snapshots_customer_calc
  on crm_score_snapshots (customer_id, calculated_at desc);

create index if not exists idx_crm_score_snapshots_version_total
  on crm_score_snapshots (score_version, total_score desc);

-- -------------------------------------------------------------------------
-- 8. crm_duplicate_candidates
-- -------------------------------------------------------------------------
create table if not exists crm_duplicate_candidates (
  id                    uuid primary key default gen_random_uuid(),
  source_customer_id    uuid not null references crm_customers(id) on delete cascade,
  target_customer_id    uuid not null references crm_customers(id) on delete cascade,
  match_type            text not null,
  confidence            numeric(4,3) not null,
  reason                text,
  review_status         crm_duplicate_review_status not null default 'pendente',
  reviewed_by           text,
  reviewed_at           timestamptz,
  created_at            timestamptz not null default now(),
  check (source_customer_id <> target_customer_id)
);

create unique index if not exists uq_crm_duplicate_candidates_pair
  on crm_duplicate_candidates (least(source_customer_id, target_customer_id), greatest(source_customer_id, target_customer_id), match_type);

create index if not exists idx_crm_duplicate_candidates_status
  on crm_duplicate_candidates (review_status, confidence desc);

-- -------------------------------------------------------------------------
-- Trigger genérico de updated_at
-- -------------------------------------------------------------------------
create or replace function crm_touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array[
    'crm_customers', 'crm_vehicles', 'crm_subscriptions', 'crm_campaign_members'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_touch on %1$s; ' ||
      'create trigger trg_%1$s_touch before update on %1$s ' ||
      'for each row execute function crm_touch_updated_at();',
      t
    );
  end loop;
end $$;
