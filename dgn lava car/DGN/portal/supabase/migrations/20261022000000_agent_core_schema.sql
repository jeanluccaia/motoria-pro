-- ---------------------------------------------------------------------------
-- AGENT CORE — ETAPA 1 (Fundação)
--
-- Camada nova em volta do DGN Agent 2.3.3 para registrar oportunidades,
-- alertas, tarefas de follow-up e rascunhos de campanha produzidos pelo
-- agente. ZERO escrita direta em crm_*. Execução de ações sensíveis
-- continua passando pelas RPCs crm_* já em prod, acionadas por humano.
--
-- Decisões homologadas (2026-10-22):
--   * Dedupe conservador por (kind, target_customer_id, dedupe_key)
--     — unique parcial só em estados vivos
--   * Sem auto-approve. Status inicial sempre 'pending_review'
--   * payload jsonb de schema livre (validação em TS/zod antes da RPC)
--   * unit_id uuid NULL desde o dia 1 (multi-tenant prep sem SaaS prematuro)
--   * RLS FORCE + REVOKE anon/authenticated — acesso só via service_role
--
-- Ver também: project_dgn_direcao_portal_inteligente (memory)
-- ---------------------------------------------------------------------------

-- Enums ---------------------------------------------------------------------

create type public.agent_action_kind as enum (
  'opportunity',       -- oportunidade comercial detectada (upgrade, reativação, conversão)
  'alert',             -- alerta operacional (renovação próxima, convite sem resposta)
  'followup_task',     -- tarefa de acompanhamento humano (ligar, mandar mensagem)
  'campaign_draft'     -- vínculo com agent_campaigns.id
);

create type public.agent_action_status as enum (
  'pending_review',    -- criada pelo agente, aguardando revisão humana
  'approved',          -- humano aprovou; execução pode ou não ter acontecido
  'rejected',          -- humano descartou com motivo
  'executed',          -- ação foi efetivada (envio, abertura wa.me, criação em crm_*)
  'archived'           -- superada ou expirou sem atenção
);

create type public.agent_campaign_status as enum (
  'draft',
  'approved',
  'paused',
  'archived'
);

-- Tabela agent_actions ------------------------------------------------------

create table public.agent_actions (
  id                      uuid primary key default gen_random_uuid(),
  unit_id                 uuid null,

  kind                    public.agent_action_kind not null,
  status                  public.agent_action_status not null default 'pending_review',

  target_customer_id      uuid null references public.crm_customers(id),
  target_campaign_id      uuid null,

  title                   text not null,
  reason                  text not null,
  recommendation          text not null,
  next_step               text null,
  expected_benefit        text null,
  payload                 jsonb not null default '{}'::jsonb,

  source_tool             text not null,
  source_run_id           text null,
  created_by_agent        boolean not null default true,

  dedupe_key              text null,

  reviewed_by             text null,
  reviewed_at             timestamptz null,
  review_reason           text null,

  executed_at             timestamptz null,
  execution_ref           text null,

  expires_at              timestamptz null,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.agent_actions enable row level security;
alter table public.agent_actions force row level security;
revoke all on table public.agent_actions from public;
revoke all on table public.agent_actions from anon;
revoke all on table public.agent_actions from authenticated;

create index agent_actions_by_status_created
  on public.agent_actions (status, created_at desc);

create index agent_actions_by_customer
  on public.agent_actions (target_customer_id)
  where target_customer_id is not null;

create index agent_actions_by_kind_status
  on public.agent_actions (kind, status);

-- Dedupe conservador: só impede ações vivas com mesma identidade.
-- Depois de rejected/executed/archived uma nova ação igual pode ser criada.
create unique index agent_actions_live_dedupe
  on public.agent_actions (kind, target_customer_id, dedupe_key)
  where dedupe_key is not null
    and status in ('pending_review', 'approved');

-- Tabela agent_campaigns ----------------------------------------------------

create table public.agent_campaigns (
  id                    uuid primary key default gen_random_uuid(),
  unit_id               uuid null,

  status                public.agent_campaign_status not null default 'draft',

  name                  text not null,
  objective             text not null,

  audience_rules        jsonb not null default '{}'::jsonb,
  estimated_audience    int null,

  draft_message         text null,
  suggested_channel     text null,

  source_tool           text not null,
  created_by_agent      boolean not null default true,

  approved_by           text null,
  approved_at           timestamptz null,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.agent_campaigns enable row level security;
alter table public.agent_campaigns force row level security;
revoke all on table public.agent_campaigns from public;
revoke all on table public.agent_campaigns from anon;
revoke all on table public.agent_campaigns from authenticated;

create index agent_campaigns_by_status
  on public.agent_campaigns (status, created_at desc);

-- FK agent_actions.target_campaign_id → agent_campaigns.id (fecha o anel)
alter table public.agent_actions
  add constraint agent_actions_target_campaign_fk
  foreign key (target_campaign_id) references public.agent_campaigns(id);

-- updated_at trigger genérico ----------------------------------------------

create or replace function public.agent_core_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $trg$
begin
  new.updated_at := now();
  return new;
end;
$trg$;

create trigger agent_actions_set_updated_at
  before update on public.agent_actions
  for each row execute function public.agent_core_set_updated_at();

create trigger agent_campaigns_set_updated_at
  before update on public.agent_campaigns
  for each row execute function public.agent_core_set_updated_at();
