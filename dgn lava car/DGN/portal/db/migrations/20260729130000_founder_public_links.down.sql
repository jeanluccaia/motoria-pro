-- Rollback manual: invalida todos os slugs persistidos, mas preserva clientes,
-- campanha, pipeline, eventos, interacoes, auditorias, scores e assinaturas.
drop table if exists public.crm_founder_public_links;
