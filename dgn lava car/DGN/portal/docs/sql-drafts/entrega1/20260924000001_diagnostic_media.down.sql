-- Rollback do 20260924000003_diagnostic_media.sql
-- ATENÇÃO: só rodar depois de esvaziar o bucket manualmente (ou aceitar
-- a perda dos objetos). Rodando com objetos dentro, o DELETE falha por FK.

delete from storage.buckets where id = 'diagnostic-media';
