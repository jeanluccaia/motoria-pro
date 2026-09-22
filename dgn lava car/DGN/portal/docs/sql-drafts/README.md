# SQL drafts (não aplicadas)

Este diretório guarda rascunhos de funções SQL que ainda não devem ser
aplicadas em Production. O runner de migrations (Supabase CLI ou scripts do
projeto) só considera arquivos em `db/migrations/` e `supabase/migrations/`
— nada aqui é executado automaticamente.

Para aplicar um rascunho, mova o arquivo para os dois diretórios canônicos
e siga o fluxo normal de review + apply.

## Índice

**DEPRECATED · NÃO APROVADOS** (mantidos só para rastro histórico):

- `fase4-promote-manual-verification.DEPRECATED.sql` — propunha converter
  auto `evidence=manual + status=confirmed` em `verification=manual_confirmation`.
  Reprovado: confirmação administrativa não é evidência de recebimento.
- `fase4-backfill-founders-verification.DEPRECATED.sql` — propunha backfill
  dos 4 Founders com base em audit_log `subscription.promoted` do Digo.
  Reprovado pela mesma razão. Nenhum dos 4 tem comprovante de recebimento
  registrado (`last_payment_confirmed_at=NULL`, `payment_confidence=0`).

Nova versão de qualquer um destes rascunhos precisa **exigir comprovante
de recebimento explícito** (PIX/TED/boleto pago, data, valor, canal,
ID de transação) e novo audit_log dedicado (ex.:
`subscription.receipt_registered`) — nunca reaproveitar as regras antigas.

Rascunhos já promovidos para migration oficial:

- `crm_promote_existing_subscription` → aplicada em Lote 1
  (`db/migrations/20260918000000_promote_existing_subscription_rpc.sql`).
- `crm_create_manual_subscription` → aplicada na Fase 2 do reconciliador
  (`db/migrations/20260919000000_create_manual_subscription_rpc.sql`).
