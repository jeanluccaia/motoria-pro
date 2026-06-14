# Auditoria GA4 Ecommerce - PattaMansa

Data da auditoria: 2026-06-14

## Diagnostico

O site carregava o Google Analytics 4 com o measurement ID `G-WCKKTLPXYP`, mas nao enviava eventos ecommerce GA4. A busca no codigo encontrou apenas `gtag('config')`; nao havia `view_item`, `add_to_cart`, `begin_checkout` ou `purchase` para GA4.

O checkout e criado por `api/checkout.js` via Shopify Storefront API `cartCreate` na loja `unmtvj-cr.myshopify.com`. A compra final acontece depois do redirecionamento para o checkout hospedado da Shopify, portanto o evento `purchase` nao pode ser medido de forma confiavel na landing page. Ele precisa ser enviado por um pixel no Shopify Customer Events, assinando o evento `checkout_completed`.

## Eventos auditados

| Evento | Status antes | Status depois |
| --- | --- | --- |
| `view_item` | Ausente no GA4 | Implementado ao abrir o drawer do produto |
| `add_to_cart` | Ausente no GA4 | Implementado ao adicionar variante ao carrinho |
| `begin_checkout` | Ausente no GA4 | Implementado ao clicar em `Finalizar compra` |
| `purchase` | Ausente no GA4 | Script pronto em `shopify-ga4-custom-pixel.js`; requer instalacao no Shopify Admin |

## Campos ecommerce

Eventos da landing enviam:

- `currency`: `BRL`
- `value`: valor do produto/carrinho
- `items`: array GA4 com `item_id`, `item_name`, `item_brand`, `item_category`, `item_variant`, `price`, `quantity` e `index`

O pixel Shopify envia no `purchase`:

- `transaction_id`: ID real do pedido Shopify, com fallback para token/event ID
- `value`: total do checkout
- `tax`: imposto do checkout
- `shipping`: frete do checkout
- `currency`: moeda do checkout, fallback `BRL`
- `coupon`: codigos de cupom, quando houver
- `items`: linhas do pedido com produto, variante, SKU/ID, preco, quantidade e desconto

## DataLayer e Google Tag

O site agora envia eventos ecommerce em dois formatos:

- `window.dataLayer.push({ event, ecommerce })`, para auditoria e eventual uso com GTM.
- `gtag('event', eventName, payload)`, para envio direto ao GA4.

O `gtag('config')` foi ajustado para cross-domain linker entre:

- `pattamansa.com.br`
- `unmtvj-cr.myshopify.com`

## Checkout Shopify

O checkout Shopify nao estava comunicando compras ao GA4 pelo codigo deste repositorio. A landing apenas criava o checkout e redirecionava o usuario. Isso explica `Transacoes = 0`, `Receita = R$0` e ausencia de evento `purchase` mesmo com venda real confirmada.

Para fechar a mensuracao, instalar o conteudo de `shopify-ga4-custom-pixel.js` em:

Shopify Admin > Settings > Customer events > Add custom pixel

Depois publicar o pixel e validar uma compra teste ou evento real no GA4 DebugView/Realtime.

## Observacao fora de GA4

O codigo existente tambem dispara `fbq('track', 'Purchase')` quando a URL de checkout e criada, antes da conclusao do pagamento. Isso nao afeta o GA4, mas pode inflar compras no Meta Pixel. A correcao do `purchase` real para GA4 deve acontecer no Shopify `checkout_completed`.

## Referencias tecnicas

- GA4 ecommerce events: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
- Shopify Web Pixels API: https://shopify.dev/docs/api/web-pixels-api
- Shopify `checkout_completed`: https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed
- Shopify custom pixel/GTM tutorial: https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/gtm-tutorial
