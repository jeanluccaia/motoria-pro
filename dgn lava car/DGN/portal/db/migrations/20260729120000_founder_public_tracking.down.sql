-- Rollback manual. Perde somente eventos e agregados desta etapa; interacoes e
-- auditorias historicas permanecem imutaveis. Fazer backup dos contadores se necessario.
drop function if exists public.crm_track_founder_public_event(text,text,text,uuid,text);
drop table if exists public.crm_founder_public_events;
alter table if exists public.crm_campaign_members
  drop column if exists last_viewed_at,
  drop column if exists view_count,
  drop column if exists confirm_whatsapp_clicked_at,
  drop column if exists confirm_whatsapp_click_count,
  drop column if exists vip_whatsapp_clicked_at,
  drop column if exists vip_whatsapp_click_count;
