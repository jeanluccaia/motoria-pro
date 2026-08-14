-- Loud Flow — Integração EVO / W12 (webhook NewSale)
--
-- Objetivo: registrar apenas vendas EFETIVAMENTE PAGAS notificadas pelo
-- webhook NewSale da EVO/W12 (principalmente Pix e boleto, que só viram
-- receita depois da confirmação bancária).
--
-- Modelagem:
--   * evo_sales guarda o mínimo necessário para conciliação com resultados
--     e reprocessamento seguro. Zero dados pessoais (sem CPF, telefone,
--     endereço, cartão etc.).
--   * A chave estável é (id_branch, id_sale) — mesma venda enviada duas
--     vezes pelo webhook (retry da EVO) é idempotente via ON CONFLICT.
--   * organization_id é obrigatório (multi-tenant). Enquanto só houver
--     uma org (loud-fit) a rota resolve pelo env EVO_DEFAULT_ORGANIZATION_SLUG.
--   * unit_id é nullable: o mapeamento de id_branch → unidade acontece
--     depois via tabela auxiliar evo_branches (não bloqueia o registro).
--
-- Escrita: apenas via service_role (rota do webhook). Sem policies de
-- INSERT/UPDATE/DELETE para authenticated — leitura é o único vetor
-- exposto ao usuário logado.

-- ============================================================
-- 1) Enum
-- ============================================================
do $$ begin
  create type public.evo_sale_processing_status as enum (
    'pending',   -- webhook recebido, EVO ainda não confirmou pagamento (Pix/boleto gerado)
    'paid',      -- pagamento confirmado — conta como conversão
    'cancelled', -- venda removida (removed=true) — não conta
    'error'      -- falha ao consultar detalhes na EVO — permite reprocesso
  );
exception when duplicate_object then null; end $$;

-- ============================================================
-- 2) evo_branches — mapeamento IdBranch -> unidade
--    Populada manualmente pelo admin após primeiro webhook por unidade.
--    A ausência de mapeamento NÃO impede o registro da venda; apenas
--    deixa unit_id NULL no evo_sales.
-- ============================================================
create table if not exists public.evo_branches (
  id_branch        text primary key,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  unit_id          uuid references public.units(id) on delete set null,
  label            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists evo_branches_org_idx on public.evo_branches(organization_id);
create index if not exists evo_branches_unit_idx on public.evo_branches(unit_id);

drop trigger if exists set_evo_branches_updated_at on public.evo_branches;
create trigger set_evo_branches_updated_at
  before update on public.evo_branches
  for each row execute function internal.set_updated_at();

-- ============================================================
-- 3) evo_sales — venda notificada pelo webhook NewSale
-- ============================================================
create table if not exists public.evo_sales (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  unit_id             uuid references public.units(id) on delete set null,

  -- Identificadores EVO (do payload do webhook + endpoint de detalhes)
  id_w12              text,                                  -- IdW12 (assinatura da conta)
  id_branch           text not null,                         -- IdBranch (unidade da rede)
  id_sale             text not null,                         -- IdRecord da venda (obrigatório)
  id_member           text,                                  -- opcional (id do aluno)
  event_type          text not null,                         -- 'NewSale' (podem surgir outros no futuro)

  -- Financeiro (centavos para evitar float; valores derivados de ammountPaid)
  amount_paid_cents   int,                                   -- soma dos recebíveis confirmados
  sale_date           timestamptz,                           -- saleDate da EVO
  receiving_date      timestamptz,                           -- receivingDate do 1º recebível confirmado
  payment_type        text,                                  -- 'Pix' | 'Boleto' | 'Credit Card' | ...
  receivable_status   text,                                  -- string do status do recebível (informativo)

  processing_status   public.evo_sale_processing_status not null default 'pending',
  last_reason         text,                                  -- por que ficou pending/error/cancelled

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint evo_sales_branch_sale_unique unique (id_branch, id_sale),
  constraint evo_sales_amount_non_negative check (coalesce(amount_paid_cents, 0) >= 0)
);

create index if not exists evo_sales_org_idx           on public.evo_sales(organization_id);
create index if not exists evo_sales_unit_idx          on public.evo_sales(unit_id);
create index if not exists evo_sales_status_idx        on public.evo_sales(processing_status);
create index if not exists evo_sales_receiving_idx     on public.evo_sales(organization_id, receiving_date desc);
create index if not exists evo_sales_org_status_date_idx
  on public.evo_sales(organization_id, processing_status, receiving_date desc);

drop trigger if exists set_evo_sales_updated_at on public.evo_sales;
create trigger set_evo_sales_updated_at
  before update on public.evo_sales
  for each row execute function internal.set_updated_at();

-- ============================================================
-- 4) RLS — leitura apenas por membros da org; escrita só service_role
-- ============================================================
alter table public.evo_branches enable row level security;
alter table public.evo_sales    enable row level security;

drop policy if exists "evo_branches: org read" on public.evo_branches;
create policy "evo_branches: org read" on public.evo_branches
  for select using (organization_id in (select internal.current_user_org_ids()));

drop policy if exists "evo_branches: admin write" on public.evo_branches;
create policy "evo_branches: admin write" on public.evo_branches
  for all
  using (internal.current_user_role(organization_id) = 'admin')
  with check (internal.current_user_role(organization_id) = 'admin');

-- Vendas: admin/marketing/partner leem tudo da org; unit_manager só vê
-- vendas com unit_id que ele gerencia (vendas ainda sem unidade mapeada
-- ficam ocultas para unit_manager — não é dado dele).
drop policy if exists "evo_sales: org read" on public.evo_sales;
create policy "evo_sales: org read" on public.evo_sales
  for select using (
    organization_id in (select internal.current_user_org_ids())
    and (
      internal.current_user_role(organization_id) <> 'unit_manager'
      or (unit_id is not null and unit_id in (select internal.current_user_unit_ids()))
    )
  );

-- Sem policies de INSERT/UPDATE/DELETE: a rota do webhook usa service_role.
