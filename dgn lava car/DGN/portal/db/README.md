# DGN Growth — camada persistente

## Estado atual

Sem persistência real ainda. Este diretório contém:

- `migrations/` — SQL versionado (schema Postgres para Supabase).
- `scripts/` — utilitários (migração de JSON legado, seeds).
- `seeds/` — dados iniciais idempotentes (13 assinantes detectados).

**Enquanto as 3 variáveis do Supabase não estiverem configuradas na Vercel, features de escrita permanecem desabilitadas via feature flag `DGN_GROWTH_DATA_SOURCE=json`.**

## Fonte de leitura do DGN Growth

`DGN_GROWTH_DATA_SOURCE` aceita somente `json` (padrão seguro) ou `db`. No modo
`json`, o workspace usa os 1.152 clientes operacionais locais. No modo `db`, uma
camada server-side consulta clientes, veículos, assinaturas, membros de campanha,
interações e snapshots de score e os converte centralmente para o modelo da tela.
Um valor diferente falha com uma mensagem de configuração clara.

O fallback de `db` para JSON nunca é silencioso. Ele só ocorre quando
`DGN_GROWTH_ALLOW_JSON_FALLBACK` está explicitamente configurada como `true`; a
interface então informa `Fonte: JSON local temporário`. Sem essa opção, uma falha
do banco produz uma tela administrativa de erro e registra no servidor apenas a
mensagem operacional, sem credenciais.

A URL e a service role são lidas exclusivamente por módulos marcados como
server-only. O componente client recebe somente o modelo já mapeado, portanto a
service role não entra no bundle do navegador e não há consulta direta ao
Supabase pela interface.

Para validar o modo DB sem escrita, configure a fonte como `db`, acesse
`/admin/growth/intelligence` com uma sessão administrativa válida e confirme
quatro registros: Benedito Constantino (Founder 001), José Moreira (002), Rikardo
Oliveira (003) e Iara Menezes selecionada sem confirmação. Recarregar deve manter
os mesmos quatro registros, veículos e assinaturas. Não rode o apply para essa
verificação.

As ações comerciais permanecem somente leitura no modo DB. O cabeçalho e um aviso
no workspace deixam claro que a persistência está em implementação; tentativas de
alteração são interceptadas e não aparentam ter sido salvas.

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

## Modelo de seguranca vigente

- O browser nao consulta tabelas `crm_*` diretamente.
- O admin atual (`/admin/growth`) valida a sessao no Next e chama apenas API/server actions internas.
- Cada route handler/server action deve validar a sessao administrativa atual antes de consultar o banco.
- Nenhuma rota deve aceitar campo enviado pelo browser como prova de permissao.
- Somente apos a validacao administrativa, o servidor usa `SUPABASE_SERVICE_ROLE_KEY` para operacoes controladas.
- Chamadas com `service_role` ignoram RLS por `BYPASSRLS`; por isso a autorizacao real desta fase acontece antes da consulta ao Supabase.
- `DGN_GROWTH_DATA_SOURCE=json` continua sendo o default ate migrations, dry-run seletivo e fluxo de escrita estarem aprovados.
- A migration `0002_crm_rls_policies.sql` habilita RLS defensiva em todas as tabelas CRM e bloqueia `anon` e `authenticated`.
- O portal ainda nao usa Supabase Auth; portanto claims como `dgn_growth_role`, `admin`, `operator` e `auditor` nao sao efetivas hoje.
- Claims e policies por usuario ficam para arquitetura futura, depois de autenticação compativel.

Tabelas protegidas por RLS:

- `crm_customers`
- `crm_vehicles`
- `crm_subscriptions`
- `crm_campaign_members`
- `crm_interactions`
- `crm_audit_logs`
- `crm_score_snapshots`
- `crm_duplicate_candidates`

`crm_interactions` e `crm_audit_logs` sao append-only por trigger: update/delete sao bloqueados. Nao ha grant nem policy de delete em nenhuma tabela CRM.

## Como aplicar as migrations

Estado local atualizado em 2026-07-15:

- Supabase CLI instalada como dev dependency do portal (`supabase` via `npx`).
- Projeto local inicializado com `npx supabase init`.
- Configuracao local criada em `supabase/config.toml`.
- Migrations sincronizadas para a pasta esperada pela CLI:
  - `supabase/migrations/20260715210000_crm_schema.sql`
  - `supabase/migrations/20260715211000_crm_rls_policies.sql`
- `db/migrations/` permanece como a pasta legivel/manual do projeto; para testes via CLI, manter `supabase/migrations/` sincronizada com ela.
- Seed SQL da CLI esta desativado no teste local (`[db.seed].enabled = false`) porque ainda nao ha `supabase/seed.sql`.
- Este fluxo local nao usa `supabase link`, nao conecta ao projeto remoto e nao executa `--apply`.

### Teste local isolado via Supabase CLI

```bash
npx supabase start
npx supabase db reset
```

Para executar SQL de validacao contra o banco local:

```bash
npx supabase db query --local "<sql>"
```

Ou usar a connection string local informada pela CLI com `psql`.

Estado anterior verificado antes da inicializacao:

- Supabase CLI nao esta instalada no PATH local (`supabase` nao reconhecido).
- Nao existe `supabase/config.toml`.
- Nao existe diretorio `supabase/migrations`.
- Este repo ainda nao esta preparado como projeto Supabase CLI vinculado.

Nao usar `supabase db push --file ...` como instrucao de aplicacao: esse comando nao foi validado localmente e nao deve ser assumido.

### Alternativa atual: psql manual

Enquanto nao houver projeto Supabase CLI inicializado, a alternativa explicita e aplicar manualmente, em ordem, com `ON_ERROR_STOP`:

```bash
psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f db/migrations/0001_crm_schema.sql
psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f db/migrations/0002_crm_rls_policies.sql
```

Antes de rodar:

- confirmar ambiente/projeto;
- fazer backup;
- confirmar que as tabelas `crm_*` ainda nao existem ou que a aplicacao idempotente foi revisada;
- nao inserir dados reais nesta etapa.

### Alternativa futura: Supabase CLI oficial

Para usar historico de migrations da CLI, primeiro inicializar e vincular o projeto. Nao fazer isso automaticamente.

```bash
supabase init
supabase link --project-ref <project-ref>
supabase migration list --linked
```

A CLI espera migrations em `supabase/migrations`. Se esta rota for adotada, escolher uma fonte canonica:

- mover/espelhar `db/migrations/0001_crm_schema.sql` e `0002_crm_rls_policies.sql` para `supabase/migrations/<timestamp>_<nome>.sql`;
- registrar no README qual pasta passa a ser canonica;
- evitar manter duas copias editaveis divergentes.

Aplicacao remota via CLI, depois de link e migrations na pasta esperada:

```bash
supabase migration list --linked
supabase db push --linked
supabase migration list --linked
```

Teste local via CLI, depois de `supabase init` e migrations na pasta esperada:

```bash
supabase start
supabase db reset
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

Confirmar que nao ha policies abrindo acesso direto nesta fase:

```sql
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename like 'crm_%'
order by tablename, policyname;
```

Esperado nesta fase: nenhuma policy ativa para `crm_*`.

Testar acesso anon negado:

```bash
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/crm_customers?select=id&limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

Esperado: erro de permissao ou lista vazia sem dados sensiveis.

Testar insert anon negado:

```bash
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/crm_customers" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"blocked","normalized_name":"blocked"}'
```

Testar `authenticated` comum negado: usar um JWT real de usuario Supabase sem claims administrativas e repetir os SELECT/INSERT acima com `Authorization: Bearer <jwt>`. Esperado: sem acesso.

Claims ausentes ou invalidas tambem nao concedem acesso, porque a migration atual nao cria grants/policies baseadas em claims.

Testar protecao do audit log:

```sql
update public.crm_audit_logs set actor = 'tamper-test';
delete from public.crm_audit_logs;
```

Testar protecao de interacoes:

```sql
update public.crm_interactions set actor = 'tamper-test';
delete from public.crm_interactions;
```

Testar rota server-side sem sessao admin valida:

```bash
curl -i "$APP_ORIGIN/api/admin/growth/subscribers/detected"
```

Esperado em ambiente com `DGN_ADMIN_PASSWORD`: `401 unauthorized` sem cookie administrativo valido.

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
