# Supabase — Loud Flow

Migrations e seed **prontas**. O projeto Supabase real ainda não foi provisionado — isso é decisão sua para não expor credenciais nesta etapa.

## Setup quando decidir provisionar

1. Criar projeto em https://supabase.com/dashboard.
2. Copiar `Project URL`, `anon key` e `service_role key` para `.env.local`.
3. Rodar as migrations no SQL Editor da Supabase, na ordem:
   - `migrations/0001_init.sql`
   - `migrations/0002_rls.sql`
   - `seed/0001_org_units.sql`
4. Habilitar **Email → Magic Link** em `Authentication > Providers`.
5. Configurar `Site URL` = `http://localhost:3000` (dev) e adicionar `http://localhost:3000/api/auth/callback` nos redirect URLs.
6. Definir `SEED_ADMIN_EMAIL` no `.env.local`, fazer login uma vez pelo magic link, depois rodar `node supabase/seed/seed_admin.mjs` para virar admin.

## Cenários de RLS cobertos

- `organizations`: membros leem; admin edita.
- `units`: membros leem; `unit_manager` só lê as suas próprias; admin escreve.
- `users`: cada um lê o próprio perfil; membros da mesma org se enxergam para atribuição de tarefa.
- `user_organizations`: membros da org leem; admin escreve.
- `user_units`: leitura própria; admin gerencia.
- `audit_log`: só admin lê. Escrita **exclusivamente** via service_role (nunca cliente).

## Testes negativos

Três cenários automatizados em [`../tests/rls.spec.ts`](../tests/rls.spec.ts) rodam contra o Supabase apontado por `.env.local`:

1. `unit_manager` só vê unidades do próprio `user_units`.
2. Não-admin não lê `audit_log`.
3. Não-admin não escreve em `user_organizations`.

Rode com `npm run test:rls` no diretório `loudflow/`. Os testes criam usuários e organização efêmeros via `service_role` e removem tudo no `afterAll`.
