# SQL drafts (não aplicadas)

Este diretório guarda rascunhos de funções SQL que ainda não devem ser
aplicadas em Production. O runner de migrations (Supabase CLI ou scripts do
projeto) só considera arquivos em `db/migrations/` e `supabase/migrations/`
— nada aqui é executado automaticamente.

Para aplicar um rascunho, mova o arquivo para os dois diretórios canônicos
e siga o fluxo normal de review + apply.

## Índice

- `crm_create_manual_subscription.sql` — RPC de criação manual de
  subscription NÃO-PagBank (complemento à `crm_promote_existing_subscription`
  já em prod). Testada em transaction ROLLBACK contra prod
  (`wzjjdlzgxkvfynmpsczf`) — 9/9 guards + idempotência. Aguarda review antes
  do apply da Fase 2 do reconciliador de assinantes.
