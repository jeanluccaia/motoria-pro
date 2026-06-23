# LoudFit - prototipo da casa digital oficial

Protótipo navegável para apresentar a visão digital da LoudFit como rede de academias em expansão.

## Como abrir

Abra no navegador:

- `index.html` para a Home
- `franquias/index.html` para a página de franquias
- `unidades/index.html` para a página de unidades

O projeto é estático e não precisa de build.

## Onde editar conteúdo

- Textos gerais e dados institucionais: `content/site.js`
- Unidades, slugs, canais e dados editáveis: `content/units.js`
- Layout e estilos: `assets/css/styles.css`
- Interações, menu, cards, FAQ e formulário: `assets/js/app.js`

## Onde trocar imagens

As imagens ficam em `assets/images/`:

- `hero-gym.png`
- `community-training.png`
- `franchise-floor.png`

Para substituir, mantenha os mesmos nomes de arquivo ou ajuste os caminhos em `content/units.js` e nos HTMLs.

## Formulário de franquia

O formulário mostra uma confirmação local no protótipo. Para conectar depois, use o bloco em `assets/js/app.js`, função `setupForm()`.

## Rotas

- `/`
- `/franquias/`
- `/unidades/`

Em hospedagem estática, mantenha a estrutura de pastas para preservar essas rotas.

## Observações

Campos com `[preencher]` devem ser completados pela LoudFit antes de publicação final. Nenhum número financeiro foi inventado no protótipo.
