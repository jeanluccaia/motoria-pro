# LoudFit - concept car digital

Protótipo navegável para apresentar a visão da LoudFit como rede em crescimento: 5 unidades próprias em operação e 1 unidade própria em inauguração.

## Como abrir

Abra no navegador:

- `index.html` para a Home
- `franquias/index.html` para a página de franquias
- `unidades/index.html` para o localizador da rede
- `modalidades/index.html`, `sobre/index.html` e `contato/index.html` como rotas secundárias leves

O projeto é estático e não precisa de build.

## Onde editar conteúdo

- Textos gerais e dados institucionais: `content/site.js`
- Unidades, slugs, canais, imagens e status: `content/units.js`
- Layout e estilos: `assets/css/styles.css`
- Interações, menu, cards, FAQ, formulário e números automáticos: `assets/js/app.js`

## Status das unidades

Use os status abaixo em `content/units.js`:

- `em_operacao`
- `em_inauguracao`

A interface calcula automaticamente:

- total de unidades próprias
- unidades em operação
- unidade em inauguração
- destaque visual do card em inauguração

## Onde trocar imagens

As imagens ficam em `assets/images/`. A base visual prioriza fotografias públicas reais da LoudFit, com fotografia real premium apenas como fallback quando não houver imagem específica da marca:

- `loudfit-real-facade.jpg`
- `loudfit-real-machines.jpg`
- `loudfit-real-studio.jpg`
- `loudfit-real-weights.jpg`
- `real-opening.jpg`

Prioridade final: substituir/expandir por fotografias oficiais aprovadas da LoudFit quando houver material interno disponível. Para substituir, mantenha os mesmos nomes de arquivo ou ajuste os caminhos em `content/units.js` e nos HTMLs.

## Formulário de franquia

O formulário mostra uma confirmação local no protótipo. Para conectar depois, use a função `setupForm()` em `assets/js/app.js`.

## Rotas

- `/`
- `/franquias/`
- `/unidades/`
- `/modalidades/`
- `/sobre/`
- `/contato/`

Em hospedagem estática, mantenha a estrutura de pastas para preservar essas rotas.

## Observações

Informações ainda não validadas devem permanecer vazias ou ser resolvidas pela composição visual. Nenhum número financeiro foi inventado no protótipo.
