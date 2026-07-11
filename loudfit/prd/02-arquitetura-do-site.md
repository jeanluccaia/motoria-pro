# 02 — Arquitetura do site

**Última atualização:** 2026-07-11
**Responsável:** Time de desenvolvimento
**Status:** Consolidado (baseado em auditoria do repositório)

---

## Resumo

Documento técnico e funcional do site LoudFit atualmente publicado em `loudfit.vercel.app`. Consolida rotas, componentes, CTAs, formulários, integrações e APIs — separando o que **já existe**, o que está **incompleto**, o que está **planejado** e o que **não foi localizado**.

Fontes: `src/`, `next.config.ts`, `vercel.json`, `docs/PRD_LOUDFIT.md`, `AUDIT.md`, `CHANGELOG.md`, `VISUAL_DIRECTION.md`.

---

## Stack técnica (referência rápida)

- **Framework:** Next.js 16.2.9 (App Router).
- **React:** 19.2.4.
- **Tipagem:** TypeScript.
- **Estilos:** Tailwind CSS 4 + tokens CSS custom (`--lf-volt`, `--lf-black`, `--lf-graphite`, etc.).
- **Fontes:** Inter (body) + Big Shoulders (display) via `next/font/google`.
- **Formulários:** react-hook-form + zod + `@hookform/resolvers`.
- **Motion:** framer-motion.
- **Banco / persistência:** Supabase (`@supabase/supabase-js` + `@supabase/ssr`) com fallback local para unidades.
- **Deploy:** Vercel (`vercel.json`) com framework `nextjs`.

Detalhes em `10-requisitos-tecnicos.md`.

---

## Mapa de rotas

Rotas presentes em `src/app/`:

| Rota | Arquivo | Tipo | Função |
| ---- | ------- | ---- | ------ |
| `/` | `src/app/page.tsx` | Estática | Home comercial. |
| `/unidades` | `src/app/unidades/page.tsx` | Estática (server) | Lista as seis unidades. |
| `/unidades/[slug]` | `src/app/unidades/[slug]/page.tsx` | Dinâmica com `generateStaticParams` | Página individual da unidade. |
| `/matricula/[slug]` | `src/app/matricula/[slug]/page.tsx` | Dinâmica | Página de matrícula com iframe do checkout EVO. |
| `/modalidades` | `src/app/modalidades/page.tsx` | Estática | Aulas coletivas em destaque, grade, chamada para escolha de unidade. |
| `/franquias` | `src/app/franquias/page.tsx` | Server | Página institucional de franquia + formulário. |
| `/sobre` | `src/app/sobre/page.tsx` | Estática | Missão, visão, valores, história, fundadores. |
| `/carreiras` | `src/app/carreiras/page.tsx` | Estática | Página com "Vagas em breve" e CTA para envio de currículo. |
| `/contato` | `src/app/contato/page.tsx` | Estática | Três portas: aluno / franqueado / imprensa. |
| `/obrigado` | `src/app/obrigado/page.tsx` | Estática | Página pós-envio de formulário. `robots: noindex`. |
| `/politica-de-privacidade` | `src/app/politica-de-privacidade/page.tsx` | Estática | Placeholder de política. |
| `/api/franquia-leads` | `src/app/api/franquia-leads/route.ts` | API (POST) | Recebe o lead de franquia; envia para webhook externo ou fallback Supabase. |
| `/robots.txt` | `src/app/robots.ts` | Metadata | Robots gerado dinamicamente. |
| `/sitemap.xml` | `src/app/sitemap.ts` | Metadata | Sitemap gerado dinamicamente com as unidades. |
| `/opengraph-image` | `src/app/opengraph-image.tsx` | Dinâmica | Imagem OG gerada. |

Rotas legadas (redirect permanente em `next.config.ts`):

- `/unidades/carreco-curvalinhos` → `/unidades/carrefour-valinhos` (permanent).

Diretórios existentes **sem `page.tsx`** (planejados / não implementados):

- `src/app/rede/` — `NÃO LOCALIZADO NO REPOSITÓRIO` como página funcional (diretório vazio).
- `src/app/comunidade/` — `NÃO LOCALIZADO NO REPOSITÓRIO`.
- `src/app/carreiras/[slug]/` — diretório vazio (planejado como página de vaga individual).
- `src/app/carreiras/slug/` — pasta legada aparentemente sem uso.
- `src/app/unidades/slug/` — pasta legada aparentemente sem uso.

---

## Função de cada página

### Home `/`
- Ordem de seções (`src/app/page.tsx`):
  1. `Hero` — H1 "O melhor ainda está por vir.", selo R$9,90, CTAs "Encontrar minha unidade" + "Ver planos".
  2. `HomeUnitsGrid` — resumo das unidades (não polui a Home com todos os cards).
  3. `PlansSection` — tabela padrão com quatro planos.
  4. `CollectiveClassesSection` — "Um plano. Tudo incluso." com pills de aulas.
  5. `BrandVideo` — vídeo institucional (arquivo `/hero.mp4` provisório).
  6. `OfferBanner` — reforço do R$9,90.
  7. `ExpansionBanner` — chamada para franquias.
  8. `FinalCta` — CTA final e stats.
- Sobrepõe o botão flutuante `WhatsAppFloat`.
- **Decisão de arquitetura:** a Home **não** exibe todas as unidades em grade completa — usa apenas o resumo `HomeUnitsGrid` e o acesso completo fica em `/unidades`.

### `/unidades`
- Header "Nossa Rede / Unidades Loud Fit".
- Explica o funil (`1. Escolha a unidade | 2. Escolha o plano | 3. Finalize a matrícula online`).
- Grade `sm:grid-cols-2 lg:grid-cols-3` com `UnitCard` de cada unidade.

### `/unidades/[slug]`
- Hero com foto de capa, badge de status (`ativa` / `em_breve` / `em_obras`), CTA condicional (matrícula ou "Ver planos").
- Bloco de informações: **Endereço** (fundo claro), **Horário** (card escuro), **Estrutura**, **Card lateral de matrícula** com CTA para o checkout, WhatsApp da unidade, links de Maps e Instagram.
- Bloco de **Planos** — usa `getPlans(unit.slug)` (Ipiranga = tabela própria).
- Bloco de **Aulas coletivas** — filtra `unit.modalidades` contra um allowlist de aulas conhecidas.
- Bloco de **Galeria** se `unit.galeria` tiver imagens.
- Inclui script `application/ld+json` do tipo `HealthClub` (SEO local).

### `/matricula/[slug]`
- Barra escura de identidade + breadcrumb + progresso (`Unidade escolhida → Plano → Pagamento`).
- Card branco com nome da unidade, badge de status, benefício destacado (aulas coletivas inclusas), selos de confiança.
- Card com iframe `CheckoutFrame` apontando para o `checkoutUrl` da unidade, mais botão "Abrir checkout em nova aba".
- Link para WhatsApp da unidade e link "Voltar".
- Redireciona para `/unidades/[slug]` se a unidade não tiver `checkoutUrl`.

### `/modalidades`
- Hero "Tudo isso já está no seu plano", "16 modalidades inclusas na mensalidade".
- Grade de seis modalidades âncora (Muay Thai, Pilates, Spinning, FitDance, Funcional, Jump) com descrição.
- Pills com as demais aulas (Zumba, GAP, Pump, Yoga, Jiu-Jitsu, Ritbox, Loud Dance, Step, Crosstreino, Alongamento).
- Aviso "A grade pode variar por unidade".
- CTA para `/unidades`.

### `/franquias`
- Nove blocos: Hero, resumo do investimento, "Por que agora", "O que está no modelo", "Unidades reais", "Aceleração LoudFit", "Como funciona o processo", FAQ, formulário.
- Formulário `QualifyForm` (client component) usa `/api/franquia-leads`.
- WhatsApp de expansão apontando para `+55 19 98829-1946` (Vila Industrial).

### `/sobre`
- Hero + "Nossa história" (blocos) + significado do LOUD + Missão/Visão (fundo cream) + Valores + Pessoas (placeholders para fundadores) + CTA final.

### `/carreiras`
- Placeholder: "Vagas em breve" + CTA `mailto:contato@loudfit.com.br`.
- Estrutura para vagas individuais existe (`src/app/carreiras/[slug]/`) mas ainda sem `page.tsx`.

### `/contato`
- Três cards ("Aluno" → `/unidades`, "Franqueado" → `/franquias`, "Imprensa" → `mailto:contato@loudfit.com.br`).

### `/obrigado`
- Página pós-envio de formulário. `robots.index = false`. CTAs "Voltar ao início" e "Saber mais sobre franquias".

### `/politica-de-privacidade`
- Placeholder textual: "[Inserir texto de política de privacidade conforme a LGPD…]".

---

## Componentes principais

Localizados em `src/components/`:

### Layout (`src/components/layout/`)

- **`Header.tsx`** — Client component. Fixado no topo (`z-50`), com estado `scrolled` para mudar o fundo em >32px. Nav (Planos, Unidades, Modalidades, Franquias, Sobre), CTAs "Planos" e "Matricular". Menu mobile com animação `max-h`.
- **`Footer.tsx`** — Grid com marca, redes sociais (Instagram `@loudfit`, WhatsApp Vila Industrial), links por grupo, dados legais (CNPJ `45.519.405/0001-79`, e-mail `vilaindustrial@loudfit.com.br`, telefone `(19) 98829-1946`), copyright.

### Sections (`src/components/sections/`)

- `Hero.tsx` — hero da Home.
- `HomeUnitsGrid.tsx` — grade resumida de unidades para a Home.
- `PlansSection.tsx` — cards de planos padrão.
- `CollectiveClassesSection.tsx` — pills de aulas em fundo escuro.
- `BrandVideo.tsx` — bloco de vídeo institucional com fallback e botão de som.
- `OfferBanner.tsx` — reforço da oferta R$ 9,90.
- `ExpansionBanner.tsx` — chamada para franquias na Home.
- `FinalCta.tsx` — CTA final e stats.
- `ModalitiesTeaser.tsx` — teaser de modalidades (usado em página específica, não na Home).
- `QualifyForm.tsx` — formulário de franquia (client component).

### UI (`src/components/ui/`)

- `Button.tsx` — botão com variantes `volt` (amarelo), `outline`, `ghost`.
- `Section.tsx` / `SectionHeader` — wrapper padrão de seção.
- `PlanCard.tsx` — card de plano (variante `featured` para o Anual Recorrente).
- `PlanChip.tsx` / `PlanReminder.tsx` — reforços de plano.
- `UnitCard.tsx` — card de unidade (100% fotográfico, sem chips de modalidade).
- `WhatsAppFloat.tsx` — painel flutuante de WhatsApp com **duas seções**: "Atendimento" (seis unidades) e "Seja franqueado" (link para `/franquias#formulario`).
- `CheckoutFrame.tsx` — iframe do checkout EVO.
- `Badge.tsx` — `UnitBadge` para status.
- `Reveal.tsx` — animação de aparecer.
- `SignalMark.tsx` — traço decorativo (uso reduzido conforme decisão do `AUDIT.md`).
- `AnimatedNumber.tsx`, `StatCounter.tsx`, `StickyCta.tsx` — utilitários.

### Lib (`src/lib/`)

- `plans.ts` — tabela padrão e tabela Ipiranga (`getPlans(slug)`), `planBenefits`, `PLAN_NAMES`.
- `site.ts` — canonical `siteUrl` (fallback `https://loudfit.vercel.app`).
- `supabase.ts` — `getUnits`, `getUnitBySlug`, `getTestimonials`, `submitLeadFranquia`, `fallbackUnits` (fonte primária de dados quando não há Supabase).
- `utils.ts` — `cn`, `formatWhatsApp`, `shortUnitName`, `unitDisplayName`, `normalizeEvoCheckoutUrl`, `slugify`.

### Types (`src/types/index.ts`)

- `Unit`, `UnitStatus`, `Testimonial`, `LeadFranquia`, `Vaga`.

---

## CTAs

Padrão de CTA no site:

| Página | CTA principal | Destino |
| ------ | ------------- | ------- |
| Home Hero | Encontrar minha unidade | `/unidades` |
| Home Hero | Ver planos | `/#planos` |
| Home Planos | Matricular | Página da unidade / matrícula |
| Home Expansão | Quero ser franqueado | `/franquias#formulario` |
| Home CTA final | Ver planos + Matrícula | `/unidades` |
| Unidades | Ver detalhes | `/unidades/[slug]` |
| Unidade | Matricular online | `/matricula/[slug]` ou `#planos` se sem checkout |
| Unidade | Falar com a unidade | WhatsApp da unidade |
| Unidade | Ver no Maps / Instagram | Links externos |
| Franquias | Quero ser franqueado | `#formulario` |
| Franquias | Falar com equipe de expansão | WhatsApp Vila Industrial |
| Matrícula | Abrir checkout em nova aba | `checkoutUrl` da unidade |
| Modalidades | Começar matrícula | `/unidades` |
| Sobre | Encontrar unidade / Franquia | `/unidades` e `/franquias` |
| Header | Planos + Matricular | `/#planos` / `/unidades` |
| Footer | Redes sociais + Links | Externos e internos |
| WhatsAppFloat | Escolha da unidade | `wa.me/*` |

---

## Formulários

| Formulário | Arquivo | Campos | Destino |
| ---------- | ------- | ------ | ------- |
| Qualificação de franquia | `src/components/sections/QualifyForm.tsx` | nome, whatsapp, e-mail, cidade_interesse, capital_disponivel, ja_tem_ponto, prazo_investimento | `POST /api/franquia-leads` → webhook externo (`FRANCHISE_LEAD_WEBHOOK_URL`, se configurado) ou Supabase (`leads_franquia`) como fallback. Sucesso redireciona para `/obrigado`. Falha exibe WhatsApp e e-mail. |
| Envio de currículo | `src/app/carreiras/page.tsx` | — | `mailto:contato@loudfit.com.br` (link direto). |
| Contato geral | `src/app/contato/page.tsx` | — | Três CTAs direcionando para outras páginas / e-mail. |

Não há formulário público de matrícula na LoudFit — a matrícula acontece dentro do checkout EVO em iframe.

---

## Navegação e footer

**Menu principal (`Header.tsx`):**

- Planos (`/#planos`)
- Unidades (`/unidades`)
- Modalidades (`/modalidades`)
- Franquias (`/franquias`)
- Sobre (`/sobre`)

**Footer (`Footer.tsx`):**

- Coluna "Rede": Unidades, Modalidades, Planos.
- Coluna "Empresa": Sobre, Carreiras, Contato.
- Coluna "Franquias": Seja franqueado, Política de privacidade.
- Redes sociais: Instagram (`instagram.com/loudfit`), WhatsApp Vila Industrial.
- Dados legais: `LOUD FRANQUEADORA LTDA — CNPJ: 45.519.405/0001-79`, `vilaindustrial@loudfit.com.br`, `(19) 98829-1946`.

**WhatsAppFloat (`WhatsAppFloat.tsx`):**

- Fica visível após scroll de 60% da altura da tela (desktop sempre visível).
- Painel com duas seções: **Atendimento** (seis unidades) e **Seja franqueado**.

---

## Página de unidades e página individual

A Home tem uma seção resumida (`HomeUnitsGrid`). A página `/unidades` traz a grade completa. Cada unidade tem `/unidades/[slug]`. As unidades são renderizadas com `generateStaticParams`.

- Dados: `getUnitBySlug(slug)` combina Supabase (se configurado) com `fallbackUnits` e `officialUnitData` em `src/lib/supabase.ts`.
- `officialUnitData` sobrepõe **whatsapp_url, horários e checkoutUrl** por slug — é o ponto de verdade quando o Supabase estiver incompleto.
- Ipiranga usa `getPlans('ipiranga')` (tabela própria).

---

## Página Sobre

Já implementada em `src/app/sobre/page.tsx`. Tem placeholders para fundadores (LF em bloco amarelo). Vídeo institucional citado em `PENDENCIAS.md` deve substituir o `/hero.mp4` provisório e ser incorporado ao `BrandVideo.tsx`.

---

## Página de franquias

- Nove blocos, ver `05-franquias.md`.
- WhatsApp de expansão: `wa.me/5519988291946?text=Quero%20falar...`.

---

## Páginas legais

- `/politica-de-privacidade` — placeholder LGPD. **PENDENTE:** substituir por texto validado juridicamente.
- CNPJ e e-mail no footer (`LOUD FRANQUEADORA LTDA — 45.519.405/0001-79`, `vilaindustrial@loudfit.com.br`).
- Termos de uso: `NÃO LOCALIZADO NO REPOSITÓRIO`.

---

## APIs utilizadas

- `/api/franquia-leads` (POST) — validação com zod, envio via webhook (`FRANCHISE_LEAD_WEBHOOK_URL`) ou Supabase (`submitLeadFranquia`). Retorna JSON `{ ok: true, destination: 'webhook' | 'supabase' }` ou erro.

---

## Integrações externas

| Integração | Uso | Estado |
| ---------- | --- | ------ |
| **Supabase** | Banco opcional das unidades e leads. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. | Placeholders no `.env.local` (`https://[seu-projeto].supabase.co`). O site usa `fallbackUnits` quando o Supabase não está configurado. |
| **EVO (W12App)** | Checkout de matrícula. Um `checkoutUrl` por unidade (`evo-totem.w12app.com.br/loudfit/[id]/site/[hash]`). | Todos os seis presentes em `officialUnitData`. |
| **WhatsApp** | Atendimento por unidade + expansão. | Seis números por unidade + 1 número de expansão. |
| **Vercel** | Hospedagem. `loudfit.vercel.app`. | Projeto `loudfit` (`prj_TZpnQNLM7creL8ISW3EivNNOptPD`). |
| **Google Maps** | Links de rota. | Cada unidade tem campo `google_maps_url` (vazio nos dados atuais). |
| **Google Business Profile** | Ficha local por unidade. | Ver `07-google-business-profile.md`. |
| **Instagram** | Perfil `@loudfit` + perfil da Vila Industrial (`@loudfit.vilaindustrial`). | Perfis por unidade individual: `PENDENTE DE CONFIRMAÇÃO`. |
| **Pixel Meta / GA4 / GTM / API de Conversões** | Rastreamento. | `NÃO LOCALIZADO NO REPOSITÓRIO`. Ver `08-marketing-e-rastreamento.md`. |
| **FRANCHISE_LEAD_WEBHOOK_URL** | Webhook para leads de franquia. | `NÃO LOCALIZADO NO REPOSITÓRIO` como valor configurado. |

---

## Pontos de conversão

Do menor ao maior compromisso:

1. Clique em WhatsApp (atendimento ou expansão).
2. Escolha da unidade (`/unidades/[slug]`).
3. Entrada na página de matrícula (`/matricula/[slug]`).
4. Interação com o iframe EVO.
5. Preenchimento do formulário de franquia (redireciona para `/obrigado`).
6. E-mail de currículo (`mailto:`).

---

## Decisões atuais registradas no repositório

Estas decisões estão no repositório e devem ser respeitadas:

- **A Home não deve ficar poluída com todas as unidades** — usa `HomeUnitsGrid` (resumo) e o acesso pleno é `/unidades`. Documentado no `docs/PRD_LOUDFIT.md` seção 12.
- **A área de planos usa fundo claro** para criar respiro visual e não deixar o site excessivamente escuro. Ver `VISUAL_DIRECTION.md` e ordem das seções em `page.tsx`.
- **Evitar site excessivamente escuro** — alternar preto e claro/off-white.
- **Hero com mensagem clara e comercial** — "O melhor ainda está por vir." + selo R$ 9,90 + CTA "Encontrar minha unidade".
- **WhatsApp flutuante separa atendimento das unidades e interesse em franquia** — implementado em `WhatsAppFloat.tsx`.
- **Cards de plano sem ribbon rotacionado** (regra pós-`AUDIT.md`).
- **`SignalMark` reduzido** — apenas onde tem função real.
- **Uppercase forçada global removida** (regra pós-`AUDIT.md`).
- **CTA principal leva para escolha de unidade** — nunca para checkout direto.

---

## Páginas já existentes vs planejadas vs não localizadas

**Já existentes e publicadas:**

`/`, `/unidades`, `/unidades/[slug]`, `/matricula/[slug]`, `/modalidades`, `/franquias`, `/sobre`, `/carreiras`, `/contato`, `/obrigado`, `/politica-de-privacidade`.

**Existentes mas incompletas:**

- `/carreiras` — apenas placeholder "Vagas em breve".
- `/politica-de-privacidade` — apenas placeholder LGPD.
- `/matricula/[slug]` — funcional, mas depende do iframe EVO ficar responsivo em qualquer navegador (verificar em mobile).
- Página `/sobre` — sem fotos oficiais dos fundadores nem vídeo institucional final.

**Planejadas (previstas em `AGENTS.md` da marca) e ainda não implementadas:**

- `/resultados` — `NÃO LOCALIZADO NO REPOSITÓRIO`.
- `/comunidade` — diretório existe mas está vazio.
- `/blog` — `NÃO LOCALIZADO NO REPOSITÓRIO`.
- `/carreiras/[slug]` — diretório existe mas vazio.
- Landing unificada de `/day-use` — não existe. Ver `06-campanha-day-use.md`.

**Diretórios legados:**

- `src/app/rede/` — diretório vazio.
- `src/app/unidades/slug/` — pasta legada aparentemente sem uso.
- `src/app/carreiras/slug/` — pasta legada aparentemente sem uso.

---

## Próximas ações

- Fazer limpeza dos diretórios legados vazios (`rede/`, `unidades/slug/`, `carreiras/slug/`) após confirmação com o time.
- Preencher texto real em `/politica-de-privacidade`.
- Preencher `/carreiras` com uma estrutura mínima de vaga individual.
- Definir se `/comunidade`, `/resultados` e `/blog` entram no roadmap curto.
- Substituir `/hero.mp4` provisório por vídeo institucional final.
- Substituir fotos placeholder de fundadores em `/sobre`.
