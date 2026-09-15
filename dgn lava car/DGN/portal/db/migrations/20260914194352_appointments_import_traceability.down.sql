-- =========================================================================
-- Rollback de 20260914194352_appointments_import_traceability
--
-- Ordem: índice → constraint → colunas. Nesta ordem porque a CHECK
-- constraint referencia todos os 3 campos e o índice depende deles.
--
-- Segurança do rollback:
--
--   ANTES de qualquer import 4UCAR real:
--     rollback é totalmente reversível sem perda. O estado do banco volta
--     idêntico ao pré-migration.
--
--   DEPOIS do primeiro import 4UCAR real:
--     as LINHAS de crm_appointments permanecem (o applier já criou os
--     agendamentos com scheduled_at, service_type, notes, etc.), mas o
--     rollback DESTRÓI IRREVERSIVELMENTE:
--       * external_ref     (nº da OS 4UCAR).
--       * import_source    (que identificava a origem "4UCAR").
--       * imported_at      (o carimbo da ingestão).
--       * A CHECK constraint (integridade + canonicalização).
--       * O índice único de idempotência.
--
--     Reaplicar a migration NÃO restaura essa identidade externa:
--     as colunas voltam VAZIAS, a CHECK passa a aceitar "all-null" para
--     todas as linhas, e uma nova ingestão da mesma OS não terá como
--     reconhecer que aquela linha já existe. Resultado: DUPLICAÇÃO
--     silenciosa no Portal e no relatório operacional.
--
--     Portanto, rollback pós-import é operação destrutiva de metadados.
--     Antes de executá-lo em produção:
--       1. Fazer dump da tabela crm_appointments (TODAS as colunas) para
--          preservar a associação external_ref ↔ id em disco.
--       2. Depois de reaplicar a migration, backfill obrigatório dos 3
--          campos a partir do dump (ou de outra fonte reconciliada) ANTES
--          de PERMITIR qualquer nova ingestão. Backfill deve gravar
--          import_source como '4UCAR' (uppercase canônico), respeitando
--          a CHECK.
--       3. Sem esse backfill, o índice único parcial fica de fato inerte
--          (todas as linhas NULL-NULL), e o applier reproduz OS-a-OS
--          silenciosamente.
--
-- Idempotente (uso de IF EXISTS).
-- =========================================================================

drop index if exists public.ux_crm_appointments_import;

alter table public.crm_appointments
  drop constraint if exists crm_appointments_import_traceability_check;

alter table public.crm_appointments
  drop column if exists imported_at,
  drop column if exists import_source,
  drop column if exists external_ref;
