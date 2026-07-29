-- Rollback conservador: preserva membros, links, tracking, auditoria e interações.
-- Recomendações e snapshots permanecem armazenados para evitar perda histórica.
drop function if exists public.crm_manage_founder_curation(text,text,text,text,text,text,text,jsonb,timestamptz,text);
