# Loud Flow

Sistema interno da rede Loud Fit. Ver PRD e arquitetura em [`../docs/`](../docs/).

## Stack

- Next.js 16.3 (App Router, Turbopack)
- Supabase (Postgres + Auth com magic link + RLS)
- shadcn/ui + Tailwind v4
- Playwright para testes negativos de RLS (API-only)

## Setup local

```bash
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, SEED_ADMIN_EMAIL

npm install
npm run dev
```

App em http://localhost:3000. Sem Supabase configurado, o app mostra erro claro na primeira navegação.

## Validação operacional da Fase 1

Roteiro para conectar um Supabase real e validar auth + RLS. Todos os passos são sua ação (dashboard/email); os scripts são idempotentes.

1. **Provisionar Supabase**
   - https://supabase.com/dashboard → New project. Free tier atende.
   - Anote `Project URL`, `anon key`, `service_role key`.
2. **Preencher `.env.local`**
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   SEED_ADMIN_EMAIL=seu@email
   ```
3. **Aplicar migrations + seed** — no SQL Editor, na ordem:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/seed/0001_org_units.sql`
4. **Configurar Magic Link no Supabase Dashboard**
   - `Authentication → Providers → Email`: ativar magic link.
   - `Authentication → URL Configuration`:
     - Site URL: `http://localhost:3000`
     - Redirect URLs: adicionar `http://localhost:3000/api/auth/callback`
5. **Promover o primeiro admin**
   - Rode `npm run dev`, abra `/login`, peça o magic link para `SEED_ADMIN_EMAIL`, clique no link do email. Aparece o shell mas sem organização vinculada.
   - Rode `npm run seed:admin`. Ele vincula seu usuário como `admin` da org `loud-fit`.
   - Recarregue: shell + `/config` acessíveis.
6. **Sanity manual (5 min)**
   - Logout via avatar → volta para `/login`.
   - Em `/config`, convidar um email de teste como `unit_manager` → o convite chega no email.
   - Aceitar o convite em navegador anônimo → shell aparece, mas `/config` redireciona para `/` (não é admin).
7. **Testes negativos de RLS**
   ```bash
   npm run test:rls
   ```
   Os testes criam usuários efêmeros no seu Supabase (limpos ao final) e cobrem:
   - `unit_manager` só enxerga unidades do próprio `user_units`
   - não-admin não lê `audit_log`
   - não-admin não escreve em `user_organizations`

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Next dev server (Turbopack). |
| `npm run build` | Build de produção. |
| `npm run lint` | ESLint. |
| `npm run test:rls` | Playwright — testes negativos de RLS. Requer Supabase configurado. |
| `npm run seed:admin` | Vincula `SEED_ADMIN_EMAIL` como admin da org `loud-fit`. Precisa desse usuário já ter feito login uma vez. |

## Estrutura

```
src/app/(app)/       shell autenticado (sidebar, topbar)
src/app/(app)/config admin: usuários + unidades
src/app/login        magic link
src/app/api/auth     callback + signout
src/lib/auth         requireSession / requireAdmin
src/lib/supabase     browser / server / admin clients
src/proxy.ts         Next.js 16 proxy (ex-middleware), optimistic auth check
supabase/migrations  0001_init.sql + 0002_rls.sql
supabase/seed        0001_org_units.sql + seed_admin.mjs
tests/rls.spec.ts    3 cenários negativos de RLS
```
