-- Rollback agent_core_schema (ordem reversa de criação).

drop trigger if exists agent_campaigns_set_updated_at on public.agent_campaigns;
drop trigger if exists agent_actions_set_updated_at on public.agent_actions;
drop function if exists public.agent_core_set_updated_at();

alter table public.agent_actions drop constraint if exists agent_actions_target_campaign_fk;

drop table if exists public.agent_campaigns;
drop table if exists public.agent_actions;

drop type if exists public.agent_campaign_status;
drop type if exists public.agent_action_status;
drop type if exists public.agent_action_kind;
