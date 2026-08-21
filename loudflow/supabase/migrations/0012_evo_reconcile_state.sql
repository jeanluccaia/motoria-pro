-- Loud Flow — cursor + cooldown por unidade da reconciliação EVO.
--
-- Motivação: cada chamada ao endpoint /api/v2/sales da EVO conta contra
-- o rate limit diário compartilhado. Sem cursor persistente e cooldown
-- por unidade, o cron pode:
--   (a) re-varrer a mesma janela várias vezes ao dia
--   (b) rodar em paralelo pra branches diferentes gastando quota inútil
--
-- Este estado persiste, por (organization_id, id_branch), a última janela
-- reconciliada com sucesso e o instante da última execução. O reconcile
-- consulta antes de rodar e:
--   * se last_run_at foi há menos de 1h → pula a branch e devolve
--     `skipped:cooldown-active` nos counters;
--   * senão calcula updatedReceivableStartDate = max(last_window_end - 10min,
--     now - default_hours) — a sobreposição de 10 min captura recebíveis
--     confirmados entre o corte de uma execução e o disparo da próxima
--     sem re-varrer horas inteiras.
--
-- id_branch nullable + unique parcial: quando `?idBranch=` não é passado
-- (varredura global), guardamos estado num único registro por org com
-- id_branch=NULL. Reconciliações filtradas por branch usam registros
-- distintos.

create table if not exists public.evo_reconcile_state (
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  id_branch        text,                       -- NULL = varredura sem filtro de branch
  last_run_at      timestamptz not null,       -- instante do último POST OK
  last_window_end  timestamptz not null,       -- fim da janela reconciliada
  last_window_start timestamptz,               -- início da janela reconciliada (info/debug)
  last_fetched     int,                        -- contagem persistida (info/debug)
  last_paid        int,
  last_eligible    int,
  last_dry_run     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Chave lógica: uma linha por (org, branch). id_branch NULL é uma "branch"
-- válida (varredura global). Usamos coalesce para tornar o UNIQUE consistente.
create unique index if not exists evo_reconcile_state_org_branch_uniq
  on public.evo_reconcile_state (organization_id, coalesce(id_branch, ''));

create index if not exists evo_reconcile_state_org_idx
  on public.evo_reconcile_state (organization_id);

drop trigger if exists set_evo_reconcile_state_updated_at on public.evo_reconcile_state;
create trigger set_evo_reconcile_state_updated_at
  before update on public.evo_reconcile_state
  for each row execute function internal.set_updated_at();

-- RLS: só service_role escreve. Leitura para admin/marketing (útil para
-- diagnóstico via query no dashboard).
alter table public.evo_reconcile_state enable row level security;

drop policy if exists "evo_reconcile_state: org read" on public.evo_reconcile_state;
create policy "evo_reconcile_state: org read" on public.evo_reconcile_state
  for select using (
    organization_id in (select internal.current_user_org_ids())
    and internal.current_user_role(organization_id) in ('admin', 'marketing')
  );

-- Sem policies de INSERT/UPDATE/DELETE — escrita apenas via service_role.
