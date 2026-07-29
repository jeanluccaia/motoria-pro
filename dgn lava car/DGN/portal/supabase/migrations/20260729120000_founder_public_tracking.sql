-- Rastreamento privado e transacional de engajamento nas paginas Founder.
alter table public.crm_campaign_members
  add column if not exists last_viewed_at timestamptz,
  add column if not exists view_count integer not null default 0 check (view_count >= 0),
  add column if not exists confirm_whatsapp_clicked_at timestamptz,
  add column if not exists confirm_whatsapp_click_count integer not null default 0 check (confirm_whatsapp_click_count >= 0),
  add column if not exists vip_whatsapp_clicked_at timestamptz,
  add column if not exists vip_whatsapp_click_count integer not null default 0 check (vip_whatsapp_click_count >= 0);

create table if not exists public.crm_founder_public_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.crm_customers(id) on delete cascade,
  campaign_id text not null,
  event_type text not null check (event_type in ('page_view','confirm_whatsapp_click','vip_whatsapp_click')),
  anonymous_visitor_id uuid not null,
  dedupe_key text not null unique,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_founder_events_rate_visitor on public.crm_founder_public_events(anonymous_visitor_id, created_at desc);
create index if not exists idx_founder_events_rate_customer on public.crm_founder_public_events(customer_id, created_at desc);
alter table public.crm_founder_public_events enable row level security;
alter table public.crm_founder_public_events force row level security;
revoke all on table public.crm_founder_public_events from public, anon, authenticated;

create or replace function public.crm_track_founder_public_event(
  p_customer_legacy_id text, p_campaign_id text, p_event_type text,
  p_anonymous_visitor_id uuid, p_dedupe_key text
) returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  v_customer uuid; v_member public.crm_campaign_members%rowtype; v_now timestamptz:=clock_timestamp();
  v_previous jsonb; v_next jsonb; v_stage text; v_inserted uuid;
begin
  if p_campaign_id <> 'founders-2026' or p_event_type not in ('page_view','confirm_whatsapp_click','vip_whatsapp_click')
    or p_anonymous_visitor_id is null or length(p_dedupe_key)>240
  then return jsonb_build_object('accepted',false); end if;

  select id into v_customer from public.crm_customers where legacy_id=p_customer_legacy_id;
  if v_customer is null then return jsonb_build_object('accepted',false); end if;
  select * into v_member from public.crm_campaign_members
    where customer_id=v_customer and campaign_id=p_campaign_id for update;
  if not found then return jsonb_build_object('accepted',false); end if;

  -- 20 por visitante/10 min e 200 por pagina/10 min. Excedentes sao no-op.
  if (select count(*) from public.crm_founder_public_events where anonymous_visitor_id=p_anonymous_visitor_id and created_at>v_now-interval '10 minutes') >= 20
    or (select count(*) from public.crm_founder_public_events where customer_id=v_customer and created_at>v_now-interval '10 minutes') >= 200
  then return jsonb_build_object('accepted',true,'recorded',false); end if;

  -- Janela movel real: evita a contagem dupla inclusive na fronteira entre buckets.
  if exists(select 1 from public.crm_founder_public_events
    where customer_id=v_customer and campaign_id=p_campaign_id and event_type=p_event_type
      and anonymous_visitor_id=p_anonymous_visitor_id and occurred_at>v_now-interval '30 minutes')
  then return jsonb_build_object('accepted',true,'recorded',false); end if;

  insert into public.crm_founder_public_events(customer_id,campaign_id,event_type,anonymous_visitor_id,dedupe_key,occurred_at)
    values(v_customer,p_campaign_id,p_event_type,p_anonymous_visitor_id,p_dedupe_key,v_now)
    on conflict(dedupe_key) do nothing returning id into v_inserted;
  if v_inserted is null then return jsonb_build_object('accepted',true,'recorded',false); end if;

  v_previous:=jsonb_build_object('commercial_stage',v_member.commercial_stage,'viewed_at',v_member.viewed_at,
    'last_viewed_at',v_member.last_viewed_at,'view_count',v_member.view_count,
    'confirm_whatsapp_clicked_at',v_member.confirm_whatsapp_clicked_at,'confirm_whatsapp_click_count',v_member.confirm_whatsapp_click_count,
    'vip_whatsapp_clicked_at',v_member.vip_whatsapp_clicked_at,'vip_whatsapp_click_count',v_member.vip_whatsapp_click_count);
  v_stage:=v_member.commercial_stage::text;
  update public.crm_campaign_members set
    viewed_at=case when p_event_type='page_view' then coalesce(viewed_at,v_now) else viewed_at end,
    last_viewed_at=case when p_event_type='page_view' then v_now else last_viewed_at end,
    view_count=view_count+case when p_event_type='page_view' then 1 else 0 end,
    confirm_whatsapp_clicked_at=case when p_event_type='confirm_whatsapp_click' then coalesce(confirm_whatsapp_clicked_at,v_now) else confirm_whatsapp_clicked_at end,
    confirm_whatsapp_click_count=confirm_whatsapp_click_count+case when p_event_type='confirm_whatsapp_click' then 1 else 0 end,
    vip_whatsapp_clicked_at=case when p_event_type='vip_whatsapp_click' then coalesce(vip_whatsapp_clicked_at,v_now) else vip_whatsapp_clicked_at end,
    vip_whatsapp_click_count=vip_whatsapp_click_count+case when p_event_type='vip_whatsapp_click' then 1 else 0 end,
    commercial_stage=case when p_event_type='page_view' and v_stage in ('aguardando_analise','pronto_para_contato','contato_preparado','contatado') then 'visualizou'::public.crm_commercial_stage else commercial_stage end,
    updated_at=v_now where id=v_member.id returning
    jsonb_build_object('commercial_stage',commercial_stage,'viewed_at',viewed_at,'last_viewed_at',last_viewed_at,'view_count',view_count,
      'confirm_whatsapp_clicked_at',confirm_whatsapp_clicked_at,'confirm_whatsapp_click_count',confirm_whatsapp_click_count,
      'vip_whatsapp_clicked_at',vip_whatsapp_clicked_at,'vip_whatsapp_click_count',vip_whatsapp_click_count) into v_next;

  insert into public.crm_interactions(customer_id,campaign_id,interaction_type,channel,description,metadata,actor,occurred_at)
    values(v_customer,p_campaign_id,case when p_event_type='page_view' then 'visualização'::public.crm_interaction_type else 'whatsapp_aberto'::public.crm_interaction_type end,
      'founder_public','Evento publico Founder registrado',jsonb_build_object('event',p_event_type,'source','founder_public'),'system:founder_tracking',v_now);
  insert into public.crm_audit_logs(entity_type,entity_id,action,previous_value,new_value,actor,reason)
    values('campaign_member',v_member.id,'founder_public_event.'||p_event_type,v_previous,v_next,'system:founder_tracking','Evento publico deduplicado');
  return jsonb_build_object('accepted',true,'recorded',true);
end; $$;

revoke all on function public.crm_track_founder_public_event(text,text,text,uuid,text) from public, anon, authenticated;
grant execute on function public.crm_track_founder_public_event(text,text,text,uuid,text) to service_role;
