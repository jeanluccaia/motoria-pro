# Integração UTMify — Loud Flow

**Versão:** 1.0 — inclui resultado do Spike 0.1
**Data:** 2026-08-05
**Complementa:** [[prd-loud-flow]], [[arquitetura-loud-flow]], [[mvp-e-fases]]

Este documento tem três partes:

1. **O que já foi descoberto via MCP** (Spike 0.1 — parte de leitura).
2. **O que ainda precisa ser validado** com a API pública antes de codar (Spike 0.1 — parte de produção).
3. **Como o Loud Flow vai usar a UTMify** no MVP enxuto.

**Regra importante:** MCP da UTMify é ferramenta de desenvolvedor. Nenhuma linha de código de produção chama o MCP. A produção fala com a API pública da UTMify, com token próprio.

**Sem EVO.** Nesta versão o Loud Flow não integra a EVO — nem credenciais, nem endpoints, nem webhooks, nem provas técnicas.

---

## 1. O que foi descoberto via MCP (leitura)

Consultas realizadas em 2026-08-05 no dashboard `Principal` (id `6a71f50aa756e65f0c6b9b32`).

### 1.1 Estrutura da conta

- **1 dashboard**: `Principal`. **Moeda:** BRL. **Fuso:** GMT-3. **View type:** Normal.
- **Owner** (não colaborador).

### 1.2 Contas de anúncio conectadas

**Meta Ads** (perfil `Jean Lucca Gozzi`):

| Conta Meta | ID | Estado UTMify | Cobre |
|---|---|---|---|
| LOUD FIT Ipiranga | `889708106782924` | ✅ enabled | Ipiranga |
| LOUD FIT Amoreiras e Mogi Mirim | `892118831802023` | ✅ enabled | Amoreiras + Mogi Mirim |
| LOUD FIT Vila Industrial e Carrefour | `775207327544130` | ✅ enabled | Vila Industrial + Carrefour Valinhos |
| Outras 5 contas alheias | — | ⛔ disabled | ignoradas |

**Google Ads** (perfil `LoudFit Google`):

| Conta | ID | Estado |
|---|---|---|
| LOUD FIT | `2763729780` | ⛔ disabled (problema de pagamento em resolução) |

Sem Kwai, TikTok, WhatsApp conectados.

### 1.3 Padrão de nomenclatura observado

Amostras (agosto/2026):

```
LF | VENDAS | AMOREIRAS | POWER PLUS | AGO26
LF | VENDAS | MOGI MIRIM | POWER PLUS | AGO26
LF | VENDAS | IPIRANGA | POWER PLUS | AGO26
LF | VENDAS | VILA INDUSTRIAL | POWER PLUS | AGO26
LF | VENDAS | CARREFOUR VALINHOS | POWER PLUS | AGO26
TOTALPASS | AMOREIRAS | WHATSAPP | AGO 2026
TOTALPASS | MOGI MIRIM | WHATSAPP | AGO 2026
LF | IPIRANGA | WHATSAPP | AGO26 Campanha
LF | ENGAJAMENTO | TOUR IPIRANGA | JUL26
LF | TOTALPASS | [UNIDADE] | RECONHECIMENTO | JUL26   ← placeholder solto
```

Padrão canônico: `MARCA | OBJETIVO | UNIDADE | PRODUTO/CANAL | PERÍODO`.

Divergências observadas: campanhas antigas em `snake_case` colado (`AM_TRIMESTRAL`, `VI_TOTALPASS`, `CF_TRIMESTRAL`), placeholder `[UNIDADE]` não substituído em uma delas, sufixo "Campanha" solto em outras.

Conclusão: precisamos da tela `/config → Mapeamento` para tratar os casos "Não atribuído".

### 1.4 Integrações da UTMify já configuradas

| Item | Estado |
|---|---|
| Meta Pixel — Loud Fit (id `1358787552249382`) | ✅ ativo, só `purchase` de venda aprovada |
| Credencial API EVO — Loud Fit | ⚠️ presente, mas **fora do escopo do Loud Flow**. Vamos ignorar |
| Webhooks | (nenhum) |
| WhatsApp | (nenhum) — conversas via WhatsApp não estão sendo trackeadas |
| Taxas / custos / regras | (nenhum) |

### 1.5 Métricas disponíveis (via MCP, jul/2026 → 05/ago/2026)

Direto do `get_dashboard_summary`:

- Investimento Meta: **R$ 6.730,63**
- Cliques: **3.106**
- Landing page views: **342**
- Initiate checkouts: **98**
- Leads: **20**
- Vendas aprovadas: 0 (pixel só conta `purchase` aprovado; sem integração de venda)
- Faturamento: 0
- Custo por lead: R$ 336,53

Distribuição por conta:
- Ipiranga: R$ 2.986,44 (44%)
- Amoreiras + Mogi Mirim: R$ 2.025,06 (30%)
- Vila Industrial + Carrefour: R$ 1.719,13 (26%)

Por campanha nível `campaign` já é acessível (endpoint `get_meta_ad_objects` retornou 20+ campanhas de agosto com todos os campos: `spend`, `impressions`, `inlineLinkClicks`, `initiateCheckout`, `leads`, `landingPageViews`, `cpm`, `frequency`, `costPerInlineLinkClick`, etc.).

---

## 2. Spike 0.1 — resultado consolidado

### 2.1 O que realmente pode ser integrado (via API pública da UTMify)

**Alta confiança** (o MCP já retorna, presumivelmente equivalente à API pública):

| Métrica | Nível de granularidade | Fonte |
|---|---|---|
| Investimento (spend) | conta / campanha / conjunto / anúncio | Meta Ads (via UTMify) |
| Impressões | idem | Meta Ads |
| Alcance / frequência | conta / campanha | Meta Ads |
| Cliques (inline link clicks) | idem | Meta Ads |
| CTR, CPM, CPC | idem | derivado |
| Landing page views | idem | Meta Ads |
| Initiate checkout | idem | Meta Ads + pixel |
| Leads | idem | Meta Ads |
| Custo por lead, custo por checkout, custo por LPV | idem | derivado |
| Nome da campanha e status (ACTIVE/PAUSED) | campanha | Meta Ads |
| Orçamento diário / vitalício | campanha / conjunto | Meta Ads |
| Data de criação da campanha | campanha | Meta Ads |

**Média confiança** — depende do MVP não priorizar (podemos ignorar sem perder valor):

| Item | Observação |
|---|---|
| Google Ads | Endpoint existe, mas conta hoje `disabled`. Vai voltar quando pagamento resolver |
| Métricas de vídeo (views, retention, hook) | UTMify entrega, mas o painel do sócio não precisa disso no MVP |
| WhatsApp conversations | Não configurado — retorna zero para todos |
| ROAS, ROI, revenue | Retorna zero porque nenhuma venda entra na UTMify hoje. **No Loud Flow, exibir "Não disponível"**, não zero |

**Fora do escopo**:

| Item | Motivo |
|---|---|
| Matrículas | Depende da EVO — fora do MVP |
| Faturamento efetivo | Idem |
| Recorrência (MRR/ARR) | Idem |

### 2.2 Como será a sincronização diária

```
Vercel Cron  03:00 BRT (0 6 * * * UTC)
   │
   ▼
POST /api/cron/sync-utmify (só admin token do cron)
   │
   ├─ Para cada organization com integração 'utmify' ativa:
   │    ├─ Ler token descriptografado
   │    ├─ GET /dashboards            → confirmar dashboard e fuso
   │    ├─ GET /meta-ad-objects?level=campaign
   │    │       &dateRange=ontem       → dado fechado do dia anterior
   │    ├─ Para cada campanha retornada:
   │    │    ├─ Upsert em campaigns (external_id, name, channel='meta', status)
   │    │    ├─ Upsert em campaign_snapshots (snapshot_date=ontem, spend, impressions, ...)
   │    │    └─ Atribuir unit_id parseando o nome (regra §3)
   │    └─ Registrar sync_run (started_at, finished_at, rows_upserted, status)
   │
   └─ Se sync_runs.status='error': enviar email para admin
```

- **Janela de sync:** só o dia anterior fechado, para evitar mexer em dados que ainda podem mudar durante o dia atual.
- **Idempotente:** upsert por `(campaign_id, snapshot_date)`. Reexecutar não duplica.
- **Sem escrita na UTMify.** Só leitura.
- **Timezone consistente:** convertemos `dateRange` para GMT-3 usando o fuso do dashboard, não do servidor.

**Painel `/resultados` no dia atual**: consulta direta `campaign_snapshots` do último sync + rótulo "Atualizado em <data do último sync>". Sem tentar buscar dado do dia corrente no MVP — evita rate limit e mantém a promessa de "diário".

### 2.3 Métricas que estarão disponíveis no painel do sócio

**Cards principais** (com apelidos amigáveis):

| Card exibido | Métrica UTMify | Status |
|---|---|---|
| Quanto foi investido | spend | ✅ |
| Quantas pessoas foram alcançadas | impressions (usando como proxy — a UTMify agrega no dashboard summary) | ✅ |
| Quantos cliques | inlineLinkClicks | ✅ |
| Quantos leads | leads | ✅ |
| Quantos checkouts | initiateCheckout | ✅ |
| Custo por clique | derivado | ✅ |
| Custo por lead | derivado | ✅ |
| Custo por checkout | derivado | ✅ |
| Comparação com período anterior | derivado (mesma janela deslocada) | ✅ |
| Quantas matrículas | — | ⛔ **Não disponível** |
| Faturamento | — | ⛔ **Não disponível** |
| Custo por matrícula | — | ⛔ **Não disponível** |
| ROAS | — | ⛔ **Não disponível** |
| ROI | — | ⛔ **Não disponível** |

**Filtros:** período (hoje, 7d, 30d, mês atual, mês passado, custom), unidade, campanha.

### 2.4 Limitações encontradas (para não prometer mais do que temos)

1. **Não temos venda real entrando na UTMify** — pixel só dispara em `paid_sales_only` e não há venda entrando pela credencial EVO da UTMify hoje. Consequência: qualquer coisa relacionada a receita será "Não disponível".
2. **UTMify tem delay natural** (dado da Meta chega minutos a 1h depois do fato) — por isso preferimos sync noturno do dia anterior.
3. **Rate limit da UTMify não é público** — o MCP avisa "evite abuso". Nossa carga (1 chamada por conta por dia, ~3 contas) fica trivialmente abaixo de qualquer limite razoável.
4. **Respostas grandes** podem estourar limites — filtrar sempre por período curto (nunca puxar `null` como dateRange).
5. **Google Ads offline** hoje — quando pagamento resolver, o adapter passa a puxar sem código novo (basta a conta virar `enabled`).
6. **Padrão de nomenclatura** não é 100% aplicado — a tela de mapeamento em `/config` cobre.
7. **Dupla-cobertura de contas**: `892118831802023` cobre 2 unidades (Amoreiras + Mogi Mirim); `775207327544130` cobre 2 (Vila Industrial + Carrefour). Sem parseamento do nome, atribuição é ambígua.
8. **A API pública da UTMify pode diferir do que o MCP expõe** — isso ainda precisa ser confirmado com token real antes de codar. É o único item que resta do spike de produção.

### 2.5 Pendência técnica do Spike 0.1 (não está encerrado)

**O Spike 0.1 NÃO está tecnicamente encerrado** enquanto os itens abaixo não forem confirmados com **credencial real da API pública da UTMify**:

- [ ] **Base URL** dos endpoints públicos (ex.: `api.utmify.com.br/v1/...`).
- [ ] **Autenticação** (header `Authorization: Bearer <token>`, `x-api-key`, OAuth?).
- [ ] **Endpoints** finais que expõem os mesmos dados que o MCP retorna.
- [ ] **Paginação** (cursor, offset/limit, page size máximo).
- [ ] **Rate limits reais** (chamadas/min, código HTTP de 429, política de retry).
- [ ] **Custo ou exigência de plano** (a API pública está inclusa no plano atual? Exige upgrade?).

Complementos secundários (validar de bônus): rotação de token, formato exato de resposta, timezone do dado retornado, comportamento em caso de conta desabilitada.

Entrega final: `docs/spikes/utmify-api.md` com respostas reais e checklist marcada.

**Bloqueio:** essa pendência **bloqueia somente a Fase 3** (integração de produção com UTMify). **Não bloqueia** o início da Fase 1 (alicerce) nem da Fase 2 (tarefas).

---

## 3. Como o Loud Flow usa a UTMify (produção)

### 3.1 Adapter `lib/integrations/utmify/`

Interface enxuta, só o que o MVP usa:

```ts
type UtmifyClient = {
  listDashboards(): Promise<Dashboard[]>;
  getDashboardSummary(id: string, range: DateRange): Promise<Summary>;
  listCampaigns(id: string, range: DateRange): Promise<CampaignRow[]>;
};

type CampaignRow = {
  externalId: string;
  name: string;
  channel: 'meta' | 'google';
  status: 'ACTIVE' | 'PAUSED';
  spendCents: number;
  impressions: number;
  clicks: number;
  leads: number;
  initiateCheckouts: number;
  createdAt: string;
};
```

Tipos gerados no spike a partir das respostas reais.

### 3.2 Atribuição de unidade (regra)

```
1. Normalizar nome: upper, remover acento, split por " | "
2. Se conta cobre 1 unidade única → atribuir direto
3. Se cobre múltiplas → procurar cada alias de unit_aliases em qualquer token
4. 1 match único → atribuir; 0 ou >1 → unit_id = NULL (vai pra /config → Mapeamento)
5. Se admin já mapeou manualmente aquela campanha antes, preservar sempre
```

Aliases seed (tabela `unit_aliases`):

```
amoreiras            → unit Amoreiras
mogi mirim           → unit Mogi Mirim
ipiranga             → unit Ipiranga
tour ipiranga        → unit Ipiranga
vila industrial      → unit Vila Industrial
vila                 → unit Vila Industrial
carrefour valinhos   → unit Carrefour Valinhos
carrefour            → unit Carrefour Valinhos
```

Anchieta arquivada — nenhum alias.

### 3.3 Segurança e credenciais

- Token guardado em `integrations.credentials_encrypted` (pgcrypto).
- Nunca commitado. Nunca em `.env` público.
- Só admin lê/edita em `/config`.
- Rotacionável.

### 3.4 O que **não** fazemos (nesta versão)

- ❌ Escrever na UTMify (nada de pausar campanha, mudar orçamento, criar pixel).
- ❌ Consumir MCP em código de produção.
- ❌ Consultar/salvar/tocar em nada da EVO.
- ❌ Deduzir matrícula a partir de clique/lead/checkout.
- ❌ Real-time (sync é diário).
- ❌ Trackear WhatsApp.

---

## Referências cruzadas

- PRD: [[prd-loud-flow]]
- Arquitetura: [[arquitetura-loud-flow]]
- Fases: [[mvp-e-fases]]
