-- =========================================================================
-- 20260914194352_appointments_import_traceability
--
-- Aplicada em Production em 2026-09-14 19:43:52 UTC. O Supabase registrou a
-- versão real de push (20260914194352); o arquivo local segue essa versão
-- para representar fielmente o estado do banco. NÃO reaplicar.
--
-- Objetivo único: dar rastreabilidade e idempotência a agendamentos criados
-- via importação externa (hoje 4UCAR; potencialmente outros no futuro).
--
-- Escopo estritamente mínimo:
--   * external_ref  → chave natural do sistema de origem (ex.: "OS-018125").
--   * import_source → machine key em UPPERCASE do sistema de origem
--                     (ex.: "4UCAR"). NÃO é label de UI.
--   * imported_at   → carimbo do momento da ingestão.
--   * CHECK: all-null OU all-not-null + regras de formato canônico
--     (import_source em [A-Z0-9_]+, external_ref sem espaços externos).
--   * Índice único parcial em (import_source, external_ref) → idempotência.
--
-- O que esta migration NÃO faz (deliberado):
--   * NÃO altera enums. crm_appointment_source segue com os 3 valores atuais
--     (MANUAL_ADMIN, PORTAL, AUTO). O valor 'EXTERNAL_IMPORT' — recomendado
--     para o applier — será adicionado em migration separada e focada,
--     antes do importer entrar em cena. MANUAL_ADMIN NÃO deve ser usado
--     para dados importados.
--   * NÃO cria índice secundário para leitura por import_source. Sem query
--     imediata que justifique.
--   * NÃO altera crm_customers, crm_vehicles, crm_subscriptions, crm_interactions.
--   * NÃO toca Auth (crm_customer_auth), Portal Access ou RPC
--     portal_get_current_subscriber().
--   * NÃO altera RLS, policies, GRANTs, triggers, funções ou buckets.
--   * NÃO altera nenhuma linha existente. As 8 linhas atuais de crm_appointments
--     ficam com external_ref/import_source/imported_at = NULL — o que satisfaz
--     naturalmente o "all-null" da CHECK.
--
-- Uso canônico (futuro, quando o applier 4UCAR for implementado, e após a
-- migration separada que adiciona 'EXTERNAL_IMPORT' ao enum):
--
--   INSERT INTO crm_appointments (
--     customer_id, scheduled_at, service_type, status,
--     source, notes,
--     external_ref, import_source, imported_at
--   )
--   VALUES (
--     $1, $2, $3, 'scheduled',
--     'EXTERNAL_IMPORT',        -- enum (adicionado em migration separada)
--     $notes,
--     'OS-018125',              -- external_ref (chave natural da OS)
--     '4UCAR',                  -- import_source (machine key canônica)
--     now()                     -- imported_at
--   )
--   ON CONFLICT (import_source, external_ref)
--   WHERE import_source IS NOT NULL AND external_ref IS NOT NULL
--   DO UPDATE SET
--     scheduled_at = EXCLUDED.scheduled_at,
--     service_type = EXCLUDED.service_type,
--     notes        = EXCLUDED.notes,
--     updated_at   = now()
--   WHERE crm_appointments.status IN ('scheduled', 'confirmed');
--
-- Forward-only, aditiva, reentrante.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1) Colunas aditivas
-- -------------------------------------------------------------------------
--
-- ALTER TABLE ... ADD COLUMN nullable em Postgres 17 é metadata-only:
-- não reescreve linhas, lock ACCESS EXCLUSIVE momentâneo. Tabela hoje = 8 rows.

alter table public.crm_appointments
  add column if not exists external_ref  text,
  add column if not exists import_source text,
  add column if not exists imported_at   timestamptz;

comment on column public.crm_appointments.external_ref is
  'Chave natural do registro no sistema de origem (ex.: "OS-018125" no 4UCAR). '
  'NULL para agendamentos criados diretamente no admin. Sem espaços externos '
  '(btrim aplicado pela CHECK). Estado obrigatoriamente coerente com '
  'import_source e imported_at.';

comment on column public.crm_appointments.import_source is
  'Machine key em UPPERCASE do sistema de origem quando o registro veio via '
  'import (ex.: "4UCAR"). Somente [A-Z0-9_]+ é aceito. NÃO é label de UI. '
  'NULL para agendamentos criados diretamente no admin. NÃO se confunde com o '
  'enum crm_appointment_source (aquele descreve o canal interno de criação); '
  'este campo texto descreve a proveniência externa e compõe a chave natural '
  'com external_ref.';

comment on column public.crm_appointments.imported_at is
  'Momento em que este registro foi criado por uma rotina de import. '
  'NÃO é atualizado por upserts subsequentes — permanece o carimbo do primeiro '
  'INSERT. NULL para linhas não importadas.';

-- -------------------------------------------------------------------------
-- 2) CHECK constraint — integridade + canonicalização da tripla import
-- -------------------------------------------------------------------------
--
-- Impõe:
--   (a) Agendamento manual: os 3 campos = NULL.
--   (b) Agendamento importado: os 3 campos != NULL, com regras:
--       * import_source em UPPERCASE, não vazio, apenas [A-Z0-9_].
--       * external_ref não vazio, sem espaços externos (btrim idempotente).
--
-- Rejeita explicitamente valores não-canônicos de import_source (qualquer
-- coisa que não case com ^[A-Z0-9_]+$, incluindo variações mixed-case da
-- machine key oficial "4UCAR"), import_source vazio, external_ref com
-- trailing space, etc.
--
-- Padrão de criação idempotente: DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT.
-- Motivo: `ADD CONSTRAINT IF NOT EXISTS` não existe em Postgres 17, e o
-- padrão `do $$ ... exception when duplicate_object $$` usado em `create type`
-- deste repo silenciaria eventuais endurecimentos futuros da CHECK. Para
-- constraints que podem evoluir (esta pode), preferir drop+add explícito.
-- A migration inteira roda em transação (padrão Supabase), então drop+add é
-- atômico: se a nova definição falhar validação em alguma linha existente,
-- o DROP é revertido junto.

alter table public.crm_appointments
  drop constraint if exists crm_appointments_import_traceability_check;

alter table public.crm_appointments
  add constraint crm_appointments_import_traceability_check
  check (
    (
      import_source is null
      and external_ref is null
      and imported_at is null
    )
    or
    (
      import_source is not null
      and external_ref is not null
      and imported_at is not null
      and length(import_source) > 0
      and import_source = upper(import_source)
      and import_source ~ '^[A-Z0-9_]+$'
      and length(external_ref) > 0
      and external_ref = btrim(external_ref)
    )
  );

comment on constraint crm_appointments_import_traceability_check
  on public.crm_appointments is
  'Integridade + canonicalização da tripla (import_source, external_ref, '
  'imported_at). Estados válidos: (a) todos NULL (agendamento manual) OU '
  '(b) todos NOT NULL, com import_source em UPPERCASE de [A-Z0-9_]+ e '
  'external_ref não vazio, sem espaços externos. Rejeita estados parciais e '
  'variações não-canônicas da machine key (mixed-case, com pontuação, etc.). '
  'Valor canônico atual: "4UCAR".';

-- -------------------------------------------------------------------------
-- 3) Índice único parcial — idempotência de reimportação
-- -------------------------------------------------------------------------
--
-- Chave composta (import_source, external_ref). Predicado parcial garante:
--   * Não impacta as 8 linhas existentes (todas NULL-NULL).
--   * Permite agendamentos manuais sem external_ref coexistirem.
--   * Suporta ON CONFLICT (import_source, external_ref)
--     WHERE import_source IS NOT NULL AND external_ref IS NOT NULL
--     DO UPDATE (Postgres 9.5+ com predicado idêntico).

create unique index if not exists ux_crm_appointments_import
  on public.crm_appointments (import_source, external_ref)
  where import_source is not null
    and external_ref is not null;

comment on index public.ux_crm_appointments_import is
  'Idempotência de reimportação externa. Uma mesma external_ref só pode '
  'aparecer 1x por import_source. Não afeta agendamentos manuais '
  '(external_ref NULL). Aplicação deve usar ON CONFLICT '
  '(import_source, external_ref) WHERE import_source IS NOT NULL AND '
  'external_ref IS NOT NULL DO UPDATE para reimportação idempotente. '
  'Exemplo canônico: import_source="4UCAR", external_ref="OS-018125".';

-- =========================================================================
-- FIM. Zero linhas modificadas. Zero enums/funções/triggers/policies alteradas.
-- Zero impacto em Auth, PagBank, subscriptions canônicas, Portal Access.
-- =========================================================================
