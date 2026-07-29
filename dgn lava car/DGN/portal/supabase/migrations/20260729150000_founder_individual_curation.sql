alter table public.crm_campaign_members
  add column if not exists recommended_plan_code text,
  add column if not exists recommended_plan_name text,
  add column if not exists recommended_plan_version text,
  add column if not exists recommended_vehicle_category text,
  add column if not exists recommendation_reason_internal text,
  add column if not exists recommendation_message_public text,
  add column if not exists curated_by text,
  add column if not exists curated_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists plan_snapshot jsonb;

alter table public.crm_founder_public_links
  add column if not exists offer_snapshot jsonb,
  add column if not exists version integer not null default 1 check (version > 0),
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by text;

create or replace function public.crm_manage_founder_curation(
  p_customer_legacy_id text, p_campaign_id text, p_action text,
  p_plan_code text, p_vehicle_category text, p_reason_internal text,
  p_message_public text, p_plan_snapshot jsonb,
  p_expected_updated_at timestamptz, p_actor text
) returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  v_customer uuid; v_member public.crm_campaign_members%rowtype;
  v_link public.crm_founder_public_links%rowtype; v_now timestamptz:=clock_timestamp();
  v_old jsonb; v_new jsonb; v_slug text; v_version integer:=1; v_stage text; v_changed boolean:=false;
begin
  if p_campaign_id <> 'founders-2026' or p_action not in ('save','approve','create_page','revoke','replace','mark_sent')
    or p_actor is null or btrim(p_actor)='' then raise exception using errcode='22023',message='requisição inválida'; end if;
  select id into v_customer from public.crm_customers where legacy_id=btrim(p_customer_legacy_id);
  if v_customer is null then raise exception using errcode='P0002',message='cliente inexistente'; end if;
  select * into v_member from public.crm_campaign_members where customer_id=v_customer and campaign_id=p_campaign_id for update;
  if not found then raise exception using errcode='P0002',message='registro de campanha inexistente'; end if;
  if p_expected_updated_at is null or v_member.updated_at is distinct from p_expected_updated_at then
    raise exception using errcode='40001',message='registro alterado por outra sessão; recarregue os dados';
  end if;
  if p_customer_legacy_id in ('benedito-constantino','jose-moreira','rikardo-oliveira') then
    raise exception using errcode='22023',message='Founders 001, 002 e 003 são protegidos';
  end if;
  if v_member.founder_status::text='confirmado' then raise exception using errcode='22023',message='Founder confirmado não pode ser alterado'; end if;
  if v_member.founder_status::text='descartado' or v_member.commercial_stage::text='descartado' then raise exception using errcode='22023',message='registro descartado não pode ser reativado'; end if;

  select * into v_link from public.crm_founder_public_links where campaign_member_id=v_member.id and enabled for update;
  v_old:=jsonb_build_object('planCode',v_member.recommended_plan_code,'planName',v_member.recommended_plan_name,
    'planVersion',v_member.recommended_plan_version,'vehicleCategory',v_member.recommended_vehicle_category,
    'reasonInternal',v_member.recommendation_reason_internal,'messagePublic',v_member.recommendation_message_public,
    'founderStatus',v_member.founder_status,'commercialStage',v_member.commercial_stage,'inviteSentAt',v_member.invite_sent_at,
    'slug',case when v_link.enabled then v_link.slug else null end,'linkVersion',v_link.version);

  if p_action in ('save','approve') then
    if p_plan_snapshot is null or p_plan_code is null then raise exception using errcode='22023',message='plano oficial obrigatório'; end if;
    if p_plan_snapshot->>'code' <> p_plan_code or nullif(p_plan_snapshot->>'name','') is null
      or nullif(p_plan_snapshot->>'version','') is null or nullif(p_plan_snapshot->>'displayedValue','') is null
      or nullif(p_plan_snapshot->>'billingCondition','') is null then raise exception using errcode='22023',message='snapshot incompleto'; end if;
    if p_action='approve' and length(btrim(coalesce(p_reason_internal,'')))<3 then raise exception using errcode='22023',message='motivo interno obrigatório'; end if;
    if exists(select 1 from public.crm_founder_public_links where campaign_member_id=v_member.id and enabled) then
      raise exception using errcode='22023',message='oferta publicada exige Revogar e gerar novo convite';
    end if;
    if v_member.recommended_plan_code is not distinct from p_plan_code
      and v_member.recommended_plan_name is not distinct from p_plan_snapshot->>'name'
      and v_member.recommended_plan_version is not distinct from p_plan_snapshot->>'version'
      and v_member.recommended_vehicle_category is not distinct from nullif(btrim(coalesce(p_vehicle_category,'')),'')
      and v_member.recommendation_reason_internal is not distinct from nullif(btrim(coalesce(p_reason_internal,'')),'')
      and v_member.recommendation_message_public is not distinct from nullif(btrim(coalesce(p_message_public,'')),'')
      and v_member.plan_snapshot is not distinct from p_plan_snapshot
      and (p_action='save' or (v_member.founder_status::text='selecionado' and v_member.approved_at is not null
        and v_member.commercial_stage::text<>'aguardando_analise')) then
      return jsonb_build_object('changed',false,'customerId',p_customer_legacy_id,
        'campaign',v_old||jsonb_build_object('updatedAt',v_member.updated_at));
    end if;
    update public.crm_campaign_members set recommended_plan_code=p_plan_code,
      recommended_plan_name=p_plan_snapshot->>'name',recommended_plan_version=p_plan_snapshot->>'version',
      recommended_vehicle_category=nullif(btrim(coalesce(p_vehicle_category,'')),''),
      recommendation_reason_internal=nullif(btrim(coalesce(p_reason_internal,'')),''),
      recommendation_message_public=nullif(btrim(coalesce(p_message_public,'')),''),curated_by=p_actor,
      curated_at=case when v_member.recommended_plan_code is distinct from p_plan_code
        or v_member.recommendation_reason_internal is distinct from nullif(btrim(coalesce(p_reason_internal,'')),'')
        or v_member.recommendation_message_public is distinct from nullif(btrim(coalesce(p_message_public,'')),'') then v_now else curated_at end,
      approved_at=case when p_action='approve' then coalesce(approved_at,v_now) else approved_at end,
      plan_snapshot=p_plan_snapshot,
      founder_status=case when p_action='approve' then 'selecionado'::public.crm_founder_status
        when founder_status::text='nao_avaliado' or founder_status::text='não_avaliado' then 'recomendado'::public.crm_founder_status else founder_status end,
      commercial_stage=case when p_action='approve' and commercial_stage::text='aguardando_analise' then 'pronto_para_contato'::public.crm_commercial_stage else commercial_stage end
    where id=v_member.id returning * into v_member;
  elsif p_action in ('create_page','replace') then
    if p_action='replace' then
      if p_plan_snapshot is null or p_plan_code is null or p_plan_snapshot->>'code'<>p_plan_code
        or nullif(p_plan_snapshot->>'name','') is null or nullif(p_plan_snapshot->>'version','') is null
        or nullif(p_plan_snapshot->>'displayedValue','') is null or nullif(p_plan_snapshot->>'billingCondition','') is null
        or length(btrim(coalesce(p_reason_internal,'')))<3 then
        raise exception using errcode='22023',message='nova oferta e motivo interno são obrigatórios';
      end if;
      update public.crm_campaign_members set recommended_plan_code=p_plan_code,
        recommended_plan_name=p_plan_snapshot->>'name',recommended_plan_version=p_plan_snapshot->>'version',
        recommended_vehicle_category=nullif(btrim(coalesce(p_vehicle_category,'')),''),
        recommendation_reason_internal=nullif(btrim(p_reason_internal),''),
        recommendation_message_public=nullif(btrim(coalesce(p_message_public,'')),''),
        curated_by=p_actor,curated_at=v_now,approved_at=v_now,plan_snapshot=p_plan_snapshot
        where id=v_member.id returning * into v_member;
    end if;
    if v_member.founder_status::text<>'selecionado' or v_member.recommended_plan_code is null
      or v_member.plan_snapshot is null or length(coalesce(v_member.recommendation_reason_internal,''))<3 then
      raise exception using errcode='22023',message='curadoria aprovada e snapshot completo são obrigatórios'; end if;
    if v_link.id is not null and p_action='create_page' then raise exception using errcode='23505',message='já existe página ativa'; end if;
    if v_link.id is not null then
      update public.crm_founder_public_links set enabled=false,revoked_at=v_now,revoked_by=p_actor,updated_at=v_now where id=v_link.id;
    end if;
    select coalesce(max(version),0)+1 into v_version from public.crm_founder_public_links where campaign_member_id=v_member.id;
    v_slug:='convite-'||encode(gen_random_bytes(18),'hex');
    insert into public.crm_founder_public_links(campaign_member_id,slug,enabled,is_test,expires_at,offer_snapshot,version)
      values(v_member.id,v_slug,true,false,null,v_member.plan_snapshot,v_version) returning * into v_link;
    update public.crm_campaign_members set invite_created_at=v_now,
      commercial_stage=case when commercial_stage::text in ('aguardando_analise','pronto_para_contato') then 'contato_preparado'::public.crm_commercial_stage else commercial_stage end
      where id=v_member.id returning * into v_member;
  elsif p_action='revoke' then
    update public.crm_founder_public_links set enabled=false,revoked_at=v_now,revoked_by=p_actor,updated_at=v_now
      where campaign_member_id=v_member.id and enabled returning * into v_link;
    if not found then raise exception using errcode='P0002',message='página ativa inexistente'; end if;
    update public.crm_campaign_members set updated_at=v_now where id=v_member.id returning * into v_member;
  elsif p_action='mark_sent' then
    if not exists(select 1 from public.crm_founder_public_links where campaign_member_id=v_member.id and enabled) then raise exception using errcode='22023',message='página ativa obrigatória'; end if;
    update public.crm_campaign_members set invite_sent_at=coalesce(invite_sent_at,v_now),
      commercial_stage=case when commercial_stage::text in ('aguardando_analise','pronto_para_contato','contato_preparado') then 'contatado'::public.crm_commercial_stage else commercial_stage end
      where id=v_member.id returning * into v_member;
  end if;

  v_new:=jsonb_build_object('planCode',v_member.recommended_plan_code,'planName',v_member.recommended_plan_name,
    'planVersion',v_member.recommended_plan_version,'vehicleCategory',v_member.recommended_vehicle_category,
    'reasonInternal',v_member.recommendation_reason_internal,'messagePublic',v_member.recommendation_message_public,
    'founderStatus',v_member.founder_status,'commercialStage',v_member.commercial_stage,'inviteSentAt',v_member.invite_sent_at,
    'slug',case when v_link.enabled then v_link.slug else null end,'linkVersion',v_link.version);
  v_changed:=v_old is distinct from v_new;
  if v_changed then
    insert into public.crm_interactions(customer_id,campaign_id,interaction_type,channel,description,metadata,actor)
      values(v_customer,p_campaign_id,case when p_action in ('create_page','replace') then 'convite_criado'::public.crm_interaction_type else 'status_alterado'::public.crm_interaction_type end,
        'portal','Curadoria Founder: '||p_action,jsonb_build_object('action',p_action,'linkVersion',v_link.version),p_actor);
    insert into public.crm_audit_logs(entity_type,entity_id,action,previous_value,new_value,actor,reason)
      values('campaign_member',v_member.id,'founder_curation.'||p_action,v_old,v_new,p_actor,p_reason_internal);
  end if;
  return jsonb_build_object('changed',v_changed,'customerId',p_customer_legacy_id,'campaign',v_new||jsonb_build_object('updatedAt',v_member.updated_at));
end; $$;

revoke all on function public.crm_manage_founder_curation(text,text,text,text,text,text,text,jsonb,timestamptz,text) from public,anon,authenticated;
grant execute on function public.crm_manage_founder_curation(text,text,text,text,text,text,text,jsonb,timestamptz,text) to service_role;
