-- Rollback manual controlado de 20260722170000_founders_pipeline.sql.
-- Este arquivo fica fora de supabase/migrations para nunca ser aplicado por db push.
--
-- Dependencias: a aplicacao deve voltar primeiro para uma versao que nao chame
-- crm_update_founders_pipeline nem leia selection_reason.
--
-- Risco: DROP COLUMN perde somente os motivos de selecao gravados depois da
-- migration. Faca backup desses valores antes do rollback se precisarem ser
-- preservados. Clientes, campanhas, interacoes e auditorias nao sao removidos.

drop function if exists public.crm_update_founders_pipeline(text, text, jsonb, timestamptz, text);
alter table if exists public.crm_campaign_members drop column if exists selection_reason;
