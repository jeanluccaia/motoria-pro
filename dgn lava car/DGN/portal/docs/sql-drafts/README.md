# SQL drafts (não aplicadas)

Este diretório guarda rascunhos de funções SQL que ainda não devem ser
aplicadas em Production. O runner de migrations (Supabase CLI ou scripts do
projeto) só considera arquivos em `db/migrations/` e `supabase/migrations/`
— nada aqui é executado automaticamente.

Para aplicar um rascunho, mova o arquivo para os dois diretórios canônicos
e siga o fluxo normal de review + apply.

## Índice

_(vazio)_

Rascunhos já promovidos para migration oficial:

- `crm_promote_existing_subscription` → aplicada em Lote 1
  (`db/migrations/20260918000000_promote_existing_subscription_rpc.sql`).
- `crm_create_manual_subscription` → aplicada na Fase 2 do reconciliador
  (`db/migrations/20260919000000_create_manual_subscription_rpc.sql`).
