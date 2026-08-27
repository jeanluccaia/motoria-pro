# Playwright e2e — mobile hardening

## Como rodar

```bash
# smoke sem dependência de banco (roda contra dev ou start)
npx playwright test tests/e2e/mobile-smoke.spec.ts --project=mobile-390 --project=desktop-1440

# suite completa mobile (4 viewports)
npm run test:e2e:mobile

# suite completa desktop (2 viewports)
npm run test:e2e:desktop
```

## Ambiente

Por padrão o config sobe `next dev` na porta 3000. Cold-compile do Next 16 é
lento; para acelerar rode `npm run build && PORT=3100 npm run start` em outra
aba e aponte:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3100 npx playwright test
```

## Autenticação admin

Os specs de Curadoria/Drawer/Touch targets fazem POST no
`/admin/growth/session` com a senha lida de `process.env.DGN_ADMIN_PASSWORD`
(carregada de `.env.local` pelo config). Se a senha não bater com a do server
que está respondendo (útil quando você tem env diferente do que o server
recebe), os specs autenticados `test.skip` — não quebram o pipeline.

Para rodar 100% dos specs localmente, garanta que a mesma senha esteja no
ambiente do server e no ambiente do Playwright.

## Dependências de dados

`/founders/[slug]` depende de `crm_founder_public_links` populado no
Supabase. Sem seed, timeout. Os specs de smoke usam apenas `/admin/growth/login`
que é puro client-side. Rotas dinâmicas do Founder devem ser validadas em
preview/prod com dados reais.
