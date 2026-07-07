# Relatorio Shopify - conteudo e arquitetura permanente

Data: 2026-07-07

## Escopo entregue

- Home reorganizada para loja permanente, premium e mobile-first.
- Copy principal ajustada para foco em cachorro como familia, camiseta premium, design autoral e padrao de qualidade Reserva INK.
- Colecoes reduzidas para uma estrutura mais curada: Todas as camisetas, Caramelo FC, Matilha e Basicas PattaMansa.
- Produto reforcado com galeria, preco, texto de parcelamento, variantes, CTA sticky mobile, linha de confianca, accordions, bloco Producao Reserva INK, cross-sell e FAQ curto.
- Prova social ficou ocultavel e nao renderiza conteudo vazio.
- Rodape ganhou newsletter com microcopy de matilha e formulario nativo Shopify.
- Contato usa formulario nativo Shopify, sem expor telefone pessoal.
- Paginas institucionais foram criadas como templates atribuiveis no Admin.

## Arquivos alterados

- `shopify-theme/layout/theme.liquid`
- `shopify-theme/assets/theme.css`
- `shopify-theme/assets/theme.js`
- `shopify-theme/config/settings_schema.json`
- `shopify-theme/templates/index.json`
- `shopify-theme/templates/page.contato.json`
- `shopify-theme/templates/page.faq.json`
- `shopify-theme/templates/page.frete-e-prazos.json`
- `shopify-theme/templates/page.politica-de-privacidade.json`
- `shopify-theme/templates/page.sobre.json`
- `shopify-theme/templates/page.termos-de-uso.json`
- `shopify-theme/templates/page.trocas-e-devolucoes.json`
- `shopify-theme/sections/brand-differentials.liquid`
- `shopify-theme/sections/collection-showcase.liquid`
- `shopify-theme/sections/contact-form.liquid`
- `shopify-theme/sections/emotional-block.liquid`
- `shopify-theme/sections/faq.liquid`
- `shopify-theme/sections/featured-products.liquid`
- `shopify-theme/sections/footer.liquid`
- `shopify-theme/sections/header.liquid`
- `shopify-theme/sections/hero-premium.liquid`
- `shopify-theme/sections/main-404.liquid`
- `shopify-theme/sections/main-cart.liquid`
- `shopify-theme/sections/main-product.liquid`
- `shopify-theme/sections/social-proof.liquid`

## Paginas criadas

- `/pages/sobre`
- `/pages/frete-e-prazos`
- `/pages/trocas-e-devolucoes`
- `/pages/contato`
- `/pages/faq`
- `/pages/politica-de-privacidade`
- `/pages/termos-de-uso`

As paginas existem como templates do tema. No Admin Shopify, ainda e necessario criar os objetos de pagina e atribuir cada template correspondente.

## Dados pendentes

- Acesso Shopify CLI para listar temas, criar tema unpublished e enviar o tema.
- Imagens reais para hero, colecoes, produtos e prova social.
- Composicao exata dos tecidos por produto.
- Tabelas de medida finais por modelo.
- Regras juridicas finais de privacidade, termos, frete e trocas.
- Identificacao legal da empresa para politicas finais.
- Colecoes reais no Admin com os handles usados pelo tema.
- Colecao de cross-sell para o bloco "Complete a matilha".
- Configuracao real de meios de pagamento, nota fiscal e eventos dos canais Shopify.

## Validacoes executadas

- `shopify.cmd theme check --path shopify-theme`
  - Resultado: 37 arquivos inspecionados, sem offenses.
- Validacao JSON com `ConvertFrom-Json` em todos os arquivos JSON do tema.
- Busca literal dos termos bloqueados no diretorio `shopify-theme`.
  - Resultado: sem ocorrencias.

## Como testar localmente

Com acesso Shopify valido:

```bash
cd "C:\Users\DELL\Desktop\jean IA\pattamansa"
shopify.cmd theme dev --path shopify-theme --store unmtvj-cr.myshopify.com
```

Validar no preview:

- Home em mobile e desktop.
- Navegacao para as quatro colecoes.
- Produto sem variante pre-selecionada indevida.
- Variantes indisponiveis visualmente desabilitadas.
- Botao de compra habilitando apenas quando houver combinacao real e disponivel.
- Carrinho mantendo produto, cor, modelo e tamanho.
- Checkout preservando o `variant_id` selecionado.
- Contato e newsletter com formulario nativo Shopify.
- Prova social oculta quando nao houver conteudo real.

## Publicacao segura

Nao publicar direto em producao.

Quando o acesso estiver resolvido:

```bash
shopify.cmd theme push --path shopify-theme --store unmtvj-cr.myshopify.com --unpublished
```

Depois, configurar conteudos no Theme Editor, testar fluxo completo em preview e publicar apenas apos validacao de variantes, carrinho, checkout, pagamentos e tracking.

## Riscos

- Sem acesso Shopify CLI, nao foi possivel comparar contra o tema publicado atual.
- Este tema e uma base nova; qualquer customizacao remota existente deve ser comparada antes de substituicao.
- O tema bloqueia fallback silencioso de variante, mas cadastros incorretos de produto no Admin ainda precisam ser corrigidos na origem.
- Politicas legais e dados fiscais precisam de revisao antes de trafego pago em escala.

## Proximos passos

- Conceder acesso staff/app ao login usado pelo CLI.
- Criar as paginas no Admin e atribuir templates.
- Criar as quatro colecoes reais e vincular produtos.
- Subir imagens e conteudo real no Theme Editor.
- Fazer pedido teste completo em preview.
- Validar Pixel/CAPI/GA4/Google Ads/TikTok pelos canais Shopify, evitando duplicidade manual.
