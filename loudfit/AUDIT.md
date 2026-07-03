# AUDIT.md — LoudFit Visual Audit

> Diagnóstico realizado em 2026-07-03 antes de qualquer alteração de código.
> Site atual: https://loudfit.vercel.app/

---

## 1. globals.css — Tipografia global

**Problema visual atual:**
`text-transform: uppercase` aplicado globalmente a todos os `h1, h2, h3, h4`.
Resultado: 100% dos títulos do site aparecem em caixa alta automática.
Isso é a principal causa do site parecer "gerado por IA/template" — todo título importante,
independente de tamanho ou contexto, vira uppercase automático.

**O que será melhorado:**
Remover `text-transform: uppercase` do reset global de headings.
Cada elemento usará uppercase apenas via classe Tailwind onde fizer sentido (labels, badges, nav).
Títulos principais passarão a usar sentence case ou title case conforme o design exige.

**Risco técnico:** Baixo. Os textos em código já têm capitalização correta.
Nenhum texto depende do CSS para "capitalizar" — só estávamos forçando caixa alta desnecessariamente.

**Arquivos:** `src/app/globals.css`

---

## 2. Hero

**Problema visual atual:**
- O slash diagonal amarelo (`right-[-10vw]`, `-skew-x-12`, `bg-lf-volt/[0.035]`) parece elemento de template genérico.
- O label "Rede de academias" com `tracking-[0.24em]` é exageradamente espaçado.
- O bloco R$9,90 é funcional mas parece encaixado sem refinamento.
- Mobile: a imagem de fundo com 75% de opacidade pode comprometer legibilidade.
- O indicador "Role" com linha pulsante é decorativo sem necessidade.

**O que será melhorado:**
- Remover o slash diagonal.
- Refinamento do espaçamento e tracking nos labels.
- R$9,90 com apresentação mais limpa e precisa.
- Melhor respiro vertical.
- Gradiente de fundo mais suave — manter imagem visível mas legível.

**Risco técnico:** Baixo. Apenas elementos visuais, sem lógica de negócio.

**Arquivos:** `src/components/sections/Hero.tsx`

---

## 3. OfferBanner (R$9,90)

**Problema visual atual:**
- O `R$9,90` em `text-[6.6rem]` / `text-[5.6rem]` está exagerado — "gritado demais".
- O bloco de informação no canto inferior direito da imagem tem um visual de tooltip/overlay genérico.
- A borda top com gradiente amarelo é um padrão que aparece em 4 seções diferentes — perde impacto.

**O que será melhorado:**
- Reduzir o tamanho do R$9,90 para algo mais preciso e elegante.
- Remover a borda top repetitiva (será mantida apenas onde tem mais impacto).
- Simplificar o overlay de "Como funciona" — menos elementos competindo.

**Risco técnico:** Baixo. Nenhuma regra comercial alterada.

**Arquivos:** `src/components/sections/OfferBanner.tsx`

---

## 4. PlansSection / PlanCard

**Problema visual atual:**
- O card destaque (Power Anual Recorrente) usa um badge ribbon rotacionado no canto superior direito — padrão visual de template SaaS dos anos 2010.
- `bg-lf-black` no card destaque dentro de uma seção clara (`bg-[#F6F6F4]`) cria contraste extremo que parece mais erro visual do que hierarquia intencional.
- O card em si parece competir com os outros em vez de claramente se destacar.
- Os planos secundários em branco são funcionais mas genéricos.
- Todos os cards têm `min-h-[500px]` mas o conteúdo não preenche bem esse espaço.

**O que será melhorado:**
- Remover o ribbon rotacionado.
- Redesenhar o card destaque: manter dark mas com hierarquia mais refinada.
- Adicionar marcador "MAIS POPULAR" como tag/chip horizontal simples no topo.
- Melhor escala visual entre o preço principal e o preço promocional R$9,90.
- Planos secundários com hover mais sutil e elegante.

**Risco técnico:** Baixo. Nenhum preço ou nome de plano alterado.

**Arquivos:** `src/components/ui/PlanCard.tsx`, `src/components/sections/PlansSection.tsx`

---

## 5. CollectiveClassesSection

**Problema visual atual:**
- Os chips são elementos `<span>` simples com `border border-gray-200 bg-white` — parece lista de tags de um blog.
- Sem espaçamento entre grupos, todos os chips competem visualmente em peso igual.
- O botão CTA "Ver as aulas da minha unidade" é muito longo e parece copy automático.

**O que será melhorado:**
- Transformar chips em pills com `rounded-full` — mais premium.
- Melhor espaçamento e hierarquia.
- CTA mais direto.
- Label de seção refinada.

**Risco técnico:** Baixo. Lista de aulas preservada 100%.

**Arquivos:** `src/components/sections/CollectiveClassesSection.tsx`

---

## 6. BrandVideo

**Problema visual atual:**
- O container do vídeo usa `border border-lf-line bg-lf-surface` — parece um iframe de dashboard.
- A grid texto + vídeo é funcional mas o vídeo parece secundário ao texto.
- O botão de som `Ativar som` / `Silenciar` parece botão de debug.
- O vídeo usa `/hero.mp4` — arquivo não auditado. Se o vídeo for fraco, a seção perde impacto.

**O que será melhorado:**
- Remover a borda/box do container do vídeo.
- Vídeo mais proeminente — talvez layout invertido ou full-bleed.
- Botão de som mais elegante (ícone + texto, posicionado melhor).
- Overlay com gradient mais sofisticado.

**Risco técnico:** Baixo. Lógica de mute/unmute preservada.

**Recomendação adicional:** Verificar qualidade do `/hero.mp4`.
Se o vídeo for de baixa qualidade ou não representar bem a academia, recomenda-se substituir.
Sinalizado com `[RECOMENDADO: substituir vídeo por material melhor da unidade]`.

**Arquivos:** `src/components/sections/BrandVideo.tsx`

---

## 7. Seção de Unidades (Home)

**Problema visual atual:**
- `UnitCard` mistura dark (imagem com overlay escuro) e light (fundo branco na parte inferior) — cria sensação de card partido.
- Os chips de modalidades no card (`rounded-full border border-gray-200 bg-gray-100`) são muito pequenos e parecem tags de produto SaaS.
- O botão de seta `→` em um quadrado é muito básico.
- O card não transmite "vou treinar aqui" — parece card de listagem de imóveis.

**O que será melhorado:**
- Cards totalmente fotográficos com overlay — sem a área branca inferior.
- Nome da unidade, cidade e CTA direto sobre a imagem.
- Hover mais expressivo.
- Grid 3 colunas no desktop com mais espaço.

**Risco técnico:** Baixo. Dados e links preservados.

**Arquivos:** `src/components/ui/UnitCard.tsx`

---

## 8. ModalitiesTeaser

**Problema visual atual:**
- Seção com `bg="lighter"` (fundo claro warm gray) e cards com `bg-lf-black` — o contraste extremo entre o fundo claro e os cards escuros cria sensação de descuido.
- O stagger `index === 1 ? 'md:mt-10' : ''` cria um grid quebrado que parece erro em vez de escolha intencional.
- As imagens com `opacity-70` ficam muito pesadas.

**O que será melhorado:**
- Mover para seção dark (`bg="black"`) para que os cards escuros façam sentido.
- Remover o stagger forçado.
- Melhor tratamento das imagens.

**Risco técnico:** Baixo. Apenas visual.

**Arquivos:** `src/components/sections/ModalitiesTeaser.tsx`

---

## 9. ExpansionBanner (Franquias)

**Problema visual atual:**
- Os 3 blocos de stats (`border-l-2 border-lf-volt bg-lf-black/60 p-5`) são o padrão "stat com linha esquerda amarela" que aparece em múltiplas seções — overuse.
- A seção no geral é funcional mas pode ter mais refinamento visual.

**O que será melhorado:**
- Refinamento dos stats boxes — menos template.
- Melhor hierarquia tipográfica.

**Risco técnico:** Baixo.

**Arquivos:** `src/components/sections/ExpansionBanner.tsx`

---

## 10. FinalCta

**Problema visual atual:**
- O StatCounter com "R$ 9,90" como contagem animada parece estranho (não é uma contagem de clientes ou unidades — é um preço).
- A seção é funcional mas pode ser mais persuasiva.

**O que será melhorado:**
- Remover o stat de preço ou reformatar.
- Seção mais limpa e direta.

**Risco técnico:** Baixo.

**Arquivos:** `src/components/sections/FinalCta.tsx`

---

## 11. Header

**Problema visual atual:**
- Nav com `tracking-widest text-lf-muted uppercase` — muito agressivo nos links.
- Sem comportamento de scroll (o header sempre aparece com `bg-lf-black/90`) — perda de oportunidade de transição elegante.
- O menu mobile abre abruptamente sem transição.

**O que será melhorado:**
- Reduzir tracking nos links de nav.
- Adicionar scroll-aware behavior: ao scrollar, header ganha mais solidez e borda mais visível.
- Menu mobile com transição suave.

**Risco técnico:** Baixo. Já é client component.

**Arquivos:** `src/components/layout/Header.tsx`

---

## 12. Footer

**Problema visual atual:**
- `mt-24` no footer cria espaço fora do controle das seções — pode criar gap duplo.
- Funcional e limpo, mas pode ter mais presença.

**O que será melhorado:**
- Remover `mt-24` do footer (seções devem controlar seu próprio espaçamento inferior).
- Layout geral é bom.

**Risco técnico:** Mínimo.

**Arquivos:** `src/components/layout/Footer.tsx`

---

## 13. Página de Unidade (/unidades/[slug])

**Problema visual atual:**
- A área branca de informações (Endereço, Horário, Estrutura) usa cards com `border border-gray-200 bg-white` que parece dashboard de app.
- Os badges de modalidades no bloco "Estrutura" são muito genéricos.
- O hero da unidade é funcional.

**O que será melhorado:**
- Cards de informação com mais presença visual.
- Melhor hierarquia tipográfica.
- CTA mais claro para matrícula.

**Risco técnico:** Baixo. Dados preservados.

**Arquivos:** `src/app/unidades/[slug]/page.tsx`

---

## 14. Página de Matrícula (/matricula/[slug])

**Problema visual atual:**
- Funcional e limpa — é a melhor página do site atualmente.
- Pequeno ajuste: o breadcrumb de topo pode ser mais elegante.
- Os cards brancos estão bem.

**O que será melhorado:**
- Refinamentos mínimos de polish visual.
- Preservar toda a lógica de checkout EVO.

**Risco técnico:** Mínimo.

**Arquivos:** `src/app/matricula/[slug]/page.tsx`

---

## 15. SectionHeader / Section (componentes globais)

**Problema visual atual:**
- `SignalMark` aparece em TODAS as seções (Hero, OfferBanner, SectionHeader de todas as seções, FinalCta).
- Quando um elemento decorativo aparece em todo lugar, perde o impacto e vira ruído.
- `tracking-[0.2em]` nos labels de seção é exagerado.

**O que será melhorado:**
- Reduzir uso do SignalMark — manter apenas onde tem função real.
- Labels de seção com `tracking-[0.14em]` mais refinado.
- No SectionHeader, a linha separadora entre label e título pode ser substituída por um traço tipográfico.

**Risco técnico:** Baixo.

**Arquivos:** `src/components/ui/Section.tsx`, `src/components/ui/SignalMark.tsx`

---

## Resumo de Riscos

| Componente | Risco | Impacto Visual |
|---|---|---|
| globals.css — uppercase | Baixo | Alto |
| Hero — slash diagonal | Baixo | Médio |
| PlanCard — ribbon | Baixo | Alto |
| CollectiveClasses — pills | Baixo | Médio |
| UnitCard — layout | Baixo | Alto |
| ModalitiesTeaser — bg | Baixo | Médio |
| Header — tracking | Baixo | Médio |
| Button — tracking | Baixo | Médio |

---

## Verificações de Conteúdo (pré-implementação)

- [x] "LoudFit LoudFit" — NÃO encontrado no código
- [x] "Venda online via EVO será conectada" — NÃO encontrado
- [x] "Matrícula online em breve via página de vendas EVO" — NÃO encontrado
- [x] Slug `/unidades/carrefour-valinhos` — PRESENTE e correto
- [x] Redirect `/unidades/carreco-curvalinhos` → `/unidades/carrefour-valinhos` — PRESENTE em next.config.ts
- [x] Ipiranga como `em_breve` — CORRETO
- [x] Mogi Mirim como `ativa` — CORRETO
- [x] R$9,90 apenas no Power Anual Recorrente — CORRETO
- [x] Checkouts EVO nas 6 unidades — TODOS PRESENTES no fallbackUnits
- [x] "O melhor ainda está por vir." — PRESENTE na Hero e no Footer
