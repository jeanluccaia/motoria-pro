# 10 — Requisitos técnicos

**Última atualização:** 2026-07-11
**Responsável:** Time de desenvolvimento
**Status:** Consolidado

---

## Resumo

Especificação técnica do projeto LoudFit no repositório atual: framework, deploy, variáveis de ambiente, APIs, SEO, performance, breakpoints e checklist visual. Serve de base para novos desenvolvedores e para revisão em cada release.

---

## Framework e versões

- **Framework:** Next.js **16.2.9** (App Router).
- **React:** 19.2.4.
- **TypeScript:** 5.x.
- **Tailwind CSS:** 4 (via `@tailwindcss/postcss`).
- **Node.js runtime na Vercel:** Node.js 24 LTS (default atual da plataforma; ver `AGENTS.md` para observação sobre "este não é o Next.js que você conhece").
- **ESLint:** 9 + `eslint-config-next` 16.2.9.

O arquivo `AGENTS.md` reforça que a versão atual do Next.js pode ter breaking changes em relação ao histórico de referência, então **antes de mudar rotas, layout, cache ou APIs** deve-se consultar `node_modules/next/dist/docs/`.

---

## Estrutura de pastas

```
loudfit/
├── AGENTS.md                # Instrução: consultar docs do Next atual antes de codar
├── CLAUDE.md                # Aponta para AGENTS.md
├── AUDIT.md                 # Auditoria visual pré-elevation
├── CHANGELOG.md             # Registro das alterações visuais
├── PENDENCIAS.md            # Lista de pendências operacionais
├── VISUAL_DIRECTION.md      # Direção visual (esporte + tecnologia)
├── README.md                # Boilerplate padrão Next
├── docs/
│   ├── PRD_LOUDFIT.md
│   └── google-business-profile/
│       ├── google-business-profile-audit.md
│       ├── google-business-profile-audit.csv
│       └── supabase-unit-data-sync.md
├── prd/                     # Nova documentação oficial (este PRD)
├── public/
│   ├── assets/images/       # Imagens da marca
│   ├── hero.mp4             # Vídeo hero provisório
│   ├── og-loudfit-logo-v3.jpg
│   └── favicon.ico
├── scripts/
│   ├── export-loudfit-pdf.mjs
│   └── gen-og-image.mjs
├── src/
│   ├── app/                 # App Router
│   │   ├── api/franquia-leads/route.ts
│   │   ├── unidades/ (page + [slug])
│   │   ├── matricula/[slug]/page.tsx
│   │   ├── franquias/page.tsx
│   │   ├── sobre/page.tsx
│   │   ├── modalidades/page.tsx
│   │   ├── carreiras/page.tsx (+ [slug] vazio)
│   │   ├── contato/page.tsx
│   │   ├── obrigado/page.tsx
│   │   ├── politica-de-privacidade/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── opengraph-image.tsx
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── layout/          # Header, Footer
│   │   ├── sections/        # Hero, HomeUnitsGrid, PlansSection, etc.
│   │   └── ui/              # Button, PlanCard, UnitCard, WhatsAppFloat, etc.
│   ├── lib/                 # plans, site, supabase, utils
│   └── types/index.ts       # Unit, Testimonial, LeadFranquia, Vaga
├── next.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
├── tsconfig.json
├── package.json
├── vercel.json
└── .env.local (não commitado)
```

Diretórios vazios legados: `src/app/comunidade/`, `src/app/rede/`, `src/app/unidades/slug/`, `src/app/carreiras/[slug]/`, `src/app/carreiras/slug/` — ver `02-arquitetura-do-site.md`.

---

## Rotas

Ver `02-arquitetura-do-site.md` para a lista completa. Rotas de metadata:

- `/robots.txt` (via `src/app/robots.ts`).
- `/sitemap.xml` (via `src/app/sitemap.ts`).
- `/opengraph-image` (via `src/app/opengraph-image.tsx`).

Redirects (`next.config.ts`):

- `/unidades/carreco-curvalinhos` → `/unidades/carrefour-valinhos` (permanente).

---

## Deploy e hospedagem

- **Plataforma:** Vercel.
- **Framework detectado:** `nextjs`.
- **Build:** `npm run build` (equivale a `next build`).
- **Install:** `npm ci`.
- **Output:** `.next`.
- **Projeto Vercel:** `loudfit` (`prj_TZpnQNLM7creL8ISW3EivNNOptPD`).
- **Org:** `jeanlucca-3426s-projects`.
- **URL de produção atual:** `https://loudfit.vercel.app`.
- **CLI:** Vercel CLI **não instalada** no ambiente atual (session hook). Recomendado instalar globalmente (`npm i -g vercel`) para uso agentivo (env pull, deploy, logs).

Existe também um projeto complementar `loudfit-prototipo` (`prj_bh5cgegIG50j9aizN3OQKo6pSrEK`) para o HTML estático em `loudfit-prototipo/`. Não faz parte do escopo deste PRD.

---

## Domínio

- Domínio de produção **atual:** `loudfit.vercel.app`.
- Domínio oficial **planejado:** `loudfit.com.br`. `PENDENTE DE CONFIRMAÇÃO` — apontamento e ativação. Ver `PENDENCIAS.md`.
- Enquanto o domínio oficial não está ativo, `siteUrl` (`src/lib/site.ts`) resolve para `https://loudfit.vercel.app`.

---

## Variáveis de ambiente

Todas configuradas via Vercel Env / `.env.local`.

| Variável | Descrição | Estado |
| -------- | --------- | ------ |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase. | Placeholder (`https://[seu-projeto].supabase.co`) no `.env.local`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key pública. | Placeholder no `.env.local`. |
| `NEXT_PUBLIC_SITE_URL` | URL base pública (fallback). | `https://loudfit.vercel.app` no `.env.local`. |
| `NEXT_PUBLIC_CANONICAL_URL` | Canonical opcional (prioritária sobre `NEXT_PUBLIC_SITE_URL`). | `NÃO LOCALIZADO` como setada. |
| `FRANCHISE_LEAD_WEBHOOK_URL` | Webhook externo para leads de franquia. | `NÃO LOCALIZADO` como setada — API cai no fallback Supabase. |

Recomendações:

- Nunca commitar `.env.local`. Já está no `.gitignore`.
- Para uso em produção, definir as três `NEXT_PUBLIC_*` no painel da Vercel.
- Se o webhook for definido, testar o endpoint antes de virar canal oficial de leads.

---

## Formulários

Detalhes em `02-arquitetura-do-site.md` e `05-franquias.md`. Regras técnicas relevantes:

- Formulários client-side com `react-hook-form` + `zod`.
- Validação server-side duplicada em `route.ts`.
- Sucesso → `router.push('/obrigado')`.
- Falha → exibe mensagem + fallback com WhatsApp e e-mail.

---

## APIs internas

- `POST /api/franquia-leads` — validação com zod, envio para webhook ou Supabase, resposta JSON.

Rate limiting ou proteção anti-bot: **não implementado**. Recomendação futura: usar Vercel BotID ou honeypot no formulário se houver spam.

---

## SEO

- Metadata por página (`export const metadata`).
- Home:
  - `title`: "Loud Fit | Academia com musculação e aulas inclusas"
  - `description`: "Escolha sua unidade, veja os planos e faça sua matrícula online. Musculação e aulas coletivas em um só plano."
  - OG image: `/og-loudfit-logo-v3.jpg`.
- Templates: `%s | LoudFit`.
- Alt/canonical: `alternates.canonical = '/'` na Home; cada página tem seu canonical relativo.
- Robots (`src/app/robots.ts`): permite indexação total, aponta para `sitemap.xml`.
- Sitemap dinâmico (`src/app/sitemap.ts`): lista estáticas + `/unidades/[slug]` + `/matricula/[slug]` para cada unidade com checkout.
- `/obrigado` marcado com `robots: { index: false }`.
- JSON-LD `HealthClub` na página da unidade (`src/app/unidades/[slug]/page.tsx`).

Pendências SEO:

- Substituir OG images placeholder por versões locais (`campaign-gym-16x9.png` é usado em unidades e matrícula).
- Publicar `sitemap.xml` no domínio final quando `loudfit.com.br` estiver ativo.

---

## Performance

- Fontes `Inter` e `Big Shoulders` via `next/font/google` — self-hosted no build (bom para LCP).
- Imagens usam `next/image` com `sizes` corretos na maioria das seções.
- Hero e páginas críticas usam `priority` para carregar mais rápido.
- Vídeo hero (`/hero.mp4`) tem 3 MB — atenção ao LCP em mobile. Recomendar substituição por versão otimizada.
- Não há bundle analyzer configurado.
- Não há testes automatizados.

Recomendações:

- Rodar Lighthouse e Core Web Vitals antes de release.
- Comprimir hero.mp4 quando substituir.
- Avaliar `next/dynamic` para o iframe do EVO se ele estiver pesando a página `/matricula/[slug]` em mobile.

---

## Responsividade

Breakpoints padrão (Tailwind + custom):

| Breakpoint | Uso |
| ---------- | --- |
| Desktop grande | 1440 px de referência. |
| Desktop | Container `max-w-[1360px]` na maior parte das seções. |
| Tablet | 768 px. |
| Mobile | 390 px (referência iPhone 12/13/14/15). |
| Mobile pequeno | 360 px (Android budget). |

Regras de teste:

- Testar em pelo menos: 1440, 1280, 1024, 768, 414, 390, 360.
- Testar Chrome, Safari (iOS), Firefox.
- Nunca deixar overflow horizontal em nenhuma seção.

---

## Acessibilidade

- Cores base contrastam adequadamente (branco sobre preto).
- Botões e links têm `aria-label` quando não têm texto (`WhatsAppFloat`, ícones do footer).
- Menu mobile alterna estado com `aria-label`.
- Vídeos: falta `<track>` de legendas (planejar).
- Foco de teclado: `focus:outline-none focus:border-lf-volt` nos inputs.
- Botão `Reveal` usa animação, mas o conteúdo é renderizado por padrão para leitores de tela.

Melhorias planejadas:

- Adicionar `aria-current` no menu.
- Testar navegação por teclado.
- Rodar auditoria de acessibilidade (Axe) por página.

---

## Segurança

- Rotas de matrícula usam iframe → apontam apenas para `evo-totem.w12app.com.br` (URL confiável).
- `normalizeEvoCheckoutUrl` valida `https:` e preserva tokens EVO.
- API `/api/franquia-leads` valida payload com zod e trata erros de JSON parsing.
- Recursos externos: `<a target="_blank" rel="noopener noreferrer">` em todos os links externos (WhatsApp, Instagram, Maps).
- CSP: **não configurada**. Recomendável definir uma futura.

---

## Privacidade

- `/politica-de-privacidade` — placeholder LGPD (a substituir por texto validado juridicamente).
- Formulário de franquia coleta e-mail, WhatsApp, cidade e informações de investimento; texto atual sinaliza uso restrito ao contato do time.
- Sem banner de consentimento LGPD hoje.

---

## Logs

- Console.log utilizado apenas em desenvolvimento.
- API interna não loga dados sensíveis do lead.
- Logs de produção acessíveis via Vercel Logs / `vercel logs` (CLI a instalar).

---

## Tratamento de erros

- `getUnits().catch(() => [])` — nunca quebra o site se o Supabase falhar.
- `getUnitBySlug` retorna `null` quando não encontra; a página chama `notFound()`.
- `/api/franquia-leads`:
  - 400 se JSON inválido.
  - 400 se schema falhar.
  - 502 se webhook recusar ou falhar.
  - 503 se fallback Supabase falhar (mensagem "Envio automático não configurado").
- `QualifyForm` captura `Error` e mostra fallback com WhatsApp + e-mail.

---

## Integrações externas (resumo)

Detalhe em `02-arquitetura-do-site.md`. Aqui os pontos técnicos:

- **Supabase** — `@supabase/supabase-js` + `@supabase/ssr`. Fallback local completo se não estiver configurado.
- **EVO (W12App)** — apenas URL de iframe/link, sem SDK.
- **WhatsApp** — links `wa.me/`.
- **Instagram** — link direto para perfis.
- **Vercel** — hospedagem + build + logs.
- **Google Business Profile** — externo, sem SDK direto.

---

## Checklist visual (validação mínima antes de publicar)

- [ ] Sem overflow horizontal em nenhuma resolução.
- [ ] Menu funcional (desktop e mobile).
- [ ] Textos legíveis em todos os breakpoints.
- [ ] CTAs sem quebra de linha estranha.
- [ ] Vídeos e imagens carregando (com fallback quando aplicável).
- [ ] Carregamento adequado (Lighthouse ≥ 80 em mobile, ≥ 90 em desktop — sugestão).
- [ ] Zero erro relevante no console.
- [ ] Links de WhatsApp corretos por unidade.
- [ ] Checkout correto por unidade (`officialUnitData`).
- [ ] Contraste adequado (WCAG AA no mínimo).
- [ ] Área de preços com leitura clara.
- [ ] Navegação por teclado nas áreas críticas (menu, formulário, CTAs de matrícula).
- [ ] OG image aparece corretamente no WhatsApp, LinkedIn, Twitter/X.
- [ ] `robots.txt` e `sitemap.xml` acessíveis.
- [ ] Redirect `/unidades/carreco-curvalinhos` funcionando.

---

## Scripts de build e teste

- `npm run dev` — Next dev server.
- `npm run build` — build de produção.
- `npm start` — servidor de produção local.
- `npm run lint` — ESLint.
- `npm run export:loudfit-pdf` — exporta um PDF via script customizado (`scripts/export-loudfit-pdf.mjs`).
- Não há suíte de testes (`npm test` não existe).

---

## Recomendações futuras

- Instalar **Vercel CLI** globalmente para dev/deploy.
- Adicionar **Playwright** ou **Vitest** para testes essenciais.
- Adicionar `README` de setup para novos devs (hoje o `README.md` é boilerplate padrão).
- Documentar variáveis de ambiente em um `.env.example` versionado.
- Definir política de branches e revisão de PRs.

---

## Próximas ações

- Confirmar apontamento do domínio `loudfit.com.br`.
- Configurar `FRANCHISE_LEAD_WEBHOOK_URL` para produção (ou aceitar Supabase como destino oficial).
- Ativar rastreamento (ver `08-marketing-e-rastreamento.md`).
- Substituir `.env.local` placeholder por `.env.example` versionado.
- Rodar Lighthouse em todas as páginas críticas e registrar métricas base.
