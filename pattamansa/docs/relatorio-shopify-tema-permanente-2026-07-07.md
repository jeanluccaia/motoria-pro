# Relatorio Shopify - tema permanente PattaMansa

Data: 2026-07-07

## Diagnostico inicial

- O Shopify CLI esta instalado: `shopify.cmd version` retornou `4.3.0`.
- O comando `shopify` direto no PowerShell falha por politica local de execucao de `.ps1`; usar `shopify.cmd` neste Windows.
- A pasta `pattamansa/` nao tinha estrutura de tema Shopify antes deste trabalho. Nao havia `layout/theme.liquid`, `sections/*.liquid`, `templates/*.json` ou `config/settings_schema.json`.
- O projeto atual era uma landing page estatica com deploy Vercel e checkout criado via Storefront API em `api/checkout.js`.
- A loja identificada no codigo existente e `unmtvj-cr.myshopify.com`.
- `shopify.cmd theme list --store unmtvj-cr.myshopify.com` falhou porque o login local nao tem acesso a esta loja. Por isso nao foi possivel listar, duplicar, baixar, publicar ou validar tema remoto.
- O trabalho foi isolado na branch local `pattamansa-shopify-mainstore`.

## Arquivos/areas afetados

- Criado novo tema Shopify OS 2.0 em `shopify-theme/`.
- Criado este relatorio em `docs/relatorio-shopify-tema-permanente-2026-07-07.md`.
- A landing page `index.html`, as APIs Vercel e o tema publicado da Shopify nao foram alterados.

## O que foi implementado

- Home permanente mobile-first com hero premium, colecoes, diferenciais, modelos, bloco emocional, prova social, FAQ e CTA final.
- Estrutura visual para colecoes: Novidades, Mais vendidos, Camisetas para tutores, Oversized, Baby Look, Cropped, Linha Caramelo e Presentes para quem ama cachorro.
- Template de produto com galeria, preco, seletores claros de variantes, guia de medidas, composicao, envio, trocas/devolucoes, qualidade Reserva INK e CTA de compra.
- JS de variantes sem fallback silencioso: o botao so habilita quando modelo/cor/tamanho formam uma variante real e disponivel.
- Template de carrinho preservando produto, variantes e opcoes selecionadas antes do checkout nativo Shopify.
- Templates de colecao, pagina institucional e 404.
- Templates institucionais atribuiveis para Sobre, Contato, Trocas e devolucoes, Frete e prazos.
- Sem pixels manuais no tema novo; a recomendacao e manter Meta, GA4, Google Ads e TikTok por canais/pixels Shopify para evitar duplicidade.

## Validacoes executadas

- `shopify.cmd theme check --path shopify-theme`
  - Resultado: `32 files inspected with no offenses found`.
- Validacao JSON via PowerShell `ConvertFrom-Json` em todos os JSONs do tema.
- Busca por referencias sazonais no tema:
  - `rg -n "Copa|Selecao|Seleção|futebol|Cartpanda|sob demanda" shopify-theme`
  - Resultado: sem ocorrencias.

## Como testar localmente

Com acesso Shopify valido:

```bash
cd "C:\Users\DELL\Desktop\jean IA\pattamansa"
shopify.cmd theme dev --path shopify-theme --store unmtvj-cr.myshopify.com
```

No preview, validar:

- Home mobile e desktop.
- Links das colecoes.
- Pagina de produto com todas as opcoes sem variante pre-selecionada indevida.
- Adicionar ao carrinho apenas apos selecionar variante valida.
- Carrinho exibindo modelo, cor e tamanho corretos.
- Checkout preservando exatamente o `variant_id` escolhido.
- Pix/cartao no checkout, se meios estiverem configurados na loja.
- Eventos via Shopify Customer Events/Sales Channels, sem duplicidade manual.

## Como publicar com seguranca

1. Conceder acesso staff/app ao login usado pelo Shopify CLI na loja `unmtvj-cr.myshopify.com`.
2. Listar temas:

```bash
shopify.cmd theme list --store unmtvj-cr.myshopify.com
```

3. Criar ou usar tema unpublished para desenvolvimento. Nao publicar direto.
4. Enviar o tema como unpublished:

```bash
shopify.cmd theme push --path shopify-theme --store unmtvj-cr.myshopify.com --unpublished
```

5. No Theme Editor, configurar imagens da home, menus, colecoes e paginas.
6. Testar fluxo completo em preview.
7. Publicar apenas apos validacao de variantes, carrinho, checkout, pagamentos e pixels.

## Pendencias

- Acesso Shopify para listar temas, duplicar tema publicado, criar tema unpublished e fazer deploy.
- Criar/ajustar colecoes reais no Admin com os handles usados pelo tema.
- Vincular produtos reais as colecoes e revisar nomes/opcoes de variantes.
- Subir/configurar imagens de home e colecoes no Theme Editor.
- Criar paginas institucionais reais no Admin e atribuir os templates correspondentes.
- Revisar textos juridicos finais de privacidade, termos, frete e trocas.
- Validar pixels e canais de venda dentro do Admin Shopify.
- Rodar teste real de checkout com Pix/cartao.

## Riscos encontrados

- O CLI local nao tem acesso a loja, entao qualquer publicacao agora seria insegura ou impossivel.
- Como nao houve pull do tema atual, este tema e uma base nova. Se a loja publicada tiver customizacoes importantes, elas precisam ser comparadas antes de substituir qualquer tema.
- As politicas de privacidade e termos normalmente vivem em `Settings > Policies`; o tema apenas aponta para essas URLs.
- A correcao do bug oversized/cropped depende dos produtos terem variantes corretas no Admin. O tema impede fallback visual/formulario, mas nao corrige cadastro incorreto de variante na Shopify.
