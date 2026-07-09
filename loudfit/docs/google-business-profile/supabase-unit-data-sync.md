# Supabase Unit Data Sync — LoudFit

**Data:** 2026-07-09
**Contexto:** Após o saneamento dos dados em `src/lib/supabase.ts`, este documento analisa se as correções precisam ser espelhadas no Supabase e qual o caminho seguro para fazer isso.

---

## Conclusão antecipada

> **O Supabase é a fonte primária em produção.**
> As correções de endereços feitas em `fallbackUnits` **não chegam ao site em produção** se o Supabase estiver conectado com dados antigos. O espelhamento é necessário para os campos `endereco_completo` de 5 unidades.
>
> O campo `whatsapp_url` (incluindo o do Ipiranga, adicionado no saneamento) já está protegido — ele é sobrescrito pelo `officialUnitData` em `normalizeUnit()`, então chega corretamente ao site mesmo que o Supabase tenha valor desatualizado.

---

## 1. Como os dados são carregados em produção

### Fluxo completo

```
Request → getUnits() / getUnitBySlug()
              │
              ├── getClient() → verifica SUPABASE_URL e SUPABASE_ANON_KEY
              │       │
              │       ├── credenciais inválidas ou ausentes → retorna null
              │       │       └── usa fallbackUnits (src/lib/supabase.ts)
              │       │
              │       └── credenciais válidas → Supabase client criado
              │               │
              │               ├── query na tabela `units` com sucesso e dados presentes
              │               │       └── usa dados do Supabase
              │               │
              │               └── erro ou tabela vazia → usa fallbackUnits
              │
              └── normalizeUnit() aplicado em qualquer caso
                      │
                      └── sobrescreve whatsapp_url, horarios, checkoutUrl
                          com valores de officialUnitData (hardcoded no código)
```

### Código-fonte relevante (`src/lib/supabase.ts`)

```typescript
function getClient() {
  // Retorna null se URL ou key contiver '[' (indica placeholder não configurado)
  if (!url || url.includes('[') || !anonKey || anonKey.includes('[')) return null
  return createClient(url, anonKey)
}

export async function getUnits(): Promise<Unit[]> {
  const db = getClient()
  if (!db) return fallbackUnits.map(normalizeUnit)           // sem Supabase
  const { data, error } = await db.from('units').select('*').order('ordem')
  if (error) return fallbackUnits.map(normalizeUnit)          // erro no Supabase
  return data?.length
    ? (data as Unit[]).map(normalizeUnit)                     // usa Supabase
    : fallbackUnits.map(normalizeUnit)                        // tabela vazia
}
```

### Ambiente local (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://[seu-projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[sua-anon-key]
```

O `.env.local` tem **placeholders** com `[`. A função `getClient()` detecta isso e retorna `null` — portanto **localmente o site sempre usa `fallbackUnits`**, nunca o Supabase real.

### Ambiente de produção (Vercel)

Se as variáveis de ambiente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estiverem configuradas no painel Vercel com valores reais, o Supabase **é a fonte primária**. Os `fallbackUnits` só entram se houver falha de conexão.

---

## 2. Tabela Supabase identificada

| Item | Valor |
|------|-------|
| Nome da tabela | `units` |
| Query usada | `db.from('units').select('*').order('ordem')` |
| Query por slug | `db.from('units').select('*').eq('slug', slug).single()` |
| Outras tabelas | `depoimentos`, `leads_franquia` (não afetadas) |

### Campos da tabela `units` (inferidos do tipo `Unit` em `src/types/index.ts`)

| Campo | Tipo | Observação |
|-------|------|------------|
| `id` | string | PK |
| `slug` | string | Identificador da URL |
| `nome` | string | Nome completo ex: "LoudFit Amoreiras" |
| `bairro` | string | Bairro da unidade |
| `cidade` | string | Cidade |
| `estado` | string | UF |
| `endereco_completo` | string | **Campo crítico — precisa de atualização** |
| `lat` | number | Latitude |
| `lng` | number | Longitude |
| `whatsapp` | string | Número limpo sem formatação |
| `whatsapp_url` | string \| null | URL completa wa.me — sobrescrita por `officialUnitData` |
| `instagram_url` | string | |
| `google_maps_url` | string | Atualmente vazio em todas as unidades |
| `google_place_id` | string \| null | Atualmente nulo em todas as unidades |
| `horarios` | array | Sobrescrito por `officialUnitData` |
| `foto_capa` | string | |
| `galeria` | string[] | |
| `modalidades` | string[] | |
| `ano_abertura` | number | |
| `alunos_ativos` | number \| null | |
| `nota_google` | number \| null | |
| `status` | 'ativa' \| 'em_breve' \| 'em_obras' | |
| `destaque` | boolean | |
| `ordem` | number | Ordem de exibição |
| `checkoutUrl` | string \| null | Sobrescrito por `officialUnitData` |

---

## 3. O que `officialUnitData` protege (e o que não protege)

`normalizeUnit()` aplica `officialUnitData` **sobre qualquer fonte**, incluindo o Supabase:

```typescript
function normalizeUnit(unit: Unit): Unit {
  const official = officialUnitData[unit.slug]
  return {
    ...unit,
    ...official,   // sobrescreve whatsapp_url, horarios, checkoutUrl
    horarios: official?.horarios ?? normalizeHours(unit.horarios),
    checkoutUrl: normalizeEvoCheckoutUrl(official?.checkoutUrl ?? unit.checkoutUrl),
  }
}
```

### Campos protegidos pelo `officialUnitData` (não precisam ser atualizados no Supabase)

| Campo | Status |
|-------|--------|
| `whatsapp_url` | Protegido — sempre vem do `officialUnitData` |
| `horarios` | Protegido — sempre vem do `officialUnitData` |
| `checkoutUrl` | Protegido — sempre vem do `officialUnitData` (com normalização da URL EVO) |

### Campos que vêm diretamente do Supabase (precisam ser atualizados)

| Campo | Status |
|-------|--------|
| `endereco_completo` | **Crítico — não protegido, exibido na página da unidade** |
| `whatsapp` (número bruto) | Precisa de atualização para Ipiranga (consistência interna) |
| `google_maps_url` | Vazio — a ser preenchido após auditoria GBP |
| `google_place_id` | Nulo — a ser preenchido após auditoria GBP |

---

## 4. Quais unidades precisam de atualização no Supabase

| Unidade | Slug | `endereco_completo` (antigo) | `endereco_completo` (novo) | `whatsapp` |
|---------|------|------------------------------|---------------------------|------------|
| Carrefour Valinhos | `carrefour-valinhos` | Carrefour Valinhos - Valinhos, SP | Av Eng. Antonio Francisco de Paula Souza, 3900, SL 11 - Valinhos, SP | sem alteração |
| Ipiranga | `ipiranga` | Rua Lino Coutinho, 385 - Ipiranga, São Paulo - SP | mesmo (já estava correto) | `11937334895` (era vazio) |
| Anchieta SP | `anchieta-sp` | Rod. Anchieta, 1778 - Vila Moinho Velho, São Paulo - SP | Rodovia Anchieta, 1778 - Vila Moinho Velho, São Paulo - SP | sem alteração |
| Amoreiras | `amoreiras` | Amoreiras - Campinas, SP | Av. das Amoreiras, 3771 - Campinas, SP | sem alteração |
| Vila Industrial | `vila-industrial` | Vila Industrial - Campinas, SP | Rua Antonio Bento, 347 - Vila Industrial, Campinas - SP | sem alteração |
| Mogi Mirim | `mogi-mirim` | Mogi Mirim, SP | Rua Padre Roque, 939 - Mogi Mirim, SP | sem alteração |

> **Nota sobre Ipiranga:** O `endereco_completo` no banco pode estar como `R. Lino Coutinho, 385...` (abreviado). Mesmo que pareça pequena diferença, padronizar com "Rua" por extenso é recomendado para consistência com o GBP.

---

## 5. Infraestrutura existente para atualizar dados

| Recurso | Existe no projeto? |
|---------|--------------------|
| Script de seed SQL | **Não** |
| Script de migration SQL | **Não** |
| Pasta `supabase/` com CLI config | **Não** |
| Painel admin interno (Next.js) | **Não** |
| API route de admin | **Não** |
| Script Node.js de atualização | **Não** |

O projeto **não tem nenhuma camada de gestão de dados** além do `fallbackUnits` e do `officialUnitData` hardcoded no código. A única forma de atualizar o Supabase hoje é via:

1. **Painel web do Supabase** (Table Editor em supabase.com)
2. **Script Node.js controlado** (a ser criado)
3. **SQL direto** no SQL Editor do painel Supabase

---

## 6. Caminho mais seguro para atualizar

### Opção A — Painel web Supabase (sem código, baixo risco)

1. Acessar `supabase.com` → projeto LoudFit → Table Editor → tabela `units`
2. Localizar cada linha pelo campo `slug`
3. Editar apenas o campo `endereco_completo` (e `whatsapp` para Ipiranga)
4. Salvar linha a linha

**Vantagens:** Sem risco de script quebrado. Visual, auditável.  
**Desvantagens:** Manual, sem histórico em código, não rastreável no git.

### Opção B — SQL no painel Supabase (controlado, rastreável)

Executar no SQL Editor do painel:

```sql
-- Verificar estado atual antes de atualizar
SELECT slug, endereco_completo, whatsapp FROM units ORDER BY ordem;

-- Atualizar endereços
UPDATE units SET endereco_completo = 'Av Eng. Antonio Francisco de Paula Souza, 3900, SL 11 - Valinhos, SP'
  WHERE slug = 'carrefour-valinhos';

UPDATE units SET endereco_completo = 'Rua Lino Coutinho, 385 - Ipiranga, São Paulo - SP',
                 whatsapp = '11937334895'
  WHERE slug = 'ipiranga';

UPDATE units SET endereco_completo = 'Rodovia Anchieta, 1778 - Vila Moinho Velho, São Paulo - SP'
  WHERE slug = 'anchieta-sp';

UPDATE units SET endereco_completo = 'Av. das Amoreiras, 3771 - Campinas, SP'
  WHERE slug = 'amoreiras';

UPDATE units SET endereco_completo = 'Rua Antonio Bento, 347 - Vila Industrial, Campinas - SP'
  WHERE slug = 'vila-industrial';

UPDATE units SET endereco_completo = 'Rua Padre Roque, 939 - Mogi Mirim, SP'
  WHERE slug = 'mogi-mirim';

-- Verificar resultado
SELECT slug, endereco_completo, whatsapp FROM units ORDER BY ordem;
```

**Vantagens:** SQL explícito, verificável antes e depois, pode ser salvo junto ao projeto.  
**Desvantagens:** Requer acesso ao painel Supabase com permissões de escrita.

### Opção C — Script Node.js controlado (recomendado para rastreabilidade)

Criar `scripts/sync-unit-addresses.mjs` que:
1. Lê as credenciais do `.env.local` real (não o placeholder)
2. Busca cada unidade por slug
3. Exibe o valor atual e o novo valor para confirmação antes de atualizar
4. Aplica `update` apenas nos campos necessários

**Vantagens:** Rastreável no git, pode ser executado de forma controlada, confirmação antes de alterar.  
**Desvantagens:** Requer configurar as credenciais reais localmente (substituir placeholders no `.env.local`).

---

## 7. Riscos de alterar direto no banco

| Risco | Gravidade | Mitigação |
|-------|-----------|-----------|
| Apagar campo obrigatório por engano | Alta | Sempre usar UPDATE com WHERE slug = '...' específico; nunca UPDATE sem WHERE |
| Alterar linha errada | Alta | Verificar com SELECT antes do UPDATE |
| Supabase sem backup recente | Média | Verificar se Point-in-Time Recovery está ativo no projeto |
| Alteração não refletida no site (cache Next.js) | Baixa | Site usa SSG com `generateStaticParams` — requer novo deploy para refletir |
| `google_maps_url` preenchido antes da auditoria | Baixa | Não preencher esse campo ainda; aguardar auditoria manual |

### Atenção: site usa SSG (Static Site Generation)

As páginas `/unidades/[slug]` e `/matricula/[slug]` são geradas estaticamente via `generateStaticParams`. Isso significa que **atualizar o Supabase não atualiza o site automaticamente** — é necessário um novo deploy (ou revalidação ISR, que não está configurada) para que as mudanças apareçam em produção.

---

## 8. Situação atual dos campos `google_maps_url` e `google_place_id`

Ambos os campos existem no tipo `Unit` e na query `select('*')`, mas:

- Em `fallbackUnits`: `google_maps_url: ''` e `google_place_id: null` para todas as unidades
- Em `officialUnitData`: esses campos **não aparecem** — não são sobrescritos
- No site: o botão "Ver no Maps" só aparece se `unit.google_maps_url` for truthy

**Conclusão:** Os campos estão prontos para uso no código, mas precisam ser preenchidos — tanto no Supabase quanto no `fallbackUnits` — após a auditoria manual no Google Maps.

---

## 9. Próximos passos recomendados

1. **Confirmar se o Supabase está ativo em produção**  
   Verificar no painel Vercel se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` têm valores reais configurados.

2. **Executar o SQL da Opção B no painel Supabase**  
   Usando os UPDATEs da seção 6 para sincronizar `endereco_completo` e `whatsapp` do Ipiranga.

3. **Fazer novo deploy após a atualização do Supabase**  
   Necessário para que as páginas SSG reflitam os novos endereços.

4. **Realizar a auditoria manual no Google Maps**  
   Preencher os campos `google_maps_url` e `google_place_id` conforme encontrado.

5. **Após a auditoria GBP, atualizar `google_maps_url` e `google_place_id`**  
   No Supabase (via SQL ou painel) e nos `fallbackUnits` do código.

6. **Considerar adicionar `endereco_completo` ao `officialUnitData`**  
   Tornaria o endereço protegido contra regressões vindas do banco, assim como já é feito para `whatsapp_url`, `horarios` e `checkoutUrl`.
