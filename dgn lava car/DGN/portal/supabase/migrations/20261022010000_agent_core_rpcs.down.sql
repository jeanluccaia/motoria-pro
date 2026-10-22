-- Rollback agent_core_rpcs.

drop function if exists public.agent_campaign_approve(uuid, text);
drop function if exists public.agent_campaign_upsert_draft(
  uuid, text, text, jsonb, int, text, text, text, text
);
drop function if exists public.agent_action_mark_executed(uuid, text, text);
drop function if exists public.agent_action_reject(uuid, text, text);
drop function if exists public.agent_action_approve(uuid, text, text);
drop function if exists public.agent_action_create(
  public.agent_action_kind, uuid, text, text, text, text, text,
  text, text, jsonb, text, timestamptz, text, uuid
);
