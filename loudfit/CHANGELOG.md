# CHANGELOG — LoudFit Visual Elevation

> Data: 2026-07-03
> Missão: Elevar experiência visual sem quebrar nenhuma regra comercial, rota ou checkout.

---

## Regras comerciais — TODAS PRESERVADAS

- Preços intactos (R$149,90 / R$139,90 / R$129,90 / R$119,90 padrão; tabela Ipiranga própria)
- Nomes dos planos intactos
- R$9,90 apenas no Power Anual Recorrente
- Checkouts EVO intactos nas 6 unidades
- Rotas `/unidades/[slug]` e `/matricula/[slug]` intactas
- Ipiranga: status `em_breve` preservado
- Mogi Mirim: status `ativa` preservado
- Redirect `/unidades/carreco-curvalinhos` → `/unidades/carrefour-valinhos` intacto
- "O melhor ainda está por vir." preservado na Hero e no Footer

---

## Arquivos alterados

### `src/app/globals.css`
- **Remoção de `text-transform: uppercase` global dos h1–h4** — maior mudança de impacto.
  Todos os títulos passam de caixa alta forçada para sentence case/title case, eliminando
  o principal indicador visual de "site gerado por IA". Uppercase agora é aplicado
  somente via classe Tailwind onde é intencional (labels, badges, CTAs).
- Ajuste fino das superfícies escuras (`--lf-black`, `--lf-graphite`, `--lf-surface`, `--lf-line`)
  para mais profundidade e menos chapado.
- Ajuste de `--lf-muted` de `#A1A1A1` para `#909090` — mais contraste suave.
- `letter-spacing: -0.01em` e `line-height: 1.05` nos headings — tipografia mais editorial.
- Transição padrão reduzida de `0.6s` para `0.5s` — mais ágil.

### `src/components/ui/Button.tsx`
- `tracking-widest` → `tracking-[0.1em]` — botões menos gritados.
- Duração das transições: `300ms` → `200ms` — resposta mais rápida.
- Adição de `onClick` tipado como `() => void` para suporte em links.

### `src/components/ui/Section.tsx`
- `SectionHeader` não usa mais `SignalMark` — eliminado o padrão "ícone de sinal em toda seção".
- Label de seção agora usa `text-[11px] tracking-[0.18em]` em vez de `tracking-[0.2em]` — menos exagerado.
- `h2` de seção: `text-4xl md:text-5xl` (ajustado de md:text-6xl) + `leading-[1.02]`.
- Aceita prop `className` para controle de margem em layouts flexbox.

### `src/components/sections/Hero.tsx`
- **Removido o slash diagonal** (`right-[-10vw] -skew-x-12`) — elemento de template genérico.
- Gradiente de fundo refatorado: mais natural (escuro na base onde está o conteúdo, mais leve no topo).
- R$9,90 agora em `text-[2.8rem]` — forte mas não gritado, com label explicativo mais claro.
- Opacidade da imagem de fundo ajustada: desktop `0.60`, mobile `0.55` — mais imagem visível.
- Conteúdo ancorado no bottom da seção (`items-end` com `pb-16 md:pb-24`) — composição mais editorial.
- Removido o indicador "Role" com linha pulsante.
- Label "Rede de academias" com `tracking-[0.18em]` sem SignalMark — mais limpo.

### `src/components/sections/OfferBanner.tsx`
- Removida a borda top com gradiente amarelo (era repetitiva em múltiplas seções).
- R$9,90 em `text-[4.5rem]–[6rem]` (era até `6.6rem`) — mais preciso, menos gritado.
- Borda simples ao redor do banner (`border border-lf-line`).
- Overlay "Como funciona" simplificado — menos elementos competindo.
- Seção usa `bg="graphite"` em vez de `bg="black"` — mais variação entre seções dark.

### `src/components/ui/PlanCard.tsx`
- **Removido o ribbon rotacionado** ("melhor valor" diagonal no canto) — padrão SaaS antiquado.
- Faixa horizontal no topo do card destaque: `bg-lf-volt` com texto `MELHOR VALOR` + `Mais popular`.
- Card destaque (`featured=true`): visual mantido dark mas com hierarquia mais clara.
- Ícone de check vetorial substituiu os `h-1.5 w-1.5 rounded-full` — mais legível.
- Preço mais limpo: tamanho `text-4xl` sem excesso de espaços.
- Cards secundários: badge movida para faixa horizontal no topo (consistente com destaque).
- Transição: `300ms` → `200ms`.

### `src/components/sections/CollectiveClassesSection.tsx`
- Pills com `rounded-full` — mais premium, menos "lista de tags de blog".
- Hover: `bg-lf-volt text-lf-black` nos pills — feedback visual claro.
- Espaçamento: `gap-2.5 md:gap-3`.
- CTA: "Ver as aulas da minha unidade" → "Ver aulas por unidade" — mais curto e direto.
- Subtitle mais informativa: menciona que musculação e aulas estão na mesma mensalidade.

### `src/components/sections/BrandVideo.tsx`
- Removido container `border border-lf-line bg-lf-surface` do vídeo — era visual de iframe de dashboard.
- Vídeo agora tem `poster="/assets/images/real-machines.jpg"` para fallback.
- Botão de som com ícones SVG (speaker muted / speaker on) em vez de só texto.
- Botão reposicionado com `backdrop-blur-sm` e hover elegante.
- Layout: mais espaçamento vertical (`py-20 md:py-28`), `lg:gap-16`.

### `src/components/ui/UnitCard.tsx`
- **Card 100% fotográfico** — removida a área branca inferior com chips de modalidade.
- Conteúdo (cidade, nome do bairro, CTA) sobre a imagem com overlay gradiente.
- Hover do nome em amarelo (`group-hover:text-lf-volt`).
- Botão seta com transição: border branca → bg amarelo ao hover.
- Chips de modalidade removidos (eram muito pequenos e genéricos).
- Mais editorial, menos "listagem imobiliária".

### `src/components/sections/ModalitiesTeaser.tsx`
- Seção movida de `bg="lighter"` para `bg="black"` — cards escuros agora fazem sentido no contexto.
- Stagger forçado `index === 1 ? 'md:mt-10' : ''` removido — grid mais limpo.
- Linha amarela animada acima de cada título de modalidade (`h-px w-8 bg-lf-volt group-hover:w-12`).
- CTA "Ver modalidades" com variante `outline` (mais sutil em fundo escuro).
- Opacidade das imagens: `opacity-70` → `opacity-65` com `group-hover:opacity-80`.

### `src/components/sections/ExpansionBanner.tsx`
- Removida a borda top com gradiente amarelo repetitiva.
- Stats boxes refatorados: border-l removido, agora são células de uma grade com `border border-lf-line` e `bg-lf-graphite/80` — menos template, mais editorial.
- Grid de stats com separadores visuais em vez de bordas coladas.
- Imagem de fundo com `opacity-30` (era 0.35) — mais suave.

### `src/components/sections/FinalCta.tsx`
- StatCounter animado removido — substituído por valores simples e diretos.
- Segundo CTA "Ver planos" adicionado para mais opções de conversão.
- Stats em grade horizontal com separadores (`border border-lf-line`) — mais limpo que contadores animados.
- Seção tem `border-t border-lf-line` para separação visual do footer.
- Copy do subtítulo atualizado: "Matrícula online pelo checkout oficial EVO."

### `src/components/layout/Header.tsx`
- **Scroll-aware**: ao scrollar > 32px, header ganha `bg-lf-black border-b border-lf-line`.
  Antes do scroll: `bg-lf-black/80 backdrop-blur-md`.
- Nav links: `tracking-widest` → `tracking-[0.1em]` — menos exagerado.
- CTAs do header: "Ver planos" + "Matricular" (mais curto) em vez de "Começar matrícula".
- Menu mobile com animação `max-h` para transição suave (sem Framer Motion adicional).
- Logo: `148px` → `140px` — levemente mais compacto.

### `src/components/layout/Footer.tsx`
- Removido `mt-24` do footer — seções controlam seu próprio espaçamento inferior.

### `src/app/page.tsx`
- Seção de unidades: SectionHeader com `className="mb-0"` para evitar margem dupla no flex container.
- CTA "Ver todas as 6 unidades" → "Ver todas as unidades" (botão `variant="volt"` em vez de `outline`).
- Grid de cards: `gap-5` → `gap-4`.

### `src/app/unidades/[slug]/page.tsx`
- Cards de informação (Endereço, Horário, Estrutura): label de seção com tracking refinado.
- Card de matrícula: `border-l-4` substituído por `border-t-4` no topo — menos "dashboard", mais premium.
- Estrutura: badges `squared` → `rounded-full`.
- Links externos (Maps, Instagram): tracking mais suave e sem uppercase.
- Aulas coletivas: chips com `rounded-full border border-gray-300`.

---

## Verificações de QA

| Item | Status |
|---|---|
| Build sem erro | ✅ |
| TypeScript sem erro | ✅ |
| Preços intactos | ✅ |
| Planos intactos | ✅ |
| Checkouts EVO intactos | ✅ |
| 6 unidades intactas | ✅ |
| Ipiranga como inauguração | ✅ |
| Mogi Mirim como operação | ✅ |
| R$9,90 apenas no Power Anual Recorrente | ✅ |
| Rotas /unidades/* funcionando | ✅ |
| Rotas /matricula/* funcionando | ✅ |
| "O melhor ainda está por vir." preservado | ✅ |
| "LoudFit LoudFit" ausente | ✅ |
| Frases internas antigas ausentes | ✅ |
| Sem gradientes roxo/azul | ✅ |
| Sem glassmorphism genérico | ✅ |
| Sem emojis em headlines | ✅ |
| Sem depoimentos inventados | ✅ |
| Sem números inventados | ✅ |
| Redirect /unidades/carreco-curvalinhos intacto | ✅ |
