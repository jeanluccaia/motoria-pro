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

Só uma variável é usada nesta fase:

| Nome | Finalidade | Formato esperado |
|---|---|---|
| `UTMIFY_CRON_SECRET` | Bearer aceito pelo endpoint `POST /api/cron/sync-utmify`. Sem ela, o endpoint responde `503 cron-not-configured`. | string opaca aleatória de comprimento suficiente para uso como bearer |

Reservadas para quando o contrato HTTP for confirmado (**não usar hoje**):

- `UTMIFY_API_BASE_URL` — base HTTPS da API pública oficial de leitura
- `UTMIFY_API_TOKEN` — credencial de leitura (bearer)
- `UTMIFY_DASHBOARD_ID` — id do dashboard a consultar

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

- Sincronização automática **desativada** até confirmação do contrato.
- Botão manual **indisponível** pelo mesmo motivo.
- Google Ads não é sincronizado (conta desabilitada por pagamento na
  UTMify + ausência de contrato oficial de leitura).
- Vendas/faturamento/ROAS/ROI aparecem como `Não disponível` — dependem
  do sistema de matrículas (EVO), fora do MVP.
- WhatsApp fora do MVP.
