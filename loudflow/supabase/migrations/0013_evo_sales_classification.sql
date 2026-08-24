-- Loud Flow — Fase 4.3: classificação de "matrícula nova" em evo_sales.
--
-- Contexto: até 0010, o webhook gravava toda venda com pagamento confirmado
-- como paid, sem distinguir matrícula nova de renovação/re-matrícula/produto.
-- Resultado: 165 vendas em processing_status='paid' com ~90% de ruído
-- (parcela mensal promocional, ex-aluno reativado, produto avulso).
--
-- Esta migration adiciona os campos de classificação que o webhook precisa
-- para decidir "isto é uma conversão de mídia?" ANTES de disparar
-- deliverPaidConversion. O CPF é o discriminador final (regra Jean 2026-08-24:
-- só CPF nunca visto antes conta como aquisição).
--
-- Backwards-compatible: todas as colunas são nullable ou têm default,
-- linhas existentes ficam com is_new_membership=false até backfill.

alter table public.evo_sales
  add column if not exists registration_kind      text,
  add column if not exists document               text,
  add column if not exists id_membership          text,
  add column if not exists id_membership_renewed  text,
  add column if not exists value_next_month_cents integer,
  add column if not exists is_new_membership      boolean not null default false,
  add column if not exists exclusion_reason       text;

comment on column public.evo_sales.registration_kind      is 'Enum EVO: new, re-enrollment, renewal, ... — extraído de sale.registrationKind ou member.registrationKind.';
comment on column public.evo_sales.document               is 'CPF do aluno normalizado (apenas dígitos). Usado para dedup por CPF único na rede. Nunca exposto ao usuário logado.';
comment on column public.evo_sales.id_membership          is 'ID do plano da EVO (primeiro item de matrícula do saleItens[]).';
comment on column public.evo_sales.id_membership_renewed  is 'FK EVO — quando presente, indica que a matrícula é continuação de outra (renovação).';
comment on column public.evo_sales.value_next_month_cents is 'Preço recorrente do plano (após entrada promocional). Útil para debug quando amount_paid_cents é muito baixo.';
comment on column public.evo_sales.is_new_membership      is 'True SSE: classifySale=eligible + document válido + nenhum evo_sales anterior com o mesmo document na mesma org. Único disparador de deliverPaidConversion.';
comment on column public.evo_sales.exclusion_reason       is 'Motivo pelo qual is_new_membership=false. Valores: cancelled, not-paid, re-enrollment, renewal, product-only, service-only, no-membership, no-document, duplicate-cpf.';

-- Índice para dedup por CPF: consulta típica é
--   select 1 from evo_sales
--   where organization_id=$1 and document=$2 and is_new_membership=true
-- Cobre o caso "esse CPF já virou aquisição antes?".
create index if not exists evo_sales_org_document_new_idx
  on public.evo_sales(organization_id, document)
  where document is not null and is_new_membership = true;

-- Índice geral por is_new_membership para relatórios e queries de reprocesso.
create index if not exists evo_sales_org_new_membership_idx
  on public.evo_sales(organization_id, is_new_membership)
  where is_new_membership = true;
