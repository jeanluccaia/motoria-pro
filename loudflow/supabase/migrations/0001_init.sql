-- Loud Flow — Fase 1 alicerce
-- organizations, units, users, user_organizations, user_units, audit_log
-- Multi-tenant desde o dia 1: toda tabela de negócio tem organization_id + RLS.

create extension if not exists "pgcrypto";

-- ============================================================
-- organizations
-- ============================================================
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  timezone      text not null default 'America/Sao_Paulo',
  currency      text not null default 'BRL',
  created_at    timestamptz not null default now()
);

-- ============================================================
-- units
-- ============================================================
create table if not exists public.units (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  slug            text not null,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  unique (organization_id, slug)
);

create index if not exists units_org_idx on public.units(organization_id);

-- ============================================================
-- users  (perfil público espelhando auth.users)
-- ============================================================
create table if not exists public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  name         text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create unique index if not exists users_email_idx on public.users(lower(email));

-- Espelhamento automático auth.users -> public.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- user_organizations  (papel do usuário na organização)
-- ============================================================
do $$ begin
  create type public.app_role as enum ('admin', 'marketing', 'partner', 'unit_manager');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_organizations (
  user_id          uuid not null references public.users(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  role             public.app_role not null,
  created_at       timestamptz not null default now(),
  primary key (user_id, organization_id)
);

-- ============================================================
-- user_units  (para unit_manager: quais unidades ele acessa)
-- ============================================================
create table if not exists public.user_units (
  user_id     uuid not null references public.users(id) on delete cascade,
  unit_id     uuid not null references public.units(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, unit_id)
);

-- ============================================================
-- audit_log  (append-only, técnico)
-- ============================================================
create table if not exists public.audit_log (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id        uuid references public.users(id) on delete set null,
  action          text not null,
  target_type     text not null,
  target_id       text,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists audit_log_org_idx on public.audit_log(organization_id, created_at desc);
