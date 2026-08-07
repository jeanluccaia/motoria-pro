-- Loud Flow — Fase 2 MVP de tarefas
--
-- Cria a tabela public.tasks com enums, índices, triggers e RLS.
--
-- Modelagem enxuta:
--   * status: pending | completed (a "atrasada" é derivada de due_at, não gravada).
--   * priority: low | normal | high.
--   * unit_id opcional (null = tarefa vale para toda a rede).
--   * conclusão exige completed_at + completed_by; reabrir limpa ambos.
--
-- Segurança:
--   * Toda linha carrega organization_id + RLS por organização.
--   * Não-admin só enxerga tarefas onde é assigned_to.
--   * Não-admin só pode alterar status/completed_*/updated_at das próprias
--     tarefas (validado por trigger, já que Postgres não tem policy por coluna).
--   * Admin cria/edita/exclui/reatribui dentro da organização.
--   * assigned_to precisa ser membro da mesma organização; unit_id, quando
--     preenchido, precisa pertencer à mesma organização.
--
-- Idempotente e transacional. Não altera nada das migrations 0001/0002/0003.

-- ============================================================
-- 1) Enums
-- ============================================================
do $$ begin
  create type public.task_status as enum ('pending', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_priority as enum ('low', 'normal', 'high');
exception when duplicate_object then null; end $$;

-- ============================================================
-- 2) Trigger genérico para updated_at (reaproveitável)
-- ============================================================
create or replace function internal.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
alter function internal.set_updated_at() owner to postgres;
revoke all on function internal.set_updated_at() from public;

-- ============================================================
-- 3) Tabela tasks
-- ============================================================
create table if not exists public.tasks (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  unit_id          uuid references public.units(id) on delete set null,
  title            text not null,
  description      text,
  assigned_to      uuid not null references public.users(id) on delete restrict,
  created_by       uuid not null references public.users(id) on delete restrict,
  priority         public.task_priority not null default 'normal',
  due_at           timestamptz,
  status           public.task_status not null default 'pending',
  completed_at     timestamptz,
  completed_by     uuid references public.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint tasks_title_not_blank check (length(btrim(title)) > 0),

  -- Consistência de conclusão. "Atrasada" NÃO é um status; é derivada de due_at.
  constraint tasks_completion_consistency check (
    (status = 'pending' and completed_at is null and completed_by is null)
    or (status = 'completed' and completed_at is not null and completed_by is not null)
  )
);

-- ============================================================
-- 4) Índices para os padrões de leitura reais da UI
-- ============================================================
create index if not exists tasks_org_idx
  on public.tasks(organization_id);

create index if not exists tasks_org_assignee_status_due_idx
  on public.tasks(organization_id, assigned_to, status, due_at);

create index if not exists tasks_org_unit_status_due_idx
  on public.tasks(organization_id, unit_id, status, due_at);

create index if not exists tasks_org_status_due_idx
  on public.tasks(organization_id, status, due_at);

create index if not exists tasks_assigned_to_idx
  on public.tasks(assigned_to);

-- ============================================================
-- 5) updated_at automático
-- ============================================================
drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function internal.set_updated_at();

-- ============================================================
-- 6) Guarda de UPDATE por não-admin
--    Postgres não suporta RLS coluna-a-coluna. Este trigger garante que
--    apenas admin muda campos administrativos; usuário atribuído só pode
--    tocar em status/completed_*/updated_at.
-- ============================================================
create or replace function internal.tasks_guard_updates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  is_admin boolean;
begin
  -- Sem sessão autenticada (service_role/seed) — passa direto.
  if actor is null then
    return new;
  end if;

  is_admin := coalesce(internal.current_user_role(new.organization_id) = 'admin', false);
  if is_admin then
    return new;
  end if;

  -- Não-admin: bloqueia mudanças fora de status/completed_*/updated_at.
  if new.organization_id is distinct from old.organization_id
     or new.unit_id       is distinct from old.unit_id
     or new.title         is distinct from old.title
     or new.description   is distinct from old.description
     or new.assigned_to   is distinct from old.assigned_to
     or new.created_by    is distinct from old.created_by
     or new.priority      is distinct from old.priority
     or new.due_at        is distinct from old.due_at
     or new.created_at    is distinct from old.created_at
  then
    raise exception 'apenas administradores podem alterar campos administrativos da tarefa'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
alter function internal.tasks_guard_updates() owner to postgres;
revoke all on function internal.tasks_guard_updates() from public;

drop trigger if exists guard_tasks_updates on public.tasks;
create trigger guard_tasks_updates
  before update on public.tasks
  for each row execute function internal.tasks_guard_updates();

-- ============================================================
-- 7) RLS
-- ============================================================
alter table public.tasks enable row level security;

-- Admin: acesso total dentro da organização.
-- WITH CHECK garante que unit_id (quando informado) e assigned_to pertencem
-- à mesma organização.
drop policy if exists "tasks: admin all" on public.tasks;
create policy "tasks: admin all" on public.tasks
  for all
  using (internal.current_user_role(organization_id) = 'admin')
  with check (
    internal.current_user_role(organization_id) = 'admin'
    and (
      unit_id is null
      or exists (
        select 1 from public.units u
        where u.id = unit_id
          and u.organization_id = tasks.organization_id
      )
    )
    and exists (
      select 1 from public.user_organizations uo
      where uo.user_id = tasks.assigned_to
        and uo.organization_id = tasks.organization_id
    )
  );

-- Não-admin: SELECT das próprias tarefas.
drop policy if exists "tasks: assignee read" on public.tasks;
create policy "tasks: assignee read" on public.tasks
  for select
  using (
    assigned_to = auth.uid()
    and organization_id in (select internal.current_user_org_ids())
  );

-- Não-admin: UPDATE das próprias tarefas (o trigger acima limita quais
-- colunas podem mudar). Sem INSERT/DELETE.
drop policy if exists "tasks: assignee update" on public.tasks;
create policy "tasks: assignee update" on public.tasks
  for update
  using (
    assigned_to = auth.uid()
    and organization_id in (select internal.current_user_org_ids())
  )
  with check (
    assigned_to = auth.uid()
    and organization_id in (select internal.current_user_org_ids())
  );
