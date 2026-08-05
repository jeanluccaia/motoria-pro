-- Pré-requisitos operacionais para a Curadoria Founder em produção:
--   1. pgcrypto: fornece gen_random_bytes(int) usado por
--      crm_manage_founder_curation_v2 para gerar slugs "convite-<hex>".
--   2. crm_purge_test_founder: helper restrito para limpeza de clientes
--      sintéticos de teste (legacy_id que combine com
--      ^teste-founder-[0-9a-f]{8,32}$). Necessário porque crm_audit_logs e
--      crm_interactions são append-only por design — a purga precisa rodar
--      como SECURITY DEFINER com bypass local de triggers. NÃO pode ser
--      usado em clientes reais: o check no início rejeita qualquer legacy_id
--      que não obedeça ao padrão sintético.

create extension if not exists pgcrypto;

create or replace function public.crm_purge_test_founder(p_legacy_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer uuid;
  v_deleted_members integer := 0;
  v_deleted_links integer := 0;
  v_deleted_events integer := 0;
  v_deleted_interactions integer := 0;
  v_deleted_audits integer := 0;
  v_deleted_scores integer := 0;
begin
  if p_legacy_id is null or p_legacy_id !~ '^teste-founder-[0-9a-f]{8,32}$' then
    raise exception using errcode='22023',
      message='crm_purge_test_founder só aceita legacy_id no formato teste-founder-<hex>';
  end if;

  select id into v_customer from public.crm_customers where legacy_id = p_legacy_id;
  if v_customer is null then
    return jsonb_build_object('purged', false, 'reason', 'customer_not_found');
  end if;

  -- Desabilita triggers apenas na sessão atual e apenas para as tabelas
  -- envolvidas na limpeza; volta ao normal ao fim da função.
  set local session_replication_role = 'replica';

  delete from public.crm_founder_public_events where customer_id = v_customer;
  get diagnostics v_deleted_events = row_count;

  delete from public.crm_founder_public_links
    where campaign_member_id in (
      select id from public.crm_campaign_members where customer_id = v_customer
    );
  get diagnostics v_deleted_links = row_count;

  delete from public.crm_audit_logs
    where entity_type = 'campaign_member'
      and entity_id in (
        select id from public.crm_campaign_members where customer_id = v_customer
      );
  get diagnostics v_deleted_audits = row_count;

  delete from public.crm_interactions where customer_id = v_customer;
  get diagnostics v_deleted_interactions = row_count;

  delete from public.crm_score_snapshots where customer_id = v_customer;
  get diagnostics v_deleted_scores = row_count;

  delete from public.crm_campaign_members where customer_id = v_customer;
  get diagnostics v_deleted_members = row_count;

  delete from public.crm_customers where id = v_customer;

  set local session_replication_role = 'origin';

  return jsonb_build_object(
    'purged', true,
    'legacy_id', p_legacy_id,
    'deleted', jsonb_build_object(
      'events', v_deleted_events,
      'links', v_deleted_links,
      'audits', v_deleted_audits,
      'interactions', v_deleted_interactions,
      'scores', v_deleted_scores,
      'members', v_deleted_members,
      'customers', 1
    )
  );
end;
$$;

revoke all on function public.crm_purge_test_founder(text) from public, anon, authenticated;
grant execute on function public.crm_purge_test_founder(text) to service_role;
