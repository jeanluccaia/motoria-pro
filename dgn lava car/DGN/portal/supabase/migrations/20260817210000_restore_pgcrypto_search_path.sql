-- Reaplica o fix de search_path para incluir "extensions" (schema onde vive
-- pgcrypto no Supabase). As migrations 20260817190000 e 20260817200000 fizeram
-- CREATE OR REPLACE FUNCTION com `set search_path=public`, o que descartou o
-- ajuste feito em 20260805010000. Sem "extensions" no search_path, o resolver
-- não encontra gen_random_bytes(int) e create_invite/create_page falham com
-- SQLSTATE 42883 na hora de gerar o slug do convite.
alter function public.crm_manage_founder_curation_v2(
  text, text, text, text, text, text, text, text, jsonb, timestamptz, text
) set search_path = public, extensions;
