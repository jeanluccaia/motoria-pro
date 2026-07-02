# Diagnostico urgente - etiqueta Reserva/INK pedido 1011

Data: 2026-07-02

## Resumo

Pedido investigado: 1011.
Cliente esperado: Tatiana Favaro.
Nome incorreto relatado na etiqueta: Jean.

Pelo codigo deste repositorio, nao ha geracao de etiqueta, integracao direta com Reserva/INK, transportadora, fiscal, CPF/documento, remetente ou destinatario. A LP/carrinho cria apenas um carrinho Shopify via Storefront API e envia somente variantes e quantidades.

Conclusao tecnica: se Shopify e Reserva/INK mostram o pedido como Tatiana Favaro, e a etiqueta final sai com "Jean", a origem mais provavel esta fora deste codigo, na camada de etiqueta/logistica/fiscal da Reserva/INK ou em configuracao de remetente/responsavel/titular de CPF/CNPJ.

## Evidencias no codigo

Arquivos analisados:

- `api/checkout.js`
- `api/shipping.js`
- `api/capi.js`
- `index.html`
- `shopify-ga4-custom-pixel.js`
- `shopify-meta-custom-pixel.js`
- busca filtrada no monorepo por termos de dono/fallback/logistica/etiqueta

Resultado:

- `api/checkout.js` monta `CartInput.lines` com:
  - `merchandiseId`
  - `quantity`
- Nao envia:
  - `shippingAddress`
  - `billingAddress`
  - `customer`
  - `customerName`
  - `shippingName`
  - `billingName`
  - CPF/documento
  - remetente
  - destinatario
  - metafields
  - draft order
- `index.html` envia para `/api/checkout` apenas:
  - `body: JSON.stringify({ items: items })`
- O carrinho local guarda apenas:
  - `productId`
  - `variantId`
  - `productName`
  - `color`
  - `size`
  - `quantity`
  - `price`
  - `image`
- `api/shipping.js` e apenas simulacao/calculo simples de frete por CEP. Nao cria etiqueta.
- Pixels Shopify/GA4/Meta leem apenas dados de compra para analytics. Nao alteram pedido, cliente ou etiqueta.

## Teste simulado realizado

Foi executado um teste com `api/checkout.js` usando um item artificial que incluia campos suspeitos extras como `customerName: "Jean"` e `shippingAddress.name: "Jean"`.

Payload efetivamente enviado para Shopify:

```json
{
  "input": {
    "lines": [
      {
        "merchandiseId": "gid://shopify/ProductVariant/52164760764717",
        "quantity": 1
      }
    ]
  }
}
```

Mesmo quando o item de entrada contem nome/endereco, a API descarta esses campos e envia somente `lines`.

## Limitacao da consulta do pedido 1011

Nao foi possivel consultar o pedido real via Shopify Admin API a partir deste workspace porque:

- `.env.production` local possui `SHOPIFY_ADMIN_TOKEN=""`.
- `vercel env pull --environment=production` tambem retornou `SHOPIFY_ADMIN_TOKEN=""`.

Isso impede confirmar via API os campos reais do pedido 1011 dentro da Shopify.

## Hipoteses mais provaveis fora do codigo

1. "Jean" esta no bloco de remetente.
   - Se for remetente, pode ser configuracao normal da loja, responsavel pela postagem ou titular fiscal.

2. "Jean" esta no bloco de destinatario.
   - Se for destinatario, e bug/configuracao grave na Reserva/INK ou na geracao de etiqueta.
   - Como o pedido aparece como Tatiana Favaro na Shopify e na Reserva/INK, o erro provavelmente ocorre depois da importacao do pedido.

3. Reserva/INK esta usando CPF/documento/titular como pessoa da etiqueta.
   - Se algum CPF foi inserido manualmente e esta associado ao cadastro do Jean, a camada fiscal/logistica pode estar usando o titular do documento como destinatario.

4. Fallback de etiqueta da Reserva/INK.
   - Se algum campo especifico de destinatario/endereco estiver vazio no modulo de logistica, a Reserva/INK pode estar caindo em dados padrao da conta, loja, remetente ou responsavel.

## Checklist objetivo na Reserva/INK

Abrir pedido 1011 e comparar, com prints:

- Aba/pagina do pedido:
  - cliente
  - destinatario
  - endereco de entrega
  - telefone
  - email
  - CPF/documento
- Aba fiscal/NF:
  - nome do titular do CPF/CNPJ
  - responsavel fiscal
  - dados fiscais padrao
- Aba logistica/etiqueta:
  - destinatario
  - remetente
  - responsavel pela postagem
  - endereco de retirada/remessa
  - nome de contato
- Configuracoes da conta/loja:
  - nome da loja
  - nome do contato
  - titular do CPF/CNPJ
  - remetente padrao
  - dados fiscais padrao
  - endereco de origem/coleta

## Evidencias para enviar ao suporte Reserva/INK

Enviar estes prints/evidencias:

1. Shopify pedido 1011 mostrando Tatiana Favaro em cliente e entrega.
2. Reserva/INK pedido 1011 mostrando Tatiana Favaro no pedido.
3. Tela de detalhes de etiqueta/logistica antes de imprimir.
4. Etiqueta final com os blocos visiveis de REMETENTE e DESTINATARIO.
5. Configuracao de remetente/responsavel/titular fiscal onde aparece Jean.
6. Informar explicitamente:
   - "O pedido importado esta com cliente correto, mas a etiqueta final usa Jean."
   - "Precisamos saber qual campo do template de etiqueta esta alimentando o nome impresso."
   - "Confirmem se o template usa shippingAddress.name/destinatario ou se faz fallback para titular fiscal/remetente."

## Acao recomendada

Se "Jean" estiver como remetente:

- Confirmar se e o responsavel normal da loja.
- Ajustar apenas se a loja quiser exibir PattaMansa/CNPJ em vez do nome pessoal.

Se "Jean" estiver como destinatario:

- Corrigir na Reserva/INK a fonte do destinatario da etiqueta para o nome do pedido/endereco de entrega.
- O campo esperado e o equivalente a `shippingAddress.name` ou `shippingAddress.firstName + shippingAddress.lastName`.
- Remover fallback para titular fiscal, remetente, dono da loja ou contato da conta.

No codigo deste repositorio, nao ha correcao aplicavel neste momento porque nenhum campo de destinatario e enviado ou transformado pela LP.
