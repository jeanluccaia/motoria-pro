# DGN Growth — camada persistente

## Estado atual

Sem persistência real ainda. Este diretório contém:

- `migrations/` — SQL versionado (schema Postgres para Supabase).
- `scripts/` — utilitários (migração de JSON legado, seeds).
- `seeds/` — dados iniciais idempotentes (13 assinantes detectados).

**Enquanto as 3 variáveis do Supabase não estiverem configuradas na Vercel, features de escrita permanecem desabilitadas via feature flag `DGN_GROWTH_DATA_SOURCE=json`.**

## Base historica x base operacional

- `lib/growth/dgn-customers.json` permanece como historico completo, com 2.354 clientes unicos.
- A operacao atual do DGN Growth usa `dgnCustomers`, exportado por `lib/growth/dgn-growth-data.ts`.
- `dgnCustomers` e uma visao operacional de `allDgnCustomers`, filtrada por `lastAttendance >= 2025-01-01`.
- O corte unico fica em `DGN_OPERATIONAL_CUTOFF` e nao apaga nem regrava o historico.
- Founders confirmados e assinantes ativos confirmados continuam preservados mesmo se houver excecao de data.
- O Excel original nao precisa ser processado novamente para aplicar este recorte.

## Variáveis de ambiente esperadas (Vercel + `.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Feature flag — controla fonte de dados do Growth
# json: leitura do JSON legado (default)
# db:   leitura do Supabase (só habilitar depois do dry-run aprovado)
DGN_GROWTH_DATA_SOURCE=json
```

`SUPABASE_SERVICE_ROLE_KEY` **nunca** deve ser exposta ao cliente/browser. Ela deve ser usada apenas em route handlers, server actions e scripts server-side.

## Modelo de seguranca

- O browser nao consulta tabelas `crm_*` diretamente.
- O admin atual (`/admin/growth`) valida a sessao no Next e chama apenas API/server actions internas.
- O servidor usa `SUPABASE_SERVICE_ROLE_KEY` para operacoes administrativas controladas.
- `DGN_GROWTH_DATA_SOURCE=json` continua sendo o default ate migrations, dry-run seletivo e fluxo de escrita estarem aprovados.
- A migration `0002_crm_rls_policies.sql` habilita RLS defensiva em todas as tabelas CRM e bloqueia `anon`.
- Claims futuras de Supabase Auth podem liberar acesso direto somente para usuarios `authenticated` com `dgn_growth_role` em `app_metadata` ou `user_metadata`.
- Roles aceitas pela RLS: `admin`, `operator`, `auditor`.
- `auditor` le CRM e audit log, mas nao escreve.
- `operator` le/escreve CRM operacional e insere audit log, mas nao le audit log.
- `admin` le/escreve CRM operacional e le/insere audit log.

Tabelas protegidas por RLS:

- `crm_customers`
- `crm_vehicles`
- `crm_subscriptions`
- `crm_campaign_members`
- `crm_interactions`
- `crm_audit_logs`
- `crm_score_snapshots`
- `crm_duplicate_candidates`

`crm_interactions` e `crm_audit_logs` sao append-only por trigger: update/delete sao bloqueados. Nao ha policy de delete em nenhuma tabela CRM.

## Como aplicar as migrations

Nao aplicar no remoto sem revisar o diff, confirmar ambiente e ter backup. A ordem correta e:

Via Supabase CLI (recomendado):

```bash
supabase db push --file db/migrations/0001_crm_schema.sql
supabase db push --file db/migrations/0002_crm_rls_policies.sql
```

Via psql direto:

```bash
psql "$POSTGRES_URL" -f db/migrations/0001_crm_schema.sql
psql "$POSTGRES_URL" -f db/migrations/0002_crm_rls_policies.sql
```

## Validacao de RLS depois da aplicacao

Confirmar que RLS esta ligado:

```sql
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relname in (
  'crm_customers',
  'crm_vehicles',
  'crm_subscriptions',
  'crm_campaign_members',
  'crm_interactions',
  'crm_audit_logs',
  'crm_score_snapshots',
  'crm_duplicate_candidates'
)
order by relname;
```

Confirmar policies:

```sql
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename like 'crm_%'
order by tablename, policyname;
```

Testar acesso anon negado:

```bash
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/crm_customers?select=id&limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

Esperado: erro de permissao ou lista vazia sem dados sensiveis.

Testar acesso administrativo futuro com JWT `authenticated` contendo `dgn_growth_role=admin`:

```sql
select public.crm_growth_role();
select count(*) from public.crm_customers;
```

Testar protecao do audit log:

```sql
update public.crm_audit_logs set actor = 'tamper-test';
delete from public.crm_audit_logs;
```

## Rollback

Rollback apenas da camada RLS:

```bash
psql "$POSTGRES_URL" -f db/migrations/0002_crm_rls_policies.down.sql
```

Rollback completo do schema:

```bash
psql "$POSTGRES_URL" -f db/migrations/0001_crm_schema.down.sql
```

O rollback de `0001` e destrutivo: apaga todas as tabelas `crm_*` e os enums. Fazer backup antes.

## Migração do JSON legado

**Sempre rodar dry-run primeiro.** Node 24 executa arquivos `.ts` nativamente, então não precisa mais de `tsx`:

```bash
# base inteira (2354 linhas) — só para revisão de qualidade e duplicidades
npm run db:dry-run

# ou, equivalente:
node db/scripts/migrate-legacy-json.ts --dry-run
```

### Modo seletivo (recomendado para import real)

Decisão comercial vigente (retomada 2026-07-15): **não** migrar a base inteira.
A 4uCar continua sendo a base operacional completa; o Supabase recebe só o
que precisa da campanha (assinantes confirmados, Founders 001/002/003,
candidatos aprovados, lista de espera).

Montar um arquivo `db/scripts/selection-<data>.json` com os `legacy_ids` que
devem entrar (aceita `string[]` ou `{ "ids": string[] }`, ou texto puro com um
id por linha). Ver `db/scripts/example-selection.json`.

```bash
node db/scripts/migrate-legacy-json.ts --dry-run --select db/scripts/example-selection.json
```

O relatório sai em `db/reports/dry-run-selective-<timestamp>.json` com o campo
extra `selection: { total, selected, missing }` para rastrear o que casou.

### Apply

`--apply` **ainda não está implementado** — para não expor risco de import em
massa antes da lista seletiva estar aprovada. O script sai com exit 3 e
mensagem explicando o próximo passo. Ver `db/reports/supabase-auth-resume-*.md`.

### Regras críticas

- Idempotente: rodar duas vezes não duplica.
- Preserva `legacy_id` do JSON atual.
- Preserva Founders `Nº001` (Benedito), `Nº002` (José), `Nº003` (Rikardo).
- **Não** promove Iara automaticamente. `Nº004` fica em aberto; Iara migra como assinante detectada + candidata recomendada, sem `founder_status = confirmado`. Ver [[project-dgn-crm-founders-2026]] na memória.
- Nenhum merge automático em casos ambíguos.

## Seed dos 13 assinantes detectados

Só rodar depois que houver base persistida (hoje, ler-apenas via view em memória):

```bash
node db/seeds/subscribers-2026-q3.ts --dry-run
node db/seeds/subscribers-2026-q3.ts --apply
```

Aplica os 13 registros como `subscription_status = 'detectado'` (evidência de agendamento futuro) ou `'pendente_validacao'` (falta plano/ciclo). **Nunca** `'ativo'` automático.

Paulo (nome incompleto) é sempre marcado para conciliação manual.

## Testes

```bash
npm test
```

Roda os testes de `dgn-growth-data`, `normalizers`, `reconciliation` e `score-engine` via `node:test`.
