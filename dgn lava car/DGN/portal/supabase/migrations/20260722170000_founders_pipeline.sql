-- Pipeline Founders 2026 persistente sobre as tabelas CRM existentes.
alter table public.crm_campaign_members add column if not exists selection_reason text;

create or replace function public.crm_update_founders_pipeline(
  p_customer_legacy_id text, p_campaign_id text, p_patch jsonb,
  p_expected_updated_at timestamptz, p_actor text
) returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  c uuid; m public.crm_campaign_members%rowtype; u public.crm_campaign_members%rowtype;
  old jsonb; nxt jsonb; fs text; st text; fn text; sr text; lr text; ks text; cs text; tr text;
  backwards boolean:=false; confirmed_count integer; interaction text:='status_alterado';
begin
  if p_campaign_id<>'founders-2026' then raise exception using errcode='22023',message='campanha inválida'; end if;
  if p_actor is null or btrim(p_actor)='' then raise exception using errcode='22023',message='ator obrigatório'; end if;
  select id into c from public.crm_customers where legacy_id=btrim(p_customer_legacy_id);
  if c is null then raise exception using errcode='P0002',message='cliente inexistente'; end if;
  select * into m from public.crm_campaign_members where customer_id=c and campaign_id=p_campaign_id for update;
  if not found then raise exception using errcode='P0002',message='registro de campanha inexistente'; end if;
  if p_expected_updated_at is null or m.updated_at is distinct from p_expected_updated_at then
    raise exception using errcode='40001',message='registro alterado por outra sessão; recarregue os dados';
  end if;
  fs:=case when p_patch?'founderStatus' then p_patch->>'founderStatus' else replace(m.founder_status::text,'não_avaliado','nao_avaliado') end;
  st:=coalesce(p_patch->>'commercialStage',m.commercial_stage::text);
  fn:=case when p_patch?'founderNumber' then nullif(btrim(p_patch->>'founderNumber'),'') else m.founder_number end;
  sr:=case when p_patch?'selectionReason' then nullif(btrim(p_patch->>'selectionReason'),'') else m.selection_reason end;
  lr:=case when p_patch?'lostReason' then nullif(btrim(p_patch->>'lostReason'),'') else m.lost_reason end;
  ks:=case when p_patch?'kitStatus' then p_patch->>'kitStatus' else replace(m.kit_status::text,'não_aplicável','nao_aplicavel') end;
  cs:=case when p_patch?'cardStatus' then p_patch->>'cardStatus' else replace(m.card_status::text,'não_aplicável','nao_aplicavel') end;
  tr:=nullif(btrim(p_patch->>'transitionReason'),'');
  if p_customer_legacy_id in ('benedito-constantino','jose-moreira','rikardo-oliveira')
    and (fs<>'confirmado' or fn is distinct from m.founder_number) then
    raise exception using errcode='22023',message='Founders 001, 002 e 003 são protegidos';
  end if;
  if fs not in ('nao_avaliado','recomendado','selecionado','confirmado','lista_espera','descartado') then raise exception using errcode='22023',message='founderStatus inválido'; end if;
  if st not in ('aguardando_analise','pronto_para_contato','contato_preparado','contatado','visualizou','respondeu','conversando','pagamento_enviado','convertido','descartado') then raise exception using errcode='22023',message='commercialStage inválido'; end if;
  if ks not in ('nao_aplicavel','pendente','em_preparacao','pronto','entregue') or cs not in ('nao_aplicavel','pendente','solicitado','produzido','entregue') then raise exception using errcode='22023',message='status de kit/cartão inválido'; end if;
  if st<>m.commercial_stage::text then
    backwards:=(m.commercial_stage::text='descartado' and st<>'descartado') or (array_position(array['aguardando_analise','pronto_para_contato','contato_preparado','contatado','visualizou','respondeu','conversando','pagamento_enviado','convertido'],st)
      < array_position(array['aguardando_analise','pronto_para_contato','contato_preparado','contatado','visualizou','respondeu','conversando','pagamento_enviado','convertido'],m.commercial_stage::text));
    if backwards and not (coalesce((p_patch->>'confirmBackward')::boolean,false) and length(coalesce(tr,''))>=3) then raise exception using errcode='22023',message='retorno de etapa exige confirmação e motivo'; end if;
    if not backwards and st<>'descartado' and not ((m.commercial_stage::text='aguardando_analise' and st='pronto_para_contato') or (m.commercial_stage::text='pronto_para_contato' and st='contato_preparado') or (m.commercial_stage::text='contato_preparado' and st='contatado') or (m.commercial_stage::text='contatado' and st in ('visualizou','respondeu')) or (m.commercial_stage::text='visualizou' and st='respondeu') or (m.commercial_stage::text='respondeu' and st='conversando') or (m.commercial_stage::text='conversando' and st='pagamento_enviado') or (m.commercial_stage::text='pagamento_enviado' and st='convertido')) then raise exception using errcode='22023',message='transição comercial inválida'; end if;
  end if;
  if fs in ('selecionado','confirmado') and length(coalesce(sr,''))<3 then raise exception using errcode='22023',message='seleção e confirmação exigem motivo'; end if;
  if fs='confirmado' then
    if fn!~'^[0-9]{3}$' then raise exception using errcode='22023',message='Founder confirmado exige número com 3 dígitos'; end if;
    if exists(select 1 from public.crm_campaign_members where campaign_id=p_campaign_id and founder_status::text='confirmado' and founder_number=fn and id<>m.id) then raise exception using errcode='23505',message='número Founder duplicado'; end if;
    if m.founder_status::text<>'confirmado' then select count(*) into confirmed_count from public.crm_campaign_members where campaign_id=p_campaign_id and founder_status::text='confirmado'; if confirmed_count>=30 then raise exception using errcode='P0001',message='limite de 30 Founders confirmados atingido'; end if; end if;
  elsif fn is not null then raise exception using errcode='22023',message='número Founder permitido somente para confirmado'; end if;
  if (fs='descartado' or st='descartado') and length(coalesce(lr,''))<3 then raise exception using errcode='22023',message='descarte exige motivo'; end if;
  if fs<>'confirmado' and st<>'convertido' and (ks<>'nao_aplicavel' or cs<>'nao_aplicavel') then raise exception using errcode='22023',message='kit e cartão ainda não são aplicáveis'; end if;
  old:=jsonb_build_object('founderStatus',replace(m.founder_status::text,'não_avaliado','nao_avaliado'),'commercialStage',m.commercial_stage,'founderNumber',m.founder_number,'selectionReason',m.selection_reason,'lostReason',m.lost_reason,'kitStatus',replace(m.kit_status::text,'não_aplicável','nao_aplicavel'),'cardStatus',replace(m.card_status::text,'não_aplicável','nao_aplicavel'));
  nxt:=jsonb_build_object('founderStatus',fs,'commercialStage',st,'founderNumber',fn,'selectionReason',sr,'lostReason',lr,'kitStatus',ks,'cardStatus',cs);
  if old=nxt then return jsonb_build_object('changed',false,'customerId',p_customer_legacy_id,'campaign',nxt||jsonb_build_object('updatedAt',m.updated_at)); end if;
  update public.crm_campaign_members set founder_status=(case when fs='nao_avaliado' then 'não_avaliado' else fs end)::public.crm_founder_status,commercial_stage=st::public.crm_commercial_stage,founder_number=fn,selection_reason=sr,lost_reason=lr,kit_status=(case when ks='nao_aplicavel' then 'não_aplicável' else ks end)::public.crm_kit_status,card_status=(case when cs='nao_aplicavel' then 'não_aplicável' else cs end)::public.crm_card_status,
    invite_created_at=case when st='contato_preparado' then coalesce(invite_created_at,now()) else invite_created_at end,invite_sent_at=case when st='contatado' then coalesce(invite_sent_at,now()) else invite_sent_at end,viewed_at=case when st='visualizou' then coalesce(viewed_at,now()) else viewed_at end,responded_at=case when st='respondeu' then coalesce(responded_at,now()) else responded_at end,conversation_started_at=case when st='conversando' then coalesce(conversation_started_at,now()) else conversation_started_at end,payment_sent_at=case when st='pagamento_enviado' then coalesce(payment_sent_at,now()) else payment_sent_at end,converted_at=case when st='convertido' then coalesce(converted_at,now()) else converted_at end,lost_at=case when st='descartado' or fs='descartado' then coalesce(lost_at,now()) else lost_at end,kit_updated_at=case when ks<>replace(m.kit_status::text,'não_aplicável','nao_aplicavel') then now() else kit_updated_at end,card_updated_at=case when cs<>replace(m.card_status::text,'não_aplicável','nao_aplicavel') then now() else card_updated_at end where id=m.id returning * into u;
  interaction:=case when st='contato_preparado' then 'convite_criado' when st='visualizou' then 'visualização' when st='respondeu' then 'resposta' when st='pagamento_enviado' then 'pagamento' when st='convertido' then 'conversão' when ks<>replace(m.kit_status::text,'não_aplicável','nao_aplicavel') then 'kit' when cs<>replace(m.card_status::text,'não_aplicável','nao_aplicavel') then 'cartão' else 'status_alterado' end;
  insert into public.crm_interactions(customer_id,campaign_id,interaction_type,channel,description,metadata,actor) values(c,p_campaign_id,interaction::public.crm_interaction_type,'portal','Pipeline Founders 2026 atualizado',jsonb_build_object('previous',old,'next',nxt,'reason',coalesce(tr,sr,lr),'reopened',backwards),p_actor);
  insert into public.crm_audit_logs(entity_type,entity_id,action,previous_value,new_value,actor,reason) values('campaign_member',m.id,'founders_pipeline.updated',old,nxt,p_actor,coalesce(tr,sr,lr));
  return jsonb_build_object('changed',true,'customerId',p_customer_legacy_id,'campaign',nxt||jsonb_build_object('updatedAt',u.updated_at));
end; $$;

-- A RPC e chamada exclusivamente pelo route handler administrativo, depois da
-- validacao da sessao. O browser e usuarios Supabase comuns nao podem executa-la.
revoke all on function public.crm_update_founders_pipeline(text, text, jsonb, timestamptz, text) from public;
revoke all on function public.crm_update_founders_pipeline(text, text, jsonb, timestamptz, text) from anon;
revoke all on function public.crm_update_founders_pipeline(text, text, jsonb, timestamptz, text) from authenticated;
grant execute on function public.crm_update_founders_pipeline(text, text, jsonb, timestamptz, text) to service_role;
