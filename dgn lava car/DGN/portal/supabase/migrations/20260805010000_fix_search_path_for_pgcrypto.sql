-- pgcrypto no Supabase reside no schema "extensions" (não em public).
-- As funções crm_manage_founder_curation e crm_manage_founder_curation_v2
-- foram criadas com `set search_path = public`, o que impede o resolver de
-- encontrar `gen_random_bytes(int)` na hora de gerar o slug do convite.
-- Ajusta o search_path para incluir extensions em ambas as funções.

alter function public.crm_manage_founder_curation(
  text, text, text, text, text, text, text, jsonb, timestamptz, text
) set search_path = public, extensions;

alter function public.crm_manage_founder_curation_v2(
  text, text, text, text, text, text, text, text, jsonb, timestamptz, text
) set search_path = public, extensions;
