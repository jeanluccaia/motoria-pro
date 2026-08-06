-- Loud Flow — Fase 1.1 security hardening
--
-- Move as 4 funções SECURITY DEFINER de public para o schema `internal`,
-- que NÃO é publicado pelo PostgREST. Isto elimina os 8 warnings do
-- Advisor sobre RPC executável por anon/authenticated sem afetar as
-- policies (que passam a qualificar `internal.*`) nem o trigger
-- on_auth_user_created em auth.users.
--
-- Também:
--   - reforça search_path = '' nas funções SECURITY DEFINER e qualifica
--     todos os objetos com schema
--   - revoga execute PUBLIC e concede o mínimo necessário
--   - remove as versões antigas em public
--
-- Idempotente e sem alteração de dados. Nenhuma tabela, coluna, dado ou
-- policy semântica é removida.

-- ============================================================
-- 1) Schema privado (não exposto pelo PostgREST/Data API)
-- ============================================================
create schema if not exists internal;

revoke all on schema internal from public;
grant  usage on schema internal to postgres, service_role;
-- authenticated precisa de USAGE para resolver internal.* invocado pelas policies.
grant  usage on schema internal to authenticated;

-- ============================================================
-- 2) Funções em internal
--    - SECURITY DEFINER + search_path = '' (qualificação total)
--    - executam com privs do owner (postgres)
-- ============================================================
create or replace function internal.current_user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id from public.user_organizations where user_id = auth.uid();
$$;
alter function internal.current_user_org_ids() owner to postgres;
revoke all    on function internal.current_user_org_ids() from public;
grant  execute on function internal.current_user_org_ids() to authenticated, service_role;

create or replace function internal.current_user_role(org uuid)
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.user_organizations
   where user_id = auth.uid() and organization_id = org
   limit 1;
$$;
alter function internal.current_user_role(uuid) owner to postgres;
revoke all    on function internal.current_user_role(uuid) from public;
grant  execute on function internal.current_user_role(uuid) to authenticated, service_role;

create or replace function internal.current_user_unit_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select unit_id from public.user_units where user_id = auth.uid();
$$;
alter function internal.current_user_unit_ids() owner to postgres;
revoke all    on function internal.current_user_unit_ids() from public;
grant  execute on function internal.current_user_unit_ids() to authenticated, service_role;

create or replace function internal.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;
alter function internal.handle_new_user() owner to postgres;
-- handle_new_user é invocada apenas pelo trigger; ninguém mais precisa executar.
revoke all on function internal.handle_new_user() from public;

-- ============================================================
-- 3) Repointa o trigger de novos usuários para internal.*
-- ============================================================
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function internal.handle_new_user();

-- ============================================================
-- 4) Recria as 14 policies apontando para internal.*
--    Mesma semântica das originais (0002_rls), só troca o schema.
-- ============================================================

-- organizations
drop policy if exists "org: member read" on public.organizations;
create policy "org: member read" on public.organizations
  for select using (id in (select internal.current_user_org_ids()));

drop policy if exists "org: admin write" on public.organizations;
create policy "org: admin write" on public.organizations
  for update using (internal.current_user_role(id) = 'admin');

-- units
drop policy if exists "units: member read" on public.units;
create policy "units: member read" on public.units
  for select using (
    organization_id in (select internal.current_user_org_ids())
    and (
      internal.current_user_role(organization_id) <> 'unit_manager'
      or id in (select internal.current_user_unit_ids())
    )
  );

drop policy if exists "units: admin insert" on public.units;
create policy "units: admin insert" on public.units
  for insert with check (internal.current_user_role(organization_id) = 'admin');

drop policy if exists "units: admin update" on public.units;
create policy "units: admin update" on public.units
  for update using (internal.current_user_role(organization_id) = 'admin');

drop policy if exists "units: admin delete" on public.units;
create policy "units: admin delete" on public.units
  for delete using (internal.current_user_role(organization_id) = 'admin');

-- users
drop policy if exists "users: self read" on public.users;
create policy "users: self read" on public.users
  for select using (id = auth.uid());

drop policy if exists "users: same-org read" on public.users;
create policy "users: same-org read" on public.users
  for select using (
    id in (
      select uo.user_id from public.user_organizations uo
      where uo.organization_id in (select internal.current_user_org_ids())
    )
  );

drop policy if exists "users: self update" on public.users;
create policy "users: self update" on public.users
  for update using (id = auth.uid());

-- user_organizations
drop policy if exists "uo: member read" on public.user_organizations;
create policy "uo: member read" on public.user_organizations
  for select using (organization_id in (select internal.current_user_org_ids()));

drop policy if exists "uo: admin write" on public.user_organizations;
create policy "uo: admin write" on public.user_organizations
  for all using (internal.current_user_role(organization_id) = 'admin')
  with check (internal.current_user_role(organization_id) = 'admin');

-- user_units
drop policy if exists "uu: self read" on public.user_units;
create policy "uu: self read" on public.user_units
  for select using (user_id = auth.uid());

drop policy if exists "uu: admin manage" on public.user_units;
create policy "uu: admin manage" on public.user_units
  for all using (
    exists (
      select 1 from public.units u
      where u.id = user_units.unit_id
        and internal.current_user_role(u.organization_id) = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.units u
      where u.id = user_units.unit_id
        and internal.current_user_role(u.organization_id) = 'admin'
    )
  );

-- audit_log
drop policy if exists "audit: admin read" on public.audit_log;
create policy "audit: admin read" on public.audit_log
  for select using (internal.current_user_role(organization_id) = 'admin');

-- ============================================================
-- 5) Remove as versões antigas de public (agora sem dependentes)
-- ============================================================
drop function if exists public.current_user_org_ids();
drop function if exists public.current_user_role(uuid);
drop function if exists public.current_user_unit_ids();
drop function if exists public.handle_new_user();
