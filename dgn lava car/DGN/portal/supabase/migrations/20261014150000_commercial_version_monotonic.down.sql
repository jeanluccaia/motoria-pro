-- Rollback: remove apenas a nova sobrecarga (bigint) + trigger + coluna version.
-- As sobrecargas (text) e (uuid+timestamptz) permanecem intactas.

drop function if exists public.crm_update_customer_commercial_fields(
  uuid, text, text, text, timestamptz, integer, bigint, text, text
);

drop trigger if exists trg_crm_campaign_members_version on public.crm_campaign_members;
drop function if exists public.crm_campaign_members_bump_version();

alter table public.crm_campaign_members
  drop column if exists version;
