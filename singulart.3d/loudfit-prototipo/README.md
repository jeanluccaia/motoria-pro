# LoudFit - conceito digital

Protótipo navegável para apresentar a LoudFit como uma rede em crescimento, com operação própria, identidade forte e expansão em movimento.

## Como abrir

Abra no navegador:

- `index.html` para a Home
- `franquias/index.html` para a página de franquias
- `unidades/index.html` para o localizador da rede
- `modalidades/index.html`, `sobre/index.html` e `contato/index.html` como rotas secundárias

O projeto é estático e não precisa de build.

## Onde editar conteúdo

- Textos gerais e dados institucionais: `content/site.js`
- Unidades, slugs, canais, imagens e status: `content/units.js`
- Layout e estilos: `assets/css/styles.css`
- Interações, menu, cards, formulário e números automáticos: `assets/js/app.js`

## Identidade visual

Use apenas os arquivos oficiais de marca em `assets/images/`:

- `loudfit-logo-official-lockup-yellow.png` para header, footer, hero de franquias e aplicações institucionais em fundo escuro.
- `loudfit-logo-official-symbol-yellow.png` para favicon e touch icon.
- `loudfit-logo-instagram.jpg` como fonte pública original do avatar oficial.

Não recrie o logotipo em texto, SVG ou CSS. Não aplique o logotipo dentro de retângulo amarelo no header. Ajustes devem preservar proporção, respiro e contraste do asset oficial.

## Status das unidades

Use os status abaixo em `content/units.js`:

- `em_operacao`
- `em_inauguracao`

A interface calcula automaticamente:

- total de unidades próprias
- unidades em operação
- unidade em implantação
- destaque visual da unidade em implantação

## Imagens

As imagens ficam em `assets/images/`. A base visual prioriza fotografias públicas reais da LoudFit, com fotografia real premium apenas como fallback conceitual:

- `loudfit-real-facade.jpg`
- `loudfit-real-machines.jpg`
- `loudfit-real-studio.jpg`
- `loudfit-real-weights.jpg`
- `real-opening.jpg`

Prioridade final: substituir ou expandir por fotografias oficiais aprovadas da LoudFit quando houver material interno disponível.

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
