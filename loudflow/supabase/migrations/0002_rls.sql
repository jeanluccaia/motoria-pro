-- Loud Flow — Fase 1 RLS
-- Isolamento por organização e (para unit_manager) por unidade.

-- ============================================================
-- Helpers (security definer, avoidam recursão em policies)
-- ============================================================
create or replace function public.current_user_org_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select organization_id from public.user_organizations where user_id = auth.uid();
$$;

create or replace function public.current_user_role(org uuid)
returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.user_organizations
   where user_id = auth.uid() and organization_id = org
   limit 1;
$$;

create or replace function public.current_user_unit_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select unit_id from public.user_units where user_id = auth.uid();
$$;

-- ============================================================
-- Enable RLS
-- ============================================================
alter table public.organizations       enable row level security;
alter table public.units               enable row level security;
alter table public.users               enable row level security;
alter table public.user_organizations  enable row level security;
alter table public.user_units          enable row level security;
alter table public.audit_log           enable row level security;

-- ============================================================
-- organizations
-- ============================================================
drop policy if exists "org: member read" on public.organizations;
create policy "org: member read" on public.organizations
  for select using (id in (select public.current_user_org_ids()));

drop policy if exists "org: admin write" on public.organizations;
create policy "org: admin write" on public.organizations
  for update using (public.current_user_role(id) = 'admin');

-- ============================================================
-- units
-- ============================================================
drop policy if exists "units: member read" on public.units;
create policy "units: member read" on public.units
  for select using (
    organization_id in (select public.current_user_org_ids())
    and (
      public.current_user_role(organization_id) <> 'unit_manager'
      or id in (select public.current_user_unit_ids())
    )
  );

drop policy if exists "units: admin insert" on public.units;
create policy "units: admin insert" on public.units
  for insert with check (public.current_user_role(organization_id) = 'admin');

drop policy if exists "units: admin update" on public.units;
create policy "units: admin update" on public.units
  for update using (public.current_user_role(organization_id) = 'admin');

drop policy if exists "units: admin delete" on public.units;
create policy "units: admin delete" on public.units
  for delete using (public.current_user_role(organization_id) = 'admin');

-- ============================================================
-- users (perfil público)
-- ============================================================
drop policy if exists "users: self read" on public.users;
create policy "users: self read" on public.users
  for select using (id = auth.uid());

drop policy if exists "users: same-org read" on public.users;
create policy "users: same-org read" on public.users
  for select using (
    id in (
      select uo.user_id from public.user_organizations uo
      where uo.organization_id in (select public.current_user_org_ids())
    )
  );

drop policy if exists "users: self update" on public.users;
create policy "users: self update" on public.users
  for update using (id = auth.uid());

-- ============================================================
-- user_organizations
-- ============================================================
drop policy if exists "uo: member read" on public.user_organizations;
create policy "uo: member read" on public.user_organizations
  for select using (organization_id in (select public.current_user_org_ids()));

drop policy if exists "uo: admin write" on public.user_organizations;
create policy "uo: admin write" on public.user_organizations
  for all using (public.current_user_role(organization_id) = 'admin')
  with check (public.current_user_role(organization_id) = 'admin');

-- ============================================================
-- user_units
-- ============================================================
drop policy if exists "uu: self read" on public.user_units;
create policy "uu: self read" on public.user_units
  for select using (user_id = auth.uid());

drop policy if exists "uu: admin manage" on public.user_units;
create policy "uu: admin manage" on public.user_units
  for all using (
    exists (
      select 1 from public.units u
      where u.id = user_units.unit_id
        and public.current_user_role(u.organization_id) = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.units u
      where u.id = user_units.unit_id
        and public.current_user_role(u.organization_id) = 'admin'
    )
  );

-- ============================================================
-- audit_log — append-only via serviço; leitura só admin
-- ============================================================
drop policy if exists "audit: admin read" on public.audit_log;
create policy "audit: admin read" on public.audit_log
  for select using (public.current_user_role(organization_id) = 'admin');

-- Sem policy de insert/update/delete pelo cliente.
-- Escrita acontece via service_role (rota /api que roda no server).
