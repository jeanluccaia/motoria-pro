-- Loud Flow — CRM Franqueadora (Leads de Franquia)
--
-- Primeiro módulo de CRM. Guarda os leads interessados em abrir uma unidade
-- Loud Fit e o histórico de contatos com cada um. Zero automação neste
-- primeiro corte: a UI é um registro operacional (quem precisa receber
-- contato hoje, o que foi conversado da última vez, próxima ação).
--
-- Modelagem:
--   * franchise_leads: 1 linha por lead da franqueadora. phone_normalized
--     é a chave anti-duplicata dentro da organização; número incompleto
--     não bloqueia o cadastro (phone_normalized fica NULL).
--   * franchise_lead_activities: histórico append-only de contatos/mudanças
--     de etapa/agendamentos. Separado dos campos "último contato" do lead
--     para preservar linha do tempo mesmo quando a UI só mostra o mais
--     recente.
--
-- Segurança (RLS por role, dentro da organização):
--   * admin: acesso total, inclusive delete e import.
--   * marketing: leitura + criação/edição; sem delete.
--   * partner: leitura + atualização operacional (etapa, prioridade,
--     próxima ação, agendar, registrar contato). Sem delete, sem alterar
--     o próprio dono (owner_id) nem a origem/organization.
--   * unit_manager: SEM acesso ao CRM da franqueadora.
--
-- Idempotente e aditivo — não altera nenhuma estrutura das migrations
-- 0001..0016. Numeração 0017 escolhida porque 0014-0016 estão reservadas
-- em outras branches ainda não mergeadas.

-- ============================================================
-- 1) Enums
-- ============================================================
do $$ begin
  create type public.franchise_lead_stage as enum (
    'new',
    'contact_attempt',
    'in_conversation',
    'qualified',
    'meeting_scheduled',
    'cof_sent',
    'negotiating',
    'won',
    'no_response',
    'disqualified',
    'lost'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.franchise_lead_priority as enum ('low', 'normal', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.franchise_lead_source as enum (
    'meta_instant_form',
    'meta_whatsapp',
    'manual',
    'google_ads',
    'site'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.franchise_lead_activity_type as enum (
    'contact',
    'stage_change',
    'schedule',
    'note'
  );
exception when duplicate_object then null; end $$;

-- ============================================================
-- 2) franchise_leads
-- ============================================================
create table if not exists public.franchise_leads (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references public.organizations(id) on delete cascade,

  full_name                 text not null,
  phone                     text,                                 -- bruto, como foi digitado/recebido
  phone_normalized          text,                                 -- E.164 quando possível (ex.: +5519997555366)
  email                     text,

  received_at               timestamptz,                          -- quando o lead chegou (null = desconhecido)
  last_contact_at           timestamptz,                          -- última conversa registrada
  last_conversation_status  text,                                 -- resumo curto do que ficou da última conversa
  next_action               text,                                 -- "Ligar hoje", "Reenviar msg", etc.
  next_contact_at           timestamptz,                          -- quando precisa ser abordado de novo

  pipeline_stage            public.franchise_lead_stage not null default 'new',
  priority                  public.franchise_lead_priority not null default 'normal',
  source                    public.franchise_lead_source,

  investment_range          text,                                 -- "De R$ 700 mil a R$ 899 mil" (texto livre)
  start_timeline            text,                                 -- "Até 3 meses", "6 a 12 meses"...
  whatsapp_label            text,                                 -- identificação exibida no WhatsApp (ex.: "~Fabio")
  notes                     text,
  lost_reason               text,                                 -- preenchido quando pipeline_stage = 'lost'

  owner_id                  uuid references public.users(id) on delete set null,

  created_by                uuid references public.users(id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint franchise_leads_name_not_blank check (length(btrim(full_name)) > 0),
  -- Lost => motivo obrigatório. Qualquer outra etapa pode ter motivo nulo.
  constraint franchise_leads_lost_reason check (
    pipeline_stage <> 'lost' or (lost_reason is not null and length(btrim(lost_reason)) > 0)
  ),

  -- Chave composta necessária para a FK em franchise_lead_activities.
  -- Garante que uma atividade jamais referencie um lead de outra organização,
  -- mesmo quando a escrita for feita via service_role (que ignora RLS).
  constraint franchise_leads_id_org_unique unique (id, organization_id)
);

-- Impede duplicidade dentro da mesma organização quando o telefone é válido.
-- Leads com telefone incompleto (phone_normalized NULL) são permitidos — não
-- bloqueia o cadastro inicial, apenas evita colisão em números normalizados.
create unique index if not exists franchise_leads_org_phone_unique
  on public.franchise_leads(organization_id, phone_normalized)
  where phone_normalized is not null;

create index if not exists franchise_leads_org_idx
  on public.franchise_leads(organization_id);

create index if not exists franchise_leads_org_stage_idx
  on public.franchise_leads(organization_id, pipeline_stage);

create index if not exists franchise_leads_org_priority_idx
  on public.franchise_leads(organization_id, priority);

create index if not exists franchise_leads_org_next_contact_idx
  on public.franchise_leads(organization_id, next_contact_at);

create index if not exists franchise_leads_owner_idx
  on public.franchise_leads(owner_id);

drop trigger if exists set_franchise_leads_updated_at on public.franchise_leads;
create trigger set_franchise_leads_updated_at
  before update on public.franchise_leads
  for each row execute function internal.set_updated_at();

-- ============================================================
-- 3) franchise_lead_activities (histórico append-only)
-- ============================================================
create table if not exists public.franchise_lead_activities (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  lead_id           uuid not null,

  activity_type     public.franchise_lead_activity_type not null,
  summary           text not null,
  occurred_at       timestamptz not null default now(),

  created_by        uuid references public.users(id) on delete set null,
  created_at        timestamptz not null default now(),

  constraint franchise_lead_activities_summary_not_blank check (length(btrim(summary)) > 0),

  -- FK composta: casa simultaneamente lead_id + organization_id contra o lead.
  -- Diferente de FKs independentes, esta falha se alguém tentar criar uma
  -- atividade com organization_id de outra org usando um lead_id válido —
  -- cross-org attack ou bug de pipe fica fisicamente impossível, inclusive
  -- quando a escrita vem de service_role (que ignora RLS).
  constraint franchise_lead_activities_lead_org_fk
    foreign key (lead_id, organization_id)
    references public.franchise_leads (id, organization_id)
    on delete cascade
);

create index if not exists franchise_lead_activities_lead_idx
  on public.franchise_lead_activities(lead_id, occurred_at desc);

create index if not exists franchise_lead_activities_org_idx
  on public.franchise_lead_activities(organization_id);

-- ============================================================
-- 4) Guard trigger: partner tem UPDATE restrito.
--    Admin e marketing editam tudo; partner só pode mexer em campos
--    operacionais (etapa, prioridade, próxima ação, agendamento,
--    status/último contato, observações, motivo de perda).
--    Postgres não suporta RLS coluna-a-coluna, então validamos aqui.
-- ============================================================
create or replace function internal.franchise_leads_guard_updates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  role_name public.app_role;
begin
  if actor is null then
    return new;
  end if;

  role_name := internal.current_user_role(new.organization_id);

  if role_name = 'admin' or role_name = 'marketing' then
    return new;
  end if;

  if role_name = 'partner' then
    if new.organization_id is distinct from old.organization_id
       or new.full_name       is distinct from old.full_name
       or new.phone           is distinct from old.phone
       or new.phone_normalized is distinct from old.phone_normalized
       or new.email           is distinct from old.email
       or new.received_at     is distinct from old.received_at
       or new.source          is distinct from old.source
       or new.investment_range is distinct from old.investment_range
       or new.start_timeline  is distinct from old.start_timeline
       or new.whatsapp_label  is distinct from old.whatsapp_label
       or new.owner_id        is distinct from old.owner_id
       or new.created_by      is distinct from old.created_by
       or new.created_at      is distinct from old.created_at
    then
      raise exception 'parceiros não podem alterar dados cadastrais do lead; use um usuário com perfil marketing ou admin'
        using errcode = '42501';
    end if;
    return new;
  end if;

  raise exception 'perfil sem permissão para alterar leads de franquia'
    using errcode = '42501';
end;
$$;
alter function internal.franchise_leads_guard_updates() owner to postgres;
revoke all on function internal.franchise_leads_guard_updates() from public;

drop trigger if exists guard_franchise_leads_updates on public.franchise_leads;
create trigger guard_franchise_leads_updates
  before update on public.franchise_leads
  for each row execute function internal.franchise_leads_guard_updates();

-- ============================================================
-- 5) RLS — franchise_leads
-- ============================================================
alter table public.franchise_leads enable row level security;

-- Leitura: admin, marketing e partner da mesma org.
drop policy if exists "franchise_leads: team read" on public.franchise_leads;
create policy "franchise_leads: team read" on public.franchise_leads
  for select using (
    organization_id in (select internal.current_user_org_ids())
    and internal.current_user_role(organization_id) in ('admin', 'marketing', 'partner')
  );

-- Admin: tudo.
drop policy if exists "franchise_leads: admin all" on public.franchise_leads;
create policy "franchise_leads: admin all" on public.franchise_leads
  for all
  using (internal.current_user_role(organization_id) = 'admin')
  with check (internal.current_user_role(organization_id) = 'admin');

-- Marketing: insert/update dentro da org (sem delete).
drop policy if exists "franchise_leads: marketing insert" on public.franchise_leads;
create policy "franchise_leads: marketing insert" on public.franchise_leads
  for insert
  with check (
    internal.current_user_role(organization_id) = 'marketing'
    and organization_id in (select internal.current_user_org_ids())
  );

drop policy if exists "franchise_leads: marketing update" on public.franchise_leads;
create policy "franchise_leads: marketing update" on public.franchise_leads
  for update
  using (
    internal.current_user_role(organization_id) = 'marketing'
    and organization_id in (select internal.current_user_org_ids())
  )
  with check (
    internal.current_user_role(organization_id) = 'marketing'
    and organization_id in (select internal.current_user_org_ids())
  );

-- Partner: UPDATE restrito (trigger acima garante o escopo das colunas).
-- Sem INSERT nem DELETE.
drop policy if exists "franchise_leads: partner update" on public.franchise_leads;
create policy "franchise_leads: partner update" on public.franchise_leads
  for update
  using (
    internal.current_user_role(organization_id) = 'partner'
    and organization_id in (select internal.current_user_org_ids())
  )
  with check (
    internal.current_user_role(organization_id) = 'partner'
    and organization_id in (select internal.current_user_org_ids())
  );

-- ============================================================
-- 6) RLS — franchise_lead_activities
-- ============================================================
alter table public.franchise_lead_activities enable row level security;

-- Leitura: admin, marketing e partner da mesma org (herda a visibilidade do lead).
drop policy if exists "fla: team read" on public.franchise_lead_activities;
create policy "fla: team read" on public.franchise_lead_activities
  for select using (
    organization_id in (select internal.current_user_org_ids())
    and internal.current_user_role(organization_id) in ('admin', 'marketing', 'partner')
  );

-- Admin: full.
drop policy if exists "fla: admin all" on public.franchise_lead_activities;
create policy "fla: admin all" on public.franchise_lead_activities
  for all
  using (internal.current_user_role(organization_id) = 'admin')
  with check (internal.current_user_role(organization_id) = 'admin');

-- Marketing e partner: INSERT dentro da org (sem delete, sem update — histórico é imutável).
drop policy if exists "fla: team insert" on public.franchise_lead_activities;
create policy "fla: team insert" on public.franchise_lead_activities
  for insert
  with check (
    organization_id in (select internal.current_user_org_ids())
    and internal.current_user_role(organization_id) in ('marketing', 'partner')
    and exists (
      select 1 from public.franchise_leads fl
      where fl.id = lead_id and fl.organization_id = franchise_lead_activities.organization_id
    )
  );
