-- Loud Flow — CRM Franqueadora (SLA de contato dos leads)
--
-- Regra operacional ditada em 2026-10-21 pelos sócios da Loud Fit:
--
--   1. Lead entra → aguardar 3 dias por resposta após o primeiro contato.
--   2. Sem resposta → fazer o 2º contato → aguardar mais 3 dias.
--   3. 2 contatos sem resposta → arquivar temporariamente.
--   4. 20 dias após o arquivamento → nova tentativa automática (lead
--      volta pro funil com próximo contato marcado para hoje).
--   5. Se o retry não gerar resposta em 3 dias → arquivar em definitivo.
--
-- Modelagem:
--   * sla_contact_attempts: contagem de contatos feitos desde a última
--     resposta do lead. É incrementado por registerContact e zerado
--     quando sla_response_received_at é setado.
--   * sla_response_received_at: timestamp em que o lead respondeu. Enquanto
--     NULL, o lead está dentro do loop SLA. Setar sai do loop.
--   * sla_archive_type: 'temporary' ou 'final'. Diferencia os dois tipos
--     de arquivamento SLA do campo lost_reason manual (que fica NULL).
--   * sla_archived_at: quando o cron arquivou. Base da janela de 20d.
--   * sla_last_retry_at: quando o cron desarquivou pra retry. Se o sócio
--     não registrar contato até sla_last_retry_at + 3d, arquiva final.
--
-- Idempotente e aditivo. Backfill conservador: contagem de contatos é
-- derivada de franchise_lead_activities.activity_type='contact'; nenhum
-- lead já marcado como `lost` é retroativamente classificado como SLA.

-- ============================================================
-- 1) Colunas novas
-- ============================================================
alter table public.franchise_leads
  add column if not exists sla_contact_attempts     integer     not null default 0,
  add column if not exists sla_response_received_at timestamptz,
  add column if not exists sla_archive_type         text,
  add column if not exists sla_archived_at          timestamptz,
  add column if not exists sla_last_retry_at        timestamptz;

do $$ begin
  alter table public.franchise_leads
    add constraint franchise_leads_sla_archive_type_check
    check (sla_archive_type is null or sla_archive_type in ('temporary', 'final'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.franchise_leads
    add constraint franchise_leads_sla_attempts_nonneg
    check (sla_contact_attempts >= 0);
exception when duplicate_object then null; end $$;

-- Índice para o cron tick não varrer a tabela inteira:
--   * pendentes de arquivamento temp: ativos (não-terminal) + attempts>=2 + sem resposta
--   * pendentes de retry: arquivados temp
--   * pendentes de arquivamento final: em retry
create index if not exists franchise_leads_org_sla_scan_idx
  on public.franchise_leads(organization_id, pipeline_stage, sla_archive_type, sla_archived_at)
  where pipeline_stage not in ('won', 'disqualified');

-- ============================================================
-- 2) Backfill — contar contatos existentes por lead
--    Só preenche sla_contact_attempts quando o lead NÃO respondeu
--    (sla_response_received_at IS NULL). Se um contato existente
--    for na realidade uma resposta do lead, isso será corrigido na
--    primeira vez que o sócio marcar "lead respondeu" na UI.
-- ============================================================
with contact_counts as (
  select
    fl.id as lead_id,
    count(*) filter (where fla.activity_type = 'contact') as contacts
  from public.franchise_leads fl
  left join public.franchise_lead_activities fla on fla.lead_id = fl.id
  group by fl.id
)
update public.franchise_leads fl
  set sla_contact_attempts = coalesce(cc.contacts, 0)
  from contact_counts cc
  where fl.id = cc.lead_id
    and fl.sla_contact_attempts = 0;

-- ============================================================
-- 3) Comentários (documentação viva no catálogo)
-- ============================================================
comment on column public.franchise_leads.sla_contact_attempts is
  'Contatos registrados desde a última resposta do lead. Base da regra 2 contatos → arquivar.';
comment on column public.franchise_leads.sla_response_received_at is
  'Timestamp da resposta do lead. Enquanto NULL, lead está dentro do loop SLA.';
comment on column public.franchise_leads.sla_archive_type is
  'Classifica o arquivamento feito pelo cron SLA: "temporary" (20d p/ retry) ou "final".';
comment on column public.franchise_leads.sla_archived_at is
  'Momento do arquivamento SLA. Base para o cálculo da janela de retry de 20 dias.';
comment on column public.franchise_leads.sla_last_retry_at is
  'Quando o cron desarquivou o lead para nova tentativa. Base da janela final de 3 dias.';
