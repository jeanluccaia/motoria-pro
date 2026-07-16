# DGN Growth — camada persistente

## Estado atual

Sem persistência real ainda. Este diretório contém:

- `migrations/` — SQL versionado (schema Postgres para Supabase).
- `scripts/` — utilitários (migração de JSON legado, seeds).
- `seeds/` — dados iniciais idempotentes (13 assinantes detectados).

**Enquanto as 3 variáveis do Supabase não estiverem configuradas na Vercel, features de escrita permanecem desabilitadas via feature flag `DGN_GROWTH_DATA_SOURCE=json`.**

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

`SUPABASE_SERVICE_ROLE_KEY` **nunca** deve ser exposta ao cliente. É usada apenas em route handlers, server actions e scripts server-side.

## Como aplicar as migrations

Via Supabase CLI (recomendado):

```bash
supabase db push --file db/migrations/0001_crm_schema.sql
```

Via psql direto:

```bash
psql "$POSTGRES_URL" -f db/migrations/0001_crm_schema.sql
```

## Rollback

```bash
psql "$POSTGRES_URL" -f db/migrations/0001_crm_schema.down.sql
```

O rollback é destrutivo — apaga todas as tabelas `crm_*` e os enums. Fazer backup antes.

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

Roda os 40 testes de `normalizers`, `reconciliation` e `score-engine` via `node:test`.
