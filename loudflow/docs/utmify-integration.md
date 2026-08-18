# Integração UTMify — Loud Flow (situação operacional)

Documento operacional versionado. **Não inclui tokens, URLs privadas ou
valores reais.** Somente variáveis, formatos, responsabilidades e limites.

## Situação atual do contrato HTTP

A API pública documentada da UTMify (`api.utmify.com.br`) cobre apenas
**envio de pedidos** (`POST /api-credentials/orders`). Ela **não expõe** um
endpoint público oficial para *leitura* de métricas de campanhas Meta Ads
com o mesmo shape que o MCP entrega.

Enquanto esse contrato não for confirmado por canal oficial da UTMify
(base URL, path, autenticação, paginação, rate limit):

- o botão **Sincronizar agora** em `/resultados` fica desabilitado com
  explicação visível;
- o endpoint interno **`POST /api/cron/sync-utmify`** responde `503
  integration-unavailable`, mesmo autenticado;
- **nenhuma** chamada de rede é feita contra endpoints especulativos;
- os snapshots existentes no banco são **preservados** — carga inicial
  feita fora da automação.

Quando o contrato for confirmado, plugar o cliente real em
`src/lib/integrations/utmify/http.ts`. A interface `UtmifyClient` e o
motor `runUtmifySync` já são idempotentes e cobertos por testes.

## Variáveis de ambiente

**Leitura de métricas** (situação atual — sincronização indisponível):

| Nome | Finalidade | Formato esperado |
|---|---|---|
| `UTMIFY_CRON_SECRET` | Bearer aceito pelo endpoint `POST /api/cron/sync-utmify`. Sem ela, o endpoint responde `503 cron-not-configured`. | string opaca aleatória de comprimento suficiente para uso como bearer |

Reservadas para quando o contrato HTTP de LEITURA for confirmado (**não usar hoje**):

- `UTMIFY_API_BASE_URL` — base HTTPS da API pública oficial de leitura
- `UTMIFY_API_TOKEN` — credencial de leitura (bearer)
- `UTMIFY_DASHBOARD_ID` — id do dashboard a consultar

**Envio de conversão paga** (Fase 4 — ativa quando a env abaixo estiver preenchida):

| Nome | Finalidade | Formato esperado |
|---|---|---|
| `UTMIFY_ORDERS_API_TOKEN` | `x-api-token` da credencial oficial da UTMify para `POST /api-credentials/orders`. Sem ela, o handler EVO registra a venda mas marca o delivery como `skipped: utmify-not-configured`. Obtenção: Painel UTMify → Integrações → API → gerar credencial "orders". | string opaca do painel UTMify |
| `UTMIFY_ORDERS_API_BASE_URL` | Opcional. Default: `https://api.utmify.com.br`. Só alterar se a UTMify trocar o host. | URL HTTPS sem barra final |

Nenhuma delas pode ser prefixada com `NEXT_PUBLIC_`. Todas ficam apenas no
lado servidor. Nunca commite valores em `.env*`.

## Botão manual (admin)

Fica visível apenas para papel `admin` em `/resultados`. Desabilitado
enquanto o cliente HTTP oficial não estiver plugado. O texto abaixo
explica exatamente por quê, sem falsa promessa de sucesso.

## Endpoint de cron

`POST /api/cron/sync-utmify` exige `Authorization: Bearer <UTMIFY_CRON_SECRET>`.
Comportamento atual, em ordem:

1. `UTMIFY_CRON_SECRET` ausente → `503 cron-not-configured`
2. Bearer ausente/incorreto → `401 unauthorized`
3. Autorizado, mas sem cliente HTTP real → `503 integration-unavailable`

Nenhuma escrita no banco ocorre nesse caminho hoje. **Não** agendar cron
efetivo na Vercel enquanto o item 3 continuar retornando `503`.

## Cobertura de dados no painel

`/resultados` distingue **três estados** com clareza:

1. **Dia sem sincronização** → não aparece; não vira zero.
2. **Dia sincronizado com métrica zero** → aparece com valor `0`.
3. **Métrica não fornecida pela fonte** → mostra `Não disponível` (nunca `0`).

O cabeçalho exibe:

- `Dados disponíveis desde DD/MM/YYYY` (data do primeiro snapshot real);
- banner "Este período possui dados parciais" quando o intervalo escolhido
  cobre dias sem sincronização.

## Primeira configuração (quando o contrato oficial for confirmado)

1. Confirmar com a UTMify: base URL, path, método de autenticação,
   paginação, rate limit e formato do payload de resposta.
2. Preencher `UTMIFY_API_BASE_URL`, `UTMIFY_API_TOKEN`,
   `UTMIFY_DASHBOARD_ID` (server-side, via `vercel env`).
3. Substituir a implementação de `createUtmifyHttpClient` em
   `src/lib/integrations/utmify/http.ts` pelo cliente real. Reaproveitar o
   mapeador do payload (esperado equivalente ao MCP para Meta Ads).
4. Adicionar smoke test somente leitura contra o endpoint real.
5. Só então habilitar o cron na Vercel (`vercel.ts`).

## Limitações atuais

- Sincronização automática **desativada** até confirmação do contrato de leitura.
- Botão manual **indisponível** pelo mesmo motivo.
- Google Ads não é sincronizado (conta desabilitada por pagamento na
  UTMify + ausência de contrato oficial de leitura).
- Vendas/faturamento/ROAS/ROI no painel `/resultados` ainda dependem do
  contrato de leitura — mesmo com a Fase 4 ativa, o envio de conversão
  paga alimenta o dashboard da UTMify (e, via ela, Meta/Google), mas
  não repopula automaticamente as métricas mostradas no Loud Flow.
- WhatsApp fora do MVP.

## Fase 4 — Envio de conversão paga EVO → UTMify → Meta e Google Ads

Quando o webhook NewSale da EVO confirma uma venda **paga** (regra
`evaluatePayment` → status `paid`), o handler dispara `POST
/api-credentials/orders` para a UTMify. A UTMify, tendo a integração com
Meta Pixel/CAPI e Google Ads Enhanced Conversions ligada no painel dela,
encaminha internamente para as duas plataformas — evita a duplicação que
ocorreria se o Loud Flow enviasse em paralelo direto para cada API.

Fluxo:

1. `evo_sales` é gravado como `paid` (UNIQUE `(id_branch, id_sale)`).
2. Cria-se linha em `ad_conversion_deliveries` com `platform='utmify'`
   e `delivery_key = 'evo:{idBranch}:{idSale}:purchase'`
   (UNIQUE `(evo_sale_id, platform)`).
3. Se `id_member` presente, `EvoClient.fetchMember(idMember)` busca
   `name`, `email`, `phone` e `document` para popular `customer` na
   UTMify. Se `name` ou `email` faltarem, delivery vira `skipped:
   customer-required`.
4. Payload segue o schema oficial da UTMify: `orderId=evo-{b}-{s}`,
   `platform="LoudFlow"`, `paymentMethod` mapeado do EVO
   (`pix|boleto|credit_card|paypal|free_price`), `status="paid"`,
   `createdAt`/`approvedDate` em UTC `"YYYY-MM-DD HH:MM:SS"`,
   `products[0].priceInCents`, `commission.currency="BRL"`.
5. `isTest: true` em Preview e local (`VERCEL_ENV !== 'production'`);
   Produção envia `isTest: false`.

Regras invariantes:

- Vendas `pending` / `cancelled` / `error` **NUNCA** disparam envio.
- Retry do webhook EVO (mesma venda paga chegando várias vezes) não
  duplica: em cima de delivery já `sent`, o orquestrador retorna
  `skipped: already-sent` sem chamar rede.
- Falha temporária da UTMify (500/timeout) marca delivery `failed` com
  `attempts++` e `last_error` sanitizado — não altera o webhook (200 pra
  EVO). Retry manual possível via reprocesso da mesma venda.
- Nada de PII (email/phone/CPF) é gravado em `evo_sales` ou em
  `ad_conversion_deliveries`. Só resposta resumida sanitizada
  (`response_summary` com e-mail/telefone/token mascarados).

Segurança:

- `UTMIFY_ORDERS_API_TOKEN` é server-only. Nunca vai como `NEXT_PUBLIC_*`.
- Logs e mensagens de erro passam por `sanitizeText` que remove
  `x-api-token`, `Bearer *`, e-mail e telefone.
- O cliente UTMify (`src/lib/integrations/utmify/orders.ts`) tem
  timeout curto (15s) para não estourar o `maxDuration=30s` da rota.

Lacuna conhecida (Fase 5 — depende de mudanças em `loudfit/`):

- A UTMify aceita `trackingParameters` (`utm_source`, `utm_medium`,
  `utm_campaign`, `utm_content`, `utm_term`, `src`, `sck`), mas hoje o
  loudflow envia todos como `null` porque o site `loudfit/` ainda não
  captura esses valores no fluxo LP → matrícula EVO. Para atribuição
  determinística de clique, será necessário:
  1. Instrumentar `loudfit/` para capturar `gclid`/`gbraid`/`wbraid`/
     `fbclid`/`_fbc`/`_fbp`/UTMs em cookie first-party.
  2. Enviar esses valores para um novo endpoint `POST
     /api/attribution/lead` no loudflow, atrelados a `email` (chave
     de junção com a venda EVO).
  3. Antes de chamar `createUtmifyOrdersClient().sendOrder(...)`, fazer
     lookup nesse novo `ad_attribution_leads` por e-mail normalizado e
     popular `trackingParameters` no payload.
- Sem essa Fase 5, Meta/Google ainda registram a conversão (via UTMify),
  porém com atribuição de **advanced matching** por hash de email/phone
  apenas — não por clickId.
